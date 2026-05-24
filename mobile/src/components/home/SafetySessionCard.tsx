import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { DeviceMotion } from "expo-sensors";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafetySessionStore } from "../../state/stores/safetySessionStore";
import { useUserStore } from "../../state/stores/userStore";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { ThemeColors } from "../../utils/colorThemes";
import { useTheme } from "../../utils/useTheme";
import { isBackgroundWorkoutSupported } from "../../utils/backgroundWorkout";
import SafetySessionOnboarding from "../safety/SafetySessionOnboarding";

const TEAL = "#2A9D8F";
const NAVY = "#1B2A4A";
const CORAL = "#E76F51";

interface SafetySessionCardProps {
  colors: ThemeColors;
  textClasses: {
    largeTitle: string;
    title: string;
    subtitle: string;
    body: string;
    small: string;
    button: string;
  };
}

function PulsingDot() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: "#22C55E",
          marginRight: 8,
        },
        animatedStyle,
      ]}
    />
  );
}

function formatElapsedTime(startTime: number | null): string {
  if (!startTime) return "0:00:00";
  const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function SafetySessionCard({
  colors,
  textClasses,
}: SafetySessionCardProps) {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const isSessionActive = useSafetySessionStore((s) => s.isSessionActive);
  const sessionStartTime = useSafetySessionStore((s) => s.sessionStartTime);
  const hasSeenOnboarding = useSafetySessionStore((s) => s.hasSeenOnboarding);
  const showSessionEndedBanner = useSafetySessionStore(
    (s) => s.showSessionEndedBanner
  );
  const startSession = useSafetySessionStore((s) => s.startSession);
  const endSession = useSafetySessionStore((s) => s.endSession);
  const dismissSessionEndedBanner = useSafetySessionStore(
    (s) => s.dismissSessionEndedBanner
  );

  const emergencyContacts = useUserStore(
    (s) => s.userProfile.emergencyContacts
  );
  const userName = useUserStore((s) => s.userProfile.name);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("0:00:00");

  // Elapsed timer
  useEffect(() => {
    if (!isSessionActive || !sessionStartTime) return;
    setElapsedTime(formatElapsedTime(sessionStartTime));
    const interval = setInterval(() => {
      setElapsedTime(formatElapsedTime(sessionStartTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [isSessionActive, sessionStartTime]);

  const hasTrustedContact = emergencyContacts?.some(
    (c) => c.isEmergencyContact
  );

  const requestMotionPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await DeviceMotion.requestPermissionsAsync();
      return status === "granted";
    } catch {
      return true; // Simulator may not have motion
    }
  }, []);

  const handleStartSession = useCallback(async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Check onboarding
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
      return;
    }

    // Check trusted contact
    if (!hasTrustedContact) {
      Alert.alert(
        "Add a Trusted Contact",
        "Add a trusted contact first so someone can be notified if you fall. Go to Settings > Safety Features to add one.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Settings",
            onPress: () =>
              navigation.navigate("SafetySettings" as never),
          },
        ]
      );
      return;
    }

    // Request motion permissions
    const granted = await requestMotionPermissions();
    if (!granted) {
      Alert.alert(
        "Motion Permission Required",
        "Fall detection needs access to motion sensors. Please enable motion permissions in your device settings.",
        [{ text: "OK" }]
      );
      return;
    }

    startSession(userName || "", emergencyContacts || []);
  }, [
    hasSeenOnboarding,
    hasTrustedContact,
    hapticEnabled,
    navigation,
    requestMotionPermissions,
    startSession,
    userName,
    emergencyContacts,
  ]);

  const handleEndSession = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert(
      "End Your Safety Session?",
      "Fall detection will be turned off.",
      [
        { text: "Keep Going", style: "cancel" },
        {
          text: "End Session",
          style: "destructive",
          onPress: () => endSession(),
        },
      ]
    );
  }, [endSession, hapticEnabled]);

  const handleOnboardingComplete = useCallback(async () => {
    setShowOnboarding(false);

    // Check trusted contact after onboarding
    if (!hasTrustedContact) {
      Alert.alert(
        "Add a Trusted Contact",
        "Add a trusted contact first so someone can be notified if you fall. Go to Settings > Safety Features to add one.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Settings",
            onPress: () =>
              navigation.navigate("SafetySettings" as never),
          },
        ]
      );
      return;
    }

    const granted = await requestMotionPermissions();
    if (!granted) {
      Alert.alert(
        "Motion Permission Required",
        "Fall detection needs access to motion sensors. Please enable motion permissions in your device settings.",
        [{ text: "OK" }]
      );
      return;
    }

    startSession(userName || "", emergencyContacts || []);
  }, [hasTrustedContact, navigation, requestMotionPermissions, startSession, userName, emergencyContacts]);

  return (
    <>
      {/* Session ended banner */}
      {showSessionEndedBanner && (
        <View
          className="rounded-2xl p-4 mb-4 flex-row items-start"
          style={{
            backgroundColor: "#FEF3C7",
            borderWidth: 1,
            borderColor: "#F59E0B",
          }}
        >
          <Ionicons
            name="information-circle"
            size={22}
            color="#D97706"
            style={{ marginTop: 1 }}
          />
          <Text
            className="flex-1 ml-3"
            style={{ color: "#92400E", fontSize: 15, lineHeight: 22 }}
          >
            Your last Safety Session ended because the app was closed. Start a
            new one below.
          </Text>
          <Pressable
            onPress={dismissSessionEndedBanner}
            className="ml-2 p-1"
            accessibilityRole="button"
            accessibilityLabel="Dismiss banner"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color="#D97706" />
          </Pressable>
        </View>
      )}

      {/* Main card */}
      <View
        className="rounded-2xl p-5 mb-5"
        style={{
          backgroundColor: colors.cardBackground,
          borderWidth: isSessionActive ? 2 : 1,
          borderColor: isSessionActive ? TEAL : colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {isSessionActive ? (
          <>
            {/* ACTIVE STATE */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color={TEAL}
                  style={{ marginRight: 10 }}
                />
                <Text
                  className="font-bold"
                  style={{ color: isDark ? "#FFFFFF" : NAVY, fontSize: 20 }}
                >
                  Safety Session Active
                </Text>
              </View>
              <View className="flex-row items-center">
                <PulsingDot />
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  {elapsedTime}
                </Text>
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: isDark ? colors.divider : "#E0E0E0",
                marginBottom: 14,
              }}
            />

            <Text
              className="mb-5 font-medium"
              style={{ color: TEAL, fontSize: 16 }}
            >
              {"Fall detection is on. You're protected — even in the background."}
            </Text>

            <Pressable
              onPress={handleEndSession}
              className="items-center justify-center rounded-xl"
              style={{ backgroundColor: CORAL, height: 52 }}
              accessibilityRole="button"
              accessibilityLabel="End safety session"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="stop"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text
                  className="font-bold"
                  style={{ color: "#FFFFFF", fontSize: 18 }}
                >
                  End Session
                </Text>
              </View>
            </Pressable>
          </>
        ) : (
          <>
            {/* INACTIVE STATE */}
            <View className="flex-row items-center mb-3">
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color={TEAL}
                style={{ marginRight: 10 }}
              />
              <Text
                className="font-bold"
                style={{ color: isDark ? "#FFFFFF" : NAVY, fontSize: 20 }}
              >
                Safety Session
              </Text>
            </View>

            <Text className="mb-5" style={{ color: colors.textSecondary, fontSize: 16, lineHeight: 22 }}>
              {isBackgroundWorkoutSupported()
                ? "Start a session to enable fall detection, even when the app is in the background."
                : "Start a session to enable fall detection while the app is open."}
            </Text>

            <Pressable
              onPress={handleStartSession}
              className="items-center justify-center rounded-xl"
              style={{ backgroundColor: TEAL, height: 52 }}
              accessibilityRole="button"
              accessibilityLabel="Start safety session"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="play"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text
                  className="font-bold"
                  style={{ color: "#FFFFFF", fontSize: 18 }}
                >
                  Start Safety Session
                </Text>
              </View>
            </Pressable>
          </>
        )}
      </View>

      {/* Onboarding modal */}
      <SafetySessionOnboarding
        visible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}
