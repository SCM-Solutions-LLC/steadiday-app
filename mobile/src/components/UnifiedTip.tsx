import React, { useEffect, useRef, ReactNode } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence, Easing } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";

type AnimationType = "swipe" | "tap" | "scroll" | "none";

interface UnifiedTipProps {
  visible: boolean;
  onDismiss: () => void;
  tipId: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  // Optional animated demo
  animationType?: AnimationType;
  demoContent?: ReactNode;
  // Optional secondary instruction items
  instructions?: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    iconBgColor: string;
    title: string;
    description: string;
  }>;
}

/**
 * UnifiedTip - A full-screen modal tooltip with optional animated demo
 * Used for onboarding tips and feature discovery
 */
export default function UnifiedTip({
  visible,
  onDismiss,
  tipId,
  title,
  description,
  icon,
  iconColor = "#2F80ED",
  animationType = "none",
  demoContent,
  instructions,
}: UnifiedTipProps) {
  const { primary, colors } = useTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (visible && animationType !== "none") {
      isAnimating.current = true;

      const runAnimation = () => {
        if (!isAnimating.current) return;

        switch (animationType) {
          case "swipe":
            translateX.value = withSequence(
              withTiming(-30, { duration: 800, easing: Easing.inOut(Easing.ease) }),
              withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
              withDelay(0, withTiming(0, { duration: 0 }))
            );
            setTimeout(runAnimation, 1600);
            break;
          case "tap":
            scale.value = withSequence(
              withTiming(0.95, { duration: 150, easing: Easing.inOut(Easing.ease) }),
              withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) }),
              withDelay(500, withTiming(1, { duration: 0 }))
            );
            setTimeout(runAnimation, 800);
            break;
          case "scroll":
            translateY.value = withSequence(
              withTiming(-20, { duration: 600, easing: Easing.inOut(Easing.ease) }),
              withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
              withDelay(0, withTiming(0, { duration: 0 }))
            );
            setTimeout(runAnimation, 1200);
            break;
        }
      };

      runAnimation();
    } else {
      isAnimating.current = false;
      translateX.value = 0;
      translateY.value = 0;
      scale.value = 1;
    }

    return () => {
      isAnimating.current = false;
    };
  }, [visible, animationType, translateX, translateY, scale]);

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const tapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const scrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const getAnimatedStyle = () => {
    switch (animationType) {
      case "swipe":
        return swipeStyle;
      case "tap":
        return tapStyle;
      case "scroll":
        return scrollStyle;
      default:
        return {};
    }
  };

  const animatedStyle = getAnimatedStyle();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/70 justify-center items-center px-8">
        <View className="rounded-3xl p-8 w-full max-w-md" style={{ backgroundColor: colors.cardBackground }}>
          {/* Icon + Title */}
          <View className="items-center mb-6">
            <View
              className="rounded-full p-4 mb-4"
              style={{ backgroundColor: `${iconColor}20` }}
            >
              <Ionicons name={icon} size={48} color={iconColor} />
            </View>
            <Text className="text-2xl font-bold text-center" style={{ color: colors.textPrimary }}>
              {title}
            </Text>
          </View>

          {/* Demo Area (if provided) */}
          {demoContent && (
            <Animated.View
              className="rounded-2xl p-4 mb-6 overflow-hidden"
              style={[{ backgroundColor: colors.background }, animatedStyle]}
            >
              {demoContent}
            </Animated.View>
          )}

          {/* Description */}
          <Text className="text-base text-center mb-6 leading-6" style={{ color: colors.textSecondary }}>
            {description}
          </Text>

          {/* Instructions (if provided) */}
          {instructions && instructions.length > 0 && (
            <View className="mb-6">
              {instructions.map((instruction, index) => (
                <View key={index} className="flex-row items-start mb-3 last:mb-0">
                  <View
                    className="rounded-full p-1 mr-3 mt-1"
                    style={{ backgroundColor: instruction.iconBgColor }}
                  >
                    <Ionicons name={instruction.icon} size={16} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                      {instruction.title}
                    </Text>
                    <Text className="text-sm" style={{ color: colors.textSecondary }}>
                      {instruction.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Got It Button */}
          <Pressable
            onPress={onDismiss}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: primary }}
          >
            <Text className="text-white text-lg font-semibold">Got It!</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
