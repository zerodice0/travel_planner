import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Search, MapPin, Navigation, Menu, Plus, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { HTTPError } from 'ky';
import Input from '#components/ui/Input';
import { ConfirmDialog } from '#components/ui/ConfirmDialog';
import { FloatingEmptyNotice } from '#components/ui/FloatingEmptyNotice';
import { PlaceAddModal } from '#components/map/PlaceAddModal';
import { ManualPlaceAddModal } from '#components/map/ManualPlaceAddModal';
import { PlaceSearchBottomSheet } from '#components/map/PlaceSearchBottomSheet';
import { EmailVerificationRequiredModal } from '#components/modals/EmailVerificationRequiredModal';
import { useAuth } from '#contexts/AuthContext';
import { useGoogleMap } from '#hooks/useGoogleMap';
import { useKakaoPlacesSearch } from '#hooks/useKakaoPlacesSearch';
import { useGooglePlacesSearch } from '#hooks/useGooglePlacesSearch';
import { GoogleMarkerManager } from '#utils/GoogleMarkerManager';
import { createSearchResultInfoWindowContent } from '#utils/infoWindowUtils';
import {
  findNearestPlace,
  formatDistance
} from '#utils/distanceCalculator';
import { getCategoryLabel } from '#utils/categoryConfig';
import { createCustomMarkerContent, injectMarkerStyles } from '#components/map/CustomMarker';
import { CategoryFilter } from '#components/map/CategoryFilter';
import { ListFilter } from '#components/map/ListFilter';
import { PlaceViewTabs, PlaceViewTab } from '#components/map/PlaceViewTabs';
import PlaceListSidebar from '#components/map/PlaceListSidebar';
import { MapZoomControl } from '#components/map/MapZoomControl';
import { MapTypeControl } from '#components/map/MapTypeControl';
import AppLayout from '#components/layout/AppLayout';
import { placesApi, publicPlacesApi, listsApi } from '#lib/api';
import { useMapProvider } from '#contexts/MapProviderContext';
import type { Place, CreatePlaceData } from '#types/place';
import type { PublicPlace, CreatePublicPlaceData } from '#types/publicPlace';
import type { BaseMarkerManager, SearchResult } from '#types/map';
import type { List, ListPlaceItem } from '#types/list';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // Seoul City Hall

