import React, { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useSettingsStore } from "../../state/stores/settingsStore";

interface ChartDataPoint {
  day: string;
  value: number;
}

interface HealthMetricCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  currentValue: number | string;
  goal?: number;
  unit?: string;
  subtitle?: string;
  showProgress?: boolean;
  progressPercentage?: number;
  chartData?: ChartDataPoint[];
  onPress: () => void;
}

function HealthMetricCardComponent({
  title,
  icon,
  color,
  bgColor,
  currentValue,
  goal,
  unit,
  subtitle,
  showProgress = false,
  progressPercentage = 0,
  chartData,
  onPress,
}: HealthMetricCardProps) {
  const { colors } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  const renderMiniChart = () => {
    if (!chartData || chartData.length === 0) return null;

    const maxValue = goal || Math.max(...chartData.map((d) => d.value), 1);

    return (
      <View className="flex-row items-end justify-between h-16 mt-2">
        {chartData.map((point, index) => {
          const barHeight = Math.max((point.value / maxValue) * 60, 4);
          return (
            <View key={index} className="flex-1 mx-0.5 items-center">
              <View
                style={{
                  height: barHeight,
                  backgroundColor: color,
                  width: "100%",
                  borderRadius: 4,
                }}
              />
              <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>{point.day}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Build accessibility label
  const accessibilityLabel = goal
    ? `${title}: ${currentValue} of ${goal}${unit ? ` ${unit}` : ""}. ${Math.round(progressPercentage)}% of goal. Tap to log.`
    : subtitle
    ? `${title}: ${subtitle}. Tap to log.`
    : unit
    ? `${title}: ${currentValue || "no data"} ${unit}. Tap to log.`
    : `${title}. Tap to log.`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={`Opens ${title.toLowerCase()} logging screen`}
    >
      <View
        style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
        className={`rounded-3xl p-5 mb-4 border-2`}
      >
        <View className="flex-row items-center mb-4">
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mr-3"
            style={{ backgroundColor: bgColor }}
          >
            <Ionicons name={icon} size={28} color={color} />
          </View>
          <View className="flex-1">
            <Text className={`${textClasses.subtitle} font-semibold`} style={{ color: colors.textPrimary }}>
              {title}
            </Text>
            {goal ? (
              <Text className={`${textClasses.body} mt-1`} style={{ color: colors.textSecondary }}>
                {currentValue.toLocaleString()} of {goal.toLocaleString()}{unit ? ` ${unit}` : ""}
              </Text>
            ) : subtitle ? (
              <Text className={`${textClasses.body} mt-1`} style={{ color: colors.textSecondary }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Ionicons name="create-outline" size={24} color={color} />
        </View>

        {/* Value display for metrics without goal */}
        {!goal && unit && (
          <View className="flex-row items-baseline mb-4">
            <Text className={`${textClasses.title} font-bold`} style={{ color }}>
              {currentValue || "--"}
            </Text>
            <Text className={`${textClasses.subtitle} ml-2`} style={{ color: colors.textSecondary }}>
              {unit}
            </Text>
          </View>
        )}

        {/* Progress Bar */}
        {showProgress && (
          <>
            <View style={{ backgroundColor: colors.border }} className="h-3 rounded-full overflow-hidden mb-2">
              <View
                style={{ width: `${Math.min(progressPercentage, 100)}%`, backgroundColor: color }}
                className="h-full rounded-full"
              />
            </View>
            <Text className={`${textClasses.body} text-right mb-4`} style={{ color: colors.textSecondary }}>
              {Math.round(progressPercentage)}% of goal
            </Text>
          </>
        )}

        {/* 7-Day Chart */}
        {chartData && renderMiniChart()}
      </View>
    </Pressable>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(HealthMetricCardComponent);
