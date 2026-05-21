/**
 * URL Opening Utility
 *
 * Opens external URLs in an in-app browser using expo-web-browser
 * with fallback to system browser via Linking.
 *
 * Styled to match the SteadiDay app theme.
 */

import * as WebBrowser from "expo-web-browser";
import { Linking, Platform } from "react-native";
import { logger } from "./logger";

/**
 * External URLs for SteadiDay website pages
 */
export const EXTERNAL_URLS = {
  PRIVACY_POLICY: "https://www.steadiday.com/privacy.html",
  SECURITY: "https://www.steadiday.com/security.html",
  TERMS_OF_SERVICE: "https://www.steadiday.com/terms.html",
  DATA_RETENTION: "https://www.steadiday.com/data-retention.html",
  DATA_BREACH: "https://www.steadiday.com/data-breach.html",
  WEBSITE: "https://www.steadiday.com",
} as const;

export type ExternalURLKey = keyof typeof EXTERNAL_URLS;

/**
 * Opens a URL in an in-app browser with SteadiDay theming.
 * Falls back to external browser if in-app browser fails.
 *
 * @param url - The URL to open
 * @returns Promise that resolves when the browser is dismissed
 */
export async function openURL(url: string): Promise<void> {
  try {
    // Use in-app browser for better UX - user stays in the app
    await WebBrowser.openBrowserAsync(url, {
      // iOS presentation style - page sheet for a modal feel
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      // Match SteadiDay teal color for browser controls
      controlsColor: "#1A8A7D",
      // Match app's cream/warm white background for toolbar
      toolbarColor: "#FFFBF5",
      // Enable reader mode button on iOS for better readability
      enableBarCollapsing: true,
    });
  } catch (error) {
    // Fallback to external browser if in-app browser fails
    logger.log("In-app browser failed, falling back to external browser:", error);
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        logger.warn("Cannot open URL:", url);
      }
    } catch (linkingError) {
      logger.error("Failed to open URL:", linkingError);
    }
  }
}

/**
 * Opens the SteadiDay Privacy Policy page
 */
export async function openPrivacyPolicy(): Promise<void> {
  return openURL(EXTERNAL_URLS.PRIVACY_POLICY);
}

/**
 * Opens the SteadiDay Security page
 */
export async function openSecurity(): Promise<void> {
  return openURL(EXTERNAL_URLS.SECURITY);
}

/**
 * Opens the SteadiDay Terms of Service page
 */
export async function openTermsOfService(): Promise<void> {
  return openURL(EXTERNAL_URLS.TERMS_OF_SERVICE);
}

/**
 * Opens the SteadiDay Data Retention Policy page
 */
export async function openDataRetention(): Promise<void> {
  return openURL(EXTERNAL_URLS.DATA_RETENTION);
}

/**
 * Opens the SteadiDay Data Breach Response page
 */
export async function openDataBreach(): Promise<void> {
  return openURL(EXTERNAL_URLS.DATA_BREACH);
}

/**
 * Opens the main SteadiDay website
 */
export async function openWebsite(): Promise<void> {
  return openURL(EXTERNAL_URLS.WEBSITE);
}
