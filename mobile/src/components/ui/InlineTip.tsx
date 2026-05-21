import React, { useEffect, useRef, useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../utils/useTheme";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useTipStore, TIP_CONFIGS, TipConfig } from "../../state/stores/tipStore";
import { useSubscriptionStore } from "../../state/stores/subscriptionStore";
import { getTextSizeClasses } from "../../utils/textSizes";

interface InlineTipProps {
  /**
   * The tip ID from TIP_IDS
   */
  tipId: string;
  /**
   * Optional custom message (overrides TIP_CONFIGS)
   */
  message?: string;
  /**
   * Optional custom icon (overrides TIP_CONFIGS)
   */
  icon?: keyof typeof Ionicons.glyphMap;
  /**
   * Whether this tip requires Premium (overrides TIP_CONFIGS)
   */
  requiresPremium?: boolean;
}

/**
 * InlineTip - Unified tip component for in-line tips at top of screens
 *
 * Features:
 * - Simple card at top of screen
 * - Icon + One sentence + Dismiss button
 * - Dismiss persists forever
 * - Only shows if user hasn't seen it and no tip shown this session
 * - Respects Premium requirements
 *
 * Usage:
 * <InlineTip tipId={TIP_IDS.HOME} />
 */
export default function InlineTip({
  tipId,
  message,
  icon,
  requiresPremium,
}: InlineTipProps) {
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const textClasses = getTextSizeClasses(textSize);

  // LOCAL STATE: Track if dismissed this render cycle (immediate UI update)
  const [isDismissed, setIsDismissed] = useState(false);

  // Tip store
  const canShowTip = useTipStore((s) => s.canShowTip);
  const markTipShown = useTipStore((s) => s.markTipShown);
  const dismissTip = useTipStore((s) => s.dismissTip);

  // Subscribe to reactive state so canShowTip re-evaluates on changes
  useTipStore((s) => s.seenTips);
  useTipStore((s) => s.tipShownThisSession);
  useTipStore((s) => s.tipsCompleted);
  useTipStore((s) => s.tipsEnabled);

  // Premium check
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);

  // Get tip config
  const tipConfig: TipConfig | undefined = TIP_CONFIGS[tipId];
  const tipMessage = message || tipConfig?.message || "";
  const tipIcon = (icon || tipConfig?.icon || "information-circle") as keyof typeof Ionicons.glyphMap;
  const tipRequiresPremium = requiresPremium ?? tipConfig?.requiresPremium ?? false;

  // Determine if tip should show — canShowTip checks seenTips, tipShownThisSession, tipsCompleted, tipsEnabled
  const premiumCheck = !tipRequiresPremium || isPremiumUnlocked;
  const shouldShow = !isDismissed && canShowTip(tipId) && premiumCheck;

  // Track if we've already marked this tip as shown to avoid duplicate calls
  const hasMarkedShown = useRef(false);

  // Mark tip as shown when it first renders (for session throttling)
  useEffect(() => {
    if (shouldShow && !hasMarkedShown.current) {
      hasMarkedShown.current = true;
      markTipShown(tipId);
    }
  }, [shouldShow, tipId, markTipShown]);

  const handleDismiss = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Immediately hide via local state
    setIsDismissed(true);
    // Persist to store
    dismissTip(tipId);
  }, [hapticEnabled, dismissTip, tipId]);

  // Don't render if tip shouldn't show
  if (!shouldShow) {
    return null;
  }

  return (
    <View
      className="rounded-2xl p-4 mb-4 flex-row items-center"
      style={{
        backgroundColor: colors.infoBackground,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Ionicons name={tipIcon} size={22} color={primary} />
      <Text
        className={`${textClasses.body} flex-1 mx-3`}
        style={{ color: colors.textPrimary }}
        numberOfLines={2}
      >
        {tipMessage}
      </Text>
      <Pressable
        onPress={handleDismiss}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Dismiss tip"
        style={{
          width: 44,
          height: 44,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </View>
      </Pressable>
    </View>
  );
}
