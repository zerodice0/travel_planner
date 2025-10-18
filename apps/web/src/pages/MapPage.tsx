import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Search, MapPin, Navigation, Menu, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '#components/ui/Input';
import { ConfirmDialog } from '#components/ui/ConfirmDialog';
import { FloatingEmptyNotice } from '#components/ui/FloatingEmptyNotice';
import { PlaceAddModal } from '#components/map/PlaceAddModal';
import { PlaceSearchBottomSheet } from '#components/map/PlaceSearchBottomSheet';
import { EmailVerificationRequiredModal } from '#components/modals/EmailVerificationRequiredModal';
import { useAuth } from '#contexts/AuthContext';
import { useGoogleMap } from '#hooks/useGoogleMap';
import { useKakaoPlacesSearch } from '#hooks/useKakaoPlacesSearch';
import { useGooglePlacesSearch } from '#hooks/useGooglePlacesSearch';
import { GoogleMarkerManager } from '#utils/GoogleMarkerManager';
import {
  calculateDistance,
  findNearestPlace,
  formatDistance,
  getOptimalZoomLevel
} from '#utils/distanceCalculator';
import { CategoryFilter } from '#components/map/CategoryFilter';
import PlaceListSidebar from '#components/map/PlaceListSidebar';
import { MapZoomControl } from '#components/map/MapZoomControl';
import { MapTypeControl } from '#components/map/MapTypeControl';
import AppLayout from '#components/layout/AppLayout';
import { placesApi } from '#lib/api';
import { useMapProvider } from '#contexts/MapProviderContext';
import type { Place, CreatePlaceData } from '#types/place';
import type { BaseMarkerManager, SearchResult } from '#types/map';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // Seoul City Hall

