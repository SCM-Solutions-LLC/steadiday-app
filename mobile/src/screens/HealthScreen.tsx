import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, ScrollView, Modal, TextInput, Linking, RefreshControl, ActivityIndicator, Platform, InteractionManager } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context"; // Keep for modal internal styling only
import { Screen } from "../components/Screen";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useHealthStore } from "../state/stores/healthStore";
import { useUIStore } from "../state/stores/uiStore";
import { useTipStore, TIP_IDS } from "../state/stores/tipStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useHealthRecordsStore } from "../state/stores/healthRecordsStore";
import { HealthMetric } from "../types/app";
import { format, subDays, formatDistanceToNow } from "date-fns";
import {
  requestHealthPermissions,
  checkHealthPermissions,
  syncHealthData,
  getHealthSourceName,
  checkHealthConnectAvailability,
  openHealthConnectPlayStore,
  openHealthConnectSettings,
  type HealthConnectAvailability,
} from "../utils/healthSync";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { formatHealthNumber, calculateHealthProgress } from "../utils/healthFormatters";
import { getTextSizeClasses } from "../utils/textSizes";
import { useTheme } from "../utils/useTheme";
import { ScreenErrorBoundary, useToast, PrivacyFooterLink, PrivacyHeader, PrivacyFooter, InlineTip } from "../components/ui";
import { Skeleton } from "../components/skeletons";
import { useConfirmModal } from "../components/ConfirmModal";
import { useHealthRecordsSync } from "../hooks";
import { PRIVACY_COPY } from "../utils/privacyCopy";
import { logger } from "../utils/logger";
import { isAndroidFeaturesActive } from "../config/platformConfig";

type MetricType = "steps" | "heartRate" | "sleep" | "exercise" | "weight" | "bloodPressure";

