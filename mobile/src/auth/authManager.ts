/**
 * Authentication Manager
 *
 * Centralized authentication logic for the application.
 *
 * SECURITY FEATURES:
 * - Secure token storage
 * - Automatic token refresh
 * - Session management
 * - Logout cleanup
 * - Password validation
 * - Never logs sensitive data
 */

import { apiPost, apiGet } from "../api/client";
import {
  storeAuthTokens,
  getAuthTokens,
  clearAuthTokens,
  storeUserSession,
  getUserSession,
  isTokenExpired,
} from "../security/secureStorage";
import { secureLog, secureError, logAuthEvent } from "../utils/secureLogger";

/**
 * User interface (minimal, non-sensitive data)
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

/**
 * Login credentials interface
 */
interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data interface
 */
interface RegistrationData {
  email: string;
  password: string;
  name?: string;
}

/**
 * Auth response from backend
 */
interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until token expires
  sessionId: string;
}

/**
 * Current authentication state
 */
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

/**
 * Login with email and password
 *
 * @param credentials - Email and password
 * @returns User object if successful, null if failed
 *
 * SECURITY NOTE:
 * - Password is sent over HTTPS only
 * - Backend must hash password (never store plain text)
 * - Backend should implement rate limiting
 * - Backend should lock account after multiple failed attempts
 */
export const login = async (
  credentials: LoginCredentials
): Promise<{ success: boolean; user: User | null; error: string | null }> => {
  try {
    secureLog("Attempting login");

    // Validate email format
    if (!validateEmail(credentials.email)) {
      return { success: false, user: null, error: "Invalid email format" };
    }

    // Make login request (skipAuth = true for login endpoint)
    const response = await apiPost<AuthResponse>(
      "/auth/login",
      credentials,
      true
    );

    if (!response.success || !response.data) {
      logAuthEvent("login", false, response.error || "Unknown error");
      return {
        success: false,
        user: null,
        error: response.error || "Login failed",
      };
    }

    // Store tokens securely
    await storeAuthTokens(
      response.data.accessToken,
      response.data.refreshToken,
      response.data.expiresIn
    );

    // Store user session
    await storeUserSession(response.data.user.id, response.data.sessionId);

    logAuthEvent("login", true);
    secureLog("Login successful");

    return { success: true, user: response.data.user, error: null };
  } catch (error) {
    secureError("Login error", error);
    logAuthEvent("login", false, "Exception occurred");
    return { success: false, user: null, error: "Login failed" };
  }
};

/**
 * Register a new user account
 *
 * @param data - Registration data
 * @returns User object if successful, null if failed
 *
 * SECURITY NOTE:
 * - Enforce strong password requirements on backend
 * - Validate email format and uniqueness on backend
 * - Send email verification link
 * - Implement CAPTCHA for public registration
 */
export const register = async (
  data: RegistrationData
): Promise<{ success: boolean; user: User | null; error: string | null }> => {
  try {
    secureLog("Attempting registration");

    // Validate email format
    if (!validateEmail(data.email)) {
      return { success: false, user: null, error: "Invalid email format" };
    }

    // Validate password strength
    const passwordError = validatePassword(data.password);
    if (passwordError) {
      return { success: false, user: null, error: passwordError };
    }

    // Make registration request
    const response = await apiPost<AuthResponse>("/auth/register", data, true);

    if (!response.success || !response.data) {
      logAuthEvent("register", false, response.error || "Unknown error");
      return {
        success: false,
        user: null,
        error: response.error || "Registration failed",
      };
    }

    // Store tokens securely
    await storeAuthTokens(
      response.data.accessToken,
      response.data.refreshToken,
      response.data.expiresIn
    );

    // Store user session
    await storeUserSession(response.data.user.id, response.data.sessionId);

    logAuthEvent("register", true);
    secureLog("Registration successful");

    return { success: true, user: response.data.user, error: null };
  } catch (error) {
    secureError("Registration error", error);
    logAuthEvent("register", false, "Exception occurred");
    return { success: false, user: null, error: "Registration failed" };
  }
};

/**
 * Logout the current user
 *
 * SECURITY NOTE:
 * - Clears all tokens from device
 * - Invalidates session on backend
 * - Clears user data from app state
 */
