import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { SubpageHeader } from "../components/ui";
import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "../state/stores/uiStore";
import { useTipStore } from "../state/stores/tipStore";
import { useUserStore } from "../state/stores/userStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { NotificationSource } from "../types/app";
import { getTextSizeClasses } from "../utils/textSizes";
import { useTheme } from "../utils/useTheme";
import { rescheduleAllNotifications, scheduleMindBreaksReminder, cancelMindBreaksReminder } from "../utils/notifications";
import CustomSwitch from "../components/CustomSwitch";

interface Props {
  navigation: any;
  isOnboarding?: boolean;
}

export default function NotificationSettingsScreen({ navigation, isOnboarding }: Props) {
  // Auto-detect if we're in onboarding flow
  // MedicalIDSetup removed - check for FallDetectionSetup instead
  const isInOnboarding = isOnboarding ?? (!navigation.canGoBack?.() || navigation.getState?.()?.routes?.some((r: any) => r.name === "FallDetectionSetup") || false);
  const { colors, primary } = useTheme();

  // Settings from useSettingsStore (flat state)
  const notificationSource = useSettingsStore((s) => s.notificationSource);
  const textSize = useSettingsStore((s) => s.textSize);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const mindBreaksReminderEnabled = useSettingsStore((s) => s.mindBreaksReminderEnabled);
  const mindBreaksReminderTime = useSettingsStore((s) => s.mindBreaksReminderTime);

  // Tip state from useTipStore
  const resetSessionTipFlag = useTipStore((s) => s.resetSessionTipFlag);

  // User actions from useUserStore
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  const [selectedSource, setSelectedSource] = useState<NotificationSource>(
    (notificationSource as NotificationSource) || "steadiday"
  );

  const textClasses = getTextSizeClasses(textSize);

  const options: Array<{
    value: NotificationSource;
    title: string;
    description: string;
    icon: string;
    color: string;
  }> = [
    {
      value: "steadiday",
      title: "SteadiDay Only",
      description: "Get notifications only from this app. Connected apps won't send duplicate reminders.",
      icon: "notifications",
      color: "#2F80ED",
    },
    {
      value: "connected-apps",
      title: "Connected Apps Only",
      description: "Get notifications from your calendar and reminder apps. SteadiDay won't send duplicates.",
      icon: "calendar",
      color: "#6DB193",
    },
    {
      value: "both",
      title: "Both Apps",
      description: "Get notifications from SteadiDay and connected apps. You may receive duplicate reminders.",
      icon: "apps",
      color: "#F59E0B",
    },
  ];

  const handleContinue = async () => {
    updateSettings({ notificationSource: selectedSource });

    // Reschedule all notifications with the new preference
    await rescheduleAllNotifications(selectedSource);

    if (isInOnboarding) {
      // Reset tip session flag so post-onboarding tips can show
      resetSessionTipFlag();
      // Complete onboarding - this is the final step
      completeOnboarding();
    } else {
      // Go back to settings
      navigation.goBack();
    }
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      {/* Header with labeled back button - SENIOR-FRIENDLY */}
      {!isInOnboarding && (
        <SubpageHeader
          title="Notification Settings"
          backLabel="Settings"
          onBack={() => navigation.goBack()}
        />
      )}
      <ScrollView className="flex-1 px-8 py-6">
        {/* Header - only show in onboarding */}
        {isInOnboarding && (
          <View className="mb-8">
            <Text style={{ color: colors.textPrimary }} className={`${textClasses.title} mb-4`}>
              Turn on reminders
            </Text>
            <Text style={{ color: colors.textSecondary }} className={`${textClasses.body} leading-relaxed mb-3`}>
              Choose where you want to receive medication and task reminders. This helps avoid duplicate reminders.
            </Text>
            <Text style={{ color: colors.textTertiary }} className={`${textClasses.small} leading-relaxed`}>
              We send gentle reminders for your medications and tasks.
            </Text>
          </View>
        )}

        {/* Description when not onboarding */}
        {!isInOnboarding && (
          <View className="mb-6">
            <Text style={{ color: colors.textSecondary }} className={`${textClasses.body} leading-relaxed`}>
              Choose where you want to receive medication and task reminders. This helps avoid duplicate reminders.
            </Text>
          </View>
        )}

        {/* Options */}
        <View className="mb-8">
          {options.map((option) => {
            const isSelected = selectedSource === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setSelectedSource(option.value)}
                style={{
                  marginBottom: 16,
                  padding: 24,
                  borderRadius: 16,
                  borderWidth: 2,
                  backgroundColor: isSelected ? colors.primaryLight : colors.cardBackground,
                  borderColor: isSelected ? primary : colors.border,
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
              >
                <View className="flex-row items-start">
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: option.color + "20" }}
                  >
                    <Ionicons name={option.icon as any} size={28} color={option.color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Text
                        style={{ color: isSelected ? primary : colors.textPrimary }}
                        className={`${textClasses.subtitle} font-semibold flex-1`}
                      >
                        {option.title}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={28} color={primary} />
                      )}
                    </View>
                    <Text
                      style={{ color: isSelected ? primary : colors.textSecondary }}
                      className={`${textClasses.body} leading-relaxed`}
                    >
                      {option.description}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Daily Reminders Section */}
        {!isInOnboarding && (
          <View className="mb-8">
            <Text
              style={{ color: colors.textSecondary }}
              className={`${textClasses.small} font-semibold uppercase tracking-wide mb-4`}
            >
              Daily Reminders
            </Text>
            <View
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}
            >
              <View className="flex-row items-center justify-between px-5 py-4">
                <View className="flex-row items-center flex-1 mr-3">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: "#10B98120" }}
                  >
                    <Ionicons name="game-controller" size={20} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text
                      style={{ color: colors.textPrimary }}
                      className={`${textClasses.body} font-medium`}
                    >
                      Daily Mind Breaks Reminder
                    </Text>
                    <Text
                      style={{ color: colors.textSecondary }}
                      className={`${textClasses.small} mt-0.5`}
                    >
                      Get a daily reminder to keep your mind sharp
                    </Text>
                  </View>
                </View>
                <CustomSwitch
                  value={mindBreaksReminderEnabled}
                  onValueChange={(value) => {
                    updateSettings({ mindBreaksReminderEnabled: value });
                    if (value) {
                      scheduleMindBreaksReminder(mindBreaksReminderTime);
                    } else {
                      cancelMindBreaksReminder();
                    }
                  }}
                />
              </View>
            </View>
          </View>
        )}



      </ScrollView>

      {/* Continue Button */}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border }} className="px-8 pb-6 pt-4">
        <Pressable
          onPress={handleContinue}
          style={{
            backgroundColor: primary,
            paddingHorizontal: 32,
            paddingVertical: 20,
            borderRadius: 16,
            alignItems: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel={isInOnboarding ? "Finish setup and start using SteadiDay" : "Save notification settings"}
        >
          <Text style={{ color: colors.buttonText }} className={`${textClasses.subtitle} font-semibold`}>
            {isInOnboarding ? "Finish Setup" : "Save Changes"}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
