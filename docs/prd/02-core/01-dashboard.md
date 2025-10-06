# 대시보드 화면 PRD

## 1. 개요

### 1.1 화면 목적
- 사용자의 여행 계획 현황 한눈에 파악
- 주요 기능으로 빠른 접근
- 개인화된 추천 및 인사이트 제공

### 1.2 주요 사용자 플로우
```
앱 실행 (로그인 상태) → 대시보드 → 지도/목록/검색/설정
                      ↓
                      최근 장소 클릭 → 장소 상세
                      목록 클릭 → 목록 상세
```

### 1.3 성공 지표
- 대시보드 로딩 시간: < 1초
- 주요 기능 클릭률: > 80%
- 일일 재방문율: > 60%

## 2. 사용자 스토리

### US-1: 현황 파악
**As a** 사용자
**I want** 내 여행 계획 현황을 한눈에 보고 싶다
**So that** 빠르게 상황을 파악할 수 있다

### US-2: 빠른 접근
**As a** 사용자
**I want** 자주 사용하는 기능에 빠르게 접근하고 싶다
**So that** 효율적으로 앱을 사용할 수 있다

### US-3: 추천 받기
**As a** 사용자
**I want** 개인화된 장소 추천을 받고 싶다
**So that** 새로운 장소를 발견할 수 있다

## 3. 기능 요구사항

### 3.1 필수 기능 (Phase 1)

#### F-1: 헤더
- [ ] 사용자 프로필 이미지 (우측 상단)
- [ ] 닉네임 표시
- [ ] 알림 아이콘 (배지 포함)
- [ ] 설정 버튼

#### F-2: 빠른 검색
- [ ] 검색 바 (상단)
- [ ] 플레이스홀더: "장소, 목록 검색..."
- [ ] 탭 시 검색 화면 이동
- [ ] 최근 검색어 (3개)

#### F-3: 통계 요약 카드
- [ ] 총 장소 수
- [ ] 방문한 장소 수
- [ ] 방문률 (%)
- [ ] 목록 수

**레이아웃:**
```
┌─────┬─────┬─────┬─────┐
│ 장소 │ 방문 │ 방문률│ 목록│
│ 24  │ 12  │ 50% │ 5  │
└─────┴─────┴─────┴─────┘
```

**API 요청:**
```typescript
GET /api/dashboard/stats

Response 200:
{
  totalPlaces: number;
  visitedPlaces: number;
  visitedPercentage: number;
  totalLists: number;
}
```

#### F-4: 내 목록 섹션
- [ ] 섹션 헤더: "내 목록" + "전체 보기"
- [ ] 최근 4개 목록 표시 (가로 스크롤)
- [ ] 목록 카드:
  - 아이콘 (이모지/이미지)
  - 목록 이름
  - 장소 수
  - 진행률 (방문/전체)

**목록 카드 레이아웃:**
```
┌──────────────┐
│   🍔 아이콘   │
│              │
│  맛집 탐방    │
│  8개 장소     │
│  ██████░░░    │
│  6/8 방문     │
└──────────────┘
```

**API 요청:**
```typescript
GET /api/lists?limit=4&sort=updatedAt

Response 200:
{
  lists: [
    {
      id: string;
      name: string;
      icon: string | { url: string };
      placesCount: number;
      visitedCount: number;
    }
  ]
}
```

#### F-5: 최근 추가 장소 섹션
- [ ] 섹션 헤더: "최근 추가한 장소"
- [ ] 최근 5개 장소 리스트
- [ ] 장소 아이템:
  - 장소명
  - 카테고리 아이콘
  - 주소 (1줄)
  - 추가 날짜 (상대 시간)
  - 방문 여부 표시

**API 요청:**
```typescript
GET /api/places?limit=5&sort=createdAt

Response 200:
{
  places: [
    {
      id: string;
      name: string;
      category: string;
      address: string;
      visited: boolean;
      createdAt: string;
    }
  ]
}
```

#### F-6: 하단 네비게이션 바
- [ ] 홈 (현재 화면)
- [ ] 지도
- [ ] 목록
- [ ] 설정
- [ ] 활성 탭 강조 (색상 + 아이콘)

### 3.2 중요 기능 (Phase 2)

