import React from "react";
import { Pressable, View, Text } from "react-native";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useTheme } from "../../utils/useTheme";
import { useSlowMode } from "../../utils/useSlowMode";
import * as Haptics from "expo-haptics";

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: "normal" | "large";
}

/**
 * CustomToggle - An improved toggle switch component for seniors
 *
 * Features:
 * - Always visible 2px border for clarity
 * - ON/OFF labels inside the track
 * - Larger touch target
 * - Haptic feedback
 * - Clear visual state indication
 */
export default function CustomToggle({
  value,
  onValueChange,
  disabled = false,
  size = "normal",
}: Props) {
  const { colors } = useTheme();
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const { enabled: slowMode } = useSlowMode();

  const isLarge = size === "large" || slowMode;
  const trackWidth = isLarge ? 80 : 72;
  const trackHeight = isLarge ? 36 : 32;
  const thumbSize = isLarge ? 28 : 24;
  const thumbOffset = isLarge ? 4 : 4;

  const handlePress = () => {
    if (disabled) return;
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onValueChange(!value);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={value ? "Toggle is on" : "Toggle is off"}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View
        style={{
          width: trackWidth,
          height: trackHeight,
          borderRadius: trackHeight / 2,
          backgroundColor: value ? colors.toggleTrackOn : colors.toggleTrackOff,
          justifyContent: "center",
          paddingHorizontal: thumbOffset,
          // Always show 2px border for visibility - darker when ON for contrast
          borderWidth: 2,
          borderColor: value ? colors.primaryDark : colors.border,
        }}
      >
        {/* ON/OFF labels inside track */}
        <View
          style={{
            position: "absolute",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            paddingHorizontal: 8,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: "700",
              color: value ? "white" : "transparent",
            }}
          >
            ON
          </Text>
          <Text
            style={{
              fontSize: 9,
              fontWeight: "700",
              color: value ? "transparent" : colors.textSecondary,
            }}
          >
            OFF
          </Text>
        </View>

        {/* Thumb */}
        <View
          style={{
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: colors.toggleThumb,
            alignSelf: value ? "flex-end" : "flex-start",
            // Shadow for depth
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 3,
          }}
        />
      </View>
    </Pressable>
  );
}
