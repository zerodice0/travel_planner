import { Eye, EyeOff, Trash2, Edit2 } from 'lucide-react';
import type { Review } from '#types/review';

interface ReviewListProps {
  reviews: Review[];
  isMyReviews?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onToggleVisibility?: (reviewId: string) => void;
}

export function ReviewList({
  reviews,
  isMyReviews = false,
  onEdit,
  onDelete,
  onToggleVisibility,
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isMyReviews ? '작성한 리뷰가 없습니다.' : '아직 리뷰가 없습니다.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-card rounded-lg p-4 border border-border space-y-3"
        >
          {/* 작성자 정보 */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {review.author.profileImage ? (
                <img
                  src={review.author.profileImage}
                  alt={review.author.nickname}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {review.author.nickname[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-foreground">{review.author.nickname}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>

            {/* 내 리뷰인 경우 액션 버튼 */}
            {isMyReviews && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleVisibility?.(review.id)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title={review.isPublic ? '비공개로 전환' : '공개로 전환'}
                >
                  {review.isPublic ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => onEdit?.(review)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="수정"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete?.(review.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}
          </div>

          {/* 리뷰 내용 */}
          <p className="text-foreground whitespace-pre-wrap">{review.content}</p>

          {/* 사진 */}
          {review.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {review.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`리뷰 사진 ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {/* 공개 상태 표시 (내 리뷰) */}
          {isMyReviews && (
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`px-2 py-1 rounded-full ${
                  review.isPublic
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {review.isPublic ? '공개' : '비공개'}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
