import * as Calendar from "expo-calendar";
import { Task, Medication, DataSource } from "../types/app";
import { logger } from "./logger";
import { useSettingsStore } from "../state/stores/settingsStore";
import { formatDateKey, getDeviceTimezone } from "./time";

/**
 * Two-way sync service for connected apps
 * This service handles syncing data FROM external apps TO SteadiDay
 *
 * DATA MERGE RULES:
 * 1. Manual entries always have dataSource: "steadiday"
 * 2. Connected data gets appropriate source (apple_calendar, ios_reminders, etc.)
 * 3. When displaying merged lists, group by source and show source labels
 * 4. Manual edits to connected data create a local copy (doesn't sync back)
 * 5. Deletions of connected items only remove local reference, not external
 */

export interface SyncedCalendarEvent {
  externalId: string;
  title: string;
  date: string;
  time?: string;
  notes?: string;
  source: "apple-calendar" | "google-calendar" | "apple-reminders";
}

export interface SyncedMedication {
  externalId: string;
  name: string;
  dosage: string;
  times: string[];
  scheduleType: "daily" | "specific-days";
  daysOfWeek?: number[];
  source: "apple-health" | "carezone";
}

/**
 * Helper to convert legacy syncSource to new DataSource
 */
export function syncSourceToDataSource(syncSource?: string): DataSource {
  switch (syncSource) {
    case "calendar":
      return "apple_calendar";
    case "reminders":
      return "ios_reminders";
    case "steadiday":
      return "steadiday";
    case "apple-health":
      return "apple_health";
    default:
      return "steadiday";
  }
}

/**
 * Generate external key for deduplication
 * Format: sourceSystem:sourceContainerId:sourceItemId
 */
export function generateExternalKey(
  sourceSystem: string,
  sourceContainerId: string,
  sourceItemId: string
): string {
  return `${sourceSystem}:${sourceContainerId}:${sourceItemId}`;
}

/**
 * Find existing task by external key
 */
export function findTaskByExternalKey(
  tasks: Task[],
  sourceSystem: string,
  sourceContainerId: string,
  sourceItemId: string
): Task | undefined {
  return tasks.find(
    (task) =>
      task.sourceSystem === sourceSystem &&
      task.sourceContainerId === sourceContainerId &&
      task.sourceItemId === sourceItemId
  );
}

/**
 * Generate a stable deduplication key for calendar events
 * Key format: sourceSystem:sourceItemId:startKey
 * startKey = dueDateLocal for all-day events, ISO timestamp otherwise
 */
function generateEventDedupeKey(
  sourceSystem: string,
  sourceItemId: string,
  isAllDay: boolean,
  dueDateLocal: string,
  startDateISO: string
): string {
  const startKey = isAllDay ? dueDateLocal : startDateISO;
  return `${sourceSystem}:${sourceItemId}:${startKey}`;
}

/**
 * Fetches events from Apple Calendar and converts them to Task format
 * Uses upsert pattern - updates existing tasks if found, creates new ones if not
 *
 * @param calendarIds - Array of calendar IDs to sync from (user-selected)
 * @param existingTasks - Current tasks for deduplication
 * @param calendarMeta - Optional metadata about calendars (for container names)
 */
