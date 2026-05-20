import { useEffect, useRef } from "react";
import { useMedicationStore } from "../state/stores/medicationStore";
import { useTaskStore } from "../state/stores/taskStore";
import { useUserStore } from "../state/stores/userStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { useTipStore, TIP_IDS } from "../state/stores/tipStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FIRST_OPEN_KEY = "steadiday_first_open_date";

/**
 * Hook that triggers contextual tips based on user actions and time
 * Tips are triggered by milestones, not arbitrary calendar days
 */
export function useActionBasedTips() {
  const medications = useMedicationStore((s) => s.medications);
  const tasks = useTaskStore((s) => s.tasks);
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);

  const canShowTip = useTipStore((s) => s.canShowTip);
  const showTip = useTipStore((s) => s.showTip);

  // Track previous counts to detect changes
  const prevMedCount = useRef(medications.length);
  const prevTaskCount = useRef(tasks.length);

  // Track first open date for time-based tips
  useEffect(() => {
    const trackFirstOpen = async () => {
      const existing = await AsyncStorage.getItem(FIRST_OPEN_KEY);
      if (!existing && hasCompletedOnboarding) {
        await AsyncStorage.setItem(FIRST_OPEN_KEY, new Date().toISOString());
      }
    };
    trackFirstOpen();
  }, [hasCompletedOnboarding]);

  // Action-based tips
  useEffect(() => {
    if (!hasCompletedOnboarding) return;

    // Tip: Care Summary after 2+ medications (all users)
    if (medications.length >= 2 && prevMedCount.current < 2) {
      if (canShowTip(TIP_IDS.CARE_SUMMARY_UNLOCK)) {
        // Delay slightly so it does not feel jarring
        setTimeout(() => showTip(TIP_IDS.CARE_SUMMARY_UNLOCK), 2000);
      }
    }

    // Tip: Calendar sync after 5+ tasks (Premium only)
    if (isPremiumUnlocked && tasks.length >= 5 && prevTaskCount.current < 5) {
      if (canShowTip(TIP_IDS.CALENDAR_SYNC_SUGGEST)) {
        setTimeout(() => showTip(TIP_IDS.CALENDAR_SYNC_SUGGEST), 2000);
      }
    }

    prevMedCount.current = medications.length;
    prevTaskCount.current = tasks.length;
  }, [medications.length, tasks.length, hasCompletedOnboarding, isPremiumUnlocked, canShowTip, showTip]);

  // Time-based tips (checked once per session)
  useEffect(() => {
    if (!hasCompletedOnboarding) return;

    const checkTimeTips = async () => {
      const firstOpenStr = await AsyncStorage.getItem(FIRST_OPEN_KEY);
      if (!firstOpenStr) return;

      const firstOpen = new Date(firstOpenStr);
      const now = new Date();
      const daysSinceFirstOpen = Math.floor((now.getTime() - firstOpen.getTime()) / (1000 * 60 * 60 * 24));

      // Gentle premium prompt after 3-5 days (only for free users)
      if (!isPremiumUnlocked && daysSinceFirstOpen >= 3 && daysSinceFirstOpen <= 7) {
        if (canShowTip(TIP_IDS.PREMIUM_GENTLE)) {
          setTimeout(() => showTip(TIP_IDS.PREMIUM_GENTLE), 5000);
        }
      }

      // Fall detection prompt after 7 days
      if (daysSinceFirstOpen >= 7) {
        if (canShowTip(TIP_IDS.FALL_DETECTION_PROMPT)) {
          setTimeout(() => showTip(TIP_IDS.FALL_DETECTION_PROMPT), 3000);
        }
      }
    };

    checkTimeTips();
  }, [hasCompletedOnboarding, isPremiumUnlocked, canShowTip, showTip]);
}
