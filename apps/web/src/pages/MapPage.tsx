import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Search, MapPin, Filter, Navigation, Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '#components/ui/Input';
import { ConfirmDialog } from '#components/ui/ConfirmDialog';
import { useKakaoMap } from '#hooks/useKakaoMap';
import { useGoogleMap } from '#hooks/useGoogleMap';
import { useKakaoPlacesSearch } from '#hooks/useKakaoPlacesSearch';
import { useGooglePlacesSearch } from '#hooks/useGooglePlacesSearch';
import { KakaoMarkerManager } from '#utils/KakaoMarkerManager';
import { GoogleMarkerManager } from '#utils/GoogleMarkerManager';
import { CategoryFilter } from '#components/map/CategoryFilter';
import PlaceListSidebar from '#components/map/PlaceListSidebar';
import AppLayout from '#components/layout/AppLayout';
import { placesApi } from '#lib/api';
import { useMapProvider } from '#contexts/MapProviderContext';
import {
  convertKakaoLevelToGoogleZoom,
  convertGoogleZoomToKakaoLevel,
} from '#utils/mapZoomConverter';
import type { Place } from '#types/place';
import type { BaseMarkerManager, SearchResult } from '#types/map';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // Seoul City Hall

export default function MapPage() {
  const { mapProvider, searchProvider, setMapProvider, setSearchProvider } = useMapProvider();

  const [places, setPlaces] = useState<Place[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isPlaceListVisible, setIsPlaceListVisible] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>();
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Sync map state when switching providers
  useEffect(() => {
    if (!isLoaded) return;

    // Get the previous map and target map
    const prevMap = mapProvider === 'kakao' ? googleResult : kakaoResult;
    const targetMap = mapProvider === 'kakao' ? kakaoResult : googleResult;

    // Get center from previous map
    const prevCenter = prevMap.getCenter?.();
    if (prevCenter && targetMap.setCenter) {
      targetMap.setCenter(prevCenter.lat, prevCenter.lng);
    }

    // Get and convert zoom/level from previous map
    if (mapProvider === 'kakao') {
      // Switching to Kakao: convert Google zoom to Kakao level
      const googleZoom = googleResult.getZoom?.();
      if (googleZoom !== null && googleZoom !== undefined && kakaoResult.setLevel) {
        const kakaoLevel = convertGoogleZoomToKakaoLevel(googleZoom);
        kakaoResult.setLevel(kakaoLevel);
      }
      // Fix tile rendering after switching
      if (map && map.relayout) {
        setTimeout(() => map.relayout(), 100);
      }
    } else {
      // Switching to Google: convert Kakao level to Google zoom
      const kakaoLevel = kakaoResult.getLevel?.();
      if (kakaoLevel !== null && kakaoLevel !== undefined && googleResult.setZoom) {
        const googleZoom = convertKakaoLevelToGoogleZoom(kakaoLevel);
        googleResult.setZoom(googleZoom);
      }
    }
  }, [mapProvider, isLoaded]);

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

  // Adjust map center when sidebar visibility changes
  useEffect(() => {
    if (!isLoaded || !map) return;

    // Only adjust on desktop (md breakpoint: 768px)
    const isDesktop = window.innerWidth >= 768;
    if (!isDesktop) return;

    // Sidebar width on desktop (from PlaceListSidebar: md:w-80 = 320px)
    const SIDEBAR_WIDTH = 320;
    const offsetX = SIDEBAR_WIDTH / 2;

    // Get panBy method from active map provider
    const panBy = mapProvider === 'kakao' ? kakaoResult.panBy : googleResult.panBy;
    if (!panBy) return;

    // Adjust map center based on sidebar visibility
    if (isPlaceListVisible) {
      // Sidebar opened: shift map center to the left
      panBy(-offsetX, 0);
    } else {
      // Sidebar closed: shift map center back to the right
      panBy(offsetX, 0);
    }
  }, [isPlaceListVisible, isLoaded, map, mapProvider]);

  // Handle window resize to adjust map center responsively
  useEffect(() => {
    if (!isLoaded || !map) return;

    let wasDesktop = window.innerWidth >= 768;

    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;

      // Check if screen size category changed
      if (wasDesktop === isDesktop) return;

      const SIDEBAR_WIDTH = 320;
      const offsetX = SIDEBAR_WIDTH / 2;
      const panBy = mapProvider === 'kakao' ? kakaoResult.panBy : googleResult.panBy;
      if (!panBy) return;

      // Only adjust if sidebar is visible
      if (!isPlaceListVisible) {
        wasDesktop = isDesktop;
        return;
      }

      if (wasDesktop && !isDesktop) {
        // Desktop → Mobile: restore original center
        panBy(offsetX, 0);
      } else if (!wasDesktop && isDesktop) {
        // Mobile → Desktop: apply offset
        panBy(-offsetX, 0);
      }

      wasDesktop = isDesktop;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoaded, map, mapProvider, isPlaceListVisible]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;

    // Trigger immediate search on form submit
    await performSearch(searchKeyword);
  };

  const handleAddPlace = async (result: SearchResult) => {
    try {
      // 필수 필드 검증
      if (!result.name || !result.address || !result.category) {
        toast.error('필수 정보가 누락되었습니다 (이름, 주소, 카테고리)');
        return;
      }

      // 좌표 검증 및 변환
      const latitude = Number(result.latitude);
      const longitude = Number(result.longitude);

      if (isNaN(latitude) || isNaN(longitude)) {
        toast.error('잘못된 좌표 정보입니다');
        return;
      }

      if (latitude < -90 || latitude > 90) {
        toast.error('위도 값이 유효하지 않습니다 (-90 ~ 90)');
        return;
      }

      if (longitude < -180 || longitude > 180) {
        toast.error('경도 값이 유효하지 않습니다 (-180 ~ 180)');
        return;
      }

      // 길이 제한 검증
      if (result.category && result.category.length > 50) {
        toast.error('카테고리 이름이 너무 깁니다 (최대 50자)');
        return;
      }

      if (result.phone && result.phone.length > 50) {
        toast.error('전화번호가 너무 깁니다 (최대 50자)');
        return;
      }

      if (result.id && result.id.length > 255) {
        console.warn('External ID가 너무 깁니다. 일부 정보가 저장되지 않을 수 있습니다.');
      }

      await placesApi.create({
        name: result.name.trim(),
        address: result.address.trim(),
        phone: result.phone?.trim(),
        latitude,
        longitude,
        category: result.category.trim(),
        externalUrl: result.url,
        externalId: result.id?.substring(0, 255), // 255자로 제한
      });

      toast.success(`${result.name}이(가) 추가되었습니다`);
      setSearchResults([]);
      setSearchKeyword('');
      await loadPlaces();
    } catch (error: any) {
      console.error('Failed to add place:', error);

      // 에러 메시지 개선
      if (error?.response?.data?.message) {
        const errorMessage = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(', ')
          : error.response.data.message;
        toast.error(`장소 추가 실패: ${errorMessage}`);
      } else if (error?.message) {
        toast.error(`장소 추가 실패: ${error.message}`);
      } else {
        toast.error('장소 추가에 실패했습니다');
      }
    }
  };

  const renderPlaceMarkers = async () => {
    if (!markerManagerRef.current) return;

    markerManagerRef.current.clearMarkers();

    const filteredPlaces =
      selectedCategories.length > 0
        ? places.filter((p) => selectedCategories.includes(p.category))
        : places;

    // Add markers (Google uses async, Kakao is sync - both work with Promise.all)
    await Promise.all(
      filteredPlaces.map((place) =>
        markerManagerRef.current?.addMarker(place, (clickedPlace) => {
          setSelectedPlaceId(clickedPlace.id);
        }),
      ),
    );
  };

  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories);
  };

  const handlePlaceCardClick = (place: Place) => {
    if (!markerManagerRef.current) return;

    // Move map to place location
    markerManagerRef.current.panTo(place.latitude, place.longitude);

    // Adjust for sidebar if visible on desktop
    const isDesktop = window.innerWidth >= 768;
    if (isPlaceListVisible && isDesktop) {
      const SIDEBAR_WIDTH = 320;
      const offsetX = SIDEBAR_WIDTH / 2;
      const panBy = mapProvider === 'kakao' ? kakaoResult.panBy : googleResult.panBy;
      if (panBy) {
        // Shift left to center the place in visible area
        setTimeout(() => panBy(-offsetX, 0), 100); // Small delay to let panTo complete
      }
    }

    // Adjust zoom level for closer view
    if (mapProvider === 'kakao') {
      markerManagerRef.current.setLevel(3);
    } else {
      // Google Maps - convert Kakao level 3 to Google zoom
      const googleZoom = convertKakaoLevelToGoogleZoom(3);
      if (googleResult.setZoom) {
        googleResult.setZoom(googleZoom);
      }
    }

    // Show InfoWindow for this place
    markerManagerRef.current.showInfoWindow(place.id);

    // Set as selected
    setSelectedPlaceId(place.id);
  };

  const handleSearchResultClick = (result: SearchResult) => {
    if (!markerManagerRef.current) return;

    // Move map to search result location
    markerManagerRef.current.panTo(result.latitude, result.longitude);

    // Adjust for sidebar if visible on desktop
    const isDesktop = window.innerWidth >= 768;
    if (isPlaceListVisible && isDesktop) {
      const SIDEBAR_WIDTH = 320;
      const offsetX = SIDEBAR_WIDTH / 2;
      const panBy = mapProvider === 'kakao' ? kakaoResult.panBy : googleResult.panBy;
      if (panBy) {
        // Shift left to center the search result in visible area
        setTimeout(() => panBy(-offsetX, 0), 100); // Small delay to let panTo complete
      }
    }

    // Adjust zoom level for closer view
    if (mapProvider === 'kakao') {
      markerManagerRef.current.setLevel(3);
    } else {
      // Google Maps - convert Kakao level 3 to Google zoom
      const googleZoom = convertKakaoLevelToGoogleZoom(3);
      if (googleResult.setZoom) {
        googleResult.setZoom(googleZoom);
      }
    }
  };

  const handleCurrentLocation = () => {
    getCurrentPosition();
  };

  const handleDeletePlace = (place: Place) => {
    setPlaceToDelete(place);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!placeToDelete) return;

    setIsDeleting(true);
    try {
      await placesApi.delete(placeToDelete.id);
      toast.success('장소가 삭제되었습니다');

      // 삭제된 장소가 선택되어 있었다면 선택 해제
      if (selectedPlaceId === placeToDelete.id) {
        setSelectedPlaceId(undefined);
      }

      // 다이얼로그 닫기
      setIsDeleteDialogOpen(false);
      setPlaceToDelete(null);

      // 목록 새로고침 (마커도 자동으로 다시 렌더링됨)
      await loadPlaces();
    } catch (error) {
      console.error('Failed to delete place:', error);
      toast.error('장소 삭제에 실패했습니다');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setPlaceToDelete(null);
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
        {/* Fixed Top Toolbar */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
          <div className="flex items-center gap-2 p-3">
            {/* Hamburger Menu - Sidebar Toggle */}
            <button
              onClick={() => setIsPlaceListVisible((prev) => !prev)}
              className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
              aria-label="장소 목록"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
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
                className="hidden sm:block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors flex-shrink-0"
              >
                {isSearching ? '검색 중...' : '검색'}
              </button>
            </form>

            {/* Filter Button */}
            <button
              onClick={() => setShowCategoryFilter(true)}
              className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
              aria-label="필터"
            >
              <Filter className="w-5 h-5 text-foreground" />
            </button>

            {/* Current Location Button */}
            <button
              onClick={handleCurrentLocation}
              className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
              aria-label="현재 위치"
            >
              <Navigation className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="border-t border-border bg-card">
              <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleSearchResultClick(result)}
                    className="flex items-start justify-between p-3 bg-background rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSearchResultClick(result);
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{result.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{result.address}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPlace(result);
                      }}
                      className="ml-2 px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0"
                    >
                      추가
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Error */}
          {searchError && (
            <div className="border-t border-border p-3 bg-red-50 text-red-600 text-sm">
              {searchError}
            </div>
          )}
        </div>

        {/* Place List Sidebar */}
        {isPlaceListVisible && (
          <div
            className={`absolute left-0 bottom-0 z-20 transition-transform duration-300 ${
              isPlaceListVisible ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ top: '64px' }} // Adjust for fixed toolbar height
          >
            <PlaceListSidebar
              places={
                selectedCategories.length > 0
                  ? places.filter((p) => selectedCategories.includes(p.category))
                  : places
              }
              selectedPlaceId={selectedPlaceId}
              mapProvider={mapProvider}
              searchProvider={searchProvider}
              onPlaceClick={handlePlaceCardClick}
              onPlaceDelete={handleDeletePlace}
              onMapProviderChange={setMapProvider}
              onSearchProviderChange={setSearchProvider}
              onClose={() => setIsPlaceListVisible(false)}
            />
          </div>
        )}

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

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="장소 삭제"
          message={placeToDelete ? `"${placeToDelete.name}"을(를) 삭제하시겠습니까?` : ''}
          confirmText="삭제"
          cancelText="취소"
          variant="danger"
          loading={isDeleting}
        />
      </div>
    </AppLayout>
  );
}
