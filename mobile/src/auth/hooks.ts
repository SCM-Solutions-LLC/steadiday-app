/**
 * Authentication Hooks
 *
 * React hooks for managing authentication state in components.
 *
 * USAGE:
 * - useAuth() - Get current auth state and auth functions
 * - useRequireAuth() - Redirect to login if not authenticated
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  getCurrentUser,
  isAuthenticated as checkIsAuthenticated,
  changePassword as authChangePassword,
  requestPasswordReset as authRequestPasswordReset,
  User,
} from "./authManager";
import { secureLog, secureError } from "../utils/secureLogger";

/**
 * Authentication state interface
 */
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * Authentication hook return type
 */
interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

/**
 * useAuth Hook
 *
 * Provides authentication state and functions to components.
 *
 * @returns Authentication state and functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *
 *   const handleLogin = async () => {
 *     const success = await login(email, password);
 *     if (success) {
 *       // Navigate to home
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       {isAuthenticated ? (
 *         <Text>Hello {user?.name}</Text>
 *       ) : (
 *         <Button onPress={handleLogin}>Login</Button>
 *       )}
 *     </View>
 *   );
 * }
 * ```
 */
export const useAuth = (): UseAuthReturn => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  /**
   * Load current user on mount
   */
  useEffect(() => {
    loadUser();
  }, []);

  /**
   * Load the current user from storage/backend
   */
  const loadUser = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const authenticated = await checkIsAuthenticated();
      if (!authenticated) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
        return;
      }

      const user = await getCurrentUser();
      if (user) {
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch (error) {
      secureError("Load user error", error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: "Failed to load user",
      });
    }
  };

  /**
   * Login function
   */
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const result = await authLogin({ email, password });

        if (result.success && result.user) {
          setState({
            user: result.user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
          return true;
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: result.error || "Login failed",
          }));
          return false;
        }
      } catch (error) {
        secureError("Login hook error", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Login failed",
        }));
        return false;
      }
    },
    []
  );

  /**
   * Register function
   */
  const register = useCallback(
    async (email: string, password: string, name?: string): Promise<boolean> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const result = await authRegister({ email, password, name });

        if (result.success && result.user) {
          setState({
            user: result.user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
          return true;
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: result.error || "Registration failed",
          }));
          return false;
        }
      } catch (error) {
        secureError("Register hook error", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Registration failed",
        }));
        return false;
      }
    },
    []
  );

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      await authLogout();

      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      secureError("Logout hook error", error);
      // Still clear user even on error
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: "Logout completed with errors",
      });
    }
  }, []);

  /**
   * Change password function
   */
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const result = await authChangePassword(currentPassword, newPassword);

        if (result.success) {
          setState((prev) => ({ ...prev, isLoading: false, error: null }));
          return true;
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: result.error || "Password change failed",
          }));
          return false;
        }
      } catch (error) {
        secureError("Change password hook error", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Password change failed",
        }));
        return false;
      }
    },
    []
  );

  /**
   * Request password reset function
   */
  const requestPasswordReset = useCallback(
    async (email: string): Promise<boolean> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const result = await authRequestPasswordReset(email);

        setState((prev) => ({ ...prev, isLoading: false }));
        return result.success;
      } catch (error) {
        secureError("Request password reset hook error", error);
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }
    },
    []
  );

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    await loadUser();
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    changePassword,
    requestPasswordReset,
    refreshUser,
    clearError,
  };
};

/**
 * useRequireAuth Hook
 *
 * Ensures user is authenticated before rendering component.
 * Redirects to login screen if not authenticated.
 *
 * @param redirectPath - Path to redirect to if not authenticated (default: 'Authentication')
 * @returns Authentication state
 *
 * @example
 * ```tsx
 * function ProtectedScreen() {
 *   const { user, isLoading } = useRequireAuth();
 *
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   // User is guaranteed to be authenticated here
 *   return <Text>Hello {user?.name}</Text>;
 * }
 * ```
 */
export const useRequireAuth = (redirectPath: string = "Authentication") => {
  const navigation = useNavigation<any>();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      secureLog("User not authenticated, redirecting to login");
      // Navigate to login screen
      navigation.navigate(redirectPath);
    }
  }, [auth.isLoading, auth.isAuthenticated, navigation, redirectPath]);

  return auth;
};

/**
 * IMPORTANT SECURITY NOTES:
 *
 * 1. Never expose sensitive user data through these hooks
 * 2. Always check isAuthenticated before showing protected content
 * 3. Backend must validate tokens on every request
 * 4. Don't rely solely on client-side auth checks for security
 * 5. Clear auth state immediately on logout
 * 6. Refresh user data periodically for long sessions
 * 7. Handle token expiration gracefully
 * 8. Log authentication events for security monitoring
 */
