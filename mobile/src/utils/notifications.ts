import * as Notifications from "expo-notifications";
import { Platform, AppState } from "react-native";
import { Medication, Task, NotificationSource, AlertTiming, SecondAlertTiming, Language } from "../types/app";
import { speak } from "./speech";
import { logger } from "./logger";
import { useMedicationStore } from "../state/stores/medicationStore";
import { useTaskStore } from "../state/stores/taskStore";

// Track if notification categories have been set up
let notificationCategoriesInitialized = false;

/**
 * Convert alert timing string to minutes before the scheduled time
 * @param alertTiming The alert timing value
 * @returns Minutes before the event (0 for "at_time", -1 for "none")
 */
export function getAlertMinutes(alertTiming: AlertTiming | SecondAlertTiming | undefined): number {
  switch (alertTiming) {
    case "at_time":
      return 0;
    case "5_min":
      return 5;
    case "15_min":
      return 15;
    case "30_min":
      return 30;
    case "none":
    case undefined:
      return -1; // -1 indicates no alert
    default:
      return 0;
  }
}

/**
 * Initialize notification categories and handler
 * This should be called early in app startup but inside an async context
 * to avoid crashes from top-level async execution
 */
export async function initializeNotifications(): Promise<void> {
  if (notificationCategoriesInitialized) {
    return;
  }

  try {
    // Configure notification categories with actions (including snooze)
    await Notifications.setNotificationCategoryAsync("medication", [
      {
        identifier: "snooze-medication",
        buttonTitle: "Remind me later",
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: "taken-medication",
        buttonTitle: "Done",
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync("task", [
      {
        identifier: "snooze-task",
        buttonTitle: "Remind me later",
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: "done-task",
        buttonTitle: "Done",
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    // Configure how notifications should be handled when the app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    notificationCategoriesInitialized = true;
    logger.log("[Notifications] Categories and handler initialized successfully");
  } catch (error) {
    logger.error("[Notifications] Failed to initialize categories:", error);
  }
}

/**
 * Check if SteadiDay should send notifications based on user preference
 * @param notificationSource User's notification source preference
 * @param isSyncedItem Whether this item is synced from a connected app
 * @returns true if SteadiDay should send notification
 */
export function shouldSendNotification(
  notificationSource: NotificationSource,
  isSyncedItem: boolean = false
): boolean {
  // If source is "steadiday" or "both", always send from SteadiDay
  if (notificationSource === "steadiday" || notificationSource === "both") {
    return true;
  }

  // If source is "connected-apps", only send for non-synced items
  // (synced items get notifications from their source app)
  if (notificationSource === "connected-apps") {
    return !isSyncedItem;
  }

  return false;
}

/**
 * Request notification permissions from the user
 * @returns true if permissions granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  }

  // For Android, create a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("medications", {
      name: "Medication Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6DB193",
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("tasks", {
      name: "Task Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2F80ED",
      sound: "default",
    });
  }

  return true;
}

/**
 * Schedule notifications for a medication (can schedule multiple for different times and alerts)
 * @param medication The medication to schedule notifications for
 * @param notificationSource User's notification preference
 * @returns Array of notification IDs
 */
export async function scheduleMedicationNotification(
  medication: Medication,
  notificationSource: NotificationSource = "steadiday"
): Promise<string[]> {
  if (!medication.reminderEnabled || !medication.times || medication.times.length === 0) {
    return [];
  }

  // Check if we should send notifications based on user preference
  const isSynced = !!medication.syncSource;
  if (!shouldSendNotification(notificationSource, isSynced)) {
    logger.log(`Skipping notification for ${medication.name} - handled by ${medication.syncSource || "connected app"}`);
    return [];
  }

  try {
    const notificationIds: string[] = [];

    // Get alert offsets in minutes
    const firstAlertMinutes = getAlertMinutes(medication.firstAlert || "at_time");
    const secondAlertMinutes = getAlertMinutes(medication.secondAlert);

    // Schedule notifications for each scheduled time
    for (const timeString of medication.times) {
      // Parse the time (HH:MM format)
      const [hours, minutes] = timeString.split(":").map(Number);

      // Determine if it should repeat
      const shouldRepeat =
        medication.frequency === "daily" ||
        medication.frequency === "twice-daily" ||
        medication.frequency === "three-times-daily" ||
        medication.frequency === "weekly";

      // Count how many medications are due at this exact time for better messaging
      const allMedications = useMedicationStore.getState().medications;
      const medsAtSameTime = allMedications.filter(
        (med) =>
          med.reminderEnabled &&
          med.times?.includes(timeString) &&
          !med.discontinuedAt
      );
      const medCount = medsAtSameTime.length;

      // Build notification content based on count
      const notificationBody =
        medCount > 1
          ? `You have ${medCount} medications to take. Tap to view details.`
          : "You have a medication to take. Tap to view details.";

      /**
       * SECURITY: Attack Story 9 Defense - Screen Sharing Protection
       * Notifications use generic messages to prevent exposure of medication
       * details during screen sharing or lock screen display. Medication name
       * and dosage are not shown - user must open app to see details.
       */

      // Schedule first alert
      if (firstAlertMinutes >= 0) {
        const now = new Date();
        const firstTriggerDate = new Date();
        firstTriggerDate.setHours(hours, minutes, 0, 0);
        firstTriggerDate.setMinutes(firstTriggerDate.getMinutes() - firstAlertMinutes);

        // If the time has passed today, schedule for tomorrow
        if (firstTriggerDate <= now) {
          firstTriggerDate.setDate(firstTriggerDate.getDate() + 1);
        }

        const firstNotificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Medication Reminder",
            body: notificationBody,
            data: {
              medicationId: medication.id,
              type: "medication",
              alertType: "first",
              screen: "Meds",
              action: "view",
            },
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: "medication",
          },
          trigger: shouldRepeat
            ? {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                hour: firstTriggerDate.getHours(),
                minute: firstTriggerDate.getMinutes(),
                repeats: true,
                channelId: Platform.OS === "android" ? "medications" : undefined,
              }
            : {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: firstTriggerDate,
                channelId: Platform.OS === "android" ? "medications" : undefined,
              },
        });

        notificationIds.push(firstNotificationId);
      }

      // Schedule second alert if configured
      if (secondAlertMinutes >= 0) {
        const now = new Date();
        const secondTriggerDate = new Date();
        secondTriggerDate.setHours(hours, minutes, 0, 0);
        secondTriggerDate.setMinutes(secondTriggerDate.getMinutes() - secondAlertMinutes);

        // If the time has passed today, schedule for tomorrow
        if (secondTriggerDate <= now) {
          secondTriggerDate.setDate(secondTriggerDate.getDate() + 1);
        }

        const secondNotificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Medication Reminder",
            body: notificationBody,
            data: {
              medicationId: medication.id,
              type: "medication",
              alertType: "second",
              screen: "Meds",
              action: "view",
            },
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: "medication",
          },
          trigger: shouldRepeat
            ? {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                hour: secondTriggerDate.getHours(),
                minute: secondTriggerDate.getMinutes(),
                repeats: true,
                channelId: Platform.OS === "android" ? "medications" : undefined,
              }
            : {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: secondTriggerDate,
                channelId: Platform.OS === "android" ? "medications" : undefined,
              },
        });

        notificationIds.push(secondNotificationId);
      }
    }

    return notificationIds;
  } catch (error) {
    logger.error("Error scheduling medication notification:", error);
    return [];
  }
}

