import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FormSectionProps } from "../types";
import { AlertTiming, SecondAlertTiming } from "../../../types/app";
import CustomSwitch from "../../CustomSwitch";

// Alert timing options
const ALERT_OPTIONS: { value: AlertTiming; label: string }[] = [
  { value: "at_time", label: "At time of dose" },
  { value: "5_min", label: "5 minutes before" },
  { value: "15_min", label: "15 minutes before" },
  { value: "30_min", label: "30 minutes before" },
];

const SECOND_ALERT_OPTIONS: { value: SecondAlertTiming; label: string }[] = [
  { value: "none", label: "None" },
  ...ALERT_OPTIONS,
];

function getAlertLabel(value: AlertTiming | SecondAlertTiming, options: { value: string; label: string }[]): string {
  return options.find((o) => o.value === value)?.label || "Select";
}

export function RemindersSection({
  formState,
  updateField,
  textClasses,
  colors,
  primary,
}: FormSectionProps) {
  const { reminderEnabled, soundReminderEnabled, firstAlert, secondAlert, notes } = formState;
  const [firstAlertOpen, setFirstAlertOpen] = useState(false);
  const [secondAlertOpen, setSecondAlertOpen] = useState(false);

  return (
    <>
      {/* Notes/Instructions Input */}
      <Text
        className={`${textClasses.body} font-semibold mb-2`}
        style={{ color: colors.textPrimary }}
      >
        Instructions (Optional)
      </Text>
      <TextInput
        value={notes}
        onChangeText={(value) => updateField("notes", value)}
        placeholder="E.g., Take with food, Do not take with dairy..."
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={{
          backgroundColor: colors.cardBackground,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 16,
          minHeight: 80,
          fontSize: 16,
          marginBottom: 24,
        }}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel="Medication instructions"
      />

      {/* Reminder Toggle */}
      <View
        style={{
          backgroundColor: colors.primaryLight,
          padding: 24,
          borderRadius: 12,
          marginBottom: 16,
          borderWidth: 2,
          borderColor: primary,
        }}
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-1 pr-4">
            <Text
              className={`${textClasses.body} font-semibold mb-1`}
              style={{ color: colors.textPrimary }}
            >
              Do you want a reminder for this medication?
            </Text>
            <Text
              className={`${textClasses.small}`}
              style={{ color: colors.textSecondary }}
            >
              Get notified when it&apos;s time to take your medication
            </Text>
          </View>
          <CustomSwitch
            value={reminderEnabled}
            onValueChange={(value: boolean) =>
              updateField("reminderEnabled", value)
            }
            inactiveTrackColor={colors.border}
            activeTrackColor={primary}
            activeThumbColor="#FFFFFF"
            inactiveThumbColor="#FFFFFF"
          />
        </View>
        {reminderEnabled && (
          <View className="flex-row items-center mt-2">
            <Ionicons name="notifications" size={16} color={primary} />
            <Text
              className={`${textClasses.small} ml-2`}
              style={{ color: primary }}
            >
              Reminder is on
            </Text>
          </View>
        )}
      </View>

      {/* Alert Time Options - Only show when reminder is enabled */}
      {reminderEnabled && (
        <View
          style={{
            backgroundColor: colors.cardBackground,
            borderRadius: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          {/* First Alert — Accordion Header */}
          <Pressable
            onPress={() => {
              setFirstAlertOpen(!firstAlertOpen);
              setSecondAlertOpen(false);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 18,
              borderBottomWidth: firstAlertOpen ? 1 : 0,
              borderBottomColor: colors.divider,
            }}
            accessibilityRole="button"
            accessibilityLabel={`First alert: ${getAlertLabel(firstAlert, ALERT_OPTIONS)}. Tap to change.`}
          >
            <View style={{ flex: 1 }}>
              <Text
                className={`${textClasses.small} font-semibold`}
                style={{ color: colors.textSecondary, marginBottom: 4 }}
              >
                First Alert
              </Text>
              <Text
                style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "500" }}
              >
                {getAlertLabel(firstAlert, ALERT_OPTIONS)}
              </Text>
            </View>
            <Ionicons
              name={firstAlertOpen ? "chevron-up" : "chevron-down"}
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>

          {/* First Alert — Expanded Options */}
          {firstAlertOpen && (
            <View style={{ padding: 12 }}>
              {ALERT_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    updateField("firstAlert", option.value);
                    setFirstAlertOpen(false);
                  }}
                  style={{
                    backgroundColor: firstAlert === option.value ? primary : "transparent",
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: firstAlert === option.value ? primary : colors.border,
                    minHeight: 56,
                    justifyContent: "center",
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: firstAlert === option.value }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      color: firstAlert === option.value ? "#FFFFFF" : colors.textPrimary,
                      fontWeight: firstAlert === option.value ? "600" : "normal",
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Second Alert — Accordion Header */}
          <Pressable
            onPress={() => {
              setSecondAlertOpen(!secondAlertOpen);
              setFirstAlertOpen(false);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 18,
              borderTopWidth: 1,
              borderTopColor: colors.divider,
              borderBottomWidth: secondAlertOpen ? 1 : 0,
              borderBottomColor: colors.divider,
            }}
            accessibilityRole="button"
            accessibilityLabel={`Second alert: ${getAlertLabel(secondAlert, SECOND_ALERT_OPTIONS)}. Tap to change.`}
          >
            <View style={{ flex: 1 }}>
              <Text
                className={`${textClasses.small} font-semibold`}
                style={{ color: colors.textSecondary, marginBottom: 4 }}
              >
                Second Alert (Optional)
              </Text>
              <Text
                style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "500" }}
              >
                {getAlertLabel(secondAlert, SECOND_ALERT_OPTIONS)}
              </Text>
            </View>
            <Ionicons
              name={secondAlertOpen ? "chevron-up" : "chevron-down"}
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>

          {/* Second Alert — Expanded Options */}
          {secondAlertOpen && (
            <View style={{ padding: 12 }}>
              {SECOND_ALERT_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    updateField("secondAlert", option.value);
                    setSecondAlertOpen(false);
                  }}
                  style={{
                    backgroundColor: secondAlert === option.value ? primary : "transparent",
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: secondAlert === option.value ? primary : colors.border,
                    minHeight: 56,
                    justifyContent: "center",
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: secondAlert === option.value }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      color: secondAlert === option.value ? "#FFFFFF" : colors.textPrimary,
                      fontWeight: secondAlert === option.value ? "600" : "normal",
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Sound Reminder Toggle */}
      {reminderEnabled && (
        <View
          style={{
            backgroundColor: colors.primaryLight,
            padding: 24,
            borderRadius: 12,
            marginBottom: 24,
            borderWidth: 2,
            borderColor: colors.success,
          }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-1 pr-4">
              <Text
                className={`${textClasses.body} font-semibold mb-1`}
                style={{ color: colors.textPrimary }}
              >
                Play a sound with reminder?
              </Text>
              <Text
                className={`${textClasses.small}`}
                style={{ color: colors.textSecondary }}
              >
                Helpful if you might miss the notification
              </Text>
            </View>
            <CustomSwitch
              value={soundReminderEnabled}
              onValueChange={(value: boolean) =>
                updateField("soundReminderEnabled", value)
              }
              inactiveTrackColor={colors.border}
              activeTrackColor={colors.success}
              activeThumbColor="#FFFFFF"
              inactiveThumbColor="#FFFFFF"
            />
          </View>
          {soundReminderEnabled && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="volume-high" size={16} color={colors.success} />
              <Text
                className={`${textClasses.small} ml-2`}
                style={{ color: colors.success }}
              >
                Sound alert enabled
              </Text>
            </View>
          )}
        </View>
      )}
    </>
  );
}
