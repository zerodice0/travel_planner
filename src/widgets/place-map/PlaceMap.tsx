'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries } from '@react-google-maps/api';
import { Place } from '@/entities/place/types';
import { useTheme } from '@/shared/providers/ThemeProvider';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 37.5665, // 서울 좌표
  lng: 126.9780
};

// 카테고리별 이모지/아이콘 정의
const categoryIcons = {
  '음식점': '🍽️',
  '카페': '☕️',
  '관광지': '🏞️',
  '쇼핑': '🛍️',
  '숙소': '🏨',
  '기타': '📍'
};

interface PlaceMapProps {
  places: Place[];
  userLocation?: { lat: number; lng: number } | null;
  selectedPlace?: Place | null;
  onPlaceAdd?: (placeData: Omit<Place, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => Promise<void>;
  onPlaceSelect?: (place: Place) => void;
  onPlaceUpdate?: (place: Place) => Promise<void>;
}

const libraries: Libraries = ['places', 'geocoding'];

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
  
  // loadError 디버깅을 위한 코드
  useEffect(() => {
    if (loadError) {
      console.error('Google Maps API 로드 오류:', loadError);
      // API 키가 설정되어 있는지 확인 (보안을 위해 전체 키는 출력하지 않음)
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      console.log('API 키 설정 여부:', apiKey ? `설정됨 (${apiKey.substring(0, 4)}...)` : '설정되지 않음');
    }
  }, [loadError]);
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [infoWindowData, setInfoWindowData] = useState<Place | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const [editingInfoWindowLabel, setEditingInfoWindowLabel] = useState<boolean>(false);
  const [newInfoWindowLabel, setNewInfoWindowLabel] = useState<string>('');
  const { theme } = useTheme();
  
  // 메모 수정 상태
  const [editingNotes, setEditingNotes] = useState<boolean>(false);
  const [newNotes, setNewNotes] = useState<string>('');
  
  // 카테고리 수정 상태
  const [editingCategory, setEditingCategory] = useState<boolean>(false);
  
