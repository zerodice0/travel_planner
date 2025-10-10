import type { Place } from '#types/place';
import type { BaseMarkerManager } from '#types/map';
import { createMarkerDataURL } from './categoryIcons';

export class GoogleMarkerManager implements BaseMarkerManager {
  private markers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();
  private infoWindows: Map<string, google.maps.InfoWindow> = new Map();
  private places: Map<string, Place> = new Map();
  private map: google.maps.Map;

  constructor(map: google.maps.Map) {
    this.map = map;
  }

  async addMarker(place: Place, onClick?: (place: Place) => void): Promise<void> {
    if (!google || !google.maps || !this.map) return;

    // Import the marker library
    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;

    // Create custom icon element using category-based SVG
    const iconUrl = createMarkerDataURL(place.category, place.visited);
    const iconElement = document.createElement('img');
    iconElement.src = iconUrl;
    iconElement.style.width = '40px';
    iconElement.style.height = '50px';
    iconElement.style.cursor = 'pointer';

    const marker = new AdvancedMarkerElement({
      position: {
        lat: place.latitude,
        lng: place.longitude,
      },
      map: this.map,
      title: place.name,
      content: iconElement,
    });

    this.markers.set(place.id, marker);
    this.places.set(place.id, place);

    const infoWindow = new google.maps.InfoWindow({
      content: this.getInfoWindowContent(place),
      pixelOffset: new google.maps.Size(0, -30),
      headerDisabled: true,
    });

    this.infoWindows.set(place.id, infoWindow);

    marker.addListener('click', () => {
      // Move map to marker location
      this.panTo(place.latitude, place.longitude);

      // Show InfoWindow
      this.closeAllInfoWindows();
      infoWindow.open({
        anchor: marker,
        map: this.map,
      });

      if (onClick) {
        onClick(place);
      }
    });
  }

  removeMarker(placeId: string): void {
    const marker = this.markers.get(placeId);
    if (marker) {
      marker.map = null;
      this.markers.delete(placeId);
    }

    const infoWindow = this.infoWindows.get(placeId);
    if (infoWindow) {
      infoWindow.close();
      this.infoWindows.delete(placeId);
    }

    this.places.delete(placeId);
  }

  clearMarkers(): void {
    this.markers.forEach((marker) => (marker.map = null));
    this.markers.clear();
    this.closeAllInfoWindows();
    this.infoWindows.clear();
    this.places.clear();
  }

  async updateMarker(place: Place): Promise<void> {
    this.removeMarker(place.id);
    await this.addMarker(place);
  }

  closeAllInfoWindows(): void {
    this.infoWindows.forEach((infoWindow) => infoWindow.close());
  }

  panTo(latitude: number, longitude: number): void {
    if (!this.map) return;
    this.map.panTo({ lat: latitude, lng: longitude });
  }

  setLevel(level: number): void {
    if (!this.map) return;
    // Google Maps uses zoom instead of level
    // Convert Kakao level to Google zoom (inverse relationship)
    const zoom = 21 - level;
    this.map.setZoom(Math.max(1, Math.min(21, zoom)));
  }


  private getInfoWindowContent(place: Place): string {
    return `
      <div style="padding: 12px; min-width: 220px;">
        <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">
          ${this.escapeHtml(place.name)}
        </div>
        <div style="color: #666; font-size: 12px; margin-bottom: 4px;">
          ${this.getCategoryLabel(place.category)}
        </div>
        <div style="color: #666; font-size: 12px; margin-bottom: 8px;">
          ${this.escapeHtml(place.address)}
        </div>
        ${place.visited ? '<div style="color: #10B981; font-size: 12px; margin-bottom: 8px;">✓ 방문 완료</div>' : ''}
        <button
          onclick="window.location.href='/places/${place.id}'"
          style="width: 100%; padding: 8px; background: #4A90E2; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;"
          onmouseover="this.style.background='#2E5C8A'"
          onmouseout="this.style.background='#4A90E2'"
        >
          상세 보기
        </button>
      </div>
    `;
  }

  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      restaurant: '맛집',
      cafe: '카페',
      tourist_attraction: '관광',
      shopping: '쇼핑',
      culture: '문화',
      nature: '자연',
      accommodation: '숙박',
      etc: '기타',
    };
    return labels[category] || category;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m] || m);
  }

  showInfoWindow(placeId: string): void {
    const place = this.places.get(placeId);
    const marker = this.markers.get(placeId);
    const infoWindow = this.infoWindows.get(placeId);

    if (!place || !marker || !infoWindow) return;

    // Move map to marker location
    this.panTo(place.latitude, place.longitude);

    // Close all other InfoWindows and open this one
    this.closeAllInfoWindows();
    infoWindow.open({
      anchor: marker,
      map: this.map,
    });
  }
}
