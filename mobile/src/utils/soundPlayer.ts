import { Audio, AVPlaybackStatus } from "expo-av";
import { ReminderSound } from "../types/app";
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "../state/stores/settingsStore";
import { logger } from "./logger";

const SOUND_URLS: Record<ReminderSound, string[]> = {
  default: [
    "https://assets.mixkit.co/active_storage/sfx/933/933-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3",
  ],
  gentle: [
    "https://assets.mixkit.co/active_storage/sfx/109/109-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/932/932-preview.mp3",
  ],
  chime: [
    "https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/1357/1357-preview.mp3",
  ],
  bell: [
    "https://assets.mixkit.co/active_storage/sfx/988/988-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/989/989-preview.mp3",
  ],
};

let isAudioInitialized = false;
let currentSound: Audio.Sound | null = null;

/**
 * Initialize audio mode for the app
 * Sets up audio to play even in silent mode on iOS
 */
export async function initializeAudio(): Promise<void> {
  if (isAudioInitialized) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      allowsRecordingIOS: false,
    });
    isAudioInitialized = true;
  } catch (error) {
    logger.error("Failed to initialize audio:", error);
  }
}

/**
 * Clean up any currently playing sound
 */
async function cleanupSound(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.unloadAsync();
    } catch (error) {
      // Ignore cleanup errors
    }
    currentSound = null;
  }
}

/**
 * Play haptic feedback pattern for a sound type
 * Used as fallback when audio fails or as accompaniment
 */
async function playHapticPattern(soundType: ReminderSound): Promise<void> {
  try {
    switch (soundType) {
      case "default":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "gentle":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await new Promise((resolve) => setTimeout(resolve, 150));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "chime":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "bell":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await new Promise((resolve) => setTimeout(resolve, 120));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await new Promise((resolve) => setTimeout(resolve, 120));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  } catch (error) {
    logger.error("Failed to play haptic:", error);
  }
}

/**
 * Try to play audio from a URL
 * Returns true if successful, false otherwise
 */
async function tryPlayAudio(uri: string): Promise<boolean> {
  try {
    await cleanupSound();

    const { sound, status } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 }
    );

    currentSound = sound;

    // Wait for playback to complete
    return new Promise((resolve) => {
      let resolved = false;

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!resolved && status.isLoaded && status.didJustFinish) {
          resolved = true;
          cleanupSound();
          resolve(true);
        }
      });

      // Timeout fallback in case status update doesn't fire
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanupSound();
          resolve(true);
        }
      }, 3000);
    });
  } catch (error) {
    logger.error("Failed to play audio:", error);
    await cleanupSound();
    return false;
  }
}

/**
 * Play a reminder sound based on the sound type
 * Will attempt to play audio, falling back to haptics if audio fails
 */
export async function playReminderSound(
  soundType: ReminderSound,
  withHaptics: boolean = true
): Promise<boolean> {
  try {
    // Initialize audio if not already done
    await initializeAudio();

    // Try to play audio from the list of URLs (with fallbacks)
    const audioUrls = SOUND_URLS[soundType];
    let audioPlayed = false;

    if (audioUrls && audioUrls.length > 0) {
      // Try each URL until one works
      for (const url of audioUrls) {
        audioPlayed = await tryPlayAudio(url);
        if (audioPlayed) {
          break;
        }
      }
    }

    // Always play haptics if requested (provides tactile feedback even if audio works)
    if (withHaptics) {
      await playHapticPattern(soundType);
    }

    return audioPlayed;
  } catch (error) {
    logger.error(`Failed to play ${soundType} sound:`, error);
    // Try haptics as final fallback
    if (withHaptics) {
      await playHapticPattern(soundType);
    }
    return false;
  }
}

/**
 * Test play a sound (used in settings)
 * Checks if app sounds are enabled before playing
 */
export async function testPlaySound(soundType: ReminderSound): Promise<boolean> {
  // Check if app sounds are enabled
  const soundSettings = useSettingsStore.getState().soundSettings;

  if (!soundSettings?.appSoundsEnabled) {
    // If app sounds are disabled, only play haptics if enabled
    if (soundSettings?.hapticFeedbackEnabled) {
      await playHapticPattern(soundType);
      return true;
    }
    return false;
  }

  // Play sound with haptics if enabled
  return await playReminderSound(soundType, soundSettings?.hapticFeedbackEnabled ?? true);
}

/**
 * Play notification preview sound based on type
 * This is the main function for testing sounds in settings
 * @param type - "medicationReminder" or "taskReminder"
 */
export async function playNotificationPreviewSound(
  type: "medicationReminder" | "taskReminder"
): Promise<boolean> {
  const soundSettings = useSettingsStore.getState().soundSettings;

  // If app sounds are disabled, return early (optionally with haptic)
  if (!soundSettings?.appSoundsEnabled) {
    if (soundSettings?.hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    return false;
  }

  // Get the appropriate sound type based on reminder type
  const soundType =
    type === "medicationReminder"
      ? soundSettings?.medicationReminderSound || "default"
      : soundSettings?.taskReminderSound || "default";

  return await playReminderSound(soundType, soundSettings?.hapticFeedbackEnabled ?? true);
}

/**
 * Get the sound name that would be used for a notification
 * This can be used when scheduling local notifications
 */
export function getNotificationSoundName(type: "medication" | "task"): string {
  // For local notifications, we use "default" to trigger the system sound
  // Custom sounds would require bundling audio files with the app
  return "default";
}
