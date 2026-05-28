import AsyncStorage from "@react-native-async-storage/async-storage";

import { useCheckInStore } from "../state/stores/checkInStore";
import { useMedicationStore } from "../state/stores/medicationStore";
import { useTaskInstanceStore } from "../state/stores/taskInstanceStore";
import { useTaskStore } from "../state/stores/taskStore";
import { logger } from "../utils/logger";
import {
  toCloudCheckIn,
  toCloudMedication,
  toCloudMedicationLog,
  toCloudTask,
  toCloudTaskCompletion,
} from "./syncPayloads";
import { isSupabaseConfigured, supabase } from "./supabase";

const MIGRATION_FLAG_KEY = "supabase_migration_complete_v1";
const INITIAL_PUSH_FLAG_KEY = "supabase_initial_push_complete_v1";
const FIRST_OPEN_KEY = "steadiday_first_open_date";

/**
 * Zustand-persisted store keys we currently snapshot to the cloud on first
 * sign-in. These match the `name:` values in src/state/**.
 */
const PERSISTED_STORE_KEYS = [
  "steadiday-app-storage",
  "settings-store",
  "user-store",
  "task-store",
  "task-instance-store",
  "medication-store",
  "health-store",
  "health-sync-store",
  "health-records-store",
  "check-in-store",
  "mind-breaks-store",
  "engagement-store",
  "integrations-storage",
  "tip-store",
  "subscription-store",
  "ui-store",
  "safety-session-storage",
];

export async function isMigrationComplete(): Promise<boolean> {
  try {
    const flag = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
    return flag === "true";
  } catch {
    return false;
  }
}

export async function markMigrationComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "true");
  } catch (error) {
    logger.error("[supabaseMigration] Failed to mark migration complete:", error);
  }
}

interface LocalSnapshot {
  capturedAt: string;
  stores: Record<string, unknown>;
}

async function captureLocalSnapshot(): Promise<LocalSnapshot> {
  const stores: Record<string, unknown> = {};
  for (const key of PERSISTED_STORE_KEYS) {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        try {
          stores[key] = JSON.parse(raw);
        } catch {
          stores[key] = raw;
        }
      }
    } catch (error) {
      logger.error(`[supabaseMigration] Failed to read ${key}:`, error);
    }
  }
  return { capturedAt: new Date().toISOString(), stores };
}

/**
 * Copy local AsyncStorage app data into the signed-in user's Supabase profile.
 * No-op if migration has already run for this device.
 */
export async function migrateLocalDataToSupabase(userId: string): Promise<void> {
  if (await isMigrationComplete()) return;
  if (!userId) return;

  try {
    const snapshot = await captureLocalSnapshot();
    if (Object.keys(snapshot.stores).length === 0) {
      await markMigrationComplete();
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        local_snapshot: snapshot,
        migrated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      logger.error("[supabaseMigration] Upload failed:", error.message);
      return;
    }

    await markMigrationComplete();
  } catch (error) {
    logger.error("[supabaseMigration] Migration threw:", error);
  }
}

/**
 * Read each in-scope Zustand store and batch-insert the records into their
 * dedicated Supabase tables. Idempotent via INITIAL_PUSH_FLAG_KEY — the flag
 * is only set on full success so partial pushes will be retried.
 *
 * Privacy: photo/image/scan fields are stripped by syncPayloads' allow-list
 * before any data leaves the device.
 */
export async function pushLocalDataToSupabase(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  if ((await AsyncStorage.getItem(INITIAL_PUSH_FLAG_KEY)) === "true") return;

  const errors: unknown[] = [];

  // member_since from FIRST_OPEN_KEY (stored as ISO string)
  try {
    const firstOpen = await AsyncStorage.getItem(FIRST_OPEN_KEY);
    if (firstOpen) {
      const iso = isoFromMaybeTimestamp(firstOpen);
      if (iso) {
        const { error } = await supabase
          .from("profiles")
          .update({ member_since: iso })
          .eq("id", userId);
        if (error) errors.push(error);
      }
    }
  } catch (error) {
    errors.push(error);
  }

  // Tasks
  try {
    const tasks = useTaskStore.getState().tasks;
    if (tasks.length > 0) {
      const rows = tasks.map((t) => toCloudTask(t, userId));
      const { error } = await supabase.from("tasks").upsert(rows);
      if (error) errors.push(error);
    }
  } catch (error) {
    errors.push(error);
  }

  // Task completions
  try {
    const completions = Object.values(
      useTaskInstanceStore.getState().completions
    );
    if (completions.length > 0) {
      const rows = completions.map((c) => toCloudTaskCompletion(c, userId));
      const { error } = await supabase
        .from("task_completions")
        .upsert(rows, { onConflict: "task_id,completed_date" });
      if (error) errors.push(error);
    }
  } catch (error) {
    errors.push(error);
  }

  // Medications (photo fields stripped by toCloudMedication's allow-list)
  try {
    const meds = useMedicationStore.getState().medications;
    if (meds.length > 0) {
      const rows = meds.map((m) => toCloudMedication(m, userId));
      const { error } = await supabase.from("medications").upsert(rows);
      if (error) errors.push(error);
    }
  } catch (error) {
    errors.push(error);
  }

  // Medication logs
  try {
    const logs = useMedicationStore.getState().medicationLogs;
    if (logs.length > 0) {
      const rows = logs.map((l) => toCloudMedicationLog(l, userId));
      const { error } = await supabase.from("medication_logs").upsert(rows);
      if (error) errors.push(error);
    }
  } catch (error) {
    errors.push(error);
  }

  // Check-ins
  try {
    const byDate = useCheckInStore.getState().checkInsByDate;
    const rows = Object.entries(byDate)
      .map(([date, entry]) => toCloudCheckIn(date, entry, userId))
      .filter((row): row is Record<string, unknown> => row !== null);
    if (rows.length > 0) {
      const { error } = await supabase
        .from("check_ins")
        .upsert(rows, { onConflict: "user_id,check_in_date" });
      if (error) errors.push(error);
    }
  } catch (error) {
    errors.push(error);
  }

  if (errors.length === 0) {
    try {
      await AsyncStorage.setItem(INITIAL_PUSH_FLAG_KEY, "true");
    } catch (error) {
      logger.error("[supabaseMigration] Failed to set push flag:", error);
    }
  } else {
    logger.warn(
      `[supabaseMigration] Initial push had ${errors.length} error(s) — will retry next sign-in.`,
      errors
    );
  }
}

function isoFromMaybeTimestamp(value: string): string | null {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const ms = Number(trimmed);
    if (Number.isFinite(ms)) return new Date(ms).toISOString();
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
