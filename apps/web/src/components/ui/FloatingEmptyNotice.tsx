import { MapPin, LogIn, Navigation, Plus, X } from 'lucide-react';
import { getCategoryLabel } from '#utils/categoryConfig';
import { EMPTY_STATE_MESSAGES, ACTION_MESSAGES } from '#utils/messages';

interface FloatingEmptyNoticeProps {
  type: 'viewport' | 'category' | 'global';
  category?: string;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onExploreNearest?: () => void;
  isLoadingNearest?: boolean;
  onAddFirstPlace?: () => void;
  onClose?: () => void;
}

export function FloatingEmptyNotice({
  type,
  category,
  isAuthenticated,
  onLoginClick,
  onExploreNearest,
  isLoadingNearest = false,
  onAddFirstPlace,
  onClose,
}: FloatingEmptyNoticeProps) {
  const getMessage = () => {
    switch (type) {
      case 'viewport':
        return EMPTY_STATE_MESSAGES.viewport;
      case 'category': {
        const categoryLabel = category ? getCategoryLabel(category) : '카테고리';
        return EMPTY_STATE_MESSAGES.category(categoryLabel);
      }
      case 'global':
      default:
        return EMPTY_STATE_MESSAGES.global;
    }
  };

  // viewport나 global 타입에서만 "가장 가까운 장소 탐색" 버튼 표시
  const showNearestButton = (type === 'viewport' || type === 'global') && onExploreNearest;

  // global 타입에서만 "첫 장소 추가하기" 버튼 표시
  const showAddFirstPlaceButton = type === 'global' && isAuthenticated && onAddFirstPlace;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 max-w-md px-4">
      <div className="bg-white rounded-lg shadow-lg border border-border px-6 py-4 relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 hover:bg-muted rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="닫기"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClose();
              }
            }}
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground mb-1">
              {getMessage()}
            </p>
            <div className="space-y-2">
              {/* 첫 번째 메시지 */}
              <p className="text-xs text-muted-foreground">
                {isAuthenticated ? (
                  ACTION_MESSAGES.moveMap
                ) : (
                  <>
                    <button
                      onClick={onLoginClick}
                      className="text-primary-600 hover:text-primary-700 underline inline-flex items-center gap-1"
                    >
                      <LogIn className="w-3 h-3" />
                      {ACTION_MESSAGES.login}
                    </button>
                    {' '}{ACTION_MESSAGES.addFirstPlace}
                  </>
                )}
              </p>

              {/* "첫 장소 추가하기" 버튼 */}
              {showAddFirstPlaceButton && (
                <button
                  onClick={onAddFirstPlace}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white hover:bg-primary-dark rounded-md transition-colors text-xs font-medium shadow-md hover:shadow-lg"
                >
                  <Plus className="w-3 h-3" />
                  첫 장소 추가하기
                </button>
              )}

              {/* "등록된 장소 중 가장 가까운 곳으로 이동" 버튼 */}
              {showNearestButton && (
                <button
                  onClick={onExploreNearest}
                  disabled={isLoadingNearest}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors text-xs font-medium"
                >
                  <Navigation className="w-3 h-3" />
                  {isLoadingNearest ? ACTION_MESSAGES.loading : ACTION_MESSAGES.exploreNearest}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
