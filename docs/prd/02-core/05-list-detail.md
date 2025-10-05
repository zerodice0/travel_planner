# 목록 상세 화면 PRD

## 1. 개요

### 1.1 화면 목적
- 목록에 포함된 장소 관리
- 장소 추가/제거
- 경로 최적화 및 진행률 추적

### 1.2 주요 사용자 플로우
```
목록 상세 → 장소 리스트 → 장소 선택 → 장소 상세
          ↓
          장소 추가 → 검색/선택 → 추가
          경로 최적화 → 순서 조정
```

### 1.3 성공 지표
- 목록당 평균 장소: > 5개
- 경로 최적화 사용률: > 30%
- 장소 방문 완료율: > 60%

## 2. 사용자 스토리

### US-1: 장소 리스트 확인
**As a** 사용자
**I want** 목록에 포함된 장소를 한눈에 보고 싶다
**So that** 방문 계획을 세울 수 있다

### US-2: 장소 추가
**As a** 사용자
**I want** 목록에 장소를 쉽게 추가하고 싶다
**So that** 테마에 맞는 장소를 모을 수 있다

### US-3: 경로 최적화
**As a** 사용자
**I want** 효율적인 방문 순서를 알고 싶다
**So that** 시간을 절약할 수 있다

## 3. 기능 요구사항

### 3.1 필수 기능 (Phase 1)

#### F-1: 헤더
- [ ] 뒤로가기 버튼
- [ ] 목록 이름 (제목)
- [ ] 더보기 메뉴 (우측 상단)
  - 목록 편집
  - 목록 삭제
  - 공유 (Phase 2)

#### F-2: 목록 정보 카드
- [ ] 아이콘 (이모지/이미지)
- [ ] 목록 이름
- [ ] 설명 (있을 경우)
- [ ] 진행률 바
- [ ] 통계:
  - 총 장소 수
  - 방문 완료 수
  - 방문률 (%)

**레이아웃:**
```
┌─────────────────┐
│   🍔 맛집 탐방   │
│  서울 맛집 리스트 │
│                 │
│  ████████░░░░   │
│  8개 장소 · 6개 방문│
│  75% 완료       │
└─────────────────┘
```

#### F-3: 뷰 전환 탭
- [ ] 리스트 뷰 (기본)
- [ ] 지도 뷰

#### F-4: 장소 리스트 (리스트 뷰)
- [ ] 장소 카드:
  - 카테고리 아이콘
  - 장소명
  - 주소 (1줄)
  - 방문 여부 체크박스
  - 더보기 버튼 (⋮)
- [ ] 정렬 옵션:
  - 추가한 순서 (기본)
  - 이름순
  - 거리순 (현재 위치 기준)
  - 카테고리순

**장소 카드 레이아웃:**
```
┌─────────────────────┐
│ ☐ 🍝 맛집 A     ⋮ │
│    서울 강남구       │
└─────────────────────┘
```

**API 요청:**
```typescript
GET /api/lists/:id/places?sort=order

Response 200:
{
  places: [
    {
      id: string;
      name: string;
      address: string;
      category: string;
      visited: boolean;
      latitude: number;
      longitude: number;
      order: number; // 목록 내 순서
    }
  ]
}
```

#### F-5: 장소 카드 액션
- [ ] 탭: 장소 상세 화면 이동
- [ ] 체크박스: 방문 여부 토글
- [ ] 더보기:
  - 목록에서 제거
  - 장소 상세로 이동

**체크박스 토글:**
```typescript
PATCH /api/places/:id
{
  visited: boolean;
}

Response 200:
{
  id: string;
  visited: boolean;
  visitedAt: Date | null;
}
```

**목록에서 제거:**
```typescript
DELETE /api/lists/:listId/places/:placeId

Response 204: No Content
```

#### F-6: 지도 뷰
- [ ] 목록 내 장소 마커 표시
- [ ] 마커 클릭 → InfoWindow
- [ ] 현재 위치 표시
- [ ] 방문/미방문 색상 구분

#### F-7: 장소 추가 버튼
- [ ] 플로팅 "+" 버튼 (우측 하단)
- [ ] 탭 시 장소 추가 모달

