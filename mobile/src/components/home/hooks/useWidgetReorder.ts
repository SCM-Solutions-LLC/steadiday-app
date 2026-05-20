import { useState, useCallback } from "react";
import { AccessibilityInfo } from "react-native";
import * as Haptics from "expo-haptics";
import type { HomeScreenWidget } from "../../../types/app";
import { WIDGET_OPTIONS } from "../types";

interface UseWidgetReorderOptions {
  widgets: HomeScreenWidget[];
  onReorder: (widgets: HomeScreenWidget[]) => void;
  shouldReduceMotion: boolean;
  hapticEnabled: boolean;
}

export function useWidgetReorder({
  widgets,
  onReorder,
  shouldReduceMotion,
  hapticEnabled,
}: UseWidgetReorderOptions) {
  const [movingWidgetIndex, setMovingWidgetIndex] = useState<number | null>(null);

  const moveWidgetUp = useCallback(
    (index: number) => {
      if (index <= 0) return;

      if (hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setMovingWidgetIndex(index);

      const newOrder = [...widgets];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      onReorder(newOrder);

      const widget = WIDGET_OPTIONS.find((w) => w.value === widgets[index]);
      if (widget) {
        AccessibilityInfo.announceForAccessibility(
          `${widget.label} moved up to position ${index}`
        );
      }

      setTimeout(
        () => {
          setMovingWidgetIndex(null);
          if (hapticEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
        shouldReduceMotion ? 100 : 600
      );
    },
    [widgets, onReorder, hapticEnabled, shouldReduceMotion]
  );

  const moveWidgetDown = useCallback(
    (index: number) => {
      if (index >= widgets.length - 1) return;

      if (hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setMovingWidgetIndex(index);

      const newOrder = [...widgets];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      onReorder(newOrder);

      const widget = WIDGET_OPTIONS.find((w) => w.value === widgets[index]);
      if (widget) {
        AccessibilityInfo.announceForAccessibility(
          `${widget.label} moved down to position ${index + 2}`
        );
      }

      setTimeout(
        () => {
          setMovingWidgetIndex(null);
          if (hapticEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
        shouldReduceMotion ? 100 : 600
      );
    },
    [widgets, onReorder, hapticEnabled, shouldReduceMotion]
  );

  return {
    movingWidgetIndex,
    moveWidgetUp,
    moveWidgetDown,
  };
}
