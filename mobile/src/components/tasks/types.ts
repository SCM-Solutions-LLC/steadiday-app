import type { Task, TaskCategory, TaskFrequency, TaskSourceSystem, AlertTiming, SecondAlertTiming } from "../../types/app";
import type { IoniconsName } from "../../types/icons";
import type { ThemeColors } from "../../utils/colorThemes";
import { getTaskDate } from "../../utils/time";

// ============================================================================
// SHARED TASK TYPES
// ============================================================================

export interface BaseTaskProps {
  textClasses: {
    title: string;
    subtitle: string;
    body: string;
    small: string;
    button: string;
  };
  colors: {
    background: string;
    cardBackground: string;
    textPrimary: string;
    textSecondary: string;
    divider: string;
    border: string;
  };
  primary: string;
  primaryLight: string;
}

export interface CategoryStyle {
  bg: string;
  text: string;
  iconColor: string;
}

// ============================================================================
// TASK CARD PROPS
// ============================================================================

export interface TaskCardProps extends BaseTaskProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

// ============================================================================
// TASK FORM MODAL PROPS
// ============================================================================

export interface TaskFormModalProps extends BaseTaskProps {
  visible: boolean;
  editingTask: Task | null;
  onClose: () => void;
  onSave: (taskData: TaskFormData) => void;
}

export interface TaskFormData {
  title: string;
  date: Date;
  time: Date | null;
  time2?: Date | null;
  time3?: Date | null;
  times?: string[];
  hasTime: boolean;
  category: TaskCategory;
  frequency: TaskFrequency;
  reminderEnabled: boolean;
  soundReminderEnabled: boolean;
  firstAlert: AlertTiming;
  secondAlert: SecondAlertTiming;
  notes: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================================================
// TASK FILTERS STATE
// ============================================================================

export interface TaskFiltersState {
  searchQuery: string;
  viewMode: "today" | "week";
}

export interface UseTaskFiltersReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  todaysTasks: Task[];
  filteredTodaysTasks: Task[];
  activeTasks: Task[];
  completedTasks: Task[];
}

// ============================================================================
// ONBOARDING TASK PREVIEW TYPES
// ============================================================================

export type TaskFilterType = "all" | "one-time" | "recurring" | "events" | "reminders";

export type TimeWindowDays = 7 | 30 | 90;

