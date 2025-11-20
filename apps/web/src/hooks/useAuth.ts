/**
 * Clerk-based Authentication Hook
 *
 * Purpose: Wrapper around Clerk's useAuth and useUser hooks
 * to maintain compatibility with existing codebase while migrating to Clerk.
 *
 * This hook provides the same interface as the old AuthContext
 * but uses Clerk for authentication under the hood.
 */

import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

interface User {
  id: string;
  email: string;
  nickname: string;
  profileImage?: string;
  emailVerified: boolean;
  isAdmin?: boolean;
}

interface AuthHook {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
}

/**
 * Custom authentication hook that wraps Clerk's authentication
 *
 * @returns AuthHook interface compatible with existing codebase
 */
export function useAuth(): AuthHook {
  const { isSignedIn, isLoaded, signOut } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const navigate = useNavigate();

  // Transform Clerk user to our User interface
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    nickname: clerkUser.username || clerkUser.firstName || 'User',
    profileImage: clerkUser.imageUrl,
    emailVerified: clerkUser.primaryEmailAddress?.verification?.status === 'verified',
    isAdmin: clerkUser.publicMetadata?.isAdmin === true,
  } : null;

  // Deprecated: Clerk handles login via SignIn component
  const login = useCallback((_accessToken: string, _refreshToken: string, _user: User) => {
    console.warn('login() is deprecated with Clerk. Use Clerk SignIn component instead.');
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    await signOut();
    navigate('/explore', { replace: true });
  }, [signOut, navigate]);

  // Deprecated: Clerk manages user data automatically
  const updateUser = useCallback((_userData: User) => {
    console.warn('updateUser() is deprecated with Clerk. User data is managed by Clerk.');
  }, []);

  return {
    user,
    isAuthenticated: isSignedIn ?? false,
    isLoading: !isLoaded,
    login,
    logout,
    updateUser,
  };
}
