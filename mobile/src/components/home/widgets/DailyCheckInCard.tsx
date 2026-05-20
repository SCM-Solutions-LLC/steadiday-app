import React, { useCallback, useState } from "react";
import { View, Text, Pressable, Modal, TextInput, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import {
  useCheckInStore,
  CheckInValue,
  getCheckInDisplayText,
  getCheckInEmoji,
} from "../../../state/stores/checkInStore";
import { useSettingsStore } from "../../../state/stores/settingsStore";
import { useTheme } from "../../../utils/useTheme";
import { getTextSizeClasses } from "../../../utils/textSizes";
import { useSlowMode } from "../../../utils/useSlowMode";

interface CheckInOption {
  value: CheckInValue;
  label: string;
}

// Updated check-in options - "Doing well" instead of "Doing okay"
const CHECK_IN_OPTIONS: CheckInOption[] = [
  { value: "good", label: "Doing well" },
  { value: "ok", label: "A bit off" },
  { value: "not_great", label: "Not great" },
];

/**
 * DailyCheckInCard - A calm, no-pressure emotional check-in card
 *
 * Design principles:
 * - No streaks or pressure
 * - Simple 3-option choice
 * - Shows once per day only
 * - Can be skipped without guilt
 * - Allows editing same day
 */
export default function DailyCheckInCard() {
  const { colors, primary, primaryLight } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const textClasses = getTextSizeClasses(textSize);
  const { primaryButtonHeight, getAnimationDuration, extraPadding } = useSlowMode();

  // Check-in store - use individual selectors
  // Subscribe to the raw data to ensure re-renders when state changes
  const checkInsByDate = useCheckInStore((s) => s.checkInsByDate);
  const getTodaysCheckIn = useCheckInStore((s) => s.getTodaysCheckIn);
  const getTodaysCheckInReason = useCheckInStore((s) => s.getTodaysCheckInReason);
  const completeCheckIn = useCheckInStore((s) => s.completeCheckIn);
  const skipCheckInToday = useCheckInStore((s) => s.skipCheckInToday);
  const setCheckInValueForToday = useCheckInStore((s) => s.setCheckInValueForToday);
  const clearSkipForToday = useCheckInStore((s) => s.clearSkipForToday);

  // Modal state for editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSelectedFeeling, setEditSelectedFeeling] = useState<CheckInValue | null>(null);

  // Two-step flow: first select feeling, then optionally add reason
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<CheckInValue | null>(null);
  const [reasonText, setReasonText] = useState("");

  // Evaluate state - derive from checkInsByDate to ensure reactivity
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayEntry = checkInsByDate[todayStr];
  const completedToday = !!todayEntry;
  const skippedToday = todayEntry?.skipped ?? false;
  const canShow = !todayEntry;
  const todaysCheckIn = getTodaysCheckIn();

  // Animation for button press
  const selectedScale = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [hapticEnabled]);

  const handleCheckIn = useCallback(
    (value: CheckInValue) => {
      triggerHaptic();

      // Animate
      selectedScale.value = withSequence(
        withTiming(0.95, { duration: getAnimationDuration(100) }),
        withSpring(1, { damping: 15 })
      );

      // Show reason modal for two-step flow
      setSelectedFeeling(value);
      setReasonText("");
      setShowReasonModal(true);
    },
    [triggerHaptic, selectedScale, getAnimationDuration]
  );

  const handleConfirmCheckIn = useCallback(() => {
    if (selectedFeeling) {
      Keyboard.dismiss();
      completeCheckIn(selectedFeeling, reasonText);
      setShowReasonModal(false);
      setSelectedFeeling(null);
      setReasonText("");
    }
  }, [selectedFeeling, reasonText, completeCheckIn]);

  const handleSkipReason = useCallback(() => {
    if (selectedFeeling) {
      completeCheckIn(selectedFeeling);
      setShowReasonModal(false);
      setSelectedFeeling(null);
      setReasonText("");
    }
  }, [selectedFeeling, completeCheckIn]);

  const handleSkip = useCallback(() => {
    triggerHaptic();
    skipCheckInToday();
  }, [triggerHaptic, skipCheckInToday]);

  // When selecting an emotion in edit mode - just sets it, doesn't save yet
  const handleEditSelectFeeling = useCallback(
    (value: CheckInValue) => {
      triggerHaptic();
      setEditSelectedFeeling(value);
    },
    [triggerHaptic]
  );

  // Save the edited check-in
  const handleSaveEditCheckIn = useCallback(() => {
    if (editSelectedFeeling) {
      Keyboard.dismiss();
      setCheckInValueForToday(editSelectedFeeling, reasonText);
      setShowEditModal(false);
      setEditSelectedFeeling(null);
      setReasonText("");
    }
  }, [editSelectedFeeling, setCheckInValueForToday, reasonText]);

  const handleAddCheckInAfterSkip = useCallback(() => {
    triggerHaptic();
    clearSkipForToday();
  }, [triggerHaptic, clearSkipForToday]);

  const selectedAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectedScale.value }],
  }));

  // If already completed today, show collapsed row with edit option
  if (completedToday && !skippedToday && todaysCheckIn) {
    const todaysReason = getTodaysCheckInReason();
    return (
      <>
        <Pressable
          onPress={() => {
            triggerHaptic();
            setReasonText(todaysReason || "");
            setEditSelectedFeeling(todaysCheckIn);
            setShowEditModal(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="View and edit today's check-in"
        >
          <Animated.View
            style={[
              selectedAnimatedStyle,
              {
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16 + extraPadding,
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 18 }}>{getCheckInEmoji(todaysCheckIn)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  className={`${textClasses.body}`}
                  style={{ color: colors.textPrimary }}
                >
                  {"Today's check-in"}
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  {getCheckInDisplayText(todaysCheckIn)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: primary, marginRight: 4 }}
                >
                  Edit
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textTertiary}
                />
              </View>
            </View>
            {/* Show reason if exists */}
            {todaysReason ? (
              <View
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary, fontStyle: "italic" }}
                  numberOfLines={2}
                >
                  {`"${todaysReason}"`}
                </Text>
              </View>
            ) : null}
          </Animated.View>
        </Pressable>

        {/* Edit Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowEditModal(false);
            setReasonText("");
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "flex-end",
              }}
              onPress={() => {
                Keyboard.dismiss();
                setShowEditModal(false);
                setReasonText("");
              }}
            >
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: colors.cardBackground,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  paddingBottom: 40,
                  maxHeight: "85%",
                }}
              >
                <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                    <Ionicons name="heart" size={24} color={primary} />
                    <Text
                      className={`${textClasses.subtitle} font-semibold ml-3`}
                      style={{ color: colors.textPrimary }}
                    >
                      Edit Check-In
                    </Text>
                  </View>

                  <Text
                    className={`${textClasses.body} mb-4`}
                    style={{ color: colors.textSecondary }}
                  >
                    How are you feeling today?
                  </Text>

                  {/* Options */}
                  <View style={{ gap: 10 }}>
                    {CHECK_IN_OPTIONS.map((option) => {
                      const isSelected = editSelectedFeeling === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => handleEditSelectFeeling(option.value)}
                          className="flex-row items-center rounded-2xl px-4 active:opacity-80"
                          style={{
                            backgroundColor: isSelected ? primaryLight : colors.background,
                            borderWidth: 2,
                            borderColor: isSelected ? primary : colors.border,
                            minHeight: primaryButtonHeight,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={option.label}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text style={{ fontSize: 24, marginRight: 12 }}>
                            {getCheckInEmoji(option.value)}
                          </Text>
                          <Text
                            className={`${textClasses.body}`}
                            style={{ color: colors.textPrimary, flex: 1 }}
                          >
                            {option.label}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={24} color={primary} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Reason text input */}
                  <Text
                    className={`${textClasses.small} mt-4 mb-2`}
                    style={{ color: colors.textSecondary }}
                  >
                    Notes (optional)
                  </Text>
                  <TextInput
                    value={reasonText}
                    onChangeText={setReasonText}
                    placeholder="What made you feel this way today?"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={2}
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 15,
                      color: colors.textPrimary,
                      minHeight: 60,
                      textAlignVertical: "top",
                    }}
                    maxLength={500}
                  />

                  {/* Action buttons - Cancel and Save */}
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                    <Pressable
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowEditModal(false);
                        setEditSelectedFeeling(null);
                        setReasonText("");
                      }}
                      style={{
                        flex: 1,
                        borderRadius: 14,
                        padding: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: colors.border,
                        minHeight: 52,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel"
                    >
                      <Text
                        className={`${textClasses.body}`}
                        style={{ color: colors.textSecondary }}
                      >
                        Cancel
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleSaveEditCheckIn}
                      disabled={!editSelectedFeeling}
                      style={{
                        flex: 1,
                        borderRadius: 14,
                        padding: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: editSelectedFeeling ? primary : colors.border,
                        minHeight: 52,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Save check-in"
                    >
                      <Text
                        className={`${textClasses.body} font-semibold`}
                        style={{ color: editSelectedFeeling ? "#FFFFFF" : colors.textTertiary }}
                      >
                        Save
                      </Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>
      </>
    );
  }

  // If skipped today, show collapsed row with "Add check-in" option
  if (completedToday && skippedToday) {
    return (
      <Pressable
        onPress={handleAddCheckInAfterSkip}
        accessibilityRole="button"
        accessibilityLabel="Add check-in for today"
      >
        <Animated.View
          style={[
            selectedAnimatedStyle,
            {
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16 + extraPadding,
              flexDirection: "row",
              alignItems: "center",
            },
          ]}
        >
          <Ionicons
            name="heart-outline"
            size={20}
            color={colors.textSecondary}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              className={`${textClasses.body}`}
              style={{ color: colors.textPrimary }}
            >
              {"Today's check-in"}
            </Text>
            <Text
              className={`${textClasses.small}`}
              style={{ color: colors.textSecondary }}
            >
              Skipped
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              className={`${textClasses.small}`}
              style={{ color: primary, marginRight: 4 }}
            >
              Add check-in
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textTertiary}
            />
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  // If check-in was already done/skipped today, don't show the full card
  if (!canShow) {
    return null;
  }

  // Show check-in options
  return (
    <View
      className="rounded-3xl p-5"
      style={{
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16 + extraPadding,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: primaryLight }}
        >
          <Ionicons name="heart-outline" size={20} color={primary} />
        </View>
        <View className="flex-1">
          <Text
            className={`${textClasses.body} font-semibold`}
            style={{ color: colors.textPrimary }}
          >
            How are you feeling today?
          </Text>
          <Text
            className={`${textClasses.small}`}
            style={{ color: colors.textSecondary }}
          >
            Optional. You can skip anytime.
          </Text>
        </View>
      </View>

      {/* Options */}
      <View style={{ gap: 10 }}>
        {CHECK_IN_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => handleCheckIn(option.value)}
            className="flex-row items-center rounded-2xl px-4 active:opacity-80"
            style={{
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: primaryButtonHeight,
            }}
            accessibilityRole="button"
            accessibilityLabel={option.label}
          >
            <Text style={{ fontSize: 24, marginRight: 12 }}>
              {getCheckInEmoji(option.value)}
            </Text>
            <Text
              className={`${textClasses.body}`}
              style={{ color: colors.textPrimary, flex: 1 }}
            >
              {option.label}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>
        ))}
      </View>

      {/* Skip link */}
      <Pressable
        onPress={handleSkip}
        className="mt-4 py-3 items-center"
        accessibilityRole="button"
        accessibilityLabel="Skip check-in for today"
        style={{ minHeight: 48 }}
      >
        <Text
          className={`${textClasses.body}`}
          style={{ color: colors.linkText, textDecorationLine: "underline" }}
        >
          Skip
        </Text>
      </Pressable>

      {/* Reason Modal - Two-step flow */}
      <Modal
        visible={showReasonModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowReasonModal(false);
          setSelectedFeeling(null);
          setReasonText("");
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
            onPress={() => {
              Keyboard.dismiss();
              setShowReasonModal(false);
              setSelectedFeeling(null);
              setReasonText("");
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: colors.cardBackground,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                paddingBottom: 40,
                maxHeight: "80%",
              }}
            >
              <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                {/* Header with selected feeling */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: primaryLight,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>
                      {selectedFeeling ? getCheckInEmoji(selectedFeeling) : ""}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      className={`${textClasses.subtitle} font-semibold`}
                      style={{ color: colors.textPrimary }}
                    >
                      {selectedFeeling ? getCheckInDisplayText(selectedFeeling) : ""}
                    </Text>
                    <Text
                      className={`${textClasses.small}`}
                      style={{ color: colors.textSecondary }}
                    >
                      Want to add a note? (optional)
                    </Text>
                  </View>
                </View>

                {/* Text input for reason */}
                <TextInput
                  value={reasonText}
                  onChangeText={setReasonText}
                  placeholder="What made you feel this way today?"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 16,
                    padding: 16,
                    fontSize: 16,
                    color: colors.textPrimary,
                    minHeight: 100,
                    textAlignVertical: "top",
                  }}
                  maxLength={500}
                />

                {/* Character count */}
                <Text
                  className={`${textClasses.small} mt-2`}
                  style={{ color: colors.textTertiary, textAlign: "right" }}
                >
                  {reasonText.length}/500
                </Text>

                {/* Action buttons */}
                <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                  <Pressable
                    onPress={handleSkipReason}
                    style={{
                      flex: 1,
                      borderRadius: 14,
                      padding: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                      minHeight: 52,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Skip adding a note"
                  >
                    <Text
                      className={`${textClasses.body}`}
                      style={{ color: colors.textSecondary }}
                    >
                      Skip
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleConfirmCheckIn}
                    style={{
                      flex: 1,
                      borderRadius: 14,
                      padding: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: primary,
                      minHeight: 52,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Save check-in"
                  >
                    <Text
                      className={`${textClasses.body} font-semibold`}
                      style={{ color: "#FFFFFF" }}
                    >
                      Save
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
