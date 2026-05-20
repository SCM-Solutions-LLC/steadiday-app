import React, { useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useSubscriptionStore } from "../../state/stores/subscriptionStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useTheme } from "../../utils/useTheme";
import { PREMIUM_FEATURES, PRICING } from "../../config/featureAccess";
import { usePurchase } from "../../hooks";
import * as Haptics from "expo-haptics";

interface Props {
  visible: boolean;
  onClose: () => void;
  onResubscribe: (tier: "monthly" | "annual" | "lifetime") => void;
}

export default function SubscriptionExpiredModal({
  visible,
  onClose,
  onResubscribe,
}: Props) {
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const getRecommendedTier = useSubscriptionStore((s) => s.getRecommendedTier);
  const previousTiers = useSubscriptionStore((s) => s.previousTiers);
  const textClasses = getTextSizeClasses(textSize);
  const { colors, primary, primaryLight } = useTheme();

  // Purchase handling
  const { handlePurchase, isLoading } = usePurchase();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const recommendedTier = getRecommendedTier();

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleTierSelect = async (tier: "monthly" | "annual" | "lifetime") => {
    triggerHaptic();
    setStatusMessage(null);

    const result = await handlePurchase(tier);
    if (result.success) {
      setStatusMessage(result.message);
      // Give user a moment to see success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setStatusMessage(result.message);
    }
  };

  // Features they had
  const missedFeatures = PREMIUM_FEATURES.slice(0, 4);

  return (
    <Modal
      visible={visible}
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
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: colors.premiumLight }}
              >
                <Ionicons name="star-outline" size={40} color={colors.premium} />
              </View>
              <Text
                className={`${textClasses.title} text-center mb-2`}
                style={{ color: colors.textPrimary }}
              >
                Your Premium Has Ended
              </Text>
              <Text
                className={`${textClasses.body} text-center`}
                style={{ color: colors.textSecondary }}
              >
                Your data is still safe. Resubscribe to access all your Premium
                features again.
              </Text>
            </View>

            <ScrollView
              className="flex-1 px-8"
              showsVerticalScrollIndicator={false}
            >
              {/* What they are missing */}
              <View className="mb-6">
                <Text
                  className={`${textClasses.subtitle} font-semibold mb-3`}
                  style={{ color: colors.textPrimary }}
                >
                  {"What you're missing:"}
                </Text>
                <View
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: primaryLight }}
                >
                  {missedFeatures.map((feature) => (
                    <View
                      key={feature.id}
                      className="flex-row items-center py-2"
                    >
                      <Ionicons name="lock-closed" size={20} color={primary} />
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
                    style={{ color: primary }}
                  >
                    + {PREMIUM_FEATURES.length - missedFeatures.length} more
                    features
                  </Text>
                </View>
              </View>

              {/* Special offer for returning users */}
              {previousTiers.length > 0 && (
                <View
                  className="rounded-2xl p-4 mb-6 border-2"
                  style={{ backgroundColor: colors.premiumLight, borderColor: colors.premium }}
                >
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="gift" size={24} color={colors.premium} />
                    <Text
                      className={`${textClasses.subtitle} font-semibold ml-2`}
                      style={{ color: colors.premiumDark }}
                    >
                      Welcome Back Offer
                    </Text>
                  </View>
                  <Text
                    className={`${textClasses.body}`}
                    style={{ color: colors.premiumDark }}
                  >
                    Try Lifetime for a one-time payment - no more renewals to
                    worry about!
                  </Text>
                </View>
              )}

              {/* Pricing options */}
              <Text
                className={`${textClasses.subtitle} font-semibold mb-4`}
                style={{ color: colors.textPrimary }}
              >
                Choose your plan:
              </Text>

              {/* Status message */}
              {statusMessage && (
                <View
                  className="rounded-xl p-3 mb-4"
                  style={{
                    backgroundColor: statusMessage.includes("activated") || statusMessage.includes("restored")
                      ? colors.successBackground
                      : colors.errorBackground,
                  }}
                >
                  <Text
                    className={`${textClasses.body} text-center`}
                    style={{
                      color: statusMessage.includes("activated") || statusMessage.includes("restored")
                        ? colors.onSuccess
                        : colors.onError,
                    }}
                  >
                    {statusMessage}
                  </Text>
                </View>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <View className="items-center mb-4">
                  <ActivityIndicator size="small" color={primary} />
                  <Text
                    className={`${textClasses.small} mt-2`}
                    style={{ color: colors.textSecondary }}
                  >
                    Processing...
                  </Text>
                </View>
              )}

              {/* Lifetime - Always recommended for returning users */}
              <Pressable
                onPress={() => handleTierSelect("lifetime")}
                disabled={isLoading}
                className="rounded-2xl p-5 mb-3 border-2"
                style={{
                  backgroundColor:
                    recommendedTier === "lifetime"
                      ? colors.premiumLight
                      : colors.background,
                  borderColor:
                    recommendedTier === "lifetime" ? colors.premium : colors.border,
                  opacity: isLoading ? 0.6 : 1,
                }}
                accessibilityRole="button"
                accessibilityLabel={`Lifetime access for ${PRICING.lifetime.priceDisplay}. Pay once, yours forever.`}
              >
                {recommendedTier === "lifetime" && (
                  <View
                    className="absolute -top-3 left-4 px-3 py-1 rounded-full"
                    style={{ backgroundColor: colors.premium }}
                  >
                    <Text className="text-xs font-bold text-white">
                      RECOMMENDED
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
                      No more renewals
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
                onPress={() => handleTierSelect("annual")}
                disabled={isLoading}
                className="rounded-2xl p-5 mb-3 border-2"
                style={{
                  backgroundColor:
                    recommendedTier === "annual"
                      ? colors.successBackground
                      : colors.background,
                  borderColor:
                    recommendedTier === "annual" ? colors.success : colors.border,
                  opacity: isLoading ? 0.6 : 1,
                }}
                accessibilityRole="button"
                accessibilityLabel={`Annual plan for ${PRICING.annual.priceDisplay} per year.`}
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
                onPress={() => handleTierSelect("monthly")}
                disabled={isLoading}
                className="rounded-2xl p-5 mb-6 border-2"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  opacity: isLoading ? 0.6 : 1,
                }}
                accessibilityRole="button"
                accessibilityLabel={`Monthly plan for ${PRICING.monthly.priceDisplay} per month.`}
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
            </ScrollView>

            {/* Bottom Actions */}
            <View
              className="px-8 pb-6 pt-4"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <Pressable
                onPress={onClose}
                className="py-3 items-center"
                accessibilityRole="button"
                accessibilityLabel="Continue with free version"
              >
                <Text
                  className={`${textClasses.body}`}
                  style={{ color: colors.textSecondary }}
                >
                  Continue with Free Version
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
