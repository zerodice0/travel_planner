import { useState } from 'react';
import { MapPin, User, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { ConfirmDialog } from '#components/ui/ConfirmDialog';

interface ModerationQueueCardProps {
  item: {
    id: string;
    place: {
      id: string;
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      category?: string;
      description?: string;
    };
    creator: {
      id: string;
      name: string;
      email: string;
    };
    createdAt: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedAt?: string;
    reviewer?: {
      id: string;
      name: string;
    };
    reviewNotes?: string;
  };
  onReview: (id: string, status: 'approved' | 'rejected', notes?: string) => Promise<void>;
}

/**
 * ModerationQueueCard
 *
 * Purpose: Display individual moderation queue item with approve/reject actions
 * Use case: Admin moderation interface
 *
 * Features:
 * - Display place details (name, address, coordinates, category, description)
 * - Display creator information (name, email)
 * - Show creation date
 * - Approve/Reject buttons with confirmation dialogs (NO window.confirm)
 * - Review notes input for rejection (required)
 * - Visual status indicators
 */
export function ModerationQueueCard({ item, onReview }: ModerationQueueCardProps) {
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onReview(item.id, 'approved');
      setIsApproveDialogOpen(false);
    } catch (error) {
      console.error('Failed to approve:', error);
      // Error handling is done in parent component with toast
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) {
      return; // Validation handled by UI
    }

    setIsProcessing(true);
    try {
      await onReview(item.id, 'rejected', rejectNotes);
      setIsRejectDialogOpen(false);
      setRejectNotes('');
    } catch (error) {
      console.error('Failed to reject:', error);
      // Error handling is done in parent component with toast
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="moderation-queue-card bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Place Information */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground mb-1">{item.place.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={16} />
              <span>{item.place.address}</span>
            </div>
          </div>

          {/* Status Badge */}
          {item.status !== 'pending' && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              item.status === 'approved'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {item.status === 'approved' ? '승인됨' : '거부됨'}
            </div>
          )}
        </div>

        {/* Coordinates */}
        <div className="text-sm text-muted-foreground mb-2">
          좌표: {item.place.latitude.toFixed(6)}, {item.place.longitude.toFixed(6)}
        </div>

        {/* Category */}
        {item.place.category && (
          <div className="text-sm text-muted-foreground mb-2">
            <span className="font-medium">카테고리:</span> {item.place.category}
          </div>
        )}

        {/* Description */}
        {item.place.description && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <p className="text-sm text-foreground">{item.place.description}</p>
          </div>
        )}
      </div>

      {/* Creator Information */}
      <div className="border-t border-border pt-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <User size={16} />
          <span className="font-medium">제출자:</span>
          <span>{item.creator.name} ({item.creator.email})</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={16} />
          <span className="font-medium">제출일:</span>
          <span>{new Date(item.createdAt).toLocaleString('ko-KR')}</span>
        </div>
      </div>

      {/* Review Information (if reviewed) */}
      {item.status !== 'pending' && item.reviewedAt && (
        <div className="border-t border-border pt-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar size={16} />
            <span className="font-medium">검토일:</span>
            <span>{new Date(item.reviewedAt).toLocaleString('ko-KR')}</span>
          </div>
          {item.reviewer && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <User size={16} />
              <span className="font-medium">검토자:</span>
              <span>{item.reviewer.name}</span>
            </div>
          )}
          {item.reviewNotes && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900"><strong>거부 사유:</strong> {item.reviewNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons (only for pending items) */}
      {item.status === 'pending' && (
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            onClick={() => setIsApproveDialogOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <CheckCircle size={18} />
            승인
          </button>
          <button
            onClick={() => setIsRejectDialogOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <XCircle size={18} />
            거부
          </button>
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isApproveDialogOpen}
        onClose={() => !isProcessing && setIsApproveDialogOpen(false)}
        onConfirm={handleApprove}
        title="장소 승인"
        message={`"${item.place.name}"을(를) 승인하시겠습니까?`}
        confirmText="승인"
        cancelText="취소"
        variant="success"
        loading={isProcessing}
      />

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isRejectDialogOpen}
        onClose={() => !isProcessing && setIsRejectDialogOpen(false)}
        onConfirm={handleReject}
        title="장소 거부"
        confirmText="거부"
        cancelText="취소"
        variant="danger"
        loading={isProcessing}
      >
        <div className="text-left mb-4">
          <p className="text-sm text-muted-foreground mb-3">
            "{item.place.name}"을(를) 거부하시겠습니까?
          </p>
          <textarea
            placeholder="거부 사유를 입력해주세요 (필수)"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-y"
            disabled={isProcessing}
            required
          />
          {!rejectNotes.trim() && (
            <p className="text-xs text-red-600 mt-1">거부 사유는 필수 항목입니다</p>
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
}
