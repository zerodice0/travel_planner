import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, Search, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import Input from '#components/ui/Input';
import { CategoryFilter } from '#components/map/CategoryFilter';
import { useSearchPlaces } from '#hooks/useSearchPlaces';
import { useInfiniteScroll } from '#hooks/useInfiniteScroll';
import { useMapProvider } from '#contexts/MapProviderContext';
import { useGoogleMap } from '#hooks/useGoogleMap';
import { placesApi, publicPlacesApi } from '#lib/api';
import { getCategoryIcon } from '#utils/categoryConfig';
import { deduplicatePlaces } from '#utils/deduplicatePlaces';
import { GoogleMarkerManager } from '#utils/GoogleMarkerManager';
import type { Place } from '#types/place';
import type { PublicPlace } from '#types/publicPlace';
import type { SearchResult } from '#types/map';

interface PlaceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedPlaces: SearchResult[]) => Promise<void>;
  excludePlaceIds?: string[]; // 이미 목록에 있는 장소 ID
}

const PLACES_PER_PAGE = 20;

/**
 * 장소 선택 모달
 *
 * - 검색 기능 (내 장소 + 공개 장소 + 외부 API)
 * - 카테고리 필터링
 * - 무한 스크롤
 * - 복수 선택
 */
export function PlaceSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  excludePlaceIds = [],
}: PlaceSelectionModalProps) {
  const { searchProvider } = useMapProvider();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(true);

  // 내 장소
  const [myPlaces, setMyPlaces] = useState<Place[]>([]);
  const [myPlacesPage, setMyPlacesPage] = useState(0);

  // 공개 장소
  const [publicPlaces, setPublicPlaces] = useState<PublicPlace[]>([]);
  const [publicPlacesPage, setPublicPlacesPage] = useState(0);
  const [hasMorePublicPlaces, setHasMorePublicPlaces] = useState(true);
  const [isLoadingPublicPlaces, setIsLoadingPublicPlaces] = useState(false);

  // 통합 검색
  const {
    searchResults,
    isSearching,
    debouncedSearch,
    clearSearch,
  } = useSearchPlaces({
    myPlaces,
    publicPlaces,
    searchProvider,
  });

  // Google Map 초기화
  const markerManagerRef = useRef<GoogleMarkerManager | null>(null);
  const prevSelectedPlacesRef = useRef<Set<string>>(new Set());
  const prevAvailablePlaceIdsRef = useRef<Set<string>>(new Set());
  const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // Seoul City Hall

  const { map, isLoaded } = useGoogleMap(
    isOpen ? 'place-selection-modal-map' : '',
    {
      center: DEFAULT_CENTER,
      level: 11, // 서울 전체가 보이는 줌 레벨
    }
  );

  // 마커 매니저 초기화
  useEffect(() => {
    if (map && isLoaded) {
      markerManagerRef.current = new GoogleMarkerManager(map as google.maps.Map);
    }

    return () => {
      if (markerManagerRef.current) {
        markerManagerRef.current.clearMarkers();
        markerManagerRef.current = null;
      }
    };
  }, [map, isLoaded]);

  // 초기 로드
  useEffect(() => {
    if (isOpen) {
      loadMyPlaces(true);
      loadPublicPlaces(true);
    }
  }, [isOpen]);

  // 검색 키워드 변경 시 검색
  useEffect(() => {
    if (searchKeyword.trim()) {
      debouncedSearch(searchKeyword);
    } else {
      clearSearch();
    }
  }, [searchKeyword, debouncedSearch, clearSearch]);

  /**
   * 내 장소 로드
   */
  const loadMyPlaces = useCallback(async (reset = false) => {
    try {
      const data = await placesApi.getAll({
        limit: PLACES_PER_PAGE,
        // offset 파라미터가 없으면 페이지네이션 구현 불가능
        // 일단 limit만 사용
      });

      if (reset) {
        setMyPlaces(data.places);
        setMyPlacesPage(0);
      } else {
        setMyPlaces(prev => [...prev, ...data.places]);
      }
    } catch (error) {
      console.error('Failed to load my places:', error);
    }
  }, [myPlacesPage]);

  /**
   * 공개 장소 로드
   */
  const loadPublicPlaces = useCallback(async (reset = false) => {
    const page = reset ? 0 : publicPlacesPage;
    const offset = page * PLACES_PER_PAGE;

    try {
      setIsLoadingPublicPlaces(true);
      const data = await publicPlacesApi.getAll({
        limit: PLACES_PER_PAGE,
        offset,
        category: selectedCategory || undefined,
      });

      if (reset) {
        setPublicPlaces(data.places);
        setPublicPlacesPage(0);
      } else {
        setPublicPlaces(prev => [...prev, ...data.places]);
      }

      setHasMorePublicPlaces(data.places.length >= PLACES_PER_PAGE);

      if (!reset) {
        setPublicPlacesPage(page + 1);
      }
    } catch (error) {
      console.error('Failed to load public places:', error);
    } finally {
      setIsLoadingPublicPlaces(false);
    }
  }, [publicPlacesPage, selectedCategory]);

  /**
   * 더 많은 장소 로드 (무한 스크롤)
   */
  const loadMore = useCallback(async () => {
    // 검색 중이거나 검색 결과가 있으면 무한 스크롤 안함
    if (searchKeyword.trim()) return;

    // 공개 장소만 무한 스크롤 (페이지네이션 지원)
    if (hasMorePublicPlaces && !isLoadingPublicPlaces) {
      await loadPublicPlaces(false);
    }
  }, [searchKeyword, hasMorePublicPlaces, isLoadingPublicPlaces, loadPublicPlaces]);

  // 무한 스크롤 훅
  const { triggerRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: hasMorePublicPlaces && !searchKeyword.trim(),
    isLoading: isLoadingPublicPlaces,
  });

  /**
   * 카테고리 변경 시 공개 장소 다시 로드
   */
  useEffect(() => {
    if (isOpen) {
      loadPublicPlaces(true);
    }
  }, [selectedCategory]);

  /**
   * 표시할 장소 목록 계산
   */
  const displayPlaces = useMemo(() => {
    // 검색 중이면 검색 결과 표시
    if (searchKeyword.trim()) {
      return searchResults;
    }

    // 검색 안하면 내 장소 + 공개 장소 표시
    const myPlacesResults: SearchResult[] = myPlaces.map(p => ({
      id: p.id,
      name: p.name,
      address: p.address,
      category: p.category,
      phone: p.phone,
      latitude: p.latitude,
      longitude: p.longitude,
      url: p.externalUrl,
      externalId: p.externalId,
      isLocal: true,
    }));

    const publicPlacesResults: SearchResult[] = publicPlaces.map(p => ({
      id: p.id,
      name: p.name,
      address: p.address,
      category: p.category,
      latitude: p.latitude,
      longitude: p.longitude,
      externalId: p.externalId,
      isPublic: true,
    }));

    // 중복 제거 (같은 장소가 내 장소와 공개 장소 모두에 있는 경우)
    const combined = deduplicatePlaces([...myPlacesResults, ...publicPlacesResults]);

    // 카테고리 필터 적용
    return selectedCategory
      ? combined.filter(p => p.category === selectedCategory)
      : combined;
  }, [searchKeyword, searchResults, myPlaces, publicPlaces, selectedCategory]);

  /**
   * 제외할 장소 필터링 (이미 목록에 있는 장소)
   */
  const availablePlaces = useMemo(() => {
    return displayPlaces.filter(place => !excludePlaceIds.includes(place.id));
  }, [displayPlaces, excludePlaceIds]);

  /**
   * 지도에 마커 초기 렌더링
   * availablePlaces가 변경될 때만 실행 (전체 재렌더링)
   */
  useEffect(() => {
    if (!markerManagerRef.current || !isLoaded || !isMapExpanded || !map) return;

    // availablePlaces 변경 감지 (장소 ID 세트로 비교)
    const currentPlaceIds = new Set(availablePlaces.map(p => p.id));
    const prevPlaceIds = prevAvailablePlaceIdsRef.current;

    const isPlacesChanged =
      currentPlaceIds.size !== prevPlaceIds.size ||
      ![...currentPlaceIds].every(id => prevPlaceIds.has(id));

    if (!isPlacesChanged) return;

    const renderMarkers = async () => {
      if (!markerManagerRef.current || !map) return;

      // 기존 마커 제거
      markerManagerRef.current.clearMarkers();

      // 모든 장소를 마커로 표시 (병렬 처리)
      await Promise.all(
        availablePlaces.map(async (place) => {
          const isSelected = selectedPlaces.has(place.id);

          // Place 타입으로 변환 (마커 매니저가 요구하는 형식)
          const placeData: Place = {
            id: place.id,
            name: place.name,
            address: place.address,
            category: place.category,
            latitude: place.latitude,
            longitude: place.longitude,
            visited: false,
            createdAt: new Date().toISOString(),
            // 선택된 장소는 customName으로 표시
            customName: isSelected ? `✓ ${place.name}` : undefined,
          };

          await markerManagerRef.current?.addMarker(placeData, (clickedPlace) => {
            // 마커 클릭 시 장소 선택/해제
            setSelectedPlaces(prev => {
              const newSet = new Set(prev);
              if (newSet.has(clickedPlace.id)) {
                newSet.delete(clickedPlace.id);
              } else {
                newSet.add(clickedPlace.id);
              }
              return newSet;
            });
          });
        })
      );

      // 마커가 있으면 전체 마커가 보이도록 지도 범위 조정
      if (availablePlaces.length > 0 && map) {
        const bounds = new google.maps.LatLngBounds();
        availablePlaces.forEach(place => {
          bounds.extend({ lat: place.latitude, lng: place.longitude });
        });
        (map as google.maps.Map).fitBounds(bounds);
      }

      // 현재 장소 ID 세트를 저장
      prevAvailablePlaceIdsRef.current = currentPlaceIds;
    };

    renderMarkers();
  }, [availablePlaces, isLoaded, isMapExpanded, map]);

  /**
   * 선택 상태 변경 시 마커 라벨만 업데이트
   * 깜빡임 없이 부드러운 전환
   */
  useEffect(() => {
    if (!markerManagerRef.current || !isLoaded || !isMapExpanded) return;

    const prevSelected = prevSelectedPlacesRef.current;
    const currentSelected = selectedPlaces;

    // 변경된 장소 찾기
    const changedPlaces = new Set<string>();

    // 새로 선택된 장소
    currentSelected.forEach(id => {
      if (!prevSelected.has(id)) {
        changedPlaces.add(id);
      }
    });

    // 선택 해제된 장소
    prevSelected.forEach(id => {
      if (!currentSelected.has(id)) {
        changedPlaces.add(id);
      }
    });

    // 변경된 장소의 라벨만 업데이트
    changedPlaces.forEach(placeId => {
      const place = availablePlaces.find(p => p.id === placeId);
      if (place) {
        const isSelected = currentSelected.has(placeId);
        const newLabel = isSelected ? `✓ ${place.name}` : undefined;
        markerManagerRef.current?.updateMarkerLabel(placeId, newLabel);
      }
    });

    // 현재 선택 상태 저장
    prevSelectedPlacesRef.current = new Set(currentSelected);
  }, [selectedPlaces, availablePlaces, isLoaded, isMapExpanded]);

  /**
   * 장소 선택/해제
   */
  const togglePlace = useCallback((placeId: string) => {
    setSelectedPlaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  }, []);

  /**
   * 모달 닫기 (초기화)
   */
  const handleClose = () => {
    setSearchKeyword('');
    setSelectedCategory('');
    setSelectedPlaces(new Set());
    setIsMapExpanded(true);
    clearSearch();
    onClose();
  };

  /**
   * 확인 버튼 클릭
   */
  const handleConfirm = async () => {
    if (selectedPlaces.size === 0) return;

    setIsSubmitting(true);
    try {
      // 선택된 장소의 SearchResult 객체 찾기
      const selectedPlaceObjects = availablePlaces.filter(place =>
        selectedPlaces.has(place.id)
      );

      await onConfirm(selectedPlaceObjects);
      handleClose();
    } catch (error) {
      console.error('Failed to add places:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-50"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl bg-card rounded-t-2xl md:rounded-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">장소 추가</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="장소 이름 또는 주소로 검색"
              className="pl-10"
              fullWidth
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="border-b border-border">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Map Section */}
        <div className="border-b border-border">
          <button
            onClick={() => setIsMapExpanded(!isMapExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-foreground">지도</span>
            </div>
            {isMapExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          {isMapExpanded && (
            <div className="h-80 relative bg-muted/20">
              {isOpen ? (
                <>
                  <div id="place-selection-modal-map" className="w-full h-full" />
                  {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                      <div className="text-center">
                        <MapPin className="w-8 h-8 text-primary mx-auto mb-2 animate-pulse" />
                        <p className="text-sm text-muted-foreground">지도 로딩 중...</p>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Places List */}
        <div className="flex-1 overflow-y-auto p-4">
          {availablePlaces.length > 0 ? (
            <div className="space-y-2">
              {availablePlaces.map((place) => {
                const Icon = getCategoryIcon(place.category);
                const isSelected = selectedPlaces.has(place.id);

                return (
                  <button
                    key={place.id}
                    onClick={() => togglePlace(place.id)}
                    className={`w-full p-4 text-left rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-primary-50 border-primary-500'
                        : 'border-border hover:bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-8 h-8 text-primary-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{place.name}</h3>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {place.isLocal && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                내 장소
                              </span>
                            )}
                            {place.isPublic && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                공개
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-muted-foreground truncate">{place.address}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Infinite Scroll Trigger */}
              {!searchKeyword.trim() && hasMorePublicPlaces && (
                <div ref={triggerRef} className="h-10 flex items-center justify-center">
                  {isLoadingPublicPlaces && (
                    <div className="text-sm text-muted-foreground">로딩 중...</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {isSearching ? (
                <p>검색 중...</p>
              ) : searchKeyword.trim() ? (
                <div>
                  <p>검색 결과가 없습니다.</p>
                  <p className="text-sm mt-2">다른 키워드로 검색해보세요.</p>
                </div>
              ) : (
                <div>
                  <p>추가할 수 있는 장소가 없습니다.</p>
                  <p className="text-sm mt-2">먼저 지도에서 장소를 추가해보세요.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 p-6 pt-4 border-t border-border">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedPlaces.size === 0 || isSubmitting}
            className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                추가 중...
              </>
            ) : (
              `추가 (${selectedPlaces.size})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
