import { useState } from 'react';
import type { KakaoPlace } from '#types/place';

interface SearchResult {
  id: string;
  name: string;
  address: string;
  category: string;
  phone?: string;
  latitude: number;
  longitude: number;
  url?: string;
}

export function useKakaoPlacesSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (keyword: string): Promise<SearchResult[]> => {
    if (!keyword.trim()) {
      return [];
    }

    if (!window.kakao || !window.kakao.maps) {
      setError('Kakao Maps SDK is not loaded');
      return [];
    }

    setIsSearching(true);
    setError(null);

    return new Promise((resolve) => {
      const ps = new window.kakao.maps.services.Places();

      ps.keywordSearch(keyword, (data: KakaoPlace[], status: any) => {
        setIsSearching(false);

        if (status === window.kakao.maps.services.Status.OK) {
          const results = data.map((item) => ({
            id: item.id,
            name: item.place_name,
            address: item.address_name,
            category: mapCategory(item.category_name),
            phone: item.phone || undefined,
            latitude: parseFloat(item.y),
            longitude: parseFloat(item.x),
            url: item.place_url,
          }));
          resolve(results);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          resolve([]);
        } else {
          setError('검색 중 오류가 발생했습니다');
          resolve([]);
        }
      });
    });
  };

  return { search, isSearching, error };
}

function mapCategory(kakaoCategory: string): string {
  const categoryMap: Record<string, string> = {
    음식점: 'restaurant',
    카페: 'cafe',
    관광명소: 'tourist_attraction',
    쇼핑: 'shopping',
    문화시설: 'culture',
    자연: 'nature',
    숙박: 'accommodation',
  };

  // "음식점 > 한식 > 냉면" → "음식점"
  const mainCategory = kakaoCategory.split('>')[0]?.trim();
  return (mainCategory && categoryMap[mainCategory]) || 'etc';
}
