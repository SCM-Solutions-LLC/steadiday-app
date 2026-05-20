/**
 * Secure Storage Module
 *
 * This module provides secure storage for sensitive data using Expo SecureStore,
 * which uses the device's secure keychain on iOS and encrypted SharedPreferences on Android.
 *
 * SECURITY FEATURES:
 * - Uses hardware-backed keychain on iOS
 * - Encrypted storage on Android
 * - Data is isolated per app
 * - Automatic cleanup on app uninstall
 * - Biometric protection available (iOS)
 */

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { secureLog } from "../utils/secureLogger";

/**
 * Get SecureStore options lazily to prevent accessing native module at module load time
 * This prevents crashes on TestFlight/production builds
 */
function getSecureStoreOptions(): SecureStore.SecureStoreOptions {
  return {
    // Require device authentication (biometric or PIN) for extra sensitive data
    // Set to ALWAYS, AFTER_FIRST_UNLOCK, or WHEN_UNLOCKED
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  };
}

/**
 * Storage keys for different types of sensitive data
 * Centralized to prevent typos and ensure consistency
 */
export const STORAGE_KEYS = {
  // Authentication tokens
  ACCESS_TOKEN: "secure_access_token",
  REFRESH_TOKEN: "secure_refresh_token",
  TOKEN_EXPIRY: "secure_token_expiry",

  // User credentials (only if needed for offline access)
  USER_ID: "secure_user_id",
  USER_EMAIL: "secure_user_email",

  // Biometric settings
  BIOMETRIC_ENABLED: "secure_biometric_enabled",

  // Session info
  LAST_LOGIN: "secure_last_login",
  SESSION_ID: "secure_session_id",
} as const;

/**
 * Store a secure item in the device's secure storage
 *
 * @param key - The key to store the value under
 * @param value - The value to store (will be converted to string)
 * @returns Promise that resolves when storage is complete
 *
 * SECURITY NOTE: All data is encrypted at rest by the OS
 */
export const setSecureItem = async (
  key: string,
  value: string
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value, getSecureStoreOptions());
    secureLog("Secure item stored", { key });
  } catch (error) {
    secureLog("Failed to store secure item", { key, error });
    throw new Error(`Failed to store secure item: ${key}`);
  }
};

/**
 * Retrieve a secure item from the device's secure storage
 *
 * @param key - The key to retrieve
 * @returns The stored value, or null if not found
 */
export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    const value = await SecureStore.getItemAsync(key, getSecureStoreOptions());
    if (value) {
      secureLog("Secure item retrieved", { key });
    }
    return value;
  } catch (error) {
    secureLog("Failed to retrieve secure item", { key, error });
    return null;
  }
};

/**
 * Delete a secure item from the device's secure storage
 *
 * @param key - The key to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteSecureItem = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key, getSecureStoreOptions());
    secureLog("Secure item deleted", { key });
  } catch (error) {
    secureLog("Failed to delete secure item", { key, error });
    // Don't throw error if item doesn't exist
  }
};

/**
 * Store authentication tokens securely
 *
 * @param accessToken - Short-lived access token
 * @param refreshToken - Longer-lived refresh token
 * @param expiresIn - Token expiry time in seconds
 *
 * SECURITY NOTE:
 * - Access tokens should be short-lived (15-30 minutes)
 * - Refresh tokens should be longer-lived (7-30 days)
 * - Both are stored in secure device keychain
 */
export const storeAuthTokens = async (
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> => {
  try {
    const expiryTime = Date.now() + expiresIn * 1000;

    await Promise.all([
      setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      setSecureItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString()),
    ]);

    secureLog("Auth tokens stored successfully");
  } catch (error) {
    secureLog("Failed to store auth tokens", { error });
    throw error;
  }
};

/**
 * Retrieve stored authentication tokens
 *
 * @returns Object containing access token, refresh token, and expiry time
 */
