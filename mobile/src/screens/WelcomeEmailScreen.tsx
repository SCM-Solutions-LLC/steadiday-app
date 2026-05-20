import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { useUserStore } from "../state/stores/userStore";
import { sendWelcomeEmail, generateVerificationLink, openWelcomeEmailComposer } from "../api/email-service";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { useConfirmModal } from "../components/ConfirmModal";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "WelcomeEmailScreen">;
};

export default function WelcomeEmailScreen({ navigation }: Props) {
  const [isResending, setIsResending] = useState(false);
  const { colors } = useTheme();
  const { alert } = useConfirmModal();

  // User data from useUserStore
  const userProfile = useUserStore((s) => s.userProfile);
  const setUserAuth = useUserStore((s) => s.setUserAuth);

  const userName = userProfile.name || "there";
  const userEmail = userProfile.auth?.email || "";
  const userId = userProfile.auth?.userId || "";

  // Determine if email was provided during signup
  const hasEmail = userEmail.trim().length > 0;

  const handleResendEmail = async () => {
    setIsResending(true);

    try {
      const verificationLink = generateVerificationLink(userId, userEmail);
      const result = await sendWelcomeEmail({
        userName,
        userEmail,
        verificationLink,
      });

      if (result.success) {
        alert(
          "Email Sent!",
          "We have sent a new verification email to your inbox. Please check your email."
        );
      } else {
        alert(
          "Unable to Send",
          "Email service is not configured yet. You can continue using the app without verification."
        );
      }
    } catch (error) {
      alert(
        "Error",
        "Failed to resend verification email. Please try again later."
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleOpenMailComposer = async () => {
    const verificationLink = generateVerificationLink(userId, userEmail);
    const success = await openWelcomeEmailComposer({
      userName,
      userEmail,
      verificationLink,
    });

    if (!success) {
      alert(
        "Email Not Available",
        "Mail composer is not available on this device."
      );
    }
  };

  const handleContinue = () => {
    // v1.0: Skip SteadiDayOffers screen (IAP disabled), go directly to LegalConsent
    navigation.navigate("LegalConsent");
  };

  const handleVerifyLater = () => {
    // Mark that user chose to verify later
    if (userProfile.auth) {
      setUserAuth({
        ...userProfile.auth,
        welcomeEmailSent: true,
      });
    }
    // v1.0: Skip SteadiDayOffers screen (IAP disabled), go directly to LegalConsent
    navigation.navigate("LegalConsent");
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-10 py-12">
          {/* Header Icon */}
          <View className="items-center mb-8">
            <View style={{ backgroundColor: colors.primary, borderRadius: 999, padding: 24, marginBottom: 24 }}>
              <Ionicons name={hasEmail ? "mail-open" : "checkmark-circle"} size={64} color="white" />
            </View>
            <Text style={{ fontSize: 36, fontWeight: "600", color: colors.textPrimary, textAlign: "center", marginBottom: 16, lineHeight: 40 }}>
              Welcome to SteadiDay!
            </Text>
            <Text style={{ fontSize: 20, color: colors.textSecondary, textAlign: "center", lineHeight: 28 }}>
              Hi {userName}, we are excited to have you here
            </Text>
          </View>

          {/* Email Verification Card - Only show if email was provided */}
          {hasEmail && (
            <View style={{ backgroundColor: colors.cardBackground, borderRadius: 24, padding: 32, marginBottom: 24, borderWidth: 2, borderColor: colors.border }}>
              <View className="items-center mb-6">
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              </View>

              <Text style={{ fontSize: 24, fontWeight: "600", color: colors.textPrimary, textAlign: "center", marginBottom: 16 }}>
                Verification Email Sent
              </Text>

              <Text style={{ fontSize: 18, color: colors.textSecondary, textAlign: "center", lineHeight: 28, marginBottom: 24 }}>
                We have sent a verification email to:
              </Text>

              <View style={{ backgroundColor: colors.primaryLight, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.primary + "40" }}>
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.primary, textAlign: "center" }}>
                  {userEmail}
                </Text>
              </View>

              <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24, marginBottom: 8 }}>
                Please check your email and click the verification link to confirm your account.
              </Text>

              <Text style={{ fontSize: 16, color: colors.textTertiary, lineHeight: 24 }}>
                Note: Email service is currently in setup mode. In production, you will receive an actual email.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="space-y-4 mb-6">
            {/* Continue Button */}
            <Button
              title="Continue"
              onPress={handleContinue}
              variant="primary"
              size="large"
              fullWidth
              accessibilityLabel="Continue to app setup"
              style={{ marginBottom: 16 }}
            />

            {/* Only show email-related buttons if email was provided */}
            {hasEmail && (
              <>
                {/* Resend Email Button */}
                <Button
                  title="Resend Verification Email"
                  onPress={handleResendEmail}
                  variant="outline"
                  size="large"
                  fullWidth
                  disabled={isResending}
                  loading={isResending}
                  icon={!isResending ? <Ionicons name="refresh" size={20} color={colors.primary} /> : undefined}
                  accessibilityLabel="Resend verification email"
                  style={{ marginBottom: 16 }}
                />

                {/* Open Mail Composer (for manual sending) */}
                <Button
                  title="Open Email Client"
                  onPress={handleOpenMailComposer}
                  variant="secondary"
                  size="large"
                  fullWidth
                  icon={<Ionicons name="mail" size={20} color={colors.textSecondary} />}
                  accessibilityLabel="Open email client"
                />
              </>
            )}
          </View>

          {/* Skip Link - Only show if email was provided */}
          {hasEmail && (
            <Pressable
              onPress={handleVerifyLater}
              className="items-center py-4"
              accessibilityRole="button"
              accessibilityLabel="Verify email later"
            >
              <Text style={{ fontSize: 16, color: colors.textTertiary, fontWeight: "600" }}>
                I will verify my email later
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
