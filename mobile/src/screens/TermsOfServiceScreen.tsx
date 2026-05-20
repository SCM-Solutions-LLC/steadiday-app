import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { ScreenErrorBoundary, BackButton } from "../components/ui";
import { openTermsOfService } from "../utils/openURL";

export default function TermsOfServiceScreen() {
  const { colors, primary } = useTheme();

  return (
    <ScreenErrorBoundary screenName="TermsOfService">
      <Screen variant="static" edges={["top"]}>
        <View className="flex-1">
        {/* Sticky Header */}
        <View className="px-6 pt-4 pb-5" style={{ backgroundColor: colors.cardBackground }}>
          <BackButton label="Settings" />
          <Text className="text-2xl font-semibold mt-4" style={{ color: colors.textPrimary }}>Terms of Service</Text>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            Last Updated: December 14, 2025
          </Text>

          {/* View Full Terms Online Button */}
          <Button
            title="View Full Terms Online"
            onPress={openTermsOfService}
            variant="primary"
            size="large"
            fullWidth
            icon={<Ionicons name="globe-outline" size={24} color="white" />}
            accessibilityLabel="View full terms of service online"
            style={{ marginBottom: 24 }}
          />

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Agreement to Terms
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            By using SteadiDay, you agree to these Terms of Service. If you do not agree, please do not use the app. These terms govern your use of all features and services provided by SteadiDay.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Description of Service
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            SteadiDay is a personal assistant app that helps you manage medications, tasks, contacts, and daily activities. The app provides reminders, health tracking, trusted contact features, and integration with other health and calendar apps.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            User Responsibilities
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Accurate Information:</Text> You are responsible for providing accurate medication schedules, contact information, and health data.
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Account Security:</Text> Keep your login credentials secure. You are responsible for all activity under your account.
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Proper Use:</Text> Use the app only for personal, non-commercial purposes as intended.
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Emergency Services:</Text> Do not rely solely on this app for emergency medical situations. Always call 911 or your local emergency number in case of emergency.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            What SteadiDay Is NOT
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Not a replacement for medical advice, diagnosis, or treatment
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Not a substitute for professional healthcare providers
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Not an emergency response service
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Not a medical device or FDA-approved medical application
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            • Not liable for health outcomes based on data displayed from Apple Health or other integrations
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Service Availability
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            We strive to keep SteadiDay available 24/7, but we cannot guarantee uninterrupted service. We may need to perform maintenance, updates, or repairs that temporarily limit access. We are not responsible for service interruptions due to factors beyond our control.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            User Content and Data
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            You retain ownership of all data you enter into SteadiDay. You grant us permission to store and process this data to provide the service. You can export or delete your data at any time through Settings.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Third-Party Integrations
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            SteadiDay can connect to third-party services like Apple Health, Google Calendar, and medication management apps. These integrations are optional and start in the OFF position. When you enable a connection, you also agree to that third party&apos;s terms and privacy policy. We are not responsible for third-party services or their practices.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Apple Health Integration Terms
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            When you enable Apple Health integration, you acknowledge and agree that:
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • All health data from Apple Health is provided &quot;as is&quot; for informational purposes only
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • We do not verify, validate, or guarantee the accuracy of Apple Health data
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • You should not make medical decisions based solely on this data
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Any health concerns should be discussed with a qualified healthcare provider
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • We are not liable for any health outcomes, decisions, or consequences related to Apple Health data displayed in the app
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            • The app does not diagnose, treat, prevent, or cure any medical condition
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Prohibited Activities
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            You may not:
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Use the app for illegal purposes
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Attempt to hack, reverse engineer, or compromise app security
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Share your account with others
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            • Misrepresent your identity or provide false information
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Limitation of Liability
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            SteadiDay and its developers are not liable for any damages arising from your use of the app, including missed reminders, incorrect data entry, service outages, or reliance on app features. This includes but is not limited to health outcomes, medical decisions, or consequences related to Apple Health data or any other health-related features. The app is provided without warranty of any kind. See our full Liability Waiver for complete details.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Changes to Terms
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            We may update these Terms of Service at any time. We will notify you of significant changes through the app or by email. Continued use of the app after changes means you accept the updated terms.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Termination
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            You may stop using SteadiDay and delete your account at any time through Settings. We may suspend or terminate your access if you violate these terms or engage in prohibited activities.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Subscription Terms
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Premium Features:</Text> Certain features may require a paid subscription.
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Billing:</Text> Subscriptions are billed through the App Store. Payment is charged to your Apple ID account.
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Auto-Renewal:</Text> Subscriptions automatically renew unless you turn off auto-renewal at least 24 hours before the end of the current period in your Apple ID settings.
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Free Trial:</Text> If offered, free trials allow you to test premium features. You will be charged when the trial ends unless you cancel beforehand.
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            <Text className="font-semibold">Refunds:</Text> Refund requests are handled by Apple according to their App Store policies. We cannot provide direct refunds.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Governing Law
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            These terms are governed by the laws of the jurisdiction where Vibecode Company operates. Any disputes will be resolved in the courts of that jurisdiction.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Contact Information
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            Questions about these terms? Contact us through the Feedback feature in Settings.
          </Text>

          {/* Link to Full Terms */}
          <Pressable
            onPress={openTermsOfService}
            className="flex-row items-center justify-center py-4 mb-8"
            accessibilityRole="link"
          >
            <Text className="text-base font-semibold mr-2" style={{ color: primary }}>
              Read full terms of service online
            </Text>
            <Ionicons name="open-outline" size={18} color={primary} />
          </Pressable>
        </ScrollView>
      </View>
      </Screen>
    </ScreenErrorBoundary>
  );
}
