# 장소 상세 화면 PRD

## 1. 개요

### 1.1 화면 목적
- 장소의 상세 정보 표시 및 편집
- 방문 여부 및 소감 기록
- 라벨 및 카테고리 관리

### 1.2 주요 사용자 플로우
```
장소 상세 → 정보 확인 → 편집 (라벨, 카테고리, 방문)
          ↓
          목록에 추가 / 삭제
```

### 1.3 성공 지표
- 방문 기록 작성률: > 60%
- 라벨 추가율: > 40%
- 편집 완료율: > 95%

## 2. 사용자 스토리

### US-1: 장소 정보 확인
**As a** 사용자
**I want** 장소의 상세 정보를 보고 싶다
**So that** 방문 전에 정보를 파악할 수 있다

### US-2: 방문 기록
**As a** 사용자
**I want** 방문 여부를 표시하고 소감을 남기고 싶다
**So that** 여행 기록을 관리할 수 있다

### US-3: 라벨/카테고리 관리
**As a** 사용자
**I want** 나만의 라벨과 카테고리를 지정하고 싶다
**So that** 장소를 내 방식대로 분류할 수 있다

## 3. 기능 요구사항

### 3.1 필수 기능 (Phase 1)

#### F-1: 헤더
- [ ] 뒤로가기 버튼
- [ ] 장소명 (제목)
- [ ] 더보기 메뉴 (우측 상단)
  - 수정
  - 삭제
  - 공유 (Phase 2)

#### F-2: 기본 정보 섹션
- [ ] 장소 이미지 (기본 이미지 또는 사용자 업로드 - Phase 2)
- [ ] 장소명
- [ ] 카테고리 아이콘 + 텍스트
- [ ] 주소
- [ ] 전화번호 (있을 경우)
  - 탭 시 전화 앱 실행
- [ ] 외부 링크 (Kakao 지도)
  - "지도에서 보기" 버튼

**레이아웃:**
```
┌─────────────────┐
│  [이미지]       │
│                 │
│  🍔 맛집 A      │
│  음식점         │
│                 │
│  📍 서울 강남구  │
│  📞 02-1234-5678│
│  [지도에서 보기] │
└─────────────────┘
```

#### F-3: 방문 여부 섹션
- [ ] 방문 여부 토글 스위치
- [ ] 방문 날짜 (방문 시 자동 기록)
- [ ] 방문 소감 입력 필드
  - 최대 500자
  - 플레이스홀더: "방문 소감을 남겨보세요..."
  - 확장 가능한 텍스트 영역

**API 요청:**
```typescript
PATCH /api/places/:id
{
  visited: boolean;
  visitedAt?: Date;
  visitNote?: string;
}

Response 200:
{
  id: string;
  visited: boolean;
  visitedAt: Date | null;
  visitNote: string | null;
}
```

#### F-4: 라벨 관리 (인라인 편집)
- [ ] 라벨 섹션 제목: "라벨"
- [ ] 기존 라벨 표시 (태그 형태)
- [ ] 라벨 추가 버튼 "+"
- [ ] 라벨 입력 필드 (인라인)
  - 최대 20자
  - Enter 키로 추가
  - 최대 5개
- [ ] 라벨 삭제 (X 버튼)

**레이아웃:**
```
라벨
┌──────┬──────┬──────┐
│데이트 │야외  │ + 추가│
└──────┴──────┴──────┘
```

#### F-5: 카테고리 관리 (드롭다운)
- [ ] 카테고리 섹션 제목: "카테고리"
- [ ] 현재 카테고리 표시
- [ ] 탭 시 카테고리 선택 모달
  - 기본 카테고리 (8개)
  - 커스텀 카테고리
  - "+ 새 카테고리" 옵션
- [ ] 선택 시 즉시 저장

**API 요청:**
```typescript
PATCH /api/places/:id/category
{
  category: string;
  customCategory?: string;
}

Response 200:
{
  id: string;
  category: string;
  customCategory: string | null;
}
```

#### F-6: 목록 관리 섹션
- [ ] "포함된 목록" 표시
- [ ] 목록 카드 리스트
  - 아이콘 + 목록명
  - "제거" 버튼
- [ ] "+ 목록에 추가" 버튼
- [ ] 목록 선택 모달
  - 체크박스 리스트
  - 선택 시 즉시 추가

**API 요청:**
```typescript
POST /api/places/:placeId/lists
{
  listIds: string[];
}

DELETE /api/places/:placeId/lists/:listId

GET /api/places/:placeId/lists
Response: {
  lists: ListSummary[];
}
```

#### F-7: 지도 미리보기
- [ ] 작은 지도 (정적 이미지 또는 인터랙티브)
- [ ] 장소 위치 마커 표시
- [ ] 탭 시 메인 지도 화면 이동

#### F-8: 삭제 기능
- [ ] 더보기 → 삭제
- [ ] 확인 다이얼로그
  - "정말 삭제하시겠습니까?"
  - "이 장소가 포함된 목록에서도 제거됩니다"
  - "취소" / "삭제"
