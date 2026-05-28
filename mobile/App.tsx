// Cross-platform bug fixes applied 2026-05-08
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import RootNavigator from "./src/navigation/RootNavigator";
import React, { useEffect, useState, Component, ErrorInfo } from "react";
import { useAppStore } from "./src/state/appStore";
import { useSettingsStore } from "./src/state/stores/settingsStore";
import { useTaskStore } from "./src/state/stores/taskStore";
import { useMedicationStore } from "./src/state/stores/medicationStore";
import { useSubscriptionStore } from "./src/state/stores/subscriptionStore";
import { ESSENTIALS_LIMITS } from "./src/config/featureAccess";
import { View, ActivityIndicator, Text, ScrollView, Pressable, AppState as RNAppState } from "react-native";
import PinLockScreen from "./src/components/PinLockScreen";
import EmailVerificationHandler from "./src/components/EmailVerificationHandler";
import { ConfirmModalProvider } from "./src/components/ConfirmModal";
import { restoreDemoModeIfActive } from "./src/utils/demoMode";
import {
  isRevenueCatEnabled,
  getCustomerInfo,
} from "./src/lib/revenuecatClient";
import {
  useActionBasedTips,
  useAppMigration,
  useAppLock,
  useNotificationHandlers,
} from "./src/hooks";
import { logger } from "./src/utils/logger";
import { useEngagementStore } from "./src/state/stores/engagementStore";
import { maybeRequestReview } from "./src/utils/reviewPrompt";
import { trackAppOpen } from "./src/utils/analytics";
import {
  scheduleMindBreaksReminder,
  cancelMindBreaksReminder,
} from "./src/utils/notifications";
import { recordError } from "./src/utils/firebase";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { migrateLocalDataToSupabase, pushLocalDataToSupabase } from "./src/lib/supabaseMigration";
import { syncDailyActivitySummary } from "./src/services/activitySync";
import { drainSyncQueue, registerSyncQueueDrain } from "./src/services/syncService";

// =============================================================================
// GLOBAL ERROR HANDLER - Prevents crashes from unhandled JS exceptions
// =============================================================================
// Note: This runs AFTER index.ts error handler but provides additional protection
if (!__DEV__) {
  // In production, set up a global error handler to prevent crashes
  try {
    const originalHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
    (global as any).ErrorUtils?.setGlobalHandler?.((error: Error, isFatal: boolean) => {
      // Log the error but don't crash
      logger.error("[App.GlobalErrorHandler] Caught error:", error?.message || error);
      console.error("[App.GlobalErrorHandler]", error?.message || error);
      try { recordError(error, `[App.GlobalErrorHandler] isFatal=${isFatal}`); } catch {}

      // For non-fatal errors, call the original handler
      if (!isFatal && originalHandler) {
        try {
          originalHandler(error, isFatal);
        } catch {
          // Ignore errors from original handler
        }
      }
      // For fatal errors, we just log - don't call original handler as it would crash the app
    });
  } catch {
    // If setting up error handler fails, just continue
    logger.error("[App.GlobalErrorHandler] Failed to set up global error handler");
  }
}

