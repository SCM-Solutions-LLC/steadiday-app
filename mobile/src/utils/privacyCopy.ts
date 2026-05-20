/**
 * Privacy Copy - Single source of truth for all privacy-related text
 *
 * These strings are used throughout the app to ensure consistent
 * privacy messaging. Never hardcode privacy text elsewhere.
 */

export const PRIVACY_COPY = {
  /**
   * Universal footer shown on primary screens (Home, Tasks, Tools, Settings)
   */
  universalFooter: "Health and personal data stays on your device and is used for display only.",

  /**
   * Header shown on Health tab under the title
   */
  healthHeader: "Apple Health data stays on your device and is used for display only.",

  /**
   * Full privacy explanation shown in Settings > Privacy section
   */
  settingsPrivacyBody: "SteadiDay accesses Apple Health and personal data stored on your device to display trends and summaries. All data stays on your device. Data is not shared, not sold, and not used for tracking.",

  /**
   * One-time disclosure shown before first Apple Health sync
   */
  firstSyncDisclosure: "SteadiDay will import the last 90 days of Apple Health data to show trends. Data stays on your device and is used for display only.",
} as const;

export type PrivacyCopyKey = keyof typeof PRIVACY_COPY;
