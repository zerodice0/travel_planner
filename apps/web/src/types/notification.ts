export type NotificationType =
  | 'review_like'
  | 'new_review_on_saved_place'
  | 'system_announcement';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}
