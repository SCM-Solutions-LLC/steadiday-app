import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getTodaysTip,
  type LearningCategory as LearningCategoryData,
} from "../../data/dailyLearningTips";

// Learning icon colors for each category
export const LEARNING_ICON_COLORS = {
  "healthy-aging": "#EC4899", // Pink
  "food-facts": "#22C55E", // Green
  "fitness": "#3B82F6", // Blue
  "tech-basics": "#F97316", // Orange
};

export interface LearningTipCardProps {
  category: LearningCategoryData;
  onPress: () => void;
  colors: any;
  isDark: boolean;
}

function LearningTipCard({ category, onPress, colors, isDark }: LearningTipCardProps) {
  const cardBg = isDark ? category.cardColor.dark : category.cardColor.light;
  const todaysTip = getTodaysTip(category);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 20,
          padding: 16,
          minHeight: 150,
          // Add border for definition
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
          // Enhanced shadow
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.75)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <Ionicons name={category.icon as any} size={26} color={category.iconColor} />
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: isDark ? "#FFFFFF" : colors.textPrimary,
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {category.title}
        </Text>

        {/* Today's Tip Title (preview) */}
        <Text
          style={{
            fontSize: 14,
            color: isDark ? "rgba(255,255,255,0.75)" : colors.textSecondary,
            lineHeight: 19,
          }}
          numberOfLines={2}
        >
          {todaysTip.title}
        </Text>
      </View>
    </Pressable>
  );
}

export default LearningTipCard;
