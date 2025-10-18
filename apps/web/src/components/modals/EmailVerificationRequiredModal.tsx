import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '#components/ui';
import api from '#lib/api';

interface EmailVerificationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export function EmailVerificationRequiredModal({
  isOpen,
  onClose,
  userEmail,
}: EmailVerificationRequiredModalProps) {
  const [isResending, setIsResending] = useState(false);

  if (!isOpen) return null;

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await api.post('auth/resend-verification-email', {
        json: { email: userEmail },
      }).json();

      toast.success('인증 메일이 재발송되었습니다. 메일함을 확인해주세요.');
      onClose();
    } catch (error) {
      toast.error('인증 메일 재발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-8 w-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
          이메일 인증이 필요합니다
        </h2>

        {/* Description */}
        <p className="mb-6 text-center text-muted-foreground">
          이 기능을 사용하려면 이메일 인증을 완료해주세요.
          <br />
          <span className="font-medium text-foreground">{userEmail}</span>로 발송된 인증 메일을 확인해주세요.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={handleResendEmail}
            loading={isResending}
            disabled={isResending}
            fullWidth
          >
            인증 메일 재발송
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isResending}
            fullWidth
          >
            닫기
          </Button>
        </div>

        {/* Help Text */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          메일이 도착하지 않았나요?
          <br />
          스팸 메일함을 확인하거나 잠시 후 재발송을 시도해주세요.
        </p>
      </div>
    </div>
  );
}
