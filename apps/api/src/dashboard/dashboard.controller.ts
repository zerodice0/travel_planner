import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { ActivitiesResponseDto } from './dto/activity.dto';

interface RequestWithUser {
  user: JwtPayload;
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@Request() req: RequestWithUser): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats(req.user.userId);
  }

  @Get('activities')
  async getActivities(
    @Request() req: RequestWithUser,
    @Query('limit') limit?: string,
  ): Promise<ActivitiesResponseDto> {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const activities = await this.dashboardService.getRecentActivities(
      req.user.userId,
      limitNumber,
    );
    return { activities };
  }
}
