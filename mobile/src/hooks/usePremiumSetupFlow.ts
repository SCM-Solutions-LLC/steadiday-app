import { useState, useRef, useCallback, useEffect } from "react";
import { AppState } from "react-native";
import type { NavigationContainerRefWithCurrent } from "@react-navigation/native";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { logger } from "../utils/logger";

// Route name that should block PremiumSetupFlow presentation
const SUBSCRIPTION_SETTINGS_ROUTE = "SubscriptionSettingsScreen";

interface UsePremiumSetupFlowParams {
  navigationRef: NavigationContainerRefWithCurrent<any>;
  hasHydrated: boolean;
}

interface UsePremiumSetupFlowReturn {
  showPremiumSetup: boolean;
  showExpiredModal: boolean;
  handlePremiumSetupComplete: () => void;
  handleResubscribe: () => void;
  handleNavigationStateChange: () => void;
}

/**
 * Hook to manage the premium setup flow modal logic.
 * Extracts the complex premium setup modal presentation logic from App.tsx.
 */
function usePremiumSetupFlow({
  navigationRef,
  hasHydrated,
}: UsePremiumSetupFlowParams): UsePremiumSetupFlowReturn {
  const [showPremiumSetup, setShowPremiumSetup] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [currentRouteName, setCurrentRouteName] = useState<string | null>(null);

  // Single-flight guard for PremiumSetupFlow - prevents multiple presentations
  const premiumSetupPresentedRef = useRef(false);
  // Timer ref for delayed premium setup presentation
  const premiumSetupTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to track previous premium state for logging
  const previousPremiumRef = useRef<boolean | null>(null);

  // Subscription state
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);
  const hasCompletedPremiumSetup = useSubscriptionStore((s) => s.hasCompletedPremiumSetup);
  const subscriptionStatus = useSubscriptionStore((s) => s.subscriptionStatus);
  const isDevModeSimulation = useSubscriptionStore((s) => s.isDevModeSimulation);

  // Helper to get current route name from navigation state
  const getCurrentRouteName = useCallback((): string | null => {
    if (!navigationRef.isReady()) return null;

    try {
      const state = navigationRef.getRootState();
      if (!state?.routes?.length) return null;

      // Get the current route, handling nested navigators
      let currentRoute = state.routes[state.index];
      let routeState = currentRoute?.state;

      while (routeState?.routes?.length) {
        const nestedIndex = routeState.index ?? 0;
        const nestedRoute = routeState.routes[nestedIndex];
        if (!nestedRoute?.name) break;
        currentRoute = nestedRoute as typeof currentRoute;
        routeState = nestedRoute.state;
      }
      return currentRoute?.name ?? null;
    } catch {
      return null;
    }
  }, [navigationRef]);

  // Clear premium setup timer
  const clearPremiumSetupTimer = useCallback(() => {
    if (premiumSetupTimerRef.current) {
      clearTimeout(premiumSetupTimerRef.current);
      premiumSetupTimerRef.current = null;
    }
  }, []);

  // Check if we're on the subscription settings screen
  const isOnSubscriptionScreen = useCallback(() => {
    const route = getCurrentRouteName();
    return route === SUBSCRIPTION_SETTINGS_ROUTE || route === "SubscriptionSettings";
  }, [getCurrentRouteName]);

  // Show Premium Setup Flow after purchase (if not completed)
  // Skip for developer mode simulations to prevent crash
  // CRITICAL: Do not present while on SubscriptionSettingsScreen to avoid modal conflicts
  useEffect(() => {
    // Log premium state changes for debugging
    if (previousPremiumRef.current !== null && previousPremiumRef.current !== isPremiumUnlocked) {
      logger.log(
        "[usePremiumSetupFlow] Premium state changed:",
        previousPremiumRef.current,
        "->",
        isPremiumUnlocked,
        "reason:",
        isPremiumUnlocked ? "purchase/restore" : "expired/disabled"
      );
    }
    previousPremiumRef.current = isPremiumUnlocked;

    // Clear any existing timer when conditions change
    clearPremiumSetupTimer();

    if (hasHydrated && isPremiumUnlocked && !hasCompletedPremiumSetup && !isDevModeSimulation) {
      // Check if already presented (single-flight guard)
      if (premiumSetupPresentedRef.current) {
        logger.log("[usePremiumSetupFlow] PremiumSetupFlow already presented, skipping");
        return;
      }

      // Check if on subscription screen - delay presentation
      if (isOnSubscriptionScreen()) {
        logger.log("[usePremiumSetupFlow] On subscription screen, delaying PremiumSetupFlow until route changes");
        return;
      }

      // Schedule the modal with a delay to avoid conflicts
      premiumSetupTimerRef.current = setTimeout(() => {
        // Double-check conditions are still valid before showing
        if (premiumSetupPresentedRef.current) {
          logger.log("[usePremiumSetupFlow] PremiumSetupFlow guard triggered during timer");
          return;
        }
        if (isOnSubscriptionScreen()) {
          logger.log("[usePremiumSetupFlow] Still on subscription screen, aborting PremiumSetupFlow");
          return;
        }
        // CRITICAL: Check dev mode simulation flag right before showing
        // This guards against race conditions where dev mode was enabled after timer started
        const currentDevMode = useSubscriptionStore.getState().isDevModeSimulation;
        if (currentDevMode) {
          logger.log("[usePremiumSetupFlow] Dev mode simulation active, aborting PremiumSetupFlow");
          return;
        }

        logger.log("[usePremiumSetupFlow] Opening PremiumSetupFlow modal");
        premiumSetupPresentedRef.current = true;
        setShowPremiumSetup(true);
      }, 500);

      return () => clearPremiumSetupTimer();
    } else if (hasHydrated && (!isPremiumUnlocked || isDevModeSimulation)) {
      // Safety guard: Force premium modal closed when premium is disabled or in dev mode
      // This prevents the app from freezing when toggling Premium OFF in Developer Options
      if (showPremiumSetup) {
        logger.log("[usePremiumSetupFlow] Closing PremiumSetupFlow - premium disabled or dev mode");
      }
      setShowPremiumSetup(false);
      // Clear any pending timer to prevent race conditions
      clearPremiumSetupTimer();
      // Reset the guard so it can show again on next real purchase
      // For dev mode, reset it immediately so simulations don't block future real purchases
      if (!isPremiumUnlocked || isDevModeSimulation) {
        premiumSetupPresentedRef.current = false;
      }
    }
  }, [
    hasHydrated,
    isPremiumUnlocked,
    hasCompletedPremiumSetup,
    isDevModeSimulation,
    isOnSubscriptionScreen,
    clearPremiumSetupTimer,
    showPremiumSetup,
  ]);

  // Show Subscription Expired Modal when status changes to expired
  useEffect(() => {
    if (hasHydrated && subscriptionStatus === "expired") {
      const timer = setTimeout(() => {
        setShowExpiredModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasHydrated, subscriptionStatus]);

  // Handle navigation state changes to track current route
  const handleNavigationStateChange = useCallback(() => {
    const routeName = getCurrentRouteName();
    if (routeName !== currentRouteName) {
      logger.log("[usePremiumSetupFlow] Route changed:", currentRouteName, "->", routeName);
      setCurrentRouteName(routeName);

      // If we left the subscription screen and premium setup is pending, trigger it now
      if (
        currentRouteName === SUBSCRIPTION_SETTINGS_ROUTE &&
        routeName !== SUBSCRIPTION_SETTINGS_ROUTE &&
        isPremiumUnlocked &&
        !hasCompletedPremiumSetup &&
        !isDevModeSimulation &&
        !premiumSetupPresentedRef.current &&
        !showPremiumSetup
      ) {
        logger.log("[usePremiumSetupFlow] Left subscription screen, now showing PremiumSetupFlow");
        premiumSetupPresentedRef.current = true;
        setShowPremiumSetup(true);
      }
    }
  }, [
    currentRouteName,
    getCurrentRouteName,
    isPremiumUnlocked,
    hasCompletedPremiumSetup,
    isDevModeSimulation,
    showPremiumSetup,
  ]);

  // Cleanup timers on unmount and handle app background state
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        // Clear premium setup timer when app goes to background
        clearPremiumSetupTimer();
        logger.log("[usePremiumSetupFlow] App backgrounded, cleared premium setup timer");
      }
    });

    return () => {
      subscription.remove();
      clearPremiumSetupTimer();
    };
  }, [clearPremiumSetupTimer]);

  // Handle premium setup completion
  const handlePremiumSetupComplete = useCallback(() => {
    logger.log("[usePremiumSetupFlow] PremiumSetupFlow completed, closing modal");
    setShowPremiumSetup(false);
  }, []);

  // Handle resubscribe from expired modal
  const handleResubscribe = useCallback(() => {
    // Close modal - the modal itself should navigate to SubscriptionSettings
    setShowExpiredModal(false);
  }, []);

  return {
    showPremiumSetup,
    showExpiredModal,
    handlePremiumSetupComplete,
    handleResubscribe,
    handleNavigationStateChange,
  };
}

export default usePremiumSetupFlow;
