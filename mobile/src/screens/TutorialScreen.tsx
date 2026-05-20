import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Screen } from "../components/Screen";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";

const tutorialSteps = [
  {
    icon: "heart" as const,
    title: "Welcome to SteadiDay",
    description: "A simple way to stay organized and manage your day.",
  },
  {
    icon: "checkbox" as const,
    title: "Stay on Track",
    description: "Keep important reminders and routines in one place.",
  },
  {
    icon: "apps" as const,
    title: "Everything in One App",
    description: "Access helpful tools and stay connected with what matters.",
  },
];

export default function TutorialScreen() {
  const navigation = useNavigation<any>();
  const [currentStep, setCurrentStep] = useState(0);
  const { colors, primary } = useTheme();

  // Detect if we're in onboarding or accessed from Settings
  const parentState = navigation.getParent()?.getState();
  const currentState = navigation.getState();
  const isInOnboarding =
    parentState?.routes?.some((r: any) => r.name === "OnboardingStack") ||
    currentState?.routeNames?.includes("Welcome");

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finished tutorial
      if (isInOnboarding) {
        navigation.navigate("AccessibilitySetup");
      } else {
        // From Settings - just go back to where we came from
        navigation.goBack();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSkip = () => {
    if (isInOnboarding) {
      navigation.navigate("AccessibilitySetup");
    } else {
      navigation.goBack();
    }
  };

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <Screen
      variant="static"
      edges={["top", "bottom"]}
    >
      <View className="flex-1 px-10 py-12">
        {/* Back button - always show */}
        <Pressable
          onPress={handleBack}
          className="absolute top-12 left-10 z-10"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ minWidth: 48, minHeight: 48 }}
        >
          <View className="flex-row items-center">
            <Ionicons name="arrow-back" size={28} color={primary} />
            <Text style={{ color: primary }} className="text-xl font-semibold ml-2">
              Back
            </Text>
          </View>
        </Pressable>

        <View className="flex-1 justify-center items-center mt-16">
          <View
            style={{ backgroundColor: colors.primaryLight }}
            className="rounded-full p-12 mb-12"
          >
            <Ionicons name={step.icon} size={96} color={primary} />
          </View>
          <Text
            style={{ color: colors.textPrimary }}
            className="text-4xl font-bold mb-6 text-center px-4"
          >
            {step.title}
          </Text>
          <Text
            style={{ color: colors.textSecondary }}
            className="text-xl text-center leading-relaxed px-8"
          >
            {step.description}
          </Text>
        </View>

        <View className="space-y-4">
          <View className="flex-row justify-center mb-8">
            {tutorialSteps.map((_, index) => (
              <View
                key={index}
                style={{
                  height: 12,
                  width: 12,
                  borderRadius: 6,
                  marginHorizontal: 8,
                  backgroundColor: index === currentStep ? primary : colors.divider,
                }}
              />
            ))}
          </View>

          <Button
            title={isLastStep ? (isInOnboarding ? "Get Started" : "Done") : "Next"}
            onPress={handleNext}
            variant="primary"
            size="large"
            fullWidth
            style={{ marginBottom: 16 }}
          />

          <Button
            title={isInOnboarding ? "Skip" : "Close"}
            onPress={handleSkip}
            variant="secondary"
            size="large"
            fullWidth
          />
        </View>
      </View>
    </Screen>
  );
}
