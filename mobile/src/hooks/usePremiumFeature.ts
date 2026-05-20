import { useState, useCallback } from "react";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { isPremiumFeature, ESSENTIALS_LIMITS } from "../config/featureAccess";

/**
 * Premium Feature Hook
 *
 * IMPORTANT: Limits are based on ACTIVE items only:
 * - Active task: not completed AND not archived
 * - Active medication: not discontinued (status !== "stopped")
 *
 * The currentCount passed to checkItemLimit should only count active items.
 */
export function usePremiumFeature() {
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);
  const subscriptionStatus = useSubscriptionStore((s) => s.subscriptionStatus);
  const getRecommendedTier = useSubscriptionStore((s) => s.getRecommendedTier);
  const isSectionVisible = useSubscriptionStore((s) => s.isSectionVisible);
  const isHomeCardVisible = useSubscriptionStore((s) => s.isHomeCardVisible);
  const isFeatureVisible = useSubscriptionStore((s) => s.isFeatureVisible);

  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [triggeredFeature, setTriggeredFeature] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  // Check if user can access a premium feature
  const checkFeatureAccess = useCallback(
    (featureId: string): boolean => {
      if (!isPremiumFeature(featureId)) return true;
      if (isPremiumUnlocked) return true;
      setTriggeredFeature(featureId);
      setLimitMessage(null);
      setShowUpgradePrompt(true);
      return false;
    },
    [isPremiumUnlocked]
  );

  // Check if adding item would exceed essentials limit
  const checkItemLimit = useCallback(
    (
      type: "medications" | "tasks" | "emergencyContacts",
      currentCount: number
    ): boolean => {
      if (isPremiumUnlocked) return true;

      const limits: Record<string, { limit: number; featureId: string; message: string }> = {
        medications: {
          limit: ESSENTIALS_LIMITS.maxMedications,
          featureId: "medications-unlimited",
          message: `You've reached the limit of ${ESSENTIALS_LIMITS.maxMedications} medications on the free plan.`,
        },
        tasks: {
          limit: ESSENTIALS_LIMITS.maxTasks,
          featureId: "tasks-unlimited",
          message: `You've reached the limit of ${ESSENTIALS_LIMITS.maxTasks} tasks on the free plan.`,
        },
        emergencyContacts: {
          limit: ESSENTIALS_LIMITS.maxEmergencyContacts,
          featureId: "emergency-contacts-unlimited",
          message: `You've reached the limit of ${ESSENTIALS_LIMITS.maxEmergencyContacts} trusted contact on the free plan.`,
        },
      };

      const config = limits[type];
      if (currentCount >= config.limit) {
        setTriggeredFeature(config.featureId);
        setLimitMessage(config.message);
        setShowUpgradePrompt(true);
        return false;
      }
      return true;
    },
    [isPremiumUnlocked]
  );

  // Get remaining count for a limit
  const getRemainingCount = useCallback(
    (type: "medications" | "tasks" | "emergencyContacts", currentCount: number): number => {
      if (isPremiumUnlocked) return Infinity;

      const limit = type === "medications" ? ESSENTIALS_LIMITS.maxMedications :
                    type === "tasks" ? ESSENTIALS_LIMITS.maxTasks :
                    ESSENTIALS_LIMITS.maxEmergencyContacts;

      return Math.max(0, limit - currentCount);
    },
    [isPremiumUnlocked]
  );

  const closeUpgradePrompt = useCallback(() => {
    setShowUpgradePrompt(false);
    setTriggeredFeature(null);
    setLimitMessage(null);
  }, []);

  return {
    // Access checks
    checkFeatureAccess,
    checkItemLimit,
    getRemainingCount,
    isPremiumUnlocked,
    subscriptionStatus,

    // Visibility checks (for Premium users)
    isSectionVisible,
    isHomeCardVisible,
    isFeatureVisible,

    // Upgrade prompt state
    showUpgradePrompt,
    triggeredFeature,
    limitMessage,
    closeUpgradePrompt,

    // Helpers
    recommendedTier: getRecommendedTier(),
    essentialsLimits: ESSENTIALS_LIMITS,
  };
}
