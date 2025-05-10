'use client';

import { useState, useCallback} from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Place } from '@/entities/place/types';

interface PlaceMapProps {
  places: Place[];
  userLocation?: { lat: number; lng: number } | null;
  selectedPlace?: Place | null;
  onPlaceAdd?: (placeData: Partial<Place>) => Promise<void>;
  onPlaceSelect?: (place: Place) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 37.5665, // 서울 좌표
  lng: 126.9780
};

// 카테고리별 마커 색상
const categoryColors = {
  '음식점': 'red',
  '관광지': 'blue',
  '쇼핑': 'purple',
  '숙소': 'orange',
  '기타': 'green'
};

export function PlaceMap({ 
  places, 
  userLocation, 
  selectedPlace,
  onPlaceAdd,
  onPlaceSelect 
}: PlaceMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [infoWindowData, setInfoWindowData] = useState<Place | null>(null);
  const [searchBoxInput, setSearchBoxInput] = useState<HTMLInputElement | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);
  
  const onSearchBoxLoad = useCallback((ref: HTMLInputElement) => {
    setSearchBoxInput(ref);
    if (window.google && ref) {
      const searchBox = new window.google.maps.places.SearchBox(ref);
      setSearchBox(searchBox);

      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (places && places.length > 0) {
          const place = places[0];
          if (place.geometry && place.geometry.location) {
            // 지도 중심 이동
            map?.setCenter(place.geometry.location);
            map?.setZoom(15);
            
            // 장소 추가 준비
            if (onPlaceAdd && place.name && place.formatted_address) {
              setInfoWindowData({
                id: 'new', // 임시 ID
                owner_id: '', // 실제 저장 시 서버에서 설정
                name: place.name,
                address: place.formatted_address,
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
                category: '기타', // 기본값
                notes: '',
                rating: 0,
                is_public: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as Place);
            }
          }
        }
      });
    }
  }, [map, onPlaceAdd]);
  
  // 새 장소 추가
  const handleAddPlace = async () => {
    if (onPlaceAdd && infoWindowData && infoWindowData.id === 'new') {
      try {
        await onPlaceAdd({
          name: infoWindowData.name,
          address: infoWindowData.address,
          latitude: infoWindowData.latitude,
          longitude: infoWindowData.longitude,
          category: infoWindowData.category || '기타',
          notes: infoWindowData.notes || ''
        });
        
        setInfoWindowData(null);
        if (searchBoxInput) {
          searchBoxInput.value = '';
        }
      } catch (err) {
        console.error('장소 추가 오류:', err);
        alert('장소를 추가하는 중 오류가 발생했습니다.');
      }
    }
  };
  
  // 기존 장소 클릭
  const handleMarkerClick = (place: Place) => {
    setInfoWindowData(place);
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
  };
  
  if (loadError) {
    return <div className="p-4">지도를 불러오는 중 오류가 발생했습니다.</div>;
  }
  
  if (!isLoaded || searchBox == null) {
    return <div className="p-4">지도를 불러오는 중...</div>;
  }

  return (
    <div className="h-full relative">
      <div className="absolute top-4 left-0 right-0 z-10 px-4">
        <input
          ref={onSearchBoxLoad}
          type="text"
          placeholder="장소 검색..."
          className="w-full px-4 py-2 border rounded-md shadow-sm"
        />
      </div>
      
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation || selectedPlace ? 
          { 
            lat: userLocation?.lat || selectedPlace?.latitude || defaultCenter.lat, 
            lng: userLocation?.lng || selectedPlace?.longitude || defaultCenter.lng 
          } : 
          defaultCenter
        }
        zoom={userLocation || selectedPlace ? 15 : 13}
        onLoad={onMapLoad}
      >
        {/* 사용자 위치 마커 */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: '/images/user-location.svg',
              scaledSize: new window.google.maps.Size(24, 24)
            }}
          />
        )}
        
        {/* 장소 마커 */}
        {places.map((place) => (
          <Marker
            key={place.id}
            position={{
              lat: place.latitude,
              lng: place.longitude
            }}
            onClick={() => handleMarkerClick(place)}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: categoryColors[place.category as keyof typeof categoryColors] || 'gray',
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: 'white',
              scale: 10
            }}
          />
        ))}
        
        {/* 정보 창 */}
        {infoWindowData && (
          <InfoWindow
            position={{
              lat: infoWindowData.latitude,
              lng: infoWindowData.longitude
            }}
            onCloseClick={() => setInfoWindowData(null)}
          >
            <div className="p-2 max-w-[300px]">
              <h3 className="text-lg font-semibold">{infoWindowData.name}</h3>
              <p className="text-sm text-gray-600">{infoWindowData.address}</p>
              
              {infoWindowData.id === 'new' ? (
                <div className="mt-2">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">카테고리</label>
                    <select
                      value={infoWindowData.category}
                      onChange={(e) => setInfoWindowData({
                        ...infoWindowData,
                        category: e.target.value
                      })}
                      className="w-full p-1 border rounded text-sm"
                    >
                      <option value="음식점">음식점</option>
                      <option value="관광지">관광지</option>
                      <option value="쇼핑">쇼핑</option>
                      <option value="숙소">숙소</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">메모</label>
                    <textarea
                      value={infoWindowData.notes || ''}
                      onChange={(e) => setInfoWindowData({
                        ...infoWindowData,
                        notes: e.target.value
                      })}
                      className="w-full p-1 border rounded text-sm"
                      rows={2}
                    />
                  </div>
                  
                  <button
                    onClick={handleAddPlace}
                    className="w-full mt-1 px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    관심 장소로 추가
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  {infoWindowData.notes && (
                    <p className="text-sm mt-1">{infoWindowData.notes}</p>
                  )}
                  <div className="mt-1 flex items-center">
                    <span className="text-sm text-gray-700">카테고리: {infoWindowData.category}</span>
                    {infoWindowData.rating && infoWindowData.rating > 0 && (
                      <div className="ml-2 flex">
                        {Array.from({ length: infoWindowData.rating }).map((_, i) => (
                          <span key={i} className="text-yellow-400">★</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}