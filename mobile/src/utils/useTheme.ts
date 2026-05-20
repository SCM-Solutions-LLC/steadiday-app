import { useSettingsStore } from "../state/stores/settingsStore";
import { getThemeColors } from "./colorThemes";
import { useEffect, useState } from "react";
import { Appearance } from "react-native";

/**
 * Custom hook to get the current theme colors
 * Use this hook to access theme-aware colors throughout the app
 * Automatically responds to system appearance changes when in "system" mode
 */
export function useTheme() {
  // Settings from useSettingsStore (flat state)
  const colorTheme = useSettingsStore((s) => s.colorTheme) || "blue";
  const appearanceMode = useSettingsStore((s) => s.appearanceMode) || "light";
  const highContrastEnabled = useSettingsStore((s) => s.highContrastEnabled) || false;
  const colorBlindModeEnabled = useSettingsStore((s) => s.colorBlindModeEnabled) || false;

  // Track system color scheme for "system" mode
  // Initialize with current scheme, defaulting to "light" if null
  const [systemColorScheme, setSystemColorScheme] = useState<"light" | "dark">(() => {
    const scheme = Appearance.getColorScheme();
    return scheme || "light";
  });

  useEffect(() => {
    // Always get current scheme on mount to ensure we have the latest
    const currentScheme = Appearance.getColorScheme();
    if (currentScheme) {
      setSystemColorScheme(currentScheme);
    }

    if (appearanceMode === "system") {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setSystemColorScheme(colorScheme || "light");
      });

      return () => subscription.remove();
    }
  }, [appearanceMode]);

  // Determine accessibility mode
  const accessibilityMode = highContrastEnabled
    ? "high-contrast"
    : colorBlindModeEnabled
    ? "color-blind-friendly"
    : "default";

  // When in "system" mode, use the actual system color scheme for theme colors
  const effectiveAppearanceMode = appearanceMode === "system" ? systemColorScheme : appearanceMode;

  const colors = getThemeColors(colorTheme, effectiveAppearanceMode, accessibilityMode);

  // Determine if we're in dark mode (respects accessibility modes)
  const isDark =
    appearanceMode === "dark" || (appearanceMode === "system" && systemColorScheme === "dark");

  return {
    theme: colorTheme,
    colors,
    isDark,
    appearanceMode,
    accessibilityMode,
    // Convenience properties for direct access
    primary: colors.primary,
    primaryLight: colors.primaryLight,
    primaryDark: colors.primaryDark,
    onPrimary: colors.onPrimary, // NEW: Theme-aware button text color
    background: colors.background,
    cardBackground: colors.cardBackground,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
  };
}
