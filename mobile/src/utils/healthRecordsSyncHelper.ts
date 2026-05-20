/**
 * Health Records Sync Helper
 *
 * Non-hook wrapper for triggering health records sync from non-component code
 * (e.g., ConnectedAppsScreen toggle handler).
 *
 * Uses @kingstinct/react-native-healthkit (Promise-based, New Architecture compatible).
 * Clinical records (medications) are not supported by the current library
 * and will return empty results gracefully.
 */

import { Platform } from "react-native";
import { useHealthRecordsStore } from "../state/stores/healthRecordsStore";
import { autoImportMedications } from "../hooks/useHealthRecordsSync";
import { logger } from "./logger";
import type { MedicationItem } from "../types/app";

let _hk: any = null;
let _hkLoadFailed = false;

function getHK(): any {
  if (_hkLoadFailed) return null;
  if (_hk) return _hk;
  try {
    const mod = require("@kingstinct/react-native-healthkit");
    if (!mod) { _hkLoadFailed = true; return null; }
    _hk = mod;
    return _hk;
  } catch {
    _hkLoadFailed = true;
    return null;
  }
}

const SYNC_TIMEOUT_MS = 30000;

function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    ),
  ]);
}

function isAvailable(): boolean {
  if (Platform.OS !== "ios") return false;
  try {
    const mod = getHK();
    if (!mod) return false;
    return mod.isHealthDataAvailable();
  } catch {
    return false;
  }
}

async function requestClinicalRecordsPermissions(): Promise<boolean> {
  if (!isAvailable()) return false;

  const mod = getHK();
  if (!mod) return false;

  try {
    const authPromise = mod.requestAuthorization({
      toRead: ["HKQuantityTypeIdentifierStepCount"],
      toShare: [],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 10000)
    );

    const granted = await Promise.race([authPromise, timeoutPromise]);
    return !!granted;
  } catch {
    return false;
  }
}

async function fetchMedicationRecords(): Promise<MedicationItem[]> {
  logger.log("[Health Records] Clinical records not supported by current HealthKit library");
  return [];
}

function parseStatus(value: string | undefined): "active" | "completed" | "on-hold" | "stopped" | "unknown" {
  if (!value) return "unknown";
  const lower = value.toLowerCase();
  if (lower.includes("active")) return "active";
  if (lower.includes("completed") || lower.includes("finished")) return "completed";
  if (lower.includes("hold")) return "on-hold";
  if (lower.includes("stopped") || lower.includes("discontinued")) return "stopped";
  return "unknown";
}

export async function syncHealthRecordsOnConnect(): Promise<{ medicationsCount: number; importedCount: number }> {
  if (Platform.OS !== "ios") {
    return { medicationsCount: 0, importedCount: 0 };
  }

  try {
    const hasPermission = await withTimeout(
      requestClinicalRecordsPermissions(),
      SYNC_TIMEOUT_MS,
      "Permission request timed out"
    );

    if (!hasPermission) {
      logger.log("[Health Records] Clinical records permissions not available on this device");
      return { medicationsCount: 0, importedCount: 0 };
    }

    const medications = await withTimeout(
      fetchMedicationRecords(),
      SYNC_TIMEOUT_MS,
      "Medication fetch timed out"
    );

    logger.log(`[Health Records] Fetched ${medications.length} medications from Apple Health`);

    if (medications.length > 0) {
      const store = useHealthRecordsStore.getState();
      const now = new Date().toISOString();
      store.upsertManyMedicationItems(medications);
      store.setMedicationItemsLastSync(now);

      const importedCount = autoImportMedications(medications);
      logger.log(`[Health Records] Auto-imported ${importedCount} medications into medications tab`);
      return { medicationsCount: medications.length, importedCount };
    }

    return { medicationsCount: 0, importedCount: 0 };
  } catch (error) {
    logger.error("[Health Records] Error syncing on connect:", error);
    return { medicationsCount: 0, importedCount: 0 };
  }
}
