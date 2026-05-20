import React from "react";
import { View, Text, ScrollView, Pressable, Linking } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";
import * as Haptics from "expo-haptics";

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SETUP_STEPS: StepProps[] = [
  {
    number: 1,
    title: "Open Apple Health",
    description: "Open the Health app on your iPhone. It has a white icon with a red heart.",
    icon: "heart",
  },
  {
    number: 2,
    title: "Tap Your Profile",
    description: "Tap your profile picture or initials in the top-right corner of the Health app.",
    icon: "person-circle",
  },
  {
    number: 3,
    title: "Go to Health Records",
    description: "Scroll down and tap \"Health Records\" under the Features section.",
    icon: "document-text",
  },
  {
    number: 4,
    title: "Add Your Provider",
    description: "Tap \"Get Started\" or \"Add Account\", then search for your hospital, clinic, or doctor's office.",
    icon: "search",
  },
  {
    number: 5,
    title: "Sign In",
    description: "Log in with your patient portal credentials (the same login you use for MyChart, Epic, or your hospital's website).",
    icon: "log-in",
  },
  {
    number: 6,
    title: "Return to SteadiDay",
    description: "Once connected, come back here and tap \"Sync\" to see your records!",
    icon: "checkmark-circle",
  },
];

export default function HealthRecordsHelpScreen() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const openAppleHealth = () => {
    triggerHaptic();
    // Deep link to Apple Health app
    Linking.openURL("x-apple-health://");
  };

  const openSupportedInstitutions = () => {
    triggerHaptic();
    Linking.openURL("https://support.apple.com/en-us/109494");
  };

  return (
    <Screen variant="scroll" edges={["bottom"]}>
      {/* Header */}
      <View
        className="flex-row items-center px-5 py-4 border-b"
        style={{ borderBottomColor: colors.divider }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 mr-2"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ minWidth: 48, minHeight: 48 }}
        >
          <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text
          className={`${textClasses.title} font-semibold`}
          style={{ color: colors.textPrimary }}
        >
          Connect Health Records
        </Text>
      </View>

      <ScrollView className="flex-1 px-5">
        {/* Header */}
        <View className="items-center py-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: primaryLight }}
          >
            <Ionicons name="medical" size={40} color={primary} />
          </View>
          <Text
            className={`${textClasses.title} text-center mb-2`}
            style={{ color: colors.textPrimary }}
          >
            Connect Apple Health Records
          </Text>
          <Text
            className={`${textClasses.body} text-center`}
            style={{ color: colors.textSecondary }}
          >
            View your lab results and medications from your healthcare providers
          </Text>
        </View>

        {/* Info Card */}
        <View
          className="rounded-2xl p-4 mb-6"
          style={{ backgroundColor: colors.warningBackground, borderWidth: 1, borderColor: colors.warning }}
        >
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={24} color={colors.warning} />
            <View className="flex-1 ml-3">
              <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.onWarning }}>
                Not All Providers Are Supported
              </Text>
              <Text className={`${textClasses.small} mt-1`} style={{ color: colors.onWarning }}>
                About 500+ health systems support Apple Health Records, including major networks like Banner Health, Trinity Health, Johns Hopkins, and Cedars-Sinai.
              </Text>
              <Pressable onPress={openSupportedInstitutions} className="mt-2">
                <Text className={`${textClasses.small} font-semibold`} style={{ color: primary }}>
                  View Supported Providers →
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Steps */}
        <Text
          className={`${textClasses.subtitle} font-semibold mb-4`}
          style={{ color: colors.textPrimary }}
        >
          How to Connect
        </Text>

        {SETUP_STEPS.map((step, index) => (
          <View
            key={step.number}
            className="flex-row mb-4"
          >
            {/* Step number and line */}
            <View className="items-center mr-4">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: primaryLight }}
              >
                <Text className={`${textClasses.body} font-bold`} style={{ color: primary }}>
                  {step.number}
                </Text>
              </View>
              {index < SETUP_STEPS.length - 1 && (
                <View
                  className="w-0.5 flex-1 mt-2"
                  style={{ backgroundColor: colors.border }}
                />
              )}
            </View>

            {/* Step content */}
            <View
              className="flex-1 rounded-2xl p-4 mb-2"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons name={step.icon} size={20} color={primary} />
                <Text
                  className={`${textClasses.body} font-semibold ml-2`}
                  style={{ color: colors.textPrimary }}
                >
                  {step.title}
                </Text>
              </View>
              <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                {step.description}
              </Text>
            </View>
          </View>
        ))}

        {/* Open Apple Health Button */}
        <Pressable
          onPress={openAppleHealth}
          className="py-4 rounded-2xl items-center flex-row justify-center mb-4"
          style={{ backgroundColor: primary }}
        >
          <Ionicons name="heart" size={24} color="white" />
          <Text className={`${textClasses.body} font-semibold text-white ml-2`}>
            Open Apple Health
          </Text>
        </Pressable>

        {/* FAQ Section */}
        <Text
          className={`${textClasses.subtitle} font-semibold mb-4 mt-4`}
          style={{ color: colors.textPrimary }}
        >
          Common Questions
        </Text>

        <View
          className="rounded-2xl p-4 mb-4"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
            What if my provider is not listed?
          </Text>
          <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
            Not all hospitals support Apple Health Records yet. You can ask your provider if they plan to support it, or manually enter your health information in the app.
          </Text>
        </View>

        <View
          className="rounded-2xl p-4 mb-4"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
            What login do I use?
          </Text>
          <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
            Use the same username and password you use for your patient portal (like MyChart, Epic MyChart, or your hospital website).
          </Text>
        </View>

        <View
          className="rounded-2xl p-4 mb-4"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
            Is my health data secure?
          </Text>
          <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
            Yes! Your health records are encrypted and stored securely on your iPhone. Apple never sees your health data, and SteadiDay only accesses what you allow.
          </Text>
        </View>

        <View
          className="rounded-2xl p-4 mb-8"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
            Can I connect multiple providers?
          </Text>
          <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
            Yes! You can add multiple healthcare providers in Apple Health. All your records will appear together in SteadiDay.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
