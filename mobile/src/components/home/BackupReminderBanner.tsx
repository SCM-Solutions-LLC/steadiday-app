/**
 * Android Data Backup Reminder Banner
 *
 * Shows a dismissible reminder for Android users to back up their data,
 * since Android does not have automatic iCloud backup like iOS.
 *
 * Timing:
 * - First app open after onboarding
 * - Every 30 days if user has never exported data
 * - Every 90 days if user has exported data before
 *
 * Only shown when isAndroidFeaturesActive() is true.
 */

import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { isAndroidFeaturesActive } from "../../config/platformConfig";
import { logger } from "../../utils/logger";

const STORAGE_KEYS = {
  LAST_EXPORT_DATE: "@steadiday_last_export_date",
  LAST_BACKUP_DISMISS_DATE: "@steadiday_last_backup_dismiss_date",
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export default function BackupReminderBanner() {
  const navigation = useNavigation();
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAndroidFeaturesActive()) return;
    checkShouldShow();
  }, []);

  const checkShouldShow = async () => {
    try {
      const [lastExportStr, lastDismissStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LAST_EXPORT_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_BACKUP_DISMISS_DATE),
      ]);

      const now = Date.now();
      const lastDismiss = lastDismissStr ? parseInt(lastDismissStr, 10) : 0;
      const lastExport = lastExportStr ? parseInt(lastExportStr, 10) : 0;

      // Determine the reminder interval
      const interval = lastExport > 0 ? NINETY_DAYS_MS : THIRTY_DAYS_MS;

      // Show if never dismissed, or if enough time has passed since last dismiss
      if (lastDismiss === 0 || now - lastDismiss >= interval) {
        setVisible(true);
      }
    } catch (error) {
      logger.log("[BackupReminder] Error checking state:", error);
    }
  };

  const handleDismiss = async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_BACKUP_DISMISS_DATE,
        Date.now().toString()
      );
    } catch (error) {
      logger.log("[BackupReminder] Error saving dismiss date:", error);
    }
  };

  const handleNavigateToExport = () => {
    setVisible(false);
    navigation.navigate("SecuritySettings" as never);
  };

  if (!isAndroidFeaturesActive() || !visible) {
    return null;
  }

  return (
    <View
      className="rounded-2xl p-5 mb-4 border"
      style={{
        backgroundColor: colors.warningBackground || "#FEF3C7",
        borderColor: colors.warning || "#F59E0B",
      }}
    >
      <View className="flex-row items-start">
        <Ionicons
          name="cloud-upload-outline"
          size={24}
          color={colors.warning || "#F59E0B"}
          style={{ marginRight: 12, marginTop: 2 }}
        />
        <View className="flex-1">
          <Text
            className={`${textClasses.body} font-semibold mb-1`}
            style={{ color: colors.textPrimary }}
          >
            Back Up Your Data
          </Text>
          <Text
            className={`${textClasses.small} leading-relaxed mb-3`}
            style={{ color: colors.textSecondary, lineHeight: 20 }}
          >
            Your SteadiDay data is stored only on this device. Tap here to save a backup you can keep safe.
          </Text>
          <Pressable
            onPress={handleNavigateToExport}
            style={{ backgroundColor: colors.warning || "#F59E0B" }}
            className="px-4 py-2.5 rounded-lg self-start active:opacity-80"
          >
            <Text className={`text-white font-semibold ${textClasses.small}`}>
              Export My Data
            </Text>
          </Pressable>
        </View>
        <Pressable
          onPress={handleDismiss}
          className="p-1 active:opacity-50"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={22} color={colors.warning || "#F59E0B"} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Call this after a successful data export to update the last export timestamp.
 */
export async function markDataExported(): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_EXPORT_DATE,
      Date.now().toString()
    );
  } catch (error) {
    logger.log("[BackupReminder] Error saving export date:", error);
  }
}
