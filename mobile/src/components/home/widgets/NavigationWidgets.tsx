import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NavigationWidgetProps } from "../types";

type WidgetConfig = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  bgColor?: string;
};

const WIDGET_CONFIGS: Record<NavigationWidgetProps["type"], WidgetConfig> = {
  "health-metrics": {
    title: "Health Metrics",
    subtitle: "View your health data",
    icon: "fitness",
  },
  "insurance-cards": {
    title: "Insurance Cards",
    subtitle: "Access your insurance info",
    icon: "card",
  },
  "my-doctors": {
    title: "My Doctors",
    subtitle: "Contact your healthcare team",
    icon: "people",
  },
  "magnifier": {
    title: "Magnifier",
    subtitle: "Zoom in to read small text",
    icon: "search",
  },
  "flashlight": {
    title: "Flashlight",
    subtitle: "Turn on your phone light",
    icon: "flashlight",
  },
  "notes": {
    title: "Notes",
    subtitle: "Quick notes and reminders",
    icon: "document-text",
  },
  "find-my-car": {
    title: "Find My Car",
    subtitle: "Remember where you parked",
    icon: "car",
  },
};

export function NavigationWidget({
  type,
  textClasses,
  colors,
  primary,
  onNavigate,
}: NavigationWidgetProps) {
  const config = WIDGET_CONFIGS[type];

  if (!config) return null;

  return (
    <Pressable
      onPress={onNavigate}
      className="rounded-3xl p-4 mb-6 border flex-row items-center active:opacity-80"
      style={{ backgroundColor: colors.cardBackground, borderColor: colors.border, minHeight: 80 }}
      accessibilityRole="button"
      accessibilityLabel={config.title}
      accessibilityHint={`Double tap to open ${config.title}`}
    >
      <View
        className="w-14 h-14 rounded-2xl items-center justify-center"
        style={{ backgroundColor: config.bgColor || colors.primaryLight }}
      >
        <Ionicons
          name={config.icon}
          size={28}
          color={config.iconColor || primary}
        />
      </View>
      <View className="ml-4 flex-1">
        <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
          {config.title}
        </Text>
        <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
          {config.subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
    </Pressable>
  );
}