export const getAuthTokens = async (): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  expiryTime: number | null;
}> => {
  try {
    const [accessToken, refreshToken, expiryString] = await Promise.all([
      getSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
      getSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
      getSecureItem(STORAGE_KEYS.TOKEN_EXPIRY),
    ]);

    const expiryTime = expiryString ? parseInt(expiryString, 10) : null;

    return { accessToken, refreshToken, expiryTime };
  } catch (error) {
    secureLog("Failed to retrieve auth tokens", { error });
    return { accessToken: null, refreshToken: null, expiryTime: null };
  }
};

/**
 * Check if the access token is expired
 *
 * @returns true if token is expired or missing, false otherwise
 */
export const isTokenExpired = async (): Promise<boolean> => {
  try {
    const expiryString = await getSecureItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiryString) return true;

    const expiryTime = parseInt(expiryString, 10);
    // Add 5-minute buffer to refresh before actual expiry
    return Date.now() >= expiryTime - 5 * 60 * 1000;
  } catch (error) {
    secureLog("Failed to check token expiry", { error });
    return true;
  }
};

/**
 * Clear all authentication tokens from secure storage
 * Called during logout or when tokens are invalidated
 *
 * SECURITY NOTE: Always clear tokens on logout to prevent unauthorized access
 */
export const clearAuthTokens = async (): Promise<void> => {
  try {
    await Promise.all([
      deleteSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
      deleteSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
      deleteSecureItem(STORAGE_KEYS.TOKEN_EXPIRY),
      deleteSecureItem(STORAGE_KEYS.USER_ID),
      deleteSecureItem(STORAGE_KEYS.SESSION_ID),
    ]);

    secureLog("Auth tokens cleared successfully");
  } catch (error) {
    secureLog("Failed to clear auth tokens", { error });
    throw error;
  }
};

/**
 * Store user session information
 *
 * @param userId - The user's unique identifier
 * @param sessionId - The current session ID
 */
export const storeUserSession = async (
  userId: string,
  sessionId: string
): Promise<void> => {
  try {
    await Promise.all([
      setSecureItem(STORAGE_KEYS.USER_ID, userId),
      setSecureItem(STORAGE_KEYS.SESSION_ID, sessionId),
      setSecureItem(STORAGE_KEYS.LAST_LOGIN, Date.now().toString()),
    ]);

    secureLog("User session stored");
  } catch (error) {
    secureLog("Failed to store user session", { error });
    throw error;
  }
};

/**
 * Get stored user session information
 *
 * @returns Object containing userId and sessionId
 */
export const getUserSession = async (): Promise<{
  userId: string | null;
  sessionId: string | null;
}> => {
  try {
    const [userId, sessionId] = await Promise.all([
      getSecureItem(STORAGE_KEYS.USER_ID),
      getSecureItem(STORAGE_KEYS.SESSION_ID),
    ]);

    return { userId, sessionId };
  } catch (error) {
    secureLog("Failed to retrieve user session", { error });
    return { userId: null, sessionId: null };
  }
};

/**
 * Clear all secure storage
 * WARNING: This will delete all securely stored data
 * Use only when absolutely necessary (e.g., account deletion)
 */
export const clearAllSecureData = async (): Promise<void> => {
  try {
    // Clear all known keys
    const allKeys = Object.values(STORAGE_KEYS);
    await Promise.all(allKeys.map((key) => deleteSecureItem(key)));

    secureLog("All secure data cleared");
  } catch (error) {
    secureLog("Failed to clear all secure data", { error });
    throw error;
  }
};

/**
 * IMPORTANT SECURITY NOTES:
 *
 * 1. Never log actual token values or passwords
 * 2. SecureStore has a 2KB limit per item on Android
 * 3. Data is automatically encrypted by the OS
 * 4. Tokens are cleared on app uninstall
 * 5. Use WHEN_UNLOCKED for most sensitive data
 * 6. Consider implementing token rotation for enhanced security
 * 7. Backend must validate all tokens on every request
 * 8. Implement proper session management on the backend
 * 9. Use HTTPS for all API calls to prevent token interception
 * 10. Consider implementing certificate pinning for production
 */
