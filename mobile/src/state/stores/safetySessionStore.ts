import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  startBackgroundWorkout,
  stopBackgroundWorkout,
  configureNativeEscalation,
} from "../../utils/backgroundWorkout";
import { config } from "../../config/env";
import { APP_CLIENT_KEY } from "../../api/constants";
import { toE164PhoneNumber } from "../../utils/phoneFormatter";
import { logger } from "../../utils/logger";

interface SafetySessionState {
  isSessionActive: boolean;
  sessionStartTime: number | null;
  backgroundWorkoutActive: boolean;
  hasSeenOnboarding: boolean;
  sessionReminderEnabled: boolean;
  showSessionEndedBanner: boolean;

  // Server-backed escalation
  escalationSessionId: string | null;

  // Actions
  startSession: (userName: string, emergencyContacts: { name: string; phoneNumber: string; isEmergencyContact: boolean }[]) => void;
  endSession: () => void;
  setOnboardingSeen: () => void;
  setSessionReminderEnabled: (enabled: boolean) => void;
  dismissSessionEndedBanner: () => void;
  cancelFallEscalation: () => Promise<void>;
}

function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function registerSessionWithBackend(
  sessionId: string,
  userName: string,
  contacts: { name: string; phone: string }[]
): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/emergency/register-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Key": APP_CLIENT_KEY,
      },
      body: JSON.stringify({ sessionId, userName, contacts }),
    });
    return response.ok;
  } catch (e) {
    logger.warn("[SafetySession] Failed to register session with backend:", e);
    return false;
  }
}

async function endSessionOnBackend(sessionId: string): Promise<void> {
  try {
    await fetch(`${config.apiBaseUrl}/api/emergency/end-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Key": APP_CLIENT_KEY,
      },
      body: JSON.stringify({ sessionId }),
    });
  } catch {
    // Fire-and-forget
  }
}

export const useSafetySessionStore = create<SafetySessionState>()(
  persist(
    (set, get) => ({
      isSessionActive: false,
      sessionStartTime: null,
      backgroundWorkoutActive: false,
      hasSeenOnboarding: false,
      sessionReminderEnabled: true,
      showSessionEndedBanner: false,
      escalationSessionId: null,

      startSession: (userName, emergencyContacts) => {
        const sessionId = generateSessionId();
        const emergencyMarked = emergencyContacts.filter((c) => c.isEmergencyContact);
        const contacts = emergencyMarked
          .map((c) => ({ name: c.name, phone: toE164PhoneNumber(c.phoneNumber) }))
          .filter((c): c is { name: string; phone: string } => c.phone !== null);

        set({
          isSessionActive: true,
          sessionStartTime: Date.now(),
          showSessionEndedBanner: false,
          escalationSessionId: sessionId,
        });

        if (contacts.length === 0) {
          logger.warn("[SafetySession] No valid E.164 phone numbers, skipping backend registration");
          return;
        }

        // Register with backend then configure native escalation
        registerSessionWithBackend(sessionId, userName || "A SteadiDay user", contacts).then((registered) => {
          if (registered) {
            configureNativeEscalation(config.apiBaseUrl, APP_CLIENT_KEY, sessionId);
          }
        });

        startBackgroundWorkout().then((success) => {
          set({ backgroundWorkoutActive: success });
        });
      },

      endSession: () => {
        const { escalationSessionId } = get();
        if (escalationSessionId) {
          endSessionOnBackend(escalationSessionId);
        }

        stopBackgroundWorkout();
        set({
          isSessionActive: false,
          sessionStartTime: null,
          backgroundWorkoutActive: false,
          escalationSessionId: null,
        });
      },

      setOnboardingSeen: () =>
        set({ hasSeenOnboarding: true }),

      setSessionReminderEnabled: (enabled: boolean) =>
        set({ sessionReminderEnabled: enabled }),

      dismissSessionEndedBanner: () =>
        set({ showSessionEndedBanner: false }),

      cancelFallEscalation: async () => {
        const { escalationSessionId } = get();
        if (!escalationSessionId) return;

        try {
          await fetch(`${config.apiBaseUrl}/api/emergency/fall-cancel`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-App-Key": APP_CLIENT_KEY,
            },
            body: JSON.stringify({ sessionId: escalationSessionId }),
          });
        } catch {
          // Best-effort — native code also sends cancel
        }
      },
    }),
    {
      name: "safety-session-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
        sessionReminderEnabled: state.sessionReminderEnabled,
        isSessionActive: state.isSessionActive,
        sessionStartTime: state.sessionStartTime,
        escalationSessionId: state.escalationSessionId,
      }),
    }
  )
);

// After rehydration, check if session was active when app was terminated
const unsub = useSafetySessionStore.persist.onFinishHydration((state) => {
  if (state.isSessionActive) {
    // End session on backend if we have a session ID
    if (state.escalationSessionId) {
      endSessionOnBackend(state.escalationSessionId);
    }
    stopBackgroundWorkout();
    useSafetySessionStore.setState({
      isSessionActive: false,
      sessionStartTime: null,
      backgroundWorkoutActive: false,
      showSessionEndedBanner: true,
      escalationSessionId: null,
    });
  }
  unsub();
});
