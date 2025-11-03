import ky, { HTTPError } from 'ky';
import type { DashboardStats } from '#types/dashboard';
import type { ActivitiesResponse } from '#types/activity';
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
import type { Review, ReviewsResponse, CreateReviewData, UpdateReviewData } from '#types/review';
import type {
  PublicPlaceDetail,
  PublicPlacesResponse,
  PublicPlaceQuery,
  ViewportQuery,
  NearestPlaceQuery,
  NearestPlace,
  CreatePublicPlaceData,
} from '#types/publicPlace';
import type { Notification, UnreadCountResponse } from '#types/notification';

// Event system for email verification required
export const emailVerificationRequiredEvent = new EventTarget();

// Event system for token expiration (401 Unauthorized)
export const tokenExpiredEvent = new EventTarget();

// Flag to prevent duplicate token expiration events
let isTokenExpired = false;

// Function to reset token expiration flag (called on login)
export function resetTokenExpiredFlag() {
  isTokenExpired = false;
}

// Refresh token management
let isRefreshing = false;
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

// Function to refresh access token
async function refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  // Start refreshing
  isRefreshing = true;
  refreshPromise = ky
    .post('auth/refresh', {
      prefixUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
      json: { refreshToken },
      timeout: 10000,
    })
    .json<{ accessToken: string; refreshToken: string; user: unknown }>()
    .then((result) => {
      // Update tokens
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);

      // Reset token expiration flag
      resetTokenExpiredFlag();

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    })
    .catch((error) => {
      // Clear tokens on refresh failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw error;
    })
    .finally(() => {
      // Reset refreshing state
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

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
    afterResponse: [
      async (request, _options, response) => {
        // 401 Unauthorized 에러 감지 (토큰 만료/유효하지 않음)
        if (response.status === 401) {
          const url = request.url;

          // 인증 엔드포인트는 자동 갱신 제외
          const isAuthEndpoint =
            url.includes('/auth/login') ||
            url.includes('/auth/signup') ||
            url.includes('/auth/refresh');

          if (!isAuthEndpoint) {
            const refreshToken = localStorage.getItem('refreshToken');

            // Refresh Token이 있으면 자동 갱신 시도
            if (refreshToken && !isTokenExpired) {
              try {
                // 토큰 갱신
                await refreshAccessToken();

                // 원래 요청 재시도 (새로운 토큰으로)
                const newToken = localStorage.getItem('accessToken');
                if (newToken) {
                  // Clone the request and update the Authorization header
                  const retryRequest = new Request(request, {
                    headers: {
                      ...Object.fromEntries(request.headers.entries()),
                      Authorization: `Bearer ${newToken}`,
                    },
                  });

                  // Retry the original request with new token
                  return ky(retryRequest);
                }
              } catch (error) {
                // 토큰 갱신 실패 → 로그아웃 처리
                console.error('Token refresh failed:', error);

                if (!isTokenExpired) {
                  isTokenExpired = true;
                  tokenExpiredEvent.dispatchEvent(new Event('expired'));
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('refreshToken');
                }
              }
            } else if (!isTokenExpired) {
              // Refresh Token 없음 → 로그아웃
              isTokenExpired = true;
              tokenExpiredEvent.dispatchEvent(new Event('expired'));
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          }
        }

        // 403 Forbidden 에러 감지 (이메일 미인증)
        if (response.status === 403) {
          try {
            const errorData = await response.clone().json();
            // NestJS는 Exception 객체를 message 필드에 넣을 수도 있으므로 양쪽 다 체크
            const requiresVerification =
              errorData.requiresEmailVerification ||
              errorData.message?.requiresEmailVerification;

            if (requiresVerification) {
              // 이메일 인증 필요 이벤트 발생
              emailVerificationRequiredEvent.dispatchEvent(new Event('required'));
            }
          } catch {
            // JSON 파싱 실패 시 무시
          }
        }
        return response;
      },
    ],
  },
});

