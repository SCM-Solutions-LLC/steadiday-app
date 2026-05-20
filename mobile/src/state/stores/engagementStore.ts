import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface EngagementState {
  _hasHydrated: boolean;

  // Counters
  appOpenCount: number;
  medicationsTakenCount: number;
  tasksCompletedCount: number;
  gamesPlayedCount: number;

  // Review tracking
  hasRequestedReview: boolean;
  lastReviewRequestDate: string | null;
  reviewRequestCount: number;
}

interface EngagementActions {
  incrementAppOpen: () => void;
  incrementMedicationsTaken: () => void;
  incrementTasksCompleted: () => void;
  incrementGamesPlayed: () => void;
  markReviewRequested: () => void;
  shouldRequestReview: () => boolean;
  resetAllData: () => void;
}

type EngagementStore = EngagementState & EngagementActions;

export const useEngagementStore = create<EngagementStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      appOpenCount: 0,
      medicationsTakenCount: 0,
      tasksCompletedCount: 0,
      gamesPlayedCount: 0,
      hasRequestedReview: false,
      lastReviewRequestDate: null,
      reviewRequestCount: 0,

      incrementAppOpen: () =>
        set((state) => ({ appOpenCount: state.appOpenCount + 1 })),

      incrementMedicationsTaken: () =>
        set((state) => ({ medicationsTakenCount: state.medicationsTakenCount + 1 })),

      incrementTasksCompleted: () =>
        set((state) => ({ tasksCompletedCount: state.tasksCompletedCount + 1 })),

      incrementGamesPlayed: () =>
        set((state) => ({ gamesPlayedCount: state.gamesPlayedCount + 1 })),

      markReviewRequested: () =>
        set((state) => ({
          hasRequestedReview: true,
          lastReviewRequestDate: new Date().toISOString(),
          reviewRequestCount: state.reviewRequestCount + 1,
        })),

      /**
       * Determine if we should request a review.
       * Rules:
       * - Never ask more than 3 times total (Apple may throttle anyway)
       * - Wait at least 60 days between requests
       * - Only ask after meaningful engagement:
       *   - 3+ medications marked as taken, OR
       *   - 5+ app opens, OR
       *   - 3+ tasks completed, OR
       *   - 3+ games played
       */
      shouldRequestReview: () => {
        const state = get();

        // Max 3 requests ever
        if (state.reviewRequestCount >= 3) return false;

        // Wait at least 60 days between requests
        if (state.lastReviewRequestDate) {
          const lastRequest = new Date(state.lastReviewRequestDate);
          const daysSince = Math.floor(
            (Date.now() - lastRequest.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSince < 60) return false;
        }

        // Check engagement thresholds
        const hasEnoughEngagement =
          state.medicationsTakenCount >= 3 ||
          state.appOpenCount >= 5 ||
          state.tasksCompletedCount >= 3 ||
          state.gamesPlayedCount >= 3;

        return hasEnoughEngagement;
      },

      resetAllData: () =>
        set({
          appOpenCount: 0,
          medicationsTakenCount: 0,
          tasksCompletedCount: 0,
          gamesPlayedCount: 0,
          hasRequestedReview: false,
          lastReviewRequestDate: null,
          reviewRequestCount: 0,
        }),
    }),
    {
      name: "engagement-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        appOpenCount: state.appOpenCount,
        medicationsTakenCount: state.medicationsTakenCount,
        tasksCompletedCount: state.tasksCompletedCount,
        gamesPlayedCount: state.gamesPlayedCount,
        hasRequestedReview: state.hasRequestedReview,
        lastReviewRequestDate: state.lastReviewRequestDate,
        reviewRequestCount: state.reviewRequestCount,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);
