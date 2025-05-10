// src/app/trips/[id]/record/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTrip } from '@/entities/trip/hooks';
import { usePlaces } from '@/entities/place/hooks';
import { PlaceMap } from '@/widgets/place-map/PlaceMap';
import { NearbyPlacesList } from '@/features/place/nearby-places/ui/NearbyPlacesList';
import { VisitForm } from '@/widgets/visit-forms/VisitForms';
import { Place } from '@/entities/place/types';

// 지구 반경 (km) 상수 추가
const EARTH_RADIUS = 6371;

export default function TripRecordPage() {
  const { id } = useParams();
  const { trip } = useTrip(id as string); // tripLoading 제거(미사용)
  const { places } = usePlaces(); // placesLoading 제거(미사용)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showVisitForm, setShowVisitForm] = useState(false);
  
  // 사용자 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('위치 정보를 가져올 수 없습니다:', error),
        { enableHighAccuracy: true }
      );
    }
  }, []);
  
  // 거리 계산 함수 (하버사인 공식)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return EARTH_RADIUS * c; // 이제 정의된 상수 사용
  };
  
  // 사용자 위치 기준으로 근처 장소 필터링 (5km 이내)
  const nearbyPlaces = userLocation ? places.filter(place => {
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng, 
      place.latitude, place.longitude
    );
    return distance <= 5; // 5km 이내
  }) : [];
  
  // 거리순으로 정렬
  const sortedNearbyPlaces = userLocation 
    ? [...nearbyPlaces].sort((a, b) => {
        const distanceA = calculateDistance(
          userLocation.lat, userLocation.lng, 
          a.latitude, a.longitude
        );
        const distanceB = calculateDistance(
          userLocation.lat, userLocation.lng, 
          b.latitude, b.longitude
        );
        return distanceA - distanceB;
      })
    : nearbyPlaces;

  // Place 타입 상태 업데이트를 위한 핸들러
  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
    setShowVisitForm(true);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-white shadow">
        <h1 className="text-2xl font-bold">{trip?.title || '여행 기록'}</h1>
        <p className="text-gray-600">
          {userLocation 
            ? '현재 위치를 기준으로 근처 관심 장소를 확인하세요.' 
            : '위치 정보를 불러오는 중...'}
        </p>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 overflow-auto p-4 border-r">
          <NearbyPlacesList 
            places={sortedNearbyPlaces}
            userLocation={userLocation}
            onPlaceSelect={handlePlaceSelect} // 타입 문제 해결
          />
        </div>
        
        <div className="w-2/3 relative">
          <PlaceMap 
            places={sortedNearbyPlaces}
            userLocation={userLocation}
            selectedPlace={selectedPlace}
          />
          
          {showVisitForm && selectedPlace && (
            <div className="absolute bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
              <VisitForm 
                tripId={id as string}
                place={selectedPlace}
                onComplete={() => {
                  setShowVisitForm(false);
                  setSelectedPlace(null);
                }}
                onCancel={() => {
                  setShowVisitForm(false);
                  setSelectedPlace(null);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}