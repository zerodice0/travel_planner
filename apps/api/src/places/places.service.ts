import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlaceQueryDto, ViewportQueryDto } from './dto/place-query.dto';
import { PlaceResponseDto, PlacesResponseDto } from './dto/place-response.dto';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { PlaceDetailResponseDto } from './dto/place-detail-response.dto';
import {
  PublicPlaceResponseDto,
  PublicPlaceDetailResponseDto,
  PublicPlacesResponseDto,
  LabelCount,
} from './dto/public-place-response.dto';

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: PlaceQueryDto,
  ): Promise<PlacesResponseDto> {
    const userPlaces = await this.prisma.userPlace.findMany({
      where: { userId },
      take: query.limit,
      orderBy: { [query.sort as string]: 'desc' },
      select: {
        id: true,
        visited: true,
        createdAt: true,
        place: {
          select: {
            id: true,
            name: true,
            category: true,
            address: true,
            phone: true,
            latitude: true,
            longitude: true,
            externalUrl: true,
            externalId: true,
          },
        },
      },
    });

    const placeResponses: PlaceResponseDto[] = userPlaces.map((userPlace) => ({
      id: userPlace.id,
      name: userPlace.place.name,
      category: userPlace.place.category,
      address: userPlace.place.address,
      phone: userPlace.place.phone ?? undefined,
      latitude: Number(userPlace.place.latitude),
      longitude: Number(userPlace.place.longitude),
      visited: userPlace.visited,
      externalUrl: userPlace.place.externalUrl ?? undefined,
      externalId: userPlace.place.externalId ?? undefined,
      createdAt: userPlace.createdAt,
    }));

    return { places: placeResponses };
  }

  async findOne(
    userId: string,
    userPlaceId: string,
  ): Promise<PlaceDetailResponseDto> {
    const userPlace = await this.prisma.userPlace.findFirst({
      where: { id: userPlaceId, userId },
      include: {
        place: true,
      },
    });

    if (!userPlace) {
      throw new NotFoundException('Place not found');
    }

    return {
      id: userPlace.id,
      name: userPlace.place.name,
      address: userPlace.place.address,
      phone: userPlace.place.phone,
      latitude: Number(userPlace.place.latitude),
      longitude: Number(userPlace.place.longitude),
      category: userPlace.place.category,
      customName: userPlace.customName,
      customCategory: userPlace.customCategory,
      labels: userPlace.labels,
      note: userPlace.note,
      visited: userPlace.visited,
      visitedAt: userPlace.visitedAt,
      visitNote: userPlace.visitNote,
      rating: userPlace.rating,
      estimatedCost: userPlace.estimatedCost,
      photos: userPlace.photos,
      externalUrl: userPlace.place.externalUrl,
      externalId: userPlace.place.externalId,
      createdAt: userPlace.createdAt,
      updatedAt: userPlace.updatedAt,
    };
  }

  async create(
    userId: string,
    createPlaceDto: CreatePlaceDto,
  ): Promise<PlaceDetailResponseDto> {
    try {
      // 1. Check if place already exists (by externalId if provided)
      let place;
      if (createPlaceDto.externalId) {
        place = await this.prisma.place.findUnique({
          where: { externalId: createPlaceDto.externalId },
        });
      }

      // 2. Create place if it doesn't exist
      if (!place) {
        place = await this.prisma.place.create({
          data: {
            name: createPlaceDto.name,
            address: createPlaceDto.address,
            phone: createPlaceDto.phone,
            latitude: createPlaceDto.latitude,
            longitude: createPlaceDto.longitude,
            category: createPlaceDto.category,
            externalUrl: createPlaceDto.externalUrl,
            externalId: createPlaceDto.externalId,
          },
        });
      }

      // 3. Create UserPlace
      const userPlace = await this.prisma.userPlace.create({
        data: {
          userId,
          placeId: place.id,
          customName: createPlaceDto.customName,
          customCategory: createPlaceDto.customCategory,
          labels: createPlaceDto.labels || [],
          note: createPlaceDto.note,
          visited: createPlaceDto.visited || false,
          photos: [],
        },
      });

      return this.findOne(userId, userPlace.id);
    } catch (error) {
      // Prisma error handling
      const prismaError = error as any;

      if (prismaError.code === 'P2002') {
        throw new Error(
          'You have already added this place to your collection.',
        );
      }

      if (prismaError.code === 'P2003') {
        throw new Error('Invalid reference. Foreign key constraint failed.');
      }

      if (prismaError.code === 'P2000') {
        throw new Error(
          'Value too long for column. Please check your data length.',
        );
      }

      // Decimal conversion error
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Invalid') && errorMessage.includes('Decimal')) {
        throw new Error(
          'Invalid latitude or longitude value. Please provide valid coordinates.',
        );
      }

      // Other errors
      console.error('Place creation error:', error);
      throw error;
    }
  }

  async update(
    userId: string,
    userPlaceId: string,
    updatePlaceDto: UpdatePlaceDto,
  ): Promise<PlaceDetailResponseDto> {
    const userPlace = await this.prisma.userPlace.findFirst({
      where: { id: userPlaceId, userId },
    });

    if (!userPlace) {
      throw new NotFoundException('Place not found');
    }

    // UserPlace에 속하는 필드만 추출
    // Place 필드(name, address, phone, latitude, longitude, category)는 제외
    const {
      category,
      name,
      address,
      phone,
      latitude,
      longitude,
      ...userPlaceFields
    } = updatePlaceDto;

    // category를 customCategory로 매핑
    const updateData = {
      ...userPlaceFields,
      ...(category !== undefined && { customCategory: category }),
    };

    await this.prisma.userPlace.update({
      where: { id: userPlaceId },
      data: updateData,
    });

    return this.findOne(userId, userPlaceId);
  }

  async delete(userId: string, userPlaceId: string): Promise<void> {
    const userPlace = await this.prisma.userPlace.findFirst({
      where: { id: userPlaceId, userId },
    });

    if (!userPlace) {
      throw new NotFoundException('Place not found');
    }

    await this.prisma.userPlace.delete({
      where: { id: userPlaceId },
    });
  }

  async findLists(userId: string, userPlaceId: string) {
    const userPlace = await this.prisma.userPlace.findFirst({
      where: { id: userPlaceId, userId },
      include: {
        placeLists: {
          include: {
            list: true,
          },
        },
      },
    });

    if (!userPlace) {
      throw new NotFoundException('Place not found');
    }

    return {
      lists: userPlace.placeLists.map((pl) => ({
        id: pl.list.id,
        name: pl.list.name,
        iconType: pl.list.iconType,
        iconValue: pl.list.iconValue,
      })),
    };
  }

  async addToList(
    userId: string,
    userPlaceId: string,
    listId: string,
  ): Promise<void> {
    const userPlace = await this.prisma.userPlace.findFirst({
      where: { id: userPlaceId, userId },
    });

    if (!userPlace) {
      throw new NotFoundException('Place not found');
    }

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

    await this.prisma.placeList.create({
      data: {
        userPlaceId,
        listId,
        order: (maxOrder?.order || -1) + 1,
      },
    });
  }

  async removeFromList(
    userId: string,
    userPlaceId: string,
    listId: string,
  ): Promise<void> {
    const userPlace = await this.prisma.userPlace.findFirst({
      where: { id: userPlaceId, userId },
    });

    if (!userPlace) {
      throw new NotFoundException('Place not found');
    }

    await this.prisma.placeList.deleteMany({
      where: { userPlaceId, listId },
    });
  }

  // Public methods (no authentication required)

  // Viewport-based place query
  async findByViewport(query: ViewportQueryDto): Promise<PublicPlacesResponseDto> {
    const { neLat, neLng, swLat, swLng, category } = query;

    const where = {
      latitude: { gte: swLat, lte: neLat },
      longitude: { gte: swLng, lte: neLng },
      ...(category && { category }),
    };

    const places = await this.prisma.place.findMany({
      where,
      take: 200, // viewport 내 최대 200개
      include: {
        userPlaces: {
          select: {
            labels: true,
            photos: true,
            reviews: {
              where: { isPublic: true },
              select: { id: true }, // 리뷰 수만 카운트
            },
          },
        },
      },
    });

    const placeResponses: PublicPlaceResponseDto[] = places.map((place) => {
      // 리뷰 수 계산 (평점 제거)
      const reviewCount = place.userPlaces.reduce(
        (sum, up) => sum + up.reviews.length,
        0
      );

      // 커스텀 라벨 집계 (빈도수 계산)
      const labelCounts = new Map<string, number>();
      place.userPlaces.forEach((up) => {
        up.labels.forEach((label) => {
          labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
        });
      });

      // 상위 10개 라벨만 선택
      const topLabels: LabelCount[] = Array.from(labelCounts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // 모든 사진 수집
      const allPhotos = place.userPlaces.flatMap((up) => up.photos);

      return {
        id: place.id,
        name: place.name,
        category: place.category,
        address: place.address,
        phone: place.phone,
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        photos: allPhotos,
        reviewCount,
        topLabels,
        createdAt: place.createdAt,
      };
    });

    return { places: placeResponses, total: placeResponses.length };
  }

  async findAllPublic(query: PlaceQueryDto): Promise<PublicPlacesResponseDto> {
    const where = query.category ? { category: query.category } : {};

    const [places, total] = await Promise.all([
      this.prisma.place.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
        include: {
          userPlaces: {
            select: {
              labels: true,
              photos: true,
              reviews: {
                where: { isPublic: true },
                select: { id: true }, // 리뷰 수만 카운트
              },
            },
          },
        },
      }),
      this.prisma.place.count({ where }),
    ]);

    const placeResponses: PublicPlaceResponseDto[] = places.map((place) => {
      // 리뷰 수 계산 (평점 제거)
      const reviewCount = place.userPlaces.reduce(
        (sum, up) => sum + up.reviews.length,
        0
      );

      // 커스텀 라벨 집계 (빈도수 계산)
      const labelCounts = new Map<string, number>();
      place.userPlaces.forEach((up) => {
        up.labels.forEach((label) => {
          labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
        });
      });

      // 상위 10개 라벨만 선택
      const topLabels: LabelCount[] = Array.from(labelCounts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // 모든 사진 수집
      const allPhotos = place.userPlaces.flatMap((up) => up.photos);

      return {
        id: place.id,
        name: place.name,
        category: place.category,
        address: place.address,
        phone: place.phone,
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        photos: allPhotos,
        reviewCount,
        topLabels,
        createdAt: place.createdAt,
      };
    });

    return { places: placeResponses, total };
  }

  async findOnePublic(placeId: string): Promise<PublicPlaceDetailResponseDto> {
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
      include: {
        userPlaces: {
          select: {
            labels: true,
            photos: true,
            reviews: {
              where: { isPublic: true },
              select: { id: true }, // 리뷰 수만 카운트
            },
          },
        },
      },
    });

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    // 리뷰 수 계산 (평점 제거)
    const reviewCount = place.userPlaces.reduce(
      (sum, up) => sum + up.reviews.length,
      0
    );

    // 커스텀 라벨 집계 (빈도수 계산)
    const labelCounts = new Map<string, number>();
    place.userPlaces.forEach((up) => {
      up.labels.forEach((label) => {
        labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
      });
    });

    // 상위 10개 라벨만 선택
    const topLabels: LabelCount[] = Array.from(labelCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 모든 사진 수집
    const allPhotos = place.userPlaces.flatMap((up) => up.photos);

    return {
      id: place.id,
      name: place.name,
      category: place.category,
      address: place.address,
      phone: place.phone,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      photos: allPhotos,
      reviewCount,
      topLabels,
      externalUrl: place.externalUrl,
      externalId: place.externalId,
      createdAt: place.createdAt,
      updatedAt: place.updatedAt,
    };
  }
}
