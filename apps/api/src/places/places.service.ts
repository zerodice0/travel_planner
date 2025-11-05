import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PlaceQueryDto, ViewportQueryDto, NearestPlaceQueryDto } from './dto/place-query.dto';
import { PlaceResponseDto, PlacesResponseDto } from './dto/place-response.dto';
import { CreatePlaceDto } from './dto/create-place.dto';
import { CreatePublicPlaceDto } from './dto/create-public-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { PlaceDetailResponseDto } from './dto/place-detail-response.dto';
import {
  PublicPlaceResponseDto,
  PublicPlaceDetailResponseDto,
  PublicPlacesResponseDto,
  LabelCount,
} from './dto/public-place-response.dto';
import { getDistance } from 'geolib';
import { distance as levenshteinDistance } from 'fastest-levenshtein';

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
        customName: true,
        customCategory: true,
        labels: true,
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
      // Custom fields for marker visualization
      customName: userPlace.customName ?? undefined,
      customCategory: userPlace.customCategory ?? undefined,
      labels: JSON.parse(userPlace.labels) as string[],
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
      labels: JSON.parse(userPlace.labels) as string[],
      note: userPlace.note,
      visited: userPlace.visited,
      visitedAt: userPlace.visitedAt,
      visitNote: userPlace.visitNote,
      rating: userPlace.rating,
      estimatedCost: userPlace.estimatedCost,
      photos: JSON.parse(userPlace.photos) as string[],
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
      // 1. Check for duplicates (only for user-generated places without externalId)
      if (!createPlaceDto.externalId) {
        const duplicates = await this.detectDuplicates(
          createPlaceDto.name,
          createPlaceDto.latitude,
          createPlaceDto.longitude,
        );

        if (duplicates.length > 0) {
          throw new ConflictException({
            message: 'Duplicate place detected',
            duplicates: duplicates.map(p => ({
              id: p.id,
              name: p.name,
              address: p.address,
              distance: p.distance,
              similarity: p.similarity,
            })),
          });
        }
      }

      // 2. Check if place already exists (by externalId if provided)
      let place: Awaited<ReturnType<typeof this.prisma.place.findUnique>> = null;
      if (createPlaceDto.externalId) {
        place = await this.prisma.place.findUnique({
          where: { externalId: createPlaceDto.externalId },
        });
      }

      // 3. Create Place + UserPlace + ModerationQueue in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create or reuse place
        const createdPlace = place || await tx.place.create({
          data: {
            name: createPlaceDto.name,
            address: createPlaceDto.address,
            phone: createPlaceDto.phone,
            latitude: createPlaceDto.latitude,
            longitude: createPlaceDto.longitude,
            category: createPlaceDto.category,
            description: createPlaceDto.description,
            externalUrl: createPlaceDto.externalUrl,
            externalId: createPlaceDto.externalId,
          },
        });

        // Create UserPlace
        const userPlace = await tx.userPlace.create({
          data: {
            userId,
            placeId: createdPlace.id,
            customName: createPlaceDto.customName,
            customCategory: createPlaceDto.customCategory,
            labels: JSON.stringify(createPlaceDto.labels || []),
            note: createPlaceDto.note,
            visited: createPlaceDto.visited || false,
            photos: JSON.stringify([]),
          },
        });

        // Add to moderation queue (only for user-generated places)
        if (!createPlaceDto.externalId) {
          await tx.placeModerationQueue.create({
            data: {
              placeId: createdPlace.id,
              userId,
              status: 'pending',
            },
          });
        }

        return userPlace;
      });

      // 4. Return with moderation status
      const response = await this.findOne(userId, result.id);
      return {
        ...response,
        moderationStatus: createPlaceDto.externalId ? undefined : 'pending',
      };
    } catch (error) {
      // Prisma error handling
      const prismaError = error as { code?: string };

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
      name: _name,
      address: _address,
      phone: _phone,
      latitude: _latitude,
      longitude: _longitude,
      labels,
      photos,
      ...userPlaceFields
    } = updatePlaceDto;

    // category를 customCategory로 매핑하고 배열 필드를 JSON 문자열로 변환
    const updateData = {
      ...userPlaceFields,
      ...(category !== undefined && { customCategory: category }),
      ...(labels !== undefined && { labels: JSON.stringify(labels) }),
      ...(photos !== undefined && { photos: JSON.stringify(photos) }),
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
  // Haversine 공식으로 두 점 사이의 거리 계산 (km)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async findNearest(query: NearestPlaceQueryDto): Promise<PublicPlacesResponseDto> {
    const { lat, lng, category, limit = 1 } = query;

    // 반경 100km 내의 모든 장소 조회
    const where = category ? { category } : {};

    const allPlaces = await this.prisma.place.findMany({
      where,
      include: {
        userPlaces: {
          select: {
            labels: true,
            photos: true,
            reviews: {
              where: { isPublic: true },
              select: { id: true },
            },
          },
        },
      },
    });

    // 거리 계산 후 정렬 (모든 등록된 장소 중 가장 가까운 곳 찾기)
    const placesWithDistance = allPlaces
      .map((place) => ({
        ...place,
        distance: this.calculateDistance(
          lat,
          lng,
          Number(place.latitude),
          Number(place.longitude)
        ),
      }))
      // 거리 제한 제거 - 전 세계 모든 등록된 장소를 대상으로 검색
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    const placeResponses: (PublicPlaceResponseDto & { distance: number })[] = placesWithDistance.map((place) => {
      // 리뷰 수 계산
      const reviewCount = place.userPlaces.reduce(
        (sum, up) => sum + up.reviews.length,
        0
      );

      // 커스텀 라벨 집계
      const labelCounts = new Map<string, number>();
      place.userPlaces.forEach((up) => {
        const labels = JSON.parse(up.labels) as string[];
        labels.forEach((label: string) => {
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
        description: place.description,
        photos: allPhotos,
        reviewCount,
        topLabels,
        externalId: place.externalId,
        createdAt: place.createdAt,
        distance: place.distance,
      };
    });

    return { places: placeResponses, total: placeResponses.length };
  }

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
        const labels = JSON.parse(up.labels) as string[];
        labels.forEach((label: string) => {
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
        description: place.description,
        photos: allPhotos,
        reviewCount,
        topLabels,
        externalId: place.externalId,
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
        const labels = JSON.parse(up.labels) as string[];
        labels.forEach((label: string) => {
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
        description: place.description,
        photos: allPhotos,
        reviewCount,
        topLabels,
        externalId: place.externalId,
        createdAt: place.createdAt,
      };
    });

    return { places: placeResponses, total };
  }

  /**
   * Search public places using SQLite FTS5
   * @param keyword - Search keyword
   * @param category - Optional category filter
   * @param limit - Max results (default: 50)
   * @param offset - Pagination offset (default: 0)
   * @returns Ranked search results
   */
  async searchPublicPlaces(options: {
    keyword: string;
    category?: string;
    limit: number;
    offset: number;
  }): Promise<PublicPlacesResponseDto> {
    const { keyword, category, limit, offset } = options;

    // SQLite FTS5 search query
    // MATCH operator searches the FTS5 virtual table
    const ftsQuery = `
      SELECT place_id
      FROM places_fts
      WHERE places_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `;

    // Execute FTS5 search
    const ftsResults = await this.prisma.$queryRawUnsafe<{ place_id: string }[]>(
      ftsQuery,
      keyword,
      limit,
      offset,
    );

    if (ftsResults.length === 0) {
      return { places: [], total: 0 };
    }

    // Get place IDs from FTS results
    const placeIds = ftsResults.map((r) => r.place_id);

    // Build where clause for Place table
    const where: Prisma.PlaceWhereInput = {
      id: { in: placeIds },
    };

    if (category) {
      where.category = category;
    }

    // Fetch full place data with aggregations
    const [places, total] = await Promise.all([
      this.prisma.place.findMany({
        where,
        include: {
          userPlaces: {
            select: {
              labels: true,
              photos: true,
              reviews: {
                where: { isPublic: true },
                select: { id: true },
              },
            },
          },
        },
      }),
      this.prisma.place.count({ where }),
    ]);

    // Transform to PublicPlaceResponseDto (same as findAllPublic)
    const placeResponses: PublicPlaceResponseDto[] = places.map((place) => {
      // Review count
      const reviewCount = place.userPlaces.reduce(
        (sum, up) => sum + up.reviews.length,
        0,
      );

      // Aggregate labels
      const labelCounts = new Map<string, number>();
      place.userPlaces.forEach((up) => {
        const labels = JSON.parse(up.labels) as string[];
        labels.forEach((label: string) => {
          labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
        });
      });

      // Top 10 labels
      const topLabels: LabelCount[] = Array.from(labelCounts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // All photos
      const allPhotos = place.userPlaces.flatMap((up) => up.photos);

      return {
        id: place.id,
        name: place.name,
        address: place.address,
        phone: place.phone ?? undefined,
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        category: place.category,
        description: place.description ?? undefined,
        externalUrl: place.externalUrl ?? undefined,
        reviewCount,
        photos: allPhotos,
        topLabels,
        externalId: place.externalId ?? undefined,
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
      const labels = JSON.parse(up.labels) as string[];
      labels.forEach((label: string) => {
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
      description: place.description,
      photos: allPhotos,
      reviewCount,
      topLabels,
      externalUrl: place.externalUrl,
      externalId: place.externalId,
      createdAt: place.createdAt,
      updatedAt: place.updatedAt,
    };
  }

  async createPublicPlace(
    createPublicPlaceDto: CreatePublicPlaceDto,
  ): Promise<PublicPlaceDetailResponseDto> {
    try {
      // 1. Check if place already exists (by externalId if provided)
      if (createPublicPlaceDto.externalId) {
        const existingPlace = await this.prisma.place.findUnique({
          where: { externalId: createPublicPlaceDto.externalId },
        });

        if (existingPlace) {
          throw new ConflictException(
            '이미 등록된 장소입니다. 해당 장소를 "내 장소"로 추가할 수 있습니다.',
          );
        }
      }

      // 2. Create new public place
      const place = await this.prisma.place.create({
        data: {
          name: createPublicPlaceDto.name,
          address: createPublicPlaceDto.address,
          phone: createPublicPlaceDto.phone,
          latitude: createPublicPlaceDto.latitude,
          longitude: createPublicPlaceDto.longitude,
          category: createPublicPlaceDto.category,
          description: createPublicPlaceDto.description,
          externalUrl: createPublicPlaceDto.externalUrl,
          externalId: createPublicPlaceDto.externalId,
        },
      });

      // 3. Return the created place as PublicPlaceDetail
      return {
        id: place.id,
        name: place.name,
        category: place.category,
        address: place.address,
        phone: place.phone,
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        description: place.description,
        photos: [],
        reviewCount: 0,
        topLabels: [],
        externalUrl: place.externalUrl,
        externalId: place.externalId,
        createdAt: place.createdAt,
        updatedAt: place.updatedAt,
      };
    } catch (error) {
      // Re-throw ConflictException
      if (error instanceof ConflictException) {
        throw error;
      }

      // Prisma error handling
      const prismaError = error as { code?: string };

      if (prismaError.code === 'P2002') {
        throw new ConflictException(
          '이미 등록된 장소입니다. 중복된 정보가 있습니다.',
        );
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
      console.error('Public place creation error:', error);
      throw error;
    }
  }

  /**
   * Detects duplicate places using two-phase algorithm.
   *
   * Phase 1: Bounding box query (~100m radius) using database indexes.
   * Phase 2: Application-level validation with Haversine distance + Levenshtein similarity.
   *
   * @param name - Place name for similarity comparison
   * @param lat - Latitude coordinate
   * @param lng - Longitude coordinate
   * @returns Array of duplicate candidates with distance (meters) and similarity score (0-1)
   */
  private async detectDuplicates(name: string, lat: number, lng: number) {
    // Phase 1: Bounding box query (D1 SQL)
    const candidates = await this.prisma.place.findMany({
      where: {
        latitude: {
          gte: lat - 0.001,
          lte: lat + 0.001,
        },
        longitude: {
          gte: lng - 0.001,
          lte: lng + 0.001,
        },
      },
    });

    // Phase 2: Application-level validation (Haversine + Levenshtein)
    const duplicates = candidates.filter(place => {
      // Distance check (Haversine)
      const distanceMeters = getDistance(
        { lat, lng },
        { lat: Number(place.latitude), lng: Number(place.longitude) },
      );

      // Similarity check (Levenshtein)
      const maxLength = Math.max(name.length, place.name.length);
      const similarity = 1 - (levenshteinDistance(name, place.name) / maxLength);

      return distanceMeters <= 100 && similarity >= 0.8;
    }).map(place => ({
      ...place,
      distance: getDistance({ lat, lng }, { lat: Number(place.latitude), lng: Number(place.longitude) }),
      similarity: 1 - (levenshteinDistance(name, place.name) / Math.max(name.length, place.name.length)),
    }));

    return duplicates;
  }
}
