import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { FoodWaterWidgetProps } from "../types";

export function FoodWaterWidget({
  todaysCalories,
  todaysMeals,
  todaysWater,
  textClasses,
  colors,
  primary,
  onNavigateFood,
  onNavigateWater,
}: FoodWaterWidgetProps) {
  const waterPercentage = Math.min((todaysWater / 8) * 100, 100);

  return (
    <View
      className="rounded-3xl p-4 mb-6 border"
      style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
    >
      <Text className={`${textClasses.subtitle} mb-4`} style={{ color: colors.textPrimary }}>
        Food & Water
      </Text>

      <View className="flex-row gap-3">
        {/* Food Tracking */}
        <Pressable
          onPress={onNavigateFood}
          className="flex-1 rounded-2xl p-4 active:opacity-80"
          style={{ backgroundColor: colors.primaryLight, minHeight: 100 }}
          accessibilityRole="button"
          accessibilityLabel={`Food tracking: ${todaysCalories} calories, ${todaysMeals} meal${todaysMeals !== 1 ? "s" : ""} logged`}
          accessibilityHint="Double tap to open food tracker"
        >
          <View className="flex-row items-center mb-2">
            <Ionicons name="restaurant" size={24} color={primary} />
            <Text className={`${textClasses.small} ml-2 font-semibold`} style={{ color: primary }}>
              Today
            </Text>
          </View>
          <Text className={`${textClasses.subtitle} font-bold`} style={{ color: colors.textPrimary }}>
            {todaysCalories}
          </Text>
          <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
            calories
          </Text>
          <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textSecondary }}>
            {todaysMeals} meal{todaysMeals !== 1 ? "s" : ""} logged
          </Text>
        </Pressable>

        {/* Water Tracking */}
        <Pressable
          onPress={onNavigateWater}
          className="flex-1 rounded-2xl p-4 active:opacity-80"
          style={{ backgroundColor: colors.infoBackground, minHeight: 100 }}
          accessibilityRole="button"
          accessibilityLabel={`Water tracking: ${todaysWater} of 8 glasses`}
          accessibilityHint="Double tap to open water tracker"
        >
          <View className="flex-row items-center mb-2">
            <Ionicons name="water" size={24} color={colors.info} />
            <Text className={`${textClasses.small} ml-2 font-semibold`} style={{ color: colors.info }}>
              Water
            </Text>
          </View>
          <Text className={`${textClasses.subtitle} font-bold`} style={{ color: colors.textPrimary }}>
            {todaysWater}/8
          </Text>
          <Text className={`${textClasses.small}`} style={{ color: colors.onInfo }}>
            glasses
          </Text>
          {/* Progress bar */}
          <View className="h-2 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: colors.surfaceSubtle }}>
            <View
              className="h-full rounded-full"
              style={{ backgroundColor: colors.info, width: `${waterPercentage}%` }}
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}