#### F-8: 장소 추가 모달
- [ ] 탭 1: 검색
  - 검색 바
  - 검색 결과 리스트
  - 결과 선택 → 추가
- [ ] 탭 2: 내 장소
  - 전체 장소 리스트
  - 이미 추가된 장소 표시
  - 선택 → 추가

**장소 추가 API:**
```typescript
POST /api/lists/:listId/places
{
  placeIds: string[];
}

Response 200:
{
  added: number;
  places: Place[];
}
```

### 3.2 중요 기능 (Phase 2)

#### F-9: 경로 최적화
- [ ] "경로 최적화" 버튼
- [ ] 최적화 알고리즘:
  - 현재 위치 기준 (시작점)
  - 미방문 장소만 또는 전체
  - TSP (Traveling Salesman Problem) 근사 알고리즘
- [ ] 최적화된 순서 표시
- [ ] "적용" 버튼 → 순서 저장

**경로 최적화 API:**
```typescript
POST /api/lists/:id/optimize-route
{
  startLocation: { lat: number; lng: number };
  includeVisited: boolean;
}

Response 200:
{
  optimizedOrder: {
    placeId: string;
    order: number;
    distance: number; // 이전 장소로부터 거리 (m)
  }[];
  totalDistance: number; // 총 거리 (m)
  estimatedTime: number; // 예상 소요 시간 (분)
}
```

**경로 최적화 알고리즘 (간단한 Nearest Neighbor):**
```typescript
function optimizeRoute(
  places: Place[],
  startLocation: Location
): OptimizedRoute {
  const unvisited = [...places];
  const route: PlaceWithDistance[] = [];
  let currentLocation = startLocation;
  let totalDistance = 0;

  while (unvisited.length > 0) {
    // 가장 가까운 장소 찾기
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(
      currentLocation,
      unvisited[0]
    );

    for (let i = 1; i < unvisited.length; i++) {
      const distance = calculateDistance(
        currentLocation,
        unvisited[i]
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const nearest = unvisited.splice(nearestIndex, 1)[0];
    route.push({
      ...nearest,
      order: route.length,
      distance: nearestDistance
    });

    currentLocation = {
      latitude: nearest.latitude,
      longitude: nearest.longitude
    };
    totalDistance += nearestDistance;
  }

  return {
    optimizedOrder: route,
    totalDistance,
    estimatedTime: Math.ceil((totalDistance / 1000) * 12) // 1km당 12분 가정
  };
}

function calculateDistance(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  // Haversine 공식
  const R = 6371e3; // 지구 반지름 (m)
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180;
  const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;

  const x =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * c;
}
```

#### F-10: 순서 변경 (드래그 앤 드롭)
- [ ] 장소 카드 롱프레스 → 드래그 모드
- [ ] 드래그하여 순서 변경
- [ ] 순서 자동 저장

#### F-11: 체크리스트 모드
- [ ] 헤더에 "체크리스트" 토글
- [ ] 활성화 시:
  - 간소화된 UI
  - 큰 체크박스
  - 방문 완료 장소 흐리게 표시 or 숨기기

#### F-12: 예상 소요 시간
- [ ] 미방문 장소 기준
- [ ] 이동 시간 + 체류 시간
- [ ] "총 {시간}시간 {분}분 예상" 표시

### 3.3 추가 기능 (Phase 3)

#### F-13: PDF 내보내기
- [ ] 목록을 PDF로 내보내기
- [ ] 포함 내용:
  - 목록 정보
  - 장소 리스트
  - 지도 이미지
  - QR 코드 (공유 링크)

#### F-14: 일정 캘린더 연동
- [ ] 특정 날짜에 목록 연결
- [ ] 캘린더 앱 연동 (Google Calendar 등)

#### F-15: 이동 수단 표시
- [ ] 장소 간 이동 수단 (도보/대중교통/자동차)
- [ ] 예상 이동 시간
- [ ] 경로 안내 링크

## 4. UI/UX 사양

### 4.1 레이아웃

