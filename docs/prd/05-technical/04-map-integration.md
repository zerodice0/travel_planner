# 지도 통합 PRD

## 1. 개요

Kakao Maps 및 Google Maps 다중 Provider 지원을 통한 국내/해외 여행 최적화

## 2. 다중 Provider 전략

### 2.1 지원 정책
- **동시 지원**: Kakao Maps와 Google Maps 모두 통합
- **사용자 선택**: 지도 및 검색 Provider를 사용자가 직접 선택
- **상태 유지**: Provider 전환 시 장소 마커 및 필터 상태 유지
- **Fallback**: API 로드 실패 시 자동으로 다른 Provider로 전환

### 2.2 사용 시나리오

**국내 여행 (Kakao Maps 권장)**:
- 한국 내 장소 검색 정확도 우수
- 한글 주소 및 상호명 검색 최적화
- 대중교통 정보 연동

**해외 여행 (Google Maps 권장)**:
- 글로벌 커버리지 및 다국어 지원
- 해외 장소 데이터베이스 방대
- Street View, 리뷰 등 부가 기능

### 2.3 Provider 비교

| 항목 | Kakao Maps | Google Maps |
|------|-----------|-------------|
| 국내 정확도 | ★★★★★ | ★★★☆☆ |
| 해외 커버리지 | ★☆☆☆☆ | ★★★★★ |
| 무료 할당량 | 300K req/월 | $200/월 |
| 초과 비용 | ₩0.33/req | $7/1K req |
| 주요 용도 | 국내 여행 | 해외 여행 |

## 3. API 선택 (Legacy)

### 3.1 Kakao Maps
- 국내 최적화
- 장소 검색 정확도 높음
- 무료 할당량: 300,000 req/month
- 비용: 초과 시 ₩0.33/req

### 3.2 Google Maps
- 글로벌 커버리지
- 풍부한 기능
- 무료 할당량: $200/month
- 비용: 초과 시 $7/1000 req

## 3. Kakao Maps 통합

### 3.1 SDK 초기화

```html
<!-- index.html -->
<script
  type="text/javascript"
  src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_APP_KEY&libraries=services,clusterer"
></script>
```

```typescript
// useKakaoMap.ts
import { useEffect, useRef, useState } from 'react';

interface MapOptions {
  center: { lat: number; lng: number };
  level?: number;
}

function useKakaoMap(containerId: string, options: MapOptions) {
  const mapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services,clusterer&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById(containerId);
        const { center, level = 3 } = options;

        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level
        });

        mapRef.current = map;
        setIsLoaded(true);
      });
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return { map: mapRef.current, isLoaded };
}
```

### 3.2 장소 검색

```typescript
function useKakaoPlacesSearch() {
  const [isSearching, setIsSearching] = useState(false);

  const search = async (keyword: string): Promise<Place[]> => {
    return new Promise((resolve, reject) => {
      const ps = new window.kakao.maps.services.Places();

      ps.keywordSearch(keyword, (data: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const places = data.map((item: any) => ({
            id: item.id,
            name: item.place_name,
            address: item.address_name,
            category: item.category_name,
            phone: item.phone,
            latitude: parseFloat(item.y),
            longitude: parseFloat(item.x),
            url: item.place_url
          }));

          resolve(places);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          resolve([]);
        } else {
          reject(new Error('검색 실패'));
        }
      });
    });
  };

  return { search, isSearching };
}
```

### 3.3 마커 관리

