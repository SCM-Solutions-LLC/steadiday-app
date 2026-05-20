import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Calendar from "expo-calendar";
import { Platform } from "react-native";

// ============================================================================
// INTEGRATIONS STORE
// Manages connected app integrations state - shared between onboarding and settings
// ============================================================================

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  platforms: ("ios" | "android")[];
  isConnected: boolean;
  requiresPremium: boolean;
}

// Metadata for selected calendars
export interface CalendarMeta {
  id: string;
  name: string;
  source: string;
  color: string;
  isReadOnly: boolean;
}

// Metadata for selected reminder lists
export interface ReminderListMeta {
  id: string;
  name: string;
  source: string;
  color: string;
  isReadOnly: boolean;
}

// Permission status type
export type PermissionStatus = "undetermined" | "granted" | "denied";

// Apple Calendar integration state
export interface AppleCalendarState {
  isConnected: boolean;
  permissionStatus: PermissionStatus;
  selectedCalendarIds: string[];
  selectedCalendarMeta: CalendarMeta[];
  lastSyncedAt: string | null;
}

// Apple Reminders integration state
export interface AppleRemindersState {
  isConnected: boolean;
  permissionStatus: PermissionStatus;
  selectedListIds: string[];
  selectedListMeta: ReminderListMeta[];
  lastSyncedAt: string | null;
}

// Sync mutex state - prevents concurrent syncs
export interface SyncMutexState {
  isSyncingCalendar: boolean;
  isSyncingReminders: boolean;
  isSyncingHealth: boolean;
}

// Flow lock state - prevents purchase/permission conflicts
export interface FlowLockState {
  isPurchaseInProgress: boolean;
  isPermissionPromptOpen: boolean;
  flowLockReason: string | null;
}

interface IntegrationsState {
  _hasHydrated: boolean;
  integrations: Integration[];
  // New integration-specific state
  appleCalendar: AppleCalendarState;
  appleReminders: AppleRemindersState;
  // Sync mutex flags
  syncMutex: SyncMutexState;
  // Flow lock for purchase/permission coordination
  flowLock: FlowLockState;
}

interface IntegrationsActions {
  setHasHydrated: (state: boolean) => void;
  toggleIntegration: (id: string) => void;
  setIntegrationConnected: (id: string, connected: boolean) => void;
  getIntegration: (id: string) => Integration | undefined;

  // Apple Calendar actions
  setAppleCalendarConnected: (connected: boolean) => void;
  setAppleCalendarPermission: (status: PermissionStatus) => void;
  setSelectedCalendars: (ids: string[], meta: CalendarMeta[]) => void;
  updateAppleCalendarLastSync: () => void;

  // Apple Reminders actions
  setAppleRemindersConnected: (connected: boolean) => void;
  setAppleRemindersPermission: (status: PermissionStatus) => void;
  setSelectedReminderLists: (ids: string[], meta: ReminderListMeta[]) => void;
  updateAppleRemindersLastSync: () => void;

  // Utility actions
  disconnectAppleCalendar: () => void;
  disconnectAppleReminders: () => void;

  // Sync mutex actions
  setSyncingCalendar: (syncing: boolean) => void;
  setSyncingReminders: (syncing: boolean) => void;
  setSyncingHealth: (syncing: boolean) => void;
  canStartSync: (type: "calendar" | "reminders" | "health") => boolean;

  // Flow lock actions
  setPurchaseInProgress: (inProgress: boolean, reason?: string) => void;
  setPermissionPromptOpen: (open: boolean, reason?: string) => void;
  canStartPurchase: () => boolean;
  canStartPermissionPrompt: () => boolean;
  clearFlowLock: () => void;
}

type IntegrationsStore = IntegrationsState & IntegrationsActions;

const DEFAULT_APPLE_CALENDAR: AppleCalendarState = {
  isConnected: false,
  permissionStatus: "undetermined",
  selectedCalendarIds: [],
  selectedCalendarMeta: [],
  lastSyncedAt: null,
};

