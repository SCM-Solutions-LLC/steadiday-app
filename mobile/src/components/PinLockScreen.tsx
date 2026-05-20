import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { verifyPin, isBiometricEnabled } from "../utils/pinStorage";
import {
  checkBiometricSupport,
  getBiometricName,
  authenticateWithBiometrics,
} from "../utils/biometricAuth";
import { SessionManager } from "../utils/sessionManager";
import { useConfirmModal } from "./ConfirmModal";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";

type Props = {
  visible: boolean;
  onUnlock: () => void;
  onForgotPin?: () => void;
};

export default function PinLockScreen({ visible, onUnlock, onForgotPin }: Props) {
  const [pin, setPin] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState("Face ID");
  const [showBiometricButton, setShowBiometricButton] = useState(false);
  const { alert, confirm } = useConfirmModal();

  // Use app theme colors instead of hardcoded blue
  const { primary, colors, isDark } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  useEffect(() => {
    if (visible) {
      checkBiometric();
    }
  }, [visible]);

  const checkBiometric = async () => {
    const { isSupported } = await checkBiometricSupport();
    setBiometricAvailable(isSupported);

    if (isSupported) {
      const name = await getBiometricName();
      setBiometricName(name);

      // Check if biometric is enabled by user
      const enabled = await isBiometricEnabled();
      setShowBiometricButton(enabled);

      // Auto-trigger biometric on mount if enabled
      if (enabled) {
        setTimeout(() => handleBiometricUnlock(), 300);
      }
    }
  };

  const handlePinUnlock = async () => {
    if (!pin || pin.length !== 4) {
      alert("Invalid PIN", "Please enter a 4-digit PIN.");
      return;
    }

    setIsAuthenticating(true);

    const isValid = await verifyPin(pin);

    if (isValid) {
      setPin("");
      // Unlock the session
      await SessionManager.unlock();
      onUnlock();
    } else {
      alert(
        "Incorrect PIN",
        "The PIN you entered is incorrect. Please try again."
      );
      setPin("");
    }

    setIsAuthenticating(false);
  };

  const handleBiometricUnlock = async () => {
    setIsAuthenticating(true);

    const result = await authenticateWithBiometrics("Unlock SteadiDay");

    if (result.success) {
      setPin("");
      // Unlock the session
      await SessionManager.unlock();
      onUnlock();
    } else {
      // Authentication failed - show error message
      alert(
        "Authentication Failed",
        "Face ID authentication was not successful. Please try again or use your PIN."
      );
    }

    setIsAuthenticating(false);
  };

  const handleForgotPinPress = () => {
    if (onForgotPin) {
      onForgotPin();
    } else {
      // Default behavior: use biometric to reset
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
            // Unlock the session
            await SessionManager.unlock();
            alert(
              "PIN Reset",
              "Please set a new PIN in Settings → Security after unlocking."
            );
            onUnlock();
          } else {
            alert(
              "PIN Reset Cancelled",
              "Unable to verify your identity. Please try again."
            );
          }
        }
      );
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        // Prevent dismissing the lock screen
      }}
    >
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        edges={["top", "bottom"]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 px-8 justify-center">
              {/* App Icon / Title */}
              <View className="items-center mb-12">
                <View
                  className="rounded-full p-6 mb-6"
                  style={{ backgroundColor: primary }}
                >
                  <Ionicons name="lock-closed" size={48} color="white" />
                </View>
                <Text
                  className={`${textClasses.largeTitle} font-bold mb-2`}
                  style={{ color: colors.textPrimary }}
                  maxFontSizeMultiplier={1.3}
                >
                  SteadiDay
                </Text>
                <Text
                  className={`${textClasses.body}`}
                  style={{ color: colors.textSecondary }}
                  maxFontSizeMultiplier={1.2}
                >
                  Enter your PIN to continue
                </Text>
              </View>

              {/* PIN Input */}
              <View className="mb-6">
                <Text
                  className={`${textClasses.body} font-semibold mb-3`}
                  style={{ color: colors.textPrimary }}
                >
                  Enter PIN
                </Text>
                <TextInput
                  value={pin}
                  onChangeText={setPin}
                  placeholder="Enter 4-digit PIN"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  editable={!isAuthenticating}
                  className="rounded-2xl px-6 py-5 text-2xl text-center"
                  style={{
                    backgroundColor: colors.cardBackground,
                    color: colors.textPrimary,
                    borderWidth: 2,
                    borderColor: colors.border,
                  }}
                  placeholderTextColor={colors.textSecondary}
                  maxFontSizeMultiplier={1.3}
                  autoFocus
                />
              </View>

              {/* Unlock Button */}
              <Pressable
                onPress={handlePinUnlock}
                disabled={isAuthenticating || pin.length < 4}
                className="rounded-2xl px-8 py-6 items-center mb-4"
                style={{
                  backgroundColor: pin.length >= 4 ? primary : colors.divider,
                  opacity: pin.length >= 4 ? 1 : 0.6,
                }}
                accessibilityRole="button"
              >
                {isAuthenticating && !showBiometricButton ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    className={`${textClasses.body} font-semibold`}
                    style={{ color: pin.length >= 4 ? "#FFFFFF" : colors.textSecondary }}
                    maxFontSizeMultiplier={1.3}
                  >
                    Unlock
                  </Text>
                )}
              </Pressable>

              {/* Biometric Button - Always visible when available */}
              {showBiometricButton && (
                <Pressable
                  onPress={handleBiometricUnlock}
                  disabled={isAuthenticating}
                  className="rounded-2xl px-8 py-6 items-center mb-4 flex-row justify-center"
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderWidth: 2,
                    borderColor: primary,
                  }}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={
                      biometricName === "Face ID" ? "scan" : "finger-print"
                    }
                    size={24}
                    color={primary}
                  />
                  <Text
                    className={`${textClasses.body} font-semibold ml-2`}
                    style={{ color: primary }}
                    maxFontSizeMultiplier={1.3}
                  >
                    Use {biometricName}
                  </Text>
                </Pressable>
              )}

              {/* Forgot PIN Link */}
              <Pressable
                onPress={handleForgotPinPress}
                disabled={isAuthenticating}
                className="items-center py-4"
                accessibilityRole="button"
              >
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: primary }}
                  maxFontSizeMultiplier={1.2}
                >
                  Forgot PIN?
                </Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
