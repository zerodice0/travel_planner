import { Modal, MarkdownContent } from '#components/ui';
import { PRIVACY_POLICY } from '#constants/privacy';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="개인정보 처리방침" maxWidth="xl">
      <MarkdownContent content={PRIVACY_POLICY} />
    </Modal>
  );
}
