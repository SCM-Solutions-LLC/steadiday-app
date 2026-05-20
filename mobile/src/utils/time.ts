import { format, parseISO, isToday, isSameDay, addDays, startOfDay } from "date-fns";

// ============================================================================
// TIMEZONE-AWARE DATE KEY HELPER (PART 1)
// ============================================================================

/**
 * Get the device's local timezone identifier
 * Used as fallback when event/calendar timezone is not available
 */
export function getDeviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format a Date to a YYYY-MM-DD date key using Intl.DateTimeFormat
 * This is timezone-aware and does NOT use toISOString() which always returns UTC
 *
 * IMPORTANT: Use this for all task date grouping, filtering, and comparisons
 *
 * @param date - The Date object to format
 * @param timeZone - Optional timezone (e.g., "America/New_York"). Falls back to device timezone
 * @returns Date key in "YYYY-MM-DD" format representing the date in the specified timezone
 *
 * Timezone priority for Apple Calendar events:
 * 1. event.timeZone if present
 * 2. calendar.timeZone if available
 * 3. device timezone (fallback)
 */
export function formatDateKey(date: Date, timeZone?: string): string {
  const tz = timeZone || getDeviceTimezone();

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: tz,
    });

    // formatToParts gives us the individual components
    const parts = formatter.formatToParts(date);

    let year = "";
    let month = "";
    let day = "";

    for (const part of parts) {
      if (part.type === "year") year = part.value;
      if (part.type === "month") month = part.value;
      if (part.type === "day") day = part.value;
    }

    return `${year}-${month}-${day}`;
  } catch (error) {
    // Fallback if timezone is invalid - use device timezone
    const fallbackFormatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = fallbackFormatter.formatToParts(date);

    let year = "";
    let month = "";
    let day = "";

    for (const part of parts) {
      if (part.type === "year") year = part.value;
      if (part.type === "month") month = part.value;
      if (part.type === "day") day = part.value;
    }

    return `${year}-${month}-${day}`;
  }
}

/**
 * Parse a YYYY-MM-DD date string as a local date (not UTC)
 * This prevents timezone shift issues when parsing dates like "2026-01-08"
 * which should represent Jan 8 in local time, not UTC.
 *
 * @param dateString - Date string in "YYYY-MM-DD" format
 * @returns Date object representing midnight local time on that date
 */
export function parseLocalDateString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Parse a task's date field safely, handling both ISO strings and YYYY-MM-DD formats
 * For all-day events with dueDateLocal, uses local parsing to avoid UTC shift
 * For timed events, uses normal Date parsing
 *
 * @param task - Task object with date/dueDateLocal/isAllDay fields
 * @returns Date object representing the task's date in local time
 */
export function getTaskDate(task: { date?: string; dueDateLocal?: string; isAllDay?: boolean }): Date {
  // For all-day events with dueDateLocal, parse as local date to avoid UTC shift
  if (task.isAllDay && task.dueDateLocal) {
    return parseLocalDateString(task.dueDateLocal);
  }

  // For tasks with dueDateLocal but no isAllDay flag (legacy support)
  if (task.dueDateLocal && task.date?.includes("T00:00:00")) {
    return parseLocalDateString(task.dueDateLocal);
  }

  // For timed events or tasks without dueDateLocal, use normal parsing
  if (task.date) {
    // If the date is just YYYY-MM-DD (no time component), parse as local
    if (task.date.length === 10 && task.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return parseLocalDateString(task.date);
    }
    return new Date(task.date);
  }

  // Fallback to today
  return new Date();
}

/**
 * Get the effective date key for a task
 * Matches getTaskDate logic: uses dueDateLocal only for all-day events
 * Otherwise computes from dueAt/date in device timezone
 *
 * @param task - Task object with date/dueDateLocal/isAllDay fields
 * @returns Date key in "YYYY-MM-DD" format
 */
