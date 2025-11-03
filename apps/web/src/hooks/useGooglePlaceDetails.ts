import { useState, useCallback } from 'react';

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  rating?: number;
  userRatingCount?: number;
  openingHours?: {
    isOpen: boolean;
    weekdayDescriptions: string[];
  };
  photos?: google.maps.places.PlacePhoto[];
  types?: string[];
  description?: string;
  externalUrl?: string;
}

export function useGooglePlaceDetails() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch basic place details (optimized for fast initial rendering)
   * Only requests essential fields: name, address, location
   */
  const fetchBasicDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    if (!placeId || typeof google === 'undefined' || !google.maps) {
      setError('Google Maps SDK is not loaded');
      return null;
    }

    try {
      // Import Places library
      const { Place } = (await google.maps.importLibrary(
        'places'
      )) as google.maps.PlacesLibrary;

      // Create Place instance
      const place = new Place({ id: placeId });

      // Fetch ONLY essential fields for fast response
      await place.fetchFields({
        fields: [
          'displayName',
          'formattedAddress',
          'location',
        ],
      });

      // Extract basic details
      const details: PlaceDetails = {
        placeId,
        name: place.displayName || '',
        address: place.formattedAddress || '',
        latitude: place.location?.lat() ?? 0,
        longitude: place.location?.lng() ?? 0,
      };

      return details;
    } catch (err) {
      setError('Failed to fetch basic place details');
      console.error('Basic place details fetch error:', err);
      return null;
    }
  }, []);

  const fetchPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    if (!placeId || typeof google === 'undefined' || !google.maps) {
      setError('Google Maps SDK is not loaded');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Import Places library
      const { Place } = (await google.maps.importLibrary(
        'places'
      )) as google.maps.PlacesLibrary;

      // Create Place instance
      const place = new Place({ id: placeId });

      // Fetch detailed fields
      await place.fetchFields({
        fields: [
          'displayName',
          'formattedAddress',
          'location',
          'internationalPhoneNumber',
          'websiteURI',
          'rating',
          'userRatingCount',
          'regularOpeningHours',
          'photos',
          'types',
          'editorialSummary',
          'googleMapsURI',
        ],
      });

      // Extract place details
      const details: PlaceDetails = {
        placeId,
        name: place.displayName || '',
        address: place.formattedAddress || '',
        latitude: place.location?.lat() ?? 0,
        longitude: place.location?.lng() ?? 0,
        phone: place.internationalPhoneNumber || undefined,
        website: place.websiteURI || undefined,
        rating: place.rating ?? undefined,
        userRatingCount: place.userRatingCount ?? undefined,
        openingHours: place.regularOpeningHours ? {
          isOpen: false, // Will be determined by weekday descriptions
          weekdayDescriptions: place.regularOpeningHours.weekdayDescriptions || [],
        } : undefined,
        photos: place.photos as google.maps.places.PlacePhoto[] | undefined,
        types: place.types,
        description: place.editorialSummary || undefined,
        externalUrl: place.googleMapsURI || undefined,
      };

      setIsLoading(false);
      return details;
    } catch (err) {
      setIsLoading(false);
      setError('Failed to fetch place details');
      console.error('Place details fetch error:', err);
      return null;
    }
  }, []);

  return { fetchBasicDetails, fetchPlaceDetails, isLoading, error };
}
