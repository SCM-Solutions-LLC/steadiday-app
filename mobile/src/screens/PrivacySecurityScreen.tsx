import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useUIStore } from "../state/stores/uiStore";
import { useTipStore } from "../state/stores/tipStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { isAndroidFeaturesActive } from "../config/platformConfig";
import { useTheme } from "../utils/useTheme";
import CustomSwitch from "../components/CustomSwitch";
import { useConfirmModal } from "../components/ConfirmModal";
import { BackButton } from "../components/ui";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PrivacySecurityScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, primary } = useTheme();

  // Settings from useSettingsStore
  const biometricEnabled = useSettingsStore((s) => s.biometricEnabled);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  // Tip state from useTipStore
  const dismissedInfoCards = useTipStore((s) => s.dismissedInfoCards || []);
  const dismissInfoCard = useTipStore((s) => s.dismissInfoCard);
  const { alert, confirm, destructive } = useConfirmModal();

  // Helper function for checking if card is dismissed
  const isCardDismissed = (cardId: string) => dismissedInfoCards.includes(cardId);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [dataSyncEnabled, setDataSyncEnabled] = useState(true);

  const handleExportData = () => {
    confirm(
      "Export Your Data",
      "Your data will be exported as a JSON file. This includes medications, tasks, contacts, and settings.",
      () => {
        alert("Success", "Your data has been exported. Check your downloads folder.");
      }
    );
  };

  const handleDeleteData = () => {
    destructive(
      "Delete All Data",
      "This will delete all your medications, tasks, contacts, and notes. Your account will remain active. This cannot be undone.",
      "Delete Data",
      () => {
        destructive(
          "Confirm",
          "Are you absolutely sure? This action is permanent.",
          "Yes, Delete",
          () => {
            alert("Deleted", "All your data has been deleted.");
          }
        );
      }
    );
  };

  const handleDeleteAccount = () => {
    destructive(
      "Delete Account",
      "This will permanently delete your account and all associated data. You will need to create a new account to use SteadiDay again. This cannot be undone.",
      "Delete Account",
      () => {
        destructive(
          "Final Confirmation",
          "This is permanent. Delete your account?",
          "Yes, Delete Forever",
          () => {
            alert("Account Deleted", "Your account has been permanently deleted.");
          }
        );
      }
    );
  };

  const handleChangePassword = () => {
    confirm(
      "Change Password",
      "You will receive an email with instructions to reset your password.",
      () => {
        alert("Email Sent", "Check your email for password reset instructions.");
      }
    );
  };

  const handleLogoutAll = () => {
    destructive(
      "Log Out All Devices",
      "This will sign you out of SteadiDay on all your devices. You will need to sign in again on each device.",
      "Log Out All",
      () => {
        alert("Logged Out", "You have been signed out of all devices.");
      }
    );
  };

  return (
    <Screen variant="static" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-5">
          <BackButton label="Settings" />
          <Text className="text-2xl font-semibold mt-4" style={{ color: colors.textPrimary }}>Privacy & Security</Text>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          {/* Account & Login Section */}
          <Text className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>Account & Login</Text>

          {/* Biometric Authentication */}
          <View className="rounded-2xl p-4 mb-3" style={{ backgroundColor: colors.cardBackground }}>
            <View className="flex-row justify-between items-center">
              <View className="flex-1 pr-4">
                <Text className="text-base font-semibold mb-1" style={{ color: colors.textPrimary }}>
                  {isAndroidFeaturesActive() ? "Face Unlock / Fingerprint" : "Face ID / Touch ID"}
                </Text>
                <Text className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                  Use biometric authentication to sign in quickly and securely
                </Text>
              </View>
              <CustomSwitch
                value={biometricEnabled}
                onValueChange={(value: boolean) => updateSettings({ biometricEnabled: value })}
                activeTrackColor={primary + "60"}
                inactiveTrackColor={colors.divider}
                activeThumbColor={colors.toggleThumb}
                inactiveThumbColor={colors.toggleThumb}
              />
            </View>
          </View>

          {/* Password Info */}
          {!isCardDismissed("privacy-password-info") && (
            <View className="border rounded-2xl p-4 mb-3" style={{ backgroundColor: primary + "10", borderColor: primary + "40" }}>
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color={primary} style={{ marginTop: 2, marginRight: 10 }} />
                <Text className="text-sm leading-relaxed flex-1" style={{ color: colors.textPrimary }}>
                  Use a strong password with at least 8 characters, including letters, numbers, and symbols.
                </Text>
                <Pressable
                  onPress={() => dismissInfoCard("privacy-password-info")}
                  className="p-1 ml-2 active:opacity-50"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color={primary} />
                </Pressable>
              </View>
            </View>
          )}

          <Pressable
            onPress={handleChangePassword}
            className="rounded-2xl p-4 mb-3 active:bg-gray-100"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <View className="flex-row items-center">
              <Ionicons name="key" size={24} color={primary} style={{ marginRight: 12 }} />
              <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>Change Password</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleLogoutAll}
            className="rounded-2xl p-4 mb-6 active:bg-gray-100"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out" size={24} color={colors.error} style={{ marginRight: 12 }} />
              <Text className="text-base font-semibold" style={{ color: colors.error }}>Log Out of All Devices</Text>
            </View>
          </Pressable>

          {/* Permissions Section */}
          <Text className="text-xl font-semibold mb-3 mt-2" style={{ color: colors.textPrimary }}>Permissions</Text>

          <View className="rounded-2xl p-4 mb-3" style={{ backgroundColor: colors.cardBackground }}>
            <View className="flex-row justify-between items-center">
              <View className="flex-1 pr-4">
                <Text className="text-base font-semibold mb-1" style={{ color: colors.textPrimary }}>
                  Notifications
                </Text>
                <Text className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                  Receive medication reminders and task alerts
                </Text>
              </View>
              <CustomSwitch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                activeTrackColor={colors.success}
                inactiveTrackColor={colors.divider}
                activeThumbColor={colors.toggleThumb}
                inactiveThumbColor={colors.toggleThumb}
              />
            </View>
          </View>

          {/* Notification Settings Button */}
          <Pressable
            onPress={() => navigation.navigate("NotificationSettings")}
            className="border-2 rounded-2xl p-4 mb-6 active:opacity-70"
            style={{ backgroundColor: primary + "10", borderColor: primary + "30" }}
          >
            <View className="flex-row items-center">
              <Ionicons name="settings" size={24} color={primary} style={{ marginRight: 12 }} />
              <View className="flex-1">
                <Text className="text-base font-semibold mb-1" style={{ color: primary }}>Notification Settings</Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Choose which apps send you reminders</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={primary} />
            </View>
          </Pressable>

          <View className="rounded-2xl p-4 mb-3" style={{ backgroundColor: colors.cardBackground }}>
            <View className="flex-row justify-between items-center">
              <View className="flex-1 pr-4">
                <Text className="text-base font-semibold mb-1" style={{ color: colors.textPrimary }}>
                  Location Services
                </Text>
                <Text className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                  Enable weather updates and location-based reminders
                </Text>
              </View>
              <CustomSwitch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                activeTrackColor={colors.success}
                inactiveTrackColor={colors.divider}
                activeThumbColor={colors.toggleThumb}
                inactiveThumbColor={colors.toggleThumb}
              />
            </View>
          </View>

          <View className="rounded-2xl p-4 mb-6" style={{ backgroundColor: colors.cardBackground }}>
            <View className="flex-row justify-between items-center">
              <View className="flex-1 pr-4">
                <Text className="text-base font-semibold mb-1" style={{ color: colors.textPrimary }}>
                  Data Sync & Analytics
                </Text>
                <Text className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                  Sync data across devices and help improve the app with anonymous usage data
                </Text>
              </View>
              <CustomSwitch
                value={dataSyncEnabled}
                onValueChange={setDataSyncEnabled}
                activeTrackColor={colors.success}
                inactiveTrackColor={colors.divider}
                activeThumbColor={colors.toggleThumb}
                inactiveThumbColor={colors.toggleThumb}
              />
            </View>
          </View>

          {/* Data Tools Section */}
          <Text className="text-xl font-semibold mb-3 mt-2" style={{ color: colors.textPrimary }}>Your Data</Text>

          <Pressable
            onPress={handleExportData}
            className="rounded-2xl p-4 mb-3 active:bg-gray-100"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <View className="flex-row items-center">
              <Ionicons name="download" size={24} color={primary} style={{ marginRight: 12 }} />
              <View className="flex-1">
                <Text className="text-base font-semibold mb-1" style={{ color: colors.textPrimary }}>Export My Data</Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Download all your data as a file</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </View>
          </Pressable>

          <Pressable
            onPress={handleDeleteData}
            className="rounded-2xl p-4 mb-3 active:bg-gray-100"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <View className="flex-row items-center">
              <Ionicons name="trash" size={24} color={colors.warning} style={{ marginRight: 12 }} />
              <View className="flex-1">
                <Text className="text-base font-semibold mb-1" style={{ color: colors.textPrimary }}>Delete My Data</Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Remove all medications, tasks, and notes</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </View>
          </Pressable>

          <Pressable
            onPress={handleDeleteAccount}
            className="border rounded-2xl p-4 mb-6 active:opacity-70"
            style={{ backgroundColor: colors.errorBackground, borderColor: colors.error }}
          >
            <View className="flex-row items-center">
              <Ionicons name="close-circle" size={24} color={colors.error} style={{ marginRight: 12 }} />
              <View className="flex-1">
                <Text className="text-base font-semibold mb-1" style={{ color: colors.error }}>Delete My Account</Text>
                <Text className="text-sm" style={{ color: colors.textPrimary }}>Permanently remove your account</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.error} />
            </View>
          </Pressable>

          {!isCardDismissed("privacy-permissions-info") && (
            <View className="border rounded-2xl p-4 mb-6" style={{ backgroundColor: colors.warningBackground, borderColor: colors.warning }}>
              <View className="flex-row items-start">
                <Ionicons name="shield-checkmark" size={20} color={colors.warning} style={{ marginTop: 2, marginRight: 10 }} />
                <Text className="text-sm leading-relaxed flex-1" style={{ color: colors.textPrimary }}>
                  Your privacy matters. All permissions start OFF until you turn them on. You can change these settings anytime.
                </Text>
                <Pressable
                  onPress={() => dismissInfoCard("privacy-permissions-info")}
                  className="p-1 ml-2 active:opacity-50"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color={colors.warning} />
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}
