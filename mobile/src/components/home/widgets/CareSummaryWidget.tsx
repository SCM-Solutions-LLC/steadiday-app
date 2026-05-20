import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { useSettingsStore } from "../../../state/stores/settingsStore";
import { useTheme } from "../../../utils/useTheme";
import { getTextSizeClasses } from "../../../utils/textSizes";
import { useSlowMode } from "../../../utils/useSlowMode";

/**
 * CareSummaryWidget - A compact widget for the Home screen
 * Opens the CareSummaryScreen when tapped
 *
 * Design principles:
 * - Available for all plans (Essentials and Premium)
 * - Clear privacy message
 * - Large tap target (56px minimum)
 */
export function CareSummaryWidget() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const textClasses = getTextSizeClasses(textSize);
  const { primaryButtonHeight, extraPadding } = useSlowMode();

  const handlePress = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("CareSummary" as never);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="rounded-2xl p-4 mb-4 active:opacity-80"
      style={{
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: primaryButtonHeight,
        marginBottom: 16 + extraPadding,
      }}
      accessibilityRole="button"
      accessibilityLabel="Open Care Summary"
    >
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: primaryLight }}
        >
          <Ionicons name="heart" size={24} color={primary} />
        </View>
        <View className="flex-1">
          <Text
            className={`${textClasses.body} font-semibold`}
            style={{ color: colors.textPrimary }}
          >
            Care Summary
          </Text>
          <Text
            className={`${textClasses.small}`}
            style={{ color: colors.textSecondary }}
          >
            Preview and share a simple update
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
      </View>
      <Text
        className={`${textClasses.small} mt-3`}
        style={{ color: colors.textTertiary }}
      >
        Nothing is shared unless you choose to share it.
      </Text>
    </Pressable>
  );
}

export default CareSummaryWidget;
