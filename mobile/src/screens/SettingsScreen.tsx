// Settings Screen - Simplified navigation list with search
import React, { useCallback, useState, useMemo } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Platform, Linking } from "react-native";
import { Screen } from "../components/Screen";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { useTheme } from "../utils/useTheme";
import { useResponsive } from "../utils/useResponsive";
import { getTextSizeClasses } from "../utils/textSizes";
import { ScreenErrorBoundary, InlineTip, PrivacyFooter } from "../components/ui";
import { TIP_IDS } from "../state/stores/tipStore";
import { PRIVACY_COPY } from "../utils/privacyCopy";
import { getIconColor, getIconBgColor, IconColorKey } from "../constants/iconColors";
import { isAndroidFeaturesActive } from "../config/platformConfig";
import * as Haptics from "expo-haptics";
import { useSlowMode } from "../utils/useSlowMode";

// Use React Native's built-in __DEV__ global for dev checks
const isDev = typeof __DEV__ !== "undefined" && __DEV__;

// Settings item interface for search
interface SettingsItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  keywords: string[];
  screen: string;
  section: string;
  iconColorKey?: IconColorKey;
  badge?: { text: string; color: string } | null;
}

interface SettingsRowProps {
  icon: string;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  highlightText?: string;
}

/**
 * SettingsRow - Reusable row component for settings navigation
 */
