import { useSettingsStore } from "../state/stores/settingsStore";

/**
 * Slow Mode Configuration
 *
 * When Slow Mode is enabled (default for new users):
 * - Primary button heights: 64px (vs 48px normally)
 * - Secondary button heights: 56px (vs 40px normally)
 * - Animation durations: ~60% slower
 * - Toast durations: ~60% longer
 * - Larger touch targets and extra padding around interactive elements
 */

// Animation duration multiplier when Slow Mode is enabled
const SLOW_MODE_DURATION_MULTIPLIER = 1.6;

// Toast duration multiplier when Slow Mode is enabled
const SLOW_MODE_TOAST_MULTIPLIER = 1.6;

// Button heights
const BUTTON_HEIGHTS = {
  primary: {
    normal: 48,
    slow: 64,
  },
  secondary: {
    normal: 40,
    slow: 56,
  },
  touch: {
    normal: 44,
    slow: 56,
  },
};

// Extra spacing (in px) added around interactive elements when Slow Mode is on
const EXTRA_PADDING = {
  normal: 0,
  slow: 8,
};

// Text size boost (in px) applied to key labels when Slow Mode is on
const TEXT_SIZE_BOOST = {
  normal: 0,
  slow: 2,
};

// Animation durations (in ms)
const ANIMATION_DURATIONS = {
  fast: {
    normal: 150,
    slow: 200,
  },
  normal: {
    normal: 250,
    slow: 325,
  },
  slow: {
    normal: 350,
    slow: 455,
  },
};

// Toast durations (in ms)
const TOAST_DURATIONS = {
  short: {
    normal: 2000,
    slow: 2600,
  },
  normal: {
    normal: 3000,
    slow: 3900,
  },
  long: {
    normal: 5000,
    slow: 6500,
  },
};

export interface SlowModeConfig {
  enabled: boolean;
  // Button heights
  primaryButtonHeight: number;
  secondaryButtonHeight: number;
  minTouchTarget: number;
  // Spacing & sizing
  extraPadding: number;
  textSizeBoost: number;
  // Animation durations
  animationFast: number;
  animationNormal: number;
  animationSlow: number;
  // Toast durations
  toastShort: number;
  toastNormal: number;
  toastLong: number;
  // Utility functions
  getAnimationDuration: (baseDuration: number) => number;
  getToastDuration: (baseDuration: number) => number;
}

/**
 * Hook to get Slow Mode configuration values
 *
 * Usage:
 * const { primaryButtonHeight, getAnimationDuration } = useSlowMode();
 *
 * // Use in styles
 * style={{ minHeight: primaryButtonHeight }}
 *
 * // Use for animations
 * withTiming(1, { duration: getAnimationDuration(200) })
 */
export function useSlowMode(): SlowModeConfig {
  const slowModeEnabled = useSettingsStore((s) => s.slowModeEnabled) ?? true;

  const mode = slowModeEnabled ? "slow" : "normal";

  return {
    enabled: slowModeEnabled,
    // Button heights
    primaryButtonHeight: BUTTON_HEIGHTS.primary[mode],
    secondaryButtonHeight: BUTTON_HEIGHTS.secondary[mode],
    minTouchTarget: BUTTON_HEIGHTS.touch[mode],
    // Spacing & sizing
    extraPadding: EXTRA_PADDING[mode],
    textSizeBoost: TEXT_SIZE_BOOST[mode],
    // Animation durations
    animationFast: ANIMATION_DURATIONS.fast[mode],
    animationNormal: ANIMATION_DURATIONS.normal[mode],
    animationSlow: ANIMATION_DURATIONS.slow[mode],
    // Toast durations
    toastShort: TOAST_DURATIONS.short[mode],
    toastNormal: TOAST_DURATIONS.normal[mode],
    toastLong: TOAST_DURATIONS.long[mode],
    // Utility functions
    getAnimationDuration: (baseDuration: number) =>
      slowModeEnabled ? Math.round(baseDuration * SLOW_MODE_DURATION_MULTIPLIER) : baseDuration,
    getToastDuration: (baseDuration: number) =>
      slowModeEnabled ? Math.round(baseDuration * SLOW_MODE_TOAST_MULTIPLIER) : baseDuration,
  };
}

/**
 * Get Slow Mode values without hooks (for use outside React components)
 * Note: This reads directly from the store, so it will get the current value
 * but won't trigger re-renders when the setting changes.
 */
export function getSlowModeConfig(): SlowModeConfig {
  const slowModeEnabled = useSettingsStore.getState().slowModeEnabled ?? true;

  const mode = slowModeEnabled ? "slow" : "normal";

  return {
    enabled: slowModeEnabled,
    primaryButtonHeight: BUTTON_HEIGHTS.primary[mode],
    secondaryButtonHeight: BUTTON_HEIGHTS.secondary[mode],
    minTouchTarget: BUTTON_HEIGHTS.touch[mode],
    extraPadding: EXTRA_PADDING[mode],
    textSizeBoost: TEXT_SIZE_BOOST[mode],
    animationFast: ANIMATION_DURATIONS.fast[mode],
    animationNormal: ANIMATION_DURATIONS.normal[mode],
    animationSlow: ANIMATION_DURATIONS.slow[mode],
    toastShort: TOAST_DURATIONS.short[mode],
    toastNormal: TOAST_DURATIONS.normal[mode],
    toastLong: TOAST_DURATIONS.long[mode],
    getAnimationDuration: (baseDuration: number) =>
      slowModeEnabled ? Math.round(baseDuration * SLOW_MODE_DURATION_MULTIPLIER) : baseDuration,
    getToastDuration: (baseDuration: number) =>
      slowModeEnabled ? Math.round(baseDuration * SLOW_MODE_TOAST_MULTIPLIER) : baseDuration,
  };
}

// Export constants for direct use where needed
export {
  SLOW_MODE_DURATION_MULTIPLIER,
  SLOW_MODE_TOAST_MULTIPLIER,
  BUTTON_HEIGHTS,
  ANIMATION_DURATIONS,
  TOAST_DURATIONS,
};
