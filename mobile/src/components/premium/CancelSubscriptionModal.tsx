import React from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useSubscriptionStore } from "../../state/stores/subscriptionStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useTheme } from "../../utils/useTheme";
import { ESSENTIALS_FEATURES, PREMIUM_FEATURES } from "../../config/featureAccess";
import * as Haptics from "expo-haptics";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
}

export default function CancelSubscriptionModal({
  visible,
  onClose,
  onConfirmCancel,
}: Props) {
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const subscriptionTier = useSubscriptionStore((s) => s.subscriptionTier);
  const expirationDate = useSubscriptionStore((s) => s.expirationDate);
  const getDaysUntilExpiration = useSubscriptionStore(
    (s) => s.getDaysUntilExpiration
  );
  const textClasses = getTextSizeClasses(textSize);
  const { colors, primary, primaryLight } = useTheme();

  const daysRemaining = getDaysUntilExpiration();

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Format expiration date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "your billing cycle ends";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Features they keep
  const keepFeatures = ESSENTIALS_FEATURES.slice(0, 4);

  // Features they lose
  const loseFeatures = PREMIUM_FEATURES.slice(0, 5);

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
                style={{ backgroundColor: colors.errorBackground }}
              >
                <Ionicons name="heart-dislike" size={40} color={colors.error} />
              </View>
              <Text
                className={`${textClasses.title} text-center mb-2`}
                style={{ color: colors.textPrimary }}
              >
                {"We're Sorry to See You Go"}
              </Text>
              <Text
                className={`${textClasses.body} text-center`}
                style={{ color: colors.textSecondary }}
              >
                Your Premium access will continue until{" "}
                <Text style={{ fontWeight: "600" }}>
                  {formatDate(expirationDate)}
                </Text>
              </Text>
            </View>

            <ScrollView
              className="flex-1 px-8"
              showsVerticalScrollIndicator={false}
            >
              {/* What you keep */}
              <View className="mb-6">
                <Text
                  className={`${textClasses.subtitle} font-semibold mb-3`}
                  style={{ color: colors.textPrimary }}
                >
                  {"What you'll keep:"}
                </Text>
                <View
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: colors.successBackground }}
                >
                  {keepFeatures.map((feature) => (
                    <View
                      key={feature.id}
                      className="flex-row items-center py-2"
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.success}
                      />
                      <Text
                        className={`${textClasses.body} ml-3`}
                        style={{ color: colors.onSuccess }}
                      >
                        {feature.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* What you lose */}
              <View className="mb-6">
                <Text
                  className={`${textClasses.subtitle} font-semibold mb-3`}
                  style={{ color: colors.textPrimary }}
                >
                  {"What you'll lose:"}
                </Text>
                <View
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: colors.errorBackground }}
                >
                  {loseFeatures.map((feature) => (
                    <View
                      key={feature.id}
                      className="flex-row items-center py-2"
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                      <Text
                        className={`${textClasses.body} ml-3`}
                        style={{ color: colors.onError }}
                      >
                        {feature.name}
                      </Text>
                    </View>
                  ))}
                  <Text
                    className={`${textClasses.small} mt-2`}
                    style={{ color: colors.onError }}
                  >
                    + {PREMIUM_FEATURES.length - loseFeatures.length} more
                    features
                  </Text>
                </View>
              </View>

              {/* Data reassurance */}
              <View
                className="rounded-2xl p-4 mb-6 flex-row items-start"
                style={{ backgroundColor: primaryLight }}
              >
                <Ionicons name="shield-checkmark" size={24} color={primary} />
                <View className="ml-3 flex-1">
                  <Text
                    className={`${textClasses.body} font-semibold`}
                    style={{ color: colors.textPrimary }}
                  >
                    Your data is safe
                  </Text>
                  <Text
                    className={`${textClasses.small}`}
                    style={{ color: colors.textSecondary }}
                  >
                    All your medications, tasks, and contacts will be saved.
                    {"\n"}You can resubscribe anytime to access them again.
                  </Text>
                </View>
              </View>

              {/* Grace period info */}
              {daysRemaining !== null && daysRemaining > 0 && (
                <View
                  className="rounded-2xl p-4 mb-6"
                  style={{ backgroundColor: colors.warningBackground }}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="time" size={24} color={colors.warning} />
                    <Text
                      className={`${textClasses.body} ml-3 flex-1`}
                      style={{ color: colors.onWarning }}
                    >
                      You still have{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        {daysRemaining} days
                      </Text>{" "}
                      of Premium access remaining.
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Bottom Actions */}
            <View
              className="px-8 pb-6 pt-4"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  onClose();
                }}
                className="py-5 rounded-2xl items-center mb-3"
                style={{ backgroundColor: primary, minHeight: 56 }}
                accessibilityRole="button"
                accessibilityLabel="Keep my Premium subscription"
              >
                <Text
                  className={`${textClasses.subtitle} font-semibold text-white`}
                >
                  Keep My Premium
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  triggerHaptic();
                  onConfirmCancel();
                }}
                className="py-4 items-center"
                accessibilityRole="button"
                accessibilityLabel="Continue with cancellation"
              >
                <Text
                  className={`${textClasses.body}`}
                  style={{ color: colors.error || "#EF4444" }}
                >
                  Continue with Cancellation
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
