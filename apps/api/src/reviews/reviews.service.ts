import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto, ReviewsResponseDto } from './dto/review-response.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    userPlaceId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    // Verify userPlace belongs to user
    const userPlace = await this.prisma.userPlace.findFirst({
      where: { id: userPlaceId, userId },
      include: { place: true },
    });

    if (!userPlace) {
      throw new NotFoundException('Place not found');
    }

    const review = await this.prisma.review.create({
      data: {
        userPlaceId,
        userId,
        placeId: userPlace.placeId,
        content: createReviewDto.content,
        rating: createReviewDto.rating,
        photos: createReviewDto.photos || [],
        isPublic: createReviewDto.isPublic || false,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    // 알림 생성 (비동기, 실패해도 리뷰 생성은 성공)
    this.notificationsService
      .notifyNewReviewOnSavedPlace(userPlace.placeId, userId, userPlace.place.name)
      .catch((error) => {
        console.error('Failed to create notification:', error);
      });

    return {
      id: review.id,
      userPlaceId: review.userPlaceId,
      content: review.content,
      rating: review.rating,
      photos: review.photos,
      isPublic: review.isPublic,
      likeCount: review.likeCount,
      reportCount: review.reportCount,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      author: {
        id: review.user.id,
        nickname: review.user.nickname,
        profileImage: review.user.profileImage || undefined,
      },
    };
  }

  async findByPlace(placeId: string): Promise<ReviewsResponseDto> {
    const reviews = await this.prisma.review.findMany({
      where: {
        placeId,
        isPublic: true,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      reviews: reviews.map((review) => ({
        id: review.id,
        userPlaceId: review.userPlaceId,
        content: review.content,
        rating: review.rating,
        photos: review.photos,
        isPublic: review.isPublic,
        likeCount: review.likeCount,
        reportCount: review.reportCount,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        author: {
          id: review.user.id,
          nickname: review.user.nickname,
          profileImage: review.user.profileImage || undefined,
        },
      })),
      total: reviews.length,
    };
  }

  async findByUser(userId: string): Promise<ReviewsResponseDto> {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      reviews: reviews.map((review) => ({
        id: review.id,
        userPlaceId: review.userPlaceId,
        content: review.content,
        rating: review.rating,
        photos: review.photos,
        isPublic: review.isPublic,
        likeCount: review.likeCount,
        reportCount: review.reportCount,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        author: {
          id: review.user.id,
          nickname: review.user.nickname,
          profileImage: review.user.profileImage || undefined,
        },
      })),
      total: reviews.length,
    };
  }

  async update(
    userId: string,
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: updateReviewDto,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      userPlaceId: updated.userPlaceId,
      content: updated.content,
      rating: updated.rating,
      photos: updated.photos,
      isPublic: updated.isPublic,
      likeCount: updated.likeCount,
      reportCount: updated.reportCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      author: {
        id: updated.user.id,
        nickname: updated.user.nickname,
        profileImage: updated.user.profileImage || undefined,
      },
    };
  }

  async delete(userId: string, reviewId: string): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });
  }

  async toggleVisibility(userId: string, reviewId: string): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only modify your own reviews');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { isPublic: !review.isPublic },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      userPlaceId: updated.userPlaceId,
      content: updated.content,
      rating: updated.rating,
      photos: updated.photos,
      isPublic: updated.isPublic,
      likeCount: updated.likeCount,
      reportCount: updated.reportCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      author: {
        id: updated.user.id,
        nickname: updated.user.nickname,
        profileImage: updated.user.profileImage || undefined,
      },
    };
  }
}
