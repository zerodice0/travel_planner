import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MoreVertical,
  Plus,
  ArrowUpDown,
  Edit2,
  Trash2,
  MapPin,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { listsApi, placesApi } from '#lib/api';
import type { List, ListPlaceItem } from '#types/list';
import type { SearchResult } from '#types/map';
import type { CreatePlaceData, Place } from '#types/place';
import { getCategoryIcon } from '#utils/categoryConfig';
import { PlaceSelectionModal } from '#components/list/PlaceSelectionModal';
import { useGoogleMap } from '#hooks/useGoogleMap';
import { GoogleMarkerManager } from '#utils/GoogleMarkerManager';
import { injectMarkerStyles } from '#components/map/CustomMarker';
import { BottomSheet, type BottomSheetState } from '#components/ui/BottomSheet';

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [list, setList] = useState<List | null>(null);
  const [places, setPlaces] = useState<ListPlaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'distance'>('order');
  const [showMenu, setShowMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contextMenuPlaceId, setContextMenuPlaceId] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // 맵 관련 상태
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const markerManagerRef = useRef<GoogleMarkerManager | null>(null);

  // 모바일 하단 시트 상태
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(true);
  const [bottomSheetState, setBottomSheetState] = useState<BottomSheetState>('half');

  // 맵 중심 좌표 계산 (첫 번째 장소 또는 기본값)
  const defaultCenter = places.length > 0 && places[0]
    ? { lat: places[0].latitude, lng: places[0].longitude }
    : { lat: 37.5665, lng: 126.978 }; // Seoul City Hall

  // Google Map 초기화
  const {
    map,
    isLoaded,
    error: mapError,
  } = useGoogleMap('list-detail-map-container', {
    center: defaultCenter,
    level: 14,
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, sortBy]);

  // 맵 초기화 및 마커 매니저 생성
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
    };
  }, [map, isLoaded]);

  // 장소 목록 변경 시 마커 및 경로 재렌더링
  useEffect(() => {
    if (markerManagerRef.current && isLoaded && places.length > 0) {
      renderPlaceMarkers();
      renderPolyline();
    }
  }, [places, isLoaded]);

  const fetchData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const [listData, placesData] = await Promise.all([
        listsApi.getOne(id),
        listsApi.getPlaces(id, sortBy),
      ]);

      setList(listData);
      setPlaces(placesData.places);
    } catch (error) {
      console.error('Failed to fetch list:', error);
      toast.error('목록 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisit = async (placeId: string) => {
    const place = places.find((p) => p.id === placeId);
    if (!place) return;

    const newVisited = !place.visited;

    // Optimistic update - 리스트 UI
    setPlaces(
      places.map((p) => (p.id === placeId ? { ...p, visited: newVisited } : p))
    );

    // Optimistic update - 맵 마커
    if (markerManagerRef.current) {
      const updatedPlace = convertToPlace({ ...place, visited: newVisited });
      await markerManagerRef.current.updateMarker(updatedPlace);
    }

    try {
      await placesApi.update(placeId, { visited: newVisited });
      // Refresh to get updated stats
      if (id) {
        const listData = await listsApi.getOne(id);
        setList(listData);
      }
    } catch (error) {
      console.error('Failed to toggle visit:', error);
      // Revert on error - 리스트
      setPlaces(places.map((p) => (p.id === placeId ? { ...p, visited: !newVisited } : p)));
      // Revert on error - 맵
      if (markerManagerRef.current) {
        const revertedPlace = convertToPlace({ ...place, visited: !newVisited });
        await markerManagerRef.current.updateMarker(revertedPlace);
      }
      toast.error('방문 상태 변경에 실패했습니다.');
    }
  };

  const handleRemovePlace = async (placeId: string) => {
    if (!id) return;

    try {
      await listsApi.removePlace(id, placeId);
      setPlaces(places.filter((p) => p.id !== placeId));
      setContextMenuPlaceId(null);

      // Refresh list stats
      const listData = await listsApi.getOne(id);
      setList(listData);

      toast.success('목록에서 제거했습니다.');
    } catch (error) {
      console.error('Failed to remove place:', error);
      toast.error('장소 제거에 실패했습니다.');
    }
  };

  /**
   * 장소 추가 처리
   * 공개 장소는 먼저 "내 장소"로 저장한 후 목록에 추가
   */
  const handleAddPlaces = async (selectedPlaceResults: SearchResult[]) => {
    if (!id || selectedPlaceResults.length === 0) return;

    try {
      const placeIds: string[] = [];

      // 공개 장소와 내 장소를 분리
      const publicPlaces = selectedPlaceResults.filter(p => p.isPublic);
      const myPlaces = selectedPlaceResults.filter(p => p.isLocal);

      // 내 장소 ID 추가
      placeIds.push(...myPlaces.map(p => p.id));

      // 공개 장소를 먼저 "내 장소"로 저장
      for (const publicPlace of publicPlaces) {
        try {
          const createData: CreatePlaceData = {
            name: publicPlace.name,
            address: publicPlace.address,
            latitude: publicPlace.latitude,
            longitude: publicPlace.longitude,
            category: publicPlace.category,
            phone: publicPlace.phone,
          };

          const newPlace = await placesApi.create(createData);
          placeIds.push(newPlace.id);
        } catch (error) {
          console.error(`Failed to create place ${publicPlace.name}:`, error);
          toast.error(`"${publicPlace.name}" 추가에 실패했습니다.`);
        }
      }

      // 모든 장소를 목록에 추가
      if (placeIds.length > 0) {
        await listsApi.addPlaces(id, placeIds);
        toast.success(`${placeIds.length}개 장소를 추가했습니다.`);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to add places:', error);
      toast.error('장소 추가에 실패했습니다.');
    }
  };

  // ListPlaceItem을 Place로 변환하는 헬퍼 함수
  const convertToPlace = useCallback((place: ListPlaceItem): Place => ({
    id: place.id,
    name: place.name,
    address: place.address,
    category: place.category,
    latitude: place.latitude,
    longitude: place.longitude,
    visited: place.visited,
    createdAt: new Date().toISOString(),
  }), []);

  // 마커 렌더링 함수
  const renderPlaceMarkers = useCallback(async () => {
    if (!markerManagerRef.current) return;

    markerManagerRef.current.clearMarkers();

    // 마커 추가
    await Promise.all(
      places.map((place) => {
        const placeData = convertToPlace(place);
        return markerManagerRef.current?.addMarker(placeData, (clickedPlace) => {
          handleMarkerClick(clickedPlace.id);
        });
      })
    );
  }, [places, convertToPlace]);

  // 경로 렌더링 함수
  const renderPolyline = useCallback(() => {
    if (!markerManagerRef.current || places.length < 2) {
      markerManagerRef.current?.clearPolyline();
      return;
    }

    const placesData = places.map(convertToPlace);
    markerManagerRef.current.renderPolyline(placesData);
  }, [places, convertToPlace]);

  // 마커 클릭 핸들러 (맵 → 리스트)
  const handleMarkerClick = useCallback((placeId: string) => {
    setSelectedPlaceId(placeId);

    // 리스트에서 해당 항목으로 스크롤
    const element = document.getElementById(`place-item-${placeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // 리스트 항목 클릭 핸들러 (리스트 → 맵)
  const handlePlaceCardClick = useCallback((place: ListPlaceItem) => {
    if (!markerManagerRef.current) return;

    // 맵 이동
    markerManagerRef.current.panTo(place.latitude, place.longitude);
    markerManagerRef.current.setZoom(17);

    // InfoWindow 표시
    markerManagerRef.current.showInfoWindow(place.id);

    // 선택 상태 설정
    setSelectedPlaceId(place.id);
  }, []);

  const handleOptimizeRoute = async () => {
    if (!id) return;

    // Get current location
    if (!navigator.geolocation) {
      toast.error('위치 서비스를 사용할 수 없습니다.');
      return;
    }

    setIsOptimizing(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const result = await listsApi.optimizeRoute(
        id,
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        false
      );

      // Apply optimized order
      const orderMap = new Map(result.optimizedOrder.map((item) => [item.placeId, item.order]));
      const reorderedPlaces = [...places].sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? a.order;
        const orderB = orderMap.get(b.id) ?? b.order;
        return orderA - orderB;
      });

      setPlaces(reorderedPlaces);

      // Update order on server
      await listsApi.reorderPlaces(
        id,
        result.optimizedOrder.map((item) => ({ placeId: item.placeId, order: item.order }))
      );

      toast.success(
        `경로를 최적화했습니다. 총 ${(result.totalDistance / 1000).toFixed(1)}km, 약 ${result.estimatedTime}분 소요 예상`
      );
    } catch (error) {
      console.error('Failed to optimize route:', error);
      toast.error('경로 최적화에 실패했습니다.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDeleteList = async () => {
    if (!id) return;

    try {
      await listsApi.delete(id);
      toast.success('목록을 삭제했습니다.');
      navigate('/lists');
    } catch (error) {
      console.error('Failed to delete list:', error);
      toast.error('목록 삭제에 실패했습니다.');
    }
  };

  const getProgressPercent = () => {
    if (!list || list.placesCount === 0) return 0;
    return Math.round((list.visitedCount / list.placesCount) * 100);
  };

  // 이미 목록에 있는 장소 ID 목록
  const excludePlaceIds = places.map(p => p.id);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-background flex items-center justify-center">
          <div className="text-muted-foreground">로딩 중...</div>
        </div>
      )}

      {/* Error Overlay (List Not Found) */}
      {!list && !isLoading && (
        <div className="absolute inset-0 z-50 bg-background flex items-center justify-center">
          <div className="text-muted-foreground">목록을 찾을 수 없습니다.</div>
        </div>
      )}

      {/* Header */}
      <header className="flex-shrink-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1 text-center mx-4 truncate">
            {list?.name || '로딩 중...'}
          </h1>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-1">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate(`/lists/${id}/edit`);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-background flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  목록 편집
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteDialog(true);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-background text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  목록 삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: Split View (Desktop) / Map + Bottom Sheet (Mobile) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* 데스크톱: 좌측 리스트 영역 / 모바일: 하단시트에 포함 */}
        {list && (
          <div className="hidden md:block md:w-2/5 overflow-y-auto p-4 space-y-4 bg-background">
        {/* 목록 정보 카드 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-4 mb-4">
            {list.iconType === 'category' ? (
              (() => {
                const Icon = getCategoryIcon(list.iconValue);
                return <Icon className="w-16 h-16 text-primary-600" />;
              })()
            ) : list.iconType === 'emoji' ? (
              <span className="text-5xl">{list.iconValue}</span>
            ) : (
              <img
                src={list.iconValue}
                alt={list.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{list.name}</h2>
              {list.description && (
                <p className="text-muted-foreground text-sm mt-1">{list.description}</p>
              )}
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-3 mb-3">
            <div
              className="bg-primary-500 h-3 rounded-full transition-all"
              style={{ width: `${getProgressPercent()}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {list.placesCount}개 장소 · {list.visitedCount}/{list.placesCount} 방문
            </span>
            <span className="text-primary-600 font-semibold">{getProgressPercent()}% 완료</span>
          </div>
        </section>

        {/* 정렬 드롭다운 */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-lg hover:bg-background transition-colors disabled:opacity-50"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isOptimizing ? '최적화 중...' :
                  sortBy === 'order' ? '추가한 순서' :
                  sortBy === 'name' ? '이름순 (가나다)' :
                  '거리순 (가까운 곳부터)'}
              </span>
            </button>

            {showSortMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border py-1 z-10">
                <button
                  onClick={() => {
                    setSortBy('order');
                    setShowSortMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-background transition-colors ${
                    sortBy === 'order' ? 'text-primary-600 font-medium' : ''
                  }`}
                >
                  추가한 순서
                </button>
                <button
                  onClick={() => {
                    setSortBy('name');
                    setShowSortMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-background transition-colors ${
                    sortBy === 'name' ? 'text-primary-600 font-medium' : ''
                  }`}
                >
                  이름순 (가나다)
                </button>
                {places.length > 1 && (
                  <button
                    onClick={async () => {
                      setShowSortMenu(false);
                      setSortBy('distance');
                      await handleOptimizeRoute();
                    }}
                    disabled={isOptimizing}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-background transition-colors flex items-center gap-2 ${
                      sortBy === 'distance' ? 'text-primary-600 font-medium' : ''
                    } disabled:opacity-50`}
                  >
                    <MapPin className="w-4 h-4" />
                    거리순 (가까운 곳부터)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 장소 리스트 */}
        {places.length > 0 ? (
          <div className="space-y-3">
            {places.map((place) => (
              <div
                id={`place-item-${place.id}`}
                key={place.id}
                className={`relative bg-card rounded-lg p-4 border transition-all ${
                  selectedPlaceId === place.id
                    ? 'border-primary-500 shadow-lg ring-2 ring-primary-200'
                    : 'border-border hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 방문 상태 배지 */}
                  <button
                    onClick={() => handleToggleVisit(place.id)}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                      place.visited
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {place.visited ? (
                      <>
                        <Check className="w-3 h-3" />
                        방문 완료
                      </>
                    ) : (
                      <>방문 예정</>
                    )}
                  </button>

                  {/* 장소 정보 */}
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handlePlaceCardClick(place)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {(() => {
                        const Icon = getCategoryIcon(place.category);
                        return <Icon className="w-5 h-5 text-muted-foreground" />;
                      })()}
                      <h3
                        className={`font-semibold ${
                          place.visited ? 'text-muted-foreground line-through' : 'text-foreground'
                        }`}
                      >
                        {place.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{place.address}</span>
                    </div>
                  </div>

                  {/* 더보기 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuPlaceId(contextMenuPlaceId === place.id ? null : place.id);
                    }}
                    className="flex-shrink-0 p-1 hover:bg-muted rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {/* 컨텍스트 메뉴 */}
                  {contextMenuPlaceId === place.id && (
                    <div
                      className="absolute top-12 right-4 w-40 bg-card rounded-lg shadow-lg border border-border py-1 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          navigate(`/places/${place.id}`);
                          setContextMenuPlaceId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-background"
                      >
                        장소 상세
                      </button>
                      <button
                        onClick={() => handleRemovePlace(place.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-background text-red-600"
                      >
                        목록에서 제거
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">아직 추가된 장소가 없습니다.</p>
            <p className="text-sm text-muted-foreground mb-6">첫 장소를 추가해보세요!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              장소 추가
            </button>
          </div>
        )}
        </div>
        )}
        {/* 데스크톱 리스트 영역 끝 */}

        {/* 맵 영역 (모바일: 전체화면, 데스크톱: 우측 60%) */}
        <div className="absolute md:relative inset-0 md:flex-1 bg-muted z-0">
          {!isLoaded && !mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                <p className="text-muted-foreground">구글맵을 불러오는 중...</p>
              </div>
            </div>
          )}
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <div className="text-center p-6">
                <MapPin className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <p className="text-red-600 text-sm">{mapError}</p>
              </div>
            </div>
          )}
          <div id="list-detail-map-container" className="w-full h-full" />
        </div>

        {/* 모바일: 하단 시트 (리스트 내용) */}
        {list && (
          <BottomSheet
            isOpen={isBottomSheetOpen}
            onClose={() => setIsBottomSheetOpen(false)}
            title={`${list.name} (${places.length})`}
            state={bottomSheetState}
            onStateChange={setBottomSheetState}
            collapsedHeight={80}
            halfHeight={400}
          >
          <div className="p-4 space-y-4">
            {/* 목록 정보 카드 */}
            <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center gap-4 mb-4">
                {list.iconType === 'category' ? (
                  (() => {
                    const Icon = getCategoryIcon(list.iconValue);
                    return <Icon className="w-16 h-16 text-primary-600" />;
                  })()
                ) : list.iconType === 'emoji' ? (
                  <span className="text-5xl">{list.iconValue}</span>
                ) : (
                  <img
                    src={list.iconValue}
                    alt={list.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground">{list.name}</h2>
                  {list.description && (
                    <p className="text-muted-foreground text-sm mt-1">{list.description}</p>
                  )}
                </div>
              </div>

              <div className="w-full bg-muted rounded-full h-3 mb-3">
                <div
                  className="bg-primary-500 h-3 rounded-full transition-all"
                  style={{ width: `${getProgressPercent()}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {list.placesCount}개 장소 · {list.visitedCount}/{list.placesCount} 방문
                </span>
                <span className="text-primary-600 font-semibold">{getProgressPercent()}% 완료</span>
              </div>
            </section>

            {/* 정렬 드롭다운 */}
            <div className="flex items-center justify-between">
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  disabled={isOptimizing}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-lg hover:bg-background transition-colors disabled:opacity-50"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isOptimizing ? '최적화 중...' :
                      sortBy === 'order' ? '추가한 순서' :
                      sortBy === 'name' ? '이름순 (가나다)' :
                      '거리순 (가까운 곳부터)'}
                  </span>
                </button>

                {showSortMenu && (
                  <div className="absolute left-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border py-1 z-10">
                    <button
                      onClick={() => {
                        setSortBy('order');
                        setShowSortMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-background transition-colors ${
                        sortBy === 'order' ? 'text-primary-600 font-medium' : ''
                      }`}
                    >
                      추가한 순서
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('name');
                        setShowSortMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-background transition-colors ${
                        sortBy === 'name' ? 'text-primary-600 font-medium' : ''
                      }`}
                    >
                      이름순 (가나다)
                    </button>
                    {places.length > 1 && (
                      <button
                        onClick={async () => {
                          setShowSortMenu(false);
                          setSortBy('distance');
                          await handleOptimizeRoute();
                        }}
                        disabled={isOptimizing}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-background transition-colors flex items-center gap-2 ${
                          sortBy === 'distance' ? 'text-primary-600 font-medium' : ''
                        } disabled:opacity-50`}
                      >
                        <MapPin className="w-4 h-4" />
                        거리순 (가까운 곳부터)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 장소 리스트 */}
            {places.length > 0 ? (
              <div className="space-y-3">
                {places.map((place) => (
                  <div
                    id={`place-item-${place.id}`}
                    key={place.id}
                    className={`relative bg-card rounded-lg p-4 border transition-all ${
                      selectedPlaceId === place.id
                        ? 'border-primary-500 shadow-lg ring-2 ring-primary-200'
                        : 'border-border hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 방문 상태 배지 */}
                      <button
                        onClick={() => handleToggleVisit(place.id)}
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                          place.visited
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {place.visited ? (
                          <>
                            <Check className="w-3 h-3" />
                            방문 완료
                          </>
                        ) : (
                          <>방문 예정</>
                        )}
                      </button>

                      {/* 장소 정보 */}
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handlePlaceCardClick(place)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {(() => {
                            const Icon = getCategoryIcon(place.category);
                            return <Icon className="w-5 h-5 text-muted-foreground" />;
                          })()}
                          <h3
                            className={`font-semibold ${
                              place.visited ? 'text-muted-foreground line-through' : 'text-foreground'
                            }`}
                          >
                            {place.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{place.address}</span>
                        </div>
                      </div>

                      {/* 더보기 버튼 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenuPlaceId(contextMenuPlaceId === place.id ? null : place.id);
                        }}
                        className="flex-shrink-0 p-1 hover:bg-muted rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {/* 컨텍스트 메뉴 */}
                      {contextMenuPlaceId === place.id && (
                        <div
                          className="absolute top-12 right-4 w-40 bg-card rounded-lg shadow-lg border border-border py-1 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              navigate(`/places/${place.id}`);
                              setContextMenuPlaceId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-background"
                          >
                            장소 상세
                          </button>
                          <button
                            onClick={() => handleRemovePlace(place.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-background text-red-600"
                          >
                            목록에서 제거
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">아직 추가된 장소가 없습니다.</p>
                <p className="text-sm text-muted-foreground mb-6">첫 장소를 추가해보세요!</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  장소 추가
                </button>
              </div>
            )}
          </div>
        </BottomSheet>
        )}
      </div>
      {/* Main Content 끝 */}

      {/* 플로팅 버튼 (하단 시트 위에 표시) */}
      {places.length > 0 && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-20 right-6 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-all flex items-center justify-center z-[60] md:z-20"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* 장소 추가 모달 */}
      <PlaceSelectionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={handleAddPlaces}
        excludePlaceIds={excludePlaceIds}
      />

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteDialog && list && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">목록 삭제</h3>
            <p className="text-muted-foreground mb-4">
              '{list.name}'을(를) 삭제하시겠습니까?
              <br />
              <span className="text-sm text-muted-foreground">목록 내 장소는 삭제되지 않습니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteList}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
