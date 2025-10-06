# 검색 화면 PRD

## 1. 개요

### 1.1 화면 목적
- 통합 검색으로 장소/목록 빠른 찾기
- 필터링 및 정렬 옵션 제공
- 검색 결과에서 즉시 작업 수행

### 1.2 주요 사용자 플로우
```
검색 화면 → 키워드 입력 → 결과 표시 → 장소/목록 선택 → 상세 화면
          ↓
          필터 적용 → 결과 필터링
```

### 1.3 성공 지표
- 검색 사용률: > 40%
- 검색 성공률: > 80%
- 평균 검색 시간: < 5초

## 2. 사용자 스토리

### US-1: 통합 검색
**As a** 사용자
**I want** 장소와 목록을 한 번에 검색하고 싶다
**So that** 빠르게 찾을 수 있다

### US-2: 필터 검색
**As a** 사용자
**I want** 카테고리나 방문 여부로 필터링하고 싶다
**So that** 원하는 결과만 볼 수 있다

### US-3: 최근 검색
**As a** 사용자
**I want** 최근 검색어를 다시 사용하고 싶다
**So that** 반복 입력을 줄일 수 있다

## 3. 기능 요구사항

### 3.1 필수 기능 (Phase 1)

#### F-1: 검색 바
- [ ] 자동 포커스
- [ ] 플레이스홀더: "장소, 목록 검색..."
- [ ] 실시간 검색 (debounce 300ms)
- [ ] 취소 버튼

#### F-2: 최근 검색어
- [ ] 최근 5개 표시
- [ ] 검색어 탭 → 자동 입력
- [ ] 개별 삭제 (X 버튼)
- [ ] 전체 삭제

**로컬 스토리지:**
```typescript
interface SearchHistory {
  keyword: string;
  searchedAt: Date;
}

const STORAGE_KEY = 'travel-planner:search-history';
const MAX_HISTORY = 5;
```

#### F-3: 검색 결과
- [ ] 섹션 구분:
  - 장소 (최대 20개)
  - 목록 (최대 10개)
- [ ] 장소 카드:
  - 장소명 (하이라이트)
  - 카테고리
  - 주소
  - 방문 여부
- [ ] 목록 카드:
  - 아이콘 + 목록명
  - 장소 수
- [ ] 빈 결과: "'{키워드}' 검색 결과가 없습니다"

**API 요청:**
```typescript
GET /api/search?q={keyword}&type=all

Response 200:
{
  places: Place[];
  lists: List[];
  total: {
    places: number;
    lists: number;
  }
}
```

**검색 로직 (백엔드):**
```sql
-- 장소 검색
SELECT * FROM places
WHERE user_id = $1
AND (
  name ILIKE '%' || $2 || '%' OR
  address ILIKE '%' || $2 || '%' OR
  $2 = ANY(labels) OR
  custom_category ILIKE '%' || $2 || '%'
)
LIMIT 20;

-- 목록 검색
SELECT * FROM lists
WHERE user_id = $1
AND (
  name ILIKE '%' || $2 || '%' OR
  description ILIKE '%' || $2 || '%'
)
LIMIT 10;
```

#### F-4: 검색 결과 액션
- [ ] 장소 카드 탭: 장소 상세
- [ ] 목록 카드 탭: 목록 상세
- [ ] 장소 빠른 액션:
  - 방문 여부 토글
  - 목록에 추가

### 3.2 중요 기능 (Phase 2)

#### F-5: 필터
- [ ] 필터 버튼 (검색 바 옆)
- [ ] 필터 옵션:
  - 타입: 장소 / 목록 / 전체
  - 카테고리 (장소)
  - 방문 여부 (장소)
  - 라벨 (장소)

**필터 API:**
```typescript
GET /api/search?q={keyword}&type=place&category=restaurant&visited=false

Response 200:
{
  places: Place[];
  total: number;
}
```

#### F-6: 정렬
- [ ] 정렬 옵션:
  - 관련도 (기본)
  - 이름순
  - 최근 추가순
  - 거리순 (장소)

#### F-7: 자동완성
- [ ] 입력 시 자동완성 제안
- [ ] 최근 검색어
- [ ] 인기 검색어 (Phase 3)
- [ ] 제안 선택 → 검색 실행

### 3.3 추가 기능 (Phase 3)

#### F-8: 고급 검색
- [ ] 거리 범위 (현재 위치 기준)
- [ ] 날짜 범위 (추가일/방문일)
- [ ] 별점 범위

#### F-9: 검색 제안
- [ ] 철자 교정
- [ ] 유사 검색어 제안
- [ ] "혹시 '{제안}'을(를) 찾으셨나요?"

