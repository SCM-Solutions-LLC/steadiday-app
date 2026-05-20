import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthInfo, DailyLog, Task, Medication, FamilyMessage } from "../types/app";
import { useHealthStore } from "./stores/healthStore";
import { useTaskStore } from "./stores/taskStore";
import { useMedicationStore } from "./stores/medicationStore";
import { useSettingsStore } from "./stores/settingsStore";
import { useUIStore } from "./stores/uiStore";
import { useIntegrationsStore } from "./stores/integrationsStore";
import {
  performFullSync,
  syncTaskCompletionToExternal,
} from "../utils/twoWaySync";
import {
  getMockTasksForApp,
  getMockMedicationsForApp,
  getMockMessagesForApp,
} from "../utils/mockSyncData";
import { logger } from "../utils/logger";

/**
 * AppStore - Minimal store for app-level utilities not tied to specific domains
 *
 * Domain-specific state has been migrated to:
 * - useSettingsStore: App settings (text size, theme, notifications, etc.)
 * - useUserStore: User profile, emergency contacts, favorite contacts
 * - useTaskStore: Tasks, notes, parking spot
 * - useMedicationStore: Medications, medication logs
 * - useHealthStore: Health metrics, food entries, water logs, insurance, doctors
 * - useUIStore: Tooltips, info cards, connected apps, favorite tools
 *
 * This store contains:
 * - Onboarding state
 * - Authentication utilities
 * - Calendar sync utilities
 * - Two-way sync with external apps
 * - Daily logs query (aggregates from domain stores)
 */

interface AppStoreState {
  _hasHydrated?: boolean;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  // Legacy: Keep auth info in userProfile for backward compat during migration
  userProfile: {
    auth?: AuthInfo;
  };
  // Legacy: family messages (not yet migrated to domain store)
  familyMessages: FamilyMessage[];
  // Legacy: last sync time for calendar sync
  lastSyncTime?: string;
}

interface AppStore extends AppStoreState {
  // Onboarding
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // Authentication
  setUserAuth: (auth: AuthInfo) => void;
  clearUserAuth: () => void;

  // Calendar Sync Settings (delegates to settingsStore)
  setCalendarSyncEnabled: (enabled: boolean) => void;
  setCalendarId: (calendarId: string) => void;

  // Two-way Sync
  performTwoWaySync: () => Promise<void>;
  syncTaskCompletion: (taskId: string) => Promise<void>;
  setLastSyncTime: (time: string) => void;

  // Daily Logs (aggregates from healthStore)
  getDailyLogs: () => DailyLog[];

  // Family Messages (legacy - not yet migrated)
  addFamilyMessage: (message: FamilyMessage) => void;
}

