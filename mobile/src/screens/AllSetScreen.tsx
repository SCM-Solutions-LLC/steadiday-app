import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { Screen } from "../components/Screen";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { useUserStore } from "../state/stores/userStore";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import { useAnimationDuration } from "../utils/useReduceMotion";
import { getTextSizeClasses } from "../utils/textSizes";
import Button from "../components/Button";
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useTipStore } from "../state/stores/tipStore";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "AllSet">;
};

export default function AllSetScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();
  const userName = useUserStore((s) => s.userProfile.name);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const textClasses = getTextSizeClasses(textSize);
  const resetGuidedTour = useTipStore((s) => s.resetGuidedTour);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;

  const animDuration = useAnimationDuration(600, 0);
  const shouldAnimate = animDuration > 0;

  useEffect(() => {
    // Celebration haptic
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Entrance animations
    if (shouldAnimate) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: animDuration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(300),
          Animated.spring(checkmarkScale, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      scaleAnim.setValue(1);
      fadeAnim.setValue(1);
      checkmarkScale.setValue(1);
    }
  }, []);

  const handleStart = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    resetGuidedTour();
    completeOnboarding();
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1 px-8 py-12 justify-between">
        <View className="flex-1" />

        {/* Celebration Content */}
        <Animated.View
          className="items-center"
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* Success Icon */}
          <Animated.View
            className="rounded-full p-8 mb-8"
            style={{
              backgroundColor: colors.success + "20",
              transform: [{ scale: checkmarkScale }],
            }}
          >
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </Animated.View>

          {/* Title */}
          <Text
            className={`${textClasses.largeTitle} text-center mb-4`}
            style={{ color: colors.textPrimary }}
          >
            {"You're all set, " + (userName || "friend") + "!"}
          </Text>

          {/* Subtitle */}
          <Text
            className={`${textClasses.subtitle} text-center leading-relaxed mb-8`}
            style={{ color: colors.textSecondary }}
          >
            SteadiDay is ready to help you stay organized and safe.
          </Text>

          {/* Quick tips */}
          <View
            className="rounded-2xl p-5 w-full mb-8"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text
              className={`${textClasses.subtitle} mb-4`}
              style={{ color: colors.textPrimary }}
            >
              {"Here's what you can do:"}
            </Text>

            <View style={{ marginBottom: 10 }} className="flex-row items-center">
              <Ionicons name="medical" size={24} color={primary} style={{ marginRight: 12 }} />
              <Text
                className={`${textClasses.body} flex-1`}
                style={{ color: colors.textSecondary }}
              >
                Add your medications
              </Text>
            </View>

            <View style={{ marginBottom: 10 }} className="flex-row items-center">
              <Ionicons name="checkbox" size={24} color={primary} style={{ marginRight: 12 }} />
              <Text
                className={`${textClasses.body} flex-1`}
                style={{ color: colors.textSecondary }}
              >
                Create task reminders
              </Text>
            </View>

            <View style={{ marginBottom: 10 }} className="flex-row items-center">
              <Ionicons name="heart" size={24} color={primary} style={{ marginRight: 12 }} />
              <Text
                className={`${textClasses.body} flex-1`}
                style={{ color: colors.textSecondary }}
              >
                Track your health
              </Text>
            </View>

            <View style={{ marginBottom: 10 }} className="flex-row items-center">
              <Ionicons name="sparkles" size={24} color={primary} style={{ marginRight: 12 }} />
              <Text
                className={`${textClasses.body} flex-1`}
                style={{ color: colors.textSecondary }}
              >
                Try Mind Breaks
              </Text>
            </View>

            <View style={{ marginBottom: 10 }} className="flex-row items-center">
              <Ionicons name="construct" size={24} color={primary} style={{ marginRight: 12 }} />
              <Text
                className={`${textClasses.body} flex-1`}
                style={{ color: colors.textSecondary }}
              >
                Use handy Tools
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="settings" size={24} color={primary} style={{ marginRight: 12 }} />
              <Text
                className={`${textClasses.body} flex-1`}
                style={{ color: colors.textSecondary }}
              >
                Customize in Settings
              </Text>
            </View>
          </View>
        </Animated.View>

        <View className="flex-1" />

        {/* Start Button */}
        <Button
          title="Start Using SteadiDay"
          onPress={handleStart}
          variant="primary"
          size="large"
          fullWidth
          accessibilityLabel="Start using SteadiDay"
        />
      </View>
    </Screen>
  );
}
