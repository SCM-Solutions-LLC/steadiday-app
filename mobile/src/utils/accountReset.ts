// ============================================================================
// ACCOUNT RESET UTILITIES
// For testing and development purposes
// ============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "./logger";

/**
 * Clears all AsyncStorage data (full app reset)
 * Use with caution - this removes all user data
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.clear();
    logger.log("[AccountReset] All AsyncStorage data cleared");
  } catch (error) {
    logger.error("[AccountReset] Failed to clear AsyncStorage:", error);
    throw error;
  }
}

/**
 * Clears only subscription-related data
 * Useful for testing premium flows
 */
export async function clearSubscriptionData(): Promise<void> {
  try {
    await AsyncStorage.removeItem("subscription-store");
    logger.log("[AccountReset] Subscription data cleared");
  } catch (error) {
    logger.error("[AccountReset] Failed to clear subscription data:", error);
    throw error;
  }
}

/**
 * Clears onboarding state to replay the welcome flow
 */
export async function clearOnboardingData(): Promise<void> {
  try {
    await AsyncStorage.removeItem("app-store");
    logger.log("[AccountReset] Onboarding data cleared");
  } catch (error) {
    logger.error("[AccountReset] Failed to clear onboarding data:", error);
    throw error;
  }
}

/**
 * Clears all user content (medications, tasks, contacts)
 * but keeps settings and preferences
 */
export async function clearUserContent(): Promise<void> {
  try {
    const keysToRemove = [
      "medication-store",
      "task-store",
      "emergency-contacts-store",
      "health-store",
    ];
    await AsyncStorage.multiRemove(keysToRemove);
    logger.log("[AccountReset] User content cleared");
  } catch (error) {
    logger.error("[AccountReset] Failed to clear user content:", error);
    throw error;
  }
}

/**
 * Simulates a premium purchase for testing
 */
export async function simulatePremiumPurchase(
  tier: "monthly" | "annual" | "lifetime"
): Promise<void> {
  try {
    const subscriptionData = {
      state: {
        _hasHydrated: true,
        isPremiumUnlocked: true,
        subscriptionTier: tier,
        subscriptionStatus: "active",
        purchaseDate: new Date().toISOString(),
        expirationDate: tier === "lifetime" ? null : getExpirationDate(tier),
        canceledDate: null,
        previousTiers: [tier],
        totalMonthsSubscribed: 0,
        hasEverCanceled: false,
        featureVisibility: {
          sections: { health: true, tools: true, connect: true },
          homeCards: {
            medications: true,
            tasks: true,
            sos: true,
            steps: true,
            water: true,
            weather: true,
            quickTools: true,
            upcomingAppointments: true,
          },
          features: {
            taskTemplates: true,
            healthScreenings: true,
            calendarSync: true,
            cloudBackup: true,
            customSounds: true,
            colorThemes: true,
          },
        },
        hasSeenPremiumWelcome: false,
        hasCompletedPremiumSetup: false,
        hasSeenPremiumFeatureTips: [],
        activeItemSelections: null,
      },
      version: 0,
    };

    await AsyncStorage.setItem(
      "subscription-store",
      JSON.stringify(subscriptionData)
    );
    logger.log(`[AccountReset] Simulated ${tier} purchase`);
  } catch (error) {
    logger.error("[AccountReset] Failed to simulate purchase:", error);
    throw error;
  }
}

/**
 * Simulates subscription expiration for testing
 */
export async function simulateSubscriptionExpired(): Promise<void> {
  try {
    const existingData = await AsyncStorage.getItem("subscription-store");
    if (existingData) {
      const parsed = JSON.parse(existingData);
      parsed.state.isPremiumUnlocked = false;
      parsed.state.subscriptionStatus = "expired";
      await AsyncStorage.setItem("subscription-store", JSON.stringify(parsed));
      logger.log("[AccountReset] Simulated subscription expiration");
    }
  } catch (error) {
    logger.error("[AccountReset] Failed to simulate expiration:", error);
    throw error;
  }
}

/**
 * Helper to calculate expiration date based on tier
 */
function getExpirationDate(tier: "monthly" | "annual"): string {
  const now = new Date();
  if (tier === "monthly") {
    now.setMonth(now.getMonth() + 1);
  } else {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now.toISOString();
}

/**
 * Gets all stored keys for debugging
 */
export async function getAllStorageKeys(): Promise<readonly string[]> {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    logger.error("[AccountReset] Failed to get keys:", error);
    return [];
  }
}
