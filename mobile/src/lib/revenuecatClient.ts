/**
 * RevenueCat Client Module
 *
 * This module provides a centralized RevenueCat SDK wrapper that gracefully handles
 * missing configuration. The app will work fine whether or not RevenueCat is configured.
 *
 * CRITICAL: Uses dynamic import to prevent crashes during module load.
 */

import { Platform } from "react-native";
import { logger } from "../utils/logger";

// =============================================================================
// CONFIGURATION STATE
// =============================================================================

let isConfigured = false;
let configurationError: Error | null = null;
let PurchasesModule: any = null; // Loaded dynamically
let initializationAttempted = false;

const isWeb = Platform.OS === "web";

const LOG_PREFIX = "[RevenueCat]";

// Fallback keys for production builds where env vars may not be available immediately
// These ensure purchases work even if environment variables aren't loaded at startup
const FALLBACK_TEST_KEY = ""; // No fallback for test - must use env var
const FALLBACK_PROD_KEY = ""; // v1.0: IAP disabled — restore key when re-enabling

const isValidEnvVar = (value: string | undefined): boolean => {
  try {
    return value !== undefined && value !== null && value !== "" && value !== "undefined";
  } catch {
    return false;
  }
};

const getApiKey = (): string | null => {
  try {
    if (isWeb) return null;
    const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false;

    logger.debug("[RC] __DEV__:", isDev, "Platform:", Platform.OS);

    if (isDev) {
      const envKey = process.env.EXPO_PUBLIC_VIBECODE_REVENUECAT_TEST_KEY;
      const key = isValidEnvVar(envKey) ? envKey! : (FALLBACK_TEST_KEY || null);
      logger.debug("[RC] Using TEST key, prefix:", key ? key.slice(0, 5) : "none");
      return key;
    } else {
      // Production: use platform-specific keys
      if (Platform.OS === "android") {
        const androidKey = process.env.EXPO_PUBLIC_VIBECODE_REVENUECAT_ANDROID_KEY;
        if (isValidEnvVar(androidKey)) {
          logger.debug("[RC] Using Android PROD key, prefix:", androidKey!.slice(0, 5));
          return androidKey!;
        }
        // Fall through to Apple key if Android key not set (single-project setup)
      }

      const envKey = process.env.EXPO_PUBLIC_VIBECODE_REVENUECAT_APPLE_KEY;
      const key = isValidEnvVar(envKey) ? envKey! : FALLBACK_PROD_KEY;
      logger.debug("[RC] Using PROD key, prefix:", key ? key.slice(0, 5) : "none");
      return key;
    }
  } catch (error) {
    logger.error(`${LOG_PREFIX} Error getting API key:`, error);
    const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false;
    return isDev ? null : FALLBACK_PROD_KEY;
  }
};

// Note: apiKey is evaluated at module load time. Use getCurrentApiKey() for dynamic checks.
let apiKey = getApiKey();
let canUseRevenueCat = !isWeb && typeof apiKey === "string" && apiKey.length > 0;

/**
 * Re-evaluate the API key (useful for retry scenarios where env vars may have loaded late)
 */
const refreshApiKey = (): void => {
  apiKey = getApiKey();
  canUseRevenueCat = !isWeb && typeof apiKey === "string" && apiKey.length > 0;
};

export type RevenueCatGuardReason = "web_not_supported" | "not_configured" | "sdk_error";
export type RevenueCatResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: RevenueCatGuardReason; error?: unknown };

/**
 * Dynamically load the RevenueCat module
 * This prevents crashes during initial bundle execution
 */
const loadPurchasesModule = async (): Promise<boolean> => {
  if (PurchasesModule) return true;
  if (isWeb) return false;

  try {
    const module = await import("react-native-purchases");
    PurchasesModule = module.default;
    return true;
  } catch (error) {
    logger.debug(`${LOG_PREFIX} Native module not available (expected in Expo Go):`, error);
    configurationError = error instanceof Error ? error : new Error(String(error));
    return false;
  }
};

/**
 * Delay helper for retry mechanism
 */
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Initialize RevenueCat SDK
 * Call this AFTER app has mounted
 * Includes retry mechanism for cases where env vars aren't immediately available
 */