```typescript
class MarkerManager {
  private markers: Map<string, any> = new Map();
  private map: any;

  constructor(map: any) {
    this.map = map;
  }

  addMarker(place: Place): void {
    const position = new window.kakao.maps.LatLng(
      place.latitude,
      place.longitude
    );

    const marker = new window.kakao.maps.Marker({
      position,
      image: this.getMarkerImage(place.visited, place.category)
    });

    marker.setMap(this.map);
    this.markers.set(place.id, marker);

    // InfoWindow
    const infowindow = new window.kakao.maps.InfoWindow({
      content: this.getInfoWindowContent(place)
    });

    window.kakao.maps.event.addListener(marker, 'click', () => {
      infowindow.open(this.map, marker);
    });
  }

  removeMarker(placeId: string): void {
    const marker = this.markers.get(placeId);
    if (marker) {
      marker.setMap(null);
      this.markers.delete(placeId);
    }
  }

  clearMarkers(): void {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers.clear();
  }

  private getMarkerImage(visited: boolean, category: string): any {
    const color = visited ? '#4CAF50' : '#F44336';
    const imageSrc = `/markers/${category}-${color}.png`;
    const imageSize = new window.kakao.maps.Size(32, 32);
    const imageOption = { offset: new window.kakao.maps.Point(16, 32) };

    return new window.kakao.maps.MarkerImage(
      imageSrc,
      imageSize,
      imageOption
    );
  }

  private getInfoWindowContent(place: Place): string {
    return `
      <div style="padding: 12px;">
        <strong>${place.name}</strong>
        <p>${place.category}</p>
        <button onclick="window.navigateToDetail('${place.id}')">
          상세 보기
        </button>
      </div>
    `;
  }
}
```

### 3.4 클러스터링

```typescript
import MarkerClusterer from '@kakao/maps-sdk-clusterer';

function setupClustering(map: any, places: Place[]): void {
  const markers = places.map(place => {
    return new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(
        place.latitude,
        place.longitude
      )
    });
  });

  const clusterer = new MarkerClusterer({
    map: map,
    averageCenter: true,
    minLevel: 10,
    calculator: [10, 30, 50],
    styles: [
      {
        width: '40px',
        height: '40px',
        background: 'rgba(255, 0, 0, 0.8)',
        borderRadius: '50%',
        color: '#fff',
        textAlign: 'center',
        lineHeight: '40px',
        fontSize: '14px'
      }
    ]
  });

  clusterer.addMarkers(markers);
}
```

## 4. 현재 위치

```typescript
async function getCurrentPosition(): Promise<Location | null> {
  if (!navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('위치 권한 거부:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
}
```

## 5. 거리 계산 (Haversine)

```typescript
function calculateDistance(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371e3; // 지구 반지름 (m)
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180;
  const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;

  const x =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * c; // meters
}
```

## 6. 성능 최적화

### 6.1 마커 가상화
```typescript
// 현재 보이는 영역의 마커만 렌더링
function renderVisibleMarkers(map: any, places: Place[]): void {
  const bounds = map.getBounds();

  const visiblePlaces = places.filter(place => {
    const position = new window.kakao.maps.LatLng(
      place.latitude,
      place.longitude
    );
    return bounds.contain(position);
  });

  // visiblePlaces만 마커 생성
}
```

### 6.2 디바운스
```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce((keyword: string) => {
  search(keyword);
}, 300);
```

## 7. 보안

```typescript
// 환경 변수
NEXT_PUBLIC_KAKAO_MAP_KEY=your_javascript_key

// 도메인 제한 (Kakao Console에서 설정)
// - http://localhost:3000
// - https://travel-planner.com
```

## 8. 에러 처리

```typescript
try {
  const places = await search(keyword);
} catch (error) {
  if (error.message === 'ZERO_RESULT') {
    // 검색 결과 없음
  } else if (error.message === 'ERROR') {
    // API 오류
  } else {
    // 기타 오류
  }
}
```

## 9. 성능 목표

- SDK 로드: < 1초
- 지도 렌더링: < 1초
- 마커 100개 표시: < 500ms
- 장소 검색: < 500ms

## 10. Google Maps 통합

### 10.1 SDK 초기화

```typescript
// useGoogleMap.ts
import { Loader } from '@googlemaps/js-api-loader';

function useGoogleMap(containerId: string, options: MapOptions) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places']
    });

    loader.load().then(async () => {
      const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
      const container = document.getElementById(containerId);

      const map = new Map(container!, {
        center: options.center,
        zoom: options.level || 14,
        mapTypeControl: true,
        fullscreenControl: false
      });

      mapRef.current = map;
      setIsLoaded(true);
    });
  }, []);

  return { map: mapRef.current, isLoaded };
}
```

