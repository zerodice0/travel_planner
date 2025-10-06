import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MoreVertical,
  Plus,
  ArrowUpDown,
  Edit2,
  Trash2,
  MapPin,
  X,
  Route as RouteIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { listsApi, placesApi } from '#lib/api';
import type { List, ListPlaceItem } from '#types/list';
import type { Place } from '#types/place';

const CATEGORIES = [
  { value: 'restaurant', label: '음식점', emoji: '🍔' },
  { value: 'cafe', label: '카페', emoji: '☕' },
  { value: 'attraction', label: '관광지', emoji: '🎡' },
  { value: 'accommodation', label: '숙소', emoji: '🏨' },
  { value: 'shopping', label: '쇼핑', emoji: '🛍️' },
  { value: 'culture', label: '문화시설', emoji: '🎭' },
  { value: 'nature', label: '자연', emoji: '🌲' },
  { value: 'etc', label: '기타', emoji: '📍' },
];

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [list, setList] = useState<List | null>(null);
  const [places, setPlaces] = useState<ListPlaceItem[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'order' | 'name'>('order');
  const [showMenu, setShowMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contextMenuPlaceId, setContextMenuPlaceId] = useState<string | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(new Set());
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, sortBy]);

  const fetchData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const [listData, placesData, allPlacesData] = await Promise.all([
        listsApi.getOne(id),
        listsApi.getPlaces(id, sortBy),
        placesApi.getAll({ limit: 100 }),
      ]);

      setList(listData);
      setPlaces(placesData.places);
      setAllPlaces(allPlacesData.places);
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

    // Optimistic update
    setPlaces(
      places.map((p) => (p.id === placeId ? { ...p, visited: newVisited } : p))
    );

    try {
      await placesApi.update(placeId, { visited: newVisited });
      // Refresh to get updated stats
      if (id) {
        const listData = await listsApi.getOne(id);
        setList(listData);
      }
    } catch (error) {
      console.error('Failed to toggle visit:', error);
      // Revert on error
      setPlaces(places.map((p) => (p.id === placeId ? { ...p, visited: !newVisited } : p)));
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

  const handleAddPlaces = async () => {
    if (!id || selectedPlaces.size === 0) return;

    try {
      await listsApi.addPlaces(id, Array.from(selectedPlaces));
      setShowAddModal(false);
      setSelectedPlaces(new Set());
      toast.success(`${selectedPlaces.size}개 장소를 추가했습니다.`);
      fetchData();
    } catch (error) {
      console.error('Failed to add places:', error);
      toast.error('장소 추가에 실패했습니다.');
    }
  };

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

  const getCategoryEmoji = (category: string) => {
    const found = CATEGORIES.find((c) => c.value === category);
    return found?.emoji || '📍';
  };

  const getProgressPercent = () => {
    if (!list || list.placesCount === 0) return 0;
    return Math.round((list.visitedCount / list.placesCount) * 100);
  };

  const availablePlaces = allPlaces.filter(
    (place) => !places.some((p) => p.id === place.id)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">목록을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1 text-center mx-4 truncate">
            {list.name}
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

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* 목록 정보 카드 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-4 mb-4">
            {list.iconType === 'emoji' ? (
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

        {/* 정렬 및 최적화 버튼 */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-lg hover:bg-background transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="text-sm font-medium">
                {sortBy === 'order' ? '순서' : '이름순'}
              </span>
            </button>

            {showSortMenu && (
              <div className="absolute left-0 mt-2 w-32 bg-card rounded-lg shadow-lg border border-border py-1 z-10">
                <button
                  onClick={() => {
                    setSortBy('order');
                    setShowSortMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-background ${
                    sortBy === 'order' ? 'text-primary-600 font-medium' : ''
                  }`}
                >
                  순서
                </button>
                <button
                  onClick={() => {
                    setSortBy('name');
                    setShowSortMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-background ${
                    sortBy === 'name' ? 'text-primary-600 font-medium' : ''
                  }`}
                >
                  이름순
                </button>
              </div>
            )}
          </div>

          {places.length > 1 && (
            <button
              onClick={handleOptimizeRoute}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              <RouteIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isOptimizing ? '최적화 중...' : '경로 최적화'}
              </span>
            </button>
          )}
        </div>

        {/* 장소 리스트 */}
        {places.length > 0 ? (
          <div className="space-y-3">
            {places.map((place) => (
              <div
                key={place.id}
                className="relative bg-card rounded-lg p-4 border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {/* 체크박스 */}
                  <button
                    onClick={() => handleToggleVisit(place.id)}
                    className={`flex-shrink-0 w-6 h-6 border-2 rounded flex items-center justify-center transition-colors ${
                      place.visited
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-input hover:border-primary-500'
                    }`}
                  >
                    {place.visited && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* 장소 정보 */}
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/places/${place.id}`)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getCategoryEmoji(place.category)}</span>
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

      {/* 플로팅 버튼 */}
      {places.length > 0 && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-20 right-6 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-all flex items-center justify-center z-20"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* 장소 추가 모달 */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-card rounded-t-2xl md:rounded-2xl p-6 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">장소 추가</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              {availablePlaces.length > 0 ? (
                <div className="space-y-2">
                  {availablePlaces.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => {
                        const newSelected = new Set(selectedPlaces);
                        if (newSelected.has(place.id)) {
                          newSelected.delete(place.id);
                        } else {
                          newSelected.add(place.id);
                        }
                        setSelectedPlaces(newSelected);
                      }}
                      className={`w-full p-4 text-left rounded-lg border transition-colors ${
                        selectedPlaces.has(place.id)
                          ? 'bg-primary-50 border-primary-500'
                          : 'border-border hover:bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryEmoji(place.category)}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{place.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{place.address}</p>
                        </div>
                        {selectedPlaces.has(place.id) && (
                          <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>추가할 수 있는 장소가 없습니다.</p>
                  <p className="text-sm mt-2">먼저 지도에서 장소를 검색해보세요.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleAddPlaces}
                disabled={selectedPlaces.size === 0}
                className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50"
              >
                추가 ({selectedPlaces.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteDialog && (
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
