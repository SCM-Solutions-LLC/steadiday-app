/**
 * Apple Health Integration for SteadiDay
 *
 * Uses @kingstinct/react-native-healthkit (New Architecture compatible, Promise-based).
 * Syncs health data from Apple Health (including Apple Watch) to the SteadiDay app.
 *
 * The native module is loaded lazily via require() to prevent fatal crashes
 * when NitroModulesProxy cannot create the hybrid object (e.g. in Expo Go
 * or environments without the native binary).
 */

import { HealthMetric } from "../types/app";
type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
import { format } from "date-fns";
import { Platform } from "react-native";
import { logger } from "./logger";

let _hk: any = null;
let _hkLoadFailed = false;

function hk(): any {
  if (_hkLoadFailed) return null;
  if (_hk) return _hk;
  try {
    const mod = require("@kingstinct/react-native-healthkit");
    if (!mod) {
      _hkLoadFailed = true;
      return null;
    }
    _hk = mod;
    return _hk;
  } catch {
    _hkLoadFailed = true;
    logger.log("[Apple Health] Failed to load HealthKit native module");
    return null;
  }
}

const READ_PERMISSIONS = [
  "HKQuantityTypeIdentifierStepCount",
  "HKQuantityTypeIdentifierHeartRate",
  "HKCategoryTypeIdentifierSleepAnalysis",
  "HKQuantityTypeIdentifierActiveEnergyBurned",
  "HKQuantityTypeIdentifierBodyMass",
  "HKQuantityTypeIdentifierBloodPressureSystolic",
  "HKQuantityTypeIdentifierBloodPressureDiastolic",
  "HKQuantityTypeIdentifierHeight",
] as const;

export type HealthPermissionResult = {
  granted: boolean;
  reason: "granted" | "denied" | "timeout" | "unavailable";
};

export interface AppleHealthData {
  steps: number;
  heartRate: number;
  sleepHours: number;
  exerciseMinutes: number;
  weight: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
}

export interface MedicalIDData {
  bloodType?: BloodType;
  height?: string;
  weight?: string;
  allergies: string[];
  medicalConditions: string[];
  isOrganDonor: boolean;
}

let healthKitAvailableCache: boolean | null = null;
let lastFailureTime: number = 0;
const RETRY_INTERVAL_MS = 3000;

function isAvailable(): boolean {
  if (Platform.OS !== "ios") return false;
  if (healthKitAvailableCache === true) return true;
  if (healthKitAvailableCache === false && Date.now() - lastFailureTime < RETRY_INTERVAL_MS) return false;
  try {
    const mod = hk();
    if (!mod) {
      healthKitAvailableCache = false;
      lastFailureTime = Date.now();
      return false;
    }
    const result = mod.isHealthDataAvailable();
    if (result) {
      healthKitAvailableCache = true;
    } else {
      healthKitAvailableCache = false;
      lastFailureTime = Date.now();
    }
  } catch {
    healthKitAvailableCache = false;
    lastFailureTime = Date.now();
  }
  return healthKitAvailableCache ?? false;
}

export async function requestHealthPermissions(): Promise<HealthPermissionResult> {
  logger.log("[Apple Health] requestHealthPermissions called, Platform:", Platform.OS);

  if (!isAvailable()) {
    logger.log("[Apple Health] HealthKit not available on this platform");
    return { granted: false, reason: "unavailable" };
  }

  logger.log("[Apple Health] isAvailable returned true, about to call requestAuthorization");

  try {
    const mod = hk();
    if (!mod) return { granted: false, reason: "unavailable" };

    const permissionsPayload = { toRead: [...READ_PERMISSIONS], toShare: [] as const };
    logger.log("[Apple Health] Calling requestAuthorization with:", JSON.stringify(permissionsPayload));

    const authPromise = mod.requestAuthorization(permissionsPayload);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 15000)
    );

    const granted = await Promise.race([authPromise, timeoutPromise]);

    logger.log("[Apple Health] requestAuthorization resolved with:", granted, "type:", typeof granted);

    if (granted) {
      logger.log("[Apple Health] Permissions granted");
      return { granted: true, reason: "granted" };
    } else {
      logger.log("[Apple Health] Permissions denied");
      return { granted: false, reason: "denied" };
    }
  } catch (error) {
    const msg = String(error);
    logger.log("[Apple Health] requestAuthorization THREW:", msg, "stack:", (error as any)?.stack);
    if (msg.includes("timeout")) {
      logger.log("[Apple Health] requestAuthorization timed out after 15s");
      return { granted: false, reason: "timeout" };
    }
    return { granted: false, reason: "denied" };
  }
}

