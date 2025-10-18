export interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  description?: string;
  visited: boolean;
  externalUrl?: string;
  externalId?: string;
  createdAt: string;
}

export interface PlaceDetail extends Place {
  customName?: string;
  customCategory?: string;
  labels: string[];
  note?: string;
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
  customName?: string;
  customCategory?: string;
  labels?: string[];
  note?: string;
  description?: string;
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
  customName?: string;
  customCategory?: string;
  labels?: string[];
  note?: string;
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
