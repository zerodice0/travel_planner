import type { Place } from '#types/place';
import type { BaseMarkerManager } from '#types/map';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import { createMarkerDataURL } from './categoryIcons';
import { GOOGLE_ZOOM, convertKakaoLevelToGoogleZoom } from '#constants/map';
import { createPlaceInfoWindowContent } from './infoWindowUtils';

export class GoogleMarkerManager implements BaseMarkerManager {
  private markers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();
  private infoWindows: Map<string, google.maps.InfoWindow> = new Map();
  private places: Map<string, Place> = new Map();
  private map: google.maps.Map;
  private clusterer: MarkerClusterer | null = null;

  constructor(map: google.maps.Map) {
    this.map = map;
    // Initialize marker clusterer with SuperCluster algorithm
    this.clusterer = new MarkerClusterer({
      map,
      markers: [],
      algorithm: new SuperClusterAlgorithm({ radius: 100 }),
    });
  }

  async addMarker(place: Place, onClick?: (place: Place) => void): Promise<void> {
    if (!google || !google.maps || !this.map) return;

    // Import the marker library
    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;

    // Create custom marker content with label and pin
    const markerContainer = document.createElement('div');
    markerContainer.className = 'custom-marker-container';
    markerContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center;';

    // Display label (customName or first label)
    const displayLabel = place.customName || place.labels?.[0];
    if (displayLabel) {
      const labelContainer = document.createElement('div');
      labelContainer.className = 'custom-marker-label';
      labelContainer.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 6px 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        margin-bottom: 6px;
        width: fit-content;
        max-width: 180px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;

      const labelText = document.createElement('span');
      labelText.className = 'custom-marker-name';
      labelText.style.cssText = `
        font-size: 13px;
        font-weight: 600;
        color: #1F2937;
      `;
      labelText.textContent = displayLabel;
      labelText.title = displayLabel; // Tooltip for long names

      labelContainer.appendChild(labelText);
      markerContainer.appendChild(labelContainer);
    }

    // Create pin icon (category-based SVG)
    const effectiveCategory = place.customCategory || place.category;
    const iconUrl = createMarkerDataURL(effectiveCategory, place.visited);
    const iconElement = document.createElement('img');
    iconElement.src = iconUrl;
    iconElement.style.width = '40px';
    iconElement.style.height = '50px';
    iconElement.style.cursor = 'pointer';

    markerContainer.appendChild(iconElement);

    const marker = new AdvancedMarkerElement({
      position: {
        lat: place.latitude,
        lng: place.longitude,
      },
      map: null,  // Clusterer will manage map assignment
      title: place.customName || place.name,
      content: markerContainer,
    });

    // Add marker to clusterer
    this.clusterer?.addMarker(marker);

    this.markers.set(place.id, marker);
    this.places.set(place.id, place);

    const infoWindow = new google.maps.InfoWindow({
      content: createPlaceInfoWindowContent(place),
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
    // Clear clusterer first
    this.clusterer?.clearMarkers();

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

  /**
   * Update marker label without recreating the marker
   * This provides smooth transition without flickering
   */
  updateMarkerLabel(placeId: string, newLabel?: string): void {
    const marker = this.markers.get(placeId);
    if (!marker || !marker.content) return;

    const markerContainer = marker.content as HTMLElement;
    const labelContainer = markerContainer.querySelector('.custom-marker-label') as HTMLElement;

    if (newLabel) {
      // Update existing label or create new one
      if (labelContainer) {
        const labelText = labelContainer.querySelector('.custom-marker-name');
        if (labelText) {
          labelText.textContent = newLabel;
          (labelText as HTMLElement).title = newLabel;
        }
      } else {
        // Create new label container
        const newLabelContainer = document.createElement('div');
        newLabelContainer.className = 'custom-marker-label';
        newLabelContainer.style.cssText = `
          background: white;
          border-radius: 8px;
          padding: 6px 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          margin-bottom: 6px;
          width: fit-content;
          max-width: 180px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `;

        const labelText = document.createElement('span');
        labelText.className = 'custom-marker-name';
        labelText.style.cssText = `
          font-size: 13px;
          font-weight: 600;
          color: #1F2937;
        `;
        labelText.textContent = newLabel;
        labelText.title = newLabel;

        newLabelContainer.appendChild(labelText);
        markerContainer.insertBefore(newLabelContainer, markerContainer.firstChild);
      }
    } else {
      // Remove label if newLabel is undefined
      if (labelContainer) {
        labelContainer.remove();
      }
    }
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
    const zoom = convertKakaoLevelToGoogleZoom(level);
    this.map.setZoom(zoom);
  }

  setZoom(zoom: number): void {
    if (!this.map) return;
    // Directly set Google Maps zoom level (1-21)
    const clampedZoom = Math.max(GOOGLE_ZOOM.MIN, Math.min(GOOGLE_ZOOM.MAX, zoom));
    this.map.setZoom(clampedZoom);
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
