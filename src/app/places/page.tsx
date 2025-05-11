'use client';

import { useState } from 'react';
import { PlaceMap } from '@/widgets/place-map/PlaceMap';
import { PlaceList } from '@/widgets/place-list/PlaceList';
import { usePlaces } from '@/entities/place/hooks';
import { CreatePlaceData, Place } from '@/entities/place/types';

export default function PlacesPage() {
  const { places, selectedPlace, createPlace, deletePlace, updatePlace, selectPlace } = usePlaces();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const filteredPlaces = selectedCategory 
    ? places.filter(place => place.category === selectedCategory)
    : places;

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

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="p-4 bg-white dark:bg-gray-800 shadow">
        <h1 className="text-2xl font-bold dark:text-white">나의 관심 장소</h1>
        <div className="mt-2 flex gap-2">
          <button 
            onClick={() => setSelectedCategory(null)} 
            className={`px-3 py-1 rounded ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
          >
            전체
          </button>
          {['음식점', '관광지', '쇼핑', '숙소', '기타'].map(category => (
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
      
      <div className="flex flex-1 overflow-hidden">
        <div id="place-detail-panel" className="w-1/3 overflow-auto p-4 border-r dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
          <PlaceList 
            places={filteredPlaces} 
            selectedPlace={selectedPlace} // 선택된 장소 전달
            onPlaceSelect={handlePlaceSelect} // 장소 선택 이벤트 핸들러 전달
            onPlaceDelete={deletePlace}
            onPlaceUpdate={handlePlaceUpdate} // 장소 업데이트 핸들러 전달
          />
        </div>
        <div className="w-2/3">
          <PlaceMap 
            places={filteredPlaces}
            selectedPlace={selectedPlace} // 선택된 장소 전달
            onPlaceAdd={handlePlaceAdd}
            onPlaceSelect={handlePlaceSelect} // 장소 선택 이벤트 핸들러 전달
            onPlaceUpdate={handlePlaceUpdate} // 장소 업데이트 핸들러 전달
          />
        </div>
      </div>
    </div>
  );
}