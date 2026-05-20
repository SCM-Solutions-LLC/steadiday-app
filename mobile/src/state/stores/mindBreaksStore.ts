import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseISO, differenceInCalendarDays, startOfDay } from "date-fns";

interface MindBreaksState {
  _hasHydrated: boolean;
  // Total days with activity (no pressure, just counting)
  daysActive: number;
  lastPlayDate: string | null;
  // Consecutive day streak
  currentStreak: number;
  bestStreak: number;
  // Best scores
  bestReactionTime: number | null;
  // Game history
  gamesPlayedToday: number;
  // Legacy: Keep for migration
  streak?: number;
}

interface MindBreaksActions {
  recordGamePlayed: () => void;
  updateBestReactionTime: (time: number) => void;
  getCurrentStreak: () => number;
  resetAllData: () => void;
}

type MindBreaksStore = MindBreaksState & MindBreaksActions;

export const useMindBreaksStore = create<MindBreaksStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      daysActive: 0,
      lastPlayDate: null,
      currentStreak: 0,
      bestStreak: 0,
      bestReactionTime: null,
      gamesPlayedToday: 0,

      recordGamePlayed: () => {
        const state = get();
        const today = new Date().toISOString();
        const todayStart = startOfDay(new Date());

        let newDaysActive = state.daysActive;
        let newStreak = state.currentStreak;
        let newBestStreak = state.bestStreak;
        let gamesPlayedToday = state.gamesPlayedToday;

        if (state.lastPlayDate) {
          const lastPlay = parseISO(state.lastPlayDate);
          const lastPlayStart = startOfDay(lastPlay);
          const daysDiff = differenceInCalendarDays(todayStart, lastPlayStart);

          if (daysDiff === 0) {
            // Same day - just increment games played today
            gamesPlayedToday += 1;
          } else if (daysDiff === 1) {
            // Consecutive day - extend streak
            newDaysActive += 1;
            newStreak += 1;
            gamesPlayedToday = 1;
          } else {
            // Streak broken (missed 1+ days) - reset streak
            newDaysActive += 1;
            newStreak = 1;
            gamesPlayedToday = 1;
          }
        } else {
          // First time playing ever
          newDaysActive = 1;
          newStreak = 1;
          gamesPlayedToday = 1;
        }

        // Update best streak
        if (newStreak > newBestStreak) {
          newBestStreak = newStreak;
        }

        // Track engagement for review prompts
        try {
          const { useEngagementStore } = require("./engagementStore");
          useEngagementStore.getState().incrementGamesPlayed();
        } catch {
          // Ignore if engagement store not ready
        }

        set({
          daysActive: newDaysActive,
          currentStreak: newStreak,
          bestStreak: newBestStreak,
          lastPlayDate: today,
          gamesPlayedToday,
        });
      },

      updateBestReactionTime: (time: number) => {
        const state = get();
        if (!state.bestReactionTime || time < state.bestReactionTime) {
          set({ bestReactionTime: time });
        }
      },

      /**
       * Calculate current streak on demand.
       * If user hasn't played today but played yesterday, streak is still alive.
       * If user missed yesterday, streak resets to 0.
       */
      getCurrentStreak: () => {
        const state = get();
        if (!state.lastPlayDate) return 0;

        const lastPlay = parseISO(state.lastPlayDate);
        const daysSinceLastPlay = differenceInCalendarDays(new Date(), startOfDay(lastPlay));

        if (daysSinceLastPlay === 0) {
          // Played today - streak is current
          return state.currentStreak;
        } else if (daysSinceLastPlay === 1) {
          // Played yesterday - streak is alive but not extended yet
          return state.currentStreak;
        } else {
          // Missed more than 1 day - streak is broken
          return 0;
        }
      },

      resetAllData: () =>
        set({
          daysActive: 0,
          lastPlayDate: null,
          currentStreak: 0,
          bestStreak: 0,
          bestReactionTime: null,
          gamesPlayedToday: 0,
        }),
    }),
    {
      name: "mind-breaks-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        daysActive: state.daysActive,
        lastPlayDate: state.lastPlayDate,
        currentStreak: state.currentStreak,
        bestStreak: state.bestStreak,
        bestReactionTime: state.bestReactionTime,
        gamesPlayedToday: state.gamesPlayedToday,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;

          // Migrate from old "streak" field if present
          if (state.streak !== undefined && state.daysActive === 0) {
            state.daysActive = state.streak;
            state.currentStreak = state.streak;
            state.bestStreak = state.streak;
            delete state.streak;
          }

          // Initialize currentStreak and bestStreak if they don't exist (migration)
          if (state.currentStreak === undefined) {
            state.currentStreak = 0;
          }
          if (state.bestStreak === undefined) {
            state.bestStreak = 0;
          }

          // Reset games played today if it's a new day
          if (state.lastPlayDate) {
            const lastPlay = parseISO(state.lastPlayDate);
            const daysDiff = differenceInCalendarDays(new Date(), lastPlay);
            if (daysDiff >= 1) {
              state.gamesPlayedToday = 0;
            }
          }
        }
      },
    }
  )
);
