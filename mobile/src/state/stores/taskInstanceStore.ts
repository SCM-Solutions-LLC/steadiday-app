import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TaskInstanceCompletion, CalendarException, TaskSeries } from "../../types/app";
import { parseInstanceId } from "../../utils/taskInstances";
import { format, parseISO, startOfDay, subDays } from "date-fns";
import { secureWarn } from "../../utils/secureLogger";

// ============================================================================
// TASK INSTANCE COMPLETION STORE
// Manages per-instance completion state and calendar exceptions
// ============================================================================

interface TaskInstanceState {
  // Hydration flag
  _hasHydrated: boolean;

  // Task series definitions (source of truth for task definitions)
  taskSeries: TaskSeries[];

  // Instance completions - keyed by instanceId for fast lookup
  completions: Record<string, TaskInstanceCompletion>;

  // Calendar exceptions (deleted/modified occurrences from Apple)
  exceptions: CalendarException[];
}

interface TaskInstanceActions {
  // Series management
  addSeries: (series: TaskSeries) => void;
  addSeriesBatch: (seriesList: TaskSeries[]) => void;
  updateSeries: (id: string, updates: Partial<TaskSeries>) => void;
  removeSeries: (id: string) => void;
  getSeriesById: (id: string) => TaskSeries | undefined;
  getActiveSeries: () => TaskSeries[];

  // Completion management
  completeInstance: (instanceId: string, seriesId: string, occurrenceDate: string) => void;
  uncompleteInstance: (instanceId: string) => void;
  isInstanceCompleted: (instanceId: string) => boolean;
  getCompletionForInstance: (instanceId: string) => TaskInstanceCompletion | undefined;
  getCompletionsMap: () => Map<string, TaskInstanceCompletion>;

  // Exception management (for Apple Calendar sync)
  addException: (exception: CalendarException) => void;
  removeException: (seriesId: string, exceptionDate: string) => void;
  getExceptionsForSeries: (seriesId: string) => CalendarException[];

  // Cleanup
  cleanupOldCompletions: (daysToKeep: number) => void;
}

type TaskInstanceStore = TaskInstanceState & TaskInstanceActions;

export const useTaskInstanceStore = create<TaskInstanceStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      taskSeries: [],
      completions: {},
      exceptions: [],

      // ============================================================================
      // SERIES MANAGEMENT
      // ============================================================================

      addSeries: (series) => {
        const existing = get().taskSeries.find((s) => s.id === series.id);
        if (existing) {
          secureWarn(`Series with ID ${series.id} already exists, skipping.`);
          return;
        }

        set((state) => ({
          taskSeries: [...state.taskSeries, series],
        }));
      },

      addSeriesBatch: (seriesList) => {
        if (!seriesList.length) return;

        const existingIds = new Set(get().taskSeries.map((s) => s.id));
        const newSeries = seriesList.filter((s) => !existingIds.has(s.id));

        if (newSeries.length > 0) {
          set((state) => ({
            taskSeries: [...state.taskSeries, ...newSeries],
          }));
        }
      },

      updateSeries: (id, updates) => {
        set((state) => ({
          taskSeries: state.taskSeries.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
        }));
      },

      removeSeries: (id) => {
        set((state) => ({
          taskSeries: state.taskSeries.filter((s) => s.id !== id),
          // Also remove completions for this series
          completions: Object.fromEntries(
            Object.entries(state.completions).filter(
              ([_, completion]) => completion.seriesId !== id
            )
          ),
          // Remove exceptions for this series
          exceptions: state.exceptions.filter((e) => e.seriesId !== id),
        }));
      },

      getSeriesById: (id) => get().taskSeries.find((s) => s.id === id),

      getActiveSeries: () => get().taskSeries.filter((s) => s.isActive),

      // ============================================================================
      // COMPLETION MANAGEMENT
      // ============================================================================

      completeInstance: (instanceId, seriesId, occurrenceDate) => {
        const completion: TaskInstanceCompletion = {
          instanceId,
          seriesId,
          completedAt: new Date().toISOString(),
          occurrenceDate,
        };

        set((state) => ({
          completions: {
            ...state.completions,
            [instanceId]: completion,
          },
        }));
      },

      uncompleteInstance: (instanceId) => {
        set((state) => {
          const { [instanceId]: removed, ...rest } = state.completions;
          return { completions: rest };
        });
      },

      isInstanceCompleted: (instanceId) => {
        return !!get().completions[instanceId];
      },

      getCompletionForInstance: (instanceId) => {
        return get().completions[instanceId];
      },

      getCompletionsMap: () => {
        return new Map(Object.entries(get().completions));
      },

      // ============================================================================
      // EXCEPTION MANAGEMENT
      // ============================================================================

      addException: (exception) => {
        // Check for duplicate
        const existing = get().exceptions.find(
          (e) =>
            e.seriesId === exception.seriesId &&
            e.exceptionDate === exception.exceptionDate
        );

        if (existing) {
          // Update existing exception
          set((state) => ({
            exceptions: state.exceptions.map((e) =>
              e.seriesId === exception.seriesId &&
              e.exceptionDate === exception.exceptionDate
                ? exception
                : e
            ),
          }));
        } else {
          set((state) => ({
            exceptions: [...state.exceptions, exception],
          }));
        }
      },

      removeException: (seriesId, exceptionDate) => {
        set((state) => ({
          exceptions: state.exceptions.filter(
            (e) => !(e.seriesId === seriesId && e.exceptionDate === exceptionDate)
          ),
        }));
      },

      getExceptionsForSeries: (seriesId) => {
        return get().exceptions.filter((e) => e.seriesId === seriesId);
      },

      // ============================================================================
      // CLEANUP
      // ============================================================================

      cleanupOldCompletions: (daysToKeep) => {
        const cutoffDate = subDays(new Date(), daysToKeep);
        const cutoffStr = format(cutoffDate, "yyyy-MM-dd");

        set((state) => ({
          completions: Object.fromEntries(
            Object.entries(state.completions).filter(
              ([_, completion]) => completion.occurrenceDate >= cutoffStr
            )
          ),
        }));
      },
    }),
    {
      name: "task-instance-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
      // Only persist essential data
      partialize: (state) => ({
        taskSeries: state.taskSeries,
        completions: state.completions,
        exceptions: state.exceptions,
      }),
    }
  )
);

// ============================================================================
// SELECTOR HOOKS
// Use these for optimized re-renders
// ============================================================================

/**
 * Select task series list
 */
export const useTaskSeries = () => useTaskInstanceStore((s) => s.taskSeries);

/**
 * Select active series only
 */
export const useActiveTaskSeries = () => useTaskInstanceStore((s) => s.taskSeries.filter((t) => t.isActive));

/**
 * Select completions map for instance generation
 */
export const useCompletionsMap = () => useTaskInstanceStore((s) => s.getCompletionsMap());

/**
 * Select exceptions list
 */
export const useTaskExceptions = () => useTaskInstanceStore((s) => s.exceptions);
