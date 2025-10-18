/**
 * Central category configuration
 * Single source of truth for all category-related data
 */

import type { LucideIcon } from 'lucide-react';
import {
  Globe,
  UtensilsCrossed,
  Coffee,
  Landmark,
  Hotel,
  ShoppingBag,
  Drama,
  TreePine,
  MapPin,
} from 'lucide-react';

export interface CategoryConfig {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  visitedColor: string;
}

/**
 * All available categories with their display properties
 */
export const CATEGORIES: CategoryConfig[] = [
  { value: 'all', label: '전체', icon: Globe, color: '#6B7280', visitedColor: '#10B981' },
  { value: 'restaurant', label: '음식점', icon: UtensilsCrossed, color: '#EF4444', visitedColor: '#10B981' },
  { value: 'cafe', label: '카페', icon: Coffee, color: '#F59E0B', visitedColor: '#10B981' },
  { value: 'attraction', label: '관광지', icon: Landmark, color: '#8B5CF6', visitedColor: '#10B981' },
  { value: 'accommodation', label: '숙소', icon: Hotel, color: '#3B82F6', visitedColor: '#10B981' },
  { value: 'shopping', label: '쇼핑', icon: ShoppingBag, color: '#EC4899', visitedColor: '#10B981' },
  { value: 'culture', label: '문화시설', icon: Drama, color: '#6366F1', visitedColor: '#10B981' },
  { value: 'nature', label: '자연', icon: TreePine, color: '#22C55E', visitedColor: '#10B981' },
  { value: 'etc', label: '기타', icon: MapPin, color: '#6B7280', visitedColor: '#10B981' },
];

/**
 * Category mapping for backward compatibility
 * Maps old category names to new standardized names
 */
const CATEGORY_ALIASES: Record<string, string> = {
  tourist_attraction: 'attraction',
};

/**
 * Get standardized category value
 * @param category - Original category value
 * @returns Standardized category value
 */
export function normalizeCategoryValue(category: string): string {
  return CATEGORY_ALIASES[category] || category;
}

/**
 * Get category configuration by value
 * @param category - Category value (will be normalized)
 * @returns Category configuration or default 'etc' config
 */
export function getCategoryConfig(category: string): CategoryConfig {
  const normalizedCategory = normalizeCategoryValue(category);
  const config = CATEGORIES.find((cat) => cat.value === normalizedCategory);
  return config || CATEGORIES.find((cat) => cat.value === 'etc')!;
}

/**
 * Get category icon
 * @param category - Category value
 * @returns Lucide icon component
 */
export function getCategoryIcon(category: string): LucideIcon {
  return getCategoryConfig(category).icon;
}

/**
 * Get category label
 * @param category - Category value
 * @returns Category label
 */
export function getCategoryLabel(category: string): string {
  return getCategoryConfig(category).label;
}

/**
 * Get category color
 * @param category - Category value
 * @param visited - Whether the place has been visited
 * @returns Color hex code
 */
export function getCategoryColor(category: string, visited: boolean = false): string {
  const config = getCategoryConfig(category);
  return visited ? config.visitedColor : config.color;
}
