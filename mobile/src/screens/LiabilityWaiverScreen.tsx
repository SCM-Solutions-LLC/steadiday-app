import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import { BackButton } from "../components/ui";

export default function LiabilityWaiverScreen() {
  const { colors } = useTheme();

  return (
    <Screen variant="scroll" edges={["top"]}>
      <View className="flex-1">
        {/* Sticky Header */}
        <View className="px-6 pt-4 pb-5" style={{ backgroundColor: colors.cardBackground }}>
          <BackButton label="Settings" />
          <Text className="text-2xl font-semibold mt-4" style={{ color: colors.textPrimary }}>Liability Waiver</Text>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          <View className="border rounded-2xl p-4 mb-4" style={{ backgroundColor: "#FFF4E5", borderColor: "#F59E0B" }}>
            <View className="flex-row items-start">
              <Ionicons name="alert-circle" size={24} color="#F59E0B" style={{ marginTop: 2, marginRight: 12 }} />
              <Text className="text-base font-semibold flex-1" style={{ color: colors.textPrimary }}>
                Important: Please read this waiver carefully. By using SteadiDay, you acknowledge and accept these limitations.
              </Text>
            </View>
          </View>

          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            Last Updated: December 14, 2025
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Nature of the Service
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            SteadiDay is a personal organization and reminder tool. It is designed to help you manage daily tasks, medications, and contacts. It is NOT a medical device, medical service, emergency response system, or substitute for professional healthcare.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            No Medical Advice or Treatment
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            The app does not provide medical advice, diagnosis, or treatment. Any health information you receive through the app, including data from Apple Health or other integrations, is for informational purposes only. Always consult your doctor, pharmacist, or other qualified healthcare provider before making medical decisions.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Apple Health Data Disclaimer
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            When you enable Apple Health integration, you acknowledge and accept that:
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • All Apple Health data is displayed for informational and wellness tracking purposes only
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • We do not verify, validate, or guarantee the accuracy of Apple Health data
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Apple Health data should not be used as the sole basis for medical decisions
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • We are not responsible for the accuracy, completeness, or reliability of data from Apple Health
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            • We disclaim all liability for health outcomes or medical decisions based on Apple Health data
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Medication Reminders Are Not Guaranteed
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            While the app provides medication reminders, we cannot guarantee that all reminders will work perfectly. Reminders may fail due to device settings, software bugs, network issues, or other technical problems. You remain fully responsible for taking your medications correctly and on time.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Not an Emergency Service
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            SteadiDay is not an emergency response service. The trusted contact features send messages to your designated contacts, but we cannot guarantee message delivery. In a real emergency, always call 911 or your local emergency number immediately. Do not rely on this app for emergency medical assistance.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Fall Detection Limitations
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            If you use fall detection features, understand that they may not detect all falls and may trigger false alarms. Fall detection relies on device sensors that can be affected by normal movements, device placement, and other factors. This feature is a convenience tool, not a medical monitoring device.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Accuracy of Information
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            You are responsible for entering accurate information into the app. We are not responsible for consequences arising from incorrect medication schedules, contact information, or other data you provide. Always verify critical information with your healthcare providers.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Technical Limitations
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            The app may experience:
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Software bugs or glitches
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Service interruptions or downtime
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Data sync failures
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Notification delivery problems
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            • Compatibility issues with your device or other apps
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Release of Liability
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            You release and hold harmless SteadiDay, Vibecode Company, and all developers, employees, and partners from any claims, damages, losses, or expenses arising from:
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Missed medication doses
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Failed or delayed notifications
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Incorrect information in the app
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Service outages or technical failures
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Reliance on app features for medical decisions
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Any health outcomes related to app use
          </Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
            • Inaccuracies, errors, or omissions in Apple Health data
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            • Medical decisions or health outcomes based on Apple Health data or any other health-related features
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Assumption of Risk
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            By using SteadiDay, you acknowledge that you understand these limitations and assume all risks associated with using the app. You agree to use the app as a supplemental tool only, not as your primary method for managing medications, emergencies, or health decisions.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Maximum Liability
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            To the fullest extent permitted by law, our maximum liability for any claims related to the app is limited to the amount you paid for the app in the past 12 months, or $100, whichever is less.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Subscription and Payment Limitations
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            We are not responsible for any issues related to subscription billing, payment processing, or refunds. All payment matters are handled by Apple through the App Store. Subscription cancellations must be done through your Apple ID settings at least 24 hours before the renewal date.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Your Responsibilities
          </Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            You agree to maintain backup systems for critical tasks like medication management. Do not rely solely on SteadiDay. Use pill organizers, calendar systems, and work with your healthcare providers to ensure medication safety.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>
            Acknowledgment
          </Text>
          <Text className="text-base leading-relaxed mb-8" style={{ color: colors.textSecondary }}>
            By using SteadiDay, you confirm that you have read, understood, and agree to this Liability Waiver. If you do not agree, you should not use the app.
          </Text>
        </ScrollView>
      </View>
    </Screen>
  );
}
