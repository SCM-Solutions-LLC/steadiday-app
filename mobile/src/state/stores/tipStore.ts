import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================================================
// TIP STORE (SINGLE SOURCE OF TRUTH)
// Manages ALL tips, tooltips, and info cards across the app
//
// Rules:
// - Only one tip per tab, max
// - Tip appears first time a tab is opened
// - Tip dismiss persists and never shows again
// - No more than one tip shown per app session, even across tabs
// ============================================================================

interface TipState {
  _hasHydrated: boolean;
  seenTips: string[];
  tipsEnabled: boolean;
  currentTip: string | null;
  dismissedInfoCards: string[];
  // Session tracking - reset on app restart (memory only, not persisted)
  tipShownThisSession: boolean;
  // Set on rehydration if any tips were shown in a previous session.
  // When true, all tips are permanently suppressed so they only appear
  // during the first session after onboarding.
  tipsCompleted: boolean;
  hasSeenGuidedTour: boolean;
}

interface TipActions {
  // Core tip functions
  canShowTip: (tipId: string) => boolean;
  markTipShown: (tipId: string) => void;
  dismissTip: (tipId: string) => void;
  markGuidedTourComplete: () => void;
  resetGuidedTour: () => void;

  // Legacy functions (backward compatibility)
  markTipSeen: (tipId: string) => void;
  hasTipBeenSeen: (tipId: string) => boolean;
  hasSeenTooltip: (tipId: string) => boolean;
  markTooltipAsShown: (tipId: string) => void;
  setTipsEnabled: (enabled: boolean) => void;
  showTip: (tipId: string) => void;
  dismissCurrentTip: () => void;
  resetAllTips: () => void;

  // Info cards
  dismissInfoCard: (cardId: string) => void;
  isInfoCardDismissed: (cardId: string) => boolean;
  resetDismissedInfoCards: () => void;

  // Session management
  resetSessionTipFlag: () => void;
  canShowTipThisSession: () => boolean;
}

type TipStore = TipState & TipActions;

export const useTipStore = create<TipStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      seenTips: [],
      tipsEnabled: true,
      currentTip: null,
      dismissedInfoCards: [],
      tipShownThisSession: false,
      tipsCompleted: false,
      hasSeenGuidedTour: false,

      markGuidedTourComplete: () => set({ hasSeenGuidedTour: true }),
      resetGuidedTour: () => set({ hasSeenGuidedTour: false }),

      // ====================================================================
      // CORE TIP FUNCTIONS (use these for new implementations)
      // ====================================================================

      /**
       * Check if a tip can be shown
       * Returns false if:
       * - Tip has been dismissed/seen before
       * - A tip has already been shown this session
       * - Tips are disabled
       */
      canShowTip: (tipId: string) => {
        const state = get();
        return (
          state.tipsEnabled &&
          !state.seenTips.includes(tipId) &&
          !state.tipShownThisSession &&
          !state.tipsCompleted
        );
      },

      /**
       * Mark a tip as shown for this session and persist dismissal
       * Call this when a tip is rendered/displayed
       */
      markTipShown: (tipId: string) => {
        set((state) => ({
          tipShownThisSession: true,
          seenTips: state.seenTips.includes(tipId)
            ? state.seenTips
            : [...state.seenTips, tipId],
        }));
      },

      /**
       * Dismiss a tip (persist forever, never show again)
       */
      dismissTip: (tipId: string) => {
        set((state) => ({
          seenTips: state.seenTips.includes(tipId)
            ? state.seenTips
            : [...state.seenTips, tipId],
          currentTip: state.currentTip === tipId ? null : state.currentTip,
        }));
      },

      // ====================================================================
      // LEGACY FUNCTIONS (kept for backward compatibility)
      // ====================================================================

      markTipSeen: (tipId) =>
        set((state) => ({
          seenTips: state.seenTips.includes(tipId) ? state.seenTips : [...state.seenTips, tipId],
          currentTip: state.currentTip === tipId ? null : state.currentTip,
        })),

      hasTipBeenSeen: (tipId) => get().seenTips.includes(tipId),
      hasSeenTooltip: (tipId) => get().seenTips.includes(tipId),
      markTooltipAsShown: (tipId) => get().markTipSeen(tipId),

      setTipsEnabled: (enabled) => set({ tipsEnabled: enabled }),

      showTip: (tipId) => {
        const state = get();
        if (
          state.tipsEnabled &&
          !state.seenTips.includes(tipId) &&
          !state.currentTip &&
          !state.tipShownThisSession &&
          !state.tipsCompleted
        ) {
          set({ currentTip: tipId, tipShownThisSession: true });
        }
      },

      dismissCurrentTip: () => {
        const state = get();
        if (state.currentTip) {
          set((prev) => ({
            seenTips: prev.currentTip ? [...prev.seenTips, prev.currentTip] : prev.seenTips,
            currentTip: null,
          }));
        }
      },

      resetAllTips: () => set({ seenTips: [], currentTip: null, dismissedInfoCards: [], tipShownThisSession: false }),

      dismissInfoCard: (cardId) =>
        set((state) => ({
          dismissedInfoCards: state.dismissedInfoCards.includes(cardId)
            ? state.dismissedInfoCards
            : [...state.dismissedInfoCards, cardId],
        })),

      isInfoCardDismissed: (cardId) => get().dismissedInfoCards.includes(cardId),
      resetDismissedInfoCards: () => set({ dismissedInfoCards: [] }),

      // Session management
      resetSessionTipFlag: () => set({ tipShownThisSession: false }),
      canShowTipThisSession: () => !get().tipShownThisSession,
    }),
    {
      name: "tip-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist tipShownThisSession - it should reset on app restart
      partialize: (state) => ({
        seenTips: state.seenTips,
        tipsEnabled: state.tipsEnabled,
        dismissedInfoCards: state.dismissedInfoCards,
        hasSeenGuidedTour: state.hasSeenGuidedTour,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
          if (!state.seenTips) state.seenTips = [];
          if (!state.dismissedInfoCards) state.dismissedInfoCards = [];
          // Reset session flag on rehydration (app restart)
          state.tipShownThisSession = false;
          // Only suppress all tips after the guided tour has been completed.
          // Action-based contextual tips should still appear after the tour.
          state.tipsCompleted = state.hasSeenGuidedTour === true;
        }
      },
    }
  )
);

