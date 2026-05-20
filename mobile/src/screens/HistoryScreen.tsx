import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../state/appStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";
import { useTheme } from "../utils/useTheme";
import { useOrientation } from "../utils/useOrientation";
import { format } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import Button from "../components/Button";
import { formatDateKey } from "../utils/time";

export default function HistoryScreen() {
  const textSize = useSettingsStore((s) => s.textSize);
  const getDailyLogs = useAppStore((s) => s.getDailyLogs);
  const { primary, primaryLight, colors } = useTheme();
  const textClasses = getTextSizeClasses(textSize);
  const navigation = useNavigation();
  const orientation = useOrientation();
  const isLandscape = orientation === "landscape";
  const horizontalPadding = isLandscape ? 48 : 24;

  const dailyLogs = useMemo(() => getDailyLogs(), []);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString + "T00:00:00");
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Use formatDateKey for timezone-aware date comparison
      const todayKey = formatDateKey(today);
      const yesterdayKey = formatDateKey(yesterday);

      if (dateString === todayKey) {
        return "Today";
      } else if (dateString === yesterdayKey) {
        return "Yesterday";
      } else {
        return format(date, "MMM d, yyyy");
      }
    } catch {
      return dateString;
    }
  };

  const getDayRating = (totalCalories: number, waterGlasses: number): { emoji: string; label: string; color: string } => {
    const hasGoodWater = waterGlasses >= 6;
    const hasGoodCalories = totalCalories >= 1200 && totalCalories <= 2500;

    if (hasGoodWater && hasGoodCalories) {
      return { emoji: "😊", label: "Great Day", color: "#10B981" };
    } else if (hasGoodWater || hasGoodCalories) {
      return { emoji: "🙂", label: "Good Day", color: "#3B82F6" };
    } else if (totalCalories > 0 || waterGlasses > 0) {
      return { emoji: "😐", label: "OK Day", color: "#F59E0B" };
    } else {
      return { emoji: "📝", label: "No Data", color: "#9CA3AF" };
    }
  };

  return (
    <Screen variant="static" edges={["bottom"]}>
      {dailyLogs.length === 0 ? (
        <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: horizontalPadding }}>
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: primaryLight + "20" }}
          >
            <Ionicons name="calendar-outline" size={48} color={primary} />
          </View>
          <Text className={`${textClasses.subtitle} font-semibold mb-2 text-center`} style={{ color: colors.textPrimary }}>
            No History Yet
          </Text>
          <Text className={`${textClasses.body} text-center mb-8`} style={{ color: colors.textSecondary }}>
            Start logging your meals and water intake to see your history here.
          </Text>
          <Button
            title="Log Your First Meal"
            onPress={() => {
              const nav = navigation as any;
              nav.navigate("Tools", { screen: "FoodTracker" });
            }}
            variant="primary"
            size="large"
            accessibilityLabel="Log your first meal"
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingVertical: 24,
            maxWidth: isLandscape ? 900 : undefined,
            alignSelf: "center",
            width: "100%",
          }}
        >
          {/* Summary Stats */}
          <View className="rounded-3xl p-6 mb-6 border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.divider }}>
            <Text className={`${textClasses.subtitle} font-semibold mb-4`} style={{ color: colors.textPrimary }}>
              Summary
            </Text>
            <View className="flex-row space-x-4">
              <View className="flex-1">
                <Text className={`${textClasses.small} mb-1`} style={{ color: colors.textSecondary }}>
                  Days Logged
                </Text>
                <Text className="text-3xl font-bold" style={{ color: primary }}>
                  {dailyLogs.length}
                </Text>
              </View>
              <View className="flex-1">
                <Text className={`${textClasses.small} mb-1`} style={{ color: colors.textSecondary }}>
                  Avg Calories
                </Text>
                <Text className="text-3xl font-bold" style={{ color: primary }}>
                  {dailyLogs.length > 0
                    ? Math.round(
                        dailyLogs.reduce((sum, log) => sum + log.totalCalories, 0) /
                          dailyLogs.length
                      )
                    : 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Daily Log Entries */}
          <View className="space-y-4">
            {dailyLogs.map((log) => {
              const dayRating = getDayRating(log.totalCalories, log.waterGlasses);

              return (
                <View
                  key={log.id}
                  className="rounded-3xl p-5 border"
                  style={{ backgroundColor: colors.cardBackground, borderColor: colors.divider }}
                >
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-1">
                      <Text className={`${textClasses.subtitle} font-semibold`} style={{ color: colors.textPrimary }}>
                        {formatDate(log.date)}
                      </Text>
                      <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textSecondary }}>
                        {log.mealsLogged} meal{log.mealsLogged !== 1 ? "s" : ""} logged
                      </Text>
                    </View>
                    <View
                      className="px-4 py-2 rounded-full flex-row items-center"
                      style={{ backgroundColor: dayRating.color + "20" }}
                    >
                      <Text className="text-xl mr-1">{dayRating.emoji}</Text>
                      <Text
                        className={`${textClasses.small} font-semibold`}
                        style={{ color: dayRating.color }}
                      >
                        {dayRating.label}
                      </Text>
                    </View>
                  </View>

                  {/* Stats Row */}
                  <View className="flex-row space-x-4">
                    {/* Calories */}
                    <View
                      className="flex-1 rounded-2xl p-4 border"
                      style={{ backgroundColor: colors.errorBackground, borderColor: colors.error + "40" }}
                    >
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="restaurant" size={20} color={colors.error} />
                        <Text className={`${textClasses.small} ml-2 font-medium`} style={{ color: colors.textPrimary }}>
                          Calories
                        </Text>
                      </View>
                      <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                        {log.totalCalories}
                      </Text>
                    </View>

                    {/* Water */}
                    <View
                      className="flex-1 rounded-2xl p-4 border"
                      style={{ backgroundColor: colors.primaryLight, borderColor: primary + "40" }}
                    >
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="water" size={20} color={primary} />
                        <Text className={`${textClasses.small} ml-2 font-medium`} style={{ color: colors.textPrimary }}>
                          Water
                        </Text>
                      </View>
                      <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                        {log.waterGlasses} / 8
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Info Card */}
          <View className="mt-6 rounded-3xl p-6 border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.divider }}>
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={24} color={primary} style={{ marginTop: 2 }} />
              <View className="flex-1 ml-3">
                <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                  How Day Ratings Work
                </Text>
                <Text className={`${textClasses.small} leading-relaxed`} style={{ color: colors.textSecondary }}>
                  Great Day: Good calorie range (1200-2500) and 6+ glasses of water{"\n"}
                  Good Day: Either good calories or good water intake{"\n"}
                  OK Day: Some data logged but below targets
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
