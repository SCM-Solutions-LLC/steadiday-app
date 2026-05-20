import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, AccessibilityInfo, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
  interpolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import { useResponsive } from "../utils/useResponsive";

interface TabScrollCoachMarkProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function TabScrollCoachMark({ visible, onDismiss }: TabScrollCoachMarkProps) {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  const { primary, colors } = useTheme();
  const responsive = useResponsive();

  // Animation values
  const opacity = useSharedValue(0);
  const arrowBounce = useSharedValue(0);
  const tabSlide = useSharedValue(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check system reduce motion setting
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setShouldReduceMotion);
  }, []);

  // Auto-dismiss after 5 seconds (longer for seniors to read)
  useEffect(() => {
    if (visible) {
      dismissTimerRef.current = setTimeout(() => {
        onDismiss();
      }, 5000);
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [visible, onDismiss]);

  // Animate the coach mark
  useEffect(() => {
    if (visible) {
      // Fade in
      opacity.value = withTiming(1, { duration: 300 });

      if (!shouldReduceMotion) {
        // Bouncing arrow animation pointing down
        arrowBounce.value = withRepeat(
          withSequence(
            withTiming(8, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
          ),
          -1, // infinite repeat
          false
        );

        // Tab slide demonstration - slide left then back
        tabSlide.value = withDelay(
          500,
          withRepeat(
            withSequence(
              withTiming(-60, { duration: 800, easing: Easing.inOut(Easing.ease) }),
              withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
              withDelay(1000, withTiming(0, { duration: 0 })) // Pause between repeats
            ),
            -1,
            false
          )
        );
      }
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      cancelAnimation(arrowBounce);
      cancelAnimation(tabSlide);
      arrowBounce.value = 0;
      tabSlide.value = 0;
    }

    return () => {
      cancelAnimation(arrowBounce);
      cancelAnimation(tabSlide);
      cancelAnimation(opacity);
    };
  }, [visible, shouldReduceMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: arrowBounce.value }],
  }));

  const tabPreviewStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabSlide.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: "absolute",
          bottom: responsive.isLandscape && responsive.isPhone ? 60 : 90,
          left: 0,
          right: 0,
          alignItems: "center",
          zIndex: 1000,
        },
        containerStyle,
      ]}
    >
      <Pressable
        onPress={onDismiss}
        style={{
          backgroundColor: colors.cardBackground,
          borderRadius: 20,
          paddingHorizontal: 24,
          paddingVertical: 16,
          marginHorizontal: responsive.isTablet ? 48 : 24,
          maxWidth: 500,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 8,
          borderWidth: 2,
          borderColor: primary,
          alignItems: "center",
        }}
        accessibilityRole="button"
        accessibilityLabel="More tabs available. Swipe the tab bar left or right to see more sections. Tap to dismiss."
      >
        {/* Instructional text */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: colors.textPrimary,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          More Tabs Available!
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Swipe the tabs below to see more sections
        </Text>

        {/* Mini tab preview showing scroll animation */}
        <View
          style={{
            width: 200,
            height: 40,
            backgroundColor: colors.background,
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          <Animated.View
            style={[
              {
                flexDirection: "row",
                height: "100%",
                alignItems: "center",
                paddingHorizontal: 8,
                gap: 16,
              },
              tabPreviewStyle,
            ]}
          >
            {["Home", "Meds", "Tasks", "Health", "Tools", "Connect"].map((tab, index) => (
              <View
                key={tab}
                style={{
                  backgroundColor: index === 0 ? primary : colors.divider,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: index === 0 ? colors.onPrimary : colors.textSecondary,
                  }}
                >
                  {tab}
                </Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Arrow pointing down to tabs */}
        <Animated.View style={arrowStyle}>
          <Ionicons name="arrow-down" size={32} color={primary} />
        </Animated.View>

        {/* Dismiss hint */}
        <Text
          style={{
            fontSize: 13,
            color: colors.textTertiary,
            marginTop: 8,
          }}
        >
          Tap anywhere to dismiss
        </Text>
      </Pressable>
    </Animated.View>
  );
}
