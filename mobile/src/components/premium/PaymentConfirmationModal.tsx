import React from "react";
import { View, Text, Pressable, Modal, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useTheme } from "../../utils/useTheme";
import { PRICING } from "../../config/featureAccess";

interface Props {
  visible: boolean;
  tier: "monthly" | "annual" | "lifetime" | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * PaymentConfirmationModal - Confirms purchase before processing
 *
 * Shows selected plan details and requires explicit confirmation
 * before initiating payment. This helps seniors avoid accidental purchases.
 */
export default function PaymentConfirmationModal({
  visible,
  tier,
  isLoading,
  onConfirm,
  onCancel,
}: Props) {
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const { colors, primary } = useTheme();

  if (!tier) return null;

  const pricing = PRICING[tier];

  const getTierDetails = () => {
    switch (tier) {
      case "lifetime":
        return {
          title: "Lifetime Premium",
          subtitle: "One-time purchase",
          benefit: "Pay once, yours forever. No subscription needed.",
          icon: "star" as const,
        };
      case "annual": {
        const annualPricing = PRICING.annual;
        return {
          title: "Annual Premium",
          subtitle: `${annualPricing.priceDisplay} per year`,
          benefit: `Save ${annualPricing.savingsPercent}% compared to monthly. Renews yearly.`,
          icon: "calendar" as const,
        };
      }
      case "monthly":
        return {
          title: "Monthly Premium",
          subtitle: `${pricing.priceDisplay} per month`,
          benefit: "Cancel anytime. Renews monthly.",
          icon: "refresh" as const,
        };
    }
  };

  const details = getTierDetails();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View
          className="w-full rounded-3xl p-8"
          style={{ backgroundColor: colors.cardBackground }}
        >
          {/* Header */}
          <Text
            className={`${textClasses.title} text-center mb-6`}
            style={{ color: colors.textPrimary }}
          >
            Confirm Purchase
          </Text>

          {/* Selected Plan Card */}
          <View
            className="rounded-2xl p-6 mb-6"
            style={{
              backgroundColor: colors.premiumLight,
              borderWidth: 2,
              borderColor: colors.premium,
            }}
          >
            <View className="flex-row items-center mb-4">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: colors.premium }}
              >
                <Ionicons name={details.icon} size={28} color={colors.onPremium} />
              </View>
              <View className="flex-1">
                <Text
                  className={`${textClasses.subtitle} font-bold`}
                  style={{ color: colors.textPrimary }}
                >
                  {details.title}
                </Text>
                <Text
                  className={`${textClasses.body}`}
                  style={{ color: colors.textSecondary }}
                >
                  {details.subtitle}
                </Text>
              </View>
            </View>

            {/* Price */}
            <View
              className="items-center py-4 border-t border-b"
              style={{ borderColor: colors.premium + "60" }}
            >
              <Text
                className={`${textClasses.largeTitle} font-bold`}
                style={{ color: colors.textPrimary, fontSize: 36 }}
              >
                {pricing.priceDisplay}
              </Text>
            </View>

            {/* Benefit */}
            <Text
              className={`${textClasses.body} text-center mt-4`}
              style={{ color: colors.premiumDark, lineHeight: 24 }}
            >
              {details.benefit}
            </Text>
          </View>

          {/* Money-back guarantee */}
          <View
            className="flex-row items-center justify-center py-3 px-4 rounded-xl mb-6"
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

          {/* Buttons */}
          <Pressable
            onPress={onConfirm}
            disabled={isLoading}
            className="py-5 rounded-2xl items-center mb-4"
            style={{
              backgroundColor: primary,
              minHeight: 64,
              opacity: isLoading ? 0.7 : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel={`Confirm purchase of ${details.title} for ${pricing.priceDisplay}`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text
                className={`${textClasses.subtitle} font-bold text-white`}
              >
                Confirm Purchase
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={onCancel}
            disabled={isLoading}
            className="py-4 items-center"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text
              className={`${textClasses.body}`}
              style={{ color: colors.textSecondary }}
            >
              Go Back
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