export const initializeRevenueCatSDK = async (): Promise<boolean> => {
  if (isConfigured) {
    logger.log("[RC] Already initialized, returning true");
    return true;
  }

  initializationAttempted = true;

  // Retry configuration: 3 attempts with 2-second delays
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Refresh API key on each attempt (env vars may have loaded)
    refreshApiKey();

    if (!canUseRevenueCat || !apiKey) {
      if (!isWeb) {
        logger.log(`[RC] Attempt ${attempt}/${MAX_RETRIES}: API key not available`);
      }

      if (attempt < MAX_RETRIES) {
        logger.log(`[RC] Waiting ${RETRY_DELAY_MS}ms before retry...`);
        await delay(RETRY_DELAY_MS);
        continue;
      }

      logger.log("[RC] All retry attempts exhausted - API key still not available");
      return false;
    }

    try {
      // Load module dynamically first
      const loaded = await loadPurchasesModule();
      if (!loaded || !PurchasesModule) {
        logger.debug(`[RC] Attempt ${attempt}/${MAX_RETRIES}: Module not loaded`);
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY_MS);
          continue;
        }
        return false;
      }

      // Log key prefix for debugging TestFlight issues
      const keyPrefix = apiKey.slice(0, 5);
      const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false;
      logger.log(`[RC] Attempt ${attempt}/${MAX_RETRIES}: Configuring SDK - key_prefix: ${keyPrefix}, __DEV__: ${isDev}`);

      // Configure the SDK
      try {
        PurchasesModule.setLogHandler((logLevel: any, message: string) => {
          if (logLevel === PurchasesModule.LOG_LEVEL?.ERROR) {
            logger.debug("[RC SDK]", message);
          }
        });
      } catch {
        // Ignore if setLogHandler not available
      }

      PurchasesModule.configure({ apiKey });
      isConfigured = true;
      configurationError = null;
      logger.log(`[RC] SDK initialized successfully on attempt ${attempt} - key_prefix: ${keyPrefix}`);
      return true;
    } catch (error) {
      configurationError = error instanceof Error ? error : new Error(String(error));
      logger.debug(`[RC] Attempt ${attempt}/${MAX_RETRIES}: Failed to initialize:`, error);

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS);
      }
    }
  }

  logger.debug("[RC] All initialization attempts failed - RevenueCat not available in this environment");
  return false;
};

/**
 * Reinitialize RevenueCat SDK
 * Can be called to retry initialization if it previously failed
 * Useful when navigating to subscription screens after initial failure
 */
export const reinitializeRevenueCat = async (): Promise<boolean> => {
  // If already configured, just return success
  if (isConfigured && !configurationError && PurchasesModule !== null) {
    logger.log("[RC] reinitialize called but already configured - returning true");
    return true;
  }

  // Reset state to allow re-initialization
  logger.log("[RC] reinitialize called - resetting state and attempting initialization");
  isConfigured = false;
  configurationError = null;

  return initializeRevenueCatSDK();
};

export const isRevenueCatEnabled = (): boolean => {
  return canUseRevenueCat && isConfigured && !configurationError && PurchasesModule !== null;
};

// Guard for all RevenueCat operations
const guardRevenueCatUsage = async <T>(
  action: string,
  operation: () => Promise<T>
): Promise<RevenueCatResult<T>> => {
  if (isWeb) {
    return { ok: false, reason: "web_not_supported" };
  }
  if (!canUseRevenueCat || !isConfigured || configurationError || !PurchasesModule) {
    logger.debug("[RC] Guard blocked:", action, "- not configured");
    return { ok: false, reason: "not_configured" };
  }
  try {
    const data = await operation();
    return { ok: true, data };
  } catch (error) {
    logger.error("[RC]", action, "failed:", error);
    return { ok: false, reason: "sdk_error", error };
  }
};

export const getOfferings = (): Promise<RevenueCatResult<any>> => {
  return guardRevenueCatUsage("getOfferings", () => PurchasesModule.getOfferings());
};

export const purchasePackage = (packageToPurchase: any): Promise<RevenueCatResult<any>> => {
  return guardRevenueCatUsage("purchasePackage", async () => {
    const { customerInfo } = await PurchasesModule.purchasePackage(packageToPurchase);
    return customerInfo;
  });
};

export const getCustomerInfo = (): Promise<RevenueCatResult<any>> => {
  return guardRevenueCatUsage("getCustomerInfo", () => PurchasesModule.getCustomerInfo());
};

export const restorePurchases = (): Promise<RevenueCatResult<any>> => {
  return guardRevenueCatUsage("restorePurchases", () => PurchasesModule.restorePurchases());
};

export const setUserId = (userId: string): Promise<RevenueCatResult<void>> => {
  return guardRevenueCatUsage("setUserId", async () => {
    await PurchasesModule.logIn(userId);
  });
};

export const logoutUser = (): Promise<RevenueCatResult<void>> => {
  return guardRevenueCatUsage("logoutUser", async () => {
    await PurchasesModule.logOut();
  });
};

export const hasEntitlement = async (entitlementId: string): Promise<RevenueCatResult<boolean>> => {
  const customerInfoResult = await getCustomerInfo();
  if (!customerInfoResult.ok) {
    return { ok: false, reason: customerInfoResult.reason, error: customerInfoResult.error };
  }
  const isActive = Boolean(customerInfoResult.data.entitlements.active?.[entitlementId]);
  return { ok: true, data: isActive };
};

export const hasActiveSubscription = async (): Promise<RevenueCatResult<boolean>> => {
  const customerInfoResult = await getCustomerInfo();
  if (!customerInfoResult.ok) {
    return { ok: false, reason: customerInfoResult.reason, error: customerInfoResult.error };
  }
  const hasSubscription = Object.keys(customerInfoResult.data.entitlements.active || {}).length > 0;
  return { ok: true, data: hasSubscription };
};

export const getPackage = async (packageIdentifier: string): Promise<RevenueCatResult<any | null>> => {
  const offeringsResult = await getOfferings();
  if (!offeringsResult.ok) {
    return { ok: false, reason: offeringsResult.reason, error: offeringsResult.error };
  }
  const pkg = offeringsResult.data.current?.availablePackages.find(
    (availablePackage: any) => availablePackage.identifier === packageIdentifier
  ) ?? null;
  return { ok: true, data: pkg };
};