export async function checkHealthPermissions(): Promise<boolean> {
  if (!isAvailable()) return false;

  try {
    const mod = hk();
    if (!mod) return false;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const probePromise = mod.queryQuantitySamples(
      "HKQuantityTypeIdentifierStepCount",
      { unit: "count", limit: 1, ascending: false, filter: { date: { startDate: oneHourAgo, endDate: now } } }
    );
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 5000)
    );
    await Promise.race([probePromise, timeoutPromise]);
    return true;
  } catch (error) {
    logger.log("[Apple Health] checkHealthPermissions probe failed:", error);
    return false;
  }
}

export async function fetchTodayHealthData(): Promise<AppleHealthData | null> {
  if (!isAvailable()) {
    logger.log("[Apple Health] HealthKit not available. Returning null.");
    return null;
  }

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const now = new Date();

    const [steps, heartRate, sleepHours, exerciseMinutes, weight, bloodPressure] = await Promise.all([
      getSteps(startOfDay, now),
      getHeartRate(),
      getSleepHours(),
      getExerciseMinutes(startOfDay, now),
      getWeight(),
      getBloodPressure(),
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
    logger.error("[Apple Health] Error fetching today's data:", error);
    return null;
  }
}

async function getSteps(startDate: Date, endDate: Date): Promise<number> {
  try {
    const mod = hk();
    if (!mod) return 0;
    const result = await mod.queryStatisticsForQuantity(
      "HKQuantityTypeIdentifierStepCount",
      ["cumulativeSum"],
      {
        unit: "count",
        filter: { date: { startDate, endDate } },
      }
    );
    return Math.round(result?.sumQuantity?.quantity ?? 0);
  } catch (error) {
    logger.log("[Apple Health] Error getting steps:", error);
    return 0;
  }
}

async function getHeartRate(): Promise<number> {
  try {
    const mod = hk();
    if (!mod) return 0;
    const samples = await mod.queryQuantitySamples(
      "HKQuantityTypeIdentifierHeartRate",
      {
        unit: "count/min",
        limit: 1,
        ascending: false,
        filter: {
          date: {
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            endDate: new Date(),
          },
        },
      }
    );
    if (samples.length > 0) {
      return Math.round(samples[0].quantity);
    }
    return 0;
  } catch (error) {
    logger.log("[Apple Health] Error getting heart rate:", error);
    return 0;
  }
}

async function getSleepHours(): Promise<number> {
  try {
    const mod = hk();
    if (!mod) return 0;
    const samples = await mod.queryCategorySamples(
      "HKCategoryTypeIdentifierSleepAnalysis",
      {
        limit: 0,
        filter: {
          date: {
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            endDate: new Date(),
          },
        },
      }
    );
    if (samples.length > 0) {
      const totalMinutes = samples.reduce((sum: number, sample: any) => {
        const start = new Date(sample.startDate).getTime();
        const end = new Date(sample.endDate).getTime();
        return sum + (end - start) / (1000 * 60);
      }, 0);
      return Math.round((totalMinutes / 60) * 10) / 10;
    }
    return 0;
  } catch (error) {
    logger.log("[Apple Health] Error getting sleep:", error);
    return 0;
  }
}

async function getExerciseMinutes(startDate: Date, endDate: Date): Promise<number> {
  try {
    const mod = hk();
    if (!mod) return 0;
    const result = await mod.queryStatisticsForQuantity(
      "HKQuantityTypeIdentifierActiveEnergyBurned",
      ["cumulativeSum"],
      {
        unit: "kcal",
        filter: { date: { startDate, endDate } },
      }
    );
    const kcal = result?.sumQuantity?.quantity ?? 0;
    return Math.round(kcal / 10);
  } catch (error) {
    logger.log("[Apple Health] Error getting exercise:", error);
    return 0;
  }
}

async function getWeight(): Promise<number> {
  try {
    const mod = hk();
    if (!mod) return 0;
    const samples = await mod.queryQuantitySamples(
      "HKQuantityTypeIdentifierBodyMass",
      {
        unit: "lb",
        limit: 1,
        ascending: false,
        filter: {
          date: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
          },
        },
      }
    );
    if (samples.length > 0) {
      return Math.round(samples[0].quantity);
    }
    return 0;
  } catch (error) {
    logger.log("[Apple Health] Error getting weight:", error);
    return 0;
  }
}

