import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Search, MapPin, Filter, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '#components/ui/Input';
import { useKakaoMap } from '#hooks/useKakaoMap';
import { useGoogleMap } from '#hooks/useGoogleMap';
import { useKakaoPlacesSearch } from '#hooks/useKakaoPlacesSearch';
import { useGooglePlacesSearch } from '#hooks/useGooglePlacesSearch';
import { KakaoMarkerManager } from '#utils/KakaoMarkerManager';
import { GoogleMarkerManager } from '#utils/GoogleMarkerManager';
import { CategoryFilter } from '#components/map/CategoryFilter';
import AppLayout from '#components/layout/AppLayout';
import { placesApi } from '#lib/api';
import { useMapProvider } from '#contexts/MapProviderContext';
import type { Place } from '#types/place';
import type { BaseMarkerManager } from '#types/map';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // Seoul City Hall

export default function MapPage() {
  const { mapProvider, searchProvider, setMapProvider, setSearchProvider } = useMapProvider();

  const [places, setPlaces] = useState<Place[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const markerManagerRef = useRef<BaseMarkerManager | null>(null);

  // Kakao Map
  const kakaoResult = useKakaoMap('kakao-map-container', {
    center: currentLocation || DEFAULT_CENTER,
    level: 3,
  });

  // Google Map
  const googleResult = useGoogleMap('google-map-container', {
    center: currentLocation || DEFAULT_CENTER,
    level: 14,
  });

  // Select active map based on provider
  const { map, isLoaded, error: mapError } = mapProvider === 'kakao' ? kakaoResult : googleResult;

  // Relayout map when switching providers
  useEffect(() => {
    if (map && isLoaded) {
      // Call relayout for Kakao Map to fix tile rendering after switching
      if (mapProvider === 'kakao' && map.relayout) {
        map.relayout();
      }
    }
  }, [mapProvider, map, isLoaded]);

  // Search hooks
  const kakaoSearch = useKakaoPlacesSearch();
  const googleSearch = useGooglePlacesSearch();

  const {
    search,
    isSearching,
    error: searchError,
  } = searchProvider === 'kakao' ? kakaoSearch : googleSearch;

  // Load user's places
  useEffect(() => {
    loadPlaces();
  }, []);

  // Initialize marker manager when map changes
  useEffect(() => {
    if (map && isLoaded) {
      if (mapProvider === 'kakao') {
        markerManagerRef.current = new KakaoMarkerManager(map);
      } else {
        markerManagerRef.current = new GoogleMarkerManager(map);
      }
      renderPlaceMarkers();
    }

    return () => {
      if (markerManagerRef.current) {
        markerManagerRef.current.clearMarkers();
      }
    };
  }, [map, isLoaded, mapProvider]);

  // Re-render markers when places or categories change
  useEffect(() => {
    if (markerManagerRef.current && isLoaded) {
      renderPlaceMarkers();
    }
  }, [places, selectedCategories, isLoaded]);

  // Get current location
  useEffect(() => {
    getCurrentPosition();
  }, []);

  const loadPlaces = async () => {
    try {
      const data = await placesApi.getAll();
      setPlaces(data.places);
    } catch (error) {
      console.error('Failed to load places:', error);
      toast.error('장소 목록을 불러오는데 실패했습니다');
    }
  };

  const getCurrentPosition = async () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(location);
        if (markerManagerRef.current) {
          markerManagerRef.current.panTo(location.lat, location.lng);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );
  };

  // Debounced search function
  const performSearch = useCallback(
    async (keyword: string) => {
      if (!keyword.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const results = await search(keyword);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      }
    },
    [search],
  );

  // Debounce helper
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number,
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: number;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedSearch = useMemo(() => debounce(performSearch, 300), [performSearch]);

  // Update search on keyword change
  useEffect(() => {
    debouncedSearch(searchKeyword);
  }, [searchKeyword, debouncedSearch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;

    // Trigger immediate search on form submit
    await performSearch(searchKeyword);
  };

  const handleAddPlace = async (result: any) => {
    try {
      await placesApi.create({
        name: result.name,
        address: result.address,
        phone: result.phone,
        latitude: result.latitude,
        longitude: result.longitude,
        category: result.category,
        externalUrl: result.url,
        externalId: result.id,
      });

      toast.success(`${result.name}이(가) 추가되었습니다`);
      setSearchResults([]);
      setSearchKeyword('');
      await loadPlaces();
    } catch (error) {
      console.error('Failed to add place:', error);
      toast.error('장소 추가에 실패했습니다');
    }
  };

  const renderPlaceMarkers = () => {
    if (!markerManagerRef.current) return;

    markerManagerRef.current.clearMarkers();

    const filteredPlaces =
      selectedCategories.length > 0
        ? places.filter((p) => selectedCategories.includes(p.category))
        : places;

    filteredPlaces.forEach((place) => {
      markerManagerRef.current?.addMarker(place);
    });
  };

  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories);
  };

  const handleCurrentLocation = () => {
    getCurrentPosition();
  };

  if (mapError) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="max-w-md w-full mx-4">
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              {/* Error Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-red-600" />
                </div>
              </div>

              {/* Error Title */}
              <h2 className="text-xl font-bold text-center mb-2">
                {mapProvider === 'kakao' ? '카카오맵' : '구글맵'}을 불러올 수 없습니다
              </h2>

              {/* Error Message */}
              <p className="text-red-600 text-sm text-center mb-4">{mapError}</p>

              {/* Map Provider Toggle */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  다른 지도 서비스로 전환해보세요
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setMapProvider('kakao')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      mapProvider === 'kakao'
                        ? 'bg-primary text-white'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    카카오맵
                  </button>
                  <button
                    onClick={() => setMapProvider('google')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      mapProvider === 'google'
                        ? 'bg-primary text-white'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    구글맵
                  </button>
                </div>
              </div>

              {/* Help Text */}
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>문제가 계속되면:</strong>
                  <br />
                  • 네트워크 연결 상태를 확인하세요
                  <br />
                  • API 키 설정이 올바른지 확인하세요
                  <br />• 브라우저 개발자 도구의 콘솔을 확인하세요
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="relative h-screen">
        {/* Map Provider Toggle */}
        <div className="absolute top-4 left-4 z-10 bg-card rounded-lg shadow-lg p-2 flex gap-2">
          <button
            onClick={() => setMapProvider('kakao')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mapProvider === 'kakao'
                ? 'bg-primary text-white'
                : 'bg-muted text-foreground hover:bg-muted'
            }`}
          >
            카카오맵
          </button>
          <button
            onClick={() => setMapProvider('google')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mapProvider === 'google'
                ? 'bg-primary text-white'
                : 'bg-muted text-foreground hover:bg-muted'
            }`}
          >
            구글맵
          </button>
        </div>

        {/* Search Bar */}
        <div className="absolute top-4 left-56 right-4 z-10">
          <div className="bg-card rounded-xl shadow-lg p-4">
            {/* Search Provider Tabs */}
            <div className="flex gap-2 mb-3 pb-3 border-b border-border">
              <button
                onClick={() => setSearchProvider('kakao')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  searchProvider === 'kakao'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                카카오 검색
              </button>
              <button
                onClick={() => setSearchProvider('google')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  searchProvider === 'google'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                구글 검색
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCategoryFilter(true)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="필터"
              >
                <Filter className="w-5 h-5 text-foreground" />
              </button>
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="장소 검색..."
                    className="pl-10"
                    fullWidth
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  {isSearching ? '검색 중...' : '검색'}
                </button>
              </form>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-start justify-between p-3 bg-background rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{result.name}</h3>
                      <p className="text-sm text-muted-foreground">{result.address}</p>
                    </div>
                    <button
                      onClick={() => handleAddPlace(result)}
                      className="ml-2 px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      추가
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchError && (
              <div className="mt-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {searchError}
              </div>
            )}
          </div>
        </div>

        {/* Current Location Button */}
        <button
          onClick={handleCurrentLocation}
          className="absolute bottom-24 right-4 z-10 p-3 bg-card rounded-full shadow-lg hover:shadow-xl transition-shadow"
          aria-label="현재 위치"
        >
          <Navigation className="w-6 h-6 text-primary" />
        </button>

        {/* Map Containers */}
        <div
          id="kakao-map-container"
          className="w-full h-full"
          style={{ display: mapProvider === 'kakao' ? 'block' : 'none' }}
        />
        <div
          id="google-map-container"
          className="w-full h-full"
          style={{ display: mapProvider === 'google' ? 'block' : 'none' }}
        />

        {/* Category Filter Modal */}
        {showCategoryFilter && (
          <CategoryFilter
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
            onClose={() => setShowCategoryFilter(false)}
          />
        )}

        {/* Loading Overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-card">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">
                {mapProvider === 'kakao' ? '카카오맵' : '구글맵'}을 불러오는 중...
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
