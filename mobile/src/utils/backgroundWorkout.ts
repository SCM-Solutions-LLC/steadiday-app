import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { logger } from "./logger";

// iOS: BackgroundWorkoutModule (CMMotionManager + HKWorkoutSession)
let BackgroundWorkoutModule: any = null;
try {
  if (Platform.OS === "ios") {
    BackgroundWorkoutModule = NativeModules.BackgroundWorkoutModule ?? null;
  }
} catch {
  BackgroundWorkoutModule = null;
}

// Android: FallDetectionModule (foreground service + SensorManager)
let FallDetectionModule: any = null;
try {
  if (Platform.OS === "android") {
    FallDetectionModule = NativeModules.FallDetectionModule ?? null;
  }
} catch {
  FallDetectionModule = null;
}

// Lazy NativeEventEmitter singletons
let iosEmitter: NativeEventEmitter | null = null;
let androidEmitter: NativeEventEmitter | null = null;

function getIOSEmitter(): NativeEventEmitter | null {
  if (!BackgroundWorkoutModule) return null;
  if (!iosEmitter) {
    iosEmitter = new NativeEventEmitter(BackgroundWorkoutModule);
  }
  return iosEmitter;
}

function getAndroidEmitter(): NativeEventEmitter | null {
  if (!FallDetectionModule) return null;
  if (!androidEmitter) {
    androidEmitter = new NativeEventEmitter(FallDetectionModule);
  }
  return androidEmitter;
}

const isIOSSupported = Platform.OS === "ios" && BackgroundWorkoutModule != null;
const isAndroidSupported = Platform.OS === "android" && FallDetectionModule != null;
const isSupported = isIOSSupported || isAndroidSupported;

// Startup diagnostic — logs once at module load so availability is visible in logs.
// Uses warn (not error) because null modules are expected in Expo Go.
if (Platform.OS === "android") {
  if (FallDetectionModule != null) {
    logger.log("[BackgroundWorkout] Android FallDetectionModule: AVAILABLE");
  } else {
    logger.warn("[BackgroundWorkout] Android FallDetectionModule: NULL — JS-only fall detection (foreground only). Build a dev client for native background support.");
  }
} else if (Platform.OS === "ios") {
  if (BackgroundWorkoutModule != null) {
    logger.log("[BackgroundWorkout] iOS BackgroundWorkoutModule: AVAILABLE");
  } else {
    logger.warn("[BackgroundWorkout] iOS BackgroundWorkoutModule: NULL — JS-only fall detection (foreground only). Build a dev client for native background support.");
  }
}

export async function requestWorkoutAuthorization(): Promise<boolean> {
  if (!isIOSSupported) return false;
  try {
    return await BackgroundWorkoutModule.requestAuthorization();
  } catch {
    return false;
  }
}

/**
 * Request Android notification permission (Android 13+ / API 33+).
 * Must be called before starting the foreground service so fall alert
 * notifications can be displayed. No-op on iOS (handled by expo-notifications).
 */
async function ensureAndroidNotificationPermission(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        logger.error("[BackgroundWorkout] Android notification permission denied — fall alert notifications will be silent");
      }
    }
  } catch {
    // Non-fatal — service will still run, notifications may just be blocked
  }
}

export async function startBackgroundWorkout(): Promise<boolean> {
  if (isIOSSupported) {
    try {
      try {
        await BackgroundWorkoutModule.requestAuthorization();
      } catch {
        // HealthKit auth denied or unavailable — continue anyway
      }
      return await BackgroundWorkoutModule.startSession();
    } catch {
      return false;
    }
  }

  if (isAndroidSupported) {
    try {
      await ensureAndroidNotificationPermission();
      return await FallDetectionModule.startService();
    } catch {
      return false;
    }
  }

  return false;
}

export async function stopBackgroundWorkout(): Promise<boolean> {
  if (isIOSSupported) {
    try {
      return await BackgroundWorkoutModule.stopSession();
    } catch {
      return false;
    }
  }

  if (isAndroidSupported) {
    try {
      return await FallDetectionModule.stopService();
    } catch {
      return false;
    }
  }

  return false;
}

export async function isWorkoutRunning(): Promise<boolean> {
  if (isIOSSupported) {
    try {
      return await BackgroundWorkoutModule.isRunning();
    } catch {
      return false;
    }
  }

  if (isAndroidSupported) {
    try {
      return await FallDetectionModule.isRunning();
    } catch {
      return false;
    }
  }

  return false;
}

export function isBackgroundWorkoutSupported(): boolean {
  return isSupported;
}

export function addNativeFallDetectedListener(
  callback: () => void
): () => void {
  if (isIOSSupported) {
    const emitter = getIOSEmitter();
    if (emitter) {
      const subscription = emitter.addListener("onNativeFallDetected", callback);
      return () => subscription.remove();
    }
  }

  if (isAndroidSupported) {
    const emitter = getAndroidEmitter();
    if (emitter) {
      const subscription = emitter.addListener("onNativeFallDetected", callback);
      return () => subscription.remove();
    }
  }

  return () => {};
}

export async function consumePendingFallAlert(): Promise<number> {
  if (isIOSSupported) {
    try {
      const ts = await BackgroundWorkoutModule.consumePendingFallAlert();
      return typeof ts === "number" ? ts : 0;
    } catch {
      return 0;
    }
  }

  if (isAndroidSupported) {
    try {
      const ts = await FallDetectionModule.consumePendingFallAlert();
      return typeof ts === "number" ? ts : 0;
    } catch {
      return 0;
    }
  }

  return 0;
}

export async function acknowledgeFallAlert(): Promise<void> {
  if (isIOSSupported) {
    try {
      await BackgroundWorkoutModule.acknowledgeFallAlert();
    } catch {
      // Module may not have this method on older builds
    }
    return;
  }

  if (isAndroidSupported) {
    try {
      await FallDetectionModule.acknowledgeFallAlert();
    } catch {
      // Module may not have this method on older builds
    }
  }
}

export async function configureNativeEscalation(
  backendUrl: string,
  authKey: string,
  sessionId: string
): Promise<boolean> {
  if (isIOSSupported) {
    try {
      return await BackgroundWorkoutModule.configureEscalation(backendUrl, authKey, sessionId);
    } catch {
      return false;
    }
  }

  if (isAndroidSupported) {
    try {
      return await FallDetectionModule.configureEscalation(backendUrl, authKey, sessionId);
    } catch {
      return false;
    }
  }

  return false;
}
