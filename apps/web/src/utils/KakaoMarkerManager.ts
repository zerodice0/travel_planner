import type { Place } from '#types/place';
import type { BaseMarkerManager } from '#types/map';
import { createMarkerDataURL } from './categoryIcons';

export class KakaoMarkerManager implements BaseMarkerManager {
  private markers: Map<string, kakao.maps.Marker> = new Map();
  private infowindows: Map<string, kakao.maps.InfoWindow> = new Map();
  private places: Map<string, Place> = new Map();
  private map: kakao.maps.Map;

  constructor(map: kakao.maps.Map) {
    this.map = map;
  }

  addMarker(place: Place, onClick?: (place: Place) => void): void {
    if (!window.kakao || !this.map) return;

    const position = new window.kakao.maps.LatLng(place.latitude, place.longitude);

    const marker = new window.kakao.maps.Marker({
      position,
      image: this.getMarkerImage(place.visited, place.category),
    });

    marker.setMap(this.map);
    this.markers.set(place.id, marker);
    this.places.set(place.id, place);

    // Create InfoWindow
    const infowindow = new window.kakao.maps.InfoWindow({
      content: this.getInfoWindowContent(place),
    });

    this.infowindows.set(place.id, infowindow);

    // Add click event
    window.kakao.maps.event.addListener(marker, 'click', () => {
      // Move map to marker location
      this.panTo(place.latitude, place.longitude);

      // Show InfoWindow
      this.closeAllInfoWindows();
      infowindow.open(this.map, marker);

      if (onClick) {
        onClick(place);
      }
    });
  }

  removeMarker(placeId: string): void {
    const marker = this.markers.get(placeId);
    if (marker) {
      marker.setMap(null);
      this.markers.delete(placeId);
    }

    const infowindow = this.infowindows.get(placeId);
    if (infowindow) {
      infowindow.close();
      this.infowindows.delete(placeId);
    }

    this.places.delete(placeId);
  }

  clearMarkers(): void {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers.clear();
    this.closeAllInfoWindows();
    this.infowindows.clear();
    this.places.clear();
  }

  updateMarker(place: Place): void {
    this.removeMarker(place.id);
    this.addMarker(place);
  }

  filterMarkers(selectedCategories: string[]): void {
    this.markers.forEach((marker, placeId) => {
      const place = Array.from(this.markers.keys()).find((id) => id === placeId);
      if (place && selectedCategories.length > 0) {
        // This is a simplified version - you'd need to track place data
        marker.setVisible(true);
      }
    });
  }

  closeAllInfoWindows(): void {
    this.infowindows.forEach((infowindow) => infowindow.close());
  }

  panTo(latitude: number, longitude: number): void {
    if (!this.map) return;
    const position = new window.kakao.maps.LatLng(latitude, longitude);
    this.map.panTo(position);
  }

  setLevel(level: number): void {
    if (!this.map) return;
    this.map.setLevel(level);
  }

  private getMarkerImage(visited: boolean, category: string): kakao.maps.MarkerImage {
    // Use category-based custom SVG markers
    const imageSrc = createMarkerDataURL(category, visited);
    const imageSize = new window.kakao.maps.Size(40, 50);
    const imageOption = { offset: new window.kakao.maps.Point(20, 50) };

    return new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
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
    const infowindow = this.infowindows.get(placeId);

    if (!place || !marker || !infowindow) return;

    // Move map to marker location
    this.panTo(place.latitude, place.longitude);

    // Close all other InfoWindows and open this one
    this.closeAllInfoWindows();
    infowindow.open(this.map, marker);
  }
}