- [ ] 삭제 성공 → 이전 화면

**API 요청:**
```typescript
DELETE /api/places/:id

Response 204: No Content
```

### 3.2 중요 기능 (Phase 2)

#### F-9: 사진 갤러리
- [ ] 최대 10장
- [ ] 사진 추가 버튼
- [ ] 갤러리/카메라 선택
- [ ] 사진 삭제
- [ ] 슬라이드 뷰

#### F-10: 별점 평가
- [ ] 5점 만점 별점
- [ ] 탭으로 점수 선택
- [ ] 평균 별점 표시 (Phase 3 - 공유 시)

#### F-11: 예상 비용
- [ ] 비용 입력 필드
- [ ] 통화: KRW (기본)
- [ ] 메모 (선택)

#### F-12: 방문 날짜 수정
- [ ] 날짜 선택기
- [ ] 과거 날짜만 선택 가능
- [ ] 방문 여부 자동 토글

### 3.3 추가 기능 (Phase 3)

#### F-13: 동행자 태그
- [ ] 친구 목록에서 선택
- [ ] 아바타 + 이름 표시
- [ ] 최대 10명

#### F-14: 공유 기능
- [ ] 링크 공유
- [ ] 이미지로 공유 (카드 형태)
- [ ] SNS 공유 (카카오, 인스타그램)

#### F-15: 외부 리뷰 연동
- [ ] Kakao/Naver 리뷰 표시
- [ ] 평점 및 리뷰 수
- [ ] "리뷰 더보기" 링크

## 4. UI/UX 사양

### 4.1 레이아웃

```
┌─────────────────────┐
│  ←  맛집 A      ⋮   │ 헤더
├─────────────────────┤
│                     │
│    [장소 이미지]     │
│                     │
├─────────────────────┤
│  🍔 맛집 A          │
│  음식점             │
│                     │
│  📍 서울 강남구      │
│  📞 02-1234-5678    │
│  [지도에서 보기]     │
├─────────────────────┤
│  방문 여부    [토글] │
│  2025-10-05        │
│  ┌───────────────┐  │
│  │ 방문 소감...  │  │
│  └───────────────┘  │
├─────────────────────┤
│  라벨               │
│  [데이트] [야외] [+]│
├─────────────────────┤
│  카테고리           │
│  음식점      [변경] │
├─────────────────────┤
│  포함된 목록        │
│  🍔 맛집 탐방  [제거]│
│  [+ 목록에 추가]    │
├─────────────────────┤
│  [지도 미리보기]     │
└─────────────────────┘
```

### 4.2 인터랙션

#### 방문 토글
- 스위치 애니메이션
- 방문 시: 방문 날짜 자동 입력
- 미방문 시: 날짜 및 소감 초기화 (확인 후)

#### 라벨 추가
- 인라인 입력 필드 표시
- Enter: 라벨 추가
- ESC: 취소
- 최대 5개 도달: 추가 버튼 비활성화

#### 카테고리 선택
- 모달 바텀시트
- 단일 선택
- 선택 즉시 닫기

### 4.3 접근성
- 모든 버튼: 레이블 제공
- 토글: 상태 읽기
- 키보드 네비게이션
- 포커스 인디케이터

## 5. 기술 사양

### 5.1 프론트엔드

#### 컴포넌트 구조
```typescript
// PlaceDetailScreen.tsx
interface PlaceDetailScreenProps {
  placeId: string;
}

interface PlaceDetailState {
  place: Place | null;
  lists: List[];
  isEditing: boolean;
  isLoading: boolean;
}

// VisitSection.tsx
interface VisitSectionProps {
  visited: boolean;
  visitedAt: Date | null;
  visitNote: string | null;
  onUpdate: (data: VisitData) => void;
}

// LabelManager.tsx
interface LabelManagerProps {
  labels: string[];
  maxLabels: number;
  onAdd: (label: string) => void;
  onRemove: (label: string) => void;
}

// CategorySelector.tsx
interface CategorySelectorProps {
  currentCategory: string;
  categories: Category[];
  onSelect: (category: string) => void;
}
```

#### 데이터 로딩
```typescript
function usePlaceDetail(placeId: string) {
  const [state, setState] = useState<PlaceDetailState>({
    place: null,
    lists: [],
    isEditing: false,
    isLoading: true
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [place, lists] = await Promise.all([
          api.get(`places/${placeId}`).json<Place>(),
          api.get(`places/${placeId}/lists`).json<{ lists: List[] }>()
        ]);

        setState(prev => ({
          ...prev,
          place,
          lists: lists.lists,
          isLoading: false
        }));
      } catch (error) {
        // 에러 처리
      }
    }

    fetchData();
  }, [placeId]);

  return state;
}
```

### 5.2 백엔드

