export interface CategoryIconConfig {
  icon: string;
  color: string;
  visitedColor: string;
}

const categoryConfigs: Record<string, CategoryIconConfig> = {
  restaurant: {
    icon: '🍽️',
    color: '#EF4444',
    visitedColor: '#10B981',
  },
  cafe: {
    icon: '☕',
    color: '#F59E0B',
    visitedColor: '#10B981',
  },
  attraction: {
    icon: '🎭',
    color: '#8B5CF6',
    visitedColor: '#10B981',
  },
  shopping: {
    icon: '🛍️',
    color: '#EC4899',
    visitedColor: '#10B981',
  },
  culture: {
    icon: '🎨',
    color: '#6366F1',
    visitedColor: '#10B981',
  },
  nature: {
    icon: '🌲',
    color: '#22C55E',
    visitedColor: '#10B981',
  },
  accommodation: {
    icon: '🏨',
    color: '#3B82F6',
    visitedColor: '#10B981',
  },
  etc: {
    icon: '📍',
    color: '#6B7280',
    visitedColor: '#10B981',
  },
};

export function getCategoryConfig(category: string): CategoryIconConfig {
  const config = categoryConfigs[category];
  if (config) {
    return config;
  }
  return categoryConfigs.etc as CategoryIconConfig;
}

export function createMarkerSVG(category: string, visited: boolean): string {
  const config = getCategoryConfig(category);
  const color = visited ? config.visitedColor : config.color;

  return `
    <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 0C8.954 0 0 8.954 0 20c0 11.046 20 30 20 30s20-18.954 20-30C40 8.954 31.046 0 20 0z"
        fill="${color}"
        stroke="#FFFFFF"
        stroke-width="2"
      />
      <text
        x="20"
        y="24"
        font-size="18"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${config.icon}
      </text>
    </svg>
  `;
}

export function createMarkerDataURL(category: string, visited: boolean): string {
  const svg = createMarkerSVG(category, visited);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
