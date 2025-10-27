import type { SearchResult } from '#types/map';

/**
 * 장소 배열에서 중복을 제거하고 태그를 병합합니다.
 *
 * 중복 판별 기준:
 * 1. externalId가 둘 다 있으면 externalId로 비교 (우선)
 * 2. externalId가 없으면 이름 + 좌표로 비교 (±50m)
 *
 * 중복된 경우:
 * - isLocal과 isPublic 플래그를 병합 (둘 다 true)
 * - 첫 번째로 발견된 장소의 데이터를 유지
 *
 * @param places - 중복 제거할 장소 배열
 * @returns 중복이 제거된 장소 배열
 */
export function deduplicatePlaces(places: SearchResult[]): SearchResult[] {
  const uniquePlaces: SearchResult[] = [];
  const seenIds = new Set<string>();

  for (const place of places) {
    // 이미 처리한 장소인지 확인
    let isDuplicate = false;
    let duplicateIndex = -1;

    for (let i = 0; i < uniquePlaces.length; i++) {
      const existingPlace = uniquePlaces[i];
      if (!existingPlace) continue;

      // 1. externalId로 중복 판별 (둘 다 있는 경우)
      if (place.externalId && existingPlace.externalId && place.externalId === existingPlace.externalId) {
        isDuplicate = true;
        duplicateIndex = i;
        break;
      }

      // 2. 이름 + 좌표로 중복 판별
      const nameSimilar = place.name.toLowerCase() === existingPlace.name.toLowerCase();
      const latDiff = Math.abs(place.latitude - existingPlace.latitude);
      const lngDiff = Math.abs(place.longitude - existingPlace.longitude);
      const locationClose = latDiff < 0.0005 && lngDiff < 0.0005; // ±50m

      if (nameSimilar && locationClose) {
        isDuplicate = true;
        duplicateIndex = i;
        break;
      }
    }

    if (isDuplicate && duplicateIndex !== -1) {
      // 중복된 경우: 태그 병합
      const existingPlace = uniquePlaces[duplicateIndex];
      if (existingPlace) {
        uniquePlaces[duplicateIndex] = {
          ...existingPlace,
          isLocal: existingPlace.isLocal || place.isLocal,
          isPublic: existingPlace.isPublic || place.isPublic,
        };
      }
    } else {
      // 중복이 아닌 경우: 새 장소 추가
      uniquePlaces.push(place);
      seenIds.add(place.id);
    }
  }

  return uniquePlaces;
}