async function getBloodPressure(): Promise<{ systolic: number; diastolic: number }> {
  try {
    const mod = hk();
    if (!mod) return { systolic: 0, diastolic: 0 };
    const [systolicSamples, diastolicSamples] = await Promise.all([
      mod.queryQuantitySamples("HKQuantityTypeIdentifierBloodPressureSystolic", {
        unit: "mmHg",
        limit: 1,
        ascending: false,
        filter: {
          date: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
          },
        },
      }),
      mod.queryQuantitySamples("HKQuantityTypeIdentifierBloodPressureDiastolic", {
        unit: "mmHg",
        limit: 1,
        ascending: false,
        filter: {
          date: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
          },
        },
      }),
    ]);
    return {
      systolic: systolicSamples.length > 0 ? Math.round(systolicSamples[0].quantity) : 0,
      diastolic: diastolicSamples.length > 0 ? Math.round(diastolicSamples[0].quantity) : 0,
    };
  } catch (error) {
    logger.log("[Apple Health] Error getting blood pressure:", error);
    return { systolic: 0, diastolic: 0 };
  }
}

export function convertToHealthMetric(
  appleHealthData: AppleHealthData,
  date: Date
): HealthMetric {
  return {
    id: `apple-health-${format(date, "yyyy-MM-dd")}`,
    date: format(date, "yyyy-MM-dd"),
    steps: appleHealthData.steps,
    heartRate: appleHealthData.heartRate,
    sleepHours: appleHealthData.sleepHours,
    exerciseMinutes: appleHealthData.exerciseMinutes,
    weight: appleHealthData.weight,
    bloodPressureSystolic: appleHealthData.bloodPressureSystolic,
    bloodPressureDiastolic: appleHealthData.bloodPressureDiastolic,
    createdAt: new Date().toISOString(),
  };
}

