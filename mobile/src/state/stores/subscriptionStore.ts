import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================================================
// SUBSCRIPTION STORE
// Manages premium status, feature visibility, and subscription state
// ============================================================================

export type SubscriptionTier = "monthly" | "annual" | "lifetime";
export type SubscriptionStatus = "active" | "canceled" | "expired" | "none";

// Feature visibility configuration
export interface FeatureVisibility {
  // Main sections (bottom tabs)
  sections: {
    home: boolean;
    meds: boolean;
    tasks: boolean;
    contacts: boolean;
    health: boolean;
    tools: boolean;
    connect: boolean;
  };
  // Home screen cards
  homeCards: {
    medications: boolean;
    tasks: boolean;
    sos: boolean; // Always true, cannot be hidden
    steps: boolean;
    water: boolean;
    weather: boolean;
    quickTools: boolean;
    upcomingAppointments: boolean;
  };
  // Individual premium features
  features: {
    taskTemplates: boolean;
    healthScreenings: boolean;
    calendarSync: boolean;
    cloudBackup: boolean;
    customSounds: boolean;
    colorThemes: boolean;
  };
}

const DEFAULT_SIMPLE_VISIBILITY: FeatureVisibility = {
  sections: {
    home: true,
    meds: true,
    tasks: true,
    contacts: true,
    health: false,
    tools: false,
    connect: false,
  },
  homeCards: {
    medications: true,
    tasks: true,
    sos: true,
    steps: false,
    water: false,
    weather: false,
    quickTools: false,
    upcomingAppointments: false,
  },
  features: {
    taskTemplates: true,
    healthScreenings: true,
    calendarSync: false,
    cloudBackup: true,
    customSounds: false,
    colorThemes: false,
  },
};

const DEFAULT_FULL_VISIBILITY: FeatureVisibility = {
  sections: {
    home: true,
    meds: true,
    tasks: true,
    contacts: true,
    health: true,
    tools: true,
    connect: true,
  },
  homeCards: {
    medications: true,
    tasks: true,
    sos: true,
    steps: true,
    water: true,
    weather: true,
    quickTools: true,
    upcomingAppointments: true,
  },
  features: {
    taskTemplates: true,
    healthScreenings: true,
    calendarSync: true,
    cloudBackup: true,
    customSounds: true,
    colorThemes: true,
  },
};

interface SubscriptionState {
  _hasHydrated: boolean;

  // Premium status
  isPremiumUnlocked: boolean;
  subscriptionTier: SubscriptionTier | null;
  subscriptionStatus: SubscriptionStatus;
  purchaseDate: string | null;
  expirationDate: string | null;
  canceledDate: string | null;

  // Verification timestamp for security
  lastVerifiedAt: string | null; // ISO timestamp of last successful RevenueCat check
  needsVerification: boolean; // Flag to trigger re-verification

  // History for smart recommendations
  previousTiers: SubscriptionTier[];
  totalMonthsSubscribed: number;
  hasEverCanceled: boolean;

  // Feature visibility (Premium only)
  featureVisibility: FeatureVisibility;

  // Premium onboarding
  hasSeenPremiumWelcome: boolean;
  hasCompletedPremiumSetup: boolean;
  hasSeenPremiumFeatureTips: string[];

  // Data management on downgrade
  activeItemSelections: {
    medications: string[];
    tasks: string[];
    emergencyContacts: string[];
  } | null;

  // Apple Health connection status (Premium only)
  appleHealthConnected: boolean;
  healthRecordsLastSync: string | null;

  // Developer mode simulation flag (skip Premium Setup Flow)
  isDevModeSimulation: boolean;
}

interface SubscriptionActions {
  // Premium management
  unlockPremium: (tier: SubscriptionTier, expirationDate?: string, isDevMode?: boolean) => void;
  cancelSubscription: () => void;
  expireSubscription: () => void;
  restorePurchase: (
    isPremium: boolean,
    tier?: SubscriptionTier,
    expirationDate?: string
  ) => void;
  upgradeTier: (newTier: SubscriptionTier, expirationDate?: string) => void;
  resetSubscription: () => void;