function SettingsRow({
  icon,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  onPress,
  showChevron = true,
  rightElement,
  badge,
  badgeColor,
  highlightText,
}: SettingsRowProps) {
  const { colors, primary, primaryLight } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const { enabled: slowMode, extraPadding } = useSlowMode();

  const handlePress = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [hapticEnabled, onPress]);

  // Use provided colors or fall back to theme primary
  const finalIconColor = iconColor || primary;
  const finalIconBgColor = iconBgColor || primaryLight;

  // Highlight matching text
  const highlightMatchingText = (text: string) => {
    if (!highlightText) return text;
    const lowerText = text.toLowerCase();
    const lowerHighlight = highlightText.toLowerCase();
    const index = lowerText.indexOf(lowerHighlight);
    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <Text style={{ backgroundColor: "#FEF08A" }}>
          {text.substring(index, index + highlightText.length)}
        </Text>
        {text.substring(index + highlightText.length)}
      </>
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center px-4"
      style={{ minHeight: slowMode ? 84 : 72, paddingVertical: slowMode ? 24 : 20 }}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View
        className="rounded-full items-center justify-center mr-4"
        style={{
          width: slowMode ? 52 : 48,
          height: slowMode ? 52 : 48,
          backgroundColor: finalIconBgColor,
        }}
      >
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={slowMode ? 28 : 24}
          color={finalIconColor}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text
            className={`${textClasses.body} font-semibold`}
            style={{ color: colors.textPrimary }}
          >
            {highlightMatchingText(title)}
          </Text>
          {badge && (
            <View
              className="ml-2 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: badgeColor || "#FFD700" }}
            >
              <Text className="text-xs font-bold text-white">{badge}</Text>
            </View>
          )}
        </View>
        {subtitle && (
          <Text
            className={`${textClasses.small} mt-1`}
            style={{ color: colors.textSecondary }}
          >
            {highlightMatchingText(subtitle)}
          </Text>
        )}
      </View>
      {rightElement}
      {showChevron && (
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

/**
 * SettingsScreen - Simplified navigation list for all settings
 *
 * Senior-friendly features:
 * - Large tap targets (min 72px height)
 * - Clear labels and icons
 * - Organized into logical sections
 * - Easy navigation to sub-pages
 * - Search functionality for quick access
 */
export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight, isDark } = useTheme();
  const responsive = useResponsive();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const developerMode = useSettingsStore((s) => s.developerMode);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Subscription state for badge
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);
  const subscriptionTier = useSubscriptionStore((s) => s.subscriptionTier);

  const getSubscriptionBadge = () => {
    if (!isPremiumUnlocked) return { text: "FREE", color: colors.textSecondary };
    if (subscriptionTier === "lifetime") return { text: "LIFETIME", color: "#FFD700" };
    if (subscriptionTier === "annual") return { text: "ANNUAL", color: "#10B981" };
    return { text: "PREMIUM", color: "#10B981" };
  };

  const subscriptionBadge = getSubscriptionBadge();

  // Define all settings items for search
  const settingsItems: SettingsItem[] = useMemo(() => [
    // Appearance & Display
    {
      id: "appearance",
      icon: "color-palette",
      title: "Appearance",
      subtitle: "Theme, colors, light/dark mode",
      keywords: ["theme", "dark", "light", "color", "display", "mode", "dark mode", "night", "bright", "contrast"],
      screen: "AppearanceSettings",
      section: "Appearance & Display",
      iconColorKey: "appearance",
    },
    {
      id: "customize-home",
      icon: "apps",
      title: "Customize Tab Bar",
      subtitle: "Choose which tabs appear in the navigation bar",
      keywords: ["tabs", "navigation", "bar", "customize", "layout"],
      screen: "CustomizeAppSettings",
      section: "Appearance & Display",
      iconColorKey: "customizeHome",
    },
    {
      id: "text-size",
      icon: "text",
      title: "Text Size & Accessibility",
      subtitle: "Adjust text size and contrast",
      keywords: ["font", "large", "bigger", "contrast", "vision", "accessibility", "size", "voice", "slow", "slow mode", "text size", "voice guidance", "voiceover", "speak", "read aloud"],
      screen: "AccessibilitySettings",
      section: "Appearance & Display",
      iconColorKey: "textSize",
    },
    {
      id: "location",
      icon: "location",
      title: "Location",
      subtitle: "For weather updates and SOS emergencies",
      keywords: ["location", "weather", "city", "address", "gps", "sos", "emergency"],
      screen: "LocationSettings",
      section: "Appearance & Display",
      iconColorKey: "location",
    },
    // Notifications & Sounds
    {
      id: "notifications",
      icon: "notifications",
      title: "Notifications",
      subtitle: "Manage reminders and alerts",
      keywords: ["notifications", "reminders", "alerts", "push", "notify", "medication", "reminder", "daily", "schedule", "time"],
      screen: "NotificationSettings",
      section: "Notifications & Sounds",
      iconColorKey: "notifications",
    },
    {
      id: "sounds",
      icon: "volume-high",
      title: "Sounds & Haptics",
      subtitle: "App sounds and vibrations",
      keywords: ["sounds", "haptics", "vibration", "audio", "volume", "mute", "ring", "alarm", "silent", "vibrate", "voice"],
      screen: "SoundsAndHaptics",
      section: "Notifications & Sounds",
      iconColorKey: "sounds",
    },
    // Your Plan
    // v1.0: Subscription settings hidden — IAP disabled
    // {
    //   id: "subscription",
    //   icon: isPremiumUnlocked ? "star" : "star-outline",
    //   title: "Subscription",
    //   subtitle: isPremiumUnlocked ? "Manage your premium plan" : "Upgrade to unlock all features",
    //   keywords: ["subscription", "premium", "upgrade", "plan", "billing", "payment"],
    //   screen: "SubscriptionSettings",
    //   section: "Your Plan",
    //   iconColorKey: "subscription",
    //   badge: subscriptionBadge,
    // },
    // Safety & Security
    {
      id: "safety",
      icon: "shield-checkmark",
      title: "Safety Features",
      subtitle: "Fall detection, trusted contacts",
      keywords: ["safety", "fall", "detection", "emergency", "contacts", "trusted", "sos", "pin", "lock", "ring", "alarm", "loud"],
      screen: "SafetySettings",
      section: "Safety & Security",
      iconColorKey: "safety",
    },
    {
      id: "care-summary",
      icon: "heart",
      title: "Care Summary",
      subtitle: "Share a simple daily summary",
      keywords: ["care", "summary", "daily", "share", "caregiver"],
      screen: "CareSummary",
      section: "Safety & Security",
      iconColorKey: "careSummary",
    },
    {
      id: "security",
      icon: "lock-closed",
      title: "Security",
      subtitle: "App lock and privacy settings",
      keywords: ["security", "lock", "password", "pin", "privacy", "biometric", "face id"],
      screen: "SecuritySettings",
      section: "Safety & Security",
      iconColorKey: "security",
    },
    // Data & Backup (Android only — visible when flag is ON)
    ...(isAndroidFeaturesActive() ? [{
      id: "data-backup",
      icon: "cloud-upload",
      title: "Data & Backup",
      subtitle: "Save a backup of all your SteadiDay data",
      keywords: ["data", "backup", "export", "save", "download"],
      screen: "SecuritySettings",
      section: "Safety & Security",
      iconColorKey: "security" as IconColorKey,
    }] : []),
    // Connected Services
    {
      id: "connected-apps",
      icon: "link",
      title: "Connected Apps",
      subtitle: "Health apps, calendars, and more",
      keywords: ["connected", "apps", "health", "calendar", "sync", "apple health", "reminders", "apple", "google", "watch", "fitbit"],
      screen: "ConnectedApps",
      section: "Connected Services",
      iconColorKey: "connectedApps",
    },
    // Language option removed — language is set during onboarding
    // Help & Information
    {
      id: "help",
      icon: "help-circle",
      title: "Help & Support",
      subtitle: "FAQs, tutorials, and chat with our assistant",
      keywords: ["help", "support", "faq", "tutorial", "contact", "question", "chat", "assistant", "chatbot", "how", "guide", "tour", "walkthrough"],
      screen: "HelpScreen",
      section: "Help & Information",
      iconColorKey: "help",
    },
    {
      id: "legal",
      icon: "document-text",
      title: "Legal & Privacy",
      subtitle: "Terms, privacy policy, licenses",
      keywords: ["legal", "privacy", "terms", "policy", "license"],
      screen: "LegalPrivacy",
      section: "Help & Information",
      iconColorKey: "legalPrivacy",
    },
    {
      id: "about",
      icon: "information-circle",
      title: "About",
      subtitle: "App version and information",
      keywords: ["about", "version", "info", "app"],
      screen: "About",
      section: "Help & Information",
      iconColorKey: "about",
    },
  ], [isPremiumUnlocked, subscriptionBadge, colors.textSecondary]);

  // Filter settings based on search query
  const filterSettings = useCallback((query: string): SettingsItem[] => {
    if (!query.trim()) return [];
    const normalizedQuery = query.toLowerCase().trim();
    return settingsItems.filter(item =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.subtitle.toLowerCase().includes(normalizedQuery) ||
      item.keywords.some(kw => kw.includes(normalizedQuery))
    );
  }, [settingsItems]);

  const searchResults = useMemo(() => filterSettings(searchQuery), [filterSettings, searchQuery]);
  const isSearching = searchQuery.trim().length > 0;

  const handleClearSearch = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSearchQuery("");
  };

  const navigateToScreen = (screenName: string) => {
    navigation.navigate(screenName as never);
  };

  // Render a settings row from item data
  const renderSettingsItem = (item: SettingsItem) => (
    <SettingsRow
      key={item.id}
      icon={item.icon}
      iconColor={item.iconColorKey ? getIconColor(item.iconColorKey, isDark) : undefined}
      iconBgColor={item.iconColorKey ? getIconBgColor(getIconColor(item.iconColorKey, isDark)) : undefined}
      title={item.title}
      subtitle={item.subtitle}
      badge={item.badge?.text}
      badgeColor={item.badge?.color}
      highlightText={searchQuery}
      onPress={() => navigateToScreen(item.screen)}
    />
  );

  return (
    <ScreenErrorBoundary screenName="Settings">
      <Screen variant="static" edges={["top"]} extraBottomPadding={0}>
        {/* Header */}
        <View
          className="px-6 py-6 border-b"
          style={{ backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }}
        >
          <Text
            className={`${textClasses.largeTitle} font-bold`}
            style={{ color: colors.textPrimary }}
          >
            Settings
          </Text>
        </View>

        {/* Search Bar */}
        <View
          className="px-4 py-3"
          style={{ backgroundColor: colors.cardBackground, borderBottomWidth: 1, borderBottomColor: colors.divider }}
        >
          <View
            className="flex-row items-center px-4 rounded-xl"
            style={{
              backgroundColor: colors.background,
              minHeight: 48,
              borderWidth: 1,
              borderColor: colors.border
            }}
          >
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search settings..."
              placeholderTextColor={colors.textSecondary}
              selectionColor={primary}
              cursorColor={primary}
              className={`flex-1 ml-3 ${textClasses.body}`}
              style={{
                color: colors.textPrimary,
                paddingVertical: 12,
              }}
              accessibilityLabel="Search settings"
              accessibilityHint="Type to search through all settings"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={handleClearSearch}
                className="p-2"
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingVertical: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search Results */}
          {isSearching ? (
            <>
              {searchResults.length > 0 ? (
                <View
                  className="mx-4 rounded-2xl mb-6"
                  style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}
                >
                  {searchResults.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {renderSettingsItem(item)}
                      {index < searchResults.length - 1 && (
                        <View className="mx-4" style={{ height: 1, backgroundColor: colors.divider }} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              ) : (
                <View className="items-center py-12 px-6">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-4"
                    style={{ backgroundColor: primaryLight }}
                  >
                    <Ionicons name="search" size={32} color={primary} />
                  </View>
                  <Text
                    className={`${textClasses.body} text-center mb-2`}
                    style={{ color: colors.textPrimary }}
                  >
                    No results for &ldquo;{searchQuery}&rdquo;
                  </Text>
                  <Text
                    className={`${textClasses.small} text-center`}
                    style={{ color: colors.textSecondary }}
                  >
                    Try different keywords or browse categories below
                  </Text>
                  <Pressable
                    onPress={handleClearSearch}
                    className="mt-4 px-6 py-3 rounded-full"
                    style={{ backgroundColor: primaryLight }}
                  >
                    <Text className={`${textClasses.body} font-semibold`} style={{ color: primary }}>
                      Clear Search
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Help & Support — top of list, visually prominent */}
              <View
                className="mx-4 rounded-2xl mb-6 overflow-hidden"
                style={{
                  backgroundColor: isDark ? "rgba(42, 157, 143, 0.12)" : "rgba(42, 157, 143, 0.06)",
                  borderWidth: 1.5,
                  borderColor: isDark ? "rgba(42, 157, 143, 0.35)" : "rgba(42, 157, 143, 0.25)",
                }}
              >
                <SettingsRow
                  icon="help-circle"
                  iconColor="#2A9D8F"
                  iconBgColor="rgba(42, 157, 143, 0.15)"
                  title="Help & Support"
                  subtitle="FAQs, tutorials, and chat with our assistant"
                  onPress={() => navigation.navigate("HelpScreen" as never)}
                />
              </View>

              {/* Appearance & Display */}
              <View className="px-6 mb-2">
                <Text
                  className={`${textClasses.small} font-semibold uppercase tracking-wide`}
                  style={{ color: colors.textSecondary }}
                >
                  Appearance & Display
                </Text>
              </View>
              <View
                className="mx-4 rounded-2xl mb-6"
                style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}
              >
                <SettingsRow
                  icon="color-palette"
                  iconColor={getIconColor("appearance", isDark)}
                  iconBgColor={getIconBgColor(getIconColor("appearance", isDark))}
                  title="Appearance"
                  subtitle="Theme, colors, light/dark mode"
                  onPress={() => navigation.navigate("AppearanceSettings" as never)}
                />
                <View className="mx-4" style={{ height: 1, backgroundColor: colors.divider }} />
                <SettingsRow
                  icon="apps"
                  iconColor={getIconColor("customizeHome", isDark)}
                  iconBgColor={getIconBgColor(getIconColor("customizeHome", isDark))}
                  title="Customize Tab Bar"
                  subtitle="Choose which tabs appear in the navigation bar"
                  onPress={() => navigation.navigate("CustomizeAppSettings" as never)}
                />
                <View className="mx-4" style={{ height: 1, backgroundColor: colors.divider }} />
                <SettingsRow
                  icon="text"
                  iconColor={getIconColor("textSize", isDark)}
                  iconBgColor={getIconBgColor(getIconColor("textSize", isDark))}
                  title="Text Size & Accessibility"
                  subtitle="Adjust text size and contrast"
                  onPress={() => navigation.navigate("AccessibilitySettings" as never)}
                />
                <View className="mx-4" style={{ height: 1, backgroundColor: colors.divider }} />
                <SettingsRow
                  icon="location"
                  iconColor={getIconColor("location", isDark)}
                  iconBgColor={getIconBgColor(getIconColor("location", isDark))}
                  title="Location"
                  subtitle="For weather updates and SOS emergencies"
                  onPress={() => navigation.navigate("LocationSettings" as never)}
                />
              </View>

              {/* Notifications & Sounds */}
              <View className="px-6 mb-2">
                <Text
                  className={`${textClasses.small} font-semibold uppercase tracking-wide`}
                  style={{ color: colors.textSecondary }}
                >
                  Notifications & Sounds
                </Text>
              </View>
              <View
                className="mx-4 rounded-2xl mb-6"
                style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}
              >
                <SettingsRow
                  icon="notifications"
                  iconColor={getIconColor("notifications", isDark)}
                  iconBgColor={getIconBgColor(getIconColor("notifications", isDark))}
                  title="Notifications"
                  subtitle="Manage reminders and alerts"
                  onPress={() => navigation.navigate("NotificationSettings" as never)}
                />
                <View className="mx-4" style={{ height: 1, backgroundColor: colors.divider }} />
                <SettingsRow
                  icon="volume-high"
                  iconColor={getIconColor("sounds", isDark)}
                  iconBgColor={getIconBgColor(getIconColor("sounds", isDark))}
                  title="Sounds & Haptics"
                  subtitle="App sounds and vibrations"
                  onPress={() => navigation.navigate("SoundsAndHaptics" as never)}
                />
              </View>

              {/* Safety & Security */}
              <View className="px-6 mb-2">
                <Text
                  className={`${textClasses.small} font-semibold uppercase tracking-wide`}
                  style={{ color: colors.textSecondary }}
                >
                  Safety & Security
                </Text>
              </View>
              <View
                className="mx-4 rounded-2xl mb-6"
                style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}
              >
                <SettingsRow
                  icon="shield-checkmark"
                  iconColor={getIconColor("safety", isDark)}
                  iconBgColor={getIconBgColor(getIconColor("safety", isDark))}
                  title="Safety Features"
                  subtitle="Fall detection, trusted contacts"
                  onPress={() => navigation.navigate("SafetySettings" as never)}
                />
                <View className="mx-4" style={{ height: 1, backgroundColor: colors.divider }} />
                <SettingsRow
                  icon="heart"
                  iconColor={getIconColor("careSummary", isDark)}
                  iconBgColor={getIconBgColor(getIconColor("careSummary", isDark))}
                  title="Care Summary"
                  subtitle="Share a simple daily summary"
                  onPress={() => navigation.navigate("CareSummary" as never)}
                />
                <View className="mx-4" style={{ height: 1, backgroundColor: colors.divider }} />
                <SettingsRow
                  icon="lock-closed"
                  iconColor={getIconColor("security", isDark)}
                  iconBgColor={getIconBgColor(getIconColor("security", isDark))}
                  title="Security"
                  subtitle="App lock and privacy settings"
                  onPress={() => navigation.navigate("SecuritySettings" as never)}
                />
              </View>

              {/* Connected Services */}
              <View className="px-6 mb-2">
                <Text
                  className={`${textClasses.small} font-semibold uppercase tracking-wide`}
                  style={{ color: colors.textSecondary }}
                >
                  Connected Services
                </Text>
              </View>
              <View
                className="mx-4 rounded-2xl mb-6"
                style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}
              >
                <SettingsRow
                  icon="link"
                  iconColor={getIconColor("connectedApps", isDark)}
                  iconBgColor={getIconBgColor(getIconColor("connectedApps", isDark))}
                  title="Connected Apps"
                  subtitle="Health apps, calendars, and more"
                  onPress={() => navigation.navigate("ConnectedApps" as never)}
                />
              </View>

              {/* v1.0: Subscription settings hidden — IAP disabled */}
              {false && (
              <>{/* Your Plan */}
              <View className="px-6 mb-2">
                <Text
                  className={`${textClasses.small} font-semibold uppercase tracking-wide`}
                  style={{ color: colors.textSecondary }}
                >
                  Your Plan
                </Text>
              </View>
              <View
                className="mx-4 rounded-2xl mb-6"
                style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}
              >
                <SettingsRow
                  icon={isPremiumUnlocked ? "star" : "star-outline"}
                  iconColor={getIconColor("subscription", isDark)}
                  iconBgColor={getIconBgColor(getIconColor("subscription", isDark))}
                  title="Subscription"
                  subtitle={isPremiumUnlocked ? "Manage your premium plan" : "Upgrade to unlock all features"}
                  badge={subscriptionBadge.text}
                  badgeColor={subscriptionBadge.color}
                  onPress={() => navigation.navigate("SubscriptionSettings" as never)}
                />
              </View>
              </>)}

              {/* Help & Information */}
              <View className="px-6 mb-2">
                <Text
                  className={`${textClasses.small} font-semibold uppercase tracking-wide`}
                  style={{ color: colors.textSecondary }}
                >
                  Help & Information
                </Text>
              </View>
              <View
                className="mx-4 rounded-2xl mb-6"
                style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}
              >
                <SettingsRow
                  icon="document-text"
                  iconColor={getIconColor("legalPrivacy", isDark)}
                  iconBgColor={getIconBgColor(getIconColor("legalPrivacy", isDark))}
                  title="Legal & Privacy"
                  subtitle="Terms, privacy policy, licenses"
                  onPress={() => navigation.navigate("LegalPrivacy" as never)}
                />
                <View className="mx-4" style={{ height: 1, backgroundColor: colors.divider }} />
                <SettingsRow
                  icon="star"
                  iconColor="#D4A853"
                  iconBgColor="rgba(212, 168, 83, 0.15)"
                  title="Rate SteadiDay"
                  subtitle={Platform.OS === "android" ? "Leave a review on Google Play" : "Leave a review on the App Store"}
                  onPress={() => {
                    Linking.openURL(
                      Platform.OS === "android"
                        ? "https://play.google.com/store/apps/details?id=com.vibecode.steadiday"
                        : "https://apps.apple.com/app/steadiday/id6758526744?action=write-review"
                    );
                  }}
                />
                <View className="mx-4" style={{ height: 1, backgroundColor: colors.divider }} />
                <SettingsRow
                  icon="information-circle"
                  iconColor={getIconColor("about", isDark)}
                  iconBgColor={getIconBgColor(getIconColor("about", isDark))}
                  title="About"
                  subtitle="App version and information"
                  onPress={() => navigation.navigate("About" as never)}
                />
              </View>

              {/* Developer Options (if enabled and in dev mode) */}
              {developerMode && isDev && (
                <>
                  <View className="px-6 mb-2">
                    <Text
                      className={`${textClasses.small} font-semibold uppercase tracking-wide`}
                      style={{ color: colors.error }}
                    >
                      Developer Options
                    </Text>
                  </View>
                  <View
                    className="mx-4 rounded-2xl mb-6"
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderWidth: 2,
                      borderColor: colors.error
                    }}
                  >
                    <SettingsRow
                      icon="code-slash"
                      iconColor={colors.error}
                      title="Developer Settings"
                      subtitle="Testing and debug options"
                      onPress={() => navigation.navigate("DeveloperSettings" as never)}
                    />
                  </View>
                </>
              )}

              {/* Medical Disclaimer */}
              <View
                className="mx-4 rounded-2xl p-5 mb-6"
                style={{ backgroundColor: primaryLight, borderWidth: 1, borderColor: primary }}
              >
                <View className="flex-row items-start">
                  <Ionicons name="medical" size={24} color={primary} />
                  <View className="flex-1 ml-3">
                    <Text
                      className={`${textClasses.body} font-semibold mb-1`}
                      style={{ color: colors.textPrimary }}
                    >
                      Medical Disclaimer
                    </Text>
                    <Text
                      className={`${textClasses.small}`}
                      style={{ color: colors.textSecondary }}
                    >
                      SteadiDay is not a medical device. Always consult your healthcare provider for medical advice.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Privacy Section */}
              <View className="px-6 mb-2">
                <Text
                  className={`${textClasses.small} font-semibold uppercase tracking-wide`}
                  style={{ color: colors.textSecondary }}
                >
                  Privacy
                </Text>
              </View>
              <View
                className="mx-4 rounded-2xl p-5 mb-6"
                style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}
              >
                <View className="flex-row items-start">
                  <Ionicons name="shield-checkmark" size={24} color={colors.success} />
                  <View className="flex-1 ml-3">
                    <Text
                      className={`${textClasses.small} leading-relaxed`}
                      style={{ color: colors.textSecondary }}
                    >
                      {PRIVACY_COPY.settingsPrivacyBody}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Privacy Footer */}
              <PrivacyFooter />

              {/* Bottom padding for tab bar */}
              <View className="h-8" />
            </>
          )}
        </ScrollView>

        {/* Settings Screen Tip */}
        <InlineTip tipId={TIP_IDS.SETTINGS} />
      </Screen>
    </ScreenErrorBoundary>
  );
}
