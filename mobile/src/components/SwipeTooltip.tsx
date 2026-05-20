import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";

interface SwipeTooltipProps {
  visible: boolean;
  onDismiss: () => void;
  screenName: string;
}

export default function SwipeTooltip({ visible, onDismiss, screenName }: SwipeTooltipProps) {
  const { colors, primary } = useTheme();
  const translateX = useSharedValue(0);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (visible) {
      isAnimating.current = true;

      const runAnimation = () => {
        if (!isAnimating.current) return;

        translateX.value = withSequence(
          withTiming(-30, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        );

        setTimeout(runAnimation, 1600);
      };

      runAnimation();
    } else {
      isAnimating.current = false;
      translateX.value = 0;
    }

    return () => {
      isAnimating.current = false;
    };
  }, [visible, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/70 justify-center items-center px-8">
        <View className="rounded-3xl p-8 w-full max-w-md" style={{ backgroundColor: colors.cardBackground }}>
          {/* Icon */}
          <View className="items-center mb-6">
            <View className="rounded-full p-4 mb-4" style={{ backgroundColor: `${primary}20` }}>
              <Ionicons name="hand-left-outline" size={48} color={primary} />
            </View>
            <Text className="text-2xl font-bold text-center" style={{ color: colors.textPrimary }}>
              Swipe to Edit or Delete
            </Text>
          </View>

          {/* Demo Card */}
          <View className="rounded-2xl p-4 mb-6 overflow-hidden" style={{ backgroundColor: colors.background }}>
            <View className="flex-row items-center justify-between">
              <Animated.View style={animatedStyle} className="flex-row items-center flex-1">
                <View className="bg-sage w-12 h-12 rounded-full items-center justify-center mr-3">
                  <Ionicons
                    name={screenName === "medications" ? "medical" : screenName === "tasks" ? "checkbox" : "person"}
                    size={24}
                    color="white"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                    {screenName === "medications" ? "Example Medication" : screenName === "tasks" ? "Example Task" : "Example Contact"}
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>Swipe left to see options</Text>
                </View>
              </Animated.View>
              <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
            </View>
          </View>

          {/* Instructions */}
          <View className="mb-6">
            <View className="flex-row items-start mb-3">
              <View className="rounded-full p-1 mr-3 mt-1" style={{ backgroundColor: primary }}>
                <Ionicons name="pencil" size={16} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>Swipe left to edit</Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  Swipe any item left to reveal the edit button
                </Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <View className="bg-[#CC3A3A] rounded-full p-1 mr-3 mt-1">
                <Ionicons name="trash" size={16} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>Swipe left to delete</Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  The delete button appears next to edit
                </Text>
              </View>
            </View>
          </View>

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
