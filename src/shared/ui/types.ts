// 공통 UI 관련 타입 정의

/**
 * 삭제 확인 다이얼로그의 상태를 관리하는 제네릭 인터페이스
 * @template T - 삭제할 항목의 ID 타입 (기본값: string)
 */
export interface DeleteConfirmDialogState<T = string> {
  /** 다이얼로그가 열려있는지 여부 */
  isOpen: boolean;
  /** 삭제할 항목의 고유 ID */
  itemId: T;
  /** 사용자에게 표시할 항목명 */
  itemName: string;
}

// 특화된 삭제 확인 다이얼로그 타입들
export type PlaceDeleteConfirmDialog = DeleteConfirmDialogState<string>;
export type TripPlaceDeleteConfirmDialog = DeleteConfirmDialogState<string>;

/**
 * 삭제 확인 다이얼로그의 기본값 생성 헬퍼 함수
 */
export const createEmptyDeleteConfirmDialog = <T = string>(): DeleteConfirmDialogState<T> => ({
  isOpen: false,
  itemId: '' as T,
  itemName: ''
});