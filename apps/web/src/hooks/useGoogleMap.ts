import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { MapOptions } from '#types/map';

export function useGoogleMap(containerId: string, options: MapOptions) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key is not configured');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'marker'],
    });

    loader
      .load()
      .then(async () => {
        const { Map } = (await google.maps.importLibrary(
          'maps'
        )) as google.maps.MapsLibrary;

        const container = document.getElementById(containerId);
        if (!container) {
          setError(`Map container with id "${containerId}" not found`);
          return;
        }

        const map = new Map(container, {
          center: options.center,
          zoom: options.level || 14,
          mapTypeControl: true,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
        });

        mapRef.current = map;
        setIsLoaded(true);
        setError(null);
      })
      .catch((err) => {
        console.error('Google Maps loading error:', err);
        setError('Failed to load Google Maps SDK');
      });

    return () => {
      mapRef.current = null;
    };
  }, [containerId]);

  return { map: mapRef.current, isLoaded, error };
}
