export interface List {
  id: string;
  name: string;
  description: string | null;
  iconType: string;
  iconValue: string;
  colorTheme: string | null;
  placesCount: number;
  visitedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListsResponse {
  lists: List[];
}

export interface CreateListData {
  name: string;
  description?: string;
  icon: {
    type: 'emoji' | 'image';
    value: string;
  };
  colorTheme?: string;
}

export interface UpdateListData {
  name?: string;
  description?: string;
  icon?: {
    type: 'emoji' | 'image';
    value: string;
  };
  colorTheme?: string;
}

export interface ListPlaceItem {
  id: string;
  name: string;
  address: string;
  category: string;
  visited: boolean;
  latitude: number;
  longitude: number;
  order: number;
}

export interface ListPlacesResponse {
  places: ListPlaceItem[];
}

export interface PlaceOrder {
  placeId: string;
  order: number;
}

export interface OptimizedRoute {
  optimizedOrder: Array<{
    placeId: string;
    order: number;
    distance: number;
  }>;
  totalDistance: number;
  estimatedTime: number;
}
