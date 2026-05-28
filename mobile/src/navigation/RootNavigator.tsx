import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAppStore } from "../state/appStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useUIStore } from "../state/stores/uiStore";
import { useUserStore } from "../state/stores/userStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { useTheme } from "../utils/useTheme";
import { useResponsive } from "../utils/useResponsive";
import { Ionicons } from "@expo/vector-icons";
import { Text, View, Pressable, ScrollView } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { CommonActions, StackActions, useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import TabScrollCoachMark from "../components/TabScrollCoachMark";
import TabTooltip from "../components/TabTooltip";
import { OfflineBanner } from "../components/OfflineBanner";
import { withErrorBoundary } from "../components/ErrorBoundary";
// PremiumSetupFlow is rendered ONLY at the App.tsx level to prevent duplicate modal conflicts
import type { TabName } from "../types/app";
import { logger } from "../utils/logger";

// Onboarding screens
import WelcomeScreen from "../screens/WelcomeScreen";
import LanguageSelectionScreen from "../screens/LanguageSelectionScreen";
import SocialSignInScreen from "../screens/SocialSignInScreen";
import AuthenticationScreen from "../screens/AuthenticationScreen";
import WelcomeEmailScreen from "../screens/WelcomeEmailScreen";
import LegalConsentScreen from "../screens/LegalConsentScreen";
import ConnectAppsIntroScreen from "../screens/ConnectAppsIntroScreen";
import ConnectAppsChoiceScreen from "../screens/ConnectAppsChoiceScreen";
import ConnectAppsAutoDetectScreen from "../screens/ConnectAppsAutoDetectScreen";
import ConnectAppsHealthScreen from "../screens/ConnectAppsHealthScreen";
import ConnectAppsMedicationScreen from "../screens/ConnectAppsMedicationScreen";
import ConnectAppsCalendarScreen from "../screens/ConnectAppsCalendarScreen";
import ConnectAppsAddScreen from "../screens/ConnectAppsAddScreen";
import ConnectAppsDetailScreen from "../screens/ConnectAppsDetailScreen";
import ConnectAppsConfirmationScreen from "../screens/ConnectAppsConfirmationScreen";
import FallDetectionSetupScreen from "../screens/FallDetectionSetupScreen";
// UserNameScreen removed - "A little about you" screen removed from onboarding
import LocationPermissionScreen from "../screens/LocationPermissionScreen";
import EmergencyContactScreen from "../screens/EmergencyContactScreen";
// FavoriteContactsOnboardingScreen removed - Favorite Contacts feature removed
// MedicalIDSetupScreen removed - Medical ID feature removed from app
import MultipleMedicationsScreen from "../screens/MultipleMedicationsScreen";
import MultipleTasksScreen from "../screens/MultipleTasksScreen";
import ExampleMedicationScreen from "../screens/ExampleMedicationScreen";
import ExampleTaskScreen from "../screens/ExampleTaskScreen";
import TutorialScreen from "../screens/TutorialScreen";
import TextSizeSelectionScreen from "../screens/TextSizeSelectionScreen";
import AccessibilitySetupScreen from "../screens/AccessibilitySetupScreen";
import AllSetScreen from "../screens/AllSetScreen";
import NotificationSettingsScreen from "../screens/NotificationSettingsScreen";
import SoundsAndHapticsScreen from "../screens/SoundsAndHapticsScreen";
// SteadiDayOffersScreen import removed — v1.0: IAP disabled, screen not registered in navigation

// Main tab screens — wrapped with error boundaries to isolate per-screen crashes
import _HomeScreen from "../screens/HomeScreen";
import _TasksScreen from "../screens/TasksScreen";
import _MedsScreen from "../screens/MedsScreen";
import _ToolsScreen from "../screens/ToolsScreen";
import _MindBreaksScreen from "../screens/MindBreaksScreen";
import _MedicalScreen from "../screens/MedicalScreen";
import _SettingsScreen from "../screens/SettingsScreen";

const HomeScreen = withErrorBoundary(_HomeScreen, "Home");
const TasksScreen = withErrorBoundary(_TasksScreen, "Tasks");
const MedsScreen = withErrorBoundary(_MedsScreen, "Meds");
const ToolsScreen = withErrorBoundary(_ToolsScreen, "Tools");
const MindBreaksScreen = withErrorBoundary(_MindBreaksScreen, "Mind Breaks");
const MedicalScreen = withErrorBoundary(_MedicalScreen, "Care Team");
const SettingsScreen = withErrorBoundary(_SettingsScreen, "Settings");

// Settings (sub-screens)
import InsuranceScreen from "../screens/InsuranceScreen";
import DoctorsScreen from "../screens/DoctorsScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import EmergencyContactsScreen from "../screens/EmergencyContactsScreen";
// FavoriteContactsScreen removed - Favorite Contacts feature removed
import ConnectedAppsScreen from "../screens/ConnectedAppsScreen";
import SecuritySettingsScreen from "../screens/SecuritySettingsScreen";
import _HealthScreen from "../screens/HealthScreen";
const HealthScreen = withErrorBoundary(_HealthScreen, "Health");
// MedicalIDScreen removed - Medical ID feature removed from app
import TaskTemplatesScreen from "../screens/TaskTemplatesScreen";
import HealthScreeningsScreen from "../screens/HealthScreeningsScreen";
// import LabResultsScreen from "../screens/LabResultsScreen"; // v1.0: Clinical Health Records disabled
// import MedicationRecordsScreen from "../screens/MedicationRecordsScreen"; // v1.0: Clinical Health Records disabled
import LearningBitesScreen from "../screens/connect/LearningBitesScreen";
// import HealthRecordsHelpScreen from "../screens/HealthRecordsHelpScreen"; // v1.0: Clinical Health Records disabled
import CareSummaryScreen from "../screens/CareSummaryScreen";
import CareViewModeScreen from "../screens/CareViewModeScreen";

// Legal & Privacy
import LegalPrivacyScreen from "../screens/LegalPrivacyScreen";
import AboutScreen from "../screens/AboutScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import TermsOfServiceScreen from "../screens/TermsOfServiceScreen";
import LiabilityWaiverScreen from "../screens/LiabilityWaiverScreen";
import SecurityStatementScreen from "../screens/SecurityStatementScreen";
import DataRetentionPolicyScreen from "../screens/DataRetentionPolicyScreen";
import DataBreachResponseScreen from "../screens/DataBreachResponseScreen";
import PrivacySecurityScreen from "../screens/PrivacySecurityScreen";

// Settings Sub-pages
import AppearanceSettingsScreen from "../screens/settings/AppearanceSettingsScreen";
// SubscriptionSettingsScreen import removed — v1.0: IAP disabled, screen not registered in navigation
import CustomizeAppSettingsScreen from "../screens/settings/CustomizeAppSettingsScreen";
import AccessibilitySettingsScreen from "../screens/settings/AccessibilitySettingsScreen";
import SafetySettingsScreen from "../screens/settings/SafetySettingsScreen";
import HelpChatScreen from "../screens/settings/HelpChatScreen";
import DeveloperSettingsScreen from "../screens/settings/DeveloperSettingsScreen";
import LocationSettingsScreen from "../screens/settings/LocationSettingsScreen";
import CalendarPickerScreen from "../screens/CalendarPickerScreen";
import RemindersListPickerScreen from "../screens/RemindersListPickerScreen";
import SupabaseSignInScreen from "../screens/auth/SupabaseSignInScreen";
import SupabaseSignUpScreen from "../screens/auth/SupabaseSignUpScreen";
import SupabaseForgotPasswordScreen from "../screens/auth/SupabaseForgotPasswordScreen";

export type OnboardingStackParamList = {
  Welcome: undefined;
  LanguageSelection: undefined;
  SocialSignIn: undefined;
  Authentication: { mode?: "login" | "create" };
  WelcomeEmailScreen: undefined;
  // SteadiDayOffers removed — v1.0: IAP disabled
  LegalConsent: undefined;
  ConnectAppsIntro: undefined;
  ConnectAppsChoice: undefined;
  ConnectAppsAutoDetect: { category?: string };
  ConnectAppsHealth: undefined;
  ConnectAppsMedication: undefined;
  ConnectAppsCalendar: undefined;
  ConnectAppsAdd: undefined;
  ConnectAppsDetail: { appId: string };
  ConnectAppsConfirmation: { fromCategory?: string };
  FallDetectionSetup: undefined;
  UserName: undefined;
  LocationPermission: undefined;
  FavoriteContacts: undefined;
  EmergencyContact: undefined;
  MedicalIDSetup: undefined;
  NotificationSettings: undefined;
  SoundsAndHaptics: undefined;
  MultipleMedications: undefined;
  MultipleTasksScreen: undefined;
  ExampleMedication: undefined;
  ExampleTask: undefined;
  Tutorial: undefined;
  TextSizeSelection: undefined;
  AccessibilitySetup: undefined;
  AllSet: undefined;
  CalendarPicker: { fromOnboarding?: boolean };
  RemindersListPicker: { fromOnboarding?: boolean };
};

export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Meds: undefined;
  Medical: undefined;
  Health: undefined;
  Tools: undefined;
  Connect: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  OnboardingStack: undefined;
  MainTabs: undefined;
  Insurance: undefined;
  Doctors: undefined;
  Feedback: undefined;
  EmergencyContacts: undefined;
  FavoriteContacts: undefined;
  ConnectedApps: undefined;
  SecuritySettings: undefined;
  NotificationSettings: undefined;
  SoundsAndHaptics: undefined;
  LanguageSelection: undefined;
  Health: undefined;
  // MedicalID removed - Medical ID feature removed from app
  LegalPrivacy: undefined;
  About: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  LiabilityWaiver: undefined;
  SecurityStatement: undefined;
  DataRetentionPolicy: undefined;
  DataBreachResponse: undefined;
  PrivacySecurity: undefined;
  TaskTemplates: undefined;
  HealthScreenings: undefined;
  LabResults: undefined;
  MedicationRecords: undefined;
  LearningBites: { category?: string };
  HealthRecordsHelp: undefined;
  CareSummary: undefined;
  CareViewMode: undefined;
  Tutorial: undefined;
  // Settings Sub-pages
  AppearanceSettings: undefined;
  SubscriptionSettings: undefined;
  CustomizeAppSettings: undefined;
  AccessibilitySettings: undefined;
  SafetySettings: undefined;
  HelpScreen: undefined;
  DeveloperSettings: undefined;
  LocationSettings: undefined;
  // Calendar/Reminders picker screens
  CalendarPicker: { fromOnboarding?: boolean };
  RemindersListPicker: { fromOnboarding?: boolean };
  // Cloud account (Supabase) — opt-in for existing users
  SupabaseSignIn: undefined;
  SupabaseSignUp: undefined;
  SupabaseForgotPassword: undefined;
};

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen name="Tutorial" component={TutorialScreen} />
      <OnboardingStack.Screen name="AccessibilitySetup" component={AccessibilitySetupScreen} />
      <OnboardingStack.Screen name="TextSizeSelection" component={TextSizeSelectionScreen} />
      <OnboardingStack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <OnboardingStack.Screen name="Authentication" component={AuthenticationScreen} />
      <OnboardingStack.Screen name="WelcomeEmailScreen" component={WelcomeEmailScreen} />
      {/* SteadiDayOffers screen removed — v1.0: IAP disabled */}
      <OnboardingStack.Screen name="LegalConsent" component={LegalConsentScreen} />
      <OnboardingStack.Screen name="ConnectAppsIntro" component={ConnectAppsIntroScreen} />
      <OnboardingStack.Screen name="ConnectAppsChoice" component={ConnectAppsChoiceScreen} />
      <OnboardingStack.Screen name="ConnectAppsAutoDetect" component={ConnectAppsAutoDetectScreen} />
      <OnboardingStack.Screen name="ConnectAppsHealth" component={ConnectAppsHealthScreen} />
      <OnboardingStack.Screen name="ConnectAppsMedication" component={ConnectAppsMedicationScreen} />
      <OnboardingStack.Screen name="ConnectAppsCalendar" component={ConnectAppsCalendarScreen} />
      <OnboardingStack.Screen name="ConnectAppsAdd" component={ConnectAppsAddScreen} />
      <OnboardingStack.Screen name="ConnectAppsDetail" component={ConnectAppsDetailScreen} />
      <OnboardingStack.Screen name="ConnectAppsConfirmation" component={ConnectAppsConfirmationScreen} />
      {/* UserName screen removed - "A little about you" screen removed from onboarding */}
      <OnboardingStack.Screen name="LocationPermission" component={LocationPermissionScreen} />
      {/* FavoriteContacts screen removed - Favorite Contacts feature removed */}
      <OnboardingStack.Screen name="EmergencyContact" component={EmergencyContactScreen} />
      {/* MedicalIDSetup screen removed - Medical ID feature removed from app */}
      <OnboardingStack.Screen name="FallDetectionSetup" component={FallDetectionSetupScreen} />
      <OnboardingStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <OnboardingStack.Screen name="SoundsAndHaptics" component={SoundsAndHapticsScreen} />
      <OnboardingStack.Screen name="MultipleMedications" component={MultipleMedicationsScreen} />
      <OnboardingStack.Screen name="MultipleTasksScreen" component={MultipleTasksScreen} />
      <OnboardingStack.Screen name="ExampleMedication" component={ExampleMedicationScreen} />
      <OnboardingStack.Screen name="ExampleTask" component={ExampleTaskScreen} />
      <OnboardingStack.Screen name="AllSet" component={AllSetScreen} />
      <OnboardingStack.Screen name="CalendarPicker" component={CalendarPickerScreen} />
      <OnboardingStack.Screen name="RemindersListPicker" component={RemindersListPickerScreen} />
    </OnboardingStack.Navigator>
  );
}

