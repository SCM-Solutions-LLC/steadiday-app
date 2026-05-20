import React, { useState, useCallback } from "react";
import { View, Text, Pressable, LayoutAnimation, Platform, UIManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WhatThisMeansCardProps {
  /**
   * The title shown in the collapsed state
   * @default "What this means"
   */
  title?: string;
  /**
   * The explanation text shown when expanded
   */
  explanation: string;
  /**
   * Icon name from Ionicons
   * @default "help-circle-outline"
   */
  icon?: keyof typeof Ionicons.glyphMap;
  /**
   * Whether the card starts expanded
   * @default false
   */
  defaultExpanded?: boolean;
  /**
   * Custom background color (overrides theme)
   */
  backgroundColor?: string;
  /**
   * Custom icon color (overrides theme)
   */
  iconColor?: string;
  /**
   * Optional style for container
   */
  style?: object;
}

/**
 * WhatThisMeansCard - Expandable explanation block for medical/health information
 *
 * Use this component to provide plain-English explanations for:
 * - Lab results
 * - Medication side effects
 * - Health metrics
 * - Medical terminology
 *
 * Design principles:
 * - Non-judgmental, educational tone
 * - Collapsible to reduce visual clutter
 * - Large touch target for accessibility
 */
export default function WhatThisMeansCard({
  title = "What this means",
  explanation,
  icon = "help-circle-outline",
  defaultExpanded = false,
  backgroundColor,
  iconColor,
  style,
}: WhatThisMeansCardProps) {
  const { colors, primary, primaryLight } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const textClasses = getTextSizeClasses(textSize);

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  }, [hapticEnabled]);

  const bgColor = backgroundColor || primaryLight;
  const icColor = iconColor || primary;

  return (
    <View
      style={[
        {
          backgroundColor: bgColor,
          borderRadius: 16,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Pressable
        onPress={handleToggle}
        className="flex-row items-center p-4"
        style={{ minHeight: 56 }}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${isExpanded ? "Tap to collapse" : "Tap to expand"}`}
        accessibilityState={{ expanded: isExpanded }}
      >
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: icColor + "20" }}
        >
          <Ionicons name={icon} size={18} color={icColor} />
        </View>
        <Text
          className={`${textClasses.body} font-medium flex-1`}
          style={{ color: colors.textPrimary }}
        >
          {title}
        </Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      {isExpanded && (
        <View className="px-4 pb-4">
          <View
            className="p-3 rounded-xl"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text
              className={`${textClasses.body}`}
              style={{ color: colors.textPrimary, lineHeight: 24 }}
            >
              {explanation}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Preset configurations for common use cases
 */
export const WhatThisMeansPresets = {
  labResult: {
    title: "What this result means",
    icon: "flask-outline" as const,
  },
  medication: {
    title: "About this medication",
    icon: "medical-outline" as const,
  },
  healthMetric: {
    title: "Understanding this number",
    icon: "pulse-outline" as const,
  },
  sideEffect: {
    title: "What to watch for",
    icon: "alert-circle-outline" as const,
  },
};
