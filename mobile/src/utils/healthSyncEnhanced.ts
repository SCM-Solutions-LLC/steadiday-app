/**
 * Enhanced Apple Health Sync with 90-Day Backfill
 *
 * Provides historical data import and incremental updates for Apple Health metrics.
 * Uses per-metric sync state to track backfill completion and enable ongoing sync.
 * Uses @kingstinct/react-native-healthkit (Promise-based, New Architecture compatible).
 */

import { subDays, format } from "date-fns";
import { Platform } from "react-native";
import { HealthMetric } from "../types/app";
import {
  useHealthSyncStore,
  HealthMetricType,
  BACKFILL_DAYS,
  MIN_SYNC_INTERVAL,
} from "../state/stores/healthSyncStore";
import { logger } from "./logger";

let _hk: any = null;
let _hkLoadFailed = false;

function hk(): any {
  if (_hkLoadFailed) return null;
  if (_hk) return _hk;
  try {
    const mod = require("@kingstinct/react-native-healthkit");
    if (!mod) { _hkLoadFailed = true; return null; }
    _hk = mod;
    return _hk;
  } catch {
    _hkLoadFailed = true;
    logger.log("[HealthSyncEnhanced] Failed to load HealthKit module");
    return null;
  }
}

// ============================================================================
// DATE RANGE HELPERS
// ============================================================================

export function getBackfillDateRange(): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = subDays(endDate, BACKFILL_DAYS);
  return { startDate, endDate };
}

export function getIncrementalDateRange(lastSyncAt: string | null): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = lastSyncAt ? new Date(lastSyncAt) : subDays(endDate, 1);
  return { startDate, endDate };
}

// ============================================================================
// AVAILABILITY CHECK
// ============================================================================

let healthKitAvailableCache: boolean | null = null;
let lastFailureTime: number = 0;
const RETRY_INTERVAL_MS = 3000;