### 10.2 장소 검색

**참고**: Google Maps는 2025년 3월부터 새로운 Place API를 권장합니다. 아래는 최신 API를 사용한 구현입니다.

```typescript
// useGooglePlacesSearch.ts
import { useState, useCallback } from 'react';

function useGooglePlacesSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (keyword: string): Promise<SearchResult[]> => {
    if (!keyword.trim()) {
      return [];
    }

    if (!google?.maps) {
      setError('Google Maps SDK not loaded');
      return [];
    }

    setIsSearching(true);
    setError(null);

    try {
      // Import Places library (새로운 API)
      const { Place } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;

      // Place.searchByText() 사용 (PlacesService 대체)
      const request = {
        textQuery: keyword,
        fields: ['displayName', 'formattedAddress', 'location', 'types', 'id'],
        language: 'ko',
        maxResultCount: 20
      };

      const { places } = await Place.searchByText(request);

      setIsSearching(false);

      if (!places || places.length === 0) {
        return [];
      }

      // 새로운 Place API 응답 매핑
      const searchResults = places.map(place => ({
        id: place.id,
        name: place.displayName || '',
        address: place.formattedAddress || '',
        category: mapGoogleCategory(place.types || []),
        latitude: place.location?.lat() ?? 0,
        longitude: place.location?.lng() ?? 0,
        url: `https://maps.google.com/?q=place_id:${place.id}`
      }));

      return searchResults;
    } catch (error) {
      setIsSearching(false);
      setError('검색 중 오류가 발생했습니다');
      console.error('Google Places search error:', error);
      return [];
    }
  }, []);

  return { search, isSearching, error };
}

function mapGoogleCategory(types: string[]): string {
  const categoryMap: Record<string, string> = {
    'restaurant': 'restaurant',
    'cafe': 'cafe',
    'tourist_attraction': 'tourist_attraction',
    'shopping_mall': 'shopping',
    'store': 'shopping',
    'museum': 'culture',
    'art_gallery': 'culture',
    'park': 'nature',
    'natural_feature': 'nature',
    'lodging': 'accommodation',
    'hotel': 'accommodation'
  };

  for (const type of types) {
    if (categoryMap[type]) {
      return categoryMap[type];
    }
  }
  return 'etc';
}
```

**주요 변경사항 (2025년 3월 마이그레이션)**:
- `PlacesService.textSearch()` → `Place.searchByText()` (deprecated API 대체)
- Callback 방식 → Promise/async-await 방식
- 필드 매핑: `name` → `displayName`, `formatted_address` → `formattedAddress`
- 필수 필드 명시로 API 비용 최적화
- 에러 처리 개선 (try-catch)

### 10.3 마커 관리

```typescript
// GoogleMarkerManager.ts
class GoogleMarkerManager {
  private markers: Map<string, google.maps.Marker> = new Map();
  private infoWindows: Map<string, google.maps.InfoWindow> = new Map();
  private map: google.maps.Map;

  constructor(map: google.maps.Map) {
    this.map = map;
  }

  addMarker(place: Place): void {
    const marker = new google.maps.Marker({
      position: {
        lat: place.latitude,
        lng: place.longitude
      },
      map: this.map,
      title: place.name,
      icon: this.getMarkerIcon(place.visited)
    });

    this.markers.set(place.id, marker);

    const infoWindow = new google.maps.InfoWindow({
      content: this.getInfoWindowContent(place)
    });

    this.infoWindows.set(place.id, infoWindow);

    marker.addListener('click', () => {
      this.closeAllInfoWindows();
      infoWindow.open(this.map, marker);
    });
  }

  removeMarker(placeId: string): void {
    const marker = this.markers.get(placeId);
    if (marker) {
      marker.setMap(null);
      this.markers.delete(placeId);
    }

    const infoWindow = this.infoWindows.get(placeId);
    if (infoWindow) {
      infoWindow.close();
      this.infoWindows.delete(placeId);
    }
  }

