/**
 * CalendarModal - Monthly calendar view for date selection
 */
import React, { useState, useMemo, useCallback } from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isAfter,
  startOfDay,
} from "date-fns";
import * as Haptics from "expo-haptics";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";

interface CalendarModalProps {
  visible: boolean;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
  maxDate?: Date;
  minDate?: Date;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarModal({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
  maxDate = new Date(),
  minDate,
}: CalendarModalProps) {
  const { colors, primary, primaryLight, isDark } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);

  // Current month being viewed
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(selectedDate));

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Check if we can go to next month
  const canGoNextMonth = useMemo(() => {
    const nextMonth = addMonths(currentMonth, 1);
    return !isAfter(startOfMonth(nextMonth), startOfDay(maxDate));
  }, [currentMonth, maxDate]);

  // Check if we can go to previous month
  const canGoPrevMonth = useMemo(() => {
    if (!minDate) return true;
    const prevMonth = subMonths(currentMonth, 1);
    return !isAfter(startOfDay(minDate), endOfMonth(prevMonth));
  }, [currentMonth, minDate]);

  const handlePrevMonth = useCallback(() => {
    if (canGoPrevMonth) {
      triggerHaptic();
      setCurrentMonth(subMonths(currentMonth, 1));
    }
  }, [currentMonth, canGoPrevMonth, triggerHaptic]);

  const handleNextMonth = useCallback(() => {
    if (canGoNextMonth) {
      triggerHaptic();
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  }, [currentMonth, canGoNextMonth, triggerHaptic]);

  const handleSelectDate = useCallback(
    (date: Date) => {
      const today = startOfDay(maxDate);
      const dayStart = startOfDay(date);

      // Check if date is within bounds
      if (isAfter(dayStart, today)) return;
      if (minDate && isAfter(startOfDay(minDate), dayStart)) return;

      triggerHaptic();
      onSelectDate(date);
      onClose();
    },
    [maxDate, minDate, triggerHaptic, onSelectDate, onClose]
  );

  const handleTodayPress = useCallback(() => {
    triggerHaptic();
    setCurrentMonth(startOfMonth(new Date()));
    onSelectDate(new Date());
    onClose();
  }, [triggerHaptic, onSelectDate, onClose]);

  const renderDay = useCallback(
    (day: Date, index: number) => {
      const isCurrentMonth = isSameMonth(day, currentMonth);
      const isSelected = isSameDay(day, selectedDate);
      const isToday = isSameDay(day, new Date());
      const isFuture = isAfter(startOfDay(day), startOfDay(maxDate));
      const isPast = minDate ? isAfter(startOfDay(minDate), startOfDay(day)) : false;
      const isDisabled = isFuture || isPast || !isCurrentMonth;

      return (
        <Pressable
          key={index}
          onPress={() => !isDisabled && handleSelectDate(day)}
          disabled={isDisabled}
          style={{
            width: "14.28%",
            aspectRatio: 1,
            alignItems: "center",
            justifyContent: "center",
            opacity: isDisabled ? 0.3 : 1,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isSelected
                ? primary
                : isToday
                ? primaryLight
                : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: isSelected || isToday ? "600" : "400",
                color: isSelected
                  ? "#FFFFFF"
                  : isToday
                  ? primary
                  : isCurrentMonth
                  ? colors.textPrimary
                  : colors.textTertiary,
              }}
            >
              {format(day, "d")}
            </Text>
          </View>
        </Pressable>
      );
    },
    [currentMonth, selectedDate, maxDate, minDate, primary, primaryLight, colors, handleSelectDate]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.cardBackground,
            borderRadius: 24,
            padding: 20,
            width: "100%",
            maxWidth: 360,
          }}
        >
          {/* Header with month/year and navigation */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <Pressable
              onPress={handlePrevMonth}
              disabled={!canGoPrevMonth}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: canGoPrevMonth ? primaryLight : colors.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: canGoPrevMonth ? 1 : 0.5,
              }}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={canGoPrevMonth ? primary : colors.textTertiary}
              />
            </Pressable>

            <Text
              className={`${textClasses.subtitle} font-semibold`}
              style={{ color: colors.textPrimary }}
            >
              {format(currentMonth, "MMMM yyyy")}
            </Text>

            <Pressable
              onPress={handleNextMonth}
              disabled={!canGoNextMonth}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: canGoNextMonth ? primaryLight : colors.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: canGoNextMonth ? 1 : 0.5,
              }}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={canGoNextMonth ? primary : colors.textTertiary}
              />
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            {WEEKDAYS.map((day) => (
              <View
                key={day}
                style={{
                  width: "14.28%",
                  alignItems: "center",
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.textSecondary,
                  }}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {calendarDays.map((day, index) => renderDay(day, index))}
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            <Pressable
              onPress={handleTodayPress}
              style={{
                flex: 1,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: primaryLight,
                minHeight: 48,
              }}
            >
              <Text
                className={`${textClasses.body} font-semibold`}
                style={{ color: primary }}
              >
                Today
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
                minHeight: 48,
              }}
            >
              <Text
                className={`${textClasses.body}`}
                style={{ color: colors.textSecondary }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
