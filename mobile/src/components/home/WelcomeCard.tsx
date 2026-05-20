import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../utils/useTheme";
import { useSettingsStore } from "../../state/stores/settingsStore";
import * as Haptics from "expo-haptics";
import Button from "../Button";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface WelcomeStep {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  message: string;
  showTabHint?: boolean;
}

interface WelcomeCardProps {
  visible: boolean;
  onDismiss: () => void;
}

export function WelcomeCard({ visible, onDismiss }: WelcomeCardProps) {
  const { colors, primary, isDark } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);

  const [currentStep, setCurrentStep] = useState(0);

  const hintX = useSharedValue(0);

  useEffect(() => {
    hintX.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const hintAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: hintX.value }],
  }));

  const STEPS: WelcomeStep[] = [
    {
      icon: "alert-circle",
      iconColor: "#DC2626",
      iconBg: "#FEE2E2",
      title: "Your Emergency Button",
      message: "Scroll down on the Home screen to find the red SOS button. Tap it to call 911, call your trusted contact, or text them your location.",
    },
    {
      icon: "medical",
      iconColor: primary,
      iconBg: (colors.primaryLight || primary + "20"),
      title: "Your Medications",
      message: "Tap the Meds tab to add medications. You can type them in or scan your pill bottle.",
    },
    {
      icon: "checkbox",
      iconColor: primary,
      iconBg: (colors.primaryLight || primary + "20"),
      title: "Tasks & Reminders",
      message: "The Tasks tab helps you set daily reminders for appointments, exercises, or anything important.",
    },
    {
      icon: "heart",
      iconColor: primary,
      iconBg: (colors.primaryLight || primary + "20"),
      title: "Health Tracking",
      message: "Track your steps, heart rate, sleep, and more. If you have not already, you can connect Apple Health in Settings.",
    },
    {
      icon: "shield-checkmark",
      iconColor: primary,
      iconBg: (colors.primaryLight || primary + "20"),
      title: "Safety Session",
      message: "Start a Safety Session from the Home screen to enable fall detection while the app is open. If a fall is detected, the app will alert your trusted contacts.",
    },
    {
      icon: "pencil",
      iconColor: primary,
      iconBg: (colors.primaryLight || primary + "20"),
      title: "Customize Your Home",
      message: "Tap the Edit button in the top right corner to reorder, add, or remove widgets on your Home screen.",
    },
    {
      icon: "settings",
      iconColor: primary,
      iconBg: (colors.primaryLight || primary + "20"),
      title: "Make It Your Own",
      message: "Go to Settings to change text size, adjust your display, and more. Use the FAQ chatbot in Settings for any other questions you have.",
    },
    {
      icon: "swap-horizontal",
      iconColor: primary,
      iconBg: (colors.primaryLight || primary + "20"),
      title: "Explore Your Tabs",
      message: "Swipe the tabs at the bottom to discover all the features available to you.",
      showTabHint: true,
    },
  ];

  if (!visible) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (isLast) {
      onDismiss();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDismiss();
  };

  const titleFontSize = textSize === "extra-large" ? 22 : textSize === "large" ? 20 : 18;
  const bodyFontSize = textSize === "extra-large" ? 20 : textSize === "large" ? 18 : 16;
  const bodyLineHeight = textSize === "extra-large" ? 28 : textSize === "large" ? 26 : 24;

  return (
    <View
      style={{
        marginBottom: 16,
        borderRadius: 20,
        backgroundColor: isDark ? (colors.modalBackground || "#2A2A2A") : "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        paddingTop: 16,
        paddingBottom: 8,
        paddingHorizontal: 20,
      }}
    >
      {/* Progress dots */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginRight: 8, fontWeight: "500" }}>
          {currentStep + 1} of {STEPS.length}
        </Text>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === currentStep ? 16 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === currentStep ? primary : (isDark ? "#555" : "#DDD"),
              marginLeft: i > 0 ? 4 : 0,
            }}
          />
        ))}
      </View>

      {/* Icon + content */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 16 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: step.iconBg,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name={step.icon} size={24} color={step.iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: titleFontSize,
              fontWeight: "700",
              marginBottom: 4,
            }}
          >
            {step.title}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: bodyFontSize,
              lineHeight: bodyLineHeight,
            }}
          >
            {step.message}
          </Text>
        </View>
      </View>

      {/* Animated tab scroll hint */}
      {step.showTabHint && (
        <Animated.View
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
            },
          ]}
        >
          <Text style={{ color: colors.textTertiary, fontSize: 13, marginRight: 4 }}>
            Swipe the tabs below to see more
          </Text>
          <Animated.View style={hintAnimStyle}>
            <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
          </Animated.View>
        </Animated.View>
      )}

      {/* Next button */}
      <Button
        title={isLast ? "Get Started!" : "Next"}
        onPress={handleNext}
        variant="primary"
        size="small"
        fullWidth
        accessibilityLabel={isLast ? "Get Started" : "Next tip"}
      />

      {/* Skip link */}
      <Pressable
        onPress={handleSkip}
        style={[{ alignItems: "center", paddingVertical: 10, minHeight: 44 }]}
        className="active:opacity-60"
        accessibilityRole="button"
        accessibilityLabel="Skip tour"
      >
        <Text style={{ color: colors.textTertiary, fontSize: 15 }}>
          Skip Tour
        </Text>
      </Pressable>
    </View>
  );
}
