import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  TextSize,
  ColorTheme,
  AppearanceMode,
  SoundSettings,
  HomeScreenWidget,
  ReminderSound,
  Language,
} from "../../types/app";

// ============================================================================
// SETTINGS STORE
// Manages all app settings, themes, accessibility, and home screen widgets
// ============================================================================

interface SettingsState {
  // Hydration
  _hasHydrated: boolean;

  // Display settings
  textSize: TextSize;
  colorTheme: ColorTheme;
  appearanceMode: AppearanceMode;

  // Accessibility
  highContrastEnabled: boolean;
  colorBlindModeEnabled: boolean;
  slowModeEnabled: boolean;

  // Sound & haptics
  soundSettings: SoundSettings;

  // Features
  fallDetectionEnabled: boolean;
  useDeviceLocation: boolean;
  voiceGuidanceEnabled: boolean;

  // Security
  biometricEnabled: boolean;
  securityEnabled: boolean;
  rememberMe: boolean;
  appPin?: string;
  lastUnlockTime?: string;

  // Developer
  developerMode: boolean;
  adsEnabled: boolean;

  // Notifications
  medicationRemindersEnabled: boolean;
  taskRemindersEnabled: boolean;
  dailyCheckInEnabled: boolean;
  dailyCheckInTime: string;
  dailyCheckInAlertsEnabled: boolean;
  missedMedicationAlertEnabled: boolean;
  callAfterSOS: boolean;
  notificationSource: string;

  // Calendar
  calendarSyncEnabled: boolean;
  calendarId?: string;
  enableAppleWriteBack: boolean;

  // Food & Water tracking
  foodTrackingEnabled: boolean;
  waterTrackingEnabled: boolean;
  foodNotificationsEnabled: boolean;
  waterNotificationsEnabled: boolean;
  waterReminderTimes: string[]; // Array of "HH:MM" formatted times
  intakeIntroSeen: boolean;

  // Home Screen
  homeScreenWidgets: HomeScreenWidget[];

  // Language
  language: Language;

  // Location
  userLocation?: string;
  userCity?: string;

  // Mind Breaks
  mindBreaksReminderEnabled: boolean;
  mindBreaksReminderTime: string; // "HH:MM" format

  // Care View
  careViewEnabled: boolean;
  careViewProtection: "face_id" | "pin" | "none";
  careViewPin?: string;
  careViewAutoLock: boolean;
}

interface SettingsActions {
  // Setters
  setTextSize: (size: TextSize) => void;
  setColorTheme: (theme: ColorTheme) => void;
  setAppearanceMode: (mode: AppearanceMode) => void;
  setCalendarSyncEnabled: (enabled: boolean) => void;
  setCalendarId: (calendarId: string) => void;

  // Bulk update
  updateSettings: (updates: Partial<SettingsState>) => void;

  // Home screen widgets
  toggleHomeScreenWidget: (widget: HomeScreenWidget) => void;
  reorderHomeScreenWidgets: (newOrder: HomeScreenWidget[]) => void;

  // Reset
  resetSettings: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  appSoundsEnabled: true,
  hapticFeedbackEnabled: true,
  medicationReminderSound: "default" as ReminderSound,
  taskReminderSound: "default" as ReminderSound,
  loudEmergencySounds: true,
};

const DEFAULT_SETTINGS: Omit<SettingsState, "_hasHydrated"> = {
  // Display
  textSize: "normal",
  colorTheme: "sage",
  appearanceMode: "light",

  // Accessibility
  highContrastEnabled: false,
  colorBlindModeEnabled: false,
  slowModeEnabled: true, // Default ON for new users

  // Sound
  soundSettings: DEFAULT_SOUND_SETTINGS,

  // Features
  fallDetectionEnabled: false,
  useDeviceLocation: false,
  voiceGuidanceEnabled: false,

  // Security
  biometricEnabled: false,
  securityEnabled: false,
  rememberMe: false,
  appPin: undefined,
  lastUnlockTime: undefined,

  // Developer
  developerMode: false,
  adsEnabled: false, // Disabled for launch

  // Notifications
  medicationRemindersEnabled: true,
  taskRemindersEnabled: true,
  dailyCheckInEnabled: false,
  dailyCheckInTime: "20:00",
  dailyCheckInAlertsEnabled: true,
  missedMedicationAlertEnabled: true,
  callAfterSOS: false,
  notificationSource: "steadiday",

  // Calendar
  calendarSyncEnabled: false,
  calendarId: undefined,
  enableAppleWriteBack: false, // Import-only by default, no write-back to Apple

  // Food & Water
  foodTrackingEnabled: true,
  waterTrackingEnabled: true,
  foodNotificationsEnabled: true,
  waterNotificationsEnabled: true,
  waterReminderTimes: ["08:00", "10:30", "13:00", "15:30", "18:00", "20:30"],
  intakeIntroSeen: false,

  // Home Screen
  homeScreenWidgets: ["daily-check-in", "medications", "tasks", "safety-session", "sos"],

  // Language
  language: "en",

  // Location
  userLocation: undefined,
  userCity: undefined,

  // Mind Breaks
  mindBreaksReminderEnabled: true,
  mindBreaksReminderTime: "18:00",

  // Care View
  careViewEnabled: false,
  careViewProtection: "face_id",
  careViewPin: undefined,
  careViewAutoLock: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      _hasHydrated: false,

      setTextSize: (size) => set({ textSize: size }),

      setColorTheme: (theme) => set({ colorTheme: theme }),

      setAppearanceMode: (mode) => set({ appearanceMode: mode }),

      setCalendarSyncEnabled: (enabled) => set({ calendarSyncEnabled: enabled }),

      setCalendarId: (calendarId) => set({ calendarId }),

      updateSettings: (updates) =>
        set((state) => ({
          ...state,
          ...updates,
        })),

      toggleHomeScreenWidget: (widget) =>
        set((state) => {
          const current = state.homeScreenWidgets;
          if (current.includes(widget)) {
            return { homeScreenWidgets: current.filter((w) => w !== widget) };
          } else {
            return { homeScreenWidgets: [...current, widget] };
          }
        }),

      reorderHomeScreenWidgets: (newOrder) =>
        set({ homeScreenWidgets: newOrder }),

      resetSettings: () =>
        set({
          ...DEFAULT_SETTINGS,
        }),
    }),
    {
      name: "settings-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;

          // Backward compatibility: migrate old "daily-companion" to "steadiday"
          if (state.notificationSource === "daily-companion") {
            state.notificationSource = "steadiday";
          }

          // Ensure safety-session widget is present for existing users
          if (state.homeScreenWidgets && !state.homeScreenWidgets.includes("safety-session")) {
            state.homeScreenWidgets = ["safety-session", ...state.homeScreenWidgets];
          }

          // Ensure daily-check-in widget is present at the top for existing users
          if (state.homeScreenWidgets && !state.homeScreenWidgets.includes("daily-check-in")) {
            state.homeScreenWidgets = ["daily-check-in", ...state.homeScreenWidgets];
          }
        }
      },
    }
  )
);
