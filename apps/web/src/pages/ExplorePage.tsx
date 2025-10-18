import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, LogIn, UserPlus, X, Plus } from 'lucide-react';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import { publicPlacesApi } from '#lib/api';
import type { PublicPlace } from '#types/publicPlace';
import toast from 'react-hot-toast';
import { useGoogleMap } from '#hooks/useGoogleMap';
import { FloatingEmptyNotice } from '#components/ui/FloatingEmptyNotice';
import { useAuth } from '#contexts/AuthContext';
import { createMarkerDataURL } from '#utils/categoryIcons';
import { useDebounce } from '#hooks/useDebounce';

import { CATEGORIES } from '#utils/categoryConfig';

export default function ExplorePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [places, setPlaces] = useState<PublicPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PublicPlace | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // 첫 로드 여부
  const [showEmptyState, setShowEmptyState] = useState(false); // Empty state 표시 여부
  const [emptyStateType, setEmptyStateType] = useState<'viewport' | 'category' | 'global'>('global'); // Empty state 타입
  const [isLoadingNearest, setIsLoadingNearest] = useState(false); // 가장 가까운 장소 로딩
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null); // 현재 사용자 위치
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);

  // 중복 요청 방지를 위한 이전 viewport 저장
  const previousViewportRef = useRef<{ neLat: number; neLng: number; swLat: number; swLng: number; category?: string } | null>(null);

  // 요청 취소를 위한 AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  // Rate limit 상태 추적
  const isRateLimitedRef = useRef<boolean>(false);
  const rateLimitTimeoutRef = useRef<number | null>(null);

  // 서울 시청 좌표를 기본 중심으로 설정
  const defaultCenter = { lat: 37.5665, lng: 126.9780 };

  // 구글맵 초기화 (Explore 페이지는 전 세계 지원을 위해 구글맵만 사용)
  const { map, isLoaded, error: mapError } = useGoogleMap('explore-map', {
    center: defaultCenter,
    level: 14,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear rate limit timeout
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
      }
    };
  }, []);

  // Viewport 기반 장소 조회 함수
  const fetchPlacesByViewport = useCallback(async (params: {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
    category?: string;
  }, skipDuplicateCheck = false) => {
    // Rate limit 중이면 요청하지 않음
    if (isRateLimitedRef.current) {
      console.log('Rate limited, skipping request');
      return;
    }

    // 중복 요청 방지: 이전 viewport와 동일한지 확인 (소수점 4자리까지 비교)
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

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새 AbortController 생성
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);

    try {
      const response = await publicPlacesApi.getByViewport(params);

      // 요청이 취소되었는지 확인
      if (abortController.signal.aborted) {
        return;
      }

      // viewport 저장
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
      // 취소된 요청은 무시
      if (abortController.signal.aborted) {
        return;
      }

      // Type-safe error handling
      const is429Error =
        (typeof error === 'object' && error !== null &&
         ((error as { response?: { status?: number } }).response?.status === 429)) ||
        (error instanceof Error && error.message.includes('429'));

      // 429 에러는 조용히 처리
      if (is429Error) {
        console.warn('Rate limited, waiting before next request');

        // Rate limit 플래그 설정
        isRateLimitedRef.current = true;

        // 3초 후 rate limit 해제
        if (rateLimitTimeoutRef.current) {
          clearTimeout(rateLimitTimeoutRef.current);
        }
        rateLimitTimeoutRef.current = window.setTimeout(() => {
          isRateLimitedRef.current = false;
          console.log('Rate limit cleared');
        }, 3000);

        // 사용자에게 부드러운 안내 (한 번만)
        if (!isRateLimitedRef.current) {
          toast('지도를 천천히 이동해주세요', { icon: '🗺️', duration: 2000 });
        }

        return;
      }

      // 다른 에러는 로그만 남기고 조용히 처리 (초기 로드가 아닌 경우)
      console.error('Failed to fetch places:', error);

      if (isInitialLoad) {
        // 초기 로드 실패는 사용자에게 알림
        toast.error('장소를 불러오는데 실패했습니다.');
        setShowEmptyState(true);
        setEmptyStateType('viewport');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isInitialLoad]);

  // Debounced fetch function (500ms delay)
  const debouncedFetchPlacesByViewport = useDebounce((params: {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
    category?: string;
  }) => {
    fetchPlacesByViewport(params);
  }, 500);

  // 초기 로드 시: Geolocation → viewport 쿼리 OR 전체 장소 조회 → fallback 순서
  useEffect(() => {
    if (!isLoaded || !map || !isInitialLoad) return;

    const initializeMap = async () => {
      try {
        setIsLoading(true);

        // 1. Geolocation 시도 (5초 타임아웃)
        let initialPositionSet = false;
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 300000, // 5분 캐시
                enableHighAccuracy: false, // 빠른 응답 우선
              });
            });

            // 사용자 위치로 지도 이동
            const userLoc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(userLoc);
            map.setCenter(userLoc);
            
            // 정확도에 따라 줌 레벨 조정
            const accuracy = position.coords.accuracy;
            if (accuracy < 100) {
              map.setZoom(15); // 매우 정확 - 가까이
            } else if (accuracy < 1000) {
              map.setZoom(13); // 보통 정확 - 중간
            } else {
              map.setZoom(11); // 낮은 정확도 - 멀리
            }
            
            initialPositionSet = true;
            console.log('User location set:', userLocation);

            // Geolocation 성공 시 viewport 쿼리 즉시 실행
            // 지도 렌더링 완료 대기
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

        // 2. Geolocation 실패 시에만 전체 장소 조회 (fitBounds용)
        if (!initialPositionSet) {
          const response = await publicPlacesApi.getAll({
            limit: 100,
            category: selectedCategory || undefined
          });

          if (response.places.length > 0) {
            // 장소가 있으면 fitBounds 사용
            const bounds = new google.maps.LatLngBounds();
            response.places.forEach(place => {
              if (place.latitude && place.longitude) {
                bounds.extend({ lat: place.latitude, lng: place.longitude });
              }
            });
            map.fitBounds(bounds);

            // fitBounds 후 viewport 쿼리 실행
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
            // 3. 장소가 없으면 Seoul City Hall fallback
            map.setCenter(defaultCenter);
            map.setZoom(14);
            setPlaces([]);
            setShowEmptyState(true);
            setEmptyStateType('global'); // 전역적으로 장소가 없음
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

  // 지도 이동/줌 완료 시 viewport 기반 장소 조회 (초기 로드 이후)
  useEffect(() => {
    if (!isLoaded || !map || isInitialLoad) return;

    const idleListener = map.addListener('idle', () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      // Debounced fetch (500ms delay)
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

  // 카테고리 변경 시 즉시 viewport 기반 재조회 (debounce 없이)
  useEffect(() => {
    if (!isLoaded || !map || isInitialLoad) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // 카테고리 변경은 즉시 실행 (skipDuplicateCheck = true)
    fetchPlacesByViewport({
      neLat: ne.lat(),
      neLng: ne.lng(),
      swLat: sw.lat(),
      swLng: sw.lng(),
      category: selectedCategory || undefined,
    }, true);
  }, [selectedCategory, isLoaded, map, isInitialLoad, fetchPlacesByViewport]);

  // 심플 마커 + 클러스터링
  useEffect(() => {
    if (!isLoaded || !map || isLoading) return;

    const createMarkers = async () => {
      // 기존 클러스터러 제거
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }

      // 기존 마커 제거
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current = [];

      // 장소가 없으면 종료
      if (places.length === 0) return;

      const { AdvancedMarkerElement } = (await google.maps.importLibrary(
        'marker'
      )) as google.maps.MarkerLibrary;

      // 심플 마커 생성 (아이콘만)
      const markers = places.map((place) => {
        if (!place.latitude || !place.longitude) return null;

        const iconUrl = createMarkerDataURL(place.category, false);
        const iconElement = document.createElement('img');
        iconElement.src = iconUrl;
        iconElement.style.width = '32px';  // 더 작게
        iconElement.style.height = '40px';
        iconElement.style.cursor = 'pointer';

        const marker = new AdvancedMarkerElement({
          position: { lat: place.latitude, lng: place.longitude },
          map: null,  // 클러스터러가 관리
          title: place.name,  // 호버 시 툴팁
          content: iconElement,
        });

        marker.addListener('click', () => {
          setSelectedPlace(place);  // 사이드 패널용
        });

        return marker;
      }).filter(Boolean) as google.maps.marker.AdvancedMarkerElement[];

      markersRef.current = markers;

      // 마커 클러스터링 적용
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
      // 로그인 사용자: 장소 추가 페이지로 이동 (선택된 카테고리가 있으면 쿼리 파라미터로 전달)
      const categoryParam = selectedCategory ? `?category=${selectedCategory}` : '';
      navigate(`/places/new${categoryParam}`);
    } else {
      // 비로그인 사용자: 로그인 페이지로 이동
      navigate('/login');
    }
  };

  // 등록된 장소 중 가장 가까운 곳으로 이동
  const handleExploreNearest = async () => {
    if (!userLocation || isLoadingNearest) return;

    setIsLoadingNearest(true);

    try {
      const response = await publicPlacesApi.getNearest({
        lat: userLocation.lat,
        lng: userLocation.lng,
        // 카테고리 필터 제거 - 모든 등록된 장소 중 가장 가까운 곳을 찾음
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

      // 지도 이동
      const targetLocation = { lat: nearestPlace.latitude, lng: nearestPlace.longitude };
      map?.panTo(targetLocation);
      map?.setZoom(15); // 더 가까이 보기

      // 선택된 장소 표시 (사이드 패널에서 볼 수 있도록)
      setSelectedPlace(nearestPlace as PublicPlace);

      // 토스트 알림
      toast.success(`${distance.toFixed(1)}km 떨어진 장소를 발견했습니다! 🎯`);
    } catch (error) {
      console.error('Failed to fetch nearest place:', error);
      toast.error('장소를 찾을 수 없습니다');
    } finally {
      setIsLoadingNearest(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with CTA */}
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
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            여행의 모든 순간을 기록하세요
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            다양한 장소를 탐색하고, 리뷰를 확인해보세요. <br />
            로그인하면 나만의 여행 계획을 만들 수 있습니다.
          </p>
        </section>

        {/* Category Filter */}
        <section className="mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">카테고리</h3>
          </div>

          {/* 탭 스타일 카테고리 (모바일 & 데스크톱 공통) */}
          <div className="relative">
            <div className="flex gap-1 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mb-2 border-b border-border">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                // 'all' 카테고리는 빈 문자열로 매핑
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

            {/* 스크롤 힌트 그라디언트 */}
            <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
          </div>
        </section>

        {/* Map View */}
        <section className="mb-8">
            <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-border bg-muted" style={{ contain: 'layout style paint' }}>
              {/* 지도 컨테이너 - 항상 표시 */}
              <div
                id="explore-map"
                className="w-full h-full"
              />

              {/* Floating Empty Notice - 작고 덜 침입적 */}
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

              {/* Floating Action Button - 우측 중앙 (구글맵 컨트롤 피함) */}
              {/* 장소가 있을 때만 표시 (FloatingEmptyNotice와 중복 방지) */}
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

              {/* 로딩 중 오버레이 - 카테고리 변경 시 즉시 표시, 지도 완전히 가림 */}
              {isLoading && !isInitialLoad && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-150">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-2"></div>
                    <p className="text-muted-foreground">장소를 불러오는 중...</p>
                  </div>
                </div>
              )}

              {/* 에러 상태 */}
              {mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <div className="text-center p-4">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">{mapError}</p>
                  </div>
                </div>
              )}

              {/* 초기 로딩 */}
              {!isLoaded && !mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-2"></div>
                    <p className="text-muted-foreground">지도 로딩 중...</p>
                  </div>
                </div>
              )}

              {/* 장소 수 정보 패널 - 좌측 하단 (구글맵 컨트롤 피함) */}
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

              {/* 사이드 패널 */}
              {selectedPlace && (
                <div className="absolute top-4 right-4 w-96 max-h-[calc(100%-2rem)] bg-white rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col">
                  {/* 헤더 */}
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

                  {/* 스크롤 가능 영역 */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* 설명 섹션 */}
                    {selectedPlace.description && (
                      <div className="pb-4 border-b border-border">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedPlace.description}
                        </p>
                      </div>
                    )}

                    {/* 리뷰 수 */}
                    {selectedPlace.reviewCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>💬</span>
                        <span>{selectedPlace.reviewCount}명이 이 장소를 기록했습니다</span>
                      </div>
                    )}

                    {/* 커스텀 라벨 */}
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

                    {/* 사진 그리드 */}
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

                  {/* 하단 버튼 */}
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

        {/* CTA Section */}
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
      </div>
    </div>
  );
}
