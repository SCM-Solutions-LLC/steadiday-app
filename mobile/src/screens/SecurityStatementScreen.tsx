import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { BackButton } from "../components/ui";
import { openSecurity } from "../utils/openURL";

export default function SecurityStatementScreen() {
  const { colors, primary } = useTheme();

  return (
    <Screen variant="static" edges={["top"]}>
      <View className="flex-1">
        <View className="px-6 pt-4 pb-5">
          <BackButton label="Settings" />
          <Text className="text-2xl font-semibold mt-4" style={{ color: colors.textPrimary }}>Security Statement</Text>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>Last Updated: November 30, 2025</Text>

          {/* View Full Security Statement Online Button */}
          <Button
            title="View Full Statement Online"
            onPress={openSecurity}
            variant="primary"
            size="large"
            fullWidth
            icon={<Ionicons name="globe-outline" size={24} color="white" />}
            accessibilityLabel="View full security statement online"
            style={{ marginBottom: 24 }}
          />

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Our Security Commitment</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            SteadiDay takes security seriously. We use industry-standard practices to protect your personal and health information from unauthorized access, loss, or misuse.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Data Encryption</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            All data is encrypted both in transit and at rest. We use TLS/SSL encryption for data transmission and AES-256 encryption for stored data. Your passwords are hashed using industry-standard algorithms and never stored in plain text.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Authentication Security</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            We support secure authentication methods including email/password, OAuth (Google/Facebook), and biometric authentication (Face ID/Touch ID). Multi-factor authentication options may be added in future updates.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Device Security</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            Your data is stored locally on your device using secure encrypted storage provided by the operating system. We recommend enabling device passcodes and biometric locks for additional protection.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Regular Security Audits</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            We conduct regular security reviews and updates. Our development team follows secure coding practices and stays current with security best practices for mobile applications.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Third-Party Security</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            When you connect third-party apps, we use secure APIs and OAuth protocols. We only request the minimum necessary permissions and never share your credentials with third parties.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Apple Health Security</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            When you enable Apple Health integration, all data is accessed through Apple HealthKit framework, which is secured by iOS security architecture. Apple Health data is protected by your device passcode and biometric authentication (Face ID/Touch ID). We only access Apple Health data when you explicitly grant permissions through iOS system prompts. Apple Health data is stored locally on your device and is not uploaded to our servers unless you enable cloud sync for your account. You can revoke Apple Health permissions at any time through your iPhone Settings.
          </Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>What You Can Do</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• Use a strong, unique password</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• Enable biometric authentication</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• Keep your device OS updated</Text>
          <Text className="text-base leading-relaxed mb-2" style={{ color: colors.textSecondary }}>• Do not share your login credentials</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>• Review connected apps periodically</Text>

          <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.textPrimary }}>Reporting Security Issues</Text>
          <Text className="text-base leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
            If you discover a security vulnerability, please report it through the Feedback feature in Settings. We take all reports seriously and will respond promptly.
          </Text>

          {/* Link to Full Security Statement */}
          <Pressable
            onPress={openSecurity}
            className="flex-row items-center justify-center py-4 mb-8"
            accessibilityRole="link"
          >
            <Text className="text-base font-semibold mr-2" style={{ color: primary }}>
              Read full security statement online
            </Text>
            <Ionicons name="open-outline" size={18} color={primary} />
          </Pressable>
        </ScrollView>
      </View>
    </Screen>
  );
}
