import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewPlaceDto, ReviewReviewDto, ModerationStatsDto } from './dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    userId: string;
    isAdmin: boolean;
  };
}

@Controller('admin/moderation')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('places')
  async getPlaceQueue(
    @Query('status') status: string = 'pending',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
  ) {
    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 100); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      this.prisma.placeModerationQueue.findMany({
        where: { status },
        include: {
          place: true,
          user: { select: { id: true, nickname: true, email: true } },
          reviewer: { select: { id: true, nickname: true } },
        },
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.placeModerationQueue.count({ where: { status } }),
    ]);

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get('reviews')
  async getReviewQueue(
    @Query('status') status: string = 'pending',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
  ) {
    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          reportCount: { gt: 0 },
          ...(status === 'pending' && { isPublic: true }),
        },
        include: {
          user: { select: { id: true, nickname: true, email: true } },
          place: { select: { id: true, name: true } },
          userPlace: { select: { id: true, customName: true } },
        },
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.review.count({
        where: {
          reportCount: { gt: 0 },
          ...(status === 'pending' && { isPublic: true }),
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Patch('places/:id')
  async reviewPlace(
    @Param('id') id: string,
    @Body() dto: ReviewPlaceDto,
    @Request() req: RequestWithUser,
  ) {
    try {
      const result = await this.prisma.placeModerationQueue.update({
        where: { id },
        data: {
          status: dto.status,
          reviewerId: req.user.userId,
          reviewedAt: new Date(),
          reviewNotes: dto.reviewNotes,
        },
        include: {
          place: true,
          user: { select: { id: true, nickname: true, email: true } },
          reviewer: { select: { id: true, nickname: true } },
        },
      });

      // If approved, you could trigger additional actions here
      // e.g., send notification to user, update place status, etc.

      return result;
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        // Prisma "Record not found"
        throw new NotFoundException('Moderation queue item not found');
      }
      throw error;
    }
  }

  @Patch('reviews/:id')
  async reviewReview(
    @Param('id') id: string,
    @Body() dto: ReviewReviewDto,
    @Request() req: RequestWithUser,
  ) {
    try {
      const updateData: {
        reviewedAt: Date;
        reviewerId: string;
        reviewNotes?: string;
        status?: 'approved' | 'rejected' | 'hidden';
        isPublic?: boolean;
      } = {
        reviewedAt: new Date(),
        reviewerId: req.user.userId,
        reviewNotes: dto.reviewNotes,
      };

      // Handle different statuses
      if (dto.status === 'hidden') {
        updateData.isPublic = false;
      }

      const result = await this.prisma.review.update({
        where: { id },
        data: updateData,
        include: {
          user: { select: { id: true, nickname: true, email: true } },
          place: { select: { id: true, name: true } },
          userPlace: { select: { id: true, customName: true } },
        },
      });

      // Reset report count when review is processed
      // Since dto.status can only be 'approved' | 'rejected' | 'hidden',
      // any status update means the review has been processed
      await this.prisma.review.update({
        where: { id },
        data: { reportCount: 0 },
      });

      return result;
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        throw new NotFoundException('Review not found');
      }
      throw error;
    }
  }

  @Get('stats')
  async getModerationStats(): Promise<ModerationStatsDto> {
    const [pendingPlaces, pendingReviews, totalPlaces, totalReviews] = await Promise.all([
      this.prisma.placeModerationQueue.count({
        where: { status: 'pending' },
      }),
      this.prisma.review.count({
        where: {
          reportCount: { gt: 0 },
          isPublic: true,
        },
      }),
      this.prisma.placeModerationQueue.count(),
      this.prisma.review.count({
        where: { reportCount: { gt: 0 } },
      }),
    ]);

    return {
      places: {
        pending: pendingPlaces,
        total: totalPlaces,
      },
      reviews: {
        pending: pendingReviews,
        total: totalReviews,
      },
    };
  }
}