export async function syncFromCalendar(
  calendarIds: string[],
  existingTasks: Task[],
  calendarMeta?: Array<{ id: string; name: string; color: string }>
): Promise<{ newTasks: Task[]; updatedTasks: Task[] }> {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    if (status !== "granted") {
      logger.log("Calendar permissions not granted");
      return { newTasks: [], updatedTasks: [] };
    }

    // Import window: past 30 days through next 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    const newTasks: Task[] = [];
    const updatedTasks: Task[] = [];

    // Build calendar name lookup
    const calendarNameMap = new Map<string, string>();
    if (calendarMeta) {
      for (const cal of calendarMeta) {
        calendarNameMap.set(cal.id, cal.name);
      }
    }

    // Part A: Fetch all events in ONE call with full calendarIds list (not looping)
    if (calendarIds.length === 0) {
      logger.log("No calendar IDs provided for sync");
      return { newTasks: [], updatedTasks: [] };
    }

    // Fetch calendar objects for timezone info
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendarInfoMap = new Map<string, Calendar.Calendar>();
    for (const cal of calendars) {
      calendarInfoMap.set(cal.id, cal);
    }

    const allEvents = await Calendar.getEventsAsync(calendarIds, startDate, endDate);
    logger.log(`Fetched ${allEvents.length} events from ${calendarIds.length} calendars`);

    // Part A: Dedupe events before processing using stable key
    const dedupeMap = new Map<string, typeof allEvents[0]>();
    for (const event of allEvents) {
      // Skip events that were created by SteadiDay
      if (event.notes?.includes("Created by SteadiDay")) {
        continue;
      }

      const eventStartDate = new Date(event.startDate);
      const isAllDay = event.allDay === true;

      // Get calendar info for timezone
      const calendarInfo = calendarInfoMap.get(event.calendarId);

      // PART 2: Determine timezone priority
      // 1. event.timeZone if present
      // 2. calendar.timeZone if available
      // 3. device timezone (fallback)
      const chosenTimeZone = event.timeZone || calendarInfo?.timeZone || getDeviceTimezone();

      // PART 2: Build dueDateLocal using formatDateKey (timezone-aware)
      const dueDateLocal = formatDateKey(eventStartDate, chosenTimeZone);

      const dedupeKey = generateEventDedupeKey(
        "apple_calendar",
        event.id,
        isAllDay,
        dueDateLocal,
        eventStartDate.toISOString()
      );

      // Keep one event per key (first occurrence wins)
      if (!dedupeMap.has(dedupeKey)) {
        dedupeMap.set(dedupeKey, event);
      }
    }

    logger.log(`After deduplication: ${dedupeMap.size} unique events`);

    // Process deduplicated events
    for (const event of dedupeMap.values()) {
      const calendarId = event.calendarId;
      const calendarName = calendarNameMap.get(calendarId) || "Calendar";

      const eventStartDate = new Date(event.startDate);
      const hours = eventStartDate.getHours();
      const minutes = eventStartDate.getMinutes();

      // Use the event's allDay property directly from expo-calendar
      // This is more reliable than checking hour values which can cause timezone issues
      const isAllDay = event.allDay === true;

      // Get calendar info for timezone
      const calendarInfo = calendarInfoMap.get(calendarId);

      // PART 2: Determine timezone priority
      // 1. event.timeZone if present
      // 2. calendar.timeZone if available
      // 3. device timezone (fallback)
      const chosenTimeZone = event.timeZone || calendarInfo?.timeZone || getDeviceTimezone();

      // PART 2: Use formatDateKey for timezone-aware date string
      // This prevents date shifting from UTC conversions
      const dueDateLocal = formatDateKey(eventStartDate, chosenTimeZone);

      // PART 3: For all events, use formatDateKey for the date field
      // This ensures consistent date representation across all task types
      const dateStr = dueDateLocal;

      // Check if task already exists using external key pattern
      const existingTask = findTaskByExternalKey(
        existingTasks,
        "apple_calendar",
        calendarId,
        event.id
      );

      if (existingTask) {
        // Skip updating if user has locally edited this imported task
        // User's local edits take precedence over external changes
        if (existingTask.isLocallyEdited) {
          continue;
        }

        // Update existing task if data changed
        const updatedTask: Task = {
          ...existingTask,
          title: event.title,
          date: dateStr,
          dueDateLocal: isAllDay ? dueDateLocal : undefined,
          time: isAllDay ? undefined : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
          notes: event.notes || undefined,
          lastSyncedAt: new Date().toISOString(),
          sourceContainerName: calendarName,
          isAllDay: isAllDay,
        };

        // Only add to updated if something actually changed
        if (
          existingTask.title !== updatedTask.title ||
          existingTask.date !== updatedTask.date ||
          existingTask.time !== updatedTask.time ||
          existingTask.notes !== updatedTask.notes
        ) {
          updatedTasks.push(updatedTask);
        }
      } else {
        // Create new task with all required fields populated
        const newTask: Task = {
          id: `synced-cal-${calendarId}-${event.id}`,
          title: event.title,
          date: dateStr,
          dueDateLocal: isAllDay ? dueDateLocal : undefined,
          time: isAllDay ? undefined : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
          completed: false,
          reminderEnabled: false,
          notes: event.notes || undefined,
          calendarEventId: event.id,
          syncSource: "calendar",
          dataSource: "apple_calendar",
          // External source tracking (Part A requirement)
          sourceSystem: "apple_calendar",
          sourceContainerId: calendarId,
          sourceContainerName: calendarName,
          sourceItemId: event.id,
          isImported: true,
          isReadOnly: true,
          isLocallyEdited: false,
          syncStatus: "linked",
          lastSyncedAt: new Date().toISOString(),
          isAllDay: isAllDay,
        };

        newTasks.push(newTask);
      }
    }

    logger.log(`Calendar sync: ${newTasks.length} new, ${updatedTasks.length} updated`);
    return { newTasks, updatedTasks };
  } catch (error) {
    logger.error("Error syncing from calendar:", error);
    return { newTasks: [], updatedTasks: [] };
  }
}

