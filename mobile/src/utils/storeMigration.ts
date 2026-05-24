import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "./logger";

/**
 * One-time migration utility to copy data from the legacy monolithic appStore
 * to the new domain-specific stores.
 *
 * This runs ONCE on app startup, before stores hydrate, to ensure
 * users don't lose their data after the store architecture refactor.
 */

const MIGRATION_COMPLETE_KEY = "store-migration-v2-complete";
const OLD_STORE_KEY = "daily-companion-app-storage";
const NEW_APP_STORE_KEY = "steadiday-app-storage";

// New store keys (must match persist config in each store)
const STORE_KEYS = {
  settings: "settings-store",
  user: "user-store",
  task: "task-store",
  medication: "medication-store",
  health: "health-store",
  ui: "ui-store",
};

/**
 * Migrate app store data from old key (daily-companion-app-storage)
 * to new key (steadiday-app-storage) for SteadiDay rebrand.
 */
async function migrateAppStoreKey(): Promise<void> {
  try {
    // Check if new key already has data
    const newDataRaw = await AsyncStorage.getItem(NEW_APP_STORE_KEY);
    if (newDataRaw) {
      logger.log("[Migration] New app store key already has data, skipping key migration");
      return;
    }

    // Check if old key has data to migrate
    const oldDataRaw = await AsyncStorage.getItem(OLD_STORE_KEY);
    if (!oldDataRaw) {
      logger.log("[Migration] No old app store data to migrate");
      return;
    }

    // Copy data from old key to new key
    logger.log("[Migration] Migrating app store data from old key to new key");
    const oldData = JSON.parse(oldDataRaw);

    // Update the version to trigger any necessary migrations in appStore
    if (oldData.version !== undefined) {
      oldData.version = Math.max(oldData.version, 2);
    }

    await AsyncStorage.setItem(NEW_APP_STORE_KEY, JSON.stringify(oldData));
    logger.log("[Migration] App store key migration complete");

    // Note: We don't delete the old key in case rollback is needed
  } catch (error) {
    logger.error("[Migration] Error migrating app store key:", error);
  }
}

