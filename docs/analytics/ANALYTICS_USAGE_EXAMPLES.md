# PostHog & Axiom 사용 예시

Travel Planner에서 PostHog와 Axiom을 사용하는 실제 예시입니다.

---

## 📊 PostHog 이벤트 트래킹 예시

### 1. 장소 추가 이벤트 트래킹

```typescript
// apps/web/src/components/PlaceAddModal.tsx
import { placeEvents } from '#lib/analytics';
import { logger } from '#lib/logger';

const handleAddPlace = async (placeData: PlaceFormData) => {
  try {
    // API 호출
    const newPlace = await placesApi.create(placeData);

    // 성공 이벤트 트래킹
    placeEvents.added({
      category: placeData.category,
      source: placeData.externalId ? 'google_maps' : 'manual',
      hasCustomName: !!placeData.customName,
    });

    // 정보 로그
    logger.info('Place added successfully', {
      placeId: newPlace.id,
      category: placeData.category,
    });

    toast.success('장소가 추가되었습니다');
  } catch (error) {
    // 에러 로그
    logger.error('Failed to add place', error, {
      category: placeData.category,
      source: placeData.externalId ? 'google_maps' : 'manual',
    });

    toast.error('장소 추가에 실패했습니다');
  }
};
```

### 2. 페이지 뷰 트래킹

```typescript
// apps/web/src/pages/DashboardPage.tsx
import { useEffect } from 'react';
import { trackPageView } from '#lib/analytics';

const DashboardPage = () => {
  useEffect(() => {
    // 페이지 진입 시 트래킹
    trackPageView('Dashboard');
  }, []);

  return (
    <div>
      {/* 대시보드 컨텐츠 */}
    </div>
  );
};
```

### 3. 검색 이벤트 트래킹

```typescript
// apps/web/src/components/SearchBar.tsx
import { searchEvents } from '#lib/analytics';
import { logger } from '#lib/logger';

const handleSearch = async (query: string) => {
  try {
    const results = await googlePlacesApi.search(query);

    // 검색 수행 이벤트
    searchEvents.performed({
      query,
      resultsCount: results.length,
      provider: 'google',
    });

    logger.info('Search performed', {
      query,
      resultsCount: results.length,
    });

    setSearchResults(results);
  } catch (error) {
    logger.error('Search failed', error, { query });
    toast.error('검색에 실패했습니다');
  }
};

const handleResultClick = (place: Place, index: number) => {
  // 검색 결과 클릭 이벤트
  searchEvents.resultClicked({
    placeId: place.id,
    position: index,
  });

  // 상세 페이지로 이동
  navigate(`/places/${place.id}`);
};
```

### 4. 사용자 인증 이벤트 트래킹

```typescript
// apps/web/src/App.tsx
import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { identifyUser, authEvents } from '#lib/analytics';
import { logger } from '#lib/logger';

const App = () => {
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      // PostHog에 사용자 식별
      identifyUser(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        nickname: user.username || undefined,
        createdAt: user.createdAt?.toISOString(),
      });

      // 로그인 이벤트 (최초 한 번만)
      const isFirstLogin = sessionStorage.getItem('first_login') !== 'false';
      if (isFirstLogin) {
        authEvents.login({
          method: user.externalAccounts.length > 0 ? 'google' : 'email',
        });
        sessionStorage.setItem('first_login', 'false');
      }

      // 사용자 컨텍스트와 함께 로그
      logger.withUser(user.id).info('User session started');
    }
  }, [user, isSignedIn]);

  return <div>{/* App 컨텐츠 */}</div>;
};
```

### 5. 리스트 관리 이벤트 트래킹

```typescript
// apps/web/src/pages/ListManagementPage.tsx
import { listEvents } from '#lib/analytics';
import { logger } from '#lib/logger';

const handleCreateList = async (listData: ListFormData) => {
  try {
    const newList = await listsApi.create(listData);

    // 리스트 생성 이벤트
    listEvents.created({
      isPublic: listData.isPublic,
      placesCount: 0,
    });

    logger.info('List created', {
      listId: newList.id,
      isPublic: listData.isPublic,
    });

    toast.success('리스트가 생성되었습니다');
  } catch (error) {
    logger.error('Failed to create list', error);
    toast.error('리스트 생성에 실패했습니다');
  }
};

const handleAddPlaceToList = async (listId: string, placeId: string) => {
  try {
    await listsApi.addPlace(listId, placeId);

    // 리스트에 장소 추가 이벤트
    listEvents.placeAdded({ listId, placeId });

    logger.info('Place added to list', { listId, placeId });

    toast.success('장소가 리스트에 추가되었습니다');
  } catch (error) {
    logger.error('Failed to add place to list', error, { listId, placeId });
    toast.error('장소 추가에 실패했습니다');
  }
};
```

---

## 📝 Axiom 로깅 예시

### 1. API 에러 로깅

