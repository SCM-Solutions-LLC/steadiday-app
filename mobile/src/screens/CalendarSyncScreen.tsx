import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { useAppStore } from "../state/appStore";
import { useIntegrationsStore } from "../state/stores/integrationsStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { useConfirmModal } from "../components/ConfirmModal";
import { logger } from "../utils/logger";

type Props = {
  navigation: any; // NativeStackNavigationProp<OnboardingStackParamList, "CalendarSync">;
};

export default function CalendarSyncScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();
  const { confirm, alert } = useConfirmModal();
  const [isConnecting, setIsConnecting] = useState(false);
  const setCalendarSyncEnabled = useAppStore((s) => s.setCalendarSyncEnabled);
  const setCalendarId = useAppStore((s) => s.setCalendarId);

  // Integrations store for actual sync support
  const setAppleCalendarConnected = useIntegrationsStore((s) => s.setAppleCalendarConnected);
  const setAppleCalendarPermission = useIntegrationsStore((s) => s.setAppleCalendarPermission);
  const setSelectedCalendars = useIntegrationsStore((s) => s.setSelectedCalendars);

  const handleConnectCalendar = async () => {
    setIsConnecting(true);
    try {
      // Request calendar permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();

      if (status !== "granted") {
        confirm(
          "Permission Required",
          "Calendar access is required to sync your tasks and medications. You can enable this later in Settings.",
          () => handleConnectCalendar()
        );
        setIsConnecting(false);
        return;
      }

      // Get the default calendar
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find((cal) => cal.isPrimary) || calendars[0];

      if (!defaultCalendar) {
        alert(
          "No Calendar Found",
          "We couldn't find a calendar on your device. You can set this up later in Settings."
        );
        navigation.navigate("MultipleMedications");
        setIsConnecting(false);
        return;
      }

      // Save calendar sync settings
      setCalendarSyncEnabled(true);
      setCalendarId(defaultCalendar.id);

      // Also update integrationsStore so two-way sync works
      setAppleCalendarConnected(true);
      setAppleCalendarPermission("granted");

      // Auto-select all non-excluded calendars
      const EXCLUDED_PATTERNS = [/holiday/i, /birthdays/i, /us holidays/i, /uk holidays/i, /calendars$/i, /subscribed/i];
      const selectedCalendars = calendars.filter((cal) => {
        return !EXCLUDED_PATTERNS.some((pattern) => pattern.test(cal.title));
      });

      if (selectedCalendars.length > 0) {
        const ids = selectedCalendars.map((cal) => cal.id);
        const meta = selectedCalendars.map((cal) => ({
          id: cal.id,
          name: cal.title,
          source: cal.source?.name ?? "Unknown",
          color: cal.color ?? "#007AFF",
          isReadOnly: !cal.allowsModifications,
        }));
        setSelectedCalendars(ids, meta);
        logger.log(`[CalendarSync] Auto-selected ${ids.length} calendars for sync`);
      }

      // Show success message and navigate
      alert(
        "Calendar Connected!",
        "Your tasks and medications will now sync with your Apple Calendar automatically."
      );
      navigation.navigate("MultipleMedications");
    } catch (error) {
      logger.error("Calendar connection error:", error);
      alert(
        "Connection Failed",
        "We couldn't connect to your calendar. You can try again later in Settings."
      );
      navigation.navigate("MultipleMedications");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSkip = () => {
    // Show confirmation that they can enable this later
    confirm(
      "Skip Calendar Sync?",
      "You can enable calendar syncing later in the app Settings if you change your mind.",
      () => navigation.navigate("MultipleMedications")
    );
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 40, paddingVertical: 32 }}
        showsVerticalScrollIndicator={true}
      >
        <View className="flex-1 justify-between">
          <View>
            <Text className="text-4xl font-semibold text-center mb-5 leading-tight" style={{ color: colors.textPrimary }}>
              Sync Your Calendar
            </Text>
            <Text className="text-2xl text-center mb-12 leading-relaxed px-4" style={{ color: colors.textSecondary }}>
              Connect your Apple Calendar to keep everything in sync. Changes made in either app will update automatically.
            </Text>

            {/* Feature Cards */}
            <View className="mb-10">
              <View className="rounded-3xl p-8 mb-5" style={{ backgroundColor: primary + "20" }}>
                <View className="flex-row items-center mb-4">
                  <View className="rounded-full p-4 mr-5" style={{ backgroundColor: primary }}>
                    <Ionicons name="sync" size={36} color="white" />
                  </View>
                  <Text className="text-2xl font-semibold flex-1" style={{ color: colors.textPrimary }}>
                    Two-Way Sync
                  </Text>
                </View>
                <Text className="text-xl leading-relaxed" style={{ color: colors.textSecondary }}>
                  Changes in the app or your calendar automatically update both ways
                </Text>
              </View>

              <View className="rounded-3xl p-8 mb-5" style={{ backgroundColor: primary + "20" }}>
                <View className="flex-row items-center mb-4">
                  <View className="rounded-full p-4 mr-5" style={{ backgroundColor: primary }}>
                    <Ionicons name="notifications" size={36} color="white" />
                  </View>
                  <Text className="text-2xl font-semibold flex-1" style={{ color: colors.textPrimary }}>
                    Unified Reminders
                  </Text>
                </View>
                <Text className="text-xl leading-relaxed" style={{ color: colors.textSecondary }}>
                  Get reminders from both apps so you never miss important tasks
                </Text>
              </View>

              <View className="rounded-3xl p-8" style={{ backgroundColor: primary + "20" }}>
                <View className="flex-row items-center mb-4">
                  <View className="rounded-full p-4 mr-5" style={{ backgroundColor: primary }}>
                    <Ionicons name="calendar" size={36} color="white" />
                  </View>
                  <Text className="text-2xl font-semibold flex-1" style={{ color: colors.textPrimary }}>
                    All in One Place
                  </Text>
                </View>
                <Text className="text-xl leading-relaxed" style={{ color: colors.textSecondary }}>
                  View all your appointments and tasks alongside your other events
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Buttons */}
          <View>
            <Button
              title={isConnecting ? "Connecting..." : "Connect Calendar"}
              onPress={handleConnectCalendar}
              variant="primary"
              size="large"
              fullWidth
              disabled={isConnecting}
              loading={isConnecting}
              accessibilityLabel={isConnecting ? "Connecting to calendar" : "Connect calendar"}
              style={{ marginBottom: 20 }}
            />

            <Button
              title="No Thanks, Continue Without Sync"
              onPress={handleSkip}
              variant="secondary"
              size="large"
              fullWidth
              disabled={isConnecting}
              accessibilityLabel="Continue without calendar sync"
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
