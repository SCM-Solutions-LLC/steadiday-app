import React, { useMemo, useCallback, useState } from "react";
import { View, Text, ScrollView, Platform, Pressable, ActivityIndicator } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../utils/useTheme";
import { useIntegrationsStore } from "../state/stores/integrationsStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { appleCalendarService } from "../sync/appleCalendarSync";
import { appleRemindersService } from "../sync/appleRemindersSync";
import { requestHealthPermissions, syncHealthData } from "../utils/healthSync";
import { useHealthStore } from "../state/stores/healthStore";
import { syncHealthRecordsOnConnect } from "../utils/healthRecordsSyncHelper";
import { logger } from "../utils/logger";
import CustomSwitch from "../components/CustomSwitch";
import { RootStackParamList } from "../navigation/RootNavigator";

type HealthFailureKind = "permissions-denied" | "sync-failed";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ConnectedAppsScreen() {
  const { colors, primary } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  // Use shared integrations store
  const integrations = useIntegrationsStore((s) => s.integrations);

  // Apple Calendar specific state
  const appleCalendar = useIntegrationsStore((s) => s.appleCalendar);
  const setAppleCalendarConnected = useIntegrationsStore((s) => s.setAppleCalendarConnected);
  const setAppleCalendarPermission = useIntegrationsStore((s) => s.setAppleCalendarPermission);

  // Apple Reminders specific state
  const appleReminders = useIntegrationsStore((s) => s.appleReminders);
  const setAppleRemindersConnected = useIntegrationsStore((s) => s.setAppleRemindersConnected);
  const setAppleRemindersPermission = useIntegrationsStore((s) => s.setAppleRemindersPermission);

  // Apple Health specific state
  const appleHealthConnected = useSubscriptionStore((s) => s.appleHealthConnected);
  const setAppleHealthConnected = useSubscriptionStore((s) => s.setAppleHealthConnected);

  // Loading state
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Apple Health connection failure state (drives retry/helper UI)
  const [healthFailure, setHealthFailure] = useState<HealthFailureKind | null>(null);

  // Filter integrations: show Apple Calendar, Apple Reminders, and Apple Health
  const visibleIntegrations = useMemo(() => {
    return integrations.filter((integration) => {
      if (integration.id === "google-calendar") return false;
      return integration.platforms.includes(Platform.OS as "ios" | "android");
    });
  }, [integrations]);

  // Toggle connection status with proper permission handling
  const handleToggle = useCallback(async (id: string, isCurrentlyConnected: boolean) => {
    if (!isCurrentlyConnected) {
      // Connecting - request permissions first
      setConnectingId(id);

      try {
        if (id === "apple-calendar") {
          const permissionGranted = await appleCalendarService.requestPermissions();
          if (permissionGranted) {
            setAppleCalendarPermission("granted");
            setAppleCalendarConnected(true);
            setConnectingId(null);
            navigation.navigate("CalendarPicker", { fromOnboarding: false });
            return;
          } else {
            setAppleCalendarPermission("denied");
          }
        } else if (id === "apple-reminders") {
          const permissionGranted = await appleRemindersService.requestPermissions();
          if (permissionGranted) {
            setAppleRemindersPermission("granted");
            setAppleRemindersConnected(true);
            setConnectingId(null);
            navigation.navigate("RemindersListPicker", { fromOnboarding: false });
            return;
          } else {
            setAppleRemindersPermission("denied");
          }
        } else if (id === "apple-health") {
          setHealthFailure(null);
          const permissionGranted = await requestHealthPermissions();
          if (!permissionGranted) {
            setHealthFailure("permissions-denied");
            setAppleHealthConnected(false);
            setConnectingId(null);
            return;
          }

          // Permissions granted — attempt a silent sync to confirm the connection works.
          let syncSucceeded = false;
          try {
            const healthStore = useHealthStore.getState();
            const isInitial = !healthStore.hasInitialHealthSync;
            syncSucceeded = await syncHealthData(healthStore.addHealthMetric, isInitial);
            if (syncSucceeded && isInitial) {
              healthStore.setHasInitialHealthSync(true);
            }
          } catch (error) {
            logger.error("Error syncing health data after connection:", error);
            syncSucceeded = false;
          }

          if (syncSucceeded) {
            setAppleHealthConnected(true);
            // Trigger health records sync (medications from clinical records) - iOS only
            if (Platform.OS === "ios") {
              try {
                const result = await syncHealthRecordsOnConnect();
                logger.log(`Health records sync: ${result.medicationsCount} meds fetched, ${result.importedCount} auto-imported`);
              } catch (error) {
                logger.error("Error syncing health records after connection:", error);
              }
            }
            setConnectingId(null);
            return;
          } else {
            setAppleHealthConnected(false);
            setHealthFailure("sync-failed");
            setConnectingId(null);
            return;
          }
        }
      } catch (error) {
        logger.error("Error connecting integration:", error);
      } finally {
        setConnectingId(null);
      }
    } else {
      // Disconnecting
      if (id === "apple-calendar") {
        setAppleCalendarConnected(false);
      } else if (id === "apple-reminders") {
        setAppleRemindersConnected(false);
      } else if (id === "apple-health") {
        setAppleHealthConnected(false);
        setHealthFailure(null);
      }
    }
  }, [navigation, setAppleCalendarConnected, setAppleCalendarPermission, setAppleRemindersConnected, setAppleRemindersPermission, setAppleHealthConnected]);

  // Retry a failed Apple Health connection (re-runs permission + sync)
  const handleRetryAppleHealth = useCallback(async () => {
    setHealthFailure(null);
    await handleToggle("apple-health", false);
  }, [handleToggle]);

  // Handle manage button for connected integrations
  const handleManage = useCallback((id: string) => {
    if (id === "apple-calendar") {
      navigation.navigate("CalendarPicker", { fromOnboarding: false });
    } else if (id === "apple-reminders") {
      navigation.navigate("RemindersListPicker", { fromOnboarding: false });
    }
  }, [navigation]);

  // Get status label with selection count
  const getStatusLabel = (integrationId: string, isConnected: boolean) => {
    if (integrationId === "apple-health" && healthFailure === "sync-failed") {
      return "Connection failed";
    }
    if (!isConnected) return "Not connected";

    if (integrationId === "apple-calendar") {
      const count = appleCalendar.selectedCalendarIds.length;
      return count > 0 ? `${count} calendar${count !== 1 ? "s" : ""} selected` : "Connected - Select calendars";
    }
    if (integrationId === "apple-reminders") {
      const count = appleReminders.selectedListIds.length;
      return count > 0 ? `${count} list${count !== 1 ? "s" : ""} selected` : "Connected - Select lists";
    }

    return "Connected";
  };

  // Get status text color
  const getStatusColor = (integrationId: string, isConnected: boolean) => {
    if (integrationId === "apple-health" && healthFailure === "sync-failed") {
      return colors.error;
    }
    return isConnected ? "#6DB193" : colors.textSecondary;
  };

  // Check if integration should show manage button
  const shouldShowManage = (integrationId: string, isConnected: boolean) => {
    return isConnected && (integrationId === "apple-calendar" || integrationId === "apple-reminders");
  };

  return (
    <Screen variant="static" edges={[]}>
      <ScrollView className="flex-1">
        <View className="px-8 py-8">
          {/* Description text - header is provided by navigation */}
          <Text className="text-xl mb-8 leading-relaxed" style={{ color: colors.textSecondary }}>
            Manage your app connections and permissions
          </Text>

          {/* Information Box */}
          <View
            className="rounded-3xl p-6 mb-8"
            style={{
              backgroundColor: colors.primaryLight,
              borderColor: primary,
              borderWidth: 1
            }}
          >
            <View className="flex-row items-start">
              <Ionicons
                name="information-circle"
                size={28}
                color={primary}
                style={{ marginTop: 2 }}
              />
              <View className="flex-1 ml-4">
                <Text className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
                  About Connected Apps
                </Text>
                <Text
                  className="text-lg leading-relaxed"
                  style={{ lineHeight: 28, color: colors.textPrimary }}
                >
                  {Platform.OS === "ios"
                    ? "Connect Apple Calendar, Apple Reminders, and Apple Health to sync your tasks, appointments, and health data."
                    : "Connect Health Connect to sync your health and activity data."}
                </Text>
              </View>
            </View>
          </View>

          {/* Integrations List */}
          <View className="mb-6">
            <Text className="text-2xl font-semibold mb-4" style={{ color: colors.textPrimary }}>
              Available Integrations
            </Text>

            {visibleIntegrations.map((integration, index) => {
              const isConnecting = connectingId === integration.id;
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
                    <View
                      className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                      style={{ backgroundColor: primary + "20" }}
                    >
                      <Ionicons
                        name={integration.icon as any}
                        size={32}
                        color={primary}
                      />
                    </View>

                    {/* Name and Status */}
                    <View className="flex-1 min-w-0 mr-4">
                      <Text
                        className="text-2xl font-semibold mb-1"
                        style={{ color: colors.textPrimary }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {integration.name}
                      </Text>
                      <View className="flex-row items-center">
                        {isConnecting && (
                          <ActivityIndicator size="small" color={primary} style={{ marginRight: 6 }} />
                        )}
                        <Text
                          className="text-lg"
                          style={{ color: getStatusColor(integration.id, isConnected) }}
                        >
                          {isConnecting ? "Connecting…" : getStatusLabel(integration.id, isConnected)}
                        </Text>
                      </View>
                    </View>

                    {/* Right side: Toggle */}
                    <View className="items-end" style={{ flexShrink: 0 }}>
                      {/* Toggle Switch */}
                      <CustomSwitch
                        value={isConnected}
                        onValueChange={() => handleToggle(integration.id, isConnected)}
                        activeTrackColor={colors.toggleTrackOn}
                        inactiveTrackColor={colors.toggleTrackOff}
                        activeThumbColor={colors.toggleThumb}
                        inactiveThumbColor={colors.toggleThumb}
                        accessibilityLabel={`${
                          isConnected ? "Disconnect" : "Connect"
                        } ${integration.name}`}
                        disabled={isConnecting}
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

                  {/* Manage Button for connected Calendar/Reminders */}
                  {shouldShowManage(integration.id, isConnected) && (
                    <Pressable
                      onPress={() => handleManage(integration.id)}
                      className="mt-4 py-3 rounded-xl items-center"
                      style={{ backgroundColor: primary + "15" }}
                      accessibilityRole="button"
                      accessibilityLabel={`Manage ${integration.name} settings`}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="settings-outline" size={18} color={primary} />
                        <Text className="text-lg font-semibold ml-2" style={{ color: primary }}>
                          {integration.id === "apple-calendar" ? "Manage Calendars" : "Manage Lists"}
                        </Text>
                      </View>
                    </Pressable>
                  )}

                  {/* Apple Health: permissions-denied helper text */}
                  {integration.id === "apple-health" && healthFailure === "permissions-denied" && !isConnecting && (
                    <Text
                      className="text-base mt-3 leading-relaxed"
                      style={{ color: colors.textSecondary, lineHeight: 22 }}
                    >
                      {Platform.OS === "ios"
                        ? "Permissions needed — open Health app → Apps → SteadiDay"
                        : "Permissions needed — open Health Connect → App permissions → SteadiDay"}
                    </Text>
                  )}

                  {/* Apple Health: retry button after a failed sync */}
                  {integration.id === "apple-health" && healthFailure === "sync-failed" && !isConnecting && (
                    <Pressable
                      onPress={handleRetryAppleHealth}
                      className="mt-4 py-3 rounded-xl items-center"
                      style={{ backgroundColor: colors.error + "15" }}
                      accessibilityRole="button"
                      accessibilityLabel="Retry connecting Apple Health"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="refresh" size={18} color={colors.error} />
                        <Text className="text-lg font-semibold ml-2" style={{ color: colors.error }}>
                          Retry
                        </Text>
                      </View>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
