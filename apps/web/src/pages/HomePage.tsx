import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, LogIn, UserPlus, X, Plus, User } from 'lucide-react';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import { HTTPError } from 'ky';
import { publicPlacesApi } from '#lib/api';
import type { PublicPlace } from '#types/publicPlace';
import toast from 'react-hot-toast';
import { useGoogleMap } from '#hooks/useGoogleMap';
import { FloatingEmptyNotice } from '#components/ui/FloatingEmptyNotice';
import { useAuth } from '#contexts/AuthContext';
import { createMarkerDataURL } from '#utils/categoryIcons';
import { useDebounce } from '#hooks/useDebounce';
import { useDashboardData } from '#hooks/useDashboardData';
import { CATEGORIES } from '#utils/categoryConfig';

const defaultCenter = { lat: 37.5665, lng: 126.9780 };

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [places, setPlaces] = useState<PublicPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PublicPlace | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [emptyStateType, setEmptyStateType] = useState<'viewport' | 'category' | 'global'>('global');
  const [isLoadingNearest, setIsLoadingNearest] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);

  // 인증 사용자를 위한 대시보드 데이터 (조건부 로딩)
  const { lists, recentPlaces } = useDashboardData();

  const previousViewportRef = useRef<{ neLat: number; neLng: number; swLat: number; swLng: number; category?: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isRateLimitedRef = useRef<boolean>(false);
  const rateLimitTimeoutRef = useRef<number | null>(null);



  const { map, isLoaded, error: mapError } = useGoogleMap('home-map', {
    center: defaultCenter,
    level: 14,
  });

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
      }
    };
  }, []);

  const fetchPlacesByViewport = useCallback(async (params: {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
    category?: string;
  }, skipDuplicateCheck = false) => {
    if (isRateLimitedRef.current) {
      console.log('Rate limited, skipping request');
      return;
    }

    if (!skipDuplicateCheck && previousViewportRef.current) {
      const prev = previousViewportRef.current;
      const isSameViewport =
        Math.abs(prev.neLat - params.neLat) < 0.0001 &&
        Math.abs(prev.neLng - params.neLng) < 0.0001 &&
        Math.abs(prev.swLat - params.swLat) < 0.0001 &&
        Math.abs(prev.swLng - params.swLng) < 0.0001 &&
        prev.category === params.category;

      if (isSameViewport) {
        console.log('Same viewport, skipping request');
        return;
      }
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);

    try {
      const response = await publicPlacesApi.getByViewport(params);

      if (abortController.signal.aborted) {
        return;
      }

      previousViewportRef.current = params;

      setPlaces(response.places);

      if (response.places.length === 0) {
        setShowEmptyState(true);
        setEmptyStateType(params.category ? 'category' : 'viewport');
      } else {
        setShowEmptyState(false);
      }

      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        return;
      }

      const is429Error =
        (typeof error === 'object' && error !== null &&
         ((error as { response?: { status?: number } }).response?.status === 429)) ||
        (error instanceof Error && error.message.includes('429'));

      if (is429Error) {
        console.warn('Rate limited, waiting before next request');

        isRateLimitedRef.current = true;

        if (rateLimitTimeoutRef.current) {
          clearTimeout(rateLimitTimeoutRef.current);
        }
        rateLimitTimeoutRef.current = window.setTimeout(() => {
          isRateLimitedRef.current = false;
          console.log('Rate limit cleared');
        }, 3000);

        if (!isRateLimitedRef.current) {
          toast('지도를 천천히 이동해주세요', { icon: '🗺️', duration: 2000 });
        }

        return;
      }

      console.error('Failed to fetch places:', error);

      // 401 에러는 tokenExpiredEvent가 처리하므로 토스트 제외
      if (error instanceof HTTPError && error.response.status === 401) {
        return;
      }

      if (isInitialLoad) {
        toast.error('장소를 불러오는데 실패했습니다.');
        setShowEmptyState(true);
        setEmptyStateType('viewport');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isInitialLoad]);

  const debouncedFetchPlacesByViewport = useDebounce((params: {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
    category?: string;
  }) => {
    fetchPlacesByViewport(params);
  }, 500);

  useEffect(() => {
    if (!isLoaded || !map || !isInitialLoad) return;

    const initializeMap = async () => {
      try {
        setIsLoading(true);

        let initialPositionSet = false;
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 300000,
                enableHighAccuracy: false,
              });
            });

            const userLoc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(userLoc);
            map.setCenter(userLoc);

            const accuracy = position.coords.accuracy;
            if (accuracy < 100) {
              map.setZoom(15);
            } else if (accuracy < 1000) {
              map.setZoom(13);
            } else {
              map.setZoom(11);
            }

            initialPositionSet = true;
            console.log('User location set:', userLoc);

            await new Promise(resolve => setTimeout(resolve, 100));
            const bounds = map.getBounds();
            if (bounds) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              await fetchPlacesByViewport({
                neLat: ne.lat(),
                neLng: ne.lng(),
                swLat: sw.lat(),
                swLng: sw.lng(),
                category: selectedCategory || undefined,
              }, true);
            }
          } catch (geoError) {
            console.log('Geolocation failed, falling back to places:', geoError);
          }
        }

        if (!initialPositionSet) {
          const response = await publicPlacesApi.getAll({
            limit: 100,
            category: selectedCategory || undefined
          });

          if (response.places.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            response.places.forEach(place => {
              if (place.latitude && place.longitude) {
                bounds.extend({ lat: place.latitude, lng: place.longitude });
              }
            });
            map.fitBounds(bounds);

            await new Promise(resolve => setTimeout(resolve, 100));
            const updatedBounds = map.getBounds();
            if (updatedBounds) {
              const ne = updatedBounds.getNorthEast();
              const sw = updatedBounds.getSouthWest();
              await fetchPlacesByViewport({
                neLat: ne.lat(),
                neLng: ne.lng(),
                swLat: sw.lat(),
                swLng: sw.lng(),
                category: selectedCategory || undefined,
              }, true);
            }
          } else {
            map.setCenter(defaultCenter);
            map.setZoom(14);
            setPlaces([]);
            setShowEmptyState(true);
            setEmptyStateType('global');
          }
        }
      } catch (error) {
        console.error('Failed to initialize map:', error);
        toast.error('지도 초기화에 실패했습니다.');
        setShowEmptyState(true);
        setEmptyStateType('global');
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };

    initializeMap();
  }, [isLoaded, map, isInitialLoad, fetchPlacesByViewport, selectedCategory]);

  useEffect(() => {
    if (!isLoaded || !map || isInitialLoad) return;

    const idleListener = map.addListener('idle', () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      debouncedFetchPlacesByViewport({
        neLat: ne.lat(),
        neLng: ne.lng(),
        swLat: sw.lat(),
        swLng: sw.lng(),
        category: selectedCategory || undefined,
      });
    });

    return () => {
      google.maps.event.removeListener(idleListener);
    };
  }, [isLoaded, map, isInitialLoad, debouncedFetchPlacesByViewport, selectedCategory]);

  useEffect(() => {
    if (!isLoaded || !map || isInitialLoad) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    fetchPlacesByViewport({
      neLat: ne.lat(),
      neLng: ne.lng(),
      swLat: sw.lat(),
      swLng: sw.lng(),
      category: selectedCategory || undefined,
    }, true);
  }, [selectedCategory, isLoaded, map, isInitialLoad, fetchPlacesByViewport]);

  useEffect(() => {
    if (!isLoaded || !map || isLoading) return;

    const createMarkers = async () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }

      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current = [];

      if (places.length === 0) return;

      const { AdvancedMarkerElement } = (await google.maps.importLibrary(
        'marker'
      )) as google.maps.MarkerLibrary;

      const markers = places.map((place) => {
        if (!place.latitude || !place.longitude) return null;

        const iconUrl = createMarkerDataURL(place.category, false);
        const iconElement = document.createElement('img');
        iconElement.src = iconUrl;
        iconElement.style.width = '32px';
        iconElement.style.height = '40px';
        iconElement.style.cursor = 'pointer';

        const marker = new AdvancedMarkerElement({
          position: { lat: place.latitude, lng: place.longitude },
          map: null,
          title: place.name,
          content: iconElement,
        });

        marker.addListener('click', () => {
          setSelectedPlace(place);
        });

        return marker;
      }).filter(Boolean) as google.maps.marker.AdvancedMarkerElement[];

      markersRef.current = markers;

      clustererRef.current = new MarkerClusterer({
        map,
        markers,
        algorithm: new SuperClusterAlgorithm({ radius: 100 }),
      });
    };

    createMarkers().catch((error) => {
      console.error('Failed to create markers:', error);
    });
  }, [places, isLoaded, map, isLoading]);

  const handlePlaceClick = (placeId: string) => {
    navigate(`/explore/places/${placeId}`);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };

  const handleAddPlaceClick = () => {
    if (isAuthenticated) {
      const categoryParam = selectedCategory ? `?category=${selectedCategory}` : '';
      navigate(`/places/new${categoryParam}`);
    } else {
      navigate('/login');
    }
  };

  const handleExploreNearest = async () => {
    if (!userLocation || isLoadingNearest) return;

    setIsLoadingNearest(true);

    try {
      const response = await publicPlacesApi.getNearest({
        lat: userLocation.lat,
        lng: userLocation.lng,
        limit: 1,
      });

      if (response.places.length === 0) {
        toast.error('아직 등록된 장소가 없습니다. 첫 장소를 추가해보세요!');
        return;
      }

      const nearestPlace = response.places[0];
      if (!nearestPlace) {
        toast.error('장소를 찾을 수 없습니다');
        return;
      }

      const distance = nearestPlace.distance;

      const targetLocation = { lat: nearestPlace.latitude, lng: nearestPlace.longitude };
      map?.panTo(targetLocation);
      map?.setZoom(15);

      setSelectedPlace(nearestPlace as PublicPlace);

      toast.success(`${distance.toFixed(1)}km 떨어진 장소를 발견했습니다! 🎯`);
    } catch (error) {
      console.error('Failed to fetch nearest place:', error);
      toast.error('장소를 찾을 수 없습니다');
    } finally {
      setIsLoadingNearest(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Travel Planner</h1>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => navigate('/settings')}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    title={user?.nickname || '프로필'}
                  >
                    <User className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleLoginClick}
                    className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    로그인
                  </button>
                  <button
                    onClick={handleSignupClick}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    회원가입
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            {isAuthenticated ? `환영합니다, ${user?.nickname || '여행자'}님!` : '여행의 모든 순간을 기록하세요'}
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            {isAuthenticated
              ? '나만의 여행 계획을 만들고, 새로운 장소를 탐색해보세요.'
              : '다양한 장소를 탐색하고, 리뷰를 확인해보세요. 로그인하면 나만의 여행 계획을 만들 수 있습니다.'}
          </p>
        </section>

        {/* 인증 사용자 전용: 최근 저장한 장소 */}
        {isAuthenticated && recentPlaces && recentPlaces.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-foreground">최근 저장한 장소</h3>
              <Link
                to="/lists"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentPlaces.slice(0, 3).map((place) => (
                <Link
                  key={place.id}
                  to={`/places/${place.id}`}
                  className="p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold text-foreground mb-1">{place.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">{place.address}</p>
                  {place.category && (
                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-full">
                      {CATEGORIES.find((c) => c.value === place.category)?.label || place.category}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 인증 사용자 전용: 내 목록 미리보기 */}
        {isAuthenticated && lists && lists.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-foreground">내 목록</h3>
              <Link
                to="/lists"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {lists.map((list) => (
                <Link
                  key={list.id}
                  to={`/lists/${list.id}`}
                  className="p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold text-foreground mb-2">{list.name}</h4>
                  {list.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {list.description}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {list.placesCount || 0}개 장소
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Category Filter */}
        <section className="mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">공개 장소 탐색</h3>
          </div>

          <div className="relative">
            <div className="flex gap-1 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mb-2 border-b border-border">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                const categoryValue = category.value === 'all' ? '' : category.value;
                return (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(categoryValue)}
                    className={`
                      relative px-4 py-3 flex items-center gap-2 whitespace-nowrap snap-start flex-shrink-0
                      transition-all duration-200 font-medium
                      ${
                        selectedCategory === categoryValue
                          ? 'text-primary-600'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm md:text-base">{category.label}</span>
                    {selectedCategory === categoryValue && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
          </div>
        </section>

        {/* Map View */}
        <section className="mb-8">
            <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-border bg-muted" style={{ contain: 'layout style paint' }}>
              <div
                id="home-map"
                className="w-full h-full"
              />

              {showEmptyState && !isLoading && isLoaded && !mapError && (
                <FloatingEmptyNotice
                  type={emptyStateType}
                  category={selectedCategory}
                  isAuthenticated={isAuthenticated}
                  onLoginClick={handleLoginClick}
                  onExploreNearest={userLocation ? handleExploreNearest : undefined}
                  isLoadingNearest={isLoadingNearest}
                />
              )}

              {!isLoading && isLoaded && !mapError && !showEmptyState && (
                <button
                  onClick={handleAddPlaceClick}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-primary-500 text-white rounded-full shadow-2xl hover:bg-primary-600 transition-all hover:scale-110 flex items-center justify-center group"
                  title={isAuthenticated ? '장소 추가' : '로그인하고 장소 추가하기'}
                >
                  <Plus className="w-6 h-6" />
                  {!isAuthenticated && (
                    <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      로그인하고 장소 추가하기
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-8 border-transparent border-l-gray-900"></div>
                    </div>
                  )}
                </button>
              )}

              {isLoading && !isInitialLoad && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-150">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-2"></div>
                    <p className="text-muted-foreground">장소를 불러오는 중...</p>
                  </div>
                </div>
              )}

              {mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <div className="text-center p-4">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">{mapError}</p>
                  </div>
                </div>
              )}

              {!isLoaded && !mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-2"></div>
                    <p className="text-muted-foreground">지도 로딩 중...</p>
                  </div>
                </div>
              )}

              {!isLoading && places.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 border border-border">
                  <p className="text-sm font-medium text-foreground">
                    현재 영역 내
                    {selectedCategory && (
                      <span className="text-muted-foreground">
                        {' '}{CATEGORIES.find(c => c.value === selectedCategory)?.label}{' '}
                      </span>
                    )}
                    <span className="text-primary-600 font-bold">{places.length}</span>개 장소
                  </p>
                </div>
              )}

              {selectedPlace && (
                <div className="absolute top-4 right-4 w-96 max-h-[calc(100%-2rem)] bg-white rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col">
                  <div className="flex items-start justify-between p-4 border-b border-border">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground mb-1 truncate">
                        {selectedPlace.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {selectedPlace.address}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-full">
                        {(() => {
                          const category = CATEGORIES.find((c) => c.value === selectedPlace.category);
                          if (category) {
                            const Icon = category.icon;
                            return (
                              <>
                                <Icon className="w-3 h-3" />
                                {category.label}
                              </>
                            );
                          }
                          return selectedPlace.category;
                        })()}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedPlace(null)}
                      className="ml-2 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedPlace.description && (
                      <div className="pb-4 border-b border-border">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedPlace.description}
                        </p>
                      </div>
                    )}

                    {selectedPlace.reviewCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>💬</span>
                        <span>{selectedPlace.reviewCount}명이 이 장소를 기록했습니다</span>
                      </div>
                    )}

                    {selectedPlace.topLabels && selectedPlace.topLabels.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">
                          다른 사용자들은 이렇게 저장했습니다
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedPlace.topLabels.slice(0, 10).map((labelObj, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                            >
                              {labelObj.label}
                              <span className="text-xs text-gray-500">({labelObj.count})</span>
                            </span>
                          ))}
                        </div>
                        {selectedPlace.topLabels.length > 10 && (
                          <button className="mt-2 text-sm text-primary-600 hover:underline">
                            더보기
                          </button>
                        )}
                      </div>
                    )}

                    {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">사진</p>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedPlace.photos.slice(0, 4).map((photo, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={photo}
                                alt={`${selectedPlace.name} ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                        {selectedPlace.photos.length > 4 && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            +{selectedPlace.photos.length - 4}개 더보기
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-border">
                    <button
                      onClick={() => handlePlaceClick(selectedPlace.id)}
                      className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                    >
                      자세히 보기
                    </button>
                  </div>
                </div>
              )}
            </div>
        </section>

        {/* CTA Section (비인증 사용자만) */}
        {!isAuthenticated && (
          <section className="mt-16 bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-4">
              더 많은 기능을 사용해보세요
            </h3>
            <p className="text-lg mb-6 opacity-90">
              나만의 여행 계획을 만들고, 메모를 추가하고, 리뷰를 작성하세요.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleLoginClick}
                className="px-6 py-3 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                로그인
              </button>
              <button
                onClick={handleSignupClick}
                className="px-6 py-3 bg-primary-600 text-white border-2 border-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                회원가입
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
