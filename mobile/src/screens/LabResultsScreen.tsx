import React, { useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Modal, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // Keep for modal internal styling only
import { Screen } from "../components/Screen";
import { SubpageHeader } from "../components/ui";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useHealthRecordsStore, sortLabResultsByDate } from "../state/stores/healthRecordsStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { useHealthRecordsSync } from "../hooks";
import { getTextSizeClasses } from "../utils/textSizes";
import { format, formatDistanceToNow } from "date-fns";
import type { LabResultItem } from "../types/app";

/**
 * LabResultsScreen - Display lab results from Apple Health Records
 * Premium-only feature
 */
export default function LabResultsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { colors, primary, primaryLight } = useTheme();

  // Settings
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  // Premium check
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);

  // Lab results from store
  const labResults = useHealthRecordsStore((s) => s.labResults);

  // Health records sync hook
  const {
    isSyncing,
    lastSyncError,
    getLastSyncTime,
    syncAllHealthRecords,
  } = useHealthRecordsSync();

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedResult, setSelectedResult] = useState<LabResultItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [healthKitNotAvailable, setHealthKitNotAvailable] = useState(false);

  // Sort results by date (newest first)
  const sortedResults = sortLabResultsByDate(labResults);

  // Get last sync time
  const lastSyncTime = getLastSyncTime();

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

  // Handle viewing result details
  const handleViewDetails = (result: LabResultItem) => {
    setSelectedResult(result);
    setShowDetailsModal(true);
  };

  // Get interpretation color
  const getInterpretationColor = (interpretation: string) => {
    switch (interpretation) {
      case "normal":
        return colors.success;
      case "high":
        return colors.error;
      case "low":
        return colors.warning;
      case "abnormal":
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  // Format date for display
  const formatResultDate = (dateString: string) => {
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
            Lab Results from Apple Health Records is a Premium feature. Upgrade
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
    <Screen variant="static" edges={["top"]}>
      {/* Header - SENIOR-FRIENDLY: Labeled back button */}
      <SubpageHeader
        title="Lab Results"
        backLabel="Health"
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: isSyncing ? "sync" : "refresh",
          onPress: handleRefresh,
          accessibilityLabel: "Sync lab results",
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
                Set up Apple Health Records to import lab results from your healthcare providers.
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
                  {formatLastSync(lastSyncTime)} • {labResults.length} result{labResults.length !== 1 ? "s" : ""}
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

        {/* Empty State */}
        {labResults.length === 0 && (
          <View className="items-center py-12">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <Ionicons name="flask" size={48} color={primary} />
            </View>
            <Text
              className={`${textClasses.subtitle} font-semibold text-center mb-3`}
              style={{ color: colors.textPrimary }}
            >
              No Lab Results Yet
            </Text>
            <Text
              className={`${textClasses.body} text-center px-8`}
              style={{ color: colors.textSecondary }}
            >
              Pull down to sync your lab results from Apple Health Records. Make
              sure you have granted permission in Apple Health.
            </Text>
          </View>
        )}

        {/* Lab Results List */}
        {sortedResults.map((result) => (
          <Pressable
            key={result.id}
            onPress={() => handleViewDetails(result)}
            className="rounded-2xl p-5 mb-4"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            accessibilityRole="button"
            accessibilityLabel={`${result.displayName}, ${formatResultDate(result.date)}`}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-4">
                <Text
                  className={`${textClasses.body} font-semibold mb-1`}
                  style={{ color: colors.textPrimary }}
                  numberOfLines={2}
                >
                  {result.displayName}
                </Text>
                <Text
                  className={`${textClasses.small} mb-2`}
                  style={{ color: colors.textSecondary }}
                >
                  {formatResultDate(result.date)} • {result.sourceName}
                </Text>
                {result.valueText ? (
                  <View className="flex-row items-center">
                    <Text
                      className={`${textClasses.body} font-bold`}
                      style={{
                        color: getInterpretationColor(result.interpretation),
                      }}
                    >
                      {result.valueText}
                      {result.unitText ? ` ${result.unitText}` : ""}
                    </Text>
                    {result.interpretation !== "unknown" && (
                      <View
                        className="ml-2 px-2 py-1 rounded"
                        style={{
                          backgroundColor:
                            getInterpretationColor(result.interpretation) + "20",
                        }}
                      >
                        <Text
                          className="text-xs font-semibold capitalize"
                          style={{
                            color: getInterpretationColor(result.interpretation),
                          }}
                        >
                          {result.interpretation}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text
                    className={`${textClasses.small}`}
                    style={{ color: primary }}
                  >
                    View details
                  </Text>
                )}
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <SafeAreaView
          className="flex-1"
          style={{ backgroundColor: colors.background }}
          edges={["top", "bottom"]}
        >
          {/* Modal Header */}
          <View
            className="flex-row items-center justify-between px-6 py-4 border-b"
            style={{ borderBottomColor: colors.divider }}
          >
            <Pressable
              onPress={() => setShowDetailsModal(false)}
              className="p-2 -ml-2"
            >
              <Text className={`${textClasses.body}`} style={{ color: primary }}>
                Close
              </Text>
            </Pressable>
            <Text
              className={`${textClasses.subtitle} font-semibold`}
              style={{ color: colors.textPrimary }}
            >
              Lab Result Details
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {selectedResult && (
              <>
                {/* Result Name */}
                <Text
                  className={`${textClasses.title} font-bold mb-4`}
                  style={{ color: colors.textPrimary }}
                >
                  {selectedResult.displayName}
                </Text>

                {/* Key Info Card */}
                <View
                  className="rounded-2xl p-5 mb-6"
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {/* Value */}
                  <View className="mb-4">
                    <Text
                      className={`${textClasses.small} mb-1`}
                      style={{ color: colors.textSecondary }}
                    >
                      Value
                    </Text>
                    <Text
                      className={`${textClasses.subtitle} font-bold`}
                      style={{
                        color: getInterpretationColor(
                          selectedResult.interpretation
                        ),
                      }}
                    >
                      {selectedResult.valueText || "N/A"}
                      {selectedResult.unitText
                        ? ` ${selectedResult.unitText}`
                        : ""}
                    </Text>
                  </View>

                  {/* Reference Range */}
                  {(selectedResult.referenceRangeLow !== undefined ||
                    selectedResult.referenceRangeHigh !== undefined) && (
                    <View className="mb-4">
                      <Text
                        className={`${textClasses.small} mb-1`}
                        style={{ color: colors.textSecondary }}
                      >
                        Reference Range
                      </Text>
                      <Text
                        className={`${textClasses.body}`}
                        style={{ color: colors.textPrimary }}
                      >
                        {selectedResult.referenceRangeLow ?? "—"} -{" "}
                        {selectedResult.referenceRangeHigh ?? "—"}
                        {selectedResult.unitText
                          ? ` ${selectedResult.unitText}`
                          : ""}
                      </Text>
                    </View>
                  )}

                  {/* Interpretation */}
                  <View className="mb-4">
                    <Text
                      className={`${textClasses.small} mb-1`}
                      style={{ color: colors.textSecondary }}
                    >
                      Interpretation
                    </Text>
                    <View
                      className="self-start px-3 py-1 rounded-full"
                      style={{
                        backgroundColor:
                          getInterpretationColor(
                            selectedResult.interpretation
                          ) + "20",
                      }}
                    >
                      <Text
                        className={`${textClasses.body} font-semibold capitalize`}
                        style={{
                          color: getInterpretationColor(
                            selectedResult.interpretation
                          ),
                        }}
                      >
                        {selectedResult.interpretation}
                      </Text>
                    </View>
                  </View>

                  {/* Date */}
                  <View className="mb-4">
                    <Text
                      className={`${textClasses.small} mb-1`}
                      style={{ color: colors.textSecondary }}
                    >
                      Date
                    </Text>
                    <Text
                      className={`${textClasses.body}`}
                      style={{ color: colors.textPrimary }}
                    >
                      {formatResultDate(selectedResult.date)}
                    </Text>
                  </View>

                  {/* Source */}
                  <View>
                    <Text
                      className={`${textClasses.small} mb-1`}
                      style={{ color: colors.textSecondary }}
                    >
                      Source
                    </Text>
                    <Text
                      className={`${textClasses.body}`}
                      style={{ color: colors.textPrimary }}
                    >
                      {selectedResult.sourceName}
                    </Text>
                  </View>
                </View>

                {/* Raw Data Section (if available) */}
                {selectedResult.rawFhir && (
                  <View
                    className="rounded-2xl p-5"
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      className={`${textClasses.body} font-semibold mb-3`}
                      style={{ color: colors.textPrimary }}
                    >
                      Additional Details
                    </Text>
                    <Text
                      className={`${textClasses.small}`}
                      style={{ color: colors.textSecondary, fontFamily: "monospace" }}
                    >
                      {(() => {
                        try {
                          const parsed = JSON.parse(selectedResult.rawFhir);
                          return JSON.stringify(parsed, null, 2);
                        } catch {
                          return selectedResult.rawFhir;
                        }
                      })()}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}
