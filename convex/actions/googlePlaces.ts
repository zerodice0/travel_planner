/**
 * Google Places API Actions
 *
 * 외부 API 호출을 위한 Convex Actions입니다.
 * Google Maps Places API와 통합하여 장소 검색 및 상세 정보를 제공합니다.
 */

"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Google Places API Response 타입
 */
interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
}

interface GooglePlacesSearchResponse {
  status: string;
  results: GooglePlaceResult[];
  next_page_token?: string;
}

interface GooglePlaceDetailsResponse {
  status: string;
  result: GooglePlaceResult & {
    reviews?: Array<{
      author_name: string;
      rating: number;
      text: string;
      time: number;
    }>;
  };
}

/**
 * 장소 검색 (Text Search)
 *
 * Google Places API의 Text Search를 사용하여 장소를 검색합니다.
 * 키워드 기반 검색을 지원합니다.
 */
export const searchPlaces = action({
  args: {
    query: v.string(),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    radius: v.optional(v.number()),
    language: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/textsearch/json"
    );
    url.searchParams.set("query", args.query);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", args.language ?? "ko");

    if (args.location) {
      url.searchParams.set(
        "location",
        `${args.location.lat},${args.location.lng}`
      );
      url.searchParams.set("radius", String(args.radius ?? 5000));
    }

    const response = await fetch(url.toString());
    const data = (await response.json()) as GooglePlacesSearchResponse;

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    // 검색 결과를 Travel Planner 형식으로 변환
    const places = data.results.map((place) => ({
      name: place.name,
      address: place.formatted_address,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      externalId: place.place_id,
      category: getCategoryFromTypes(place.types),
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      photos: place.photos?.map((p) => p.photo_reference) || [],
    }));

    return places;
  },
});

/**
 * 주변 장소 검색 (Nearby Search)
 *
 * 특정 위치 주변의 장소를 검색합니다.
 * 위치 기반 추천에 사용됩니다.
 */
export const searchNearbyPlaces = action({
  args: {
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    radius: v.optional(v.number()),
    type: v.optional(v.string()),
    keyword: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    );
    url.searchParams.set(
      "location",
      `${args.location.lat},${args.location.lng}`
    );
    url.searchParams.set("radius", String(args.radius ?? 1000));
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", args.language ?? "ko");

    if (args.type) {
      url.searchParams.set("type", args.type);
    }

    if (args.keyword) {
      url.searchParams.set("keyword", args.keyword);
    }

    const response = await fetch(url.toString());
    const data = (await response.json()) as GooglePlacesSearchResponse;

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const places = data.results.map((place) => ({
      name: place.name,
      address: place.formatted_address,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      externalId: place.place_id,
      category: getCategoryFromTypes(place.types),
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      photos: place.photos?.map((p) => p.photo_reference) || [],
    }));

    return places;
  },
});

/**
 * 장소 상세 정보 조회 (Place Details)
 *
 * Google Place ID로 장소의 상세 정보를 조회합니다.
 * 리뷰, 영업 시간, 연락처 등 추가 정보를 제공합니다.
 */
export const getPlaceDetails = action({
  args: {
    placeId: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    url.searchParams.set("place_id", args.placeId);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", args.language ?? "ko");
    url.searchParams.set(
      "fields",
      "name,formatted_address,geometry,formatted_phone_number,website,rating,user_ratings_total,reviews,opening_hours,photos,types"
    );

    const response = await fetch(url.toString());
    const data = (await response.json()) as GooglePlaceDetailsResponse;

    if (data.status !== "OK") {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const place = data.result;

    return {
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      externalUrl: place.website,
      externalId: args.placeId,
      category: getCategoryFromTypes(place.types),
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      reviews: place.reviews?.map((review) => ({
        authorName: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.time,
      })) || [],
      openingHours: place.opening_hours
        ? {
            openNow: place.opening_hours.open_now,
            weekdayText: place.opening_hours.weekday_text,
          }
        : null,
      photos: place.photos?.map((p) => p.photo_reference) || [],
    };
  },
});

/**
 * Google Places Photo 가져오기
 *
 * Photo Reference를 사용하여 이미지 URL을 생성합니다.
 */
export const getPhotoUrl = action({
  args: {
    photoReference: v.string(),
    maxWidth: v.optional(v.number()),
    maxHeight: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/photo"
    );
    url.searchParams.set("photo_reference", args.photoReference);
    url.searchParams.set("key", apiKey);

    if (args.maxWidth) {
      url.searchParams.set("maxwidth", String(args.maxWidth));
    } else if (args.maxHeight) {
      url.searchParams.set("maxheight", String(args.maxHeight));
    } else {
      url.searchParams.set("maxwidth", "400");
    }

    return url.toString();
  },
});

/**
 * 자동완성 (Autocomplete)
 *
 * 사용자 입력에 대한 장소 자동완성을 제공합니다.
 */
export const autocomplete = action({
  args: {
    input: v.string(),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    radius: v.optional(v.number()),
    language: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    );
    url.searchParams.set("input", args.input);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", args.language ?? "ko");

    if (args.location) {
      url.searchParams.set(
        "location",
        `${args.location.lat},${args.location.lng}`
      );
      url.searchParams.set("radius", String(args.radius ?? 50000));
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.predictions.map((prediction: any) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting.main_text,
      secondaryText: prediction.structured_formatting.secondary_text,
    }));
  },
});

// ==================== Helper Functions ====================

/**
 * Google Place Types를 Travel Planner 카테고리로 변환
 *
 * Google Places API의 타입을 우리 앱의 카테고리로 매핑합니다.
 */
function getCategoryFromTypes(types: string[]): string {
  const categoryMap: Record<string, string> = {
    restaurant: "음식점",
    cafe: "카페",
    bar: "술집",
    lodging: "숙박",
    hotel: "호텔",
    tourist_attraction: "관광명소",
    park: "공원",
    museum: "박물관",
    shopping_mall: "쇼핑",
    store: "상점",
    gym: "운동",
    spa: "스파",
    movie_theater: "영화관",
    night_club: "나이트클럽",
    airport: "교통",
    train_station: "교통",
    bus_station: "교통",
    subway_station: "교통",
    hospital: "의료",
    pharmacy: "의료",
    bank: "금융",
    atm: "금융",
    gas_station: "편의시설",
    parking: "편의시설",
  };

  for (const type of types) {
    if (categoryMap[type]) {
      return categoryMap[type];
    }
  }

  return "기타";
}
