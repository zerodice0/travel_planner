export class ReviewAuthorDto {
  id!: string;
  nickname!: string;
  profileImage?: string;
}

export class ReviewResponseDto {
  id!: string;
  userPlaceId!: string;
  content!: string;
  rating?: number | null;
  photos!: string[];
  isPublic!: boolean;
  likeCount!: number;
  reportCount!: number;
  createdAt!: Date;
  updatedAt!: Date;
  author!: ReviewAuthorDto;
}

export class ReviewsResponseDto {
  reviews!: ReviewResponseDto[];
  total!: number;
}
