/**
 * App Lock Manager
 *
 * Manages app locking functionality including:
 * - PIN-at-startup
 * - Inactivity lock
 * - Lock state management
 */

import { AppState as RNAppState, AppStateStatus } from "react-native";
import { hasPinSetup } from "./pinStorage";

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

class AppLockManager {
  private lastActiveTime: number = Date.now();
  private appStateSubscription: any = null;
  private lockRequiredCallback: (() => void) | null = null;
  private isLocked: boolean = false;

  /**
   * Initialize the app lock manager
   * Sets up listeners for app state changes
   */
  initialize(onLockRequired: () => void) {
    this.lockRequiredCallback = onLockRequired;
    this.lastActiveTime = Date.now();

    // Listen for app state changes
    this.appStateSubscription = RNAppState.addEventListener(
      "change",
      this.handleAppStateChange
    );
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const pinSetup = await hasPinSetup();

    if (!pinSetup) {
      // No PIN configured, don't lock
      return;
    }

    if (nextAppState === "active") {
      // App is coming to foreground
      const now = Date.now();
      const timeSinceLastActive = now - this.lastActiveTime;

      // Check if inactivity timeout has been exceeded
      if (timeSinceLastActive > INACTIVITY_TIMEOUT) {
        this.requireLock();
      }
    } else if (nextAppState === "background" || nextAppState === "inactive") {
      // App is going to background, record time
      this.lastActiveTime = Date.now();
    }
  };

  /**
   * Require lock screen to be shown
   */
  requireLock() {
    if (!this.isLocked && this.lockRequiredCallback) {
      this.isLocked = true;
      this.lockRequiredCallback();
    }
  }

  /**
   * Unlock the app (called after successful PIN/biometric auth)
   */
  unlock() {
    this.isLocked = false;
    this.lastActiveTime = Date.now();
  }

  /**
   * Check if app should be locked on startup
   */
  async shouldLockOnStartup(): Promise<boolean> {
    const pinSetup = await hasPinSetup();
    return pinSetup;
  }

  /**
   * Update last active time (call this after user interaction)
   */
  updateActivity() {
    this.lastActiveTime = Date.now();
  }

  /**
   * Check if app is currently locked
   */
  getIsLocked(): boolean {
    return this.isLocked;
  }
}

// Export singleton instance
export const appLockManager = new AppLockManager();
