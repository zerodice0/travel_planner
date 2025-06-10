export interface CategoryOption {
  value: string;
  label: string;
  emoji: string;
}

export const PLACE_CATEGORIES: CategoryOption[] = [
  { value: '음식점', label: '음식점', emoji: '🍽️' },
  { value: '카페', label: '카페', emoji: '☕️' },
  { value: '관광지', label: '관광지', emoji: '🏞️' },
  { value: '쇼핑', label: '쇼핑', emoji: '🛍️' },
  { value: '숙소', label: '숙소', emoji: '🏨' },
  { value: '유원지', label: '유원지', emoji: '🎢' },
  { value: '기타', label: '기타', emoji: '📍' }
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