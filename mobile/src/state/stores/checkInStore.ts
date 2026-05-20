import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";

// ============================================================================
// CHECK-IN STORE
// Manages daily emotional check-in state with history support
// ============================================================================

export type CheckInValue = "good" | "ok" | "not_great";

// Entry structure for each date
export interface CheckInEntry {
  value: CheckInValue | null; // null means skipped
  skipped: boolean;
  updatedAt: number; // timestamp
  reason?: string; // Optional text explaining why they're feeling this way
}

interface CheckInState {
  // Hydration
  _hasHydrated: boolean;

  // Check-in history by date (YYYY-MM-DD -> entry)
  checkInsByDate: Record<string, CheckInEntry>;

  // Legacy fields (kept for migration, will be deprecated)
  lastCheckInDate: string | null;
  lastCheckInValue: CheckInValue | null;
  lastCheckInAt: number | null;
}

interface CheckInActions {
  // Check if user has completed or skipped check-in today
  hasCompletedCheckInToday: () => boolean;

  // Check if check-in card should be shown (true only if no entry for today)
  canShowCheckInToday: () => boolean;

  // Complete a check-in with a value and optional reason
  completeCheckIn: (value: CheckInValue, reason?: string) => void;

  // Skip today's check-in
  skipCheckInToday: () => void;

  // Get today's check-in value (or null if not checked in or skipped)
  getTodaysCheckIn: () => CheckInValue | null;

  // Get today's check-in reason (if any)
  getTodaysCheckInReason: () => string | undefined;

  // Check if today was skipped
  wasSkippedToday: () => boolean;

  // Edit/update today's check-in value (same day only)
  setCheckInValueForToday: (value: CheckInValue, reason?: string) => void;

  // Clear today's skip to allow adding check-in
  clearSkipForToday: () => void;

  // Get check-in entry for a specific date (for history viewing)
  getCheckInForDate: (dateStr: string) => CheckInEntry | null;

  // Check if a date has a check-in entry
  hasCheckInForDate: (dateStr: string) => boolean;

  // Reset check-in (for testing)
  resetCheckIn: () => void;
}

type CheckInStore = CheckInState & CheckInActions;

const DEFAULT_STATE: Omit<CheckInState, "_hasHydrated"> = {
  checkInsByDate: {},
  // Legacy fields
  lastCheckInDate: null,
  lastCheckInValue: null,
  lastCheckInAt: null,
};

// Helper to get today's date string
const getTodayStr = () => format(new Date(), "yyyy-MM-dd");

export const useCheckInStore = create<CheckInStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      _hasHydrated: false,

      hasCompletedCheckInToday: () => {
        const { checkInsByDate } = get();
        const today = getTodayStr();
        return !!checkInsByDate[today];
      },

      canShowCheckInToday: () => {
        const { checkInsByDate } = get();
        const today = getTodayStr();
        return !checkInsByDate[today];
      },

      completeCheckIn: (value: CheckInValue, reason?: string) => {
        const today = getTodayStr();
        const now = Date.now();

        set((state) => ({
          checkInsByDate: {
            ...state.checkInsByDate,
            [today]: {
              value,
              skipped: false,
              updatedAt: now,
              reason: reason?.trim() || undefined,
            },
          },
          // Also update legacy fields for backward compatibility
          lastCheckInDate: today,
          lastCheckInValue: value,
          lastCheckInAt: now,
        }));
      },

      skipCheckInToday: () => {
        const today = getTodayStr();
        const now = Date.now();

        set((state) => ({
          checkInsByDate: {
            ...state.checkInsByDate,
            [today]: {
              value: null,
              skipped: true,
              updatedAt: now,
            },
          },
          // Also update legacy fields
          lastCheckInDate: today,
          lastCheckInValue: null,
          lastCheckInAt: now,
        }));
      },

      getTodaysCheckIn: () => {
        const { checkInsByDate } = get();
        const today = getTodayStr();
        const entry = checkInsByDate[today];
        return entry?.value ?? null;
      },

      getTodaysCheckInReason: () => {
        const { checkInsByDate } = get();
        const today = getTodayStr();
        const entry = checkInsByDate[today];
        return entry?.reason;
      },

      wasSkippedToday: () => {
        const { checkInsByDate } = get();
        const today = getTodayStr();
        const entry = checkInsByDate[today];
        return entry?.skipped ?? false;
      },

      setCheckInValueForToday: (value: CheckInValue, reason?: string) => {
        const { checkInsByDate } = get();
        const today = getTodayStr();

        // Only allow editing if there's already an entry for today
        if (checkInsByDate[today]) {
          set((state) => ({
            checkInsByDate: {
              ...state.checkInsByDate,
              [today]: {
                value,
                skipped: false,
                updatedAt: Date.now(),
                reason: reason?.trim() || undefined,
              },
            },
            lastCheckInValue: value,
            lastCheckInAt: Date.now(),
          }));
        }
      },

      clearSkipForToday: () => {
        const { checkInsByDate } = get();
        const today = getTodayStr();
        const entry = checkInsByDate[today];

        // Only clear if today was skipped
        if (entry?.skipped) {
          set((state) => {
            const newCheckIns = { ...state.checkInsByDate };
            delete newCheckIns[today];
            return {
              checkInsByDate: newCheckIns,
              lastCheckInDate: null,
              lastCheckInValue: null,
              lastCheckInAt: null,
            };
          });
        }
      },

      getCheckInForDate: (dateStr: string) => {
        const { checkInsByDate } = get();
        return checkInsByDate[dateStr] ?? null;
      },

      hasCheckInForDate: (dateStr: string) => {
        const { checkInsByDate } = get();
        return !!checkInsByDate[dateStr];
      },

      resetCheckIn: () => set(DEFAULT_STATE),
    }),
    {
      name: "check-in-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;

          // Migration: if we have legacy data but no checkInsByDate entry
          if (
            state.lastCheckInDate &&
            !state.checkInsByDate[state.lastCheckInDate]
          ) {
            state.checkInsByDate[state.lastCheckInDate] = {
              value: state.lastCheckInValue,
              skipped: state.lastCheckInValue === null,
              updatedAt: state.lastCheckInAt ?? Date.now(),
            };
          }
        }
      },
    }
  )
);

// Helper to get display text for check-in value (for sharing)
export function getCheckInDisplayText(value: CheckInValue | null): string {
  switch (value) {
    case "good":
      return "Doing well";
    case "ok":
      return "A bit off";
    case "not_great":
      return "Not great";
    default:
      return "Skipped";
  }
}

// Helper to get short label for buttons
export function getCheckInButtonLabel(value: CheckInValue): string {
  switch (value) {
    case "good":
      return "Doing well";
    case "ok":
      return "A bit off";
    case "not_great":
      return "Not great";
  }
}

// Helper to get emoji for check-in value
export function getCheckInEmoji(value: CheckInValue): string {
  switch (value) {
    case "good":
      return "😊";
    case "ok":
      return "😐";
    case "not_great":
      return "😔";
  }
}
