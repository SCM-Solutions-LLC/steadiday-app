import React, { useCallback } from "react";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";

interface PrivacyFooterLinkProps {
  /**
   * Custom text to display
   * @default "Your data stays on your device"
   */
  text?: string;
  /**
   * Whether to show the lock icon
   * @default true
   */
  showIcon?: boolean;
  /**
   * Custom style for the container
   */
  style?: object;
}

/**
 * PrivacyFooterLink - A subtle, tappable privacy reassurance link
 *
 * Navigates to Security settings when tapped.
 *
 * Usage:
 * Place at the bottom of screens that handle sensitive data like:
 * - Health records
 * - Medications
 * - Personal information
 * - Settings pages
 */
export default function PrivacyFooterLink({
  text = "Your data stays on your device",
  showIcon = true,
  style,
}: PrivacyFooterLinkProps) {
  const navigation = useNavigation();
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const textClasses = getTextSizeClasses(textSize);

  const handlePress = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Navigate to Security settings
    (navigation as any).navigate("Settings", { screen: "Security" });
  }, [hapticEnabled, navigation]);

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center justify-center py-4 active:opacity-60"
      style={style}
      accessibilityRole="link"
      accessibilityLabel={`${text}. Tap to learn more about privacy settings.`}
    >
      {showIcon && (
        <Ionicons
          name="lock-closed-outline"
          size={14}
          color={colors.textTertiary}
          style={{ marginRight: 6 }}
        />
      )}
      <Text
        className={`${textClasses.small}`}
        style={{ color: colors.textTertiary }}
      >
        {text}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={12}
        color={colors.textTertiary}
        style={{ marginLeft: 4 }}
      />
    </Pressable>
  );
}