```
┌─────────────────────┐
│  ←  맛집 탐방    ⋮   │ 헤더
├─────────────────────┤
│  🍔 맛집 탐방        │ 목록 정보
│  서울 맛집 리스트     │
│  ████████░░░░       │
│  8개 · 6/8 (75%)   │
├─────────────────────┤
│ [리스트] [지도]      │ 뷰 전환 탭
├─────────────────────┤
│  정렬: 순서  ▼       │ 정렬 옵션
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ ☐ 🍝 맛집 A  ⋮│ │
│ │   서울 강남구    │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ ☑ ☕ 카페 B  ⋮│ │
│ │   서울 강남구    │ │
│ └─────────────────┘ │
│                     │
│              [  +  ]│ 플로팅 버튼
└─────────────────────┘
```

### 4.2 인터랙션

#### 장소 카드
- 탭: 장소 상세
- 체크박스: 방문 토글 (낙관적 UI)
- 롱프레스: 드래그 모드

#### 드래그 앤 드롭
- 롱프레스: 카드 들어올림 효과
- 드래그: 다른 카드들 이동
- 드롭: 순서 저장

#### 경로 최적화
- 버튼 탭: 계산 로딩
- 결과 표시: 순서 변경 애니메이션
- 적용: 순서 저장

### 4.3 접근성
- 장소 카드: 전체 내용 읽기
- 체크박스: 상태 알림
- 드래그: 키보드 대체 (위/아래 버튼)

## 5. 기술 사양

### 5.1 프론트엔드

#### 컴포넌트 구조
```typescript
// ListDetailScreen.tsx
interface ListDetailScreenProps {
  listId: string;
}

interface ListDetailState {
  list: List | null;
  places: Place[];
  viewMode: 'list' | 'map';
  sortBy: 'order' | 'name' | 'distance' | 'category';
  isOptimizing: boolean;
  isChecklistMode: boolean;
}

// PlaceListItem.tsx
interface PlaceListItemProps {
  place: Place;
  order: number;
  onPress: (id: string) => void;
  onToggleVisit: (id: string, visited: boolean) => void;
  onRemove: (id: string) => void;
  isDraggable: boolean;
}

// AddPlaceModal.tsx
interface AddPlaceModalProps {
  isOpen: boolean;
  listId: string;
  existingPlaceIds: string[];
  onClose: () => void;
  onAdd: (placeIds: string[]) => void;
}

// RouteOptimizer.tsx
interface RouteOptimizerProps {
  places: Place[];
  onApply: (optimizedOrder: PlaceOrder[]) => void;
}
```

#### 드래그 앤 드롭 (react-beautiful-dnd 사용)
```typescript
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function PlaceList({ places, onReorder }: PlaceListProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(places);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    // 순서 업데이트
    const updates = items.map((place, index) => ({
      placeId: place.id,
      order: index
    }));

    onReorder(updates);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="places">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {places.map((place, index) => (
              <Draggable
                key={place.id}
                draggableId={place.id}
                index={index}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <PlaceListItem place={place} order={index} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

### 5.2 백엔드

#### API 엔드포인트
```typescript
// lists.controller.ts
@Controller('lists')
export class ListsController {
  @Get(':id/places')
  async getListPlaces(
    @CurrentUser() user: User,
    @Param('id') listId: string,
    @Query('sort') sort: string = 'order'
  ) {
    return this.listsService.getPlaces(user.id, listId, { sort });
  }

  @Post(':id/places')
  async addPlaces(
    @CurrentUser() user: User,
    @Param('id') listId: string,
    @Body() dto: AddPlacesDto
  ) {
    return this.listsService.addPlaces(user.id, listId, dto.placeIds);
  }

  @Delete(':listId/places/:placeId')
  @HttpCode(204)
  async removePlace(
    @CurrentUser() user: User,
    @Param('listId') listId: string,
    @Param('placeId') placeId: string
  ) {
    await this.listsService.removePlace(user.id, listId, placeId);
  }

  @Patch(':id/places/reorder')
  async reorderPlaces(
    @CurrentUser() user: User,
    @Param('id') listId: string,
    @Body() dto: ReorderPlacesDto
  ) {
    return this.listsService.reorderPlaces(user.id, listId, dto.order);
  }

