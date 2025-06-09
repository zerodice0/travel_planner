'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PlaceMap } from '@/widgets/place-map/PlaceMap';
import { PlaceList } from '@/widgets/place-list/PlaceList';
import { usePlaces } from '@/entities/place/hooks';
import { CreatePlaceData, Place } from '@/entities/place/types';

export default function PlacesPage() {
  const { places, selectedPlace, createPlace, deletePlace, updatePlace, selectPlace } = usePlaces();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const filteredPlaces = selectedCategory 
    ? places.filter(place => place.category === selectedCategory)
    : places;

  useEffect(() => {
    selectPlace(null);
  }, [selectedCategory, selectPlace]);

  // 장소 추가 핸들러
  const handlePlaceAdd = async (placeData: CreatePlaceData): Promise<void> => {
    await createPlace(placeData);
  };

  // 장소 선택 핸들러
  const handlePlaceSelect = (place: Place) => {
    selectPlace(place);
  };
  
  // 장소 업데이트 핸들러 (라벨 변경, 메모 변경 등)
  const handlePlaceUpdate = async (updatedPlace: Place): Promise<void> => {
    try {
      console.log('장소 업데이트:', updatedPlace.name);
      
      // 업데이트할 필드 추출
      const updates: Partial<Place> = {};
      
      // 커스텀 라벨이 변경되었는지 확인
      if (updatedPlace.custom_label !== undefined) {
        console.log('라벨 업데이트:', updatedPlace.custom_label);
        updates.custom_label = updatedPlace.custom_label || '';
      }
      
      // 메모가 변경되었는지 확인
      if (updatedPlace.notes !== undefined) {
        console.log('메모 업데이트:', updatedPlace.notes);
        updates.notes = updatedPlace.notes || '';
      }
      
      // 카테고리가 변경되었는지 확인
      if (updatedPlace.category !== undefined) {
        console.log('카테고리 업데이트:', updatedPlace.category);
        updates.category = updatedPlace.category || '기타';
      }
      
      // 필드가 하나라도 업데이트되면 API 호출
      if (Object.keys(updates).length > 0) {
        await updatePlace(updatedPlace.id, updates);
      } else {
        console.warn('업데이트할 필드가 없습니다.');
      }
    } catch (error) {
      console.error('장소 업데이트 오류:', error);
      throw error;
    }
  };
  
  // 지도 표시 상태가 변경될 때 윈도우 리사이즈 이벤트를 트리거하여 구글맵 리렌더링
  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new Event('resize'));
    };
    
    // 지도 표시 상태가 변경될 때마다 약간의 지연 후 리사이즈 이벤트 발생
    if (showMap) {
      const timer = setTimeout(() => {
        handleResize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showMap]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="p-4 bg-white dark:bg-gray-800 shadow">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold dark:text-white">나의 관심 장소</h1>
          <Link 
            href="/trips/select"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            여행별 관리하기
          </Link>
        </div>
        <div className="mt-2 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            <button 
              onClick={() => setSelectedCategory(null)} 
              className={`px-3 py-1 rounded ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
            >
              전체
            </button>
            {['음식점', '카페', '관광지', '쇼핑', '숙소', '기타'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {/* 모바일 환경에서 지도/목록 전환 버튼 */}
        <div className="mt-2 flex md:hidden gap-2">
          <button 
            onClick={() => setShowMap(true)} 
            className={`flex-1 px-3 py-2 rounded ${showMap ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
          >
            지도 보기
          </button>
          <button 
            onClick={() => setShowMap(false)} 
            className={`flex-1 px-3 py-2 rounded ${!showMap ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
          >
            목록 보기
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* 모바일: 현재 선택에 따라 지도 또는 목록 표시, 데스크톱: 항상 목록 표시 */}
        <div 
          className={`${showMap ? 'hidden' : 'block'} md:block md:w-1/3 overflow-auto p-4 border-r dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors w-full h-full`}
        >
          <PlaceList 
            places={filteredPlaces} 
            selectedPlace={selectedPlace}
            onPlaceSelect={handlePlaceSelect}
            onPlaceDelete={deletePlace}
            onPlaceUpdate={handlePlaceUpdate}
          />
        </div>
        
        {/* 모바일: 현재 선택에 따라 지도 또는 목록 표시, 데스크톱: 항상 지도 표시 */}
        <div 
          ref={mapContainerRef}
          className={`${!showMap ? 'hidden' : 'block'} md:block md:w-2/3 w-full h-full relative`}
          style={{ minHeight: '400px' }}
        >
          <PlaceMap 
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            onPlaceAdd={handlePlaceAdd}
            onPlaceSelect={handlePlaceSelect}
            onPlaceUpdate={handlePlaceUpdate}
          />
        </div>
      </div>
    </div>
  );
}