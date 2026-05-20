// ============================================================================
// FEATURE FLAGS
// Centralized feature gating configuration for Premium vs Essentials plans
// ============================================================================

import { isAndroidFeaturesActive } from "../config/platformConfig";

/**
 * Feature configuration that defines which features require Premium
 * This is the single source of truth for feature gating
 */
export const FEATURE_FLAGS = {
  // Apple Health features - ALL require Premium
  APPLE_HEALTH: {
    requiresPremium: true,
    displayName: "Apple Health",
    description: "Connect to Apple Health for metrics sync",
  },
  HEALTH_RECORDS: {
    requiresPremium: true,
    displayName: "Health Records",
    description: "Import lab results and medications from Apple Health Records",
  },
  HEALTH_METRICS: {
    requiresPremium: true,
    displayName: "Health Metrics",
    description: "Track steps, heart rate, sleep, and exercise",
  },

  // Premium-only tabs
  HEALTH_TAB: {
    requiresPremium: true,
    displayName: "Health Tab",
    description: "Health metrics, lab results, and screenings",
  },
  TOOLS_TAB: {
    requiresPremium: true,
    displayName: "Tools Tab",
    description: "Magnifier, flashlight, notes, find my car",
  },
  CONNECT_TAB: {
    requiresPremium: true,
    displayName: "Mind Breaks Tab",
    description: "Simple games to keep your mind busy",
  },

  // Premium-only widgets
  HEALTH_METRICS_WIDGET: {
    requiresPremium: true,
    displayName: "Health Metrics Widget",
    description: "Health metrics on home screen",
  },
  QUICK_TOOLS_WIDGET: {
    requiresPremium: true,
    displayName: "Quick Tools Widget",
    description: "Quick access to tools",
  },
  STEPS_WIDGET: {
    requiresPremium: true,
    displayName: "Steps Widget",
    description: "Step counter on home screen",
  },

  // Essentials features - available to all users
  MANUAL_MEDICATIONS: {
    requiresPremium: false,
    displayName: "Manual Medications",
    description: "Manually enter and manage medications",
  },
  APPLE_CALENDAR: {
    requiresPremium: false,
    displayName: "Apple Calendar",
    description: "Sync with Apple Calendar",
  },
  APPLE_REMINDERS: {
    requiresPremium: false,
    displayName: "Apple Reminders",
    description: "Sync with Apple Reminders",
  },
  GOOGLE_CALENDAR: {
    requiresPremium: false,
    displayName: "Google Calendar",
    description: "Sync with Google Calendar",
  },
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Get the display name for a feature flag, with Android-aware labels
 */
export function getFeatureDisplayName(feature: FeatureFlag): string {
  if (isAndroidFeaturesActive()) {
    switch (feature) {
      case "APPLE_HEALTH":
        return "Health Tracking";
      case "APPLE_CALENDAR":
        return "Calendar Sync";
      case "APPLE_REMINDERS":
        return "Reminders Sync";
      default:
        return FEATURE_FLAGS[feature].displayName;
    }
  }
  return FEATURE_FLAGS[feature].displayName;
}

/**
 * Check if a feature requires Premium
 */
export function requiresPremium(feature: FeatureFlag): boolean {
  return FEATURE_FLAGS[feature].requiresPremium;
}

/**
 * Premium-only tabs configuration
 */
export const PREMIUM_ONLY_TABS = ["health", "tools", "connect"] as const;
export type PremiumOnlyTab = (typeof PREMIUM_ONLY_TABS)[number];

/**
 * Check if a tab is Premium-only
 */
export function isTabPremiumOnly(tabId: string): boolean {
  return PREMIUM_ONLY_TABS.includes(tabId as PremiumOnlyTab);
}

/**
 * Premium-only widgets configuration
 */
export const PREMIUM_ONLY_WIDGETS = [
  "health-metrics",
  "magnifier",
  "flashlight",
  "notes",
  "find-my-car",
] as const;
export type PremiumOnlyWidget = (typeof PREMIUM_ONLY_WIDGETS)[number];

/**
 * Check if a widget is Premium-only
 */
export function isWidgetPremiumOnly(widgetId: string): boolean {
  return PREMIUM_ONLY_WIDGETS.includes(widgetId as PremiumOnlyWidget);
}

/**
 * Essential widgets that are always available
 */
export const ESSENTIALS_WIDGETS = [
  "weather",
  "tasks",
  "medications",
  "sos",
  "emergency-contacts",
  "favorite-contacts",
  "food-water",
  "insurance-cards",
  "my-doctors",
] as const;

/**
 * Filter widgets based on Premium status
 * Returns only widgets available for the given plan
 */
export function filterWidgetsForPlan<T extends string>(
  widgets: T[],
  isPremium: boolean
): T[] {
  if (isPremium) return widgets;
  return widgets.filter((widget) => !isWidgetPremiumOnly(widget));
}

/**
 * Filter tabs based on Premium status
 * Returns only tabs available for the given plan
 */
export function filterTabsForPlan<T extends { id: string; isPremiumOnly?: boolean }>(
  tabs: T[],
  isPremium: boolean
): T[] {
  if (isPremium) return tabs;
  return tabs.filter((tab) => !tab.isPremiumOnly && !isTabPremiumOnly(tab.id));
}
