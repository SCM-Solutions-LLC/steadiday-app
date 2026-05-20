import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../utils/useTheme";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useTipStore } from "../../state/stores/tipStore";

interface AnimatedGuideTipProps {
  tipId: string;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onDismiss?: () => void;
  /**
   * Position of the arrow - where to point
   * - "down": Arrow points down (default)
   * - "up-right": Arrow points to top right corner (for edit buttons)
   * - "none": No arrow
   */
  arrowPosition?: "down" | "up-right" | "none";
  /**
   * Vertical position of the tip card
   * - "center": Center of screen (default)
   * - "top": Near top of screen
   */
  cardPosition?: "center" | "top";
}

/**
 * AnimatedGuideTip - Full-screen animated guide for important features
 * Uses absolute positioning instead of Modal to avoid touch blocking issues
 */
export default function AnimatedGuideTip({
  tipId,
  title,
  message,
  icon = "information-circle",
  onDismiss,
  arrowPosition = "down",
  cardPosition = "center",
}: AnimatedGuideTipProps) {
  const { colors, primary, primaryLight } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;

  // Tip store - use primitive selector to avoid re-renders
  const hasBeenSeen = useTipStore((s) => s.seenTips.includes(tipId));
  const dismissTip = useTipStore((s) => s.dismissTip);
  const tipsEnabled = useTipStore((s) => s.tipsEnabled);
  const tipsCompleted = useTipStore((s) => s.tipsCompleted);

  // Local visibility state
  const [isVisible, setIsVisible] = useState(false);

  // Animations
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.9);
  const pulseAnim = useSharedValue(1);
  const bounceAnim = useSharedValue(0);

  // Show tip on mount if not seen
  useEffect(() => {
    if (tipsEnabled && !hasBeenSeen && !tipsCompleted) {
      setIsVisible(true);

      fadeAnim.value = withTiming(1, { duration: 400 });
      scaleAnim.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.2)) });

      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      const bounceDir = arrowPosition === "up-right" ? -8 : 8;
      bounceAnim.value = withRepeat(
        withSequence(
          withTiming(bounceDir, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      if (hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Immediately hide and persist dismissal
    setIsVisible(false);
    dismissTip(tipId);
    onDismiss?.();
  }, [hapticEnabled, dismissTip, tipId, onDismiss]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceAnim.value }],
  }));

  if (!isVisible) return null;

  const containerJustify = cardPosition === "top" ? "flex-start" : "center";
  const containerPaddingTop = cardPosition === "top" ? 120 : 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Tappable overlay */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handleDismiss}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.6)" },
            overlayStyle,
          ]}
        />
      </Pressable>

      {/* Content container */}
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          justifyContent: containerJustify,
          alignItems: "center",
          paddingHorizontal: 24,
          paddingTop: containerPaddingTop,
        }}
        pointerEvents="box-none"
      >
        {/* Arrow pointing up-right */}
        {arrowPosition === "up-right" && (
          <Animated.View
            style={[
              {
                alignSelf: "flex-end",
                marginRight: 24,
                marginBottom: 12,
              },
              arrowStyle,
            ]}
          >
            <Ionicons
              name="arrow-up"
              size={32}
              color={primary}
              style={{ transform: [{ rotate: "45deg" }] }}
            />
          </Animated.View>
        )}

        {/* Card */}
        <Animated.View
          style={[
            {
              backgroundColor: colors.cardBackground,
              borderRadius: 24,
              padding: 32,
              maxWidth: 360,
              width: "100%",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 12,
            },
            cardStyle,
          ]}
        >
          {/* Icon */}
          <Animated.View
            style={[
              {
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: primaryLight,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 24,
              },
              iconStyle,
            ]}
          >
            <Ionicons name={icon} size={40} color={primary} />
          </Animated.View>

          {/* Title */}
          <Text
            style={{
              fontSize: textSize === "extra-large" ? 24 : textSize === "large" ? 22 : 20,
              fontWeight: "700",
              color: colors.textPrimary,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {title}
          </Text>

          {/* Message */}
          <Text
            style={{
              fontSize: textSize === "extra-large" ? 18 : textSize === "large" ? 17 : 16,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: textSize === "extra-large" ? 28 : 24,
              marginBottom: 32,
            }}
          >
            {message}
          </Text>

          {/* Button */}
          <Pressable
            onPress={handleDismiss}
            style={{
              backgroundColor: primary,
              paddingVertical: 16,
              paddingHorizontal: 48,
              borderRadius: 16,
              minHeight: 56,
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: textSize === "extra-large" ? 20 : 18,
                fontWeight: "600",
              }}
            >
              Got It
            </Text>
          </Pressable>
        </Animated.View>

        {/* Arrow pointing down */}
        {arrowPosition === "down" && (
          <Animated.View style={[{ marginTop: 16 }, arrowStyle]}>
            <Ionicons name="arrow-down" size={28} color={primary} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}