#### API 엔드포인트
```typescript
// places.controller.ts
@Controller('places')
export class PlacesController {
  @Get(':id')
  async getPlace(
    @CurrentUser() user: User,
    @Param('id') id: string
  ) {
    return this.placesService.findOne(user.id, id);
  }

  @Patch(':id')
  async updatePlace(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdatePlaceDto
  ) {
    return this.placesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async deletePlace(
    @CurrentUser() user: User,
    @Param('id') id: string
  ) {
    await this.placesService.delete(user.id, id);
  }

  @Get(':id/lists')
  async getPlaceLists(
    @CurrentUser() user: User,
    @Param('id') placeId: string
  ) {
    return this.placesService.getLists(user.id, placeId);
  }

  @Post(':placeId/lists')
  async addToLists(
    @CurrentUser() user: User,
    @Param('placeId') placeId: string,
    @Body() dto: AddToListsDto
  ) {
    return this.placesService.addToLists(user.id, placeId, dto.listIds);
  }

  @Delete(':placeId/lists/:listId')
  async removeFromList(
    @CurrentUser() user: User,
    @Param('placeId') placeId: string,
    @Param('listId') listId: string
  ) {
    return this.placesService.removeFromList(user.id, placeId, listId);
  }
}

// update-place.dto.ts
export class UpdatePlaceDto {
  @IsOptional()
  @IsBoolean()
  visited?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  visitedAt?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  visitNote?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  @ArrayMaxSize(5)
  labels?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  customCategory?: string;
}
```

## 6. 데이터 모델

### 6.1 Place (확장)
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
  labels: string[];
  visited: boolean;
  visitedAt?: Date;
  visitNote?: string;
  rating?: number; // Phase 2
  estimatedCost?: number; // Phase 2
  photos: string[]; // Phase 2
  externalUrl?: string;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.2 PlaceList (연결 테이블)
```typescript
interface PlaceList {
  id: string;
  placeId: string;
  listId: string;
  addedAt: Date;
}
```

## 7. API 명세

### GET /api/places/:id
장소 상세

**Response 200:**
```json
{
  "id": "uuid-1",
  "name": "맛집 A",
  "address": "서울 강남구",
  "phone": "02-1234-5678",
  "latitude": 37.5,
  "longitude": 127.0,
  "category": "restaurant",
  "labels": ["데이트", "야외"],
  "visited": true,
  "visitedAt": "2025-10-05T12:00:00Z",
  "visitNote": "정말 맛있었어요!",
  "createdAt": "2025-10-01T10:00:00Z"
}
```

### PATCH /api/places/:id
장소 수정

**Request:**
```json
{
  "visited": true,
  "visitedAt": "2025-10-05T12:00:00Z",
  "visitNote": "정말 맛있었어요!",
  "labels": ["데이트", "야외"],
  "category": "restaurant"
}
```

**Response 200:**
```json
{
  "id": "uuid-1",
  "visited": true,
  "visitedAt": "2025-10-05T12:00:00Z",
  "visitNote": "정말 맛있었어요!"
}
```

### DELETE /api/places/:id
장소 삭제

**Response 204:** No Content

### GET /api/places/:id/lists
장소가 포함된 목록

**Response 200:**
```json
{
  "lists": [
    {
      "id": "uuid-1",
      "name": "맛집 탐방",
      "icon": "🍔"
    }
  ]
}
```

## 8. 성능 요구사항

### 8.1 로딩 시간
- 장소 정보 로드: < 500ms
- 이미지 로드: < 1초
- 업데이트: < 300ms

### 8.2 최적화
- 이미지 lazy loading
- 낙관적 UI 업데이트
- API 응답 캐싱 (30초)

## 9. 보안 고려사항

### 9.1 권한 검증
- 본인 장소만 조회/수정/삭제
- 서버 측 userId 검증

### 9.2 입력 검증
- 라벨: 최대 5개, 20자
- 방문 소감: 최대 500자
- XSS 방지: sanitize

## 10. 테스트 계획

### 10.1 Unit 테스트
```typescript
describe('PlaceDetailScreen', () => {
  it('장소 정보 표시', () => {
    // 테스트 코드
  });

  it('방문 여부 토글', async () => {
    // 테스트 코드
  });

  it('라벨 추가/삭제', () => {
    // 테스트 코드
  });

  it('장소 삭제 확인', async () => {
    // 테스트 코드
  });
});
```

### 10.2 E2E 시나리오
1. 장소 상세 진입 → 정보 확인
2. 방문 토글 → 소감 입력 → 저장
3. 라벨 추가 → 저장 확인
4. 목록에 추가 → 성공 토스트

## 11. 향후 개선사항

### 11.1 UX 개선
- 스와이프로 이전/다음 장소
- 즐겨찾기 기능
- 메모 음성 입력

### 11.2 소셜 기능
- 친구에게 추천
- 댓글 및 좋아요
- 장소 공동 편집

### 11.3 분석
- 방문 빈도 분석
- 카테고리별 통계
- 비용 집계
