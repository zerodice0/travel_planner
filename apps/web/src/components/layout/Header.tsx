import { Link } from 'react-router-dom';
import { Bell, Settings, User } from 'lucide-react';
import { useAuth } from '#contexts/AuthContext';

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
            <button
              type="button"
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="알림"
            >
              <Bell className="w-6 h-6" />
              {/* Notification badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
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
