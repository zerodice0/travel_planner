import { useState, useEffect } from 'react';
import { Shield, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useModerationQueue } from '#hooks/useModerationQueue';
import { ModerationQueueCard } from '#components/admin/ModerationQueueCard';
import toast from 'react-hot-toast';

/**
 * AdminModerationPage
 *
 * Purpose: Admin interface for reviewing user-generated places
 * Use case: Admins can approve/reject places pending moderation
 *
 * Features:
 * - Status filter tabs (Pending, Approved, Rejected)
 * - Pagination controls
 * - Place list with moderation actions
 * - Loading, empty, and error states
 * - Toast notifications for actions
 */
export default function AdminModerationPage() {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [page, setPage] = useState(1);
  const { queue, loading, error, loadQueue, reviewPlace } = useModerationQueue(status, page);

  // Load queue when status or page changes
  useEffect(() => {
    loadQueue();
  }, [status, page]);

  const handleStatusChange = (newStatus: 'pending' | 'approved' | 'rejected') => {
    setStatus(newStatus);
    setPage(1); // Reset to first page when changing status
  };

  const handleReview = async (id: string, newStatus: 'approved' | 'rejected', notes?: string) => {
    try {
      await reviewPlace(id, newStatus, notes);
      toast.success(newStatus === 'approved' ? '장소가 승인되었습니다' : '장소가 거부되었습니다');
      await loadQueue(); // Refresh list
    } catch (error) {
      console.error('Review failed:', error);
      toast.error('검토 처리에 실패했습니다');
    }
  };

  const hasPages = queue.pagination && queue.pagination.totalPages > 0;
  const canGoPrev = page > 1;
  const canGoNext = hasPages && page < queue.pagination.totalPages;

  return (
    <div className="admin-moderation-page min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">장소 검토</h1>
              <p className="text-sm text-muted-foreground mt-1">
                사용자가 제출한 장소를 검토하고 승인/거부하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Filter Tabs */}
        <div className="mb-6">
          <div className="inline-flex rounded-lg border border-border bg-muted p-1">
            {[
              { value: 'pending', label: '대기중', color: 'text-amber-600' },
              { value: 'approved', label: '승인됨', color: 'text-green-600' },
              { value: 'rejected', label: '거부됨', color: 'text-red-600' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusChange(tab.value as 'pending' | 'approved' | 'rejected')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  status === tab.value
                    ? 'bg-card shadow-sm ' + tab.color
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {status === tab.value && queue.pagination && (
                  <span className="ml-2 text-xs">({queue.pagination.total})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">검토 목록을 불러오는 중...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-900 font-medium mb-3">오류가 발생했습니다</p>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={loadQueue}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && queue.items.length === 0 && (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              검토할 장소가 없습니다
            </h3>
            <p className="text-muted-foreground">
              {status === 'pending' && '현재 대기중인 장소가 없습니다.'}
              {status === 'approved' && '아직 승인된 장소가 없습니다.'}
              {status === 'rejected' && '아직 거부된 장소가 없습니다.'}
            </p>
          </div>
        )}

        {/* Queue List */}
        {!loading && !error && queue.items.length > 0 && (
          <div className="space-y-4">
            {queue.items.map((item) => (
              <ModerationQueueCard
                key={item.id}
                item={item}
                onReview={handleReview}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && hasPages && queue.pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <div className="text-sm text-muted-foreground">
              총 <strong>{queue.pagination.total}</strong>개 항목
              (페이지당 {queue.pagination.limit}개)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!canGoPrev}
                className="flex items-center gap-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <ChevronLeft size={18} />
                이전
              </button>

              <div className="flex items-center gap-2 px-4">
                <span className="text-sm text-muted-foreground">
                  페이지{' '}
                  <strong className="text-foreground">{queue.pagination.page}</strong>
                  {' / '}
                  <strong className="text-foreground">{queue.pagination.totalPages}</strong>
                </span>
              </div>

              <button
                onClick={() => setPage(page + 1)}
                disabled={!canGoNext}
                className="flex items-center gap-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                다음
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
