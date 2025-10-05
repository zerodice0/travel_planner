# 메인 지도 화면 PRD

## 1. 개요

### 1.1 화면 목적
- 지도 기반 시각적 장소 관리
- 장소 검색 및 추가
- 지도에서 장소 탐색 및 필터링

### 1.2 주요 사용자 플로우
```
지도 화면 → 장소 검색 → 장소 추가 → 지도에 마커 표시
          ↓                        ↓
          마커 클릭 → 장소 상세    목록에 추가
          필터 적용 → 카테고리별 표시
```

### 1.3 성공 지표
- 지도 로딩 시간: < 2초
- 장소 추가 성공률: > 90%
- 일일 사용 시간: > 5분

## 2. 사용자 스토리

### US-1: 장소 검색 및 추가
**As a** 사용자
**I want** 지도에서 장소를 검색하고 추가하고 싶다
**So that** 방문하고 싶은 장소를 기록할 수 있다

### US-2: 지도에서 장소 확인
**As a** 사용자
**I want** 추가한 장소를 지도에서 한눈에 보고 싶다
**So that** 지리적 위치를 파악할 수 있다

### US-3: 카테고리 필터링
**As a** 사용자
**I want** 특정 카테고리의 장소만 지도에 표시하고 싶다
**So that** 원하는 유형의 장소를 빠르게 찾을 수 있다

## 3. 기능 요구사항

### 3.1 필수 기능 (Phase 1)

#### F-1: 지도 표시
- [ ] Kakao Maps 또는 Google Maps 연동
- [ ] 초기 위치: 사용자 현재 위치 (권한 허용 시)
- [ ] 기본 위치: 서울 시청 (권한 거부 시)
- [ ] 줌 레벨: 14 (도시 단위)
- [ ] 지도 타입: 기본 (일반 지도)

**지도 초기화:**
```typescript
const mapOptions = {
  center: userLocation || { lat: 37.5665, lng: 126.9780 }, // 서울 시청
  level: 3, // Kakao Maps (3 = 약 50m)
  zoom: 14 // Google Maps
};
```

#### F-2: 현재 위치
- [ ] "현재 위치" 버튼 (우측 하단)
- [ ] 위치 권한 요청
- [ ] 현재 위치로 지도 이동
- [ ] 현재 위치 마커 표시 (파란 점)

**위치 권한:**
```typescript
async function requestLocationPermission() {
  if (!navigator.geolocation) {
    alert('위치 서비스를 지원하지 않는 브라우저입니다');
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('위치 권한 거부:', error);
        resolve(null);
      }
    );
  });
}
```

#### F-3: 장소 검색
- [ ] 검색 바 (상단)
- [ ] 검색어 입력 (debounce 300ms)
- [ ] 자동완성 결과 (최대 5개)
- [ ] 검색 결과 리스트
- [ ] 장소 선택 → 지도 이동 + 마커 표시

**지도 API 연동 (Kakao):**
```typescript
const kakao = window.kakao;
const ps = new kakao.maps.services.Places();

function searchPlaces(keyword: string) {
  return new Promise((resolve, reject) => {
    ps.keywordSearch(keyword, (data, status) => {
      if (status === kakao.maps.services.Status.OK) {
        resolve(data.map(place => ({
          id: place.id,
          name: place.place_name,
          address: place.address_name,
          category: place.category_name,
          phone: place.phone,
          latitude: parseFloat(place.y),
          longitude: parseFloat(place.x),
          url: place.place_url
        })));
      } else {
        reject(new Error('검색 실패'));
      }
    });
  });
}
```

**카테고리 자동 매핑:**
```typescript
function mapCategory(kakaoCategory: string): string {
  const categoryMap: Record<string, string> = {
    '음식점': 'restaurant',
    '카페': 'cafe',
    '관광명소': 'tourist_attraction',
    '쇼핑': 'shopping',
    '문화시설': 'culture',
    '자연': 'nature',
    '숙박': 'accommodation'
  };

  // "음식점 > 한식 > 냉면" → "음식점"
  const mainCategory = kakaoCategory.split('>')[0].trim();
  return categoryMap[mainCategory] || 'etc';
}
```

#### F-4: 장소 추가
- [ ] 검색 결과에서 "추가" 버튼
- [ ] 장소 정보 저장
  - 이름, 주소, 전화번호
  - 위도/경도
  - 카테고리 (자동 매핑)
  - 외부 URL (Kakao 지도 링크)
- [ ] 성공 토스트: "{장소명}이(가) 추가되었습니다"
- [ ] 지도에 마커 표시

**API 요청:**
```typescript
POST /api/places
{
  name: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  category: string;
  externalUrl?: string;
  externalId?: string; // Kakao Place ID
}

Response 201:
{
  id: string;
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  visited: false;
  createdAt: string;
}
```

#### F-5: 마커 표시
- [ ] 추가한 장소 마커 표시
- [ ] 마커 색상:
  - 방문 완료: 초록색
  - 방문 전: 빨간색