/**
 * Schedule notifications for a task (first and optional second alert)
 * @param task The task to schedule notifications for
 * @param notificationSource User's notification preference
 * @returns Array of notification IDs (first alert, and optionally second alert)
 */
export async function scheduleTaskNotification(
  task: Task,
  notificationSource: NotificationSource = "steadiday"
): Promise<string[]> {
  if (!task.reminderEnabled || !task.time) {
    return [];
  }

  // Check if we should send notifications based on user preference
  const isSynced = !!task.syncSource;
  if (!shouldSendNotification(notificationSource, isSynced)) {
    logger.log(`Skipping notification for ${task.title} - handled by ${task.syncSource || "connected app"}`);
    return [];
  }

  const notificationIds: string[] = [];

  try {
    // Parse the task date and time
    const taskDate = new Date(task.date);
    const [hours, minutes] = task.time.split(":").map(Number);

    // Get reminder minutes (default to 0 = at time of task if not specified)
    const firstReminderMinutes = task.reminderMinutes ?? 0;

    // Calculate first alert trigger time
    const firstTriggerDate = new Date(taskDate);
    firstTriggerDate.setHours(hours, minutes, 0, 0);
    firstTriggerDate.setMinutes(firstTriggerDate.getMinutes() - firstReminderMinutes);

    const now = new Date();

    // Determine if it should repeat
    const shouldRepeat = task.frequency === "daily" || task.frequency === "weekly";

    /**
     * SECURITY: Attack Story 9 Defense - Screen Sharing Protection
     * Task notifications use generic messages to prevent exposure of task
     * details during screen sharing or lock screen display. Task title
     * is not shown - user must open app to see details.
     */

    // Schedule first alert if it's in the future
    if (firstTriggerDate > now) {
      const firstNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Task Reminder",
          body: "You have an upcoming task. Tap to view details.",
          data: {
            taskId: task.id,
            type: "task",
            alertType: "first",
            // Deep link data for navigation
            screen: "Tasks",
            action: "view",
          },
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: "task",
        },
        trigger: shouldRepeat
          ? {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              hour: firstTriggerDate.getHours(),
              minute: firstTriggerDate.getMinutes(),
              repeats: true,
              channelId: Platform.OS === "android" ? "tasks" : undefined,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: firstTriggerDate,
              channelId: Platform.OS === "android" ? "tasks" : undefined,
            },
      });
      notificationIds.push(firstNotificationId);
    }

    // Schedule second alert if configured and in the future
    if (task.secondReminderMinutes !== undefined && task.secondReminderMinutes !== null) {
      const secondTriggerDate = new Date(taskDate);
      secondTriggerDate.setHours(hours, minutes, 0, 0);
      secondTriggerDate.setMinutes(secondTriggerDate.getMinutes() - task.secondReminderMinutes);

      if (secondTriggerDate > now) {
        const secondNotificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Task Reminder",
            body: "You have an upcoming task. Tap to view details.",
            data: {
              taskId: task.id,
              type: "task",
              alertType: "second",
              screen: "Tasks",
              action: "view",
            },
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: "task",
          },
          trigger: shouldRepeat
            ? {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                hour: secondTriggerDate.getHours(),
                minute: secondTriggerDate.getMinutes(),
                repeats: true,
                channelId: Platform.OS === "android" ? "tasks" : undefined,
              }
            : {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: secondTriggerDate,
                channelId: Platform.OS === "android" ? "tasks" : undefined,
              },
        });
        notificationIds.push(secondNotificationId);
      }
    }

    return notificationIds;
  } catch (error) {
    logger.error("Error scheduling task notification:", error);
    return [];
  }
}

