/**
 * 카카오맵과 구글맵 간의 줌 레벨 변환 유틸리티
 *
 * 카카오맵: level 1-14 (숫자가 클수록 더 멀리 보임, 넓은 범위)
 * 구글맵: zoom 0-22 (숫자가 클수록 더 가까이 보임, 좁은 범위)
 */

/**
 * 카카오맵 레벨을 구글맵 줌으로 변환
 * @param kakaoLevel - 카카오맵 레벨 (1-14)
 * @returns 구글맵 줌 레벨 (1-21)
 */
export function convertKakaoLevelToGoogleZoom(kakaoLevel: number): number {
  // 카카오맵 레벨을 역전시켜 구글맵 줌으로 변환
  // 카카오 1 (가장 가까움) -> 구글 21 (가장 가까움)
  // 카카오 14 (가장 멀음) -> 구글 7 (멀음)
  const zoom = 22 - kakaoLevel;

  // 구글맵 줌 범위 제한 (1-21)
  return Math.max(1, Math.min(21, zoom));
}

/**
 * 구글맵 줌을 카카오맵 레벨로 변환
 * @param googleZoom - 구글맵 줌 레벨 (0-22)
 * @returns 카카오맵 레벨 (1-14)
 */
export function convertGoogleZoomToKakaoLevel(googleZoom: number): number {
  // 구글맵 줌을 역전시켜 카카오맵 레벨로 변환
  // 구글 21 (가장 가까움) -> 카카오 1 (가장 가까움)
  // 구글 7 (멀음) -> 카카오 14 (가장 멀음)
  const level = 22 - googleZoom;

  // 카카오맵 레벨 범위 제한 (1-14)
  return Math.max(1, Math.min(14, level));
}
