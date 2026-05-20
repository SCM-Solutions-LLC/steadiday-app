import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTipStore } from "../state/stores/tipStore";
import { useUserStore } from "../state/stores/userStore";
import { useTheme } from "../utils/useTheme";
import { useReduceMotion } from "../utils/useReduceMotion";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

interface UsageTipProps {
  tipId: string;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  position?: "top" | "bottom";
  delay?: number;
}

/**
 * UsageTip - An animated tooltip that appears once per screen after onboarding
 * Shows a gentle slide-in animation and can be dismissed by tapping
 */
export default function UsageTip({
  tipId,
  title,
  message,
  icon = "bulb",
  iconColor,
  position = "top",
  delay = 500,
}: UsageTipProps) {
  const { colors, primary } = useTheme();
  const resolvedIconColor = iconColor || primary;

  // Tip state from useTipStore
  const hasSeenTooltip = useTipStore((s) => s.hasSeenTooltip);
  const markTooltipAsShown = useTipStore((s) => s.markTooltipAsShown);

  // User state from useUserStore
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);

  // System reduce motion setting
  const reduceMotionEnabled = useReduceMotion();

  const [isVisible, setIsVisible] = useState(false);

  // Animation values
  const translateY = useSharedValue(position === "top" ? -100 : 100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  // Check if tip should be shown
  useEffect(() => {
    if (hasCompletedOnboarding && !hasSeenTooltip(tipId)) {
      setIsVisible(true);

      // Animate in after delay
      const animationDelay = reduceMotionEnabled ? 0 : delay;
      const animationDuration = reduceMotionEnabled ? 0 : 400;

      translateY.value = withDelay(
        animationDelay,
        withTiming(0, { duration: animationDuration, easing: Easing.out(Easing.back(1.2)) })
      );
      opacity.value = withDelay(
        animationDelay,
        withTiming(1, { duration: animationDuration })
      );
      scale.value = withDelay(
        animationDelay,
        withTiming(1, { duration: animationDuration, easing: Easing.out(Easing.back(1.2)) })
      );
    }
  }, [hasCompletedOnboarding, tipId]);

  const handleDismiss = () => {
    const animationDuration = reduceMotionEnabled ? 0 : 300;

    translateY.value = withTiming(
      position === "top" ? -100 : 100,
      { duration: animationDuration },
      () => {
        runOnJS(setIsVisible)(false);
      }
    );
    opacity.value = withTiming(0, { duration: animationDuration });
    scale.value = withTiming(0.9, { duration: animationDuration });

    markTooltipAsShown(tipId);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!isVisible) return null;

  return (
    <View
      className={`absolute left-4 right-4 z-50 ${
        position === "top" ? "top-4" : "bottom-24"
      }`}
      pointerEvents="box-none"
    >
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handleDismiss}
          className="rounded-2xl p-4 shadow-2xl"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View className="flex-row items-start">
            {/* Icon */}
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: `${resolvedIconColor}15` }}
            >
              <Ionicons name={icon} size={20} color={resolvedIconColor} />
            </View>

            {/* Content */}
            <View className="flex-1 mr-2">
              <Text className="text-base font-semibold mb-1" style={{ color: colors.textPrimary }}>
                {title}
              </Text>
              <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
                {message}
              </Text>
            </View>

            {/* Close button */}
            <Pressable
              onPress={handleDismiss}
              className="w-10 h-10 rounded-full items-center justify-center"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Dismiss tip"
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Tap to dismiss hint */}
          <Text className="text-xs text-center mt-3" style={{ color: colors.textSecondary }}>
            Tap anywhere to dismiss
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
