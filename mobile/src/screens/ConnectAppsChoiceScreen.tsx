import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { View, Text, ScrollView, Platform, ActivityIndicator, Alert, Linking, AppState } from "react-native";
import { Screen } from "../components/Screen";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import { useIntegrationsStore } from "../state/stores/integrationsStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { useAppStore } from "../state/appStore";
import { appleCalendarService } from "../sync/appleCalendarSync";
import { appleRemindersService } from "../sync/appleRemindersSync";
import {
  requestHealthPermissions,
  checkHealthConnectAvailability,
  openHealthConnectPlayStore,
} from "../utils/healthSync";
import { logger } from "../utils/logger";
import { isAndroidFeaturesActive } from "../config/platformConfig";
import Button from "../components/Button";
import CustomSwitch from "../components/CustomSwitch";
import { BackButton } from "../components/ui";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "ConnectAppsChoice">;
};

export default function ConnectAppsChoiceScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();

  // Use shared integrations store
  const integrations = useIntegrationsStore((s) => s.integrations);

  // Flow lock for purchase/permission coordination
  const setPermissionPromptOpen = useIntegrationsStore((s) => s.setPermissionPromptOpen);
  const canStartPermissionPrompt = useIntegrationsStore((s) => s.canStartPermissionPrompt);

  // Integration-specific store functions
  const appleCalendar = useIntegrationsStore((s) => s.appleCalendar);
  const appleReminders = useIntegrationsStore((s) => s.appleReminders);
  const setAppleCalendarConnected = useIntegrationsStore((s) => s.setAppleCalendarConnected);
  const setAppleRemindersConnected = useIntegrationsStore((s) => s.setAppleRemindersConnected);
  const setAppleCalendarPermission = useIntegrationsStore((s) => s.setAppleCalendarPermission);
  const setAppleRemindersPermission = useIntegrationsStore((s) => s.setAppleRemindersPermission);

  // Apple Health specific state
  const appleHealthConnected = useSubscriptionStore((s) => s.appleHealthConnected);
  const setAppleHealthConnected = useSubscriptionStore((s) => s.setAppleHealthConnected);

  // App store for sync
  const performTwoWaySync = useAppStore((s) => s.performTwoWaySync);

  // Loading state for sync
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Retry Apple Health after returning from Settings
  const [pendingHealthRetry, setPendingHealthRetry] = useState(false);
  const pendingHealthRetryRef = useRef(false);

  useEffect(() => {
    pendingHealthRetryRef.current = pendingHealthRetry;
  }, [pendingHealthRetry]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState === "active" && pendingHealthRetryRef.current) {
        setPendingHealthRetry(false);
        const granted = await requestHealthPermissions();
        if (granted) {
          setAppleHealthConnected(true);
        }
      }
    });
    return () => subscription.remove();
  }, [setAppleHealthConnected]);

  const visibleIntegrations = useMemo(() => {
    return integrations.filter((integration) => {
      if (integration.id === "google-calendar" && !isAndroidFeaturesActive()) return false;
      return integration.platforms.includes(Platform.OS as "ios" | "android");
    });
  }, [integrations]);

  // Toggle connection status with auto-sync
  const handleToggle = useCallback(async (id: string, isCurrentlyConnected?: boolean) => {
    // Check flow lock before starting permission prompts
    if (!isCurrentlyConnected && !canStartPermissionPrompt()) {
      logger.log("Cannot start permission prompt - flow lock active");
      return;
    }

    if (!isCurrentlyConnected) {
      // User is connecting - request permissions and navigate to picker
      setSyncingId(id);
      setPermissionPromptOpen(true, id);

      try {
        if (id === "apple-calendar") {
          const permissionGranted = await appleCalendarService.requestPermissions();
          if (permissionGranted) {
            setAppleCalendarPermission("granted");
            setAppleCalendarConnected(true);
            setSyncingId(null);
            setPermissionPromptOpen(false);
            navigation.navigate("CalendarPicker", { fromOnboarding: true });
            return;
          } else {
            setAppleCalendarPermission("denied");
          }
        } else if (id === "apple-reminders") {
          const permissionGranted = await appleRemindersService.requestPermissions();
          if (permissionGranted) {
            setAppleRemindersPermission("granted");
            setAppleRemindersConnected(true);
            setSyncingId(null);
            setPermissionPromptOpen(false);
            navigation.navigate("RemindersListPicker", { fromOnboarding: true });
            return;
          } else {
            setAppleRemindersPermission("denied");
          }
        } else if (id === "apple-health") {
          if (Platform.OS === "android") {
            const availability = await checkHealthConnectAvailability();
            if (availability === "not_installed") {
              Alert.alert(
                "Health Connect Required",
                "Health Connect is not installed on your device. Would you like to install it from the Play Store?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Install", onPress: () => openHealthConnectPlayStore() },
                ]
              );
              setSyncingId(null);
              setPermissionPromptOpen(false);
              return;
            }
            if (availability === "not_supported") {
              Alert.alert(
                "Health Connect Not Supported",
                "Health Connect requires Android 9 or later. Your device may not support this feature.",
                [{ text: "OK" }]
              );
              setSyncingId(null);
              setPermissionPromptOpen(false);
              return;
            }
          }

          const granted = await requestHealthPermissions();
          if (granted) {
            setAppleHealthConnected(true);
            setSyncingId(null);
            setPermissionPromptOpen(false);
            return;
          }

          if (Platform.OS === "ios") {
            Alert.alert(
              "Health Permission Needed",
              "SteadiDay needs access to Apple Health to track your steps, heart rate, sleep, and more. You can enable this in your iPhone Settings.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => { Linking.openURL("app-settings:"); setPendingHealthRetry(true); } },
              ]
            );
          } else {
            Alert.alert(
              "Health Connect Permission Needed",
              "SteadiDay needs access to Health Connect to track your steps, heart rate, sleep, and more. Please grant permissions in Health Connect settings.",
              [{ text: "OK" }]
            );
          }
        }
      } catch (error) {
        logger.error("Error connecting integration:", error);
      } finally {
        setSyncingId(null);
        setPermissionPromptOpen(false);
      }
    } else {
      // User is disconnecting
      if (id === "apple-calendar") {
        setAppleCalendarConnected(false);
      } else if (id === "apple-reminders") {
        setAppleRemindersConnected(false);
      } else if (id === "apple-health") {
        setAppleHealthConnected(false);
      }
    }
  }, [setAppleCalendarConnected, setAppleRemindersConnected, setAppleCalendarPermission, setAppleRemindersPermission, setAppleHealthConnected, navigation, canStartPermissionPrompt, setPermissionPromptOpen]);

  // Get status label text
  const getStatusLabel = (integrationId: string, isConnected: boolean, isSyncing: boolean) => {
    if (isSyncing) return "Connecting...";

    if (integrationId === "apple-calendar" && isConnected) {
      const count = appleCalendar.selectedCalendarIds.length;
      return count > 0 ? `${count} calendar${count !== 1 ? "s" : ""} selected` : "Connected - Select calendars";
    }
    if (integrationId === "apple-reminders" && isConnected) {
      const count = appleReminders.selectedListIds.length;
      return count > 0 ? `${count} list${count !== 1 ? "s" : ""} selected` : "Connected - Select lists";
    }

    return isConnected ? "Connected" : "Not connected";
  };

  // Get status text color
  const getStatusColor = (isConnected: boolean) => {
    return isConnected ? colors.success : colors.textTertiary;
  };

  const handleContinue = useCallback(async () => {
    if (
      (appleCalendar.isConnected && appleCalendar.selectedCalendarIds.length > 0) ||
      (appleReminders.isConnected && appleReminders.selectedListIds.length > 0)
    ) {
      try {
        await performTwoWaySync();
        logger.log("Initial sync completed during onboarding");
      } catch (error) {
        logger.error("Error during initial sync:", error);
      }
    }
    navigation.navigate("LocationPermission");
  }, [appleCalendar, appleReminders, performTwoWaySync, navigation]);

  const handleSkip = () => {
    navigation.navigate("LocationPermission");
  };

  // Handle manage button for connected integrations
  const handleManage = useCallback((id: string) => {
    if (id === "apple-calendar") {
      navigation.navigate("CalendarPicker", { fromOnboarding: true });
    } else if (id === "apple-reminders") {
      navigation.navigate("RemindersListPicker", { fromOnboarding: true });
    }
  }, [navigation]);

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <ScrollView className="flex-1">
        <View className="px-10 py-12">
          {/* Back Button */}
          <BackButton label="Back" style={{ marginBottom: 32 }} />

          {/* Header */}
          <Text className="text-4xl font-semibold text-center mb-4 leading-tight" style={{ color: colors.textPrimary }}>
            Connect other apps
          </Text>
          <Text className="text-2xl text-center mb-4 leading-relaxed" style={{ color: colors.textSecondary }}>
            Choose what you want to connect. You can change this later.
          </Text>

          {/* Compact Note */}
          <Text className="text-lg text-center mb-8 leading-relaxed" style={{ color: colors.textTertiary }}>
            {isAndroidFeaturesActive()
              ? "SteadiDay supports Health Connect and Google Calendar."
              : "SteadiDay supports Apple Calendar, Apple Reminders, and Apple Health."}
          </Text>

          {/* Integrations List */}
          <View className="mb-6">
            <Text className="text-2xl font-semibold mb-4" style={{ color: colors.textPrimary }}>
              Available Integrations
            </Text>

            {visibleIntegrations.map((integration, index) => {
              const isSyncing = syncingId === integration.id;
              // Apple Health connected state lives in subscriptionStore
              const isConnected = integration.id === "apple-health"
                ? appleHealthConnected
                : integration.isConnected;

              return (
                <View
                  key={integration.id}
                  className={`rounded-3xl p-6 ${
                    index < visibleIntegrations.length - 1 ? "mb-4" : ""
                  }`}
                  style={{
                    backgroundColor: colors.cardBackground,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  {/* App Header Row */}
                  <View className="flex-row items-center mb-4">
                    {/* Icon */}
                    <View className="w-16 h-16 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: primary + "20" }}>
                      <Ionicons
                        name={integration.icon as any}
                        size={32}
                        color={primary}
                      />
                    </View>

                    {/* Name and Toggle */}
                    <View className="flex-1 flex-row items-center">
                      <View className="flex-1 pr-4">
                        <Text className="text-2xl font-semibold mb-1" style={{ color: colors.textPrimary }}>
                          {integration.name}
                        </Text>
                        <View className="flex-row items-center">
                          {isSyncing && (
                            <ActivityIndicator size="small" color={primary} style={{ marginRight: 6 }} />
                          )}
                          <Text
                            className="text-lg"
                            style={{ color: getStatusColor(isConnected) }}
                          >
                            {getStatusLabel(integration.id, isConnected, isSyncing)}
                          </Text>
                        </View>
                      </View>

                      {/* Toggle Switch */}
                      <CustomSwitch
                        value={isConnected}
                        onValueChange={() => handleToggle(integration.id, isConnected)}
                        inactiveTrackColor={colors.border}
                        activeTrackColor={colors.success}
                        activeThumbColor={colors.toggleThumb}
                        inactiveThumbColor={colors.toggleThumb}
                        accessibilityLabel={`${
                          isConnected ? "Disconnect" : "Connect"
                        } ${integration.name}`}
                        disabled={isSyncing}
                      />
                    </View>
                  </View>

                  {/* Description */}
                  <Text
                    className="text-lg leading-relaxed"
                    style={{ lineHeight: 26, color: colors.textSecondary }}
                  >
                    {integration.description}
                  </Text>

                  {/* Manage Button for connected Calendar/Reminders (not needed for Apple Health) */}
                  {isConnected && integration.id !== "apple-health" && (
                    <Button
                      title={integration.id === "apple-calendar" ? "Manage Calendars" : "Manage Lists"}
                      onPress={() => handleManage(integration.id)}
                      variant="secondary"
                      size="medium"
                      style={{ marginTop: 12 }}
                      accessibilityLabel={`Manage ${integration.name} settings`}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Sync Information Note */}
          <View
            className="rounded-2xl p-4 mb-6"
            style={{
              backgroundColor: colors.infoBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-start">
              <Ionicons
                name="time-outline"
                size={20}
                color={colors.textSecondary}
                style={{ marginTop: 2 }}
              />
              <View className="flex-1 ml-3">
                <Text className="text-base" style={{ color: colors.textSecondary }}>
                  {Platform.OS === "android"
                    ? "Pull down on the Tasks screen to refresh your calendar."
                    : "Pull down on the Tasks screen to refresh your calendar and reminders."}
                </Text>
              </View>
            </View>
          </View>
          {/* Bottom Buttons — inside scroll so user must scroll past integrations */}
          <View style={{ marginTop: 16 }}>
            <Button
              title="Continue"
              onPress={handleContinue}
              variant="primary"
              size="large"
              fullWidth
              accessibilityLabel="Continue"
              style={{ marginBottom: 16 }}
            />

            <Button
              title="Skip this step"
              onPress={handleSkip}
              variant="secondary"
              size="large"
              fullWidth
              accessibilityLabel="Skip this step"
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
