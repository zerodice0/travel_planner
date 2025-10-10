import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryDto } from './dto/search-query.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, query: SearchQueryDto) {
    const { q: keyword, type = 'all', category, visited } = query;

    const results: any = {
      places: [],
      lists: [],
      total: {
        places: 0,
        lists: 0,
      },
    };

    // Search places
    if (type === 'all' || type === 'place') {
      const whereClause: any = {
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
      results.lists = await this.prisma.list.findMany({
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
      results.lists = results.lists.map((list: any) => ({
        id: list.id,
        name: list.name,
        description: list.description,
        iconType: list.iconType,
        iconValue: list.iconValue,
        colorTheme: list.colorTheme,
        placesCount: list.placeLists.length,
        visitedCount: list.placeLists.filter((pl: any) => pl.userPlace.visited)
          .length,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      }));

      results.total.lists = results.lists.length;
    }

    return results;
  }
}
