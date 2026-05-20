import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../state/stores/settingsStore";
import { SessionManager } from "../utils/sessionManager";
import { useTheme } from "../utils/useTheme";
import * as LocalAuthentication from "expo-local-authentication";
import { logger } from "../utils/logger";

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [lockReason, setLockReason] = useState<string>(""); // Track why app was locked
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // CRITICAL: Check if store has hydrated before rendering themed content
  const hasHydrated = useSettingsStore((s) => s._hasHydrated);

  const { colors, primary } = useTheme();
  const storedPin = useSettingsStore((s) => s.appPin);
  const rememberMe = useSettingsStore((s) => s.rememberMe);
  const biometricEnabled = useSettingsStore((s) => s.biometricEnabled);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [localRememberMe, setLocalRememberMe] = useState(rememberMe);

  // SECURITY: Show friendly message explaining why app is locked
  // Attack Story 2 defense: User sees clear explanation
  useEffect(() => {
    if (SessionManager.isSessionLocked()) {
      setLockReason("Your app was locked for security after being inactive.");
    } else {
      setLockReason("");
    }
  }, []);

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  // Attempt Face ID automatically if enabled and available (after hydration)
  useEffect(() => {
    if (hasHydrated && biometricEnabled && biometricAvailable) {
      handleBiometricAuth();
    }
  }, [hasHydrated, biometricEnabled, biometricAvailable]);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch (error) {
      logger.log("Biometric check error:", error);
      setBiometricAvailable(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock SteadiDay",
        cancelLabel: "Use PIN",
        disableDeviceFallback: true,
      });

      if (result.success) {
        setError("");
        setPin("");
        updateSettings({
          rememberMe: localRememberMe,
          lastUnlockTime: new Date().toISOString(),
        });
        await SessionManager.unlock();
        onUnlock();
      }
    } catch (error) {
      logger.log("Biometric auth error:", error);
    }
  };

  const handleNumberPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        // Auto-submit when 4 digits are entered
        setTimeout(async () => {
          if (newPin === storedPin) {
            setError("");
            setPin("");
            // Update remember me and last unlock time
            updateSettings({
              rememberMe: localRememberMe,
              lastUnlockTime: new Date().toISOString(),
            });

            // SECURITY: Unlock the session manager
            // This resets inactivity and background timers
            await SessionManager.unlock();

            onUnlock();
          } else {
            setError("Incorrect PIN. Please try again.");
            setPin("");
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError("");
  };

  // CRITICAL: Show loading while store hydrates to avoid blue flash (wrong theme)
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F3EF", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#6B8E6B" />
      </View>
    );
  }

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1 items-center justify-center px-10">
        {/* App Logo/Icon */}
        <View style={{ backgroundColor: primary, borderRadius: 999, padding: 32, marginBottom: 32 }}>
          <Ionicons name="lock-closed" size={64} color="white" />
        </View>

        <Text style={{ fontSize: 30, fontWeight: "600", color: colors.textPrimary, marginBottom: 12 }}>
          Welcome Back
        </Text>
        <Text style={{ fontSize: 18, color: colors.textSecondary, textAlign: "center", marginBottom: 16 }}>
          Enter your PIN to access SteadiDay
        </Text>

        {/* SECURITY: Show lock reason if session timed out */}
        {lockReason && (
          <View style={{ borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, backgroundColor: colors.warning + "20", borderColor: colors.warning }}>
            <Text style={{ fontSize: 16, textAlign: "center", color: colors.textPrimary }}>
              {lockReason}
            </Text>
          </View>
        )}

        {/* Face ID / Biometric Button - Above PIN display for visibility */}
        {biometricEnabled && biometricAvailable && (
          <Pressable
            onPress={handleBiometricAuth}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primaryLight || (primary + "20"),
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
            className="active:opacity-70"
            accessibilityLabel="Unlock with Face ID"
            accessibilityRole="button"
          >
            <Ionicons name="scan" size={40} color={primary} />
          </Pressable>
        )}

        {/* PIN Display */}
        <View className="flex-row mb-8">
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                marginHorizontal: 8,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pin.length > index ? primary : colors.border
              }}
            >
              {pin.length > index && (
                <View className="w-4 h-4 rounded-full bg-white" />
              )}
            </View>
          ))}
        </View>

        {/* Error Message */}
        {error !== "" && (
          <Text style={{ color: colors.error, fontSize: 16, marginBottom: 16, textAlign: "center" }}>{error}</Text>
        )}

        {/* Remember Me Checkbox */}
        <Pressable
          onPress={() => setLocalRememberMe(!localRememberMe)}
          className="flex-row items-center mb-6"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: localRememberMe }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: localRememberMe ? primary : colors.border,
              backgroundColor: localRememberMe ? primary : "transparent",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12
            }}
          >
            {localRememberMe && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text style={{ fontSize: 16, color: colors.textSecondary }}>Remember me for 30 days</Text>
        </Pressable>

        {/* Number Pad */}
        <View className="w-full max-w-xs">
          <View className="flex-row justify-around mb-4">
            {[1, 2, 3].map((num) => (
              <Pressable
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                style={{ width: 72, height: 72, borderRadius: 999, backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
                className="active:opacity-70"
              >
                <Text style={{ fontSize: 28, fontWeight: "600", color: colors.textPrimary }}>
                  {num}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row justify-around mb-4">
            {[4, 5, 6].map((num) => (
              <Pressable
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                style={{ width: 72, height: 72, borderRadius: 999, backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
                className="active:opacity-70"
              >
                <Text style={{ fontSize: 28, fontWeight: "600", color: colors.textPrimary }}>
                  {num}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row justify-around mb-4">
            {[7, 8, 9].map((num) => (
              <Pressable
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                style={{ width: 72, height: 72, borderRadius: 999, backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
                className="active:opacity-70"
              >
                <Text style={{ fontSize: 28, fontWeight: "600", color: colors.textPrimary }}>
                  {num}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row justify-around">
            {/* Face ID button or empty space */}
            {biometricEnabled && biometricAvailable ? (
              <Pressable
                onPress={handleBiometricAuth}
                style={{ width: 72, height: 72, borderRadius: 999, backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
                className="active:opacity-70"
                accessibilityLabel="Unlock with Face ID"
              >
                <Ionicons name="scan" size={28} color={primary} />
              </Pressable>
            ) : (
              <View style={{ width: 72, height: 72 }} />
            )}

            {/* Zero */}
            <Pressable
              onPress={() => handleNumberPress("0")}
              style={{ width: 72, height: 72, borderRadius: 999, backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
              className="active:opacity-70"
            >
              <Text style={{ fontSize: 28, fontWeight: "600", color: colors.textPrimary }}>0</Text>
            </Pressable>

            {/* Delete */}
            <Pressable
              onPress={handleDelete}
              style={{ width: 72, height: 72, borderRadius: 999, backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
              className="active:opacity-70"
            >
              <Ionicons name="backspace" size={26} color={colors.error} />
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}
