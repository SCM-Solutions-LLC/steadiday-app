import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { format, isToday, isTomorrow, addDays } from "date-fns";
import type { MedicationsWidgetProps } from "../types";
import type { Medication } from "../../../types/app";

interface MedicationWithTime extends Medication {
  scheduledTime: string;
  displayDate: string;
}

export function MedicationsWidget({
  nextMed,
  allMedications,
  textClasses,
  colors,
  primary,
}: MedicationsWidgetProps) {
  const navigation = useNavigation();

  const getMedIcon = (timeOfDay?: string) => {
    switch (timeOfDay) {
      case "morning":
        return "sunny";
      case "afternoon":
        return "partly-sunny";
      case "evening":
        return "cloudy-night";
      case "night":
        return "moon";
      default:
        return "medical";
    }
  };

  // Get all scheduled medications for today and tomorrow
  // When no medications are left for today, show ALL of tomorrow's medications
  const scheduledMeds = useMemo(() => {
    if (!allMedications || allMedications.length === 0) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = addDays(today, 1);

    const todaysMeds: MedicationWithTime[] = [];
    const tomorrowsMeds: MedicationWithTime[] = [];

    allMedications.forEach((med) => {
      if (!med.reminderEnabled || !med.times || med.times.length === 0) {
        return;
      }

      // Add today's remaining medications
      med.times.forEach((time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        const scheduledDateTime = new Date(today);
        scheduledDateTime.setHours(hours, minutes, 0, 0);

        // Only show if not in the past
        if (scheduledDateTime > now) {
          todaysMeds.push({
            ...med,
            scheduledTime: time,
            displayDate: "Today",
          });
        }
      });

      // Add ALL of tomorrow's medications
      med.times.forEach((time: string) => {
        tomorrowsMeds.push({
          ...med,
          scheduledTime: time,
          displayDate: "Tomorrow",
        });
      });
    });

    // Sort each day's medications by time
    todaysMeds.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    tomorrowsMeds.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    // If there are medications left today, show today's (max 5)
    // If no medications left today, show ALL of tomorrow's medications
    if (todaysMeds.length > 0) {
      // Show today's meds, and fill remaining slots with tomorrow's
      const combined = [...todaysMeds, ...tomorrowsMeds];
      return combined.slice(0, 5);
    } else {
      // No meds left today - show ALL tomorrow's medications (no limit)
      return tomorrowsMeds;
    }
  }, [allMedications]);

  // Format time for display (e.g., "8:00 AM")
  const formatTimeDisplay = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Determine the header text based on scheduled meds
  const headerText = useMemo(() => {
    if (scheduledMeds.length === 0) {
      return "Medications";
    }
    const firstMed = scheduledMeds[0];
    if (firstMed.displayDate === "Today") {
      return "Today's Medications";
    }
    return "Tomorrow's Medications";
  }, [scheduledMeds]);

  return (
    <Pressable
      onPress={() => (navigation as any).navigate("Meds")}
      accessibilityRole="button"
      accessibilityLabel="View all medications"
      accessibilityHint="Double tap to open your medications"
    >
      <View
        className="rounded-3xl p-4 mb-6 border"
        style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className={`${textClasses.subtitle}`} style={{ color: colors.textPrimary }}>
            {headerText}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>

        {scheduledMeds.length === 0 ? (
          <Text className={`${textClasses.body}`} style={{ color: colors.textSecondary }}>
            No medications scheduled
          </Text>
        ) : (
          scheduledMeds.map((med, index) => (
            <View
              key={`${med.id}-${med.scheduledTime}-${med.displayDate}`}
              className={`flex-row items-center py-3 ${
                index < scheduledMeds.length - 1 ? "border-b" : ""
              }`}
              style={{ borderBottomColor: colors.divider }}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Ionicons name={getMedIcon(med.timeOfDay) as any} size={20} color={primary} />
              </View>
              <View className="ml-3 flex-1">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                  numberOfLines={1}
                >
                  {med.name}
                </Text>
                {med.dosage && (
                  <Text
                    className={`${textClasses.small}`}
                    style={{ color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {med.dosage}
                  </Text>
                )}
              </View>
              <View className="items-end">
                <View className="flex-row items-center">
                  <Ionicons name="time" size={14} color={primary} />
                  <Text className={`${textClasses.small} ml-1 font-medium`} style={{ color: primary }}>
                    {formatTimeDisplay(med.scheduledTime)}
                  </Text>
                </View>
                {/* Show date label if it's tomorrow or mixed dates */}
                {med.displayDate === "Tomorrow" && (
                  <Text
                    className={`${textClasses.small} mt-1`}
                    style={{ color: colors.textTertiary }}
                  >
                    Tomorrow
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </Pressable>
  );
}
