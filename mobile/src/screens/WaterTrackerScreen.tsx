import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Dimensions, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useHealthStore } from "../state/stores/healthStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";
import { useTheme } from "../utils/useTheme";
import { useOrientation } from "../utils/useOrientation";
import { useNavigation } from "@react-navigation/native";
import { useAnimationDuration } from "../utils/useReduceMotion";
import Button from "../components/Button";
import CustomSwitch from "../components/CustomSwitch";
import { useConfirmModal } from "../components/ConfirmModal";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  scheduleWaterReminders,
  cancelWaterReminders,
  requestNotificationPermissions,
} from "../utils/notifications";
import { logger } from "../utils/logger";

const { width: SCREEN_WIDTH } = Dimensions.get("window");


// Water drop component with beautiful fill animation
function WaterDrop({
  index,
  filled,
  onPress,
  colors,
  isDark,
  delay = 0,
}: {
  index: number;
  filled: boolean;
  onPress: () => void;
  colors: any;
  isDark: boolean;
  delay?: number;
}) {
  const scale = useSharedValue(1);
  const fillProgress = useSharedValue(filled ? 1 : 0);
  const ripple = useSharedValue(0);

  useEffect(() => {
    fillProgress.value = withDelay(
      delay,
      withSpring(filled ? 1 : 0, { damping: 12, stiffness: 100 })
    );
  }, [filled, delay]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    opacity: fillProgress.value,
    transform: [{ scale: 0.9 + fillProgress.value * 0.1 }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ripple.value, [0, 0.5, 1], [0.6, 0.3, 0], Extrapolation.CLAMP),
    transform: [{ scale: 1 + ripple.value * 0.5 }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  const handlePress = useCallback(() => {
    ripple.value = 0;
    ripple.value = withTiming(1, { duration: 400 });
    onPress();
  }, [onPress]);

  const DROP_SIZE = Math.min((SCREEN_WIDTH - 80) / 4, 72);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ margin: 6 }}
    >
      <Animated.View
        style={[
          containerStyle,
          {
            width: DROP_SIZE,
            height: DROP_SIZE,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        {/* Ripple effect */}
        <Animated.View
          style={[
            rippleStyle,
            {
              position: "absolute",
              width: DROP_SIZE,
              height: DROP_SIZE,
              borderRadius: DROP_SIZE / 2,
              backgroundColor: colors.info,
            },
          ]}
        />

        {/* Background circle */}
        <View
          style={{
            width: DROP_SIZE,
            height: DROP_SIZE,
            borderRadius: DROP_SIZE / 2,
            backgroundColor: isDark ? colors.cardBackground : colors.infoBackground,
            borderWidth: 2.5,
            borderColor: filled ? colors.info : isDark ? colors.border : colors.info + "40",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: filled ? colors.info : "#000",
            shadowOffset: { width: 0, height: filled ? 4 : 2 },
            shadowOpacity: filled ? 0.3 : 0.1,
            shadowRadius: filled ? 8 : 4,
            elevation: filled ? 6 : 2,
          }}
        >
          {/* Filled state overlay */}
          <Animated.View
            style={[
              fillStyle,
              {
                position: "absolute",
                width: DROP_SIZE - 6,
                height: DROP_SIZE - 6,
                borderRadius: (DROP_SIZE - 6) / 2,
                overflow: "hidden",
              },
            ]}
          >
            <LinearGradient
              colors={[colors.info + "90", colors.info, colors.info]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ width: "100%", height: "100%" }}
            />
          </Animated.View>

          {/* Drop icon */}
          <Ionicons
            name="water"
            size={DROP_SIZE * 0.35}
            color={filled ? "#FFFFFF" : isDark ? colors.textTertiary : colors.info + "60"}
            style={{ zIndex: 1 }}
          />

          {/* Number label */}
          <Text
            style={{
              fontSize: DROP_SIZE * 0.18,
              fontWeight: "700",
              color: filled ? "#FFFFFF" : isDark ? colors.textTertiary : colors.info + "60",
              marginTop: 2,
              zIndex: 1,
            }}
          >
            {index + 1}
          </Text>
        </View>

        {/* Checkmark badge */}
        {filled && (
          <View
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: colors.success,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2.5,
              borderColor: isDark ? colors.background : "#FFFFFF",
              shadowColor: colors.success,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            }}
          >
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// Animated progress ring
function ProgressRing({
  progress,
  size,
  strokeWidth,
  colors,
  isDark,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  colors: any;
  isDark: boolean;
}) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(progress, { damping: 15, stiffness: 50 });
  }, [progress]);

  // Ensure progress is clamped to 0-100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const isComplete = clampedProgress >= 100;
  const primaryColor = isComplete ? colors.success : colors.info;

  // Calculate which segments should be colored based on progress percentage
  // At 100%, all four segments should be colored
  const showTop = clampedProgress > 0;
  const showRight = clampedProgress > 25;
  const showBottom = clampedProgress > 50;
  const showLeft = clampedProgress > 75;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Background ring */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: isDark ? colors.border : colors.infoBackground,
        }}
      />

      {/* Gradient fill circle */}
      <View
        style={{
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
          borderRadius: (size - strokeWidth * 2) / 2,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={isComplete ? [colors.successBackground, colors.successBackground] : [colors.infoBackground, colors.infoBackground]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Inner content area */}
          <View
            style={{
              width: size - strokeWidth * 4,
              height: size - strokeWidth * 4,
              borderRadius: (size - strokeWidth * 4) / 2,
              backgroundColor: isDark ? colors.background : colors.cardBackground,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: primaryColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            }}
          />
        </LinearGradient>
      </View>

      {/* Progress indicator ring - at 100% show full ring */}
      {isComplete ? (
        <View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: primaryColor,
          }}
        />
      ) : (
        <View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: primaryColor,
            borderTopColor: showTop ? primaryColor : "transparent",
            borderRightColor: showRight ? primaryColor : "transparent",
            borderBottomColor: showBottom ? primaryColor : "transparent",
            borderLeftColor: showLeft ? primaryColor : "transparent",
            transform: [{ rotate: "-90deg" }],
          }}
        />
      )}
    </View>
  );
}

