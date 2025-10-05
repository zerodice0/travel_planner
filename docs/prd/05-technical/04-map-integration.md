# 지도 통합 PRD

## 1. 개요

Kakao Maps API 통합 및 지도 기능 구현

## 2. API 선택

### 2.1 Kakao Maps (1순위)
- 국내 최적화
- 장소 검색 정확도 높음
- 무료 할당량: 300,000 req/month
- 비용: 초과 시 ₩0.33/req

### 2.2 Google Maps (2순위)
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
