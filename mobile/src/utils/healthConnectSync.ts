/**
 * Health Connect Integration for SteadiDay (Android)
 *
 * This utility handles syncing health data from Google Health Connect on Android,
 * mirroring the same functionality as appleHealthSync.ts for iOS.
 *
 * IMPORTANT: Uses lazy loading to prevent crashes on non-Android devices
 * or when Health Connect is not installed.
 *
 * Health Connect requires Android 14+ natively, or the Health Connect app
 * installed on Android 9-13.
 */

import { HealthMetric } from "../types/app";
import { format } from "date-fns";
import { Platform, Linking } from "react-native";
import { logger } from "./logger";
import { isAndroidFeaturesActive } from "../config/platformConfig";

// Lazy load react-native-health-connect to prevent crashes
let HealthConnect: any = null;
let healthConnectLoadAttempted = false;
let healthConnectLoadError: string | null = null;

/**
 * Health Connect data interface — mirrors AppleHealthData
 */
export interface HealthConnectData {
  steps: number;
  heartRate: number;
  sleepHours: number;
  exerciseMinutes: number;
  weight: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
}

/**
 * Health Connect availability status
 */
export type HealthConnectAvailability = "available" | "not_installed" | "not_supported" | "unknown";

/**
 * Safely get the Health Connect module with lazy loading.
 * Returns null if not on Android or if the native module fails to load.
 */
function getHealthConnect(): any {
  // Only works on Android with the feature flag enabled
  if (Platform.OS !== "android") {
    return null;
  }

  if (!isAndroidFeaturesActive()) {
    return null;
  }

  // Return cached result if already attempted
  if (healthConnectLoadAttempted) {
    return HealthConnect;
  }

  healthConnectLoadAttempted = true;

  try {
    const hcModule = require("react-native-health-connect");
    HealthConnect = hcModule.default || hcModule;
    logger.log("[Health Connect] Native module loaded successfully");
    return HealthConnect;
  } catch (error) {
    healthConnectLoadError = String(error);
    logger.log("[Health Connect] Failed to load native module:", error);
    HealthConnect = null;
    return null;
  }
}

/**
 * Check Health Connect availability on the device.
 */
export async function checkHealthConnectAvailability(): Promise<HealthConnectAvailability> {
  if (Platform.OS !== "android" || !isAndroidFeaturesActive()) {
    return "not_supported";
  }

  const hc = getHealthConnect();
  if (!hc) {
    return "not_installed";
  }

  try {
    const status = await hc.getSdkStatus();
    if (status === hc.SdkAvailabilityStatus?.SDK_AVAILABLE) {
      return "available";
    }
    if (status === hc.SdkAvailabilityStatus?.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      return "not_installed";
    }
    return "not_supported";
  } catch (error) {
    logger.log("[Health Connect] Error checking availability:", error);
    // If we can't check status, try initializing anyway
    return "unknown";
  }
}

/**
 * Open the Health Connect app on the Play Store for installation.
 */
export async function openHealthConnectPlayStore(): Promise<void> {
  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata";
  try {
    await Linking.openURL(playStoreUrl);
  } catch (error) {
    logger.log("[Health Connect] Error opening Play Store:", error);
  }
}

/**
 * Open Android Settings for Health Connect permissions.
 */
export async function openHealthConnectSettings(): Promise<void> {
  try {
    const hc = getHealthConnect();
    if (hc?.openHealthConnectSettings) {
      await hc.openHealthConnectSettings();
    }
  } catch (error) {
    logger.log("[Health Connect] Error opening settings:", error);
  }
}

/**
 * Initialize Health Connect and request READ permissions.
 */
export async function requestHealthConnectPermissions(): Promise<boolean> {
  const hc = getHealthConnect();
  if (!hc) {
    logger.log("[Health Connect] Module not available on this platform");
    return false;
  }

  try {
    // Initialize the client
    const initialized = await hc.initialize();
    if (!initialized) {
      logger.log("[Health Connect] Failed to initialize");
      return false;
    }

    // Request read permissions for all relevant data types
    const permissions = [
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "HeartRate" },
      { accessType: "read", recordType: "SleepSession" },
      { accessType: "read", recordType: "ExerciseSession" },
      { accessType: "read", recordType: "BloodPressure" },
      { accessType: "read", recordType: "Weight" },
      { accessType: "read", recordType: "Height" },
    ];

    const granted = await hc.requestPermission(permissions);

    if (granted && granted.length > 0) {
      logger.log("[Health Connect] Permissions granted:", granted.length);
      return true;
    }

    logger.log("[Health Connect] No permissions granted");
    return false;
  } catch (error) {
    logger.log("[Health Connect] Error requesting permissions:", error);
    return false;
  }
}

