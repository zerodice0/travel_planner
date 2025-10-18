import { Link, useLocation } from 'react-router-dom';
import { Map, ClipboardList, Settings, LucideIcon } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { path: '/map', label: '지도', icon: Map },
  { path: '/lists', label: '목록', icon: ClipboardList },
  { path: '/settings', label: '설정', icon: Settings },
];

export default function BottomNavigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Top indicator bar for active state */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-b-full" />
              )}
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
