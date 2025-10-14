export interface ReviewAuthor {
  id: string;
  nickname: string;
  profileImage?: string;
}

export interface Review {
  id: string;
  userPlaceId: string;
  content: string;
  rating?: number;
  photos: string[];
  isPublic: boolean;
  likeCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  author: ReviewAuthor;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
}

export interface CreateReviewData {
  content: string;
  rating?: number;
  photos?: string[];
  isPublic?: boolean;
}

export interface UpdateReviewData {
  content?: string;
  rating?: number;
  photos?: string[];
  isPublic?: boolean;
}