/**
 * Check if Health Connect permissions are already granted.
 */
export async function checkHealthConnectPermissions(): Promise<boolean> {
  const hc = getHealthConnect();
  if (!hc) return false;

  try {
    const initialized = await hc.initialize();
    if (!initialized) return false;

    // Check if we have read permission for Steps (basic check)
    const permissions = await hc.getGrantedPermissions();
    return permissions && permissions.length > 0;
  } catch (error) {
    logger.log("[Health Connect] Error checking permissions:", error);
    return false;
  }
}

/**
 * Fetch today's health data from Health Connect.
 */
export async function fetchTodayHealthConnectData(): Promise<HealthConnectData | null> {
  const hc = getHealthConnect();
  if (!hc) {
    logger.log("[Health Connect] Module not available. Returning null.");
    return null;
  }

  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();

    const timeRangeFilter = {
      operator: "between",
      startTime: startOfDay.toISOString(),
      endTime: endOfDay.toISOString(),
    };

    const [steps, heartRate, sleepHours, exerciseMinutes, weight, bloodPressure] = await Promise.all([
      getStepsFromHC(hc, timeRangeFilter),
      getHeartRateFromHC(hc),
      getSleepHoursFromHC(hc),
      getExerciseMinutesFromHC(hc, timeRangeFilter),
      getWeightFromHC(hc),
      getBloodPressureFromHC(hc),
    ]);

    return {
      steps,
      heartRate,
      sleepHours,
      exerciseMinutes,
      weight,
      bloodPressureSystolic: bloodPressure.systolic,
      bloodPressureDiastolic: bloodPressure.diastolic,
    };
  } catch (error) {
    logger.error("[Health Connect] Error fetching today's data:", error);
    return null;
  }
}

// ─── Private helper functions ───────────────────────────────────────────────

async function getStepsFromHC(hc: any, timeRangeFilter: any): Promise<number> {
  try {
    const result = await hc.readRecords("Steps", { timeRangeFilter });
    if (result?.records?.length > 0) {
      const totalSteps = result.records.reduce(
        (sum: number, record: any) => sum + (record.count || 0),
        0
      );
      return totalSteps;
    }
    return 0;
  } catch (error) {
    logger.log("[Health Connect] Error getting steps:", error);
    return 0;
  }
}

async function getHeartRateFromHC(hc: any): Promise<number> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const result = await hc.readRecords("HeartRate", {
      timeRangeFilter: {
        operator: "between",
        startTime: oneDayAgo.toISOString(),
        endTime: now.toISOString(),
      },
    });
    if (result?.records?.length > 0) {
      // Get the most recent heart rate sample
      const lastRecord = result.records[result.records.length - 1];
      if (lastRecord?.samples?.length > 0) {
        return Math.round(lastRecord.samples[lastRecord.samples.length - 1].beatsPerMinute || 0);
      }
    }
    return 0;
  } catch (error) {
    logger.log("[Health Connect] Error getting heart rate:", error);
    return 0;
  }
}

async function getSleepHoursFromHC(hc: any): Promise<number> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const result = await hc.readRecords("SleepSession", {
      timeRangeFilter: {
        operator: "between",
        startTime: oneDayAgo.toISOString(),
        endTime: now.toISOString(),
      },
    });
    if (result?.records?.length > 0) {
      const totalMinutes = result.records.reduce((sum: number, record: any) => {
        const start = new Date(record.startTime).getTime();
        const end = new Date(record.endTime).getTime();
        return sum + (end - start) / (1000 * 60);
      }, 0);
      return Math.round((totalMinutes / 60) * 10) / 10;
    }
    return 0;
  } catch (error) {
    logger.log("[Health Connect] Error getting sleep:", error);
    return 0;
  }
}

async function getExerciseMinutesFromHC(hc: any, timeRangeFilter: any): Promise<number> {
  try {
    const result = await hc.readRecords("ExerciseSession", { timeRangeFilter });
    if (result?.records?.length > 0) {
      const totalMinutes = result.records.reduce((sum: number, record: any) => {
        const start = new Date(record.startTime).getTime();
        const end = new Date(record.endTime).getTime();
        return sum + (end - start) / (1000 * 60);
      }, 0);
      return Math.round(totalMinutes);
    }
    return 0;
  } catch (error) {
    logger.log("[Health Connect] Error getting exercise:", error);
    return 0;
  }
}

