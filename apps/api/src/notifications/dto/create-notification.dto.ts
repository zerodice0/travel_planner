export class CreateNotificationDto {
  userId!: string;
  type!: 'review_like' | 'new_review_on_saved_place' | 'system_announcement';
  title!: string;
  message!: string;
  relatedId?: string;
}
