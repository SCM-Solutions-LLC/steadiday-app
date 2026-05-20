/**
 * useHealthRecordsSync - Hook for syncing Apple Health Records (Lab Results & Medications)
 *
 * Uses @kingstinct/react-native-healthkit (Promise-based, New Architecture compatible).
 * Clinical records (lab results, medications) are not supported by the current library
 * and will return empty results gracefully.
 */

import { useCallback } from "react";
import { Platform } from "react-native";
import { useHealthRecordsStore } from "../state/stores/healthRecordsStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { useUserStore } from "../state/stores/userStore";
import { useMedicationStore } from "../state/stores/medicationStore";
import type { LabResultItem, MedicationItem, Medication } from "../types/app";
import { logger } from "../utils/logger";
let _hkModule: any = null;
let _hkLoadFailed = false;

function getHK(): any {
  if (_hkLoadFailed) return null;
  if (_hkModule) return _hkModule;
  try {
    const mod = require("@kingstinct/react-native-healthkit");
    if (!mod) { _hkLoadFailed = true; return null; }
    _hkModule = mod;
    return _hkModule;
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
  if (!isAvailable()) {
    logger.log("[Health Records] HealthKit not available");
    return false;
  }

  const mod = getHK();
  if (!mod) return false;

  try {
    const PERMISSION_TIMEOUT_MS = 10000;

    const authPromise = mod.requestAuthorization({
      toRead: ["HKQuantityTypeIdentifierStepCount"],
      toShare: [],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), PERMISSION_TIMEOUT_MS)
    );

    const granted = await Promise.race([authPromise, timeoutPromise]);

    if (granted) {
      logger.log("[Health Records] Permissions granted");
      return true;
    } else {
      logger.log("[Health Records] Permissions denied");
      return false;
    }
  } catch (error) {
    const msg = String(error);
    if (msg.includes("timeout")) {
      logger.log("[Health Records] Permission request timed out after 10s");
    } else {
      logger.log("[Health Records] Error requesting permissions:", error);
    }
    return false;
  }
}

async function fetchLabResults(): Promise<LabResultItem[]> {
  logger.log("[Health Records] Clinical records not supported by current HealthKit library");
  return [];
}

async function fetchMedicationRecords(): Promise<MedicationItem[]> {
  logger.log("[Health Records] Clinical records not supported by current HealthKit library");
  return [];
}

