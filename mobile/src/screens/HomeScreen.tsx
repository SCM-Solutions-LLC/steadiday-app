import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, Text, Pressable, Linking, Platform, UIManager, AccessibilityInfo, Image, Alert } from "react-native";
import { Screen } from "../components/Screen";
import { useUserStore } from "../state/stores/userStore";
import { useTaskStore } from "../state/stores/taskStore";
import { useMedicationStore } from "../state/stores/medicationStore";
import { useHealthStore } from "../state/stores/healthStore";
import { useUIStore } from "../state/stores/uiStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { useSafetySessionStore } from "../state/stores/safetySessionStore";
import { useTipStore, TIP_IDS } from "../state/stores/tipStore";
import { Ionicons } from "@expo/vector-icons";
import { getGreeting, formatDate } from "../utils/time";
import { getTextSizeClasses } from "../utils/textSizes";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import * as SMS from "expo-sms";
import * as Haptics from "expo-haptics";
import { useTheme } from "../utils/useTheme";
import { useResponsive } from "../utils/useResponsive";
import type { HomeScreenWidget } from "../types/app";
import { SessionManager } from "../utils/sessionManager";
import { WeatherWidgetSkeleton } from "../components/skeletons";
import { ScreenErrorBoundary, InlineTip, AnimatedGuideTip, PrivacyFooter } from "../components/ui";
import { WelcomeCard } from "../components/home/WelcomeCard";
import {
  DEFAULT_WIDGETS,
  filterWidgetsForPlan,
  WeatherWidget,
  TasksWidget,
  MedicationsWidget,
  SOSWidget,
  FoodWaterWidget,
  EmergencyContactsWidget,
  NavigationWidget,
  SOSModal,
  FallAlertModal,
  FallEmergencyModal,
  LocationModal,
  WidgetEditorModal,
  useWeather,
  useLocationSearch,
  useFallDetection,
  useWidgetReorder,
  DailyCheckInCard,
  CareSummaryWidget,
} from "../components/home";
import SafetySessionCard from "../components/home/SafetySessionCard";
import BackupReminderBanner from "../components/home/BackupReminderBanner";
import { useSessionLifecycle } from "../components/safety/useSessionLifecycle";
import { logger } from "../utils/logger";
import { config } from "../config/env";
import { isAndroidFeaturesActive } from "../config/platformConfig";
import UserProfileSurvey from "./UserProfileSurvey";
import {
  getSurveyStatus,
  incrementAppOpenCount,
  initSurveyStatusIfNeeded,
} from "../utils/userProfileStorage";
import { initRemoteConfig } from "../utils/firebase";

// __DEV__ is a React Native global - already available