  // Feature visibility
  setFeatureVisibility: (visibility: FeatureVisibility) => void;
  updateSectionVisibility: (
    section: keyof FeatureVisibility["sections"],
    visible: boolean
  ) => void;
  updateHomeCardVisibility: (
    card: keyof FeatureVisibility["homeCards"],
    visible: boolean
  ) => void;
  updateFeatureVisibility: (
    feature: keyof FeatureVisibility["features"],
    visible: boolean
  ) => void;
  applySimplePreset: () => void;
  applyFullPreset: () => void;

  // Premium onboarding
  markPremiumWelcomeSeen: () => void;
  markPremiumSetupComplete: () => void;
  markFeatureTipSeen: (featureId: string) => void;
  hasSeenFeatureTip: (featureId: string) => boolean;

  // Data management
  setActiveItemSelections: (
    selections: SubscriptionState["activeItemSelections"]
  ) => void;

  // Apple Health management (Premium only)
  setAppleHealthConnected: (connected: boolean) => void;
  setHealthRecordsLastSync: (timestamp: string | null) => void;
  disconnectAppleHealth: () => void;

  // Developer mode simulation control
  setDevModeSimulation: (value: boolean) => void;

  // Verification timestamp management
  setLastVerifiedAt: (timestamp: string) => void;
  setNeedsVerification: (needs: boolean) => void;

  // Helpers
  canAccessPremiumFeature: () => boolean;
  canAccessAppleHealth: () => boolean;
  isSectionVisible: (section: keyof FeatureVisibility["sections"]) => boolean;
  isHomeCardVisible: (card: keyof FeatureVisibility["homeCards"]) => boolean;
  isFeatureVisible: (feature: keyof FeatureVisibility["features"]) => boolean;
  isInGracePeriod: () => boolean;
  getDaysUntilExpiration: () => number | null;
  getRecommendedTier: () => SubscriptionTier;
}

