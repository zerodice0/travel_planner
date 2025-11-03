import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { HTTPError } from 'ky';
import { notificationsApi } from '#lib/api';
import type { Notification } from '#types/notification';

interface NotificationDropdownProps {
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

export default function NotificationDropdown({
  unreadCount,
  onUnreadCountChange,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 드롭다운 열 때 알림 목록 로드
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationsApi.getAll({ limit: 50 });
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // 401 에러는 tokenExpiredEvent가 처리하므로 토스트 제외
      if (error instanceof HTTPError && error.response.status === 401) {
        return;
      }
      toast.error('알림을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);

      // 로컬 상태 업데이트
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );

      // 안읽은 개수 업데이트
      const newUnreadCount = Math.max(0, unreadCount - 1);
      onUnreadCountChange(newUnreadCount);
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('알림 읽음 처리에 실패했습니다');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();

      // 로컬 상태 업데이트
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

      // 안읽은 개수 0으로 설정
      onUnreadCountChange(0);

      toast.success('모든 알림을 읽음 처리했습니다');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('알림 읽음 처리에 실패했습니다');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationsApi.delete(notificationId);

      // 로컬 상태에서 제거
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      // 안읽은 알림이었다면 개수 감소
      if (notification && !notification.isRead) {
        onUnreadCountChange(Math.max(0, unreadCount - 1));
      }

      toast.success('알림을 삭제했습니다');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('알림 삭제에 실패했습니다');
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      const now = new Date();
      const past = new Date(dateString);
      const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return '방금 전';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}분 전`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}시간 전`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}일 전`;
      } else if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks}주 전`;
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months}개월 전`;
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `${years}년 전`;
      }
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="알림"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[1rem] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-semibold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[32rem] bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">알림</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
                >
                  모두 읽음
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-[28rem] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">알림이 없습니다</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-muted transition-colors ${
                      !notification.isRead ? 'bg-primary-50/30 dark:bg-primary-950/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></span>
                          )}
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getRelativeTime(notification.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 text-muted-foreground hover:text-primary-600 transition-colors"
                            title="읽음 처리"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
