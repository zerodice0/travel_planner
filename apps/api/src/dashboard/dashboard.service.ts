import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string): Promise<DashboardStatsDto> {
    const [totalPlaces, visitedPlaces, totalLists] = await Promise.all([
      this.prisma.place.count({ where: { userId } }),
      this.prisma.place.count({ where: { userId, visited: true } }),
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
}
