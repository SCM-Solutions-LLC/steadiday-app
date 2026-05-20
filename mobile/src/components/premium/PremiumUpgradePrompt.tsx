import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useSubscriptionStore } from "../../state/stores/subscriptionStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useTheme } from "../../utils/useTheme";
import {
  PREMIUM_FEATURES,
  PRICING,
  getFeatureConfig,
} from "../../config/featureAccess";
import { openPrivacyPolicy, openTermsOfService } from "../../utils/openURL";
import PaymentConfirmationModal from "./PaymentConfirmationModal";
import * as Haptics from "expo-haptics";

interface Props {
  visible: boolean;
  onClose: () => void;
  onPurchase: (tier: "monthly" | "annual" | "lifetime") => void;
  onRestore: () => void;
  featureId?: string | null;
  /** Message explaining why the user hit the limit (e.g., "You've reached the limit of 15 tasks") */
  limitMessage?: string | null;
  isLoading?: boolean;
  /** Debug mode - shows modal mount state indicator */
  debug?: boolean;
}

export default function PremiumUpgradePrompt({
  visible,
  onClose,
  onPurchase,
  onRestore,
  featureId,
  limitMessage,
  isLoading = false,
  debug = false,
}: Props) {
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const getRecommendedTier = useSubscriptionStore((s) => s.getRecommendedTier);
  const textClasses = getTextSizeClasses(textSize);
  const { colors, primary, primaryLight } = useTheme();

  // State for confirmation modal
  const [selectedTier, setSelectedTier] = useState<
    "monthly" | "annual" | "lifetime" | null
  >(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Reset internal state when modal closes to prevent stale state on reopen
  useEffect(() => {
    if (!visible) {
      setSelectedTier(null);
      setShowConfirmation(false);
    }
  }, [visible]);

  const recommendedTier = getRecommendedTier();
  const triggeredFeature = featureId ? getFeatureConfig(featureId) : null;

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // When user taps a tier, show confirmation first
  const handleSelectTier = (tier: "monthly" | "annual" | "lifetime") => {
    triggerHaptic();
    setSelectedTier(tier);
    setShowConfirmation(true);
  };

  // Confirm button actually triggers purchase
  const handleConfirmPurchase = () => {
    if (!selectedTier) return;
    onPurchase(selectedTier);
    // Don't close confirmation yet - let parent handle loading state
    // The modal will close when purchase completes via onClose
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setSelectedTier(null);
  };

  return (
    <>
      {/* Debug indicator - shows modal mount state */}
      {debug && (
        <View
          style={{
            position: "absolute",
            top: 50,
            left: 10,
            backgroundColor: visible ? "#22c55e" : "#ef4444",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            zIndex: 9999,
          }}
          pointerEvents="none"
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
            {`Upgrade: ${visible ? "VISIBLE" : "HIDDEN"} | Confirm: ${showConfirmation ? "OPEN" : "CLOSED"}`}
          </Text>
        </View>
      )}

      <Modal
        visible={visible && !showConfirmation}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/50">
          <SafeAreaView className="flex-1" edges={["bottom"]}>
            <View
              className="flex-1 mt-12 rounded-t-3xl"
              style={{ backgroundColor: colors.cardBackground }}
            >
              {/* Header */}
              <View className="items-center pt-6 pb-4 px-8">
                {/* Limit Message Banner */}
                {limitMessage && (
                  <View
                    className="w-full rounded-xl p-4 mb-4 flex-row items-center"
                    style={{ backgroundColor: "#FEF3C7" }}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: "#FCD34D" }}
                    >
                      <Ionicons name="warning" size={22} color="#92400E" />
                    </View>
                    <Text
                      className={`${textClasses.body} flex-1`}
                      style={{ color: "#92400E", fontWeight: "600" }}
                    >
                      {limitMessage}
                    </Text>
                  </View>
                )}
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: colors.premium }}
                >
                  <Ionicons name="star" size={40} color={colors.onPremium} />
                </View>
                <Text
                  className={`${textClasses.title} text-center mb-2`}
                  style={{ color: colors.textPrimary }}
                >
                  Upgrade to Premium
                </Text>
                {triggeredFeature && (
                  <Text
                    className={`${textClasses.body} text-center`}
                    style={{ color: colors.textSecondary }}
                  >
                    {`"${triggeredFeature.name}" needs Premium`}
                  </Text>
                )}
              </View>

              <ScrollView
                className="flex-1 px-8"
                showsVerticalScrollIndicator={false}
              >
                {/* Simplified Benefit Categories */}
                <Text
                  className={`${textClasses.subtitle} font-semibold mb-4`}
                  style={{ color: colors.textPrimary }}
                >
                  What you get:
                </Text>

                {[
                  {
                    icon: "infinite",
                    title: "No Limits",
                    description: "Unlimited medications, tasks, and contacts",
                  },
                  {
                    icon: "fitness",
                    title: "Complete Health View",
                    description: "See all your Apple Health data in one place",
                  },
                  {
                    icon: "build",
                    title: "Helpful Tools",
                    description: "Magnifier, flashlight, notes, find car, and more",
                  },
                  {
                    icon: "color-palette",
                    title: "Make It Yours",
                    description: "Customize colors, sounds, and home screen layout",
                  },
                ].map((benefit, index) => (
                  <View
                    key={index}
                    className="flex-row items-center py-4 border-b"
                    style={{ borderBottomColor: colors.divider }}
                  >
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                      style={{ backgroundColor: primaryLight }}
                    >
                      <Ionicons
                        name={benefit.icon as keyof typeof Ionicons.glyphMap}
                        size={24}
                        color={primary}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`${textClasses.body} font-semibold`}
                        style={{ color: colors.textPrimary }}
                      >
                        {benefit.title}
                      </Text>
                      <Text
                        className={`${textClasses.small}`}
                        style={{ color: colors.textSecondary }}
                      >
                        {benefit.description}
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  </View>
                ))}

                {/* Key benefit callout */}
                <View
                  className="rounded-2xl p-4 mb-6 flex-row items-start"
                  style={{ backgroundColor: colors.successBackground }}
                >
                  <Ionicons name="sparkles" size={20} color={colors.success} />
                  <Text
                    className={`${textClasses.body} ml-3 flex-1`}
                    style={{ color: colors.onSuccess }}
                  >
                    <Text style={{ fontWeight: "600" }}>
                      Start simple, add more anytime.
                    </Text>
                    {"\n"}You choose what to show - no clutter!
                  </Text>
                </View>

                {/* Pricing */}
                <Text
                  className={`${textClasses.subtitle} font-semibold mb-4`}
                  style={{ color: colors.textPrimary }}
                >
                  Choose your plan:
                </Text>

                {/* Lifetime */}
                <Pressable
                  onPress={() => handleSelectTier("lifetime")}
                  className="rounded-2xl p-5 mb-3 border-2"
                  style={{
                    backgroundColor:
                      recommendedTier === "lifetime"
                        ? colors.premiumLight
                        : colors.background,
                    borderColor:
                      recommendedTier === "lifetime" ? colors.premium : colors.border,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Lifetime access for ${PRICING.lifetime.priceDisplay}. Pay once, yours forever.`}
                >
                  {recommendedTier === "lifetime" && (
                    <View
                      className="absolute -top-3 left-4 px-3 py-1 rounded-full"
                      style={{ backgroundColor: colors.premium }}
                    >
                      <Text className="text-xs font-bold" style={{ color: colors.onPremium }}>
                        BEST VALUE
                      </Text>
                    </View>
                  )}
                  <View className="flex-row items-center justify-between">
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
                        No subscription
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
                  className="rounded-2xl p-5 mb-3 border-2"
                  style={{
                    backgroundColor:
                      recommendedTier === "annual"
                        ? colors.successBackground
                        : colors.background,
                    borderColor:
                      recommendedTier === "annual" ? colors.success : colors.border,
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
                  className="rounded-2xl p-5 mb-3 border-2"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
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

                {/* Money-back */}
                <View
                  className="flex-row items-center justify-center py-3 px-4 rounded-xl mb-4"
                  style={{ backgroundColor: colors.successBackground }}
                >
                  <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                  <Text
                    className={`${textClasses.small} ml-2`}
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
                <View className="flex-row items-center justify-center mb-4">
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
              </ScrollView>

              {/* Bottom Actions */}
              <View
                className="px-8 pb-6 pt-4"
                style={{ backgroundColor: colors.cardBackground }}
              >
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    onRestore();
                  }}
                  className="py-3 items-center mb-2"
                  accessibilityRole="button"
                  accessibilityLabel="Restore previous purchase"
                >
                  <Text
                    className={`${textClasses.body}`}
                    style={{ color: primary }}
                  >
                    Restore Purchase
                  </Text>
                </Pressable>

                <Pressable
                  onPress={onClose}
                  className="py-3 items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Maybe later"
                >
                  <Text
                    className={`${textClasses.body}`}
                    style={{ color: colors.textSecondary }}
                  >
                    Maybe Later
                  </Text>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        visible={showConfirmation}
        tier={selectedTier}
        isLoading={isLoading}
        onConfirm={handleConfirmPurchase}
        onCancel={handleCancelConfirmation}
      />
    </>
  );
}
