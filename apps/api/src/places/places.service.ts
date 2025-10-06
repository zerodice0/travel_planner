import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlaceQueryDto } from './dto/place-query.dto';
import { PlaceResponseDto, PlacesResponseDto } from './dto/place-response.dto';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { PlaceDetailResponseDto } from './dto/place-detail-response.dto';

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: PlaceQueryDto,
  ): Promise<PlacesResponseDto> {
    const places = await this.prisma.place.findMany({
      where: { userId },
      take: query.limit,
      orderBy: { [query.sort as string]: 'desc' },
      select: {
        id: true,
        name: true,
        category: true,
        address: true,
        visited: true,
        createdAt: true,
      },
    });

    const placeResponses: PlaceResponseDto[] = places.map((place) => ({
      id: place.id,
      name: place.name,
      category: place.category,
      address: place.address,
      visited: place.visited,
      createdAt: place.createdAt,
    }));

    return { places: placeResponses };
  }

  async findOne(
    userId: string,
    placeId: string,
  ): Promise<PlaceDetailResponseDto> {
    const place = await this.prisma.place.findFirst({
      where: { id: placeId, userId },
    });

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    return {
      id: place.id,
      name: place.name,
      address: place.address,
      phone: place.phone,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      category: place.category,
      customCategory: place.customCategory,
      labels: place.labels,
      visited: place.visited,
      visitedAt: place.visitedAt,
      visitNote: place.visitNote,
      rating: place.rating,
      estimatedCost: place.estimatedCost,
      photos: place.photos,
      externalUrl: place.externalUrl,
      externalId: place.externalId,
      createdAt: place.createdAt,
      updatedAt: place.updatedAt,
    };
  }

  async create(
    userId: string,
    createPlaceDto: CreatePlaceDto,
  ): Promise<PlaceDetailResponseDto> {
    const place = await this.prisma.place.create({
      data: {
        userId,
        name: createPlaceDto.name,
        address: createPlaceDto.address,
        phone: createPlaceDto.phone,
        latitude: createPlaceDto.latitude,
        longitude: createPlaceDto.longitude,
        category: createPlaceDto.category,
        customCategory: createPlaceDto.customCategory,
        labels: createPlaceDto.labels || [],
        visited: createPlaceDto.visited || false,
        externalUrl: createPlaceDto.externalUrl,
        externalId: createPlaceDto.externalId,
        photos: [],
      },
    });

    return this.findOne(userId, place.id);
  }

  async update(
    userId: string,
    placeId: string,
    updatePlaceDto: UpdatePlaceDto,
  ): Promise<PlaceDetailResponseDto> {
    const place = await this.prisma.place.findFirst({
      where: { id: placeId, userId },
    });

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    await this.prisma.place.update({
      where: { id: placeId },
      data: updatePlaceDto,
    });

    return this.findOne(userId, placeId);
  }

  async delete(userId: string, placeId: string): Promise<void> {
    const place = await this.prisma.place.findFirst({
      where: { id: placeId, userId },
    });

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    await this.prisma.place.delete({
      where: { id: placeId },
    });
  }

  async findLists(userId: string, placeId: string) {
    const place = await this.prisma.place.findFirst({
      where: { id: placeId, userId },
      include: {
        placeLists: {
          include: {
            list: true,
          },
        },
      },
    });

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    return {
      lists: place.placeLists.map((pl) => ({
        id: pl.list.id,
        name: pl.list.name,
        iconType: pl.list.iconType,
        iconValue: pl.list.iconValue,
      })),
    };
  }

  async addToList(
    userId: string,
    placeId: string,
    listId: string,
  ): Promise<void> {
    const place = await this.prisma.place.findFirst({
      where: { id: placeId, userId },
    });

    if (!place) {
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
        placeId,
        listId,
        order: (maxOrder?.order || -1) + 1,
      },
    });
  }

  async removeFromList(
    userId: string,
    placeId: string,
    listId: string,
  ): Promise<void> {
    const place = await this.prisma.place.findFirst({
      where: { id: placeId, userId },
    });

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    await this.prisma.placeList.deleteMany({
      where: { placeId, listId },
    });
  }
}
