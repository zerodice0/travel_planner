import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /**
   * 더 많은 데이터를 로드하는 콜백 함수
   */
  onLoadMore: () => Promise<void> | void;

  /**
   * 더 로드할 데이터가 있는지 여부
   */
  hasMore: boolean;

  /**
   * 현재 로딩 중인지 여부
   */
  isLoading: boolean;

  /**
   * Intersection Observer 트리거 임계값 (0~1)
   * @default 0.5
   */
  threshold?: number;

  /**
   * Intersection Observer 루트 마진
   * @default '0px'
   */
  rootMargin?: string;
}

/**
 * 무한 스크롤 커스텀 훅
 *
 * Intersection Observer API를 사용하여 스크롤 끝에 도달했을 때
 * 자동으로 더 많은 데이터를 로드합니다.
 *
 * @example
 * ```tsx
 * const { triggerRef } = useInfiniteScroll({
 *   onLoadMore: loadMorePlaces,
 *   hasMore: hasMorePlaces,
 *   isLoading: isLoadingMore,
 * });
 *
 * return (
 *   <div>
 *     {places.map(place => <PlaceItem key={place.id} place={place} />)}
 *     <div ref={triggerRef} />
 *     {isLoadingMore && <Loading />}
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll(options: UseInfiniteScrollOptions) {
  const { onLoadMore, hasMore, isLoading, threshold = 0.5, rootMargin = '0px' } = options;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Intersection Observer 콜백
   * 트리거 엘리먼트가 뷰포트에 들어오면 onLoadMore 호출
   */
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      // 교차 중이고, 로딩 중이 아니며, 더 로드할 데이터가 있을 때
      if (entry && entry.isIntersecting && !isLoading && hasMore) {
        onLoadMore();
      }
    },
    [onLoadMore, isLoading, hasMore],
  );

  useEffect(() => {
    const currentTrigger = triggerRef.current;

    if (!currentTrigger) return;

    // Intersection Observer 생성
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    // 관찰 시작
    observerRef.current.observe(currentTrigger);

    // 클린업
    return () => {
      if (observerRef.current && currentTrigger) {
        observerRef.current.unobserve(currentTrigger);
      }
    };
  }, [handleIntersection, threshold, rootMargin]);

  return { triggerRef };
}
