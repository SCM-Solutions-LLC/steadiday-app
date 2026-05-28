import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { useSafetySessionStore } from "../../state/stores/safetySessionStore";
import { isWorkoutRunning } from "../../utils/backgroundWorkout";

const BACKGROUND_NOTIFICATION_DELAY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * useSessionLifecycle
 * Monitors AppState changes during an active Safety Session.
 * When the app goes to background, CLLocationManager background updates
 * (started by the safety session store) keep the process alive so fall
 * detection continues. The "paused" notification is only scheduled when
 * no background session is active (e.g. location auth denied), since the
 * background location updates keep the JS thread alive and DeviceMotion running.
 */
export function useSessionLifecycle() {
  const isSessionActive = useSafetySessionStore((s) => s.isSessionActive);
  const sessionReminderEnabled = useSafetySessionStore(
    (s) => s.sessionReminderEnabled
  );
  const notificationIdRef = useRef<string | null>(null);
  const wasActiveRef = useRef(isSessionActive);

  // Keep ref in sync
  useEffect(() => {
    wasActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (!wasActiveRef.current) return;

      if (nextState === "background" || nextState === "inactive") {
        const workoutActive = await isWorkoutRunning();

        if (workoutActive) {
          // Background location updates keep the process alive — fall
          // detection continues in the background. No "paused" notification needed.
          return;
        }

        // No background session — schedule reminder so user knows fall
        // detection may not be running in background.
        if (sessionReminderEnabled && !notificationIdRef.current) {
          try {
            const id = await Notifications.scheduleNotificationAsync({
              content: {
                title: "Safety Session Paused",
                body: "SteadiDay isn't in the foreground. Tap to resume your Safety Session.",
                categoryIdentifier: "safety",
                sound: "default",
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: BACKGROUND_NOTIFICATION_DELAY_MS / 1000,
              },
            });
            notificationIdRef.current = id;
          } catch (e) {
            // Notification scheduling failed - not critical
          }
        }
      } else if (nextState === "active") {
        // Cancel pending notification when returning to foreground
        if (notificationIdRef.current) {
          try {
            await Notifications.cancelScheduledNotificationAsync(
              notificationIdRef.current
            );
          } catch (e) {
            // Cancellation failed - not critical
          }
          notificationIdRef.current = null;
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
      // Clean up any pending notification on unmount
      if (notificationIdRef.current) {
        Notifications.cancelScheduledNotificationAsync(
          notificationIdRef.current
        ).catch(() => {});
        notificationIdRef.current = null;
      }
    };
  }, [sessionReminderEnabled]);
}