#### F-7: 이번 주 추천 섹션
- [ ] 사용자 선호도 기반 추천
- [ ] 3개 장소 카드 (가로 스크롤)
- [ ] 추천 이유 표시
- [ ] "관심 없음" 옵션

**추천 알고리즘 (간단):**
- 자주 추가한 카테고리 분석
- 최근 방문한 장소 주변 추천
- 인기 장소 (앱 전체)

#### F-8: 활동 피드
- [ ] 최근 활동 3개
- [ ] 활동 타입:
  - 장소 추가
  - 목록 생성
  - 방문 완료
  - 소감 작성

**활동 아이템:**
```
[아이콘] {닉네임}님이 {장소명}을(를) 방문했습니다
         2시간 전
```

#### F-9: 성취 배지
- [ ] 달성한 배지 표시 (최대 5개)
- [ ] 배지 타입:
  - 첫 장소 추가
  - 10개 장소 달성
  - 첫 목록 생성
  - 첫 방문 완료
  - 리뷰 작성자

### 3.3 추가 기능 (Phase 3)

#### F-10: 날씨 기반 추천
- [ ] 현재 날씨 표시
- [ ] 날씨에 맞는 장소 추천
  - 맑음: 야외 활동
  - 비: 실내 카페, 박물관
  - 더움: 시원한 장소

#### F-11: 월간 통계
- [ ] 이번 달 추가한 장소 수
- [ ] 이번 달 방문한 장소 수
- [ ] 전월 대비 증감률
- [ ] 차트 (선/막대 그래프)

#### F-12: 친구 활동
- [ ] 친구 추가 기능
- [ ] 친구 최근 활동
- [ ] 친구 목록 구경

## 4. UI/UX 사양

### 4.1 레이아웃

```
┌─────────────────────┐
│  👤              🔔 │  헤더
├─────────────────────┤
│ [  🔍 검색...    ] │  검색 바
├─────────────────────┤
│ ┌───┬───┬───┬───┐  │  통계 카드
│ │24 │12 │50%│ 5 │  │
│ └───┴───┴───┴───┘  │
├─────────────────────┤
│ 내 목록      전체 →  │  목록 섹션
│ ┌───┬───┬───┬───┐  │
│ │🍔 │☕│🎨 │🏛│  │
│ └───┴───┴───┴───┘  │
├─────────────────────┤
│ 최근 추가한 장소      │  장소 섹션
│ ┌─────────────────┐ │
│ │ 🍝 맛집 A       │ │
│ │ 서울 강남        │ │
│ │ 2시간 전     ✓  │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ ☕ 카페 B       │ │
│ └─────────────────┘ │
├─────────────────────┤
│ [홈][지도][목록][설정]│  네비게이션
└─────────────────────┘
```

### 4.2 인터랙션

#### 스크롤
- 위 → 아래: 자연스러운 스크롤
- Pull to Refresh: 새로고침

#### 카드 탭
- 목록 카드: 목록 상세 이동
- 장소 아이템: 장소 상세 이동
- 통계 카드: 해당 화면 이동

#### 로딩 상태
- 스켈레톤 UI (카드 형태)
- 부드러운 페이드인

### 4.3 접근성
- 스크린 리더: 모든 요소 레이블
- 터치 타겟: 최소 44x44 pt
- 색상 대비: 4.5:1 이상

## 5. 기술 사양

### 5.1 프론트엔드

#### 컴포넌트 구조
```typescript
// DashboardScreen.tsx
interface DashboardScreenProps {
  userId: string;
}

// StatsCard.tsx
interface StatsCardProps {
  totalPlaces: number;
  visitedPlaces: number;
  visitedPercentage: number;
  totalLists: number;
}

// ListCard.tsx
interface ListCardProps {
  list: {
    id: string;
    name: string;
    icon: string | { url: string };
    placesCount: number;
    visitedCount: number;
  };
  onPress: (id: string) => void;
}

// PlaceListItem.tsx
interface PlaceListItemProps {
  place: {
    id: string;
    name: string;
    category: string;
    address: string;
    visited: boolean;
    createdAt: string;
  };
  onPress: (id: string) => void;
}
```