/**
 * Cancel a scheduled notification
 * @param notificationId The ID of the notification to cancel
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    logger.error("Error canceling notification:", error);
  }
}

/**
 * Cancel all notifications for a specific medication
 * This ensures no orphaned notifications remain when a medication is updated or deleted
 * @param medicationId The ID of the medication
 * @param notificationIds Optional array of known notification IDs to cancel first
 */
export async function cancelNotificationsForMedication(
  medicationId: string,
  notificationIds?: string[]
): Promise<void> {
  try {
    // First, cancel any known notification IDs
    if (notificationIds && notificationIds.length > 0) {
      for (const notifId of notificationIds) {
        await cancelNotification(notifId);
      }
    }

    // Then, scan all scheduled notifications and cancel any that match this medication
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of allScheduled) {
      const data = notification.content.data as { medicationId?: string; type?: string } | undefined;
      if (data?.medicationId === medicationId && data?.type === "medication") {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    logger.error("Error canceling notifications for medication:", error);
  }
}

/**
 * Cancel all notifications for a specific task
 * This ensures no orphaned notifications remain when a task is updated or deleted
 * @param taskId The ID of the task
 * @param notificationIds Optional array of known notification IDs to cancel first
 */
export async function cancelNotificationsForTask(
  taskId: string,
  notificationIds?: string[]
): Promise<void> {
  try {
    // First, cancel the known notification IDs if provided
    if (notificationIds && notificationIds.length > 0) {
      for (const notifId of notificationIds) {
        await cancelNotification(notifId);
      }
    }

    // Then, scan all scheduled notifications and cancel any that match this task
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of allScheduled) {
      const data = notification.content.data as { taskId?: string; type?: string } | undefined;
      if (data?.taskId === taskId && data?.type === "task") {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    logger.error("Error canceling notifications for task:", error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    logger.error("Error canceling all notifications:", error);
  }
}

/**
 * Get all scheduled notifications (useful for debugging)
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    logger.error("Error getting scheduled notifications:", error);
    return [];
  }
}

/**
 * Snooze a notification for 10 minutes
 * @param notificationData The data from the original notification
 */
export async function snoozeNotification(
  notificationData: { type: "medication" | "task"; medicationId?: string; taskId?: string; title: string; body: string }
): Promise<void> {
  try {
    const triggerDate = new Date();
    triggerDate.setMinutes(triggerDate.getMinutes() + 10);

    /**
     * SECURITY: Attack Story 9 Defense - Screen Sharing Protection
     * Snoozed notifications also use generic messages for privacy.
     */
    const genericTitle = notificationData.type === "medication" ? "Medication Reminder" : "Task Reminder";
    const genericBody = notificationData.type === "medication"
      ? "You have a medication to take. Tap to view details."
      : "You have an upcoming task. Tap to view details.";

    // Build data with deep link info
    const notificationDataWithDeepLink = {
      ...notificationData,
      screen: notificationData.type === "medication" ? "Meds" : "Tasks",
      action: "view",
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: genericTitle,
        body: genericBody,
        data: notificationDataWithDeepLink,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: notificationData.type,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: Platform.OS === "android" ? (notificationData.type === "medication" ? "medications" : "tasks") : undefined,
      },
    });

    logger.log(`Notification snoozed for 10 minutes`);
  } catch (error) {
    logger.error("Error snoozing notification:", error);
  }
}

/**
 * Announce a notification using text-to-speech
 * Only announces if voice guidance is enabled and app is in foreground
 */
export function announceNotification(
  title: string,
  body: string,
  voiceGuidanceEnabled: boolean,
  language: Language = "en"
): void {
  if (!voiceGuidanceEnabled) {
    return;
  }

  const appState = AppState.currentState;
  if (appState !== "active") {
    return;
  }

  try {
    const announcement = `${title}. ${body}`;
    speak(announcement, {
      language,
      rate: 0.85, // Slightly slower for reminders
    });
  } catch (error) {
    logger.error("Error announcing notification:", error);
  }
}

// ============================================================================
// WATER REMINDER NOTIFICATIONS
// Schedules reminders throughout the day to drink water
// ============================================================================

// Water reminder messages to cycle through
const WATER_REMINDER_MESSAGES = [
  "Time to hydrate! Drink a glass of water.",
  "Stay hydrated! Have you had water recently?",
  "Water break! Your body needs hydration.",
  "Hydration reminder - drink some water now.",
  "Keep up with your water intake today!",
  "A glass of water keeps you healthy and alert.",
];

/**
 * Schedule water reminder notifications throughout the day
 * @param reminderTimes Array of "HH:MM" formatted times
 * @returns Array of notification IDs
 */
export async function scheduleWaterReminders(reminderTimes?: string[]): Promise<string[]> {
  const notificationIds: string[] = [];

  // Default times if none provided
  const times = reminderTimes || ["08:00", "10:30", "13:00", "15:30", "18:00", "20:30"];

  try {
    // First cancel any existing water reminders
    await cancelWaterReminders();

    // Create Android notification channel for water reminders if needed
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("water", {
        name: "Water Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150, 150, 150],
        lightColor: "#3B82F6",
        sound: "default",
      });
    }

    // Schedule a notification for each reminder time
    for (let i = 0; i < times.length; i++) {
      const timeStr = times[i];
      const [hourStr, minuteStr] = timeStr.split(":");
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      const message = WATER_REMINDER_MESSAGES[i % WATER_REMINDER_MESSAGES.length];

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Water Reminder",
          body: message,
          data: {
            type: "water",
            screen: "WaterTracker",
            action: "view",
          },
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: hour,
          minute: minute,
          repeats: true,
          channelId: Platform.OS === "android" ? "water" : undefined,
        },
      });

      notificationIds.push(notificationId);
    }

    logger.log(`[Notifications] Scheduled ${notificationIds.length} water reminders`);
    return notificationIds;
  } catch (error) {
    logger.error("[Notifications] Error scheduling water reminders:", error);
    return [];
  }
}

