/**
 * Firebase service wrapper.
 *
 * All app-side analytics, crash reporting, and remote config flow through
 * here. Gracefully no-ops when native modules are unavailable (Expo Go).
 */

import { logger } from "./logger";
import { isDevelopment } from "../config/env";

let _analytics: any = null;
let _crashlytics: any = null;
let _remoteConfig: any = null;
let _nativeAvailable = false;

try {
  _analytics = require("@react-native-firebase/analytics").default;
  _crashlytics = require("@react-native-firebase/crashlytics").default;
  _remoteConfig = require("@react-native-firebase/remote-config").default;
  _nativeAvailable = true;
} catch {
  if (isDevelopment()) {
    logger.log("[Firebase] Native modules not available (Expo Go). Analytics disabled.");
  }
}

export async function logEvent(
  name: string,
  params?: Record<string, string | number>
): Promise<void> {
  try {
    if (!_nativeAvailable) return;
    await _analytics().logEvent(name, params);
    if (isDevelopment()) {
      logger.log(`[Firebase] Event: ${name}`, params);
    }
  } catch (err) {
    logger.error("[Firebase] logEvent error:", err);
  }
}

export async function setUserProperty(
  name: string,
  value: string | null
): Promise<void> {
  try {
    if (!_nativeAvailable) return;
    await _analytics().setUserProperty(name, value);
  } catch (err) {
    logger.error("[Firebase] setUserProperty error:", err);
  }
}

export async function logScreenView(screenName: string): Promise<void> {
  try {
    if (!_nativeAvailable) return;
    await _analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (err) {
    logger.error("[Firebase] logScreenView error:", err);
  }
}

/**
 * Log a non-fatal error to Crashlytics. NEVER pass medication names,
 * health metrics, contact info, or any PHI — pass only error info.
 */
export function recordError(error: Error, context?: string): void {
  try {
    if (!_nativeAvailable) return;
    if (context) {
      _crashlytics().log(context);
    }
    _crashlytics().recordError(error);
  } catch (err) {
    logger.error("[Firebase] recordError error:", err);
  }
}

export function logCrashlyticsMessage(message: string): void {
  try {
    if (!_nativeAvailable) return;
    _crashlytics().log(message);
  } catch (err) {
    logger.error("[Firebase] crashlytics log error:", err);
  }
}

let _remoteConfigInitialized = false;

export async function initRemoteConfig(
  defaults: Record<string, string | number | boolean>
): Promise<void> {
  try {
    if (!_nativeAvailable) return;
    await _remoteConfig().setConfigSettings({
      minimumFetchIntervalMillis: isDevelopment() ? 0 : 3600 * 1000,
    });
    await _remoteConfig().setDefaults(defaults);
    await _remoteConfig().fetchAndActivate();
    _remoteConfigInitialized = true;
  } catch (err) {
    logger.error("[Firebase] initRemoteConfig error:", err);
  }
}

export function getRemoteConfigString(key: string): string {
  if (!_remoteConfigInitialized || !_nativeAvailable) return "";
  return _remoteConfig().getValue(key).asString();
}

export function getRemoteConfigBoolean(key: string): boolean {
  if (!_remoteConfigInitialized || !_nativeAvailable) return false;
  return _remoteConfig().getValue(key).asBoolean();
}

export function getRemoteConfigNumber(key: string): number {
  if (!_remoteConfigInitialized || !_nativeAvailable) return 0;
  return _remoteConfig().getValue(key).asNumber();
}
