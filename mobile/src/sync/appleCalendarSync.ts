/**
 * Apple Calendar Integration Service
 *
 * Two-way sync between SteadiDay tasks and Apple Calendar using EventKit.
 *
 * Key Features:
 * - User creates a Calendar event from a task with date/time
 * - Changes in SteadiDay update the linked Calendar event
 * - Changes in Calendar app update the linked SteadiDay task
 * - User chooses which calendar to use (default or another calendar)
 * - All data stays on device and in user's iCloud (via Apple's Calendar system)
 * - Generic event titles for health-related tasks ("SteadiDay appointment")
 */

import * as Calendar from "expo-calendar";
import { Task } from "../types/app";
import { logger } from "../utils/logger";
import { useSettingsStore } from "../state/stores/settingsStore";
import { formatDateKey, getDeviceTimezone } from "../utils/time";

export interface CalendarLinkInfo {
  taskId: string;
  eventId: string;
  calendarId: string;
  lastSyncedAt: string;
  title: string;
}

class AppleCalendarService {
  private calendarLinks: Map<string, CalendarLinkInfo> = new Map();
  private defaultCalendarId: string | null = null;

  /**
   * Request permission to access Calendar
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === "granted";
    } catch (error) {
      logger.error("Error requesting Calendar permissions:", error);
      return false;
    }
  }

  /**
   * Get the default calendar for SteadiDay events
   */
  async getDefaultCalendar(): Promise<string | null> {
    try {
      if (this.defaultCalendarId) {
        return this.defaultCalendarId;
      }

      // Get all calendars
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      );

      // Look for existing "SteadiDay" calendar
      const existingCalendar = calendars.find(
        (cal) => cal.title === "SteadiDay" && cal.allowsModifications
      );

      if (existingCalendar) {
        this.defaultCalendarId = existingCalendar.id;
        return existingCalendar.id;
      }

      // Use the device's default calendar
      const defaultCalendar = calendars.find(
        (cal) => cal.allowsModifications && cal.isPrimary
      );

      if (defaultCalendar) {
        this.defaultCalendarId = defaultCalendar.id;
        return this.defaultCalendarId;
      }

      // Fall back to any modifiable calendar
      const anyCalendar = calendars.find((cal) => cal.allowsModifications);
      if (anyCalendar) {
        this.defaultCalendarId = anyCalendar.id;
        return this.defaultCalendarId;
      }

      return null;
    } catch (error) {
      logger.error("Error getting default calendar:", error);
      return null;
    }
  }

  /**
   * Get all available calendars for user to choose from
   */
  async getCalendars(): Promise<
    Array<{ id: string; title: string; color: string; isPrimary: boolean }>
  > {
    try {
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      );

      return calendars
        .filter((cal) => cal.allowsModifications)
        .map((cal) => ({
          id: cal.id,
          title: cal.title,
          color: cal.color,
          isPrimary: cal.isPrimary || false,
        }));
    } catch (error) {
      logger.error("Error getting calendars:", error);
      return [];
    }
  }

  /**
   * Create a sanitized title for Calendar events
   * Removes sensitive health information
   */
  private sanitizeEventTitle(taskTitle: string, category?: string): string {
    const sensitiveKeywords = [
      "medication",
      "prescription",
      "doctor",
      "appointment",
      "health",
      "medical",
      "pharmacy",
      "pill",
      "dose",
      "mg",
      "ml",
      "surgery",
      "therapy",
      "treatment",
    ];

    const lowerTitle = taskTitle.toLowerCase();
    const hasSensitiveInfo = sensitiveKeywords.some((keyword) =>
      lowerTitle.includes(keyword)
    );

    if (hasSensitiveInfo || category === "medical") {
      return "SteadiDay appointment";
    }

    return taskTitle;
  }

  /**
   * Create a Calendar event from a SteadiDay task
   * Guarded by enableAppleWriteBack setting
   */
  async createEventFromTask(
    task: Task,
    calendarId?: string
  ): Promise<string | null> {
    // Guard: Check if Apple write-back is enabled
    const enableAppleWriteBack = useSettingsStore.getState().enableAppleWriteBack;
    if (!enableAppleWriteBack) {
      logger.log("Apple write-back disabled, skipping createEventFromTask");
      return null;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error("Calendar permission not granted");
      }

      const targetCalendarId = calendarId || (await this.getDefaultCalendar());
      if (!targetCalendarId) {
        throw new Error("No calendar available");
      }

      // Parse task date and time
      const startDate = new Date(task.date);
      let endDate = new Date(task.date);

      if (task.time) {
        const [hours, minutes] = task.time.split(":").map(Number);
        startDate.setHours(hours, minutes, 0, 0);

        if (task.endTime) {
          const [endHours, endMinutes] = task.endTime.split(":").map(Number);
          endDate.setHours(endHours, endMinutes, 0, 0);
        } else {
          // Default to 1 hour duration
          endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        }
      } else {
        // All-day event
        endDate.setHours(23, 59, 59, 999);
      }

      if (task.endDate) {
        endDate = new Date(task.endDate);
        if (task.endTime) {
          const [endHours, endMinutes] = task.endTime.split(":").map(Number);
          endDate.setHours(endHours, endMinutes, 0, 0);
        }
      }

      // Create the event
      const eventId = await Calendar.createEventAsync(targetCalendarId, {
        title: this.sanitizeEventTitle(task.title, task.category),
        startDate: startDate,
        endDate: endDate,
        allDay: task.isAllDay || false,
        notes: task.notes || undefined,
        location: task.location || undefined,
        url: task.url || undefined,
        alarms: task.reminderEnabled
          ? [
              {
                relativeOffset: -(task.reminderMinutes || 15),
              },
            ]
          : undefined,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      // Store the link
      const linkInfo: CalendarLinkInfo = {
        taskId: task.id,
        eventId: eventId,
        calendarId: targetCalendarId,
        lastSyncedAt: new Date().toISOString(),
        title: task.title,
      };

      this.calendarLinks.set(task.id, linkInfo);

      return eventId;
    } catch (error) {
      logger.error("Error creating calendar event from task:", error);
      return null;
    }
  }

  /**
   * Update an existing Calendar event when task changes
   * Guarded by enableAppleWriteBack setting
   */
  async updateEventFromTask(task: Task): Promise<boolean> {
    // Guard: Check if Apple write-back is enabled
    const enableAppleWriteBack = useSettingsStore.getState().enableAppleWriteBack;
    if (!enableAppleWriteBack) {
      logger.log("Apple write-back disabled, skipping updateEventFromTask");
      return false;
    }

    try {
      const linkInfo = this.calendarLinks.get(task.id);
      if (!linkInfo) {
        return false; // Task not linked to an event
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      // Parse task date and time
      const startDate = new Date(task.date);
      let endDate = new Date(task.date);

      if (task.time) {
        const [hours, minutes] = task.time.split(":").map(Number);
        startDate.setHours(hours, minutes, 0, 0);

        if (task.endTime) {
          const [endHours, endMinutes] = task.endTime.split(":").map(Number);
          endDate.setHours(endHours, endMinutes, 0, 0);
        } else {
          // Default to 1 hour duration
          endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        }
      } else {
        // All-day event
        endDate.setHours(23, 59, 59, 999);
      }

      if (task.endDate) {
        endDate = new Date(task.endDate);
        if (task.endTime) {
          const [endHours, endMinutes] = task.endTime.split(":").map(Number);
          endDate.setHours(endHours, endMinutes, 0, 0);
        }
      }

      // Update the event
      await Calendar.updateEventAsync(linkInfo.eventId, {
        title: this.sanitizeEventTitle(task.title, task.category),
        startDate: startDate,
        endDate: endDate,
        allDay: task.isAllDay || false,
        notes: task.notes || undefined,
        location: task.location || undefined,
        url: task.url || undefined,
        alarms: task.reminderEnabled
          ? [
              {
                relativeOffset: -(task.reminderMinutes || 15),
              },
            ]
          : undefined,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      // Update sync timestamp
      linkInfo.lastSyncedAt = new Date().toISOString();

      return true;
    } catch (error) {
      logger.error("Error updating calendar event:", error);
      return false;
    }
  }

  /**
   * Delete a Calendar event when task is deleted
   * Guarded by enableAppleWriteBack setting
   */
  async deleteEvent(taskId: string): Promise<boolean> {
    // Guard: Check if Apple write-back is enabled
    const enableAppleWriteBack = useSettingsStore.getState().enableAppleWriteBack;
    if (!enableAppleWriteBack) {
      logger.log("Apple write-back disabled, skipping deleteEvent");
      return false;
    }

    try {
      const linkInfo = this.calendarLinks.get(taskId);
      if (!linkInfo) {
        return false; // Task not linked to an event
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      await Calendar.deleteEventAsync(linkInfo.eventId);

      // Remove the link
      this.calendarLinks.delete(taskId);

      return true;
    } catch (error) {
      logger.error("Error deleting calendar event:", error);
      return false;
    }
  }

  /**
   * Unlink a task from its calendar event (keep both, just disconnect)
   */
  async unlinkTaskFromEvent(taskId: string): Promise<boolean> {
    this.calendarLinks.delete(taskId);
    return true;
  }

  /**
   * Check if a task is linked to a calendar event
   */
  isTaskLinked(taskId: string): boolean {
    return this.calendarLinks.has(taskId);
  }

  /**
   * Get calendar link info for a task
   */
  getCalendarLinkInfo(taskId: string): CalendarLinkInfo | null {
    return this.calendarLinks.get(taskId) || null;
  }

  /**
   * Sync changes FROM Apple Calendar TO SteadiDay
   * This should be called periodically or when app comes to foreground
   */
  async syncEventsToTasks(
    tasks: Task[],
    onTaskUpdate: (taskId: string, updates: Partial<Task>) => void,
    onTaskDelete: (taskId: string) => void
  ): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return;
      }

      // Get all events that are linked to tasks
      for (const [taskId, linkInfo] of this.calendarLinks.entries()) {
        try {
          // Fetch the event from EventKit
          const event = await Calendar.getEventAsync(linkInfo.eventId);

          if (!event) {
            // Event was deleted in Calendar app
            // Delete the task or unlink it based on user preference
            // For now, we'll unlink but keep the task
            this.calendarLinks.delete(taskId);
            continue;
          }

          // Find the corresponding task
          const task = tasks.find((t) => t.id === taskId);
          if (!task) {
            continue;
          }

          // Check if event was modified after our last sync
          const eventModified = event.lastModifiedDate
            ? new Date(event.lastModifiedDate)
            : new Date(0);
          const lastSync = new Date(linkInfo.lastSyncedAt);

          if (eventModified > lastSync) {
            // Event was changed in Calendar app, update the task
            const updates: Partial<Task> = {};

            // Update date and time
            if (event.startDate) {
              const startDate = new Date(event.startDate);
              updates.date = startDate.toISOString();

              if (!event.allDay) {
                updates.time = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
              }
            }

            if (event.endDate) {
              const endDate = new Date(event.endDate);
              updates.endDate = endDate.toISOString();

              if (!event.allDay) {
                updates.endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;
              }
            }

            if (event.allDay !== task.isAllDay) {
              updates.isAllDay = event.allDay;
            }

            if (event.notes && event.notes !== task.notes) {
              updates.notes = event.notes;
            }

            if (event.location && event.location !== task.location) {
              updates.location = event.location;
            }

            // Apply updates if any
            if (Object.keys(updates).length > 0) {
              onTaskUpdate(taskId, updates);

              // Update sync timestamp
              linkInfo.lastSyncedAt = new Date().toISOString();
            }
          }
        } catch (error) {
          logger.error(`Error syncing event ${linkInfo.eventId}:`, error);
        }
      }
    } catch (error) {
      logger.error("Error syncing events to tasks:", error);
    }
  }

  /**
   * Get all linked task IDs
   */
  getLinkedTaskIds(): string[] {
    return Array.from(this.calendarLinks.keys());
  }

  /**
   * Load calendar links from storage
   */
  async loadLinks(links: CalendarLinkInfo[]): Promise<void> {
    this.calendarLinks = new Map(links.map((link) => [link.taskId, link]));
  }

  /**
   * Get all calendar links for persistence
   */
  getLinks(): CalendarLinkInfo[] {
    return Array.from(this.calendarLinks.values());
  }

  /**
   * Fetch actual events from Apple Calendar to import as tasks
   * Implements Option B: For repeating items, only import the next occurrence
   * @param startDate Start of date range (defaults to today)
   * @param endDate End of date range (defaults to 30 days from now)
   */
  async fetchEventsFromCalendar(
    startDate: Date = new Date(),
    endDate: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ): Promise<Task[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        logger.error("Calendar permission not granted for fetch");
        return [];
      }

      // Get all modifiable calendars
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const calendarMap = new Map(calendars.map(cal => [cal.id, cal]));
      const calendarIds = calendars
        .filter((cal) => cal.allowsModifications || cal.source?.name === "iCloud")
        .map((cal) => cal.id);

      if (calendarIds.length === 0) {
        logger.log("No calendars found to fetch from");
        return [];
      }

      // Fetch events from all calendars
      const events = await Calendar.getEventsAsync(calendarIds, startDate, endDate);

      // Group events by recurrence rule to collapse recurring series
      // For recurring events, only keep the NEXT occurrence (Option B)
      const seriesMap = new Map<string, Calendar.Event>();

      for (const event of events) {
        // Check if event is recurring (has recurrence rules)
        const isRecurring = event.recurrenceRule !== null && event.recurrenceRule !== undefined;

        if (isRecurring) {
          // Create a unique series key based on event id (recurring events share same id in expo-calendar)
          // The original event ID stays the same across occurrences
          const seriesKey = `${event.calendarId}:${event.id}:recurring`;

          const existingEvent = seriesMap.get(seriesKey);
          if (!existingEvent) {
            // First occurrence of this series - keep it
            seriesMap.set(seriesKey, event);
          } else {
            // Compare dates - keep the one closer to now (but not in the past)
            const existingDate = new Date(existingEvent.startDate);
            const newDate = new Date(event.startDate);
            const now = new Date();

            // If existing is in past and new is in future, replace
            if (existingDate < now && newDate >= now) {
              seriesMap.set(seriesKey, event);
            }
            // If both are in future, keep the earlier one (next occurrence)
            else if (existingDate >= now && newDate >= now && newDate < existingDate) {
              seriesMap.set(seriesKey, event);
            }
          }
        } else {
          // Non-recurring event - use unique key with date
          const uniqueKey = `${event.calendarId}:${event.id}:${event.startDate}`;
          seriesMap.set(uniqueKey, event);
        }
      }

      // Convert filtered events to Task format
      const tasks: Task[] = Array.from(seriesMap.values()).map((event) => {
        const eventStartDate = new Date(event.startDate);
        const eventEndDate = event.endDate ? new Date(event.endDate) : undefined;
        const isRecurring = event.recurrenceRule !== null && event.recurrenceRule !== undefined;

        // Get calendar info for container name and timezone
        const calendar = calendarMap.get(event.calendarId);
        const calendarName = calendar?.title || "";

        // PART 2: Determine timezone priority
        // 1. event.timeZone if present
        // 2. calendar.timeZone if available
        // 3. device timezone (fallback)
        const chosenTimeZone = event.timeZone || calendar?.timeZone || getDeviceTimezone();

        // PART 2: Use formatDateKey for timezone-aware date string
        // For all-day events, this ensures the date displays correctly in the user's timezone
        const dueDateLocal = event.allDay ? formatDateKey(eventStartDate, chosenTimeZone) : undefined;

        // PART 3: For timed events, use formatDateKey in device timezone for consistency
        const dateStr = event.allDay
          ? dueDateLocal!
          : formatDateKey(eventStartDate, chosenTimeZone);

        // Extract time if not all-day event
        let timeStr: string | undefined;
        let endTimeStr: string | undefined;

        if (!event.allDay) {
          timeStr = `${String(eventStartDate.getHours()).padStart(2, "0")}:${String(eventStartDate.getMinutes()).padStart(2, "0")}`;
          if (eventEndDate) {
            endTimeStr = `${String(eventEndDate.getHours()).padStart(2, "0")}:${String(eventEndDate.getMinutes()).padStart(2, "0")}`;
          }
        }

        // Generate seriesId for recurring events (used for FlatList key)
        const seriesId = isRecurring ? `${event.calendarId}:${event.id}` : undefined;

        // Get recurrence rule as string for informational purposes
        let recurrenceRuleStr: string | undefined;
        if (event.recurrenceRule) {
          const rule = event.recurrenceRule;
          recurrenceRuleStr = `FREQ=${rule.frequency}`;
          if (rule.interval && rule.interval > 1) {
            recurrenceRuleStr += `;INTERVAL=${rule.interval}`;
          }
        }

        return {
          // Use consistent ID format matching twoWaySync.ts for deduplication
          // Format: synced-cal-{calendarId}-{eventId} (not date-based to avoid duplicate series)
          id: `synced-cal-${event.calendarId}-${event.id}`,
          title: event.title || "Untitled Event",
          date: dateStr,
          dueDateLocal: dueDateLocal, // PART 2: Store timezone-aware local date for all-day events
          time: timeStr,
          endTime: endTimeStr,
          endDate: eventEndDate ? formatDateKey(eventEndDate, chosenTimeZone) : undefined,
          notes: event.notes || undefined,
          location: event.location || undefined,
          completed: false,
          frequency: "once" as const, // Imported as one-time (Option B)
          reminderEnabled: (event.alarms && event.alarms.length > 0) || false,
          category: "personal" as const,
          syncSource: "calendar" as const,
          dataSource: "apple_calendar" as const,
          isAllDay: event.allDay,
          calendarEventId: event.id,
          // External source fields
          sourceSystem: "apple_calendar" as const,
          sourceContainerId: event.calendarId,
          sourceContainerName: calendarName,
          sourceItemId: event.id,
          isImported: true,
          isReadOnly: true,
          syncStatus: "linked" as const,
          lastSyncedAt: new Date().toISOString(),
          // Repeating item info (Option B - informational only)
          isRepeating: isRecurring,
          sourceRecurrenceRule: recurrenceRuleStr,
          seriesId: seriesId,
        };
      });

      logger.log(`Fetched ${tasks.length} events from Apple Calendar (collapsed recurring series)`);
      return tasks;
    } catch (error) {
      logger.error("Error fetching events from calendar:", error);
      return [];
    }
  }
}

// Singleton instance
export const appleCalendarService = new AppleCalendarService();
