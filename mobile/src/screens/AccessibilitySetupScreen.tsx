import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Screen } from "../components/Screen";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";
import { speak, getVoiceTestMessage } from "../utils/speech";
import { CustomToggle } from "../components/ui";
import Button from "../components/Button";
import type { TextSize, Language } from "../types/app";

const TEXT_SIZE_OPTIONS: Array<{ value: TextSize; label: string; previewSize: number }> = [
  { value: "normal", label: "Normal", previewSize: 16 },
  { value: "large", label: "Large", previewSize: 18 },
  { value: "extra-large", label: "Extra Large", previewSize: 22 },
];

export default function AccessibilitySetupScreen() {
  const navigation = useNavigation<any>();
  const { colors, primary, primaryLight, onPrimary, isDark } = useTheme();

  const textSize = useSettingsStore((s) => s.textSize);
  const voiceGuidanceEnabled = useSettingsStore((s) => s.voiceGuidanceEnabled);
  const slowModeEnabled = useSettingsStore((s) => s.slowModeEnabled) ?? true;
  const highContrastEnabled = useSettingsStore((s) => s.highContrastEnabled) || false;
  const colorBlindModeEnabled = useSettingsStore((s) => s.colorBlindModeEnabled) || false;
  const language = useSettingsStore((s) => s.language) as Language;
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const textClasses = getTextSizeClasses(textSize);

  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  const handleSelectSize = useCallback((size: TextSize) => {
    updateSettings({ textSize: size });
  }, [updateSettings]);

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

  const handleContinue = () => {
    navigation.navigate("Authentication", { mode: "create" });
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1">
        <ScrollView className="flex-1 px-8 py-6" showsVerticalScrollIndicator={true}>
          {/* Header */}
          <View className="items-center mb-5">
            <View
              className="rounded-full p-4 mb-4"
              style={{ backgroundColor: primaryLight }}
            >
              <Ionicons name="accessibility" size={48} color={primary} />
            </View>
            <Text
              className={`${textClasses.largeTitle} text-center mb-2`}
              style={{ color: colors.textPrimary }}
            >
              Make It Comfortable
            </Text>
            <Text
              className={`${textClasses.body} text-center leading-relaxed`}
              style={{ color: colors.textSecondary }}
            >
              {"Adjust these settings so the app is easy for you to use. You can change them anytime in Settings."}
            </Text>
          </View>

          {/* Text Size Section */}
          <View
            className="rounded-3xl p-5 mb-5"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center mb-4">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: primaryLight }}
              >
                <Ionicons name="text" size={22} color={primary} />
              </View>
              <Text
                className={`${textClasses.subtitle}`}
                style={{ color: colors.textPrimary }}
              >
                Text Size
              </Text>
            </View>

            {TEXT_SIZE_OPTIONS.map((opt) => {
              const isSelected = textSize === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleSelectSize(opt.value)}
                  className="flex-row items-center justify-between p-4 rounded-2xl mb-2"
                  style={{
                    backgroundColor: isSelected ? primaryLight : "transparent",
                    borderWidth: 2,
                    borderColor: isSelected ? primary : colors.divider,
                    minHeight: 64,
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`Select ${opt.label} text size`}
                >
                  <View className="flex-1">
                    <Text
                      className="font-semibold"
                      style={{ color: colors.textPrimary, fontSize: opt.previewSize + 4 }}
                    >
                      {opt.label}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: opt.previewSize }}>
                      This is how text will look
                    </Text>
                  </View>
                  {isSelected && (
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center ml-3"
                      style={{ backgroundColor: primary }}
                    >
                      <Ionicons name="checkmark" size={24} color={onPrimary} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Visual Adjustments Section */}
          <View
            className="rounded-3xl p-5 mb-5"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center mb-4">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: primaryLight }}
              >
                <Ionicons name="eye" size={22} color={primary} />
              </View>
              <Text
                className={`${textClasses.subtitle}`}
                style={{ color: colors.textPrimary }}
              >
                Visual Adjustments
              </Text>
            </View>

            {/* High Contrast */}
            <View
              className="flex-row items-center justify-between py-4 border-b"
              style={{ borderBottomColor: colors.divider, minHeight: 64 }}
            >
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  High Contrast
                </Text>
                <Text className={textClasses.small} style={{ color: colors.textSecondary }}>
                  Stronger colors for better visibility
                </Text>
              </View>
              <CustomToggle
                value={highContrastEnabled}
                onValueChange={(v) => updateSettings({ highContrastEnabled: v })}
              />
            </View>

            {/* Color Blind Friendly */}
            <View
              className="flex-row items-center justify-between py-4 border-b"
              style={{ borderBottomColor: colors.divider, minHeight: 64 }}
            >
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Color Blind Friendly
                </Text>
                <Text className={textClasses.small} style={{ color: colors.textSecondary }}>
                  Uses distinct colors that are easier to tell apart
                </Text>
              </View>
              <CustomToggle
                value={colorBlindModeEnabled}
                onValueChange={(v) => updateSettings({ colorBlindModeEnabled: v })}
              />
            </View>

            {/* Slow Mode */}
            <View
              className="flex-row items-center justify-between py-4"
              style={{ minHeight: 64 }}
            >
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Slow Mode
                </Text>
                <Text className={textClasses.small} style={{ color: colors.textSecondary }}>
                  Bigger tap targets and gentler transitions throughout the app
                </Text>
              </View>
              <CustomToggle
                value={slowModeEnabled}
                onValueChange={(v) => updateSettings({ slowModeEnabled: v })}
              />
            </View>
          </View>

          {/* Voice Guidance Section */}
          <View
            className="rounded-3xl p-5 mb-5"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center mb-4">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: primaryLight }}
              >
                <Ionicons name="volume-high" size={22} color={primary} />
              </View>
              <Text
                className={`${textClasses.subtitle}`}
                style={{ color: colors.textPrimary }}
              >
                Voice Guidance
              </Text>
            </View>

            <View
              className="flex-row items-center justify-between py-4"
              style={{ minHeight: 64 }}
            >
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Read Reminders Aloud
                </Text>
                <Text className={textClasses.small} style={{ color: colors.textSecondary }}>
                  {"Hear medication and task reminders spoken when they arrive"}
                </Text>
              </View>
              <CustomToggle
                value={voiceGuidanceEnabled}
                onValueChange={(v) => updateSettings({ voiceGuidanceEnabled: v })}
              />
            </View>

            {voiceGuidanceEnabled && (
              <>
                {/* Silent mode warning */}
                <View
                  className="rounded-xl p-3 mb-3"
                  style={{ backgroundColor: primaryLight }}
                >
                  <View className="flex-row items-start">
                    <Ionicons
                      name="volume-high-outline"
                      size={16}
                      color={primary}
                      style={{ marginTop: 2, marginRight: 8 }}
                    />
                    <Text
                      className={`${textClasses.small} flex-1`}
                      style={{ color: colors.textPrimary, lineHeight: 20 }}
                    >
                      {"Make sure your phone is not on silent mode for voice guidance to work."}
                    </Text>
                  </View>
                </View>

                {/* Test Voice Button */}
                <Pressable
                  onPress={handleTestVoice}
                  className="py-4 rounded-xl items-center flex-row justify-center"
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
                        color={onPrimary}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        className={`${textClasses.body} font-semibold`}
                        style={{ color: onPrimary }}
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
              </>
            )}
          </View>

          {/* Continue Button - inside scroll so user must scroll to reach it */}
          <View className="pt-4 pb-8">
            <Button
              title="Continue"
              onPress={handleContinue}
              variant="primary"
              size="large"
              fullWidth
              accessibilityLabel="Continue"
            />
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}
