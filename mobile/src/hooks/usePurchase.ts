/**
 * usePurchase Hook
 *
 * Centralizes RevenueCat purchase logic so all screens use the same implementation.
 * This ensures purchases work correctly from MedsScreen, TasksScreen, HealthScreen, etc.
 */

import { useState, useCallback, useEffect } from "react";
import {
  useSubscriptionStore,
  SubscriptionTier,
} from "../state/stores/subscriptionStore";
import {
  isRevenueCatEnabled,
  getOfferings,
  purchasePackage,
  restorePurchases,
  reinitializeRevenueCat,
} from "../lib/revenuecatClient";
import { logger } from "../utils/logger";

// Type is inferred from revenuecatClient - don't import from react-native-purchases directly
type PurchasesPackage = any;

export function usePurchase() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packages, setPackages] = useState<Record<string, PurchasesPackage>>(
    {}
  );
  const [isInitializing, setIsInitializing] = useState(false);

  const unlockPremium = useSubscriptionStore((s) => s.unlockPremium);
  const restorePurchase = useSubscriptionStore((s) => s.restorePurchase);

  // Load offerings on mount - with reinitialization attempt if needed
  useEffect(() => {
    const loadOfferings = async () => {
      // If RevenueCat is not enabled, try to reinitialize first
      if (!isRevenueCatEnabled()) {
        logger.log("[usePurchase] RevenueCat not enabled, attempting reinitialization...");
        setIsInitializing(true);
        const reinitSuccess = await reinitializeRevenueCat();
        setIsInitializing(false);

        if (!reinitSuccess) {
          logger.log("[usePurchase] Reinitialization failed");
          return;
        }
        logger.log("[usePurchase] Reinitialization successful");
      }

      if (!isRevenueCatEnabled()) {
        logger.log("[usePurchase] RevenueCat still not enabled after reinit attempt");
        return;
      }

      const result = await getOfferings();
      if (result.ok && result.data.current) {
        const pkgs: Record<string, PurchasesPackage> = {};
        for (const pkg of result.data.current.availablePackages) {
          pkgs[pkg.identifier] = pkg;
        }
        setPackages(pkgs);
        logger.log("[usePurchase] Loaded packages:", Object.keys(pkgs).join(", "));
      }
    };

    loadOfferings();
  }, []);

  // Map tier to RevenueCat package identifier
  const getPackageId = (tier: SubscriptionTier): string => {
    const packageMap: Record<SubscriptionTier, string> = {
      monthly: "$rc_monthly",
      annual: "$rc_annual",
      lifetime: "$rc_lifetime",
    };
    return packageMap[tier];
  };

  // Calculate expiration date based on tier
  const getExpirationDate = (tier: SubscriptionTier): string | undefined => {
    if (tier === "lifetime") return undefined;

    const date = new Date();
    if (tier === "monthly") {
      date.setMonth(date.getMonth() + 1);
    } else if (tier === "annual") {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date.toISOString();
  };

  const handlePurchase = useCallback(
    async (
      tier: SubscriptionTier
    ): Promise<{ success: boolean; message: string }> => {
      setIsLoading(true);
      setError(null);

      try {
        const packageId = getPackageId(tier);
        const pkg = packages[packageId];

        if (isRevenueCatEnabled() && pkg) {
          // Real RevenueCat purchase
          const result = await purchasePackage(pkg);

          if (result.ok) {
            const expDate = getExpirationDate(tier);
            unlockPremium(tier, expDate);
            return { success: true, message: "Premium activated! Welcome aboard." };
          } else {
            // Handle specific error cases
            if (result.reason === "sdk_error") {
              const errorMessage = result.error?.toString() || "";

              // User cancelled
              if (
                errorMessage.includes("cancelled") ||
                errorMessage.includes("canceled")
              ) {
                return { success: false, message: "Purchase cancelled." };
              }

              // Payment failed
              return {
                success: false,
                message: "Purchase failed. Please try again.",
              };
            }

            return {
              success: false,
              message: "Unable to process purchase. Please try again.",
            };
          }
        } else {
          // RevenueCat not available or package not loaded
          // NEVER give free premium - always require actual payment
          if (!isRevenueCatEnabled()) {
            return {
              success: false,
              message: "Unable to load subscription options. Please check your internet connection and try again.",
            };
          }

          // Package not loaded yet - ask user to try again
          return {
            success: false,
            message: "Unable to load subscription options. Please check your internet connection and try again.",
          };
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    [packages, unlockPremium]
  );

  const handleRestore = useCallback(async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    setIsRestoring(true);
    setError(null);

    try {
      if (!isRevenueCatEnabled()) {
        return {
          success: false,
          message: "Unable to restore purchases. Please check your internet connection and try again.",
        };
      }

      const result = await restorePurchases();

      if (result.ok) {
        const activeEntitlements = result.data.entitlements.active || {};
        const hasActiveEntitlement = Object.keys(activeEntitlements).length > 0;

        if (hasActiveEntitlement) {
          // Determine tier from entitlement product identifier
          const entitlement = Object.values(activeEntitlements)[0] as any;
          const productId = entitlement?.productIdentifier || "";

          let tier: SubscriptionTier = "lifetime";
          let expirationDate: string | undefined;

          // Check product identifier to determine tier
          if (productId.includes("monthly")) {
            tier = "monthly";
          } else if (productId.includes("annual") || productId.includes("yearly")) {
            tier = "annual";
          }
          // Otherwise default to lifetime

          // Get expiration date from entitlement if available
          if (entitlement?.expirationDate) {
            expirationDate = entitlement.expirationDate as string;
          }

          restorePurchase(true, tier, expirationDate);
          return { success: true, message: "Purchases restored successfully!" };
        } else {
          return { success: false, message: "No previous purchases found." };
        }
      } else {
        return {
          success: false,
          message: "Could not restore purchases. Please try again.",
        };
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      return { success: false, message };
    } finally {
      setIsRestoring(false);
    }
  }, [restorePurchase]);

  return {
    handlePurchase,
    handleRestore,
    isLoading,
    isRestoring,
    isInitializing,
    error,
    isRevenueCatEnabled: isRevenueCatEnabled(),
  };
}
