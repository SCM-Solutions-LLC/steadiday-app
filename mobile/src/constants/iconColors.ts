// ============================================================================
// ICON COLORS
// Centralized icon color definitions for consistent theming across the app
// ============================================================================

// Icon colors for light mode
export const ICON_COLORS_LIGHT = {
  // Settings sections - Appearance & Display
  appearance: "#8B5CF6", // Purple
  customizeHome: "#10B981", // Emerald
  textSize: "#6366F1", // Indigo
  location: "#EF4444", // Red

  // Settings sections - Notifications & Sounds
  notifications: "#3B82F6", // Blue
  sounds: "#14B8A6", // Teal

  // Settings sections - Your Plan
  subscription: "#FFD700", // Gold
  subscriptionFree: "#6B7280", // Gray

  // Settings sections - Safety & Security
  safety: "#10B981", // Emerald
  careSummary: "#EC4899", // Pink
  security: "#6366F1", // Indigo

  // Settings sections - Connected Services
  connectedApps: "#10B981", // Emerald
  language: "#8B5CF6", // Purple

  // Settings sections - Help & Information
  help: "#3B82F6", // Blue
  feedback: "#F59E0B", // Amber
  legalPrivacy: "#6B7280", // Gray
  about: "#6B7280", // Gray

  // Tools sections - Health & Wellness
  foodTracker: "#EF4444", // Red
  waterTracker: "#3B82F6", // Blue
  history: "#8B5CF6", // Purple

  // Tools sections - Daily Essentials
  magnifier: "#6366F1", // Indigo
  flashlight: "#F59E0B", // Amber
  notes: "#EC4899", // Pink

  // Tools sections - Phone Helpers
  shareLocation: "#10B981", // Emerald
  parking: "#8B5CF6", // Purple

  // Health sections
  healthRecords: "#EF4444", // Red
  doctors: "#3B82F6", // Blue
  insurance: "#10B981", // Emerald
  labResults: "#8B5CF6", // Purple
  screenings: "#EC4899", // Pink

  // Medical/Emergency
  medical: "#EF4444", // Red
  emergency: "#EF4444", // Red
  trustedContacts: "#10B981", // Emerald
};

// Icon colors for dark mode (slightly brighter/adjusted for visibility)
export const ICON_COLORS_DARK = {
  // Settings sections - Appearance & Display
  appearance: "#A78BFA", // Purple (lighter)
  customizeHome: "#34D399", // Emerald (lighter)
  textSize: "#818CF8", // Indigo (lighter)
  location: "#F87171", // Red (lighter)

  // Settings sections - Notifications & Sounds
  notifications: "#60A5FA", // Blue (lighter)
  sounds: "#2DD4BF", // Teal (lighter)

  // Settings sections - Your Plan
  subscription: "#FFD700", // Gold (same)
  subscriptionFree: "#9CA3AF", // Gray (lighter)

  // Settings sections - Safety & Security
  safety: "#34D399", // Emerald (lighter)
  careSummary: "#F472B6", // Pink (lighter)
  security: "#818CF8", // Indigo (lighter)

  // Settings sections - Connected Services
  connectedApps: "#34D399", // Emerald (lighter)
  language: "#A78BFA", // Purple (lighter)

  // Settings sections - Help & Information
  help: "#60A5FA", // Blue (lighter)
  feedback: "#FBBF24", // Amber (lighter)
  legalPrivacy: "#9CA3AF", // Gray (lighter)
  about: "#9CA3AF", // Gray (lighter)

  // Tools sections - Health & Wellness
  foodTracker: "#F87171", // Red (lighter)
  waterTracker: "#60A5FA", // Blue (lighter)
  history: "#A78BFA", // Purple (lighter)

  // Tools sections - Daily Essentials
  magnifier: "#818CF8", // Indigo (lighter)
  flashlight: "#FBBF24", // Amber (lighter)
  notes: "#F472B6", // Pink (lighter)

  // Tools sections - Phone Helpers
  shareLocation: "#34D399", // Emerald (lighter)
  parking: "#A78BFA", // Purple (lighter)

  // Health sections
  healthRecords: "#F87171", // Red (lighter)
  doctors: "#60A5FA", // Blue (lighter)
  insurance: "#34D399", // Emerald (lighter)
  labResults: "#A78BFA", // Purple (lighter)
  screenings: "#F472B6", // Pink (lighter)

  // Medical/Emergency
  medical: "#F87171", // Red (lighter)
  emergency: "#F87171", // Red (lighter)
  trustedContacts: "#34D399", // Emerald (lighter)
};

// Type for icon color keys
export type IconColorKey = keyof typeof ICON_COLORS_LIGHT;

/**
 * Get the icon color for a specific key based on theme mode
 * @param key The icon color key
 * @param isDark Whether dark mode is active
 * @returns The appropriate color string
 */
export function getIconColor(key: IconColorKey, isDark: boolean): string {
  const colors = isDark ? ICON_COLORS_DARK : ICON_COLORS_LIGHT;
  return colors[key] || (isDark ? "#9CA3AF" : "#6B7280");
}

/**
 * Get background color for icon (20% opacity of the icon color)
 * @param iconColor The icon color
 * @returns Background color with 20% opacity
 */
export function getIconBgColor(iconColor: string): string {
  return iconColor + "20";
}
