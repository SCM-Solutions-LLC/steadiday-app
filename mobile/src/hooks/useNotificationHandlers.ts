import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import {
  snoozeNotification,
  announceNotification,
  initializeNotifications,
  requestNotificationPermissions,
} from "../utils/notifications";
import { logger } from "../utils/logger";
import { useEngagementStore } from "../state/stores/engagementStore";
import { useSafetySessionStore } from "../state/stores/safetySessionStore";
import { acknowledgeFallAlert } from "../utils/backgroundWorkout";
import { maybeRequestReview } from "../utils/reviewPrompt";
import { Language } from "../types/app";

interface MedicationLog {
  id: string;
  medicationId: string;
  scheduledTime: string;
  actualTime: string;
  status: "taken" | "missed" | "skipped";
}

interface UseNotificationHandlersParams {
  logMedication: (log: MedicationLog) => void;
  toggleTaskComplete: (taskId: string) => void;
  voiceGuidanceEnabled: boolean;
  language: Language;
}

/**
 * Hook to set up notification handlers for the app.
 * Handles notification response actions (snooze, taken, done) and foreground announcements.
 *
 * @param params.logMedication - Function to log a medication as taken
 * @param params.toggleTaskComplete - Function to toggle a task as complete
 * @param params.voiceGuidanceEnabled - Whether voice guidance is enabled for announcements
 */
export function useNotificationHandlers({
  logMedication,
  toggleTaskComplete,
  voiceGuidanceEnabled,
  language,
}: UseNotificationHandlersParams): void {
  useEffect(() => {
    // Initialize notification categories and handler
    initializeNotifications().catch((error) => {
      logger.error("[useNotificationHandlers] Failed to initialize notifications:", error);
    });

    // Request notification permissions after the app is ready
    requestNotificationPermissions().catch((error) => {
      logger.error("[useNotificationHandlers] Failed to request notification permissions:", error);
    });

    // Set up notification action handlers
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data;

      if (actionIdentifier === "snooze-medication" || actionIdentifier === "snooze-task") {
        // Snooze the notification for 10 minutes
        snoozeNotification({
          type: data.type as "medication" | "task",
          medicationId: data.medicationId as string | undefined,
          taskId: data.taskId as string | undefined,
          title: notification.request.content.title || "",
          body: notification.request.content.body || "",
        });
      } else if (actionIdentifier === "taken-medication" && data.medicationId) {
        // Mark medication as taken
        logMedication({
          id: `${Date.now()}-${data.medicationId}`,
          medicationId: data.medicationId as string,
          scheduledTime: new Date().toISOString(),
          actualTime: new Date().toISOString(),
          status: "taken",
        });

        // Track engagement
        useEngagementStore.getState().incrementMedicationsTaken();
        setTimeout(() => maybeRequestReview(), 2000);
      } else if (actionIdentifier === "done-task" && data.taskId) {
        // Mark task as complete
        toggleTaskComplete(data.taskId as string);

        // Track engagement
        useEngagementStore.getState().incrementTasksCompleted();
        setTimeout(() => maybeRequestReview(), 2000);
      } else if (actionIdentifier === "FALL_OK") {
        // Cancel server-backed escalation and clear native pending flag
        useSafetySessionStore.getState().cancelFallEscalation();
        acknowledgeFallAlert();
      }
    });

    // Set up listener for notifications received while app is in foreground
    const notificationReceivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content;

      // Announce the notification if voice guidance is enabled
      if (title && body) {
        announceNotification(title, body, voiceGuidanceEnabled, language);
      }
    });

    // Cleanup subscriptions on unmount
    return () => {
      responseSubscription.remove();
      notificationReceivedSubscription.remove();
    };
  }, [logMedication, toggleTaskComplete, voiceGuidanceEnabled, language]);
}

export default useNotificationHandlers;