export async function migrateFromLegacyStore(): Promise<boolean> {
  try {
    // Check if migration already done
    const migrationComplete = await AsyncStorage.getItem(MIGRATION_COMPLETE_KEY);
    if (migrationComplete === "true") {
      logger.log("[Migration] Already completed, skipping");
      // Still check for app store key migration (old -> new branding)
      await migrateAppStoreKey();
      await migratePhoneNumbers();
      return false;
    }

    // Read old store data
    const oldDataRaw = await AsyncStorage.getItem(OLD_STORE_KEY);
    if (!oldDataRaw) {
      logger.log("[Migration] No legacy data found");
      await AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, "true");
      return false;
    }

    const oldData = JSON.parse(oldDataRaw);
    // Zustand persist wraps state in { state: {...}, version: N }
    const state = oldData.state || oldData;
    logger.log("[Migration] Found legacy data, migrating...");

    // Check if we have meaningful data to migrate
    const hasSettings = state.settings && Object.keys(state.settings).length > 0;
    const hasTasks = state.tasks && state.tasks.length > 0;
    const hasMedications = state.medications && state.medications.length > 0;
    const hasUserProfile = state.userProfile && Object.keys(state.userProfile).length > 0;
    const hasCompletedOnboarding = state.hasCompletedOnboarding === true;

    logger.log("[Migration] Data check:", {
      hasSettings,
      hasTasks,
      hasMedications,
      hasUserProfile,
      hasCompletedOnboarding,
    });

    // Only migrate if the new stores don't already have data
    // This prevents overwriting if stores were already hydrated with new data

    // 1. Migrate Settings Store
    const existingSettings = await AsyncStorage.getItem(STORE_KEYS.settings);
    if (!existingSettings && hasSettings) {
      const settingsData = {
        state: {
          _hasHydrated: false,
          // Display settings
          textSize: state.settings.textSize || "normal",
          colorTheme: state.settings.colorTheme || "blue",
          appearanceMode: state.settings.appearanceMode || "light",
          // Accessibility
          highContrastEnabled: state.settings.highContrastEnabled || false,
          colorBlindModeEnabled: state.settings.colorBlindModeEnabled || false,
          reduceMotionEnabled: state.settings.reduceMotionEnabled || false,
          // Sound & haptics
          soundSettings: state.settings.soundSettings || {
            appSoundsEnabled: true,
            hapticFeedbackEnabled: true,
            medicationReminderSound: "default",
            taskReminderSound: "default",
            loudEmergencySounds: true,
          },
          // Features
          fallDetectionEnabled: state.settings.fallDetectionEnabled || false,
          useDeviceLocation: state.settings.useDeviceLocation || false,
          voiceGuidanceEnabled: state.settings.voiceGuidanceEnabled || false,
          // Security
          biometricEnabled: state.settings.biometricEnabled || false,
          securityEnabled: state.settings.securityEnabled || false,
          rememberMe: state.settings.rememberMe || false,
          appPin: state.settings.appPin,
          lastUnlockTime: state.settings.lastUnlockTime,
          // Developer
          developerMode: state.settings.developerMode || false,
          adsEnabled: state.settings.adsEnabled ?? false,
          // Notifications
          medicationRemindersEnabled: state.settings.medicationRemindersEnabled ?? true,
          taskRemindersEnabled: state.settings.taskRemindersEnabled ?? true,
          dailyCheckInEnabled: state.settings.dailyCheckInEnabled || false,
          dailyCheckInTime: state.settings.dailyCheckInTime || "20:00",
          dailyCheckInAlertsEnabled: state.settings.dailyCheckInAlertsEnabled ?? true,
          missedMedicationAlertEnabled: state.settings.missedMedicationAlertEnabled ?? true,
          callAfterSOS: state.settings.callAfterSOS || false,
          notificationSource: state.settings.notificationSource === "daily-companion" ? "steadiday" : (state.settings.notificationSource || "steadiday"),
          // Calendar
          calendarSyncEnabled: state.settings.calendarSyncEnabled || false,
          calendarId: state.settings.calendarId,
          // Food & Water tracking
          foodTrackingEnabled: state.settings.foodTrackingEnabled ?? true,
          waterTrackingEnabled: state.settings.waterTrackingEnabled ?? true,
          foodNotificationsEnabled: state.settings.foodNotificationsEnabled ?? true,
          waterNotificationsEnabled: state.settings.waterNotificationsEnabled ?? true,
          intakeIntroSeen: state.settings.intakeIntroSeen || false,
          // Home Screen
          homeScreenWidgets: state.settings.homeScreenWidgets || ["safety-session", "sos", "medications", "tasks", "weather"],
          // Language
          language: state.settings.language || "en",
        },
        version: 0,
      };
      await AsyncStorage.setItem(STORE_KEYS.settings, JSON.stringify(settingsData));
      logger.log("[Migration] Settings migrated");
    }

    // 2. Migrate User Store
    const existingUser = await AsyncStorage.getItem(STORE_KEYS.user);
    if (!existingUser && (hasUserProfile || hasCompletedOnboarding)) {
      // Migrate emergency contacts - add isEmergencyContact field to existing contacts
      const existingContacts = state.emergencyContacts || state.userProfile?.emergencyContacts || [];
      const migratedContacts = existingContacts.map((contact: any) => ({
        ...contact,
        isEmergencyContact: contact.isEmergencyContact ?? true, // All existing contacts become emergency contacts
      }));

      const userData = {
        state: {
          _hasHydrated: false,
          userProfile: {
            name: state.userProfile?.name || "",
            birthday: state.userProfile?.birthday,
            location: state.userProfile?.location,
            auth: state.userProfile?.auth,
            emergencyContacts: migratedContacts,
            favoriteContacts: [], // favoriteContacts removed, don't migrate
          },
          hasCompletedOnboarding: state.hasCompletedOnboarding || false,
        },
        version: 0,
      };
      await AsyncStorage.setItem(STORE_KEYS.user, JSON.stringify(userData));
      logger.log("[Migration] User data migrated, hasCompletedOnboarding:", userData.state.hasCompletedOnboarding);
    }

    // 3. Migrate Task Store
    const existingTasks = await AsyncStorage.getItem(STORE_KEYS.task);
    if (!existingTasks && (hasTasks || state.notes?.length > 0 || state.parkingSpot)) {
      const taskData = {
        state: {
          _hasHydrated: false,
          tasks: state.tasks || [],
          notes: state.notes || [],
          parkingSpot: state.parkingSpot || null,
        },
        version: 0,
      };
      await AsyncStorage.setItem(STORE_KEYS.task, JSON.stringify(taskData));
      logger.log("[Migration] Tasks migrated:", taskData.state.tasks.length, "tasks");
    }

    // 4. Migrate Medication Store
    const existingMeds = await AsyncStorage.getItem(STORE_KEYS.medication);
    if (!existingMeds && (hasMedications || state.medicationLogs?.length > 0)) {
      const medData = {
        state: {
          _hasHydrated: false,
          medications: state.medications || [],
          medicationLogs: state.medicationLogs || [],
        },
        version: 0,
      };
      await AsyncStorage.setItem(STORE_KEYS.medication, JSON.stringify(medData));
      logger.log("[Migration] Medications migrated:", medData.state.medications.length, "medications");
    }

    // 5. Migrate Health Store
    const existingHealth = await AsyncStorage.getItem(STORE_KEYS.health);
    const hasHealthData =
      state.healthMetrics?.length > 0 ||
      state.foodEntries?.length > 0 ||
      state.waterLogs?.length > 0 ||
      state.insuranceCards?.length > 0 ||
      state.doctors?.length > 0;

    if (!existingHealth && hasHealthData) {
      const healthData = {
        state: {
          _hasHydrated: false,
          healthMetrics: state.healthMetrics || [],
          healthGoals: state.healthGoals || {},
          foodEntries: state.foodEntries || [],
          waterLogs: state.waterLogs || [],
          insuranceCards: state.insuranceCards || [],
          doctors: state.doctors || [],
        },
        version: 0,
      };
      await AsyncStorage.setItem(STORE_KEYS.health, JSON.stringify(healthData));
      logger.log("[Migration] Health data migrated");
    }

    // 6. Migrate UI Store
    const existingUI = await AsyncStorage.getItem(STORE_KEYS.ui);
    const hasUIData =
      state.shownTooltips?.length > 0 ||
      state.dismissedInfoCards?.length > 0 ||
      state.connectedApps?.length > 0 ||
      state.favoriteTools?.length > 0 ||
      state.visitedTabs?.length > 0;

    if (!existingUI && hasUIData) {
      const uiData = {
        state: {
          _hasHydrated: false,
          shownTooltips: state.shownTooltips || [],
          dismissedInfoCards: state.dismissedInfoCards || [],
          connectedApps: state.connectedApps || [],
          favoriteTools: state.favoriteTools || [],
          visitedTabs: state.visitedTabs || [],
          hasSeenTabScrollHint: state.hasSeenTabScrollHint || false,
        },
        version: 0,
      };
      await AsyncStorage.setItem(STORE_KEYS.ui, JSON.stringify(uiData));
      logger.log("[Migration] UI state migrated");
    }

    // Run phone normalization on freshly migrated data too
    await migratePhoneNumbers();

    // Mark migration complete
    await AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, "true");
    logger.log("[Migration] Complete! User data preserved.");

    return true; // Migration happened, stores will pick up migrated data on hydration
  } catch (error) {
    logger.error("[Migration] Error:", error);
    // Don't mark as complete if there was an error - will retry next launch
    return false;
  }
}