export default function MapPage() {
  const { searchProvider, setSearchProvider } = useMapProvider();
  const { isAuthenticated, user } = useAuth();

  const [places, setPlaces] = useState<Place[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // 단일 선택으로 변경
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isPlaceListVisible, setIsPlaceListVisible] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>();
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<{
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [isLoadingNearest, setIsLoadingNearest] = useState(false);
  const [selectedSearchResultId, setSelectedSearchResultId] = useState<string | null>(null);
  const [showSearchBottomSheet, setShowSearchBottomSheet] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [currentMapType, setCurrentMapType] = useState<string>('roadmap');
  const [showEmptyNotice, setShowEmptyNotice] = useState(true);

  const markerManagerRef = useRef<BaseMarkerManager | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const tempMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  // Google Map only (for worldwide support)
  const {
    map,
    isLoaded,
    error: mapError,
    getZoom,
    setZoom,
    getMapType,
    setMapType,
  } = useGoogleMap('google-map-container', {
    center: currentLocation || DEFAULT_CENTER,
    level: 14,
  });

  // Search hooks
  const kakaoSearch = useKakaoPlacesSearch();
  const googleSearch = useGooglePlacesSearch();

  const {
    search,
    isSearching,
    error: searchError,
  } = searchProvider === 'kakao' ? kakaoSearch : googleSearch;

  // Remove temporary marker (search result marker)
  const removeTempMarker = useCallback(() => {
    if (tempMarkerRef.current) {
      tempMarkerRef.current.map = null;
      tempMarkerRef.current = null;
    }
  }, []);

  // Add temporary marker for search result
  const addTempMarker = useCallback(
    async (result: SearchResult) => {
      if (!map || !isLoaded) return;

      // Remove existing temp marker
      removeTempMarker();

      try {
        // Import marker library
        const { AdvancedMarkerElement, PinElement } = (await google.maps.importLibrary(
          'marker',
        )) as google.maps.MarkerLibrary;

        // Create blue pin for search result
        const pin = new PinElement({
          background: '#3B82F6', // Primary blue
          borderColor: '#1E40AF', // Darker blue
          glyphColor: '#FFFFFF', // White
          scale: 1.2, // Slightly larger
        });

        // Create marker
        const marker = new AdvancedMarkerElement({
          position: { lat: result.latitude, lng: result.longitude },
          map: map as google.maps.Map,
          title: result.name,
          content: pin.element,
        });

        tempMarkerRef.current = marker;
      } catch (error) {
        console.error('Failed to add temp marker:', error);
      }
    },
    [map, isLoaded, removeTempMarker],
  );

  // Load user's places
  useEffect(() => {
    loadPlaces();
  }, []);

  // Initialize marker manager when map loads
  useEffect(() => {
    if (map && isLoaded) {
      markerManagerRef.current = new GoogleMarkerManager(map);
      renderPlaceMarkers();
    }

    return () => {
      if (markerManagerRef.current) {
        markerManagerRef.current.clearMarkers();
      }
      // Cleanup temporary marker on unmount
      if (tempMarkerRef.current) {
        tempMarkerRef.current.map = null;
        tempMarkerRef.current = null;
      }
    };
  }, [map, isLoaded]);

  // Sync map type state when map loads
  useEffect(() => {
    if (map && isLoaded) {
      const initialType = getMapType() || 'roadmap';
      setCurrentMapType(initialType);
    }
  }, [map, isLoaded, getMapType]);

  // Re-render markers when places or category change
  useEffect(() => {
    if (markerManagerRef.current && isLoaded) {
      renderPlaceMarkers();
    }
  }, [places, selectedCategory, isLoaded]);

  // Track viewport bounds for place filtering
  useEffect(() => {
    if (!map || !isLoaded) return;

    const updateBounds = () => {
      const bounds = (map as google.maps.Map).getBounds();
      if (bounds) {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        setViewportBounds({
          swLat: sw.lat(),
          swLng: sw.lng(),
          neLat: ne.lat(),
          neLng: ne.lng(),
        });
      }
    };

    // Initial bounds update
    updateBounds();

    // Add event listener for map idle (after pan/zoom)
    const listener = (map as google.maps.Map).addListener('idle', updateBounds);

    return () => {
      listener.remove();
    };
  }, [map, isLoaded]);

  // Get current location
  useEffect(() => {
    getCurrentPosition();
  }, []);

  // Close search results on ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && searchResults.length > 0) {
        setSearchResults([]);
        setSearchKeyword('');
        setSelectedSearchResultId(null);
        removeTempMarker();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [searchResults.length, removeTempMarker]);

  // Close search results on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        searchResults.length > 0
      ) {
        setSearchResults([]);
        setSearchKeyword('');
        setSelectedSearchResultId(null);
        removeTempMarker();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchResults.length, removeTempMarker]);

  // Adjust map center when sidebar visibility changes
  useEffect(() => {
    if (!isLoaded || !map) return;

    // Only adjust on desktop (md breakpoint: 768px)
    const isDesktop = window.innerWidth >= 768;
    if (!isDesktop) return;

    // Sidebar width on desktop (from PlaceListSidebar: md:w-80 = 320px)
    const SIDEBAR_WIDTH = 320;
    const offsetX = SIDEBAR_WIDTH / 2;

    // Get Google Maps instance
    const googleMap = map as google.maps.Map;
    if (!googleMap.panBy) return;

    // Adjust map center based on sidebar visibility
    if (isPlaceListVisible) {
      // Sidebar opened: shift map center to the left
      googleMap.panBy(-offsetX, 0);
    } else {
      // Sidebar closed: shift map center back to the right
      googleMap.panBy(offsetX, 0);
    }
  }, [isPlaceListVisible, isLoaded, map]);

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
      const googleMap = map as google.maps.Map;
      if (!googleMap.panBy) return;

      // Only adjust if sidebar is visible
      if (!isPlaceListVisible) {
        wasDesktop = isDesktop;
        return;
      }

      if (wasDesktop && !isDesktop) {
        // Desktop → Mobile: restore original center
        googleMap.panBy(offsetX, 0);
      } else if (!wasDesktop && isDesktop) {
        // Mobile → Desktop: apply offset
        googleMap.panBy(-offsetX, 0);
      }

      wasDesktop = isDesktop;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoaded, map, isPlaceListVisible]);

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

  // Search local places
  const searchLocalPlaces = useCallback(
    (keyword: string): SearchResult[] => {
      if (!keyword.trim()) return [];

      const lowerKeyword = keyword.toLowerCase();
      return places
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
          isLocal: true,
        }));
    },
    [places],
  );

  // Combined search function (local + external)
  const performSearch = useCallback(
    async (keyword: string) => {
      if (!keyword.trim()) {
        setSearchResults([]);
        setSelectedSearchResultId(null);
        removeTempMarker();
        return;
      }

      // Reset selection when starting a new search
      setSelectedSearchResultId(null);
      removeTempMarker();

      try {
        // Search local places
        const localResults = searchLocalPlaces(keyword);

        // Search external API
        const externalResults = await search(keyword);

        // Filter out external results that duplicate local places
        // Match by name and approximate location (within 50m)
        const filteredExternalResults = externalResults.filter((external) => {
          return !localResults.some((local) => {
            const nameSimilar =
              local.name.toLowerCase() === external.name.toLowerCase();
            const latDiff = Math.abs(local.latitude - external.latitude);
            const lngDiff = Math.abs(local.longitude - external.longitude);
            const locationClose = latDiff < 0.0005 && lngDiff < 0.0005; // ~50m

            return nameSimilar && locationClose;
          });
        });

        // Combine results: local first, then external
        const combinedResults = [...localResults, ...filteredExternalResults];
        setSearchResults(combinedResults);
      } catch (error) {
        console.error('Search failed:', error);
        // Even if external search fails, show local results
        const localResults = searchLocalPlaces(keyword);
        setSearchResults(localResults);
      }
    },
    [search, searchLocalPlaces, removeTempMarker],
  );

  // Debounce helper
  const debounce = <T extends (...args: never[]) => unknown>(
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

  const handleOpenAddModal = (result: SearchResult) => {
    // Check email verification before allowing place addition
    if (user && !user.emailVerified) {
      setShowEmailVerificationModal(true);
      return;
    }

    setSelectedSearchResult(result);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSelectedSearchResult(null);
  };

  const handleConfirmAdd = async (data: CreatePlaceData) => {
    setIsAddingPlace(true);
    try {
      // 좌표 검증 및 변환
      const latitude = Number(data.latitude);
      const longitude = Number(data.longitude);

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

      // Create place
      const newPlace = await placesApi.create(data);

      toast.success(`${data.name}이(가) 추가되었습니다`);

      // Close modal and clear search
      handleCloseAddModal();
      setSearchResults([]);
      setSearchKeyword('');
      setSelectedSearchResultId(null);
      removeTempMarker();

      // Reload places to show new marker
      await loadPlaces();

      // Navigate to the new place on map
      if (markerManagerRef.current) {
        markerManagerRef.current.panTo(latitude, longitude);

        // Adjust for sidebar if visible on desktop
        const isDesktop = window.innerWidth >= 768;
        if (isPlaceListVisible && isDesktop) {
          const SIDEBAR_WIDTH = 320;
          const offsetX = SIDEBAR_WIDTH / 2;
          const googleMap = map as google.maps.Map;
          if (googleMap && googleMap.panBy) {
            setTimeout(() => googleMap.panBy(-offsetX, 0), 100);
          }
        }

        // Set zoom level for better view
        markerManagerRef.current.setLevel(17);

        // Show InfoWindow for the new place
        setTimeout(() => {
          markerManagerRef.current?.showInfoWindow(newPlace.id);
          setSelectedPlaceId(newPlace.id);
        }, 300);
      }
    } catch (error: unknown) {
      console.error('Failed to add place:', error);

      // Type-safe error handling
      if (error instanceof Error) {
        toast.error(`장소 추가 실패: ${error.message}`);
      } else if (typeof error === 'object' && error !== null) {
        // Type guard for API error structure
        const apiError = error as { response?: { data?: { message?: string | string[] } } };
        if (apiError.response?.data?.message) {
          const errorMessage = Array.isArray(apiError.response.data.message)
            ? apiError.response.data.message.join(', ')
            : apiError.response.data.message;
          toast.error(`장소 추가 실패: ${errorMessage}`);
        } else {
          toast.error('장소 추가에 실패했습니다');
        }
      } else {
        toast.error('장소 추가에 실패했습니다');
      }
    } finally {
      setIsAddingPlace(false);
    }
  };

  const renderPlaceMarkers = async () => {
    if (!markerManagerRef.current) return;

    markerManagerRef.current.clearMarkers();

    // Add markers (Google uses async, Kakao is sync - both work with Promise.all)
    await Promise.all(
      filteredPlaces.map((place) =>
        markerManagerRef.current?.addMarker(place, (clickedPlace) => {
          setSelectedPlaceId(clickedPlace.id);
        }),
      ),
    );
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setShowEmptyNotice(true); // 카테고리 변경 시 다이얼로그 다시 표시
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
      const googleMap = map as google.maps.Map;
      if (googleMap && googleMap.panBy) {
        // Shift left to center the place in visible area
        setTimeout(() => googleMap.panBy(-offsetX, 0), 100); // Small delay to let panTo complete
      }
    }

    // Adjust zoom level for closer view (Google Maps zoom 17 for detail)
    markerManagerRef.current.setLevel(17);

    // Show InfoWindow for this place
    markerManagerRef.current.showInfoWindow(place.id);

    // Set as selected
    setSelectedPlaceId(place.id);
  };

  const handleSearchResultClick = (result: SearchResult) => {
    if (!markerManagerRef.current || !map) return;

    try {
      // Set selected search result ID for highlighting
      setSelectedSearchResultId(result.id);

      // Close empty notice dialog when user selects a search result
      setShowEmptyNotice(false);

      // Add temporary marker for visual feedback
      addTempMarker(result);

      // Get current map center to calculate distance
      const googleMap = map as google.maps.Map;
      const center = googleMap.getCenter();

      if (!center) {
        // Fallback: use fixed zoom level if center is unavailable
        markerManagerRef.current.panTo(result.latitude, result.longitude);
        markerManagerRef.current.setLevel(16);
      } else {
        const currentCenter = {
          lat: center.lat(),
          lng: center.lng(),
        };

        // Calculate distance from current center to search result
        const distance = calculateDistance(currentCenter, {
          lat: result.latitude,
          lng: result.longitude,
        });

        // Determine optimal zoom level based on distance
        const optimalZoom = getOptimalZoomLevel(distance);

        // Move map to search result location
        markerManagerRef.current.panTo(result.latitude, result.longitude);

        // Set optimal zoom level for better user experience
        markerManagerRef.current.setLevel(optimalZoom);
      }

      // Adjust for sidebar if visible on desktop
      const isDesktop = window.innerWidth >= 768;
      if (isPlaceListVisible && isDesktop) {
        const SIDEBAR_WIDTH = 320;
        const offsetX = SIDEBAR_WIDTH / 2;
        const googleMap = map as google.maps.Map;
        if (googleMap && googleMap.panBy) {
          // Shift left to center the search result in visible area
          setTimeout(() => googleMap.panBy(-offsetX, 0), 100); // Small delay to let panTo complete
        }
      }

      // Keep search results open for easier browsing
      // User can close manually with ESC or X button
    } catch (error) {
      console.error('Failed to handle search result click:', error);
      // Fallback to basic behavior
      markerManagerRef.current.panTo(result.latitude, result.longitude);
      markerManagerRef.current.setLevel(16);
    }
  };

  const handleCurrentLocation = () => {
    getCurrentPosition();
  };

  const handleDeletePlace = (place: Place) => {
    setPlaceToDelete(place);
    setIsDeleteDialogOpen(true);
  };

  const handleNavigateToNearest = () => {
    if (!map || !isLoaded || filteredPlaces.length === 0 || !markerManagerRef.current) return;

    setIsLoadingNearest(true);
    try {
      // Get current map center
      const googleMap = map as google.maps.Map;
      const center = googleMap.getCenter();

      if (!center) {
        toast.error('지도 중심을 가져올 수 없습니다');
        return;
      }

      const currentCenter = {
        lat: center.lat(),
        lng: center.lng(),
      };

      // Find nearest place
      const result = findNearestPlace(currentCenter, filteredPlaces);

      if (!result) {
        toast.error('가장 가까운 장소를 찾을 수 없습니다');
        return;
      }

      const { place, distance } = result;

      // Calculate optimal zoom level based on distance
      const optimalZoom = getOptimalZoomLevel(distance);

      // Move map to place location
      markerManagerRef.current.panTo(place.latitude, place.longitude);

      // Adjust for sidebar if visible on desktop
      const isDesktop = window.innerWidth >= 768;
      if (isPlaceListVisible && isDesktop) {
        const SIDEBAR_WIDTH = 320;
        const offsetX = SIDEBAR_WIDTH / 2;
        if (googleMap && googleMap.panBy) {
          // Shift left to center the place in visible area
          setTimeout(() => googleMap.panBy(-offsetX, 0), 100);
        }
      }

      // Set optimal zoom level based on distance
      markerManagerRef.current.setLevel(optimalZoom);

      // Show InfoWindow for this place
      markerManagerRef.current.showInfoWindow(place.id);

      // Set as selected
      setSelectedPlaceId(place.id);

      // Show success message with distance info
      const distanceText = formatDistance(distance);
      toast.success(`${distanceText} 떨어진 "${place.name}"(으)로 이동합니다`);
    } catch (error) {
      console.error('Failed to navigate to nearest place:', error);
      toast.error('장소로 이동하는데 실패했습니다');
    } finally {
      setIsLoadingNearest(false);
    }
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

  const handleLoginClick = () => {
    window.location.href = '/login';
  };

  const handleCloseEmptyNotice = () => {
    setShowEmptyNotice(false);
  };

  const handleOpenSearchBottomSheet = () => {
    // Check email verification before allowing place addition
    if (user && !user.emailVerified) {
      setShowEmailVerificationModal(true);
      return;
    }

    setShowSearchBottomSheet(true);
  };

  const handleCloseSearchBottomSheet = () => {
    setShowSearchBottomSheet(false);
  };

  const handleBottomSheetSearch = async (keyword: string) => {
    await performSearch(keyword);
  };

  const handleBottomSheetResultAdd = (result: SearchResult) => {
    handleOpenAddModal(result);
    setShowSearchBottomSheet(false);
  };

  const handleZoomIn = () => {
    const currentZoom = getZoom();
    if (currentZoom !== null && currentZoom !== undefined) {
      setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    const currentZoom = getZoom();
    if (currentZoom !== null && currentZoom !== undefined) {
      setZoom(currentZoom - 1);
    }
  };

  const handleMapTypeChange = (mapTypeId: string) => {
    setMapType(mapTypeId);
    setCurrentMapType(mapTypeId); // Sync state for UI
  };

  // Calculate filtered places
  const filteredPlaces = useMemo(() => {
    return selectedCategory
      ? places.filter((p) => p.category === selectedCategory)
      : places;
  }, [places, selectedCategory]);

  // Calculate places visible in current viewport
  const visiblePlaces = useMemo(() => {
    if (!viewportBounds) {
      return filteredPlaces;
    }

    return filteredPlaces.filter((place) => {
      return (
        place.latitude >= viewportBounds.swLat &&
        place.latitude <= viewportBounds.neLat &&
        place.longitude >= viewportBounds.swLng &&
        place.longitude <= viewportBounds.neLng
      );
    });
  }, [filteredPlaces, viewportBounds]);

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
                구글맵을 불러올 수 없습니다
              </h2>

              {/* Error Message */}
              <p className="text-red-600 text-sm text-center mb-4">{mapError}</p>

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
        <div
          ref={searchContainerRef}
          className="absolute top-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-b border-border shadow-sm"
        >
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
                  ref={searchInputRef}
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="여행지를 검색하거나 추가하세요 🔍"
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

            {/* Current Location Button */}
            <button
              onClick={handleCurrentLocation}
              className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
              aria-label="현재 위치"
            >
              <Navigation className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Category Filter Tabs */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="border-t border-border bg-card">
              <div className="max-h-64 overflow-y-auto p-2">
                {/* Local Results Section */}
                {searchResults.some((r) => r.isLocal) && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                      저장된 장소
                    </p>
                    <div className="space-y-2">
                      {searchResults
                        .filter((r) => r.isLocal)
                        .map((result) => (
                          <div
                            key={result.id}
                            onClick={() => handleSearchResultClick(result)}
                            className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                              selectedSearchResultId === result.id
                                ? 'bg-primary/10 border-2 border-primary shadow-md'
                                : 'bg-background border-2 border-transparent hover:bg-muted'
                            }`}
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
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-foreground truncate">
                                  {result.name}
                                </h3>
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full flex-shrink-0">
                                  저장됨
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {result.address}
                              </p>
                              {result.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {result.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* External Results Section */}
                {searchResults.some((r) => !r.isLocal) && (
                  <div>
                    {searchResults.some((r) => r.isLocal) && (
                      <p className="text-xs font-medium text-muted-foreground px-2 py-1 mt-2">
                        검색 결과
                      </p>
                    )}
                    <div className="space-y-2">
                      {searchResults
                        .filter((r) => !r.isLocal)
                        .map((result) => (
                          <div
                            key={result.id}
                            onClick={() => handleSearchResultClick(result)}
                            className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                              selectedSearchResultId === result.id
                                ? 'bg-primary/10 border-2 border-primary shadow-md'
                                : 'bg-background border-2 border-transparent hover:bg-muted'
                            }`}
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
                              <h3 className="font-medium text-foreground truncate">
                                {result.name}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {result.address}
                              </p>
                              {result.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {result.description}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddModal(result);
                              }}
                              className={`ml-3 px-4 py-2 text-sm rounded-lg transition-all flex-shrink-0 font-medium ${
                                selectedSearchResultId === result.id
                                  ? 'bg-primary text-white shadow-lg scale-105 hover:bg-primary-dark'
                                  : 'bg-primary text-white hover:bg-primary-dark'
                              }`}
                            >
                              추가
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
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
            style={{ top: '120px' }} // Adjust for fixed toolbar height (search bar + category tabs)
          >
            <PlaceListSidebar
              places={visiblePlaces}
              totalPlaces={filteredPlaces.length}
              selectedPlaceId={selectedPlaceId}
              searchProvider={searchProvider}
              onPlaceClick={handlePlaceCardClick}
              onPlaceDelete={handleDeletePlace}
              onSearchProviderChange={setSearchProvider}
              onClose={() => setIsPlaceListVisible(false)}
              onNavigateToNearest={handleNavigateToNearest}
            />
          </div>
        )}

        {/* Map Container - Google Maps Only */}
        <div
          id="google-map-container"
          className="w-full h-full"
        />

        {/* Floating Empty Notice */}
        {filteredPlaces.length === 0 && isLoaded && !mapError && showEmptyNotice && searchResults.length === 0 && (
          <FloatingEmptyNotice
            type={selectedCategory ? 'category' : 'global'}
            category={selectedCategory}
            isAuthenticated={isAuthenticated}
            onLoginClick={handleLoginClick}
            onExploreNearest={handleNavigateToNearest}
            isLoadingNearest={isLoadingNearest}
            onAddFirstPlace={handleOpenSearchBottomSheet}
            onClose={handleCloseEmptyNotice}
          />
        )}


        {/* Loading Overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-card">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">
                구글맵을 불러오는 중...
              </p>
            </div>
          </div>
        )}

        {/* Custom Map Controls - 우측 상단 */}
        {isLoaded && (
          <div className="absolute top-32 right-4 flex flex-col gap-2 z-10">
            {/* Map Type Control */}
            <MapTypeControl
              currentMapType={currentMapType}
              onMapTypeChange={handleMapTypeChange}
            />

            {/* Zoom Control */}
            <MapZoomControl
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              currentZoom={getZoom()}
              maxZoom={22}
              minZoom={0}
            />
          </div>
        )}

        {/* Place Count Info Panel - 좌측 하단 */}
        {!isLoaded || filteredPlaces.length > 0 ? (
          <div className="absolute bottom-4 left-4 bg-card rounded-lg shadow-lg px-4 py-2 border border-border z-10">
            <p className="text-sm font-medium text-foreground">
              {selectedCategory && (
                <span className="text-muted-foreground">
                  선택된 카테고리{' '}
                </span>
              )}
              <span className="text-primary font-bold">{filteredPlaces.length}</span>개 장소
            </p>
          </div>
        ) : null}

        {/* FAB (Floating Action Button) - 우측 하단 */}
        <button
          onClick={handleOpenSearchBottomSheet}
          className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all z-20 flex items-center justify-center"
          aria-label="장소 추가"
        >
          <Plus className="w-6 h-6" />
        </button>

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

        {/* Place Add Modal */}
        <PlaceAddModal
          isOpen={showAddModal}
          searchResult={selectedSearchResult}
          onClose={handleCloseAddModal}
          onConfirm={handleConfirmAdd}
          isSubmitting={isAddingPlace}
        />

        {/* Place Search Bottom Sheet */}
        <PlaceSearchBottomSheet
          isOpen={showSearchBottomSheet}
          onClose={handleCloseSearchBottomSheet}
          onSearch={handleBottomSheetSearch}
          searchResults={searchResults}
          isSearching={isSearching}
          onResultSelect={handleSearchResultClick}
          onResultAdd={handleBottomSheetResultAdd}
          selectedSearchResultId={selectedSearchResultId}
        />

        {/* Email Verification Required Modal */}
        {user && (
          <EmailVerificationRequiredModal
            isOpen={showEmailVerificationModal}
            onClose={() => setShowEmailVerificationModal(false)}
            userEmail={user.email}
          />
        )}
      </div>
    </AppLayout>
  );
}