export async function fetchHistoricalHealthData(
  daysBack: number = 90
): Promise<Map<string, AppleHealthData>> {
  if (!isAvailable()) return new Map();

  const mod = hk();
  if (!mod) return new Map();

  const results = new Map<string, AppleHealthData>();
  const now = new Date();
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  try {
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

    // Fetch daily step samples
    const stepSamples = await mod.queryQuantitySamples(
      "HKQuantityTypeIdentifierStepCount",
      {
        unit: "count",
        limit: 0,
        ascending: false,
        filter: { date: { startDate, endDate: now } },
      }
    );
    const stepsByDay = new Map<string, number>();
    for (const sample of stepSamples) {
      const dateStr = format(new Date(sample.startDate), "yyyy-MM-dd");
      stepsByDay.set(dateStr, (stepsByDay.get(dateStr) || 0) + sample.quantity);
    }
    for (const [dateStr, total] of stepsByDay) {
      const existing = results.get(dateStr);
      if (existing) existing.steps = Math.round(total);
    }

    // Fetch heart rate samples
    const heartRateSamples = await mod.queryQuantitySamples(
      "HKQuantityTypeIdentifierHeartRate",
      {
        unit: "count/min",
        limit: 0,
        ascending: false,
        filter: { date: { startDate, endDate: now } },
      }
    );
    const heartRateByDay = new Map<string, number[]>();
    for (const sample of heartRateSamples) {
      const dateStr = format(new Date(sample.startDate), "yyyy-MM-dd");
      if (!heartRateByDay.has(dateStr)) heartRateByDay.set(dateStr, []);
      heartRateByDay.get(dateStr)?.push(sample.quantity);
    }
    for (const [dateStr, values] of heartRateByDay) {
      const existing = results.get(dateStr);
      if (existing && values.length > 0) {
        existing.heartRate = Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length);
      }
    }

    // Fetch sleep samples
    const sleepSamples = await mod.queryCategorySamples(
      "HKCategoryTypeIdentifierSleepAnalysis",
      {
        limit: 0,
        filter: { date: { startDate, endDate: now } },
      }
    );
    const sleepByDay = new Map<string, number>();
    for (const sample of sleepSamples) {
      const dateStr = format(new Date(sample.endDate), "yyyy-MM-dd");
      const startMs = new Date(sample.startDate).getTime();
      const endMs = new Date(sample.endDate).getTime();
      const hours = (endMs - startMs) / (1000 * 60 * 60);
      sleepByDay.set(dateStr, (sleepByDay.get(dateStr) || 0) + hours);
    }
    for (const [dateStr, hours] of sleepByDay) {
      const existing = results.get(dateStr);
      if (existing) existing.sleepHours = Math.round(hours * 10) / 10;
    }

    // Fetch weight samples
    const weightSamples = await mod.queryQuantitySamples(
      "HKQuantityTypeIdentifierBodyMass",
      {
        unit: "lb",
        limit: 0,
        ascending: false,
        filter: { date: { startDate, endDate: now } },
      }
    );
    for (const sample of weightSamples) {
      const dateStr = format(new Date(sample.startDate), "yyyy-MM-dd");
      const existing = results.get(dateStr);
      if (existing && !existing.weight) {
        existing.weight = Math.round(sample.quantity);
      }
    }

    // Fetch blood pressure samples
    const [systolicSamples, diastolicSamples] = await Promise.all([
      mod.queryQuantitySamples("HKQuantityTypeIdentifierBloodPressureSystolic", {
        unit: "mmHg",
        limit: 0,
        ascending: false,
        filter: { date: { startDate, endDate: now } },
      }),
      mod.queryQuantitySamples("HKQuantityTypeIdentifierBloodPressureDiastolic", {
        unit: "mmHg",
        limit: 0,
        ascending: false,
        filter: { date: { startDate, endDate: now } },
      }),
    ]);

    for (const sample of systolicSamples) {
      const dateStr = format(new Date(sample.startDate), "yyyy-MM-dd");
      const existing = results.get(dateStr);
      if (existing && !existing.bloodPressureSystolic) {
        existing.bloodPressureSystolic = Math.round(sample.quantity);
      }
    }
    for (const sample of diastolicSamples) {
      const dateStr = format(new Date(sample.startDate), "yyyy-MM-dd");
      const existing = results.get(dateStr);
      if (existing && !existing.bloodPressureDiastolic) {
        existing.bloodPressureDiastolic = Math.round(sample.quantity);
      }
    }

    logger.log(`[Apple Health] Fetched historical data for ${results.size} days`);
    return results;
  } catch (error) {
    logger.error("[Apple Health] Error fetching historical data:", error);
    return new Map();
  }
}

