import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Modal, Platform, ActivityIndicator } from "react-native";
import { Screen } from "../components/Screen";
import { SubpageHeader } from "../components/ui";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useUserStore } from "../state/stores/userStore";
import { useTipStore } from "../state/stores/tipStore";
import { ReminderSound } from "../types/app";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import { playNotificationPreviewSound } from "../utils/soundPlayer";
import * as Haptics from "expo-haptics";
import CustomSwitch from "../components/CustomSwitch";
import Button from "../components/Button";
import { useConfirmModal } from "../components/ConfirmModal";
import { logger } from "../utils/logger";

interface Props {
  navigation?: any;
  isOnboarding?: boolean;
}

export default function SoundsAndHapticsScreen({ navigation: propNavigation, isOnboarding }: Props) {
  const hookNavigation = useNavigation();
  const navigation = propNavigation || hookNavigation;

  // Auto-detect if we're in onboarding flow by checking routes
  const isInOnboarding = isOnboarding ?? (navigation.getState?.()?.routes?.some((r: any) =>
    r.name === "FallDetectionSetup" || r.name === "NotificationSettings" || r.name === "EmergencyContact" || r.name === "MultipleTasksScreen"
  ) || false);

  // Settings from useSettingsStore (flat state)
  const soundSettings = useSettingsStore((s) => s.soundSettings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const { colors, primary } = useTheme();
  const { alert } = useConfirmModal();

  // User actions from useUserStore for completing onboarding
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  // Tip store - reset session flag after onboarding so tips can show
  const resetSessionTipFlag = useTipStore((s) => s.resetSessionTipFlag);

  // Provide default values if soundSettings is undefined (for users with old persisted state)
  const safeSoundSettings = soundSettings || {
    appSoundsEnabled: true,
    hapticFeedbackEnabled: true,
    medicationReminderSound: "default" as ReminderSound,
    taskReminderSound: "default" as ReminderSound,
    loudEmergencySounds: true,
  };

  const [showMedicationPicker, setShowMedicationPicker] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [testingSound, setTestingSound] = useState<"medication" | "task" | null>(null);

  const reminderSounds: { value: ReminderSound; label: string }[] = [
    { value: "default", label: "Classic Alert" },
    { value: "gentle", label: "Doorbell Chime" },
    { value: "chime", label: "Phone Ring" },
    { value: "bell", label: "Loud Alarm" },
  ];

  const handleSoundChange = (type: "medication" | "task", sound: ReminderSound) => {
    updateSettings({
      soundSettings: {
        ...safeSoundSettings,
        [type === "medication" ? "medicationReminderSound" : "taskReminderSound"]: sound,
      },
    });
    if (type === "medication") {
      setShowMedicationPicker(false);
    } else {
      setShowTaskPicker(false);
    }
  };

  const testSound = async (soundType: "medication" | "task") => {
    setTestingSound(soundType);

    try {
      // Play the notification preview sound based on type
      const success = await playNotificationPreviewSound(
        soundType === "medication" ? "medicationReminder" : "taskReminder"
      );

      // If sounds are disabled, show a brief message
      if (!success && !safeSoundSettings.appSoundsEnabled) {
        alert(
          "Sounds Disabled",
          "Enable App Sounds to hear the reminder sound."
        );
      }
    } catch (error) {
      logger.error(`Error testing ${soundType} sound:`, error);
      alert("Unable to Play Sound", "There was an issue playing the sound. Please try again.");
    } finally {
      setTestingSound(null);
    }
  };

  const deviceSupportsHaptics = Platform.OS === "ios";

  const handleContinue = () => {
    // Complete onboarding directly - FallDetectionSetup and NotificationSettings removed from flow
    resetSessionTipFlag();
    completeOnboarding();
  };

  return (
    <Screen variant="static" edges={["top"]}>
      <View className="flex-1">
        {/* Header - SENIOR-FRIENDLY: Labeled back button */}
        {!isInOnboarding && (
          <SubpageHeader
            title="Sounds & Haptics"
            backLabel="Settings"
            onBack={() => navigation.goBack()}
          />
        )}

        <ScrollView className="flex-1" showsVerticalScrollIndicator={true}>
          <View className="px-8 py-8">
            {/* General Section */}
            <View className="rounded-3xl p-8 mb-6" style={{ backgroundColor: colors.cardBackground }}>
              <Text className="text-2xl font-semibold mb-6" style={{ color: colors.textPrimary }}>
                General
              </Text>

              {/* App Sounds */}
              <View className="flex-row justify-between items-center py-4">
                <View className="flex-1 pr-4">
                  <Text className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    App Sounds
                  </Text>
                  <Text className="text-lg leading-relaxed" style={{ color: colors.textSecondary }}>
                    Play sounds for app interactions
                  </Text>
                </View>
                <CustomSwitch
                  value={safeSoundSettings.appSoundsEnabled}
                  onValueChange={(value: boolean) =>
                    updateSettings({
                      soundSettings: { ...safeSoundSettings, appSoundsEnabled: value },
                    })
                  }
                  activeTrackColor="#A3D4C1"
                  inactiveTrackColor={colors.border}
                  activeThumbColor="#FFFFFF"
                  inactiveThumbColor="#FFFFFF"
                  accessibilityLabel="App sounds toggle"
                />
              </View>

              {/* Haptic Feedback */}
              <View className="flex-row justify-between items-center py-4 border-t" style={{ borderTopColor: colors.divider }}>
                <View className="flex-1 pr-4">
                  <Text className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    Haptic Feedback
                  </Text>
                  <Text className="text-lg leading-relaxed" style={{ color: colors.textSecondary }}>
                    {deviceSupportsHaptics
                      ? "Vibrate for button presses and interactions"
                      : "Not available on this device"}
                  </Text>
                </View>
                <CustomSwitch
                  value={safeSoundSettings.hapticFeedbackEnabled}
                  onValueChange={(value: boolean) =>
                    updateSettings({
                      soundSettings: { ...safeSoundSettings, hapticFeedbackEnabled: value },
                    })
                  }
                  disabled={!deviceSupportsHaptics}
                  activeTrackColor="#A3D4C1"
                  inactiveTrackColor={colors.border}
                  activeThumbColor="#FFFFFF"
                  inactiveThumbColor="#FFFFFF"
                  accessibilityLabel="Haptic feedback toggle"
                />
              </View>
            </View>

            {/* Reminders Section */}
            <View className="rounded-3xl p-8 mb-6" style={{ backgroundColor: colors.cardBackground }}>
              <Text className="text-2xl font-semibold mb-6" style={{ color: colors.textPrimary }}>
                Reminders
              </Text>

              {/* Medication Reminder Sound */}
              <View className="mb-6">
                <Text className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
                  Medication Reminder Sound
                </Text>
                <Pressable
                  onPress={() => setShowMedicationPicker(true)}
                  className="flex-row items-center justify-between p-5 rounded-2xl border"
                  style={{ backgroundColor: colors.background, borderColor: colors.border }}
                >
                  <Text className="text-lg" style={{ color: colors.textPrimary }}>
                    {reminderSounds.find((s) => s.value === safeSoundSettings.medicationReminderSound)?.label || "Default"}
                  </Text>
                  <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
                </Pressable>

                {/* Test Button */}
                <Pressable
                  onPress={() => testSound("medication")}
                  disabled={testingSound === "medication"}
                  className="mt-3 py-3 rounded-2xl items-center border"
                  style={{
                    borderColor: testingSound === "medication" ? colors.border : primary,
                    opacity: testingSound === "medication" ? 0.6 : 1,
                  }}
                >
                  <View className="flex-row items-center">
                    {testingSound === "medication" ? (
                      <ActivityIndicator size="small" color={primary} />
                    ) : (
                      <Ionicons name="volume-high" size={20} color={primary} />
                    )}
                    <Text className="text-lg font-semibold ml-2" style={{ color: primary }}>
                      {testingSound === "medication" ? "Playing..." : "Test Sound"}
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Task Reminder Sound */}
              <View className="pt-6 border-t" style={{ borderTopColor: colors.divider }}>
                <Text className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
                  Task Reminder Sound
                </Text>
                <Pressable
                  onPress={() => setShowTaskPicker(true)}
                  className="flex-row items-center justify-between p-5 rounded-2xl border"
                  style={{ backgroundColor: colors.background, borderColor: colors.border }}
                >
                  <Text className="text-lg" style={{ color: colors.textPrimary }}>
                    {reminderSounds.find((s) => s.value === safeSoundSettings.taskReminderSound)?.label || "Default"}
                  </Text>
                  <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
                </Pressable>

                {/* Test Button */}
                <Pressable
                  onPress={() => testSound("task")}
                  disabled={testingSound === "task"}
                  className="mt-3 py-3 rounded-2xl items-center border"
                  style={{
                    borderColor: testingSound === "task" ? colors.border : primary,
                    opacity: testingSound === "task" ? 0.6 : 1,
                  }}
                >
                  <View className="flex-row items-center">
                    {testingSound === "task" ? (
                      <ActivityIndicator size="small" color={primary} />
                    ) : (
                      <Ionicons name="volume-high" size={20} color={primary} />
                    )}
                    <Text className="text-lg font-semibold ml-2" style={{ color: primary }}>
                      {testingSound === "task" ? "Playing..." : "Test Sound"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Emergency Alerts Section */}
            <View className="rounded-3xl p-8 mb-6" style={{ backgroundColor: colors.cardBackground }}>
              <Text className="text-2xl font-semibold mb-6" style={{ color: colors.textPrimary }}>
                Emergency Alerts
              </Text>

              <View className="flex-row justify-between items-center py-4">
                <View className="flex-1 pr-4">
                  <Text className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    Loud Emergency Sounds
                  </Text>
                  <Text className="text-lg leading-relaxed" style={{ color: colors.textSecondary }}>
                    Use loud alerts for fall detection and SOS
                  </Text>
                </View>
                <CustomSwitch
                  value={safeSoundSettings.loudEmergencySounds}
                  onValueChange={(value: boolean) =>
                    updateSettings({
                      soundSettings: { ...safeSoundSettings, loudEmergencySounds: value },
                    })
                  }
                  activeTrackColor="#A3D4C1"
                  inactiveTrackColor={colors.border}
                  activeThumbColor="#FFFFFF"
                  inactiveThumbColor="#FFFFFF"
                  accessibilityLabel="Loud emergency sounds toggle"
                />
              </View>
            </View>

            {/* Info Note */}
            <View className="rounded-3xl p-6 mb-6 border" style={{ backgroundColor: colors.primaryLight, borderColor: primary }}>
              <View className="flex-row">
                <Ionicons name="information-circle" size={24} color={primary} style={{ marginRight: 12, marginTop: 2 }} />
                <Text className="text-base leading-relaxed flex-1" style={{ color: colors.textSecondary }}>
                  Sound preferences will take effect the next time a reminder is triggered. Test sounds to preview each option.
                </Text>
              </View>
            </View>

            {/* Bottom padding */}
            <View className="h-12" />
          </View>
        </ScrollView>

        {/* Continue Button for Onboarding */}
        {isInOnboarding && (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border }} className="px-8 pb-6 pt-4">
            <Button
              title="Finish Setup"
              onPress={handleContinue}
              variant="primary"
              size="large"
              fullWidth
              accessibilityLabel="Finish setup and start using SteadiDay"
            />
          </View>
        )}
      </View>

      {/* Medication Sound Picker Modal */}
      <Modal
        visible={showMedicationPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMedicationPicker(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <Pressable className="flex-1" onPress={() => setShowMedicationPicker(false)} />
          <View className="rounded-t-3xl p-8" style={{ backgroundColor: colors.cardBackground }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>
                Select Sound
              </Text>
              <Pressable onPress={() => setShowMedicationPicker(false)} className="p-2">
                <Ionicons name="close" size={28} color={colors.textSecondary} />
              </Pressable>
            </View>

            {reminderSounds.map((sound) => (
              <Pressable
                key={sound.value}
                onPress={() => handleSoundChange("medication", sound.value)}
                className="py-5 border-b flex-row items-center justify-between"
                style={{ borderBottomColor: colors.divider }}
              >
                <Text className="text-xl" style={{ color: colors.textPrimary }}>
                  {sound.label}
                </Text>
                {safeSoundSettings.medicationReminderSound === sound.value && (
                  <Ionicons name="checkmark" size={24} color={primary} />
                )}
              </Pressable>
            ))}

            <View className="h-8" />
          </View>
        </View>
      </Modal>

      {/* Task Sound Picker Modal */}
      <Modal
        visible={showTaskPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTaskPicker(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <Pressable className="flex-1" onPress={() => setShowTaskPicker(false)} />
          <View className="rounded-t-3xl p-8" style={{ backgroundColor: colors.cardBackground }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>
                Select Sound
              </Text>
              <Pressable onPress={() => setShowTaskPicker(false)} className="p-2">
                <Ionicons name="close" size={28} color={colors.textSecondary} />
              </Pressable>
            </View>

            {reminderSounds.map((sound) => (
              <Pressable
                key={sound.value}
                onPress={() => handleSoundChange("task", sound.value)}
                className="py-5 border-b flex-row items-center justify-between"
                style={{ borderBottomColor: colors.divider }}
              >
                <Text className="text-xl" style={{ color: colors.textPrimary }}>
                  {sound.label}
                </Text>
                {safeSoundSettings.taskReminderSound === sound.value && (
                  <Ionicons name="checkmark" size={24} color={primary} />
                )}
              </Pressable>
            ))}

            <View className="h-8" />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