- [ ] 카테고리별 아이콘 (Phase 2)
- [ ] 마커 클릭 → InfoWindow 표시
  - 장소명
  - 카테고리
  - "상세 보기" 버튼

**마커 생성 (Kakao):**
```typescript
function createMarker(place: Place, map: any) {
  const markerPosition = new kakao.maps.LatLng(
    place.latitude,
    place.longitude
  );

  const marker = new kakao.maps.Marker({
    position: markerPosition,
    image: getMarkerImage(place.visited, place.category)
  });

  marker.setMap(map);

  // InfoWindow
  const infowindow = new kakao.maps.InfoWindow({
    content: `
      <div style="padding: 12px;">
        <strong>${place.name}</strong>
        <p>${place.category}</p>
        <button onclick="navigateToDetail('${place.id}')">
          상세 보기
        </button>
      </div>
    `
  });

  kakao.maps.event.addListener(marker, 'click', () => {
    infowindow.open(map, marker);
  });

  return marker;
}
```

#### F-6: 카테고리 필터
- [ ] 필터 버튼 (좌측 상단)
- [ ] 카테고리 체크리스트 모달
  - 전체
  - 맛집
  - 카페
  - 관광
  - 쇼핑
  - 문화
  - 자연
  - 숙박
  - 기타
- [ ] 선택한 카테고리만 마커 표시
- [ ] 필터 적용 시 마커 갱신

**필터링 로직:**
```typescript
function filterMarkers(
  markers: Marker[],
  selectedCategories: string[]
) {
  markers.forEach(marker => {
    const place = marker.place;
    const shouldShow = selectedCategories.length === 0 ||
      selectedCategories.includes(place.category);

    if (shouldShow) {
      marker.setMap(map);
    } else {
      marker.setMap(null);
    }
  });
}
```

### 3.2 중요 기능 (Phase 2)

#### F-7: 클러스터링
- [ ] 많은 마커를 그룹화
- [ ] 클러스터 클릭 → 확대
- [ ] 클러스터 숫자 표시

**클러스터링 (Kakao):**
```typescript
import MarkerClusterer from '@kakao/maps-sdk-clusterer';

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
      lineHeight: '40px'
    }
  ]
});

clusterer.addMarkers(markers);
```

#### F-8: 지도 스타일 변경
- [ ] 지도 타입 선택 버튼
- [ ] 일반 지도 (기본)
- [ ] 위성 지도
- [ ] 하이브리드 (위성 + 도로)

#### F-9: 방문 여부 토글
- [ ] InfoWindow에서 방문 체크박스
- [ ] 체크 시 마커 색상 변경
- [ ] API 업데이트

#### F-10: 목록에 추가 (빠른 추가)
- [ ] InfoWindow에서 "목록에 추가" 버튼
- [ ] 목록 선택 모달
- [ ] 선택 시 즉시 추가

### 3.3 추가 기능 (Phase 3)

#### F-11: 거리 측정
- [ ] 거리 측정 도구
- [ ] 두 지점 선택
- [ ] 직선 거리 표시 (km)

#### F-12: AR 모드
- [ ] 카메라 기반 AR 뷰
- [ ] 주변 장소 실시간 표시
- [ ] 방향 및 거리 표시

#### F-13: 오프라인 지도
- [ ] 지역별 지도 다운로드
- [ ] 오프라인 모드 지원
- [ ] 캐싱 관리

## 4. UI/UX 사양

### 4.1 레이아웃

```
┌─────────────────────┐
│ [필터] 검색... [현위]│ 헤더
├─────────────────────┤
│                     │
│                     │
│       지  도        │
│                     │
│        📍          │
│                     │
│                     │
│                     │
│             [📍내위치]│
├─────────────────────┤
│ [홈][지도][목록][설정]│ 네비게이션
└─────────────────────┘
```

### 4.2 인터랙션

#### 지도 제스처
- 드래그: 지도 이동
- 핀치: 줌 인/아웃
- 더블 탭: 줌 인
- 두 손가락 탭: 줌 아웃

#### 검색
- 입력 시: 자동완성 표시
- 결과 선택: 지도 이동 + 임시 마커
- 추가 버튼: 장소 저장 + 영구 마커

#### 마커
- 탭: InfoWindow 표시
- InfoWindow 외부 탭: 닫기

### 4.3 접근성
- 지도 대체 텍스트
- 검색 결과 스크린 리더
- 키보드 네비게이션 (웹)
- 고대비 마커

## 5. 기술 사양

### 5.1 프론트엔드

#### 지도 SDK 선택
- **1순위**: Kakao Maps (국내 최적화)
- **2순위**: Google Maps (글로벌)