// Public API (no authentication required) with enhanced rate limit handling
const publicApi = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
  retry: {
    limit: 2,
    methods: ['get', 'post', 'put', 'patch', 'delete'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    // Custom backoff function for rate limiting
    backoffLimit: 5000, // Max 5 seconds
  },
  hooks: {
    beforeRetry: [
      async ({ error, retryCount }) => {
        // For 429 (Too Many Requests), use exponential backoff
        if (error instanceof HTTPError && error.response?.status === 429) {
          // Exponential backoff: 1s, 2s, 4s...
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
          console.log(`Rate limited, retrying after ${delay}ms (attempt ${retryCount + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
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

  getActivities: async (limit = 10): Promise<ActivitiesResponse> => {
    const searchParams = new URLSearchParams();
    searchParams.append('limit', limit.toString());
    return api.get('dashboard/activities', { searchParams }).json<ActivitiesResponse>();
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

// Reviews API
export const reviewsApi = {
  create: async (userPlaceId: string, data: CreateReviewData): Promise<Review> => {
    return api.post(`reviews/user-places/${userPlaceId}`, { json: data }).json<Review>();
  },

  getMyReviews: async (): Promise<ReviewsResponse> => {
    return api.get('reviews/my-reviews').json<ReviewsResponse>();
  },

  getByPlace: async (placeId: string): Promise<ReviewsResponse> => {
    return api.get(`places/${placeId}/reviews`).json<ReviewsResponse>();
  },

  update: async (reviewId: string, data: UpdateReviewData): Promise<Review> => {
    return api.patch(`reviews/${reviewId}`, { json: data }).json<Review>();
  },

  delete: async (reviewId: string): Promise<void> => {
    await api.delete(`reviews/${reviewId}`);
  },

  toggleVisibility: async (reviewId: string): Promise<Review> => {
    return api.patch(`reviews/${reviewId}/visibility`).json<Review>();
  },
};

// Users API
export interface User {
  id: string;
  email: string;
  nickname: string;
  profileImage?: string;
  emailVerified: boolean;
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

// Public Places API (no authentication required for GET, authentication required for POST)
export const publicPlacesApi = {
  getAll: async (params?: PublicPlaceQuery): Promise<PublicPlacesResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.sort) searchParams.append('sort', params.sort);

    return publicApi.get('public/places', { searchParams }).json<PublicPlacesResponse>();
  },

  /**
   * Search public places using FTS5
   * @param keyword - Search keyword
   * @param category - Optional category filter
   * @param limit - Max results (default: 20)
   * @param offset - Pagination offset (default: 0)
   * @returns Array of public places matching search criteria
   */
  search: async (params: {
    keyword: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<PublicPlacesResponse> => {
    const searchParams = new URLSearchParams({
      keyword: params.keyword,
    });

    if (params.category) searchParams.append('category', params.category);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    return publicApi.get('public/places', { searchParams }).json<PublicPlacesResponse>();
  },

  getByViewport: async (params: ViewportQuery): Promise<PublicPlacesResponse> => {
    const searchParams = new URLSearchParams({
      neLat: params.neLat.toString(),
      neLng: params.neLng.toString(),
      swLat: params.swLat.toString(),
      swLng: params.swLng.toString(),
    });
    if (params.category) searchParams.append('category', params.category);

    return publicApi.get('public/places/viewport', { searchParams }).json<PublicPlacesResponse>();
  },

  getNearest: async (params: NearestPlaceQuery): Promise<{ places: NearestPlace[]; total: number }> => {
    const searchParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
    });
    if (params.category) searchParams.append('category', params.category);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return publicApi.get('public/places/nearest', { searchParams }).json<{ places: NearestPlace[]; total: number }>();
  },

  getOne: async (placeId: string): Promise<PublicPlaceDetail> => {
    return publicApi.get(`public/places/${placeId}`).json<PublicPlaceDetail>();
  },

  create: async (data: CreatePublicPlaceData): Promise<PublicPlaceDetail> => {
    return api.post('public/places', { json: data }).json<PublicPlaceDetail>();
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async (params?: { limit?: number; offset?: number }): Promise<Notification[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    return api.get('notifications', { searchParams }).json<Notification[]>();
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    return api.get('notifications/unread-count').json<UnreadCountResponse>();
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    return api.patch(`notifications/${notificationId}/read`).json<Notification>();
  },

  markAllAsRead: async (): Promise<{ count: number }> => {
    return api.patch('notifications/read-all').json<{ count: number }>();
  },

  delete: async (notificationId: string): Promise<void> => {
    return api.delete(`notifications/${notificationId}`).json<void>();
  },
};
