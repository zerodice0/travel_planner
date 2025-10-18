import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '#components/ui/ConfirmDialog';
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

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await api.post('auth/resend-verification-email', {
        json: { email: userEmail },
      }).json();

      toast.success('인증 메일이 재발송되었습니다. 메일함을 확인해주세요.');
      onClose();
    } catch {
      toast.error('인증 메일 재발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleResendEmail}
      title="이메일 인증이 필요합니다"
      confirmText="인증 메일 재발송"
      cancelText="닫기"
      variant="warning"
      loading={isResending}
    >
      {/* Custom Content */}
      <div className="space-y-4">
        {/* Description */}
        <p className="text-center">
          장소를 추가하려면 먼저 이메일 인증을 완료해주세요.
        </p>

        {/* Email Display */}
        <div className="text-center">
          <p className="font-medium text-foreground">{userEmail}</p>
          <p className="text-sm mt-1">
            위 주소로 발송된 인증 메일을 확인하고 인증을 완료하면
            <br />
            모든 기능을 사용하실 수 있습니다.
          </p>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="font-medium text-sm mb-2">💡 메일이 도착하지 않았나요?</p>
          <ul className="space-y-1 text-sm text-left">
            <li>• 스팸 메일함을 확인해주세요</li>
            <li>• 메일 발송까지 최대 5분이 소요될 수 있습니다</li>
            <li>• 여전히 메일이 없다면 '인증 메일 재발송'을 눌러주세요</li>
          </ul>
        </div>
      </div>
    </ConfirmDialog>
  );
}
