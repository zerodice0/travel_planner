import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Clerk-based route protection
 *
 * Purpose: Protect routes that require authentication
 * Uses Clerk's SignedIn/SignedOut components for declarative auth checks
 *
 * Features:
 * - Automatic redirect to sign-in page for unauthenticated users
 * - Preserves the original URL to redirect back after sign-in
 * - Uses Clerk's built-in authentication state management
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();

  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn
          redirectUrl={location.pathname}
        />
      </SignedOut>
    </>
  );
}
