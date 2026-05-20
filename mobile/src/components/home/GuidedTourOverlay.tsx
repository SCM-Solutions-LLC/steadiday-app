import React, { useEffect } from "react";
import { View, Text, Pressable, Modal, useWindowDimensions, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../utils/useTheme";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";

interface TourStep {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  message: string;
  arrowDirection: "up" | "down" | "none";
  cardPosition: "top" | "center" | "bottom";
}

interface GuidedTourOverlayProps {
  visible: boolean;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

export function GuidedTourOverlay({ visible, step, totalSteps, onNext, onSkip }: GuidedTourOverlayProps) {
  const { colors, primary, onPrimary, isDark } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const { height: screenHeight } = useWindowDimensions();

  // Arrow bounce animation
  const arrowTranslate = useSharedValue(0);
  // Card fade animation
  const cardOpacity = useSharedValue(0);
  // Icon pulse animation
  const iconScale = useSharedValue(1);

  const TOUR_STEPS: TourStep[] = [
    {
      icon: "alert-circle",
      iconColor: "#DC2626",
      iconBg: "#FEE2E2",
      title: "Your Emergency Button",
      message: "The big red SOS button is on your Home screen. Tap it anytime to call 911, text your trusted contacts with your location, or call your trusted person directly.",
      arrowDirection: "none",
      cardPosition: "center",
    },
    {
      icon: "medical",
      iconColor: primary,
      iconBg: colors.primaryLight || primary + "20",
      title: "Your Medications",
      message: "Tap the Meds tab below to add medications. You can type them in or scan your pill bottle with the camera.",
      arrowDirection: "down",
      cardPosition: "center",
    },
    {
      icon: "checkbox",
      iconColor: primary,
      iconBg: colors.primaryLight || primary + "20",
      title: "Tasks & Reminders",
      message: "The Tasks tab helps you set daily reminders for appointments, exercises, or anything you need to remember.",
      arrowDirection: "down",
      cardPosition: "center",
    },
    {
      icon: "heart",
      iconColor: primary,
      iconBg: colors.primaryLight || primary + "20",
      title: "Health Tracking",
      message: "Track your steps, heart rate, sleep, and more. Connect Apple Health in Settings to sync automatically.",
      arrowDirection: "down",
      cardPosition: "center",
    },
    {
      icon: "settings",
      iconColor: primary,
      iconBg: colors.primaryLight || primary + "20",
      title: "Make It Your Own",
      message: "Go to Settings to change text size, turn on Slow Mode for bigger buttons, or adjust your display. You can always customize later.",
      arrowDirection: "down",
      cardPosition: "center",
    },
  ];

  // Start animations when step changes
  useEffect(() => {
    cardOpacity.value = 0;
    cardOpacity.value = withTiming(1, { duration: 400 });

    arrowTranslate.value = 0;
    arrowTranslate.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    iconScale.value = 1;
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [step]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  const arrowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: arrowTranslate.value }],
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  if (!visible || step >= totalSteps) return null;

  const currentStep = TOUR_STEPS[step];
  const isLastStep = step === totalSteps - 1;

  // Leave room for down arrow when present
  const hasDownArrow = currentStep.arrowDirection === "down";
  const cardMaxHeight = hasDownArrow ? screenHeight * 0.55 : screenHeight * 0.7;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }}>

        {/* Tour Card — vertically centered */}
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 20,
              right: 20,
              top: hasDownArrow ? screenHeight * 0.08 : screenHeight * 0.12,
              maxHeight: cardMaxHeight,
              borderRadius: 24,
              backgroundColor: isDark ? colors.modalBackground || "#2A2A2A" : "#FFFFFF",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 12,
            },
            cardAnimStyle,
          ]}
        >
          {/* Scrollable content area */}
          <ScrollView
            contentContainerStyle={{ padding: 28, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
            style={{ flexShrink: 1 }}
          >
            {/* Progress: Step X of Y + dots */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 17, marginRight: 12, fontWeight: "500" }}>
                Step {step + 1} of {totalSteps}
              </Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i === step ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: i === step ? primary : (isDark ? "#555" : "#DDD"),
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Icon with pulse */}
            <Animated.View
              style={[
                {
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: currentStep.iconBg,
                  justifyContent: "center",
                  alignItems: "center",
                  alignSelf: "center",
                  marginBottom: 16,
                },
                iconAnimStyle,
              ]}
            >
              <Ionicons name={currentStep.icon as any} size={40} color={currentStep.iconColor} />
            </Animated.View>

            {/* Title */}
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 28,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {currentStep.title}
            </Text>

            {/* Message */}
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 20,
                lineHeight: 30,
                textAlign: "center",
              }}
            >
              {currentStep.message}
            </Text>
          </ScrollView>

          {/* Fixed footer — always visible */}
          <View style={{ paddingHorizontal: 28, paddingTop: 16, paddingBottom: 20 }}>
            {/* Next / Get Started button */}
            <Pressable
              onPress={onNext}
              style={({ pressed }) => ({
                backgroundColor: pressed ? primary + "DD" : primary,
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: "center",
                minHeight: 64,
                justifyContent: "center",
              })}
              accessibilityRole="button"
              accessibilityLabel={isLastStep ? "Get Started" : "Next step"}
            >
              <Text style={{ color: onPrimary, fontSize: 22, fontWeight: "700" }}>
                {isLastStep ? "Get Started!" : "Next"}
              </Text>
            </Pressable>

            {/* Skip Tour link */}
            <Pressable
              onPress={onSkip}
              style={{ marginTop: 12, alignItems: "center", paddingVertical: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Skip the tour"
            >
              <Text style={{ color: colors.textSecondary, fontSize: 18 }}>
                Skip Tour
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Arrow pointing DOWN (for tab bar steps) */}
        {currentStep.arrowDirection === "down" && (
          <Animated.View
            style={[
              {
                position: "absolute",
                bottom: 90,
                alignSelf: "center",
                alignItems: "center",
              },
              arrowAnimStyle,
            ]}
          >
            <Text style={{ color: "white", fontSize: 17, marginBottom: 4, fontWeight: "600" }}>
              Find it in the tabs below
            </Text>
            <Ionicons name="arrow-down" size={48} color="white" />
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}