const DEFAULT_APPLE_REMINDERS: AppleRemindersState = {
  isConnected: false,
  permissionStatus: "undetermined",
  selectedListIds: [],
  selectedListMeta: [],
  lastSyncedAt: null,
};

const DEFAULT_SYNC_MUTEX: SyncMutexState = {
  isSyncingCalendar: false,
  isSyncingReminders: false,
  isSyncingHealth: false,
};

const DEFAULT_FLOW_LOCK: FlowLockState = {
  isPurchaseInProgress: false,
  isPermissionPromptOpen: false,
  flowLockReason: null,
};

const DEFAULT_INTEGRATIONS: Integration[] = [
  {
    id: "apple-health",
    name: Platform.OS === "ios" ? "Apple Health" : "Health Connect",
    description: "Sync your health and activity data",
    icon: "fitness",
    platforms: ["ios", "android"],
    isConnected: false,
    requiresPremium: false,
  },
  {
    id: "apple-calendar",
    name: "Apple Calendar",
    description: "Sync your calendar events and appointments",
    icon: "calendar",
    platforms: ["ios"],
    isConnected: false,
    requiresPremium: false,
  },
  {
    id: "apple-reminders",
    name: "Apple Reminders",
    description: "Sync your reminders and to-do lists",
    icon: "checkbox",
    platforms: ["ios"],
    isConnected: false,
    requiresPremium: false,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync your Google calendar events",
    icon: "calendar-outline",
    platforms: ["ios", "android"],
    isConnected: false,
    requiresPremium: false,
  },
];