// Global error boundary to catch and display JavaScript errors
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("[ErrorBoundary] Caught error:", error);
    logger.error("[ErrorBoundary] Error info:", errorInfo);
    console.error("[ErrorBoundary]", error?.message, errorInfo?.componentStack);
    try { recordError(error, "[App.ErrorBoundary]"); } catch {}
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: "#FFF9ED", padding: 20, paddingTop: 80, alignItems: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1A1A1A", marginBottom: 16 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 16, color: "#666", textAlign: "center", marginBottom: 24 }}>
            The app encountered an error. Please try again.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            style={{
              backgroundColor: "#6DB193",
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 12,
              marginBottom: 32,
            }}
          >
            <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>Try Again</Text>
          </Pressable>
          {__DEV__ && (
            <ScrollView style={{ flex: 1, width: "100%" }}>
              <Text style={{ fontSize: 14, color: "#CC3A3A", marginBottom: 8 }}>
                {this.state.error?.message || "Unknown error"}
              </Text>
              <Text style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>
                {this.state.error?.stack || "No stack trace"}
              </Text>
            </ScrollView>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project.
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

// Navigation ref for navigating from outside NavigationContainer
const navigationRef = createNavigationContainerRef<any>();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  // Store state
  const hasHydrated = useAppStore((s) => s._hasHydrated) ?? false;
  const performTwoWaySync = useAppStore((s) => s.performTwoWaySync);
  const calendarSyncEnabled = useSettingsStore((s) => s.calendarSyncEnabled);
  const voiceGuidanceEnabled = useSettingsStore((s) => s.voiceGuidanceEnabled);
  const language = useSettingsStore((s) => s.language);
  const toggleTaskComplete = useTaskStore((s) => s.toggleTaskComplete);
  const enforceEssentialsLimit = useTaskStore((s) => s.enforceEssentialsLimit);
  const logMedication = useMedicationStore((s) => s.logMedication);
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);

  // =========================================================================
  // EXTRACTED HOOKS - migration, lock screen, notifications, premium setup
  // =========================================================================

  // Migration hook - runs one-time migration from legacy store
  const { migrationChecked } = useAppMigration();

  // App lock hook - manages PIN lock screen
  const { isLocked, unlock } = useAppLock();

  // Notification handlers - sets up notification actions and announcements
  useNotificationHandlers({
    logMedication,
    toggleTaskComplete,
    voiceGuidanceEnabled,
    language,
  });

  // Action-based tips (triggered by user behavior and milestones)
  useActionBasedTips();

  // Mind Breaks reminder settings
  const mindBreaksReminderEnabled = useSettingsStore(
    (s) => s.mindBreaksReminderEnabled
  );
  const mindBreaksReminderTime = useSettingsStore(
    (s) => s.mindBreaksReminderTime
  );

  // Track app opens and maybe request review
  useEffect(() => {
    const engagement = useEngagementStore.getState();
    engagement.incrementAppOpen();

    // Fire GA4 first_open / session_start for Google Ads conversion tracking
    trackAppOpen();

    // Delay review prompt by 3 seconds so app is fully loaded
    const timer = setTimeout(() => {
      maybeRequestReview();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Mind Breaks reminder management
  useEffect(() => {
    if (mindBreaksReminderEnabled) {
      scheduleMindBreaksReminder(mindBreaksReminderTime);
    } else {
      cancelMindBreaksReminder();
    }
  }, [mindBreaksReminderEnabled, mindBreaksReminderTime]);

  // =========================================================================
  // APP INITIALIZATION - RevenueCat, demo mode, calendar sync
  // =========================================================================
  useEffect(() => {
    if (!hasHydrated) return;

    // Restore demo mode if it was active before app restart
    restoreDemoModeIfActive().catch((error) => {
      logger.error("[App] Failed to restore demo mode:", error);
    });

    // v1.0: RevenueCat disabled — IAP removed
    // Initialize RevenueCat SDK safely, then verify subscription
    const initAndVerify = async () => {
      try {
        // v1.0: RevenueCat disabled — IAP removed
        // const initResult = await initializeRevenueCatSDK();
        // logger.log("[App] RevenueCat initialization result:", initResult);
        // logger.log("[App] RevenueCat enabled after init:", isRevenueCatEnabled());
      } catch (error) {
        logger.error("[App] RevenueCat initialization failed:", error);
      }

      if (!isRevenueCatEnabled()) {
        logger.log("[App] RevenueCat not configured, skipping verification");
        return;
      }

      try {
        const result = await getCustomerInfo();
        if (result.ok) {
          useSubscriptionStore.getState().setLastVerifiedAt(new Date().toISOString());

          const activeEntitlements = result.data.entitlements.active || {};
          const hasActiveEntitlement = Object.keys(activeEntitlements).length > 0;
          const currentState = useSubscriptionStore.getState();

          logger.log("[App] Subscription verification - hasActiveEntitlement:", hasActiveEntitlement,
            "localPremium:", currentState.isPremiumUnlocked);

          if (hasActiveEntitlement && !currentState.isPremiumUnlocked) {
            logger.log("[App] Restoring subscription from RevenueCat");
            const entitlement = Object.values(activeEntitlements)[0] as any;
            const productId = entitlement?.productIdentifier || "";

            let tier: "monthly" | "annual" | "lifetime" = "lifetime";
            if (productId.includes("monthly")) tier = "monthly";
            else if (productId.includes("annual") || productId.includes("yearly")) tier = "annual";

            currentState.restorePurchase(true, tier, entitlement?.expirationDate);
          } else if (!hasActiveEntitlement && currentState.isPremiumUnlocked) {
            logger.log("[App] Subscription expired per RevenueCat, updating local state");
            currentState.expireSubscription();
          }
        } else {
          logger.log("[App] RevenueCat verification failed (API error), keeping current premium state");
        }
      } catch (error) {
        logger.error("[App] Failed to verify subscription:", error);
      }
    };

    initAndVerify();
    setIsReady(true);

    // Perform two-way calendar sync if enabled
    if (calendarSyncEnabled) {
      logger.log("[App] Performing initial two-way sync...");
      performTwoWaySync().catch((error) => {
        logger.error("[App] Failed to perform two-way sync:", error);
      });
    }
  }, [hasHydrated, calendarSyncEnabled, performTwoWaySync]);

  // Enforce Essentials task limit on startup for non-premium users
  useEffect(() => {
    if (hasHydrated && !isPremiumUnlocked) {
      enforceEssentialsLimit(ESSENTIALS_LIMITS.maxTasks);
    }
  }, [hasHydrated, isPremiumUnlocked, enforceEssentialsLimit]);

  // =========================================================================
  // RENDER
  // =========================================================================

  // Show loading screen while migration is running or store is hydrating
  if (!migrationChecked || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F7F7" }}>
        <ActivityIndicator size="large" color="#2F80ED" />
      </View>
    );
  }

  // Show lock screen if app is locked
  if (isLocked) {
    return (
      <ConfirmModalProvider>
        <PinLockScreen visible={isLocked} onUnlock={unlock} />
      </ConfirmModalProvider>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SupabaseMigrationRunner />
        <ConfirmModalProvider>
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
            <SafeAreaProvider>
              <NavigationContainer ref={navigationRef}>
                <RootNavigator />
                <EmailVerificationHandler />
                <StatusBar style="auto" />
              </NavigationContainer>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </ConfirmModalProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function SupabaseMigrationRunner() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // One-time migration + initial bulk push when a user first appears.
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        await migrateLocalDataToSupabase(userId);
        await pushLocalDataToSupabase(userId);
      } catch (error) {
        logger.error("[App] Supabase initial sync failed:", error);
      }
    })();
  }, [userId]);

  // Activity summary on every foreground while signed in.
  useEffect(() => {
    if (!userId) return;
    syncDailyActivitySummary(userId);
    const subscription = RNAppState.addEventListener("change", (next) => {
      if (next === "active") syncDailyActivitySummary(userId);
    });
    return () => subscription.remove();
  }, [userId]);

  // Drain offline queue on network reconnect + once on startup.
  useEffect(() => {
    drainSyncQueue();
    const unsubscribe = registerSyncQueueDrain();
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  return null;
}