```typescript
// apps/web/src/lib/api.ts
import ky, { HTTPError } from 'ky';
import { logApiError } from '#lib/logger';

export const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL,
  hooks: {
    afterResponse: [
      async (request, _options, response) => {
        // API 에러 자동 로깅
        if (!response.ok) {
          const error = await HTTPError.fromResponse(response);
          logApiError(error, {
            endpoint: request.url,
            method: request.method,
            status: response.status,
          });
        }

        return response;
      },
    ],
  },
});
```

### 2. 컴포넌트 에러 바운더리

```typescript
// apps/web/src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { logger } from '#lib/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅
    logger.error('Component error caught', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h1>문제가 발생했습니다</h1>
          <p>페이지를 새로고침해주세요</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 3. 성능 로깅

```typescript
// apps/web/src/hooks/usePerformanceMonitor.ts
import { useEffect } from 'react';
import { logger } from '#lib/logger';

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 렌더링 시간이 100ms 이상이면 경고
      if (renderTime > 100) {
        logger.warn(`Slow component render: ${componentName}`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          component: componentName,
        });
      }
    };
  }, [componentName]);
}

// 사용 예시
const PlaceListPage = () => {
  usePerformanceMonitor('PlaceListPage');

  return <div>{/* 컴포넌트 컨텐츠 */}</div>;
};
```

### 4. 사용자 액션 로깅 (디버깅용)

```typescript
// apps/web/src/components/PlaceDetailPage.tsx
import { logger } from '#lib/logger';

const handleVisitToggle = async (placeId: string, visited: boolean) => {
  logger.debug('Visit toggle clicked', {
    placeId,
    newVisitedState: visited,
  });

  try {
    await placesApi.updateVisited(placeId, visited);
    logger.info('Visit status updated', { placeId, visited });
  } catch (error) {
    logger.error('Failed to update visit status', error, { placeId });
  }
};
```

### 5. 네트워크 상태 모니터링

```typescript
// apps/web/src/hooks/useNetworkMonitor.ts
import { useEffect } from 'react';
import { logger } from '#lib/logger';

export function useNetworkMonitor() {
  useEffect(() => {
    const handleOnline = () => {
      logger.info('Network status: online');
    };

    const handleOffline = () => {
      logger.warn('Network status: offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 초기 상태 로깅
    if (!navigator.onLine) {
      logger.warn('Initial network status: offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}
```

---

## 🎯 통합 예시: 전체 워크플로우

```typescript
// apps/web/src/pages/PlaceAddPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { placeEvents, trackPageView } from '#lib/analytics';
import { logger } from '#lib/logger';
import { logApiError } from '#lib/logger';

const PlaceAddPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 페이지 뷰 트래킹
  useEffect(() => {
    trackPageView('Place Add');
  }, []);

  const handleSubmit = async (formData: PlaceFormData) => {
    setIsSubmitting(true);

    // 사용자 컨텍스트와 함께 로깅
    const userLogger = user ? logger.withUser(user.id) : logger;

    userLogger.info('Place add form submitted', {
      category: formData.category,
      hasCustomName: !!formData.customName,
    });

    try {
      // API 호출
      const newPlace = await placesApi.create(formData);

      // 성공 이벤트 트래킹
      placeEvents.added({
        category: formData.category,
        source: formData.externalId ? 'google_maps' : 'manual',
        hasCustomName: !!formData.customName,
      });

      // 성공 로그
      userLogger.info('Place created successfully', {
        placeId: newPlace.id,
        category: formData.category,
      });

      toast.success('장소가 추가되었습니다');
      navigate(`/places/${newPlace.id}`);
    } catch (error) {
      // 에러 로깅
      userLogger.error('Failed to create place', error, {
        category: formData.category,
        source: formData.externalId ? 'google_maps' : 'manual',
      });

      // API 에러인 경우 추가 컨텍스트
      if (error instanceof HTTPError) {
        logApiError(error, {
          endpoint: '/places',
          method: 'POST',
          status: error.response.status,
        });
      }

      toast.error('장소 추가에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PlaceForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
};
```

---

## 🔍 모니터링 대시보드 활용

### PostHog 대시보드

1. **사용자 행동 분석**
   - 어떤 기능을 가장 많이 사용하는지
   - 장소 추가 소스 분포 (Google Maps vs 수동)
   - 리스트 공개 vs 비공개 비율

2. **퍼널 분석**
   - 회원가입 → 장소 추가 → 리스트 생성 전환율
   - 검색 → 결과 클릭 → 장소 추가 전환율

3. **코호트 분석**
   - 신규 사용자의 7일 리텐션
   - 월별 활성 사용자 추이

### Axiom 대시보드

1. **에러 모니터링**
   - 에러 발생 빈도 및 추세
   - 가장 자주 발생하는 에러 타입
   - 에러 영향 받은 사용자 수

2. **성능 모니터링**
   - API 응답 시간
   - 느린 컴포넌트 렌더링
   - 네트워크 에러 발생 빈도

3. **사용자 경험 모니터링**
   - 네트워크 오프라인 빈도
   - 브라우저별 에러 분포
   - 디바이스별 성능 차이

---

**작성일:** 2025-01-18
**문서 버전:** 1.0
