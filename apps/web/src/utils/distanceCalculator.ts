/**
 * 두 지점 간의 거리를 계산하는 유틸리티 함수
 * Haversine formula 사용
 */

interface Coordinates {
  lat: number;
  lng: number;
}

// 위도/경도 정보를 포함하는 타입
type CoordinatesLike =
  | Coordinates
  | { latitude: number; longitude: number };

/**
 * 좌표에서 위도를 추출합니다.
 */
function getLatitude(coord: CoordinatesLike): number {
  return 'lat' in coord ? coord.lat : coord.latitude;
}

/**
 * 좌표에서 경도를 추출합니다.
 */
function getLongitude(coord: CoordinatesLike): number {
  return 'lng' in coord ? coord.lng : coord.longitude;
}

/**
 * Haversine formula를 사용하여 두 좌표 간의 거리를 계산합니다.
 * @param coord1 첫 번째 좌표 (lat/lng 또는 latitude/longitude)
 * @param coord2 두 번째 좌표 (lat/lng 또는 latitude/longitude)
 * @returns 두 지점 간의 거리 (킬로미터 단위)
 */
export function calculateDistance(coord1: CoordinatesLike, coord2: CoordinatesLike): number {
  const R = 6371; // 지구의 반지름 (km)

  const lat1 = getLatitude(coord1);
  const lng1 = getLongitude(coord1);
  const lat2 = getLatitude(coord2);
  const lng2 = getLongitude(coord2);

  // 각도를 라디안으로 변환
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLng = ((lng2 - lng1) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * 거리를 사람이 읽기 쉬운 형태로 포맷팅합니다.
 * @param distanceInKm 거리 (킬로미터 단위)
 * @returns 포맷팅된 거리 문자열 (예: "약 1.2km", "약 850m")
 */
export function formatDistance(distanceInKm: number): string {
  if (distanceInKm < 1) {
    // 1km 미만은 미터 단위로 표시
    const meters = Math.round(distanceInKm * 1000);
    return `약 ${meters}m`;
  } else if (distanceInKm < 10) {
    // 10km 미만은 소수점 첫째 자리까지 표시
    return `약 ${distanceInKm.toFixed(1)}km`;
  } else {
    // 10km 이상은 정수로 표시
    return `약 ${Math.round(distanceInKm)}km`;
  }
}

/**
 * 주어진 중심점에서 가장 가까운 장소를 찾습니다.
 * @param center 중심 좌표
 * @param places 장소 배열
 * @returns 가장 가까운 장소와 거리 정보
 */
export function findNearestPlace<T extends CoordinatesLike>(
  center: CoordinatesLike,
  places: T[],
): { place: T; distance: number } | null {
  if (places.length === 0) {
    return null;
  }

  const firstPlace = places[0];
  if (!firstPlace) {
    return null;
  }

  let nearestPlace = firstPlace;
  let minDistance = calculateDistance(center, firstPlace);

  for (let i = 1; i < places.length; i++) {
    const place = places[i];
    if (!place) continue;

    const distance = calculateDistance(center, place);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPlace = place;
    }
  }

  return {
    place: nearestPlace,
    distance: minDistance,
  };
}

/**
 * 거리에 따라 적절한 Google Maps 줌 레벨을 반환합니다.
 * @param distanceInKm 거리 (킬로미터 단위)
 * @returns 적절한 줌 레벨 (Google Maps zoom level: 1-20)
 */
export function getOptimalZoomLevel(distanceInKm: number): number {
  // 거리에 따라 적절한 줌 레벨 설정
  if (distanceInKm < 0.5) {
    // 500m 미만: 건물 수준
    return 17;
  } else if (distanceInKm < 2) {
    // 2km 미만: 동네 수준
    return 15;
  } else if (distanceInKm < 10) {
    // 10km 미만: 지역 수준
    return 13;
  } else if (distanceInKm < 50) {
    // 50km 미만: 도시 수준
    return 11;
  } else {
    // 50km 이상: 광역 수준
    return 9;
  }
}