#### 컴포넌트 구조
```typescript
// MapScreen.tsx
interface MapScreenProps {
  initialCenter?: { lat: number; lng: number };
}

interface MapState {
  map: any | null;
  markers: Marker[];
  selectedCategories: string[];
  searchResults: Place[];
  isSearching: boolean;
}

// SearchBar.tsx
interface SearchBarProps {
  onSearch: (keyword: string) => void;
  onResultSelect: (place: Place) => void;
}

// CategoryFilter.tsx
interface CategoryFilterProps {
  categories: string[];
  selectedCategories: string[];
  onChange: (selected: string[]) => void;
}

// PlaceMarker.tsx
interface PlaceMarkerProps {
  place: Place;
  map: any;
  onClick: (place: Place) => void;
}
```

#### Kakao Maps 초기화
```typescript
// useKakaoMap.ts
import { useEffect, useRef, useState } from 'react';

function useKakaoMap(containerId: string, options: MapOptions) {
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services,clusterer&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById(containerId);
        const kakaoMap = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(
            options.center.lat,
            options.center.lng
          ),
          level: options.level || 3
        });

        setMap(kakaoMap);
        setIsLoaded(true);
      });
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return { map, isLoaded };
}
```

### 5.2 백엔드

#### API 엔드포인트
```typescript
// places.controller.ts
@Controller('places')
export class PlacesController {
  @Get()
  async getPlaces(@CurrentUser() user: User) {
    return this.placesService.findByUserId(user.id);
  }

  @Post()
  @HttpCode(201)
  async createPlace(
    @CurrentUser() user: User,
    @Body() dto: CreatePlaceDto
  ) {
    return this.placesService.create(user.id, dto);
  }

  @Patch(':id/visit')
  async toggleVisit(
    @CurrentUser() user: User,
    @Param('id') placeId: string
  ) {
    return this.placesService.toggleVisit(user.id, placeId);
  }
}

// create-place.dto.ts
export class CreatePlaceDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  externalUrl?: string;

  @IsOptional()
  @IsString()
  externalId?: string;
}
```

## 6. 데이터 모델

### 6.1 Place
```typescript
interface Place {
  id: string;
  userId: string;
  name: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  category: string;
  customCategory?: string;
  customLabel?: string;
  visited: boolean;
  visitedAt?: Date;
  visitNote?: string;
  externalUrl?: string;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 7. API 명세

### GET /api/places
사용자의 모든 장소

**Response 200:**
```json
{
  "places": [
    {
      "id": "uuid-1",
      "name": "맛집 A",
      "address": "서울 강남구",
      "latitude": 37.5,
      "longitude": 127.0,
      "category": "restaurant",
      "visited": false,
      "createdAt": "2025-10-05T10:00:00Z"
    }
  ]
}
```

### POST /api/places
장소 추가

**Request:**
```json
{
  "name": "맛집 A",
  "address": "서울 강남구",
  "phone": "02-1234-5678",
  "latitude": 37.5,
  "longitude": 127.0,
  "category": "restaurant",
  "externalId": "kakao-12345"
}
```

**Response 201:**
```json
{
  "id": "uuid-1",
  "name": "맛집 A",
  "category": "restaurant",
  "visited": false,
  "createdAt": "2025-10-05T10:00:00Z"
}
```

### PATCH /api/places/:id/visit
방문 여부 토글

**Response 200:**
```json
{
  "id": "uuid-1",
  "visited": true,
  "visitedAt": "2025-10-05T12:00:00Z"
}
```

## 8. 성능 요구사항

### 8.1 지도 로딩
- SDK 로드: < 1초
- 지도 렌더링: < 1초
- 마커 표시: < 500ms (100개 기준)

### 8.2 검색
- API 응답: < 500ms
- 자동완성: < 300ms

### 8.3 최적화
- 마커 가상화 (보이는 영역만)
- 클러스터링 (100개 이상)
- 이미지 캐싱

## 9. 보안 고려사항

### 9.1 API 키
- 환경 변수 저장
- 도메인 제한 (Kakao/Google Console)
- 요청 제한 (Rate Limiting)

### 9.2 위치 정보
- 사용자 동의 후 수집
- 서버 저장 시 암호화
- 정밀 위치 수집 최소화

## 10. 테스트 계획

### 10.1 Unit 테스트
```typescript
describe('MapScreen', () => {
  it('지도 초기화', () => {
    // 테스트 코드
  });

  it('장소 검색 및 마커 표시', async () => {
    // 테스트 코드
  });

  it('카테고리 필터링', () => {
    // 테스트 코드
  });
});
```

### 10.2 E2E 시나리오
1. 지도 로드 → 현재 위치 표시
2. 장소 검색 → 결과 선택 → 추가
3. 마커 클릭 → InfoWindow → 상세 화면
4. 필터 적용 → 카테고리별 표시

## 11. 향후 개선사항

### 11.1 UX 개선
- 지도 테마 (다크 모드)
- 3D 지도 뷰
- 거리뷰 통합

### 11.2 기능 확장
- 경로 안내
- 주변 장소 추천
- 히트맵 (방문 빈도)

### 11.3 성능
- WebGL 렌더링
- 서버 사이드 클러스터링
- CDN 최적화
