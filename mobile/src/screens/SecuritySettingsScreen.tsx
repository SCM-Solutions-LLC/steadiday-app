import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Share } from "react-native";
import { Screen } from "../components/Screen";
import { SubpageHeader } from "../components/ui";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTipStore } from "../state/stores/tipStore";
import { useAppStore } from "../state/appStore";
import { useTaskStore } from "../state/stores/taskStore";
import { useMedicationStore } from "../state/stores/medicationStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useIntegrationsStore } from "../state/stores/integrationsStore";
import { useUserStore } from "../state/stores/userStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useAuth } from "../auth/hooks";
import { clearAuthTokens } from "../security/secureStorage";
import {
  setPin,
  verifyPin,
  hasPinSetup,
  deletePin,
  enableBiometric as enableBiometricStorage,
  disableBiometric as disableBiometricStorage,
  isBiometricEnabled,
} from "../utils/pinStorage";
import {
  checkBiometricSupport,
  getBiometricName,
  authenticateWithBiometrics,
} from "../utils/biometricAuth";
import { SessionManager } from "../utils/sessionManager";
import { useTheme } from "../utils/useTheme";
import { useConfirmModal } from "../components/ConfirmModal";
import { logger } from "../utils/logger";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "SecuritySettings">;
};

export default function SecuritySettingsScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();

  // Tip state from useTipStore
  const dismissedInfoCards = useTipStore((s) => s.dismissedInfoCards || []);
  const dismissInfoCard = useTipStore((s) => s.dismissInfoCard);

  // Non-UI data from useAppStore
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);
  const clearUserAuth = useAppStore((s) => s.clearUserAuth);
  const { logout, isAuthenticated } = useAuth();
  const { alert, confirm, destructive } = useConfirmModal();

  // Helper function for checking if card is dismissed
  const isCardDismissed = (cardId: string) => dismissedInfoCards.includes(cardId);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState("Face ID");
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // PRIVACY FEATURES: Track loading states for Download/Delete actions
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    checkPinAndBiometric();
  }, []);

  const checkPinAndBiometric = async () => {
    // Check if PIN is set up
    const pinSetup = await hasPinSetup();
    setPinEnabled(pinSetup);

    // Check biometric availability
    const { isSupported } = await checkBiometricSupport();
    setBiometricAvailable(isSupported);

    if (isSupported) {
      const name = await getBiometricName();
      setBiometricName(name);

      // Check if biometric is enabled
      const enabled = await isBiometricEnabled();
      setBiometricEnabled(enabled);
    }
  };

  const handleToggleSecurity = () => {
    SessionManager.updateActivity();

    if (!pinEnabled) {
      // Enable security - need to set up PIN
      setIsChangingPin(false);
      setShowPinSetup(true);
    } else {
      // Disable security
      destructive(
        "Disable App Lock",
        "Are you sure you want to disable app lock? This will remove PIN protection.",
        "Disable",
        async () => {
          await deletePin();
          await disableBiometricStorage();
          setPinEnabled(false);
          setBiometricEnabled(false);
        }
      );
    }
  };

  const handleSetPin = async () => {
    SessionManager.updateActivity();

    if (newPin.length !== 4) {
      alert("Invalid PIN", "PIN must be 4 digits.");
      return;
    }

    if (newPin !== confirmPin) {
      alert("PIN Mismatch", "PINs do not match. Please try again.");
      setConfirmPin("");
      return;
    }

    const success = await setPin(newPin);

    if (!success) {
      alert("Error", "Failed to set PIN. Please try again.");
      return;
    }

    setPinEnabled(true);
    alert(
      "App Lock Enabled",
      "Your app is now protected with a PIN. You'll need to enter it when opening the app."
    );

    setShowPinSetup(false);
    setNewPin("");
    setConfirmPin("");
    setCurrentPin("");
    setIsChangingPin(false);
  };

  const handleChangePin = () => {
    setNewPin("");
    setConfirmPin("");
    setCurrentPin("");
    setIsChangingPin(true);
    setShowPinSetup(true);
  };

  const handleChangePinWithVerification = async () => {
    SessionManager.updateActivity();

    // For PIN change, we need biometric or current PIN verification
    // Since Alert.prompt is iOS-specific and can't be directly replaced,
    // we'll use biometric authentication as the primary method
    confirm(
      "Change PIN",
      `To change your PIN, please verify your identity using ${biometricName}.`,
      async () => {
        const result = await authenticateWithBiometrics(
          "Authenticate to change your PIN"
        );

        if (result.success) {
          handleChangePin();
        } else {
          alert("Authentication Failed", "Please try again.");
        }
      }
    );
  };

  const handleToggleBiometric = async () => {
    SessionManager.updateActivity();

    if (!biometricEnabled) {
      // Enable biometric
      const result = await authenticateWithBiometrics(
        `Enable ${biometricName} for SteadiDay`
      );

      if (result.success) {
        await enableBiometricStorage();
        setBiometricEnabled(true);
        alert(
          "Biometric Enabled",
          `${biometricName} has been enabled. You can now use it to unlock the app.`
        );
      }
    } else {
      // Disable biometric
      await disableBiometricStorage();
      setBiometricEnabled(false);
      alert(
        "Biometric Disabled",
        `${biometricName} has been disabled. You will need to use your PIN to unlock the app.`
      );
    }
  };

  const handleLogout = () => {
    SessionManager.updateActivity();

    destructive(
      "Log Out",
      "Are you sure you want to log out? You will need to log in again to access the app.",
      "Log Out",
      async () => {
        try {
          // SECURITY: Clear session manager state
          // This prevents returning to app with back navigation after logout
          const { SessionManager } = await import("../utils/sessionManager");
          await SessionManager.clearSession();

          // Clear Zustand auth state (this triggers navigation to login screen)
          clearUserAuth();

          // Perform logout (clears auth tokens)
          // Note: Do NOT reset onboarding here - user should go directly to login screen
          // and then to main app after successful login, not through onboarding again
          await logout();
        } catch (error) {
          alert("Error", "Failed to log out. Please try again.");
        }
      }
    );
  };

  /**
   * PRIVACY FEATURE: Download My Data
   * Exports all user data as JSON via the native share sheet
   */
  const handleDownloadData = async () => {
    setIsExporting(true);
    try {
      // Gather all user data from stores
      const userData = {
        exportDate: new Date().toISOString(),
        appVersion: "1.0.12",
        tasks: useTaskStore.getState().tasks,
        notes: useTaskStore.getState().notes,
        parkingSpot: useTaskStore.getState().parkingSpot,
        medications: useMedicationStore.getState().medications,
        medicationLogs: useMedicationStore.getState().medicationLogs,
        settings: {
          textSize: useSettingsStore.getState().textSize,
          colorTheme: useSettingsStore.getState().colorTheme,
          appearanceMode: useSettingsStore.getState().appearanceMode,
          highContrastEnabled: useSettingsStore.getState().highContrastEnabled,
          colorBlindModeEnabled: useSettingsStore.getState().colorBlindModeEnabled,
          voiceGuidanceEnabled: useSettingsStore.getState().voiceGuidanceEnabled,
          fallDetectionEnabled: useSettingsStore.getState().fallDetectionEnabled,
          language: useSettingsStore.getState().language,
        },
        integrations: useIntegrationsStore.getState().integrations,
        userProfile: useUserStore.getState().userProfile,
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(userData, null, 2);

      // Share via native share sheet
      await Share.share({
        message: jsonData,
        title: "SteadiDay Data Export",
      });

      // Track export for Android backup reminder timing
      try {
        const { markDataExported } = require("../components/home/BackupReminderBanner");
        await markDataExported();
      } catch (_e) {
        // Non-critical — banner timing won't update but export still works
      }
    } catch (error) {
      logger.error("Error exporting data:", error);
      alert("Error", "Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * PRIVACY FEATURE: Delete All My Data
   * Permanently deletes all local data (App Store requirement)
   */
  const handleDeleteAccount = () => {
    destructive(
      "Delete All My Data",
      "This will permanently delete all your data including medications, tasks, health records, and settings. This action cannot be undone.\n\nAre you sure you want to continue?",
      "Delete Everything",
      async () => {
        setIsDeleting(true);
        try {
          // Clear all AsyncStorage data
          await AsyncStorage.clear();

          // Clear secure storage
          await clearAuthTokens();

          // Show success message and reset to welcome screen
          alert(
            "Data Deleted",
            "All your data has been deleted. The app will now restart.",
          );

          // Small delay to let user see the message
          setTimeout(() => {
            // Reset onboarding to show welcome screen
            resetOnboarding();

            // Navigate to welcome screen
            navigation.reset({
              index: 0,
              routes: [{ name: "Welcome" as never }],
            });
          }, 1500);
        } catch (error) {
          logger.error("Error deleting data:", error);
          alert("Error", "Failed to delete data. Please try again.");
          setIsDeleting(false);
        }
      }
    );
  };

  return (
    <Screen variant="static" edges={["top"]}>
      <View className="flex-1">
        {/* Header - SENIOR-FRIENDLY: Labeled back button */}
        <SubpageHeader
          title="Security"
          backLabel="Settings"
          onBack={() => navigation.goBack()}
        />

        <ScrollView className="flex-1">
          {!showPinSetup ? (
            <View className="px-8 py-8">
              {/* App Lock Toggle */}
              <View style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }} className="rounded-3xl p-6 mb-6 border-2">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-1 mr-4">
                    <Text style={{ color: colors.textPrimary }} className="text-2xl font-semibold mb-2">
                      App Lock
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="text-base leading-relaxed">
                      Require a PIN to open the app
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleToggleSecurity}
                    style={{ backgroundColor: pinEnabled ? "#6DB193" : colors.border }}
                    className="w-16 h-9 rounded-full p-1"
                    accessibilityRole="switch"
                    accessibilityState={{ checked: pinEnabled }}
                  >
                    <View
                      className={`w-7 h-7 rounded-full bg-white ${
                        pinEnabled ? "ml-auto" : ""
                      }`}
                    />
                  </Pressable>
                </View>

                {pinEnabled && (
                  <>
                    <Pressable
                      onPress={handleChangePinWithVerification}
                      style={{ backgroundColor: primary + "20" }}
                      className="rounded-2xl px-6 py-4 flex-row items-center justify-center mb-3"
                    >
                      <Ionicons name="key" size={20} color={primary} />
                      <Text style={{ color: primary }} className="text-lg font-semibold ml-2">
                        Change PIN
                      </Text>
                    </Pressable>

                    {biometricAvailable && (
                      <Pressable
                        onPress={handleToggleBiometric}
                        style={{ backgroundColor: primary + "20" }}
                        className="rounded-2xl px-6 py-4 flex-row items-center justify-between"
                      >
                        <View className="flex-row items-center flex-1">
                          <Ionicons
                            name={biometricName === "Face ID" || biometricName === "Face Unlock" ? "scan" : "finger-print"}
                            size={20}
                            color={primary}
                          />
                          <Text style={{ color: primary }} className="text-lg font-semibold ml-2">
                            {biometricName}
                          </Text>
                        </View>
                        <View
                          style={{ backgroundColor: biometricEnabled ? primary : colors.border }}
                          className="w-12 h-6 rounded-full p-1"
                        >
                          <View
                            className={`w-4 h-4 rounded-full bg-white ${
                              biometricEnabled ? "ml-auto" : ""
                            }`}
                          />
                        </View>
                      </Pressable>
                    )}
                  </>
                )}
              </View>

              {/* Security Info */}
              {!isCardDismissed("security-settings-info") && (
                <View style={{ backgroundColor: primary + "10", borderColor: primary + "40" }} className="rounded-2xl p-6 border mb-6">
                  <View className="flex-row items-start">
                    <Ionicons
                      name="information-circle"
                      size={24}
                      color={primary}
                      style={{ marginRight: 12, marginTop: 2 }}
                    />
                    <View className="flex-1">
                      <Text style={{ color: colors.textPrimary }} className="text-base leading-relaxed">
                        When app lock is enabled, you will need to enter your 4-digit PIN each time you open the app. This helps protect your personal health and contact information.
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => dismissInfoCard("security-settings-info")}
                      className="p-1 ml-2 active:opacity-50"
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={24} color={primary} />
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Privacy & Security Summary */}
              {!isCardDismissed("privacy-security-summary") && (
                <View
                  className="rounded-2xl mb-6"
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    borderWidth: 1,
                    padding: 16,
                  }}
                >
                  <View className="flex-row items-start">
                    <Ionicons
                      name="shield-checkmark"
                      size={24}
                      color={primary}
                      style={{ marginRight: 12, marginTop: 2 }}
                    />
                    <View className="flex-1">
                      <Text style={{ color: colors.textPrimary }} className="text-xl font-semibold mb-2">
                        Your Privacy Matters
                      </Text>
                      <Text style={{ color: colors.textSecondary, lineHeight: 22 }} className="text-base mb-3">
                        SteadiDay keeps your personal data safe:
                      </Text>
                      <View style={{ gap: 8 }}>
                        <View className="flex-row items-start">
                          <Text style={{ color: colors.textSecondary }} className="text-base mr-2">•</Text>
                          <Text style={{ color: colors.textSecondary, lineHeight: 22 }} className="text-base flex-1">
                            Your health and personal data stays on your device
                          </Text>
                        </View>
                        <View className="flex-row items-start">
                          <Text style={{ color: colors.textSecondary }} className="text-base mr-2">•</Text>
                          <Text style={{ color: colors.textSecondary, lineHeight: 22 }} className="text-base flex-1">
                            Sensitive tokens stored in your device&apos;s secure keychain
                          </Text>
                        </View>
                        <View className="flex-row items-start">
                          <Text style={{ color: colors.textSecondary }} className="text-base mr-2">•</Text>
                          <Text style={{ color: colors.textSecondary, lineHeight: 22 }} className="text-base flex-1">
                            No passwords or medical data is ever logged or sent to our servers
                          </Text>
                        </View>
                        <View className="flex-row items-start">
                          <Text style={{ color: colors.textSecondary }} className="text-base mr-2">•</Text>
                          <Text style={{ color: colors.textSecondary, lineHeight: 22 }} className="text-base flex-1">
                            Only anonymous app usage data is transmitted securely to help us improve
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => dismissInfoCard("privacy-security-summary")}
                      className="p-2 -mr-1 -mt-1 active:opacity-50"
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel="Dismiss privacy information"
                    >
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Logout Button */}
              {isAuthenticated && (
                <Pressable
                  onPress={handleLogout}
                  className="bg-[#FFEBEE] rounded-2xl px-6 py-5 flex-row items-center justify-center border-2 border-[#EF5350] mb-6"
                  accessibilityRole="button"
                >
                  <Ionicons name="log-out-outline" size={24} color="#EF5350" />
                  <Text className="text-[#EF5350] text-xl font-semibold ml-3">
                    Log Out
                  </Text>
                </Pressable>
              )}

              {/* PRIVACY FEATURES: Download and Delete Data */}
              {/* GDPR/CCPA Compliance */}
              <Text style={{ color: colors.textPrimary }} className="text-2xl font-semibold mb-4">
                Your Privacy
              </Text>

              {/* Download Data Button */}
              <Pressable
                onPress={handleDownloadData}
                disabled={isExporting}
                style={{ borderColor: primary }}
                className="rounded-2xl px-6 py-5 flex-row items-center justify-between border-2 mb-4"
                accessibilityRole="button"
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="download-outline" size={24} color={primary} />
                  <Text style={{ color: primary }} className="text-lg font-semibold ml-3">
                    {isExporting ? "Preparing Your Data..." : "Download My Data"}
                  </Text>
                </View>
                {isExporting && <ActivityIndicator color={primary} />}
              </Pressable>

              {/* Delete Account Button */}
              <Pressable
                onPress={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-[#FFEBEE] rounded-2xl px-6 py-5 flex-row items-center justify-between border-2 border-[#EF5350]"
                accessibilityRole="button"
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="trash-outline" size={24} color="#EF5350" />
                  <Text className="text-[#EF5350] text-lg font-semibold ml-3">
                    {isDeleting ? "Deleting Data..." : "Delete All My Data"}
                  </Text>
                </View>
                {isDeleting && <ActivityIndicator color="#EF5350" />}
              </Pressable>
            </View>
          ) : (
            <View className="px-8 py-12">
              <View style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }} className="rounded-3xl p-8 border-2">
                <Text style={{ color: colors.textPrimary }} className="text-2xl font-semibold mb-4 text-center">
                  Set Up PIN
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-base text-center mb-8">
                  Choose a 4-digit PIN to protect your app
                </Text>

                <Text style={{ color: colors.textPrimary }} className="text-lg font-semibold mb-2">
                  Enter PIN
                </Text>
                <TextInput
                  value={newPin}
                  onChangeText={setNewPin}
                  placeholder="Enter 4-digit PIN"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary
                  }}
                  className="px-6 py-5 rounded-2xl text-2xl text-center mb-6 border-2"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={{ color: colors.textPrimary }} className="text-lg font-semibold mb-2">
                  Confirm PIN
                </Text>
                <TextInput
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  placeholder="Re-enter PIN"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary
                  }}
                  className="px-6 py-5 rounded-2xl text-2xl text-center mb-8 border-2"
                  placeholderTextColor={colors.textSecondary}
                />

                <View className="space-y-3">
                  <Pressable
                    onPress={handleSetPin}
                    style={{ backgroundColor: primary }}
                    className="rounded-2xl px-8 py-5 items-center"
                    accessibilityRole="button"
                  >
                    <Text className="text-white text-xl font-semibold">Set PIN</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setShowPinSetup(false);
                      setNewPin("");
                      setConfirmPin("");
                    }}
                    style={{ backgroundColor: colors.background }}
                    className="rounded-2xl px-8 py-5 items-center"
                    accessibilityRole="button"
                  >
                    <Text style={{ color: colors.textPrimary }} className="text-xl font-semibold">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}