export async function syncHealthDataFromAppleHealth(
  addOrUpdateMetric: (metric: HealthMetric) => void,
  isInitialSync: boolean = false
): Promise<boolean> {
  try {
    if (!isAvailable()) {
      logger.log("[Apple Health] HealthKit not available, skipping sync");
      return false;
    }

    logger.log("[Apple Health] Starting sync (initial:", isInitialSync, ")");

    const hasPermissions = await checkHealthPermissions();
    logger.log("[Apple Health] Permission check result:", hasPermissions);
    if (!hasPermissions) {
      logger.log("[Apple Health] No permissions, skipping sync");
      return false;
    }

    if (isInitialSync) {
      logger.log("[Apple Health] Initial sync - fetching 90 days of historical data");
      const historicalData = await fetchHistoricalHealthData(90);

      let importedCount = 0;
      for (const [dateStr, data] of historicalData) {
        if (data.steps > 0 || data.heartRate > 0 || data.sleepHours > 0 ||
            data.weight > 0 || data.bloodPressureSystolic > 0) {
          const metric: HealthMetric = {
            id: `apple-health-${dateStr}`,
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
      logger.log(`[Apple Health] Initial sync: imported ${importedCount} days of data`);
    }

    const healthData = await fetchTodayHealthData();
    if (!healthData) {
      logger.log("[Apple Health] No data available for today");
      return isInitialSync;
    }

    const metric = convertToHealthMetric(healthData, new Date());
    addOrUpdateMetric(metric);

    logger.log("[Apple Health] Successfully synced health data");
    return true;
  } catch (error) {
    logger.error("[Apple Health] Error syncing health data:", error);
    return false;
  }
}

export const APPLE_HEALTH_SETUP_INFO = {
  packageName: "@kingstinct/react-native-healthkit",
  installCommand: "bun add @kingstinct/react-native-healthkit",
  requiredPermissions: [
    "Steps",
    "Heart Rate",
    "Sleep Analysis",
    "Active Energy Burned",
    "Weight",
    "Blood Pressure",
    "Blood Type",
    "Height",
  ],
  appJsonConfig: {
    ios: {
      infoPlist: {
        NSHealthShareUsageDescription:
          "SteadiDay needs access to read your health data to display your activity, heart rate, sleep, and exercise information.",
        NSHealthUpdateUsageDescription: "SteadiDay needs access to save health data.",
      },
    },
  },
};

const HK_BLOOD_TYPE_MAP: Record<number, BloodType> = {
  1: "A+",
  2: "A-",
  3: "B+",
  4: "B-",
  5: "AB+",
  6: "AB-",
  7: "O+",
  8: "O-",
};

export async function fetchMedicalIDFromAppleHealth(): Promise<MedicalIDData | null> {
  if (!isAvailable()) {
    logger.log("[Apple Health] HealthKit not available for Medical ID fetch");
    return null;
  }

  const mod = hk();
  if (!mod) return null;

  try {
    const results: MedicalIDData = {
      allergies: [],
      medicalConditions: [],
      isOrganDonor: false,
    };

    // Fetch blood type
    try {
      const bt = mod.getBloodType();
      const mapped = HK_BLOOD_TYPE_MAP[bt as number];
      if (mapped) results.bloodType = mapped;
    } catch (error) {
      logger.log("[Apple Health] Could not fetch blood type");
    }

    // Fetch height
    try {
      const samples = await mod.queryQuantitySamples(
        "HKQuantityTypeIdentifierHeight",
        {
          unit: "in",
          limit: 1,
          ascending: false,
          filter: {
            date: {
              startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
              endDate: new Date(),
            },
          },
        }
      );
      if (samples.length > 0) {
        const totalInches = Math.round(samples[0].quantity);
        const feet = Math.floor(totalInches / 12);
        const inches = totalInches % 12;
        results.height = `${feet}'${inches}"`;
      }
    } catch (error) {
      logger.log("[Apple Health] Could not fetch height");
    }

    // Fetch weight
    try {
      const samples = await mod.queryQuantitySamples(
        "HKQuantityTypeIdentifierBodyMass",
        {
          unit: "lb",
          limit: 1,
          ascending: false,
          filter: {
            date: {
              startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
              endDate: new Date(),
            },
          },
        }
      );
      if (samples.length > 0) {
        results.weight = `${Math.round(samples[0].quantity)} lbs`;
      }
    } catch (error) {
      logger.log("[Apple Health] Could not fetch weight");
    }

    return results;
  } catch (error) {
    logger.error("[Apple Health] Error fetching Medical ID:", error);
    return null;
  }
}
