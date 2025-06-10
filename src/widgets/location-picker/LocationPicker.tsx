'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Libraries } from '@react-google-maps/api';
import { AlertDialog, useAlertDialog } from '@/shared/ui/AlertDialog';

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const libraries: Libraries = ['places', 'geocoding'];

interface LocationPickerProps {
  initialCenter?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

export function LocationPicker({ 
  initialCenter = { lat: 37.5665, lng: 126.9780 }, // 서울 기본값
  onLocationSelect,
  selectedLocation 
}: LocationPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: libraries
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    selectedLocation || null
  );
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  
  // AlertDialog 훅 사용
  const { dialog: alertDialog, showAlert, hideAlert } = useAlertDialog();

  // Google Maps 로드 시 geocoder 초기화
  useEffect(() => {
    if (isLoaded && window.google) {
      setGeocoder(new window.google.maps.Geocoder());
    }
  }, [isLoaded]);

  // selectedLocation prop이 변경될 때 마커 위치 업데이트
  useEffect(() => {
    if (selectedLocation) {
      setMarkerPosition(selectedLocation);
      if (map) {
        map.setCenter(selectedLocation);
      }
    }
  }, [selectedLocation, map]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    map.setCenter(selectedLocation || initialCenter);
  }, [initialCenter, selectedLocation]);

  // 지도 클릭 시 위치 선택
  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const newPosition = { lat, lng };
      
      setMarkerPosition(newPosition);
      
      // Geocoding으로 주소 가져오기 (참조용)
      if (geocoder) {
        geocoder.geocode({ location: newPosition }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            onLocationSelect({
              ...newPosition,
              address: results[0].formatted_address
            });
          } else {
            onLocationSelect(newPosition);
          }
        });
      } else {
        onLocationSelect(newPosition);
      }
    }
  }, [geocoder, onLocationSelect]);

  // 주소 검색 기능 (참조용)
  const handleAddressSearch = useCallback(() => {
    if (!geocoder || !searchAddress.trim()) return;

    setIsSearching(true);
    
    geocoder.geocode({ address: searchAddress }, (results, status) => {
      setIsSearching(false);
      
      if (status === 'OK' && results?.[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const newPosition = { lat, lng };
        
        setMarkerPosition(newPosition);
        onLocationSelect({
          ...newPosition,
          address: results[0].formatted_address
        });
        
        // 지도 중심 이동
        if (map) {
          map.setCenter(newPosition);
          map.setZoom(15);
        }
      } else {
        showAlert('검색 실패', '주소를 찾을 수 없습니다. 다른 주소를 입력해주세요.', '🔍');
      }
    });
  }, [geocoder, searchAddress, map, onLocationSelect, showAlert]);

  // Enter 키로 검색
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddressSearch();
    }
  };

  // 현재 위치 가져오기
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setMarkerPosition(newPosition);
          onLocationSelect(newPosition);
          
          if (map) {
            map.setCenter(newPosition);
            map.setZoom(15);
          }
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
          showAlert('위치 접근 실패', '위치 정보에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.', '📍');
        }
      );
    } else {
      showAlert('지원되지 않음', '이 브라우저는 위치 정보를 지원하지 않습니다.', '❌');
    }
  }, [map, onLocationSelect, showAlert]);

  if (loadError) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
        <div className="text-red-600 dark:text-red-400 text-2xl mb-2">🚫</div>
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
          Google Maps를 불러올 수 없습니다
        </h3>
        <p className="text-sm text-red-600 dark:text-red-300">
          API 키 문제 또는 네트워크 오류로 지도를 표시할 수 없습니다.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-6 dark:text-gray-300 h-[400px] flex flex-col items-center justify-center">
        <div className="animate-spin text-2xl mb-3">🔄</div>
        <p>지도를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색 및 컨트롤 */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          <input
            ref={autocompleteInputRef}
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="주소나 장소명으로 검색 (참조용)"
            className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 text-sm"
          />
          <button
            onClick={handleAddressSearch}
            disabled={isSearching || !searchAddress.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm transition-colors"
          >
            {isSearching ? '검색중...' : '검색'}
          </button>
        </div>
        <button
          onClick={getCurrentLocation}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm transition-colors flex items-center gap-1"
        >
          📍 현재 위치
        </button>
      </div>

      {/* 안내 메시지 */}
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
        💡 <strong>사용법:</strong>
        <ul className="mt-1 ml-4 list-disc">
          <li>지도를 클릭하여 정확한 위치를 선택하세요</li>
          <li>검색 기능은 대략적인 위치 참조용입니다</li>
          <li>선택한 위치가 여행의 지도 초기 중심점이 됩니다</li>
        </ul>
      </div>

      {/* 지도 */}
      <div className="border rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={markerPosition || initialCenter}
          zoom={13}
          onLoad={onMapLoad}
          onClick={onMapClick}
          options={{
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: true,
            streetViewControl: false,
          }}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={true}
              onDragEnd={(event) => {
                if (event.latLng) {
                  const lat = event.latLng.lat();
                  const lng = event.latLng.lng();
                  const newPosition = { lat, lng };
                  
                  setMarkerPosition(newPosition);
                  
                  // 드래그 종료 시에도 geocoding으로 주소 업데이트
                  if (geocoder) {
                    geocoder.geocode({ location: newPosition }, (results, status) => {
                      if (status === 'OK' && results?.[0]) {
                        onLocationSelect({
                          ...newPosition,
                          address: results[0].formatted_address
                        });
                      } else {
                        onLocationSelect(newPosition);
                      }
                    });
                  } else {
                    onLocationSelect(newPosition);
                  }
                }
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* 선택된 위치 정보 */}
      {markerPosition && (
        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
          <strong>선택된 위치:</strong> 위도 {markerPosition.lat.toFixed(6)}, 경도 {markerPosition.lng.toFixed(6)}
        </div>
      )}
      
      {/* AlertDialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        icon={alertDialog.icon}
        buttonText={alertDialog.buttonText}
        onClose={hideAlert}
      />
    </div>
  );
}