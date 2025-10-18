import { useState, useCallback } from 'react';
import type { SearchResult } from '#types/map';

export function useGooglePlacesSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (keyword: string): Promise<SearchResult[]> => {
    if (!keyword.trim()) {
      return [];
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
        maxResultCount: 20,
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

      return searchResults;
    } catch (error) {
      setIsSearching(false);
      setError('검색 중 오류가 발생했습니다');
      console.error('Google Places search error:', error);
      return [];
    }
  }, []);

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
