import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import { CustomToggle, useToast } from "../../components/ui";
import { speak, getVoiceTestMessage } from "../../utils/speech";
import * as Haptics from "expo-haptics";
import { useSlowMode } from "../../utils/useSlowMode";
import type { TextSize, Language } from "../../types/app";

/**
 * AccessibilitySettingsScreen - Text size, contrast, and accessibility options
 *
 * Senior-friendly features:
 * - Large touch targets
 * - Clear visual feedback
 * - Live text size preview
 */
export default function AccessibilitySettingsScreen() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight } = useTheme();

  // Settings
  const textSize = useSettingsStore((s) => s.textSize);
  const setTextSize = useSettingsStore((s) => s.setTextSize);
  const highContrastEnabled = useSettingsStore((s) => s.highContrastEnabled) || false;
  const colorBlindModeEnabled = useSettingsStore((s) => s.colorBlindModeEnabled) || false;
  const slowModeEnabled = useSettingsStore((s) => s.slowModeEnabled) ?? true;
  const voiceGuidanceEnabled = useSettingsStore((s) => s.voiceGuidanceEnabled);
  const language = useSettingsStore((s) => s.language) as Language;
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);
  const { enabled: slowMode } = useSlowMode();

  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  const textSizes: { value: TextSize; label: string; preview: number }[] = [
    { value: "normal", label: "Normal", preview: 16 },
    { value: "large", label: "Large", preview: 20 },
    { value: "extra-large", label: "Extra Large", preview: 26 },
  ];

  const handleTextSizeChange = useCallback((size: TextSize) => {
    triggerHaptic();
    setTextSize(size);
  }, [triggerHaptic, setTextSize]);

  const handleTestVoice = useCallback(() => {
    if (isVoicePlaying) return;
    setIsVoicePlaying(true);
    speak(getVoiceTestMessage(language), {
      language,
      rate: 0.85,
      onDone: () => setIsVoicePlaying(false),
      onError: () => setIsVoicePlaying(false),
    });
  }, [isVoicePlaying, language]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={true}
      >
        {/* Text Size Section */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            className={`${textClasses.subtitle} font-semibold mb-2`}
            style={{ color: colors.textPrimary }}
          >
            Text Size
          </Text>
          <Text
            className={`${textClasses.body} mb-6`}
            style={{ color: colors.textSecondary }}
          >
            Choose a comfortable text size
          </Text>

          {textSizes.map((size, index) => {
            const isSelected = textSize === size.value;
            return (
              <Pressable
                key={size.value}
                onPress={() => handleTextSizeChange(size.value)}
                className={`${index < textSizes.length - 1 ? "border-b" : ""}`}
                style={{ borderBottomColor: colors.divider, minHeight: slowMode ? 96 : 80, paddingVertical: slowMode ? 24 : 20 }}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${size.label} text size`}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <Text
                      className={`${textClasses.body} font-semibold`}
                      style={{ color: colors.textPrimary }}
                    >
                      {size.label}
                    </Text>
                  </View>
                  <View
                    className="w-8 h-8 rounded-full border-2 items-center justify-center"
                    style={{ borderColor: isSelected ? primary : colors.border }}
                  >
                    {isSelected && (
                      <View
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: primary }}
                      />
                    )}
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: size.preview,
                    color: colors.textSecondary,
                    lineHeight: size.preview * 1.4,
                  }}
                >
                  This is how text will look with {size.label.toLowerCase()} size.
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Visual Adjustments Section */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            className={`${textClasses.subtitle} font-semibold mb-2`}
            style={{ color: colors.textPrimary }}
          >
            Visual Adjustments
          </Text>
          <Text
            className={`${textClasses.body} mb-6`}
            style={{ color: colors.textSecondary }}
          >
            Make the app easier to see
          </Text>

          {/* High Contrast Mode */}
          <View
            className="flex-row items-center justify-between border-b"
            style={{ borderBottomColor: colors.divider, minHeight: slowMode ? 84 : 72, paddingVertical: slowMode ? 20 : 16 }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: primaryLight, width: slowMode ? 52 : 48, height: slowMode ? 52 : 48 }}
              >
                <Ionicons name="contrast" size={slowMode ? 28 : 24} color={primary} />
              </View>
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  High Contrast
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  Stronger colors for better visibility
                </Text>
              </View>
            </View>
            <CustomToggle
              value={highContrastEnabled}
              onValueChange={(value) => {
                triggerHaptic();
                updateSettings({ highContrastEnabled: value });
              }}
            />
          </View>

          {/* Color-Blind Friendly */}
          <View
            className="flex-row items-center justify-between border-b"
            style={{ borderBottomColor: colors.divider, minHeight: slowMode ? 84 : 72, paddingVertical: slowMode ? 20 : 16 }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: primaryLight, width: slowMode ? 52 : 48, height: slowMode ? 52 : 48 }}
              >
                <Ionicons name="eye" size={slowMode ? 28 : 24} color={primary} />
              </View>
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Color-Blind Friendly
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  Optimized for color vision differences
                </Text>
              </View>
            </View>
            <CustomToggle
              value={colorBlindModeEnabled}
              onValueChange={(value) => {
                triggerHaptic();
                updateSettings({ colorBlindModeEnabled: value });
              }}
            />
          </View>

          {/* Slow Mode */}
          <View
            className="flex-row items-center justify-between"
            style={{ minHeight: slowMode ? 84 : 72, paddingVertical: slowMode ? 20 : 16 }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: primaryLight, width: slowMode ? 52 : 48, height: slowMode ? 52 : 48 }}
              >
                <Ionicons name="time-outline" size={slowMode ? 28 : 24} color={primary} />
              </View>
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Slow Mode
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  Makes buttons bigger and slows down animations for easier tapping.
                </Text>
              </View>
            </View>
            <CustomToggle
              value={slowModeEnabled}
              onValueChange={(value) => {
                triggerHaptic();
                updateSettings({ slowModeEnabled: value });
                showToast(
                  value
                    ? "Slow Mode enabled — larger buttons and slower animations"
                    : "Slow Mode disabled",
                  value ? "success" : "info"
                );
              }}
            />
          </View>

          {/* Slow Mode Info */}
          {slowModeEnabled && (
            <View
              className="mt-2 p-4 rounded-xl"
              style={{ backgroundColor: primaryLight }}
            >
              <Text
                className={`${textClasses.small}`}
                style={{ color: colors.textPrimary, lineHeight: 20 }}
              >
                {"Slow Mode makes the app easier to use by slowing interactions, increasing tap targets, and reducing distractions. It does not affect your phone's system settings."}
              </Text>
            </View>
          )}
        </View>

        {/* Voice Guidance Section */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            className={`${textClasses.subtitle} font-semibold mb-2`}
            style={{ color: colors.textPrimary }}
          >
            Voice Guidance
          </Text>
          <Text
            className={`${textClasses.body} mb-6`}
            style={{ color: colors.textSecondary }}
          >
            Hear reminders read aloud
          </Text>

          {/* Phone sound note */}
          <View
            className="rounded-xl p-3 mb-4"
            style={{ backgroundColor: primaryLight }}
          >
            <View className="flex-row items-start">
              <Ionicons
                name="volume-high-outline"
                size={18}
                color={primary}
                style={{ marginTop: 2, marginRight: 8 }}
              />
              <Text
                className={`${textClasses.small} flex-1`}
                style={{ color: colors.textPrimary, lineHeight: 20 }}
              >
                {"Important: Make sure your phone is not on silent mode for voice guidance to work."}
              </Text>
            </View>
          </View>

          <View
            className="flex-row items-center justify-between py-4"
            style={{ minHeight: 72 }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: primaryLight }}
              >
                <Ionicons name="volume-high" size={24} color={primary} />
              </View>
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Voice Guidance
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  Read important reminders aloud
                </Text>
              </View>
            </View>
            <CustomToggle
              value={voiceGuidanceEnabled}
              onValueChange={(value) => {
                triggerHaptic();
                updateSettings({ voiceGuidanceEnabled: value });
              }}
            />
          </View>

          {voiceGuidanceEnabled && (
            <Pressable
              onPress={handleTestVoice}
              className="mt-4 py-4 rounded-xl items-center flex-row justify-center"
              style={{
                backgroundColor: isVoicePlaying ? primary : primaryLight,
                minHeight: 56,
              }}
              disabled={isVoicePlaying}
              accessibilityRole="button"
              accessibilityLabel="Test voice guidance"
            >
              {isVoicePlaying ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    className={`${textClasses.body} font-semibold`}
                    style={{ color: "#FFFFFF" }}
                  >
                    Playing...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="play"
                    size={20}
                    color={primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    className={`${textClasses.body} font-semibold`}
                    style={{ color: primary }}
                  >
                    Test Voice
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>
      {ToastComponent}
    </View>
  );
}
