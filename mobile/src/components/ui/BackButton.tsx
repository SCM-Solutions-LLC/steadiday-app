import React from "react";
import { Pressable, Text, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../utils/useTheme";
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "../../state/stores/settingsStore";

/**
 * BackButton - iOS native-style back button matching the native navigation header
 *
 * SENIOR-FRIENDLY: Clear back navigation with large touch target
 *
 * Visual Specs (iOS Native Style):
 * - Blue tinted chevron icon (chevron-back) + label text
 * - No background - matches iOS native back button
 * - Press feedback: opacity change
 * - Color: iOS system blue (tint color)
 *
 * Example usage:
 * <BackButton label="Tools" />
 * <BackButton label="Settings" onPress={() => navigation.navigate("Settings")} />
 */

interface BackButtonProps {
  /** The text to display (e.g., "Tools", "Settings") */
  label: string;
  /** Optional custom press handler (defaults to navigation.goBack) */
  onPress?: () => void;
  /** Optional additional styles for the container */
  style?: ViewStyle;
}

export function BackButton({ label, onPress, style }: BackButtonProps) {
  const navigation = useNavigation();
  const { primary } = useTheme();
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;

  const handlePress = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  // iOS native back button uses the tint/primary color
  const tintColor = primary;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Go back to ${label}`}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          opacity: pressed ? 0.5 : 1,
          paddingVertical: 8,
          paddingRight: 8,
          marginLeft: -4,
        },
        style,
      ]}
    >
      <Ionicons name="chevron-back" size={28} color={tintColor} />
      <Text
        style={{
          fontSize: 17,
          fontWeight: "400",
          color: tintColor,
          marginLeft: -2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default BackButton;
