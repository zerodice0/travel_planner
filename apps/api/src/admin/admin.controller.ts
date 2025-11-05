import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { PrismaService } from '../prisma/prisma.service';

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

  @Get()
  async getQueue(
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

  @Patch(':id')
  async review(
    @Param('id') id: string,
    @Body() dto: { status: 'approved' | 'rejected'; reviewNotes?: string },
    @Request() req: RequestWithUser,
  ) {
    // Validate reviewNotes required for rejection
    if (dto.status === 'rejected' && !dto.reviewNotes) {
      throw new BadRequestException('reviewNotes is required when rejecting');
    }

    try {
      return await this.prisma.placeModerationQueue.update({
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
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        // Prisma "Record not found"
        throw new NotFoundException('Moderation queue item not found');
      }
      throw error;
    }
  }
}