/**
 * Cancel all water reminder notifications
 */
export async function cancelWaterReminders(): Promise<void> {
  try {
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of allScheduled) {
      const data = notification.content.data as { type?: string } | undefined;
      if (data?.type === "water") {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }

    logger.log("[Notifications] Cancelled all water reminders");
  } catch (error) {
    logger.error("[Notifications] Error cancelling water reminders:", error);
  }
}

/**
 * Reschedule all notifications when user changes notification preference
 * Cancels all existing notifications and reschedules based on new preference
 * @param notificationSource The new notification source preference
 */
export async function rescheduleAllNotifications(
  notificationSource: NotificationSource
): Promise<void> {
  try {
    // 1. Cancel all existing SteadiDay notifications
    await cancelAllNotifications();

    // 2. Get all medications from medicationStore
    const medications = useMedicationStore.getState().medications;

    // 3. Get all tasks from taskStore
    const tasks = useTaskStore.getState().tasks;

    // 4. Reschedule medication notifications
    for (const medication of medications) {
      if (medication.reminderEnabled) {
        await scheduleMedicationNotification(medication, notificationSource);
      }
    }

    // 5. Reschedule task notifications (only active, non-completed tasks)
    for (const task of tasks) {
      if (task.reminderEnabled && !task.completed) {
        await scheduleTaskNotification(task, notificationSource);
      }
    }

    // 6. Reschedule mind breaks reminder if enabled
    const { useSettingsStore } = require("../state/stores/settingsStore");
    const settings = useSettingsStore.getState();
    if (settings.mindBreaksReminderEnabled) {
      await scheduleMindBreaksReminder(settings.mindBreaksReminderTime);
    }

    logger.log(`[Notifications] Rescheduled all notifications with source: ${notificationSource}`);
  } catch (error) {
    logger.error("[Notifications] Error rescheduling all notifications:", error);
  }
}

