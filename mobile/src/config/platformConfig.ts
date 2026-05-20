import { Platform } from "react-native";

/**
 * Android Features Flag
 *
 * When set to `true`, the app will show Android-specific UI and behavior
 * (e.g. "Open Find My Device" instead of "Open Find My", health coming-soon screen, etc.)
 *
 * When `false` (default), the app behaves exactly as the current iOS production build.
 * Even if running on an Android device during development, all screens stay in iOS mode.
 *
 * To activate Android features: set this to `true` and build the Android AAB for Google Play.
 */
export const ANDROID_FEATURES_ENABLED = true;

/**
 * Helper: returns true when Android-specific features should be active.
 * Requires BOTH the flag to be on AND the device to actually be Android.
 */
export function isAndroidFeaturesActive(): boolean {
  return ANDROID_FEATURES_ENABLED && Platform.OS === "android";
}