export function getTaskDateKey(task: { dueDateLocal?: string; date?: string; dueAt?: string; isAllDay?: boolean }): string {
  // For all-day events with dueDateLocal, use it directly (consistent with getTaskDate)
  if (task.isAllDay && task.dueDateLocal) {
    return task.dueDateLocal;
  }

  // For tasks with dueDateLocal but date looks like midnight (legacy support)
  if (task.dueDateLocal && task.date?.includes("T00:00:00")) {
    return task.dueDateLocal;
  }

  // For timed events, compute date key from timestamp in device timezone
  const dateField = task.dueAt || task.date;
  if (dateField) {
    // If the date is just YYYY-MM-DD (no time component), return it directly
    if (dateField.length === 10 && dateField.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateField;
    }
    return formatDateKey(new Date(dateField));
  }

  // Fallback to today
  return formatDateKey(new Date());
}

// ============================================================================
// DEVICE TIME FORMAT DETECTION
// ============================================================================

/**
 * Detect if the device uses 24-hour time format
 * Uses a test date to check the locale's time format preference
 */
let _uses24HourClock: boolean | null = null;

export function uses24HourClock(): boolean {
  if (_uses24HourClock !== null) {
    return _uses24HourClock;
  }

  // Create a test time (14:00) and format it using the device locale
  const testDate = new Date(2024, 0, 1, 14, 0, 0);
  const formatted = testDate.toLocaleTimeString(undefined, {
    hour: "numeric",
  });

  // If the formatted string contains "14", it's 24-hour format
  // If it contains "2" (but not "14"), it's 12-hour format with "2 PM"
  _uses24HourClock = formatted.includes("14");
  return _uses24HourClock;
}

/**
 * Format a time string (HH:mm) according to device preference
 * Input: "14:30" or "09:00"
 * Output: "2:30 PM" (12h) or "14:30" (24h)
 */
export function formatTimeForDevice(time: string): string {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time;

  if (uses24HourClock()) {
    // 24-hour format
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  } else {
    // 12-hour format
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }
}

/**
 * Format a time range (start to end) according to device preference
 * Input: "14:30", "16:00"
 * Output: "2:30 PM to 4:00 PM" (12h) or "14:30 to 16:00" (24h)
 */
export function formatTimeRangeForDevice(startTime: string, endTime?: string): string {
  if (!startTime) return "";

  const formattedStart = formatTimeForDevice(startTime);
  if (!endTime || startTime === endTime) {
    return formattedStart;
  }

  const formattedEnd = formatTimeForDevice(endTime);
  return `${formattedStart} to ${formattedEnd}`;
}

/**
 * Format a Date object's time according to device preference
 */
export function formatDateTimeForDevice(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  return formatTimeForDevice(time);
}

// ============================================================================
// LEGACY TIME FORMATTERS (kept for backward compatibility)
// ============================================================================

export const formatTime = (time: string): string => {
  // Assumes time is in "HH:mm" format
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

/**
 * Formats an ISO date string to local time display
 * Use this when displaying completion/taken times to ensure correct local timezone
 */
export const formatISOToLocalTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatDate = (dateString: string): string => {
  const date = parseISO(dateString);
  return format(date, "EEEE, MMMM d, yyyy");
};

export const formatDateTime = (dateString: string): string => {
  const date = parseISO(dateString);
  return format(date, "EEEE, MMMM d, yyyy – h:mm a");
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export const isTaskToday = (taskDate: string): boolean => {
  return isToday(parseISO(taskDate));
};

export const isSameDate = (date1: string, date2: string): boolean => {
  return isSameDay(parseISO(date1), parseISO(date2));
};

export const getNextFriday = (): string => {
  const today = new Date();
  const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
  return addDays(today, daysUntilFriday).toISOString();
};

export const getTodayDateString = (): string => {
  return startOfDay(new Date()).toISOString();
};

export const getWeekDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(today, i));
  }
  return dates;
};
