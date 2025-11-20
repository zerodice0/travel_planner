/**
 * Analytics & Logging Type Definitions
 *
 * PostHog 이벤트 및 Axiom 로그에 사용되는 타입 정의
 *
 * @module types/analytics
 */

/**
 * 장소 이벤트 속성
 */
export interface PlaceEventProperties {
  category?: string;
  source?: 'google_maps' | 'kakao_maps' | 'manual';
  hasCustomName?: boolean;
  placeId?: string;
  fields?: string[];
  rating?: number;
}

/**
 * 리스트 이벤트 속성
 */
export interface ListEventProperties {
  listId?: string;
  placeId?: string;
  isPublic?: boolean;
  placesCount?: number;
  fields?: string[];
}

/**
 * 검색 이벤트 속성
 */
export interface SearchEventProperties {
  query?: string;
  resultsCount?: number;
  provider?: 'google' | 'kakao';
  placeId?: string;
  position?: number;
}

/**
 * 인증 이벤트 속성
 */
export interface AuthEventProperties {
  method?: 'email' | 'google';
}

/**
 * 이벤트 이름 타입
 */
export type EventName =
  // 장소 관련
  | 'place_added'
  | 'place_updated'
  | 'place_deleted'
  | 'place_visited'
  // 리스트 관련
  | 'list_created'
  | 'list_updated'
  | 'list_deleted'
  | 'place_added_to_list'
  | 'place_removed_from_list'
  // 검색 관련
  | 'search_performed'
  | 'search_result_clicked'
  // 인증 관련
  | 'user_signup'
  | 'user_login'
  | 'user_logout'
  // 페이지 뷰
  | '$pageview';

/**
 * 이벤트 속성 타입 매핑
 */
export type EventProperties<T extends EventName> =
  T extends 'place_added' | 'place_updated' | 'place_deleted' | 'place_visited'
    ? PlaceEventProperties
    : T extends 'list_created' | 'list_updated' | 'list_deleted' | 'place_added_to_list' | 'place_removed_from_list'
    ? ListEventProperties
    : T extends 'search_performed' | 'search_result_clicked'
    ? SearchEventProperties
    : T extends 'user_signup' | 'user_login'
    ? AuthEventProperties
    : Record<string, unknown>;

/**
 * 사용자 속성
 */
export interface UserProperties {
  email?: string;
  nickname?: string;
  createdAt?: string;
  plan?: string;
  placesCount?: number;
  listsCount?: number;
}

/**
 * 로그 컨텍스트
 */
export interface LogContext {
  url?: string;
  userAgent?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  status?: number;
  [key: string]: unknown;
}
