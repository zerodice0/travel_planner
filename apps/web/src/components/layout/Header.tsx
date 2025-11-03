import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, User } from 'lucide-react';
import { HTTPError } from 'ky';
import { useAuth } from '#contexts/AuthContext';
import NotificationDropdown from '#components/notification/NotificationDropdown';
import { notificationsApi } from '#lib/api';

interface HeaderProps {
  title?: string;
  showProfile?: boolean;
  showNotification?: boolean;
  showSettings?: boolean;
}

export default function Header({
  title = 'Travel Planner',
  showProfile = true,
  showNotification = true,
  showSettings = true,
}: HeaderProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // 초기 안읽은 알림 개수 로드
  useEffect(() => {
    if (showNotification) {
      loadUnreadCount();
    }
  }, [showNotification]);

  // 30초마다 안읽은 알림 개수 폴링
  useEffect(() => {
    if (!showNotification) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // 30초

    return () => clearInterval(interval);
  }, [showNotification]);

  const loadUnreadCount = async () => {
    try {
      const { count } = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      // 401 에러는 tokenExpiredEvent가 처리하므로 로그 제외
      if (error instanceof HTTPError && error.response.status === 401) {
        return;
      }
      console.error('Failed to load unread count:', error);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-card border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 max-w-screen-lg mx-auto">
        {/* Left side - Title/Logo */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-primary-600">{title}</h1>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {showNotification && (
            <NotificationDropdown
              unreadCount={unreadCount}
              onUnreadCountChange={setUnreadCount}
            />
          )}

          {showSettings && (
            <Link
              to="/settings"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="설정"
            >
              <Settings className="w-6 h-6" />
            </Link>
          )}

          {showProfile && (
            <Link
              to="/settings"
              className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="프로필"
            >
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white overflow-hidden">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
