import { useState, useMemo } from "react";
import { isSameDay, format } from "date-fns";
import type { Task } from "../../../types/app";
import type { UseTaskFiltersReturn } from "../types";
import { formatDateKey, getTaskDateKey } from "../../../utils/time";

interface UseTaskFiltersOptions {
  tasks: Task[];
}

/**
 * Get the effective date for a task for date comparison
 * Uses the centralized getTaskDateKey helper which:
 * - Uses dueDateLocal for all-day events (prevents timezone shifting)
 * - Uses formatDateKey for timed events (timezone-aware)
 *
 * PART 4: Uses the centralized formatDateKey helper
 */
function getTaskDateForComparison(task: Task): Date {
  // Get the date key using the centralized helper
  const dateKey = getTaskDateKey(task);

  // Parse the YYYY-MM-DD string as local date
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Check if a task should appear on a given date
 * Handles both one-time and recurring tasks
 * Uses timezone-aware date comparison via formatDateKey
 *
 * PART 4: No more toISOString().slice(0,10) or UTC-based slicing
 */
function isTaskForDate(task: Task, date: Date): boolean {
  // Get the task's date key using the centralized helper
  const taskDateKey = getTaskDateKey(task);

  // Get the comparison date's key in device timezone (no UTC conversion)
  const checkDateKey = formatDateKey(date);

  // Simple string comparison for exact date match
  if (taskDateKey === checkDateKey) {
    return true;
  }

  // For recurring tasks, we need Date objects for day-of-week and other comparisons
  const taskDate = getTaskDateForComparison(task);
  const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
  const checkDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Check if task date matches exactly
  if (isSameDay(taskDate, date)) {
    return true;
  }

  // Only check recurring tasks that started on or before this date
  if (taskDateOnly > checkDateOnly) {
    return false;
  }

  // Check if task has ended (for repeatEnding)
  if (task.repeatEnding === "on-date" && task.repeatEndDate) {
    const endDate = new Date(task.repeatEndDate);
    if (checkDateOnly > endDate) {
      return false;
    }
  }

  // Check recurring patterns
  const frequency = task.frequency || "once";

  switch (frequency) {
    case "daily":
    case "twice-daily":
    case "three-times-daily":
      // Daily tasks show every day after start date
      return true;

    case "every-other-day": {
      // Calculate days since task start
      const daysDiff = Math.floor(
        (checkDateOnly.getTime() - taskDateOnly.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff % 2 === 0;
    }

    case "weekly": {
      // Show on same day of week
      return taskDate.getDay() === date.getDay();
    }

    case "monthly": {
      // Show on same day of month
      return taskDate.getDate() === date.getDate();
    }

    case "yearly": {
      // Show on same month and day
      return taskDate.getMonth() === date.getMonth() &&
              taskDate.getDate() === date.getDate();
    }

    case "once":
    default:
      // One-time tasks only on exact date
      return false;
  }
}

export function useTaskFilters({ tasks }: UseTaskFiltersOptions): UseTaskFiltersReturn {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter tasks for today (including recurring tasks)
  const todaysTasks = useMemo(() => {
    const today = new Date();
    return tasks.filter((task) => isTaskForDate(task, today));
  }, [tasks]);

  // Apply search filter
  const filteredTodaysTasks = useMemo(() => {
    if (!searchQuery.trim()) return todaysTasks;
    const query = searchQuery.toLowerCase();
    return todaysTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.notes?.toLowerCase().includes(query)
    );
  }, [todaysTasks, searchQuery]);

  // Active (incomplete) tasks sorted by time
  // Sort: Past due first (earliest time), then upcoming (earliest time first), then no time
  const activeTasks = useMemo(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    return filteredTodaysTasks
      .filter((t) => !t.completed)
      .sort((a, b) => {
        // Tasks without time go last
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;

        // Check if tasks are past due (time < current time)
        const aIsPastDue = a.time < currentTime;
        const bIsPastDue = b.time < currentTime;

        // Past due tasks come first
        if (aIsPastDue && !bIsPastDue) return -1;
        if (!aIsPastDue && bIsPastDue) return 1;

        // Within same group (both past due or both upcoming), sort by time
        return a.time.localeCompare(b.time);
      });
  }, [filteredTodaysTasks]);

  // Completed tasks
  const completedTasks = useMemo(() => {
    return filteredTodaysTasks.filter((t) => t.completed);
  }, [filteredTodaysTasks]);

  return {
    searchQuery,
    setSearchQuery,
    todaysTasks,
    filteredTodaysTasks,
    activeTasks,
    completedTasks,
  };
}
