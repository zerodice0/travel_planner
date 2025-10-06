import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '#contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Check if onboarding is completed
    const onboardingCompleted = localStorage.getItem('travel-planner:onboarding-completed');
    const splashShown = sessionStorage.getItem('travel-planner:splash-shown');

    // If first-time user (onboarding not completed), redirect to splash
    if (!onboardingCompleted) {
      return <Navigate to="/splash" replace />;
    }

    // If splash hasn't been shown this session, redirect to splash
    if (!splashShown) {
      return <Navigate to="/splash" replace />;
    }

    // Otherwise, redirect to login with the intended destination
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
