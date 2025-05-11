'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries } from '@react-google-maps/api';
import { Place } from '@/entities/place/types';
import { useTheme } from '@/shared/providers/ThemeProvider';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  border: '1px solid #ccc'
};

const defaultCenter = {
  lat: 37.5665, // 서울 좌표
  lng: 126.9780
};

// 카테고리별 이모지/아이콘 정의
const categoryIcons = {
  '음식점': '🍽️',
  '관광지': '🏞️',
  '쇼핑': '🛍️',
  '숙소': '🏨',
  '기타': '📍'
};

// 카테고리별 마커 색상 (배경색으로 사용)
const categoryColors = {
  '음식점': '#FF5252', // 빨간색
  '관광지': '#448AFF', // 파란색
  '쇼핑': '#AB47BC', // 보라색
  '숙소': '#FF9800', // 주황색
  '기타': '#4CAF50'  // 초록색
};

interface PlaceMapProps {
  places: Place[];
  userLocation?: { lat: number; lng: number } | null;
  selectedPlace?: Place | null;
  onPlaceAdd?: (placeData: Omit<Place, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => Promise<void>;
  onPlaceSelect?: (place: Place) => void;
  onPlaceUpdate?: (place: Place) => Promise<void>;
}

const libraries: Libraries = ['places'];

export function PlaceMap({ 
  places, 
  userLocation, 
  selectedPlace,
  onPlaceAdd,
  onPlaceSelect,
  onPlaceUpdate
}: PlaceMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: libraries
  });
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [infoWindowData, setInfoWindowData] = useState<Place | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const [customLabel, setCustomLabel] = useState<string>('');
  const [editingInfoWindowLabel, setEditingInfoWindowLabel] = useState<boolean>(false);
  const [newInfoWindowLabel, setNewInfoWindowLabel] = useState<string>('');
  const { theme } = useTheme();
  
  // 메모 수정 상태 추가
  const [editingNotes, setEditingNotes] = useState<boolean>(false);
  const [newNotes, setNewNotes] = useState<string>('');

  useEffect(() => {
    if (selectedPlace && map) {
      console.log('지도 이동:', selectedPlace.name);
      
      map.setCenter({
        lat: selectedPlace.latitude,
        lng: selectedPlace.longitude
      });
      
      map.setZoom(16);
      
      setInfoWindowData(selectedPlace);
    }
  }, [selectedPlace, map]);
  
  useEffect(() => {
    setEditingInfoWindowLabel(false);
    setEditingNotes(false); // 메모 편집 상태 초기화
    
    if (infoWindowData) {
      setNewInfoWindowLabel(infoWindowData.custom_label || '');
      setNewNotes(infoWindowData.notes || ''); // 메모 상태 초기화
    }
  }, [infoWindowData]);

  // 지도 스타일 설정을 위한 useEffect
  useEffect(() => {
    if (map) {
      // 다크 모드일 때 지도 스타일 적용
      const darkModeStyle = [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
          featureType: "administrative.locality",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [{ color: "#263c3f" }],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6b9a76" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#38414e" }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#212a37" }],
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9ca5b3" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#746855" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry.stroke",
          stylers: [{ color: "#1f2835" }],
        },
        {
          featureType: "road.highway",
          elementType: "labels.text.fill",
          stylers: [{ color: "#f3d19c" }],
        },
        {
          featureType: "transit",
          elementType: "geometry",
          stylers: [{ color: "#2f3948" }],
        },
        {
          featureType: "transit.station",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#17263c" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.fill",
          stylers: [{ color: "#515c6d" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#17263c" }],
        },
      ];

      // 테마에 따라 지도 스타일 설정
      map.setOptions({
        styles: theme === 'dark' ? darkModeStyle : []
      });
    }
  }, [map, theme]);
  
  const onMapLoad = useCallback((map: google.maps.Map) => {
    console.log('Google Map 인스턴스 로드됨');
    setMap(map);
    
    console.log('맵 중심 좌표:', map.getCenter()?.toJSON());
    console.log('맵 줌 레벨:', map.getZoom());
  }, []);
  
  // Autocomplete 초기화 및 설정
  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    
    // 장소 선택 이벤트 리스너
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        console.log("선택된 장소에 지오메트리 정보가 없습니다.");
        return;
      }
      
      // 지도 중심 이동
      map?.setCenter(place.geometry.location);
      map?.setZoom(15);
      
      // 장소 추가 준비
      if (onPlaceAdd && place.name && place.formatted_address) {
        setInfoWindowData({
          id: 'new',
          owner_id: '',
          name: place.name,
          address: place.formatted_address,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          category: '기타', // 기본값
          notes: '',
          rating: 0,
          is_public: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          custom_label: customLabel
        } as Place);
      }
      
      // 검색창 초기화 (선택적)
      if (autocompleteInputRef.current) {
        autocompleteInputRef.current.value = '';
      }
    });
  }, [map, onPlaceAdd, customLabel]);
  
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
          notes: infoWindowData.notes || '',
          rating: infoWindowData.rating || 0,
          is_public: false,
          custom_label: customLabel || ''
        });
        
        setInfoWindowData(null);
        setCustomLabel('');
        if (autocompleteInputRef.current) {
          autocompleteInputRef.current.value = '';
        }
      } catch (err) {
        console.error('장소 추가 오류:', err);
        alert('장소를 추가하는 중 오류가 발생했습니다.');
      }
    }
  };
  
  // 기존 장소 클릭
  const handleMarkerClick = (place: Place) => {
    if (infoWindowData && infoWindowData.id === place.id) {
      setInfoWindowData(null);
    } else {
      setInfoWindowData(place);
      
      if (map) {
        map.setCenter({
          lat: place.latitude,
          lng: place.longitude
        });
      }
      
      if (onPlaceSelect) {
        onPlaceSelect(place);
      }
    }
  };
  
  // 정보창에서 라벨 편집 시작
  const handleStartEditLabelInInfoWindow = () => {
    if (infoWindowData) {
      setEditingInfoWindowLabel(true);
      setNewInfoWindowLabel(infoWindowData.custom_label || '');
    }
  };
  
  // 정보창에서 라벨 저장
  const handleSaveLabelInInfoWindow = async () => {
    if (!infoWindowData || !onPlaceUpdate) return;
    
    try {
      setEditingInfoWindowLabel(false);
      
      const updatedPlace = {
        ...infoWindowData,
        custom_label: newInfoWindowLabel || ''
      };
      
      console.log('정보창 라벨 업데이트 요청:', updatedPlace);
      await onPlaceUpdate(updatedPlace);
    } catch (error) {
      console.error('라벨 업데이트 오류:', error);
      setEditingInfoWindowLabel(true);
      alert('라벨 업데이트에 실패했습니다. 다시 시도해주세요.');
    }
  };
  
  // 메모 편집 시작
  const handleStartEditNotes = () => {
    if (infoWindowData) {
      setEditingNotes(true);
      setNewNotes(infoWindowData.notes || '');
    }
  };
  
  // 메모 저장
  const handleSaveNotes = async () => {
    if (!infoWindowData || !onPlaceUpdate) return;
    
    try {
      setEditingNotes(false);
      
      const updatedPlace = {
        ...infoWindowData,
        notes: newNotes || ''
      };
      
      console.log('메모 업데이트 요청:', updatedPlace);
      await onPlaceUpdate(updatedPlace);
    } catch (error) {
      console.error('메모 업데이트 오류:', error);
      setEditingNotes(true);
      alert('메모 업데이트에 실패했습니다. 다시 시도해주세요.');
    }
  };
  
  // 사용자 정의 마커 레이블 생성 함수
  const createCustomMarkerLabel = (place: Place) => {
    const categoryIcon = categoryIcons[place.category as keyof typeof categoryIcons] || '📍';
    const hasCustomLabel = place.custom_label && place.custom_label.trim() !== '';
    
    // 커스텀 라벨이 있는 경우 아이콘+라벨 형태로, 없으면 아이콘만
    const labelText = hasCustomLabel 
      ? `${categoryIcon} ${place.custom_label}`
      : categoryIcon;
    
    return {
      text: labelText,
      color: 'white',
      fontSize: '14px',
      fontWeight: 'bold',
      className: 'custom-marker-label'
    };
  };
  
  // 사용자 정의 마커 아이콘 생성 함수
  const createCustomMarkerIcon = (place: Place) => {
    // 카테고리에 따른 배경색 설정
    const backgroundColor = categoryColors[place.category as keyof typeof categoryColors] || '#4CAF50';
    
    // SVG 마커 생성 (배경색 + 그림자 효과)
    const svgMarker = {
      path: 'M-1.5,-3.5a5,5 0 1,0 10,0a5,5 0 1,0 -10,0', // 원형 마커
      fillColor: backgroundColor,
      fillOpacity: 0.9,
      strokeWeight: 1,
      strokeColor: '#FFFFFF',
      scale: 2.5,
      // 그림자 효과 추가
      shadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
    };
    
    return svgMarker;
  };
  
  if (loadError) {
    return <div className="p-4 dark:text-gray-300">지도를 불러오는 중 오류가 발생했습니다.</div>;
  }
  
  if (!isLoaded) {
    return <div className="p-4 dark:text-gray-300">지도를 불러오는 중...</div>;
  }

  return (
    <div className="h-full relative">
      <div className="absolute top-4 left-0 right-0 z-10 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-2 flex flex-col gap-2 transition-colors">
          <div className="flex justify-between items-center">
            {/* Autocomplete 사용 */}
            <input
              ref={autocompleteInputRef}
              type="text"
              placeholder="장소 검색..."
              className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              onLoad={(e) => {
                // Autocomplete 인스턴스 생성 및 설정
                if (window.google && e.currentTarget) {
                  const autocompleteInstance = new window.google.maps.places.Autocomplete(
                    e.currentTarget,
                    { 
                      fields: ['name', 'geometry', 'formatted_address'],
                      componentRestrictions: { country: 'kr' } // 한국 지역으로 제한 (선택적)
                    }
                  );
                  onAutocompleteLoad(autocompleteInstance);
                }
              }}
            />
          </div>
          
          {infoWindowData && infoWindowData.id === 'new' && (
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="장소 라벨 입력 (선택사항)"
              className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          )}
        </div>
      </div>
      
      {/* 커스텀 마커 스타일 */}
      <style jsx global>{`
        .custom-marker-label {
          background-color: rgba(0, 0, 0, 0.7);
          padding: 3px 6px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          white-space: nowrap;
          text-align: center;
          transform: translateY(-24px);
        }
        .dark .gm-style .gm-style-iw-c {
          background-color: #1f2937;
          color: #e5e7eb;
        }
        .dark .gm-style .gm-style-iw-d {
          background-color: #1f2937;
          color: #e5e7eb;
        }
        .dark .gm-style .gm-style-iw-t::after {
          background: #1f2937;
        }
        
        /* 커스텀 스크롤바 스타일 */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-light::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .scrollbar-light::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .scrollbar-light::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        .scrollbar-dark::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 3px;
        }
        
        .scrollbar-dark::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }
        
        .scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
      
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation || selectedPlace ? 
          { 
            lat: userLocation?.lat || selectedPlace?.latitude || defaultCenter.lat, 
            lng: userLocation?.lng || selectedPlace?.longitude || defaultCenter.lng 
          } : 
          defaultCenter
        }
        zoom={13}
        onLoad={onMapLoad}
        options={{
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          streetViewControl: false,
        }}
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
        
        {/* 저장된 장소 마커들 */}
        {places.map((place) => (
          <Marker
            key={place.id}
            position={{
              lat: place.latitude,
              lng: place.longitude
            }}
            onClick={() => handleMarkerClick(place)}
            icon={createCustomMarkerIcon(place)}
            label={createCustomMarkerLabel(place)}
            // 선택된 장소는 Z-인덱스를 높여서 우선 표시
            zIndex={selectedPlace?.id === place.id ? 1000 : undefined}
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
            options={{
              pixelOffset: new window.google.maps.Size(0, -30),
              maxWidth: 300,
            }}
          >
            <div className={`p-3 max-w-[280px] ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold truncate">{infoWindowData.name}</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} line-clamp-2 mb-1`}>{infoWindowData.address}</p>
              
              {/* 라벨 표시 및 편집 영역 */}
              {editingInfoWindowLabel ? (
                <div className="mt-2 flex items-center">
                  <input
                    type="text"
                    value={newInfoWindowLabel}
                    onChange={(e) => setNewInfoWindowLabel(e.target.value)}
                    className={`text-sm p-1 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    placeholder="라벨 입력..."
                    autoFocus
                  />
                  <button
                    onClick={handleSaveLabelInInfoWindow}
                    className={`ml-1 text-xs ${theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-800'} p-1`}
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingInfoWindowLabel(false)}
                    className={`ml-1 text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} p-1`}
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex items-center">
                  {infoWindowData.custom_label ? (
                    <>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400 bg-blue-900/50' : 'text-blue-600 bg-blue-50'} px-2 py-0.5 rounded-full`}>
                        {categoryIcons[infoWindowData.category as keyof typeof categoryIcons]} {infoWindowData.custom_label}
                      </span>
                      {onPlaceUpdate && (
                        <button
                          onClick={handleStartEditLabelInInfoWindow}
                          className={`ml-1 text-xs ${theme === 'dark' ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'} p-1`}
                          title="라벨 편집"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      )}
                    </>
                  ) : (
                    onPlaceUpdate && (
                      <button
                        onClick={handleStartEditLabelInInfoWindow}
                        className={`text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300 border-gray-600' : 'text-gray-500 hover:text-gray-700 border-gray-300'} px-2 py-0.5 rounded-full border border-dashed`}
                      >
                        {categoryIcons[infoWindowData.category as keyof typeof categoryIcons]} 라벨 추가
                      </button>
                    )
                  )}
                </div>
              )}
              
              {infoWindowData.id === 'new' ? (
                <div className="mt-2">
                  <div className="mb-2">
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : ''}`}>카테고리</label>
                    <select
                      value={infoWindowData.category}
                      onChange={(e) => setInfoWindowData({
                        ...infoWindowData,
                        category: e.target.value
                      })}
                      className={`w-full p-1 border rounded text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    >
                      <option value="음식점">🍽️ 음식점</option>
                      <option value="관광지">🏞️ 관광지</option>
                      <option value="쇼핑">🛍️ 쇼핑</option>
                      <option value="숙소">🏨 숙소</option>
                      <option value="기타">📍 기타</option>
                    </select>
                  </div>
                  
                  <div className="mb-2">
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : ''}`}>메모</label>
                    <textarea
                      value={infoWindowData.notes || ''}
                      onChange={(e) => setInfoWindowData({
                        ...infoWindowData,
                        notes: e.target.value
                      })}
                      className={`w-full p-1 border rounded text-sm max-h-[100px] ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      rows={2}
                    />
                  </div>
                  
                  <button
                    onClick={handleAddPlace}
                    className="w-full mt-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    관심 장소로 추가
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>메모</h4>
                    {!editingNotes && onPlaceUpdate && (
                      <button
                        onClick={handleStartEditNotes}
                        className={`text-xs ${theme === 'dark' ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'} p-1`}
                        title="메모 편집"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {editingNotes ? (
                    <div className="mt-1">
                      <textarea
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        className={`w-full p-1 border rounded text-sm max-h-[120px] ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                        rows={3}
                        placeholder="메모를 입력하세요..."
                        autoFocus
                      />
                      <div className="flex justify-end mt-1">
                        <button
                          onClick={handleSaveNotes}
                          className={`ml-1 text-xs ${theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-800'} px-2 py-1 rounded`}
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingNotes(false)}
                          className={`ml-1 text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} px-2 py-1 rounded`}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-sm mt-1 max-h-[120px] overflow-y-auto custom-scrollbar ${theme === 'dark' ? 'scrollbar-dark' : 'scrollbar-light'}`}>
                      <p className={`whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                        {infoWindowData.notes || 
                          <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} italic`}>메모가 없습니다. 편집 버튼을 클릭하여 메모를 추가하세요.</span>
                        }
                      </p>
                    </div>
                  )}
                  
                  <div className={`my-2 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>
                  
                  <div className="flex items-center justify-between">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {categoryIcons[infoWindowData.category as keyof typeof categoryIcons]} {infoWindowData.category}
                    </div>
                    {infoWindowData.rating && infoWindowData.rating > 0 && (
                      <div className="flex">
                        {Array.from({ length: infoWindowData.rating }).map((_, i) => (
                          <span key={i} className={`${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-400'}`}>★</span>
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