#### 상태 관리
```typescript
interface DashboardState {
  stats: DashboardStats | null;
  lists: List[];
  recentPlaces: Place[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
}

// API 호출 훅
function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    stats: null,
    lists: [],
    recentPlaces: [],
    isLoading: true,
    isRefreshing: false,
    error: null
  });

  const fetchData = async () => {
    try {
      const [stats, lists, places] = await Promise.all([
        api.get('dashboard/stats').json(),
        api.get('lists', { searchParams: { limit: 4 } }).json(),
        api.get('places', { searchParams: { limit: 5 } }).json()
      ]);

      setState({
        stats,
        lists: lists.lists,
        recentPlaces: places.places,
        isLoading: false,
        isRefreshing: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({ ...prev, error, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { ...state, refetch: fetchData };
}
```

### 5.2 백엔드

#### API 엔드포인트
```typescript
// dashboard.controller.ts
@Controller('dashboard')
export class DashboardController {
  @Get('stats')
  async getStats(@CurrentUser() user: User) {
    return this.dashboardService.getStats(user.id);
  }
}

// dashboard.service.ts
async getStats(userId: string): Promise<DashboardStats> {
  const [totalPlaces, visitedPlaces, totalLists] = await Promise.all([
    this.placeRepository.count({ where: { userId } }),
    this.placeRepository.count({ where: { userId, visited: true } }),
    this.listRepository.count({ where: { userId } })
  ]);

  const visitedPercentage = totalPlaces > 0
    ? Math.round((visitedPlaces / totalPlaces) * 100)
    : 0;

  return {
    totalPlaces,
    visitedPlaces,
    visitedPercentage,
    totalLists
  };
}
```

## 6. 데이터 모델

### 6.1 DashboardStats
```typescript
interface DashboardStats {
  totalPlaces: number;
  visitedPlaces: number;
  visitedPercentage: number;
  totalLists: number;
}
```

## 7. API 명세

### GET /api/dashboard/stats
대시보드 통계

**Response 200:**
```json
{
  "totalPlaces": 24,
  "visitedPlaces": 12,
  "visitedPercentage": 50,
  "totalLists": 5
}
```

### GET /api/lists?limit=4&sort=updatedAt
최근 목록

**Response 200:**
```json
{
  "lists": [
    {
      "id": "uuid-1",
      "name": "맛집 탐방",
      "icon": "🍔",
      "placesCount": 8,
      "visitedCount": 6
    }
  ]
}
```

### GET /api/places?limit=5&sort=createdAt
최근 장소

**Response 200:**
```json
{
  "places": [
    {
      "id": "uuid-1",
      "name": "맛집 A",
      "category": "restaurant",
      "address": "서울 강남구",
      "visited": true,
      "createdAt": "2025-10-05T10:00:00Z"
    }
  ]
}
```

## 8. 성능 요구사항

### 8.1 로딩 시간
- 초기 로딩: < 1초
- API 응답: < 300ms
- Pull to Refresh: < 500ms

### 8.2 캐싱
- 통계: 1분 캐싱
- 목록/장소: 실시간 (캐싱 없음)

### 8.3 최적화
- 이미지 lazy loading
- 가상화 스크롤 (장소 많을 때)
- API 요청 병렬 처리

## 9. 보안 고려사항

### 9.1 인증
- 모든 API 요청에 JWT 토큰
- 사용자별 데이터 격리

### 9.2 데이터 접근
- 본인 데이터만 조회 가능
- 서버 측 권한 검증

## 10. 테스트 계획

### 10.1 Unit 테스트
```typescript
describe('DashboardScreen', () => {
  it('통계 데이터 표시', async () => {
    // 테스트 코드
  });

  it('목록 카드 4개 표시', () => {
    // 테스트 코드
  });

  it('Pull to Refresh 동작', async () => {
    // 테스트 코드
  });
});
```

### 10.2 E2E 시나리오
1. 로그인 → 대시보드 로딩
2. 목록 카드 탭 → 목록 상세
3. 장소 아이템 탭 → 장소 상세
4. Pull to Refresh → 데이터 갱신

## 11. 향후 개선사항

### 11.1 개인화
- AI 기반 추천
- 사용 패턴 분석
- 맞춤 위젯

### 11.2 소셜
- 친구 활동 피드
- 인기 목록 탐색
- 공유 기능

### 11.3 인사이트
- 여행 통계 대시보드
- 월간 리포트
- 성취 분석
