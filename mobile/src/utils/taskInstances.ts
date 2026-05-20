import { addDays, addWeeks, addMonths, addYears, format, isBefore, isAfter, isSameDay, startOfDay, parseISO } from "date-fns";
import type {
  TaskSeries,
  TaskInstance,
  TaskInstanceCompletion,
  CalendarException,
  TaskFrequency,
} from "../types/app";

// ============================================================================
// TASK INSTANCE GENERATION
// Expands TaskSeries definitions into TaskInstance records for display
// ============================================================================

/**
 * Generate a unique instance ID for a task occurrence
 * Format: "{seriesId}:{YYYY-MM-DD}"
 */
export function generateInstanceId(seriesId: string, occurrenceDate: Date): string {
  const dateKey = format(occurrenceDate, "yyyy-MM-dd");
  return `${seriesId}:${dateKey}`;
}

/**
 * Parse an instance ID to extract seriesId and occurrence date
 */
export function parseInstanceId(instanceId: string): { seriesId: string; dateKey: string } | null {
  const parts = instanceId.split(":");
  if (parts.length < 2) return null;

  // Handle series IDs that might contain colons
  const dateKey = parts[parts.length - 1];
  const seriesId = parts.slice(0, -1).join(":");

  return { seriesId, dateKey };
}

/**
 * Get the next occurrence date based on frequency
 */
function getNextOccurrence(currentDate: Date, frequency: TaskFrequency, count: number = 1): Date {
  switch (frequency) {
    case "daily":
    case "twice-daily":
    case "three-times-daily":
      return addDays(currentDate, count);
    case "every-other-day":
      return addDays(currentDate, 2 * count);
    case "weekly":
      return addWeeks(currentDate, count);
    case "monthly":
      return addMonths(currentDate, count);
    case "yearly":
      return addYears(currentDate, count);
    case "once":
    default:
      return currentDate;
  }
}

/**
 * Check if a date is an exception (deleted or modified occurrence)
 */
function isException(
  seriesId: string,
  date: Date,
  exceptions: CalendarException[]
): CalendarException | null {
  const dateKey = format(date, "yyyy-MM-dd");
  return exceptions.find(
    (exc) => exc.seriesId === seriesId && exc.exceptionDate === dateKey
  ) || null;
}

/**
 * Build task instances from a list of task series for a given date range
 *
 * @param seriesList - List of TaskSeries to expand
 * @param rangeStart - Start of date range (inclusive)
 * @param rangeEnd - End of date range (inclusive)
 * @param completions - Map of instanceId to completion record
 * @param exceptions - Calendar exceptions (deleted/modified occurrences)
 * @returns Array of TaskInstance records for the date range
 */
