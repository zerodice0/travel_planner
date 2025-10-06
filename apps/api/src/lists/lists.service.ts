import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListQueryDto } from './dto/list-query.dto';
import { ListResponseDto, ListsResponseDto } from './dto/list-response.dto';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ListDetailResponseDto } from './dto/list-detail-response.dto';
import { AddPlacesDto } from './dto/add-places.dto';
import { ReorderPlacesDto } from './dto/reorder-places.dto';
import { OptimizeRouteDto } from './dto/optimize-route.dto';

interface Location {
  latitude: number;
  longitude: number;
}

interface PlaceWithDistance {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
  distance: number;
}

@Injectable()
export class ListsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: ListQueryDto,
  ): Promise<ListsResponseDto> {
    const lists = await this.prisma.list.findMany({
      where: { userId },
      take: query.limit,
      orderBy: { [query.sort as string]: 'desc' },
      include: {
        placeLists: {
          include: {
            place: {
              select: {
                visited: true,
              },
            },
          },
        },
      },
    });

    const listResponses: ListResponseDto[] = lists.map((list) => ({
      id: list.id,
      name: list.name,
      description: list.description,
      iconType: list.iconType,
      iconValue: list.iconValue,
      colorTheme: list.colorTheme,
      placesCount: list.placeLists.length,
      visitedCount: list.placeLists.filter((pl) => pl.place.visited).length,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    }));

    return { lists: listResponses };
  }

  async findOne(
    userId: string,
    listId: string,
  ): Promise<ListDetailResponseDto> {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, userId },
      include: {
        placeLists: {
          include: {
            place: {
              select: {
                visited: true,
              },
            },
          },
        },
      },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    return {
      id: list.id,
      name: list.name,
      description: list.description ?? undefined,
      iconType: list.iconType,
      iconValue: list.iconValue,
      colorTheme: list.colorTheme ?? undefined,
      placesCount: list.placeLists.length,
      visitedCount: list.placeLists.filter((pl) => pl.place.visited).length,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    };
  }

  async create(
    userId: string,
    createListDto: CreateListDto,
  ): Promise<ListDetailResponseDto> {
    const list = await this.prisma.list.create({
      data: {
        userId,
        name: createListDto.name,
        description: createListDto.description,
        iconType: createListDto.icon.type,
        iconValue: createListDto.icon.value,
        colorTheme: createListDto.colorTheme,
        placeLists: {
          create: [],
        },
      },
    });

    return {
      id: list.id,
      name: list.name,
      description: list.description ?? undefined,
      iconType: list.iconType,
      iconValue: list.iconValue,
      colorTheme: list.colorTheme ?? undefined,
      placesCount: 0,
      visitedCount: 0,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    };
  }

  async update(
    userId: string,
    listId: string,
    updateListDto: UpdateListDto,
  ): Promise<ListDetailResponseDto> {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    const updateData: any = {};
    if (updateListDto.name) updateData.name = updateListDto.name;
    if (updateListDto.description !== undefined)
      updateData.description = updateListDto.description;
    if (updateListDto.icon) {
      updateData.iconType = updateListDto.icon.type;
      updateData.iconValue = updateListDto.icon.value;
    }
    if (updateListDto.colorTheme !== undefined)
      updateData.colorTheme = updateListDto.colorTheme;

    await this.prisma.list.update({
      where: { id: listId },
      data: updateData,
    });

    return this.findOne(userId, listId);
  }

  async delete(userId: string, listId: string): Promise<void> {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    await this.prisma.list.delete({
      where: { id: listId },
    });
  }

  async getPlaces(userId: string, listId: string, sort: string = 'order') {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, userId },
      include: {
        placeLists: {
          include: {
            place: true,
          },
          orderBy: {
            [sort]: sort === 'order' ? 'asc' : 'desc',
          },
        },
      },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    return {
      places: list.placeLists.map((pl) => ({
        id: pl.place.id,
        name: pl.place.name,
        address: pl.place.address,
        category: pl.place.category,
        visited: pl.place.visited,
        latitude: Number(pl.place.latitude),
        longitude: Number(pl.place.longitude),
        order: pl.order,
      })),
    };
  }

  async addPlaces(
    userId: string,
    listId: string,
    addPlacesDto: AddPlacesDto,
  ) {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    const maxOrder = await this.prisma.placeList.findFirst({
      where: { listId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const startOrder = (maxOrder?.order || -1) + 1;

    await this.prisma.placeList.createMany({
      data: addPlacesDto.placeIds.map((placeId, index) => ({
        placeId,
        listId,
        order: startOrder + index,
      })),
      skipDuplicates: true,
    });

    return { added: addPlacesDto.placeIds.length };
  }

  async removePlace(
    userId: string,
    listId: string,
    placeId: string,
  ): Promise<void> {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    await this.prisma.placeList.deleteMany({
      where: { listId, placeId },
    });
  }

  async reorderPlaces(
    userId: string,
    listId: string,
    reorderDto: ReorderPlacesDto,
  ) {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    for (const item of reorderDto.order) {
      await this.prisma.placeList.updateMany({
        where: {
          listId,
          placeId: item.placeId,
        },
        data: {
          order: item.order,
        },
      });
    }

    return { updated: reorderDto.order.length };
  }

  async optimizeRoute(
    userId: string,
    listId: string,
    optimizeDto: OptimizeRouteDto,
  ) {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, userId },
      include: {
        placeLists: {
          include: {
            place: true,
          },
        },
      },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    let places = list.placeLists
      .filter((pl) => optimizeDto.includeVisited || !pl.place.visited)
      .map((pl) => ({
        id: pl.place.id,
        name: pl.place.name,
        latitude: Number(pl.place.latitude),
        longitude: Number(pl.place.longitude),
      }));

    const optimizedRoute = this.calculateOptimalRoute(
      places,
      optimizeDto.startLocation,
    );

    return {
      optimizedOrder: optimizedRoute.map((place, index) => ({
        placeId: place.id,
        order: index,
        distance: place.distance,
      })),
      totalDistance: optimizedRoute.reduce(
        (sum, place) => sum + place.distance,
        0,
      ),
      estimatedTime: Math.ceil(
        (optimizedRoute.reduce((sum, place) => sum + place.distance, 0) /
          1000) *
          12,
      ),
    };
  }

  private calculateOptimalRoute(
    places: { id: string; name: string; latitude: number; longitude: number }[],
    startLocation: Location,
  ): PlaceWithDistance[] {
    const unvisited = [...places];
    const route: PlaceWithDistance[] = [];
    let currentLocation = startLocation;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(
        currentLocation,
        unvisited[0],
      );

      for (let i = 1; i < unvisited.length; i++) {
        const distance = this.calculateDistance(currentLocation, unvisited[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest = unvisited.splice(nearestIndex, 1)[0];
      route.push({
        ...nearest,
        order: route.length,
        distance: nearestDistance,
      });

      currentLocation = {
        latitude: nearest.latitude,
        longitude: nearest.longitude,
      };
    }

    return route;
  }

  private calculateDistance(
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number },
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (a.latitude * Math.PI) / 180;
    const φ2 = (b.latitude * Math.PI) / 180;
    const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180;
    const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;

    const x =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

    return R * c;
  }
}
