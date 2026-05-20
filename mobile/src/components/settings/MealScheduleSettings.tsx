import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useHealthStore } from "../../state/stores/healthStore";
import { useTheme } from "../../utils/useTheme";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import CustomSwitch from "../CustomSwitch";
import { parseTimeString, dateToTimeString, formatTimeForDisplay } from "../../utils/mealUtils";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, interpolate, Extrapolation } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

type MealKey = "breakfast" | "lunch" | "dinner";

interface MealTimeRowProps {
  meal: string;
  icon: string;
  iconColor: string;
  time: string;
  reminderEnabled: boolean;
  onReminderToggle: (enabled: boolean) => void;
  isPickerOpen: boolean;
  onTogglePickerOpen: () => void;
}

const MealTimeRow = ({
  meal,
  icon,
  iconColor,
  time,
  reminderEnabled,
  onReminderToggle,
  isPickerOpen,
  onTogglePickerOpen,
}: MealTimeRowProps) => {
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  const timeDate = parseTimeString(time);

  return (
    <View
      className="flex-row items-center py-3"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
    >
      {/* Icon */}
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: iconColor + "15" }}
      >
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>

      {/* Meal Info */}
      <View className="flex-1">
        <Text
          className={`${textClasses.body} font-semibold`}
          style={{ color: colors.textPrimary }}
        >
          {meal}
        </Text>
        <Pressable
          onPress={onTogglePickerOpen}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            className="text-sm mt-0.5"
            style={{ color: isPickerOpen ? iconColor : primary, fontWeight: "500" }}
          >
            {formatTimeForDisplay(timeDate)}
          </Text>
        </Pressable>
      </View>

      {/* Reminder Toggle */}
      <View className="items-end">
        <CustomSwitch
          value={reminderEnabled}
          onValueChange={onReminderToggle}
          activeTrackColor={primary}
          inactiveTrackColor={colors.divider}
          activeThumbColor={colors.toggleThumb}
          inactiveThumbColor={colors.toggleThumb}
          accessibilityLabel={`Toggle ${meal} reminder`}
        />
      </View>
    </View>
  );
};

interface MealScheduleSettingsProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function MealScheduleSettings({ isExpanded: externalIsExpanded, onToggleExpand }: MealScheduleSettingsProps) {
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;

  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalExpanded;

  // Only one picker open at a time
  const [activePicker, setActivePicker] = useState<MealKey | null>(null);
  // Pending time value while iOS picker is open
  const [pendingTime, setPendingTime] = useState<Date>(new Date());

  const mealSchedule = useHealthStore((s) => s.mealSchedule);
  const updateMealSchedule = useHealthStore((s) => s.updateMealSchedule);