function parseInterpretation(value: string | undefined): "normal" | "high" | "low" | "abnormal" | "unknown" {
  if (!value) return "unknown";
  const lower = value.toLowerCase();
  if (lower.includes("normal")) return "normal";
  if (lower.includes("high") || lower.includes("elevated")) return "high";
  if (lower.includes("low")) return "low";
  if (lower.includes("abnormal")) return "abnormal";
  return "unknown";
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

function parseFrequency(scheduleText?: string): Medication["frequency"] {
  if (!scheduleText) return "daily";
  const lower = scheduleText.toLowerCase();
  if (lower.includes("twice") || lower.includes("2 times") || lower.includes("bid")) return "twice-daily";
  if (lower.includes("three") || lower.includes("3 times") || lower.includes("tid")) return "three-times-daily";
  if (lower.includes("four") || lower.includes("4 times") || lower.includes("qid")) return "four-times-daily";
  if (lower.includes("every other day") || lower.includes("alternate")) return "every-other-day";
  if (lower.includes("weekly") || lower.includes("once a week")) return "weekly";
  if (lower.includes("monthly") || lower.includes("once a month")) return "monthly";
  if (lower.includes("as needed") || lower.includes("prn")) return "as-needed";
  return "daily";
}

function getDefaultTimes(frequency: Medication["frequency"]): string[] {
  switch (frequency) {
    case "twice-daily": return ["08:00", "20:00"];
    case "three-times-daily": return ["08:00", "14:00", "20:00"];
    case "four-times-daily": return ["08:00", "12:00", "16:00", "20:00"];
    default: return ["09:00"];
  }
}

function convertToMedication(item: MedicationItem): Medication {
  const frequency = parseFrequency(item.scheduleText);
  const times = getDefaultTimes(frequency);
  const now = new Date().toISOString();

  return {
    id: `med-imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: item.medicationName,
    dosage: item.doseText || "",
    frequency,
    timeOfDay: "morning",
    reminderEnabled: true,
    firstAlert: "at_time",
    secondAlert: "none",
    scheduleType: "daily",
    times,
    createdAt: now,
    dataSource: "apple_health",
    linkedProviderId: item.id,
    linkedProviderName: item.medicationName,
    linkedProviderDosage: item.doseText,
    notes: item.routeText ? `Route: ${item.routeText}` : undefined,
  };
}

export function autoImportMedications(medicationItems: MedicationItem[]): number {
  const medStore = useMedicationStore.getState();
  const existingMeds = medStore.medications;

  const linkedIds = new Set(
    existingMeds
      .filter((m) => m.linkedProviderId)
      .map((m) => m.linkedProviderId!)
  );
  const existingNames = new Set(
    existingMeds.map((m) => m.name.toLowerCase().trim())
  );

  const toImport = medicationItems.filter((item) => {
    if (item.sourceType !== "apple_health") return false;
    if (item.status !== "active") return false;
    if (linkedIds.has(item.id)) return false;
    if (existingNames.has(item.medicationName.toLowerCase().trim())) return false;
    return true;
  });

  if (toImport.length === 0) return 0;

  for (const item of toImport) {
    const medication = convertToMedication(item);
    medStore.addMedication(medication);
  }

  logger.log(`[Health Records] Auto-imported ${toImport.length} medications into medications tab`);
  return toImport.length;
}

export type SyncReason = "auto" | "manual";

export interface SyncResult {
  success: boolean;
  labResultsCount: number;
  medicationsCount: number;
  importedCount?: number;
  error?: string;
  notAvailable?: boolean;
}

export function useHealthRecordsSync() {
  const isSyncing = useHealthRecordsStore((s) => s.isSyncing);
  const lastSyncError = useHealthRecordsStore((s) => s.lastSyncError);

  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);

  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);

  const shouldAutoSync = useCallback(() => {
    return useHealthRecordsStore.getState().shouldAutoSync();
  }, []);

  const getLastSyncTime = useCallback(() => {
    return useHealthRecordsStore.getState().getLastSyncTime();
  }, []);

  const syncAllHealthRecords = useCallback(
    async (reason: SyncReason, options?: { skipOnboardingCheck?: boolean }): Promise<SyncResult> => {
      if (Platform.OS !== "ios") {
        return { success: false, labResultsCount: 0, medicationsCount: 0, notAvailable: true };
      }

      const subStore = useSubscriptionStore.getState();
      if (!subStore.appleHealthConnected) {
        logger.log("[Health Records] Apple Health not connected, skipping sync");
        return { success: false, labResultsCount: 0, medicationsCount: 0, notAvailable: true };
      }

      const store = useHealthRecordsStore.getState();
      if (store.isSyncing) {
        logger.log("[Health Records] Sync already in progress, skipping");
        return { success: false, labResultsCount: 0, medicationsCount: 0, error: "Sync already in progress" };
      }

      if (reason === "auto" && !store.shouldAutoSync()) {
        logger.log("[Health Records] Auto-sync cooldown not passed, skipping");
        return { success: false, labResultsCount: 0, medicationsCount: 0 };
      }

      store.setIsSyncing(true);
      store.setLastSyncError(null);

      try {
        const hasPermission = await withTimeout(
          requestClinicalRecordsPermissions(),
          SYNC_TIMEOUT_MS,
          "Permission request timed out"
        );

        if (!hasPermission) {
          logger.log("[Health Records] Clinical records permissions not available");
          store.setIsSyncing(false);
          return { success: false, labResultsCount: 0, medicationsCount: 0, notAvailable: true };
        }

        const [labResults, medications] = await withTimeout(
          Promise.all([fetchLabResults(), fetchMedicationRecords()]),
          SYNC_TIMEOUT_MS,
          "Health records fetch timed out"
        );

        logger.log(`[Health Records] Fetched ${labResults.length} lab results, ${medications.length} medications`);

        const now = new Date().toISOString();

        if (labResults.length > 0) {
          store.addLabResults(labResults);
          store.setLabResultsLastSync(now);
        }

        if (medications.length > 0) {
          store.upsertManyMedicationItems(medications);
          store.setMedicationItemsLastSync(now);
        }

        const importedCount = autoImportMedications(medications);

        if (reason === "auto") {
          store.setLastAutoSyncAt(now);
        } else {
          store.setLastManualSyncAt(now);
        }

        logger.log(`[Health Records] Sync complete: ${labResults.length} labs, ${medications.length} meds, ${importedCount} auto-imported`);

        return {
          success: true,
          labResultsCount: labResults.length,
          medicationsCount: medications.length,
          importedCount,
        };
      } catch (error: any) {
        const errorMsg = error?.message || "Unknown sync error";
        logger.error("[Health Records] Sync failed:", errorMsg);
        store.setLastSyncError(errorMsg);
        return { success: false, labResultsCount: 0, medicationsCount: 0, error: errorMsg };
      } finally {
        store.setIsSyncing(false);
      }
    },
    []
  );

  return {
    isSyncing,
    lastSyncError,
    getLastSyncTime,
    shouldAutoSync,
    isPremiumUnlocked,
    hasCompletedOnboarding,
    syncAllHealthRecords,
  };
}
