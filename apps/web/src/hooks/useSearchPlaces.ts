import { useState, useCallback, useMemo } from 'react';
import { publicPlacesApi } from '#lib/api';
import { deduplicatePlaces } from '#utils/deduplicatePlaces';
import type { Place } from '#types/place';
import type { SearchResult } from '#types/map';

interface UseSearchPlacesOptions {
  myPlaces?: Place[];
}

/**
 * 통합 검색 커스텀 훅 (Phase 2: Database-based search)
 * - 내 장소 검색 (로컬)
 * - 공개 장소 검색 (DB API)
 * - 중복 제거 및 결과 병합
 *
 * ✅ Google Places Text Search API 제거됨
 */
export function useSearchPlaces(options: UseSearchPlacesOptions) {
  const { myPlaces = [] } = options;
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  /**
   * 내 장소 검색 (로컬)
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
          externalId: place.externalId,
          isLocal: true,
        }));
    },
    [myPlaces],
  );

  /**
   * 통합 검색 수행
   * - 로컬 검색 (내 장소)
   * - 공개 장소 검색 (DB API with FTS5)
   * - 중복 제거
   */
  const performSearch = useCallback(
    async (keyword: string) => {
      if (!keyword.trim()) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        // 1. Search local places (내 장소)
        const localResults = searchLocalPlaces(keyword);

        // 2. Search public places (DB API)
        const publicPlacesResponse = await publicPlacesApi.search({
          keyword,
          limit: 20,
        });

        // Transform public places to SearchResult format
        const publicResults: SearchResult[] = publicPlacesResponse.places.map((place) => ({
          id: place.id,
          name: place.name,
          address: place.address,
          category: place.category,
          phone: place.phone,
          latitude: place.latitude,
          longitude: place.longitude,
          url: place.externalUrl,
          externalId: place.externalId,
          isPublic: true,
        }));

        // 3. Deduplicate results
        // Priority: Local places > Public places (if same externalId)
        const combinedResults = deduplicatePlaces([...localResults, ...publicResults]);

        setSearchResults(combinedResults);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchError('검색에 실패했습니다. 다시 시도해주세요.');

        // Fallback: show local results only
        const localResults = searchLocalPlaces(keyword);
        setSearchResults(localResults);
      } finally {
        setIsSearching(false);
      }
    },
    [searchLocalPlaces],
  );

  /**
   * Debounce helper
   */
  const debounce = <T extends (...args: never[]) => unknown>(
    func: T,
    delay: number,
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout>;
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
    setSearchError(null);
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
