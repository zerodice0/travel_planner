import { AlertTriangle, X } from 'lucide-react';

interface DuplicatePlace {
  id: string;
  name: string;
  address: string;
  distance: number;
  similarity: number;
}

interface DuplicateWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAnyway: () => void;
  duplicates: DuplicatePlace[];
}

/**
 * DuplicateWarningDialog
 *
 * Purpose: Warn users when similar places are detected before final submission
 * Use case: Prevent duplicate place entries while allowing user override
 *
 * Features:
 * - Display list of similar places with distance and similarity scores
 * - Clear "Add Anyway" vs "Cancel" options
 * - NO use of window.confirm (CLAUDE.md compliance)
 */
export function DuplicateWarningDialog({
  isOpen,
  onClose,
  onAddAnyway,
  duplicates,
}: DuplicateWarningDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle size={24} />
            <h2 className="text-lg font-semibold">유사한 장소가 있습니다</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-gray-600 mb-4">
            다음 장소들과 유사합니다. 계속 추가하시겠습니까?
          </p>

          <ul className="space-y-3">
            {duplicates.map((dup) => (
              <li
                key={dup.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="font-medium text-gray-900">{dup.name}</div>
                <div className="text-sm text-gray-600 mt-1">{dup.address}</div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>
                    거리: <strong>{Math.round(dup.distance)}m</strong>
                  </span>
                  <span>
                    유사도:{' '}
                    <strong>{Math.round(dup.similarity * 100)}%</strong>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            취소
          </button>
          <button
            onClick={onAddAnyway}
            className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            계속 추가
          </button>
        </div>
      </div>
    </div>
  );
}