  const [clickedLocation, setClickedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [userClickedMap, setUserClickedMap] = useState<boolean>(false);
  
  // 마지막으로 중심을 이동한 장소 ID를 저장하는 ref
  const lastCenteredPlaceIdRef = useRef<string | null>(null);
  // 맵 이동이 진행 중인지 추적하는 ref
  const isMapMovingRef = useRef<boolean>(false);

  // Autocomplete 초기화 및 설정
  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    
    // 장소 선택 이벤트 리스너
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      console.log('선택된 장소 데이터:', place);
      
      if (!place.geometry || !place.geometry.location) {
        console.log("선택된 장소에 지오메트리 정보가 없습니다.");
        return;
      }
      
      // 지도 중심 이동
      map?.setCenter(place.geometry.location);
      map?.setZoom(15);
      
      // 주소 처리 - formatted_address가 있으면 사용, 없으면 address_components에서 구성
      let address = place.formatted_address;
      if (!address && place.address_components && place.address_components.length > 0) {
        address = place.address_components.map(component => component.long_name).join(' ');
      }
      
      // 선택된 장소의 좌표
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      // 이미 관심 장소 목록에 있는지 확인
      const existingPlace = places.find(p => {
        // 장소 이름과 주소로 비교
        const nameMatch = p.name === place.name;
        const addressMatch = p.address === address;
        
        // 좌표 비교 (약간의 오차 허용)
        const latDiff = Math.abs(p.latitude - lat);
        const lngDiff = Math.abs(p.longitude - lng);
        const coordsMatch = latDiff < 0.0001 && lngDiff < 0.0001; // 약 10m 이내 오차 허용
        
        // 이름과 주소 중 하나라도 일치하고, 좌표가 비슷하면 같은 장소로 간주
        return (nameMatch || addressMatch) && coordsMatch;
      });
      
      if (existingPlace) {
        // 이미 저장된 장소가 있으면 해당 장소 선택
        console.log('이미 저장된 장소를 발견했습니다:', existingPlace.name);
        
        // 해당 장소 정보창 표시
        setInfoWindowData(existingPlace);
        
        // 장소 선택 이벤트 발생 (목록에서도 선택되도록)
        if (onPlaceSelect) {
          onPlaceSelect(existingPlace);
        }
        
        // 사용자에게 알림
        alert(`"${existingPlace.name}"은(는) 이미 관심 장소 목록에 존재합니다.`);
        
        return;
      }
      
      // 장소 추가 준비
      if (onPlaceAdd && place.name) {
        setInfoWindowData({
          id: 'new',
          owner_id: '',
          name: place.name,
          address: address || '주소 정보 없음',
          latitude: lat,
          longitude: lng,
          category: '기타', // 기본값
          notes: '',
          rating: 0,
          is_public: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          custom_label: '',
        } as Place);
      }
      
      // 검색창 초기화 (선택적)
      if (autocompleteInputRef.current) {
        autocompleteInputRef.current.value = '';
      }
    });
  }, [map, onPlaceAdd, places, onPlaceSelect]);

  // Autocomplete 초기화를 위한 useEffect 추가
  useEffect(() => {
    if (isLoaded && autocompleteInputRef.current && window.google) {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        { 
          fields: ['name', 'geometry', 'formatted_address', 'address_components', 'place_id'],
          types: ['establishment', 'geocode'],
        }
      );
      onAutocompleteLoad(autocompleteInstance);
    }
  }, [isLoaded, onAutocompleteLoad]);

  // 맵 중심 이동 로직을 하나의 함수로 통합
  const centerMapOnPlace = useCallback((place: Place, withZoom: boolean = true) => {
    if (!map || isMapMovingRef.current) return;
    
    try {
      isMapMovingRef.current = true;
      
      // 이미 같은 장소로 중심 이동을 한 경우 중복 호출 방지
      if (lastCenteredPlaceIdRef.current === place.id) {
        console.log('이미 중심으로 이동한 장소입니다:', place.name);
        isMapMovingRef.current = false;
        return;
      }
      
      console.log('지도 이동:', place.name);
      
      const bounds = map.getBounds();
      const ne = bounds?.getNorthEast();
      const sw = bounds?.getSouthWest();
      
      if (bounds && ne && sw) {
        // 화면 높이의 15% 정도 위로 오프셋 적용
        const latOffset = (ne.lat() - sw.lat()) * 0.15; 
        
        map.setCenter({
          lat: place.latitude - latOffset,
          lng: place.longitude
        });
      } else {
        map.setCenter({
          lat: place.latitude,
          lng: place.longitude
        });
      }
      
      if (withZoom) {
        map.setZoom(16);
      }
      
      // 마지막으로 중심 이동한 장소 ID 업데이트
      lastCenteredPlaceIdRef.current = place.id;
      
      // 맵 이동이 완료된 후 플래그 초기화를 위한 타임아웃 설정
      setTimeout(() => {
        isMapMovingRef.current = false;
      }, 300); // 애니메이션 완료 시간을 고려한 지연 시간
    } catch (error) {
      console.error('맵 중심 이동 오류:', error);
      isMapMovingRef.current = false;
    }
  }, [map]);

  useEffect(() => {
    if (selectedPlace && map && !userClickedMap) {
      // 통합된 맵 중심 이동 함수 사용
      centerMapOnPlace(selectedPlace);
      
      // infoWindowData 상태 업데이트는 중심 이동과 별개로 처리
      // 이를 통해 상태 업데이트와 맵 이동 사이의 의존성 감소
      setInfoWindowData(selectedPlace);
    }
  }, [selectedPlace, map, userClickedMap, centerMapOnPlace]);
  
  useEffect(() => {
    setEditingInfoWindowLabel(false);
    setEditingNotes(false); // 메모 편집 상태 초기화
    setEditingCategory(false); // 카테고리 편집 상태 초기화
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
    
    // 맵 이동 완료 이벤트 리스너
    map.addListener('idle', () => {
      isMapMovingRef.current = false;
    });
    
    console.log('맵 중심 좌표:', map.getCenter()?.toJSON());
    console.log('맵 줌 레벨:', map.getZoom());
  }, []);

  // 편집 모드 중에는 맵 변경을 무시하기 위한 유틸리티 함수
  const isInputFocused = () => {
    if (typeof document === 'undefined') return false;
    
    // 현재 포커스된 요소가 input, textarea, select 인지 확인
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.tagName === 'SELECT'
    );
  };
  
  // onMapClick 함수 업데이트 - 편집 중인 경우 클릭을 무시
  const onMapClick = useCallback(() => {
    // 편집 모드일 때는 정보창 닫기를 방지
    if (isInputFocused()) {
      console.log('편집 모드에서 맵 클릭 무시됨');
      return;
    }
    
    if (infoWindowData) {
      setInfoWindowData(null);
    }
  }, [infoWindowData]);
  
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
          custom_label: infoWindowData.custom_label || ''
        });
        
        setInfoWindowData(null);
        
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
  const handleMarkerClick = useCallback((place: Place) => {
    if (infoWindowData && infoWindowData.id === place.id) {
      setInfoWindowData(null);
    } else {
      // 통합된 맵 중심 이동 함수 사용
      centerMapOnPlace(place);
      
      // InfoWindow 표시를 위한 상태 업데이트
      setInfoWindowData(place);
      
      if (onPlaceSelect) {
        // userClickedMap 플래그를 true로 설정하여 selectedPlace 변경 시 중복 이동 방지
        setUserClickedMap(true);
        onPlaceSelect(place);
      }
    }
  }, [infoWindowData, centerMapOnPlace, onPlaceSelect]);
  
  // 라벨 편집 시작 함수
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
  
  // 카테고리 편집 시작
  const handleStartEditCategory = () => {
    if (infoWindowData) {
      setEditingCategory(true);
      setInfoWindowData({
        ...infoWindowData,
        category: infoWindowData.category || '기타'
      });
    }
  };
  
  // 카테고리 저장
  const handleSaveCategory = async () => {
    if (!infoWindowData || !onPlaceUpdate) return;
    
    try {
      setEditingCategory(false);
      
      const updatedPlace = {
        ...infoWindowData,
        category: infoWindowData.category || '기타'
      };
      
      console.log('카테고리 업데이트 요청:', updatedPlace);
      await onPlaceUpdate(updatedPlace);
    } catch (error) {
      console.error('카테고리 업데이트 오류:', error);
      setEditingCategory(true);
      alert('카테고리 업데이트에 실패했습니다. 다시 시도해주세요.');
    }
  };
  
  // 사용자 정의 마커 레이블 생성 함수
  const createCustomMarkerLabel = (place: Place) => {
    const categoryIcon = categoryIcons[place.category as keyof typeof categoryIcons] || '📍';
    const hasCustomLabel = place.custom_label && place.custom_label.trim() !== '';
    
    // 커스텀 라벨이 있는 경우 아이콘+라벨 형태로, 없으면 원본 지명 표시
    // 라벨이 너무 길면 최대 15자까지만 표시하고 나머지는 ellipsis 처리
    const labelText = hasCustomLabel 
      ? `${categoryIcon} ${place.custom_label}`
      : `${categoryIcon} ${place.name}`;
    
    return {
      text: labelText,
      color: 'white',
      fontSize: '14px',
      fontWeight: 'bold',
      className: 'custom-marker-label'
    };
  }; 

  const onChangeMemo = (e: React.ChangeEvent<HTMLTextAreaElement>) => infoWindowData &&
    setInfoWindowData({
      ...infoWindowData,
      notes: e.target.value
    });

  const onChangeCustomLabel = (e: React.ChangeEvent<HTMLInputElement>) => infoWindowData &&
    setInfoWindowData({
      ...infoWindowData,
      custom_label: e.target.value
    });

  const onChangeCategory = (e: React.ChangeEvent<HTMLSelectElement>) => infoWindowData &&
    setInfoWindowData({
      ...infoWindowData,
      category: e.target.value
    });

  
  // 사용자 정의 마커 아이콘 생성 함수
  const createCustomMarkerIcon = (place: Place) => {
    // 카테고리에 따른 이모지 선택
    const categoryIcon = categoryIcons[place.category as keyof typeof categoryIcons] || '📍';
    
    // 카테고리별 배경색 설정 - 이모지가 잘 보이도록 배경 추가
    const getCategoryColor = (category: string) => {
      switch(category) {
        case '음식점': return '#FF5252'; // 빨간색
        case '카페': return '#448AFF'; // 파란색
        case '관광지': return '#AB47BC'; // 보라색
        case '쇼핑': return '#FF9800'; // 주황색
        case '숙소': return '#4CAF50'; // 초록색
        default: return '#4CAF50'; // 초록색 (기타)
      }
    };
    
    // 이모지를 표시하는 데이터 URL 생성
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    
    const context = canvas.getContext('2d');
    if (context) {
      // 배경을 투명하게 설정
      context.clearRect(0, 0, 48, 48);
      
      // 그림자 효과
      context.shadowColor = 'rgba(0, 0, 0, 0.5)';
      context.shadowBlur = 4;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      
      // 원형 배경 그리기
      context.beginPath();
      context.arc(24, 24, 16, 0, Math.PI * 2);
      context.fillStyle = getCategoryColor(place.category);
      context.fill();
      
      // 테두리 추가
      context.strokeStyle = 'white';
      context.lineWidth = 2;
      context.stroke();
      
      // 그림자 효과 초기화 (이모지에는 적용하지 않음)
      context.shadowColor = 'transparent';
      context.shadowBlur = 0;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      
      // 이모지 크기와 위치 설정
      context.font = '18px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = 'white';
      
      // 이모지 그리기
      context.fillText(categoryIcon, 24, 24);
    }
    
    return {
      url: canvas.toDataURL(),
      scaledSize: new window.google.maps.Size(48, 48),
      anchor: new window.google.maps.Point(24, 24),
    };
  };
  
  // 마크다운을 HTML로 변환하는 함수 추가
  // 컴포넌트 밖에 정의
  function parseMarkdownToHTML(markdown: string): string {
    if (!markdown) return '';
    
    // 줄바꿈을 임시로 다른 문자열로 대체
    let html = markdown.replace(/\r\n|\n\r|\n|\r/g, '\n');
    
    // 코드 블록 (```..```) - 이 부분이 다른 정규식에 영향을 주지 않도록 먼저 처리
    html = html.replace(/```([\s\S]*?)```/gm, function(_, code) {
      return `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    });
    
    // 인라인 코드 (`..`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 헤더
    html = html.replace(/^### (.*?)$/gm, '<h3 class="font-medium">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="font-semibold">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 class="font-bold">$1</h1>');
    
    // 볼드, 이탤릭
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 링크
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>');
    
    // 순서없는 목록
    // 전체 목록을 찾아서 처리
    html = html.replace(/((^|\n)- (.*?)(\n|$))+/g, function(match) {
      return '<ul class="list-disc pl-5">' + match.replace(/^- (.*?)$/gm, '<li>$1</li>') + '</ul>';
    });
    
    // 인용문
    html = html.replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic">$1</blockquote>');
    
    // 수평선
    html = html.replace(/^---+$/gm, '<hr class="my-2 border-t border-gray-300 dark:border-gray-600">');
    
    // 일반 텍스트를 p 태그로 감싸기 (다른 태그에 포함되지 않은 텍스트)
    // 먼저 줄바꿈으로 분리
    const lines = html.split('\n');
    html = '';
    let inSpecialBlock = false;
    
    for (const line of lines) {
      // 이미 태그로 감싸져 있는지 체크
      if (line.trim() === '') {
        html += '<br>';
        continue;
      }
      
      if (line.match(/^<(h1|h2|h3|pre|ul|ol|blockquote|hr)/)) {
        inSpecialBlock = true;
        html += line + '\n';
      } else if (line.match(/^<\/(h1|h2|h3|pre|ul|ol|blockquote)>/)) {
        inSpecialBlock = false;
        html += line + '\n';
      } else if (!inSpecialBlock && !line.match(/^<\w+/)) {
        // 일반 텍스트이고 태그로 시작하지 않으면 p 태그로 감싼다
        html += `<p>${line}</p>\n`;
      } else {
        html += line + '\n';
      }
    }
    
    return html;
  }
  
  // InfoWindow가 닫힐 때 상태 초기화 (기존 유지)
  useEffect(() => {
    if (!infoWindowData) {
      setUserClickedMap(false);
      // 정보창이 닫힐 때 마지막 중심 이동 장소 기록 초기화
      lastCenteredPlaceIdRef.current = null;
    }
  }, [infoWindowData]);
  
  if (loadError) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg text-center h-full flex flex-col items-center justify-center">
        <div className="text-red-600 dark:text-red-400 text-2xl mb-2">🚫</div>
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Google Maps를 불러올 수 없습니다</h3>
        <p className="text-sm text-red-600 dark:text-red-300 mb-4">
          API 키 문제 또는 네트워크 오류로 지도를 표시할 수 없습니다.
        </p>
        <details className="text-xs text-gray-600 dark:text-gray-400 text-left">
          <summary className="cursor-pointer hover:underline">기술적 상세 정보</summary>
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
            <code>Error: {loadError.toString()}</code>
          </div>
        </details>
      </div>
    );
  }
  
  if (!isLoaded) {
    return (
      <div className="p-6 dark:text-gray-300 h-full flex flex-col items-center justify-center">
        <div className="animate-spin text-2xl mb-3">🔄</div>
        <p>지도를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* infoWindowData가 없을 때만 검색 UI를 표시합니다 */}
      {!infoWindowData && (
        <div className="absolute top-4 left-0 right-0 z-10 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-2 flex flex-col gap-2 transition-colors">
            <div className="flex justify-between items-center">
              {/* Autocomplete 사용 */}
              <input
                ref={autocompleteInputRef}
                type="text"
                placeholder="장소명 또는 주소로 검색..."
                className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      )}
      
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
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* CSS hover는 기존 코드에서 동작하지 않았으므로 JS 이벤트로 대체 */
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
        onClick={onMapClick}
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
            onCloseClick={() => {
              setInfoWindowData(null);
              setClickedLocation(null);
              setUserClickedMap(false);
              // infoWindow가 닫힐 때 검색 필드를 초기화합니다
              if (autocompleteInputRef.current) {
                autocompleteInputRef.current.value = '';
              }
            }}
            options={{
              // 정보창이 마커 중앙에 표시되도록 오프셋 조정
              pixelOffset: new window.google.maps.Size(0, -10),
              maxWidth: 300,
            }}
          >
            <div className={`p-3 max-w-[280px] ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}`}>
              {infoWindowData.custom_label && !editingInfoWindowLabel ? (
                <>
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">{infoWindowData.custom_label}</h3>
                    {onPlaceUpdate && (
                      <button
                        onClick={handleStartEditLabelInInfoWindow}
                        className={`ml-2 text-xs ${theme === 'dark' ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'} p-1`}
                        title="라벨 편집"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className={`text-sm font-normal ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{infoWindowData.name}</p>
                </>
              ) : !editingInfoWindowLabel ? (
                <h3 className="text-lg font-semibold truncate">{infoWindowData.name}</h3>
              ) : (
                // 라벨 편집 UI - 커스텀 라벨 대신 표시
                <div className="flex flex-col items-start h-auto">
                  <div className="w-full mb-2">
                    <input
                      type="text"
                      value={newInfoWindowLabel}
                      onChange={(e) => {
                        setNewInfoWindowLabel(e.target.value);
                      }}
                      className={`text-lg font-semibold p-0.5 border rounded w-full ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      placeholder="라벨 입력..."
                      maxLength={100}
                      autoFocus
                    />
                  </div>
                  <div className="flex-shrink-0 flex w-full justify-end">
                    <button
                      onClick={handleSaveLabelInInfoWindow}
                      className={`text-xs ${theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-800'} px-1.5 py-0.5 rounded bg-opacity-20 bg-green-100 dark:bg-green-900 dark:bg-opacity-20`}
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setEditingInfoWindowLabel(false)}
                      className={`ml-1 text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} px-1.5 py-0.5 rounded bg-opacity-20 bg-gray-100 dark:bg-gray-900 dark:bg-opacity-20`}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
              {editingInfoWindowLabel && (
                <p className={`text-sm font-normal ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{infoWindowData.name}</p>
              )}
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} line-clamp-2 mb-1`}>{infoWindowData.address}</p>
              
              {/* 라벨 추가 버튼 - 커스텀 라벨이 없을 때만 표시 */}
              {!infoWindowData.custom_label && !editingInfoWindowLabel && onPlaceUpdate && infoWindowData.id !== 'new' && (
                <div className="mt-2 flex items-center">
                  <button
                    onClick={handleStartEditLabelInInfoWindow}
                    className={`text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300 border-gray-600' : 'text-gray-500 hover:text-gray-700 border-gray-300'} px-2 py-0.5 rounded-full border border-dashed`}
                  >
                    {categoryIcons[infoWindowData.category as keyof typeof categoryIcons]} 라벨 추가
                  </button>
                </div>
              )}
              
              {infoWindowData.id === 'new' ? (
                <div className="mt-2">
                  <div className="mb-2">
                    {clickedLocation && (
                      <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                        <p>지도에서 클릭한 위치를 관심 장소로 추가합니다</p>
                      </div>
                    )}
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : ''}`}>카테고리</label>
                    <select
                      value={infoWindowData.category}
                      onChange={onChangeCategory}
                      className={`w-full p-1 border rounded text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    >
                      <option value="음식점">🍽️ 음식점</option>
                      <option value="카페">☕️ 카페</option>
                      <option value="관광지">🏞️ 관광지</option>
                      <option value="쇼핑">🛍️ 쇼핑</option>
                      <option value="숙소">🏨 숙소</option>
                      <option value="기타">📍 기타</option>
                    </select>
                  </div>
                  
                  {/* 라벨 입력 필드 추가 */}
                  <div className="mb-2">
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : ''}`}>라벨</label>
                    <input
                      type="text"
                      value={infoWindowData.custom_label || ''}
                      onChange={onChangeCustomLabel}
                      className={`w-full p-1 border rounded text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      placeholder="장소의 별명이나 메모를 적어주세요"
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="mb-2">
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : ''}`}>메모</label>
                    <textarea
                      value={infoWindowData.notes || ''}
                      onChange={onChangeMemo}
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
                  {/* 카테고리 편집 UI */}
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>카테고리</h4>
                    {!editingCategory && onPlaceUpdate && (
                      <button
                        onClick={handleStartEditCategory}
                        className={`text-xs ${theme === 'dark' ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'} p-1`}
                        title="카테고리 편집"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {editingCategory ? (
                    <div className="mb-3">
                      <select
                        value={infoWindowData.category}
                        onChange={onChangeCategory}
                        className={`w-full p-1.5 border rounded text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                        autoFocus
                      >
                        <option value="음식점">🍽️ 음식점</option>
                        <option value="카페">☕️ 카페</option>
                        <option value="관광지">🏞️ 관광지</option>
                        <option value="쇼핑">🛍️ 쇼핑</option>
                        <option value="숙소">🏨 숙소</option>
                        <option value="기타">📍 기타</option>
                      </select>
                      <div className="flex justify-end mt-1">
                        <button
                          onClick={handleSaveCategory}
                          className={`ml-1 text-xs ${theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-800'} px-2 py-1 rounded`}
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingCategory(false)}
                          className={`ml-1 text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} px-2 py-1 rounded`}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-center mb-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-2 py-1 rounded-md`}>
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {categoryIcons[infoWindowData.category as keyof typeof categoryIcons]} {infoWindowData.category}
                      </span>
                    </div>
                  )}
                  
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
                        onChange={(e) => {
                          setNewNotes(e.target.value);
                        }}
                        className={`w-full p-1 border rounded text-sm max-h-[120px] ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                        rows={3}
                        placeholder="메모를 입력하세요. 마크다운 문법을 지원합니다 (**볼드**, *이탤릭*, ```코드```)"
                        autoFocus
                      />
                      <p className={`text-xs italic mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                        마크다운 지원: **볼드**, *이탤릭*, # 제목, - 목록, [링크](URL), ```코드 블록```
                      </p>
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
                      {infoWindowData.notes ? (
                        <div className={`markdown-content markdown-inherit-color ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                          <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(infoWindowData.notes) }} />
                        </div>
                      ) : (
                        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} italic`}>
                          메모가 없습니다. 편집 버튼을 클릭하여 메모를 추가하세요.
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className={`my-2 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}