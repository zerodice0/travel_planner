import { MapPin, LogIn } from 'lucide-react';

interface FloatingEmptyNoticeProps {
  type: 'viewport' | 'category' | 'global';
  category?: string;
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: '음식점',
  cafe: '카페',
  attraction: '관광지',
  accommodation: '숙소',
  shopping: '쇼핑',
  culture: '문화시설',
  nature: '자연',
  etc: '기타',
};

export function FloatingEmptyNotice({
  type,
  category,
  isAuthenticated,
  onLoginClick,
}: FloatingEmptyNoticeProps) {
  const getMessage = () => {
    switch (type) {
      case 'viewport':
        return '현재 위치에는 등록된 장소가 없습니다';
      case 'category':
        const categoryLabel = category ? CATEGORY_LABELS[category] || category : '카테고리';
        return `아직 이 ${categoryLabel}에는 등록된 장소가 없습니다`;
      case 'global':
      default:
        return '아직 등록된 장소가 없습니다';
    }
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 max-w-md">
      <div className="bg-white rounded-lg shadow-lg border border-border px-6 py-4">
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
            <p className="text-xs text-muted-foreground">
              {isAuthenticated ? (
                '지도를 이동하여 다른 지역을 탐색해보세요'
              ) : (
                <>
                  <button
                    onClick={onLoginClick}
                    className="text-primary-600 hover:text-primary-700 underline inline-flex items-center gap-1"
                  >
                    <LogIn className="w-3 h-3" />
                    로그인
                  </button>
                  {' '}하고 첫 장소를 추가해보세요
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
