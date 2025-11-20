import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { MapOptions } from '#types/map';

export function useGoogleMap(containerId: string, options: MapOptions) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef<Loader | null>(null);

  useEffect(() => {
    // Reset state when initializing
    // setIsLoaded(false); // Removed to avoid set-state-in-effect warning

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const mapId = import.meta.env.VITE_GOOGLE_MAP_ID;

    if (!apiKey) {
      setError('Google Maps API key is not configured');
      return;
    }

    if (!mapId) {
      console.warn('Google Map ID is not configured.');
    }

    // Reuse loader if already created
    if (!loaderRef.current) {
      loaderRef.current = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places'],
      });
    }

    loaderRef.current
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

        const mapInstance = new Map(container, {
          center: options.center,
          zoom: options.level || 14,
          mapTypeControl: false, // Disabled: will use custom control
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: false, // Disabled: will use custom control
          // Only add mapId if it's a valid Map ID (not placeholder like "your-google-map-id")
          // This prevents mapId from overriding styles option
          ...(mapId && !mapId.includes('your-') && { mapId }),

          // Phase 1: POI removal for cost optimization (40-60% API cost reduction)
          clickableIcons: false, // Disable POI click to prevent Place Details API calls
          styles: [
            {
              featureType: 'poi',
              // Remove elementType to hide both icons and labels
              stylers: [{ visibility: 'off' }],
            },
          ], // Hide all POI markers (icons + labels) for cleaner UI
        });

        mapRef.current = mapInstance;
        setMap(mapInstance);
        setIsLoaded(true);
        setError(null);
      })
      .catch((err) => {
        console.error('Google Maps loading error:', err);
        setError('Failed to load Google Maps SDK');
      });

    return () => {
      // Cleanup map instance
      if (mapRef.current) {
        mapRef.current = null;
        setMap(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  const getCenter = () => {
    if (!mapRef.current) return null;
    const center = mapRef.current.getCenter();
    if (!center) return null;
    return {
      lat: center.lat(),
      lng: center.lng(),
    };
  };

  const getZoom = () => {
    if (!mapRef.current) return null;
    return mapRef.current.getZoom();
  };

  const setCenter = (lat: number, lng: number) => {
    if (!mapRef.current) return;
    mapRef.current.setCenter({ lat, lng });
  };

  const setZoom = (zoom: number) => {
    if (!mapRef.current) return;
    mapRef.current.setZoom(zoom);
  };

  const panBy = (dx: number, dy: number) => {
    if (!mapRef.current) return;
    mapRef.current.panBy(dx, dy);
  };

  const getMapType = () => {
    if (!mapRef.current) return null;
    return mapRef.current.getMapTypeId();
  };

  const setMapType = (mapTypeId: string) => {
    if (!mapRef.current) return;
    mapRef.current.setMapTypeId(mapTypeId);
  };

  return {
    map,
    isLoaded,
    error,
    getCenter,
    getZoom,
    setCenter,
    setZoom,
    panBy,
    getMapType,
    setMapType,
  };
}
