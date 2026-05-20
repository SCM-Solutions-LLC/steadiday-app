import { useState, useEffect } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Hook to check if animations should be reduced for accessibility
 * Returns true if the iOS system Reduce Motion setting is enabled
 *
 * Note: This respects the iOS system setting only. The app does not have
 * its own Reduce Motion toggle - users should adjust this in iOS Settings.
 */
export function useReduceMotion(): boolean {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    // Check initial value
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotionEnabled);

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotionEnabled
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return reduceMotionEnabled;
}

/**
 * Get animation duration based on reduce motion setting
 * @param normalDuration - Normal animation duration in ms
 * @param reducedDuration - Reduced animation duration in ms (default: 0 for instant)
 * @returns The appropriate duration
 */
export function useAnimationDuration(normalDuration: number, reducedDuration: number = 0): number {
  const shouldReduce = useReduceMotion();
  return shouldReduce ? reducedDuration : normalDuration;
}