export default function HomeScreen() {
  // Enable LayoutAnimation for Android
  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  // User data from useUserStore
  const userName = useUserStore((s) => s.userProfile.name);
  const userLocation = useUserStore((s) => s.userProfile.location);
  const emergencyContacts = useUserStore((s) => s.userProfile.emergencyContacts);
  // favoriteContacts removed - Favorite Contacts feature removed
  const setUserLocation = useUserStore((s) => s.setUserLocation);

  // Task data from useTaskStore
  const tasks = useTaskStore((s) => s.tasks);

  // Medication data from useMedicationStore
  const medications = useMedicationStore((s) => s.medications);

  // Health data from useHealthStore
  const getTodaysCalories = useHealthStore((s) => s.getTodaysCalories);
  const getTodaysFoodEntries = useHealthStore((s) => s.getTodaysFoodEntries);
  const getTodaysWater = useHealthStore((s) => s.getTodaysWater);

  // Tip state from useTipStore
  const dismissedInfoCards = useTipStore((s) => s.dismissedInfoCards || []);
  const dismissInfoCard = useTipStore((s) => s.dismissInfoCard);
  const hasSeenGuidedTour = useTipStore((s) => s.hasSeenGuidedTour);
  const markGuidedTourComplete = useTipStore((s) => s.markGuidedTourComplete);
  const justCompletedTourRef = useRef(false);

  // Settings from useSettingsStore
  const textSize = useSettingsStore((s) => s.textSize);
  const useDeviceLocation = useSettingsStore((s) => s.useDeviceLocation);
  const homeScreenWidgetsRaw = useSettingsStore((s) => s.homeScreenWidgets) || DEFAULT_WIDGETS;
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const toggleHomeScreenWidget = useSettingsStore((s) => s.toggleHomeScreenWidget);
  const reorderHomeScreenWidgets = useSettingsStore((s) => s.reorderHomeScreenWidgets);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const careViewEnabled = useSettingsStore((s) => s.careViewEnabled);

  // Subscription state for widget visibility
  const isHomeCardVisible = useSubscriptionStore((s) => s.isHomeCardVisible);
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);

  // Filter widgets based on premium status
  // Essentials users: premium widgets are automatically removed from saved layout
  const homeScreenWidgets = useMemo(
    () => filterWidgetsForPlan(homeScreenWidgetsRaw, isPremiumUnlocked),
    [homeScreenWidgetsRaw, isPremiumUnlocked]
  );

  // Check system reduce motion setting
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setShouldReduceMotion);
  }, []);

  // Local UI state
  const navigation = useNavigation();
  const { primary, colors } = useTheme();
  const responsive = useResponsive();
  const isLandscape = responsive.isLandscape;
  const horizontalPadding = responsive.horizontalPadding;
  const textClasses = getTextSizeClasses(textSize);

  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosTextSending, setSosTextSending] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showWidgetEditor, setShowWidgetEditor] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasValidLocation, setHasValidLocation] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showProfileSurvey, setShowProfileSurvey] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showFallEmergency, setShowFallEmergency] = useState(false);
  const [fallEmergencyResults, setFallEmergencyResults] = useState<{ name: string; status: "sent" | "failed" }[]>([]);
  const [fallEmergencySuccess, setFallEmergencySuccess] = useState(false);
  const [fallEmergencyCoords, setFallEmergencyCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const hasHydratedTips = useTipStore((s) => s._hasHydrated);

  // Show welcome card after first load (only once, after hydration)
  useEffect(() => {
    if (!hasHydratedTips) return;
    if (hasSeenGuidedTour) return;
    if (showWelcome) return;

    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [hasHydratedTips, hasSeenGuidedTour, showWelcome]);


  useEffect(() => {
    let cancelled = false;
    (async () => {
      await initSurveyStatusIfNeeded();
      await initRemoteConfig({
        homepage_greeting: "",
        show_survey_prompt: true,
      });
      const count = await incrementAppOpenCount();
      if (cancelled) return;
      if (count >= 4) {
        const status = await getSurveyStatus();
        if (status === "pending") {
          setShowProfileSurvey(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Use extracted hooks
  const { weather, loadingWeather, refreshWeather } = useWeather({
    userLocation,
    useDeviceLocation,
    setUserLocation,
  });

  const {
    searchQuery: newLocation,
    setSearchQuery: setNewLocation,
    suggestions: locationSuggestions,
    showSuggestions: showLocationSuggestions,
    isLoading: isLoadingSuggestions,
    selectLocation,
    clearSearch: clearLocationSearch,
  } = useLocationSearch({ enabled: showLocationModal });

  // Safety session state
  const isSessionActive = useSafetySessionStore((s) => s.isSessionActive);

  // Session lifecycle (background notifications)
  useSessionLifecycle();

  const { showFallAlert, fallCountdown, cancelFallAlert, triggerFallAlert } = useFallDetection({
    enabled: isSessionActive,
    onFallDetected: async () => {
      await handleFallNoResponse();
    },
  });

  const { movingWidgetIndex, moveWidgetUp, moveWidgetDown } = useWidgetReorder({
    widgets: homeScreenWidgets,
    onReorder: reorderHomeScreenWidgets,
    shouldReduceMotion,
    hapticEnabled,
  });

  // Haptic feedback helper
  const triggerHaptic = useCallback(
    (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
      if (hapticEnabled) {
        Haptics.impactAsync(style);
      }
    },
    [hapticEnabled]
  );

  const isCardDismissed = (cardId: string) => dismissedInfoCards.includes(cardId);

  // Helper to track activity
  const trackActivity = (fn: (...args: any[]) => void) => {
    return (...args: any[]) => {
      SessionManager.updateActivity();
      fn(...args);
    };
  };

  // Medication helper
  const getNextMedication = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();

    let nextMed = null;
    let minDiff = Infinity;
    let lastMedToday = null;
    let lastMedTime = -Infinity;

    for (const med of medications) {
      let appliesToday = true;
      if (med.scheduleType === "specific-days" && med.daysOfWeek) {
        appliesToday = med.daysOfWeek.includes(currentDay);
      } else if (med.frequency === "every-other-day" && med.startDate) {
        const startDate = new Date(med.startDate);
        const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        appliesToday = daysSinceStart % 2 === 0;
      } else if (med.frequency === "weekly" && med.startDate) {
        const startDate = new Date(med.startDate);
        appliesToday = now.getDay() === startDate.getDay();
      }
      if (!appliesToday) continue;

      for (const time of med.times) {
        const [hours, minutes] = time.split(":").map(Number);
        const medTime = hours * 60 + minutes;
        const diff = medTime - currentTime;
        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
          nextMed = { ...med, nextTime: time, isUpcoming: true };
        }
        if (medTime > lastMedTime) {
          lastMedTime = medTime;
          lastMedToday = { ...med, nextTime: time, isUpcoming: false };
        }
      }
    }
    return nextMed || lastMedToday;
  };

  const nextMed = getNextMedication();

  // SOS handlers
  const handleSOS = () => setShowSOSModal(true);

  const handleCall911 = async () => {
    setShowSOSModal(false);
    try {
      const url = "tel:911";
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      }
    } catch (error) {
      logger.error("Error calling 911:", error);
    }
  };

  const handleCallEmergencyContact = async (contact: typeof emergencyContacts[number]) => {
    setShowSOSModal(false);
    try {
      const phoneNumber = contact.phoneNumber.replace(/[^0-9]/g, "");
      const url = `tel:${phoneNumber}`;
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      }
    } catch (error) {
      logger.error("Error calling emergency contact:", error);
      Alert.alert("Error", "Could not call contact. Please try again.");
    }
  };

  const handleSendSOSTextAll = async () => {
    const emergencyMarkedContacts = emergencyContacts.filter((c) => c.isEmergencyContact);
    if (emergencyMarkedContacts.length === 0) {
      setShowSOSModal(false);
      Alert.alert(
        "No Trusted Contact",
        "Please add a trusted contact and mark them as primary in Settings > Safety Features.",
        [{ text: "OK" }]
      );
      return;
    }

    const showFailureAlert = () => {
      setSosTextSending(false);
      Alert.alert(
        "Could Not Open Messages",
        "Could not open Messages. Please call your trusted contact directly.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setShowSOSModal(false),
          },
          {
            text: "OK",
            onPress: () => setShowSOSModal(false),
          },
        ],
        { cancelable: false }
      );
    };

    setSosTextSending(true);

    try {
      let locationText = "";
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === "granted") {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          locationText = `\u{1F4CD} GPS Location: https://maps.apple.com/?q=${location.coords.latitude},${location.coords.longitude}`;
        } catch (e) {
          locationText = userLocation
            ? `\u{1F4CD} Approximate area: ${userLocation}`
            : "\u{1F4CD} Location unavailable - please call back to confirm location";
        }
      } else {
        locationText = userLocation
          ? `\u{1F4CD} Approximate area: ${userLocation}`
          : "\u{1F4CD} Location unavailable - please call back to confirm location";
      }

      const smsAvailable = await SMS.isAvailableAsync();
      if (!smsAvailable) {
        showFailureAlert();
        return;
      }

      const allPhoneNumbers = emergencyMarkedContacts.map((c) => c.phoneNumber);

      const smsResult = await SMS.sendSMSAsync(
        allPhoneNumbers,
        `\u{1F198} EMERGENCY ALERT\n\nThis is ${userName}'s SteadiDay app.\n\n${userName} pressed the SOS button and needs help immediately.\n\n${locationText}\n\nPlease call or check on them right away.`
      );

      setSosTextSending(false);

      if (smsResult.result === "cancelled") {
        return;
      }

      if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setShowSOSModal(false);
    } catch (error) {
      logger.error("Error sending SOS text:", error);
      showFailureAlert();
    }
  };

  const sendFallEmergencySMS = async (latitude: number, longitude: number): Promise<{ ok: boolean; results: { name: string; status: "sent" | "failed" }[] }> => {
    const emergencyMarkedContacts = emergencyContacts.filter((c) => c.isEmergencyContact);
    if (emergencyMarkedContacts.length === 0) {
      return { ok: false, results: [] };
    }

    const contacts = emergencyMarkedContacts.map((c) => ({
      name: c.name,
      phone: c.phoneNumber.startsWith("+") ? c.phoneNumber : `+1${c.phoneNumber.replace(/[^0-9]/g, "")}`,
    }));

    const MAX_RETRIES = 2;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/emergency/sms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiSecret: process.env.EXPO_PUBLIC_EMERGENCY_API_SECRET,
            userName: userName || "A SteadiDay user",
            contacts,
            latitude,
            longitude,
          }),
        });
        const data = await response.json();
        if (data.success === true) {
          return { ok: true, results: data.contacts || [] };
        }
        console.error(`[EmergencySMS] Attempt ${attempt + 1} failed: server returned success=false`, JSON.stringify(data));
      } catch (e) {
        console.error(`[EmergencySMS] Attempt ${attempt + 1} network error:`, e);
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    return { ok: false, results: contacts.map((c) => ({ name: c.name, status: "failed" as const })) };
  };

  const handleFallNoResponse = async () => {
    try {
      const emergencyMarkedContacts = emergencyContacts.filter((c) => c.isEmergencyContact);
      if (emergencyMarkedContacts.length === 0) {
        setFallEmergencyResults([]);
        setFallEmergencySuccess(false);
        setFallEmergencyCoords(null);
        setShowFallEmergency(true);
        return;
      }

      let latitude = 0;
      let longitude = 0;
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
        }
      } catch (e) {
        logger.error("Could not get location for fall alert:", e);
      }

      setFallEmergencyCoords({ latitude, longitude });

      const { ok, results } = await sendFallEmergencySMS(latitude, longitude);
      setFallEmergencyResults(results);
      setFallEmergencySuccess(ok);
    } catch (e) {
      logger.error("Error in fall no-response handler:", e);
      setFallEmergencyResults([]);
      setFallEmergencySuccess(false);
    }

    setShowFallEmergency(true);
  };

  const handleRetryFallEmergency = async () => {
    if (!fallEmergencyCoords) return;
    const { ok, results } = await sendFallEmergencySMS(fallEmergencyCoords.latitude, fallEmergencyCoords.longitude);
    setFallEmergencyResults(results);
    setFallEmergencySuccess(ok);
  };

  // Location handlers
  const handleChangeLocation = () => {
    SessionManager.updateActivity();
    setNewLocation(userLocation || "");
    clearLocationSearch();
    setHasValidLocation(false);
    setLocationError(null);
    setShowLocationModal(true);
  };

  const handleSaveLocation = () => {
    SessionManager.updateActivity();
    if (hasValidLocation && newLocation.trim()) {
      setUserLocation(newLocation.trim());
      if (useDeviceLocation) {
        updateSettings({ useDeviceLocation: false });
      }
    }
    setShowLocationModal(false);
  };

  const handleSelectLocation = (suggestion: any) => {
    const locationString = selectLocation(suggestion);
    setNewLocation(locationString);
    setHasValidLocation(true);
    setLocationError(null);
  };

  const handleUseCurrentLocation = async () => {
    setIsRequestingLocation(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Location permission denied. Please enable it in settings.");
        setIsRequestingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get city name
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const cityName = address.city || address.subregion || address.region || "Current Location";
        setNewLocation(cityName);
        setHasValidLocation(true);
      } else {
        setLocationError("Could not determine your location. Please search manually.");
      }
    } catch (error) {
      logger.error("Error getting current location:", error);
      setLocationError("Could not get your location. Please try again or search manually.");
    } finally {
      setIsRequestingLocation(false);
    }
  };

  // Reset hasValidLocation when user types (they need to select from suggestions)
  const handleLocationChange = (text: string) => {
    setNewLocation(text);
    setHasValidLocation(false);
    setLocationError(null);
  };

  const handleToggleDeviceLocation = () => {
    SessionManager.updateActivity();
    triggerHaptic();
    updateSettings({ useDeviceLocation: !useDeviceLocation });
  };

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setRefreshing(true);
    await refreshWeather();
    setRefreshing(false);
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [hapticEnabled, refreshWeather]);

  // Render widget based on type (with visibility checks)
  const renderWidget = (widgetType: HomeScreenWidget) => {
    // Map widget types to home card visibility keys
    type HomeCardKey = "weather" | "tasks" | "medications" | "sos" | "steps" | "water" | "quickTools" | "upcomingAppointments";
    const widgetToCardMap: Record<string, HomeCardKey> = {
      weather: "weather",
      tasks: "tasks",
      medications: "medications",
      sos: "sos",
      "food-water": "water",
      "health-metrics": "steps",
      "emergency-contacts": "sos", // Always visible (safety feature)
      "safety-session": "sos", // Always visible (safety feature)
      "favorite-contacts": "quickTools",
      magnifier: "quickTools",
      flashlight: "quickTools",
      notes: "quickTools",
      "find-my-car": "quickTools",
      "insurance-cards": "upcomingAppointments",
      "my-doctors": "upcomingAppointments",
    };

    const cardKey = widgetToCardMap[widgetType];
    // Check visibility (if no mapping, show by default)
    if (cardKey && !isHomeCardVisible(cardKey)) {
      return null;
    }

    // Hide health-related widgets on Android when Android features are active
    // BUT show them if Health Connect has synced data (healthMetrics has entries)
    if (isAndroidFeaturesActive() && widgetType === "health-metrics") {
      const hasHealthData = useHealthStore.getState().healthMetrics.length > 0;
      if (!hasHealthData) {
        return null;
      }
    }

    switch (widgetType) {
      case "weather":
        // Show skeleton while loading weather initially
        if (loadingWeather && !weather) {
          return <WeatherWidgetSkeleton key="weather-skeleton" />;
        }
        return (
          <WeatherWidget
            key="weather"
            weather={weather}
            userLocation={userLocation}
            useDeviceLocation={useDeviceLocation}
            loadingWeather={loadingWeather}
            textClasses={textClasses}
            colors={colors}
            primary={primary}
            onChangeLocation={trackActivity(handleChangeLocation)}
            onToggleDeviceLocation={trackActivity(handleToggleDeviceLocation)}
          />
        );

      case "tasks":
        return <TasksWidget key="tasks" tasks={tasks} textClasses={textClasses} colors={colors} primary={primary} />;

      case "medications":
        return (
          <MedicationsWidget
            key="medications"
            nextMed={nextMed}
            allMedications={medications}
            textClasses={textClasses}
            colors={colors}
            primary={primary}
          />
        );

      case "sos":
        return (
          <SOSWidget
            key="sos"
            onPress={trackActivity(handleSOS)}
            textClasses={textClasses}
            colors={colors}
            primary={primary}
          />
        );

      case "emergency-contacts":
        return (
          <EmergencyContactsWidget
            key="emergency-contacts"
            emergencyContacts={emergencyContacts}
            textClasses={textClasses}
            colors={colors}
            primary={primary}
            onNavigate={trackActivity(() => navigation.navigate("EmergencyContacts" as never))}
          />
        );

      // favorite-contacts widget removed - Favorite Contacts feature removed

      case "health-metrics":
      case "insurance-cards":
      case "my-doctors":
      case "magnifier":
      case "flashlight":
      case "notes":
      case "find-my-car":
        const navMap: Record<string, { screen?: string; route?: string }> = {
          "health-metrics": { route: "Health" },
          "insurance-cards": { route: "Insurance" },
          "my-doctors": { route: "Doctors" },
          magnifier: { screen: "Magnifier" },
          flashlight: { screen: "Flashlight" },
          notes: { screen: "Notes" },
          "find-my-car": { screen: "FindMyCar" },
        };
        const navConfig = navMap[widgetType];
        return (
          <NavigationWidget
            key={widgetType}
            type={widgetType}
            textClasses={textClasses}
            colors={colors}
            primary={primary}
            onNavigate={trackActivity(() => {
              const nav = navigation as any;
              if (navConfig.screen) {
                nav.navigate("Tools", { screen: navConfig.screen });
              } else if (navConfig.route) {
                nav.navigate(navConfig.route);
              }
            })}
          />
        );

      case "food-water":
        return (
          <FoodWaterWidget
            key="food-water"
            todaysCalories={getTodaysCalories()}
            todaysMeals={getTodaysFoodEntries().length}
            todaysWater={getTodaysWater()}
            textClasses={textClasses}
            colors={colors}
            primary={primary}
            onNavigateFood={trackActivity(() => {
              (navigation as any).navigate("Tools", { screen: "FoodTracker" });
            })}
            onNavigateWater={trackActivity(() => {
              (navigation as any).navigate("Tools", { screen: "WaterTracker" });
            })}
          />
        );

      case "care-summary":
        return <CareSummaryWidget key="care-summary" />;

      case "daily-check-in":
        return <DailyCheckInCard key="daily-check-in" />;

      case "safety-session":
        return <SafetySessionCard key="safety-session" colors={colors} textClasses={textClasses} />;

      default:
        return null;
    }
  };

  return (
    <ScreenErrorBoundary screenName="Home">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Screen
          variant="scroll"
          edges={["top"]}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          contentContainerStyle={{
            paddingVertical: 32,
          }}
        >
          {/* Greeting with App Icon and Edit button */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <Image
              source={require("../../assets/steadiday-icon.png")}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                marginRight: 12,
              }}
              resizeMode="contain"
              accessible={true}
              accessibilityLabel="SteadiDay icon"
            />
            <View className="flex-1">
              <Text className={`${textClasses.title} leading-tight`} style={{ color: colors.textPrimary }}>
                {getGreeting()}, {userName}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={trackActivity(() => setShowWidgetEditor(true))}
            className="ml-4 px-5 py-3 rounded-2xl"
            style={{ backgroundColor: primary + "20" }}
            accessibilityRole="button"
            accessibilityLabel="Edit home screen cards"
            accessibilityHint="Double tap to reorder or hide widgets"
          >
            <Text className="text-lg font-semibold" style={{ color: primary }}>
              Edit
            </Text>
          </Pressable>
        </View>
        <Text className={`${textClasses.body} mb-6 leading-relaxed`} style={{ color: colors.textSecondary }}>
          {formatDate(new Date().toISOString())}
        </Text>

        {/* Welcome card — replaces old modal guided tour */}
        {showWelcome && !hasSeenGuidedTour && (
          <WelcomeCard
            visible={true}
            onDismiss={() => {
              justCompletedTourRef.current = true;
              markGuidedTourComplete();
              setShowWelcome(false);
            }}
          />
        )}

        {/* Care View Entry Point - Premium only, shows when enabled in settings */}
        {isPremiumUnlocked && careViewEnabled && (
          <Pressable
            onPress={() => {
              if (hapticEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.navigate("CareViewMode" as never);
            }}
            className="flex-row items-center justify-between rounded-2xl p-4 mb-6"
            style={{
              backgroundColor: colors.primaryLight,
              borderWidth: 1,
              borderColor: primary,
            }}
            accessibilityRole="button"
            accessibilityLabel="Enter Care View mode"
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: primary + "30" }}
              >
                <Ionicons name="heart" size={24} color={primary} />
              </View>
              <View className="flex-1">
                <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
                  Care View
                </Text>
                <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                  Simplified view for caregivers
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={primary} />
          </Pressable>
        )}

        {/* Android: Data Backup Reminder Banner */}
        <BackupReminderBanner />

        {/* Widgets - Rendered in user's preferred order */}
        {responsive.gridColumns >= 2 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {homeScreenWidgets.map((widgetType: HomeScreenWidget) => {
              const widget = renderWidget(widgetType);
              if (!widget) return null;
              const fullWidth = ["weather", "sos", "safety-session", "care-summary", "daily-check-in"].includes(widgetType);
              return (
                <View key={widgetType} style={{ width: fullWidth ? "100%" : "48.5%" }}>
                  {widget}
                </View>
              );
            })}
          </View>
        ) : (
          homeScreenWidgets.map((widgetType: HomeScreenWidget) => renderWidget(widgetType))
        )}

        {/* Orientation Support Tip */}
        {isLandscape && !isCardDismissed("orientation-tip") && (
          <View
            className="rounded-2xl p-4 mt-6 mb-4 border"
            style={{
              backgroundColor: colors.success + "15",
              borderColor: colors.success
            }}
          >
            <View className="flex-row items-start">
              <Ionicons name="phone-landscape-outline" size={24} color={colors.success} style={{ marginTop: 2 }} />
              <View className="flex-1 ml-3">
                <Text className={`${textClasses.body} font-semibold mb-1`} style={{ color: colors.textPrimary }}>Landscape Mode Active</Text>
                <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                  {"The app works in both portrait and landscape! Rotate your device anytime to switch views."}
                </Text>
              </View>
              <Pressable
                onPress={trackActivity(() => dismissInfoCard("orientation-tip"))}
                className="p-1 active:opacity-50 ml-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={colors.success} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Disclaimer */}
        {!isCardDismissed("home-disclaimer-card") && (
          <View
            className="rounded-2xl p-4 mt-6 mb-4 border"
            style={{
              backgroundColor: colors.warning + "15",
              borderColor: colors.warning
            }}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-start flex-1">
                <Ionicons name="information-circle" size={20} color={colors.warning} style={{ marginRight: 10, marginTop: 2 }} />
                <Text className={`${textClasses.small} leading-relaxed flex-1`} style={{ color: colors.textPrimary }}>
                  SteadiDay is a task and medication reminder tool. It is not a medical device or emergency
                  service and does not replace professional healthcare.
                </Text>
              </View>
              <Pressable
                onPress={trackActivity(() => dismissInfoCard("home-disclaimer-card"))}
                className="ml-2 p-1 active:opacity-60"
                accessibilityRole="button"
                accessibilityLabel="Close info card"
              >
                <Ionicons name="close" size={20} color={colors.warning} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Privacy Footer */}
        <PrivacyFooter />
      </Screen>

      {/* SOS Modal */}
      <SOSModal
        visible={showSOSModal}
        onClose={() => {
          if (!sosTextSending) {
            setShowSOSModal(false);
          }
        }}
        onCall911={trackActivity(handleCall911)}
        onSendSOSTextAll={() => { SessionManager.updateActivity(); handleSendSOSTextAll(); }}
        onCallEmergencyContact={(contact) => { SessionManager.updateActivity(); handleCallEmergencyContact(contact); }}
        emergencyContacts={emergencyContacts}
        textClasses={textClasses}
        colors={colors}
        sending={sosTextSending}
      />

      {/* Fall Detection Alert Modal */}
      <FallAlertModal
        visible={showFallAlert}
        countdown={fallCountdown}
        onCancel={trackActivity(cancelFallAlert)}
        onCallNow={trackActivity(triggerFallAlert)}
        textClasses={textClasses}
        colors={colors}
      />

      {/* Fall Emergency Modal - shown after countdown expires */}
      <FallEmergencyModal
        visible={showFallEmergency}
        contactResults={fallEmergencyResults}
        backendSuccess={fallEmergencySuccess}
        contacts={emergencyContacts.filter((c) => c.isEmergencyContact)}
        userName={userName}
        latitude={fallEmergencyCoords?.latitude}
        longitude={fallEmergencyCoords?.longitude}
        onDismiss={() => setShowFallEmergency(false)}
        onRetry={handleRetryFallEmergency}
        textClasses={textClasses}
        colors={colors}
      />

      {/* Location Change Modal */}
      <LocationModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSave={trackActivity(handleSaveLocation)}
        newLocation={newLocation}
        onLocationChange={handleLocationChange}
        locationSuggestions={locationSuggestions}
        showLocationSuggestions={showLocationSuggestions}
        isLoadingSuggestions={isLoadingSuggestions}
        onSelectLocation={handleSelectLocation}
        onUseCurrentLocation={handleUseCurrentLocation}
        isRequestingLocation={isRequestingLocation}
        locationError={locationError}
        hasValidLocation={hasValidLocation}
        textClasses={textClasses}
        colors={colors}
        primary={primary}
      />

      {/* Widget Editor Modal */}
      <WidgetEditorModal
        visible={showWidgetEditor}
        onClose={() => setShowWidgetEditor(false)}
        homeScreenWidgets={homeScreenWidgets}
        movingWidgetIndex={movingWidgetIndex}
        onMoveWidgetUp={moveWidgetUp}
        onMoveWidgetDown={moveWidgetDown}
        onToggleWidget={toggleHomeScreenWidget}
        textClasses={textClasses}
        colors={colors}
        primary={primary}
        shouldReduceMotion={shouldReduceMotion}
        isPremiumUnlocked={isPremiumUnlocked}
      />

      {/* User Profile Survey Modal */}
      <UserProfileSurvey
        visible={showProfileSurvey}
        onClose={() => setShowProfileSurvey(false)}
      />

      {/* Home Screen Tip — suppress until welcome is dismissed */}
      {hasSeenGuidedTour && !justCompletedTourRef.current && <InlineTip tipId={TIP_IDS.HOME} />}

      {/* Animated Guide: Edit Button — suppress until welcome is dismissed */}
      {hasSeenGuidedTour && !justCompletedTourRef.current && (
        <AnimatedGuideTip
          tipId={TIP_IDS.HOME_EDIT_BUTTON}
          title="Customize Your Home"
          message="Tap the Edit button in the top right corner to reorder, add, or remove widgets on your Home screen. Make it yours!"
          icon="pencil-outline"
          arrowPosition="up-right"
          cardPosition="top"
        />
      )}
      </View>
    </ScreenErrorBoundary>
  );
}
