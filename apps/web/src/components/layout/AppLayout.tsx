import { ReactNode } from 'react';
import Header from '#components/layout/Header';
import BottomNavigation from '#components/layout/BottomNavigation';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
}

export default function AppLayout({
  children,
  title,
  showHeader = true,
  showBottomNav = true,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only sr-only-focusable focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        본문으로 건너뛰기
      </a>

      {showHeader && <Header title={title} />}

      <main id="main-content" className={`flex-1 ${showBottomNav ? 'pb-16' : ''}`}>
        {children}
      </main>

      {showBottomNav && <BottomNavigation />}
    </div>
  );
}
