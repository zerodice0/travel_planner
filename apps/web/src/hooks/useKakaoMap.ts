import { useEffect, useRef, useState } from 'react';

interface MapOptions {
  center: { lat: number; lng: number };
  level?: number;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export function useKakaoMap(containerId: string, options: MapOptions) {
  const mapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Kakao Maps script is already loaded
    if (window.kakao && window.kakao.maps) {
      initializeMap();
      return;
    }

    // Load Kakao Maps script
    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_KAKAO_MAP_KEY;

    if (!apiKey) {
      setError('Kakao Maps API key is not configured');
      return;
    }

    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        initializeMap();
      });
    };

    script.onerror = () => {
      setError('Failed to load Kakao Maps SDK');
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [containerId]);

  const initializeMap = () => {
    const container = document.getElementById(containerId);
    if (!container) {
      setError(`Map container with id "${containerId}" not found`);
      return;
    }

    const { center, level = 3 } = options;

    try {
      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level,
      });

      mapRef.current = map;
      setIsLoaded(true);
      setError(null);
    } catch (err) {
      setError('Failed to initialize map');
      console.error('Map initialization error:', err);
    }
  };

  return { map: mapRef.current, isLoaded, error };
}
