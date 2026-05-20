import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Screen } from "../../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTheme } from "../../utils/useTheme";
import { ScreenErrorBoundary } from "../../components/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";

// Bright, vibrant colors for ON state - high contrast
const ON_STATE_COLORS = {
  background: "#FEF9C3", // Warm yellow background
  button: "#FBBF24", // Bright amber/gold
  buttonInner: "#FCD34D", // Slightly lighter inner
  icon: "#FFFFFF", // White icon for contrast
  text: "#92400E", // Dark amber - HIGH CONTRAST
  subtext: "#B45309", // Readable dark amber
  glow: "#FBBF24",
  tipBg: "#FEF3C7",
  tipIcon: "#B45309",
};

export default function FlashlightScreen() {
  const { colors, primary, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const textClasses = getTextSizeClasses(textSize);

  // Animation values
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [hapticEnabled]);

  // Pulse animation when flashlight is on
  useEffect(() => {
    if (flashlightOn) {
      // Subtle pulse animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      // Glow effect
      glowOpacity.value = withTiming(1, { duration: 300 });
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withSpring(1);
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [flashlightOn]);

  useEffect(() => {
    return () => {
      // Cleanup: turn off flashlight when leaving screen
      setFlashlightOn(false);
    };
  }, []);

  const pulseAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleToggle = () => {
    triggerHaptic();
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    setFlashlightOn(!flashlightOn);
  };

  if (!permission) {
    return (
      <ScreenErrorBoundary screenName="FlashlightScreen">
        <Screen variant="static" edges={["bottom"]}>
          <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.background }}>
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: colors.warning + "20" }}
            >
              <Ionicons name="flashlight-outline" size={48} color={colors.warning} />
            </View>
            <Text className={`${textClasses.body} text-center`} style={{ color: colors.textPrimary }}>
              Loading...
            </Text>
          </View>
        </Screen>
      </ScreenErrorBoundary>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenErrorBoundary screenName="FlashlightScreen">
        <Screen variant="static" edges={["bottom"]}>
          <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.background }}>
            <View
              className="w-28 h-28 rounded-3xl items-center justify-center mb-8"
              style={{ backgroundColor: colors.warning + "15" }}
            >
              <Ionicons name="flashlight-outline" size={56} color={colors.warning} />
            </View>
            <Text className={`${textClasses.title} text-center mb-3`} style={{ color: colors.textPrimary }}>
              Camera Access Needed
            </Text>
            <Text className={`${textClasses.body} text-center mb-10`} style={{ color: colors.textSecondary }}>
              The flashlight needs camera access to control the flash.
            </Text>
            <Pressable
              onPress={() => {
                triggerHaptic();
                requestPermission();
              }}
              style={{
                backgroundColor: colors.warning,
                shadowColor: colors.warning,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              }}
              className="px-10 py-4 rounded-2xl active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="Allow camera access"
            >
              <Text className={`${textClasses.body} font-bold`} style={{ color: "#FFFFFF" }}>
                Allow Camera Access
              </Text>
            </Pressable>
          </View>
        </Screen>
      </ScreenErrorBoundary>
    );
  }

  return (
    <ScreenErrorBoundary screenName="FlashlightScreen">
      <Screen variant="static" edges={["bottom"]}>
        {/* Hidden camera for flash control */}
        <View style={{ width: 1, height: 1, overflow: "hidden", position: "absolute", opacity: 0 }}>
          <CameraView
            style={{ width: 1, height: 1 }}
            facing="back"
            enableTorch={flashlightOn}
          />
        </View>

        {/* Main content - normal background */}
        <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 }}>
          {/*
             FIX: Yellow container now has borderRadius on ALL corners
             and horizontal margins so it appears as a floating card
          */}
          <View
            style={{
              flex: 1,
              marginTop: 8,
              marginBottom: 8,
              backgroundColor: flashlightOn ? ON_STATE_COLORS.background : colors.cardBackground,
              borderRadius: 32, // ALL corners rounded (was only bottom before)
              overflow: "hidden",
              // Subtle shadow for depth
              shadowColor: flashlightOn ? ON_STATE_COLORS.glow : "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: flashlightOn ? 0.3 : 0.08,
              shadowRadius: flashlightOn ? 16 : 8,
              elevation: flashlightOn ? 8 : 2,
            }}
          >
            {/* Inner padding container */}
            <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
              {/* Main Content Area */}
              <View className="flex-1 justify-center items-center">
                {/* Large Interactive Button */}
                <Pressable
                  onPress={handleToggle}
                  style={({ pressed }) => [
                    styles.flashlightButton,
                    {
                      // Make outer container transparent when ON to avoid rectangle
                      backgroundColor: flashlightOn ? "transparent" : colors.cardBackground,
                      borderColor: flashlightOn ? "transparent" : colors.border || colors.textSecondary + "30",
                      borderWidth: flashlightOn ? 0 : 2,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                      // No shadow on container when ON
                      shadowColor: flashlightOn ? "transparent" : "#000",
                      shadowOpacity: flashlightOn ? 0 : 0.1,
                      shadowRadius: flashlightOn ? 0 : 12,
                    },
                  ]}
                  accessibilityLabel={flashlightOn ? "Turn off flashlight" : "Turn on flashlight"}
                  accessibilityRole="button"
                >
                  {/* FIX: Glow ring now circular and reduced size to fit container */}
                  {flashlightOn && (
                    <Animated.View
                      style={[
                        glowAnimStyle,
                        {
                          position: "absolute",
                          width: 160,
                          height: 160,
                          borderRadius: 80,
                          backgroundColor: ON_STATE_COLORS.glow + "30",
                        },
                      ]}
                    />
                  )}

                  <Animated.View style={[styles.iconContainer, pulseAnimStyle]}>
                    {/* Outer ring - now shows amber when ON with glow */}
                    <View
                      style={[
                        styles.iconOuterRing,
                        {
                          backgroundColor: flashlightOn
                            ? ON_STATE_COLORS.button
                            : colors.warning + "15",
                          // Add shadow/glow when ON
                          shadowColor: flashlightOn ? ON_STATE_COLORS.glow : "transparent",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: flashlightOn ? 0.5 : 0,
                          shadowRadius: flashlightOn ? 20 : 0,
                          elevation: flashlightOn ? 8 : 0,
                        },
                      ]}
                    >
                      {/* Inner circle - lighter amber inner when ON */}
                      <View
                        style={[
                          styles.iconInnerCircle,
                          {
                            backgroundColor: flashlightOn
                              ? ON_STATE_COLORS.buttonInner
                              : colors.warning + "25",
                          },
                        ]}
                      >
                        <Ionicons
                          name="flashlight"
                          size={48}
                          color={flashlightOn ? ON_STATE_COLORS.icon : colors.warning}
                        />
                      </View>
                    </View>
                  </Animated.View>

                  {/* Status Text */}
                  <Text
                    className={`${textClasses.largeTitle} mt-6`}
                    style={[
                      styles.statusText,
                      { color: flashlightOn ? ON_STATE_COLORS.text : colors.textPrimary },
                    ]}
                  >
                    {flashlightOn ? "ON" : "OFF"}
                  </Text>

                  {/* Instruction Text */}
                  <Text
                    className={`${textClasses.body} mt-2`}
                    style={{
                      color: flashlightOn ? ON_STATE_COLORS.subtext : colors.textSecondary,
                      textAlign: "center",
                      width: "100%",
                    }}
                  >
                    Tap anywhere to {flashlightOn ? "turn off" : "turn on"}
                  </Text>
                </Pressable>
              </View>

              {/* Tip Card at Bottom */}
              <View
                style={[
                  styles.tipCard,
                  {
                    backgroundColor: flashlightOn
                      ? "rgba(255, 255, 255, 0.7)"
                      : colors.background,
                  },
                ]}
              >
                <View
                  style={[
                    styles.tipIconContainer,
                    { backgroundColor: flashlightOn ? ON_STATE_COLORS.button + "30" : primary + "15" },
                  ]}
                >
                  <Ionicons
                    name="bulb-outline"
                    size={22}
                    color={flashlightOn ? ON_STATE_COLORS.tipIcon : primary}
                  />
                </View>
                <View style={styles.tipTextContainer}>
                  <Text
                    className={textClasses.small}
                    style={{
                      color: flashlightOn ? ON_STATE_COLORS.text : colors.textSecondary,
                      lineHeight: 20,
                    }}
                  >
                    Add Flashlight to your home screen widgets for even faster access
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Screen>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flashlightButton: {
    width: "100%",
    maxWidth: 340,
    aspectRatio: 0.85,
    borderRadius: 32,
    borderWidth: 2,
    // CRITICAL: Use flexbox centering only - no absolute positioning
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  iconContainer: {
    // Center content using flexbox only
    alignItems: "center",
    justifyContent: "center",
  },
  iconOuterRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  iconInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontWeight: "700",
    textAlign: "center",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tipTextContainer: {
    flex: 1,
  },
});
