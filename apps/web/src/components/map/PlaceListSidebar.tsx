import { X, MapPin, Navigation } from 'lucide-react';
import type { Place } from '#types/place';
import type { MapProvider } from '#types/map';
import type { PlaceViewTab } from './PlaceViewTabs';
import type { List } from '#types/list';
import PlaceCard from './PlaceCard';

interface PlaceListSidebarProps {
  places: Place[];
  totalPlaces: number;
  selectedPlaceId?: string;
  searchProvider: MapProvider;
  activeTab: PlaceViewTab;
  selectedListId?: string | null;
  lists?: List[];
  onPlaceClick: (place: Place) => void;
  onPlaceDelete?: (place: Place) => void;
  onSearchProviderChange: (provider: MapProvider) => void;
  onClose: () => void;
  onNavigateToNearest?: () => void;
}

export default function PlaceListSidebar({
  places,
  totalPlaces,
  selectedPlaceId,
  searchProvider,
  activeTab,
  selectedListId,
  lists,
  onPlaceClick,
  onPlaceDelete,
  onSearchProviderChange,
  onClose,
  onNavigateToNearest,
}: PlaceListSidebarProps) {
  // 선택된 리스트 찾기
  const selectedList = selectedListId && lists
    ? lists.find(list => list.id === selectedListId)
    : null;

  // 탭별 제목 결정
  const title = activeTab === 'explore'
    ? '공개 장소'
    : selectedList
      ? `내 장소 > ${selectedList.name}`
      : '내 장소';

  return (
    <div className="w-full md:w-80 h-full bg-card border-r border-border flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">
                {title} <span className="text-muted-foreground text-sm">({totalPlaces})</span>
              </h2>
            </div>
            {places.length < totalPlaces && (
              <p className="text-xs text-muted-foreground mt-1 ml-7">
                현재 지도 영역 내 {places.length}개
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="사이드바 닫기"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Search Provider Toggle */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">검색 제공자</p>
          <div className="flex gap-2">
            <button
              onClick={() => onSearchProviderChange('kakao')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchProvider === 'kakao'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              카카오 검색
            </button>
            <button
              onClick={() => onSearchProviderChange('google')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchProvider === 'google'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              구글 검색
            </button>
          </div>
        </div>
      </div>

      {/* Place List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {places.length === 0 ? (
          totalPlaces === 0 ? (
            // Case 1: 전체적으로 장소가 없음
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <MapPin className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm mb-1">
                {activeTab === 'explore'
                  ? '공개 장소가 없습니다'
                  : '아직 추가한 장소가 없습니다'}
              </p>
              <p className="text-muted-foreground text-xs">
                {activeTab === 'explore'
                  ? '새로운 장소를 발견해보세요'
                  : '검색하여 장소를 추가해보세요'}
              </p>
            </div>
          ) : (
            // Case 2: viewport에만 장소가 없음 (다른 지역에 장소가 있음)
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <MapPin className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm mb-2">
                {activeTab === 'explore'
                  ? '이 지역에는 공개 장소가 없습니다'
                  : '이 지역에는 장소가 없습니다'}
              </p>
              <p className="text-muted-foreground text-xs mb-4">
                다른 지역에 <span className="font-semibold text-foreground">{totalPlaces}개</span>의
                {activeTab === 'explore' ? ' 공개 장소가' : ' 장소가 저장되어'} 있습니다
              </p>
              {onNavigateToNearest && (
                <button
                  onClick={onNavigateToNearest}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  가장 가까운 장소 보기
                </button>
              )}
            </div>
          )
        ) : (
          places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              isSelected={selectedPlaceId === place.id}
              onClick={onPlaceClick}
              onDelete={onPlaceDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
