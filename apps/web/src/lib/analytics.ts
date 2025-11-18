/**
 * PostHog Analytics Integration
 *
 * 사용자 이벤트 트래킹 및 분석을 위한 PostHog 통합
 *
 * @module lib/analytics
 */

import posthog from 'posthog-js';

/**
 * PostHog 초기화 여부
 */
let isInitialized = false;

/**
 * PostHog 초기화
 *
 * 환경 변수에서 PostHog 설정을 읽어와 초기화합니다.
 * 개발 환경에서는 이벤트를 콘솔에만 출력합니다.
 */
export function initializePostHog(): void {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

  // API 키가 없으면 초기화하지 않음 (개발 환경 허용)
  if (!apiKey) {
    console.warn('[Analytics] PostHog API key not found. Analytics disabled.');
    return;
  }

  try {
    posthog.init(apiKey, {
      api_host: apiHost,
      // 개발 환경에서는 이벤트를 전송하지 않음
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          posthog.opt_out_capturing();
          console.log('[Analytics] PostHog loaded in development mode (opt-out)');
        }
      },
      // 자동 페이지뷰 트래킹 비활성화 (수동 제어)
      capture_pageview: false,
      // 개인정보 보호 설정
      autocapture: false, // 자동 클릭 캡처 비활성화
      mask_all_text: false, // 텍스트 마스킹 비활성화 (필요시 활성화)
      mask_all_element_attributes: false,
      // 성능 설정
      persistence: 'localStorage',
      session_recording: {
        maskAllInputs: true, // 모든 입력 필드 마스킹
        maskInputOptions: {},
      },
    });

    isInitialized = true;
    console.log('[Analytics] PostHog initialized successfully');
  } catch (error) {
    console.error('[Analytics] Failed to initialize PostHog:', error);
  }
}

/**
 * 사용자 식별
 *
 * Clerk 사용자 정보를 PostHog에 연결합니다.
 *
 * @param userId - Clerk 사용자 ID
 * @param properties - 추가 사용자 속성 (선택)
 */
export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    nickname?: string;
    createdAt?: string;
  },
): void {
  if (!isInitialized) {
    console.warn('[Analytics] PostHog not initialized');
    return;
  }

  try {
    posthog.identify(userId, properties);
    console.log('[Analytics] User identified:', userId);
  } catch (error) {
    console.error('[Analytics] Failed to identify user:', error);
  }
}

/**
 * 사용자 식별 해제 (로그아웃)
 */
export function resetUser(): void {
  if (!isInitialized) {
    console.warn('[Analytics] PostHog not initialized');
    return;
  }

  try {
    posthog.reset();
    console.log('[Analytics] User reset');
  } catch (error) {
    console.error('[Analytics] Failed to reset user:', error);
  }
}

/**
 * 이벤트 트래킹
 *
 * 사용자 액션을 PostHog에 기록합니다.
 *
 * @param eventName - 이벤트 이름 (예: 'place_added', 'list_created')
 * @param properties - 이벤트 속성 (선택)
 *
 * @example
 * ```typescript
 * trackEvent('place_added', {
 *   category: 'restaurant',
 *   source: 'google_maps',
 * });
 * ```
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>,
): void {
  if (!isInitialized) {
    // 개발 환경에서는 콘솔 로깅
    if (import.meta.env.DEV) {
      console.log('[Analytics] Track event:', eventName, properties);
    }
    return;
  }

  try {
    posthog.capture(eventName, properties);
    if (import.meta.env.DEV) {
      console.log('[Analytics] Event tracked:', eventName, properties);
    }
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
}

/**
 * 페이지 뷰 트래킹
 *
 * 페이지 방문을 PostHog에 기록합니다.
 * React Router의 useEffect 내부에서 호출하세요.
 *
 * @param pageName - 페이지 이름 (선택, 기본값: 현재 경로)
 *
 * @example
 * ```typescript
 * useEffect(() => {
 *   trackPageView('Dashboard');
 * }, []);
 * ```
 */
export function trackPageView(pageName?: string): void {
  if (!isInitialized) {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Track page view:', pageName || window.location.pathname);
    }
    return;
  }

  try {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page_name: pageName || document.title,
    });
    if (import.meta.env.DEV) {
      console.log('[Analytics] Page view tracked:', pageName || window.location.pathname);
    }
  } catch (error) {
    console.error('[Analytics] Failed to track page view:', error);
  }
}

/**
 * 사용자 속성 설정
 *
 * 사용자의 추가 속성을 PostHog에 기록합니다.
 *
 * @param properties - 사용자 속성
 *
 * @example
 * ```typescript
 * setUserProperties({
 *   plan: 'premium',
 *   placesCount: 50,
 * });
 * ```
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (!isInitialized) {
    console.warn('[Analytics] PostHog not initialized');
    return;
  }

  try {
    posthog.people.set(properties);
    console.log('[Analytics] User properties set:', properties);
  } catch (error) {
    console.error('[Analytics] Failed to set user properties:', error);
  }
}

/**
 * PostHog 인스턴스 가져오기 (고급 사용)
 *
 * @returns PostHog 인스턴스 또는 null
 */
export function getPostHog() {
  return isInitialized ? posthog : null;
}

/**
 * 주요 이벤트 트래킹 헬퍼 함수들
 */

/** 장소 관련 이벤트 */
export const placeEvents = {
  added: (data: { category?: string; source?: string; hasCustomName?: boolean }) =>
    trackEvent('place_added', data),
  updated: (data: { placeId: string; fields: string[] }) =>
    trackEvent('place_updated', data),
  deleted: (data: { placeId: string; category?: string }) =>
    trackEvent('place_deleted', data),
  visited: (data: { placeId: string; rating?: number }) =>
    trackEvent('place_visited', data),
};

/** 리스트 관련 이벤트 */
export const listEvents = {
  created: (data: { isPublic: boolean; placesCount?: number }) =>
    trackEvent('list_created', data),
  updated: (data: { listId: string; fields: string[] }) =>
    trackEvent('list_updated', data),
  deleted: (data: { listId: string; placesCount: number }) =>
    trackEvent('list_deleted', data),
  placeAdded: (data: { listId: string; placeId: string }) =>
    trackEvent('place_added_to_list', data),
  placeRemoved: (data: { listId: string; placeId: string }) =>
    trackEvent('place_removed_from_list', data),
};

/** 검색 관련 이벤트 */
export const searchEvents = {
  performed: (data: { query: string; resultsCount: number; provider: 'google' | 'kakao' }) =>
    trackEvent('search_performed', data),
  resultClicked: (data: { placeId: string; position: number }) =>
    trackEvent('search_result_clicked', data),
};

/** 사용자 인증 관련 이벤트 */
export const authEvents = {
  signup: (data: { method: 'email' | 'google' }) =>
    trackEvent('user_signup', data),
  login: (data: { method: 'email' | 'google' }) =>
    trackEvent('user_login', data),
  logout: () =>
    trackEvent('user_logout'),
};