export default function MapPage() {
  const { searchProvider, setSearchProvider } = useMapProvider();
  const { isAuthenticated, user } = useAuth();

  // 탭 상태 (탐색/내 장소)
  const [activeTab, setActiveTab] = useState<PlaceViewTab>('explore');

  // 장소 상태 (탭별로 분리)
  const [places, setPlaces] = useState<Place[]>([]); // 내 장소
  const [publicPlaces, setPublicPlaces] = useState<PublicPlace[]>([]); // 공개 장소

  // 목록 상태
  const [lists, setLists] = useState<List[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

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
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [manualAddLocation, setManualAddLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentMapType, setCurrentMapType] = useState<string>('roadmap');
  const [showEmptyNotice, setShowEmptyNotice] = useState(true);
  const [toolbarHeight, setToolbarHeight] = useState(176); // 동적으로 계산될 상단 툴바 높이 (검색바 + 탭 + 카테고리 필터)

  const markerManagerRef = useRef<BaseMarkerManager | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const tempMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const placesRef = useRef<Place[]>([]);
  const debouncedSearchRef = useRef<((keyword: string) => void) | null>(null);

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

  // Phase 1: POI click removed - POI interactions disabled via Map config
  // Previously used useGooglePOIClick for POI handling

  // Remove temporary marker (search result marker)
  const removeTempMarker = useCallback(() => {
    if (tempMarkerRef.current) {
      tempMarkerRef.current.map = null;
      tempMarkerRef.current = null;
    }
    if (searchInfoWindowRef.current) {
      searchInfoWindowRef.current.close();
      searchInfoWindowRef.current = null;
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
        const { AdvancedMarkerElement } = (await google.maps.importLibrary(
          'marker',
        )) as google.maps.MarkerLibrary;

        // Create custom marker content with label
        const markerContent = createCustomMarkerContent(result.name);

        // Create marker
        const marker = new AdvancedMarkerElement({
          position: { lat: result.latitude, lng: result.longitude },
          map: map as google.maps.Map,
          title: result.name,
          content: markerContent,
        });

        tempMarkerRef.current = marker;

        // Create and show Info Window
        const infoWindow = new google.maps.InfoWindow({
          content: createSearchResultInfoWindowContent(result),
          pixelOffset: new google.maps.Size(0, -30),
          headerDisabled: true,
        });

        searchInfoWindowRef.current = infoWindow;

        // Open Info Window on marker
        infoWindow.open({
          anchor: marker,
          map: map as google.maps.Map,
        });

        // Add click listener to marker to reopen Info Window if closed
        marker.addListener('click', () => {
          infoWindow.open({
            anchor: marker,
            map: map as google.maps.Map,
          });
        });
      } catch (error) {
        console.error('Failed to add temp marker:', error);
      }
    },
    [map, isLoaded, removeTempMarker],
  );

  // Initialize marker manager when map loads
  useEffect(() => {
    if (map && isLoaded) {
      // Inject custom marker styles once
      injectMarkerStyles();

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

  // Measure toolbar height dynamically
  useEffect(() => {
    const updateToolbarHeight = () => {
      if (searchContainerRef.current) {
        const height = searchContainerRef.current.offsetHeight;
        setToolbarHeight(height);
      }
    };

    // Initial measurement
    updateToolbarHeight();

    // Update on resize
    window.addEventListener('resize', updateToolbarHeight);

    // Use MutationObserver to detect DOM changes (e.g., search results opening)
    const observer = new MutationObserver(updateToolbarHeight);
    if (searchContainerRef.current) {
      observer.observe(searchContainerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    return () => {
      window.removeEventListener('resize', updateToolbarHeight);
      observer.disconnect();
    };
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

  // Map click listener for manual place add
  useEffect(() => {
    if (!map || !isLoaded || !isAuthenticated || activeTab !== 'my-places') return;

    const googleMap = map as google.maps.Map;

    const clickListener = googleMap.addListener('click', (e: google.maps.MapMouseEvent) => {
      // Ignore clicks on POI/markers
      const placeId = (e as google.maps.IconMouseEvent).placeId;
      if (placeId) {
        return;
      }

      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();

      if (lat && lng) {
        // Check email verification
        if (user && !user.emailVerified) {
          setShowEmailVerificationModal(true);
          return;
        }

        // Open manual place add modal
        setManualAddLocation({ lat, lng });
        setShowManualAddModal(true);
      }
    });

    return () => {
      if (clickListener) {
        google.maps.event.removeListener(clickListener);
      }
    };
  }, [map, isLoaded, isAuthenticated, activeTab, user]);

  const loadPlaces = useCallback(async () => {
    try {
      if (activeTab === 'explore') {
        // 공개 장소 로드
        const data = await publicPlacesApi.getAll({
          limit: 100,
          category: selectedCategory || undefined
        });
        setPublicPlaces(data.places);
      } else {
        // 내 목록 탭 - 인증된 사용자만
        if (isAuthenticated) {
          if (selectedListId) {
            // 선택된 목록의 장소만 로드
            const data = await listsApi.getPlaces(selectedListId);
            // ListPlaceItem을 Place로 변환
            const placesData: Place[] = data.places.map((item: ListPlaceItem) => ({
              id: item.id,
              name: item.name,
              address: item.address,
              category: item.category,
              latitude: item.latitude,
              longitude: item.longitude,
              visited: item.visited,
              createdAt: new Date().toISOString(), // API에서 제공하지 않으므로 임시값
            }));
            setPlaces(placesData);
          } else {
            // 전체 장소 로드
            const data = await placesApi.getAll();
            setPlaces(data.places);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load places:', error);
      // 401 에러는 tokenExpiredEvent가 처리하므로 토스트 제외
      if (error instanceof HTTPError && error.response.status === 401) {
        return;
      }
      toast.error('장소 목록을 불러오는데 실패했습니다');
    }
  }, [activeTab, selectedCategory, selectedListId, isAuthenticated]);

  // Load places when tab, category, or authentication status changes
  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  // Update placesRef when places change
  useEffect(() => {
    placesRef.current = places;
  }, [places]);

  // Load lists for authenticated users (needed for both tabs)
  useEffect(() => {
    if (isAuthenticated) {
      loadLists();
    }
  }, [isAuthenticated]);

  const loadLists = async () => {
    try {
      const data = await listsApi.getAll({ sort: 'updatedAt' });
      setLists(data.lists);
    } catch (error) {
      console.error('Failed to load lists:', error);
      // 401 에러는 tokenExpiredEvent가 처리하므로 토스트 제외
      if (error instanceof HTTPError && error.response.status === 401) {
        return;
      }
      toast.error('목록을 불러오는데 실패했습니다');
    }
  };

  const getCurrentPosition = async (showToast = false) => {
    if (!navigator.geolocation) {
      toast.error('이 브라우저는 위치 서비스를 지원하지 않습니다.');
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
        if (showToast) {
          toast.success('현재 위치로 이동했습니다.');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);

        // Provide user-friendly error messages based on error code
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error(
              '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.',
              { duration: 5000 }
            );
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('위치 정보를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
            break;
          case error.TIMEOUT:
            toast.error('위치 요청 시간이 초과되었습니다. 다시 시도해주세요.');
            break;
          default:
            toast.error('위치를 가져오는 중 오류가 발생했습니다.');
        }
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
      return placesRef.current
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
    [],
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

      // Minimum search length (reduce unnecessary API calls for very short queries)
      const MIN_SEARCH_LENGTH = 2;
      const shouldUseExternalAPI = keyword.trim().length >= MIN_SEARCH_LENGTH;

      // Reset selection when starting a new search
      setSelectedSearchResultId(null);
      removeTempMarker();

      try {
        // Search local places first
        const localResults = searchLocalPlaces(keyword);

        // DB-first strategy: Only call Google API if local results are insufficient
        const MIN_RESULTS_THRESHOLD = 5;
        const hasEnoughLocalResults = localResults.length >= MIN_RESULTS_THRESHOLD;

        let externalResults: SearchResult[] = [];

        // Only search external API if:
        // 1. Search keyword is long enough (2+ characters)
        // 2. Local results are insufficient (< 5 results)
        if (shouldUseExternalAPI && !hasEnoughLocalResults) {
          console.log(`Local results (${localResults.length}) insufficient, searching Google API...`);
          externalResults = await search(keyword);
        } else if (hasEnoughLocalResults) {
          console.log(`Using ${localResults.length} local results only (sufficient, skipping Google API)`);
        } else {
          console.log(`Search keyword too short (${keyword.length} chars), skipping Google API`);
        }

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

  // Update debouncedSearchRef when performSearch changes
  useEffect(() => {
    debouncedSearchRef.current = debounce(performSearch, 800); // Increased from 300ms to 800ms to reduce API calls
  }, [performSearch]);

  // Update search on keyword change
  useEffect(() => {
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(searchKeyword);
    }
  }, [searchKeyword]);

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

  // Handle Info Window button clicks (장소 추가)
  useEffect(() => {
    const handleInfoWindowClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if the clicked element is the "추가" button in Info Window
      if (target.dataset?.action === 'add-place') {
        const resultId = target.dataset.resultId;
        const result = searchResults.find((r) => r.id === resultId);

        if (result) {
          handleOpenAddModal(result);
        }
      }
    };

    document.addEventListener('click', handleInfoWindowClick);
    return () => {
      document.removeEventListener('click', handleInfoWindowClick);
    };
  }, [searchResults]);

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSelectedSearchResult(null);
  };

  const handleConfirmAdd = async (
    data: CreatePlaceData,
    selectedListIds?: string[]
  ) => {
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

      // Add to my places (automatically creates public place if needed)
      const newPlace = await placesApi.create(data);

      // Add to selected lists if any
      const displayName = data.customName || data.name;
      if (selectedListIds && selectedListIds.length > 0) {
        await Promise.all(
          selectedListIds.map(listId =>
            listsApi.addPlaces(listId, [newPlace.id])
          )
        );
        toast.success(
          `✨ "${displayName}"이(가) ${selectedListIds.length}개 목록에 추가되었습니다`,
          { duration: 4000 }
        );
      } else {
        toast.success(`✨ "${displayName}"이(가) 내 장소에 추가되었습니다`);
      }

      // Close modal and clear search
      handleCloseAddModal();
      setSearchResults([]);
      setSearchKeyword('');
      setSelectedSearchResultId(null);
      removeTempMarker();
      // Phase 1: removePOIMarker() removed - no longer needed as POI clicks are disabled

      // Add marker immediately (don't wait for state update)
      if (markerManagerRef.current && activeTab === 'my-places') {
        await markerManagerRef.current.addMarker(newPlace);
      }

      // Navigate to the new place on map
      if (newPlace && markerManagerRef.current) {
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
        markerManagerRef.current.setZoom(17);

        // Show InfoWindow immediately (marker already exists)
        markerManagerRef.current.showInfoWindow(newPlace.id);
        setSelectedPlaceId(newPlace.id);
      }

      // Reload places in background for list synchronization
      loadPlaces();
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

    // 검색 상태 초기화 - 카테고리와 검색 결과 간 혼란 방지
    setSearchResults([]);
    setSearchKeyword('');
    setSelectedSearchResultId(null);
    removeTempMarker();
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
    markerManagerRef.current.setZoom(17);

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

      // Move map to search result location with fixed zoom level
      // Fixed zoom level (16) provides consistent detail view for search results
      // regardless of distance from current position
      markerManagerRef.current.panTo(result.latitude, result.longitude);
      markerManagerRef.current.setZoom(16);

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
      markerManagerRef.current.setZoom(16);
    }
  };

  const handleCurrentLocation = () => {
    getCurrentPosition(true);
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

      // Set zoom level for detailed view (consistent with other navigation features)
      markerManagerRef.current.setZoom(17);

      // Set as selected
      setSelectedPlaceId(place.id);

      // Show success message with distance info
      const distanceText = formatDistance(distance);
      toast.success(`${distanceText} 떨어진 "${place.name}"(으)로 이동합니다`);

      // Wait for map pan/zoom animation to complete, then re-render markers and show InfoWindow
      setTimeout(async () => {
        try {
          // Re-render markers for the new viewport
          await renderPlaceMarkers();

          // Show InfoWindow for the nearest place (marker should exist now)
          markerManagerRef.current?.showInfoWindow(place.id);
        } catch (error) {
          console.error('Failed to show info window after navigation:', error);
        }
      }, 500);
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

  // Manual Place Add Handlers
  const handleManualPlaceAdd = async (data: CreatePublicPlaceData) => {
    setIsAddingPlace(true);
    try {
      // Validate coordinates
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

      // Create public place first
      await publicPlacesApi.create(data);

      // Then add to my places
      const createData: CreatePlaceData = {
        name: data.name,
        address: data.address,
        phone: data.phone,
        latitude: data.latitude,
        longitude: data.longitude,
        category: data.category,
        description: data.description,
        externalUrl: data.externalUrl,
        externalId: data.externalId,
      };

      const newPlace = await placesApi.create(createData);

      toast.success(`✨ "${data.name}"이(가) 내 장소에 추가되었습니다`);

      // Close modal
      setShowManualAddModal(false);
      setManualAddLocation(null);

      // Add marker immediately
      if (markerManagerRef.current && activeTab === 'my-places') {
        await markerManagerRef.current.addMarker(newPlace);
      }

      // Navigate to the new place on map
      if (newPlace && markerManagerRef.current) {
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
        markerManagerRef.current.setZoom(17);

        // Show InfoWindow immediately
        markerManagerRef.current.showInfoWindow(newPlace.id);
        setSelectedPlaceId(newPlace.id);
      }

      // Reload places in background
      loadPlaces();
    } catch (error: unknown) {
      console.error('Failed to add place:', error);

      if (error instanceof HTTPError) {
        const errorData = await error.response.json();
        const errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || '장소 추가에 실패했습니다';
        toast.error(`장소 추가 실패: ${errorMessage}`);
      } else if (error instanceof Error) {
        toast.error(`장소 추가 실패: ${error.message}`);
      } else {
        toast.error('장소 추가에 실패했습니다');
      }
    } finally {
      setIsAddingPlace(false);
    }
  };

  const handleCloseManualAddModal = () => {
    setShowManualAddModal(false);
    setManualAddLocation(null);
  };

  const handleLoginClick = () => {
    window.location.href = '/login';
  };

  const handleCloseEmptyNotice = () => {
    setShowEmptyNotice(false);
  };

  const handleTabChange = (tab: PlaceViewTab) => {
    setActiveTab(tab);
    // 탭 변경 시 검색 상태 및 선택 상태 초기화
    setSearchResults([]);
    setSearchKeyword('');
    setSelectedSearchResultId(null);
    setSelectedCategory(''); // 카테고리도 초기화
    setSelectedListId(null); // 목록 선택도 초기화
    setShowEmptyNotice(true); // Empty notice 다시 표시
    removeTempMarker();

    // 탭별로 장소 다시 로드
    setTimeout(() => {
      loadPlaces();
    }, 0);
  };

  const handleLoginRequired = () => {
    window.location.href = '/login';
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

  // Calculate display places based on active tab
  const displayPlaces = useMemo((): Place[] => {
    if (activeTab === 'explore') {
      // PublicPlace를 Place로 변환 (공통 필드만 사용)
      return publicPlaces.map(p => p as unknown as Place);
    }
    return places;
  }, [activeTab, publicPlaces, places]);

  // Calculate filtered places
  const filteredPlaces = useMemo(() => {
    return selectedCategory
      ? displayPlaces.filter((p) => p.category === selectedCategory)
      : displayPlaces;
  }, [displayPlaces, selectedCategory]);

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

          {/* Place View Tabs (탐색/내 장소) */}
          <PlaceViewTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isAuthenticated={isAuthenticated}
            onLoginRequired={handleLoginRequired}
          />

          {/* Category Filter Tabs */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />

          {/* List Filter - '내 목록' 탭일 때만 표시 */}
          {activeTab === 'my-places' && isAuthenticated && (
            <ListFilter
              lists={lists}
              selectedListId={selectedListId}
              onListChange={setSelectedListId}
            />
          )}

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
            style={{ top: `${toolbarHeight}px` }} // Dynamically calculated toolbar height
          >
            <PlaceListSidebar
              places={visiblePlaces}
              totalPlaces={filteredPlaces.length}
              selectedPlaceId={selectedPlaceId}
              searchProvider={searchProvider}
              activeTab={activeTab}
              selectedListId={selectedListId}
              lists={lists}
              onPlaceClick={handlePlaceCardClick}
              onPlaceDelete={activeTab === 'my-places' ? handleDeletePlace : undefined}
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

        {/* Floating Empty Notice - 탭별로 다른 메시지 */}
        {filteredPlaces.length === 0 && isLoaded && !mapError && showEmptyNotice && searchResults.length === 0 && (
          <FloatingEmptyNotice
            type={selectedCategory ? 'category' : (activeTab === 'explore' ? 'viewport' : 'global')}
            category={selectedCategory}
            isAuthenticated={isAuthenticated}
            onLoginClick={handleLoginClick}
            onExploreNearest={activeTab === 'my-places' ? handleNavigateToNearest : undefined}
            isLoadingNearest={isLoadingNearest}
            onAddFirstPlace={activeTab === 'my-places' && isAuthenticated ? handleOpenSearchBottomSheet : undefined}
            onClose={handleCloseEmptyNotice}
            isPlaceListVisible={isPlaceListVisible}
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
          <div className="absolute right-4 flex flex-col gap-2 z-10" style={{ top: `${toolbarHeight + 8}px` }}>
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
          <div className="fixed bottom-24 left-4 bg-card rounded-lg shadow-lg px-4 py-2 border border-border z-10">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-sm font-medium text-foreground">
                {activeTab === 'explore' ? (
                  <>공개 장소</>
                ) : selectedListId ? (
                  <>{lists.find(l => l.id === selectedListId)?.name || '내 장소'}</>
                ) : (
                  <>내 장소</>
                )}
                {selectedCategory && (
                  <span className="text-muted-foreground">
                    {' > '}{getCategoryLabel(selectedCategory)}
                  </span>
                )}
                {' '}
                <span className="text-primary font-bold">{filteredPlaces.length}</span>개
              </p>
            </div>
          </div>
        ) : null}

        {/* FAB (Floating Action Button) - 우측 하단 - '내 장소' 탭에서만 표시 */}
        {activeTab === 'my-places' && isAuthenticated && (
          <button
            onClick={handleOpenSearchBottomSheet}
            className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all z-30 flex items-center justify-center relative"
            aria-label="장소 추가"
          >
            <Plus className="w-6 h-6" />
            {/* Lock badge for email verification */}
            {user && !user.emailVerified && (
              <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1 shadow-md">
                <Lock className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
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

        {/* Place Add Modal */}
        <PlaceAddModal
          isOpen={showAddModal}
          searchResult={selectedSearchResult}
          poiPlaceDetails={null}
          onClose={handleCloseAddModal}
          onConfirm={handleConfirmAdd}
          isSubmitting={isAddingPlace}
          lists={lists}
          currentListId={activeTab === 'my-places' ? selectedListId || undefined : undefined}
        />

        {/* Manual Place Add Modal */}
        <ManualPlaceAddModal
          isOpen={showManualAddModal}
          onClose={handleCloseManualAddModal}
          initialLocation={manualAddLocation}
          onConfirm={handleManualPlaceAdd}
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
