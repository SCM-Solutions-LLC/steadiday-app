import { useMemo, useCallback, useState } from "react";
import { startOfDay, addDays, format, parseISO } from "date-fns";
import { useTaskInstanceStore } from "../../../state/stores/taskInstanceStore";
import {
  buildTaskInstances,
} from "../../../utils/taskInstances";
import type { TaskInstance, TaskSeries } from "../../../types/app";

// ============================================================================
// TASK INSTANCES HOOK
// Generates task instances from series for display in UI
// ============================================================================

interface UseTaskInstancesOptions {
  /** Date range start (default: today) */
  rangeStart?: Date;
  /** Date range end (default: today) */
  rangeEnd?: Date;
  /** Filter to show only active (uncompleted) instances */
  showActiveOnly?: boolean;
  /** Search query to filter by title/notes */
  searchQuery?: string;
}

interface UseTaskInstancesReturn {
  /** All instances in the date range */
  instances: TaskInstance[];
  /** Active (uncompleted) instances only */
  activeInstances: TaskInstance[];
  /** Completed instances only */
  completedInstances: TaskInstance[];
  /** Complete an instance */
  completeInstance: (instance: TaskInstance) => void;
  /** Uncomplete an instance */
  uncompleteInstance: (instance: TaskInstance) => void;
  /** Check if an instance is completed */
  isCompleted: (instanceId: string) => boolean;
  /** Get series by ID */
  getSeriesById: (id: string) => TaskSeries | undefined;
}

/**
 * Hook to get task instances for a date range
 * Handles instance generation, completion state, and filtering
 */
export function useTaskInstances(options: UseTaskInstancesOptions = {}): UseTaskInstancesReturn {
  const {
    rangeStart = new Date(),
    rangeEnd = new Date(),
    showActiveOnly = false,
    searchQuery = "",
  } = options;

  // Get data from store
  const taskSeries = useTaskInstanceStore((s) => s.taskSeries);
  const completions = useTaskInstanceStore((s) => s.completions);
  const exceptions = useTaskInstanceStore((s) => s.exceptions);
  const completeInstanceAction = useTaskInstanceStore((s) => s.completeInstance);
  const uncompleteInstanceAction = useTaskInstanceStore((s) => s.uncompleteInstance);
  const isInstanceCompleted = useTaskInstanceStore((s) => s.isInstanceCompleted);
  const getSeriesById = useTaskInstanceStore((s) => s.getSeriesById);

  // Convert completions object to Map for buildTaskInstances
  const completionsMap = useMemo(() => {
    return new Map(Object.entries(completions));
  }, [completions]);

  // Get active series only
  const activeSeries = useMemo(() => {
    return taskSeries.filter((s) => s.isActive);
  }, [taskSeries]);

  // Generate instances for the date range
  const allInstances = useMemo(() => {
    return buildTaskInstances(
      activeSeries,
      startOfDay(rangeStart),
      startOfDay(rangeEnd),
      completionsMap,
      exceptions
    );
  }, [activeSeries, rangeStart, rangeEnd, completionsMap, exceptions]);

  // Apply search filter
  const filteredInstances = useMemo(() => {
    if (!searchQuery.trim()) return allInstances;

    const query = searchQuery.toLowerCase();
    return allInstances.filter(
      (instance) =>
        instance.title.toLowerCase().includes(query) ||
        instance.notes?.toLowerCase().includes(query)
    );
  }, [allInstances, searchQuery]);

  // Split into active and completed
  const activeInstances = useMemo(() => {
    return filteredInstances.filter((i) => !i.isCompleted);
  }, [filteredInstances]);

  const completedInstances = useMemo(() => {
    return filteredInstances.filter((i) => i.isCompleted);
  }, [filteredInstances]);

  // Final instances based on filter option
  const instances = showActiveOnly ? activeInstances : filteredInstances;

  // Action handlers
  const completeInstance = useCallback(
    (instance: TaskInstance) => {
      const occurrenceDate = instance.occurrenceStart.includes("T")
        ? format(parseISO(instance.occurrenceStart), "yyyy-MM-dd")
        : instance.occurrenceStart;

      completeInstanceAction(instance.instanceId, instance.seriesId, occurrenceDate);
    },
    [completeInstanceAction]
  );

  const uncompleteInstance = useCallback(
    (instance: TaskInstance) => {
      uncompleteInstanceAction(instance.instanceId);
    },
    [uncompleteInstanceAction]
  );

  return {
    instances,
    activeInstances,
    completedInstances,
    completeInstance,
    uncompleteInstance,
    isCompleted: isInstanceCompleted,
    getSeriesById,
  };
}

/**
 * Hook to get today's task instances
 */
export function useTodayInstances(searchQuery: string = "") {
  const today = new Date();
  return useTaskInstances({
    rangeStart: today,
    rangeEnd: today,
    searchQuery,
  });
}

/**
 * Hook to get this week's task instances
 */
export function useWeekInstances(startDate: Date = new Date(), searchQuery: string = "") {
  const weekEnd = addDays(startDate, 6);
  return useTaskInstances({
    rangeStart: startDate,
    rangeEnd: weekEnd,
    searchQuery,
  });
}

/**
 * Hook for managing task instances with search and view mode
 */
export function useTaskInstanceFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"today" | "week">("today");

  const today = useTodayInstances(searchQuery);
  const week = useWeekInstances(new Date(), searchQuery);

  const currentView = viewMode === "today" ? today : week;

  return {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    ...currentView,
    todaysInstances: today.instances,
    weekInstances: week.instances,
  };
}
