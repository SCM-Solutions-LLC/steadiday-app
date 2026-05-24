import React, { useEffect, useRef, useState } from "react";
import { View, Text, Modal, Pressable, AppState, Platform, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import {
  checkHealthConnectAvailability,
  openHealthConnectSettings,
  openHealthConnectPlayStore,
  type HealthConnectAvailability,
} from "../utils/healthConnectSync";
import { requestHealthPermissions, checkHealthPermissions } from "../utils/healthSync";
import { logger } from "../utils/logger";

type ModalVariant = "permissions-required" | "not-installed" | "not-supported" | "sandbox";

interface HealthConnectPermissionModalProps {
  visible: boolean;
  variant: ModalVariant;
  onClose: () => void;
  onPermissionsGranted: () => void;
}

export default function HealthConnectPermissionModal({
  visible,
  variant,
  onClose,
  onPermissionsGranted,
}: HealthConnectPermissionModalProps) {
  const { colors, primary, primaryLight } = useTheme();
  const awaitingReturnRef = useRef(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSettingsError(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || variant !== "permissions-required") return;

    const subscription = AppState.addEventListener("change", async (nextState) => {
      if (nextState === "active" && awaitingReturnRef.current) {
        awaitingReturnRef.current = false;
        const granted = await checkHealthPermissions();
        if (granted) {
          onPermissionsGranted();
        }
      }
    });

    return () => subscription.remove();
  }, [visible, variant, onPermissionsGranted]);

  const handleOpenSettings = async () => {
    awaitingReturnRef.current = true;
    setSettingsError(null);

    // Fallback 1: native Health Connect settings via react-native-health-connect
    try {
      await openHealthConnectSettings();
      return;
    } catch {
      logger.log("[HealthConnectModal] Native openHealthConnectSettings failed, trying content URI");
    }

    // Fallback 2: Health Connect content URI
    try {
      const canOpen = await Linking.canOpenURL("content://com.google.android.apps.healthdata");
      if (canOpen) {
        await Linking.openURL("content://com.google.android.apps.healthdata");
        return;
      }
    } catch {
      logger.log("[HealthConnectModal] Health Connect content URI failed, trying general settings");
    }

    // Fallback 3: general Android settings
    try {
      await Linking.openSettings();
      return;
    } catch {
      logger.log("[HealthConnectModal] Linking.openSettings() also failed");
    }

    // All fallbacks exhausted — show user-facing error
    awaitingReturnRef.current = false;
    setSettingsError(
      "Could not open Health Connect settings automatically. Please open your device Settings, find Health Connect under Apps, and grant SteadiDay the requested permissions."
    );
  };

  const handleInstall = async () => {
    await openHealthConnectPlayStore();
    onClose();
  };

  if (variant === "not-installed") {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Pressable
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={onClose}
        >
          <Pressable
            className="w-full max-w-sm rounded-3xl p-6"
            style={{
              backgroundColor: colors.cardBackground,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 8,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center mb-5">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: "#FEF9C3" }}
              >
                <Ionicons name="download-outline" size={36} color="#CA8A04" />
              </View>
            </View>

            <Text
              className="text-xl font-semibold text-center mb-3"
              style={{ color: colors.textPrimary }}
            >
              Health Connect Required
            </Text>

            <Text
              className="text-base text-center mb-6 leading-relaxed"
              style={{ color: colors.textSecondary, lineHeight: 22 }}
            >
              Health Connect is not installed on your device. You can install it for free from the Google Play Store to sync your health data with SteadiDay.
            </Text>

            <View>
              <Pressable
                onPress={handleInstall}
                className="py-4 rounded-2xl items-center justify-center mb-3"
                style={{ backgroundColor: primary, minHeight: 52 }}
                accessibilityRole="button"
                accessibilityLabel="Install from Play Store"
              >
                <Text className="text-base font-semibold" style={{ color: "#FFFFFF" }}>
                  Install from Play Store
                </Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                className="py-4 rounded-2xl items-center justify-center"
                style={{
                  backgroundColor: colors.cardBackground,
                  borderWidth: 1.5,
                  borderColor: colors.inputBorder,
                  minHeight: 52,
                }}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  if (variant === "not-supported") {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Pressable
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={onClose}
        >
          <Pressable
            className="w-full max-w-sm rounded-3xl p-6"
            style={{
              backgroundColor: colors.cardBackground,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 8,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center mb-5">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: "#FEE2E2" }}
              >
                <Ionicons name="alert-circle" size={36} color="#DC2626" />
              </View>
            </View>

            <Text
              className="text-xl font-semibold text-center mb-3"
              style={{ color: colors.textPrimary }}
            >
              Health Connect Not Supported
            </Text>

            <Text
              className="text-base text-center mb-6 leading-relaxed"
              style={{ color: colors.textSecondary, lineHeight: 22 }}
            >
              Health Connect requires Android 9 or later. Your device may not support this feature.
            </Text>

            <Pressable
              onPress={onClose}
              className="py-4 rounded-2xl items-center justify-center"
              style={{ backgroundColor: primary, minHeight: 52 }}
              accessibilityRole="button"
              accessibilityLabel="OK"
            >
              <Text className="text-base font-semibold" style={{ color: "#FFFFFF" }}>
                OK
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  if (variant === "sandbox") {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Pressable
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={onClose}
        >
          <Pressable
            className="w-full max-w-sm rounded-3xl p-6"
            style={{
              backgroundColor: colors.cardBackground,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 8,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center mb-5">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: primaryLight }}
              >
                <Ionicons name="information-circle" size={36} color={primary} />
              </View>
            </View>

            <Text
              className="text-xl font-semibold text-center mb-3"
              style={{ color: colors.textPrimary }}
            >
              Health Connect Preview
            </Text>

            <Text
              className="text-base text-center mb-6 leading-relaxed"
              style={{ color: colors.textSecondary, lineHeight: 22 }}
            >
              Health Connect cannot be fully tested in this preview environment. To use Health Connect, please run SteadiDay on a physical Android device.
            </Text>

            <Pressable
              onPress={onClose}
              className="py-4 rounded-2xl items-center justify-center"
              style={{ backgroundColor: primary, minHeight: 52 }}
              accessibilityRole="button"
              accessibilityLabel="OK"
            >
              <Text className="text-base font-semibold" style={{ color: "#FFFFFF" }}>
                OK
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  // Default: permissions-required
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-sm rounded-3xl p-6"
          style={{
            backgroundColor: colors.cardBackground,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 8,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="items-center mb-5">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: primaryLight }}
            >
              <Ionicons name="fitness" size={36} color={primary} />
            </View>
          </View>

          <Text
            className="text-xl font-semibold text-center mb-3"
            style={{ color: colors.textPrimary }}
          >
            Health Connect Permissions Required
          </Text>

          <Text
            className="text-base text-center mb-6 leading-relaxed"
            style={{ color: colors.textSecondary, lineHeight: 22 }}
          >
            {"To use Health Connect with SteadiDay, you need to allow SteadiDay to access your Health Connect data. Tap Open Health Connect Settings, choose SteadiDay, and allow the requested permissions."}
          </Text>

          {settingsError && (
            <View
              className="rounded-2xl p-4 mb-4"
              style={{ backgroundColor: "#FEE2E2" }}
            >
              <View className="flex-row items-start">
                <Ionicons name="warning" size={18} color="#DC2626" style={{ marginTop: 2 }} />
                <Text
                  className="text-sm flex-1 ml-2 leading-relaxed"
                  style={{ color: "#991B1B", lineHeight: 20 }}
                >
                  {settingsError}
                </Text>
              </View>
            </View>
          )}

          <View>
            <Pressable
              onPress={handleOpenSettings}
              className="py-4 rounded-2xl items-center justify-center mb-3"
              style={{ backgroundColor: primary, minHeight: 52 }}
              accessibilityRole="button"
              accessibilityLabel="Open Health Connect Settings"
            >
              <View className="flex-row items-center">
                <Ionicons name="settings-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text className="text-base font-semibold" style={{ color: "#FFFFFF" }}>
                  Open Health Connect Settings
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={onClose}
              className="py-4 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1.5,
                borderColor: colors.inputBorder,
                minHeight: 52,
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export type { ModalVariant as HealthConnectModalVariant };
