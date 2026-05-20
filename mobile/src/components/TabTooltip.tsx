import React, { useEffect } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import { useResponsive } from "../utils/useResponsive";
import type { TabName } from "../types/app";

// Tab descriptions for first-time visitors
const TAB_DESCRIPTIONS: Record<TabName, { title: string; description: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Home: {
    title: "Your Home Screen",
    description: "See your daily summary, weather, and quick access to important features.",
    icon: "home",
  },
  Tasks: {
    title: "Your Tasks",
    description: "Manage your daily to-dos, appointments, and reminders all in one place.",
    icon: "checkbox",
  },
  Meds: {
    title: "Medication Reminders",
    description: "Track your medications and get reminders when it is time to take them.",
    icon: "medical",
  },
  Medical: {
    title: "Medical Information",
    description: "Store your insurance cards, doctor contacts, and important medical details.",
    icon: "people",
  },
  Health: {
    title: "Health Tracking",
    description: "Monitor your health metrics and track your wellness goals.",
    icon: "heart",
  },
  Tools: {
    title: "Helpful Tools",
    description: "Access useful tools like magnifier, flashlight, notes, and more.",
    icon: "construct",
  },
  Connect: {
    title: "Mind Breaks",
    description: "Take a quick mental break with relaxing games and activities to keep your mind sharp.",
    icon: "sparkles",
  },
  Settings: {
    title: "App Settings",
    description: "Customize the app to work best for you - text size, colors, and more.",
    icon: "settings",
  },
};

interface TabTooltipProps {
  visible: boolean;
  tabName: TabName;
  onDismiss: () => void;
  anchorPosition?: { x: number; y: number };
}

export default function TabTooltip({ visible, tabName, onDismiss, anchorPosition }: TabTooltipProps) {
  const { primary, colors } = useTheme();
  const responsive = useResponsive();
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  const tabInfo = TAB_DESCRIPTIONS[tabName];

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible || !tabInfo) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Pressable
        className="flex-1 justify-end pb-32"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        onPress={onDismiss}
      >
        <Animated.View
          style={[
            {
              marginHorizontal: responsive.isTablet ? 48 : 24,
              maxWidth: 500,
              alignSelf: "center" as const,
              backgroundColor: colors.cardBackground,
              borderRadius: 20,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 8,
            },
            animatedStyle,
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Header with icon */}
            <View className="flex-row items-center mb-3">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: primary + "20" }}
              >
                <Ionicons name={tabInfo.icon} size={24} color={primary} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-xl font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  {tabInfo.title}
                </Text>
              </View>
              <Pressable
                onPress={onDismiss}
                className="p-2 -mr-2 -mt-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Description */}
            <Text
              className="text-base leading-relaxed mb-4"
              style={{ color: colors.textSecondary, lineHeight: 24 }}
            >
              {tabInfo.description}
            </Text>

            {/* Got It Button */}
            <Pressable
              onPress={onDismiss}
              className="rounded-xl py-3.5 items-center"
              style={{ backgroundColor: primary }}
              accessibilityRole="button"
              accessibilityLabel="Got it"
            >
              <Text className="text-white text-lg font-semibold">Got It</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
