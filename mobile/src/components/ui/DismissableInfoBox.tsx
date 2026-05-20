import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useTheme } from "../../utils/useTheme";

interface DismissableInfoBoxProps {
  /** Unique ID to remember dismissal state */
  id: string;
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icon color */
  iconColor?: string;
  /** Background color for light mode */
  lightBgColor?: string;
  /** Background color for dark mode */
  darkBgColor?: string;
  /** Border color for light mode */
  lightBorderColor?: string;
  /** Border color for dark mode */
  darkBorderColor?: string;
  /** Optional title */
  title?: string;
  /** Message content (required) */
  message: string;
  /** If true, stays dismissed forever (persisted to storage) */
  permanent?: boolean;
}

/**
 * DismissableInfoBox - An info box that users can dismiss
 *
 * Uses AsyncStorage to remember dismissal state when permanent=true.
 * Renders null if previously dismissed.
 */
export default function DismissableInfoBox({
  id,
  icon = "information-circle",
  iconColor = "#3B82F6",
  lightBgColor = "#EFF6FF",
  darkBgColor,
  lightBorderColor = "#BFDBFE",
  darkBorderColor,
  title,
  message,
  permanent = true,
}: DismissableInfoBoxProps) {
  const { colors, isDark } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Determine colors based on theme
  const backgroundColor = isDark
    ? (darkBgColor || colors.cardBackground)
    : lightBgColor;
  const borderColor = isDark
    ? (darkBorderColor || colors.border)
    : lightBorderColor;

  // Check if previously dismissed
  useEffect(() => {
    const checkDismissed = async () => {
      if (permanent) {
        try {
          const value = await AsyncStorage.getItem(`dismissed_info_${id}`);
          setDismissed(value === "true");
        } catch (error) {
          // Silently fail - show the info box if we can't read storage
        }
      }
      setLoaded(true);
    };
    checkDismissed();
  }, [id, permanent]);

  const handleDismiss = async () => {
    setDismissed(true);
    if (permanent) {
      try {
        await AsyncStorage.setItem(`dismissed_info_${id}`, "true");
      } catch (error) {
        // Silently fail - info box is already hidden in UI
      }
    }
  };

  // Don't render until we've checked storage, or if dismissed
  if (!loaded || dismissed) {
    return null;
  }

  return (
    <View
      className="rounded-xl p-4 mb-4"
      style={{
        backgroundColor,
        borderWidth: 1,
        borderColor,
      }}
    >
      <View className="flex-row items-start">
        <Ionicons name={icon} size={22} color={iconColor} style={{ marginTop: 2 }} />
        <View className="flex-1 ml-3">
          {title && (
            <Text
              className={`${textClasses.body} font-semibold mb-1`}
              style={{ color: iconColor }}
            >
              {title}
            </Text>
          )}
          <Text
            className={`${textClasses.small} leading-relaxed`}
            style={{ color: colors.textSecondary }}
          >
            {message}
          </Text>
        </View>
        <Pressable
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="ml-2 p-1"
          accessibilityRole="button"
          accessibilityLabel="Dismiss info box"
        >
          <Ionicons name="close" size={20} color={colors.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Utility to reset a specific info box dismissal (useful for testing)
 */
export async function resetInfoBoxDismissal(id: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`dismissed_info_${id}`);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Utility to reset all info box dismissals (useful for testing)
 */
export async function resetAllInfoBoxDismissals(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const infoBoxKeys = keys.filter(key => key.startsWith("dismissed_info_"));
    if (infoBoxKeys.length > 0) {
      await AsyncStorage.multiRemove(infoBoxKeys);
    }
  } catch (error) {
    // Silently fail
  }
}
