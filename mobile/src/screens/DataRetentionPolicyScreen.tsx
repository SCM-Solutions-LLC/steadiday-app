import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { useTheme } from "../utils/useTheme";
import { BackButton } from "../components/ui";

export default function DataRetentionPolicyScreen() {
  const { colors } = useTheme();

  return (
    <Screen variant="static" edges={["top"]}>
      <View className="flex-1">
        <View className="px-6 pt-4 pb-5">
          <BackButton label="Settings" />
          <Text className="text-2xl font-semibold mt-4" style={{ color: colors.textPrimary }}>Data Retention Policy</Text>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>Last Updated: November 30, 2025</Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>How Long We Keep Your Data</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            We retain your data only as long as necessary to provide the service and comply with legal obligations. You can delete your data at any time.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Active Accounts</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            While your account is active, we keep all your data (medications, tasks, contacts, settings) to provide the service. Your data syncs across your devices and is backed up securely. Apple Health data accessed through integration is stored locally on your device and is not uploaded to our servers unless you explicitly enable cloud sync.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Inactive Accounts</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            If you stop using SteadiDay but do not delete your account, we will retain your data for up to 3 years. After 3 years of inactivity, we may delete your account and all associated data. We will send a notice before deletion.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Account Deletion</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            When you delete your account, we permanently delete most of your data within 30 days. Some data may be retained longer for legal compliance, such as transaction records or security logs.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Backup Data</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            Backup copies of your data may exist for up to 90 days after deletion. These backups are used only for disaster recovery and are securely destroyed after the retention period.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Log Data</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            Anonymous usage logs and error reports are retained for up to 1 year for troubleshooting and app improvement. These logs do not contain personally identifiable information.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Legal Requirements</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            We may retain certain data longer if required by law, for fraud prevention, or to resolve disputes. In such cases, we retain only the minimum necessary information.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Your Control</Text>
          <Text className="text-base leading-relaxed mb-8" style={{ color: colors.textSecondary }}>
            You can export your data at any time from Settings → Privacy & Security → Export My Data. You can request account deletion from the same menu. All requests are processed within 30 days.
          </Text>
        </ScrollView>
      </View>
    </Screen>
  );
}
