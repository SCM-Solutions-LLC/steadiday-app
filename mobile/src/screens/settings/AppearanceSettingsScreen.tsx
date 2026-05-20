import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useTheme } from "../../utils/useTheme";
import { COLOR_THEMES } from "../../utils/colorThemes";
import { getTextSizeClasses } from "../../utils/textSizes";
import { ColorTheme, AppearanceMode } from "../../types/app";
import * as Haptics from "expo-haptics";

/**
 * AppearanceSettingsScreen - Theme, text size, and appearance settings
 *
 * Senior-friendly features:
 * - Large preview of each option
 * - Clear visual feedback for selections
 * - Text size preview in real-time
 * - Organized into logical sections
 */
export default function AppearanceSettingsScreen() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight } = useTheme();

  // Settings from store
  const textSize = useSettingsStore((s) => s.textSize);
  const colorTheme = useSettingsStore((s) => s.colorTheme);
  const setColorTheme = useSettingsStore((s) => s.setColorTheme);
  const appearanceMode = useSettingsStore((s) => s.appearanceMode);
  const setAppearanceMode = useSettingsStore((s) => s.setAppearanceMode);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;

  const textClasses = getTextSizeClasses(textSize);

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Available themes (using pink key internally but displaying as Coral)
  const themeOptions: ColorTheme[] = ["sage", "blue", "teal", "pink"];

  // Appearance modes
  const appearanceModes: { value: AppearanceMode; label: string; icon: string }[] = [
    { value: "light", label: "Light", icon: "sunny" },
    { value: "dark", label: "Dark", icon: "moon" },
    { value: "system", label: "System", icon: "phone-portrait" },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={true}
      >
        {/* Appearance Mode */}
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
            Mode
          </Text>
          <Text
            className={`${textClasses.body} mb-6`}
            style={{ color: colors.textSecondary }}
          >
            Choose light, dark, or follow your device settings
          </Text>

          <View className="flex-row justify-between">
            {appearanceModes.map((mode) => (
              <Pressable
                key={mode.value}
                onPress={() => {
                  triggerHaptic();
                  setAppearanceMode(mode.value);
                }}
                className="flex-1 mx-1 rounded-2xl p-4 items-center"
                style={{
                  backgroundColor:
                    appearanceMode === mode.value
                      ? primaryLight
                      : colors.background,
                  borderWidth: 2,
                  borderColor:
                    appearanceMode === mode.value ? primary : colors.border,
                  minHeight: 88,
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: appearanceMode === mode.value }}
                accessibilityLabel={`${mode.label} mode`}
              >
                <Ionicons
                  name={mode.icon as keyof typeof Ionicons.glyphMap}
                  size={28}
                  color={
                    appearanceMode === mode.value
                      ? primary
                      : colors.textSecondary
                  }
                />
                <Text
                  className={`${textClasses.body} font-semibold mt-2`}
                  style={{
                    color:
                      appearanceMode === mode.value
                        ? primary
                        : colors.textPrimary,
                  }}
                >
                  {mode.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Color Theme */}
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
            Color Theme
          </Text>
          <Text
            className={`${textClasses.body} mb-6`}
            style={{ color: colors.textSecondary }}
          >
            Choose your preferred accent color
          </Text>

          <View className="flex-row flex-wrap justify-between">
            {themeOptions.map((theme) => {
              const themeInfo = COLOR_THEMES[theme];
              const isSelected = colorTheme === theme;

              return (
                <Pressable
                  key={theme}
                  onPress={() => {
                    triggerHaptic();
                    setColorTheme(theme);
                  }}
                  className="w-[48%] mb-4 rounded-2xl p-4 items-center"
                  style={{
                    backgroundColor: isSelected
                      ? themeInfo.primaryLight
                      : colors.background,
                    borderWidth: 3,
                    borderColor: isSelected
                      ? themeInfo.primary
                      : colors.border,
                    minHeight: 100,
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`${themeInfo.name} theme. ${themeInfo.description}`}
                >
                  {/* Color preview */}
                  <View
                    className="w-12 h-12 rounded-full mb-3"
                    style={{ backgroundColor: themeInfo.primary }}
                  />
                  <Text
                    className={`${textClasses.body} font-semibold text-center`}
                    style={{ color: isSelected ? "#1F2937" : colors.textPrimary }}
                  >
                    {themeInfo.name}
                  </Text>
                  {isSelected && (
                    <View
                      className="absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center"
                      style={{ backgroundColor: themeInfo.primary }}
                    >
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Live Preview */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            className={`${textClasses.subtitle} font-semibold mb-4`}
            style={{ color: colors.textPrimary }}
          >
            Preview
          </Text>
          <View
            className="rounded-2xl p-5"
            style={{
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              className={`${textClasses.title} mb-3`}
              style={{ color: colors.textPrimary }}
            >
              Title Text
            </Text>
            <Text
              className={`${textClasses.body} mb-3`}
              style={{ color: colors.textPrimary, lineHeight: 24 }}
            >
              This is how body text will look throughout the app. It should be
              easy to read.
            </Text>
            <Text
              className={`${textClasses.small}`}
              style={{ color: colors.textSecondary }}
            >
              This is smaller helper text.
            </Text>
            <Pressable
              className="mt-5 py-4 rounded-2xl items-center"
              style={{ backgroundColor: primary, minHeight: 56 }}
            >
              <Text
                className={`${textClasses.body} font-semibold`}
                style={{ color: "white" }}
              >
                Sample Button
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
