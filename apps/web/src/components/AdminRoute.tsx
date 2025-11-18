import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '#hooks/useAuth';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute - Clerk-based admin route protection
 *
 * Purpose: Route guard for admin-only pages
 * Use case: Protect admin moderation interface from non-admin users
 *
 * Features:
 * - Check if user is authenticated (via Clerk)
 * - Check if user has admin privileges (via Clerk publicMetadata)
 * - Redirect non-authenticated users to sign-in
 * - Redirect non-admin users to home with error toast
 * - NO window.confirm usage (CLAUDE.md compliant)
 */
export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Check admin status after user is loaded
  useEffect(() => {
    if (!isLoading && user && !user.isAdmin) {
      toast.error('관리자 권한이 필요합니다');
      navigate('/explore', { replace: true });
    }
  }, [isLoading, user, navigate]);

  return (
    <>
      <SignedIn>
        {isLoading ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-2 text-muted-foreground">권한 확인 중...</p>
            </div>
          </div>
        ) : user?.isAdmin ? (
          children
        ) : null}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
