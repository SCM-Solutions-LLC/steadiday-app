import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { useAppStore } from "../state/appStore";
import { useUserStore } from "../state/stores/userStore";
import { verifyPin, isBiometricEnabled } from "../utils/pinStorage";
import {
  checkBiometricSupport,
  getBiometricName,
  authenticateWithBiometrics,
} from "../utils/biometricAuth";
import { SessionManager } from "../utils/sessionManager";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { useConfirmModal } from "../components/ConfirmModal";

type Props = {
  navigation: NativeStackNavigationProp<
    OnboardingStackParamList,
    "Authentication"
  >;
};

export default function LoginScreen({ navigation }: Props) {
  const [pin, setPin] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState("Face ID");
  const [showBiometricButton, setShowBiometricButton] = useState(false);

  const setUserAuth = useAppStore((s) => s.setUserAuth);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const currentIsAuthenticated = useAppStore((s) => s.isAuthenticated);
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);
  const { colors, primary } = useTheme();
  const { alert, confirm } = useConfirmModal();

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const { isSupported } = await checkBiometricSupport();
    setBiometricAvailable(isSupported);

    if (isSupported) {
      const name = await getBiometricName();
      setBiometricName(name);

      // Check if biometric is enabled by user
      const enabled = await isBiometricEnabled();
      setShowBiometricButton(enabled);
    }
  };

  const handlePinLogin = async () => {
    SessionManager.updateActivity();

    if (!pin || pin.length !== 4) {
      alert("Invalid PIN", "Please enter a 4-digit PIN.");
      return;
    }

    setIsAuthenticating(true);

    const isValid = await verifyPin(pin);

    if (isValid) {
      // Set authentication status
      // The RootNavigator will automatically show MainTabs if hasCompletedOnboarding is true
      // or continue with onboarding if hasCompletedOnboarding is false
      setUserAuth({
        provider: "local",
        userId: `local-${Date.now()}`,
        isAuthenticated: true,
        accountCreatedAt: new Date().toISOString(),
      });

      // If user can log in with PIN, they must have completed onboarding before
      // This handles the case where hasCompletedOnboarding was incorrectly reset
      if (!hasCompletedOnboarding) {
        completeOnboarding();
      }

      // No explicit navigation needed - RootNavigator will react to auth change
      // If onboarding is complete, user goes to MainTabs
      // If onboarding is not complete, user continues onboarding
    } else {
      alert(
        "Incorrect PIN",
        "The PIN you entered is incorrect. Please try again."
      );
      setPin("");
    }

    setIsAuthenticating(false);
  };

  const handleBiometricLogin = async () => {
    SessionManager.updateActivity();
    setIsAuthenticating(true);

    const result = await authenticateWithBiometrics(
      "Unlock SteadiDay"
    );

    if (result.success) {
      // Set authentication status
      // The RootNavigator will automatically show MainTabs if hasCompletedOnboarding is true
      // or continue with onboarding if hasCompletedOnboarding is false
      setUserAuth({
        provider: "local",
        userId: `local-${Date.now()}`,
        isAuthenticated: true,
        accountCreatedAt: new Date().toISOString(),
      });

      // If user can log in with biometrics, they must have completed onboarding before
      // This handles the case where hasCompletedOnboarding was incorrectly reset
      if (!hasCompletedOnboarding) {
        completeOnboarding();
      }

      // No explicit navigation needed - RootNavigator will react to auth change
    } else {
      alert(
        "Authentication Failed",
        "Please try again or use your PIN."
      );
    }

    setIsAuthenticating(false);
  };

  const handleForgotPin = () => {
    SessionManager.updateActivity();
    confirm(
      "Reset your PIN",
      `To reset your PIN, confirm your identity using ${biometricName} or your device passcode. Your information stays on this device.`,
      async () => {
        setIsAuthenticating(true);

        const result = await authenticateWithBiometrics(
          "Authenticate to reset your PIN"
        );

        setIsAuthenticating(false);

        if (result.success) {
          // Navigate to create account to set new PIN
          navigation.navigate("Authentication", { mode: "create" });
        } else {
          alert(
            "PIN Reset Cancelled",
            "Unable to verify your identity. Please try again."
          );
        }
      }
    );
  };

  return (
    <Screen variant="keyboard" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        >
          <View className="flex-1 px-8 py-6">
            {/* Back Button */}
            <Pressable
              onPress={() => navigation.goBack()}
              className="mb-6"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <View className="flex-row items-center">
                <Ionicons name="arrow-back" size={28} color={primary} />
                <Text
                  style={{ color: primary }}
                  className="text-xl font-semibold ml-2"
                >
                  Back
                </Text>
              </View>
            </Pressable>

            {/* Content Container */}
            <View className="flex-1 justify-center">
              {/* Header */}
              <View className="mb-8">
                <Text
                  style={{ color: colors.textPrimary }}
                  className="text-4xl font-bold mb-2"
                  maxFontSizeMultiplier={1.3}
                >
                  Welcome back
                </Text>
                <Text
                  style={{ color: colors.textSecondary }}
                  className="text-lg"
                  maxFontSizeMultiplier={1.2}
                >
                  Enter your PIN to continue
                </Text>
              </View>

              {/* PIN Input */}
              <View className="mb-6">
                <Text
                  style={{ color: colors.textPrimary }}
                  className="text-lg font-semibold mb-3"
                >
                  Enter your PIN
                </Text>
                <TextInput
                  value={pin}
                  onChangeText={setPin}
                  placeholder="Enter 4-digit PIN"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  editable={!isAuthenticating}
                  style={{
                    backgroundColor: colors.cardBackground,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  }}
                  className="rounded-2xl px-6 py-5 text-2xl text-center border-2"
                  placeholderTextColor={colors.textSecondary}
                  maxFontSizeMultiplier={1.3}
                  autoFocus
                />
              </View>

              {/* Biometric Button - Show FIRST so it's visible above keyboard */}
              {showBiometricButton && (
                <Button
                  title={`Use ${biometricName}`}
                  onPress={handleBiometricLogin}
                  variant="outline"
                  size="large"
                  fullWidth
                  disabled={isAuthenticating}
                  icon={
                    <Ionicons
                      name={
                        biometricName === "Face ID"
                          ? "scan"
                          : "finger-print"
                      }
                      size={24}
                      color={primary}
                    />
                  }
                  accessibilityLabel={`Use ${biometricName}`}
                  style={{ marginBottom: 16 }}
                />
              )}

              {/* Open App Button */}
              <Button
                title="Open SteadiDay"
                onPress={handlePinLogin}
                variant="primary"
                size="large"
                fullWidth
                disabled={isAuthenticating}
                loading={isAuthenticating}
                accessibilityLabel="Open SteadiDay"
                style={{ marginBottom: 16 }}
              />

              {/* Forgot PIN Link */}
              <Pressable
                onPress={handleForgotPin}
                disabled={isAuthenticating}
                className="items-center py-4"
                accessibilityRole="button"
              >
                <Text
                  style={{ color: primary }}
                  className="text-lg font-semibold"
                  maxFontSizeMultiplier={1.2}
                >
                  Forgot PIN?
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
