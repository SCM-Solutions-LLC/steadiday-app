import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useTipStore } from "../../state/stores/tipStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useTheme } from "../../utils/useTheme";
import * as Haptics from "expo-haptics";

interface Props {
  tipId: string;
  title: string;
  message: string;
  position?: "top" | "bottom";
  arrowDirection?: "up" | "down" | "left" | "right" | "none";
  onDismiss?: () => void;
}

/**
 * AnimatedTip - Animated guidance tip for seniors
 *
 * Features:
 * - Slow 800ms animations (seniors need more time to process)
 * - Pulsing card effect to draw attention
 * - Bouncing arrow pointing to relevant UI
 * - "Got It" and "Don't Show Again" options
 * - Integrates with tipStore for state management
 */
export default function AnimatedTip({
  tipId,
  title,
  message,
  position = "bottom",
  arrowDirection = "down",
  onDismiss,
}: Props) {
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);
  const { colors, primary, primaryLight } = useTheme();

  const currentTip = useTipStore((s) => s.currentTip);
  const dismissCurrentTip = useTipStore((s) => s.dismissCurrentTip);
  const tipsEnabled = useTipStore((s) => s.tipsEnabled);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isVisible = currentTip === tipId && tipsEnabled;

  useEffect(() => {
    if (isVisible) {
      // Fade in (slow for seniors)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Bouncing arrow animation (slow 800ms for seniors)
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Gentle pulse animation for the card
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isVisible, fadeAnim, bounceAnim, pulseAnim]);

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleDismiss = () => {
    triggerHaptic();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dismissCurrentTip();
      onDismiss?.();
    });
  };

  const handleDontShowAgain = () => {
    triggerHaptic();
    handleDismiss();
    // Tip is automatically marked as seen when dismissed via dismissCurrentTip
  };

  if (!isVisible) return null;

  const getArrowRotation = () => {
    switch (arrowDirection) {
      case "up":
        return "0deg";
      case "down":
        return "180deg";
      case "left":
        return "-90deg";
      case "right":
        return "90deg";
      default:
        return "0deg";
    }
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        opacity: fadeAnim,
        transform: [{ scale: pulseAnim }],
        position: "absolute",
        [position]: 100,
        left: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      {/* Bouncing Arrow */}
      {arrowDirection !== "none" && (
        <Animated.View
          style={{
            transform: [
              { translateY: bounceAnim },
              { rotate: getArrowRotation() },
            ],
            alignSelf: "center",
            marginBottom: arrowDirection === "down" ? 0 : 8,
            marginTop: arrowDirection === "up" ? 0 : 8,
          }}
        >
          <Ionicons name="arrow-up" size={32} color={primary} />
        </Animated.View>
      )}

      {/* Tip Card */}
      <View
        pointerEvents="auto"
        className="rounded-2xl p-5"
        style={{
          backgroundColor: colors.cardBackground,
          borderWidth: 2,
          borderColor: primary,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View className="flex-row items-start mb-3">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: primaryLight }}
          >
            <Ionicons name="bulb" size={22} color={primary} />
          </View>
          <View className="flex-1">
            <Text
              className={`${textClasses.subtitle} font-bold mb-1`}
              style={{ color: colors.textPrimary }}
            >
              {title}
            </Text>
            <Text
              className={`${textClasses.body}`}
              style={{ color: colors.textSecondary, lineHeight: 24 }}
            >
              {message}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View className="flex-row justify-end mt-2">
          <Pressable
            onPress={handleDontShowAgain}
            className="px-4 py-2 mr-3"
            accessibilityRole="button"
            accessibilityLabel="Don't show this tip again"
          >
            <Text
              className={`${textClasses.body}`}
              style={{ color: colors.textSecondary }}
            >
              {"Don't Show Again"}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleDismiss}
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: primary, minHeight: 48 }}
            accessibilityRole="button"
            accessibilityLabel="Got it, dismiss tip"
          >
            <Text
              className={`${textClasses.body} font-semibold text-white`}
            >
              Got It
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
