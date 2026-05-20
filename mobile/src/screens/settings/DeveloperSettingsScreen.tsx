import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useUserStore } from "../../state/stores/userStore";
import { useMedicationStore } from "../../state/stores/medicationStore";
import { useTaskStore } from "../../state/stores/taskStore";
import { useUIStore } from "../../state/stores/uiStore";
import { useTipStore } from "../../state/stores/tipStore";
import { useIntegrationsStore } from "../../state/stores/integrationsStore";
import { useHealthRecordsStore } from "../../state/stores/healthRecordsStore";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import { CustomToggle } from "../../components/ui";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getSurveyStatus,
  getUserProfile,
  type UserProfile,
  type SurveyStatus,
} from "../../utils/userProfileStorage";

/**
 * DeveloperSettingsScreen - Developer options and debug tools
 *
 * Features:
 * - Clear app data
 * - Reset onboarding
 * - Toggle developer mode
 * - View store states
 */
export default function DeveloperSettingsScreen() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight } = useTheme();

  // Settings
  const textSize = useSettingsStore((s) => s.textSize);
  const developerMode = useSettingsStore((s) => s.developerMode);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;

  // User store
  const resetOnboarding = useUserStore((s) => s.resetOnboarding);

  // Medication store
  const medicationCount = useMedicationStore((s) => s.medications.length);

  // Task store
  const taskCount = useTaskStore((s) => s.tasks.length);

  // Tip store
  const resetAllTips = useTipStore((s) => s.resetAllTips);

  // Integrations store - sync state
  const syncMutex = useIntegrationsStore((s) => s.syncMutex);
  const appleCalendarConnected = useIntegrationsStore((s) => s.appleCalendar.isConnected);
  const appleCalendarSelectedCount = useIntegrationsStore((s) => s.appleCalendar.selectedCalendarIds.length);
  const appleRemindersConnected = useIntegrationsStore((s) => s.appleReminders.isConnected);
  const appleRemindersSelectedCount = useIntegrationsStore((s) => s.appleReminders.selectedListIds.length);

  // Health records store - sync state
  const healthIsSyncing = useHealthRecordsStore((s) => s.isSyncing);
  const healthLastSyncError = useHealthRecordsStore((s) => s.lastSyncError);
  const medicationItemsCount = useHealthRecordsStore((s) => s.medicationItems.length);
  const labResultsCount = useHealthRecordsStore((s) => s.labResults.length);

  const textClasses = getTextSizeClasses(textSize);

  const [isClearing, setIsClearing] = useState(false);
  const [surveyStatus, setSurveyStatusLocal] = useState<SurveyStatus>("pending");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  React.useEffect(() => {
    (async () => {
      const status = await getSurveyStatus();
      setSurveyStatusLocal(status);
      const profile = await getUserProfile();
      setUserProfile(profile);
    })();
  }, []);

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  const handleClearAllData = useCallback(async () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all your data including medications, tasks, and settings. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              await AsyncStorage.clear();
              Alert.alert("Success", "All data has been cleared. The app will now restart.", [
                { text: "OK" }
              ]);
            } catch (error) {
              Alert.alert("Error", "Failed to clear data. Please try again.");
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  }, []);

  const handleResetOnboarding = useCallback(() => {
    Alert.alert(
      "Reset Onboarding",
      "This will reset the onboarding flow. You will see the welcome screens again on next app launch.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetOnboarding();
            Alert.alert("Success", "Onboarding has been reset.");
          },
        },
      ]
    );
  }, [resetOnboarding]);

  const handleResetTips = useCallback(() => {
    resetAllTips();
    Alert.alert("Success", "All tips and tooltips have been reset.");
  }, [resetAllTips]);

  const handleDisableDeveloperMode = useCallback(() => {
    Alert.alert(
      "Disable Developer Mode",
      "Are you sure you want to disable developer mode?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          onPress: () => {
            updateSettings({ developerMode: false });
            navigation.goBack();
          },
        },
      ]
    );
  }, [updateSettings, navigation]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={true}
      >
        {/* Warning Banner */}
        <View
          className="rounded-2xl p-4 mb-6 flex-row items-center"
          style={{
            backgroundColor: colors.warningBackground,
            borderWidth: 1,
            borderColor: colors.warning,
          }}
        >
          <Ionicons name="warning" size={28} color={colors.warning} />
          <View className="flex-1 ml-3">
            <Text
              className={`${textClasses.body} font-semibold`}
              style={{ color: colors.onWarning }}
            >
              Developer Mode Active
            </Text>
            <Text
              className={`${textClasses.small}`}
              style={{ color: colors.onWarning }}
            >
              These options are for testing and debugging. Use with caution.
            </Text>
          </View>
        </View>

        {/* App Info Section */}
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
            App Information
          </Text>

          <View className="flex-row justify-between py-3 border-b" style={{ borderBottomColor: colors.divider }}>
            <Text className={textClasses.body} style={{ color: colors.textSecondary }}>
              Medications
            </Text>
            <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
              {medicationCount}
            </Text>
          </View>

          <View className="flex-row justify-between py-3 border-b" style={{ borderBottomColor: colors.divider }}>
            <Text className={textClasses.body} style={{ color: colors.textSecondary }}>
              Tasks
            </Text>
            <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
              {taskCount}
            </Text>
          </View>

          <View className="flex-row justify-between py-3">
            <Text className={textClasses.body} style={{ color: colors.textSecondary }}>
              Developer Mode
            </Text>
            <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.success }}>
              Enabled
            </Text>
          </View>
        </View>

        {/* Sync Debug Panel - TEMPORARY FOR TESTFLIGHT */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 2,
            borderColor: colors.info,
          }}
        >
          <View className="flex-row items-center mb-4">
            <Ionicons name="bug" size={24} color={colors.info} />
            <Text
              className={`${textClasses.subtitle} font-semibold ml-2`}
              style={{ color: colors.textPrimary }}
            >
              Sync Debug Panel
            </Text>
          </View>
          <Text className={`${textClasses.small} mb-4`} style={{ color: colors.textSecondary }}>
            Live sync state for TestFlight debugging
          </Text>

          {/* Sync Mutex State */}
          <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: colors.background }}>
            <Text className={`${textClasses.small} font-semibold mb-2`} style={{ color: colors.info }}>
              Sync Mutex Flags
            </Text>
            <View className="flex-row justify-between py-1">
              <Text className={textClasses.small} style={{ color: colors.textSecondary }}>Calendar Syncing</Text>
              <Text className={`${textClasses.small} font-semibold`} style={{ color: syncMutex.isSyncingCalendar ? colors.warning : colors.success }}>
                {syncMutex.isSyncingCalendar ? "ACTIVE" : "idle"}
              </Text>
            </View>
            <View className="flex-row justify-between py-1">
              <Text className={textClasses.small} style={{ color: colors.textSecondary }}>Reminders Syncing</Text>
              <Text className={`${textClasses.small} font-semibold`} style={{ color: syncMutex.isSyncingReminders ? colors.warning : colors.success }}>
                {syncMutex.isSyncingReminders ? "ACTIVE" : "idle"}
              </Text>
            </View>
            <View className="flex-row justify-between py-1">
              <Text className={textClasses.small} style={{ color: colors.textSecondary }}>Health Syncing</Text>
              <Text className={`${textClasses.small} font-semibold`} style={{ color: syncMutex.isSyncingHealth ? colors.warning : colors.success }}>
                {syncMutex.isSyncingHealth ? "ACTIVE" : "idle"}
              </Text>
            </View>
          </View>

          {/* Integrations State */}
          <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: colors.background }}>
            <Text className={`${textClasses.small} font-semibold mb-2`} style={{ color: colors.info }}>
              Integrations State
            </Text>
            <View className="flex-row justify-between py-1">
              <Text className={textClasses.small} style={{ color: colors.textSecondary }}>Apple Calendar</Text>
              <Text className={`${textClasses.small} font-semibold`} style={{ color: appleCalendarConnected ? colors.success : colors.textSecondary }}>
                {appleCalendarConnected ? `Connected (${appleCalendarSelectedCount})` : "Not connected"}
              </Text>
            </View>
            <View className="flex-row justify-between py-1">
              <Text className={textClasses.small} style={{ color: colors.textSecondary }}>Apple Reminders</Text>
              <Text className={`${textClasses.small} font-semibold`} style={{ color: appleRemindersConnected ? colors.success : colors.textSecondary }}>
                {appleRemindersConnected ? `Connected (${appleRemindersSelectedCount})` : "Not connected"}
              </Text>
            </View>
          </View>

          {/* Health Records State */}
          <View className="p-3 rounded-xl" style={{ backgroundColor: colors.background }}>
            <Text className={`${textClasses.small} font-semibold mb-2`} style={{ color: colors.info }}>
              Health Records State
            </Text>
            <View className="flex-row justify-between py-1">
              <Text className={textClasses.small} style={{ color: colors.textSecondary }}>Health Syncing</Text>
              <Text className={`${textClasses.small} font-semibold`} style={{ color: healthIsSyncing ? colors.warning : colors.success }}>
                {healthIsSyncing ? "SYNCING" : "idle"}
              </Text>
            </View>
            <View className="flex-row justify-between py-1">
              <Text className={textClasses.small} style={{ color: colors.textSecondary }}>Medication Items</Text>
              <Text className={`${textClasses.small} font-semibold`} style={{ color: colors.textPrimary }}>
                {medicationItemsCount}
              </Text>
            </View>
            <View className="flex-row justify-between py-1">
              <Text className={textClasses.small} style={{ color: colors.textSecondary }}>Lab Results</Text>
              <Text className={`${textClasses.small} font-semibold`} style={{ color: colors.textPrimary }}>
                {labResultsCount}
              </Text>
            </View>
            {healthLastSyncError && (
              <View className="mt-2 p-2 rounded-lg" style={{ backgroundColor: colors.errorBackground }}>
                <Text className={`${textClasses.small}`} style={{ color: colors.error }}>
                  Last Error: {healthLastSyncError}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* User Profile Survey Results */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-center mb-4">
            <Ionicons name="clipboard" size={24} color={colors.info} />
            <Text
              className={`${textClasses.subtitle} font-semibold ml-2`}
              style={{ color: colors.textPrimary }}
            >
              User Profile Survey Results
            </Text>
          </View>

          <View className="flex-row justify-between py-3 border-b" style={{ borderBottomColor: colors.divider }}>
            <Text className={textClasses.body} style={{ color: colors.textSecondary }}>
              Survey Status
            </Text>
            <Text
              className={`${textClasses.body} font-semibold`}
              style={{
                color: surveyStatus === "completed" ? colors.success
                  : surveyStatus === "skipped" ? colors.warning
                  : colors.textSecondary,
              }}
            >
              {surveyStatus.charAt(0).toUpperCase() + surveyStatus.slice(1)}
            </Text>
          </View>

          <View className="flex-row justify-between py-3 border-b" style={{ borderBottomColor: colors.divider }}>
            <Text className={textClasses.body} style={{ color: colors.textSecondary }}>
              Responses on this device
            </Text>
            <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
              {userProfile ? "1" : "0"}
            </Text>
          </View>

          {userProfile && (
            <View className="mt-3 p-3 rounded-xl" style={{ backgroundColor: colors.background }}>
              <Text className={`${textClasses.small} font-semibold mb-2`} style={{ color: colors.info }}>
                Stored Profile
              </Text>
              <View className="flex-row justify-between py-1">
                <Text className={textClasses.small} style={{ color: colors.textSecondary }}>Setup Role</Text>
                <Text className={`${textClasses.small} font-semibold flex-1 text-right ml-2`} style={{ color: colors.textPrimary }}>
                  {userProfile.setupRole}
                </Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className={textClasses.small} style={{ color: colors.textSecondary }}>Source</Text>
                <Text className={`${textClasses.small} font-semibold flex-1 text-right ml-2`} style={{ color: colors.textPrimary }}>
                  {userProfile.source}
                </Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className={textClasses.small} style={{ color: colors.textSecondary }}>Motivation</Text>
                <Text className={`${textClasses.small} font-semibold flex-1 text-right ml-2`} style={{ color: colors.textPrimary }}>
                  {userProfile.motivation}
                </Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className={textClasses.small} style={{ color: colors.textSecondary }}>Completed At</Text>
                <Text className={`${textClasses.small} font-semibold flex-1 text-right ml-2`} style={{ color: colors.textPrimary }}>
                  {new Date(userProfile.completedAt).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          <Pressable
            onPress={async () => {
              await AsyncStorage.multiRemove([
                "userProfileSurveyStatus",
                "appOpenCount",
                "userProfile",
              ]);
              setSurveyStatusLocal("pending");
              setUserProfile(null);
              Alert.alert(
                "Survey Reset",
                "Open the app 4 times to see the survey again."
              );
            }}
            style={{
              backgroundColor: colors.error,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              marginTop: 12,
            }}
            accessibilityRole="button"
            accessibilityLabel="Reset survey for testing"
          >
            <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>
              Reset Survey (Developer Only)
            </Text>
          </Pressable>

          <View className="mt-3 p-3 rounded-xl" style={{ backgroundColor: colors.infoBackground }}>
            <Text className={`${textClasses.small}`} style={{ color: colors.onInfo }}>
              {"Aggregated cross-user data available in Google Analytics under custom event 'user_profile_survey'"}
            </Text>
          </View>
        </View>

        {/* Settings Section */}
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
            Developer Settings
          </Text>

          {/* Reset Tips */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              handleResetTips();
            }}
            className="flex-row items-center justify-between py-4"
            style={{ minHeight: 72 }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: primaryLight }}
              >
                <Ionicons name="bulb" size={24} color={primary} />
              </View>
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Reset Tips & Tooltips
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  Show all tips and tutorials again
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Danger Zone */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 2,
            borderColor: colors.error,
          }}
        >
          <Text
            className={`${textClasses.subtitle} font-semibold mb-2`}
            style={{ color: colors.error }}
          >
            Danger Zone
          </Text>
          <Text
            className={`${textClasses.body} mb-6`}
            style={{ color: colors.textSecondary }}
          >
            These actions cannot be undone. Be careful.
          </Text>

          {/* Reset Onboarding */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              handleResetOnboarding();
            }}
            className="flex-row items-center justify-between py-4 border-b"
            style={{ borderBottomColor: colors.divider, minHeight: 72 }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: colors.errorBackground }}
              >
                <Ionicons name="refresh" size={24} color={colors.error} />
              </View>
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Reset Onboarding
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  See welcome screens on next launch
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </Pressable>

          {/* Clear All Data */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              handleClearAllData();
            }}
            disabled={isClearing}
            className="flex-row items-center justify-between py-4 border-b"
            style={{ borderBottomColor: colors.divider, minHeight: 72, opacity: isClearing ? 0.5 : 1 }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: colors.errorBackground }}
              >
                <Ionicons name="trash" size={24} color={colors.error} />
              </View>
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.error }}
                >
                  Clear All Data
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  Delete all app data and settings
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </Pressable>

          {/* Disable Developer Mode */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              handleDisableDeveloperMode();
            }}
            className="flex-row items-center justify-between py-4"
            style={{ minHeight: 72 }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: colors.errorBackground }}
              >
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </View>
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Disable Developer Mode
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  Hide developer options from settings
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
