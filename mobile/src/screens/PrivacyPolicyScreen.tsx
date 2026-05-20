import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { ScreenErrorBoundary, BackButton } from "../components/ui";
import { openPrivacyPolicy } from "../utils/openURL";

export default function PrivacyPolicyScreen() {
  const { colors, primary } = useTheme();

  return (
    <ScreenErrorBoundary screenName="PrivacyPolicy">
      <Screen variant="static" edges={["top"]}>
        <View className="flex-1">
        {/* Sticky Header */}
        <View className="px-6 pt-4 pb-5" style={{ backgroundColor: colors.cardBackground }}>
          <BackButton label="Settings" />
          <Text className="text-2xl font-semibold mt-4" style={{ color: colors.textPrimary }}>Privacy Policy</Text>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            Last Updated: December 14, 2025
          </Text>

          {/* View Full Policy Online Button */}
          <Button
            title="View Full Policy Online"
            onPress={openPrivacyPolicy}
            variant="primary"
            size="large"
            fullWidth
            icon={<Ionicons name="globe-outline" size={24} color="white" />}
            accessibilityLabel="View full privacy policy online"
            style={{ marginBottom: 24 }}
          />

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Introduction
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            SteadiDay is designed to help adults aged 50-70 manage daily tasks, medications, and stay connected. We take your privacy seriously. This policy explains what information we collect, how we use it, and your rights.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            What Information We Collect
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Account Information:</Text> Name, email address, and authentication details when you create an account.
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Health Data:</Text> Medication schedules, task lists, and health notes you choose to enter.
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Apple Health Data (Optional):</Text> When you grant permission, we may access blood type, height, weight, steps, heart rate, sleep hours, exercise minutes, and blood pressure from Apple Health. This data is only accessed when you explicitly enable Apple Health integration and grant permissions. We cannot access allergies, medical conditions, emergency contacts, or organ donor status from Apple Health due to Apple privacy restrictions.
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Contact Information:</Text> Trusted contacts and favorite contacts you add to the app.
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Location Data:</Text> Your location for weather updates and location-based reminders (only when you grant permission).
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Device Information:</Text> Device type, operating system, and app version for technical support.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            How We Use Your Information
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • To provide medication reminders and task notifications
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • To sync your data across your devices
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • To send emergency alerts to your designated contacts
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • To improve app features and fix technical issues
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            • To provide weather updates for your location
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            • To display your Apple Health data for tracking wellness metrics (only when you enable this feature)
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Data Storage and Security
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            Your data is stored securely on your device and in encrypted cloud storage. We use industry-standard security measures including encryption, secure authentication, and regular security audits. Your health information is never sold to third parties. Apple Health data is accessed through Apple Health, which is secured by iOS security measures and your device passcode/biometric authentication.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Connected Apps and Data Sharing
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            When you connect third-party apps like Apple Health or Google Calendar, we only access the specific data needed for those features. All connected apps start in the OFF position. You must explicitly enable each app before any data sharing begins. You can disconnect apps at any time from Settings.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Apple Health Integration
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            When you enable Apple Health integration, we request permission to read specific health data from your Apple Health app. This includes blood type, height, weight, steps, heart rate, sleep hours, exercise minutes, and blood pressure. You must grant permission through iOS system prompts before any data is accessed. You can revoke these permissions at any time through your iPhone Settings → Privacy → Health → SteadiDay. Apple Health data is only stored locally on your device and is not uploaded to our servers unless you explicitly enable cloud sync for your account. We do not share Apple Health data with any third parties.
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Important:</Text> SteadiDay is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease. The health data displayed from Apple Health is for informational and wellness tracking purposes only. Always consult with a qualified healthcare provider for medical advice.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Your Privacy Rights
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Access:</Text> Request a copy of all your data at any time
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Correction:</Text> Update or correct your information in the app
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Deletion:</Text> Request deletion of your account and all associated data
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Portability:</Text> Export your data in a standard format
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Opt-out:</Text> Disable notifications, location tracking, or analytics at any time
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Cookies and Tracking
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            We do not use cookies or tracking technologies for advertising. We only collect anonymous usage statistics to improve the app, and you can opt out of this in Settings.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Subscription and Payment Information
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            If you subscribe to premium features, your payment is processed through Apple (App Store). We do not directly collect or store your payment card information. Apple handles all payment processing according to their privacy policy. We receive confirmation of your subscription status to provide premium features, but we do not have access to your payment details.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Children and Privacy
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            SteadiDay is designed for adults aged 50-70. We do not knowingly collect information from anyone under 18 years of age.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Changes to This Policy
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            We may update this privacy policy from time to time. We will notify you of significant changes through the app or by email. Your continued use of the app after changes means you accept the updated policy.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Contact Us
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            If you have questions about this privacy policy or your data, contact us through the Feedback feature in Settings.
          </Text>

          {/* Link to Full Policy */}
          <Pressable
            onPress={openPrivacyPolicy}
            className="flex-row items-center justify-center py-4 mb-8"
            accessibilityRole="link"
          >
            <Text className="text-base font-semibold mr-2" style={{ color: primary }}>
              Read full privacy policy online
            </Text>
            <Ionicons name="open-outline" size={18} color={primary} />
          </Pressable>
        </ScrollView>
      </View>
      </Screen>
    </ScreenErrorBoundary>
  );
}