async function getWeightFromHC(hc: any): Promise<number> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const result = await hc.readRecords("Weight", {
      timeRangeFilter: {
        operator: "between",
        startTime: thirtyDaysAgo.toISOString(),
        endTime: now.toISOString(),
      },
    });
    if (result?.records?.length > 0) {
      // Most recent weight, convert kg to lbs
      const lastRecord = result.records[result.records.length - 1];
      const weightKg = lastRecord?.weight?.inKilograms || lastRecord?.weight || 0;
      return Math.round(weightKg * 2.20462);
    }
    return 0;
  } catch (error) {
    logger.log("[Health Connect] Error getting weight:", error);
    return 0;
  }
}

async function getBloodPressureFromHC(hc: any): Promise<{ systolic: number; diastolic: number }> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const result = await hc.readRecords("BloodPressure", {
      timeRangeFilter: {
        operator: "between",
        startTime: thirtyDaysAgo.toISOString(),
        endTime: now.toISOString(),
      },
    });
    if (result?.records?.length > 0) {
      const lastRecord = result.records[result.records.length - 1];
      return {
        systolic: Math.round(lastRecord?.systolic?.inMillimetersOfMercury || 0),
        diastolic: Math.round(lastRecord?.diastolic?.inMillimetersOfMercury || 0),
      };
    }
    return { systolic: 0, diastolic: 0 };
  } catch (error) {
    logger.log("[Health Connect] Error getting blood pressure:", error);
    return { systolic: 0, diastolic: 0 };
  }
}

/**
 * Fetch historical health data from Health Connect (for backfill).
 */
export async function fetchHistoricalHealthConnectData(
  daysBack: number = 90
): Promise<Map<string, HealthConnectData>> {
  const hc = getHealthConnect();
  if (!hc) return new Map();

  const results = new Map<string, HealthConnectData>();
  const now = new Date();
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  try {
    // Initialize empty records for all days
    for (let d = 0; d < daysBack; d++) {
      const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      const dateStr = format(date, "yyyy-MM-dd");
      results.set(dateStr, {
        steps: 0,
        heartRate: 0,
        sleepHours: 0,
        exerciseMinutes: 0,
        weight: 0,
        bloodPressureSystolic: 0,
        bloodPressureDiastolic: 0,
      });
    }

    const timeRangeFilter = {
      operator: "between",
      startTime: startDate.toISOString(),
      endTime: now.toISOString(),
    };

    // Fetch steps
    try {
      const stepsResult = await hc.readRecords("Steps", { timeRangeFilter });
      if (stepsResult?.records) {
        for (const record of stepsResult.records) {
          const dateStr = format(new Date(record.startTime), "yyyy-MM-dd");
          const existing = results.get(dateStr);
          if (existing) {
            existing.steps += record.count || 0;
          }
        }
      }
    } catch (e) {
      logger.log("[Health Connect] Error fetching historical steps:", e);
    }

    // Fetch heart rate
    try {
      const hrResult = await hc.readRecords("HeartRate", { timeRangeFilter });
      if (hrResult?.records) {
        const hrByDay = new Map<string, number[]>();
        for (const record of hrResult.records) {
          const dateStr = format(new Date(record.startTime), "yyyy-MM-dd");
          if (!hrByDay.has(dateStr)) hrByDay.set(dateStr, []);
          for (const sample of record.samples || []) {
            hrByDay.get(dateStr)?.push(sample.beatsPerMinute || 0);
          }
        }
        for (const [dateStr, values] of hrByDay) {
          const existing = results.get(dateStr);
          if (existing && values.length > 0) {
            existing.heartRate = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
          }
        }
      }
    } catch (e) {
      logger.log("[Health Connect] Error fetching historical heart rate:", e);
    }

    // Fetch sleep
    try {
      const sleepResult = await hc.readRecords("SleepSession", { timeRangeFilter });
      if (sleepResult?.records) {
        for (const record of sleepResult.records) {
          const dateStr = format(new Date(record.endTime), "yyyy-MM-dd");
          const existing = results.get(dateStr);
          if (existing) {
            const start = new Date(record.startTime).getTime();
            const end = new Date(record.endTime).getTime();
            existing.sleepHours += Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
          }
        }
      }
    } catch (e) {
      logger.log("[Health Connect] Error fetching historical sleep:", e);
    }

    // Fetch exercise
    try {
      const exerciseResult = await hc.readRecords("ExerciseSession", { timeRangeFilter });
      if (exerciseResult?.records) {
        for (const record of exerciseResult.records) {
          const dateStr = format(new Date(record.startTime), "yyyy-MM-dd");
          const existing = results.get(dateStr);
          if (existing) {
            const start = new Date(record.startTime).getTime();
            const end = new Date(record.endTime).getTime();
            existing.exerciseMinutes += Math.round((end - start) / (1000 * 60));
          }
        }
      }
    } catch (e) {
      logger.log("[Health Connect] Error fetching historical exercise:", e);
    }

    // Fetch weight
    try {
      const weightResult = await hc.readRecords("Weight", { timeRangeFilter });
      if (weightResult?.records) {
        for (const record of weightResult.records) {
          const dateStr = format(new Date(record.time), "yyyy-MM-dd");
          const existing = results.get(dateStr);
          if (existing && !existing.weight) {
            const weightKg = record?.weight?.inKilograms || record?.weight || 0;
            existing.weight = Math.round(weightKg * 2.20462);
          }
        }
      }
    } catch (e) {
      logger.log("[Health Connect] Error fetching historical weight:", e);
    }

    // Fetch blood pressure
    try {
      const bpResult = await hc.readRecords("BloodPressure", { timeRangeFilter });
      if (bpResult?.records) {
        for (const record of bpResult.records) {
          const dateStr = format(new Date(record.time), "yyyy-MM-dd");
          const existing = results.get(dateStr);
          if (existing && !existing.bloodPressureSystolic) {
            existing.bloodPressureSystolic = Math.round(record?.systolic?.inMillimetersOfMercury || 0);
            existing.bloodPressureDiastolic = Math.round(record?.diastolic?.inMillimetersOfMercury || 0);
          }
        }
      }
    } catch (e) {
      logger.log("[Health Connect] Error fetching historical blood pressure:", e);
    }

    logger.log(`[Health Connect] Fetched historical data for ${results.size} days`);
    return results;
  } catch (error) {
    logger.error("[Health Connect] Error fetching historical data:", error);
    return new Map();
  }
}

