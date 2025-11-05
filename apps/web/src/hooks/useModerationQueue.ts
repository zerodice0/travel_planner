import { useState } from 'react';
import { HTTPError } from 'ky';

interface ModerationQueueItem {
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
}

interface ModerationQueueResponse {
  items: ModerationQueueItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Hook for fetching and managing moderation queue
 *
 * Purpose: Provide reusable state management for admin moderation queue
 * Features:
 * - Fetch queue items by status and page
 * - Approve/reject places
 * - Loading and error states
 * - Automatic authentication via API client
 */
export function useModerationQueue(status: 'pending' | 'approved' | 'rejected', page: number) {
  const [queue, setQueue] = useState<ModerationQueueResponse>({
    items: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/admin/moderation?status=${status}&page=${page}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('관리자 권한이 필요합니다');
        }
        throw new Error('검토 목록을 불러오는데 실패했습니다');
      }

      const data = await response.json();
      setQueue(data);
    } catch (err) {
      console.error('Failed to load moderation queue:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const reviewPlace = async (id: string, newStatus: 'approved' | 'rejected', notes?: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/admin/moderation/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ status: newStatus, reviewNotes: notes }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '검토 처리에 실패했습니다');
    }

    return response.json();
  };

  return { queue, loading, error, loadQueue, reviewPlace };
}
