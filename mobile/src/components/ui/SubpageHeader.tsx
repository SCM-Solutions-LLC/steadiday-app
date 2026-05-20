import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../utils/useTheme";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import * as Haptics from "expo-haptics";
import { BackButton } from "./BackButton";

/**
 * SubpageHeader - Consistent header for all subpages with labeled back button
 *
 * SENIOR-FRIENDLY: Clear back navigation showing where the user will return to
 *
 * Example usage:
 * <SubpageHeader
 *   title="Notification Settings"
 *   backLabel="Settings"
 *   onBack={() => navigation.goBack()}
 * />
 */

interface SubpageHeaderProps {
  /** Title of the current screen */
  title: string;
  /** Label showing where back button leads (e.g., "Settings", "Tools", "Health") */
  backLabel: string;
  /** Callback when back button is pressed */
  onBack: () => void;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Optional right side action button */
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    accessibilityLabel: string;
  };
}

export default function SubpageHeader({
  title,
  backLabel,
  onBack,
  subtitle,
  rightAction,
}: SubpageHeaderProps) {
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);

  return (
    <View className="px-6 pt-4 pb-5">
      {/* Back Button Row - SENIOR-FRIENDLY: Large touch target with clear label */}
      <View className="flex-row items-center justify-between mb-4">
        <BackButton label={backLabel} onPress={onBack} />

        {/* Optional Right Action */}
        {rightAction && (
          <Pressable
            onPress={() => {
              if (hapticEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              rightAction.onPress();
            }}
            className="p-2 -mr-2 active:opacity-60"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={rightAction.accessibilityLabel}
            style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name={rightAction.icon} size={26} color={primary} />
          </Pressable>
        )}
      </View>

      {/* Title */}
      <Text
        className={`${textClasses.largeTitle} font-bold`}
        style={{ color: colors.textPrimary }}
      >
        {title}
      </Text>

      {/* Optional Subtitle */}
      {subtitle && (
        <Text
          className={`${textClasses.body} mt-1`}
          style={{ color: colors.textSecondary }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
