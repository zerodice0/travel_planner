// Public Place Types (accessible without authentication)

export interface LabelCount {
  label: string;
  count: number;
}

export interface PublicPlace {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  description?: string;
  photos: string[];
  reviewCount: number;
  topLabels: LabelCount[];
  externalId?: string;
  externalUrl?: string;
  createdAt: string;
}

export interface PublicPlaceDetail extends PublicPlace {
  externalUrl?: string;
  externalId?: string;
  updatedAt: string;
}

export interface PublicPlacesResponse {
  places: PublicPlace[];
  total: number;
}

export interface PublicPlaceQuery {
  category?: string;
  limit?: number;
  offset?: number;
  sort?: string;
}

export interface ViewportQuery {
  neLat: number;
  neLng: number;
  swLat: number;
  swLng: number;
  category?: string;
}

export interface NearestPlaceQuery {
  lat: number;
  lng: number;
  category?: string;
  limit?: number;
}

export interface NearestPlace extends PublicPlace {
  distance: number; // km 단위
}

export interface CreatePublicPlaceData {
  name: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  category: string;
  description?: string;
  externalUrl?: string;
  externalId?: string;
}