/**
 * Fetches reminders from Apple Reminders and converts them to Task format
 * Uses upsert pattern - updates existing tasks if found, creates new ones if not
 *
 * @param selectedListIds - Array of reminder list IDs to sync from (user-selected)
 * @param existingTasks - Current tasks for deduplication
 * @param listMeta - Optional metadata about lists (for container names)
 */
export async function syncFromReminders(
  selectedListIds: string[],
  existingTasks: Task[],
  listMeta?: Array<{ id: string; name: string; color: string }>
): Promise<{ newTasks: Task[]; updatedTasks: Task[] }> {
  try {
    const { status } = await Calendar.getRemindersPermissionsAsync();
    if (status !== "granted") {
      logger.log("Reminders permissions not granted");
      return { newTasks: [], updatedTasks: [] };
    }

    // If no lists selected, return empty
    if (selectedListIds.length === 0) {
      logger.log("No reminder lists selected for sync");
      return { newTasks: [], updatedTasks: [] };
    }

    // Import window: past 30 days through next 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    const newTasks: Task[] = [];
    const updatedTasks: Task[] = [];

    // Build list name lookup
    const listNameMap = new Map<string, string>();
    if (listMeta) {
      for (const list of listMeta) {
        listNameMap.set(list.id, list.name);
      }
    }

    for (const listId of selectedListIds) {
      const reminders = await Calendar.getRemindersAsync(
        [listId],
        null, // Get all statuses (not just incomplete)
        startDate,
        endDate
      );

      const listName = listNameMap.get(listId) || "Reminders";

      for (const reminder of reminders) {
        // Skip reminders created by SteadiDay
        if (reminder.notes?.includes("Created by SteadiDay")) {
          continue;
        }

        // Skip completed reminders
        if (reminder.completed) {
          continue;
        }

        const dueDate = reminder.dueDate ? new Date(reminder.dueDate) : null;
        if (!dueDate) {
          continue; // Skip reminders without due dates
        }

        // Skip reminders without id
        if (!reminder.id) {
          continue;
        }

        const reminderId = reminder.id;
        const hours = dueDate.getHours();
        const minutes = dueDate.getMinutes();

        // Check if task already exists using external key pattern
        const existingTask = findTaskByExternalKey(
          existingTasks,
          "apple_reminders",
          listId,
          reminderId
        );

        if (existingTask) {
          // Skip updating if user has locally edited this imported task
          // User's local edits take precedence over external changes
          if (existingTask.isLocallyEdited) {
            continue;
          }

          // Update existing task if data changed
          const updatedTask: Task = {
            ...existingTask,
            title: reminder.title || "Untitled Reminder",
            // PART 4: Use formatDateKey for timezone-aware date string
            date: formatDateKey(dueDate),
            time: hours === 0 && minutes === 0 ? undefined : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
            notes: reminder.notes || undefined,
            completed: reminder.completed ?? false,
            lastSyncedAt: new Date().toISOString(),
            sourceContainerName: listName,
          };

          // Only add to updated if something actually changed
          if (
            existingTask.title !== updatedTask.title ||
            existingTask.date !== updatedTask.date ||
            existingTask.time !== updatedTask.time ||
            existingTask.notes !== updatedTask.notes ||
            existingTask.completed !== updatedTask.completed
          ) {
            updatedTasks.push(updatedTask);
          }
        } else {
          // Create new task
          const newTask: Task = {
            id: `synced-rem-${listId}-${reminderId}`,
            title: reminder.title || "Untitled Reminder",
            // PART 4: Use formatDateKey for timezone-aware date string
            date: formatDateKey(dueDate),
            time: hours === 0 && minutes === 0 ? undefined : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
            completed: reminder.completed ?? false,
            reminderEnabled: false,
            notes: reminder.notes || undefined,
            calendarEventId: reminderId,
            syncSource: "reminders",
            dataSource: "ios_reminders",
            // External source tracking
            sourceSystem: "apple_reminders",
            sourceContainerId: listId,
            sourceContainerName: listName,
            sourceItemId: reminderId,
            isImported: true,
            isReadOnly: true,
            isLocallyEdited: false,
            syncStatus: "linked",
            lastSyncedAt: new Date().toISOString(),
          };

          newTasks.push(newTask);
        }
      }
    }

    logger.log(`Reminders sync: ${newTasks.length} new, ${updatedTasks.length} updated`);
    return { newTasks, updatedTasks };
  } catch (error) {
    logger.error("Error syncing from reminders:", error);
    return { newTasks: [], updatedTasks: [] };
  }
}

