/**
 * Session Manager
 *
 * Tracks user activity and automatically locks the app after periods of inactivity.
 *
 * SECURITY DEFENSE: Attack Story 2 - Stolen Device Session Hijack
 * - Locks app after 15 minutes of inactivity
 * - Locks app when backgrounded for more than 5 minutes
 * - Prevents unauthorized access to sensitive health and contact data
 *
 * TIMEOUT VALUES (configured here for easy adjustment):
 * - INACTIVITY_TIMEOUT: 15 minutes (900,000 ms)
 * - BACKGROUND_TIMEOUT: 5 minutes (300,000 ms)
 *
 * HOW IT WORKS:
 * 1. Every user interaction updates lastActivity timestamp
 * 2. Timer checks for inactivity every minute
 * 3. When app goes to background, we record the time
 * 4. When app returns to foreground, we check if too much time passed
 * 5. If timeout exceeded, navigate to lock screen and require authentication
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import { secureLog } from "./secureLogger";

/**
 * TIMEOUT CONFIGURATION
 * Adjust these values to change when the app locks
 */
// How long the user can be inactive before we lock (15 minutes)
export const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

// How long the app can be in background before we lock (5 minutes)
export const BACKGROUND_TIMEOUT = 5 * 60 * 1000;

// Storage keys for session state
const STORAGE_KEYS = {
  LAST_ACTIVITY: "session_last_activity",
  BACKGROUND_TIME: "session_background_time",
  IS_LOCKED: "session_is_locked",
};

/**
 * Session Manager Class
 *
 * Singleton that tracks activity and manages session timeouts
 */
class SessionManagerClass {
  private lastActivity: number = Date.now();
  private backgroundTime: number | null = null;
  private isLocked: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private persistDebounceTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize the session manager
   * Call this once when the app starts
   */
  async initialize(): Promise<void> {
    // Restore session state from storage
    await this.restoreState();

    // Start checking for inactivity
    this.startInactivityCheck();

    // Listen for app state changes (background/foreground)
    this.setupAppStateListener();

    secureLog("Session manager initialized", {
      inactivityTimeout: INACTIVITY_TIMEOUT / 1000 / 60 + " minutes",
      backgroundTimeout: BACKGROUND_TIMEOUT / 1000 / 60 + " minutes",
    });
  }

