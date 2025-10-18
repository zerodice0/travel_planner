import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryDto } from './dto/search-query.dto';

export interface SearchPlaceResult {
  id: string;
  name: string;
  address: string;
  category: string;
  customCategory: string | null;
  labels: string[];
  visited: boolean;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

export interface SearchListResult {
  id: string;
  name: string;
  description: string | null;
  iconType: string;
  iconValue: string;
  colorTheme: string | null;
  placesCount: number;
  visitedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResults {
  places: SearchPlaceResult[];
  lists: SearchListResult[];
  total: {
    places: number;
    lists: number;
  };
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, query: SearchQueryDto): Promise<SearchResults> {
    const { q: keyword, type = 'all', category, visited } = query;

    const results: SearchResults = {
      places: [],
      lists: [],
      total: {
        places: 0,
        lists: 0,
      },
    };

    // Search places
    if (type === 'all' || type === 'place') {
      const whereClause: Prisma.UserPlaceWhereInput = {
        userId,
        OR: [
          { place: { name: { contains: keyword, mode: 'insensitive' } } },
          { place: { address: { contains: keyword, mode: 'insensitive' } } },
          { customCategory: { contains: keyword, mode: 'insensitive' } },
          { labels: { has: keyword } },
        ],
      };

      if (category) {
        whereClause.place = { category };
      }

      if (visited !== undefined) {
        whereClause.visited = visited;
      }

      const userPlaces = await this.prisma.userPlace.findMany({
        where: whereClause,
        take: 20,
        include: {
          place: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      results.places = userPlaces.map((up) => ({
        id: up.id,
        name: up.place.name,
        address: up.place.address,
        category: up.place.category,
        customCategory: up.customCategory,
        labels: up.labels,
        visited: up.visited,
        latitude: Number(up.place.latitude),
        longitude: Number(up.place.longitude),
        createdAt: up.createdAt,
      }));

      results.total.places = results.places.length;
    }

    // Search lists
    if (type === 'all' || type === 'list') {
      const lists = await this.prisma.list.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: {
          placeLists: {
            include: {
              userPlace: {
                select: {
                  visited: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Transform lists to include counts
      results.lists = lists.map((list) => ({
        id: list.id,
        name: list.name,
        description: list.description,
        iconType: list.iconType,
        iconValue: list.iconValue,
        colorTheme: list.colorTheme,
        placesCount: list.placeLists.length,
        visitedCount: list.placeLists.filter((pl) => pl.userPlace.visited)
          .length,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      }));

      results.total.lists = results.lists.length;
    }

    return results;
  }
}
