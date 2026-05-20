import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { SharedValue } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useSettingsStore } from "../../state/stores/settingsStore";
import type { MealType, FoodEntry, HealthLabel } from "../../types/app";
import type { IoniconsName } from "../../types/icons";

interface MealSectionProps {
  mealType: MealType;
  title: string;
  entries: FoodEntry[];
  onAddPress: (mealType: MealType) => void;
  onDeleteEntry: (id: string) => void;
  getEntryAnimation?: (id: string) => SharedValue<number> | undefined;
}

const getMealIcon = (mealType: MealType): IoniconsName => {
  switch (mealType) {
    case "breakfast": return "sunny";
    case "lunch": return "partly-sunny";
    case "dinner": return "moon";
    case "snacks": return "cafe";
  }
};

const getMealColor = (mealType: MealType): string => {
  switch (mealType) {
    case "breakfast": return "#F59E0B";
    case "lunch": return "#3B82F6";
    case "dinner": return "#8B5CF6";
    case "snacks": return "#EC4899";
  }
};

const getHealthLabelColor = (label: HealthLabel): string => {
  switch (label) {
    case "healthy": return "#10B981";
    case "neutral": return "#6B7280";
    case "treat": return "#EF4444";
  }
};

export default function MealSection({
  mealType,
  title,
  entries,
  onAddPress,
  onDeleteEntry,
  getEntryAnimation
}: MealSectionProps) {
  const { primary, colors } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  const mealColor = getMealColor(mealType);
  const mealIcon = getMealIcon(mealType);

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: mealColor + "20" }}
          >
            <Ionicons name={mealIcon} size={24} color={mealColor} />
          </View>
          <Text className={`${textClasses.subtitle} font-semibold`} style={{ color: colors.textPrimary }}>
            {title}
          </Text>
        </View>
        <Pressable
          onPress={() => onAddPress(mealType)}
          className="px-5 py-3 rounded-2xl"
          style={({ pressed }) => ({
            backgroundColor: colors.cardBackground,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View className="flex-row items-center">
            <Ionicons name="add" size={20} color={primary} />
            <Text className={`${textClasses.small} font-semibold ml-1`} style={{ color: primary }}>
              Add
            </Text>
          </View>
        </Pressable>
      </View>

      {entries.length === 0 ? (
        <View className="py-6 items-center rounded-2xl" style={{ backgroundColor: colors.cardBackground }}>
          <Text className={`${textClasses.body}`} style={{ color: colors.textSecondary }}>
            No {title.toLowerCase()} logged yet
          </Text>
        </View>
      ) : (
        <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: colors.cardBackground }}>
          {entries.map((entry, index) => {
            const animValue = getEntryAnimation?.(entry.id);

            return (
              <Animated.View
                key={entry.id}
                style={animValue ? {
                  opacity: animValue.value,
                  transform: [{
                    translateY: animValue.value,
                  }],
                } : {}}
                className={`px-5 py-4 flex-row items-center justify-between ${
                  index !== entries.length - 1 ? "border-b" : ""
                }`}
              >
                <View className="flex-1">
                  <Text className={`${textClasses.body} font-semibold mb-1`} style={{ color: colors.textPrimary }}>
                    {entry.name}
                  </Text>
                  <View className="flex-row items-center space-x-3">
                    <View
                      className="px-2 py-1 rounded-lg"
                      style={{ backgroundColor: getHealthLabelColor(entry.healthLabel) + "20" }}
                    >
                      <Text
                        className={`${textClasses.small} font-medium capitalize`}
                        style={{ color: getHealthLabelColor(entry.healthLabel) }}
                      >
                        {entry.healthLabel}
                      </Text>
                    </View>
                    <Text className={`${textClasses.small} capitalize`} style={{ color: colors.textSecondary }}>
                      {entry.portionSize}
                    </Text>
                    <Text className={`${textClasses.small} font-semibold`} style={{ color: colors.textPrimary }}>
                      {entry.calories} cal
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => onDeleteEntry(entry.id)}
                  className="p-2 active:bg-red-50 rounded-lg"
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );
}
