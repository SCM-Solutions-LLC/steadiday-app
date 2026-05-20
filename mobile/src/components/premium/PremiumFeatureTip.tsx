import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useSubscriptionStore } from "../../state/stores/subscriptionStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useTheme } from "../../utils/useTheme";
import { getFeatureConfig } from "../../config/featureAccess";
import * as Haptics from "expo-haptics";

interface Props {
  featureId: string;
  position?: "top" | "bottom";
  onDismiss?: () => void;
}

export default function PremiumFeatureTip({
  featureId,
  position = "bottom",
  onDismiss,
}: Props) {
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);
  const hasSeenFeatureTip = useSubscriptionStore((s) => s.hasSeenFeatureTip);
  const markFeatureTipSeen = useSubscriptionStore((s) => s.markFeatureTipSeen);
  const textClasses = getTextSizeClasses(textSize);
  const { colors, primary, primaryLight } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const feature = getFeatureConfig(featureId);
  const hasSeenTip = hasSeenFeatureTip(featureId);

  // Only show for premium users who haven't seen this tip
  const shouldShow = isPremiumUnlocked && !hasSeenTip && feature?.premiumTip;

  useEffect(() => {
    if (shouldShow) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Trigger subtle haptic
      if (hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [shouldShow, hapticEnabled]);

  const handleDismiss = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      markFeatureTipSeen(featureId);
      onDismiss?.();
    });
  };

  if (!shouldShow || !feature) {
    return null;
  }

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        position: "absolute",
        left: 16,
        right: 16,
        [position]: 16,
        zIndex: 100,
      }}
    >
      <View
        className="rounded-2xl p-4 flex-row items-start"
        style={{
          backgroundColor: colors.premiumLight,
          borderWidth: 2,
          borderColor: colors.premium,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: colors.premium }}
        >
          <Ionicons name="sparkles" size={20} color={colors.onPremium} />
        </View>
        <View className="flex-1">
          <Text
            className={`${textClasses.small} font-semibold mb-1`}
            style={{ color: colors.onWarning }}
          >
            Premium Feature
          </Text>
          <Text
            className={`${textClasses.body}`}
            style={{ color: colors.premiumDark }}
          >
            {feature.premiumTip}
          </Text>
        </View>
        <Pressable
          onPress={handleDismiss}
          className="p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss tip"
        >
          <Ionicons name="close" size={20} color={colors.onWarning} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// Compact sparkle indicator for inline use
export function PremiumSparkle({
  size = 16,
  color,
}: {
  size?: number;
  color?: string;
}) {
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);
  const { colors } = useTheme();

  if (!isPremiumUnlocked) {
    return null;
  }

  return (
    <Ionicons
      name="sparkles"
      size={size}
      color={color || colors.premium}
      style={{ marginLeft: 4 }}
    />
  );
}
