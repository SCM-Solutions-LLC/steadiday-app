import React from "react";
import { View } from "react-native";
import { useTheme } from "../utils/useTheme";

interface OnboardingProgressProps {
  currentStep: number; // 1-based index
  totalSteps: number;
}

/**
 * Progress indicator for onboarding screens
 * Shows a row of segments indicating progress through onboarding
 */
export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const { primary } = useTheme();

  return (
    <View
      className="flex-row px-6 py-4"
      accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
      accessibilityRole="progressbar"
    >
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <View
            key={index}
            className="flex-1 h-1 rounded-full mx-1"
            style={{
              backgroundColor: isCompleted || isCurrent ? primary : "#E5E7EB",
              opacity: isCurrent ? 0.6 : 1,
            }}
          />
        );
      })}
    </View>
  );
}