export function buildTaskInstances(
  seriesList: TaskSeries[],
  rangeStart: Date,
  rangeEnd: Date,
  completions: Map<string, TaskInstanceCompletion>,
  exceptions: CalendarException[] = []
): TaskInstance[] {
  const instances: TaskInstance[] = [];

  // Normalize range to start of day for comparison
  const rangeStartDay = startOfDay(rangeStart);
  const rangeEndDay = startOfDay(rangeEnd);

  for (const series of seriesList) {
    // Skip inactive series
    if (!series.isActive) continue;

    // Parse series start date
    const seriesStart = parseISO(series.startDate);
    const seriesStartDay = startOfDay(seriesStart);

    // Skip if series starts after range end
    if (isAfter(seriesStartDay, rangeEndDay)) continue;

    // Determine the effective end date for this series
    let seriesEnd: Date | null = null;
    if (series.repeatEndDate) {
      seriesEnd = parseISO(series.repeatEndDate);
    }

    // Handle one-time (non-recurring) tasks
    if (series.frequency === "once") {
      // Check if the single occurrence falls within range
      if (
        !isBefore(seriesStartDay, rangeStartDay) &&
        !isAfter(seriesStartDay, rangeEndDay)
      ) {
        const instanceId = generateInstanceId(series.id, seriesStartDay);
        const completion = completions.get(instanceId);

        instances.push(createInstance(series, seriesStart, instanceId, completion));
      }
      continue;
    }

    // Generate recurring instances
    let currentDate = seriesStartDay;
    let occurrenceCount = 0;
    const maxOccurrences = series.repeatCount || 1000; // Safety limit

    while (occurrenceCount < maxOccurrences) {
      // Stop if we've passed the range end
      if (isAfter(currentDate, rangeEndDay)) break;

      // Stop if we've passed the series end date
      if (seriesEnd && isAfter(currentDate, seriesEnd)) break;

      // Only include if within range
      if (!isBefore(currentDate, rangeStartDay)) {
        // Check for exceptions (deleted occurrences from Apple Calendar)
        const exception = isException(series.id, currentDate, exceptions);

        if (!exception || exception.type !== "deleted") {
          const instanceId = generateInstanceId(series.id, currentDate);
          const completion = completions.get(instanceId);

          // If modified exception, merge the modified data
          const effectiveSeries = exception?.type === "modified" && exception.modifiedData
            ? { ...series, ...exception.modifiedData }
            : series;

          instances.push(createInstance(effectiveSeries, currentDate, instanceId, completion));
        }
      }

      // Move to next occurrence
      currentDate = getNextOccurrence(currentDate, series.frequency);
      occurrenceCount++;
    }
  }

  // Sort by occurrence time
  return instances.sort((a, b) => {
    const dateA = parseISO(a.occurrenceStart);
    const dateB = parseISO(b.occurrenceStart);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Create a TaskInstance from a TaskSeries for a specific date
 */
function createInstance(
  series: TaskSeries,
  occurrenceDate: Date,
  instanceId: string,
  completion?: TaskInstanceCompletion
): TaskInstance {
  // Build the occurrence datetime
  let occurrenceStart: string;
  let occurrenceEnd: string | undefined;

  if (series.time) {
    const [hours, minutes] = series.time.split(":").map(Number);
    const startDateTime = new Date(occurrenceDate);
    startDateTime.setHours(hours, minutes, 0, 0);
    occurrenceStart = startDateTime.toISOString();

    if (series.endTime) {
      const [endHours, endMinutes] = series.endTime.split(":").map(Number);
      const endDateTime = new Date(occurrenceDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      occurrenceEnd = endDateTime.toISOString();
    }
  } else {
    // All-day or no specific time
    occurrenceStart = format(occurrenceDate, "yyyy-MM-dd");
  }

  return {
    instanceId,
    seriesId: series.id,
    title: series.title,
    notes: series.notes,
    category: series.category,
    occurrenceStart,
    occurrenceEnd,
    time: series.time,
    endTime: series.endTime,
    isAllDay: series.isAllDay,
    location: series.location,
    sourceType: series.sourceType,
    isCompleted: !!completion,
    completedAt: completion?.completedAt,
  };
}

/**
 * Build instances for a single day
 * Convenience wrapper for buildTaskInstances
 */
export function buildTaskInstancesForDay(
  seriesList: TaskSeries[],
  date: Date,
  completions: Map<string, TaskInstanceCompletion>,
  exceptions: CalendarException[] = []
): TaskInstance[] {
  const dayStart = startOfDay(date);
  return buildTaskInstances(seriesList, dayStart, dayStart, completions, exceptions);
}

/**
 * Build instances for a week (7 days starting from date)
 */
export function buildTaskInstancesForWeek(
  seriesList: TaskSeries[],
  startDate: Date,
  completions: Map<string, TaskInstanceCompletion>,
  exceptions: CalendarException[] = []
): TaskInstance[] {
  const weekStart = startOfDay(startDate);
  const weekEnd = addDays(weekStart, 6);
  return buildTaskInstances(seriesList, weekStart, weekEnd, completions, exceptions);
}

/**
 * Convert legacy Task objects to TaskSeries format
 * Used for migration from old data model
 */
export function taskToSeries(task: {
  id: string;
  title: string;
  notes?: string;
  date: string;
  time?: string;
  endTime?: string;
  isAllDay?: boolean;
  category?: string;
  frequency?: TaskFrequency;
  repeatEndDate?: string;
  repeatCount?: number;
  sourceSystem?: string;
  sourceItemId?: string;
  sourceContainerId?: string;
  reminderEnabled?: boolean;
  reminderMinutes?: number;
  completed?: boolean;
  completedAt?: string;
  location?: string;
}): { series: TaskSeries; completion?: TaskInstanceCompletion } {
  // Map sourceSystem to sourceType
  let sourceType: TaskSeries["sourceType"] = "manual";
  if (task.sourceSystem === "apple_calendar") {
    sourceType = "apple_calendar";
  } else if (task.sourceSystem === "apple_reminders") {
    sourceType = "apple_reminders";
  }

  const now = new Date().toISOString();

  const series: TaskSeries = {
    id: task.id,
    title: task.title,
    notes: task.notes,
    sourceType,
    sourceId: task.sourceItemId,
    sourceContainerId: task.sourceContainerId,
    isActive: true,
    startDate: task.date,
    time: task.time,
    endTime: task.endTime,
    isAllDay: task.isAllDay,
    frequency: task.frequency || "once",
    repeatEndDate: task.repeatEndDate,
    repeatCount: task.repeatCount,
    category: task.category as TaskSeries["category"],
    location: task.location,
    reminderEnabled: task.reminderEnabled ?? false,
    reminderMinutes: task.reminderMinutes,
    createdAt: now,
    updatedAt: now,
  };

  // If task was completed, create a completion record
  let completion: TaskInstanceCompletion | undefined;
  if (task.completed && task.completedAt) {
    const occurrenceDate = startOfDay(parseISO(task.date));
    const instanceId = generateInstanceId(task.id, occurrenceDate);
    completion = {
      instanceId,
      seriesId: task.id,
      completedAt: task.completedAt,
      occurrenceDate: format(occurrenceDate, "yyyy-MM-dd"),
    };
  }

  return { series, completion };
}
