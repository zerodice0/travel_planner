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
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Reset state when initializing
    setIsLoaded(false);

    // Check if Kakao Maps script is already loaded
    if (window.kakao && window.kakao.maps) {
      scriptLoadedRef.current = true;
      initializeMap();
      return;
    }

    // Don't reload script if it's already being loaded
    if (scriptLoadedRef.current) {
      initializeMap();
      return;
    }

    // Load Kakao Maps script
    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_KAKAO_MAP_KEY;

    if (!apiKey) {
      setError('카카오맵 API 키가 설정되지 않았습니다. .env 파일의 VITE_KAKAO_MAP_KEY를 확인해주세요.');
      console.error('[Kakao Map] API key is missing. Please check VITE_KAKAO_MAP_KEY in .env file.');
      return;
    }

    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;

    script.onload = () => {
      scriptLoadedRef.current = true;
      window.kakao.maps.load(() => {
        initializeMap();
      });
    };

    script.onerror = () => {
      const errorMsg = '카카오맵 SDK를 불러올 수 없습니다. 네트워크 연결을 확인하거나 API 키가 유효한지 확인해주세요.';
      setError(errorMsg);
      console.error('[Kakao Map] Failed to load SDK. Please check:', {
        apiKey: apiKey.substring(0, 10) + '...',
        scriptSrc: script.src,
        possibleCauses: [
          'Invalid API key (ensure it is a JavaScript key from Kakao Developers)',
          'Network connectivity issue',
          'CORS or security policy blocking the script'
        ]
      });
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup map instance
      if (mapRef.current) {
        mapRef.current = null;
      }
      setIsLoaded(false);
    };
  }, [containerId]);

  const initializeMap = () => {
    const container = document.getElementById(containerId);
    if (!container) {
      const errorMsg = `지도 컨테이너를 찾을 수 없습니다. (ID: ${containerId})`;
      setError(errorMsg);
      console.error(`[Kakao Map] Container not found: ${containerId}`);
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
      const errorMsg = '카카오맵 초기화에 실패했습니다.';
      setError(errorMsg);
      console.error('[Kakao Map] Initialization error:', err);
    }
  };

  const getCenter = () => {
    if (!mapRef.current) return null;
    const center = mapRef.current.getCenter();
    return {
      lat: center.getLat(),
      lng: center.getLng(),
    };
  };

  const getLevel = () => {
    if (!mapRef.current) return null;
    return mapRef.current.getLevel();
  };

  const setCenter = (lat: number, lng: number) => {
    if (!mapRef.current) return;
    const position = new window.kakao.maps.LatLng(lat, lng);
    mapRef.current.setCenter(position);
  };

  const setLevel = (level: number) => {
    if (!mapRef.current) return;
    mapRef.current.setLevel(level);
  };

  const panBy = (dx: number, dy: number) => {
    if (!mapRef.current) return;
    mapRef.current.panBy(dx, dy);
  };

  return {
    map: mapRef.current,
    isLoaded,
    error,
    getCenter,
    getLevel,
    setCenter,
    setLevel,
    panBy,
  };
}
