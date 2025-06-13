'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTrip } from '@/entities/trip/hooks';
import { usePlaces } from '@/entities/place/hooks';
import { useTripPlaces } from '@/entities/trip-place/hooks';
import { PlaceMap } from '@/widgets/place-map/PlaceMap';
import { TripPlaceList } from '@/widgets/trip-place-list/TripPlaceList';
import { AlertDialog, useAlertDialog } from '@/shared/ui/AlertDialog';
import { Place } from '@/entities/place/types';
import { TripPlace } from '@/entities/trip-place/types';

export default function TripPlacesPage() {
  // AlertDialog 훅 사용
  const { dialog: alertDialog, showAlert, hideAlert } = useAlertDialog();
  
  const { id } = useParams();
  const tripId = id as string;
  
  const { trip, loading: tripLoading } = useTrip(tripId);
  const { places: allPlaces, createPlace, updatePlace } = usePlaces();
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

  // 카테고리별 필터링
  const filteredTripPlaces = selectedCategory 
  ? tripPlaces.filter(tp => tp.places_of_interest?.category === selectedCategory)
  : tripPlaces;
  
  // 필터링된 여행 장소들의 Place 객체들 (TripPlace의 custom_label을 반영)
  const filteredTripPlaceEntities = filteredTripPlaces
    .map(tp => tp.places_of_interest)
    .filter(Boolean) // null값 제거
    .map(place => {
      // 해당 place에 대응하는 TripPlace 찾기
      const tripPlace = filteredTripPlaces.find(tp => tp.place_id === place!.id);
      
      // TripPlace의 custom_label이 있으면 Place의 custom_label을 덮어씀
      return {
        ...place!,
        custom_label: tripPlace?.custom_label || place!.custom_label
      } as Place;
    });

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
      showAlert('오류 발생', '장소를 추가하는 중 오류가 발생했습니다.', '⚠️');
    }
  };

  const handleExistingPlaceAdd = async (place: Place) => {
    try {
      // 이미 여행에 추가된 장소인지 확인
      const isAlreadyAdded = tripPlaces.some(tp => tp.place_id === place.id);
      if (isAlreadyAdded) {
        showAlert('중복 장소', '이미 이 여행에 추가된 장소입니다.', 'ℹ️');
        return;
      }

      await addPlaceToTrip({
        trip_id: tripId,
        place_id: place.id,
        custom_label: place.custom_label || undefined,
        notes: place.notes || undefined,
        status: 'planned',
        priority: 0
      });
    } catch (err) {
      console.error('기존 장소 추가 오류:', err);
      showAlert('오류 발생', '장소를 추가하는 중 오류가 발생했습니다.', '⚠️');
    }
  };

  const handlePlaceRemove = async (tripPlaceId: string) => {
    try {
      await removePlaceFromTrip(tripPlaceId);
    } catch (err) {
      console.error('장소 제거 오류:', err);
      showAlert('오류 발생', '장소를 제거하는 중 오류가 발생했습니다.', '⚠️');
    }
  };



  if (tripLoading || tripPlacesLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 wanderer-gradient-warm min-h-screen">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-wanderer-sunset-500 mb-4"></div>
          <p className="text-wanderer-sand-600 dark:text-wanderer-cream-400">여행 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-6xl mx-auto p-6 wanderer-gradient-warm min-h-screen">
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="font-wanderer-serif text-2xl text-wanderer-sand-800 dark:text-wanderer-cream-200 mb-2">여행 정보를 찾을 수 없어요</h2>
            <p className="text-wanderer-sand-600 dark:text-wanderer-cream-400">다른 여행을 선택해주세요</p>
          </div>
          <Link href="/trips/select" className="btn-wanderer">
            🎒 여행 선택하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen wanderer-gradient-warm transition-colors">
      {/* 헤더 */}
      <div className="p-6 bg-wanderer-cream-100/80 dark:bg-wanderer-sage-800/80 backdrop-blur-sm shadow-lg border-b border-wanderer-cream-300 dark:border-wanderer-sage-600">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <h1 className="font-wanderer-serif text-3xl text-wanderer-sand-800 dark:text-wanderer-cream-100 mb-2">
              ✨ {trip.title}
            </h1>
            <h2 className="text-lg text-wanderer-sunset-600 dark:text-wanderer-sunset-300 mb-3">🗺️ 관심 장소</h2>
            <div className="flex items-center gap-6 text-sm text-wanderer-sand-600 dark:text-wanderer-cream-400">
              {trip.location && (
                <span className="flex items-center gap-1">
                  <span className="text-wanderer-sunset-500">📍</span> {trip.location}
                </span>
              )}
              {trip.start_date && trip.end_date && (
                <span className="flex items-center gap-1">
                  <span className="text-wanderer-sunset-500">📅</span> 
                  {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="text-wanderer-sunset-500">🎯</span> {tripPlaces.length}개 장소
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddPlaceModal(true)}
              className="btn-wanderer-secondary text-sm"
            >
              📋 기존 장소 불러오기
            </button>
            
            <Link
              href={`/trips/${tripId}/edit`}
              className="btn-wanderer text-sm"
            >
              ✏️ 여행 정보 편집
            </Link>
            
            <Link
              href="/trips/select"
              className="px-4 py-2 bg-wanderer-cream-300 dark:bg-wanderer-sage-600 text-wanderer-sand-700 dark:text-wanderer-cream-200 rounded-lg hover:bg-wanderer-cream-400 dark:hover:bg-wanderer-sage-500 transition-colors text-sm"
            >
              🔄 여행 변경
            </Link>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button 
            onClick={() => setSelectedCategory(null)} 
            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${!selectedCategory ? 'bg-wanderer-sunset-500 text-white shadow-md' : 'bg-wanderer-cream-200 dark:bg-wanderer-sage-700 text-wanderer-sand-700 dark:text-wanderer-cream-200 hover:bg-wanderer-cream-300 dark:hover:bg-wanderer-sage-600'}`}
          >
            🏠 전체 ({tripPlaces.length})
          </button>
          {[
            { name: '음식점', icon: '🍽️' },
            { name: '카페', icon: '☕' },
            { name: '관광지', icon: '🏛️' },
            { name: '쇼핑', icon: '🛍️' },
            { name: '숙소', icon: '🏨' },
            { name: '기타', icon: '📍' }
          ].map(categoryInfo => {
            const count = tripPlaces.filter(tp => tp.places_of_interest?.category === categoryInfo.name).length;
            return (
              <button
                key={categoryInfo.name}
                onClick={() => setSelectedCategory(categoryInfo.name)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${selectedCategory === categoryInfo.name ? 'bg-wanderer-sunset-500 text-white shadow-md' : 'bg-wanderer-cream-200 dark:bg-wanderer-sage-700 text-wanderer-sand-700 dark:text-wanderer-cream-200 hover:bg-wanderer-cream-300 dark:hover:bg-wanderer-sage-600'}`}
              >
                {categoryInfo.icon} {categoryInfo.name} ({count})
              </button>
            );
          })}
        </div>
        
        {/* 모바일 환경에서 지도/목록 전환 버튼 */}
        <div className="mt-4 flex md:hidden gap-3">
          <button 
            onClick={() => setShowMap(true)} 
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${showMap ? 'bg-wanderer-sunset-500 text-white shadow-md' : 'bg-wanderer-cream-200 dark:bg-wanderer-sage-700 text-wanderer-sand-700 dark:text-wanderer-cream-200'}`}
          >
            🗺️ 지도 보기
          </button>
          <button 
            onClick={() => setShowMap(false)} 
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${!showMap ? 'bg-wanderer-sunset-500 text-white shadow-md' : 'bg-wanderer-cream-200 dark:bg-wanderer-sage-700 text-wanderer-sand-700 dark:text-wanderer-cream-200'}`}
          >
            📋 목록 보기
          </button>
        </div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 장소 목록 (데스크톱에서는 항상 표시, 모바일에서는 조건부) */}
        <div className={`w-full md:w-1/3 overflow-auto border-r border-wanderer-cream-300 dark:border-wanderer-sage-600 bg-wanderer-cream-50/50 dark:bg-wanderer-sage-800/50 ${showMap ? 'hidden md:block' : 'block'}`}>
          <div className="p-4 wanderer-pattern-subtle">
            <TripPlaceList
              tripPlaces={filteredTripPlaces}
              selectedPlace={selectedPlace}
              onPlaceSelect={setSelectedPlace}
              onTripPlaceRemove={handlePlaceRemove}
              onTripPlaceUpdate={async (tripPlace: TripPlace) => {
                // TripPlaceList에서 업데이트 했을 시 PlaceMap에서 선택된 장소도 업데이트
                if (selectedPlace?.id === tripPlace.place_id) {
                  setSelectedPlace({
                    ...selectedPlace,
                    custom_label: tripPlace.custom_label,
                    notes: tripPlace.notes || null,
                  });
                }
                
                await updatePlace(tripPlace.place_id, {
                  custom_label: tripPlace.custom_label,
                  notes: tripPlace.notes,
                });
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
            places={filteredTripPlaceEntities}
            selectedPlace={selectedPlace}
            onPlaceAdd={handlePlaceAdd}
            onPlaceSelect={setSelectedPlace}
            initialCenter={
              trip.initial_latitude && trip.initial_longitude ? {
                lat: trip.initial_latitude,
                lng: trip.initial_longitude
              } : undefined
            }
            onPlaceUpdate={async (updatedPlace: Place) => {
              // PlaceMap에서 장소 업데이트가 발생하면 해당하는 TripPlace의 custom_label도 업데이트
              const tripPlace = tripPlaces.find(tp => tp.place_id === updatedPlace.id);
              if (tripPlace) {
                // 여행 계획에서는 custom_label만 TripPlace에 반영하고, 
                // notes와 category는 개별 Place가 아닌 TripPlace에서 관리
                await updatePlace(tripPlace.place_id, {
                  custom_label: updatedPlace.custom_label,
                  notes: updatedPlace.notes,
                  category: updatedPlace.category
                });
                await updateTripPlace(tripPlace.id, {
                  custom_label: updatedPlace.custom_label,
                  notes: updatedPlace.notes,
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="wanderer-card bg-wanderer-cream-50 dark:bg-wanderer-sage-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-wanderer-cream-300 dark:border-wanderer-sage-600 bg-wanderer-sunset-500/10 dark:bg-wanderer-sunset-400/10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-wanderer-serif text-xl text-wanderer-sand-800 dark:text-wanderer-cream-100 mb-1">🗺️ 장소 추가</h2>
                  <p className="text-sm text-wanderer-sand-600 dark:text-wanderer-cream-400">여행에 새로운 장소를 추가해보세요</p>
                </div>
                <button
                  onClick={() => setShowAddPlaceModal(false)}
                  className="w-8 h-8 rounded-full bg-wanderer-cream-200 dark:bg-wanderer-sage-700 text-wanderer-sand-600 dark:text-wanderer-cream-300 hover:bg-wanderer-cream-300 dark:hover:bg-wanderer-sage-600 transition-colors flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-wanderer-sand-600 dark:text-wanderer-cream-400 mb-6 leading-relaxed">
                💡 기존에 저장한 장소를 추가하거나, 지도에서 새로운 장소를 검색해보세요.
              </p>
              
              {/* 기존 장소 목록 */}
              <div className="max-h-60 overflow-y-auto">
                <h3 className="font-medium text-wanderer-sand-800 dark:text-wanderer-cream-100 mb-4 flex items-center gap-2">
                  <span>📍</span> 저장된 장소에서 선택
                </h3>
                {allPlaces.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🌍</div>
                    <p className="text-wanderer-sand-500 dark:text-wanderer-cream-500 text-sm">아직 저장된 장소가 없어요</p>
                    <p className="text-wanderer-sand-400 dark:text-wanderer-cream-600 text-xs mt-1">지도에서 새로운 장소를 찾아보세요!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allPlaces
                      .filter(place => !tripPlaces.some(tp => tp.place_id === place.id))
                      .map(place => (
                        <div
                          key={place.id}
                          onClick={() => handleExistingPlaceAdd(place)}
                          className="place-card wanderer-card p-4 cursor-pointer hover:shadow-lg transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              {place.custom_label && <p className="font-medium text-wanderer-sand-800 dark:text-wanderer-cream-100 truncate mb-1">{place.custom_label}</p>}
                              {place.custom_label && <p className="text-xs text-wanderer-sand-500 dark:text-wanderer-cream-500 truncate mb-1">원래 이름: {place.name}</p>}
                              {!place.custom_label && <p className="font-medium text-wanderer-sand-800 dark:text-wanderer-cream-100 truncate mb-1">{place.name}</p>}
                              <p className="text-xs text-wanderer-sand-500 dark:text-wanderer-cream-500 truncate mb-2">{place.address}</p>
                              <span className="text-xs px-2 py-1 bg-wanderer-sunset-100 dark:bg-wanderer-sunset-900/30 text-wanderer-sunset-700 dark:text-wanderer-sunset-300 rounded-full">
                                {place.category}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExistingPlaceAdd(place);
                              }}
                              className="ml-3 px-3 py-1 bg-wanderer-sunset-500 text-white text-sm rounded-full hover:bg-wanderer-sunset-600 transition-colors"
                            >
                              ➕ 추가
                            </button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-wanderer-cream-300 dark:border-wanderer-sage-600">
                <button
                  onClick={() => setShowAddPlaceModal(false)}
                  className="w-full btn-wanderer-secondary"
                >
                  🗺️ 지도에서 새 장소 검색하기
                </button>
              </div>
            </div>
          </div>
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