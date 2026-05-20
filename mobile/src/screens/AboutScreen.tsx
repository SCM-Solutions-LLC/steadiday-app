import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert, Linking } from "react-native";
import { Screen } from "../components/Screen";
import { SubpageHeader } from "../components/ui";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { useTipStore } from "../state/stores/tipStore";
import { useAppStore } from "../state/appStore";
import { getTextSizeClasses } from "../utils/textSizes";
import * as Haptics from "expo-haptics";
import { openPrivacyPolicy, openSecurity, openTermsOfService, openWebsite } from "../utils/openURL";

// Use React Native's built-in __DEV__ global for dev checks
const isDev = typeof __DEV__ !== "undefined" && __DEV__;

export default function AboutScreen() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight } = useTheme();

  // Settings
  const textSize = useSettingsStore((s) => s.textSize);
  const developerMode = useSettingsStore((s) => s.developerMode);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);

  // Subscription actions for testing
  const unlockPremium = useSubscriptionStore((s) => s.unlockPremium);
  const resetSubscription = useSubscriptionStore((s) => s.resetSubscription);
  const expireSubscription = useSubscriptionStore((s) => s.expireSubscription);
  const setDevModeSimulation = useSubscriptionStore((s) => s.setDevModeSimulation);

  // Tip store for resetting tips
  const resetAllTips = useTipStore((s) => s.resetAllTips);

  // App store for resetting onboarding
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);

  // Local state
  const [tapCount, setTapCount] = useState(0);

  const appVersion = Constants.expoConfig?.version || "1.0.12";
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || "76";

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  // 7-tap to enable developer mode (only in dev builds)
  const handleVersionTap = () => {
    triggerHaptic();

    if (!isDev) return;

    const newCount = tapCount + 1;
    setTapCount(newCount);

    if (newCount >= 7 && !developerMode) {
      updateSettings({ developerMode: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Developer Mode Enabled",
        "You now have access to testing options at the bottom of this screen."
      );
      setTapCount(0);
    } else if (newCount > 4 && newCount < 7 && !developerMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setTimeout(() => setTapCount(0), 2000);
  };

  // Developer actions
  const handleResetOnboarding = () => {
    triggerHaptic();
    Alert.alert(
      "Reset Onboarding",
      "This will reset all tips and show the welcome flow again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetAllTips();
            resetOnboarding();
            Alert.alert(
              "Done",
              "Onboarding has been reset. Restart the app to see changes."
            );
          },
        },
      ]
    );
  };

  const handleSimulatePremium = (tier: "monthly" | "annual" | "lifetime") => {
    triggerHaptic();

    let expDate: string | undefined;
    if (tier === "monthly") {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      expDate = date.toISOString();
    } else if (tier === "annual") {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1);
      expDate = date.toISOString();
    }

    // Set dev mode simulation flag before unlocking to prevent PremiumSetupFlow
    setDevModeSimulation(true);
    unlockPremium(tier, expDate, true);
    Alert.alert("Done", `Premium ${tier} subscription simulated.`);
  };

  const handleResetToFree = () => {
    triggerHaptic();
    Alert.alert(
      "Reset to Free",
      "This will remove your premium subscription (for testing).",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            // Clear dev mode simulation flag
            setDevModeSimulation(false);
            resetSubscription();
            Alert.alert("Done", "You are now on the free Essentials plan.");
          },
        },
      ]
    );
  };

  const handleSimulateExpired = () => {
    triggerHaptic();
    // Clear dev mode simulation flag
    setDevModeSimulation(false);
    expireSubscription();
    Alert.alert("Done", "Subscription has been marked as expired.");
  };

  const handleDisableDeveloperMode = () => {
    triggerHaptic();
    Alert.alert(
      "Disable Developer Mode",
      "Are you sure you want to hide developer options?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          onPress: () => {
            updateSettings({ developerMode: false });
            Alert.alert("Done", "Developer mode has been disabled.");
          },
        },
      ]
    );
  };

  const sections = [
    {
      title: "About SteadiDay",
      content:
        "SteadiDay is a comprehensive health and wellness assistant designed specifically for adults aged 50+ who live independently. The app helps you manage medications, track tasks, monitor health metrics, and stay connected with your loved ones.",
    },
    {
      title: "Our Mission",
      content:
        "We believe that technology should empower seniors to live independently and confidently. SteadiDay provides the tools you need to manage your health, stay organized, and maintain peace of mind—all in a simple, accessible interface designed with your needs in mind.",
    },
    {
      title: "Key Features",
      items: [
        "Medication tracking with reminders",
        "Daily task management",
        "Health metrics monitoring (food and water intake)",
        "Trusted contact management with SOS features",
        "Fall detection and safety alerts",
        "Voice guidance for accessibility",
        "Large text and high contrast modes",
        "Customizable color themes",
      ],
    },
    {
      title: "Accessibility First",
      content:
        "SteadiDay is built with accessibility at its core. We offer large readable text, high contrast modes, color-blind friendly palettes, voice guidance, and reduce motion options to ensure everyone can use the app comfortably.",
    },
  ];

  const supportInfo = [
    {
      icon: "information-circle" as const,
      label: "Version",
      value: `${appVersion} (${buildNumber})`,
      onPress: handleVersionTap,
    },
  ];

  return (
    <Screen
      variant="static"
      edges={["top"]}
    >
      <View className="flex-1">
        {/* Header - SENIOR-FRIENDLY: Labeled back button */}
        <SubpageHeader
          title="About SteadiDay"
          backLabel="Settings"
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          className="flex-1 px-8 py-6"
          showsVerticalScrollIndicator={true}
        >
          {/* App Icon and Name */}
          <View className="items-center mb-8">
            <View
              className="w-28 h-28 rounded-3xl items-center justify-center mb-4"
              style={{ backgroundColor: primary + "20" }}
            >
              <Ionicons name="heart" size={64} color={primary} />
            </View>
            <Text
              className={`${textClasses.largeTitle} font-bold mb-2`}
              style={{ color: colors.textPrimary }}
            >
              SteadiDay
            </Text>
            <Text
              className={`${textClasses.body}`}
              style={{ color: colors.textSecondary }}
            >
              Your Health & Wellness Partner
            </Text>
          </View>

          {/* Sections */}
          {sections.map((section, index) => (
            <View key={index} className="mb-8">
              <Text
                className={`${textClasses.subtitle} font-semibold mb-4`}
                style={{ color: colors.textPrimary }}
              >
                {section.title}
              </Text>
              {section.content && (
                <Text
                  className={`${textClasses.body} leading-relaxed mb-4`}
                  style={{ color: colors.textSecondary }}
                >
                  {section.content}
                </Text>
              )}
              {section.items && (
                <View className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <View key={itemIndex} className="flex-row items-start mb-2">
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={primary}
                        style={{ marginRight: 12, marginTop: 2 }}
                      />
                      <Text
                        className={`${textClasses.body} flex-1 leading-relaxed`}
                        style={{ color: colors.textSecondary }}
                      >
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Support Information */}
          <View
            className="rounded-3xl p-6 mb-8"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              className={`${textClasses.subtitle} font-semibold mb-6`}
              style={{ color: colors.textPrimary }}
            >
              Support & Information
            </Text>
            {supportInfo.map((info, index) => (
              <Pressable
                key={index}
                onPress={info.onPress}
                className={`flex-row items-center py-4 ${
                  index < supportInfo.length - 1 ? "border-b" : ""
                }`}
                style={{ borderBottomColor: colors.divider, minHeight: 64 }}
                accessibilityRole="button"
                accessibilityLabel={`${info.label}: ${info.value}`}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: primary + "20" }}
                >
                  <Ionicons name={info.icon} size={24} color={primary} />
                </View>
                <View className="flex-1">
                  <Text
                    className={`${textClasses.small} mb-1`}
                    style={{ color: colors.textSecondary }}
                  >
                    {info.label}
                  </Text>
                  <Text
                    className={`${textClasses.body} font-semibold`}
                    style={{ color: colors.textPrimary }}
                  >
                    {info.value}
                  </Text>
                </View>
                {info.label !== "Version" && (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                )}
              </Pressable>
            ))}
          </View>

          {/* Medical Disclaimer */}
          <View
            className="rounded-2xl p-5 mb-8"
            style={{
              backgroundColor: primaryLight,
              borderWidth: 1,
              borderColor: primary,
            }}
          >
            <Text
              className={`${textClasses.body} font-semibold mb-2`}
              style={{ color: primary }}
            >
              Medical Disclaimer
            </Text>
            <Text
              className={`${textClasses.small}`}
              style={{ color: colors.textSecondary, lineHeight: 20 }}
            >
              SteadiDay is not a medical device and should not replace
              professional medical advice. Always consult with your healthcare
              provider.
            </Text>
          </View>

          {/* Developer Options - Only shown when enabled */}
          {developerMode && (
            <View
              className="rounded-2xl p-6 mb-8 border-2 border-dashed"
              style={{ backgroundColor: colors.warningBackground, borderColor: colors.warning }}
            >
              <View className="flex-row items-center mb-4">
                <Ionicons name="construct" size={24} color={colors.warning} />
                <Text
                  className={`${textClasses.subtitle} font-bold ml-2`}
                  style={{ color: colors.onWarning }}
                >
                  Developer Options
                </Text>
              </View>

              <Text
                className={`${textClasses.small} mb-4`}
                style={{ color: colors.onWarning }}
              >
                These options are for testing only.
              </Text>

              {/* Reset Onboarding */}
              <Pressable
                onPress={handleResetOnboarding}
                className="py-4 px-4 rounded-xl mb-3"
                style={{
                  backgroundColor: colors.cardBackground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 56,
                }}
                accessibilityRole="button"
                accessibilityLabel="Reset onboarding and tips"
              >
                <View className="flex-row items-center">
                  <Ionicons name="refresh" size={20} color={colors.textSecondary} />
                  <Text
                    className={`${textClasses.body} ml-3`}
                    style={{ color: colors.textPrimary }}
                  >
                    Reset Onboarding & Tips
                  </Text>
                </View>
              </Pressable>

              {/* Simulate Premium Options */}
              <Text
                className={`${textClasses.small} mb-2 mt-2`}
                style={{ color: colors.onWarning }}
              >
                Simulate Premium:
              </Text>
              <View className="flex-row mb-3" style={{ gap: 8 }}>
                <Pressable
                  onPress={() => handleSimulatePremium("monthly")}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ backgroundColor: "#3B82F6", minHeight: 48 }}
                  accessibilityRole="button"
                  accessibilityLabel="Simulate monthly premium"
                >
                  <Text
                    className={`${textClasses.small} font-semibold`}
                    style={{ color: "white" }}
                  >
                    Monthly
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleSimulatePremium("annual")}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ backgroundColor: "#10B981", minHeight: 48 }}
                  accessibilityRole="button"
                  accessibilityLabel="Simulate annual premium"
                >
                  <Text
                    className={`${textClasses.small} font-semibold`}
                    style={{ color: "white" }}
                  >
                    Annual
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleSimulatePremium("lifetime")}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ backgroundColor: "#FFD700", minHeight: 48 }}
                  accessibilityRole="button"
                  accessibilityLabel="Simulate lifetime premium"
                >
                  <Text
                    className={`${textClasses.small} font-semibold`}
                    style={{ color: "#1A1A1A" }}
                  >
                    Lifetime
                  </Text>
                </Pressable>
              </View>

              {/* Simulate Expired */}
              <Pressable
                onPress={handleSimulateExpired}
                className="py-4 px-4 rounded-xl mb-3"
                style={{
                  backgroundColor: colors.cardBackground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 56,
                }}
                accessibilityRole="button"
                accessibilityLabel="Simulate expired subscription"
              >
                <View className="flex-row items-center">
                  <Ionicons name="time" size={20} color="#F59E0B" />
                  <Text
                    className={`${textClasses.body} ml-3`}
                    style={{ color: colors.textPrimary }}
                  >
                    Simulate Expired Subscription
                  </Text>
                </View>
              </Pressable>

              {/* Reset to Free */}
              <Pressable
                onPress={handleResetToFree}
                className="py-4 px-4 rounded-xl mb-3"
                style={{
                  backgroundColor: colors.cardBackground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 56,
                }}
                accessibilityRole="button"
                accessibilityLabel="Reset to free plan"
              >
                <View className="flex-row items-center">
                  <Ionicons name="remove-circle" size={20} color="#EF4444" />
                  <Text
                    className={`${textClasses.body} ml-3`}
                    style={{ color: colors.textPrimary }}
                  >
                    Reset to Free Plan
                  </Text>
                </View>
              </Pressable>

              {/* Disable Developer Mode */}
              <Pressable
                onPress={handleDisableDeveloperMode}
                className="py-4 px-4 rounded-xl"
                style={{
                  backgroundColor: "#FEE2E2",
                  borderWidth: 1,
                  borderColor: "#EF4444",
                  minHeight: 56,
                }}
                accessibilityRole="button"
                accessibilityLabel="Hide developer options"
              >
                <View className="flex-row items-center">
                  <Ionicons name="eye-off" size={20} color="#EF4444" />
                  <Text
                    className={`${textClasses.body} ml-3`}
                    style={{ color: "#EF4444" }}
                  >
                    Hide Developer Options
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          {/* Copyright */}
          <View className="items-center py-8">
            <Text
              className={`${textClasses.small} text-center mb-2`}
              style={{ color: colors.textSecondary }}
            >
              © 2025 SCM Solutions LLC
            </Text>
            <Text
              className={`${textClasses.small} text-center mb-4`}
              style={{ color: colors.textSecondary }}
            >
              Made with care for seniors
            </Text>

            {/* Website Links */}
            <View className="flex-row items-center justify-center" style={{ gap: 16 }}>
              <Pressable
                onPress={openWebsite}
                className="flex-row items-center active:opacity-70 py-2"
                accessibilityRole="link"
                accessibilityLabel="Visit SteadiDay website"
                accessibilityHint="Opens www.steadiday.com in browser"
              >
                <Ionicons name="globe-outline" size={18} color={primary} style={{ marginRight: 4 }} />
                <Text
                  className={`${textClasses.small} font-medium`}
                  style={{ color: primary }}
                >
                  Website
                </Text>
              </Pressable>
              <Text style={{ color: colors.divider }}>|</Text>
              <Pressable
                onPress={openPrivacyPolicy}
                className="flex-row items-center active:opacity-70 py-2"
                accessibilityRole="link"
                accessibilityLabel="View Privacy Policy"
                accessibilityHint="Opens privacy policy in browser"
              >
                <Text
                  className={`${textClasses.small} font-medium`}
                  style={{ color: primary }}
                >
                  Privacy
                </Text>
              </Pressable>
              <Text style={{ color: colors.divider }}>|</Text>
              <Pressable
                onPress={openTermsOfService}
                className="flex-row items-center active:opacity-70 py-2"
                accessibilityRole="link"
                accessibilityLabel="View Terms of Service"
                accessibilityHint="Opens terms of service in browser"
              >
                <Text
                  className={`${textClasses.small} font-medium`}
                  style={{ color: primary }}
                >
                  Terms
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Bottom padding */}
          <View className="h-8" />
        </ScrollView>
      </View>
    </Screen>
  );
}