  @Post(':id/optimize-route')
  async optimizeRoute(
    @CurrentUser() user: User,
    @Param('id') listId: string,
    @Body() dto: OptimizeRouteDto
  ) {
    return this.listsService.optimizeRoute(
      user.id,
      listId,
      dto.startLocation,
      dto.includeVisited
    );
  }
}

// add-places.dto.ts
export class AddPlacesDto {
  @IsArray()
  @IsString({ each: true })
  placeIds: string[];
}

// reorder-places.dto.ts
export class ReorderPlacesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaceOrderDto)
  order: PlaceOrderDto[];
}

export class PlaceOrderDto {
  @IsString()
  placeId: string;

  @IsNumber()
  @Min(0)
  order: number;
}

// optimize-route.dto.ts
export class OptimizeRouteDto {
  @ValidateNested()
  @Type(() => LocationDto)
  startLocation: LocationDto;

  @IsBoolean()
  includeVisited: boolean;
}

export class LocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
```

## 6. 데이터 모델

### 6.1 PlaceList (연결 테이블 확장)
```typescript
interface PlaceList {
  id: string;
  placeId: string;
  listId: string;
  order: number; // 목록 내 순서
  addedAt: Date;
}
```

## 7. API 명세

### GET /api/lists/:id/places
목록 내 장소 조회

**Query Params:**
- `sort`: order, name, distance, category

**Response 200:**
```json
{
  "places": [
    {
      "id": "uuid-1",
      "name": "맛집 A",
      "address": "서울 강남구",
      "category": "restaurant",
      "visited": false,
      "latitude": 37.5,
      "longitude": 127.0,
      "order": 0
    }
  ]
}
```

### POST /api/lists/:id/places
장소 추가

**Request:**
```json
{
  "placeIds": ["uuid-1", "uuid-2"]
}
```

**Response 200:**
```json
{
  "added": 2,
  "places": [...]
}
```

### PATCH /api/lists/:id/places/reorder
순서 변경

**Request:**
```json
{
  "order": [
    { "placeId": "uuid-1", "order": 0 },
    { "placeId": "uuid-2", "order": 1 }
  ]
}
```

**Response 200:**
```json
{
  "updated": 2
}
```

### POST /api/lists/:id/optimize-route
경로 최적화

**Request:**
```json
{
  "startLocation": {
    "latitude": 37.5665,
    "longitude": 126.9780
  },
  "includeVisited": false
}
```

**Response 200:**
```json
{
  "optimizedOrder": [
    {
      "placeId": "uuid-1",
      "order": 0,
      "distance": 1500
    }
  ],
  "totalDistance": 5000,
  "estimatedTime": 60
}
```

## 8. 성능 요구사항

### 8.1 로딩 시간
- 장소 리스트: < 500ms
- 지도 렌더링: < 1초
- 경로 최적화: < 2초

### 8.2 최적화
- 장소 수 > 100: 가상화 스크롤
- 드래그: 60fps 유지
- 지도: 마커 클러스터링

## 9. 보안 고려사항

### 9.1 권한 검증
- 본인 목록만 조회/수정
- 장소 추가 시 존재 여부 확인

## 10. 테스트 계획

### 10.1 Unit 테스트
```typescript
describe('ListDetailScreen', () => {
  it('장소 리스트 표시', () => {
    // 테스트 코드
  });

  it('방문 여부 토글', async () => {
    // 테스트 코드
  });

  it('순서 변경', async () => {
    // 테스트 코드
  });

  it('경로 최적화', async () => {
    // 테스트 코드
  });
});
```

### 10.2 E2E 시나리오
1. 목록 상세 진입 → 장소 리스트 확인
2. 장소 추가 → 검색 → 선택 → 추가
3. 체크박스 토글 → 방문 완료
4. 경로 최적화 → 적용

## 11. 향후 개선사항

### 11.1 UX 개선
- 일괄 체크/해제
- 장소 필터링
- 스와이프 액션

### 11.2 기능 확장
- 일정 모드 (날짜별 분류)
- 비용 집계
- 체류 시간 설정

### 11.3 공유
- 실시간 협업
- 친구와 진행률 공유
- 추천 받기
