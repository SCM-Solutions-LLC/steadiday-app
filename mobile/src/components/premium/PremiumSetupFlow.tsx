import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Modal, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useSubscriptionStore } from "../../state/stores/subscriptionStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useTheme } from "../../utils/useTheme";
import { useSlowMode } from "../../utils/useSlowMode";
import * as Haptics from "expo-haptics";
import ConfettiAnimation from "./ConfettiAnimation";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onComplete: () => void;
  /** Debug mode - shows modal mount state indicator */
  debug?: boolean;
}

type SetupStep = "welcome" | "done";

/**
 * PremiumSetupFlow - Simplified 2-screen onboarding for Premium users
 *
 * Designed for seniors:
 * - Simple, not overwhelming
 * - Applies "Simple" preset by default
 * - Shows what is enabled with clear checkmarks
 * - Points users to Settings for more customization
 * - Includes celebratory confetti animation
 */
export default function PremiumSetupFlow({ visible, onComplete, debug = false }: Props) {
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const applySimplePreset = useSubscriptionStore((s) => s.applySimplePreset);
  const markPremiumSetupComplete = useSubscriptionStore(
    (s) => s.markPremiumSetupComplete
  );
  const featureVisibility = useSubscriptionStore((s) => s.featureVisibility);
  const textClasses = getTextSizeClasses(textSize);
  const { colors, primary, isDark } = useTheme();
  const { enabled: slowModeEnabled, getAnimationDuration } = useSlowMode();

  const [step, setStep] = useState<SetupStep>("welcome");
  const [showConfetti, setShowConfetti] = useState(false);

  // Confetti settings - increased significantly for celebration, respects Slow Mode
  const confettiPieceCount = slowModeEnabled ? 60 : 120;
  const confettiDuration = slowModeEnabled ? getAnimationDuration(4000) : 5500;

  // Reset internal state when modal closes to prevent stale state on reopen
  useEffect(() => {
    if (!visible) {
      setStep("welcome");
      setShowConfetti(false);
    }
  }, [visible]);

  // Start confetti when entering welcome screen
  useEffect(() => {
    if (visible && step === "welcome") {
      setShowConfetti(true);
      // Auto-stop confetti after duration
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, confettiDuration);
      return () => clearTimeout(timer);
    }
  }, [visible, step, confettiDuration]);

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleGetStarted = () => {
    triggerHaptic();
    // Apply simple preset by default - keep it simple for seniors
    applySimplePreset();
    setStep("done");
  };

  const handleComplete = () => {
    triggerHaptic();
    markPremiumSetupComplete();
    onComplete();
  };

  // Build dynamic Premium features list based on what's enabled
  const getPremiumFeatures = () => {
    const features = [];

    // Always show core Premium features
    features.push(
      { icon: "construct", label: "Helpful Tools", color: colors.warning },
      { icon: "fitness", label: "Health Metrics", color: colors.success }
    );

    // Health Records features (Premium-only)
    features.push(
      { icon: "flask", label: "Lab Results", color: colors.info },
      { icon: "medical", label: "Medication Records", color: colors.error }
    );

    // Mind Breaks if connect section is enabled
    if (featureVisibility.sections.connect) {
      features.push(
        { icon: "sparkles", label: "Mind Breaks", color: primary }
      );
    }

    return features;
  };

  // ============================================================
  // SCREEN 1: Welcome with Confetti - Celebratory multi-color gradient
  // ============================================================
  if (step === "welcome") {
    return (
      <>
        {/* Debug indicator - shows modal mount state */}
        {debug && (
          <View
            style={{
              position: "absolute",
              top: 50,
              right: 10,
              backgroundColor: visible ? "#22c55e" : "#ef4444",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
              zIndex: 9999,
            }}
            pointerEvents="none"
          >
            <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
              {`Setup: ${visible ? "VISIBLE" : "HIDDEN"} | Step: ${step}`}
            </Text>
          </View>
        )}

        <Modal visible={visible} animationType="fade" onRequestClose={() => {}}>
        <LinearGradient
          colors={isDark
            ? ["#1E3A5F", "#2E1065", "#1A1A1A"]
            : ["#667EEA", "#764BA2", "#F093FB", "#F5576C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Confetti Animation - increased count */}
            <ConfettiAnimation
              isPlaying={showConfetti}
              onComplete={() => setShowConfetti(false)}
              pieceCount={confettiPieceCount}
            />

            <View className="flex-1 justify-center items-center px-10">
              {/* Celebratory Icon with glow effect */}
              <View
                className="w-32 h-32 rounded-full items-center justify-center mb-8"
                style={{
                  backgroundColor: isDark ? colors.cardBackground : "rgba(255,255,255,0.95)",
                  shadowColor: "#FFD700",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              >
                <Ionicons name="trophy" size={64} color={colors.premium} />
              </View>

              {/* Title with celebration */}
              <Text
                className={`${textClasses.largeTitle} text-center mb-4`}
                style={{ fontSize: 34, color: isDark ? colors.textPrimary : "#FFFFFF", fontWeight: "800" }}
              >
                Congratulations!
              </Text>

              {/* Subtitle */}
              <Text
                className={`${textClasses.title} text-center mb-2`}
                style={{ color: isDark ? colors.textSecondary : "rgba(255,255,255,0.95)", fontWeight: "700" }}
              >
                Welcome to Premium
              </Text>

              <Text
                className={`${textClasses.subtitle} text-center mb-4`}
                style={{ color: isDark ? colors.textSecondary : "rgba(255,255,255,0.85)", lineHeight: 28 }}
              >
                You now have access to everything.
              </Text>

              {/* Reassurance */}
              <View
                className="rounded-2xl p-5 mb-10 w-full"
                style={{ backgroundColor: isDark ? colors.cardBackground : "rgba(255,255,255,0.2)" }}
              >
                <Text
                  className={`${textClasses.body} text-center`}
                  style={{ lineHeight: 26, color: isDark ? colors.textPrimary : "#FFFFFF" }}
                >
                  {"We'll keep things simple for you.\nYou can always show more features\nlater in Settings."}
                </Text>
              </View>

              {/* Button */}
              <Pressable
                onPress={handleGetStarted}
                className="py-5 px-16 rounded-2xl"
                style={{
                  minHeight: 64,
                  backgroundColor: isDark ? primary : "#FFFFFF",
                }}
                accessibilityRole="button"
                accessibilityLabel="Get started with Premium"
              >
                <Text
                  className={`${textClasses.subtitle} font-bold text-center`}
                  style={{ color: isDark ? colors.onPrimary : "#764BA2", fontSize: 20 }}
                >
                  Get Started
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
      </>
    );
  }

  // ============================================================
  // SCREEN 2: Done - "You're All Set" with Premium Features
  // ============================================================
  const premiumFeatures = getPremiumFeatures();

  return (
    <>
      {/* Debug indicator - shows modal mount state */}
      {debug && (
        <View
          style={{
            position: "absolute",
            top: 50,
            right: 10,
            backgroundColor: visible ? "#22c55e" : "#ef4444",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            zIndex: 9999,
          }}
          pointerEvents="none"
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
            {`Setup: ${visible ? "VISIBLE" : "HIDDEN"} | Step: ${step}`}
          </Text>
        </View>
      )}

      <Modal visible={visible} animationType="fade" onRequestClose={() => {}}>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 40,
            paddingVertical: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Icon */}
          <View className="items-center mb-8">
            <View
              className="w-24 h-24 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.premiumLight }}
            >
              <Ionicons name="star" size={48} color={colors.premium} />
            </View>
          </View>

          {/* Title */}
          <Text
            className={`${textClasses.largeTitle} text-center mb-2`}
            style={{ color: colors.textPrimary, fontSize: 28 }}
          >
            {"You're All Set!"}
          </Text>

          <Text
            className={`${textClasses.body} text-center mb-6`}
            style={{ color: colors.textSecondary }}
          >
            Your Premium features are now unlocked
          </Text>

          {/* Premium Features List */}
          <View
            className="rounded-2xl p-5 mb-6"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center mb-4">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: colors.premium }}
              >
                <Ionicons name="star" size={16} color={colors.onPremium} />
              </View>
              <Text
                className={`${textClasses.body} font-semibold`}
                style={{ color: colors.textPrimary }}
              >
                Premium Features Unlocked
              </Text>
            </View>

            {premiumFeatures.map((item, index) => (
              <View
                key={item.label}
                className={`flex-row items-center py-3 ${
                  index < premiumFeatures.length - 1 ? "border-b" : ""
                }`}
                style={{ borderBottomColor: colors.divider }}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={item.color}
                  />
                </View>
                <Text
                  className={`${textClasses.body} flex-1`}
                  style={{ color: colors.textPrimary }}
                >
                  {item.label}
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.success}
                />
              </View>
            ))}

            {/* "And more" indicator */}
            <View className="flex-row items-center justify-center pt-3 mt-1 border-t" style={{ borderTopColor: colors.divider }}>
              <Ionicons name="add-circle-outline" size={18} color={primary} />
              <Text
                className={`${textClasses.small} ml-2`}
                style={{ color: primary }}
              >
                And more features to discover
              </Text>
            </View>
          </View>

          {/* Tip */}
          <View
            className="rounded-2xl p-4 mb-8 flex-row items-start"
            style={{
              backgroundColor: colors.primaryLight,
              borderWidth: 1,
              borderColor: primary,
            }}
          >
            <Ionicons name="bulb" size={22} color={primary} />
            <Text
              className={`${textClasses.small} ml-3 flex-1`}
              style={{ color: isDark ? colors.textPrimary : colors.textSecondary, lineHeight: 22 }}
            >
              {"Customize your tabs and home screen cards anytime in "}
              <Text style={{ fontWeight: "700" }}>
                Settings → Customize Your App
              </Text>
            </Text>
          </View>

          {/* Button */}
          <Pressable
            onPress={handleComplete}
            className="py-5 rounded-2xl"
            style={{ backgroundColor: primary, minHeight: 60 }}
            accessibilityRole="button"
            accessibilityLabel="Customize your tabs"
          >
            <Text
              className={`${textClasses.body} font-bold text-center`}
              style={{ color: colors.onPrimary, fontSize: 18 }}
            >
              Customize Your Tabs
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
    </>
  );
}
