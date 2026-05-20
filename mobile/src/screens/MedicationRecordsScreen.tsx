import React, { useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { Screen } from "../components/Screen";
import { SubpageHeader } from "../components/ui";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useHealthRecordsStore } from "../state/stores/healthRecordsStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { useMedicationStore } from "../state/stores/medicationStore";
import { useHealthRecordsSync, useMedicationLinkSync } from "../hooks";
import { useToast } from "../components/ui";
import { getTextSizeClasses } from "../utils/textSizes";
import { format, formatDistanceToNow } from "date-fns";
import type { MedicationItem } from "../types/app";

/**
 * MedicationRecordsScreen - Display medications from Apple Health Records
 * Premium-only feature
 * Shows provider-sourced medications from Apple Health (read-only)
 * Manual medications are managed separately in the Medications tab
 */
export default function MedicationRecordsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { colors, primary, primaryLight } = useTheme();

  // Settings
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  // Premium check
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);

  // Medication records from store
  const medicationItems = useHealthRecordsStore((s) => s.medicationItems);
  const getAppleHealthMedications = useHealthRecordsStore((s) => s.getAppleHealthMedications);

  // Health records sync hook
  const {
    isSyncing,
    lastSyncError,
    getLastSyncTime,
    syncAllHealthRecords,
  } = useHealthRecordsSync();

  // Medication store for adding medications
  const addMedication = useMedicationStore((s) => s.addMedication);

  // Link sync hook
  const { isProviderMedicationLinked } = useMedicationLinkSync();

  // Toast for feedback
  const { showSuccess, ToastComponent } = useToast();

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [healthKitNotAvailable, setHealthKitNotAvailable] = useState(false);

  // Filter to only show Apple Health medications (provider-sourced)
  const appleHealthMedications = getAppleHealthMedications();

  // Get last sync time
  const lastSyncTime = getLastSyncTime();

  // Sort by date (newest first)
  const sortedMedications = [...appleHealthMedications].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  // Format last sync time
  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return "Never synced";
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  // Check if synced within the last hour (considered "recent")
  const isRecentlySynced = useMemo(() => {
    if (!lastSyncTime) return false;
    try {
      const syncDate = new Date(lastSyncTime);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return syncDate > hourAgo;
    } catch {
      return false;
    }
  }, [lastSyncTime]);

  // Add medication to user's list
  const handleAddToMyMedications = (providerMed: MedicationItem) => {
    const newMedication = {
      id: `med-${Date.now()}`,
      name: providerMed.medicationName || providerMed.displayName,
      dosage: providerMed.doseText || "",
      frequency: "daily" as const,
      timeOfDay: "morning" as const,
      reminderEnabled: true,
      scheduleType: "daily" as const,
      times: ["09:00"],
      createdAt: new Date().toISOString(),
      syncSource: "apple-health",
      // Link to provider medication
      linkedProviderId: providerMed.id,
      linkedProviderDosage: providerMed.doseText,
      linkedProviderName: providerMed.medicationName,
    };

    addMedication(newMedication);
    showSuccess(`Added "${newMedication.name}" to your medications with reminders!`);
  };

  // Handle refresh/sync - use the unified sync method
  const handleRefresh = useCallback(async () => {
    if (!isPremiumUnlocked) return;

    setRefreshing(true);
    const result = await syncAllHealthRecords("manual");

    // Track if HealthKit records are not available
    if (result.notAvailable === true) {
      setHealthKitNotAvailable(true);
    } else if (result.success) {
      setHealthKitNotAvailable(false);
    }

    setRefreshing(false);
  }, [isPremiumUnlocked, syncAllHealthRecords]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return colors.success;
      case "completed":
        return colors.textSecondary;
      case "on-hold":
        return colors.warning;
      case "stopped":
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  // Format date for display
  const formatMedicationDate = (dateString: string | undefined) => {
    if (!dateString) return "Date unknown";
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  // Redirect non-premium users
  if (!isPremiumUnlocked) {
    return (
      <Screen variant="static" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: colors.premiumLight }}
          >
            <Ionicons name="lock-closed" size={40} color={colors.premium} />
          </View>
          <Text
            className={`${textClasses.title} font-bold text-center mb-4`}
            style={{ color: colors.textPrimary }}
          >
            Premium Feature
          </Text>
          <Text
            className={`${textClasses.body} text-center mb-8`}
            style={{ color: colors.textSecondary }}
          >
            Medication Records from Apple Health is a Premium feature. Upgrade
            to access your health records.
          </Text>
          <Pressable
            onPress={() => navigation.navigate("SubscriptionSettings" as never)}
            className="px-8 py-4 rounded-2xl"
            style={{ backgroundColor: colors.premium }}
          >
            <Text
              className={`${textClasses.body} font-bold`}
              style={{ color: colors.onPremium }}
            >
              Upgrade to Premium
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen variant="scroll" edges={["top"]}>
      {/* Header - SENIOR-FRIENDLY: Labeled back button */}
      <SubpageHeader
        title="Medication Records"
        backLabel="Health"
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: isSyncing ? "sync" : "refresh",
          onPress: handleRefresh,
          accessibilityLabel: "Sync medication records",
        }}
      />

      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={primary}
            colors={[primary]}
          />
        }
      >
        {/* Sync Status Banner */}
        <View
          className="rounded-2xl p-4 mb-6"
          style={{
            backgroundColor: healthKitNotAvailable
              ? colors.warningBackground
              : lastSyncError
                ? colors.errorBackground
                : isSyncing
                  ? primaryLight
                  : isRecentlySynced
                    ? colors.successBackground
                    : primaryLight,
            borderWidth: 1,
            borderColor: healthKitNotAvailable
              ? colors.warning
              : lastSyncError
                ? colors.error
                : isSyncing
                  ? primary
                  : isRecentlySynced
                    ? colors.success
                    : primary,
          }}
        >
          {isSyncing ? (
            <View className="flex-row items-center">
              <Ionicons name="sync" size={24} color={primary} />
              <View className="flex-1 ml-3">
                <Text className={`${textClasses.body} font-semibold`} style={{ color: primary }}>
                  Syncing...
                </Text>
                <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textSecondary }}>
                  Fetching latest records from Apple Health...
                </Text>
              </View>
            </View>
          ) : healthKitNotAvailable ? (
            <View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="link" size={24} color={colors.warning} />
                <Text
                  className={`${textClasses.body} font-semibold ml-3 flex-1`}
                  style={{ color: colors.textPrimary }}
                >
                  Connect Apple Health
                </Text>
              </View>
              <Text
                className={`${textClasses.small} mb-3`}
                style={{ color: colors.textSecondary }}
              >
                Set up Apple Health Records to import medications from your healthcare providers.
              </Text>
              <Pressable
                onPress={() => navigation.navigate("HealthRecordsHelp" as never)}
                className="flex-row items-center justify-center py-3 rounded-xl active:opacity-80"
                style={{ backgroundColor: colors.warning }}
              >
                <Ionicons name="help-circle-outline" size={18} color="white" />
                <Text className={`${textClasses.small} font-semibold text-white ml-2`}>
                  How to Connect
                </Text>
              </Pressable>
            </View>
          ) : lastSyncError ? (
            <View className="flex-row items-center">
              <Ionicons name="alert-circle" size={24} color={colors.error} />
              <View className="flex-1 ml-3">
                <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.error }}>
                  Sync Error
                </Text>
                <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textSecondary }}>
                  {lastSyncError}
                </Text>
              </View>
              <Pressable
                onPress={handleRefresh}
                className="px-4 py-2 rounded-xl flex-row items-center"
                style={{ backgroundColor: colors.error }}
                accessibilityLabel="Retry sync"
              >
                <Ionicons name="refresh" size={18} color="white" />
                <Text className={`${textClasses.small} font-semibold text-white ml-2`}>
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-center">
              <Ionicons
                name={isRecentlySynced ? "checkmark-circle" : "information-circle"}
                size={24}
                color={isRecentlySynced ? colors.success : primary}
              />
              <View className="flex-1 ml-3">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: isRecentlySynced ? colors.success : colors.textPrimary }}
                >
                  {isRecentlySynced ? "Up to Date" : "Last Synced"}
                </Text>
                <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textSecondary }}>
                  {formatLastSync(lastSyncTime)} • {appleHealthMedications.length} medication{appleHealthMedications.length !== 1 ? "s" : ""}
                </Text>
              </View>
              <Pressable
                onPress={handleRefresh}
                className="px-4 py-2 rounded-xl flex-row items-center"
                style={{ backgroundColor: primary }}
                accessibilityLabel="Sync now"
              >
                <Ionicons name="refresh" size={18} color="white" />
                <Text className={`${textClasses.small} font-semibold text-white ml-2`}>
                  Sync
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Info Note */}
        <View
          className="rounded-2xl p-4 mb-6 flex-row items-start"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons
            name="lock-closed"
            size={20}
            color={colors.textSecondary}
            style={{ marginTop: 2 }}
          />
          <View className="flex-1 ml-3">
            <Text
              className={`${textClasses.small}`}
              style={{ color: colors.textSecondary }}
            >
              These medications are from your healthcare providers via Apple
              Health and cannot be edited. To add or manage your own medications,
              use the Medications tab.
            </Text>
          </View>
        </View>

        {/* Empty State */}
        {appleHealthMedications.length === 0 && (
          <View className="items-center py-12">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <Ionicons name="medical" size={48} color={primary} />
            </View>
            <Text
              className={`${textClasses.subtitle} font-semibold text-center mb-3`}
              style={{ color: colors.textPrimary }}
            >
              No Medication Records Yet
            </Text>
            <Text
              className={`${textClasses.body} text-center px-8`}
              style={{ color: colors.textSecondary }}
            >
              Pull down to sync your medication records from Apple Health. Make
              sure you have granted permission in Apple Health.
            </Text>
          </View>
        )}

        {/* Medication Records List */}
        {sortedMedications.map((medication: MedicationItem) => (
          <View
            key={medication.id}
            className="rounded-2xl p-5 mb-4"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-start">
              {/* Icon */}
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Ionicons name="medical" size={24} color={primary} />
              </View>

              {/* Content */}
              <View className="flex-1">
                {/* Medication Name */}
                <Text
                  className={`${textClasses.body} font-semibold mb-1`}
                  style={{ color: colors.textPrimary }}
                  numberOfLines={2}
                >
                  {medication.displayName || medication.medicationName}
                </Text>

                {/* Dose if available */}
                {medication.doseText && (
                  <Text
                    className={`${textClasses.small} mb-1`}
                    style={{ color: colors.textSecondary }}
                  >
                    {medication.doseText}
                    {medication.routeText ? ` • ${medication.routeText}` : ""}
                  </Text>
                )}

                {/* Schedule if available */}
                {medication.scheduleText && (
                  <Text
                    className={`${textClasses.small} mb-2`}
                    style={{ color: colors.textSecondary }}
                  >
                    {medication.scheduleText}
                  </Text>
                )}

                {/* Source and Date */}
                <View className="flex-row items-center flex-wrap">
                  <View
                    className="flex-row items-center px-2 py-1 rounded mr-2 mb-1"
                    style={{ backgroundColor: colors.infoBackground }}
                  >
                    <Ionicons
                      name="heart"
                      size={12}
                      color={colors.info}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      className="text-xs"
                      style={{ color: colors.onInfo }}
                    >
                      From Apple Health
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    className="px-2 py-1 rounded mb-1"
                    style={{
                      backgroundColor: getStatusColor(medication.status) + "20",
                    }}
                  >
                    <Text
                      className="text-xs font-semibold capitalize"
                      style={{ color: getStatusColor(medication.status) }}
                    >
                      {medication.status}
                    </Text>
                  </View>
                </View>

                {/* Date */}
                {medication.date && (
                  <Text
                    className={`${textClasses.small} mt-2`}
                    style={{ color: colors.textTertiary }}
                  >
                    {formatMedicationDate(medication.date)}
                  </Text>
                )}

                {/* Add to My Medications Button */}
                {isProviderMedicationLinked(medication.id) ? (
                  <View className="flex-row items-center mt-3 pt-3 border-t" style={{ borderTopColor: colors.divider }}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text className={`${textClasses.small} ml-2`} style={{ color: colors.success }}>
                      Linked to your Medications
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => handleAddToMyMedications(medication)}
                    className="flex-row items-center justify-center mt-3 pt-3 border-t py-3 rounded-xl"
                    style={{ borderTopColor: colors.divider, backgroundColor: primaryLight }}
                  >
                    <Ionicons name="add-circle" size={20} color={primary} />
                    <Text className={`${textClasses.body} font-semibold ml-2`} style={{ color: primary }}>
                      Add to My Medications
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Lock Icon */}
              <View className="ml-2">
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={colors.textTertiary}
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Toast Component */}
      {ToastComponent}
    </Screen>
  );
}
