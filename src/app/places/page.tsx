'use client';

import { useState } from 'react';
import { PlaceMap } from '@/widgets/place-map/PlaceMap';
import { PlaceList } from '@/widgets/place-list/PlaceList';
import { usePlaces } from '@/entities/place/hooks';
import { CreatePlaceData, Place } from '@/entities/place/types';

export default function PlacesPage() {
  const { places, createPlace, deletePlace } = usePlaces();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const filteredPlaces = selectedCategory 
    ? places.filter(place => place.category === selectedCategory)
    : places;

  // 타입 호환성 문제 해결을 위한 래퍼 함수
  const handlePlaceAdd = async (placeData: CreatePlaceData): Promise<void> => {
    await createPlace(placeData);
  };

  // 선택한 장소를 지도에서 보여주기 위한 상태
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-white shadow">
        <h1 className="text-2xl font-bold">나의 관심 장소</h1>
        <div className="mt-2 flex gap-2">
          <button 
            onClick={() => setSelectedCategory(null)} 
            className={`px-3 py-1 rounded ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            전체
          </button>
          {['음식점', '관광지', '쇼핑', '숙소', '기타'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 overflow-auto p-4 border-r">
          <PlaceList 
            places={filteredPlaces} 
            onPlaceSelect={setSelectedPlace}
            onPlaceDelete={deletePlace}
          />
        </div>
        <div className="w-2/3">
          <PlaceMap 
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            onPlaceAdd={handlePlaceAdd}
            onPlaceSelect={setSelectedPlace}
          />
        </div>
      </div>
    </div>
  );
}