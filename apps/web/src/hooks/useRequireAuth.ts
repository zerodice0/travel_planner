import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '#contexts/AuthContext';

export interface UseRequireAuthOptions {
  confirmMessage?: string;
  loginSuccessMessage?: string;
  onLoginSuccess?: () => void;
}

export interface UseRequireAuthReturn {
  requireAuth: (action: () => void, customMessage?: string) => void;
  showConfirmDialog: boolean;
  setShowConfirmDialog: (value: boolean) => void;
  showLoginDialog: boolean;
  setShowLoginDialog: (value: boolean) => void;
  handleConfirmLogin: () => void;
  handleLoginSuccess: () => void;
  confirmMessage: string;
  currentCustomMessage: string | undefined;
}

/**
 * Hook for handling protected actions that require authentication
 *
 * Usage:
 * ```tsx
 * const {
 *   requireAuth,
 *   showConfirmDialog,
 *   setShowConfirmDialog,
 *   showLoginDialog,
 *   setShowLoginDialog,
 *   handleConfirmLogin,
 *   handleLoginSuccess,
 *   confirmMessage
 * } = useRequireAuth({
 *   confirmMessage: "이 기능을 사용하려면 로그인이 필요합니다.",
 *   loginSuccessMessage: "로그인되었습니다!",
 *   onLoginSuccess: () => console.log('Logged in!')
 * });
 *
 * // Protect an action
 * const handleSavePlace = (place: Place) => {
 *   requireAuth(async () => {
 *     await api.savePlace(place);
 *     toast.success('저장되었습니다');
 *   }, "장소를 저장하려면 로그인이 필요합니다.");
 * };
 * ```
 */
export function useRequireAuth(options?: UseRequireAuthOptions): UseRequireAuthReturn {
  const { isAuthenticated } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [currentCustomMessage, setCurrentCustomMessage] = useState<string | undefined>();

  const defaultMessage = options?.confirmMessage || '이 기능을 사용하려면 로그인이 필요합니다.';

  /**
   * Wrap an action that requires authentication
   * If user is authenticated, execute immediately
   * Otherwise, show confirmation dialog
   */
  const requireAuth = useCallback(
    (action: () => void, customMessage?: string) => {
      if (isAuthenticated) {
        // Already authenticated, execute immediately
        action();
      } else {
        // Not authenticated, store action and show confirmation
        setPendingAction(() => action);
        setCurrentCustomMessage(customMessage);
        setShowConfirmDialog(true);
      }
    },
    [isAuthenticated]
  );

  /**
   * Handle confirmation dialog "Login" button click
   * Close confirmation and open login dialog
   */
  const handleConfirmLogin = useCallback(() => {
    setShowConfirmDialog(false);
    setShowLoginDialog(true);
  }, []);

  /**
   * Handle successful login
   * Close login dialog, execute pending action, and call success callback
   */
  const handleLoginSuccess = useCallback(() => {
    setShowLoginDialog(false);

    // Execute pending action
    if (pendingAction) {
      try {
        pendingAction();
      } catch (error) {
        console.error('Error executing pending action:', error);
        toast.error('작업 실행 중 오류가 발생했습니다');
      } finally {
        setPendingAction(null);
        setCurrentCustomMessage(undefined);
      }
    }

    // Call custom success callback
    if (options?.onLoginSuccess) {
      try {
        options.onLoginSuccess();
      } catch (error) {
        console.error('Error in onLoginSuccess callback:', error);
      }
    }

    // Show success message
    if (options?.loginSuccessMessage) {
      toast.success(options.loginSuccessMessage);
    }
  }, [pendingAction, options]);

  return {
    requireAuth,
    showConfirmDialog,
    setShowConfirmDialog,
    showLoginDialog,
    setShowLoginDialog,
    handleConfirmLogin,
    handleLoginSuccess,
    confirmMessage: currentCustomMessage || defaultMessage,
    currentCustomMessage,
  };
}