function isAvailable(): boolean {
  if (Platform.OS !== "ios") return false;
  if (healthKitAvailableCache === true) return true;
  if (healthKitAvailableCache === false && Date.now() - lastFailureTime < RETRY_INTERVAL_MS) return false;
  try {
    const result = hk()?.isHealthDataAvailable();
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
  return healthKitAvailableCache;
}

// ============================================================================
// METRIC DATA FETCHERS (with date range support)
// ============================================================================

interface DailyMetricData {
  date: string; // YYYY-MM-DD
  value: number;
}

async function fetchStepsForRange(startDate: Date, endDate: Date): Promise<DailyMetricData[]> {
  if (!isAvailable()) return [];

  try {
    const samples = await hk().queryQuantitySamples(
      "HKQuantityTypeIdentifierStepCount",
      {
        unit: "count",
        limit: 0,
        ascending: true,
        filter: { date: { startDate, endDate } },
      }
    );

    const byDay: Record<string, number> = {};
    for (const s of samples) {
      const date = format(new Date(s.startDate), "yyyy-MM-dd");
      byDay[date] = (byDay[date] || 0) + s.quantity;
    }

    return Object.entries(byDay).map(([date, value]) => ({
      date,
      value: Math.round(value),
    }));
  } catch (error) {
    logger.log("[HealthSync] Error getting steps:", error);
    return [];
  }
}

async function fetchHeartRateForRange(startDate: Date, endDate: Date): Promise<DailyMetricData[]> {
  if (!isAvailable()) return [];

  try {
    const samples = await hk().queryQuantitySamples(
      "HKQuantityTypeIdentifierHeartRate",
      {
        unit: "count/min",
        limit: 0,
        ascending: true,
        filter: { date: { startDate, endDate } },
      }
    );

    const byDay: Record<string, number[]> = {};
    for (const s of samples) {
      const date = format(new Date(s.startDate), "yyyy-MM-dd");
      if (!byDay[date]) byDay[date] = [];
      byDay[date].push(s.quantity);
    }

    return Object.entries(byDay).map(([date, values]) => ({
      date,
      value: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    }));
  } catch (error) {
    logger.log("[HealthSync] Error getting heart rate:", error);
    return [];
  }
}

async function fetchSleepForRange(startDate: Date, endDate: Date): Promise<DailyMetricData[]> {
  if (!isAvailable()) return [];

  try {
    const samples = await hk().queryCategorySamples(
      "HKCategoryTypeIdentifierSleepAnalysis",
      {
        limit: 0,
        filter: { date: { startDate, endDate } },
      }
    );

    const byDay: Record<string, number> = {};
    for (const s of samples) {
      const endTime = new Date(s.endDate);
      const date = format(endTime, "yyyy-MM-dd");
      const durationMs = endTime.getTime() - new Date(s.startDate).getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      byDay[date] = (byDay[date] || 0) + durationHours;
    }

    return Object.entries(byDay).map(([date, hours]) => ({
      date,
      value: Math.round(hours * 10) / 10,
    }));
  } catch (error) {
    logger.log("[HealthSync] Error getting sleep:", error);
    return [];
  }
}

async function fetchExerciseForRange(startDate: Date, endDate: Date): Promise<DailyMetricData[]> {
  if (!isAvailable()) return [];

  try {
    const result = await hk().queryStatisticsForQuantity(
      "HKQuantityTypeIdentifierActiveEnergyBurned",
      ["cumulativeSum"],
      {
        unit: "kcal",
        filter: { date: { startDate, endDate } },
      }
    );

    const kcal = result?.sumQuantity?.quantity ?? 0;
    const estimatedMinutes = Math.round(kcal / 10);
    const today = format(new Date(), "yyyy-MM-dd");
    return [{ date: today, value: estimatedMinutes }];
  } catch (error) {
    logger.log("[HealthSync] Error getting exercise:", error);
    return [];
  }
}

async function fetchWeightForRange(startDate: Date, endDate: Date): Promise<DailyMetricData[]> {
  if (!isAvailable()) return [];

  try {
    const samples = await hk().queryQuantitySamples(
      "HKQuantityTypeIdentifierBodyMass",
      {
        unit: "lb",
        limit: 0,
        ascending: true,
        filter: { date: { startDate, endDate } },
      }
    );

    const byDay: Record<string, number> = {};
    for (const s of samples) {
      const date = format(new Date(s.startDate), "yyyy-MM-dd");
      byDay[date] = Math.round(s.quantity);
    }

    return Object.entries(byDay).map(([date, value]) => ({
      date,
      value,
    }));
  } catch (error) {
    logger.log("[HealthSync] Error getting weight:", error);
    return [];
  }
}

async function fetchBloodPressureForRange(
  startDate: Date,
  endDate: Date
): Promise<{ date: string; systolic: number; diastolic: number }[]> {
  if (!isAvailable()) return [];

  try {
    const [systolicSamples, diastolicSamples] = await Promise.all([
      hk().queryQuantitySamples("HKQuantityTypeIdentifierBloodPressureSystolic", {
        unit: "mmHg",
        limit: 0,
        ascending: true,
        filter: { date: { startDate, endDate } },
      }),
      hk().queryQuantitySamples("HKQuantityTypeIdentifierBloodPressureDiastolic", {
        unit: "mmHg",
        limit: 0,
        ascending: true,
        filter: { date: { startDate, endDate } },
      }),
    ]);

    const systolicByDay: Record<string, number> = {};
    for (const s of systolicSamples) {
      const date = format(new Date(s.startDate), "yyyy-MM-dd");
      systolicByDay[date] = Math.round(s.quantity);
    }

    const diastolicByDay: Record<string, number> = {};
    for (const s of diastolicSamples) {
      const date = format(new Date(s.startDate), "yyyy-MM-dd");
      diastolicByDay[date] = Math.round(s.quantity);
    }

    const allDates = new Set([...Object.keys(systolicByDay), ...Object.keys(diastolicByDay)]);
    return Array.from(allDates).map((date) => ({
      date,
      systolic: systolicByDay[date] || 0,
      diastolic: diastolicByDay[date] || 0,
    }));
  } catch (error) {
    logger.log("[HealthSync] Error getting blood pressure:", error);
    return [];
  }
}

// ============================================================================
// SYNC ORCHESTRATION
// ============================================================================

export interface SyncResult {
  success: boolean;
  metricsUpdated: number;
  errors: string[];
}

export interface SyncCallbacks {
  onMetricUpdated: (date: string, metric: Partial<HealthMetric>) => void;
  onProgress?: (metric: HealthMetricType, done: boolean) => void;
}

export async function syncMetric(
  metricType: HealthMetricType,
  callbacks: SyncCallbacks,
  forceBackfill: boolean = false
): Promise<{ success: boolean; count: number }> {
  const store = useHealthSyncStore.getState();

  const needsBackfill = forceBackfill || store.needsBackfill(metricType);
  const lastSyncAt = store.getLastSyncAt(metricType);

  const { startDate, endDate } = needsBackfill
    ? getBackfillDateRange()
    : getIncrementalDateRange(lastSyncAt);

  logger.log(
    `[HealthSync] Syncing ${metricType}: ${needsBackfill ? "backfill" : "incremental"} from ${format(
      startDate,
      "yyyy-MM-dd"
    )} to ${format(endDate, "yyyy-MM-dd")}`
  );

  callbacks.onProgress?.(metricType, false);

  let count = 0;

  try {
    switch (metricType) {
      case "steps": {
        const data = await fetchStepsForRange(startDate, endDate);
        data.forEach((d) => {
          callbacks.onMetricUpdated(d.date, { steps: d.value });
          count++;
        });
        break;
      }

      case "heartRate": {
        const data = await fetchHeartRateForRange(startDate, endDate);
        data.forEach((d) => {
          callbacks.onMetricUpdated(d.date, { heartRate: d.value });
          count++;
        });
        break;
      }

      case "sleep": {
        const data = await fetchSleepForRange(startDate, endDate);
        data.forEach((d) => {
          callbacks.onMetricUpdated(d.date, { sleepHours: d.value });
          count++;
        });
        break;
      }

      case "exercise": {
        const data = await fetchExerciseForRange(startDate, endDate);
        data.forEach((d) => {
          callbacks.onMetricUpdated(d.date, { exerciseMinutes: d.value });
          count++;
        });
        break;
      }

      case "weight": {
        const data = await fetchWeightForRange(startDate, endDate);
        data.forEach((d) => {
          callbacks.onMetricUpdated(d.date, { weight: d.value });
          count++;
        });
        break;
      }

      case "bloodPressure": {
        const data = await fetchBloodPressureForRange(startDate, endDate);
        data.forEach((d) => {
          callbacks.onMetricUpdated(d.date, {
            bloodPressureSystolic: d.systolic,
            bloodPressureDiastolic: d.diastolic,
          });
          count++;
        });
        break;
      }
    }

    const now = new Date().toISOString();
    store.updateLastSyncAt(metricType, now);

    if (needsBackfill) {
      store.markBackfillComplete(metricType);
      logger.log(`[HealthSync] Backfill complete for ${metricType}: ${count} records`);
    } else {
      logger.log(`[HealthSync] Incremental sync complete for ${metricType}: ${count} records`);
    }

    callbacks.onProgress?.(metricType, true);
    return { success: true, count };
  } catch (error) {
    logger.error(`[HealthSync] Error syncing ${metricType}:`, error);
    callbacks.onProgress?.(metricType, true);
    return { success: false, count: 0 };
  }
}

export async function syncAllEnabledMetrics(callbacks: SyncCallbacks): Promise<SyncResult> {
  const store = useHealthSyncStore.getState();
  const enabledMetrics = store.enabledMetrics;

  if (enabledMetrics.length === 0) {
    logger.log("[HealthSync] No metrics enabled for sync");
    return { success: true, metricsUpdated: 0, errors: [] };
  }

  store.setSyncing(true);

  const errors: string[] = [];
  let totalCount = 0;

  for (const metric of enabledMetrics) {
    const result = await syncMetric(metric, callbacks);
    if (!result.success) {
      errors.push(`Failed to sync ${metric}`);
    } else {
      totalCount += result.count;
    }
  }

  store.updateLastFullSync();
  store.setSyncing(false);

  return {
    success: errors.length === 0,
    metricsUpdated: totalCount,
    errors,
  };
}

export function canAutoSync(): boolean {
  const store = useHealthSyncStore.getState();
  const lastSync = store.lastFullSyncAt;

  if (!lastSync) return true;

  const elapsed = Date.now() - new Date(lastSync).getTime();
  return elapsed >= MIN_SYNC_INTERVAL;
}

export function isHealthKitAvailable(): boolean {
  return isAvailable();
}
