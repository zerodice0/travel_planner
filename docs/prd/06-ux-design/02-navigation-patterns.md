# 네비게이션 패턴 PRD

## 1. 개요

일관된 네비게이션 경험 설계

## 2. 네비게이션 구조

### 2.1 하단 탭 네비게이션 (Primary)

```
┌─────────────────────┐
│                     │
│    Main Content     │
│                     │
├─────────────────────┤
│ [홈][지도][목록][설정]│
└─────────────────────┘
```

**4개 탭:**
1. 홈 (대시보드)
2. 지도 (메인 지도)
3. 목록 (목록 관리)
4. 설정

**특징:**
- 항상 표시
- 현재 탭 강조 (색상 + 아이콘)
- 탭 전환 애니메이션
- 스크롤해도 고정

### 2.2 스택 네비게이션 (Secondary)

```
화면 A → 화면 B → 화면 C
  ←        ←        ←
```

**특징:**
- 뒤로가기 버튼 (좌측 상단)
- 화면 제목 (중앙)
- 액션 버튼 (우측 상단)
- 슬라이드 전환

### 2.3 모달 네비게이션

```
Base Screen
    ↓
  Modal
    ↓
  Modal
```

**사용 사례:**
- 장소 추가
- 목록 생성/편집
- 필터 설정
- 확인 다이얼로그

**특징:**
- 배경 딤 처리
- 스와이프로 닫기
- 탭 외부 닫기
- 바텀시트 (모바일)

## 3. 네비게이션 플로우

### 3.1 홈 (대시보드)
```
홈
├─ 목록 카드 탭 → 목록 상세
│  └─ 장소 카드 탭 → 장소 상세
├─ 최근 장소 탭 → 장소 상세
└─ 검색 탭 → 검색 화면
   └─ 결과 탭 → 상세 화면
```

### 3.2 지도
```
지도
├─ 검색 → 검색 결과 → 장소 추가
├─ 마커 클릭 → InfoWindow → 장소 상세
└─ 필터 → 필터 모달
```

### 3.3 목록
```
목록 관리
├─ + 버튼 → 목록 생성 모달
├─ 목록 카드 → 목록 상세
│  ├─ + 버튼 → 장소 추가 모달
│  └─ 장소 카드 → 장소 상세
└─ 편집 → 목록 편집 모달
```

### 3.4 설정
```
설정
├─ 프로필 → 프로필 편집
├─ 카테고리 관리 → 카테고리 목록
│  └─ + 버튼 → 카테고리 추가 모달
└─ 이용약관 → 약관 화면
```

## 4. 네비게이션 패턴

### 4.1 탭 전환
```typescript
const [activeTab, setActiveTab] = useState('home');

<TabBar>
  <TabItem
    icon="home"
    label="홈"
    active={activeTab === 'home'}
    onClick={() => setActiveTab('home')}
  />
  {/* 기타 탭 */}
</TabBar>
```

### 4.2 스택 푸시/팝
```typescript
// 푸시
navigate('/places/:id');

// 팝
navigate(-1); // 뒤로가기
```

### 4.3 모달 열기/닫기
```typescript
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
>
  {/* 모달 내용 */}
</Modal>
```

## 5. 애니메이션

### 5.1 화면 전환
```css
/* Slide In (좌 → 우) */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Slide Out (우 → 좌) */
@keyframes slideOutLeft {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}
```

### 5.2 모달 전환
```css
/* Fade + Scale */
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Slide Up (바텀시트) */
@keyframes slideUpModal {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
```

## 6. 제스처

### 6.1 스와이프 뒤로가기
```typescript
const swipeHandlers = useSwipeGesture({
  onSwipeRight: () => navigate(-1),
  threshold: 50
});

<div {...swipeHandlers}>
  {/* 화면 내용 */}
</div>
```

### 6.2 Pull to Refresh
```typescript
const { isRefreshing, onRefresh } = usePullToRefresh(() => {
  fetchData();
});

<PullToRefresh
  onRefresh={onRefresh}
  isRefreshing={isRefreshing}
>
  {/* 콘텐츠 */}
</PullToRefresh>
```

## 7. 딥링크

### 7.1 URL 구조
```
travel-planner://
  home
  map
  lists
  lists/:id
  places/:id
  settings
```

### 7.2 웹 URL
```
https://travel-planner.com/
  /dashboard
  /map
  /lists
  /lists/:id
  /places/:id
  /settings
```

## 8. 브레드크럼 (웹)

```
홈 > 목록 > 맛집 탐방 > 장소 A
```

## 9. 네비게이션 상태 관리

```typescript
interface NavigationState {
  currentScreen: string;
  history: string[];
  params: Record<string, any>;
}

const navigationStack = {
  push: (screen: string, params?: any) => {},
  pop: () => {},
  replace: (screen: string, params?: any) => {},
  reset: (screen: string) => {}
};
```

## 10. 사용자 경험 원칙

1. **일관성**: 같은 액션은 같은 결과
2. **예측 가능성**: 사용자가 예상하는 동작
3. **피드백**: 액션에 대한 즉각적인 반응
4. **간결성**: 최소한의 단계
5. **복구 가능성**: 실수 복구 가능