/**
 * Syncs completed status back to calendar/reminders
 * Guarded by enableAppleWriteBack setting
 */
export async function syncTaskCompletionToExternal(
  task: Task
): Promise<boolean> {
  // Guard: Check if Apple write-back is enabled
  const enableAppleWriteBack = useSettingsStore.getState().enableAppleWriteBack;
  if (!enableAppleWriteBack) {
    logger.log("Apple write-back disabled, skipping syncTaskCompletionToExternal");
    return false;
  }

  try {
    if (!task.calendarEventId || !task.syncSource) {
      return false;
    }

    if (task.syncSource === "reminders") {
      // Update reminder completion status
      await Calendar.updateReminderAsync(task.calendarEventId, {
        completed: task.completed,
      });
      return true;
    }

    // For calendar events, we can't mark them as "completed" but we could add a note
    if (task.syncSource === "calendar" && task.completed) {
      const event = await Calendar.getEventAsync(task.calendarEventId);
      if (event) {
        const updatedNotes = event.notes
          ? `${event.notes}\n\n✓ Completed in SteadiDay`
          : "✓ Completed in SteadiDay";

        await Calendar.updateEventAsync(task.calendarEventId, {
          notes: updatedNotes,
        });
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error("Error syncing task completion:", error);
    return false;
  }
}

/**
 * Detects changes in external calendar/reminders and updates tasks
 */
export async function detectExternalChanges(
  existingTasks: Task[]
): Promise<{ updated: Task[]; deleted: string[] }> {
  try {
    const updated: Task[] = [];
    const deleted: string[] = [];

    for (const task of existingTasks) {
      if (!task.calendarEventId || !task.syncSource) {
        continue;
      }

      // Skip locally edited tasks - user's edits take precedence
      if (task.isLocallyEdited) {
        continue;
      }

      try {
        if (task.syncSource === "calendar") {
          const event = await Calendar.getEventAsync(task.calendarEventId);

          if (!event) {
            // Event was deleted externally
            deleted.push(task.id);
            continue;
          }

          // Check if event was modified
          // PART 4: Use timezone-aware date key instead of UTC slicing
          const eventStartDate = new Date(event.startDate);
          const eventDateStr = formatDateKey(eventStartDate);
          const hours = eventStartDate.getHours();
          const minutes = eventStartDate.getMinutes();
          const eventTimeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

          if (
            event.title !== task.title ||
            eventDateStr !== task.date ||
            (task.time && eventTimeStr !== task.time)
          ) {
            updated.push({
              ...task,
              title: event.title,
              date: eventDateStr,
              time: hours === 0 && minutes === 0 ? undefined : eventTimeStr,
              notes: event.notes || task.notes,
            });
          }
        } else if (task.syncSource === "reminders") {
          const reminder = await Calendar.getReminderAsync(task.calendarEventId);

          if (!reminder) {
            deleted.push(task.id);
            continue;
          }

          // Check if reminder was modified
          if (reminder.completed !== task.completed || reminder.title !== task.title) {
            const dueDate = reminder.dueDate ? new Date(reminder.dueDate) : new Date();
            const hours = dueDate.getHours();
            const minutes = dueDate.getMinutes();

            // PART 4: Use timezone-aware date key instead of UTC slicing
            updated.push({
              ...task,
              title: reminder.title || "Untitled Reminder",
              completed: reminder.completed ?? false,
              date: formatDateKey(dueDate),
              time: hours === 0 && minutes === 0 ? undefined : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
              notes: reminder.notes || task.notes,
            });
          }
        }
      } catch (error) {
        // If we can't find the event/reminder, it was likely deleted
        logger.log(`Event/Reminder ${task.calendarEventId} not found, marking for deletion`);
        deleted.push(task.id);
      }
    }

    return { updated, deleted };
  } catch (error) {
    logger.error("Error detecting external changes:", error);
    return { updated: [], deleted: [] };
  }
}

/**
 * Gets list of available calendars for syncing
 */
export async function getAvailableCalendars(): Promise<Calendar.Calendar[]> {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } = await Calendar.requestCalendarPermissionsAsync();
      if (newStatus !== "granted") {
        return [];
      }
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    return calendars.filter((cal) => cal.allowsModifications);
  } catch (error) {
    logger.error("Error getting available calendars:", error);
    return [];
  }
}