export interface OnboardingTaskFilters {
  activeFilter: TaskFilterType;
  timeWindowDays: TimeWindowDays;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getCategoryIcon(cat?: TaskCategory): IoniconsName {
  switch (cat) {
    case "medical":
      return "medical";
    case "errand":
      return "cart";
    case "personal":
      return "person";
    case "other":
      return "ellipsis-horizontal-circle";
    default:
      return "checkbox";
  }
}

export function getCategoryColor(cat: TaskCategory | undefined, primary: string, primaryLight: string): CategoryStyle {
  switch (cat) {
    case "medical":
      return { bg: "bg-[#FFE5E5]", text: "text-critical", iconColor: "#CC3A3A" };
    case "errand":
      return { bg: "bg-[#FFF4E5]", text: "text-[#F59E0B]", iconColor: "#F59E0B" };
    case "personal":
      return { bg: primaryLight + "20", text: "", iconColor: primary };
    case "other":
      return { bg: "bg-[#F3E8FF]", text: "text-[#9333EA]", iconColor: "#9333EA" };
    default:
      return { bg: primaryLight + "20", text: "", iconColor: primary };
  }
}

export function getFrequencyLabel(freq?: TaskFrequency): string {
  switch (freq) {
    case "once":
      return "One time";
    case "daily":
      return "Daily";
    case "twice-daily":
      return "Twice daily";
    case "three-times-daily":
      return "Three times daily";
    case "every-other-day":
      return "Every other day";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "custom":
      return "Custom";
    default:
      return "One time";
  }
}

export function getAppNameFromSyncSource(syncSource: string): string {
  if (syncSource === "calendar") return "Calendar";
  if (syncSource === "reminders") return "Reminders";
  return syncSource;
}

/**
 * Get display name for the new sourceSystem field
 */
export function getSourceSystemDisplayName(sourceSystem: TaskSourceSystem): string {
  switch (sourceSystem) {
    case "apple_calendar":
      return "Calendar";
    case "apple_reminders":
      return "Reminders";
    case "google_calendar":
      return "Google Calendar";
    case "manual":
      return "SteadiDay";
    default:
      return "";
  }
}

/**
 * Get icon name for source system
 */
export function getSourceSystemIcon(sourceSystem: TaskSourceSystem): IoniconsName {
  switch (sourceSystem) {
    case "apple_calendar":
      return "calendar";
    case "apple_reminders":
      return "list";
    case "google_calendar":
      return "logo-google";
    case "manual":
      return "create";
    default:
      return "cloud";
  }
}

/**
 * Get color for source system badge
 */
export function getSourceSystemColor(sourceSystem: TaskSourceSystem): { bg: string; text: string } {
  switch (sourceSystem) {
    case "apple_calendar":
      return { bg: "#FF3B30", text: "#FFFFFF" }; // Red like iOS Calendar
    case "apple_reminders":
      return { bg: "#FF9500", text: "#FFFFFF" }; // Orange like iOS Reminders
    case "google_calendar":
      return { bg: "#4285F4", text: "#FFFFFF" }; // Google blue
    case "manual":
      return { bg: "#6DB193", text: "#FFFFFF" }; // App green
    default:
      return { bg: "#8E8E93", text: "#FFFFFF" }; // System gray
  }
}

// ============================================================================
// REPEATS BADGE HELPERS (PART G - Accessibility)
// ============================================================================

/**
 * Get theme-aware colors for the Repeats badge using semantic theme tokens.
 * Uses surfaceSubtle for background, textPrimary for text, and borderSubtle for border.
 * Designed to meet WCAG AA contrast minimum (4.5:1), preferably 7:1 for small text.
 *
 * @param theme - The current theme colors from getThemeColors()
 * @returns Colors for badge background, text, and border
 */
export function getRepeatsBadgeColors(theme: ThemeColors): { bg: string; text: string; border: string } {
  return {
    bg: theme.surfaceSubtle,
    text: theme.textPrimary,
    border: theme.borderSubtle,
  };
}

// ============================================================================
// UNIQUE KEY GENERATION (PART I - FlatList Key Fix)
// ============================================================================

/**
 * Generate a unique key for a task in FlatList to avoid duplicate key warnings
 *
 * Key strategy:
 * - Non-recurring calendar event: ${sourceSystem}:${calendarId}:${eventId}:${startDateISO}
 * - Recurring calendar series preview: ${sourceSystem}:${calendarId}:${eventId}:series
 * - Non-recurring reminder: ${sourceSystem}:${listId}:${reminderId}:${dueDateISO-or-none}
 * - Recurring reminder series preview: ${sourceSystem}:${listId}:${reminderId}:series
 */
export function generateTaskKey(task: Task): string {
  const sourceSystem = task.sourceSystem || "manual";
  const containerId = task.sourceContainerId || "local";
  const itemId = task.sourceItemId || task.id;

  // For repeating items shown as a series preview, use "series" suffix
  if (task.isRepeating && task.seriesId) {
    return `${sourceSystem}:${containerId}:${task.seriesId}:series`;
  }

  // For non-recurring items, include the date to make unique
  const dateStr = task.date ? task.date.split("T")[0] : "none";
  return `${sourceSystem}:${containerId}:${itemId}:${dateStr}`;
}

/**
 * Check if a task is a recurring event/reminder based on source info
 */
export function isTaskRepeating(task: Task): boolean {
  return task.isRepeating === true ||
         (task.frequency !== undefined && task.frequency !== "once");
}

/**
 * Format date for task subtitle (older-user-friendly)
 * Example: "Tue Jan 6, 9:00 AM to 10:00 AM" or "Tue Jan 6, All day"
 *
 * IMPORTANT: For all-day events with dueDateLocal, we parse it as local date
 * to avoid timezone shift issues. "2026-01-08" should display as Jan 8, not Jan 7.
 */
export function formatTaskDateSubtitle(task: Task): string {
  if (!task.date && !task.dueDateLocal) return "";

  // Use getTaskDate helper which handles all-day events with dueDateLocal
  // and YYYY-MM-DD strings correctly (local parsing)
  const date = getTaskDate(task);

  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (task.isAllDay) {
    return `${dayName} ${monthDay}, All day`;
  }

  if (task.time) {
    const startTime = formatTimeDisplay(task.time);
    if (task.endTime) {
      const endTime = formatTimeDisplay(task.endTime);
      return `${dayName} ${monthDay}, ${startTime} to ${endTime}`;
    }
    return `${dayName} ${monthDay}, ${startTime}`;
  }

  return `${dayName} ${monthDay}`;
}

/**
 * Format reminder date subtitle
 * Example: "Next due Tue Jan 6, 6:00 PM"
 *
 * IMPORTANT: For all-day events with dueDateLocal, we parse it as local date
 * to avoid timezone shift issues.
 */
export function formatReminderDateSubtitle(task: Task): string {
  if (!task.date && !task.dueDateLocal) return "";

  // Use getTaskDate helper which handles all-day events with dueDateLocal
  // and YYYY-MM-DD strings correctly (local parsing)
  const date = getTaskDate(task);

  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (task.time) {
    const timeStr = formatTimeDisplay(task.time);
    return `Next due ${dayName} ${monthDay}, ${timeStr}`;
  }

  return `Next due ${dayName} ${monthDay}`;
}

/**
 * Format time string for display (12-hour format)
 */
function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}
