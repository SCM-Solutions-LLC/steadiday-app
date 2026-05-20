/**
 * Platform-agnostic Health Data Sync
 *
 * Provides a unified API for syncing health data from either
 * Apple Health (iOS) or Health Connect (Android).
 *
 * Usage: The Health screen and Home screen call these functions
 * regardless of platform.
 */

import { Platform } from "react-native";
import { HealthMetric } from "../types/app";
import { isAndroidFeaturesActive } from "../config/platformConfig";
import { logger } from "./logger";

// iOS imports
import {
  requestHealthPermissions as requestApplePermissions,
  syncHealthDataFromAppleHealth,
  checkHealthPermissions as checkApplePermissions,
} from "./appleHealthSync";

// Android imports
import {
  requestHealthConnectPermissions,
  syncHealthDataFromHealthConnect,
  checkHealthConnectPermissions,
  checkHealthConnectAvailability,
  openHealthConnectPlayStore,
  openHealthConnectSettings,
  type HealthConnectAvailability,
} from "./healthConnectSync";

/**
 * Request health data permissions from the platform-appropriate source.
 */
export async function requestHealthPermissions(): Promise<boolean> {
  if (Platform.OS === "ios") {
    const result = await requestApplePermissions();
    return result.granted;
  }

  if (isAndroidFeaturesActive()) {
    return requestHealthConnectPermissions();
  }

  return false;
}

/**
 * Check if health permissions are already granted.
 */
export async function checkHealthPermissions(): Promise<boolean> {
  if (Platform.OS === "ios") {
    return checkApplePermissions();
  }

  if (isAndroidFeaturesActive()) {
    return checkHealthConnectPermissions();
  }

  return false;
}

/**
 * Sync health data from the platform-appropriate health source.
 *
 * @param addOrUpdateMetric - callback to persist each metric
 * @param isInitialSync - if true, fetch 90 days of historical data
 */
export async function syncHealthData(
  addOrUpdateMetric: (metric: HealthMetric) => void,
  isInitialSync: boolean = false
): Promise<boolean> {
  if (Platform.OS === "ios") {
    return syncHealthDataFromAppleHealth(addOrUpdateMetric, isInitialSync);
  }

  if (isAndroidFeaturesActive()) {
    return syncHealthDataFromHealthConnect(addOrUpdateMetric, isInitialSync);
  }

  logger.log("[Health Sync] No health platform available");
  return false;
}

/**
 * Get the display name for the current platform's health source.
 */
export function getHealthSourceName(): string {
  if (Platform.OS === "ios") {
    return "Apple Health";
  }
  if (isAndroidFeaturesActive()) {
    return "Health Connect";
  }
  return "Health";
}

/**
 * Check if a health data source is available on this platform.
 */
export async function isHealthSourceAvailable(): Promise<boolean> {
  if (Platform.OS === "ios") {
    return true;
  }

  if (isAndroidFeaturesActive()) {
    const availability = await checkHealthConnectAvailability();
    return availability === "available";
  }

  return false;
}

// Re-export Android-specific utilities for the Health screen
export {
  checkHealthConnectAvailability,
  openHealthConnectPlayStore,
  openHealthConnectSettings,
  type HealthConnectAvailability,
};
