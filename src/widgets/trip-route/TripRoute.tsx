'use client';

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { Visit } from '@/entities/visit/types';

interface TripRouteProps {
  visits: Visit[];
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

export function TripRoute({ visits }: TripRouteProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // 모든 방문 장소를 포함하는 경계 계산
    if (visits.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      visits.forEach(visit => {
        if (visit.places_of_interest) {
          bounds.extend({
            lat: visit.places_of_interest.latitude,
            lng: visit.places_of_interest.longitude
          });
        } else if (visit.custom_place_lat && visit.custom_place_lng) {
          bounds.extend({
            lat: visit.custom_place_lat,
            lng: visit.custom_place_lng
          });
        }
      });
      
      setMapBounds(bounds);
      map.fitBounds(bounds);
    }
  }, [visits]);
  
  // 방문 지점 간 선을 그리기 위한 경로 좌표
  const routePath = visits.map(visit => {
    if (visit.places_of_interest) {
      return {
        lat: visit.places_of_interest.latitude,
        lng: visit.places_of_interest.longitude
      };
    } else if (visit.custom_place_lat && visit.custom_place_lng) {
      return {
        lat: visit.custom_place_lat,
        lng: visit.custom_place_lng
      };
    }
    return null;
  }).filter(Boolean) as google.maps.LatLngLiteral[];
  
  // 지도 경계 자동 조정
  useEffect(() => {
    if (map && mapBounds) {
      map.fitBounds(mapBounds);
    }
  }, [map, mapBounds]);
  
  if (loadError) {
    return <div className="p-4">지도를 불러오는 중 오류가 발생했습니다.</div>;
  }
  
  if (!isLoaded) {
    return <div className="p-4">지도를 불러오는 중...</div>;
  }
  
  // 중심 좌표 계산
  const centerCoord = visits.length > 0 && visits[0].places_of_interest ? 
    { 
      lat: visits[0].places_of_interest.latitude, 
      lng: visits[0].places_of_interest.longitude 
    } : 
    defaultCenter;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={centerCoord}
      zoom={13}
      onLoad={onMapLoad}
    >
      {/* 방문 경로 선 */}
      {routePath.length > 1 && (
        <Polyline
          path={routePath}
          options={{
            strokeColor: '#3B82F6',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            geodesic: true
          }}
        />
      )}
      
      {/* 방문 지점 마커 */}
      {visits.map((visit, index) => {
        const position = visit.places_of_interest ? 
          {
            lat: visit.places_of_interest.latitude,
            lng: visit.places_of_interest.longitude
          } : 
          visit.custom_place_lat && visit.custom_place_lng ? 
          {
            lat: visit.custom_place_lat,
            lng: visit.custom_place_lng
          } : 
          null;
        
        if (!position) return null;
        
        const category = visit.places_of_interest?.category || '기타';
        
        return (
          <Marker
            key={visit.id}
            position={position}
            onClick={() => setSelectedVisit(visit)}
            label={{
              text: (index + 1).toString(),
              color: 'white',
              fontWeight: 'bold'
            }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: categoryColors[category as keyof typeof categoryColors] || 'gray',
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: 'white',
              scale: 15
            }}
          />
        );
      })}
      
      {/* 선택된 방문 지점 정보 창 */}
      {selectedVisit && (
        <InfoWindow
          position={
            selectedVisit.places_of_interest ? 
            {
              lat: selectedVisit.places_of_interest.latitude,
              lng: selectedVisit.places_of_interest.longitude
            } : 
            {
              lat: selectedVisit.custom_place_lat!,
              lng: selectedVisit.custom_place_lng!
            }
          }
          onCloseClick={() => setSelectedVisit(null)}
        >
          <div className="p-2 max-w-[300px]">
            <h3 className="text-lg font-semibold">
              {selectedVisit.places_of_interest?.name || selectedVisit.custom_place_name}
            </h3>
            <p className="text-sm text-gray-600">
              {new Date(selectedVisit.visit_time).toLocaleString()}
            </p>
            {selectedVisit.notes && (
              <p className="text-sm mt-2">{selectedVisit.notes}</p>
            )}
            {selectedVisit.rating !== null && selectedVisit.rating > 0 && (
              <div className="mt-1 flex">
                {Array.from({ length: selectedVisit.rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}