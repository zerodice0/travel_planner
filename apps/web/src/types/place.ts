export interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  visited: boolean;
  externalUrl?: string;
  externalId?: string;
  createdAt: string;
}

export interface PlaceDetail extends Place {
  customCategory?: string;
  labels: string[];
  visitedAt?: string;
  visitNote?: string;
  rating?: number;
  estimatedCost?: number;
  photos: string[];
  updatedAt: string;
}

export interface PlacesResponse {
  places: Place[];
}

export interface CreatePlaceData {
  name: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  category: string;
  customCategory?: string;
  labels?: string[];
  visited?: boolean;
  externalUrl?: string;
  externalId?: string;
}

export interface UpdatePlaceData {
  name?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  customCategory?: string;
  labels?: string[];
  visited?: boolean;
  visitedAt?: string;
  visitNote?: string;
  rating?: number;
  estimatedCost?: number;
  photos?: string[];
}

export interface PlaceListSummary {
  id: string;
  name: string;
  iconType: string;
  iconValue: string;
}

export interface KakaoPlace {
  id: string;
  place_name: string;
  address_name: string;
  category_name: string;
  phone: string;
  x: string;
  y: string;
  place_url: string;
}