// ============================================================================
// TIP IDS - Centralized tip identifiers
// ============================================================================

export const TIP_IDS = {
  // Primary tab tips (one per tab max) - NEW STREAMLINED SYSTEM
  HOME: "tip_home",
  TOOLS: "tip_tools",
  SETTINGS: "tip_settings",
  HEALTH: "tip_health",

  // Feature-specific animated guide tips
  HOME_EDIT_BUTTON: "tip_home_edit_button",
  TOOLS_EDIT_BUTTON: "tip_tools_edit_button",
  PREMIUM_TAB_SCROLL: "tip_premium_tab_scroll",
  CARE_VIEW_GUIDE: "tip_care_view_guide",
  CARE_SUMMARY_GUIDE: "tip_care_summary_guide",

  // Other tab-level tips
  HEALTH_CONNECT_PREMIUM: "tip_health_connect_premium",
  MIND_BREAKS: "tip_mind_breaks",

  // Action-based contextual tips (triggered by behavior, not time)
  MEDS_FIRST_USE: "tip_meds_first_use",           // First time opening empty Meds tab
  TASKS_FIRST_USE: "tip_tasks_first_use",          // First time opening empty Tasks tab
  APPLE_HEALTH_MEDS: "tip_apple_health_meds",      // On Meds tab for premium users
  CARE_SUMMARY_UNLOCK: "tip_care_summary_unlock",  // After 2+ medications added
  CALENDAR_SYNC_SUGGEST: "tip_calendar_sync_suggest", // After 5+ tasks added
  FALL_DETECTION_PROMPT: "tip_fall_detection_prompt", // After 7 days of use
  PREMIUM_GENTLE: "tip_premium_gentle",            // After 3-5 days (replaces onboarding pitch)

  // Health first-run UX
  HEALTH_FIRST_RUN: "tip_health_first_run",        // Banner on Health screen before first sync

  // Legacy tip IDs (for backward compatibility - kept but not actively used)
  HOME_EDIT_WIDGETS: "tip_home_edit_widgets",
  TABS_HORIZONTAL_SCROLL: "tip_tabs_horizontal_scroll",
  TOOLS_REORDER: "tip_tools_reorder",
  ADD_FIRST_MEDICATION: "add_first_medication",
  ADD_FIRST_TASK: "add_first_task",
  EMERGENCY_SOS: "emergency_sos",
  NAVIGATION_TABS: "navigation_tabs",
  MEDICATION_LIMIT: "medication_limit",
  TASK_LIMIT: "task_limit",
  BROWSE_TEMPLATES: "browse_templates",
  HEALTH_TRACKING: "health_tracking",
  CUSTOMIZE_APP: "customize_app",
  TOOLS_LEGACY: "tools",
  SWIPE_MEDS: "swipe-meds",
  SWIPE_TASKS: "swipe-tasks",
  TOOLS_EDIT: "tools-edit",
  TOOLS_FAVORITES: "tools-favorites",
  HOME_CARDS: "home-cards",
  HOME_WEATHER: "home-weather",
  FOOD_TRACKER: "food-tracker",
  WATER_TRACKER: "water-tracker",
  MAGNIFIER_TAP_FOCUS: "tip_magnifier_tap_focus",
};

