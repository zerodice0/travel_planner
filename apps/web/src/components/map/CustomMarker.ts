/**
 * Custom Marker Component for Google Maps
 * Creates a marker with a floating label and pin icon
 */

/**
 * Marker configuration constants
 */
const MARKER_CONFIG = {
  LABEL: {
    MAX_WIDTH: '200px',
    PADDING: '8px 12px',
    MARGIN_BOTTOM: '8px',
    BORDER_RADIUS: '8px',
    BOX_SHADOW: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  BADGE: {
    FONT_SIZE: '10px',
    PADDING: '2px 8px',
    BORDER_RADIUS: '4px',
  },
  NAME: {
    FONT_SIZE: '14px',
    MAX_WIDTH: '200px',
  },
  PIN: {
    WIDTH: '32px',
    HEIGHT: '40px',
  },
  COLORS: {
    PRIMARY: '#3B82F6',
    PRIMARY_DARK: '#1E40AF',
    BADGE_BG: '#DBEAFE',
    BADGE_TEXT: '#3B82F6',
    NAME_TEXT: '#1F2937',
    WHITE: '#FFFFFF',
  },
} as const;

/**
 * Marker animation style ID
 */
const ANIMATION_STYLE_ID = 'custom-marker-animation';

/**
 * Injects marker animation styles into the document head (once per page load)
 * Should be called once when the map is initialized
 */
export function injectMarkerStyles(): void {
  // Skip if already injected
  if (document.getElementById(ANIMATION_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = ANIMATION_STYLE_ID;
  style.textContent = `
    @keyframes marker-bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-20px);
      }
      60% {
        transform: translateY(-10px);
      }
    }

    .custom-marker-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: marker-bounce 2s ease-in-out;
    }

    .custom-marker-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin-bottom: ${MARKER_CONFIG.LABEL.MARGIN_BOTTOM};
      background: ${MARKER_CONFIG.COLORS.WHITE};
      border-radius: ${MARKER_CONFIG.LABEL.BORDER_RADIUS};
      padding: ${MARKER_CONFIG.LABEL.PADDING};
      box-shadow: ${MARKER_CONFIG.LABEL.BOX_SHADOW};
      max-width: ${MARKER_CONFIG.LABEL.MAX_WIDTH};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .custom-marker-badge {
      font-size: ${MARKER_CONFIG.BADGE.FONT_SIZE};
      font-weight: 600;
      color: ${MARKER_CONFIG.COLORS.BADGE_TEXT};
      background: ${MARKER_CONFIG.COLORS.BADGE_BG};
      padding: ${MARKER_CONFIG.BADGE.PADDING};
      border-radius: ${MARKER_CONFIG.BADGE.BORDER_RADIUS};
    }

    .custom-marker-name {
      font-size: ${MARKER_CONFIG.NAME.FONT_SIZE};
      font-weight: 600;
      color: ${MARKER_CONFIG.COLORS.NAME_TEXT};
      max-width: ${MARKER_CONFIG.NAME.MAX_WIDTH};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .custom-marker-pin {
      width: ${MARKER_CONFIG.PIN.WIDTH};
      height: ${MARKER_CONFIG.PIN.HEIGHT};
      position: relative;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Creates a custom marker content element with label and pin
 *
 * @param placeName - Name of the place to display
 * @returns HTMLElement - Custom marker content ready for AdvancedMarkerElement
 *
 * @example
 * ```typescript
 * const markerContent = createCustomMarkerContent("스타벅스 강남점");
 * const marker = new AdvancedMarkerElement({
 *   position: { lat, lng },
 *   content: markerContent,
 *   map: googleMap,
 * });
 * ```
 */
export function createCustomMarkerContent(placeName: string): HTMLElement {
  // Ensure styles are injected (safe to call multiple times)
  injectMarkerStyles();

  // Main container
  const markerContainer = document.createElement('div');
  markerContainer.className = 'custom-marker-container';

  // Label container (floating above the pin)
  const labelContainer = document.createElement('div');
  labelContainer.className = 'custom-marker-label';

  // Badge (검색 결과)
  const badge = document.createElement('span');
  badge.className = 'custom-marker-badge';
  badge.textContent = '검색 결과';

  // Place name
  const placeNameElement = document.createElement('span');
  placeNameElement.className = 'custom-marker-name';
  placeNameElement.textContent = placeName;
  placeNameElement.title = placeName; // Tooltip for long names

  labelContainer.appendChild(badge);
  labelContainer.appendChild(placeNameElement);

  // Pin container
  const pinContainer = document.createElement('div');
  pinContainer.className = 'custom-marker-pin';

  // SVG pin icon
  pinContainer.innerHTML = `
    <svg
      width="${MARKER_CONFIG.PIN.WIDTH}"
      height="${MARKER_CONFIG.PIN.HEIGHT}"
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="위치 마커"
    >
      <title>위치 마커</title>
      <path
        d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 40 16 40C16 40 32 24.837 32 16C32 7.163 24.837 0 16 0Z"
        fill="${MARKER_CONFIG.COLORS.PRIMARY}"
        stroke="${MARKER_CONFIG.COLORS.PRIMARY_DARK}"
        stroke-width="2"
      />
      <circle cx="16" cy="16" r="6" fill="${MARKER_CONFIG.COLORS.WHITE}" />
    </svg>
  `;

  markerContainer.appendChild(labelContainer);
  markerContainer.appendChild(pinContainer);

  return markerContainer;
}
