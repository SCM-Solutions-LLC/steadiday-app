import React, { useCallback, useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { Screen } from "../../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useSubscriptionStore, FeatureVisibility } from "../../state/stores/subscriptionStore";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import { CustomToggle } from "../../components/ui";
import * as Haptics from "expo-haptics";

type SectionKey = keyof FeatureVisibility["sections"];

interface TabOption {
  id: SectionKey;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

/**
 * CustomizeAppSettingsScreen - Customize which tabs appear in the bottom navigation
 *
 * Premium users can toggle ALL tabs on/off
 * Essentials users only see essential tabs (Premium-only tabs are completely hidden)
 */
export default function CustomizeAppSettingsScreen() {
  const { colors, primary, primaryLight } = useTheme();

  // Settings
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);

  // Subscription state
  const featureVisibility = useSubscriptionStore((s) => s.featureVisibility);
  const updateSectionVisibility = useSubscriptionStore((s) => s.updateSectionVisibility);

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  // All available tabs configuration
  const allTabs: TabOption[] = useMemo(() => [
    {
      id: "home",
      name: "Home",
      description: "Your daily overview and quick actions",
      icon: "home",
      color: colors.info,
      isPremiumOnly: false,
    },
    {
      id: "meds",
      name: "Medications",
      description: "Manage and track your medications",
      icon: "medical",
      color: colors.error,
      isPremiumOnly: false,
    },
    {
      id: "tasks",
      name: "Tasks",
      description: "Your to-do list and reminders",
      icon: "checkbox",
      color: primary,
      isPremiumOnly: false,
    },
    {
      id: "contacts",
      name: "Care Team",
      description: "Doctors, caregivers, and important contacts",
      icon: "people",
      color: colors.success,
      isPremiumOnly: false,
    },
    {
      id: "tools",
      name: "Tools",
      description: "Magnifier, flashlight, notes, find my car, and more",
      icon: "construct",
      color: colors.warning,
      isPremiumOnly: false,
    },
    {
      id: "health",
      name: "Health",
      description: "Track steps, heart rate, sleep, and health metrics",
      icon: "fitness",
      color: colors.success,
      isPremiumOnly: false,
    },
    {
      id: "connect",
      name: "Mind Breaks",
      description: "Simple games to keep your mind busy",
      icon: "sparkles",
      color: primary,
      isPremiumOnly: false,
    },
  ], [colors, primary]);

  // All tabs are available to all users
  const visibleTabs = allTabs;

  const handleToggleTab = useCallback((tabId: SectionKey) => {
    triggerHaptic();

    const currentValue = featureVisibility.sections[tabId];
    updateSectionVisibility(tabId, !currentValue);
  }, [triggerHaptic, featureVisibility, updateSectionVisibility]);

  // Count how many tabs are enabled
  const enabledCount = useMemo(() => {
    return Object.values(featureVisibility.sections).filter(Boolean).length;
  }, [featureVisibility.sections]);

  return (
    <Screen
      variant="static"
      edges={["top", "bottom"]}
    >
      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={true}
      >
        {/* Info Banner */}
        <View
          className="rounded-2xl p-4 mb-6 flex-row items-center"
          style={{
            backgroundColor: primaryLight,
            borderWidth: 1,
            borderColor: primary,
          }}
        >
          <Ionicons name="information-circle" size={24} color={primary} />
          <Text
            className={`${textClasses.body} ml-3 flex-1`}
            style={{ color: colors.textPrimary }}
          >
            Toggle any tab on or off to customize your navigation
          </Text>
        </View>

        {/* Tab count indicator */}
        <View
            className="rounded-xl p-3 mb-4 flex-row items-center justify-center"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Ionicons name="apps" size={20} color={primary} />
            <Text
              className={`${textClasses.body} ml-2`}
              style={{ color: colors.textPrimary }}
            >
              {enabledCount} tab{enabledCount !== 1 ? "s" : ""} enabled
            </Text>
          </View>

        {/* All Tabs Section */}
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
            Navigation Tabs
          </Text>
          <Text
            className={`${textClasses.body} mb-6`}
            style={{ color: colors.textSecondary }}
          >
            Turn tabs on or off as needed
          </Text>

          {visibleTabs.map((tab, index) => {
            const isEnabled = featureVisibility.sections[tab.id];

            return (
              <View
                key={tab.id}
                className={`flex-row items-center justify-between py-4 ${
                  index < visibleTabs.length - 1 ? "border-b" : ""
                }`}
                style={{
                  borderBottomColor: colors.divider,
                  minHeight: 72,
                }}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-4"
                    style={{
                      backgroundColor: tab.color + "20",
                    }}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={24}
                      color={tab.color}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text
                        className={`${textClasses.body} font-semibold`}
                        style={{ color: colors.textPrimary }}
                      >
                        {tab.name}
                      </Text>
                    </View>
                    <Text
                      className={`${textClasses.small}`}
                      style={{ color: colors.textSecondary }}
                    >
                      {tab.description}
                    </Text>
                  </View>
                </View>

                <CustomToggle
                    value={isEnabled}
                    onValueChange={() => handleToggleTab(tab.id)}
                  />
              </View>
            );
          })}
        </View>

        {/* Tip about home screen cards */}
        <View
          className="rounded-2xl p-4 mb-6"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-start">
            <Ionicons name="bulb" size={20} color={primary} style={{ marginTop: 2 }} />
            <Text
              className={`${textClasses.small} ml-3 flex-1`}
              style={{ color: colors.textSecondary }}
            >
              To customize which cards appear on your Home screen, tap the Edit button on the Home tab.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
