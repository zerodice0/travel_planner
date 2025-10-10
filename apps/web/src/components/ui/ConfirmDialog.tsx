import { useEffect, useRef } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

const variantConfig = {
  danger: {
    icon: XCircle,
    iconColor: 'text-red-600',
    iconBgColor: 'bg-red-50',
    confirmButtonClass:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:hover:bg-red-600',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    iconBgColor: 'bg-yellow-50',
    confirmButtonClass:
      'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 disabled:hover:bg-yellow-600',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-50',
    confirmButtonClass:
      'bg-[#4A90E2] text-white hover:bg-[#2E5C8A] focus:ring-[#4A90E2] disabled:hover:bg-[#4A90E2]',
  },
  success: {
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    iconBgColor: 'bg-green-50',
    confirmButtonClass:
      'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:hover:bg-green-600',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'info',
  loading = false,
}: ConfirmDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const config = variantConfig[variant];
  const Icon = config.icon;

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';

      // 포커스를 취소 버튼으로 이동
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, loading]);

  // 모달 배경 클릭 시 닫기 (로딩 중이 아닐 때만)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    // onConfirm에서 비동기 작업이 완료되면 부모 컴포넌트에서 onClose를 호출해야 함
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-2xl bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Content */}
        <div className="px-6 py-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full ${config.iconBgColor} flex items-center justify-center`}>
              <Icon className={`w-8 h-8 ${config.iconColor}`} />
            </div>
          </div>

          {/* Title */}
          <h2
            id="confirm-dialog-title"
            className="text-xl font-bold text-foreground text-center mb-3"
          >
            {title}
          </h2>

          {/* Message */}
          <p
            id="confirm-dialog-message"
            className="text-muted-foreground text-center mb-6 leading-relaxed"
          >
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              ref={cancelButtonRef}
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 bg-card text-foreground border border-border hover:bg-muted focus:ring-ring disabled:hover:bg-card"
              aria-label={cancelText}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${config.confirmButtonClass}`}
              aria-label={confirmText}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>처리 중...</span>
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
