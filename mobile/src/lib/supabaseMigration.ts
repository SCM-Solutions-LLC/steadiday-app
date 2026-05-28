import AsyncStorage from "@react-native-async-storage/async-storage";

import { logger } from "../utils/logger";
import { supabase } from "./supabase";

const MIGRATION_FLAG_KEY = "supabase_migration_complete_v1";

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