export const logout = async (): Promise<void> => {
  try {
    secureLog("Attempting logout");

    // Get session info before clearing
    const { sessionId } = await getUserSession();

    // Notify backend to invalidate session (best effort)
    if (sessionId) {
      await apiPost("/auth/logout", { sessionId }).catch(() => {
        // Continue logout even if backend call fails
        secureLog("Backend logout notification failed, continuing local logout");
      });
    }

    // Clear all auth tokens from secure storage
    await clearAuthTokens();

    logAuthEvent("logout", true);
    secureLog("Logout successful");
  } catch (error) {
    secureError("Logout error", error);
    // Still clear tokens even if there's an error
    await clearAuthTokens();
  }
};

/**
 * Get the current authenticated user
 *
 * @returns User object if authenticated, null otherwise
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Check if token exists and is valid
    const { accessToken } = await getAuthTokens();
    if (!accessToken) {
      return null;
    }

    // Check if token is expired
    const expired = await isTokenExpired();
    if (expired) {
      secureLog("Token expired, user needs to re-authenticate");
      return null;
    }

    // Fetch current user from backend
    const response = await apiGet<User>("/auth/me");

    if (!response.success || !response.data) {
      return null;
    }

    return response.data;
  } catch (error) {
    secureError("Get current user error", error);
    return null;
  }
};

/**
 * Check if user is currently authenticated
 *
 * @returns true if authenticated with valid token, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { accessToken } = await getAuthTokens();
    if (!accessToken) {
      return false;
    }

    const expired = await isTokenExpired();
    return !expired;
  } catch (error) {
    secureError("Check authentication error", error);
    return false;
  }
};

/**
 * Validate email format
 *
 * @param email - Email to validate
 * @returns true if valid, false otherwise
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 *
 * @param password - Password to validate
 * @returns Error message if invalid, null if valid
 *
 * SECURITY NOTE:
 * - Minimum 8 characters
 * - Must contain uppercase, lowercase, number
 * - Backend should enforce same or stricter rules
 */
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }

  return null;
};

/**
 * Change user password
 *
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @returns Success status and error message
 *
 * SECURITY NOTE:
 * - Requires current password verification
 * - Backend must validate old password before changing
 * - Backend should invalidate all existing sessions
 * - Send email notification of password change
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return { success: false, error: passwordError };
    }

    // Make password change request
    const response = await apiPost("/auth/change-password", {
      currentPassword,
      newPassword,
    });

    if (!response.success) {
      return { success: false, error: response.error || "Password change failed" };
    }

    logAuthEvent("password_change", true);
    secureLog("Password changed successfully");

    return { success: true, error: null };
  } catch (error) {
    secureError("Change password error", error);
    logAuthEvent("password_change", false, "Exception occurred");
    return { success: false, error: "Password change failed" };
  }
};

/**
 * Request password reset email
 *
 * @param email - User's email address
 * @returns Success status
 *
 * SECURITY NOTE:
 * - Don't reveal if email exists in system
 * - Send time-limited reset link
 * - Implement rate limiting on backend
 */
export const requestPasswordReset = async (
  email: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: "Invalid email format" };
    }

    const response = await apiPost(
      "/auth/request-reset",
      { email },
      true
    );

    // Always return success to not reveal if email exists
    logAuthEvent("password_reset_request", true);
    return { success: true, error: null };
  } catch (error) {
    secureError("Request password reset error", error);
    return { success: true, error: null }; // Still return success
  }
};

/**
 * IMPORTANT SECURITY NOTES:
 *
 * AUTHENTICATION:
 * 1. Never store passwords in plain text (backend responsibility)
 * 2. Use bcrypt or Argon2 for password hashing (backend)
 * 3. Implement rate limiting for login attempts
 * 4. Lock accounts after multiple failed login attempts
 * 5. Send email notifications for suspicious login activity
 * 6. Use HTTPS for all authentication requests
 * 7. Implement CAPTCHA for public-facing login/register
 *
 * TOKEN MANAGEMENT:
 * 8. Access tokens should be short-lived (15-30 minutes)
 * 9. Refresh tokens should be longer-lived (7-30 days)
 * 10. Implement token rotation on refresh
 * 11. Store tokens in secure device storage only
 * 12. Clear tokens immediately on logout
 * 13. Invalidate sessions on password change
 *
 * BACKEND REQUIREMENTS:
 * 14. Validate tokens on every API request
 * 15. Enforce row-level security (users see only their data)
 * 16. Never trust user ID from client - always use token
 * 17. Implement proper CORS policies
 * 18. Use secure session management
 * 19. Log authentication events for security monitoring
 * 20. Implement account lockout and unlock mechanisms
 */
