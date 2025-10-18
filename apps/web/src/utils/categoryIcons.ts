import { getCategoryColor, getCategoryIcon } from './categoryConfig';
import type { LucideIcon } from 'lucide-react';

/**
 * Lighten a hex color by a percentage
 * @param hex - Hex color code (e.g., "#EF4444")
 * @param percent - Percentage to lighten (0-100)
 * @returns Lightened hex color
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.round(((num >> 16) & 0xff) * (1 + percent / 100)));
  const g = Math.min(255, Math.round(((num >> 8) & 0xff) * (1 + percent / 100)));
  const b = Math.min(255, Math.round((num & 0xff) * (1 + percent / 100)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Darken a hex color by a percentage
 * @param hex - Hex color code (e.g., "#EF4444")
 * @param percent - Percentage to darken (0-100)
 * @returns Darkened hex color
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - percent / 100)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - percent / 100)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - percent / 100)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Convert Lucide icon to inline SVG path
 * Lucide icons use 24x24 viewBox, we need to scale and position them in our marker
 * @param IconComponent - Lucide icon component
 * @param color - Icon color
 * @returns SVG icon markup
 */
function renderLucideIcon(IconComponent: LucideIcon, color: string): string {
  // Create a temporary React element and extract icon data
  // Lucide icons have consistent structure we can leverage
  const iconName = IconComponent.displayName || IconComponent.name || 'icon';

  // Manually map icons to their SVG paths (Lucide icons v0.544.0)
  // We position them at center (20, 20) and scale appropriately
  const iconPaths: Record<string, string> = {
    Globe: '<circle cx="20" cy="20" r="8"/><path d="M14 12.5c1.5 2 4.5 2 6 0M14 27.5c1.5-2 4.5-2 6 0"/><line x1="20" y1="12" x2="20" y2="28"/><line x1="12" y1="20" x2="28" y2="20"/>',
    UtensilsCrossed: '<path d="M 15 12 L 15 18 M 17.5 12 L 17.5 16 M 20 12 L 20 28 M 22.5 12 L 22.5 16 M 25 12 L 25 18 M 14 24 L 20 28 L 26 24"/>',
    Coffee: '<path d="M 14 18 L 14 24 C 14 25.5 15.5 27 17 27 L 23 27 C 24.5 27 26 25.5 26 24 L 26 18 M 12 18 L 28 18 M 26 18 C 27.5 18 28 19.5 28 21 C 28 22.5 27.5 24 26 24"/>',
    Landmark: '<path d="M 13 27 L 27 27 M 15 21 L 15 27 M 20 21 L 20 27 M 25 21 L 25 27 M 14 13 L 20 11 L 26 13 M 13 21 L 27 21 M 13 13 L 13 21 M 27 13 L 27 21"/>',
    Hotel: '<rect x="13" y="14" width="14" height="13" rx="1"/><path d="M 17 14 L 17 11 L 23 11 L 23 14 M 15 19 L 17 19 M 19 19 L 21 19 M 23 19 L 25 19 M 15 23 L 17 23 M 19 23 L 21 23 M 23 23 L 25 23"/>',
    ShoppingBag: '<path d="M 15 15 L 13 27 L 27 27 L 25 15 L 15 15 M 16 15 L 16 14 C 16 12.5 17.5 11 19 11 L 21 11 C 22.5 11 24 12.5 24 14 L 24 15"/>',
    Drama: '<path d="M 14 18 C 14 15 17 13 20 13 C 23 13 26 15 26 18 L 26 25 C 26 26.5 24.5 28 23 28 L 17 28 C 15.5 28 14 26.5 14 25 L 14 18 M 16 16 C 16 17 16.5 17.5 17 17.5 C 17.5 17.5 18 17 18 16 M 22 16 C 22 17 22.5 17.5 23 17.5 C 23.5 17.5 24 17 24 16 M 16 22 C 16.5 23 18 24 20 24 C 22 24 23.5 23 24 22"/>',
    TreePine: '<path d="M 20 10 L 16 16 L 18 16 L 14 22 L 17 22 L 13 28 L 27 28 L 23 22 L 26 22 L 22 16 L 24 16 L 20 10 M 20 28 L 20 30"/>',
    MapPin: '<path d="M 20 28 C 20 28 26 22 26 17 C 26 13.5 23.3 11 20 11 C 16.7 11 14 13.5 14 17 C 14 22 20 28 20 28 Z M 20 19 C 21 19 22 18 22 17 C 22 16 21 15 20 15 C 19 15 18 16 18 17 C 18 18 19 19 20 19 Z"/>',
  };

  const iconPath = iconPaths[iconName] || iconPaths.MapPin; // Fallback to MapPin

  return `
    <g
      fill="none"
      stroke="${color}"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      style="filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3));"
    >
      ${iconPath}
    </g>
  `;
}

/**
 * Create SVG marker for map display
 * @param category - Category value
 * @param visited - Whether the place has been visited
 * @returns SVG string
 */
export function createMarkerSVG(category: string, visited: boolean): string {
  const IconComponent = getCategoryIcon(category);
  const color = getCategoryColor(category, visited);
  const colorOpacity = visited ? '0.5' : '0.4';
  const pathD =
    'M20 0C8.954 0 0 8.954 0 20c0 11.046 20 30 20 30s20-18.954 20-30C40 8.954 31.046 0 20 0z';

  // Generate gradient colors: lighter at top (20%), original at center, darker at bottom (20%)
  const lightColor = lightenColor(color, 20);
  const darkColor = darkenColor(color, 20);
  const gradientId = `gradient-${category}-${visited ? 'visited' : 'unvisited'}`;

  // Icon color: white for better visibility on colored background
  const iconColor = '#FFFFFF';

  return `
    <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
      <!-- Gradient Definition -->
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${lightColor};stop-opacity:${colorOpacity}" />
          <stop offset="50%" style="stop-color:${color};stop-opacity:${colorOpacity}" />
          <stop offset="100%" style="stop-color:${darkColor};stop-opacity:${colorOpacity}" />
        </linearGradient>
      </defs>

      <!-- Base layer: Opaque white background to block underlying markers -->
      <path
        d="${pathD}"
        fill="#FFFFFF"
        fill-opacity="1"
      />
      <!-- Color layer: Gradient category color -->
      <path
        d="${pathD}"
        fill="url(#${gradientId})"
      />
      <!-- Border layer: White stroke for definition -->
      <path
        d="${pathD}"
        fill="none"
        stroke="#FFFFFF"
        stroke-width="2"
      />
      <!-- Icon: Lucide icon -->
      ${renderLucideIcon(IconComponent, iconColor)}
    </svg>
  `;
}

/**
 * Create data URL for marker image
 * @param category - Category value
 * @param visited - Whether the place has been visited
 * @returns Data URL string
 */
export function createMarkerDataURL(category: string, visited: boolean): string {
  const svg = createMarkerSVG(category, visited);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
