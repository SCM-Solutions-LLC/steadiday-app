import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";
import { useSlowMode } from "../utils/useSlowMode";
import Button from "../components/Button";
import { openPrivacyPolicy, openTermsOfService, openSecurity } from "../utils/openURL";

type LegalConsentNavigationProp = NativeStackNavigationProp<OnboardingStackParamList, "LegalConsent">;

export default function LegalConsentScreen() {
  const navigation = useNavigation<LegalConsentNavigationProp>();
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const { primaryButtonHeight, minTouchTarget } = useSlowMode();
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleContinue = () => {
    if (agreedToTerms) {
      navigation.navigate("ConnectAppsIntro");
    }
  };

  const links = [
    {
      label: "Privacy Policy",
      icon: "shield-checkmark" as const,
      color: "#2F80ED",
      onPress: openPrivacyPolicy,
    },
    {
      label: "Terms of Service",
      icon: "document-text" as const,
      color: "#6DB193",
      onPress: openTermsOfService,
    },
    {
      label: "Security Policy",
      icon: "lock-closed" as const,
      color: "#4A90D9",
      onPress: openSecurity,
    },
  ];

  return (
    <Screen variant="scroll" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 pt-8">
        {/* Icon */}
        <View className="items-center mb-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{ backgroundColor: primary + "15" }}
          >
            <Ionicons name="shield-checkmark" size={40} color={primary} />
          </View>
        </View>

        {/* Title */}
        <Text className={`${textClasses.largeTitle} text-center mb-3`} style={{ color: colors.textPrimary }}>
          Before You Continue
        </Text>
        <Text className={`${textClasses.body} text-center leading-relaxed mb-8`} style={{ color: colors.textSecondary }}>
          By using SteadiDay, you agree to our policies. Tap any link below to learn more.
        </Text>

        {/* Policy Links */}
        <View className="rounded-2xl overflow-hidden mb-8" style={{ backgroundColor: colors.cardBackground }}>
          {links.map((link, index) => (
            <Pressable
              key={link.label}
              onPress={link.onPress}
              className="flex-row items-center px-4 py-4 active:opacity-70"
              style={[
                index < links.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.divider } : undefined,
                { minHeight: minTouchTarget },
              ]}
              accessibilityRole="link"
              accessibilityLabel={`View ${link.label} on website`}
              accessibilityHint="Opens in browser"
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: link.color + "15" }}
              >
                <Ionicons name={link.icon} size={20} color={link.color} />
              </View>
              <Text className={`${textClasses.body} font-medium flex-1`} style={{ color: colors.textPrimary }}>
                {link.label}
              </Text>
              <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        {/* Agreement Checkbox */}
        <Pressable
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          className="flex-row items-start mb-8 rounded-2xl p-5 active:opacity-70"
          style={{
            backgroundColor: agreedToTerms ? "#E8F5E9" : colors.cardBackground,
            borderWidth: 2.5,
            borderColor: agreedToTerms ? "#4CAF50" : "#9CA3AF",
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreedToTerms }}
        >
          <View
            className="w-9 h-9 rounded-lg items-center justify-center mr-4 mt-0.5"
            style={{
              borderWidth: 3,
              borderColor: agreedToTerms ? "#4CAF50" : "#6B7280",
              backgroundColor: agreedToTerms ? "#4CAF50" : "#FFFFFF",
            }}
          >
            {agreedToTerms && <Ionicons name="checkmark" size={24} color="#FFFFFF" />}
          </View>
          <Text className={`${textClasses.body} leading-relaxed flex-1`} style={{ color: colors.textPrimary }}>
            I agree to the{" "}
            <Text className="font-semibold" style={{ color: primary }}>Privacy Policy</Text>,{" "}
            <Text className="font-semibold" style={{ color: primary }}>Terms of Service</Text>, and{" "}
            <Text className="font-semibold" style={{ color: primary }}>Security Policy</Text>
          </Text>
        </Pressable>

        {/* Info note */}
        <View className="rounded-xl p-3 mb-6" style={{ backgroundColor: primary + "10" }}>
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={18} color={primary} style={{ marginRight: 8, marginTop: 1 }} />
            <Text className={`${textClasses.small} leading-relaxed flex-1`} style={{ color: colors.textSecondary }}>
              You can review these anytime in Settings.
            </Text>
          </View>
        </View>

        {/* Continue Button — inside scroll content so user must scroll to reach it */}
        <View className="mt-8 pt-4">
          <Button
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            size="large"
            fullWidth
            disabled={!agreedToTerms}
            accessibilityLabel="Continue"
          />
        </View>
      </View>
    </Screen>
  );
}
