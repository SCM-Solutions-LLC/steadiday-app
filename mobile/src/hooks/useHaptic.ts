import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "../state/stores/settingsStore";

// Re-export haptic styles for convenience
export const HapticStyle = Haptics.ImpactFeedbackStyle;
export const NotificationType = Haptics.NotificationFeedbackType;

/**
 * Custom hook for triggering haptic feedback
 * Respects user's haptic feedback preference from settings
 */
export function useHaptic() {
  const hapticEnabled = useSettingsStore(
    (s) => s.soundSettings?.hapticFeedbackEnabled ?? true
  );

  /**
   * Trigger impact haptic feedback
   * @param style - The impact feedback style (Light, Medium, Heavy)
   */
  const triggerHaptic = useCallback(
    (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
      if (hapticEnabled) {
        Haptics.impactAsync(style);
      }
    },
    [hapticEnabled]
  );

  /**
   * Trigger notification haptic feedback
   * @param type - The notification feedback type (Success, Warning, Error)
   */
  const triggerNotification = useCallback(
    (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
      if (hapticEnabled) {
        Haptics.notificationAsync(type);
      }
    },
    [hapticEnabled]
  );

  /**
   * Trigger selection changed haptic feedback
   */
  const triggerSelection = useCallback(() => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
  }, [hapticEnabled]);

  return {
    triggerHaptic,
    triggerNotification,
    triggerSelection,
    hapticEnabled,
  };
}