// ============================================================================
// MIND BREAKS STREAK REMINDER NOTIFICATIONS
// ============================================================================

const STREAK_REMINDER_MESSAGES = [
  "Don't lose your streak! Take a quick mind break today.",
  "Your brain will thank you! Play a quick game to keep your streak.",
  "Keep your mind sharp — play a Mind Break game today!",
  "You're on a roll! Don't forget your daily mind break.",
  "A quick game a day keeps the mind sharp. Play now!",
];

/**
 * Schedule a daily Mind Breaks streak reminder notification.
 * Only fires if user hasn't played today.
 * @param reminderTime "HH:MM" format for when to send the reminder
 * @returns Notification ID or null
 */
export async function scheduleMindBreaksReminder(
  reminderTime: string = "18:00"
): Promise<string | null> {
  try {
    // Cancel any existing mind breaks reminders first
    await cancelMindBreaksReminder();

    // Create Android notification channel if needed
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("mindbreaks", {
        name: "Mind Breaks Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150, 150, 150],
        lightColor: "#10B981",
        sound: "default",
      });
    }

    const [hourStr, minuteStr] = reminderTime.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // Pick a random message
    const message =
      STREAK_REMINDER_MESSAGES[
        Math.floor(Math.random() * STREAK_REMINDER_MESSAGES.length)
      ];

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Mind Breaks Reminder",
        body: message,
        data: {
          type: "mindbreaks",
          screen: "MindBreaks",
          action: "view",
        },
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: hour,
        minute: minute,
        repeats: true,
        channelId: Platform.OS === "android" ? "mindbreaks" : undefined,
      },
    });

    logger.log(
      `[Notifications] Scheduled Mind Breaks reminder at ${reminderTime}`
    );
    return notificationId;
  } catch (error) {
    logger.error(
      "[Notifications] Error scheduling Mind Breaks reminder:",
      error
    );
    return null;
  }
}

/**
 * Cancel the Mind Breaks streak reminder notification
 */
export async function cancelMindBreaksReminder(): Promise<void> {
  try {
    const allScheduled =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of allScheduled) {
      const data = notification.content.data as { type?: string } | undefined;
      if (data?.type === "mindbreaks") {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }

    logger.log("[Notifications] Cancelled Mind Breaks reminder");
  } catch (error) {
    logger.error(
      "[Notifications] Error cancelling Mind Breaks reminder:",
      error
    );
  }
}