type SubscriptionStore = SubscriptionState & SubscriptionActions;

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      isPremiumUnlocked: true, // v1.0: All features free. Set back to false when re-enabling IAP
      subscriptionTier: null,
      subscriptionStatus: "none",
      purchaseDate: null,
      expirationDate: null,
      canceledDate: null,
      lastVerifiedAt: null,
      needsVerification: false,
      previousTiers: [],
      totalMonthsSubscribed: 0,
      hasEverCanceled: false,
      featureVisibility: DEFAULT_FULL_VISIBILITY,
      hasSeenPremiumWelcome: false,
      hasCompletedPremiumSetup: false,
      hasSeenPremiumFeatureTips: [],
      activeItemSelections: null,
      appleHealthConnected: false,
      healthRecordsLastSync: null,
      isDevModeSimulation: false,

      // Premium management
      unlockPremium: (tier, expirationDate, isDevMode) =>
        set((state) => ({
          isPremiumUnlocked: true,
          subscriptionTier: tier,
          subscriptionStatus: "active",
          purchaseDate: new Date().toISOString(),
          expirationDate: tier === "lifetime" ? null : expirationDate || null,
          canceledDate: null,
          previousTiers: state.previousTiers.includes(tier)
            ? state.previousTiers
            : [...state.previousTiers, tier],
          activeItemSelections: null,
          // Automatically enable all features for any premium tier
          featureVisibility: DEFAULT_FULL_VISIBILITY,
          // Track if this was a developer mode simulation
          isDevModeSimulation: isDevMode || false,
        })),

      cancelSubscription: () =>
        set({
          subscriptionStatus: "canceled",
          canceledDate: new Date().toISOString(),
          hasEverCanceled: true,
        }),

      expireSubscription: () =>
        set((state) => ({
          isPremiumUnlocked: false,
          subscriptionStatus: "expired",
          totalMonthsSubscribed:
            state.totalMonthsSubscribed +
            (state.subscriptionTier === "monthly"
              ? 1
              : state.subscriptionTier === "annual"
              ? 12
              : 0),
          // Clear Apple Health connection on downgrade
          appleHealthConnected: false,
          healthRecordsLastSync: null,
          // Reset to simple visibility (Essential features only)
          featureVisibility: DEFAULT_SIMPLE_VISIBILITY,
          // Clear dev mode simulation flag
          isDevModeSimulation: false,
        })),

      restorePurchase: (isPremium, tier, expirationDate) =>
        set((state) => ({
          isPremiumUnlocked: isPremium,
          subscriptionTier: isPremium ? tier || "lifetime" : null,
          subscriptionStatus: isPremium ? "active" : "none",
          expirationDate: expirationDate || null,
          activeItemSelections: null,
          // Enable all features when premium is restored, reset to simple when downgraded
          featureVisibility: isPremium ? DEFAULT_FULL_VISIBILITY : DEFAULT_SIMPLE_VISIBILITY,
          // Clear Apple Health connection if downgrading (not Premium anymore)
          appleHealthConnected: isPremium ? state.appleHealthConnected : false,
          healthRecordsLastSync: isPremium ? state.healthRecordsLastSync : null,
        })),

      upgradeTier: (newTier, expirationDate) =>
        set((state) => ({
          subscriptionTier: newTier,
          subscriptionStatus: "active",
          expirationDate:
            newTier === "lifetime" ? null : expirationDate || null,
          canceledDate: null,
          previousTiers: state.previousTiers.includes(newTier)
            ? state.previousTiers
            : [...state.previousTiers, newTier],
          // Ensure all features remain enabled on upgrade
          featureVisibility: DEFAULT_FULL_VISIBILITY,
        })),

      resetSubscription: () =>
        set({
          isPremiumUnlocked: false,
          subscriptionTier: null,
          subscriptionStatus: "none",
          purchaseDate: null,
          expirationDate: null,
          canceledDate: null,
          previousTiers: [],
          totalMonthsSubscribed: 0,
          hasEverCanceled: false,
          featureVisibility: DEFAULT_SIMPLE_VISIBILITY,
          hasSeenPremiumWelcome: false,
          hasCompletedPremiumSetup: false,
          hasSeenPremiumFeatureTips: [],
          activeItemSelections: null,
          // Clear Apple Health connection on reset
          appleHealthConnected: false,
          healthRecordsLastSync: null,
          // Clear dev mode simulation flag
          isDevModeSimulation: false,
        }),

      // Feature visibility
      setFeatureVisibility: (visibility) =>
        set({ featureVisibility: visibility }),

      updateSectionVisibility: (section, visible) =>
        set((state) => ({
          featureVisibility: {
            ...state.featureVisibility,
            sections: { ...state.featureVisibility.sections, [section]: visible },
          },
        })),

      updateHomeCardVisibility: (card, visible) =>
        set((state) => ({
          featureVisibility: {
            ...state.featureVisibility,
            homeCards: {
              ...state.featureVisibility.homeCards,
              [card]: card === "sos" ? true : visible, // SOS always visible
            },
          },
        })),

      updateFeatureVisibility: (feature, visible) =>
        set((state) => ({
          featureVisibility: {
            ...state.featureVisibility,
            features: { ...state.featureVisibility.features, [feature]: visible },
          },
        })),

      applySimplePreset: () =>
        set({ featureVisibility: DEFAULT_SIMPLE_VISIBILITY }),

      applyFullPreset: () =>
        set({ featureVisibility: DEFAULT_FULL_VISIBILITY }),

      // Premium onboarding
      markPremiumWelcomeSeen: () => set({ hasSeenPremiumWelcome: true }),

      markPremiumSetupComplete: () => set({ hasCompletedPremiumSetup: true }),

      markFeatureTipSeen: (featureId) =>
        set((state) => ({
          hasSeenPremiumFeatureTips: state.hasSeenPremiumFeatureTips.includes(
            featureId
          )
            ? state.hasSeenPremiumFeatureTips
            : [...state.hasSeenPremiumFeatureTips, featureId],
        })),

      hasSeenFeatureTip: (featureId) =>
        get().hasSeenPremiumFeatureTips.includes(featureId),

      // Data management
      setActiveItemSelections: (selections) =>
        set({ activeItemSelections: selections }),

      // Apple Health management
      setAppleHealthConnected: (connected) => {
        set({ appleHealthConnected: connected });
      },

      setHealthRecordsLastSync: (timestamp) => {
        const state = get();
        // Only allow setting if Premium
        if (!state.isPremiumUnlocked) return;
        set({ healthRecordsLastSync: timestamp });
      },

      disconnectAppleHealth: () =>
        set({
          appleHealthConnected: false,
          healthRecordsLastSync: null,
        }),

      // Developer mode simulation control
      setDevModeSimulation: (value) => set({ isDevModeSimulation: value }),

      // Verification timestamp management
      setLastVerifiedAt: (timestamp) => set({ lastVerifiedAt: timestamp, needsVerification: false }),
      setNeedsVerification: (needs) => set({ needsVerification: needs }),

      // Helpers
      canAccessPremiumFeature: () => get().isPremiumUnlocked,

      canAccessAppleHealth: () => {
        const state = get();
        return state.isPremiumUnlocked;
      },

      isSectionVisible: (section) => {
        const state = get();
        return state.featureVisibility.sections[section];
      },

      isHomeCardVisible: (card) => {
        const state = get();
        if (card === "sos") return true; // Always visible
        return state.featureVisibility.homeCards[card];
      },

      isFeatureVisible: (feature) => {
        const state = get();
        return state.featureVisibility.features[feature];
      },

      isInGracePeriod: () => {
        const state = get();
        if (state.subscriptionStatus !== "canceled" || !state.expirationDate)
          return false;
        return new Date(state.expirationDate) > new Date();
      },

      getDaysUntilExpiration: () => {
        const state = get();
        if (!state.expirationDate) return null;
        const diffTime =
          new Date(state.expirationDate).getTime() - new Date().getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
      },

      getRecommendedTier: () => {
        const state = get();
        if (state.hasEverCanceled) return "lifetime";
        if (state.totalMonthsSubscribed >= 6) return "lifetime";
        if (state.previousTiers.includes("annual")) return "lifetime";
        if (state.previousTiers.length > 0) return "annual";
        return "lifetime";
      },
    }),
    {
      name: "subscription-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
          if (!state.previousTiers) state.previousTiers = [];
          if (!state.hasSeenPremiumFeatureTips)
            state.hasSeenPremiumFeatureTips = [];
          if (!state.featureVisibility)
            state.featureVisibility = DEFAULT_SIMPLE_VISIBILITY;

          // v1.0: Core features must always be visible regardless of persisted state
          state.featureVisibility.sections.home = true;
          state.featureVisibility.sections.tasks = true;
          state.featureVisibility.homeCards.sos = true;
          state.featureVisibility.homeCards.tasks = true;

          // Check if premium state needs re-verification (stale after 24 hours)
          if (state.isPremiumUnlocked && state.lastVerifiedAt) {
            const lastVerified = new Date(state.lastVerifiedAt).getTime();
            const now = Date.now();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            if (now - lastVerified > twentyFourHours) {
              state.needsVerification = true;
            }
          } else if (state.isPremiumUnlocked && !state.lastVerifiedAt) {
            // No verification timestamp exists, needs verification
            state.needsVerification = true;
          }
        }
      },
    }
  )
);

// Export presets for use elsewhere
export { DEFAULT_SIMPLE_VISIBILITY, DEFAULT_FULL_VISIBILITY };
