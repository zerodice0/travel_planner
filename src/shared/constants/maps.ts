import { Libraries } from '@react-google-maps/api';

/**
 * Google Maps API에서 사용할 라이브러리 목록
 * - places: Google Places API 기능 (장소 검색, 자동완성 등)
 * - geocoding: 주소와 좌표 간 변환 기능
 */
export const GOOGLE_MAPS_LIBRARIES: Libraries = ['places', 'geocoding'];