import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 알림 생성
   */
  async create(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        relatedId: dto.relatedId,
      },
    });

    return this.mapToResponseDto(notification);
  }

  /**
   * 사용자의 모든 알림 조회 (최신순, 페이지네이션)
   */
  async findAllByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return notifications.map(this.mapToResponseDto);
  }

  /**
   * 안읽은 알림 개수 조회
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationResponseDto> {
    // 알림 존재 및 권한 확인
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    // 읽음 처리
    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { count: result.count };
  }

  /**
   * 알림 삭제
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    // 알림 존재 및 권한 확인
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * 저장된 장소에 새 리뷰가 등록되었을 때 알림 생성 (스팸 방지 포함)
   */
  async notifyNewReviewOnSavedPlace(
    placeId: string,
    reviewAuthorId: string,
    placeName: string,
  ): Promise<void> {
    // 해당 장소를 저장한 사용자들 조회 (리뷰 작성자 제외)
    const usersWithSavedPlace = await this.prisma.userPlace.findMany({
      where: {
        placeId,
        userId: { not: reviewAuthorId },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    if (usersWithSavedPlace.length === 0) {
      return;
    }

    // 스팸 방지: 같은 장소에 대해 오늘 이미 알림을 받은 사용자 제외
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recentNotifications = await this.prisma.notification.findMany({
      where: {
        type: 'new_review_on_saved_place',
        relatedId: placeId,
        createdAt: { gte: today },
      },
      select: { userId: true },
    });

    const recentlyNotifiedUserIds = new Set(recentNotifications.map((n) => n.userId));

    // 오늘 아직 알림을 받지 않은 사용자들에게만 알림 생성
    const usersToNotify = usersWithSavedPlace.filter(
      (u) => !recentlyNotifiedUserIds.has(u.userId),
    );

    if (usersToNotify.length === 0) {
      return;
    }

    // 배치로 알림 생성
    await this.prisma.notification.createMany({
      data: usersToNotify.map((user) => ({
        userId: user.userId,
        type: 'new_review_on_saved_place' as const,
        title: '새로운 리뷰가 등록되었습니다',
        message: `"${placeName}" 장소에 새로운 리뷰가 등록되었습니다.`,
        relatedId: placeId,
      })),
    });
  }

  /**
   * Entity를 DTO로 변환
   */
  private mapToResponseDto(notification: { id: string; type: string; title: string; message: string; relatedId: string | null; isRead: boolean; createdAt: Date; }): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedId: notification.relatedId || undefined,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }
}
