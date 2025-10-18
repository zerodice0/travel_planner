/**
 * List icon configuration
 * Icons specifically designed for list items (not place categories)
 */

import type { LucideIcon } from 'lucide-react';
import {
  Plane,
  Heart,
  UtensilsCrossed,
  Star,
  Target,
  Activity,
  Palette,
  Building2,
  Waves,
  FileText,
} from 'lucide-react';

export interface ListIconConfig {
  value: string;
  label: string;
  icon: LucideIcon;
}

/**
 * All available list icons
 * These are distinct from place categories and represent list types/purposes
 */
export const LIST_ICONS: ListIconConfig[] = [
  { value: 'travel', label: '여행', icon: Plane },
  { value: 'date', label: '데이트', icon: Heart },
  { value: 'food', label: '맛집', icon: UtensilsCrossed },
  { value: 'wishlist', label: '위시리스트', icon: Star },
  { value: 'goal', label: '목표', icon: Target },
  { value: 'activity', label: '활동', icon: Activity },
  { value: 'culture', label: '문화', icon: Palette },
  { value: 'city', label: '도시', icon: Building2 },
  { value: 'nature', label: '자연', icon: Waves },
  { value: 'general', label: '일반', icon: FileText },
];

/**
 * Get list icon configuration by value
 * @param iconValue - Icon value
 * @returns Icon configuration or default 'general' config
 */
export function getListIconConfig(iconValue: string): ListIconConfig {
  const config = LIST_ICONS.find((icon) => icon.value === iconValue);
  return config || LIST_ICONS.find((icon) => icon.value === 'general')!;
}

/**
 * Get list icon component
 * @param iconValue - Icon value
 * @returns Lucide icon component
 */
export function getListIcon(iconValue: string): LucideIcon {
  return getListIconConfig(iconValue).icon;
}

/**
 * Get list icon label
 * @param iconValue - Icon value
 * @returns Icon label
 */
export function getListIconLabel(iconValue: string): string {
  return getListIconConfig(iconValue).label;
}