export default function HealthScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { colors, primary } = useTheme();
  const { alert, confirm } = useConfirmModal();

  // Deferred render: show lightweight placeholder until navigation transition completes
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  // Toast notifications
  const { showSuccess, showError, ToastComponent } = useToast();

  // Health data from useHealthStore
  const healthMetrics = useHealthStore((s) => s.healthMetrics);
  const healthGoals = useHealthStore((s) => s.healthGoals);
  const addHealthMetric = useHealthStore((s) => s.addHealthMetric);
  const updateHealthMetric = useHealthStore((s) => s.updateHealthMetric);
  const getHealthMetricForDate = useHealthStore((s) => s.getHealthMetricForDate);
  const updateHealthGoals = useHealthStore((s) => s.updateHealthGoals);
  const hasInitialHealthSync = useHealthStore((s) => s.hasInitialHealthSync);
  const setHasInitialHealthSync = useHealthStore((s) => s.setHasInitialHealthSync);

  // Apple Health connection status for Connected Apps settings
  const setAppleHealthConnected = useSubscriptionStore((s) => s.setAppleHealthConnected);
  const appleHealthConnected = useSubscriptionStore((s) => s.appleHealthConnected);

  // Settings from useSettingsStore
  const textSize = useSettingsStore((s) => s.textSize);

  // Tip state from useTipStore
  const dismissedInfoCards = useTipStore((s) => s.dismissedInfoCards || []);
  const dismissInfoCard = useTipStore((s) => s.dismissInfoCard);

  // Helper function for checking if card is dismissed
  const isCardDismissed = (cardId: string) => dismissedInfoCards.includes(cardId);

  // v1.0: Health Records sync hook kept but clinical records sync removed
  useHealthRecordsSync();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMetric, setEditingMetric] = useState<MetricType | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSyncedFromAppleHealth, setHasSyncedFromAppleHealth] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [healthKitNotAvailable, setHealthKitNotAvailable] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);

  const textClasses = getTextSizeClasses(textSize);

  // Form state
  const [steps, setSteps] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [exerciseMinutes, setExerciseMinutes] = useState("");
  const [weight, setWeight] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");

  // Auto-sync health metrics on screen focus and when Apple Health connection changes
  const hasSyncedHealthRef = useRef(false);
  const isSyncingHealthRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      if (hasSyncedHealthRef.current || isSyncingHealthRef.current) return;
      isSyncingHealthRef.current = true;
      handleSyncFromHealthSource(true).finally(() => {
        isSyncingHealthRef.current = false;
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady])
  );

  // Also trigger sync when Apple Health connection state changes (e.g., after onboarding or store hydration)
  useEffect(() => {
    if (!isReady) return;
    if (!appleHealthConnected) return;
    if (hasSyncedHealthRef.current || isSyncingHealthRef.current) return;
    isSyncingHealthRef.current = true;
    handleSyncFromHealthSource(true).then(() => {
      hasSyncedHealthRef.current = true;
    }).catch(() => {
      // Allow retry on next trigger
    }).finally(() => {
      isSyncingHealthRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appleHealthConnected, isReady]);

  // Format last sync time for display
  const formatLastSyncTime = (timestamp: string | null): string => {
    if (!timestamp) return "Not synced yet";
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  // Android: Health Connect state
  const [healthConnectStatus, setHealthConnectStatus] = useState<string>("unknown");
  const [healthConnectChecked, setHealthConnectChecked] = useState(false);

  // Check Health Connect availability on Android
  useEffect(() => {
    if (!isReady) return;
    if (isAndroidFeaturesActive()) {
      checkHealthConnectAvailability().then((status) => {
        setHealthConnectStatus(status);
        setHealthConnectChecked(true);
        if (status === "available") {
          handleSyncFromHealthSource(true);
        }
      });
    }
  }, [isReady]);

  const handleOpenAppleHealth = async () => {
    if (Platform.OS === "android") {
      // On Android, open Health Connect settings
      await openHealthConnectSettings();
      return;
    }
    const url = "x-apple-health://";
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      alert(
        "Cannot Open Apple Health",
        "Unable to open the Apple Health app. Please open it manually from your home screen."
      );
    }
  };

  const isIOS = Platform.OS === "ios";
  const healthSourceName = isIOS ? "Apple Health" : "Health Connect";
  const wearableName = isIOS ? "Apple Watch" : "your fitness tracker";
  const settingsPath = isIOS
    ? "iPhone Settings \u2192 Health \u2192 SteadiDay"
    : "phone Settings \u2192 Health Connect";

  const handleSyncFromHealthSource = async (silent: boolean = false) => {
    setIsSyncing(true);
    setSyncFailed(false);

    try {
      const alreadyGranted = await checkHealthPermissions();
      const hasPermissions = alreadyGranted || await requestHealthPermissions();

      if (!hasPermissions) {
        setSyncFailed(true);
        if (!silent) {
          showError(
            isIOS
              ? "Open the Health app → Apps → SteadiDay → turn on all permissions, then come back and tap Retry."
              : "Open Health Connect → App permissions → SteadiDay → turn on all permissions, then come back and tap Retry."
          );
        }
        return;
      }

      const isInitialSync = !hasInitialHealthSync;

      const metricsSuccess = await syncHealthData((metric) => {
        const existing = getHealthMetricForDate(metric.date);
        if (existing) {
          updateHealthMetric(existing.id, metric);
        } else {
          addHealthMetric(metric);
        }
      }, isInitialSync);

      if (metricsSuccess && isInitialSync) {
        setHasInitialHealthSync(true);
      }

      if (metricsSuccess) {
        setAppleHealthConnected(true);
        setHasSyncedFromAppleHealth(true);
        if (!silent) {
          showSuccess("\u2713 Health data synced");
        }
      } else {
        setSyncFailed(true);
        if (!silent) {
          showError(`Could not sync with ${healthSourceName}. Check that permissions are enabled in ${settingsPath}.`);
        }
      }
    } catch (error) {
      logger.error("[Health Screen] Sync exception:", error);
      setSyncFailed(true);
      if (!silent) {
        showError("Sync failed. Tap the card below to try again.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull-to-refresh handler - now defined after handleSyncFromHealthSource
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleSyncFromHealthSource(true);
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get today's date as ISO string (YYYY-MM-DD)
  const todayDateString = format(selectedDate, "yyyy-MM-dd");

  // Get today's metrics or use empty values
  const todayMetric = getHealthMetricForDate(todayDateString);

  const currentMetrics = {
    steps: todayMetric?.steps || 0,
    heartRate: todayMetric?.heartRate || 0,
    sleep: todayMetric?.sleepHours || 0,
    exercise: todayMetric?.exerciseMinutes || 0,
    weight: todayMetric?.weight || 0,
    bloodPressure: {
      systolic: todayMetric?.bloodPressureSystolic || 0,
      diastolic: todayMetric?.bloodPressureDiastolic || 0,
    },
  };

  type MetricDisplayState = "no-connection" | "syncing" | "no-data" | "has-data";

  const getMetricDisplayState = (value: number): MetricDisplayState => {
    if (!hasInitialHealthSync && !appleHealthConnected) return "no-connection";
    if (!hasInitialHealthSync && appleHealthConnected && isSyncing) return "syncing";
    if (hasInitialHealthSync && value === 0) return "no-data";
    return "has-data";
  };

  const renderMetricValue = (
    value: number,
    formattedValue: string,
    accentColor: string,
    noDataHint?: string,
  ) => {
    const state = getMetricDisplayState(value);
    if (state === "no-connection") {
      return (
        <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textTertiary }}>
          {`Connect ${healthSourceName} to see your data`}
        </Text>
      );
    }
    if (state === "syncing") {
      return (
        <View className="flex-row items-center mt-1">
          <Skeleton width={60} height={16} borderRadius={4} />
        </View>
      );
    }
    if (state === "no-data") {
      return (
        <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textTertiary }}>
          {noDataHint || "No data yet"}
        </Text>
      );
    }
    return (
      <Animated.Text
        entering={FadeIn.duration(300)}
        className={`${textClasses.body} mt-1`}
        style={{ color: colors.textSecondary }}
      >
        {formattedValue}
      </Animated.Text>
    );
  };

  const renderStandaloneMetricValue = (
    value: number,
    accentColor: string,
    unit: string,
    noDataHint?: string,
  ) => {
    const state = getMetricDisplayState(value);
    if (state === "no-connection") {
      return (
        <Text className={`${textClasses.small} mb-4`} style={{ color: colors.textTertiary }}>
          {`Connect ${healthSourceName} to see your data`}
        </Text>
      );
    }
    if (state === "syncing") {
      return (
        <View className="flex-row items-center mb-4">
          <Skeleton width={80} height={24} borderRadius={4} />
        </View>
      );
    }
    if (state === "no-data") {
      return (
        <Text className={`${textClasses.small} mb-4`} style={{ color: colors.textTertiary }}>
          {noDataHint || "No data yet"}
        </Text>
      );
    }
    return (
      <Animated.View entering={FadeIn.duration(300)} className="flex-row items-baseline mb-4">
        <Text className={`${textClasses.title} font-bold`} style={{ color: accentColor }}>
          {value}
        </Text>
        <Text className={`${textClasses.subtitle} ml-2`} style={{ color: colors.textSecondary }}>{unit}</Text>
      </Animated.View>
    );
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const getStepsPercentage = () => {
    const { percentage } = calculateHealthProgress(currentMetrics.steps, healthGoals.stepsGoal);
    return percentage;
  };

  const getSleepPercentage = () => {
    const { percentage } = calculateHealthProgress(currentMetrics.sleep, healthGoals.sleepGoal);
    return percentage;
  };

  const getExercisePercentage = () => {
    const { percentage } = calculateHealthProgress(currentMetrics.exercise, healthGoals.exerciseGoal);
    return percentage;
  };

  const handleOpenAddModal = (metricType: MetricType) => {
    setEditingMetric(metricType);

    // Pre-fill with existing values if available
    if (todayMetric) {
      setSteps(todayMetric.steps?.toString() || "");
      setHeartRate(todayMetric.heartRate?.toString() || "");
      setSleepHours(todayMetric.sleepHours?.toString() || "");
      setExerciseMinutes(todayMetric.exerciseMinutes?.toString() || "");
      setWeight(todayMetric.weight?.toString() || "");
      setSystolic(todayMetric.bloodPressureSystolic?.toString() || "");
      setDiastolic(todayMetric.bloodPressureDiastolic?.toString() || "");
    } else {
      // Clear form
      setSteps("");
      setHeartRate("");
      setSleepHours("");
      setExerciseMinutes("");
      setWeight("");
      setSystolic("");
      setDiastolic("");
    }

    setShowAddModal(true);
  };

  const handleSaveMetric = () => {
    const dateString = format(selectedDate, "yyyy-MM-dd");

    const metricData: Partial<HealthMetric> = {
      steps: steps ? parseInt(steps) : undefined,
      heartRate: heartRate ? parseInt(heartRate) : undefined,
      sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
      exerciseMinutes: exerciseMinutes ? parseInt(exerciseMinutes) : undefined,
      weight: weight ? parseInt(weight) : undefined,
      bloodPressureSystolic: systolic ? parseInt(systolic) : undefined,
      bloodPressureDiastolic: diastolic ? parseInt(diastolic) : undefined,
    };

    if (todayMetric) {
      // Update existing metric
      updateHealthMetric(todayMetric.id, metricData);
    } else {
      // Create new metric
      const newMetric: HealthMetric = {
        id: Date.now().toString(),
        date: dateString,
        createdAt: new Date().toISOString(),
        ...metricData,
      };
      addHealthMetric(newMetric);
    }

    setShowAddModal(false);
    alert("Saved!", "Your health data has been saved successfully.");
  };

  const getWeekData = (metricKey: keyof Omit<HealthMetric, "id" | "date" | "createdAt">) => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(selectedDate, i), "yyyy-MM-dd");
      const metric = getHealthMetricForDate(date);
      data.push({
        day: format(subDays(selectedDate, i), "EEE"),
        value: metric?.[metricKey] || 0,
      });
    }
    return data;
  };

  const renderMiniChart = (data: { day: string; value: number }[], color: string, goal?: number) => {
    const maxValue = goal || Math.max(...data.map((d) => d.value), 1);

    return (
      <View className="flex-row items-end justify-between mt-4" style={{ height: 80 }}>
        {data.map((point, index) => {
          const heightPercentage = goal
            ? Math.min((point.value / goal) * 100, 100)
            : (point.value / maxValue) * 100;
          const barHeight = Math.max((heightPercentage / 100) * 60, 4);

          return (
            <View key={index} className="flex-1 items-center" style={{ marginHorizontal: 2 }}>
              <View
                style={{
                  height: barHeight,
                  backgroundColor: color,
                  width: "100%",
                  borderRadius: 4,
                }}
              />
              <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>{point.day}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (!isReady) {
    return (
      <ScreenErrorBoundary screenName="Health">
        <Screen variant="static" edges={["top"]} extraBottomPadding={0}>
          <View className="flex-1">
            <View style={{ backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }} className="px-8 py-6 border-b">
              <Text className={`${textClasses.largeTitle} font-bold`} style={{ color: colors.textPrimary }}>
                Health
              </Text>
            </View>
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={primary} />
            </View>
          </View>
        </Screen>
      </ScreenErrorBoundary>
    );
  }

  // Android: Show Health Connect setup or "not installed" message when needed
  // If Health Connect is available and permissions granted, fall through to the normal health dashboard below
  if (isAndroidFeaturesActive() && healthConnectChecked && healthConnectStatus !== "available") {
    return (
      <ScreenErrorBoundary screenName="Health">
        <Screen variant="static" edges={["top"]} extraBottomPadding={0}>
          <View className="flex-1">
            {/* Header */}
            <View style={{ backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }} className="px-8 py-6 border-b">
              <Text className={`${textClasses.largeTitle} font-bold`} style={{ color: colors.textPrimary }}>
                Health
              </Text>
            </View>

            {/* Health Connect Not Installed */}
            <ScrollView className="flex-1 px-8 py-8">
              <View className="items-center mb-8">
                <View
                  className="w-24 h-24 rounded-full items-center justify-center mb-6"
                  style={{ backgroundColor: primary + "20" }}
                >
                  <Ionicons name="heart" size={48} color={primary} />
                </View>
                <Text className={`${textClasses.title} font-bold text-center mb-4`} style={{ color: colors.textPrimary }}>
                  Connect to Health Connect
                </Text>
                <Text className={`${textClasses.body} text-center leading-relaxed mb-6`} style={{ color: colors.textSecondary, lineHeight: 24 }}>
                  {"Health Connect is Google's health data platform. It allows SteadiDay to read your steps, heart rate, sleep, and more from your Android device."}
                </Text>

                {healthConnectStatus === "not_installed" && (
                  <>
                    <Text className={`${textClasses.body} text-center mb-4`} style={{ color: colors.textSecondary }}>
                      Health Connect is not installed on your device. You can install it from the Google Play Store.
                    </Text>
                    <Pressable
                      onPress={() => openHealthConnectPlayStore()}
                      style={{ backgroundColor: primary }}
                      className="px-6 py-4 rounded-xl flex-row items-center mb-4 active:opacity-80"
                    >
                      <Ionicons name="download-outline" size={22} color="white" style={{ marginRight: 8 }} />
                      <Text className={`text-white ${textClasses.body} font-semibold`}>Install Health Connect</Text>
                    </Pressable>
                  </>
                )}

                {healthConnectStatus === "not_supported" && (
                  <Text className={`${textClasses.body} text-center mb-4`} style={{ color: colors.warning }}>
                    Health Connect requires Android 9 or later. Your device may not support this feature.
                  </Text>
                )}

                <Pressable
                  onPress={() => {
                    setHealthConnectChecked(false);
                    checkHealthConnectAvailability().then((status) => {
                      setHealthConnectStatus(status);
                      setHealthConnectChecked(true);
                      if (status === "available") {
                        handleSyncFromHealthSource(true);
                      }
                    });
                  }}
                  style={{ backgroundColor: colors.cardBackground, borderColor: primary }}
                  className="px-6 py-4 rounded-xl flex-row items-center border-2 active:opacity-80"
                >
                  <Ionicons name="refresh" size={22} color={primary} style={{ marginRight: 8 }} />
                  <Text className={`${textClasses.body} font-semibold`} style={{ color: primary }}>Check Again</Text>
                </Pressable>
              </View>

              {/* Manual entry option */}
              <View style={{ backgroundColor: colors.infoBackground, borderColor: colors.info }} className="rounded-2xl p-5 border">
                <View className="flex-row items-start">
                  <Ionicons name="create-outline" size={22} color={colors.info} style={{ marginRight: 12, marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className={`${textClasses.body} font-medium mb-1`} style={{ color: colors.textPrimary }}>
                      Manual Entry Available
                    </Text>
                    <Text className={`${textClasses.small} leading-relaxed`} style={{ color: colors.textSecondary }}>
                      You can still manually enter your health data. Scroll down and tap any metric card to add data by hand.
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </Screen>
      </ScreenErrorBoundary>
    );
  }

  return (
    <ScreenErrorBoundary screenName="Health">
      <Screen variant="static" edges={["top"]} extraBottomPadding={0}>
      <View className="flex-1">
        {/* Header */}
        <View style={{ backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }} className="px-8 py-6 border-b">
          <View className="flex-row items-center justify-between mb-2">
            <Text className={`${textClasses.title} font-semibold`} style={{ color: colors.textPrimary }}>Health</Text>
            <Pressable
              onPress={() => handleSyncFromHealthSource(false)}
              disabled={isSyncing}
              style={{ backgroundColor: isSyncing ? colors.buttonDisabled : primary }}
              className={`px-4 py-3 rounded-xl flex-row items-center ${isSyncing ? "" : "active:opacity-80"}`}
            >
              <Ionicons
                name={isSyncing ? "refresh" : "fitness"}
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text className={`text-white ${textClasses.body} font-semibold`}>
                {isSyncing ? "Syncing..." : "Sync"}
              </Text>
            </Pressable>
          </View>
          {/* Privacy Header */}
          <PrivacyHeader message={PRIVACY_COPY.healthHeader} />
          <Text className={`${textClasses.subtitle} mt-2`} style={{ color: colors.textSecondary }}>{formatDate(selectedDate)}</Text>
        </View>

        <ScrollView
          className="flex-1 px-8 py-8"
          showsVerticalScrollIndicator={true}
          indicatorStyle="default"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={primary}
              colors={[primary]}
            />
          }
        >
          {/* Syncing progress banner */}
          {isSyncing && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{ backgroundColor: colors.primaryLight, borderColor: primary }}
              className="rounded-2xl p-4 mb-4 border flex-row items-center"
              accessibilityRole="text"
              accessibilityLabel={`Importing data from ${healthSourceName}`}
            >
              <ActivityIndicator size="small" color={primary} style={{ marginRight: 12 }} />
              <View className="flex-1">
                <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
                  {`Importing from ${healthSourceName}...`}
                </Text>
                {!hasInitialHealthSync && (
                  <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textSecondary }}>
                    This can take up to a minute on first run.
                  </Text>
                )}
              </View>
            </Animated.View>
          )}

          {/* Sync error retry card */}
          {syncFailed && !isSyncing && (
            <View
              style={{ backgroundColor: colors.errorBackground, borderColor: colors.error }}
              className="rounded-2xl p-4 mb-4 border"
              accessibilityRole="text"
              accessibilityLabel="Sync failed. Tap try again to retry."
            >
              <View className="flex-row items-start">
                <Ionicons name="alert-circle" size={22} color={colors.error} style={{ marginRight: 12, marginTop: 2 }} />
                <View className="flex-1">
                  <Text className={`${textClasses.body} font-semibold mb-1`} style={{ color: colors.textPrimary }}>
                    {`Could not sync with ${healthSourceName}`}
                  </Text>
                  <Text className={`${textClasses.small} mb-3`} style={{ color: colors.textSecondary }}>
                    {`Check that ${healthSourceName} permissions are enabled in ${settingsPath}.`}
                  </Text>
                  <View className="flex-row" style={{ gap: 8 }}>
                    <Pressable
                      onPress={() => handleSyncFromHealthSource(false)}
                      style={{ backgroundColor: colors.error }}
                      className="px-4 py-2 rounded-lg active:opacity-80"
                      accessibilityRole="button"
                      accessibilityLabel="Try syncing again"
                      accessibilityHint={`Attempts to sync with ${healthSourceName} again`}
                    >
                      <Text className={`text-white font-semibold ${textClasses.small}`}>Try again</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        if (Platform.OS === "android") {
                          openHealthConnectSettings();
                        } else {
                          Linking.openURL("app-settings:");
                        }
                      }}
                      style={{ borderColor: colors.error, borderWidth: 1.5 }}
                      className="px-4 py-2 rounded-lg active:opacity-80"
                      accessibilityRole="button"
                      accessibilityLabel="Open Settings"
                      accessibilityHint={Platform.OS === "ios"
                        ? "Opens iPhone Settings to enable health permissions"
                        : "Opens Health Connect to enable health permissions"}
                    >
                      <Text className={`font-semibold ${textClasses.small}`} style={{ color: colors.error }}>Open Settings</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Show only ONE tip at a time to avoid stacking confusion */}
          {(() => {
            const showSyncBanner = hasSyncedFromAppleHealth && !isCardDismissed("health-sync-banner");
            const showInfoBanner = !hasSyncedFromAppleHealth && !isCardDismissed("health-info-banner");
            const showFirstRun = !hasInitialHealthSync && !isCardDismissed("health-first-run");

            if (showFirstRun) {
              return (
                <View
                  style={{ backgroundColor: colors.infoBackground, borderColor: colors.info }}
                  className="rounded-2xl p-5 mb-6 border"
                  accessibilityRole="text"
                  accessibilityLabel="Connect Apple Health in Settings to see your health data here."
                >
                  <View className="flex-row items-start">
                    <Ionicons name="sparkles-outline" size={24} color={colors.info} style={{ marginRight: 12, marginTop: 2 }} />
                    <View className="flex-1">
                      <Text className={`${textClasses.body} leading-relaxed`} style={{ color: colors.textPrimary }}>
                        {"Connect Apple Health in Settings to see your steps, heart rate, and sleep data here."}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => dismissInfoCard("health-first-run")}
                      className="p-1 active:opacity-50 ml-2"
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel="Dismiss first-run tip"
                    >
                      <Ionicons name="close" size={22} color={colors.info} />
                    </Pressable>
                  </View>
                </View>
              );
            }

            if (showInfoBanner) {
              return (
                <View style={{ backgroundColor: colors.primaryLight, borderColor: primary }} className="rounded-2xl p-4 mb-4 border flex-row items-start">
                  <Ionicons
                    name="information-circle"
                    size={22}
                    color={primary}
                    style={{ marginRight: 10, marginTop: 1 }}
                  />
                  <Text className={`${textClasses.small} flex-1 leading-relaxed`} style={{ color: colors.textPrimary }}>
                    {"Tap any card below to manually enter data, or tap \"Sync\" to import from "}{healthSourceName}
                  </Text>
                  <Pressable
                    onPress={() => dismissInfoCard("health-info-banner")}
                    className="p-1 active:opacity-50 ml-2"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={20} color={primary} />
                  </Pressable>
                </View>
              );
            }

            if (showSyncBanner) {
              return (
                <View style={{ backgroundColor: colors.primaryLight, borderColor: primary }} className="rounded-2xl p-4 mb-4 border flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color={primary} />
                  <Text className={`${textClasses.small} font-semibold flex-1 ml-2`} style={{ color: colors.textPrimary }}>
                    Synced with {healthSourceName}
                  </Text>
                  <Pressable
                    onPress={handleOpenAppleHealth}
                    className="active:opacity-80 mr-3"
                  >
                    <Text className={`font-semibold ${textClasses.small}`} style={{ color: primary }}>Open</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => dismissInfoCard("health-sync-banner")}
                    className="p-1 active:opacity-50"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={20} color={primary} />
                  </Pressable>
                </View>
              );
            }

            return null;
          })()}

          {/* Health Screenings Guide Card */}
          <Pressable
            onPress={() => {
              navigation.navigate("HealthScreenings" as never);
            }}
            className="rounded-2xl p-5 mb-6 border-2 active:opacity-80"
            style={{ backgroundColor: colors.successBackground, borderColor: colors.success, minHeight: 80 }}
            accessibilityRole="button"
            accessibilityLabel="View recommended health screenings for your age"
          >
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: colors.success }}>
                <Ionicons name="shield-checkmark" size={28} color="white" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className={`${textClasses.subtitle} font-semibold mb-1`} style={{ color: colors.onSuccess }}>
                    Health Screenings Guide
                  </Text>
                </View>
                <Text className={`${textClasses.small}`} style={{ color: colors.success }}>
                  Recommended screenings for adults 65+
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.success} />
            </View>
          </Pressable>

          {/* Apple Health Records Section — v1.0: disabled (Clinical Health Records removed) */}
          {/* {isPremiumUnlocked && (
            <View className="mb-6">
              ... Apple Health Records section removed for v1.0 ...
            </View>
          )} */}

          {/* Health Metrics Section Header */}
          <Text
            className={`${textClasses.subtitle} font-semibold mb-4`}
            style={{ color: colors.textPrimary }}
          >
            Health Metrics
          </Text>

          {/* Steps Card */}
          <Pressable onPress={() => handleOpenAddModal("steps")}>
            <View style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }} className="rounded-3xl p-5 mb-4 border-2">
              <View className="flex-row items-center mb-4">
                <View className="w-14 h-14 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: colors.successBackground }}>
                  <Ionicons name="footsteps" size={28} color={colors.success} />
                </View>
                <View className="flex-1">
                  <Text className={`${textClasses.subtitle} font-semibold`} style={{ color: colors.textPrimary }}>Steps</Text>
                  {renderMetricValue(
                    currentMetrics.steps,
                    `${formatHealthNumber(currentMetrics.steps)} of ${formatHealthNumber(healthGoals.stepsGoal)}`,
                    colors.success,
                    "No steps recorded yet today"
                  )}
                </View>
                <Ionicons name="create-outline" size={24} color={colors.success} />
              </View>

              {getMetricDisplayState(currentMetrics.steps) === "has-data" && (
                <>
                  {/* Progress Bar */}
                  <View style={{ backgroundColor: colors.border }} className="h-3 rounded-full overflow-hidden mb-2">
                    <View
                      style={{ width: `${getStepsPercentage()}%`, backgroundColor: colors.success }}
                      className="h-full rounded-full"
                    />
                  </View>
                  <Text className={`${textClasses.body} text-right mb-4`} style={{ color: colors.textSecondary }}>
                    {calculateHealthProgress(currentMetrics.steps, healthGoals.stepsGoal).displayText}
                  </Text>
                </>
              )}

              {/* 7-Day Chart */}
              {renderMiniChart(getWeekData("steps"), colors.success, healthGoals.stepsGoal)}
            </View>
          </Pressable>

          {/* Heart Rate Card */}
          <Pressable onPress={() => handleOpenAddModal("heartRate")}>
            <View style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }} className="rounded-3xl p-5 mb-4 border-2">
              <View className="flex-row items-center mb-3">
                <View className="w-14 h-14 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: colors.errorBackground }}>
                  <Ionicons name="heart" size={28} color={colors.error} />
                </View>
                <View className="flex-1">
                  <Text className={`${textClasses.subtitle} font-semibold`} style={{ color: colors.textPrimary }}>Heart Rate</Text>
                  <Text className={`${textClasses.body} mt-1`} style={{ color: colors.textSecondary }}>Resting</Text>
                </View>
                <Ionicons name="create-outline" size={24} color={colors.error} />
              </View>
              {renderStandaloneMetricValue(
                currentMetrics.heartRate,
                colors.error,
                "bpm",
                `No data yet \u2014 ${wearableName} will fill this in`
              )}

              {/* 7-Day Chart */}
              {renderMiniChart(getWeekData("heartRate"), colors.error)}
            </View>
          </Pressable>

          {/* Sleep Card */}
          <Pressable onPress={() => handleOpenAddModal("sleep")}>
            <View style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }} className="rounded-3xl p-5 mb-4 border-2">
              <View className="flex-row items-center mb-4">
                <View className="w-14 h-14 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: colors.infoBackground }}>
                  <Ionicons name="moon" size={28} color={colors.info} />
                </View>
                <View className="flex-1">
                  <Text className={`${textClasses.subtitle} font-semibold`} style={{ color: colors.textPrimary }}>Sleep</Text>
                  {renderMetricValue(
                    currentMetrics.sleep,
                    `${formatHealthNumber(currentMetrics.sleep, 1)}h of ${formatHealthNumber(healthGoals.sleepGoal)}h`,
                    colors.info,
                    `No sleep data yet \u2014 wear ${wearableName} to bed`
                  )}
                </View>
                <Ionicons name="create-outline" size={24} color={colors.info} />
              </View>

              {getMetricDisplayState(currentMetrics.sleep) === "has-data" && (
                <>
                  {/* Progress Bar */}
                  <View style={{ backgroundColor: colors.border }} className="h-3 rounded-full overflow-hidden mb-2">
                    <View
                      style={{ width: `${getSleepPercentage()}%`, backgroundColor: colors.info }}
                      className="h-full rounded-full"
                    />
                  </View>
                  <Text className={`${textClasses.body} text-right mb-4`} style={{ color: colors.textSecondary }}>
                    {calculateHealthProgress(currentMetrics.sleep, healthGoals.sleepGoal).displayText}
                  </Text>
                </>
              )}

              {/* 7-Day Chart */}
              {renderMiniChart(getWeekData("sleepHours"), colors.info, healthGoals.sleepGoal)}
            </View>
          </Pressable>

          {/* Exercise Card */}
          <Pressable onPress={() => handleOpenAddModal("exercise")}>
            <View style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }} className="rounded-3xl p-5 mb-4 border-2">
              <View className="flex-row items-center mb-4">
                <View className="w-14 h-14 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: colors.warningBackground }}>
                  <Ionicons name="fitness" size={28} color={colors.warning} />
                </View>
                <View className="flex-1">
                  <Text className={`${textClasses.subtitle} font-semibold`} style={{ color: colors.textPrimary }}>Exercise</Text>
                  {renderMetricValue(
                    currentMetrics.exercise,
                    `${formatHealthNumber(currentMetrics.exercise)} min of ${formatHealthNumber(healthGoals.exerciseGoal)} min`,
                    colors.warning,
                    "No exercise recorded yet today"
                  )}
                </View>
                <Ionicons name="create-outline" size={24} color={colors.warning} />
              </View>

              {getMetricDisplayState(currentMetrics.exercise) === "has-data" && (
                <>
                  {/* Progress Bar */}
                  <View style={{ backgroundColor: colors.border }} className="h-3 rounded-full overflow-hidden mb-2">
                    <View
                      style={{ width: `${getExercisePercentage()}%`, backgroundColor: colors.warning }}
                      className="h-full rounded-full"
                    />
                  </View>
                  <Text className={`${textClasses.body} text-right mb-4`} style={{ color: colors.textSecondary }}>
                    {calculateHealthProgress(currentMetrics.exercise, healthGoals.exerciseGoal).displayText}
                  </Text>
                </>
              )}

              {/* 7-Day Chart */}
              {renderMiniChart(getWeekData("exerciseMinutes"), colors.warning, healthGoals.exerciseGoal)}
            </View>
          </Pressable>

          {/* Weight Card */}
          <Pressable onPress={() => handleOpenAddModal("weight")}>
            <View style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }} className="rounded-3xl p-5 mb-4 border-2">
              <View className="flex-row items-center mb-3">
                <View className="w-14 h-14 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: colors.premiumLight }}>
                  <Ionicons name="scale" size={28} color={colors.premium} />
                </View>
                <View className="flex-1">
                  <Text className={`${textClasses.subtitle} font-semibold`} style={{ color: colors.textPrimary }}>Weight</Text>
                  <Text className={`${textClasses.body} mt-1`} style={{ color: colors.textSecondary }}>Current weight</Text>
                </View>
                <Ionicons name="create-outline" size={24} color={colors.premium} />
              </View>
              {renderStandaloneMetricValue(
                currentMetrics.weight,
                colors.premium,
                "lbs",
                "No weight recorded yet"
              )}

              {/* 7-Day Chart */}
              {renderMiniChart(getWeekData("weight"), colors.premium)}
            </View>
          </Pressable>

          {/* Blood Pressure Card */}
          <Pressable onPress={() => handleOpenAddModal("bloodPressure")}>
            <View style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }} className="rounded-3xl p-5 mb-4 border-2">
              <View className="flex-row items-center mb-3">
                <View className="w-14 h-14 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: colors.errorBackground }}>
                  <Ionicons name="pulse" size={28} color={colors.error} />
                </View>
                <View className="flex-1">
                  <Text className={`${textClasses.subtitle} font-semibold`} style={{ color: colors.textPrimary }}>Blood Pressure</Text>
                  <Text className={`${textClasses.body} mt-1`} style={{ color: colors.textSecondary }}>Latest reading</Text>
                </View>
                <Ionicons name="create-outline" size={24} color={colors.error} />
              </View>
              {(() => {
                const bpValue = currentMetrics.bloodPressure.systolic;
                const state = getMetricDisplayState(bpValue);
                if (state === "no-connection") {
                  return (
                    <Text className={`${textClasses.small}`} style={{ color: colors.textTertiary }}>
                      {`Connect ${healthSourceName} to see your data`}
                    </Text>
                  );
                }
                if (state === "syncing") {
                  return (
                    <View className="flex-row items-center">
                      <Skeleton width={120} height={24} borderRadius={4} />
                    </View>
                  );
                }
                if (state === "no-data") {
                  return (
                    <Text className={`${textClasses.small}`} style={{ color: colors.textTertiary }}>
                      No blood pressure readings yet
                    </Text>
                  );
                }
                return (
                  <Animated.View entering={FadeIn.duration(300)} className="flex-row items-center">
                    <View className="flex-1">
                      <Text className={`${textClasses.body} mb-2`} style={{ color: colors.textSecondary }}>Systolic</Text>
                      <View className="flex-row items-baseline">
                        <Text className={`${textClasses.title} font-bold`} style={{ color: colors.error }}>
                          {currentMetrics.bloodPressure.systolic}
                        </Text>
                        <Text className={`${textClasses.body} ml-2`} style={{ color: colors.textSecondary }}>mmHg</Text>
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className={`${textClasses.body} mb-2`} style={{ color: colors.textSecondary }}>Diastolic</Text>
                      <View className="flex-row items-baseline">
                        <Text className={`${textClasses.title} font-bold`} style={{ color: colors.error }}>
                          {currentMetrics.bloodPressure.diastolic}
                        </Text>
                        <Text className={`${textClasses.body} ml-2`} style={{ color: colors.textSecondary }}>mmHg</Text>
                      </View>
                    </View>
                  </Animated.View>
                );
              })()}
            </View>
          </Pressable>

          {/* Privacy Footer */}
          <PrivacyFooterLink text="Your health data stays on your device" />
        </ScrollView>
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.cardBackground }} edges={["top", "bottom"]}>
          <View className="flex-1">
            {/* Modal Header */}
            <View style={{ borderBottomColor: colors.border }} className="px-6 py-4 border-b flex-row justify-between items-center">
              <Pressable onPress={() => setShowAddModal(false)} className="py-2">
                <Text className={`${textClasses.body}`} style={{ color: primary }}>Cancel</Text>
              </Pressable>
              <Text className={`${textClasses.subtitle} font-semibold`} style={{ color: colors.textPrimary }}>
                {editingMetric === "steps" && "Steps"}
                {editingMetric === "heartRate" && "Heart Rate"}
                {editingMetric === "sleep" && "Sleep"}
                {editingMetric === "exercise" && "Exercise"}
                {editingMetric === "weight" && "Weight"}
                {editingMetric === "bloodPressure" && "Blood Pressure"}
              </Text>
              <Pressable onPress={handleSaveMetric} className="py-2">
                <Text className={`${textClasses.body} font-semibold`} style={{ color: primary }}>Save</Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 py-6">
              <Text className={`${textClasses.body} mb-6`} style={{ color: colors.textSecondary }}>
                Enter your health data for {format(selectedDate, "MMMM d, yyyy")}
              </Text>

              {/* Steps Input */}
              {(editingMetric === "steps" || editingMetric === null) && (
                <View className="mb-6">
                  <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>Steps</Text>
                  <TextInput
                    value={steps}
                    onChangeText={setSteps}
                    placeholder="e.g., 7500"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                    style={{ backgroundColor: colors.background, color: colors.textPrimary }}
                    className={`px-6 py-4 rounded-xl ${textClasses.body}`}
                  />
                  <Text className={`${textClasses.small} mt-2`} style={{ color: colors.textSecondary }}>Goal: {formatHealthNumber(healthGoals.stepsGoal)} steps</Text>
                </View>
              )}

              {/* Heart Rate Input */}
              {(editingMetric === "heartRate" || editingMetric === null) && (
                <View className="mb-6">
                  <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>Heart Rate (bpm)</Text>
                  <TextInput
                    value={heartRate}
                    onChangeText={setHeartRate}
                    placeholder="e.g., 72"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                    style={{ backgroundColor: colors.background, color: colors.textPrimary }}
                    className={`px-6 py-4 rounded-xl ${textClasses.body}`}
                  />
                  <Text className={`${textClasses.small} mt-2`} style={{ color: colors.textSecondary }}>Resting heart rate</Text>
                </View>
              )}

              {/* Sleep Input */}
              {(editingMetric === "sleep" || editingMetric === null) && (
                <View className="mb-6">
                  <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>Sleep (hours)</Text>
                  <TextInput
                    value={sleepHours}
                    onChangeText={setSleepHours}
                    placeholder="e.g., 7.5"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                    style={{ backgroundColor: colors.background, color: colors.textPrimary }}
                    className={`px-6 py-4 rounded-xl ${textClasses.body}`}
                  />
                  <Text className={`${textClasses.small} mt-2`} style={{ color: colors.textSecondary }}>Goal: {healthGoals.sleepGoal} hours</Text>
                </View>
              )}

              {/* Exercise Input */}
              {(editingMetric === "exercise" || editingMetric === null) && (
                <View className="mb-6">
                  <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>Exercise (minutes)</Text>
                  <TextInput
                    value={exerciseMinutes}
                    onChangeText={setExerciseMinutes}
                    placeholder="e.g., 30"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                    style={{ backgroundColor: colors.background, color: colors.textPrimary }}
                    className={`px-6 py-4 rounded-xl ${textClasses.body}`}
                  />
                  <Text className={`${textClasses.small} mt-2`} style={{ color: colors.textSecondary }}>Goal: {healthGoals.exerciseGoal} minutes</Text>
                </View>
              )}

              {/* Weight Input */}
              {(editingMetric === "weight" || editingMetric === null) && (
                <View className="mb-6">
                  <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>Weight (lbs)</Text>
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="e.g., 165"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                    style={{ backgroundColor: colors.background, color: colors.textPrimary }}
                    className={`px-6 py-4 rounded-xl ${textClasses.body}`}
                  />
                </View>
              )}

              {/* Blood Pressure Input */}
              {(editingMetric === "bloodPressure" || editingMetric === null) && (
                <View className="mb-6">
                  <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>Blood Pressure (mmHg)</Text>
                  <View className="flex-row space-x-4">
                    <View className="flex-1">
                      <Text className={`${textClasses.small} mb-2`} style={{ color: colors.textSecondary }}>Systolic</Text>
                      <TextInput
                        value={systolic}
                        onChangeText={setSystolic}
                        placeholder="120"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="number-pad"
                        style={{ backgroundColor: colors.background, color: colors.textPrimary }}
                        className={`px-6 py-4 rounded-xl ${textClasses.body}`}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className={`${textClasses.small} mb-2`} style={{ color: colors.textSecondary }}>Diastolic</Text>
                      <TextInput
                        value={diastolic}
                        onChangeText={setDiastolic}
                        placeholder="80"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="number-pad"
                        style={{ backgroundColor: colors.background, color: colors.textPrimary }}
                        className={`px-6 py-4 rounded-xl ${textClasses.body}`}
                      />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>


      {/* First-time user tip */}
      <InlineTip tipId={TIP_IDS.HEALTH} />

      {/* Toast notifications */}
      {ToastComponent}
      </Screen>
    </ScreenErrorBoundary>
  );
}
