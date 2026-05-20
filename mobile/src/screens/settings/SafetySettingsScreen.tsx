import React, { useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useSafetySessionStore } from "../../state/stores/safetySessionStore";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import { CustomToggle } from "../../components/ui";
import * as Haptics from "expo-haptics";

/**
 * SafetySettingsScreen - Fall detection, emergency contacts, and safety features
 *
 * Senior-friendly features:
 * - Large, clear controls
 * - Important safety information prominently displayed
 * - Easy access to emergency contact management
 */
export default function SafetySettingsScreen() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight } = useTheme();

  // Settings
  const textSize = useSettingsStore((s) => s.textSize);
  const careViewEnabled = useSettingsStore((s) => s.careViewEnabled);
  const careViewProtection = useSettingsStore((s) => s.careViewProtection);
  const careViewAutoLock = useSettingsStore((s) => s.careViewAutoLock);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);

  // Safety session
  const sessionReminderEnabled = useSafetySessionStore((s) => s.sessionReminderEnabled);
  const setSessionReminderEnabled = useSafetySessionStore((s) => s.setSessionReminderEnabled);

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={true}
      >
        {/* Safety Info Banner */}
        <View
          className="rounded-2xl p-4 mb-6 flex-row items-start"
          style={{
            backgroundColor: colors.warningBackground,
            borderWidth: 1,
            borderColor: colors.warning,
          }}
        >
          <Ionicons name="shield-checkmark" size={28} color={colors.onWarning} />
          <View className="flex-1 ml-3">
            <Text
              className={`${textClasses.body} font-semibold mb-1`}
              style={{ color: colors.onWarning }}
            >
              Your Safety Matters
            </Text>
            <Text
              className={`${textClasses.small}`}
              style={{ color: colors.onWarning }}
            >
              These features help keep you safe and can alert your trusted contacts if something happens.
            </Text>
          </View>
        </View>

        {/* Fall Detection Section */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            className={`${textClasses.subtitle} font-semibold mb-2`}
            style={{ color: colors.textPrimary }}
          >
            Fall Detection
          </Text>
          <Text
            className={`${textClasses.body} mb-6`}
            style={{ color: colors.textSecondary }}
          >
            Start a Safety Session from the Home screen to enable fall detection.
          </Text>

          <Pressable
            onPress={() => {
              triggerHaptic();
              navigation.dispatch(
                CommonActions.navigate({
                  name: "MainTabs",
                  params: { screen: "Home" },
                })
              );
            }}
            className="flex-row items-center justify-between py-4"
            style={{ minHeight: 72 }}
            accessibilityRole="button"
            accessibilityLabel="Go to Home screen to start a Safety Session"
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: primaryLight }}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={24}
                  color={primary}
                />
              </View>
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Start a Safety Session
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  Go to Home screen to start fall detection
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </Pressable>

          {/* Session Reminder Toggle */}
          <View
            className="flex-row items-center justify-between py-4"
            style={{ minHeight: 72, borderTopWidth: 1, borderTopColor: colors.divider }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: sessionReminderEnabled ? colors.warningBackground : colors.background }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={sessionReminderEnabled ? colors.warning : colors.textSecondary}
                />
              </View>
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Session Reminder
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  Get a notification if the app goes to the background during a Safety Session
                </Text>
              </View>
            </View>
            <CustomToggle
              value={sessionReminderEnabled}
              onValueChange={(value) => {
                triggerHaptic();
                setSessionReminderEnabled(value);
              }}
            />
          </View>
        </View>

        {/* Trusted Contacts Section */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            className={`${textClasses.subtitle} font-semibold mb-2`}
            style={{ color: colors.textPrimary }}
          >
            Trusted Contacts
          </Text>
          <Text
            className={`${textClasses.body} mb-6`}
            style={{ color: colors.textSecondary }}
          >
            People who can be notified in an emergency
          </Text>

          <Pressable
            onPress={() => {
              triggerHaptic();
              navigation.navigate("EmergencyContacts" as never);
            }}
            className="flex-row items-center justify-between py-4"
            style={{ minHeight: 72 }}
            accessibilityRole="button"
            accessibilityLabel="Manage trusted contacts"
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: colors.errorBackground }}
              >
                <Ionicons name="people" size={24} color={colors.error} />
              </View>
              <View className="flex-1">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Manage Trusted Contacts
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  Add contacts and mark who to alert in emergencies
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Care View Section */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            className={`${textClasses.subtitle} font-semibold mb-2`}
            style={{ color: colors.textPrimary }}
          >
            Care View
          </Text>
          <Text
            className={`${textClasses.body} mb-6`}
            style={{ color: colors.textSecondary }}
          >
            A simplified view for family members or caregivers to see your daily schedule
          </Text>

          {/* Enable Care View Toggle */}
          <View
            className="flex-row items-center justify-between py-4"
            style={{ minHeight: 72, borderBottomWidth: 1, borderBottomColor: colors.divider }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: careViewEnabled ? primaryLight : colors.background }}
              >
                <Ionicons
                  name="heart"
                  size={24}
                  color={careViewEnabled ? primary : colors.textSecondary}
                />
              </View>
              <View className="flex-1 pr-4">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Enable Care View
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  {careViewEnabled ? "Available from home screen" : "Turn on to show on home screen"}
                </Text>
              </View>
            </View>
            <CustomToggle
              value={careViewEnabled}
              onValueChange={(value) => {
                triggerHaptic();
                updateSettings({ careViewEnabled: value });
              }}
            />
          </View>

          {careViewEnabled && (
            <>
              {/* Protection Setting */}
              <Text
                className={`${textClasses.body} font-semibold mt-6 mb-3`}
                style={{ color: colors.textPrimary }}
              >
                Exit Protection
              </Text>
              <Text
                className={`${textClasses.small} mb-4`}
                style={{ color: colors.textSecondary }}
              >
                How to authenticate when exiting Care View
              </Text>

              {/* Face ID Option */}
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  updateSettings({ careViewProtection: "face_id" });
                }}
                className="flex-row items-center py-3"
                accessibilityRole="radio"
                accessibilityState={{ checked: careViewProtection === "face_id" }}
              >
                <View
                  className="w-6 h-6 rounded-full border-2 items-center justify-center mr-4"
                  style={{
                    borderColor: careViewProtection === "face_id" ? primary : colors.textSecondary,
                    backgroundColor: careViewProtection === "face_id" ? primary : "transparent",
                  }}
                >
                  {careViewProtection === "face_id" && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Ionicons name="scan" size={20} color={colors.textPrimary} style={{ marginRight: 12 }} />
                <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                  Face ID / Touch ID
                </Text>
              </Pressable>

              {/* PIN Option */}
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  updateSettings({ careViewProtection: "pin" });
                }}
                className="flex-row items-center py-3"
                accessibilityRole="radio"
                accessibilityState={{ checked: careViewProtection === "pin" }}
              >
                <View
                  className="w-6 h-6 rounded-full border-2 items-center justify-center mr-4"
                  style={{
                    borderColor: careViewProtection === "pin" ? primary : colors.textSecondary,
                    backgroundColor: careViewProtection === "pin" ? primary : "transparent",
                  }}
                >
                  {careViewProtection === "pin" && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Ionicons name="keypad" size={20} color={colors.textPrimary} style={{ marginRight: 12 }} />
                <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                  PIN Code
                </Text>
              </Pressable>

              {/* No Protection Option */}
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  updateSettings({ careViewProtection: "none" });
                }}
                className="flex-row items-center py-3"
                accessibilityRole="radio"
                accessibilityState={{ checked: careViewProtection === "none" }}
              >
                <View
                  className="w-6 h-6 rounded-full border-2 items-center justify-center mr-4"
                  style={{
                    borderColor: careViewProtection === "none" ? primary : colors.textSecondary,
                    backgroundColor: careViewProtection === "none" ? primary : "transparent",
                  }}
                >
                  {careViewProtection === "none" && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Ionicons name="lock-open" size={20} color={colors.textPrimary} style={{ marginRight: 12 }} />
                <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                  No Protection
                </Text>
              </Pressable>

              {/* Auto-lock Setting */}
              {careViewProtection !== "none" && (
                <View
                  className="flex-row items-center justify-between py-4 mt-4"
                  style={{ borderTopWidth: 1, borderTopColor: colors.divider }}
                >
                  <View className="flex-1 pr-4">
                    <Text
                      className={`${textClasses.body} font-semibold`}
                      style={{ color: colors.textPrimary }}
                    >
                      Auto-lock after 2 minutes
                    </Text>
                    <Text
                      className={`${textClasses.small}`}
                      style={{ color: colors.textSecondary }}
                    >
                      Lock Care View when inactive
                    </Text>
                  </View>
                  <CustomToggle
                    value={careViewAutoLock}
                    onValueChange={(value) => {
                      triggerHaptic();
                      updateSettings({ careViewAutoLock: value });
                    }}
                  />
                </View>
              )}

              {/* Care View Info */}
              <View
                className="mt-4 p-4 rounded-xl"
                style={{ backgroundColor: primaryLight }}
              >
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textPrimary }}
                >
                  Care View shows:
                </Text>
                <View className="mt-2">
                  <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                    {"• Today's medications"}
                  </Text>
                  <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                    {"• Today's appointments"}
                  </Text>
                  <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                    {"• Today's reminders"}
                  </Text>
                  <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                    • Trusted contacts (tap to call)
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* SOS Button Info */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: colors.errorBackground,
            borderWidth: 2,
            borderColor: colors.error,
          }}
        >
          <View className="flex-row items-center mb-4">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: colors.error }}
            >
              <Ionicons name="alert" size={24} color={colors.onPrimary} />
            </View>
            <Text
              className={`${textClasses.subtitle} font-bold`}
              style={{ color: colors.onError }}
            >
              SOS Emergency Button
            </Text>
          </View>
          <Text
            className={`${textClasses.body}`}
            style={{ color: colors.onError }}
          >
            The SOS button is always visible on your home screen. Press and hold it for 3 seconds to immediately contact your trusted contacts or call 911.
          </Text>
        </View>

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
