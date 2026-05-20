import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FrequencySectionProps } from "../types";
import { frequencyOptions } from "../../../utils/medicationData";

export function FrequencySection({
  formState,
  updateField,
  textClasses,
  colors,
  primary,
  onFrequencyChange,
}: FrequencySectionProps) {
  const { frequency, startDate, showDatePicker } = formState;
  const [isExpanded, setIsExpanded] = useState(false);

  const needsStartDate =
    frequency === "every-other-day" ||
    frequency === "weekly" ||
    frequency === "biweekly" ||
    frequency === "monthly" ||
    frequency === "quarterly" ||
    frequency === "yearly" ||
    frequency === "one-time";

  // Get the current frequency label and description
  const currentOption = frequencyOptions.find((opt) => opt.value === frequency);
  const currentLabel = currentOption?.label || "Select frequency";
  const currentDescription = currentOption?.description || "";

  const handleSelect = (value: typeof frequency) => {
    onFrequencyChange(value);
    setIsExpanded(false);
  };

  return (
    <>
      {/* Frequency - Collapsible Section */}
      <Text
        className={`${textClasses.body} font-semibold mb-2`}
        style={{ color: colors.textPrimary }}
      >
        How often?
      </Text>

      {/* Collapsed View - Shows current selection */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between px-6 py-4 mb-2 rounded-xl"
        style={{
          backgroundColor: colors.primaryLight,
          borderWidth: 2,
          borderColor: primary,
          minHeight: 56,
        }}
        accessibilityRole="button"
        accessibilityLabel={`Selected frequency: ${currentLabel}. Tap to change.`}
      >
        <View className="flex-1">
          <Text
            className={`${textClasses.body} font-semibold`}
            style={{ color: primary }}
          >
            {currentLabel}
          </Text>
          {currentDescription && (
            <Text
              className={`${textClasses.small} mt-1`}
              style={{ color: colors.textSecondary }}
            >
              {currentDescription}
            </Text>
          )}
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={24}
          color={primary}
        />
      </Pressable>

      {/* Expanded Options */}
      {isExpanded && (
        <View
          className="mb-4 rounded-xl overflow-hidden"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 2,
            borderColor: primary,
          }}
        >
          {frequencyOptions.map((option, index) => (
            <Pressable
              key={option.value}
              onPress={() => handleSelect(option.value)}
              className="flex-row items-center justify-between px-6 py-5"
              style={{
                backgroundColor:
                  frequency === option.value
                    ? colors.primaryLight
                    : "transparent",
                minHeight: 60,
                borderBottomWidth: index < frequencyOptions.length - 1 ? 1 : 0,
                borderBottomColor: colors.divider,
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: frequency === option.value }}
            >
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} ${
                    frequency === option.value ? "font-semibold" : ""
                  }`}
                  style={{
                    color:
                      frequency === option.value ? primary : colors.textPrimary,
                    fontSize: 17,
                  }}
                >
                  {option.label}
                </Text>
                {option.description && (
                  <Text
                    className={`${textClasses.small} mt-1`}
                    style={{ color: colors.textSecondary }}
                  >
                    {option.description}
                  </Text>
                )}
              </View>
              {frequency === option.value && (
                <Ionicons name="checkmark-circle" size={24} color={primary} />
              )}
            </Pressable>
          ))}
        </View>
      )}

      {!isExpanded && <View className="mb-4" />}

      {/* Start Date Selection for schedules that need it */}
      {needsStartDate && (
        <View className="mb-6">
          <Text
            className={`${textClasses.body} font-semibold mb-2`}
            style={{ color: colors.textPrimary }}
          >
            {frequency === "one-time" ? "When?" : "Starting from what day?"}
          </Text>
          <Pressable
            onPress={() => updateField("showDatePicker", true)}
            style={{
              backgroundColor: colors.primaryLight,
              borderWidth: 2,
              borderColor: primary,
              borderRadius: 12,
              padding: 24,
              minHeight: 48,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className={`${textClasses.body} font-semibold mb-1`}
                  style={{ color: colors.textPrimary }}
                >
                  {startDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  Tap to change the {frequency === "one-time" ? "date" : "start date"}
                </Text>
              </View>
              <Ionicons name="calendar" size={24} color={primary} />
            </View>
          </Pressable>

          {/* Date Picker Modal */}
          {showDatePicker && (
            <View
              className="mt-4 rounded-xl overflow-hidden"
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 2,
                borderColor: primary,
              }}
            >
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === "android") {
                    updateField("showDatePicker", false);
                  }
                  if (selectedDate && event.type !== "dismissed") {
                    updateField("startDate", selectedDate);
                  }
                }}
                minimumDate={new Date()}
                textColor={colors.textPrimary}
                {...(Platform.OS === "ios" && { themeVariant: colors.background === "#2B2B2B" ? "dark" : "light" })}
              />
              {Platform.OS === "ios" && (
                <Pressable
                  onPress={() => updateField("showDatePicker", false)}
                  style={{ backgroundColor: primary, paddingVertical: 16, minHeight: 48 }}
                >
                  <Text
                    className={`${textClasses.body} text-center font-semibold`}
                    style={{ color: colors.onPrimary }}
                  >
                    Done
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}
    </>
  );
}
