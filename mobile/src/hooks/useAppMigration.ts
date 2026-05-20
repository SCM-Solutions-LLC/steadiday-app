import { useState, useEffect } from "react";
import { migrateFromLegacyStore } from "../utils/storeMigration";
import { logger } from "../utils/logger";

/**
 * Custom hook to handle one-time migration from legacy store
 * Runs migration BEFORE stores hydrate to ensure users don't lose data
 *
 * @returns {Object} - { migrationChecked: boolean }
 */
export function useAppMigration(): { migrationChecked: boolean } {
  const [migrationChecked, setMigrationChecked] = useState(false);

  useEffect(() => {
    const runMigration = async () => {
      try {
        const didMigrate = await migrateFromLegacyStore();
        if (didMigrate) {
          logger.log("[App] Migration completed, stores will pick up migrated data");
        }
      } catch (error) {
        // Don't crash on migration failure - just log and continue
        logger.error("[App] Migration failed:", error);
      } finally {
        // Always mark migration as checked so app can proceed
        setMigrationChecked(true);
      }
    };
    runMigration();
  }, []);

  return { migrationChecked };
}

export default useAppMigration;
