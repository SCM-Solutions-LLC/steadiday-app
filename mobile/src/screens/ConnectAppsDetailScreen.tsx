import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Screen } from "../components/Screen";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "../state/stores/uiStore";
import { useIntegrationsStore } from "../state/stores/integrationsStore";
import { SyncPreference } from "../types/app";
import {
  hasRealSyncCapability,
  getSyncCapabilityDescription,
  getSyncBadgeText,
  getSyncBadgeColor,
} from "../utils/syncCapabilities";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import * as Calendar from "expo-calendar";
import { logger } from "../utils/logger";
import { requestHealthPermissions } from "../utils/appleHealthSync";
import { BackButton } from "../components/ui";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "ConnectAppsDetail">;
  route: RouteProp<OnboardingStackParamList, "ConnectAppsDetail">;
};

export default function ConnectAppsDetailScreen({ navigation, route }: Props) {
  const { appId } = route.params || {};
  const { colors } = useTheme();

  // UI state from useUIStore
  const connectedApps = useUIStore((s) => s.connectedApps);
  const toggleAppConnection = useUIStore((s) => s.toggleAppConnection);
  const updateAppSyncPreference = useUIStore((s) => s.updateAppSyncPreference);

  // Flow lock - prevents concurrent permission prompts
  const canStartPermissionPrompt = useIntegrationsStore((s) => s.canStartPermissionPrompt);
  const setPermissionPromptOpen = useIntegrationsStore((s) => s.setPermissionPromptOpen);

  // Integrations store actions for syncing calendar/reminders
  const setAppleCalendarConnected = useIntegrationsStore((s) => s.setAppleCalendarConnected);
  const setAppleCalendarPermission = useIntegrationsStore((s) => s.setAppleCalendarPermission);
  const setSelectedCalendars = useIntegrationsStore((s) => s.setSelectedCalendars);
  const setAppleRemindersConnected = useIntegrationsStore((s) => s.setAppleRemindersConnected);
  const setAppleRemindersPermission = useIntegrationsStore((s) => s.setAppleRemindersPermission);
  const setSelectedReminderLists = useIntegrationsStore((s) => s.setSelectedReminderLists);

  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedSyncPref, setSelectedSyncPref] = useState<SyncPreference>("two-way");

  if (!appId) {
    return (
      <Screen variant="static" edges={["top", "bottom"]}>
        <View className="flex-1 justify-center items-center">
          <Text style={{ fontSize: 24, color: colors.textPrimary }}>App ID is required</Text>
        </View>
      </Screen>
    );
  }

  const app = connectedApps.find((a) => a.id === appId);

  const isRealSync = hasRealSyncCapability(appId);
  const syncBadgeText = getSyncBadgeText(appId);
  const syncBadgeColors = getSyncBadgeColor(appId);
  const syncDescription = getSyncCapabilityDescription(appId, app?.category || "");

  if (!app) {
    return (
      <Screen variant="static" edges={["top", "bottom"]}>
        <View className="flex-1 justify-center items-center">
          <Text style={{ fontSize: 24, color: colors.textPrimary }}>App not found</Text>
        </View>
      </Screen>
    );
  }

  const handleToggleConnection = () => {
    if (!app.isConnected) {
      // When turning ON, route through handleAllowConnection to ensure permissions are requested
      handleAllowConnection();
      return;
    }
    // When turning OFF, just toggle
    toggleAppConnection(appId);
    if (appId === "apple-calendar") {
      setAppleCalendarConnected(false);
    } else if (appId === "apple-reminders") {
      setAppleRemindersConnected(false);
    }
  };

  const handleAllowConnection = async () => {
    if (!app.isConnected) {
      // Flow lock - prevent concurrent permission prompts
      if (!canStartPermissionPrompt()) {
        logger.log("[ConnectAppsDetail] Permission prompt blocked by flow lock");
        Alert.alert(
          "Please Wait",
          "Another operation is in progress. Please try again in a moment.",
          [{ text: "OK" }]
        );
        return;
      }

      setIsConnecting(true);
      setPermissionPromptOpen(true, `${appId}-permission`);

      // Request the appropriate iOS permissions based on app type
      let permissionGranted = true;
      let permissionType = "";
      try {
        if (appId === "apple-calendar") {
          logger.log("[ConnectAppsDetail] Requesting Calendar permissions...");
          const { status } = await Calendar.requestCalendarPermissionsAsync();
          permissionGranted = status === "granted";
          permissionType = "Calendars";
          logger.log(`[ConnectAppsDetail] Calendar permission status: ${status}`);
        } else if (appId === "apple-reminders") {
          logger.log("[ConnectAppsDetail] Requesting Reminders permissions...");
          const { status } = await Calendar.requestRemindersPermissionsAsync();
          permissionGranted = status === "granted";
          permissionType = "Reminders";
          logger.log(`[ConnectAppsDetail] Reminders permission status: ${status}`);
        } else if (appId === "apple-health") {
          logger.log("[ConnectAppsDetail] Requesting Health permissions...");
          const healthResult = await requestHealthPermissions();
          permissionGranted = healthResult.granted;
          permissionType = "Health";
          logger.log(`[ConnectAppsDetail] Health permission granted: ${permissionGranted}`);
        }
      } catch (error) {
        logger.error("[ConnectAppsDetail] Error requesting permissions:", error);
        permissionGranted = false;
      } finally {
        // Release flow lock
        setPermissionPromptOpen(false);
      }

      if (!permissionGranted && permissionType) {
        setIsConnecting(false);
        Alert.alert(
          "Permission Required",
          `To connect ${app.name}, you need to allow access in your device settings. Please go to Settings > Privacy & Security > ${permissionType} and enable access for SteadiDay.`,
          [{ text: "OK" }]
        );
        return;
      }

      toggleAppConnection(appId);
      updateAppSyncPreference(appId, selectedSyncPref);

      // Also update integrationsStore so sync actually works post-onboarding
      try {
        if (appId === "apple-calendar") {
          setAppleCalendarConnected(true);
          setAppleCalendarPermission("granted");

          // Auto-select all calendars (excluding holidays/birthdays/subscribed)
          const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
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
            logger.log(`[ConnectAppsDetail] Auto-selected ${ids.length} calendars for sync`);
          }
        } else if (appId === "apple-reminders") {
          setAppleRemindersConnected(true);
          setAppleRemindersPermission("granted");

          // Auto-select all reminder lists
          const reminderCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
          if (reminderCalendars.length > 0) {
            const ids = reminderCalendars.map((cal) => cal.id);
            const meta = reminderCalendars.map((cal) => ({
              id: cal.id,
              name: cal.title,
              source: cal.source?.name ?? "Unknown",
              color: cal.color ?? "#FF9500",
              isReadOnly: !cal.allowsModifications,
            }));
            setSelectedReminderLists(ids, meta);
            logger.log(`[ConnectAppsDetail] Auto-selected ${ids.length} reminder lists for sync`);
          }
        }
      } catch (error) {
        logger.error("[ConnectAppsDetail] Error auto-selecting calendars/reminders:", error);
      }

      setTimeout(() => {
        setIsConnecting(false);
        navigation.navigate("ConnectAppsConfirmation", { fromCategory: app.category });
      }, 1500);
    } else {
      navigation.goBack();
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (isConnecting) {
    return (
      <Screen variant="static" edges={["top", "bottom"]}>
        <View className="flex-1 justify-center items-center px-10">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ fontSize: 24, color: colors.textPrimary, textAlign: "center", marginTop: 32, lineHeight: 32 }}>
            Connecting to {app.name}…
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1">
        <ScrollView className="flex-1 px-10 py-12">
          {/* Back Button */}
          <BackButton label="Back" style={{ marginBottom: 24 }} />

          <View className="items-center mb-10">
            <View style={{ backgroundColor: colors.primaryLight, borderRadius: 999, padding: 40, marginBottom: 32 }}>
              <Ionicons name={app.icon as any} size={80} color={colors.primary} />
            </View>

            {/* Sync Badge */}
            {syncBadgeText && (
              <View className={`${syncBadgeColors.bg} px-5 py-2 rounded-full mb-4`}>
                <Text className={`${syncBadgeColors.text} text-lg font-semibold`}>
                  {syncBadgeText}
                </Text>
              </View>
            )}

            <Text style={{ fontSize: 36, fontWeight: "600", color: colors.textPrimary, textAlign: "center", marginBottom: 24, lineHeight: 40 }}>
              Connect {app.name}
            </Text>

            <Text style={{ fontSize: 24, color: colors.textPrimary, textAlign: "center", lineHeight: 32, marginBottom: 24 }}>
              {app.description}
            </Text>

            {/* Sync Capability Description */}
            <View style={{ backgroundColor: colors.primaryLight, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.primary + "40" }}>
              <View className="flex-row items-start">
                <Ionicons
                  name={isRealSync ? "sync" : "information-circle"}
                  size={24}
                  color={colors.primary}
                  style={{ marginRight: 12, marginTop: 2 }}
                />
                <Text style={{ fontSize: 16, color: colors.textPrimary, lineHeight: 24, flex: 1 }}>
                  {syncDescription}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ backgroundColor: colors.cardBackground, borderRadius: 24, padding: 32, borderWidth: 2, borderColor: colors.border, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "600", color: colors.textPrimary, marginBottom: 24 }}>
              {app.isConnected ? "Connection is on" : "Turn on connection"}
            </Text>
            <Pressable
              onPress={handleToggleConnection}
              style={{
                width: 96,
                height: 56,
                borderRadius: 999,
                padding: 8,
                backgroundColor: app.isConnected ? colors.success : colors.divider
              }}
              accessibilityRole="switch"
              accessibilityState={{ checked: app.isConnected }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  backgroundColor: "white",
                  marginLeft: app.isConnected ? "auto" : 0
                }}
              />
            </Pressable>
          </View>

          {/* Sync Preferences - Only show when not connected yet */}
          {!app.isConnected && (
            <View className="mt-8">
              <Text style={{ fontSize: 24, fontWeight: "600", color: colors.textPrimary, marginBottom: 24, textAlign: "center" }}>
                How would you like to sync?
              </Text>

              <View className="space-y-4">
                {/* Two-Way Sync */}
                <Pressable
                  onPress={() => setSelectedSyncPref("two-way")}
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: 24,
                    padding: 24,
                    borderWidth: 2,
                    borderColor: selectedSyncPref === "two-way" ? colors.primary : colors.border
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                      <Text style={{ fontSize: 20, fontWeight: "600", color: colors.textPrimary, marginBottom: 8 }}>
                        Two-Way Sync
                      </Text>
                      <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>
                        Changes in either app update automatically in both places
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        borderWidth: 2,
                        borderColor: selectedSyncPref === "two-way" ? colors.primary : colors.border,
                        backgroundColor: selectedSyncPref === "two-way" ? colors.primary : "transparent",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {selectedSyncPref === "two-way" && (
                        <Ionicons name="checkmark" size={20} color="white" />
                      )}
                    </View>
                  </View>
                </Pressable>

                {/* Unified Reminders */}
                <Pressable
                  onPress={() => setSelectedSyncPref("unified-reminders")}
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: 24,
                    padding: 24,
                    borderWidth: 2,
                    borderColor: selectedSyncPref === "unified-reminders" ? colors.primary : colors.border
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                      <Text style={{ fontSize: 20, fontWeight: "600", color: colors.textPrimary, marginBottom: 8 }}>
                        Unified Reminders
                      </Text>
                      <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>
                        All reminders appear in SteadiDay for easy management
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        borderWidth: 2,
                        borderColor: selectedSyncPref === "unified-reminders" ? colors.primary : colors.border,
                        backgroundColor: selectedSyncPref === "unified-reminders" ? colors.primary : "transparent",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {selectedSyncPref === "unified-reminders" && (
                        <Ionicons name="checkmark" size={20} color="white" />
                      )}
                    </View>
                  </View>
                </Pressable>

                {/* All Sync */}
                <Pressable
                  onPress={() => setSelectedSyncPref("all-sync")}
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: 24,
                    padding: 24,
                    borderWidth: 2,
                    borderColor: selectedSyncPref === "all-sync" ? colors.primary : colors.border
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                      <Text style={{ fontSize: 20, fontWeight: "600", color: colors.textPrimary, marginBottom: 8 }}>
                        Complete Sync
                      </Text>
                      <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>
                        Full synchronization of all data between apps
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        borderWidth: 2,
                        borderColor: selectedSyncPref === "all-sync" ? colors.primary : colors.border,
                        backgroundColor: selectedSyncPref === "all-sync" ? colors.primary : "transparent",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {selectedSyncPref === "all-sync" && (
                        <Ionicons name="checkmark" size={20} color="white" />
                      )}
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>

        <View className="px-10 pb-10 space-y-4">
          <Button
            title={app.isConnected ? "Done" : "Allow connection"}
            onPress={handleAllowConnection}
            variant="primary"
            size="large"
            fullWidth
            accessibilityLabel={app.isConnected ? "Done" : "Allow connection"}
          />

          <Pressable
            onPress={handleGoBack}
            className="items-center py-4"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={{ fontSize: 20, fontWeight: "600", color: colors.textPrimary }}>
              Go back
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
