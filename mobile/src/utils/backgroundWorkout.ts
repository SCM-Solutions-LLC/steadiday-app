import { NativeModules, Platform } from "react-native";

let BackgroundWorkoutModule: any = null;
try {
  if (Platform.OS === "ios") {
    BackgroundWorkoutModule = NativeModules.BackgroundWorkoutModule ?? null;
  }
} catch {
  BackgroundWorkoutModule = null;
}

const isSupported = Platform.OS === "ios" && BackgroundWorkoutModule != null;

export async function requestWorkoutAuthorization(): Promise<boolean> {
  if (!isSupported) return false;
  try {
    return await BackgroundWorkoutModule.requestAuthorization();
  } catch {
    return false;
  }
}

export async function startBackgroundWorkout(): Promise<boolean> {
  if (!isSupported) return false;
  try {
    const authorized = await BackgroundWorkoutModule.requestAuthorization();
    if (!authorized) return false;
    return await BackgroundWorkoutModule.startSession();
  } catch {
    return false;
  }
}

export async function stopBackgroundWorkout(): Promise<boolean> {
  if (!isSupported) return false;
  try {
    return await BackgroundWorkoutModule.stopSession();
  } catch {
    return false;
  }
}

export async function isWorkoutRunning(): Promise<boolean> {
  if (!isSupported) return false;
  try {
    return await BackgroundWorkoutModule.isRunning();
  } catch {
    return false;
  }
}

export function isBackgroundWorkoutSupported(): boolean {
  return isSupported;
}
