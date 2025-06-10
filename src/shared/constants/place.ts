export interface CategoryOption {
  value: string;
  label: string;
  emoji: string;
  color: string;
}

export const PLACE_CATEGORIES: CategoryOption[] = [
  { value: '음식점', label: '음식점', emoji: '🍽️', color: '#FF5252' }, // 빨간색
  { value: '카페', label: '카페', emoji: '☕️', color: '#448AFF' }, // 파란색
  { value: '관광지', label: '관광지', emoji: '🏞️', color: '#AB47BC' }, // 보라색
  { value: '쇼핑', label: '쇼핑', emoji: '🛍️', color: '#FF9800' }, // 주황색
  { value: '숙소', label: '숙소', emoji: '🏨', color: '#4CAF50' }, // 초록색
  { value: '유원지', label: '유원지', emoji: '🎢', color: '#E91E63' }, // 핑크색
  { value: '기타', label: '기타', emoji: '📍', color: '#9E9E9E' } // 회색
];

// UI에서 사용할 수 있는 형식으로 변환
export const CATEGORY_OPTIONS = PLACE_CATEGORIES.map(category => ({
  value: category.value,
  label: `${category.emoji} ${category.label}`
}));

export const DEFAULT_CATEGORY = '기타';

// 카테고리별 이모지 매핑
export const getCategoryEmoji = (category: string): string => {
  const found = PLACE_CATEGORIES.find(cat => cat.value === category);
  return found?.emoji || '📍';
};

// 카테고리별 색상 매핑
export const getCategoryColor = (category: string): string => {
  const found = PLACE_CATEGORIES.find(cat => cat.value === category);
  return found?.color || '#9E9E9E'; // 기본값: 회색
};