/**
 * Convert Health Connect data to HealthMetric format.
 */
export function convertToHealthMetric(
  data: HealthConnectData,
  date: Date
): HealthMetric {
  return {
    id: `health-connect-${format(date, "yyyy-MM-dd")}`,
    date: format(date, "yyyy-MM-dd"),
    steps: data.steps,
    heartRate: data.heartRate,
    sleepHours: data.sleepHours,
    exerciseMinutes: data.exerciseMinutes,
    weight: data.weight,
    bloodPressureSystolic: data.bloodPressureSystolic,
    bloodPressureDiastolic: data.bloodPressureDiastolic,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Auto-sync health data from Health Connect.
 * Call this on app launch or when Health tab is opened.
 */
export async function syncHealthDataFromHealthConnect(
  addOrUpdateMetric: (metric: HealthMetric) => void,
  isInitialSync: boolean = false
): Promise<boolean> {
  try {
    const hc = getHealthConnect();
    if (!hc) {
      logger.log("[Health Connect] Module not available, skipping sync");
      return false;
    }

    // Check permissions
    const hasPermissions = await checkHealthConnectPermissions();
    if (!hasPermissions) {
      logger.log("[Health Connect] No permissions, skipping sync");
      return false;
    }

    // If initial sync, fetch historical data for the last 90 days
    if (isInitialSync) {
      logger.log("[Health Connect] Initial sync - fetching 90 days of historical data");
      const historicalData = await fetchHistoricalHealthConnectData(90);

      let importedCount = 0;
      for (const [dateStr, data] of historicalData) {
        if (
          data.steps > 0 ||
          data.heartRate > 0 ||
          data.sleepHours > 0 ||
          data.weight > 0 ||
          data.bloodPressureSystolic > 0
        ) {
          const metric: HealthMetric = {
            id: `health-connect-${dateStr}`,
            date: dateStr,
            steps: data.steps,
            heartRate: data.heartRate,
            sleepHours: data.sleepHours,
            exerciseMinutes: data.exerciseMinutes,
            weight: data.weight,
            bloodPressureSystolic: data.bloodPressureSystolic,
            bloodPressureDiastolic: data.bloodPressureDiastolic,
            createdAt: new Date().toISOString(),
          };
          addOrUpdateMetric(metric);
          importedCount++;
        }
      }
      logger.log(`[Health Connect] Initial sync: imported ${importedCount} days of data`);
    }

    // Always sync today's data (most up-to-date)
    const healthData = await fetchTodayHealthConnectData();
    if (!healthData) {
      logger.log("[Health Connect] No data available for today");
      return isInitialSync;
    }

    const metric = convertToHealthMetric(healthData, new Date());
    addOrUpdateMetric(metric);

    logger.log("[Health Connect] Successfully synced health data");
    return true;
  } catch (error) {
    logger.error("[Health Connect] Error syncing health data:", error);
    return false;
  }
}

/**
 * Setup info for enabling Health Connect integration
 */
export const HEALTH_CONNECT_SETUP_INFO = {
  packageName: "react-native-health-connect",
  requiredPermissions: [
    "Steps",
    "Heart Rate",
    "Sleep Session",
    "Exercise Session",
    "Blood Pressure",
    "Weight",
    "Height",
  ],
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata",
};