function CustomTabBar({ state, descriptors, navigation, onTabChange }: BottomTabBarProps & { onTabChange?: (tabName: TabName) => void }) {
  const textSize = useSettingsStore((s) => s.textSize);
  const slowModeEnabled = useSettingsStore((s) => s.slowModeEnabled) ?? true;
  const hasSeenTabScrollHint = useUIStore((s) => s.hasSeenTabScrollHint);
  const markTabScrollHintSeen = useUIStore((s) => s.markTabScrollHintSeen);
  const resetTabScrollHint = useUIStore((s) => s.resetTabScrollHint);
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);
  const { colors } = useTheme();
  const responsive = useResponsive();
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const wasPremiumRef = useRef(isPremiumUnlocked);

  // Reset tab scroll hint when user upgrades to Premium
  useEffect(() => {
    if (isPremiumUnlocked && !wasPremiumRef.current) {
      // User just upgraded to Premium - reset the scroll hint so they see it
      resetTabScrollHint();
    }
    wasPremiumRef.current = isPremiumUnlocked;
  }, [isPremiumUnlocked, resetTabScrollHint]);

  // Only show scroll hint for Premium users - Essentials has fewer tabs
  useEffect(() => {
    if (hasCompletedOnboarding && !hasSeenTabScrollHint && state.index === 0 && isPremiumUnlocked) {
      // Delay showing the hint to let the user orient themselves
      const timer = setTimeout(() => {
        setShowScrollHint(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding, hasSeenTabScrollHint, state.index, isPremiumUnlocked]);

  const handleDismissScrollHint = useCallback(() => {
    setShowScrollHint(false);
    markTabScrollHintSeen();
  }, [markTabScrollHintSeen]);

  // Auto-dismiss on user scroll
  const handleScroll = useCallback(() => {
    if (showScrollHint) {
      handleDismissScrollHint();
    }
  }, [showScrollHint, handleDismissScrollHint]);

  const getLabelSize = () => {
    const boost = slowModeEnabled ? 2 : 0;
    const base = (textSize === "extra-large" ? 18 : textSize === "large" ? 16 : 14) + boost;
    if (responsive.isLandscape && responsive.isPhone) return base - 2;
    return base;
  };

  const getIconSize = () => {
    const boost = slowModeEnabled ? 4 : 0;
    const base = (textSize === "extra-large" ? 40 : textSize === "large" ? 36 : 32) + boost;
    if (responsive.isLandscape && responsive.isPhone) return Math.round(base * 0.8);
    return base;
  };

  return (
    <>
      <View
        style={{
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          paddingBottom: responsive.isLandscape && responsive.isPhone ? 6 : (slowModeEnabled ? 16 : 12),
          paddingTop: responsive.isLandscape && responsive.isPhone ? 6 : (slowModeEnabled ? 16 : 12),
        }}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={handleScroll}
          contentContainerStyle={
            responsive.isTablet
              ? {
                  flexGrow: 1,
                  justifyContent: "center" as const,
                  paddingHorizontal: 24,
                  gap: 8,
                }
              : {
                  flexGrow: 1,
                  justifyContent: "space-around" as const,
                  minWidth: "100%",
                  paddingHorizontal: 8,
                }
          }
        >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!event.defaultPrevented) {
                if (isFocused) {
                  // If already on this tab, pop to the root of the nested stack
                  // This handles the case where user is on a sub-screen (like Flashlight)
                  // and taps the tab again to go back to the main list
                  // Navigate to the nested home screen for tabs with nested stacks
                  const nestedHomeScreen = getHomeScreenName(route.name);
                  if (nestedHomeScreen) {
                    navigation.navigate(route.name, { screen: nestedHomeScreen });
                  }
                } else {
                  navigation.navigate(route.name);
                  // Notify parent of tab change
                  if (onTabChange) {
                    onTabChange(route.name as TabName);
                  }
                }
              }
            };

            // Get the home screen name for nested navigators
            const getHomeScreenName = (tabName: string): string | undefined => {
              switch (tabName) {
                case "Tools":
                  return "ToolsHome";
                default:
                  return undefined;
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            const color = isFocused ? colors.tabBarActive : colors.tabBarInactive;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={{
                  flex: responsive.isTablet ? undefined : 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: responsive.isLandscape && responsive.isPhone ? 4 : 8,
                  minWidth: responsive.isLandscape && responsive.isPhone ? 56 : 70,
                  paddingHorizontal: responsive.isTablet ? 12 : 0,
                }}
              >
                {options.tabBarIcon &&
                  options.tabBarIcon({
                    focused: isFocused,
                    color: color,
                    size: getIconSize(),
                  })}
                <Text
                  style={{
                    color: color,
                    fontSize: getLabelSize(),
                    fontWeight: "600",
                    marginTop: 4,
                  }}
                >
                  {label as string}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <TabScrollCoachMark
        visible={showScrollHint}
        onDismiss={handleDismissScrollHint}
      />
    </>
  );
}

function MainTabNavigator() {
  const textSize = useSettingsStore((s) => s.textSize);
  const visitedTabs = useUIStore((s) => s.visitedTabs);
  const markTabAsVisited = useUIStore((s) => s.markTabAsVisited);
  const hasSeenTabScrollHint = useUIStore((s) => s.hasSeenTabScrollHint);
  const [currentTabTooltip, setCurrentTabTooltip] = useState<TabName | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>("Home");

  // Premium visibility settings
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);
  const featureVisibility = useSubscriptionStore((s) => s.featureVisibility);

  // NOTE: PremiumSetupFlow is rendered ONLY at App.tsx level to prevent duplicate modal conflicts
  // that cause app freeze when simulating premium on/off

  // Determine which tabs to show based on visibility settings
  // All features are now free - show all tabs based on user's visibility preferences
  const showHomeTab = featureVisibility.sections.home;
  const showMedsTab = featureVisibility.sections.meds;
  const showTasksTab = featureVisibility.sections.tasks;
  const showContactsTab = featureVisibility.sections.contacts;

  // All tabs available to all users
  const showHealthTab = featureVisibility.sections.health;
  const showToolsTab = featureVisibility.sections.tools;
  const showConnectTab = featureVisibility.sections.connect;

  // Mark Home as visited initially and show tooltip for first non-Home tab visits
  useEffect(() => {
    // Mark Home as visited on first load
    if (!visitedTabs.includes("Home")) {
      markTabAsVisited("Home");
    }
  }, []);

  const handleTabChange = useCallback((tabName: TabName) => {
    setActiveTab(tabName);

    // Only show tooltip if this is the first visit to this tab
    // AND the scroll hint has been dismissed (to avoid overlapping guidance)
    if (!visitedTabs.includes(tabName) && hasSeenTabScrollHint) {
      // Small delay to let the screen load first
      setTimeout(() => {
        setCurrentTabTooltip(tabName);
      }, 500);
    }
  }, [visitedTabs, hasSeenTabScrollHint]);

  const handleDismissTabTooltip = useCallback(() => {
    if (currentTabTooltip) {
      markTabAsVisited(currentTabTooltip);
      setCurrentTabTooltip(null);
    }
  }, [currentTabTooltip, markTabAsVisited]);

  // Navigation ref for notification deep linking
  const navigation = useNavigation();

  // Handle notification response (when user taps notification)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        if (data?.screen === "Meds") {
          // Navigate to Meds tab
          try {
            navigation.dispatch(
              CommonActions.navigate({
                name: "Meds",
              })
            );
          } catch (error) {
            logger.error("Error navigating to Meds from notification:", error);
          }
        } else if (data?.screen === "Tasks") {
          // Navigate to Tasks tab
          try {
            navigation.dispatch(
              CommonActions.navigate({
                name: "Tasks",
              })
            );
          } catch (error) {
            logger.error("Error navigating to Tasks from notification:", error);
          }
        }
      }
    );

    return () => subscription.remove();
  }, [navigation]);

  const getIconSize = () => {
    switch (textSize) {
      case "normal":
        return 32;
      case "large":
        return 36;
      case "extra-large":
        return 40;
    }
  };

  return (
    <>
      <OfflineBanner />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => <CustomTabBar {...props} onTabChange={handleTabChange} />}
      >
        {showHomeTab && (
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: "Home",
              tabBarIcon: ({ color, focused }) => <Ionicons name="home" size={getIconSize()} color={color} />,
              tabBarAccessibilityLabel: "Home tab",
            }}
          />
        )}
        {showTasksTab && (
          <Tab.Screen
            name="Tasks"
            component={TasksScreen}
            options={{
              tabBarLabel: "Tasks",
              tabBarIcon: ({ color, focused }) => <Ionicons name="checkbox" size={getIconSize()} color={color} />,
              tabBarAccessibilityLabel: "Tasks tab",
            }}
          />
        )}
        {showMedsTab && (
          <Tab.Screen
            name="Meds"
            component={MedsScreen}
            options={{
              tabBarLabel: "Meds",
              tabBarIcon: ({ color, focused }) => <Ionicons name="medical" size={getIconSize()} color={color} />,
              tabBarAccessibilityLabel: "Medications tab",
            }}
          />
        )}
        {showContactsTab && (
          <Tab.Screen
            name="Medical"
            component={MedicalScreen}
            options={{
              tabBarLabel: "Care Team",
              tabBarIcon: ({ color, focused }) => <Ionicons name="people" size={getIconSize()} color={color} />,
              tabBarAccessibilityLabel: "My Care Team tab",
            }}
          />
        )}
        {showHealthTab && (
          <Tab.Screen
            name="Health"
            component={HealthScreen}
            options={{
              tabBarLabel: "Health",
              tabBarIcon: ({ color, focused }) => <Ionicons name="heart" size={getIconSize()} color={color} />,
              tabBarAccessibilityLabel: "Health tab",
            }}
          />
        )}
        {showToolsTab && (
          <Tab.Screen
            name="Tools"
            component={ToolsScreen}
            options={{
              tabBarLabel: "Tools",
              tabBarIcon: ({ color, focused }) => <Ionicons name="construct" size={getIconSize()} color={color} />,
              tabBarAccessibilityLabel: "Tools tab",
            }}
          />
        )}
        {showConnectTab && (
          <Tab.Screen
            name="Connect"
            component={MindBreaksScreen}
            options={{
              tabBarLabel: "Mind Breaks",
              tabBarIcon: ({ color, focused }) => <Ionicons name="sparkles" size={getIconSize()} color={color} />,
              tabBarAccessibilityLabel: "Mind Breaks tab",
            }}
          />
        )}
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: "Settings",
            tabBarIcon: ({ color, focused }) => <Ionicons name="settings" size={getIconSize()} color={color} />,
            tabBarAccessibilityLabel: "Settings tab",
          }}
        />
      </Tab.Navigator>

      {/* Tab-level tooltip for first-time visits */}
      {currentTabTooltip && (
        <TabTooltip
          visible={!!currentTabTooltip}
          tabName={currentTabTooltip}
          onDismiss={handleDismissTabTooltip}
        />
      )}

      {/* NOTE: PremiumSetupFlow removed - it is rendered ONLY at App.tsx level */}
    </>
  );
}

