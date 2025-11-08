import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { tokenExpiredEvent, resetTokenExpiredFlag } from '#lib/api';

interface User {
  id: string;
  email: string;
  nickname: string;
  profileImage?: string;
  emailVerified: boolean;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Validate token and fetch user profile
      api
        .get('users/me')
        .json<User>()
        .then((userData) => {
          setUser(userData);
        })
        .catch((error) => {
          // Token is invalid or expired, clear storage silently
          // This is expected behavior when tokens expire, so we don't log it as an error
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);

          // Only log unexpected errors (not 401 Unauthorized)
          if (error?.response?.status !== 401) {
            console.error('Failed to fetch user profile:', error);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Listen for token expiration events
  useEffect(() => {
    const handleTokenExpired = () => {
      // 계정 삭제 중이면 토스트 메시지를 표시하지 않음
      const isDeletingAccount = localStorage.getItem('isDeletingAccount') === 'true';

      // Clear user state
      setUser(null);

      // Show notification (계정 삭제 중이 아닐 때만)
      if (!isDeletingAccount) {
        toast.error('세션이 만료되었습니다. 다시 로그인해주세요.', {
          duration: 5000,
        });
      }

      // Redirect to login or explore page
      const currentPath = window.location.pathname;
      const isProtectedRoute = !['/login', '/signup', '/explore'].includes(currentPath);

      if (isProtectedRoute) {
        // Save current path to return after login
        navigate('/login', { state: { from: currentPath }, replace: true });
      } else {
        // Already on public page, just refresh
        navigate(currentPath, { replace: true });
      }
    };

    tokenExpiredEvent.addEventListener('expired', handleTokenExpired);

    return () => {
      tokenExpiredEvent.removeEventListener('expired', handleTokenExpired);
    };
  }, [navigate]);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    // 로그인 시 토큰 만료 플래그 초기화
    resetTokenExpiredFlag();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
