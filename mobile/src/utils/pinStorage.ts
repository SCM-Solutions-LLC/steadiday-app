/**
 * PIN Storage Utilities
 *
 * Secure storage for user PIN using Expo SecureStore
 * PINs are stored locally on the device and NEVER synced to cloud
 * Falls back to AsyncStorage on web or when SecureStore is unavailable
 */

import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { logger } from "./logger";
import { DEMO_PIN, activateDemoMode } from "./demoMode";

const PIN_HASH_KEY = "steadiday_pin_hash";
const BIOMETRIC_ENABLED_KEY = "steadiday_biometric_enabled";

/**
 * Check if SecureStore is available on this platform
 */
function isSecureStoreAvailable(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

/**
 * Safe wrapper for getting items - falls back to AsyncStorage if SecureStore fails
 */
async function safeGetItem(key: string): Promise<string | null> {
  if (!isSecureStoreAvailable()) {
    return AsyncStorage.getItem(key);
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    // Fall back to AsyncStorage if SecureStore fails (e.g., user interaction not allowed)
    logger.log("SecureStore unavailable, using AsyncStorage fallback");
    return AsyncStorage.getItem(key);
  }
}

/**
 * Safe wrapper for setting items - falls back to AsyncStorage if SecureStore fails
 */
async function safeSetItem(key: string, value: string): Promise<void> {
  if (!isSecureStoreAvailable()) {
    await AsyncStorage.setItem(key, value);
    return;
  }

  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    // Fall back to AsyncStorage if SecureStore fails
    logger.log("SecureStore unavailable, using AsyncStorage fallback");
    await AsyncStorage.setItem(key, value);
  }
}

/**
 * Safe wrapper for deleting items - falls back to AsyncStorage if SecureStore fails
 */
async function safeDeleteItem(key: string): Promise<void> {
  if (!isSecureStoreAvailable()) {
    await AsyncStorage.removeItem(key);
    return;
  }

  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    // Fall back to AsyncStorage if SecureStore fails
    logger.log("SecureStore unavailable, using AsyncStorage fallback");
    await AsyncStorage.removeItem(key);
  }
}

/**
 * Hash a PIN using SHA-256
 * We store the hash instead of the plain PIN for additional security
 */
async function hashPin(pin: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin
  );
  return hash;
}

/**
 * Set up a new PIN for the user
 * @param pin - 4-digit PIN
 * @returns Success status
 */
export async function setPin(pin: string): Promise<boolean> {
  try {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      logger.error("Invalid PIN format");
      return false;
    }

    const hashedPin = await hashPin(pin);

    // Store the hash in secure storage
    await safeSetItem(PIN_HASH_KEY, hashedPin);

    return true;
  } catch (error) {
    logger.error("Error setting PIN:", error);
    return false;
  }
}

/**
 * Verify if the provided PIN matches the stored PIN
 * @param pin - PIN to verify
 * @returns True if PIN matches, false otherwise
 */
export async function verifyPin(pin: string): Promise<boolean> {
  try {
    // DEMO MODE: Check for demo PIN first (for App Store review)
    if (pin === DEMO_PIN) {
      logger.log("[Demo Mode] Demo PIN entered - activating demo mode");
      await activateDemoMode();
      return true;
    }

    const storedHash = await safeGetItem(PIN_HASH_KEY);

    if (!storedHash) {
      logger.error("No PIN found in storage");
      return false;
    }

    const inputHash = await hashPin(pin);
    return inputHash === storedHash;
  } catch (error) {
    logger.error("Error verifying PIN:", error);
    return false;
  }
}

/**
 * Check if a PIN has been set up
 * @returns True if PIN exists, false otherwise
 */
export async function hasPinSetup(): Promise<boolean> {
  try {
    const storedHash = await safeGetItem(PIN_HASH_KEY);
    return storedHash !== null;
  } catch (error) {
    logger.error("Error checking PIN setup:", error);
    return false;
  }
}

/**
 * Delete the stored PIN
 * Used during account deletion or PIN reset
 * @returns Success status
 */
export async function deletePin(): Promise<boolean> {
  try {
    await safeDeleteItem(PIN_HASH_KEY);
    return true;
  } catch (error) {
    logger.error("Error deleting PIN:", error);
    return false;
  }
}

/**
 * Enable biometric authentication
 */
export async function enableBiometric(): Promise<boolean> {
  try {
    await safeSetItem(BIOMETRIC_ENABLED_KEY, "true");
    return true;
  } catch (error) {
    logger.error("Error enabling biometric:", error);
    return false;
  }
}

/**
 * Disable biometric authentication
 */
export async function disableBiometric(): Promise<boolean> {
  try {
    await safeDeleteItem(BIOMETRIC_ENABLED_KEY);
    return true;
  } catch (error) {
    logger.error("Error disabling biometric:", error);
    return false;
  }
}

/**
 * Check if biometric authentication is enabled
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enabled = await safeGetItem(BIOMETRIC_ENABLED_KEY);
    return enabled === "true";
  } catch (error) {
    logger.error("Error checking biometric status:", error);
    return false;
  }
}