  /**
   * Restore session state from persistent storage
   * This handles the case where the app was killed and restarted
   */
  private async restoreState(): Promise<void> {
    try {
      const [lastActivity, backgroundTime, isLocked] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY),
        AsyncStorage.getItem(STORAGE_KEYS.BACKGROUND_TIME),
        AsyncStorage.getItem(STORAGE_KEYS.IS_LOCKED),
      ]);

      if (lastActivity) {
        this.lastActivity = parseInt(lastActivity, 10);
      }

      if (backgroundTime) {
        this.backgroundTime = parseInt(backgroundTime, 10);
      }

      if (isLocked === "true") {
        this.isLocked = true;
      }

      // Check if we should be locked based on restored state
      const now = Date.now();
      const timeSinceActivity = now - this.lastActivity;

      if (timeSinceActivity > INACTIVITY_TIMEOUT) {
        this.isLocked = true;
        await this.persistState();
      }
    } catch (error) {
      secureLog("Failed to restore session state", { error });
    }
  }

  /**
   * Persist current session state to storage
   * This allows us to remember state if app is killed
   */
  private async persistState(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(
          STORAGE_KEYS.LAST_ACTIVITY,
          this.lastActivity.toString()
        ),
        AsyncStorage.setItem(
          STORAGE_KEYS.BACKGROUND_TIME,
          this.backgroundTime?.toString() || ""
        ),
        AsyncStorage.setItem(STORAGE_KEYS.IS_LOCKED, this.isLocked.toString()),
      ]);
    } catch (error) {
      secureLog("Failed to persist session state", { error });
    }
  }

  /**
   * Update the last activity timestamp
   * Call this whenever the user interacts with the app
   *
   * DEFENSE: Resets the inactivity timer so active users aren't locked out
   * NOTE: Persistence is debounced to avoid excessive AsyncStorage writes
   */
  updateActivity(): void {
    this.lastActivity = Date.now(); // Always update in-memory immediately

    // Debounce the persist to avoid excessive AsyncStorage writes
    if (!this.persistDebounceTimer) {
      this.persistDebounceTimer = setTimeout(() => {
        this.persistState();
        this.persistDebounceTimer = null;
      }, 30000); // Persist at most once every 30 seconds
    }
  }

  /**
   * Start periodic check for inactivity
   * Runs every minute to see if we should lock
   *
   * DEFENSE: Automatically locks after INACTIVITY_TIMEOUT with no interaction
   */
  private startInactivityCheck(): void {
    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkInactivity();
    }, 60 * 1000);
  }

  /**
   * Check if user has been inactive too long
   */
  private checkInactivity(): void {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;

    if (timeSinceActivity > INACTIVITY_TIMEOUT && !this.isLocked) {
      secureLog("Inactivity timeout exceeded, locking app");
      this.lock("inactivity");
    }
  }

  /**
   * Listen for app going to background/foreground
   *
   * DEFENSE: When app goes to background, we start a timer
   * If app stays in background too long, we lock when returning
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "background") {
          // App went to background - record the time
          this.handleBackground();
        } else if (nextAppState === "active") {
          // App came back to foreground - check if too much time passed
          this.handleForeground();
        }
      }
    );
  }

  /**
   * Handle app going to background
   * Record the time so we can check duration when returning
   */
  private handleBackground(): void {
    this.backgroundTime = Date.now();
    this.persistState();
    secureLog("App went to background");
  }

  /**
   * Handle app returning to foreground
   * Check if it was in background too long
   *
   * DEFENSE: Lock if app was backgrounded longer than BACKGROUND_TIMEOUT
   * This prevents someone from picking up a phone and opening the app
   */
  private handleForeground(): void {
    secureLog("App returned to foreground");

    if (this.backgroundTime) {
      const now = Date.now();
      const timeInBackground = now - this.backgroundTime;

      if (timeInBackground > BACKGROUND_TIMEOUT) {
        secureLog("Background timeout exceeded, locking app", {
          timeInBackground: Math.floor(timeInBackground / 1000) + " seconds",
        });
        this.lock("background");
      }

      // Reset background time
      this.backgroundTime = null;
      this.persistState();
    }

    // Also check for general inactivity
    this.checkInactivity();
  }

  /**
   * Lock the session
   *
   * @param reason - Why we're locking (for logging)
   *
   * DEFENSE: Sets locked state and persists it
   * Navigation to lock screen happens in the UI layer
   */
  lock(reason: "inactivity" | "background" | "manual"): void {
    this.isLocked = true;
    this.persistState();
    secureLog("Session locked", { reason });
  }

  /**
   * Unlock the session after successful authentication
   * Call this after user enters correct PIN or logs in
   */
  async unlock(): Promise<void> {
    this.isLocked = false;
    this.lastActivity = Date.now();
    this.backgroundTime = null;
    await this.persistState();
    secureLog("Session unlocked");
  }

  /**
   * Check if session is currently locked
   */
  isSessionLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Should we show the lock screen?
   * Returns true if either:
   * - Session is already locked
   * - Inactivity timeout exceeded
   * - Background timeout exceeded
   */
  shouldLock(): boolean {
    if (this.isLocked) {
      return true;
    }

    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;

    if (timeSinceActivity > INACTIVITY_TIMEOUT) {
      return true;
    }

    if (this.backgroundTime) {
      const timeInBackground = now - this.backgroundTime;
      if (timeInBackground > BACKGROUND_TIMEOUT) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear session state
   * Call this on logout
   *
   * DEFENSE: Ensures we don't keep any session data after logout
   */
  async clearSession(): Promise<void> {
    this.lastActivity = Date.now();
    this.backgroundTime = null;
    this.isLocked = false;

    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY),
        AsyncStorage.removeItem(STORAGE_KEYS.BACKGROUND_TIME),
        AsyncStorage.removeItem(STORAGE_KEYS.IS_LOCKED),
      ]);
    } catch (error) {
      secureLog("Failed to clear session state", { error });
    }
  }

  /**
   * Cleanup on app shutdown
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    if (this.persistDebounceTimer) {
      clearTimeout(this.persistDebounceTimer);
      this.persistDebounceTimer = null;
    }
  }
}

// Export singleton instance
export const SessionManager = new SessionManagerClass();

/**
 * USAGE IN COMPONENTS:
 *
 * 1. Initialize in App.tsx:
 *    useEffect(() => {
 *      SessionManager.initialize();
 *      return () => SessionManager.destroy();
 *    }, []);
 *
 * 2. Update activity on user interaction:
 *    <Pressable onPress={() => {
 *      SessionManager.updateActivity();
 *      handlePress();
 *    }}>
 *
 * 3. Check if should lock (in navigation):
 *    useEffect(() => {
 *      if (SessionManager.shouldLock()) {
 *        navigation.navigate('LockScreen');
 *      }
 *    }, [navigation]);
 *
 * 4. Unlock after authentication:
 *    await SessionManager.unlock();
 *
 * 5. Clear on logout:
 *    await SessionManager.clearSession();
 */

/**
 * BACKEND REQUIREMENTS:
 * None - this is entirely client-side session management
 *
 * However, consider these backend enhancements:
 * - Track active sessions per user
 * - Allow users to see all active sessions
 * - Allow remote logout of stolen devices
 * - Notify users of new device logins
 */
