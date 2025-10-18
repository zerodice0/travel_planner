import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { UnreadCountResponseDto } from './dto/unread-count-response.dto';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@ApiTags('알림')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '내 알림 목록 조회' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '조회 개수 (기본: 50)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: '건너뛸 개수 (기본: 0)' })
  @ApiResponse({
    status: 200,
    description: '알림 목록 조회 성공',
    type: [NotificationResponseDto],
  })
  async getNotifications(
    @Req() req: RequestWithUser,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.findAllByUserId(req.user.userId, limit, offset);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '안읽은 알림 개수 조회' })
  @ApiResponse({
    status: 200,
    description: '안읽은 알림 개수 조회 성공',
    type: UnreadCountResponseDto,
  })
  async getUnreadCount(@Req() req: RequestWithUser): Promise<UnreadCountResponseDto> {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiResponse({
    status: 200,
    description: '알림 읽음 처리 성공',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: '알림을 찾을 수 없음' })
  async markAsRead(
    @Req() req: RequestWithUser,
    @Param('id') notificationId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(notificationId, req.user.userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  @ApiResponse({
    status: 200,
    description: '모든 알림 읽음 처리 성공',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: '읽음 처리된 알림 개수' },
      },
    },
  })
  async markAllAsRead(@Req() req: RequestWithUser): Promise<{ count: number }> {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '알림 삭제' })
  @ApiResponse({ status: 200, description: '알림 삭제 성공' })
  @ApiResponse({ status: 404, description: '알림을 찾을 수 없음' })
  async deleteNotification(
    @Req() req: RequestWithUser,
    @Param('id') notificationId: string,
  ): Promise<void> {
    return this.notificationsService.delete(notificationId, req.user.userId);
  }
}
