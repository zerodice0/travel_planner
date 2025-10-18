import { useState, useCallback, useMemo } from 'react';
import { useKakaoPlacesSearch } from './useKakaoPlacesSearch';
import { useGooglePlacesSearch } from './useGooglePlacesSearch';
import type { Place } from '#types/place';
import type { PublicPlace } from '#types/publicPlace';
import type { SearchResult } from '#types/map';

interface UseSearchPlacesOptions {
  myPlaces?: Place[];
  publicPlaces?: PublicPlace[];
  searchProvider: 'kakao' | 'google';
}

/**
 * 통합 검색 커스텀 훅
 * - 내 장소 검색
 * - 공개 장소 검색
 * - 외부 API 검색 (Kakao/Google)
 * - 중복 제거 및 결과 병합
 */
export function useSearchPlaces(options: UseSearchPlacesOptions) {
  const { myPlaces = [], publicPlaces = [], searchProvider } = options;
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const kakaoSearch = useKakaoPlacesSearch();
  const googleSearch = useGooglePlacesSearch();

  const { search, error: searchError } = searchProvider === 'kakao' ? kakaoSearch : googleSearch;

  /**
   * 내 장소 검색
   */
  const searchLocalPlaces = useCallback(
    (keyword: string): SearchResult[] => {
      if (!keyword.trim()) return [];

      const lowerKeyword = keyword.toLowerCase();
      return myPlaces
        .filter(
          (place) =>
            place.name.toLowerCase().includes(lowerKeyword) ||
            place.address.toLowerCase().includes(lowerKeyword),
        )
        .map((place) => ({
          id: place.id,
          name: place.name,
          address: place.address,
          category: place.category,
          phone: place.phone || undefined,
          latitude: place.latitude,
          longitude: place.longitude,
          url: place.externalUrl,
          isLocal: true,
        }));
    },
    [myPlaces],
  );

  /**
   * 공개 장소 검색
   */
  const searchPublicPlaces = useCallback(
    (keyword: string): SearchResult[] => {
      if (!keyword.trim()) return [];

      const lowerKeyword = keyword.toLowerCase();
      return publicPlaces
        .filter(
          (place) =>
            place.name.toLowerCase().includes(lowerKeyword) ||
            place.address.toLowerCase().includes(lowerKeyword),
        )
        .map((place) => ({
          id: place.id,
          name: place.name,
          address: place.address,
          category: place.category,
          phone: undefined, // PublicPlace doesn't have phone field
          latitude: place.latitude,
          longitude: place.longitude,
          url: undefined,
          isPublic: true,
        }));
    },
    [publicPlaces],
  );

  /**
   * 통합 검색 수행
   * - 로컬 검색 (내 장소)
   * - 공개 장소 검색
   * - 외부 API 검색
   * - 중복 제거
   */
  const performSearch = useCallback(
    async (keyword: string) => {
      if (!keyword.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);

      try {
        // Search local places (내 장소)
        const localResults = searchLocalPlaces(keyword);

        // Search public places (공개 장소)
        const publicResults = searchPublicPlaces(keyword);

        // Search external API (Kakao/Google)
        const externalResults = await search(keyword);

        // Filter out external results that duplicate local or public places
        // Match by name and approximate location (within 50m)
        const filteredExternalResults = externalResults.filter((external) => {
          const isDuplicate = [...localResults, ...publicResults].some((local) => {
            const nameSimilar = local.name.toLowerCase() === external.name.toLowerCase();
            const latDiff = Math.abs(local.latitude - external.latitude);
            const lngDiff = Math.abs(local.longitude - external.longitude);
            const locationClose = latDiff < 0.0005 && lngDiff < 0.0005; // ~50m

            return nameSimilar && locationClose;
          });

          return !isDuplicate;
        });

        // Combine results: local first, then public, then external
        const combinedResults = [...localResults, ...publicResults, ...filteredExternalResults];
        setSearchResults(combinedResults);
      } catch (error) {
        console.error('Search failed:', error);
        // Even if external search fails, show local and public results
        const localResults = searchLocalPlaces(keyword);
        const publicResults = searchPublicPlaces(keyword);
        setSearchResults([...localResults, ...publicResults]);
      } finally {
        setIsSearching(false);
      }
    },
    [search, searchLocalPlaces, searchPublicPlaces],
  );

  /**
   * Debounce helper
   */
  const debounce = <T extends (...args: never[]) => unknown>(
    func: T,
    delay: number,
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: number;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  /**
   * Debounced search (300ms delay)
   */
  const debouncedSearch = useMemo(() => debounce(performSearch, 300), [performSearch]);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    performSearch,
    debouncedSearch,
    clearSearch,
  };
}