export default function WaterTrackerScreen() {
  const navigation = useNavigation();
  const { destructive } = useConfirmModal();

  const textSize = useSettingsStore((s) => s.textSize);
  const waterTrackingEnabled = useSettingsStore((s) => s.waterTrackingEnabled);
  const waterNotificationsEnabled = useSettingsStore((s) => s.waterNotificationsEnabled);
  const waterReminderTimes = useSettingsStore((s) => s.waterReminderTimes);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;

  const getTodaysWater = useHealthStore((s) => s.getTodaysWater);
  const addWaterGlass = useHealthStore((s) => s.addWaterGlass);
  const removeWaterGlass = useHealthStore((s) => s.removeWaterGlass);
  const resetWaterForToday = useHealthStore((s) => s.resetWaterForToday);

  const { primary, primaryLight, colors, isDark } = useTheme();
  const textClasses = getTextSizeClasses(textSize);
  const orientation = useOrientation();
  const isLandscape = orientation === "landscape";
  const horizontalPadding = isLandscape ? 48 : 24;

  const [waterCount, setWaterCount] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [tempHour, setTempHour] = useState(12);   // 1–12
  const [tempMinute, setTempMinute] = useState(0); // 0–59
  const [tempAmPm, setTempAmPm] = useState<"AM" | "PM">("PM");
  const [reminderTimesExpanded, setReminderTimesExpanded] = useState(false);
  const [hydrationTipDismissed, setHydrationTipDismissed] = useState(false);
  const [showWaterCheckmark, setShowWaterCheckmark] = useState(false);

  const dailyGoal = 8;
  const percentComplete = Math.min(Math.round((waterCount / dailyGoal) * 100), 100);

  const completedScale = useSharedValue(0);
  const addGlassScale = useSharedValue(1);
  const checkmarkOpacity = useSharedValue(0);
  const totalHighlight = useSharedValue(0);
  const animDuration = useAnimationDuration(300, 0);

  const triggerHaptic = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticEnabled) {
      Haptics.impactAsync(style);
    }
  }, [hapticEnabled]);

  const playWaterConfirmation = useCallback(() => {
    addGlassScale.value = withSequence(
      withTiming(1.15, { duration: 125 }),
      withTiming(1, { duration: 125 })
    );
    setShowWaterCheckmark(true);
    checkmarkOpacity.value = 1;
    checkmarkOpacity.value = withDelay(200, withTiming(0, { duration: 400 }));
    totalHighlight.value = 1;
    totalHighlight.value = withTiming(0, { duration: 800 });
    setTimeout(() => setShowWaterCheckmark(false), 700);
  }, [addGlassScale, checkmarkOpacity, totalHighlight]);

  // Handle water notifications toggle
  const handleWaterNotificationsToggle = useCallback(async (enabled: boolean) => {
    updateSettings({ waterNotificationsEnabled: enabled });

    if (enabled) {
      // Request notification permissions first
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        await scheduleWaterReminders(waterReminderTimes);
        logger.log("[WaterTracker] Water reminders enabled and scheduled");
      } else {
        // Revert the toggle if permissions denied
        updateSettings({ waterNotificationsEnabled: false });
        logger.log("[WaterTracker] Notification permissions denied");
      }
    } else {
      await cancelWaterReminders();
      logger.log("[WaterTracker] Water reminders disabled and cancelled");
    }
  }, [updateSettings, waterReminderTimes]);

  // Format time string for display (HH:MM -> h:mm AM/PM)
  const formatTimeForDisplay = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Handle editing a reminder time
  const handleEditTime = (index: number) => {
    triggerHaptic();
    const timeStr = waterReminderTimes[index];
    const [hours, minutes] = timeStr.split(":").map(Number);
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    setTempHour(h12);
    setTempMinute(minutes);
    setTempAmPm(hours < 12 ? "AM" : "PM");
    setEditingTimeIndex(index);
    setShowTimePicker(true);
  };

  // Handle adding a new reminder time
  const handleAddTime = () => {
    triggerHaptic();
    setTempHour(12);
    setTempMinute(0);
    setTempAmPm("PM");
    setEditingTimeIndex(null);
    setShowTimePicker(true);
  };

  // Save the selected time
  const handleSaveTime = async () => {
    const hours24 = tempAmPm === "AM"
      ? (tempHour === 12 ? 0 : tempHour)
      : (tempHour === 12 ? 12 : tempHour + 12);
    const newTimeStr = `${hours24.toString().padStart(2, "0")}:${tempMinute.toString().padStart(2, "0")}`;

    let newTimes: string[];
    if (editingTimeIndex !== null) {
      // Editing existing time
      newTimes = [...waterReminderTimes];
      newTimes[editingTimeIndex] = newTimeStr;
    } else {
      // Adding new time
      newTimes = [...waterReminderTimes, newTimeStr];
    }

    // Sort times chronologically
    newTimes.sort((a, b) => {
      const [aH, aM] = a.split(":").map(Number);
      const [bH, bM] = b.split(":").map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });

    updateSettings({ waterReminderTimes: newTimes });
    setShowTimePicker(false);

    // Reschedule notifications if enabled
    if (waterNotificationsEnabled) {
      await scheduleWaterReminders(newTimes);
    }
  };

  // Handle deleting a reminder time
  const handleDeleteTime = async (index: number) => {
    triggerHaptic();
    const newTimes = waterReminderTimes.filter((_, i) => i !== index);
    updateSettings({ waterReminderTimes: newTimes });

    // Reschedule notifications if enabled
    if (waterNotificationsEnabled) {
      if (newTimes.length > 0) {
        await scheduleWaterReminders(newTimes);
      } else {
        await cancelWaterReminders();
      }
    }
  };

  // Schedule water reminders on mount if enabled
  useEffect(() => {
    if (waterNotificationsEnabled && waterReminderTimes.length > 0) {
      scheduleWaterReminders(waterReminderTimes);
    }
  }, []);

  useEffect(() => {
    const count = getTodaysWater();
    setWaterCount(count);
    if (count >= dailyGoal) {
      setShowCompleted(true);
      completedScale.value = 1;
    }
  }, []);

  const toggleGlass = useCallback((index: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);

    if (index < waterCount) {
      const glassesToRemove = waterCount - index;
      for (let i = 0; i < glassesToRemove; i++) {
        removeWaterGlass();
      }
      setWaterCount(index);
      if (index < dailyGoal) {
        setShowCompleted(false);
        completedScale.value = withTiming(0);
      }
    } else {
      const glassesToAdd = index + 1 - waterCount;
      for (let i = 0; i < glassesToAdd; i++) {
        addWaterGlass();
      }
      const newCount = index + 1;
      setWaterCount(newCount);
      playWaterConfirmation();

      if (newCount >= dailyGoal) {
        setShowCompleted(true);
        completedScale.value = withSequence(
          withTiming(1.1, { duration: 200 }),
          withSpring(1, { damping: 10 })
        );
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [waterCount, addWaterGlass, removeWaterGlass, triggerHaptic, playWaterConfirmation]);

  const handleAddGlass = useCallback(() => {
    if (waterCount < dailyGoal) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      addWaterGlass();
      const newCount = waterCount + 1;
      setWaterCount(newCount);
      playWaterConfirmation();

      if (newCount >= dailyGoal) {
        setShowCompleted(true);
        completedScale.value = withSequence(
          withTiming(1.1, { duration: 200 }),
          withSpring(1, { damping: 10 })
        );
      }
    }
  }, [waterCount, addWaterGlass, triggerHaptic, playWaterConfirmation]);

  const handleReset = useCallback(() => {
    completedScale.value = 0;
    resetWaterForToday();
    setWaterCount(0);
    setShowCompleted(false);
  }, [resetWaterForToday]);

  const completedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: completedScale.value }],
    opacity: completedScale.value,
  }));

  const addGlassButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addGlassScale.value }],
  }));

  const checkmarkOverlayStyle = useAnimatedStyle(() => ({
    opacity: checkmarkOpacity.value,
  }));

  const totalHighlightStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + totalHighlight.value * 0.1 }],
  }));

  const mlConsumed = waterCount * 240;
  const mlGoal = dailyGoal * 240;

  return (
    <Screen variant="static" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingVertical: 24,
          maxWidth: isLandscape ? 700 : undefined,
          alignSelf: "center",
          width: "100%",
        }}
      >
        {/* Settings Card */}
        <View
          style={{
            backgroundColor: colors.cardBackground,
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: colors.info + "15",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name="water" size={20} color={colors.info} />
              </View>
              <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
                Track my water
              </Text>
            </View>
            <CustomSwitch
              value={waterTrackingEnabled}
              onValueChange={(value: boolean) => updateSettings({ waterTrackingEnabled: value })}
              inactiveTrackColor={colors.divider}
              activeTrackColor={colors.info}
              activeThumbColor="#FFFFFF"
              inactiveThumbColor="#FFFFFF"
              accessibilityLabel="Toggle water tracking"
            />
          </View>

          <View style={{ height: 1, backgroundColor: colors.divider, marginBottom: 16 }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: colors.warning + "15",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name="notifications" size={20} color={colors.warning} />
              </View>
              <Text className={`${textClasses.body}`} style={{ color: colors.textSecondary }}>
                Daily reminders
              </Text>
            </View>
            <CustomSwitch
              value={waterNotificationsEnabled}
              onValueChange={handleWaterNotificationsToggle}
              inactiveTrackColor={colors.divider}
              activeTrackColor={colors.info}
              activeThumbColor="#FFFFFF"
              inactiveThumbColor="#FFFFFF"
              accessibilityLabel="Toggle water reminders"
            />
          </View>

          {/* Reminder Times Section - shown when notifications enabled */}
          {waterNotificationsEnabled && (
            <>
              <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 16 }} />

              <View>
                {/* Collapsible Header */}
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setReminderTimesExpanded(!reminderTimesExpanded);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 4,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text className={`${textClasses.small} font-medium`} style={{ color: colors.textSecondary }}>
                      Reminder Times
                    </Text>
                    <View
                      style={{
                        marginLeft: 8,
                        backgroundColor: colors.info + "20",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 10,
                      }}
                    >
                      <Text className={`${textClasses.small}`} style={{ color: colors.info, fontWeight: "600" }}>
                        {waterReminderTimes.length}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    {/* Add Reminder inline button */}
                    <Pressable
                      onPress={(e) => { e.stopPropagation(); handleAddTime(); }}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        opacity: pressed ? 0.7 : 1,
                      })}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="add-circle" size={18} color={colors.info} />
                      <Text className={`${textClasses.small} font-medium`} style={{ color: colors.info, marginLeft: 4 }}>
                        Add
                      </Text>
                    </Pressable>
                    <Ionicons
                      name={reminderTimesExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>
                </Pressable>

                {/* Expanded Content */}
                {reminderTimesExpanded && (
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {waterReminderTimes.map((time, index) => (
                        <View
                          key={`${time}-${index}`}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: colors.info + "15",
                            paddingVertical: 8,
                            paddingLeft: 12,
                            paddingRight: 4,
                            borderRadius: 20,
                          }}
                        >
                          <Pressable
                            onPress={() => handleEditTime(index)}
                            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                          >
                            <Text className={`${textClasses.small} font-medium`} style={{ color: colors.info }}>
                              {formatTimeForDisplay(time)}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteTime(index)}
                            style={({ pressed }) => ({
                              marginLeft: 4,
                              padding: 4,
                              opacity: pressed ? 0.7 : 1,
                            })}
                            hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
                          >
                            <Ionicons name="close-circle" size={18} color={colors.info} />
                          </Pressable>
                        </View>
                      ))}
                    </View>

                    {waterReminderTimes.length === 0 && (
                      <Text className={`${textClasses.small}`} style={{ color: colors.textTertiary, fontStyle: "italic" }}>
                        {"No reminders set. Tap \"Add Reminder\" to create one."}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {!waterTrackingEnabled ? (
          /* Off State */
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 24,
              padding: 40,
              alignItems: "center",
              marginTop: 32,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
            }}
          >
            <LinearGradient
              colors={[colors.infoBackground, colors.infoBackground]}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Ionicons name="water-outline" size={48} color={colors.info} />
            </LinearGradient>
            <Text className={`${textClasses.title} text-center mb-3`} style={{ color: colors.textPrimary }}>
              Water tracking is off
            </Text>
            <Text className={`${textClasses.body} text-center leading-relaxed`} style={{ maxWidth: 300, color: colors.textSecondary }}>
              Turn on water tracking above to log your daily water intake and stay hydrated.
            </Text>
          </View>
        ) : (
          <>
            {/* Progress Section */}
            <View
              style={{
                backgroundColor: colors.cardBackground,
                borderRadius: 24,
                padding: 24,
                marginBottom: 24,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
              }}
            >
              {/* Progress Ring with Stats */}
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ position: "relative" }}>
                  <ProgressRing
                    progress={percentComplete}
                    size={160}
                    strokeWidth={8}
                    colors={colors}
                    isDark={isDark}
                  />

                  {/* Center content */}
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="water"
                      size={28}
                      color={percentComplete >= 100 ? colors.success : colors.info}
                    />
                    <Text
                      style={{
                        fontSize: 36,
                        fontWeight: "800",
                        color: percentComplete >= 100 ? colors.success : colors.info,
                        marginTop: 4,
                      }}
                    >
                      {waterCount}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textSecondary,
                        fontWeight: "500",
                      }}
                    >
                      of {dailyGoal} glasses
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stats Row */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  width: "100%",
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: colors.divider,
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "700", color: colors.info }}>
                    {mlConsumed}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    ml consumed
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.divider }} />
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "700", color: colors.textPrimary }}>
                    {percentComplete}%
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    of daily goal
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.divider }} />
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "700", color: colors.textTertiary }}>
                    {mlGoal - mlConsumed > 0 ? mlGoal - mlConsumed : 0}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    ml remaining
                  </Text>
                </View>
              </View>
            </View>

            {/* Water Drops Grid */}
            <View
              style={{
                backgroundColor: colors.cardBackground,
                borderRadius: 24,
                padding: 20,
                marginBottom: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <Text className={`${textClasses.subtitle} font-bold`} style={{ color: colors.textPrimary, flex: 1 }}>
                  {"Today's Progress"}
                </Text>
                <Animated.View
                  style={[
                    totalHighlightStyle,
                    {
                      backgroundColor: percentComplete >= 100 ? colors.success + "20" : colors.info + "15",
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: percentComplete >= 100 ? colors.success : colors.info,
                    }}
                  >
                    {waterCount}/{dailyGoal}
                  </Text>
                </Animated.View>
              </View>

              <Text className={`${textClasses.small} mb-4`} style={{ color: colors.textSecondary }}>
                Tap a drop to mark it as drunk
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {Array.from({ length: dailyGoal }).map((_, index) => (
                  <WaterDrop
                    key={index}
                    index={index}
                    filled={index < waterCount}
                    onPress={() => toggleGlass(index)}
                    colors={colors}
                    isDark={isDark}
                    delay={index * 50}
                  />
                ))}
              </View>
            </View>

            {/* Completion Card */}
            {showCompleted && (
              <Animated.View
                style={[
                  completedStyle,
                  {
                    marginBottom: 24,
                    borderRadius: 20,
                    overflow: "hidden",
                  },
                ]}
              >
                <LinearGradient
                  colors={[colors.successBackground, colors.successBackground]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 20 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.success,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 16,
                      }}
                    >
                      <Ionicons name="trophy" size={24} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 20, fontWeight: "700", color: colors.onSuccess }}>
                        Goal Reached!
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.success, marginTop: 2 }}>
                        Great job staying hydrated today
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Action Buttons */}
            <View style={{ gap: 12, marginBottom: 24 }}>
              <Pressable
                onPress={handleAddGlass}
                disabled={waterCount >= dailyGoal}
                style={({ pressed }) => ({
                  opacity: waterCount >= dailyGoal ? 0.5 : pressed ? 0.9 : 1,
                })}
              >
                <Animated.View style={addGlassButtonStyle}>
                  <LinearGradient
                    colors={waterCount >= dailyGoal ? [colors.divider, colors.divider] : [colors.info + "90", colors.info]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 16,
                      borderRadius: 16,
                    }}
                  >
                    <Ionicons
                      name={waterCount >= dailyGoal ? "checkmark-circle" : "add-circle"}
                      size={24}
                      color={waterCount >= dailyGoal ? colors.textTertiary : "#FFFFFF"}
                    />
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "700",
                        color: waterCount >= dailyGoal ? colors.textTertiary : "#FFFFFF",
                        marginLeft: 8,
                      }}
                    >
                      {waterCount >= dailyGoal ? "Goal Reached!" : "Add 1 Glass (+240ml)"}
                    </Text>
                    {showWaterCheckmark && (
                      <Animated.View style={[checkmarkOverlayStyle, { marginLeft: 8 }]}>
                        <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                      </Animated.View>
                    )}
                  </LinearGradient>
                </Animated.View>
              </Pressable>

              {waterCount > 0 && (
                <Button
                  title="Reset Today"
                  onPress={handleReset}
                  variant="outline"
                  size="medium"
                  fullWidth
                  accessibilityLabel="Reset water tracker for today"
                />
              )}
            </View>

            {/* Hydration Tips */}
            {!hydrationTipDismissed && (
            <View
              style={{
                backgroundColor: isDark ? colors.cardBackground : colors.infoBackground,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: isDark ? colors.border : colors.info + "40",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.info + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="bulb" size={18} color={colors.info} />
                </View>
                <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.info, flex: 1 }}>
                  Hydration Tips
                </Text>
                <Pressable
                  onPress={() => setHydrationTipDismissed(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                >
                  <Ionicons name="close" size={20} color={colors.textTertiary} />
                </Pressable>
              </View>

              <View style={{ gap: 12 }}>
                {[
                  "Drink water throughout the day, not all at once",
                  "One glass is about 8 ounces (240ml)",
                  "Increase intake during exercise or hot weather",
                ].map((tip, index) => (
                  <View key={index} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: colors.success + "20",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                        marginTop: 2,
                      }}
                    >
                      <Ionicons name="checkmark" size={12} color={colors.success} />
                    </View>
                    <Text
                      className={`${textClasses.small} flex-1`}
                      style={{ color: colors.textSecondary, lineHeight: 20 }}
                    >
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        {/* Full-screen overlay */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" }}>
          {/* Dismiss area */}
          <Pressable style={{ flex: 1 }} onPress={() => setShowTimePicker(false)} />

          {/* Sheet — pinned to bottom, full width, no flex tricks */}
          <View style={{
            backgroundColor: colors.cardBackground,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            width: "100%",
            paddingTop: 12,
            paddingHorizontal: 20,
            paddingBottom: 48,
          }}>
            {/* Handle */}
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.divider }} />
            </View>

            {/* Title */}
            <Text style={{ fontSize: 20, fontWeight: "700", textAlign: "center", color: colors.textPrimary, marginBottom: 24 }}>
              {editingTimeIndex !== null ? "Edit Reminder Time" : "Add Reminder Time"}
            </Text>

            {/* Time picker row */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
              {/* Hour */}
              <View style={{ alignItems: "center" }}>
                <Pressable onPress={() => setTempHour(h => h === 12 ? 1 : h + 1)} hitSlop={16} style={{ padding: 12 }}>
                  <Text style={{ fontSize: 18, color: colors.textSecondary }}>▲</Text>
                </Pressable>
                <View style={{ width: 72, height: 58, borderRadius: 14, backgroundColor: colors.divider, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 32, fontWeight: "700", color: colors.textPrimary }}>{tempHour.toString().padStart(2, "0")}</Text>
                </View>
                <Pressable onPress={() => setTempHour(h => h === 1 ? 12 : h - 1)} hitSlop={16} style={{ padding: 12 }}>
                  <Text style={{ fontSize: 18, color: colors.textSecondary }}>▼</Text>
                </Pressable>
              </View>

              <Text style={{ fontSize: 32, fontWeight: "700", color: colors.textPrimary, marginHorizontal: 8 }}>:</Text>

              {/* Minute */}
              <View style={{ alignItems: "center" }}>
                <Pressable onPress={() => setTempMinute(m => (m + 5) % 60)} hitSlop={16} style={{ padding: 12 }}>
                  <Text style={{ fontSize: 18, color: colors.textSecondary }}>▲</Text>
                </Pressable>
                <View style={{ width: 72, height: 58, borderRadius: 14, backgroundColor: colors.divider, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 32, fontWeight: "700", color: colors.textPrimary }}>{tempMinute.toString().padStart(2, "0")}</Text>
                </View>
                <Pressable onPress={() => setTempMinute(m => m === 0 ? 55 : m - 5)} hitSlop={16} style={{ padding: 12 }}>
                  <Text style={{ fontSize: 18, color: colors.textSecondary }}>▼</Text>
                </Pressable>
              </View>

              {/* AM/PM */}
              <View style={{ marginLeft: 16, gap: 8 }}>
                {(["AM", "PM"] as const).map(p => (
                  <Pressable key={p} onPress={() => setTempAmPm(p)} style={{
                    width: 58, height: 40, borderRadius: 10,
                    backgroundColor: tempAmPm === p ? colors.info : colors.divider,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: tempAmPm === p ? "#fff" : colors.textSecondary }}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Buttons — side by side, explicit widths so neither can go off-screen */}
            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              <Pressable
                onPress={() => setShowTimePicker(false)}
                style={{ flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: colors.divider, alignItems: "center" }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveTime}
                style={{ flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: colors.info, alignItems: "center" }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                  {editingTimeIndex !== null ? "Save" : "Add"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </Screen>
  );
}
