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
import { setPin, enableBiometric, disableBiometric } from "../utils/pinStorage";
import {
  checkBiometricSupport,
  getBiometricName,
} from "../utils/biometricAuth";
import { SessionManager } from "../utils/sessionManager";
import { isDemoPin, activateDemoMode } from "../utils/demoMode";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import CustomSwitch from "../components/CustomSwitch";
import { useConfirmModal } from "../components/ConfirmModal";

type Props = {
  navigation: NativeStackNavigationProp<
    OnboardingStackParamList,
    "Authentication"
  >;
};

export default function CreateAccountScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();
  const [firstName, setFirstName] = useState("");
  const [pin, setLocalPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [useBiometric, setUseBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState("Face ID");

  const setUserName = useUserStore((s) => s.setUserName);
  const setUserAuth = useAppStore((s) => s.setUserAuth);
  const { alert } = useConfirmModal();

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const { isSupported } = await checkBiometricSupport();
    setBiometricAvailable(isSupported);

    if (isSupported) {
      const name = await getBiometricName();
      setBiometricName(name);
      // Default to enabled if available
      setUseBiometric(true);
    }
  };

  const handleContinue = async () => {
    SessionManager.updateActivity();

    // Validate first name
    if (!firstName.trim()) {
      alert("Name Required", "Please enter your first name.");
      return;
    }

    // Validate PIN
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      alert("Invalid PIN", "Please enter a 4-digit PIN.");
      return;
    }

    if (pin !== confirmPin) {
      alert("PIN Mismatch", "PINs do not match. Please try again.");
      setConfirmPin("");
      return;
    }

    // DEV ONLY: demo PIN activates demo mode for local testing
    if (isDemoPin(pin)) {
      await activateDemoMode();
      // Continue with normal flow - don't return early
    }

    // Store PIN securely (including demo PIN 0000)
    const pinSet = await setPin(pin);

    if (!pinSet) {
      alert(
        "Error",
        "Failed to set up PIN. Please try again."
      );
      return;
    }

    // Enable/disable biometric
    if (useBiometric && biometricAvailable) {
      await enableBiometric();
    } else {
      await disableBiometric();
    }

    // Store user information
    setUserName(firstName.trim());

    // Set authentication info (no email collection)
    setUserAuth({
      provider: "local",
      email: undefined,
      userId: `local-${Date.now()}`,
      isAuthenticated: true,
      emailVerified: false,
      welcomeEmailSent: false,
      accountCreatedAt: new Date().toISOString(),
    });

    // Navigate to next onboarding step (streamlined flow)
    navigation.navigate("LegalConsent");
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
                <Text style={{ color: primary }} className="text-xl font-semibold ml-2">
                  Back
                </Text>
              </View>
            </Pressable>

            {/* Header */}
            <View className="mb-8">
              <Text
                style={{ color: colors.textPrimary }}
                className="text-4xl font-bold mb-2"
                maxFontSizeMultiplier={1.3}
              >
                Create Account
              </Text>
              <Text
                style={{ color: colors.textSecondary }}
                className="text-lg"
                maxFontSizeMultiplier={1.2}
              >
                Let{"'"}s set up your SteadiDay
              </Text>
            </View>

            {/* First Name */}
            <View className="mb-6">
              <Text style={{ color: colors.textPrimary }} className="text-lg font-semibold mb-2">
                What should we call you?
              </Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                autoCapitalize="words"
                autoComplete="name"
                style={{
                  backgroundColor: colors.cardBackground,
                  color: colors.textPrimary,
                  borderColor: colors.border
                }}
                className="rounded-2xl px-6 py-5 text-xl border-2"
                placeholderTextColor={colors.textSecondary}
                maxFontSizeMultiplier={1.3}
              />
            </View>

            {/* PIN Creation */}
            <View className="mb-6">
              <Text style={{ color: colors.textPrimary }} className="text-lg font-semibold mb-1">
                Create a PIN
              </Text>
              <Text style={{ color: colors.textTertiary }} className="text-base mb-2">
                4 digits
              </Text>
              <TextInput
                value={pin}
                onChangeText={setLocalPin}
                placeholder="Enter 4-digit PIN"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                style={{
                  backgroundColor: colors.cardBackground,
                  color: colors.textPrimary,
                  borderColor: colors.border
                }}
                className="rounded-2xl px-6 py-5 text-2xl text-center border-2 mb-4"
                placeholderTextColor={colors.textSecondary}
                maxFontSizeMultiplier={1.3}
              />

              <Text style={{ color: colors.textPrimary }} className="text-lg font-semibold mb-1">
                Confirm PIN
              </Text>
              <Text style={{ color: colors.textTertiary }} className="text-base mb-2">
                4 digits
              </Text>
              <TextInput
                value={confirmPin}
                onChangeText={setConfirmPin}
                placeholder="Re-enter PIN"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                style={{
                  backgroundColor: colors.cardBackground,
                  color: colors.textPrimary,
                  borderColor: colors.border
                }}
                className="rounded-2xl px-6 py-5 text-2xl text-center border-2"
                placeholderTextColor={colors.textSecondary}
                maxFontSizeMultiplier={1.3}
              />
            </View>

            {/* Biometric Setup */}
            {biometricAvailable && (
              <View
                style={{
                  backgroundColor: colors.primaryLight,
                  borderColor: primary + "40"
                }}
                className="rounded-2xl p-5 mb-8 border"
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1 pr-4">
                    <Text style={{ color: colors.textPrimary }} className="text-lg font-semibold mb-1">
                      Use {biometricName} to open SteadiDay
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="text-base">
                      Unlock faster with biometric authentication
                    </Text>
                  </View>
                  <CustomSwitch
                    value={useBiometric}
                    onValueChange={(value: boolean) => setUseBiometric(value)}
                    inactiveTrackColor={colors.border}
                    activeTrackColor={primary}
                    activeThumbColor="#FFFFFF"
                    inactiveThumbColor="#FFFFFF"
                  />
                </View>
              </View>
            )}

            {/* Continue Button */}
            <Button
              title="Continue"
              onPress={handleContinue}
              variant="primary"
              size="large"
              fullWidth
              accessibilityLabel="Continue to create account"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
