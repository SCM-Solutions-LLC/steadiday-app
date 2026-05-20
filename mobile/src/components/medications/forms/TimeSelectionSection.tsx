import React, { useState } from "react";
import { View, Text, Platform, Pressable } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { TimeSelectionSectionProps } from "../types";
import { formatTime } from "../../../utils/time";
import { formatTimeFromDate } from "../types";

export function TimeSelectionSection({
  formState,
  updateField,
  textClasses,
  colors,
  primary,
  onUpdateTimeAtIndex,
}: TimeSelectionSectionProps) {
  const { frequency, specificTime, multipleTimes } = formState;
  const [androidPickerIndex, setAndroidPickerIndex] = useState<number | null>(null);
  const [showAndroidSinglePicker, setShowAndroidSinglePicker] = useState(false);

  const needsMultipleTimes =
    frequency === "twice-daily" ||
    frequency === "three-times-daily" ||
    frequency === "four-times-daily";

  // Don't show time selection for "as-needed" medications
  if (frequency === "as-needed") {
    return (
      <View className="mb-6">
        <Text
          className={`${textClasses.body} font-semibold mb-2`}
          style={{ color: colors.textPrimary }}
        >
          What time?
        </Text>
        <View
          style={{
            backgroundColor: colors.primaryLight,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <Text
            className={`${textClasses.body} text-center`}
            style={{ color: colors.textSecondary }}
          >
            Take as needed - no specific time set
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      {/* Time Selection */}
      <Text
        className={`${textClasses.body} font-semibold mb-2`}
        style={{ color: colors.textPrimary }}
      >
        What time{needsMultipleTimes ? "s" : ""}?
      </Text>

      {needsMultipleTimes ? (
        // Multiple time pickers for twice-daily or three-times-daily
        <View className="mb-6">
          {multipleTimes.map((time, index) => (
            <View
              key={index}
              style={{
                backgroundColor: colors.primaryLight,
                borderWidth: 2,
                borderColor: primary,
                borderRadius: 12,
                padding: 24,
                marginBottom: 16,
              }}
            >
              <Pressable
                onPress={() => {
                  if (Platform.OS === "android") {
                    setAndroidPickerIndex(index);
                  }
                }}
              >
                <Text
                  className={`${textClasses.body} text-center mb-2 font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Time {index + 1}: {formatTime(formatTimeFromDate(time))}
                </Text>
              </Pressable>
              {(Platform.OS === "ios" || androidPickerIndex === index) && (
                <View
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: colors.cardBackground }}
                >
                  <DateTimePicker
                    value={time}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedTime) => {
                      if (Platform.OS === "android") {
                        setAndroidPickerIndex(null);
                      }
                      if (selectedTime && event.type !== "dismissed") {
                        onUpdateTimeAtIndex(index, selectedTime);
                      }
                    }}
                    textColor={colors.textPrimary}
                    {...(Platform.OS === "ios" && { themeVariant: colors.background === "#2B2B2B" ? "dark" : "light" })}
                  />
                </View>
              )}
            </View>
          ))}
          <Text
            className={`${textClasses.small} text-center`}
            style={{ color: colors.textSecondary }}
          >
            Set a time for each dose
          </Text>
        </View>
      ) : (
        // Single time picker for other frequencies
        <View
          style={{
            backgroundColor: colors.primaryLight,
            borderWidth: 2,
            borderColor: primary,
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <Pressable
            onPress={() => {
              if (Platform.OS === "android") {
                setShowAndroidSinglePicker(true);
              }
            }}
          >
            <Text
              className={`${textClasses.body} text-center mb-4 font-semibold`}
              style={{ color: colors.textPrimary }}
            >
              {formatTime(formatTimeFromDate(specificTime))}
            </Text>
          </Pressable>
          {(Platform.OS === "ios" || showAndroidSinglePicker) && (
            <View
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <DateTimePicker
                value={specificTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedTime) => {
                  if (Platform.OS === "android") {
                    setShowAndroidSinglePicker(false);
                  }
                  if (selectedTime && event.type !== "dismissed") {
                    updateField("specificTime", selectedTime);
                  }
                }}
                textColor={colors.textPrimary}
                {...(Platform.OS === "ios" && { themeVariant: colors.background === "#2B2B2B" ? "dark" : "light" })}
              />
            </View>
          )}
          <Text
            className={`${textClasses.small} text-center mt-3`}
            style={{ color: colors.textSecondary }}
          >
            {Platform.OS === "android" ? "Tap the time above to change it" : "Scroll to select when to take this medication"}
          </Text>
        </View>
      )}
    </>
  );
}
