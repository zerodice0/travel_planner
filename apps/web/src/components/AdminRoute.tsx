import { useNavigate } from 'react-router-dom';
import { useAuth } from '#contexts/AuthContext';
import { LoginDialog } from '#components/LoginDialog';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute
 *
 * Purpose: Route guard for admin-only pages
 * Use case: Protect admin moderation interface from non-admin users
 *
 * Features:
 * - Check if user is authenticated
 * - Check if user has admin privileges
 * - Redirect non-authenticated users to login
 * - Redirect non-admin users to home with error toast
 * - NO window.confirm usage (CLAUDE.md compliant)
 */
export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // Loading state
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

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <LoginDialog
        isOpen={true}
        onClose={() => {
          navigate('/explore', { replace: true });
        }}
        onLoginSuccess={() => {
          // After login, auth context will update and re-render
          // Then the admin check below will run
        }}
        title="로그인이 필요합니다"
        message="관리자 페이지에 접근하려면 로그인이 필요합니다."
      />
    );
  }

  // Authenticated but not admin
  if (!user?.isAdmin) {
    // Use effect to show toast and redirect
    useEffect(() => {
      toast.error('관리자 권한이 필요합니다');
      navigate('/', { replace: true });
    }, []);

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // Authenticated and admin
  return <>{children}</>;
}
