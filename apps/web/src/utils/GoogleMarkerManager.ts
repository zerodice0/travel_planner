import type { Place } from '#types/place';
import type { BaseMarkerManager } from '#types/map';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import { createMarkerDataURL } from './categoryIcons';
import { GOOGLE_ZOOM, convertKakaoLevelToGoogleZoom } from '#constants/map';
import { createPlaceInfoWindowContent } from './infoWindowUtils';

export class GoogleMarkerManager implements BaseMarkerManager {
  private markers: Map<string, google.maps.Marker> = new Map();
  private infoWindows: Map<string, google.maps.InfoWindow> = new Map();
  private places: Map<string, Place> = new Map();
  private map: google.maps.Map;
  private clusterer: MarkerClusterer | null = null;
  private polyline: google.maps.Polyline | null = null;

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

    // Create category-based icon
    const effectiveCategory = place.customCategory || place.category;
    const iconUrl = createMarkerDataURL(effectiveCategory, place.visited);

    // Display label (customName or first label)
    const displayLabel = place.customName || place.labels?.[0];

    const marker = new google.maps.Marker({
      position: {
        lat: place.latitude,
        lng: place.longitude,
      },
      map: null, // Clusterer will manage map assignment
      title: place.customName || place.name,
      icon: {
        url: iconUrl,
        scaledSize: new google.maps.Size(40, 50),
        anchor: new google.maps.Point(20, 50), // Center bottom of icon
        labelOrigin: new google.maps.Point(20, 60), // Position label below icon
      },
      label: displayLabel ? {
        text: displayLabel,
        color: '#1F2937',
        fontSize: '13px',
        fontWeight: '600',
        className: 'custom-marker-label',
      } : undefined,
    });

    // Add marker to clusterer
    this.clusterer?.addMarker(marker);

    this.markers.set(place.id, marker);
    this.places.set(place.id, place);

    // Create info window with place details (label now shown on marker)
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
      marker.setMap(null);
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

    this.markers.forEach((marker) => marker.setMap(null));
    this.markers.clear();
    this.closeAllInfoWindows();
    this.infoWindows.clear();
    this.places.clear();

    // Clear polyline as well
    this.clearPolyline();
  }

  async updateMarker(place: Place): Promise<void> {
    this.removeMarker(place.id);
    await this.addMarker(place);
  }

  /**
   * Update marker label without recreating the marker
   * Updates both the visible label on the marker and the tooltip
   */
  updateMarkerLabel(placeId: string, newLabel?: string): void {
    const marker = this.markers.get(placeId);
    if (!marker) return;

    // Update marker label (visible below icon)
    if (newLabel) {
      marker.setLabel({
        text: newLabel,
        color: '#1F2937',
        fontSize: '13px',
        fontWeight: '600',
        className: 'custom-marker-label',
      });
      marker.setTitle(newLabel); // Also update tooltip
    } else {
      marker.setLabel(null); // Remove label if undefined
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

  /**
   * Render polyline connecting places in order
   * @param places - Array of places to connect with straight lines
   */
  renderPolyline(places: Place[]): void {
    if (!this.map || places.length < 2) {
      this.clearPolyline();
      return;
    }

    // Clear existing polyline
    this.clearPolyline();

    // Create path from places
    const path = places.map((place) => ({
      lat: place.latitude,
      lng: place.longitude,
    }));

    // Create polyline with straight lines
    this.polyline = new google.maps.Polyline({
      path,
      geodesic: false, // Straight lines, not curved along earth's surface
      strokeColor: '#3B82F6', // Primary blue color
      strokeOpacity: 0.7,
      strokeWeight: 3,
      map: this.map,
    });
  }

  /**
   * Clear polyline from map
   */
  clearPolyline(): void {
    if (this.polyline) {
      this.polyline.setMap(null);
      this.polyline = null;
    }
  }
}
