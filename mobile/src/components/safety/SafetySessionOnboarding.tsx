import React, { useState } from "react";
import { View, Text, Pressable, Modal, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafetySessionStore } from "../../state/stores/safetySessionStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TEAL = "#2A9D8F";
const NAVY = "#1B2A4A";
const CREAM = "#FFF8F0";
const GOLD = "#E9C46A";
const SAGE_GREEN = "#6B9080";
const BODY_COLOR = "#4A4A4A";

interface SafetySessionOnboardingProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const steps = [
  {
    icon: "shield-checkmark-outline" as const,
    iconColor: TEAL,
    iconSize: 64,
    title: "Stay Protected When You Need It",
    body: "A Safety Session uses your phone's sensors to detect if you fall. If a fall is detected, we'll ask if you're okay. If you don't respond within 30 seconds, your trusted contact will be alerted with your location.",
  },
  {
    icon: "list-outline" as const,
    iconColor: TEAL,
    iconSize: 48,
    title: "How It Works",
    body: "",
    steps: [
      {
        icon: "play-circle-outline" as const,
        label: "Tap to Start",
        description:
          "Start a session when you want protection - like when you're home alone or doing chores.",
      },
      {
        icon: "phone-portrait-outline" as const,
        label: "Keep App Open",
        description:
          "Your phone can be locked, but don't swipe SteadiDay closed. Fall detection runs while the app is active.",
      },
      {
        icon: "stop-circle-outline" as const,
        label: "Tap to Stop",
        description: "End the session anytime. You're in control.",
      },
    ],
  },
  {
    icon: "information-circle-outline" as const,
    iconColor: SAGE_GREEN,
    iconSize: 48,
    title: "One Important Thing",
    body: "Fall detection only works while SteadiDay is open. If you close the app, the session will pause. We'll always be honest about when you're protected.",
  },
];

export default function SafetySessionOnboarding({
  visible,
  onClose,
  onComplete,
}: SafetySessionOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const setOnboardingSeen = useSafetySessionStore((s) => s.setOnboardingSeen);

  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const goToStep = (step: number) => {
    translateX.value = withTiming(-step * SCREEN_WIDTH, { duration: 300 });
    setCurrentStep(step);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOnboardingSeen();
    setCurrentStep(0);
    translateX.value = 0;
    onComplete();
  };

  const handleClose = () => {
    setCurrentStep(0);
    translateX.value = 0;
    onClose();
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: CREAM }}>
        {/* Close button */}
        <View className="flex-row justify-end pt-4 pr-4">
          <Pressable
            onPress={handleClose}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
            accessibilityRole="button"
            accessibilityLabel="Close onboarding"
          >
            <Ionicons name="close" size={24} color={NAVY} />
          </Pressable>
        </View>

        {/* Step indicator dots */}
        <View className="flex-row justify-center py-4">
          {steps.map((_, i) => (
            <View
              key={i}
              className="mx-1 rounded-full"
              style={{
                width: i === currentStep ? 24 : 8,
                height: 8,
                backgroundColor: i === currentStep ? TEAL : "#D0D0D0",
              }}
            />
          ))}
        </View>

        {/* Swipeable content */}
        <View style={{ flex: 1, overflow: "hidden" }}>
          <Animated.View
            style={[
              {
                flexDirection: "row",
                width: SCREEN_WIDTH * steps.length,
              },
              animatedStyle,
            ]}
          >
            {steps.map((step, index) => (
              <View
                key={index}
                style={{ width: SCREEN_WIDTH, paddingHorizontal: 28 }}
                className="justify-center"
              >
                <View
                  className="rounded-3xl p-8"
                  style={{
                    backgroundColor: "#FFFFFF",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 3,
                  }}
                >
                  {/* Icon */}
                  <View className="items-center mb-6">
                    <Ionicons
                      name={step.icon}
                      size={step.iconSize}
                      color={step.iconColor}
                    />
                  </View>

                  {/* Title */}
                  <Text
                    className="text-center mb-5 font-bold"
                    style={{
                      color: NAVY,
                      fontSize: 24,
                      lineHeight: 32,
                      fontFamily: "Merriweather_700Bold",
                    }}
                  >
                    {step.title}
                  </Text>

                  {/* Body or step list */}
                  {step.body ? (
                    <Text
                      className="text-center leading-relaxed"
                      style={{
                        color: BODY_COLOR,
                        fontSize: 16,
                        lineHeight: 24,
                      }}
                    >
                      {step.body}
                    </Text>
                  ) : null}

                  {step.steps?.map((s, si) => (
                    <View key={si} className="flex-row items-start mb-5">
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center mr-4"
                        style={{ backgroundColor: TEAL + "15" }}
                      >
                        <Ionicons name={s.icon} size={24} color={TEAL} />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="font-bold mb-1"
                          style={{ color: NAVY, fontSize: 17 }}
                        >
                          {s.label}
                        </Text>
                        <Text
                          style={{
                            color: BODY_COLOR,
                            fontSize: 15,
                            lineHeight: 22,
                          }}
                        >
                          {s.description}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Bottom button */}
        <View className="px-7 pb-10 pt-4">
          <Pressable
            onPress={isLastStep ? handleComplete : handleNext}
            className="items-center justify-center rounded-2xl"
            style={{
              backgroundColor: TEAL,
              height: 56,
            }}
            accessibilityRole="button"
            accessibilityLabel={isLastStep ? "Got it, let's go" : "Next step"}
          >
            <Text
              className="font-bold"
              style={{ color: "#FFFFFF", fontSize: 18 }}
            >
              {isLastStep ? "Got It, Let's Go" : "Next"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
