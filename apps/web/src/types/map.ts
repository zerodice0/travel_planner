export type MapProvider = 'kakao' | 'google';

export interface MapOptions {
  center: { lat: number; lng: number };
  level?: number;
}

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  category: string;
  phone?: string;
  latitude: number;
  longitude: number;
  url?: string;
}

export interface BaseMarkerManager {
  addMarker(place: any, onClick?: (place: any) => void): void | Promise<void>;
  removeMarker(placeId: string): void;
  clearMarkers(): void;
  updateMarker(place: any): void | Promise<void>;
  panTo(latitude: number, longitude: number): void;
  setLevel(level: number): void;
  closeAllInfoWindows(): void;
  showInfoWindow(placeId: string): void;
}

export interface MapHookResult {
  map: any;
  isLoaded: boolean;
  error: string | null;
}

export interface SearchHookResult {
  search: (keyword: string) => Promise<SearchResult[]>;
  isSearching: boolean;
  error: string | null;
}
