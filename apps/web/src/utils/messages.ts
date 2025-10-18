/**
 * Message templates for UI
 * This file centralizes all user-facing messages for easier maintenance and i18n preparation
 */

/**
 * Empty state messages for different scenarios
 */
export const EMPTY_STATE_MESSAGES = {
  /**
   * Message when no places are found in the current viewport
   */
  viewport: '현재 위치에는 등록된 장소가 없습니다',

  /**
   * Message when no places are found for the selected category
   * @param categoryLabel - Localized category label (e.g., '음식점', '카페')
   */
  category: (categoryLabel: string) =>
    `현재 보고 계신 지역에는 아직 '${categoryLabel}' 카테고리로 등록된 장소가 없습니다`,

  /**
   * Message when no places exist globally
   */
  global: '아직 등록된 장소가 없습니다',
} as const;

/**
 * Action-related messages
 */
export const ACTION_MESSAGES = {
  /**
   * Suggestion to move the map
   */
  moveMap: '지도를 이동하여 다른 지역을 탐색해보세요',

  /**
   * Login button text
   */
  login: '로그인',

  /**
   * Message after login action
   */
  addFirstPlace: '하고 첫 장소를 추가해보세요',

  /**
   * Button text for exploring nearest place
   */
  exploreNearest: '등록된 장소 중 가장 가까운 곳으로 이동',

  /**
   * Loading state text
   */
  loading: '로딩 중...',
} as const;
