/**
 * Apple Reminders Integration Service
 *
 * Two-way sync between SteadiDay tasks and Apple Reminders using EventKit.
 *
 * Key Features:
 * - User links a SteadiDay task to an Apple Reminder
 * - Changes in SteadiDay update the linked Reminder
 * - Changes in Reminders app update the linked SteadiDay task
 * - User chooses which tasks create Reminders (not automatic)
 * - All data stays on device and in user's iCloud (via Apple's Reminders system)
 * - No sensitive health details in Reminder titles (generic titles like "SteadiDay task")
 */

import * as Calendar from "expo-calendar";
import { Task } from "../types/app";
import { logger } from "../utils/logger";
import { useSettingsStore } from "../state/stores/settingsStore";
import { formatDateKey } from "../utils/time";

export interface ReminderLinkInfo {
  taskId: string;
  reminderId: string;
  lastSyncedAt: string;
  title: string;
}

class AppleRemindersService {
  private reminderLinks: Map<string, ReminderLinkInfo> = new Map();
  private defaultReminderListId: string | null = null;

  /**
   * Request permission to access Reminders
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestRemindersPermissionsAsync();
      return status === "granted";
    } catch (error) {
      logger.error("Error requesting Reminders permissions:", error);
      return false;
    }
  }

  /**
   * Get or create the default SteadiDay reminder list
   */
  async getDefaultReminderList(): Promise<string | null> {
    try {
      if (this.defaultReminderListId) {
        return this.defaultReminderListId;
      }

      // Get all reminder lists
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.REMINDER
      );

      // Look for existing "SteadiDay" list
      const existingList = calendars.find(
        (cal) => cal.title === "SteadiDay"
      );

      if (existingList) {
        this.defaultReminderListId = existingList.id;
        return existingList.id;
      }

      // Create a new SteadiDay reminder list
      // Note: On iOS, we need to use the default source
      const defaultCalendar = calendars.find((cal) => cal.allowsModifications);
      if (!defaultCalendar) {
        throw new Error("No modifiable reminder list found");
      }

      // For now, use the default list since expo-calendar doesn't support creating reminder lists
      this.defaultReminderListId = defaultCalendar.id;
      return this.defaultReminderListId;
    } catch (error) {
      logger.error("Error getting default reminder list:", error);
      return null;
    }
  }

  /**
   * Get all available reminder lists for user to choose from
   */
  async getReminderLists(): Promise<Array<{ id: string; title: string; color: string }>> {
    try {
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.REMINDER
      );

      return calendars
        .filter((cal) => cal.allowsModifications)
        .map((cal) => ({
          id: cal.id,
          title: cal.title,
          color: cal.color,
        }));
    } catch (error) {
      logger.error("Error getting reminder lists:", error);
      return [];
    }
  }

  /**
   * Create a sanitized title for Apple Reminders
   * Removes sensitive health information
   */
  private sanitizeTitle(taskTitle: string): string {
    // Keep the title generic to avoid exposing sensitive info
    // User can edit the reminder directly in Reminders app if they want more detail

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
    ];

    const lowerTitle = taskTitle.toLowerCase();
    const hasSensitiveInfo = sensitiveKeywords.some((keyword) =>
      lowerTitle.includes(keyword)
    );

    if (hasSensitiveInfo) {
      return "SteadiDay reminder";
    }

    return taskTitle;
  }

  /**
   * Create an Apple Reminder from a SteadiDay task
   * Guarded by enableAppleWriteBack setting
   */
  async createReminderFromTask(
    task: Task,
    reminderListId?: string
  ): Promise<string | null> {
    // Guard: Check if Apple write-back is enabled
    const enableAppleWriteBack = useSettingsStore.getState().enableAppleWriteBack;
    if (!enableAppleWriteBack) {
      logger.log("Apple write-back disabled, skipping createReminderFromTask");
      return null;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error("Reminders permission not granted");
      }

      const listId = reminderListId || (await this.getDefaultReminderList());
      if (!listId) {
        throw new Error("No reminder list available");
      }

      // Parse task date and time
      const startDate = new Date(task.date);
      if (task.time) {
        const [hours, minutes] = task.time.split(":").map(Number);
        startDate.setHours(hours, minutes, 0, 0);
      }

      // Create the reminder with expo-calendar
      // Note: expo-calendar uses createEventAsync for both events and reminders
      // We pass the REMINDER entity type
      const reminderId = await Calendar.createReminderAsync(listId, {
        title: this.sanitizeTitle(task.title),
        startDate: startDate,
        dueDate: startDate,
        completed: task.completed,
        notes: task.notes || undefined,
        location: task.location || undefined,
        alarms: task.reminderEnabled
          ? [
              {
                relativeOffset: -(task.reminderMinutes || 15),
              },
            ]
          : undefined,
      });

      // Store the link
      const linkInfo: ReminderLinkInfo = {
        taskId: task.id,
        reminderId: reminderId,
        lastSyncedAt: new Date().toISOString(),
        title: task.title,
      };

      this.reminderLinks.set(task.id, linkInfo);

      return reminderId;
    } catch (error) {
      logger.error("Error creating reminder from task:", error);
      return null;
    }
  }

  /**
   * Update an existing Apple Reminder when task changes
   * Guarded by enableAppleWriteBack setting
   */
  async updateReminderFromTask(task: Task): Promise<boolean> {
    // Guard: Check if Apple write-back is enabled
    const enableAppleWriteBack = useSettingsStore.getState().enableAppleWriteBack;
    if (!enableAppleWriteBack) {
      logger.log("Apple write-back disabled, skipping updateReminderFromTask");
      return false;
    }

    try {
      const linkInfo = this.reminderLinks.get(task.id);
      if (!linkInfo) {
        return false; // Task not linked to a reminder
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      // Parse task date and time
      const startDate = new Date(task.date);
      if (task.time) {
        const [hours, minutes] = task.time.split(":").map(Number);
        startDate.setHours(hours, minutes, 0, 0);
      }

      // Update the reminder
      await Calendar.updateReminderAsync(linkInfo.reminderId, {
        title: this.sanitizeTitle(task.title),
        startDate: startDate,
        dueDate: startDate,
        completed: task.completed,
        completionDate: task.completedAt ? new Date(task.completedAt) : undefined,
        notes: task.notes || undefined,
        location: task.location || undefined,
        alarms: task.reminderEnabled
          ? [
              {
                relativeOffset: -(task.reminderMinutes || 15),
              },
            ]
          : undefined,
      });

      // Update sync timestamp
      linkInfo.lastSyncedAt = new Date().toISOString();

      return true;
    } catch (error) {
      logger.error("Error updating reminder:", error);
      return false;
    }
  }

  /**
   * Delete an Apple Reminder when task is deleted
   * Guarded by enableAppleWriteBack setting
   */
  async deleteReminder(taskId: string): Promise<boolean> {
    // Guard: Check if Apple write-back is enabled
    const enableAppleWriteBack = useSettingsStore.getState().enableAppleWriteBack;
    if (!enableAppleWriteBack) {
      logger.log("Apple write-back disabled, skipping deleteReminder");
      return false;
    }

    try {
      const linkInfo = this.reminderLinks.get(taskId);
      if (!linkInfo) {
        return false; // Task not linked to a reminder
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      await Calendar.deleteReminderAsync(linkInfo.reminderId);

      // Remove the link
      this.reminderLinks.delete(taskId);

      return true;
    } catch (error) {
      logger.error("Error deleting reminder:", error);
      return false;
    }
  }

  /**
   * Unlink a task from its reminder (keep both, just disconnect)
   */
  async unlinkTaskFromReminder(taskId: string): Promise<boolean> {
    this.reminderLinks.delete(taskId);
    return true;
  }

  /**
   * Check if a task is linked to a reminder
   */
  isTaskLinked(taskId: string): boolean {
    return this.reminderLinks.has(taskId);
  }

  /**
   * Get reminder link info for a task
   */
  getReminderLinkInfo(taskId: string): ReminderLinkInfo | null {
    return this.reminderLinks.get(taskId) || null;
  }

  /**
   * Sync changes FROM Apple Reminders TO SteadiDay
   * This should be called periodically or when app comes to foreground
   */
  async syncRemindersToTasks(
    tasks: Task[],
    onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  ): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return;
      }

      // Get all reminders that are linked to tasks
      for (const [taskId, linkInfo] of this.reminderLinks.entries()) {
        try {
          // Fetch the reminder from EventKit
          const reminder = await Calendar.getReminderAsync(linkInfo.reminderId);

          if (!reminder) {
            // Reminder was deleted in Reminders app
            // Unlink it (but don't delete the task)
            this.reminderLinks.delete(taskId);
            continue;
          }

          // Find the corresponding task
          const task = tasks.find((t) => t.id === taskId);
          if (!task) {
            continue;
          }

          // Check if reminder was modified after our last sync
          const reminderModified = reminder.lastModifiedDate
            ? new Date(reminder.lastModifiedDate)
            : new Date(0);
          const lastSync = new Date(linkInfo.lastSyncedAt);

          if (reminderModified > lastSync) {
            // Reminder was changed in Reminders app, update the task
            const updates: Partial<Task> = {};

            // Only update if significantly different
            if (reminder.completed !== task.completed) {
              updates.completed = reminder.completed || false;
              if (reminder.completed && reminder.completionDate) {
                updates.completedAt = new Date(reminder.completionDate).toISOString();
              }
            }

            if (reminder.dueDate) {
              const dueDate = new Date(reminder.dueDate);
              const taskDate = new Date(task.date);

              if (dueDate.toISOString() !== taskDate.toISOString()) {
                updates.date = dueDate.toISOString();
                // Extract time if set
                if (dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0) {
                  updates.time = `${String(dueDate.getHours()).padStart(2, "0")}:${String(dueDate.getMinutes()).padStart(2, "0")}`;
                }
              }
            }

            if (reminder.notes && reminder.notes !== task.notes) {
              updates.notes = reminder.notes;
            }

            if (reminder.location && reminder.location !== task.location) {
              updates.location = reminder.location;
            }

            // Apply updates if any
            if (Object.keys(updates).length > 0) {
              onTaskUpdate(taskId, updates);

              // Update sync timestamp
              linkInfo.lastSyncedAt = new Date().toISOString();
            }
          }
        } catch (error) {
          logger.error(`Error syncing reminder ${linkInfo.reminderId}:`, error);
        }
      }
    } catch (error) {
      logger.error("Error syncing reminders to tasks:", error);
    }
  }

  /**
   * Get all linked task IDs
   */
  getLinkedTaskIds(): string[] {
    return Array.from(this.reminderLinks.keys());
  }

  /**
   * Load reminder links from storage
   */
  async loadLinks(links: ReminderLinkInfo[]): Promise<void> {
    this.reminderLinks = new Map(links.map((link) => [link.taskId, link]));
  }

  /**
   * Get all reminder links for persistence
   */
  getLinks(): ReminderLinkInfo[] {
    return Array.from(this.reminderLinks.values());
  }

  /**
   * Fetch actual reminders from Apple Reminders to import as tasks
   * Implements Option B: For repeating items, only import the next occurrence
   * @param startDate Start of date range (defaults to 7 days ago)
   * @param endDate End of date range (defaults to 30 days from now)
   */
  async fetchRemindersFromApp(
    startDate: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ): Promise<Task[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        logger.error("Reminders permission not granted for fetch");
        return [];
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
      const calendarMap = new Map(calendars.map(cal => [cal.id, cal]));
      const calendarIds = calendars.map((cal) => cal.id);

      if (calendarIds.length === 0) {
        logger.log("No reminder lists found to fetch from");
        return [];
      }

      // Fetch incomplete reminders
      const reminders = await Calendar.getRemindersAsync(
        calendarIds,
        null, // Get all statuses
        startDate,
        endDate
      );

      // Group recurring reminders to collapse into single row (Option B)
      // Also filter per Part F requirements:
      // - Exclude completed reminders
      // - Exclude reminders with no due date
      // - Only include overdue reminders if overdue within last 30 days
      const seriesMap = new Map<string, Calendar.Reminder>();
      const now = new Date();
      const maxOverdueDays = 30;
      const maxOverdueDate = new Date(now.getTime() - maxOverdueDays * 24 * 60 * 60 * 1000);

      for (const reminder of reminders) {
        // Skip completed reminders
        if (reminder.completed) continue;

        // Get the reminder's due date
        const reminderDueDate = reminder.dueDate
          ? new Date(reminder.dueDate)
          : reminder.startDate
            ? new Date(reminder.startDate)
            : null;

        // Part F: Skip reminders with no due date
        if (!reminderDueDate) continue;

        // Part F: If overdue, only include if within last 30 days
        if (reminderDueDate < now && reminderDueDate < maxOverdueDate) {
          continue; // Skip reminders overdue by more than 30 days
        }

        // Check if reminder is recurring
        const isRecurring = reminder.recurrenceRule !== null && reminder.recurrenceRule !== undefined;

        if (isRecurring) {
          // Create a unique series key
          const seriesKey = `${reminder.calendarId}:${reminder.id}:recurring`;

          const existingReminder = seriesMap.get(seriesKey);
          if (!existingReminder) {
            // First occurrence - keep it
            seriesMap.set(seriesKey, reminder);
          } else {
            // Keep the one with the earliest future due date
            const existingDate = existingReminder.dueDate
              ? new Date(existingReminder.dueDate)
              : existingReminder.startDate
                ? new Date(existingReminder.startDate)
                : new Date(0);
            const newDate = reminder.dueDate
              ? new Date(reminder.dueDate)
              : reminder.startDate
                ? new Date(reminder.startDate)
                : new Date(0);
            const now = new Date();

            // If existing is in past and new is in future, replace
            if (existingDate < now && newDate >= now) {
              seriesMap.set(seriesKey, reminder);
            }
            // If both are in future, keep the earlier one
            else if (existingDate >= now && newDate >= now && newDate < existingDate) {
              seriesMap.set(seriesKey, reminder);
            }
          }
        } else {
          // Non-recurring reminder - use unique key
          const uniqueKey = `${reminder.calendarId}:${reminder.id}:single`;
          seriesMap.set(uniqueKey, reminder);
        }
      }

      // Convert filtered reminders to Task format
      const tasks: Task[] = Array.from(seriesMap.values()).map((reminder) => {
        const isRecurring = reminder.recurrenceRule !== null && reminder.recurrenceRule !== undefined;
        const reminderDate = reminder.dueDate
          ? new Date(reminder.dueDate)
          : reminder.startDate
            ? new Date(reminder.startDate)
            : new Date();

        // Get list info for container name
        const listId = reminder.calendarId || "";
        const list = listId ? calendarMap.get(listId) : undefined;
        const listName = list?.title || "";

        let timeStr: string | undefined;
        if (reminder.dueDate || reminder.startDate) {
          const dateToUse = reminder.dueDate ? new Date(reminder.dueDate) : new Date(reminder.startDate!);
          if (dateToUse.getHours() !== 0 || dateToUse.getMinutes() !== 0) {
            timeStr = `${String(dateToUse.getHours()).padStart(2, "0")}:${String(dateToUse.getMinutes()).padStart(2, "0")}`;
          }
        }

        // Generate seriesId for recurring reminders (used for FlatList key)
        const seriesId = isRecurring ? `${reminder.calendarId}:${reminder.id}` : undefined;

        // Get recurrence rule as string for informational purposes
        let recurrenceRuleStr: string | undefined;
        if (reminder.recurrenceRule) {
          const rule = reminder.recurrenceRule;
          recurrenceRuleStr = `FREQ=${rule.frequency}`;
          if (rule.interval && rule.interval > 1) {
            recurrenceRuleStr += `;INTERVAL=${rule.interval}`;
          }
        }

        return {
          // Use consistent ID format matching twoWaySync.ts for deduplication
          // Format: synced-rem-{listId}-{reminderId} (not date-based to avoid duplicate series)
          id: `synced-rem-${reminder.calendarId}-${reminder.id}`,
          title: reminder.title || "Untitled Reminder",
          // PART 4: Use formatDateKey for timezone-aware date string
          date: formatDateKey(reminderDate),
          time: timeStr,
          notes: reminder.notes || undefined,
          location: reminder.location || undefined,
          completed: reminder.completed || false,
          frequency: "once" as const, // Imported as one-time (Option B)
          reminderEnabled: true,
          category: "personal" as const,
          syncSource: "reminders" as const,
          dataSource: "ios_reminders" as const,
          calendarEventId: reminder.id,
          // New required fields for external imports
          sourceSystem: "apple_reminders" as const,
          sourceContainerId: reminder.calendarId,
          sourceContainerName: listName,
          sourceItemId: reminder.id,
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

      logger.log(`Fetched ${tasks.length} reminders from Apple Reminders (collapsed recurring series)`);
      return tasks;
    } catch (error) {
      logger.error("Error fetching reminders from app:", error);
      return [];
    }
  }
}

// Singleton instance
export const appleRemindersService = new AppleRemindersService();
