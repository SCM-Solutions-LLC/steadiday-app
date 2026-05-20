import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../utils/useTheme";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { DataSource, getDataSourceLabel } from "../../types/app";

interface SourceLabelProps {
  /**
   * The data source to display
   */
  source: DataSource;
  /**
   * Additional sources when source is "multiple"
   */
  sources?: DataSource[];
  /**
   * Whether to show the icon
   * @default true
   */
  showIcon?: boolean;
  /**
   * Custom text size override
   */
  size?: "small" | "tiny";
  /**
   * Callback when multiple sources info is tapped
   */
  onInfoPress?: () => void;
}

/**
 * SourceLabel - Displays where data came from for privacy transparency
 *
 * Usage:
 * <SourceLabel source="steadiday" />
 * <SourceLabel source="apple_health" showIcon={false} />
 * <SourceLabel source="multiple" sources={["apple_calendar", "google_calendar"]} onInfoPress={showSourcesModal} />
 */
export default function SourceLabel({
  source,
  sources,
  showIcon = true,
  size = "small",
  onInfoPress,
}: SourceLabelProps) {
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  const label = getDataSourceLabel(source);

  // Get icon based on source
  const getSourceIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (source) {
      case "steadiday":
        return "phone-portrait-outline";
      case "apple_health":
        return "heart-outline";
      case "apple_calendar":
        return "calendar-outline";
      case "google_calendar":
        return "logo-google";
      case "ios_reminders":
        return "notifications-outline";
      case "multiple":
        return "layers-outline";
      default:
        return "help-circle-outline";
    }
  };

  const textSizeClass = size === "tiny" ? "text-xs" : textClasses.small;
  const iconSize = size === "tiny" ? 12 : 14;

  // If multiple sources with info button
  if (source === "multiple" && onInfoPress) {
    return (
      <Pressable
        onPress={onInfoPress}
        className="flex-row items-center"
        accessibilityRole="button"
        accessibilityLabel={`Source: ${label}. Tap for details.`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {showIcon && (
          <Ionicons
            name={getSourceIcon()}
            size={iconSize}
            color={colors.textTertiary}
            style={{ marginRight: 4 }}
          />
        )}
        <Text
          className={textSizeClass}
          style={{ color: colors.textTertiary }}
        >
          {label}
        </Text>
        <Ionicons
          name="information-circle-outline"
          size={iconSize}
          color={primary}
          style={{ marginLeft: 4 }}
        />
      </Pressable>
    );
  }

  return (
    <View
      className="flex-row items-center"
      accessibilityLabel={`Source: ${label}`}
    >
      {showIcon && (
        <Ionicons
          name={getSourceIcon()}
          size={iconSize}
          color={colors.textTertiary}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        className={textSizeClass}
        style={{ color: colors.textTertiary }}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * Inline version for list items - even more compact
 */
export function SourceLabelInline({ source }: { source: DataSource }) {
  const { colors } = useTheme();
  const label = getDataSourceLabel(source);

  return (
    <Text
      className="text-xs"
      style={{ color: colors.textTertiary }}
    >
      • {label}
    </Text>
  );
}