/**
 * Performs a full two-way sync
 * @param existingTasks - Current tasks for deduplication
 * @param connectedCalendarIds - User-selected calendar IDs
 * @param connectedReminderListIds - User-selected reminder list IDs
 * @param calendarMeta - Optional calendar metadata
 * @param reminderListMeta - Optional reminder list metadata
 */
export async function performFullSync(
  existingTasks: Task[],
  connectedCalendarIds: string[],
  connectedReminderListIds: string[] = [],
  calendarMeta?: Array<{ id: string; name: string; color: string }>,
  reminderListMeta?: Array<{ id: string; name: string; color: string }>
): Promise<{
  newTasks: Task[];
  updatedTasks: Task[];
  deletedTaskIds: string[];
}> {
  logger.log("Starting full two-way sync...");

  // Fetch new tasks from external sources
  const calendarResult = await syncFromCalendar(connectedCalendarIds, existingTasks, calendarMeta);
  const remindersResult = await syncFromReminders(connectedReminderListIds, existingTasks, reminderListMeta);

  // Combine new tasks from both sources
  const newTasks = [...calendarResult.newTasks, ...remindersResult.newTasks];

  // Combine updated tasks from both sources with detected external changes
  const { updated: externalUpdated, deleted } = await detectExternalChanges(existingTasks);
  const updatedTasks = [
    ...calendarResult.updatedTasks,
    ...remindersResult.updatedTasks,
    ...externalUpdated,
  ];

  logger.log(`Sync complete: ${newTasks.length} new, ${updatedTasks.length} updated, ${deleted.length} deleted`);

  return {
    newTasks,
    updatedTasks,
    deletedTaskIds: deleted,
  };
}

/**
 * Merge manual and connected data with proper source attribution
 *
 * Rules:
 * - Manual entries (dataSource: "steadiday") are always included
 * - Connected entries are included if not duplicates
 * - Duplicates are detected by matching calendarEventId
 * - When displaying, items are grouped/sorted by source for clarity
 */
export function mergeTasksWithSources(
  manualTasks: Task[],
  connectedTasks: Task[]
): Task[] {
  // Start with all manual tasks
  const merged = [...manualTasks];

  // Add connected tasks that aren't duplicates
  for (const connectedTask of connectedTasks) {
    const isDuplicate = merged.some(
      (t) =>
        t.calendarEventId === connectedTask.calendarEventId ||
        t.id === connectedTask.id
    );
    if (!isDuplicate) {
      merged.push(connectedTask);
    }
  }

  return merged;
}

/**
 * Get the effective DataSource for a task, handling legacy syncSource field
 */
export function getTaskDataSource(task: Task): DataSource {
  // Prefer new dataSource field if set
  if (task.dataSource) {
    return task.dataSource;
  }

  // Fall back to converting legacy syncSource
  return syncSourceToDataSource(task.syncSource);
}

/**
 * Check if a task is from an external source (not manually created)
 */
export function isExternalTask(task: Task): boolean {
  const source = getTaskDataSource(task);
  return source !== "steadiday";
}

/**
 * Group tasks by their data source for display
 */
export function groupTasksBySource(tasks: Task[]): Record<DataSource, Task[]> {
  const groups: Record<DataSource, Task[]> = {
    steadiday: [],
    apple_health: [],
    apple_calendar: [],
    google_calendar: [],
    ios_reminders: [],
    multiple: [],
    other: [],
  };

  for (const task of tasks) {
    const source = getTaskDataSource(task);
    groups[source].push(task);
  }

  return groups;
}
