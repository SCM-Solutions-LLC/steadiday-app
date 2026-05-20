import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  startBackgroundWorkout,
  stopBackgroundWorkout,
} from "../../utils/backgroundWorkout";

// ============================================================================
// SAFETY SESSION STORE
// Manages Safety Session state for intentional fall detection activation.
// Starting a session also begins an HKWorkoutSession on iOS 17+ so the app
// stays alive in the background and fall detection keeps running.
// ============================================================================

interface SafetySessionState {
  // Session state
  isSessionActive: boolean;
  sessionStartTime: number | null;
  backgroundWorkoutActive: boolean;

  // Onboarding
  hasSeenOnboarding: boolean;

  // Settings
  sessionReminderEnabled: boolean;

  // Session ended banner (shown after app termination)
  showSessionEndedBanner: boolean;

  // Actions
  startSession: () => void;
  endSession: () => void;
  setOnboardingSeen: () => void;
  setSessionReminderEnabled: (enabled: boolean) => void;
  dismissSessionEndedBanner: () => void;
}

export const useSafetySessionStore = create<SafetySessionState>()(
  persist(
    (set) => ({
      // Defaults
      isSessionActive: false,
      sessionStartTime: null,
      backgroundWorkoutActive: false,
      hasSeenOnboarding: false,
      sessionReminderEnabled: true,
      showSessionEndedBanner: false,

      startSession: () => {
        set({
          isSessionActive: true,
          sessionStartTime: Date.now(),
          showSessionEndedBanner: false,
        });
        startBackgroundWorkout().then((success) => {
          set({ backgroundWorkoutActive: success });
        });
      },

      endSession: () => {
        stopBackgroundWorkout();
        set({
          isSessionActive: false,
          sessionStartTime: null,
          backgroundWorkoutActive: false,
        });
      },

      setOnboardingSeen: () =>
        set({ hasSeenOnboarding: true }),

      setSessionReminderEnabled: (enabled: boolean) =>
        set({ sessionReminderEnabled: enabled }),

      dismissSessionEndedBanner: () =>
        set({ showSessionEndedBanner: false }),
    }),
    {
      name: "safety-session-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
        sessionReminderEnabled: state.sessionReminderEnabled,
        isSessionActive: state.isSessionActive,
        sessionStartTime: state.sessionStartTime,
      }),
    }
  )
);

// After rehydration, check if session was active when app was terminated
const unsub = useSafetySessionStore.persist.onFinishHydration((state) => {
  if (state.isSessionActive) {
    stopBackgroundWorkout();
    useSafetySessionStore.setState({
      isSessionActive: false,
      sessionStartTime: null,
      backgroundWorkoutActive: false,
      showSessionEndedBanner: true,
    });
  }
  unsub();
});
