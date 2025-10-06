import { useState } from 'react';
import type { SearchResult } from '#types/map';

export function useGooglePlacesSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (keyword: string): Promise<SearchResult[]> => {
    if (!keyword.trim()) {
      return [];
    }

    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      setError('Google Maps SDK is not loaded');
      return [];
    }

    setIsSearching(true);
    setError(null);

    return new Promise((resolve) => {
      const service = new google.maps.places.PlacesService(
        document.createElement('div')
      );

      service.textSearch(
        {
          query: keyword,
          language: 'ko',
        },
        (results, status) => {
          setIsSearching(false);

          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results &&
            results.length > 0
          ) {
            const places = results.map((place) => ({
              id: place.place_id!,
              name: place.name!,
              address: place.formatted_address || '',
              category: mapGoogleCategory(place.types || []),
              latitude: place.geometry!.location!.lat(),
              longitude: place.geometry!.location!.lng(),
              url: `https://maps.google.com/?q=place_id:${place.place_id}`,
            }));
            resolve(places);
          } else if (
            status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            resolve([]);
          } else {
            setError('검색 중 오류가 발생했습니다');
            resolve([]);
          }
        }
      );
    });
  };

  return { search, isSearching, error };
}

function mapGoogleCategory(types: string[]): string {
  const categoryMap: Record<string, string> = {
    restaurant: 'restaurant',
    cafe: 'cafe',
    tourist_attraction: 'tourist_attraction',
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