export const useIntegrationsStore = create<IntegrationsStore>()(
  persist(
    (set, get) => ({
      // State
      _hasHydrated: false,
      integrations: DEFAULT_INTEGRATIONS,
      appleCalendar: DEFAULT_APPLE_CALENDAR,
      appleReminders: DEFAULT_APPLE_REMINDERS,
      syncMutex: DEFAULT_SYNC_MUTEX,
      flowLock: DEFAULT_FLOW_LOCK,

      // Actions
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      toggleIntegration: (id) => {
        set((state) => ({
          integrations: state.integrations.map((integration) =>
            integration.id === id
              ? { ...integration, isConnected: !integration.isConnected }
              : integration
          ),
        }));
      },

      setIntegrationConnected: (id, connected) => {
        set((state) => ({
          integrations: state.integrations.map((integration) =>
            integration.id === id
              ? { ...integration, isConnected: connected }
              : integration
          ),
        }));
      },

      getIntegration: (id) => {
        return get().integrations.find((i) => i.id === id);
      },

      // Apple Calendar actions
      setAppleCalendarConnected: (connected) => {
        set((state) => ({
          appleCalendar: { ...state.appleCalendar, isConnected: connected },
          integrations: state.integrations.map((i) =>
            i.id === "apple-calendar" ? { ...i, isConnected: connected } : i
          ),
        }));
      },

      setAppleCalendarPermission: (status) => {
        set((state) => ({
          appleCalendar: { ...state.appleCalendar, permissionStatus: status },
        }));
      },

      setSelectedCalendars: (ids, meta) => {
        set((state) => ({
          appleCalendar: {
            ...state.appleCalendar,
            selectedCalendarIds: ids,
            selectedCalendarMeta: meta,
          },
        }));
      },

      updateAppleCalendarLastSync: () => {
        set((state) => ({
          appleCalendar: {
            ...state.appleCalendar,
            lastSyncedAt: new Date().toISOString(),
          },
        }));
      },

      // Apple Reminders actions
      setAppleRemindersConnected: (connected) => {
        set((state) => ({
          appleReminders: { ...state.appleReminders, isConnected: connected },
          integrations: state.integrations.map((i) =>
            i.id === "apple-reminders" ? { ...i, isConnected: connected } : i
          ),
        }));
      },

      setAppleRemindersPermission: (status) => {
        set((state) => ({
          appleReminders: { ...state.appleReminders, permissionStatus: status },
        }));
      },

      setSelectedReminderLists: (ids, meta) => {
        set((state) => ({
          appleReminders: {
            ...state.appleReminders,
            selectedListIds: ids,
            selectedListMeta: meta,
          },
        }));
      },

      updateAppleRemindersLastSync: () => {
        set((state) => ({
          appleReminders: {
            ...state.appleReminders,
            lastSyncedAt: new Date().toISOString(),
          },
        }));
      },

      // Utility actions
      disconnectAppleCalendar: () => {
        set((state) => ({
          appleCalendar: {
            ...state.appleCalendar,
            isConnected: false,
            selectedCalendarIds: [],
            selectedCalendarMeta: [],
            lastSyncedAt: null,
          },
          integrations: state.integrations.map((i) =>
            i.id === "apple-calendar" ? { ...i, isConnected: false } : i
          ),
        }));
      },

      disconnectAppleReminders: () => {
        set((state) => ({
          appleReminders: {
            ...state.appleReminders,
            isConnected: false,
            selectedListIds: [],
            selectedListMeta: [],
            lastSyncedAt: null,
          },
          integrations: state.integrations.map((i) =>
            i.id === "apple-reminders" ? { ...i, isConnected: false } : i
          ),
        }));
      },

      // Sync mutex actions
      setSyncingCalendar: (syncing) => {
        set((state) => ({
          syncMutex: { ...state.syncMutex, isSyncingCalendar: syncing },
        }));
      },

      setSyncingReminders: (syncing) => {
        set((state) => ({
          syncMutex: { ...state.syncMutex, isSyncingReminders: syncing },
        }));
      },

      setSyncingHealth: (syncing) => {
        set((state) => ({
          syncMutex: { ...state.syncMutex, isSyncingHealth: syncing },
        }));
      },

      canStartSync: (type) => {
        const { syncMutex } = get();
        switch (type) {
          case "calendar":
            return !syncMutex.isSyncingCalendar;
          case "reminders":
            return !syncMutex.isSyncingReminders;
          case "health":
            return !syncMutex.isSyncingHealth;
          default:
            return true;
        }
      },

      // Flow lock actions
      setPurchaseInProgress: (inProgress, reason) => {
        set((state) => ({
          flowLock: {
            ...state.flowLock,
            isPurchaseInProgress: inProgress,
            flowLockReason: inProgress ? (reason ?? "purchase") : state.flowLock.isPermissionPromptOpen ? state.flowLock.flowLockReason : null,
          },
        }));
      },

      setPermissionPromptOpen: (open, reason) => {
        set((state) => ({
          flowLock: {
            ...state.flowLock,
            isPermissionPromptOpen: open,
            flowLockReason: open ? (reason ?? "permission") : state.flowLock.isPurchaseInProgress ? state.flowLock.flowLockReason : null,
          },
        }));
      },

      canStartPurchase: () => {
        const { flowLock } = get();
        return !flowLock.isPurchaseInProgress && !flowLock.isPermissionPromptOpen;
      },

      canStartPermissionPrompt: () => {
        const { flowLock } = get();
        return !flowLock.isPurchaseInProgress && !flowLock.isPermissionPromptOpen;
      },

      clearFlowLock: () => {
        set({ flowLock: DEFAULT_FLOW_LOCK });
      },
    }),
    {
      name: "integrations-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        integrations: state.integrations,
        appleCalendar: state.appleCalendar,
        appleReminders: state.appleReminders,
      }),
    }
  )
);

// Selector hooks for individual integrations
export const useIntegration = (id: string) =>
  useIntegrationsStore((s) => s.integrations.find((i) => i.id === id));

export const useConnectedIntegrations = () =>
  useIntegrationsStore((s) => s.integrations.filter((i) => i.isConnected));

// Selector hooks for Apple Calendar
export const useAppleCalendar = () =>
  useIntegrationsStore((s) => s.appleCalendar);

// Selector hooks for Apple Reminders
export const useAppleReminders = () =>
  useIntegrationsStore((s) => s.appleReminders);
