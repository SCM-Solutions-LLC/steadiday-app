/**
 * Environment Configuration
 *
 * This file manages non-sensitive environment variables and configuration.
 *
 * SECURITY NOTE:
 * - This file contains ONLY non-sensitive configuration values
 * - API keys and secrets are NEVER stored here
 * - All sensitive data is stored in secure device storage (SecureStore)
 * - Backend API keys should remain on the server, never in the client
 *
 * ATTACK STORY 3 DEFENSE (Reverse Engineering):
 * - No API keys in client code
 * - No secret algorithms
 * - Only safe public configuration
 * - Backend URLs are safe to expose (all routes protected by auth)
 */

import Constants from "expo-constants";
import { logger } from "../utils/logger";

/**
 * Environment-specific configuration
 *
 * SECURITY: Clean separation between dev, staging, and production
 * Each environment has its own API base URL and settings
 *
 * CONFIGURATION:
 * Set environment in app.json before building:
 * {
 *   "expo": {
 *     "extra": {
 *       "environment": "production"  // or "development" or "staging"
 *     }
 *   }
 * }
 */
const ENVIRONMENTS = {
  development: {
    apiBaseUrl: process.env.EXPO_PUBLIC_BACKEND_URL
      || "http://localhost:3000",
    enableLogging: true,
    enableDebugTools: true,
    name: "development" as const,
  },
  staging: {
    apiBaseUrl: process.env.EXPO_PUBLIC_BACKEND_URL
      || "https://staging-api.steadiday.com",
    enableLogging: true,
    enableDebugTools: false,
    name: "staging" as const,
  },
  production: {
    apiBaseUrl: process.env.EXPO_PUBLIC_BACKEND_URL
      || "https://api.steadiday.com",
    enableLogging: false,
    enableDebugTools: false,
    name: "production" as const,
  },
} as const;

/**
 * Safely get current environment from Expo config
 * Defaults to development in __DEV__ mode, production otherwise
 * Uses lazy evaluation to prevent crashes during module load
 */
function getCurrentEnvironment(): keyof typeof ENVIRONMENTS {
  try {
    const envFromConfig = Constants.expoConfig?.extra?.environment;
    if (envFromConfig && ENVIRONMENTS[envFromConfig as keyof typeof ENVIRONMENTS]) {
      return envFromConfig as keyof typeof ENVIRONMENTS;
    }
  } catch (error) {
    logger.warn("[Config] Failed to read environment from Constants");
  }
  // In production builds (__DEV__ is false), default to production
  // In development builds (__DEV__ is true), default to development
  return __DEV__ ? "development" : "production";
}

// Get environment lazily to prevent crashes
const currentEnv = getCurrentEnvironment();

/**
 * Configuration interface for environment variables
 */
interface AppConfig {
  // API Configuration
  apiBaseUrl: string;
  apiTimeout: number;

  // Feature flags (non-sensitive)
  enableBiometric: boolean;
  enableHealthSync: boolean;
  enablePushNotifications: boolean;

  // Logging and debugging
  enableLogging: boolean;
  enableDebugTools: boolean;

  // App info
  appVersion: string;
  buildNumber: string;
  environment: "development" | "staging" | "production";
  environmentName: string;
}

/**
 * Safely get app version from Constants
 */
function getAppVersion(): string {
  try {
    return Constants.expoConfig?.version || "1.0.0";
  } catch (error) {
    return "1.0.0";
  }
}

/**
 * Safely get build number from Constants
 */
function getBuildNumber(): string {
  try {
    return Constants.expoConfig?.ios?.buildNumber || "1";
  } catch (error) {
    return "1";
  }
}

/**
 * Application configuration object
 *
 * All values here are non-sensitive and safe to bundle with the app
 *
 * SECURITY: This is the single source of truth for environment config
 */
export const config: AppConfig = {
  // Spread environment-specific config
  ...ENVIRONMENTS[currentEnv],

  // API settings
  apiTimeout: 30000, // 30 seconds

  // Feature flags
  enableBiometric: true,
  enableHealthSync: true,
  enablePushNotifications: true,

  // App metadata - use safe getters to prevent crashes
  appVersion: getAppVersion(),
  buildNumber: getBuildNumber(),
  environment: currentEnv,
  environmentName: ENVIRONMENTS[currentEnv].name,
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return config.environment === "development" || __DEV__;
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return config.environment === "production";
};

/**
 * Check if running in staging mode
 */
export const isStaging = (): boolean => {
  return config.environment === "staging";
};

/**
 * Get the full API URL for an endpoint
 *
 * @param endpoint - The API endpoint path (e.g., "/users/me")
 * @returns Full URL including base URL
 */
export const getApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with /
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${config.apiBaseUrl}${path}`;
};

/**
 * DEVELOPER-ONLY: Environment information
 *
 * Only available in development builds (__DEV__ = true)
 * NOT visible to production users
 *
 * Usage in development:
 * import { __DEV_ENV_INFO__ } from './config/env';
 * console.log(__DEV_ENV_INFO__);
 */
export const __DEV_ENV_INFO__ = __DEV__
  ? {
      current: currentEnv,
      apiBaseUrl: config.apiBaseUrl,
      available: Object.keys(ENVIRONMENTS),
      isProduction: isProduction(),
      isDevelopment: isDevelopment(),
      isStaging: isStaging(),
      loggingEnabled: config.enableLogging,
      debugToolsEnabled: config.enableDebugTools,
    }
  : null;

/**
 * IMPORTANT SECURITY NOTES:
 *
 * ENVIRONMENT SEPARATION:
 * 1. Dev, staging, and production are completely separate
 * 2. Production builds never use staging URLs or keys
 * 3. Staging builds never hit production
 * 4. Dev builds use localhost
 *
 * WHAT STAYS CLIENT-SIDE (SAFE):
 * - API base URLs (all routes require auth)
 * - Feature flags
 * - App version
 * - Timeout values
 *
 * WHAT STAYS SERVER-SIDE (REQUIRED):
 * - Database credentials
 * - API secrets/keys
 * - Encryption keys
 * - Admin endpoints
 * - Internal service URLs
 * - Payment processor keys
 * - Email service credentials
 *
 * CONFIGURATION MANAGEMENT:
 * 1. Set environment in app.json before building
 * 2. Use EAS build profiles for different environments:
 *    - eas build --profile development
 *    - eas build --profile staging
 *    - eas build --profile production
 * 3. Never commit .env files with secrets
 * 4. Use environment variables in CI/CD
 * 5. Validate environment on app startup
 *
 * BACKEND REQUIREMENTS:
 * 1. All API routes must require authentication
 * 2. Never expose admin endpoints to client
 * 3. Rate limit all public endpoints
 * 4. Validate all tokens on every request
 * 5. Log all authentication events
 * 6. Use separate databases for dev/staging/production
 * 7. Different API keys per environment
 */