const initialState: AppStoreState = {
  _hasHydrated: false,
  hasCompletedOnboarding: false,
  isAuthenticated: false,
  userProfile: {},
  familyMessages: [
    {
      id: "1",
      type: "photo",
      content: "https://picsum.photos/400/300",
      caption: "Had a great day at the park!",
      fromName: "Alice",
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      type: "text",
      content: "Hope you are having a wonderful day! Love you!",
      fromName: "Bob",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Onboarding
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),

      // Authentication
      setUserAuth: (auth) =>
        set((state) => ({
          isAuthenticated: auth.isAuthenticated,
          userProfile: { ...state.userProfile, auth },
        })),

      clearUserAuth: () =>
        set((state) => ({
          isAuthenticated: false,
          userProfile: { ...state.userProfile, auth: undefined },
        })),

      // Calendar Sync Settings - delegate to settingsStore
      setCalendarSyncEnabled: (enabled: boolean) => {
        useSettingsStore.getState().updateSettings({ calendarSyncEnabled: enabled });
      },

      setCalendarId: (calendarId: string) => {
        useSettingsStore.getState().updateSettings({ calendarId });
      },

      // Two-way sync methods
      performTwoWaySync: async () => {
        const integrationsState = useIntegrationsStore.getState();
        const taskState = useTaskStore.getState();

        const { appleCalendar, appleReminders } = integrationsState;

        // Check if any integrations are connected and have selections
        const hasCalendarSync = appleCalendar.isConnected && appleCalendar.selectedCalendarIds.length > 0;
        const hasRemindersSync = appleReminders.isConnected && appleReminders.selectedListIds.length > 0;

        if (!hasCalendarSync && !hasRemindersSync) {
          logger.log(`No integrations connected or no calendars/lists selected for sync. Calendar: connected=${appleCalendar.isConnected}, ids=${appleCalendar.selectedCalendarIds.length}. Reminders: connected=${appleReminders.isConnected}, ids=${appleReminders.selectedListIds.length}`);
          return;
        }

        // Check sync mutex - prevent concurrent syncs
        if (hasCalendarSync && !integrationsState.canStartSync("calendar")) {
          logger.log("Calendar sync blocked: Another calendar sync is in progress (mutex)");
          return;
        }
        if (hasRemindersSync && !integrationsState.canStartSync("reminders")) {
          logger.log("Reminders sync blocked: Another reminders sync is in progress (mutex)");
          return;
        }

        logger.log("Starting two-way sync...");
        logger.log(`Calendar sync: ${hasCalendarSync ? appleCalendar.selectedCalendarIds.length + " calendars" : "disabled"}`);
        logger.log(`Reminders sync: ${hasRemindersSync ? appleReminders.selectedListIds.length + " lists" : "disabled"}`);

        // Acquire mutex locks
        if (hasCalendarSync) integrationsState.setSyncingCalendar(true);
        if (hasRemindersSync) integrationsState.setSyncingReminders(true);

        try {
          // Build calendar meta from stored metadata
          const calendarMeta = appleCalendar.selectedCalendarMeta.map((meta) => ({
            id: meta.id,
            name: meta.name,
            color: meta.color,
          }));

          // Build reminder list meta from stored metadata
          const reminderListMeta = appleReminders.selectedListMeta.map((meta) => ({
            id: meta.id,
            name: meta.name,
            color: meta.color,
          }));

          const syncResult = await performFullSync(
            taskState.tasks,
            hasCalendarSync ? appleCalendar.selectedCalendarIds : [],
            hasRemindersSync ? appleReminders.selectedListIds : [],
            calendarMeta,
            reminderListMeta
          );

          // Add new tasks from external sources using batch add (atomic, no notification scheduling)
          if (syncResult.newTasks.length > 0) {
            logger.log(`Adding ${syncResult.newTasks.length} new tasks from external sources`);
            taskState.addTasksBatch(syncResult.newTasks);
          }

          // Update modified tasks (batch update to avoid async race conditions)
          if (syncResult.updatedTasks.length > 0) {
            logger.log(`Updating ${syncResult.updatedTasks.length} modified tasks`);
            set((state) => state); // no-op to ensure we're in sync
            const taskStoreState = useTaskStore.getState();
            useTaskStore.setState({
              tasks: taskStoreState.tasks.map((existingTask) => {
                const updatedTask = syncResult.updatedTasks.find((u) => u.id === existingTask.id);
                if (updatedTask) {
                  return {
                    ...existingTask,
                    ...updatedTask,
                    // Preserve local edit flag - don't mark external sync updates as locally edited
                    isLocallyEdited: existingTask.isLocallyEdited,
                  };
                }
                return existingTask;
              }),
            });
          }

          // Archive deleted tasks (instead of removing)
          if (syncResult.deletedTaskIds.length > 0) {
            logger.log(`Archiving ${syncResult.deletedTaskIds.length} deleted/removed tasks from external sources`);
            syncResult.deletedTaskIds.forEach((taskId) => {
              // Mark as archived instead of deleting
              taskState.updateTask(taskId, {
                syncStatus: "archived",
                archivedReason: "deleted_from_source",
                archivedAt: new Date().toISOString(),
              });
            });
          }

          // Update last sync time in integrations store
          if (hasCalendarSync) {
            integrationsState.updateAppleCalendarLastSync();
          }
          if (hasRemindersSync) {
            integrationsState.updateAppleRemindersLastSync();
          }

          // Update app store sync time too
          set({ lastSyncTime: new Date().toISOString() });

          logger.log("Two-way sync completed successfully");
        } catch (error) {
          logger.error("Error during two-way sync:", error);
        } finally {
          // Release mutex locks
          if (hasCalendarSync) integrationsState.setSyncingCalendar(false);
          if (hasRemindersSync) integrationsState.setSyncingReminders(false);
        }
      },

      syncTaskCompletion: async (taskId: string) => {
        const taskState = useTaskStore.getState();
        const task = taskState.tasks.find((t) => t.id === taskId);

        if (task && task.syncSource) {
          const success = await syncTaskCompletionToExternal(task);
          if (success) {
            logger.log(`Synced completion status for task ${taskId} to external source`);
          }
        }
      },

      setLastSyncTime: (time: string) => {
        set({ lastSyncTime: time });
      },

      // Daily Logs - aggregates data from healthStore
      getDailyLogs: () => {
        const healthState = useHealthStore.getState();
        const logsByDate: { [date: string]: DailyLog } = {};

        // Group food entries by date
        healthState.foodEntries.forEach((entry) => {
          const date = entry.date.split("T")[0];
          if (!logsByDate[date]) {
            logsByDate[date] = {
              id: `log-${date}`,
              date,
              totalCalories: 0,
              waterGlasses: 0,
              mealsLogged: 0,
            };
          }
          logsByDate[date].totalCalories += entry.calories;
          logsByDate[date].mealsLogged += 1;
        });

        // Add water data
        healthState.waterLogs.forEach((log) => {
          if (!logsByDate[log.date]) {
            logsByDate[log.date] = {
              id: `log-${log.date}`,
              date: log.date,
              totalCalories: 0,
              waterGlasses: 0,
              mealsLogged: 0,
            };
          }
          logsByDate[log.date].waterGlasses = log.glassesCount;
        });

        // Convert to array and sort by date (newest first)
        return Object.values(logsByDate).sort((a, b) => b.date.localeCompare(a.date));
      },

      // Family Messages (legacy)
      addFamilyMessage: (message) =>
        set((state) => ({
          familyMessages: [...state.familyMessages, message],
        })),
    }),
    {
      name: "steadiday-app-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: (persistedState: any, version: number) => {
        // Version 2: Minimal store after domain store migration
        if (version < 2) {
          logger.log("[AppStore] Migrating from version", version);
          // Keep only the app-level state, domain state is in separate stores
          return {
            _hasHydrated: false,
            hasCompletedOnboarding: persistedState?.hasCompletedOnboarding ?? false,
            isAuthenticated: persistedState?.isAuthenticated ??
              persistedState?.userProfile?.auth?.isAuthenticated ?? false,
            userProfile: {
              auth: persistedState?.userProfile?.auth,
            },
            familyMessages: persistedState?.familyMessages ?? initialState.familyMessages,
            lastSyncTime: persistedState?.settings?.lastSyncTime,
          };
        }

        // Version 3: SteadiDay rebrand - storage key changed from daily-companion-app-storage
        if (version < 3) {
          logger.log("[AppStore] Migrating to SteadiDay branding from version", version);
          return persistedState;
        }

        return persistedState;
      },
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state._hasHydrated = true;

            // Sync isAuthenticated from userProfile.auth if not already set
            if (state.isAuthenticated === undefined || state.isAuthenticated === null) {
              state.isAuthenticated = state.userProfile?.auth?.isAuthenticated ?? false;
            }
          }
        };
      },
    }
  )
);