const PHONE_NORMALIZE_KEY = "phone-normalize-v1-complete";

function normalizeUSPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  return digits;
}

export async function migratePhoneNumbers(): Promise<void> {
  try {
    const done = await AsyncStorage.getItem(PHONE_NORMALIZE_KEY);
    if (done === "true") return;

    const userRaw = await AsyncStorage.getItem(STORE_KEYS.user);
    if (userRaw) {
      const userData = JSON.parse(userRaw);
      const contacts = userData?.state?.userProfile?.emergencyContacts;
      if (Array.isArray(contacts) && contacts.length > 0) {
        let changed = false;
        for (const contact of contacts) {
          if (typeof contact.phoneNumber === "string") {
            const normalized = normalizeUSPhone(contact.phoneNumber);
            if (normalized !== contact.phoneNumber) {
              contact.phoneNumber = normalized;
              changed = true;
            }
          }
        }
        if (changed) {
          await AsyncStorage.setItem(STORE_KEYS.user, JSON.stringify(userData));
          logger.log("[Migration] Normalized emergency contact phone numbers");
        }
      }
    }

    await AsyncStorage.setItem(PHONE_NORMALIZE_KEY, "true");
  } catch (error) {
    logger.error("[Migration] Phone normalization error:", error);
  }
}

/**
 * Reset migration flag (for debugging/testing)
 */
export async function resetMigration(): Promise<void> {
  await AsyncStorage.removeItem(MIGRATION_COMPLETE_KEY);
  logger.log("[Migration] Reset - will run again on next launch");
}

/**
 * Check if migration has been completed
 */
export async function isMigrationComplete(): Promise<boolean> {
  const complete = await AsyncStorage.getItem(MIGRATION_COMPLETE_KEY);
  return complete === "true";
}
