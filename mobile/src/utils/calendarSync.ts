import * as Calendar from "expo-calendar";
import { Task, Medication, NotificationSource } from "../types/app";
import { logger } from "./logger";
import { useSettingsStore } from "../state/stores/settingsStore";

/**
 * Determine if calendar events should have alarms based on notification preference
 * @param notificationSource User's notification preference
 * @returns true if alarms should be added to calendar events
 */
function shouldAddCalendarAlarms(notificationSource: NotificationSource): boolean {
  // Only add alarms if user wants notifications from connected apps
  return notificationSource === "connected-apps" || notificationSource === "both";
}

/**
 * Syncs a task to the device calendar
 * Guarded by enableAppleWriteBack setting
 * @param task The task to sync
 * @param calendarId The calendar ID to sync to
 * @param notificationSource User's notification preference
 */
export async function syncTaskToCalendar(
  task: Task,
  calendarId: string,
  notificationSource: NotificationSource = "steadiday"
): Promise<string | null> {
  // Guard: Check if Apple write-back is enabled
  const enableAppleWriteBack = useSettingsStore.getState().enableAppleWriteBack;
  if (!enableAppleWriteBack) {
    logger.log("Apple write-back disabled, skipping syncTaskToCalendar");
    return null;
  }

  try {
    // Parse the date and time
    const taskDate = new Date(task.date);

    let startDate: Date;
    let endDate: Date;

    if (task.time) {
      const [hours, minutes] = task.time.split(":").map(Number);
      startDate = new Date(taskDate);
      startDate.setHours(hours, minutes, 0, 0);

      // Set end time to 1 hour later
      endDate = new Date(startDate);
      endDate.setHours(hours + 1, minutes, 0, 0);
    } else {
      // All-day event
      startDate = new Date(taskDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(taskDate);
      endDate.setHours(23, 59, 59, 999);
    }

    // Create the event
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: task.title,
      startDate,
      endDate,
      notes: task.notes || "",
      alarms: task.reminderEnabled && shouldAddCalendarAlarms(notificationSource) ? [{ relativeOffset: -30 }] : [],
    });

    return eventId;
  } catch (error) {
    logger.error("Error syncing task to calendar:", error);
    return null;
  }
}

/**
 * Updates an existing calendar event for a task
 * Guarded by enableAppleWriteBack setting
 */
export async function updateTaskInCalendar(
  task: Task,
  calendarEventId: string
): Promise<boolean> {
  // Guard: Check if Apple write-back is enabled
  const enableAppleWriteBack = useSettingsStore.getState().enableAppleWriteBack;
  if (!enableAppleWriteBack) {
    logger.log("Apple write-back disabled, skipping updateTaskInCalendar");
    return false;
  }

  try {
    const taskDate = new Date(task.date);

    let startDate: Date;
    let endDate: Date;

    if (task.time) {
      const [hours, minutes] = task.time.split(":").map(Number);
      startDate = new Date(taskDate);
      startDate.setHours(hours, minutes, 0, 0);

      endDate = new Date(startDate);
      endDate.setHours(hours + 1, minutes, 0, 0);
    } else {
      startDate = new Date(taskDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(taskDate);
      endDate.setHours(23, 59, 59, 999);
    }

    await Calendar.updateEventAsync(calendarEventId, {
      title: task.title,
      startDate,
      endDate,
      notes: task.notes || "",
      alarms: task.reminderEnabled ? [{ relativeOffset: -30 }] : [],
    });

    return true;
  } catch (error) {
    logger.error("Error updating task in calendar:", error);
    return false;
  }
}

/**
 * Deletes a calendar event
 * Guarded by enableAppleWriteBack setting
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  // Guard: Check if Apple write-back is enabled
  const enableAppleWriteBack = useSettingsStore.getState().enableAppleWriteBack;
  if (!enableAppleWriteBack) {
    logger.log("Apple write-back disabled, skipping deleteCalendarEvent");
    return false;
  }

  try {
    await Calendar.deleteEventAsync(eventId);
    return true;
  } catch (error) {
    logger.error("Error deleting calendar event:", error);
    return false;
  }
}

/**
 * Syncs a medication schedule to the calendar
 * Guarded by enableAppleWriteBack setting
 */
export async function syncMedicationToCalendar(
  medication: Medication,
  calendarId: string
): Promise<string[]> {
  // Guard: Check if Apple write-back is enabled
  const enableAppleWriteBack = useSettingsStore.getState().enableAppleWriteBack;
  if (!enableAppleWriteBack) {
    logger.log("Apple write-back disabled, skipping syncMedicationToCalendar");
    return [];
  }

  try {
    const eventIds: string[] = [];
    const today = new Date();

    // Create events for the next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Check if we should create an event for this day
      if (medication.scheduleType === "specific-days" && medication.daysOfWeek) {
        const dayOfWeek = date.getDay();
        if (!medication.daysOfWeek.includes(dayOfWeek)) {
          continue;
        }
      }

      // Create events for each time
      for (const time of medication.times) {
        const [hours, minutes] = time.split(":").map(Number);
        const startDate = new Date(date);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + 15);

        const eventId = await Calendar.createEventAsync(calendarId, {
          title: `💊 ${medication.name} - ${medication.dosage}`,
          startDate,
          endDate,
          notes: `Medication reminder: ${medication.name}`,
          alarms: medication.reminderEnabled ? [{ relativeOffset: -5 }] : [],
        });

        if (eventId) {
          eventIds.push(eventId);
        }
      }
    }

    return eventIds;
  } catch (error) {
    logger.error("Error syncing medication to calendar:", error);
    return [];
  }
}

/**
 * Fetches recent calendar events and returns them as Task objects
 */
export async function fetchCalendarEvents(
  calendarId: string,
  daysAhead: number = 30
): Promise<Array<{ id: string; title: string; startDate: Date; endDate: Date; notes?: string }>> {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const events = await Calendar.getEventsAsync([calendarId], startDate, endDate);

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      notes: event.notes,
    }));
  } catch (error) {
    logger.error("Error fetching calendar events:", error);
    return [];
  }
}

/**
 * Checks if calendar sync is enabled and permissions are granted
 */
export async function checkCalendarPermissions(): Promise<boolean> {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    return status === "granted";
  } catch (error) {
    logger.error("Error checking calendar permissions:", error);
    return false;
  }
}
