/**
 * Health Sync Store - Manages per-metric sync state for Apple Health
 *
 * Tracks backfill completion and last sync timestamps for each metric type.
 * Enables 90-day historical backfill on first sync, then incremental updates.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================================================
// TYPES
// ============================================================================

export type HealthMetricType =
  | "steps"
  | "heartRate"
  | "sleep"
  | "exercise"
  | "weight"
  | "bloodPressure";

export interface MetricSyncState {
  /** Whether 90-day backfill has been completed */
  backfillCompleted: boolean;
  /** Timestamp of last successful sync (ISO string) */
  lastSyncAt: string | null;
  /** Anchor for incremental sync (if supported by HealthKit API) */
  anchor?: string | null;
}

interface HealthSyncState {
  /** Hydration flag */
  _hasHydrated: boolean;

  /** Per-metric sync state */
  metricSyncStates: Record<HealthMetricType, MetricSyncState>;

  /** Whether first sync disclosure has been shown */
  firstSyncDisclosureShown: boolean;

  /** Whether user has completed initial Apple Health setup */
  appleHealthSetupComplete: boolean;

  /** Enabled metrics (which ones user wants to sync) */
  enabledMetrics: HealthMetricType[];

  /** Last full sync timestamp */
  lastFullSyncAt: string | null;

  /** Whether a sync is currently in progress */
  isSyncing: boolean;
}

interface HealthSyncActions {
  /** Mark backfill as complete for a metric */
  markBackfillComplete: (metric: HealthMetricType) => void;

  /** Update last sync time for a metric */
  updateLastSyncAt: (metric: HealthMetricType, timestamp: string) => void;

  /** Update anchor for incremental sync */
  updateAnchor: (metric: HealthMetricType, anchor: string | null) => void;

  /** Check if backfill is needed for a metric */
  needsBackfill: (metric: HealthMetricType) => boolean;

  /** Get the last sync timestamp for a metric */
  getLastSyncAt: (metric: HealthMetricType) => string | null;

  /** Mark first sync disclosure as shown */
  markFirstSyncDisclosureShown: () => void;

  /** Check if first sync disclosure should be shown */
  shouldShowFirstSyncDisclosure: () => boolean;

  /** Mark Apple Health setup as complete */
  markAppleHealthSetupComplete: () => void;

  /** Enable/disable a metric for syncing */
  toggleMetric: (metric: HealthMetricType) => void;

  /** Enable all metrics at once */
  enableAllMetrics: () => void;

  /** Check if a metric is enabled */
  isMetricEnabled: (metric: HealthMetricType) => boolean;

  /** Set syncing state */
  setSyncing: (isSyncing: boolean) => void;

  /** Update last full sync timestamp */
  updateLastFullSync: () => void;

  /** Reset all sync state (for debugging/testing) */
  resetSyncState: () => void;
}

type HealthSyncStore = HealthSyncState & HealthSyncActions;

// ============================================================================
// DEFAULT STATE
// ============================================================================

const ALL_METRICS: HealthMetricType[] = [
  "steps",
  "heartRate",
  "sleep",
  "exercise",
  "weight",
  "bloodPressure",
];

const createDefaultMetricState = (): MetricSyncState => ({
  backfillCompleted: false,
  lastSyncAt: null,
  anchor: null,
});

const createDefaultMetricStates = (): Record<HealthMetricType, MetricSyncState> => ({
  steps: createDefaultMetricState(),
  heartRate: createDefaultMetricState(),
  sleep: createDefaultMetricState(),
  exercise: createDefaultMetricState(),
  weight: createDefaultMetricState(),
  bloodPressure: createDefaultMetricState(),
});

// ============================================================================
// STORE
// ============================================================================

export const useHealthSyncStore = create<HealthSyncStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      metricSyncStates: createDefaultMetricStates(),
      firstSyncDisclosureShown: false,
      appleHealthSetupComplete: false,
      enabledMetrics: [], // Start with no metrics enabled
      lastFullSyncAt: null,
      isSyncing: false,

      markBackfillComplete: (metric) => {
        set((state) => ({
          metricSyncStates: {
            ...state.metricSyncStates,
            [metric]: {
              ...state.metricSyncStates[metric],
              backfillCompleted: true,
            },
          },
        }));
      },

      updateLastSyncAt: (metric, timestamp) => {
        set((state) => ({
          metricSyncStates: {
            ...state.metricSyncStates,
            [metric]: {
              ...state.metricSyncStates[metric],
              lastSyncAt: timestamp,
            },
          },
        }));
      },

      updateAnchor: (metric, anchor) => {
        set((state) => ({
          metricSyncStates: {
            ...state.metricSyncStates,
            [metric]: {
              ...state.metricSyncStates[metric],
              anchor,
            },
          },
        }));
      },

      needsBackfill: (metric) => {
        const state = get().metricSyncStates[metric];
        return !state.backfillCompleted;
      },

      getLastSyncAt: (metric) => {
        return get().metricSyncStates[metric].lastSyncAt;
      },

      markFirstSyncDisclosureShown: () => {
        set({ firstSyncDisclosureShown: true });
      },

      shouldShowFirstSyncDisclosure: () => {
        const state = get();
        // Show if: not shown before AND at least one metric needs backfill
        if (state.firstSyncDisclosureShown) return false;

        return ALL_METRICS.some((metric) => !state.metricSyncStates[metric].backfillCompleted);
      },

      markAppleHealthSetupComplete: () => {
        set({ appleHealthSetupComplete: true });
      },

      toggleMetric: (metric) => {
        set((state) => {
          const isEnabled = state.enabledMetrics.includes(metric);
          return {
            enabledMetrics: isEnabled
              ? state.enabledMetrics.filter((m) => m !== metric)
              : [...state.enabledMetrics, metric],
          };
        });
      },

      enableAllMetrics: () => {
        set({ enabledMetrics: [...ALL_METRICS] });
      },

      isMetricEnabled: (metric) => {
        return get().enabledMetrics.includes(metric);
      },

      setSyncing: (isSyncing) => {
        set({ isSyncing });
      },

      updateLastFullSync: () => {
        set({ lastFullSyncAt: new Date().toISOString() });
      },

      resetSyncState: () => {
        set({
          metricSyncStates: createDefaultMetricStates(),
          firstSyncDisclosureShown: false,
          appleHealthSetupComplete: false,
          enabledMetrics: [],
          lastFullSyncAt: null,
          isSyncing: false,
        });
      },
    }),
    {
      name: "health-sync-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
      partialize: (state) => ({
        metricSyncStates: state.metricSyncStates,
        firstSyncDisclosureShown: state.firstSyncDisclosureShown,
        appleHealthSetupComplete: state.appleHealthSetupComplete,
        enabledMetrics: state.enabledMetrics,
        lastFullSyncAt: state.lastFullSyncAt,
      }),
    }
  )
);

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default backfill window in days */
export const BACKFILL_DAYS = 90;

/** Minimum time between automatic syncs (in ms) - 5 minutes */
export const MIN_SYNC_INTERVAL = 5 * 60 * 1000;

// ============================================================================
// SELECTORS
// ============================================================================

export const useHealthSyncHydrated = () => useHealthSyncStore((s) => s._hasHydrated);
export const useEnabledMetrics = () => useHealthSyncStore((s) => s.enabledMetrics);
export const useIsSyncing = () => useHealthSyncStore((s) => s.isSyncing);
export const useLastFullSync = () => useHealthSyncStore((s) => s.lastFullSyncAt);
