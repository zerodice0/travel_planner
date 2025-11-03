/**
 * InfoWindow Utilities
 * Common functions for generating custom InfoWindow HTML content
 * for Google Maps markers
 */

import type { Place } from '#types/place';
import type { SearchResult } from '#types/map';
import type { PlaceDetails } from '#hooks/useGooglePlaceDetails';
import { getCategoryLabel } from './categoryConfig';

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

/**
 * Creates InfoWindow HTML content for POI (Point of Interest) clicks
 * Enhanced with rating, phone, website, and opening hours
 */
export function createPOIInfoWindowContent(details: PlaceDetails): string {
  const categoryLabel = getCategoryLabel(details.types?.[0] || 'etc');

  const ratingStars = details.rating
    ? `<div style="color: #FFB800; font-size: 14px; margin-bottom: 4px;">
         ${'⭐'.repeat(Math.round(details.rating))} ${details.rating.toFixed(1)} (${details.userRatingCount || 0}개 리뷰)
       </div>`
    : '';

  const phoneLink = details.phone
    ? `<div style="margin-bottom: 6px;">
         <a href="tel:${details.phone}" style="color: #4A90E2; text-decoration: none; font-size: 13px;">
           📞 ${escapeHtml(details.phone)}
         </a>
       </div>`
    : '';

  const websiteLink = details.website
    ? `<div style="margin-bottom: 6px;">
         <a href="${details.website}" target="_blank" rel="noopener noreferrer" style="color: #4A90E2; text-decoration: none; font-size: 13px;">
           🌐 웹사이트 방문
         </a>
       </div>`
    : '';

  const openingHours = details.openingHours
    ? `<div style="color: ${details.openingHours.isOpen ? '#059669' : '#EF4444'}; font-size: 12px; font-weight: 600; margin-bottom: 6px;">
         ${details.openingHours.isOpen ? '🟢 영업 중' : '🔴 영업 종료'}
       </div>`
    : '';

  return `
    <div style="padding: 12px 14px 14px 14px; min-width: 280px; max-width: 320px;">
      <div style="font-weight: 700; margin-bottom: 6px; font-size: 16px; color: #111827;">
        ${escapeHtml(details.name)}
      </div>
      <div style="color: #374151; font-size: 12px; margin-bottom: 6px;">
        ${categoryLabel}
      </div>
      ${ratingStars}
      ${openingHours}
      <div style="color: #6B7280; font-size: 12px; margin-bottom: 12px;">
        <span style="color: #9CA3AF;">📍</span> ${escapeHtml(details.address)}
      </div>
      ${phoneLink}
      ${websiteLink}
      <button
        data-action="add-poi-place"
        data-place-id="${details.placeId}"
        style="width: 100%; padding: 12px; background: #4A90E2; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-top: 12px;"
        onmouseover="this.style.background='#2E5C8A'"
        onmouseout="this.style.background='#4A90E2'"
      >
        장소 추가
      </button>
    </div>
  `;
}

/**
 * Creates InfoWindow HTML content for search results
 */
export function createSearchResultInfoWindowContent(result: SearchResult): string {
  const categoryLabel = getCategoryLabel(result.category);

  return `
    <div style="padding: 12px 16px 16px 16px; padding-right: 40px; min-width: 240px;">
      <div style="font-weight: 700; margin-bottom: 8px; font-size: 16px; color: #111827; line-height: 1.4;">
        ${escapeHtml(result.name)}
      </div>
      <div style="color: #374151; font-size: 12px; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
        <span style="color: #9CA3AF;">📍</span>
        ${categoryLabel}
      </div>
      <div style="color: #6B7280; font-size: 12px; margin-bottom: 12px; line-height: 1.5;">
        ${escapeHtml(result.address)}
      </div>
      <button
        data-action="add-place"
        data-result-id="${result.id}"
        style="width: 100%; padding: 12px; background: #4A90E2; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; margin-top: 12px; transition: background 0.2s;"
        onmouseover="this.style.background='#2E5C8A'"
        onmouseout="this.style.background='#4A90E2'"
      >
        장소 추가
      </button>
    </div>
  `;
}

/**
 * Creates InfoWindow HTML content for user's saved places
 * Includes custom name, labels, category, and visit status
 */
export function createPlaceInfoWindowContent(place: Place): string {
  // Custom name section (if available)
  const customNameHtml = place.customName
    ? `<div style="font-weight: 700; font-size: 16px; color: #3B82F6; margin-bottom: 4px; line-height: 1.3;">
         ✨ ${escapeHtml(place.customName)}
       </div>`
    : '';

  // Labels section (if available)
  const labelsHtml = place.labels && place.labels.length > 0
    ? `<div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
         ${place.labels.map(label =>
           `<span style="background: #DBEAFE; color: #3B82F6; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
              🏷️ ${escapeHtml(label)}
            </span>`
         ).join('')}
       </div>`
    : '';

  // Effective category (custom or default)
  const effectiveCategory = place.customCategory || place.category;

  return `
    <div style="padding: 12px 16px 16px 16px; padding-right: 40px; min-width: 220px;">
      ${customNameHtml}

      <div style="font-weight: 700; margin-bottom: 8px; font-size: ${place.customName ? '14px' : '16px'}; color: #111827; line-height: 1.4;">
        ${escapeHtml(place.name)}
      </div>

      ${labelsHtml}

      <div style="color: #374151; font-size: 12px; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
        <span style="color: #9CA3AF;">📍</span>
        ${getCategoryLabel(effectiveCategory)}
      </div>
      <div style="color: #6B7280; font-size: 12px; margin-bottom: 8px; line-height: 1.5;">
        ${escapeHtml(place.address)}
      </div>
      ${place.visited ? '<div style="color: #059669; font-size: 12px; margin-bottom: 8px; font-weight: 500;">✓ 방문 완료</div>' : ''}
      <button
        onclick="window.location.href='/places/${place.id}'"
        style="width: 100%; padding: 12px; background: #4A90E2; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; margin-top: 12px; transition: background 0.2s;"
        onmouseover="this.style.background='#2E5C8A'"
        onmouseout="this.style.background='#4A90E2'"
      >
        상세 보기
      </button>
    </div>
  `;
}