  // Animation values
  const expandProgress = useSharedValue(isExpanded ? 1 : 0);
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  React.useEffect(() => {
    expandProgress.value = withTiming(isExpanded ? 1 : 0, { duration: 250 });
    rotation.value = withSpring(isExpanded ? 1 : 0, { damping: 15 });
  }, [isExpanded]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    overflow: expandProgress.value < 0.01 ? "hidden" as const : "visible" as const,
    maxHeight: interpolate(expandProgress.value, [0, 1], [0, 2000], Extrapolation.CLAMP),
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
  }));

  const handleToggle = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Close any open picker when collapsing
    if (isExpanded) {
      setActivePicker(null);
    }
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const handlePickerToggle = (key: MealKey) => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (activePicker === key) {
      setActivePicker(null);
    } else {
      // Initialize pending time from the meal's current time
      const timeStr = key === "breakfast" ? mealSchedule.breakfast : key === "lunch" ? mealSchedule.lunch : mealSchedule.dinner;
      setPendingTime(parseTimeString(timeStr));
      setActivePicker(key);
    }
  };

  const handleTimeChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      // Android auto-dismisses
      if (selectedDate && activePicker) {
        const timeStr = dateToTimeString(selectedDate);
        updateMealSchedule({ [activePicker]: timeStr });
      }
      setActivePicker(null);
      return;
    }
    // iOS: update pending value AND save immediately
    if (selectedDate) {
      setPendingTime(selectedDate);
      if (activePicker) {
        const timeStr = dateToTimeString(selectedDate);
        updateMealSchedule({ [activePicker]: timeStr });
      }
    }
  };

  const handleDone = () => {
    if (activePicker) {
      const timeStr = dateToTimeString(pendingTime);
      updateMealSchedule({ [activePicker]: timeStr });
    }
    setActivePicker(null);
  };

  // Count enabled reminders
  const enabledReminders = [
    mealSchedule.breakfastReminder,
    mealSchedule.lunchReminder,
    mealSchedule.dinnerReminder,
  ].filter(Boolean).length;

  // Get icon color for active picker's Done button
  const getPickerIconColor = (key: MealKey): string => {
    switch (key) {
      case "breakfast": return "#F59E0B";
      case "lunch": return "#3B82F6";
      case "dinner": return "#8B5CF6";
    }
  };

  const renderPickerBlock = (mealKey: MealKey) => {
    if (activePicker !== mealKey) return null;

    const iconColor = getPickerIconColor(mealKey);
    const mealLabel = mealKey.charAt(0).toUpperCase() + mealKey.slice(1);

    return (
      <View style={{ alignItems: "center", paddingVertical: 8 }}>
        <DateTimePicker
          value={pendingTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleTimeChange}
          minuteInterval={15}
          textColor={colors.textPrimary}
          style={{ width: "100%" }}
        />
        {Platform.OS === "ios" && (
          <Pressable
            onPress={handleDone}
            accessibilityRole="button"
            accessibilityLabel={`Confirm ${mealLabel} time`}
            style={({ pressed }) => ({
              backgroundColor: pressed ? iconColor + "CC" : iconColor,
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 40,
              marginTop: 8,
              marginBottom: 4,
              minHeight: 52,
              minWidth: 160,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            })}
          >
            <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>
              Save
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.divider,
      }}
    >
      {/* Collapsible Header */}
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => ({
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center flex-1">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: primary + "15" }}
            >
              <Ionicons name="time-outline" size={20} color={primary} />
            </View>
            <View className="flex-1">
              <Text
                className={`${textClasses.body} font-semibold`}
                style={{ color: colors.textPrimary }}
              >
                Meal Schedule
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {enabledReminders > 0
                  ? `${enabledReminders} reminder${enabledReminders > 1 ? "s" : ""} active`
                  : "Set meal times"}
              </Text>
            </View>
          </View>
          <Animated.View style={chevronStyle}>
            <Ionicons
              name="chevron-down"
              size={22}
              color={colors.textSecondary}
            />
          </Animated.View>
        </View>
      </Pressable>

      {/* Collapsible Content */}
      <Animated.View style={contentStyle}>
        <View className="px-4 pb-3">
          {/* Breakfast */}
          <MealTimeRow
            meal="Breakfast"
            icon="sunny-outline"
            iconColor="#F59E0B"
            time={mealSchedule.breakfast}
            reminderEnabled={mealSchedule.breakfastReminder}
            onReminderToggle={(enabled) => updateMealSchedule({ breakfastReminder: enabled })}
            isPickerOpen={activePicker === "breakfast"}
            onTogglePickerOpen={() => handlePickerToggle("breakfast")}
          />
          {renderPickerBlock("breakfast")}

          {/* Lunch */}
          <MealTimeRow
            meal="Lunch"
            icon="partly-sunny-outline"
            iconColor="#3B82F6"
            time={mealSchedule.lunch}
            reminderEnabled={mealSchedule.lunchReminder}
            onReminderToggle={(enabled) => updateMealSchedule({ lunchReminder: enabled })}
            isPickerOpen={activePicker === "lunch"}
            onTogglePickerOpen={() => handlePickerToggle("lunch")}
          />
          {renderPickerBlock("lunch")}

          {/* Dinner */}
          <MealTimeRow
            meal="Dinner"
            icon="moon-outline"
            iconColor="#8B5CF6"
            time={mealSchedule.dinner}
            reminderEnabled={mealSchedule.dinnerReminder}
            onReminderToggle={(enabled) => updateMealSchedule({ dinnerReminder: enabled })}
            isPickerOpen={activePicker === "dinner"}
            onTogglePickerOpen={() => handlePickerToggle("dinner")}
          />
          {renderPickerBlock("dinner")}

          {/* Snacks Note */}
          <View className="flex-row items-center py-3 mt-1">
            <View
              className="w-8 h-8 rounded-lg items-center justify-center mr-2"
              style={{ backgroundColor: "#EF4444" + "15" }}
            >
              <Ionicons name="cafe-outline" size={16} color="#EF4444" />
            </View>
            <Text
              className="text-xs flex-1"
              style={{ color: colors.textSecondary }}
            >
              Log snacks anytime throughout the day
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
