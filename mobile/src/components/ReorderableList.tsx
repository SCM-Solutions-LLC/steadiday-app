import React, { useCallback, useState, useEffect } from "react";
import { View, Pressable, AccessibilityInfo } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
  Layout,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "../state/stores/settingsStore";

// Animation configuration for reorder transitions
const REORDER_ANIMATION_CONFIG = {
  // Duration for non-dragged item shifts
  shiftDuration: 300,
  // Duration for settle animation after drop
  settleDuration: 180,
  // Easing function
  easing: Easing.inOut(Easing.ease),
};

// Animation configuration for add/remove
const ADD_REMOVE_ANIMATION_CONFIG = {
  // Add animation: fade in and scale from 0.98 to 1.0
  addDuration: 250,
  addScale: { from: 0.98, to: 1 },
  // Remove animation: fade out and scale from 1.0 to 0.98
  removeDuration: 220,
  removeScale: { from: 1, to: 0.98 },
};

interface ReorderableItemProps {
  children: React.ReactNode;
  index: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isEditing?: boolean;
  showReorderControls?: boolean;
  showRemoveControl?: boolean;
  renderMoveUpButton?: (props: { onPress: () => void; disabled: boolean }) => React.ReactNode;
  renderMoveDownButton?: (props: { onPress: () => void; disabled: boolean }) => React.ReactNode;
  renderRemoveButton?: (props: { onPress: () => void }) => React.ReactNode;
}

export function ReorderableItem({
  children,
  index,
  onMoveUp,
  onMoveDown,
  onRemove,
  isFirst = false,
  isLast = false,
  isEditing = false,
  showReorderControls = true,
  showRemoveControl = true,
  renderMoveUpButton,
  renderMoveDownButton,
  renderRemoveButton,
}: ReorderableItemProps) {
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  // Check system reduce motion setting
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setShouldReduceMotion(enabled);
    });
  }, []);

  // Animation values
  const scale = useSharedValue(1);
  const elevation = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  const handleMoveUp = useCallback(() => {
    if (onMoveUp && !isFirst) {
      triggerHaptic();

      if (!shouldReduceMotion) {
        // Briefly scale up to indicate the action
        scale.value = withSequence(
          withTiming(1.02, { duration: 100 }),
          withTiming(1, { duration: REORDER_ANIMATION_CONFIG.settleDuration })
        );
      }

      onMoveUp();
    }
  }, [onMoveUp, isFirst, triggerHaptic, shouldReduceMotion, scale]);

  const handleMoveDown = useCallback(() => {
    if (onMoveDown && !isLast) {
      triggerHaptic();

      if (!shouldReduceMotion) {
        // Briefly scale up to indicate the action
        scale.value = withSequence(
          withTiming(1.02, { duration: 100 }),
          withTiming(1, { duration: REORDER_ANIMATION_CONFIG.settleDuration })
        );
      }

      onMoveDown();
    }
  }, [onMoveDown, isLast, triggerHaptic, shouldReduceMotion, scale]);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      triggerHaptic();
      onRemove();
    }
  }, [onRemove, triggerHaptic]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: elevation.value * 0.15,
    shadowRadius: elevation.value * 4,
  }));

  // Layout animation configuration
  const layoutAnimation = shouldReduceMotion
    ? undefined
    : Layout.duration(REORDER_ANIMATION_CONFIG.shiftDuration).easing(REORDER_ANIMATION_CONFIG.easing);

  return (
    <Animated.View
      style={animatedStyle}
      layout={layoutAnimation}
    >
      {children}
    </Animated.View>
  );
}

interface AnimatedListItemProps {
  children: React.ReactNode;
  isNew?: boolean;
  isRemoving?: boolean;
  onRemoveComplete?: () => void;
}

export function AnimatedListItem({
  children,
  isNew = false,
  isRemoving = false,
  onRemoveComplete,
}: AnimatedListItemProps) {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setShouldReduceMotion(enabled);
    });
  }, []);

  // For add animations
  const enteringAnimation = shouldReduceMotion
    ? FadeIn.duration(150)
    : FadeIn.duration(ADD_REMOVE_ANIMATION_CONFIG.addDuration)
        .withInitialValues({ opacity: 0, transform: [{ scale: ADD_REMOVE_ANIMATION_CONFIG.addScale.from }] })
        .easing(Easing.out(Easing.ease));

  // For remove animations
  const exitingAnimation = shouldReduceMotion
    ? FadeOut.duration(150)
    : FadeOut.duration(ADD_REMOVE_ANIMATION_CONFIG.removeDuration)
        .withCallback((finished) => {
          "worklet";
          if (finished && onRemoveComplete) {
            runOnJS(onRemoveComplete)();
          }
        })
        .easing(Easing.in(Easing.ease));

  return (
    <Animated.View
      entering={isNew ? enteringAnimation : undefined}
      exiting={isRemoving ? exitingAnimation : undefined}
      layout={Layout.duration(REORDER_ANIMATION_CONFIG.shiftDuration).easing(REORDER_ANIMATION_CONFIG.easing)}
    >
      {children}
    </Animated.View>
  );
}

// Hook for managing reorderable list state with animations
export function useReorderableList<T extends { id: string }>(
  initialItems: T[],
  onReorder?: (items: T[]) => void
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);

  // Sync with external state changes
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const triggerHaptic = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticEnabled) {
      Haptics.impactAsync(style);
    }
  }, [hapticEnabled]);

  const moveUp = useCallback((index: number) => {
    if (index <= 0) return;

    triggerHaptic();

    setItems((prev) => {
      const newItems = [...prev];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      onReorder?.(newItems);
      return newItems;
    });
  }, [onReorder, triggerHaptic]);

  const moveDown = useCallback((index: number) => {
    setItems((prev) => {
      if (index >= prev.length - 1) return prev;

      triggerHaptic();

      const newItems = [...prev];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      onReorder?.(newItems);
      return newItems;
    });
  }, [onReorder, triggerHaptic]);

  const addItem = useCallback((item: T, atIndex?: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    setItems((prev) => {
      const newItems = [...prev];
      if (atIndex !== undefined) {
        newItems.splice(atIndex, 0, item);
      } else {
        newItems.push(item);
      }
      onReorder?.(newItems);
      return newItems;
    });
  }, [onReorder, triggerHaptic]);

  const removeItem = useCallback((index: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    setItems((prev) => {
      const newItems = prev.filter((_, i) => i !== index);
      onReorder?.(newItems);
      return newItems;
    });
  }, [onReorder, triggerHaptic]);

  return {
    items,
    setItems,
    moveUp,
    moveDown,
    addItem,
    removeItem,
  };
}

export { REORDER_ANIMATION_CONFIG, ADD_REMOVE_ANIMATION_CONFIG };
