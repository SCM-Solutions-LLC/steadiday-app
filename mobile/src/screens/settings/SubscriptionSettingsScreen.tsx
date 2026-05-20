import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking, Platform } from "react-native";
import { Screen } from "../../components/Screen";
import { useToast } from "../../components/ui";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useSubscriptionStore, SubscriptionTier } from "../../state/stores/subscriptionStore";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import { PRICING, PREMIUM_FEATURES } from "../../config/featureAccess";
import { openPrivacyPolicy, openTermsOfService } from "../../utils/openURL";
import { PaymentConfirmationModal } from "../../components/premium";
import {
  isRevenueCatEnabled,
  getOfferings,
  purchasePackage,
  restorePurchases,
  reinitializeRevenueCat,
} from "../../lib/revenuecatClient";
import * as Haptics from "expo-haptics";
import { logger } from "../../utils/logger";

// Screen name exported for route detection in App.tsx
export const SUBSCRIPTION_SETTINGS_ROUTE = "SubscriptionSettingsScreen";

/**
 * SubscriptionSettingsScreen - Manage subscription and payment options
 *
 * Senior-friendly features:
 * - Clear display of current plan
 * - Large, easy-to-tap payment options
 * - Payment confirmation before purchase
 * - Easy restore purchases option
 */
export default function SubscriptionSettingsScreen() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight } = useTheme();

  // Settings
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);

  // Subscription state
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);
  const subscriptionTier = useSubscriptionStore((s) => s.subscriptionTier);
  const subscriptionStatus = useSubscriptionStore((s) => s.subscriptionStatus);
  const expirationDate = useSubscriptionStore((s) => s.expirationDate);
  const unlockPremium = useSubscriptionStore((s) => s.unlockPremium);
  const restorePurchase = useSubscriptionStore((s) => s.restorePurchase);

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [packages, setPackages] = useState<Record<string, unknown>>({});
  const [offeringsLoaded, setOfferingsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const [hasAttemptedReinit, setHasAttemptedReinit] = useState(false);

  // Guard ref to prevent double taps during purchase/restore
  const purchaseInProgressRef = useRef(false);

  const { showSuccess, showError, ToastComponent } = useToast();

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  // Load RevenueCat offerings - extracted as callback for retry functionality
  const loadOfferings = useCallback(async (attemptReinit: boolean = false) => {
    // If RevenueCat is not enabled and we should attempt reinitialization
    if (!isRevenueCatEnabled() && attemptReinit) {
      logger.log("[Subscription] RevenueCat not enabled, attempting reinitialization...");
      setIsLoadingOfferings(true);
      setLoadError(null);

      const reinitSuccess = await reinitializeRevenueCat();
      if (!reinitSuccess) {
        logger.log("[Subscription] Reinitialization failed");
        setOfferingsLoaded(false);
        setLoadError("Unable to load subscription options. Please check your internet connection and try again.");
        setIsLoadingOfferings(false);
        return;
      }
      logger.log("[Subscription] Reinitialization successful, proceeding to load offerings");
    }

    if (!isRevenueCatEnabled()) {
      logger.log("[Subscription] RevenueCat not enabled, skipping offerings load");
      setOfferingsLoaded(false);
      setLoadError("Unable to load subscription options. Please check your internet connection and try again.");
      return;
    }

    setIsLoadingOfferings(true);
    setLoadError(null);
    logger.log("[Subscription] Loading offerings from RevenueCat...");

    try {
      const result = await getOfferings();

      if (result.ok && result.data.current) {
        const pkgs: Record<string, unknown> = {};
        const packageIds: string[] = [];

        for (const pkg of result.data.current.availablePackages) {
          pkgs[pkg.identifier] = pkg;
          packageIds.push(pkg.identifier);
        }

        logger.log("[Subscription] Offerings loaded - count:", Object.keys(pkgs).length, "packages:", packageIds.join(", "));

        setPackages(pkgs);
        const hasPackages = Object.keys(pkgs).length > 0;
        setOfferingsLoaded(hasPackages);

        if (!hasPackages) {
          logger.log("[Subscription] No packages found in offerings");
          setLoadError("Unable to load subscription options. Please check your internet connection and try again.");
        }
      } else {
        logger.log("[Subscription] getOfferings failed or no current offering");
        setOfferingsLoaded(false);
        setLoadError("Unable to load subscription options. Please check your internet connection and try again.");
      }
    } catch (error) {
      logger.error("[Subscription] Error loading offerings:", error);
      setOfferingsLoaded(false);
      setLoadError("Unable to load subscription options. Please check your internet connection and try again.");
    } finally {
      setIsLoadingOfferings(false);
    }
  }, []);

  // Handle retry button press - attempts reinitialization then loads offerings
  const handleRetryLoadOfferings = useCallback(async () => {
    logger.log("[Subscription] Retry button pressed - attempting reinitialization");
    await loadOfferings(true);
  }, [loadOfferings]);

  // Load RevenueCat offerings on mount - auto-retry if not enabled
  useEffect(() => {
    const initAndLoad = async () => {
      if (!isRevenueCatEnabled() && !hasAttemptedReinit) {
        logger.log("[Subscription] Screen mounted, RevenueCat not enabled - attempting auto-reinit");
        setHasAttemptedReinit(true);
        await loadOfferings(true);
      } else {
        await loadOfferings(false);
      }
    };
    initAndLoad();
  }, [loadOfferings, hasAttemptedReinit]);

  const handleSelectTier = useCallback((tier: SubscriptionTier) => {
    // Guard against double taps or taps while another operation is in progress
    if (purchaseInProgressRef.current || showConfirmation) {
      logger.log("[Subscription] Ignoring tier selection - operation in progress");
      return;
    }

    // Guard against opening modal if offerings not loaded
    if (!offeringsLoaded) {
      logger.log("[Subscription] Ignoring tier selection - offerings not loaded");
      showError(loadError || "Unable to load subscription options. Please try again in a moment.");
      return;
    }

    triggerHaptic();
    setSelectedTier(tier);
    setShowConfirmation(true);
    logger.log("[Subscription] Confirmation modal opened for tier:", tier);
  }, [triggerHaptic, showConfirmation, offeringsLoaded, loadError, showError]);

  const handleConfirmPurchase = useCallback(async () => {
    if (!selectedTier) return;

    // Prevent double purchases
    if (purchaseInProgressRef.current) {
      logger.log("[Subscription] Ignoring purchase - already in progress");
      return;
    }

    purchaseInProgressRef.current = true;
    setIsLoading(true);
    logger.log("[Subscription] Starting purchase for tier:", selectedTier);

    try {
      // Map tier to RevenueCat package identifier
      const packageMap: Record<SubscriptionTier, string> = {
        monthly: "$rc_monthly",
        annual: "$rc_annual",
        lifetime: "$rc_lifetime",
      };

      const packageId = packageMap[selectedTier];
      const pkg = packages[packageId];

      if (isRevenueCatEnabled() && pkg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await purchasePackage(pkg as any);
        if (result.ok) {
          // Calculate expiration date based on tier
          let expDate: string | undefined;
          if (selectedTier === "monthly") {
            const date = new Date();
            date.setMonth(date.getMonth() + 1);
            expDate = date.toISOString();
          } else if (selectedTier === "annual") {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            expDate = date.toISOString();
          }

          // CRITICAL: Close modal FIRST, then update premium state
          // This prevents "Attempt to present... already presenting" iOS error
          logger.log("[Subscription] Purchase successful, closing modal before unlocking premium");
          setShowConfirmation(false);
          setSelectedTier(null);

          // Small delay to ensure modal dismissal completes before premium state change
          // which may trigger PremiumSetupFlow in App.tsx
          setTimeout(() => {
            logger.log("[Subscription] Unlocking premium - tier:", selectedTier, "expDate:", expDate);
            unlockPremium(selectedTier!, expDate);
            showSuccess("Premium activated! Welcome aboard.");
          }, 100);
        } else {
          logger.log("[Subscription] Purchase failed - RevenueCat returned error");
          showError("Purchase failed. Please try again.");
          setShowConfirmation(false);
          setSelectedTier(null);
        }
      } else {
        // RevenueCat not available or package not loaded - show error
        // NEVER give free premium
        if (!isRevenueCatEnabled()) {
          showError("Purchases are not available on this device.");
        } else {
          showError("Unable to load subscription options. Please try again in a moment.");
        }
        setShowConfirmation(false);
        setSelectedTier(null);
      }
    } catch (error) {
      logger.error("[Subscription] Purchase error:", error);
      showError("Something went wrong. Please try again.");
      setShowConfirmation(false);
      setSelectedTier(null);
    } finally {
      setIsLoading(false);
      purchaseInProgressRef.current = false;
      logger.log("[Subscription] Purchase flow completed, guard released");
    }
  }, [selectedTier, packages, unlockPremium, showSuccess, showError]);

  const handleRestore = useCallback(async () => {
    // Prevent restore while another operation is in progress
    if (purchaseInProgressRef.current || isRestoring) {
      logger.log("[Subscription] Ignoring restore - operation in progress");
      return;
    }

    triggerHaptic();
    purchaseInProgressRef.current = true;
    setIsRestoring(true);
    logger.log("[Subscription] Starting restore purchases");

    try {
      if (isRevenueCatEnabled()) {
        const result = await restorePurchases();
        if (result.ok) {
          const activeEntitlements = result.data.entitlements.active || {};
          const hasActiveEntitlement = Object.keys(activeEntitlements).length > 0;

          if (hasActiveEntitlement) {
            // Determine tier from entitlement product identifier
            const entitlement = Object.values(activeEntitlements)[0];
            const productId = (entitlement as { productIdentifier?: string })?.productIdentifier || "";

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
            if ((entitlement as { expirationDate?: string })?.expirationDate) {
              expirationDate = (entitlement as { expirationDate?: string }).expirationDate;
            }

            logger.log("[Subscription] Restore successful, tier:", tier, "expDate:", expirationDate);
            restorePurchase(true, tier, expirationDate);
            showSuccess("Purchases restored successfully!");
          } else {
            logger.log("[Subscription] No previous purchases found");
            showError("No previous purchases found.");
          }
        } else {
          logger.log("[Subscription] Restore failed - RevenueCat returned error");
          showError("Could not restore purchases. Please try again.");
        }
      } else {
        showError("Restore not available. Please try again later.");
      }
    } catch (error) {
      logger.error("[Subscription] Restore error:", error);
      showError("Something went wrong. Please try again.");
    } finally {
      setIsRestoring(false);
      purchaseInProgressRef.current = false;
      logger.log("[Subscription] Restore flow completed, guard released");
    }
  }, [triggerHaptic, restorePurchase, showSuccess, showError, isRestoring]);

  const handleManageSubscription = useCallback(() => {
    triggerHaptic();
    // Open App Store subscription management
    if (Platform.OS === "ios") {
      Linking.openURL("https://apps.apple.com/account/subscriptions");
    } else {
      Linking.openURL("https://play.google.com/store/account/subscriptions");
    }
  }, [triggerHaptic]);

  // Format expiration date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get tier display info
  const getTierDisplayName = (tier: SubscriptionTier | null) => {
    switch (tier) {
      case "lifetime":
        return "Lifetime Premium";
      case "annual":
        return "Annual Premium";
      case "monthly":
        return "Monthly Premium";
      default:
        return "Essentials (Free)";
    }
  };

  return (
    <Screen
      variant="static"
      edges={["top", "bottom"]}
    >
      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={true}
      >
        {/* Current Plan Card */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: isPremiumUnlocked ? colors.premiumLight : colors.cardBackground,
            borderWidth: 2,
            borderColor: isPremiumUnlocked ? colors.premium : colors.border,
          }}
        >
          <View className="flex-row items-center mb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: isPremiumUnlocked ? colors.premium : primary }}
            >
              <Ionicons
                name={isPremiumUnlocked ? "star" : "person"}
                size={32}
                color={colors.onPremium}
              />
            </View>
            <View className="flex-1">
              <Text
                className={`${textClasses.subtitle} font-bold`}
                style={{ color: isPremiumUnlocked ? colors.premiumDark : colors.textPrimary }}
              >
                {getTierDisplayName(subscriptionTier)}
              </Text>
              {isPremiumUnlocked && subscriptionStatus === "active" && (
                <Text
                  className={`${textClasses.body}`}
                  style={{ color: colors.success }}
                >
                  Active
                </Text>
              )}
              {isPremiumUnlocked && subscriptionStatus === "canceled" && (
                <Text
                  className={`${textClasses.body}`}
                  style={{ color: colors.warning }}
                >
                  Canceled - ends {formatDate(expirationDate)}
                </Text>
              )}
            </View>
          </View>

          {/* Expiration info for subscriptions */}
          {isPremiumUnlocked && subscriptionTier !== "lifetime" && expirationDate && (
            <View
              className="py-3 px-4 rounded-xl"
              style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
            >
              <Text
                className={`${textClasses.body}`}
                style={{ color: colors.textSecondary }}
              >
                {subscriptionStatus === "active"
                  ? `Renews on ${formatDate(expirationDate)}`
                  : `Access until ${formatDate(expirationDate)}`}
              </Text>
            </View>
          )}

          {isPremiumUnlocked && subscriptionTier === "lifetime" && (
            <View
              className="py-3 px-4 rounded-xl flex-row items-center"
              style={{ backgroundColor: colors.successBackground }}
            >
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text
                className={`${textClasses.body} ml-2`}
                style={{ color: colors.success }}
              >
                Yours forever - no renewal needed
              </Text>
            </View>
          )}
        </View>

        {/* Premium Features List (for non-premium users) */}
        {!isPremiumUnlocked && (
          <View
            className="rounded-3xl p-6 mb-6"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              className={`${textClasses.subtitle} font-semibold mb-4`}
              style={{ color: colors.textPrimary }}
            >
              Premium Includes:
            </Text>
            {PREMIUM_FEATURES.slice(0, 5).map((feature) => (
              <View key={feature.id} className="flex-row items-center py-2">
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text
                  className={`${textClasses.body} ml-3`}
                  style={{ color: colors.textPrimary }}
                >
                  {feature.name}
                </Text>
              </View>
            ))}
            <Text
              className={`${textClasses.small} mt-2`}
              style={{ color: colors.textSecondary }}
            >
              + {PREMIUM_FEATURES.length - 5} more features
            </Text>

            {/* Apple Health clarification */}
            <View
              className="flex-row items-center py-2 px-3 rounded-lg mt-3"
              style={{ backgroundColor: colors.background }}
            >
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text
                className={`${textClasses.small} ml-2`}
                style={{ color: colors.textSecondary }}
              >
                Health data syncs from Apple Health
              </Text>
            </View>
          </View>
        )}

        {/* Payment Options (for non-premium users) */}
        {!isPremiumUnlocked && (
          <>
            {/* Load error banner with retry */}
            {!!loadError && (
              <View
                className="rounded-2xl p-4 mb-4 flex-row items-start"
                style={{ backgroundColor: colors.warningBackground || "#FEF3C7", borderWidth: 1, borderColor: colors.warning }}
              >
                <Ionicons name="alert-circle" size={22} color={colors.warning} />
                <View className="flex-1 ml-3">
                  <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                    {loadError}
                  </Text>
                  <Pressable
                    onPress={handleRetryLoadOfferings}
                    disabled={isLoadingOfferings}
                    className="mt-3 py-3 rounded-xl items-center flex-row justify-center"
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderWidth: 1,
                      borderColor: colors.border,
                      minHeight: 48,
                      opacity: isLoadingOfferings ? 0.7 : 1,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading subscription options"
                  >
                    {isLoadingOfferings ? (
                      <ActivityIndicator color={primary} size="small" />
                    ) : (
                      <>
                        <Ionicons name="refresh" size={18} color={primary} />
                        <Text className={`${textClasses.body} font-semibold ml-2`} style={{ color: primary }}>
                          Retry
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            <Text
              className={`${textClasses.subtitle} font-semibold mb-4`}
              style={{ color: colors.textPrimary }}
            >
              Choose Your Plan:
            </Text>

            {/* Lifetime - Best Value */}
            <Pressable
              onPress={() => handleSelectTier("lifetime")}
              disabled={!offeringsLoaded}
              className="rounded-2xl p-5 mb-4"
              style={{
                backgroundColor: colors.premiumLight,
                borderWidth: 2,
                borderColor: colors.premium,
                opacity: offeringsLoaded ? 1 : 0.5,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Lifetime access for ${PRICING.lifetime.priceDisplay}. Pay once, yours forever.`}
            >
              <View
                className="absolute -top-3 left-4 px-3 py-1 rounded-full"
                style={{ backgroundColor: colors.premium }}
              >
                <Text className="text-xs font-bold" style={{ color: colors.onPremium }}>BEST VALUE</Text>
              </View>
              <View className="flex-row items-center justify-between mt-2">
                <View>
                  <Text
                    className={`${textClasses.subtitle} font-bold`}
                    style={{ color: colors.textPrimary }}
                  >
                    Lifetime
                  </Text>
                  <Text
                    className={`${textClasses.small}`}
                    style={{ color: colors.textSecondary }}
                  >
                    Pay once, yours forever
                  </Text>
                  <Text
                    className={`${textClasses.small} mt-1`}
                    style={{ color: colors.success }}
                  >
                    No renewals ever
                  </Text>
                </View>
                <Text
                  className={`${textClasses.title} font-bold`}
                  style={{ color: colors.textPrimary }}
                >
                  {PRICING.lifetime.priceDisplay}
                </Text>
              </View>
            </Pressable>

            {/* Annual */}
            <Pressable
              onPress={() => handleSelectTier("annual")}
              disabled={!offeringsLoaded}
              className="rounded-2xl p-5 mb-4"
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: offeringsLoaded ? 1 : 0.5,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Annual plan for ${PRICING.annual.priceDisplay} per year. Save ${PRICING.annual.savingsPercent}%.`}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    className={`${textClasses.subtitle} font-bold`}
                    style={{ color: colors.textPrimary }}
                  >
                    Annual
                  </Text>
                  <Text
                    className={`${textClasses.small}`}
                    style={{ color: colors.textSecondary }}
                  >
                    {PRICING.annual.monthlyEquivalent}/month
                  </Text>
                  <Text
                    className={`${textClasses.small} mt-1`}
                    style={{ color: colors.success }}
                  >
                    Save {PRICING.annual.savingsPercent}%
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className={`${textClasses.title} font-bold`}
                    style={{ color: colors.textPrimary }}
                  >
                    {PRICING.annual.priceDisplay}
                  </Text>
                  <Text
                    className={`${textClasses.small}`}
                    style={{ color: colors.textSecondary }}
                  >
                    per year
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Monthly */}
            <Pressable
              onPress={() => handleSelectTier("monthly")}
              disabled={!offeringsLoaded}
              className="rounded-2xl p-5 mb-6"
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: offeringsLoaded ? 1 : 0.5,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Monthly plan for ${PRICING.monthly.priceDisplay} per month. Cancel anytime.`}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    className={`${textClasses.subtitle} font-bold`}
                    style={{ color: colors.textPrimary }}
                  >
                    Monthly
                  </Text>
                  <Text
                    className={`${textClasses.small}`}
                    style={{ color: colors.textSecondary }}
                  >
                    Cancel anytime
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className={`${textClasses.title} font-bold`}
                    style={{ color: colors.textPrimary }}
                  >
                    {PRICING.monthly.priceDisplay}
                  </Text>
                  <Text
                    className={`${textClasses.small}`}
                    style={{ color: colors.textSecondary }}
                  >
                    per month
                  </Text>
                </View>
              </View>
            </Pressable>
          </>
        )}

        {/* Manage Subscription (for premium users with subscriptions) */}
        {isPremiumUnlocked && subscriptionTier !== "lifetime" && (
          <Pressable
            onPress={handleManageSubscription}
            className="rounded-2xl p-5 mb-4 flex-row items-center justify-between"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            accessibilityRole="button"
            accessibilityLabel="Manage subscription in App Store"
          >
            <View className="flex-row items-center">
              <Ionicons name="settings-outline" size={24} color={primary} />
              <Text
                className={`${textClasses.body} font-semibold ml-3`}
                style={{ color: colors.textPrimary }}
              >
                Manage Subscription
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        )}

        {/* Restore Purchases */}
        <Pressable
          onPress={handleRestore}
          disabled={isRestoring}
          className="rounded-2xl p-5 mb-6 flex-row items-center justify-center"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: isRestoring ? 0.7 : 1,
          }}
          accessibilityRole="button"
          accessibilityLabel="Restore previous purchases"
        >
          {isRestoring ? (
            <ActivityIndicator color={primary} size="small" />
          ) : (
            <>
              <Ionicons name="refresh" size={24} color={primary} />
              <Text
                className={`${textClasses.body} font-semibold ml-3`}
                style={{ color: primary }}
              >
                Restore Purchases
              </Text>
            </>
          )}
        </Pressable>

        {/* Money-back guarantee */}
        {!isPremiumUnlocked && (
          <>
            <View
              className="flex-row items-center justify-center py-3 px-4 rounded-xl mb-4"
              style={{ backgroundColor: colors.successBackground }}
            >
              <Ionicons name="shield-checkmark" size={22} color={colors.success} />
              <Text
                className={`${textClasses.body} ml-2`}
                style={{ color: colors.onSuccess }}
              >
                30-day money-back guarantee
              </Text>
            </View>

            {/* Subscription Details Card - Apple Required */}
            <View
              className="rounded-xl p-4 mb-4"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                className={`${textClasses.small}`}
                style={{ color: colors.textSecondary }}
              >
                <Text style={{ fontWeight: "600" }}>SteadiDay Premium</Text> unlocks unlimited medications, tasks, contacts, health tracking, tools, and customization.
                {"\n\n"}
                <Text style={{ fontWeight: "600" }}>Monthly:</Text> {PRICING.monthly.priceDisplay}/month. Auto-renews monthly.
                {"\n"}
                <Text style={{ fontWeight: "600" }}>Annual:</Text> {PRICING.annual.priceDisplay}/year ({PRICING.annual.monthlyEquivalent}/mo). Auto-renews yearly.
                {"\n"}
                <Text style={{ fontWeight: "600" }}>Lifetime:</Text> {PRICING.lifetime.priceDisplay} one-time purchase. No subscription.
                {"\n\n"}
                Payment is charged to your Apple ID account at confirmation of purchase. Subscriptions auto-renew unless canceled at least 24 hours before the end of the current period. You can manage and cancel subscriptions in your App Store account settings.
              </Text>
            </View>

            {/* Legal Links - Apple Required */}
            <View className="flex-row items-center justify-center mb-6">
              <Pressable onPress={openTermsOfService} accessibilityRole="link">
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: primary, textDecorationLine: "underline" }}
                >
                  Terms of Use
                </Text>
              </Pressable>
              <Text
                className={`${textClasses.small} mx-2`}
                style={{ color: colors.textSecondary }}
              >
                |
              </Text>
              <Pressable onPress={openPrivacyPolicy} accessibilityRole="link">
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: primary, textDecorationLine: "underline" }}
                >
                  Privacy Policy
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Payment Confirmation Modal - only show if offerings loaded */}
      <PaymentConfirmationModal
        visible={showConfirmation && offeringsLoaded}
        tier={selectedTier}
        isLoading={isLoading}
        onConfirm={handleConfirmPurchase}
        onCancel={() => {
          // Only allow cancel if not in the middle of a purchase
          if (!isLoading && !purchaseInProgressRef.current) {
            logger.log("[Subscription] Confirmation modal closed by user");
            setShowConfirmation(false);
            setSelectedTier(null);
          }
        }}
      />

      {/* Toast */}
      {ToastComponent}
    </Screen>
  );
}
