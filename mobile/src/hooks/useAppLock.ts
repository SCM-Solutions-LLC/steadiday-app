/**
 * useAppLock Hook
 *
 * Manages app lock state including:
 * - PIN-based lock screen on startup
 * - Automatic locking on foreground return
 * - Integration with SessionManager and appLockManager
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { hasPinSetup } from "../utils/pinStorage";
import { SessionManager } from "../utils/sessionManager";
import { appLockManager } from "../utils/appLockManager";
import { logger } from "../utils/logger";

export interface UseAppLockReturn {
  isLocked: boolean;
  unlock: () => void;
  checkLockStatus: () => Promise<void>;
}

function useAppLock(): UseAppLockReturn {
  const [isLocked, setIsLocked] = useState(false);
  const appStateSubscriptionRef = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);
  const isInitializedRef = useRef(false);

  /**
   * Check if we need to show lock screen based on PIN setup
   */
  const checkLockStatus = useCallback(async () => {
    const pinSetup = await hasPinSetup();

    if (!pinSetup) {
      setIsLocked(false);
      return;
    }

    // Use SessionManager to decide if the app should be locked
    const shouldLock = SessionManager.shouldLock();
    setIsLocked(shouldLock);
  }, []);

  /**
   * Unlock the app after successful authentication
   */
  const unlock = useCallback(() => {
    appLockManager.unlock();
    setIsLocked(false);
    logger.log("[useAppLock] App unlocked");
  }, []);

  /**
   * Initialize app lock manager and set up listeners
   */
  useEffect(() => {
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    // Initialize app lock manager with callback to lock the app
    appLockManager.initialize(() => {
      setIsLocked(true);
      logger.log("[useAppLock] Lock required by appLockManager");
    });

    // Check initial lock status
    checkLockStatus();

    // Listen for app state changes (background/foreground)
    appStateSubscriptionRef.current = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          // App came to foreground, check if we need to lock
          logger.debug("[useAppLock] App became active, checking lock status");
          checkLockStatus();
        }
      }
    );

    return () => {
      if (appStateSubscriptionRef.current) {
        appStateSubscriptionRef.current.remove();
        appStateSubscriptionRef.current = null;
      }
      appLockManager.cleanup();
      isInitializedRef.current = false;
    };
  }, [checkLockStatus]);

  return {
    isLocked,
    unlock,
    checkLockStatus,
  };
}

export default useAppLock;
