// ============================================================================
// DOMAIN-SPECIFIC STORES
// Split from the monolithic appStore for better performance and maintainability
// ============================================================================

export { useSettingsStore } from "./settingsStore";
export { useUserStore } from "./userStore";
export { useMedicationStore } from "./medicationStore";
export { useTaskStore } from "./taskStore";
export { useHealthStore } from "./healthStore";
export { useUIStore } from "./uiStore";
export { useSubscriptionStore } from "./subscriptionStore";
export { useSafetySessionStore } from "./safetySessionStore";
export { useEngagementStore } from "./engagementStore";
export type {
  SubscriptionTier,
  SubscriptionStatus,
  FeatureVisibility,
} from "./subscriptionStore";
export {
  DEFAULT_SIMPLE_VISIBILITY,
  DEFAULT_FULL_VISIBILITY,
} from "./subscriptionStore";
