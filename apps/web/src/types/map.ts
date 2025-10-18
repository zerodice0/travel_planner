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
  description?: string;
  url?: string;
  isLocal?: boolean; // 내 장소
  isPublic?: boolean; // 공개 장소
}

export interface MarkerPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  category: string;
  phone?: string;
  description?: string;
}

export interface BaseMarkerManager {
  addMarker(place: MarkerPlace, onClick?: (place: MarkerPlace) => void): void | Promise<void>;
  removeMarker(placeId: string): void;
  clearMarkers(): void;
  updateMarker(place: MarkerPlace): void | Promise<void>;
  panTo(latitude: number, longitude: number): void;
  setLevel(level: number): void;
  setZoom(zoom: number): void;
  closeAllInfoWindows(): void;
  showInfoWindow(placeId: string): void;
}

export interface MapHookResult {
  map: google.maps.Map | kakao.maps.Map | null;
  isLoaded: boolean;
  error: string | null;
}

export interface SearchHookResult {
  search: (keyword: string) => Promise<SearchResult[]>;
  isSearching: boolean;
  error: string | null;
}
