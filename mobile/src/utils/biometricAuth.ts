/**
 * Biometric Authentication Utilities
 *
 * Handles Face ID / Touch ID authentication
 */

import * as LocalAuthentication from "expo-local-authentication";
import { logger } from "./logger";
import { isAndroidFeaturesActive } from "../config/platformConfig";

/**
 * Check if the device supports biometric authentication
 * @returns Object with support status and biometric types available
 */
export async function checkBiometricSupport(): Promise<{
  isSupported: boolean;
  biometricType: "faceId" | "touchId" | "none";
}> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();

    if (!compatible) {
      return { isSupported: false, biometricType: "none" };
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!enrolled) {
      return { isSupported: false, biometricType: "none" };
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    // Check for Face ID (iOS)
    if (
      types.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
      )
    ) {
      return { isSupported: true, biometricType: "faceId" };
    }

    // Check for Touch ID (iOS)
    if (
      types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
    ) {
      return { isSupported: true, biometricType: "touchId" };
    }

    return { isSupported: false, biometricType: "none" };
  } catch (error) {
    logger.error("Error checking biometric support:", error);
    return { isSupported: false, biometricType: "none" };
  }
}

/**
 * Authenticate user with biometrics
 * @param reason - Message to show to the user
 * @returns Success status
 */
export async function authenticateWithBiometrics(
  reason: string = "Authenticate to access SteadiDay"
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { isSupported } = await checkBiometricSupport();

    if (!isSupported) {
      return {
        success: false,
        error: "Biometric authentication is not available on this device",
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: "Cancel",
      disableDeviceFallback: false, // Allow device passcode fallback
      fallbackLabel: "Use Passcode",
    });

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.error || "Authentication failed",
    };
  } catch (error) {
    logger.error("Error during biometric authentication:", error);
    return {
      success: false,
      error: "Authentication failed",
    };
  }
}

/**
 * Get a user-friendly name for the biometric type
 */
export async function getBiometricName(): Promise<string> {
  const { biometricType } = await checkBiometricSupport();

  if (isAndroidFeaturesActive()) {
    switch (biometricType) {
      case "faceId":
        return "Face Unlock";
      case "touchId":
        return "Fingerprint";
      default:
        return "Biometric";
    }
  }

  switch (biometricType) {
    case "faceId":
      return "Face ID";
    case "touchId":
      return "Touch ID";
    default:
      return "Biometric";
  }
}
