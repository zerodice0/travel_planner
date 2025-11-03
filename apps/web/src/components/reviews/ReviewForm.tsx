import { useState } from 'react';
import type { Review, CreateReviewData, UpdateReviewData } from '#types/review';

interface ReviewFormProps {
  existingReview?: Review;
  content: string;
  onContentChange: (content: string) => void;
  onSubmit: (data: CreateReviewData | UpdateReviewData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ReviewForm({
  existingReview,
  content,
  onContentChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ReviewFormProps) {
  const [isPublic, setIsPublic] = useState(existingReview?.isPublic ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    const data = {
      content: content.trim(),
      isPublic,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* 리뷰 내용 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          리뷰 *
        </label>
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="이 장소에 대한 리뷰를 작성해주세요..."
          maxLength={2000}
          rows={6}
          required
          className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-foreground bg-background placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{content.length}/2000</p>
        </div>
      </div>

      {/* 공개 여부 */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <p className="font-medium text-foreground">다른 사용자에게 공개</p>
          <p className="text-sm text-muted-foreground">
            공개하면 다른 사용자들이 이 리뷰를 볼 수 있습니다
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPublic(!isPublic)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isPublic ? 'bg-primary-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isPublic ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '저장 중...' : existingReview ? '수정' : '작성'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
