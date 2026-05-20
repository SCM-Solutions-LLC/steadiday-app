import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { useTheme } from "../utils/useTheme";
import { BackButton } from "../components/ui";

export default function DataBreachResponseScreen() {
  const { colors } = useTheme();

  return (
    <Screen variant="static" edges={["top"]}>
      <View className="flex-1">
        <View className="px-6 pt-4 pb-5">
          <BackButton label="Settings" />
          <Text className="text-2xl font-semibold mt-4" style={{ color: colors.textPrimary }}>Data Breach Response</Text>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>Last Updated: November 30, 2025</Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Our Commitment</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            We take data security seriously and have procedures in place to respond quickly if your data is ever compromised. This plan outlines what we do and what you should do.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Detection and Assessment</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            We monitor our systems continuously for security issues. If we detect unauthorized access or a data breach, our team immediately assesses the scope, identifies affected data, and begins containment.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Immediate Response (First 24 Hours)</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• Stop the breach and secure affected systems</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• Determine what data was accessed</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• Identify affected users</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>• Begin forensic investigation</Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>User Notification</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            If your data is affected, we will notify you within 72 hours through email and in-app notification. We will explain what data was compromised, what we are doing about it, and what steps you should take.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>What We Tell You</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• What happened and when</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• What data was affected (including any Apple Health data if applicable)</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• What we have done to fix it</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• Steps you should take to protect yourself</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>• Contact information for questions</Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Apple Health Data Protection</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            Apple Health data is stored locally on your device and protected by iOS security architecture. In the event of a server breach, Apple Health data accessed through our app remains secure on your device. However, if you have enabled cloud sync for your account, any synced health data will be treated with the highest priority in our breach response procedures.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Your Steps After a Breach</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• Change your password immediately</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• Enable two-factor authentication if available</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• Review your account for suspicious activity</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• Monitor your email for phishing attempts</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>• Contact us if you notice anything unusual</Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Law Enforcement and Regulators</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            For serious breaches, we will notify law enforcement and relevant regulatory authorities as required by law. We cooperate fully with investigations to identify and prosecute attackers.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Prevention Measures</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            After any incident, we review and improve our security measures. We conduct post-incident analysis, update security protocols, and implement additional safeguards to prevent future breaches.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Questions or Concerns</Text>
          <Text className="text-base leading-relaxed mb-8" style={{ color: colors.textSecondary }}>
            If you believe your account has been compromised, contact us immediately through the Feedback feature in Settings. We will investigate and help secure your account.
          </Text>
        </ScrollView>
      </View>
    </Screen>
  );
}