// ============================================================================
// TIP CONFIGURATIONS - Content for InlineTip component
// ============================================================================

export interface TipConfig {
  id: string;
  icon: string;
  message: string;
  requiresPremium?: boolean;
}

export const TIP_CONFIGS: Record<string, TipConfig> = {
  // Primary tab tips - NEW STREAMLINED MESSAGES
  [TIP_IDS.HOME]: {
    id: TIP_IDS.HOME,
    icon: "create-outline",
    message: "Tap Edit to reorder widgets and customize your Home screen.",
  },
  [TIP_IDS.TOOLS]: {
    id: TIP_IDS.TOOLS,
    icon: "construct-outline",
    message: "Tap Edit to reorder tools. Your changes save automatically.",
  },
  [TIP_IDS.SETTINGS]: {
    id: TIP_IDS.SETTINGS,
    icon: "settings-outline",
    message: "Customize tabs and manage connected apps in Settings.",
  },
  [TIP_IDS.HEALTH]: {
    id: TIP_IDS.HEALTH,
    icon: "heart-outline",
    message: "Track your food, water intake, and view your health data all in one place.",
  },

  // Other tips
  [TIP_IDS.HEALTH_CONNECT_PREMIUM]: {
    id: TIP_IDS.HEALTH_CONNECT_PREMIUM,
    icon: "fitness",
    message: Platform.OS === "android"
      ? "Connect to Health Connect to sync your health data."
      : "Connect to Apple Health to sync your health data",
    requiresPremium: true,
  },
  [TIP_IDS.MIND_BREAKS]: {
    id: TIP_IDS.MIND_BREAKS,
    icon: "sparkles",
    message: "Try quick games to keep your mind busy",
    requiresPremium: true,
  },

  // Legacy configs (kept for backward compatibility)
  [TIP_IDS.HOME_EDIT_WIDGETS]: {
    id: TIP_IDS.HOME_EDIT_WIDGETS,
    icon: "create-outline",
    message: "Tap Edit to customize your home screen cards",
  },
  [TIP_IDS.TABS_HORIZONTAL_SCROLL]: {
    id: TIP_IDS.TABS_HORIZONTAL_SCROLL,
    icon: "swap-horizontal",
    message: "Swipe left or right to see more tabs",
  },
  [TIP_IDS.TOOLS_REORDER]: {
    id: TIP_IDS.TOOLS_REORDER,
    icon: "reorder-four",
    message: "Tap Edit to reorder or hide tools",
  },

  // Action-based contextual tips
  [TIP_IDS.MAGNIFIER_TAP_FOCUS]: {
    id: TIP_IDS.MAGNIFIER_TAP_FOCUS,
    icon: "scan-outline",
    message: "Tap the screen to refocus on text.",
  },
  [TIP_IDS.MEDS_FIRST_USE]: {
    id: TIP_IDS.MEDS_FIRST_USE,
    icon: "medical-outline",
    message: "Tap the + button to add your first medication. We will remind you when it is time to take it.",
  },
  [TIP_IDS.TASKS_FIRST_USE]: {
    id: TIP_IDS.TASKS_FIRST_USE,
    icon: "checkbox-outline",
    message: "Tap the + button to add a task or appointment. We will make sure you do not forget.",
  },
  [TIP_IDS.APPLE_HEALTH_MEDS]: {
    id: TIP_IDS.APPLE_HEALTH_MEDS,
    icon: "heart-outline",
    message: Platform.OS === "android"
      ? "You can also see medications from Health Connect. Go to Settings then Connected Apps."
      : "You can also see medications from Apple Health. Go to Settings then Connected Apps.",
    requiresPremium: true,
  },
  [TIP_IDS.CARE_SUMMARY_UNLOCK]: {
    id: TIP_IDS.CARE_SUMMARY_UNLOCK,
    icon: "people-outline",
    message: "Want to share your health info with family? Check out Care Summary in Settings.",
  },
  [TIP_IDS.CALENDAR_SYNC_SUGGEST]: {
    id: TIP_IDS.CALENDAR_SYNC_SUGGEST,
    icon: "calendar-outline",
    message: "Your tasks can appear in your phone calendar too. Set this up in Settings.",
    requiresPremium: true,
  },
  [TIP_IDS.FALL_DETECTION_PROMPT]: {
    id: TIP_IDS.FALL_DETECTION_PROMPT,
    icon: "shield-checkmark-outline",
    message: "Want SteadiDay to check if you fall? You can turn this on in Settings then Safety.",
  },
  [TIP_IDS.PREMIUM_GENTLE]: {
    id: TIP_IDS.PREMIUM_GENTLE,
    icon: "star-outline",
    message: "Enjoying SteadiDay? Unlock more features like health tracking and helpful tools.",
    requiresPremium: false, // Show to free users
  },
};
