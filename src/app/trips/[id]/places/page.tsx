'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTrip } from '@/entities/trip/hooks';
import { usePlaces } from '@/entities/place/hooks';
import { useTripPlaces } from '@/entities/trip-place/hooks';
import { PlaceMap } from '@/widgets/place-map/PlaceMap';
import { TripPlaceList } from '@/widgets/trip-place-list/TripPlaceList';
import { Place } from '@/entities/place/types';
import { TripPlace } from '@/entities/trip-place/types';

export default function TripPlacesPage() {
  const { id } = useParams();
  const tripId = id as string;
  
  const { trip, loading: tripLoading } = useTrip(tripId);
  const { places: allPlaces, createPlace } = usePlaces();
  const { 
    tripPlaces, 
    loading: tripPlacesLoading, 
    addPlaceToTrip, 
    removePlaceFromTrip,
    updateTripPlace
  } = useTripPlaces(tripId);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);

  // 여행에 추가된 장소들의 Place 객체들 (TripPlace의 custom_label을 반영)
  const tripPlaceEntities = tripPlaces
    .map(tp => tp.places_of_interest)
    .filter(Boolean)
    .map(place => {
      // 해당 place에 대응하는 TripPlace 찾기
      const tripPlace = tripPlaces.find(tp => tp.place_id === place!.id);
      
      // TripPlace의 custom_label이 있으면 Place의 custom_label을 덮어씀
      return {
        ...place!,
        custom_label: tripPlace?.custom_label || place!.custom_label
      } as Place;
    });
  
  // 카테고리별 필터링
  const filteredTripPlaces = selectedCategory 
    ? tripPlaces.filter(tp => tp.places_of_interest?.category === selectedCategory)
    : tripPlaces;

  const handlePlaceAdd = async (placeData: Omit<Place, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
    try {
      // 먼저 새 장소를 생성
      const newPlace = await createPlace(placeData);
      
      // 그 다음 여행에 추가
      await addPlaceToTrip({
        trip_id: tripId,
        place_id: newPlace.id,
        status: 'planned',
        priority: 0
      });
      
      setShowAddPlaceModal(false);
    } catch (err) {
      console.error('장소 추가 오류:', err);
      alert('장소를 추가하는 중 오류가 발생했습니다.');
    }
  };

  const handleExistingPlaceAdd = async (place: Place) => {
    try {
      // 이미 여행에 추가된 장소인지 확인
      const isAlreadyAdded = tripPlaces.some(tp => tp.place_id === place.id);
      if (isAlreadyAdded) {
        alert('이미 이 여행에 추가된 장소입니다.');
        return;
      }

      await addPlaceToTrip({
        trip_id: tripId,
        place_id: place.id,
        custom_label: place.custom_label || undefined,
        status: 'planned',
        priority: 0
      });
    } catch (err) {
      console.error('기존 장소 추가 오류:', err);
      alert('장소를 추가하는 중 오류가 발생했습니다.');
    }
  };

  const handlePlaceRemove = async (tripPlaceId: string) => {
    try {
      await removePlaceFromTrip(tripPlaceId);
    } catch (err) {
      console.error('장소 제거 오류:', err);
      alert('장소를 제거하는 중 오류가 발생했습니다.');
    }
  };



  if (tripLoading || tripPlacesLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">여행 정보를 찾을 수 없습니다.</p>
          <Link href="/trips/select" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
            여행 선택 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* 헤더 */}
      <div className="p-4 bg-white dark:bg-gray-800 shadow">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">{trip.title} - 관심 장소</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {trip.location && <span>📍 {trip.location}</span>}
              {trip.start_date && trip.end_date && (
                <span>📅 {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}</span>
              )}
              <span>{tripPlaces.length}개 장소</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddPlaceModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              기존 장소 불러오기
            </button>
            
            <Link
              href="/trips/select"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              여행 변경
            </Link>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button 
            onClick={() => setSelectedCategory(null)} 
            className={`px-3 py-1 rounded whitespace-nowrap ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
          >
            전체 ({tripPlaces.length})
          </button>
          {['음식점', '카페', '관광지', '쇼핑', '숙소', '기타'].map(category => {
            const count = tripPlaces.filter(tp => tp.places_of_interest?.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded whitespace-nowrap ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
              >
                {category} ({count})
              </button>
            );
          })}
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
      
      {/* 메인 컨텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 장소 목록 (데스크톱에서는 항상 표시, 모바일에서는 조건부) */}
        <div className={`w-full md:w-1/3 overflow-auto border-r dark:border-gray-700 ${showMap ? 'hidden md:block' : 'block'}`}>
          <div className="p-4">
            <TripPlaceList
              tripPlaces={filteredTripPlaces}
              selectedPlace={selectedPlace}
              onPlaceSelect={setSelectedPlace}
              onTripPlaceRemove={handlePlaceRemove}
              onTripPlaceUpdate={async (tripPlace: TripPlace) => {
                await updateTripPlace(tripPlace.id, {
                  custom_label: tripPlace.custom_label,
                  notes: tripPlace.notes,
                  status: tripPlace.status,
                  priority: tripPlace.priority
                });
              }}
            />
          </div>
        </div>
        
        {/* 지도 (데스크톱에서는 항상 표시, 모바일에서는 조건부) */}
        <div className={`w-full md:w-2/3 relative ${showMap ? 'block' : 'hidden md:block'}`}>
          <PlaceMap 
            places={tripPlaceEntities}
            selectedPlace={selectedPlace}
            onPlaceAdd={handlePlaceAdd}
            onPlaceSelect={setSelectedPlace}
            onPlaceUpdate={async (updatedPlace: Place) => {
              // PlaceMap에서 장소 업데이트가 발생하면 해당하는 TripPlace의 custom_label도 업데이트
              const tripPlace = tripPlaces.find(tp => tp.place_id === updatedPlace.id);
              if (tripPlace) {
                // 여행 계획에서는 custom_label만 TripPlace에 반영하고, 
                // notes와 category는 개별 Place가 아닌 TripPlace에서 관리
                await updateTripPlace(tripPlace.id, {
                  custom_label: updatedPlace.custom_label,
                  notes: tripPlace.notes, // TripPlace의 기존 notes 유지
                  status: tripPlace.status,
                  priority: tripPlace.priority
                });
              }
            }}
          />
        </div>
      </div>

      {/* 장소 추가 모달 */}
      {showAddPlaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold dark:text-white">장소 추가</h2>
                <button
                  onClick={() => setShowAddPlaceModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                기존 장소를 추가하거나 지도에서 새 장소를 검색하여 추가하세요.
              </p>
              
              {/* 기존 장소 목록 */}
              <div className="max-h-60 overflow-y-auto">
                <h3 className="font-medium dark:text-white mb-2">기존 장소에서 선택</h3>
                {allPlaces.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">저장된 장소가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {allPlaces
                      .filter(place => !tripPlaces.some(tp => tp.place_id === place.id))
                      .map(place => (
                        <div
                          key={place.id}
                          onClick={() => handleExistingPlaceAdd(place)}
                          className="p-2 border dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              {place.custom_label && <p className="font-medium dark:text-white truncate">{place.custom_label}</p>}
                              {place.custom_label && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">원래 이름: {place.name}</p>}
                              {!place.custom_label && <p className="font-medium dark:text-white truncate">{place.name}</p>}
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{place.address}</p>
                              <span className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded dark:text-gray-300">
                                {place.category}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExistingPlaceAdd(place);
                              }}
                              className="ml-2 text-blue-600 dark:text-blue-400 text-sm"
                            >
                              추가
                            </button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => setShowAddPlaceModal(false)}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  지도에서 새 장소 검색하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 