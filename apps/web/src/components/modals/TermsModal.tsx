import { Modal, MarkdownContent } from '../ui';
import { TERMS_OF_SERVICE } from '../../constants/terms';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="서비스 이용약관" maxWidth="xl">
      <MarkdownContent content={TERMS_OF_SERVICE} />
    </Modal>
  );
}
