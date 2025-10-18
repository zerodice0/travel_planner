/**
 * Map Constants
 * Google Maps와 Kakao Map의 zoom/level 관련 상수 정의
 */

/**
 * Google Maps Zoom Levels
 * - MIN: 1 (전 세계 뷰)
 * - MAX: 21 (건물 상세 뷰)
 * - 높을수록 더 확대됨
 */
export const GOOGLE_ZOOM = {
  MIN: 1,
  MAX: 21,
  DEFAULT: 15,
  DETAIL: 17, // 장소 상세 뷰
  SEARCH_RESULT: 16, // 검색 결과 뷰
} as const;

/**
 * Kakao Map Levels
 * - MIN: 1 (최대 확대)
 * - MAX: 14 (최대 축소)
 * - 낮을수록 더 확대됨 (Google과 반대)
 */
export const KAKAO_LEVEL = {
  MIN: 1,
  MAX: 14,
  DEFAULT: 6,
  DETAIL: 4, // 장소 상세 뷰
  SEARCH_RESULT: 5, // 검색 결과 뷰
} as const;

/**
 * Google Maps zoom을 Kakao Map level로 변환
 * Google zoom: 높을수록 확대 (1-21)
 * Kakao level: 낮을수록 확대 (1-14)
 */
export function convertGoogleZoomToKakaoLevel(zoom: number): number {
  const clampedZoom = Math.max(GOOGLE_ZOOM.MIN, Math.min(GOOGLE_ZOOM.MAX, zoom));
  const level = GOOGLE_ZOOM.MAX - clampedZoom;
  return Math.max(KAKAO_LEVEL.MIN, Math.min(KAKAO_LEVEL.MAX, level));
}

/**
 * Kakao Map level을 Google Maps zoom으로 변환
 * Kakao level: 낮을수록 확대 (1-14)
 * Google zoom: 높을수록 확대 (1-21)
 */
export function convertKakaoLevelToGoogleZoom(level: number): number {
  const clampedLevel = Math.max(KAKAO_LEVEL.MIN, Math.min(KAKAO_LEVEL.MAX, level));
  const zoom = GOOGLE_ZOOM.MAX - clampedLevel;
  return Math.max(GOOGLE_ZOOM.MIN, Math.min(GOOGLE_ZOOM.MAX, zoom));
}
