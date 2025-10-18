import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({
    description: '알림 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: '알림 유형',
    enum: ['review_like', 'new_review_on_saved_place', 'system_announcement'],
    example: 'new_review_on_saved_place',
  })
  type!: string;

  @ApiProperty({
    description: '알림 제목',
    example: '새로운 리뷰가 등록되었습니다',
  })
  title!: string;

  @ApiProperty({
    description: '알림 내용',
    example: '"카페 모카" 장소에 새로운 리뷰가 등록되었습니다.',
  })
  message!: string;

  @ApiProperty({
    description: '관련 리소스 ID (리뷰 ID, 장소 ID 등)',
    example: '660e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  relatedId?: string;

  @ApiProperty({
    description: '읽음 여부',
    example: false,
  })
  isRead!: boolean;

  @ApiProperty({
    description: '생성 일시',
    example: '2025-10-18T12:34:56.789Z',
  })
  createdAt!: Date;
}
