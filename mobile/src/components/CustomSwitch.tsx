// CustomSwitch - Custom iOS-styled switch with perfect centering and proportions
// Enhanced for better contrast and WCAG AA compliance (4.5:1 minimum)
// Now uses theme colors for accessibility across all color schemes
import React, { useEffect } from "react";
import { Pressable, View, Text } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, interpolateColor } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  activeTrackColor?: string;
  inactiveTrackColor?: string;
  activeThumbColor?: string;
  inactiveThumbColor?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  showLabels?: boolean; // Optional ON/OFF labels for accessibility
}

export default function CustomSwitch({
  value,
  onValueChange,
  activeTrackColor,
  inactiveTrackColor,
  activeThumbColor,
  inactiveThumbColor,
  disabled = false,
  accessibilityLabel,
  showLabels = false,
}: CustomSwitchProps) {
  const { colors } = useTheme();
  const hapticEnabled = useSettingsStore(
    (s) => s.soundSettings?.hapticFeedbackEnabled ?? true
  );

  // Use theme colors with prop overrides
  const trackOnColor = activeTrackColor || colors.toggleTrackOn;
  const trackOffColor = inactiveTrackColor || colors.toggleTrackOff;
  const thumbOnColor = activeThumbColor || colors.toggleThumb;
  const thumbOffColor = inactiveThumbColor || colors.toggleThumb;

  // Get contrasting checkmark color for "on" state visibility
  const checkmarkColor = trackOnColor;

  const animatedValue = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    animatedValue.value = withSpring(value ? 1 : 0, {
      damping: 20,
      stiffness: 180,
    });
  }, [value, animatedValue]);

  const handlePress = () => {
    if (disabled) return;
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onValueChange(!value);
  };

  // iOS Switch dimensions: width: 51, height: 31
  const trackWidth = 51;
  const trackHeight = 31;
  const thumbSize = 27;
  const thumbPadding = 2;

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      animatedValue.value,
      [0, 1],
      [trackOffColor, trackOnColor]
    ),
    // More visible border - darker when OFF for contrast
    borderColor: interpolateColor(
      animatedValue.value,
      [0, 1],
      [colors.textTertiary, trackOnColor]
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(
        animatedValue.value,
        [0, 1],
        [thumbPadding, trackWidth - thumbSize - thumbPadding]
      ),
    }],
  }));

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {showLabels && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: value ? colors.textTertiary : colors.textPrimary,
            marginRight: 8,
          }}
        >
          OFF
        </Text>
      )}
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={
          value ? "Double tap to turn off" : "Double tap to turn on"
        }
        style={{
          opacity: disabled ? 0.5 : 1,
          // Minimum 48pt touch target for accessibility
          minWidth: 56,
          minHeight: 48,
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={[
            trackStyle,
            {
              width: trackWidth,
              height: trackHeight,
              borderRadius: trackHeight / 2,
              justifyContent: "center",
              // Thicker border for better visibility
              borderWidth: 2.5,
              // Add glow/shadow when ON for better visibility
              shadowColor: value ? trackOnColor : "transparent",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: value ? 0.5 : 0,
              shadowRadius: 6,
              elevation: value ? 3 : 0,
            }
          ]}
        >
          <Animated.View
            style={[
              thumbStyle,
              {
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
                backgroundColor: thumbOnColor,
                position: "absolute",
                // Enhanced shadow for depth
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 4,
                // Subtle border to thumb for better definition
                borderWidth: 0.5,
                borderColor: "rgba(0,0,0,0.1)",
                // Center the checkmark inside thumb
                justifyContent: "center",
                alignItems: "center",
              }
            ]}
          >
            {/* Checkmark icon when ON for better visibility */}
            {value && (
              <Ionicons name="checkmark" size={16} color={checkmarkColor} />
            )}
          </Animated.View>
        </Animated.View>
      </Pressable>
      {showLabels && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: value ? trackOnColor : colors.textTertiary,
            marginLeft: 8,
          }}
        >
          ON
        </Text>
      )}
    </View>
  );
}
