import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, Pressable, Linking, Platform, StyleSheet } from "react-native";
import { Screen } from "../../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useTipStore } from "../../state/stores/tipStore";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../utils/useTheme";
import { logger } from "../../utils/logger";
import { isAndroidFeaturesActive } from "../../config/platformConfig";

export default function FindPhoneScreen() {
  const { colors, primary, isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);

  // Settings from useSettingsStore
  const textSize = useSettingsStore((s) => s.textSize);

  // Tip state from useTipStore
  const dismissedInfoCards = useTipStore((s) => s.dismissedInfoCards || []);
  const dismissInfoCard = useTipStore((s) => s.dismissInfoCard);

  const textClasses = getTextSizeClasses(textSize);

  // Use refs for sound and interval to avoid closure issues
  const soundRef = useRef<Audio.Sound | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Helper function for checking if card is dismissed
  const isCardDismissed = (cardId: string) => dismissedInfoCards.includes(cardId);

  // Stopped-confirmation message (auto-fades after 2 seconds)
  const [stopConfirmation, setStopConfirmation] = useState(false);
  const stopConfirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function - defined before useEffect
  const stopSound = useCallback(async () => {
    // Clear the auto-stop timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Clear haptic interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop and unload sound.
    // setStatusAsync({ shouldPlay: false }) immediately pauses playback regardless of buffer state,
    // which prevents the audio from continuing while stopAsync()/unloadAsync() resolve.
    if (soundRef.current) {
      try {
        await soundRef.current.setStatusAsync({ shouldPlay: false, positionMillis: 0 });
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (error) {
        // Ignore errors during cleanup - sound may already be unloaded
      }
      soundRef.current = null;
    }

    // Only update state if component is still mounted
    if (isMountedRef.current) {
      setIsPlaying(false);
      setStopConfirmation(true);
      if (stopConfirmationTimeoutRef.current) {
        clearTimeout(stopConfirmationTimeoutRef.current);
      }
      stopConfirmationTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setStopConfirmation(false);
        }
      }, 2000);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Run cleanup synchronously to prevent memory leaks
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (stopConfirmationTimeoutRef.current) {
        clearTimeout(stopConfirmationTimeoutRef.current);
      }
      if (soundRef.current) {
        soundRef.current.setStatusAsync({ shouldPlay: false }).catch(() => {});
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const playSound = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Prefer a bundled local sound file so playback isn't subject to streaming-buffer
      // delays that prevented stopAsync() from stopping audio reliably on some iOS
      // versions. If the local asset has not yet been added to the bundle, fall back
      // to the remote URL so the feature still works. Place a short alarm clip at
      // mobile/assets/sounds/alarm.mp3 and switch ALARM_LOCAL_SOURCE to require it.
      const ALARM_LOCAL_SOURCE: number | null = null;
      const ALERT_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
      const soundSource = ALARM_LOCAL_SOURCE != null ? ALARM_LOCAL_SOURCE : { uri: ALERT_SOUND_URL };

      const { sound: newSound } = await Audio.Sound.createAsync(
        soundSource,
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );

      soundRef.current = newSound;

      if (isMountedRef.current) {
        setIsPlaying(true);
        setStopConfirmation(false);
        if (stopConfirmationTimeoutRef.current) {
          clearTimeout(stopConfirmationTimeoutRef.current);
          stopConfirmationTimeoutRef.current = null;
        }
      }

      // Add haptic feedback every second
      intervalRef.current = setInterval(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 1000);

      // Auto-stop after 30 seconds
      timeoutRef.current = setTimeout(() => {
        stopSound();
      }, 30000);
    } catch (error) {
      logger.error("Error playing sound:", error);
      // Fallback to just haptics if sound fails
      if (isMountedRef.current) {
        setIsPlaying(true);
      }
      intervalRef.current = setInterval(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 500);

      timeoutRef.current = setTimeout(() => {
        stopSound();
      }, 30000);
    }
  }, [stopSound]);

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      stopSound();
    } else {
      playSound();
    }
  }, [isPlaying, playSound, stopSound]);

  const openFindMy = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isAndroidFeaturesActive()) {
      // Android: Open Google Find My Device app or web fallback
      const appUrl = "https://www.google.com/android/find";

      try {
        await Linking.openURL(appUrl);
      } catch (error) {
        logger.error("Error opening Find My Device:", error);
      }
      return;
    }

    // iOS: Open Apple Find My
    const findMyUrl = "findmy://";
    const fallbackUrl = "https://www.icloud.com/find";

    try {
      const canOpen = await Linking.canOpenURL(findMyUrl);
      if (canOpen) {
        await Linking.openURL(findMyUrl);
      } else {
        // Fallback to iCloud Find My website
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      logger.error("Error opening Find My:", error);
      await Linking.openURL(fallbackUrl);
    }
  }, []);

  return (
    <Screen variant="static" edges={["bottom"]}>
      <View className="flex-1 px-6" style={{ paddingTop: 20 }}>
        {/* Info Card - Explain how to find other devices */}
        {!isCardDismissed("find-device-info") && (
          <View
            style={[styles.infoCard, {
              backgroundColor: isDark ? "#1e3a5f" : "#e0f2fe",
              borderColor: isDark ? "#2563eb" : "#0ea5e9"
            }]}
          >
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={24} color={isDark ? "#60a5fa" : "#0284c7"} style={{ marginTop: 2 }} />
              <View className="flex-1 ml-3">
                <Text className={`${textClasses.body} font-semibold mb-1`} style={{ color: colors.textPrimary }}>
                  Looking for another device?
                </Text>
                <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary, lineHeight: 20 }}>
                  {isAndroidFeaturesActive()
                    ? "To locate your Android phone, tablet, or watch, use Google's Find My Device. Tap the button below to open it."
                    : "To make your iPhone or iPad ring remotely, use Apple's Find My app. Tap the button below to open it."}
                </Text>
              </View>
              <Pressable
                onPress={() => dismissInfoCard("find-device-info")}
                className="p-1 active:opacity-50 ml-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Open Find My Button */}
        <Pressable
          onPress={openFindMy}
          style={[styles.findMyCard, { backgroundColor: colors.cardBackground }]}
        >
          <View style={[styles.findMyIconContainer, { backgroundColor: "#34C759" + "20" }]}>
            <Ionicons name="locate" size={32} color="#34C759" />
          </View>
          <View style={styles.findMyTextContainer}>
            <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
              {isAndroidFeaturesActive() ? "Open Find My Device" : "Open Find My"}
            </Text>
            <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
              {isAndroidFeaturesActive() ? "Locate your Android devices" : "Locate iPhone, iPad, Mac, AirPods"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
        </Pressable>

        {/* Divider with "OR" */}
        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border || colors.textSecondary + "30" }]} />
          <Text className={`${textClasses.small} px-4`} style={{ color: colors.textSecondary }}>
            OR
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border || colors.textSecondary + "30" }]} />
        </View>

        {/* This Device Section */}
        <View style={[styles.thisDeviceCard, { backgroundColor: colors.cardBackground }]}>
          <Text className={`${textClasses.body} font-semibold text-center mb-2`} style={{ color: colors.textPrimary }}>
            Ring This Device
          </Text>
          <Text className={`${textClasses.small} text-center mb-6`} style={{ color: colors.textSecondary, lineHeight: 20 }}>
            Play a loud sound on the device {"you're"} holding. Useful if someone else is looking for it nearby.
          </Text>

          {/* Sound indicator */}
          <View
            style={[
              styles.soundIndicator,
              { backgroundColor: isPlaying ? "#FEE2E2" : isDark ? "#1f2937" : "#f3f4f6" }
            ]}
          >
            <Ionicons
              name={isPlaying ? "volume-high" : "phone-portrait-outline"}
              size={60}
              color={isPlaying ? "#dc2626" : colors.textSecondary}
            />
          </View>

          {isPlaying && (
            <Text className={`${textClasses.small} text-center mt-4 mb-2`} style={{ color: "#dc2626", fontWeight: "600" }}>
              Sound Playing...
            </Text>
          )}

          {/* Play/Stop Button */}
          <Pressable
            onPress={handleToggle}
            style={[
              styles.playButton,
              { backgroundColor: isPlaying ? "#6b7280" : "#dc2626" }
            ]}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Stop sound" : "Play loud sound"}
          >
            <Ionicons
              name={isPlaying ? "stop" : "volume-high"}
              size={24}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text className={`${textClasses.body} font-semibold`} style={{ color: "#FFFFFF" }}>
              {isPlaying ? "Stop Sound" : "Play Loud Sound"}
            </Text>
          </Pressable>

          {isPlaying && (
            <Text className={`${textClasses.small} text-center mt-3`} style={{ color: colors.textSecondary }}>
              Auto-stops in 30 seconds
            </Text>
          )}

          {!isPlaying && stopConfirmation && (
            <Text
              className={`${textClasses.small} text-center mt-3`}
              style={{ color: "#16a34a", fontWeight: "600" }}
              accessibilityLiveRegion="polite"
            >
              {"\u2713 Sound stopped"}
            </Text>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  findMyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  findMyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  findMyTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  thisDeviceCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  soundIndicator: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    minWidth: 200,
  },
});
