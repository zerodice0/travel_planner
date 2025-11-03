import { useState } from 'react';
import { X, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '#lib/api';

interface EmailVerificationBannerProps {
  userEmail: string;
  onClose: () => void;
}

export function EmailVerificationBanner({
  userEmail,
  onClose,
}: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await api.post('auth/resend-verification-email', {
        json: { email: userEmail },
      }).json();

      toast.success('인증 메일이 재발송되었습니다. 메일함을 확인해주세요.');
    } catch {
      toast.error('인증 메일 재발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 animate-slide-down">
      <div className="max-w-7xl mx-auto px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Icon + Message */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Icon - 모바일에서는 작게 */}
            <div className="flex-shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>

            {/* Message - 반응형 텍스트 */}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-amber-900 font-medium">
                <span className="hidden sm:inline">
                  ⚠️ 이메일 인증이 필요합니다 • 장소 추가 기능을 사용하려면 이메일 인증을 완료해주세요
                </span>
                <span className="sm:hidden">
                  이메일 인증 필요 • 장소 추가 불가
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Resend Email Button */}
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">
                {isResending ? '발송 중...' : '인증 메일 재발송'}
              </span>
              <span className="sm:hidden">
                {isResending ? '...' : '재발송'}
              </span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-amber-100 rounded-md transition-colors"
              aria-label="배너 닫기"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
