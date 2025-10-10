import { X, MapPin } from 'lucide-react';
import type { Place } from '#types/place';
import type { MapProvider } from '#types/map';
import PlaceCard from './PlaceCard';

interface PlaceListSidebarProps {
  places: Place[];
  selectedPlaceId?: string;
  mapProvider: MapProvider;
  searchProvider: MapProvider;
  onPlaceClick: (place: Place) => void;
  onPlaceDelete?: (place: Place) => void;
  onMapProviderChange: (provider: MapProvider) => void;
  onSearchProviderChange: (provider: MapProvider) => void;
  onClose: () => void;
}

export default function PlaceListSidebar({
  places,
  selectedPlaceId,
  mapProvider,
  searchProvider,
  onPlaceClick,
  onPlaceDelete,
  onMapProviderChange,
  onSearchProviderChange,
  onClose,
}: PlaceListSidebarProps) {
  return (
    <div className="w-full md:w-80 h-full bg-card border-r border-border flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">
              내 장소 <span className="text-muted-foreground text-sm">({places.length})</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="사이드바 닫기"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Map Provider Toggle */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2">지도 제공자</p>
          <div className="flex gap-2">
            <button
              onClick={() => onMapProviderChange('kakao')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mapProvider === 'kakao'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              카카오맵
            </button>
            <button
              onClick={() => onMapProviderChange('google')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mapProvider === 'google'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              구글맵
            </button>
          </div>
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
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MapPin className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm mb-1">아직 추가된 장소가 없습니다</p>
            <p className="text-muted-foreground text-xs">검색하여 장소를 추가해보세요</p>
          </div>
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
