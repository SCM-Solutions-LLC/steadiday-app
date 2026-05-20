/**
 * Secure API Client
 *
 * This module provides a secure HTTP client for making API requests.
 *
 * SECURITY FEATURES:
 * - Always uses HTTPS
 * - Automatic token attachment
 * - Token refresh on 401 responses
 * - Request/response logging (with redaction)
 * - Timeout protection
 * - Error handling
 */

import { config } from "../config/env";
import {
  getAuthTokens,
  storeAuthTokens,
  isTokenExpired,
  clearAuthTokens,
} from "../security/secureStorage";
import {
  secureLog,
  secureError,
  logApiRequest,
  logApiResponse,
} from "../utils/secureLogger";

/**
 * HTTP methods supported by the client
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Request configuration interface
 */
interface RequestConfig {
  method: HttpMethod;
  endpoint: string;
  data?: any;
  headers?: Record<string, string>;
  skipAuth?: boolean; // Skip adding auth token (for login/register)
  timeout?: number;
}

/**
 * API response interface
 */
interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  success: boolean;
}

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Check if URL is using HTTPS
 *
 * SECURITY DEFENSES:
 * - Attack Story 7 (Compromised WiFi): Only allows HTTPS in production
 * - Prevents man-in-the-middle attacks on public networks
 * - Certificate validation happens automatically via fetch API
 *
 * IMPORTANT: Always enforce HTTPS in production
 */
const ensureHttps = (url: string): void => {
  if (config.environment === "production" && !url.startsWith("https://")) {
    throw new Error("Unable to connect securely. Please check your internet connection.");
  }
};

/**
 * Refresh the access token using the refresh token
 *
 * @returns New access token or null if refresh failed
 *
 * SECURITY NOTE: This is where token rotation happens
 * Backend should invalidate old refresh token and issue new one
 */
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const { refreshToken } = await getAuthTokens();

    if (!refreshToken) {
      secureLog("No refresh token available");
      return null;
    }

    // Make refresh request to backend
    const response = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      secureError("Token refresh failed", { status: response.status });
      // Clear tokens if refresh fails (user needs to log in again)
      await clearAuthTokens();
      return null;
    }

    const data = await response.json();

    // Store new tokens
    await storeAuthTokens(
      data.accessToken,
      data.refreshToken,
      data.expiresIn
    );

    secureLog("Access token refreshed successfully");
    return data.accessToken;
  } catch (error) {
    secureError("Token refresh error", error);
    await clearAuthTokens();
    return null;
  }
};

/**
 * Make a secure API request
 *
 * @param config - Request configuration
 * @returns API response with data or error
 *
 * SECURITY FEATURES:
 * - Automatic HTTPS enforcement
 * - Token attachment from secure storage
 * - Automatic token refresh on 401
 * - Request timeout
 * - Error handling
 */
export const apiRequest = async <T = any>(
  requestConfig: RequestConfig
): Promise<ApiResponse<T>> => {
  const {
    method,
    endpoint,
    data,
    headers = {},
    skipAuth = false,
    timeout = config.apiTimeout,
  } = requestConfig;

  // Build full URL
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${config.apiBaseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  // Ensure HTTPS in production
  ensureHttps(url);

  try {
    // Prepare headers
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    };

    // Add authentication token if not skipped
    if (!skipAuth) {
      // Check if token is expired and refresh if needed
      const expired = await isTokenExpired();
      if (expired) {
        secureLog("Token expired, attempting refresh");
        const newToken = await refreshAccessToken();
        if (!newToken) {
          return {
            data: null,
            error: "Authentication failed. Please log in again.",
            status: 401,
            success: false,
          };
        }
      }

      const { accessToken } = await getAuthTokens();
      if (accessToken) {
        requestHeaders["Authorization"] = `Bearer ${accessToken}`;
      } else if (!skipAuth) {
        return {
          data: null,
          error: "Not authenticated. Please log in.",
          status: 401,
          success: false,
        };
      }
    }

    // Log request (sensitive data will be redacted)
    logApiRequest(method, url, data);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Make request
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Log response
    logApiResponse(response.status, url);

    // Handle 401 - Unauthorized (try to refresh token once)
    if (response.status === 401 && !skipAuth) {
      secureLog("Received 401, attempting token refresh");
      const newToken = await refreshAccessToken();

      if (newToken) {
        // Retry request with new token
        requestHeaders["Authorization"] = `Bearer ${newToken}`;

        const retryResponse = await fetch(url, {
          method,
          headers: requestHeaders,
          body: data ? JSON.stringify(data) : undefined,
        });

        logApiResponse(retryResponse.status, url);

        const retryData = await retryResponse.json();

        return {
          data: retryResponse.ok ? retryData : null,
          error: retryResponse.ok ? null : retryData.message || "Request failed",
          status: retryResponse.status,
          success: retryResponse.ok,
        };
      } else {
        // Refresh failed, return 401
        return {
          data: null,
          error: "Session expired. Please log in again.",
          status: 401,
          success: false,
        };
      }
    }

    // Parse response
    const responseData = await response.json();

    return {
      data: response.ok ? responseData : null,
      error: response.ok ? null : responseData.message || "Request failed",
      status: response.status,
      success: response.ok,
    };
  } catch (error: any) {
    secureError("API request failed", error);

    // Handle timeout
    if (error.name === "AbortError") {
      return {
        data: null,
        error: "Request timed out. Please try again.",
        status: 408,
        success: false,
      };
    }

    // Handle network errors
    return {
      data: null,
      error: error.message || "Network error. Please check your connection.",
      status: 0,
      success: false,
    };
  }
};

/**
 * Convenience methods for different HTTP verbs
 */

export const apiGet = async <T = any>(
  endpoint: string,
  skipAuth = false
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ method: "GET", endpoint, skipAuth });
};

export const apiPost = async <T = any>(
  endpoint: string,
  data?: any,
  skipAuth = false
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ method: "POST", endpoint, data, skipAuth });
};

export const apiPut = async <T = any>(
  endpoint: string,
  data?: any,
  skipAuth = false
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ method: "PUT", endpoint, data, skipAuth });
};

export const apiPatch = async <T = any>(
  endpoint: string,
  data?: any,
  skipAuth = false
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ method: "PATCH", endpoint, data, skipAuth });
};

export const apiDelete = async <T = any>(
  endpoint: string,
  skipAuth = false
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ method: "DELETE", endpoint, skipAuth });
};

/**
 * IMPORTANT SECURITY NOTES:
 *
 * 1. ALWAYS use HTTPS in production - this is enforced by ensureHttps()
 * 2. Never trust data from the client - backend MUST validate everything
 * 3. Backend should verify tokens on EVERY request
 * 4. Backend should enforce row-level security (users see only their data)
 * 5. Use short-lived access tokens (15-30 minutes)
 * 6. Implement token refresh flow properly
 * 7. Clear tokens immediately on logout
 * 8. Never send passwords in URLs or query parameters
 * 9. Implement rate limiting on the backend
 * 10. Consider certificate pinning for production apps
 * 11. Log authentication failures for security monitoring
 * 12. Implement proper CORS policies on backend
 * 13. Use secure session management on backend
 * 14. Validate all input on backend before processing
 * 15. Never expose internal error details to client
 */
