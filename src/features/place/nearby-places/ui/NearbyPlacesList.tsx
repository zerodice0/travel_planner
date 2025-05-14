import { Place } from '@/entities/place/types';

interface NearbyPlacesListProps {
  places: Place[];
  userLocation: { lat: number; lng: number } | null;
  onPlaceSelect?: (place: Place) => void;
}

// 지구 반경 (km)
const EARTH_RADIUS = 6371;

export function NearbyPlacesList({ places, userLocation, onPlaceSelect }: NearbyPlacesListProps) {
  // 거리 계산 함수 (하버사인 공식)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return EARTH_RADIUS * c;
  };

  if (!userLocation) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">위치 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">주변에 저장된 관심 장소가 없습니다.</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">다른 지역으로 이동하거나 더 많은 장소를 추가해보세요.</p>
      </div>
    );
  }

  // 사용자 위치로부터의 거리 계산 및 정렬
  const placesWithDistance = places.map(place => {
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      place.latitude, place.longitude
    );
    
    return { ...place, distance };
  }).sort((a, b) => a.distance - b.distance);

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm mb-2 dark:text-white">가까운 관심 장소</h3>
      
      {placesWithDistance.map(place => (
        <div 
          key={place.id}
          className="border dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          onClick={() => onPlaceSelect && onPlaceSelect(place)}
        >
          <div className="flex justify-between">
            <h4 className="font-medium dark:text-white">{place.name}</h4>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
              {place.distance.toFixed(1)}km
            </span>
          </div>
          
          <div className="mt-1 flex items-center">
            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full dark:text-gray-300">
              {place.category}
            </span>
            {place.rating && (
              <div className="ml-2 text-xs text-yellow-500 dark:text-yellow-400">
                {Array.from({ length: place.rating }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            )}
          </div>
          
          {place.memo && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{place.memo}</p>
          )}
        </div>
      ))}
    </div>
  );
}