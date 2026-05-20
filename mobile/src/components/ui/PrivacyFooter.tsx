/**
 * PrivacyFooter - Consistent privacy statement footer for screens
 *
 * Use this component at the bottom of primary screens to show
 * the universal privacy footer message.
 */

import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PRIVACY_COPY } from "../../utils/privacyCopy";
import { useTheme } from "../../utils/useTheme";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";

interface PrivacyFooterProps {
  /** Optional custom message (defaults to universalFooter) */
  message?: string;
  /** Add extra bottom padding */
  withBottomPadding?: boolean;
}

export function PrivacyFooter({ message, withBottomPadding = true }: PrivacyFooterProps) {
  const { colors } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  return (
    <View
      className={`px-6 ${withBottomPadding ? "pb-8" : "pb-4"}`}
      style={{ backgroundColor: colors.background }}
    >
      <View
        className="flex-row items-center justify-center py-3 px-4 rounded-xl"
        style={{ backgroundColor: colors.surfaceSubtle }}
      >
        <Ionicons
          name="shield-checkmark-outline"
          size={16}
          color={colors.textTertiary}
          style={{ marginRight: 8 }}
        />
        <Text
          className={`${textClasses.small} text-center flex-1`}
          style={{ color: colors.textTertiary }}
        >
          {message || PRIVACY_COPY.universalFooter}
        </Text>
      </View>
    </View>
  );
}

/**
 * FixedPrivacyFooter - Static footer that stays at bottom of screen
 *
 * Use this at the bottom of screens OUTSIDE the ScrollView
 * for a fixed footer that doesn't scroll with content.
 */
interface FixedPrivacyFooterProps {
  /** Optional custom message (defaults to universalFooter) */
  message?: string;
}

export function FixedPrivacyFooter({ message }: FixedPrivacyFooterProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
      }}
    >
      <View className="flex-row items-center justify-center">
        <Ionicons
          name="shield-checkmark-outline"
          size={12}
          color={colors.textTertiary}
          style={{ marginRight: 6 }}
        />
        <Text
          style={{
            fontSize: 11,
            color: colors.textTertiary,
            textAlign: "center",
          }}
        >
          {message || PRIVACY_COPY.universalFooter}
        </Text>
      </View>
    </View>
  );
}

/**
 * PrivacyHeader - For use under screen titles (e.g., Health tab)
 */
interface PrivacyHeaderProps {
  message: string;
}

export function PrivacyHeader({ message }: PrivacyHeaderProps) {
  const { colors } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  return (
    <View className="flex-row items-center">
      <Ionicons
        name="shield-checkmark-outline"
        size={14}
        color={colors.textTertiary}
        style={{ marginRight: 6 }}
      />
      <Text
        className={`${textClasses.small}`}
        style={{ color: colors.textTertiary }}
      >
        {message}
      </Text>
    </View>
  );
}