export default function RootNavigator() {
  // Use userStore for hasCompletedOnboarding (migrated from appStore)
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  // Determine which stack to show:
  // 1. Not authenticated → Show Welcome/Login screen (OnboardingStack)
  // 2. Authenticated but not completed onboarding → Show full onboarding
  // 3. Authenticated and completed onboarding → Show MainTabs
  const showMainTabs = isAuthenticated && hasCompletedOnboarding;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!showMainTabs ? (
        <RootStack.Screen name="OnboardingStack" component={OnboardingNavigator} />
      ) : (
        <>
          <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
          <RootStack.Screen
            name="Insurance"
            component={InsuranceScreen}
            options={{
              headerShown: true,
              headerTitle: "Insurance Cards",
              headerBackTitle: "Care Team",
            }}
          />
          <RootStack.Screen
            name="Doctors"
            component={DoctorsScreen}
            options={{
              headerShown: true,
              headerTitle: "My Doctors",
              headerBackTitle: "Care Team",
            }}
          />
          <RootStack.Screen
            name="Feedback"
            component={FeedbackScreen}
            options={{
              presentation: "modal",
              headerShown: true,
              headerTitle: "Feedback",
              headerLargeTitle: true,
            }}
          />
          <RootStack.Screen
            name="EmergencyContacts"
            component={EmergencyContactsScreen}
            options={{
              headerShown: true,
              headerTitle: "Trusted Contacts",
              headerLargeTitle: true,
            }}
          />
          {/* FavoriteContacts screen removed - Favorite Contacts feature removed */}
          <RootStack.Screen
            name="ConnectedApps"
            component={ConnectedAppsScreen}
            options={{
              headerShown: true,
              headerTitle: "Connected Apps",
              headerLargeTitle: true,
            }}
          />
          <RootStack.Screen
            name="SecuritySettings"
            component={SecuritySettingsScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{
              headerShown: true,
              headerTitle: "Notification Settings",
              headerLargeTitle: true,
            }}
          />
          <RootStack.Screen
            name="SoundsAndHaptics"
            component={SoundsAndHapticsScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="LanguageSelection"
            component={LanguageSelectionScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="Health"
            component={HealthScreen}
            options={{
              headerShown: false,
            }}
          />
          {/* MedicalID screen removed - Medical ID feature removed from app */}
          <RootStack.Screen
            name="LegalPrivacy"
            component={LegalPrivacyScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="About"
            component={AboutScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="TermsOfService"
            component={TermsOfServiceScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="LiabilityWaiver"
            component={LiabilityWaiverScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="SecurityStatement"
            component={SecurityStatementScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="DataRetentionPolicy"
            component={DataRetentionPolicyScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="DataBreachResponse"
            component={DataBreachResponseScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="PrivacySecurity"
            component={PrivacySecurityScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="TaskTemplates"
            component={TaskTemplatesScreen}
            options={{
              presentation: "modal",
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="HealthScreenings"
            component={HealthScreeningsScreen}
            options={{
              headerShown: false,
            }}
          />
          {/* LabResults screen disabled for v1.0 — Clinical Health Records removed */}
          {/* <RootStack.Screen
            name="LabResults"
            component={LabResultsScreen}
            options={{
              headerShown: false,
            }}
          /> */}
          {/* MedicationRecords screen disabled for v1.0 — Clinical Health Records removed */}
          {/* <RootStack.Screen
            name="MedicationRecords"
            component={MedicationRecordsScreen}
            options={{
              headerShown: false,
            }}
          /> */}
          <RootStack.Screen
            name="LearningBites"
            component={LearningBitesScreen}
            options={{
              headerShown: false,
            }}
          />
          {/* HealthRecordsHelp screen disabled for v1.0 — Clinical Health Records removed */}
          {/* <RootStack.Screen
            name="HealthRecordsHelp"
            component={HealthRecordsHelpScreen}
            options={{
              headerShown: false,
            }}
          /> */}
          <RootStack.Screen
            name="CareSummary"
            component={CareSummaryScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="CareViewMode"
            component={CareViewModeScreen}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <RootStack.Screen
            name="AppearanceSettings"
            component={AppearanceSettingsScreen}
            options={{
              headerShown: true,
              headerTitle: "Appearance",
              headerBackTitle: "Settings",
              headerLargeTitle: false,
            }}
          />
          {/* SubscriptionSettings screen removed — v1.0: IAP disabled */}
          <RootStack.Screen
            name="CustomizeAppSettings"
            component={CustomizeAppSettingsScreen}
            options={{
              headerShown: true,
              headerTitle: "Customize App",
              headerBackTitle: "Settings",
              headerLargeTitle: false,
            }}
          />
          <RootStack.Screen
            name="AccessibilitySettings"
            component={AccessibilitySettingsScreen}
            options={{
              headerShown: true,
              headerTitle: "Accessibility",
              headerBackTitle: "Settings",
              headerLargeTitle: false,
            }}
          />
          <RootStack.Screen
            name="SafetySettings"
            component={SafetySettingsScreen}
            options={{
              headerShown: true,
              headerTitle: "Safety",
              headerBackTitle: "Settings",
              headerLargeTitle: false,
            }}
          />
          <RootStack.Screen
            name="HelpScreen"
            component={HelpChatScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="DeveloperSettings"
            component={DeveloperSettingsScreen}
            options={{
              headerShown: true,
              headerTitle: "Developer",
              headerBackTitle: "Settings",
              headerLargeTitle: false,
            }}
          />
          <RootStack.Screen
            name="LocationSettings"
            component={LocationSettingsScreen}
            options={{
              headerShown: true,
              headerTitle: "Location",
              headerBackTitle: "Settings",
              headerLargeTitle: false,
            }}
          />
          <RootStack.Screen
            name="Tutorial"
            component={TutorialScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <RootStack.Screen
            name="CalendarPicker"
            component={CalendarPickerScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <RootStack.Screen
            name="RemindersListPicker"
            component={RemindersListPickerScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <RootStack.Screen
            name="SupabaseSignIn"
            component={SupabaseSignInScreen}
            options={{
              headerShown: true,
              headerTitle: "Sign In",
              presentation: "modal",
            }}
          />
          <RootStack.Screen
            name="SupabaseSignUp"
            component={SupabaseSignUpScreen}
            options={{
              headerShown: true,
              headerTitle: "Create Account",
              presentation: "modal",
            }}
          />
          <RootStack.Screen
            name="SupabaseForgotPassword"
            component={SupabaseForgotPasswordScreen}
            options={{
              headerShown: true,
              headerTitle: "Reset Password",
              presentation: "modal",
            }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}
