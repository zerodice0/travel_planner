import ky from 'ky';
import type { DashboardStats } from '#types/dashboard';
import type {
  ListsResponse,
  List,
  CreateListData,
  UpdateListData,
  ListPlacesResponse,
  PlaceOrder,
  OptimizedRoute
} from '#types/list';
import type {
  PlacesResponse,
  PlaceDetail,
  CreatePlaceData,
  UpdatePlaceData,
  PlaceListSummary
} from '#types/place';
import type { SearchResults, SearchFilters } from '#types/search';
import type { CategoriesResponse, Category, CreateCategoryData, UpdateCategoryData } from '#types/category';

const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
  retry: 2,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
  },
});

export default api;

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    return api.get('dashboard/stats').json<DashboardStats>();
  },
};

// Lists API
export const listsApi = {
  getAll: async (params?: {
    limit?: number;
    sort?: string;
  }): Promise<ListsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sort) searchParams.append('sort', params.sort);

    return api.get('lists', { searchParams }).json<ListsResponse>();
  },

  getOne: async (listId: string): Promise<List> => {
    return api.get(`lists/${listId}`).json<List>();
  },

  create: async (data: CreateListData): Promise<List> => {
    return api.post('lists', { json: data }).json<List>();
  },

  update: async (listId: string, data: UpdateListData): Promise<List> => {
    return api.put(`lists/${listId}`, { json: data }).json<List>();
  },

  delete: async (listId: string): Promise<void> => {
    await api.delete(`lists/${listId}`);
  },

  getPlaces: async (listId: string, sort?: string): Promise<ListPlacesResponse> => {
    const searchParams = new URLSearchParams();
    if (sort) searchParams.append('sort', sort);
    return api.get(`lists/${listId}/places`, { searchParams }).json<ListPlacesResponse>();
  },

  addPlaces: async (listId: string, placeIds: string[]): Promise<{ added: number }> => {
    return api.post(`lists/${listId}/places`, { json: { placeIds } }).json<{ added: number }>();
  },

  removePlace: async (listId: string, placeId: string): Promise<void> => {
    await api.delete(`lists/${listId}/places/${placeId}`);
  },

  reorderPlaces: async (listId: string, order: PlaceOrder[]): Promise<{ updated: number }> => {
    return api.patch(`lists/${listId}/places/reorder`, { json: { order } }).json<{ updated: number }>();
  },

  optimizeRoute: async (
    listId: string,
    startLocation: { latitude: number; longitude: number },
    includeVisited: boolean
  ): Promise<OptimizedRoute> => {
    return api.post(`lists/${listId}/optimize-route`, {
      json: { startLocation, includeVisited }
    }).json<OptimizedRoute>();
  },
};

// Places API
export const placesApi = {
  getAll: async (params?: {
    limit?: number;
    sort?: string;
  }): Promise<PlacesResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sort) searchParams.append('sort', params.sort);

    return api.get('places', { searchParams }).json<PlacesResponse>();
  },

  getOne: async (placeId: string): Promise<PlaceDetail> => {
    return api.get(`places/${placeId}`).json<PlaceDetail>();
  },

  create: async (data: CreatePlaceData): Promise<PlaceDetail> => {
    return api.post('places', { json: data }).json<PlaceDetail>();
  },

  update: async (placeId: string, data: UpdatePlaceData): Promise<PlaceDetail> => {
    return api.patch(`places/${placeId}`, { json: data }).json<PlaceDetail>();
  },

  delete: async (placeId: string): Promise<void> => {
    await api.delete(`places/${placeId}`);
  },

  getLists: async (placeId: string): Promise<{ lists: PlaceListSummary[] }> => {
    return api.get(`places/${placeId}/lists`).json<{ lists: PlaceListSummary[] }>();
  },

  addToList: async (placeId: string, listId: string): Promise<void> => {
    await api.post(`places/${placeId}/lists`, { json: { listId } });
  },

  removeFromList: async (placeId: string, listId: string): Promise<void> => {
    await api.delete(`places/${placeId}/lists/${listId}`);
  },

  toggleVisit: async (placeId: string) => {
    return api.patch(`places/${placeId}/visit`).json();
  },
};

// Search API
export const searchApi = {
  search: async (keyword: string, filters?: SearchFilters): Promise<SearchResults> => {
    const searchParams = new URLSearchParams({ q: keyword });

    if (filters?.type) searchParams.append('type', filters.type);
    if (filters?.category) searchParams.append('category', filters.category);
    if (filters?.visited !== undefined) searchParams.append('visited', String(filters.visited));

    return api.get('search', { searchParams }).json<SearchResults>();
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<CategoriesResponse> => {
    return api.get('categories').json<CategoriesResponse>();
  },

  create: async (data: CreateCategoryData): Promise<Category> => {
    return api.post('categories', { json: data }).json<Category>();
  },

  update: async (id: string, data: UpdateCategoryData): Promise<Category> => {
    return api.put(`categories/${id}`, { json: data }).json<Category>();
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`categories/${id}`);
  },
};

// Users API
export interface User {
  id: string;
  email: string;
  nickname: string;
  profileImage?: string;
}

export interface UpdateProfileData {
  nickname?: string;
  profileImage?: string;
}

export const usersApi = {
  getMe: async (): Promise<User> => {
    return api.get('users/me').json<User>();
  },

  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    return api.patch('users/me', { json: data }).json<User>();
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('users/account');
  },
};

// Upload API
export interface UploadedImages {
  thumbnail: string;
  medium: string;
  original: string;
}

export const uploadApi = {
  uploadProfileImage: async (file: File): Promise<{ message: string; images: UploadedImages }> => {
    const formData = new FormData();
    formData.append('image', file);

    return api.post('upload/profile-image', { body: formData }).json();
  },
};