## 4. UI/UX 사양

### 4.1 레이아웃

```
┌─────────────────────┐
│ [🔍 검색...  ] 취소 │ 검색 바
├─────────────────────┤
│ 최근 검색어          │
│ ┌─────────────────┐ │
│ │ 맛집        X   │ │
│ │ 카페        X   │ │
│ │ 강남        X   │ │
│ └─────────────────┘ │
│ 전체 삭제           │
├─────────────────────┤
│ 장소 (12)           │
│ ┌─────────────────┐ │
│ │ 🍝 맛집 A      │ │
│ │ 서울 강남      ☐│ │
│ └─────────────────┘ │
├─────────────────────┤
│ 목록 (3)            │
│ ┌─────────────────┐ │
│ │ 🍔 맛집 탐방   │ │
│ │ 8개 장소        │ │
│ └─────────────────┘ │
└─────────────────────┘
```

### 4.2 인터랙션

#### 검색 바
- 포커스: 최근 검색어 표시
- 입력: 실시간 검색 (300ms debounce)
- 취소: 이전 화면

#### 결과 카드
- 탭: 상세 화면
- 스와이프 (모바일): 빠른 액션

## 5. 기술 사양

### 5.1 프론트엔드

```typescript
// SearchScreen.tsx
interface SearchScreenProps {}

interface SearchState {
  keyword: string;
  results: SearchResults;
  filters: SearchFilters;
  history: SearchHistory[];
  isSearching: boolean;
}

// useSearch hook
function useSearch() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        if (!q.trim()) {
          setResults(null);
          return;
        }

        setIsSearching(true);
        try {
          const data = await api.get('search', {
            searchParams: { q }
          }).json<SearchResults>();

          setResults(data);
        } catch (error) {
          // 에러 처리
        } finally {
          setIsSearching(false);
        }
      }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(keyword);
    return () => debouncedSearch.cancel();
  }, [keyword, debouncedSearch]);

  return { keyword, setKeyword, results, isSearching };
}
```

### 5.2 백엔드

```typescript
// search.controller.ts
@Controller('search')
export class SearchController {
  @Get()
  async search(
    @CurrentUser() user: User,
    @Query('q') keyword: string,
    @Query('type') type: 'all' | 'place' | 'list' = 'all',
    @Query('category') category?: string,
    @Query('visited') visited?: boolean
  ) {
    return this.searchService.search(user.id, {
      keyword,
      type,
      category,
      visited
    });
  }
}

// search.service.ts
async search(
  userId: string,
  options: SearchOptions
): Promise<SearchResults> {
  const { keyword, type, category, visited } = options;

  const results: SearchResults = {
    places: [],
    lists: [],
    total: { places: 0, lists: 0 }
  };

  if (type === 'all' || type === 'place') {
    results.places = await this.searchPlaces(
      userId,
      keyword,
      category,
      visited
    );
    results.total.places = results.places.length;
  }

  if (type === 'all' || type === 'list') {
    results.lists = await this.searchLists(userId, keyword);
    results.total.lists = results.lists.length;
  }

  return results;
}
```

## 6. 데이터 모델

```typescript
interface SearchResults {
  places: Place[];
  lists: List[];
  total: {
    places: number;
    lists: number;
  };
}

interface SearchFilters {
  type: 'all' | 'place' | 'list';
  category?: string;
  visited?: boolean;
  labels?: string[];
}
```

## 7. API 명세

### GET /api/search
통합 검색

**Query Params:**
- `q`: 검색 키워드 (필수)
- `type`: all, place, list
- `category`: 카테고리 필터
- `visited`: 방문 여부 필터

**Response 200:**
```json
{
  "places": [...],
  "lists": [...],
  "total": {
    "places": 12,
    "lists": 3
  }
}
```

## 8. 성능 요구사항

### 8.1 검색 속도
- API 응답: < 300ms
- UI 업데이트: < 100ms
- Debounce: 300ms

### 8.2 최적화
- 검색 결과 캐싱 (1분)
- 데이터베이스 인덱스:
  - places (name, address, labels, custom_category)
  - lists (name, description)

## 9. 테스트 계획

```typescript
describe('SearchScreen', () => {
  it('키워드 입력 시 검색 실행', async () => {
    // 테스트 코드
  });

  it('최근 검색어 저장 및 표시', () => {
    // 테스트 코드
  });

  it('빈 결과 표시', () => {
    // 테스트 코드
  });
});
```

## 10. 향후 개선사항

- 음성 검색
- 이미지 검색
- AI 기반 추천
