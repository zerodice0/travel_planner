import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { ActivityDto, ActivityType } from './dto/activity.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string): Promise<DashboardStatsDto> {
    const [totalPlaces, visitedPlaces, totalLists] = await Promise.all([
      this.prisma.userPlace.count({ where: { userId } }),
      this.prisma.userPlace.count({ where: { userId, visited: true } }),
      this.prisma.list.count({ where: { userId } }),
    ]);

    const visitedPercentage =
      totalPlaces > 0 ? Math.round((visitedPlaces / totalPlaces) * 100) : 0;

    return {
      totalPlaces,
      visitedPlaces,
      visitedPercentage,
      totalLists,
    };
  }

  async getRecentActivities(userId: string, limit = 10): Promise<ActivityDto[]> {
    // 1. 최근 추가한 장소 (UserPlace.createdAt)
    const recentPlaces = await this.prisma.userPlace.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        place: true,
      },
    });

    // 2. 최근 수정한 장소 (UserPlace.updatedAt != createdAt)
    const updatedPlaces = await this.prisma.userPlace.findMany({
      where: {
        userId,
        NOT: {
          updatedAt: {
            equals: this.prisma.userPlace.fields.createdAt,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        place: true,
      },
    });

    // 3. 최근 방문 완료한 장소 (UserPlace.visitedAt)
    const visitedPlaces = await this.prisma.userPlace.findMany({
      where: {
        userId,
        visited: true,
        visitedAt: { not: null },
      },
      orderBy: { visitedAt: 'desc' },
      take: limit,
      include: {
        place: true,
      },
    });

    // 4. 최근 리스트에 추가한 장소 (PlaceList.addedAt)
    const placeLists = await this.prisma.placeList.findMany({
      where: {
        userPlace: { userId },
      },
      orderBy: { addedAt: 'desc' },
      take: limit,
      include: {
        list: true,
        userPlace: {
          include: {
            place: true,
          },
        },
      },
    });

    // 5. 최근 생성한 리스트 (List.createdAt)
    const newLists = await this.prisma.list.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // 6. 최근 수정한 리스트 (List.updatedAt != createdAt)
    const updatedLists = await this.prisma.list.findMany({
      where: {
        userId,
        NOT: {
          updatedAt: {
            equals: this.prisma.list.fields.createdAt,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    // 7. 모든 활동을 하나의 배열로 병합
    const activities: Array<{
      type: ActivityType;
      timestamp: Date;
      place?: { id: string; name: string; address: string; category: string; latitude: number; longitude: number; };
      list?: { id: string; name: string; iconType: string; iconValue: string; colorTheme: string | null; };
      metadata?: { listId?: string; placeName?: string; visited?: boolean; };
    }> = [];

    // place_added 활동 추가
    recentPlaces.forEach((userPlace) => {
      activities.push({
        type: 'place_added',
        timestamp: userPlace.createdAt,
        place: {
          id: userPlace.place.id,
          name: userPlace.place.name,
          address: userPlace.place.address,
          category: userPlace.place.category,
          latitude: Number(userPlace.place.latitude),
          longitude: Number(userPlace.place.longitude),
        },
      });
    });

    // place_updated 활동 추가
    updatedPlaces.forEach((userPlace) => {
      activities.push({
        type: 'place_updated',
        timestamp: userPlace.updatedAt,
        place: {
          id: userPlace.place.id,
          name: userPlace.place.name,
          address: userPlace.place.address,
          category: userPlace.place.category,
          latitude: Number(userPlace.place.latitude),
          longitude: Number(userPlace.place.longitude),
        },
      });
    });

    // place_visited 활동 추가
    visitedPlaces.forEach((userPlace) => {
      activities.push({
        type: 'place_visited',
        timestamp: userPlace.visitedAt!,
        place: {
          id: userPlace.place.id,
          name: userPlace.place.name,
          address: userPlace.place.address,
          category: userPlace.place.category,
          latitude: Number(userPlace.place.latitude),
          longitude: Number(userPlace.place.longitude),
        },
        metadata: {
          visited: true,
        },
      });
    });

    // place_added_to_list 활동 추가
    placeLists.forEach((placeList) => {
      activities.push({
        type: 'place_added_to_list',
        timestamp: placeList.addedAt,
        place: {
          id: placeList.userPlace.place.id,
          name: placeList.userPlace.place.name,
          address: placeList.userPlace.place.address,
          category: placeList.userPlace.place.category,
          latitude: Number(placeList.userPlace.place.latitude),
          longitude: Number(placeList.userPlace.place.longitude),
        },
        list: {
          id: placeList.list.id,
          name: placeList.list.name,
          iconType: placeList.list.iconType,
          iconValue: placeList.list.iconValue,
          colorTheme: placeList.list.colorTheme,
        },
      });
    });

    // list_created 활동 추가
    newLists.forEach((list) => {
      activities.push({
        type: 'list_created',
        timestamp: list.createdAt,
        list: {
          id: list.id,
          name: list.name,
          iconType: list.iconType,
          iconValue: list.iconValue,
          colorTheme: list.colorTheme,
        },
      });
    });

    // list_updated 활동 추가
    updatedLists.forEach((list) => {
      activities.push({
        type: 'list_updated',
        timestamp: list.updatedAt,
        list: {
          id: list.id,
          name: list.name,
          iconType: list.iconType,
          iconValue: list.iconValue,
          colorTheme: list.colorTheme,
        },
      });
    });

    // 8. 타임스탬프 기준으로 정렬하고 limit만큼만 반환
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    // 9. ActivityDto 형식으로 변환 (id 추가)
    return sortedActivities.map((activity, index) => ({
      id: `${activity.type}-${activity.timestamp.getTime()}-${index}`,
      type: activity.type,
      timestamp: activity.timestamp,
      place: activity.place,
      list: activity.list,
      metadata: activity.metadata,
    }));
  }
}
