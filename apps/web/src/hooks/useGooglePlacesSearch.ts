import { useState, useCallback } from 'react';
import type { SearchResult } from '#types/map';

// Cache configuration
const CACHE_KEY_PREFIX = 'google_search_cache_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

interface CachedSearch {
  results: SearchResult[];
  timestamp: number;
}

export function useGooglePlacesSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get cached search results
  const getCachedResults = useCallback((keyword: string): SearchResult[] | null => {
    try {
      const cacheKey = CACHE_KEY_PREFIX + keyword.toLowerCase().trim();
      const cached = sessionStorage.getItem(cacheKey);

      if (!cached) return null;

      const cachedData: CachedSearch = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - cachedData.timestamp > CACHE_TTL) {
        sessionStorage.removeItem(cacheKey);
        return null;
      }

      return cachedData.results;
    } catch {
      return null;
    }
  }, []);

  // Save search results to cache
  const setCachedResults = useCallback((keyword: string, results: SearchResult[]) => {
    try {
      const cacheKey = CACHE_KEY_PREFIX + keyword.toLowerCase().trim();
      const cacheData: CachedSearch = {
        results,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (err) {
      // Ignore cache errors (e.g., quota exceeded)
      console.warn('Failed to cache search results:', err);
    }
  }, []);

  const search = useCallback(async (keyword: string): Promise<SearchResult[]> => {
    if (!keyword.trim()) {
      return [];
    }

    // Check cache first
    const cachedResults = getCachedResults(keyword);
    if (cachedResults) {
      console.log('Using cached search results for:', keyword);
      return cachedResults;
    }

    if (typeof google === 'undefined' || !google.maps) {
      setError('Google Maps SDK is not loaded');
      return [];
    }

    setIsSearching(true);
    setError(null);

    try {
      // Import Places library
      const { Place } = (await google.maps.importLibrary(
        'places'
      )) as google.maps.PlacesLibrary;

      // Use new Place.searchByText() API
      const request = {
        textQuery: keyword,
        fields: ['displayName', 'formattedAddress', 'location', 'types', 'id', 'editorialSummary'],
        language: 'ko',
        maxResultCount: 10, // Reduced from 20 to 10
      };

      const { places } = await Place.searchByText(request);

      setIsSearching(false);

      if (!places || places.length === 0) {
        return [];
      }

      // Map new Place API response to SearchResult format
      const searchResults = places.map((place) => ({
        id: place.id,
        name: place.displayName || '',
        address: place.formattedAddress || '',
        category: mapGoogleCategory(place.types || []),
        latitude: place.location?.lat() ?? 0,
        longitude: place.location?.lng() ?? 0,
        description: place.editorialSummary || undefined,
        url: `https://maps.google.com/?q=place_id:${place.id}`,
      }));

      // Cache the results
      setCachedResults(keyword, searchResults);

      return searchResults;
    } catch (error) {
      setIsSearching(false);
      setError('검색 중 오류가 발생했습니다');
      console.error('Google Places search error:', error);
      return [];
    }
  }, [getCachedResults, setCachedResults]);

  return { search, isSearching, error };
}

function mapGoogleCategory(types: string[]): string {
  const categoryMap: Record<string, string> = {
    restaurant: 'restaurant',
    cafe: 'cafe',
    tourist_attraction: 'attraction',
    shopping_mall: 'shopping',
    store: 'shopping',
    museum: 'culture',
    art_gallery: 'culture',
    park: 'nature',
    natural_feature: 'nature',
    lodging: 'accommodation',
    hotel: 'accommodation',
  };

  for (const type of types) {
    if (categoryMap[type]) {
      return categoryMap[type];
    }
  }
  return 'etc';
}