  clearMarkers(): void {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers.clear();
    this.closeAllInfoWindows();
    this.infoWindows.clear();
  }

  private getMarkerIcon(visited: boolean): google.maps.Icon {
    const color = visited ? 'green' : 'red';
    return {
      url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
      scaledSize: new google.maps.Size(32, 32)
    };
  }

  private getInfoWindowContent(place: Place): string {
    return `
      <div style="padding: 12px; min-width: 200px;">
        <div style="font-weight: 600; margin-bottom: 8px;">${place.name}</div>
        <div style="color: #666; font-size: 12px;">${place.address}</div>
        ${place.visited ? '<div style="color: #10B981; margin-top: 4px;">✓ 방문 완료</div>' : ''}
      </div>
    `;
  }

  private closeAllInfoWindows(): void {
    this.infoWindows.forEach(infoWindow => infoWindow.close());
  }
}
```

## 11. Provider 선택 UI/UX

### 11.1 지도 Provider 선택

**UI 위치**: MapPage 상단 (검색바 우측)

```tsx
<div className="flex gap-2">
  <button
    onClick={() => setMapProvider('kakao')}
    className={mapProvider === 'kakao' ? 'active' : ''}
  >
    카카오맵
  </button>
  <button
    onClick={() => setMapProvider('google')}
    className={mapProvider === 'google' ? 'active' : ''}
  >
    구글맵
  </button>
</div>
```

**동작**:
- Provider 변경 시 지도 다시 초기화
- 사용자가 추가한 장소 마커는 유지
- 현재 지도 중심점 및 줌 레벨 유지

### 11.2 검색 Provider 선택

**UI 위치**: 검색바 내부 (탭 형태)

```tsx
<div className="flex border-b">
  <button
    onClick={() => setSearchProvider('kakao')}
    className={searchProvider === 'kakao' ? 'tab-active' : 'tab'}
  >
    카카오 검색
  </button>
  <button
    onClick={() => setSearchProvider('google')}
    className={searchProvider === 'google' ? 'tab-active' : 'tab'}
  >
    구글 검색
  </button>
</div>
```

**동작**:
- 검색 버튼 클릭 시 선택된 Provider로 검색
- 검색 결과 Provider 레이블 표시
- 검색 결과 없을 경우 다른 Provider 시도 제안

### 11.3 Context 및 상태 관리

```typescript
// MapProviderContext.tsx
interface MapProviderContextType {
  mapProvider: 'kakao' | 'google';
  searchProvider: 'kakao' | 'google';
  setMapProvider: (provider: 'kakao' | 'google') => void;
  setSearchProvider: (provider: 'kakao' | 'google') => void;
}

const MapProviderContext = createContext<MapProviderContextType | null>(null);

export function MapProviderProvider({ children }: { children: ReactNode }) {
  const [mapProvider, setMapProvider] = useState<'kakao' | 'google'>(() => {
    return (localStorage.getItem('mapProvider') as 'kakao' | 'google') || 'kakao';
  });

  const [searchProvider, setSearchProvider] = useState<'kakao' | 'google'>(() => {
    return (localStorage.getItem('searchProvider') as 'kakao' | 'google') || 'kakao';
  });

  useEffect(() => {
    localStorage.setItem('mapProvider', mapProvider);
  }, [mapProvider]);

  useEffect(() => {
    localStorage.setItem('searchProvider', searchProvider);
  }, [searchProvider]);

  return (
    <MapProviderContext.Provider
      value={{ mapProvider, searchProvider, setMapProvider, setSearchProvider }}
    >
      {children}
    </MapProviderContext.Provider>
  );
}
```

## 12. 환경 변수

```bash
# Kakao Maps
VITE_KAKAO_MAP_KEY=your_kakao_javascript_key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**보안 설정**:
- Kakao: 도메인 제한 (Kakao Developers Console)
- Google: API Key 제한 (Google Cloud Console)
  - HTTP referrer 제한
  - Maps JavaScript API, Places API 활성화
