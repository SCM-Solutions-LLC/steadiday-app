import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, Pressable, Image, Platform, StyleSheet } from "react-native";
import { Screen } from "../../components/Screen";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useTheme } from "../../utils/useTheme";
import { ScreenErrorBoundary, InlineTip } from "../../components/ui";
import { TIP_IDS } from "../../state/stores/tipStore";
import { logger } from "../../utils/logger";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export default function MagnifierScreen() {
  const { colors, primary, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState(0);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [frozenImage, setFrozenImage] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const cameraRef = useRef<CameraView>(null);
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const textClasses = getTextSizeClasses(textSize);

  const [focusIndicator, setFocusIndicator] = useState<{ x: number; y: number } | null>(null);

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  // Animation values for button press
  const freezeScale = useSharedValue(1);
  const flashScale = useSharedValue(1);
  const instructionOpacity = useSharedValue(1);
  const focusOpacity = useSharedValue(0);

  // Auto-hide instructions after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      instructionOpacity.value = withTiming(0, { duration: 300 });
      setTimeout(() => setShowInstructions(false), 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const dismissInstructions = useCallback(() => {
    instructionOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => setShowInstructions(false), 200);
  }, []);

  const instructionAnimStyle = useAnimatedStyle(() => ({
    opacity: instructionOpacity.value,
  }));

  const freezeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: freezeScale.value }],
  }));

  const flashButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flashScale.value }],
  }));

  const focusIndicatorStyle = useAnimatedStyle(() => ({
    opacity: focusOpacity.value,
  }));

  const handleTapToFocus = useCallback((event: any) => {
    if (frozen) return;
    const { locationX, locationY } = event.nativeEvent;
    setFocusIndicator({ x: locationX, y: locationY });
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    focusOpacity.value = 1;
    focusOpacity.value = withTiming(0, { duration: 600 });
  }, [frozen, hapticEnabled, focusOpacity]);

  if (!permission) {
    return (
      <ScreenErrorBoundary screenName="MagnifierScreen">
        <Screen variant="static" edges={["bottom"]}>
          <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "#000000" }}>
            <View className="w-20 h-20 rounded-full items-center justify-center mb-6" style={{ backgroundColor: primary + "30" }}>
              <Ionicons name="camera" size={40} color={primary} />
            </View>
            <Text className={`${textClasses.title} text-center mb-2`} style={{ color: "#FFFFFF" }}>
              Loading Camera
            </Text>
            <Text className={`${textClasses.body} text-center`} style={{ color: "rgba(255,255,255,0.6)" }}>
              Please wait...
            </Text>
          </View>
        </Screen>
      </ScreenErrorBoundary>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenErrorBoundary screenName="MagnifierScreen">
        <Screen variant="static" edges={["bottom"]}>
          <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.background }}>
            <View
              className="w-28 h-28 rounded-3xl items-center justify-center mb-8"
              style={{ backgroundColor: primary + "15" }}
            >
              <Ionicons name="camera-outline" size={56} color={primary} />
            </View>
            <Text className={`${textClasses.title} text-center mb-3`} style={{ color: colors.textPrimary }}>
              Camera Access Needed
            </Text>
            <Text className={`${textClasses.body} text-center mb-3`} style={{ color: colors.textSecondary }}>
              The magnifier needs access to your camera to help you read small text.
            </Text>
            <Text className={`${textClasses.small} text-center mb-10`} style={{ color: colors.textTertiary }}>
              We use the camera only when you open the Magnifier.
            </Text>
            <Pressable
              onPress={() => {
                triggerHaptic();
                requestPermission();
              }}
              className="px-10 py-4 rounded-2xl"
              style={{
                backgroundColor: primary,
                shadowColor: primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              }}
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

  const handleFreeze = async () => {
    triggerHaptic();
    freezeScale.value = withSpring(0.9, { damping: 15 });
    setTimeout(() => {
      freezeScale.value = withSpring(1, { damping: 15 });
    }, 100);

    if (frozen) {
      setFrozen(false);
      setFrozenImage(null);
    } else {
      try {
        if (cameraRef.current) {
          const photo = await cameraRef.current.takePictureAsync();
          if (photo) {
            setFrozenImage(photo.uri);
            setFrozen(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      } catch (error) {
        logger.error("Error taking picture:", error);
      }
    }
  };

  const handleFlashToggle = () => {
    triggerHaptic();
    flashScale.value = withSpring(0.9, { damping: 15 });
    setTimeout(() => {
      flashScale.value = withSpring(1, { damping: 15 });
    }, 100);
    setFlashEnabled(!flashEnabled);
  };

  const decreaseZoom = () => {
    triggerHaptic();
    setZoom(Math.max(0, zoom - 0.1));
  };

  const increaseZoom = () => {
    triggerHaptic();
    setZoom(Math.min(1, zoom + 0.1));
  };

  // Control panel background color based on theme
  const controlPanelBg = isDark ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)";
  const actionIconBg = isDark ? "#374151" : "#F3F4F6";

  return (
    <ScreenErrorBoundary screenName="MagnifierScreen">
      <View className="flex-1" style={{ backgroundColor: "#000000" }}>
        {/* Full-height Camera View with tap-to-focus */}
        {!frozen && (
          <Pressable
            onPress={handleTapToFocus}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            accessibilityLabel="Camera preview. Tap to refocus."
            accessibilityRole="button"
          >
            <CameraView
              ref={cameraRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              facing="back"
              zoom={zoom}
              enableTorch={flashEnabled}
              autofocus="on"
            />
            {focusIndicator && (
              <Animated.View
                style={[
                  focusIndicatorStyle,
                  {
                    position: "absolute",
                    left: focusIndicator.x - 30,
                    top: focusIndicator.y - 30,
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                  },
                ]}
              />
            )}
          </Pressable>
        )}

        {/* Frozen Image - Full screen */}
        {frozen && frozenImage && (
          <Image
            source={{ uri: frozenImage }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            resizeMode="cover"
          />
        )}

        {/* Top Instruction Banner - Dismissible, auto-hides after 5 seconds */}
        {showInstructions && (
          <Pressable
            onPress={dismissInstructions}
            style={{
              position: "absolute",
              top: insets.top + 8,
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <Animated.View
              style={[
                instructionAnimStyle,
                {
                  backgroundColor: "rgba(0,0,0,0.6)",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  flexDirection: "row",
                  alignItems: "center",
                },
              ]}
            >
              <Text className={`${textClasses.small} text-center font-medium`} style={{ color: "#FFFFFF" }}>
                {frozen ? "Image frozen - Tap Resume" : "Point at text \u2022 Slide to zoom"}
              </Text>
              <Ionicons name="close" size={16} color="#FFFFFF" style={{ marginLeft: 8, opacity: 0.7 }} />
            </Animated.View>
          </Pressable>
        )}

        {/* Compact Control Panel - Light/Semi-transparent */}
        <View
          style={[
            styles.controlPanel,
            {
              backgroundColor: controlPanelBg,
              paddingBottom: Platform.OS === "ios" ? Math.max(insets.bottom, 4) : 8,
            },
          ]}
        >
          {/* Tap-to-focus tip */}
          <View style={{ paddingHorizontal: 4, marginBottom: 4 }}>
            <InlineTip tipId={TIP_IDS.MAGNIFIER_TAP_FOCUS} />
          </View>

          {/* Compact Zoom Control Row */}
          <View style={styles.zoomRow}>
            <Pressable
              onPress={decreaseZoom}
              disabled={frozen}
              style={styles.zoomButton}
              accessibilityLabel="Decrease zoom"
            >
              <Ionicons
                name="remove-circle-outline"
                size={32}
                color={frozen ? colors.textSecondary + "40" : colors.textPrimary}
              />
            </Pressable>

            <View style={styles.zoomSliderContainer}>
              <Slider
                style={{ flex: 1, height: 40 }}
                minimumValue={0}
                maximumValue={1}
                value={zoom}
                onValueChange={setZoom}
                minimumTrackTintColor={primary}
                maximumTrackTintColor={colors.border || colors.textSecondary + "30"}
                thumbTintColor={primary}
                disabled={frozen}
                accessibilityLabel="Zoom slider"
              />
              <Text
                style={[styles.zoomText, { color: colors.textPrimary }]}
                className={textClasses.body}
              >
                {Math.round(zoom * 100)}%
              </Text>
            </View>

            <Pressable
              onPress={increaseZoom}
              disabled={frozen}
              style={styles.zoomButton}
              accessibilityLabel="Increase zoom"
            >
              <Ionicons
                name="add-circle-outline"
                size={32}
                color={frozen ? colors.textSecondary + "40" : colors.textPrimary}
              />
            </Pressable>
          </View>

          {/* Action Buttons Row - Only Light and Freeze (Focus removed - auto-focus is automatic) */}
          <View style={styles.actionButtonsRow}>
            {/* Light Button */}
            <Pressable
              onPress={handleFlashToggle}
              disabled={frozen}
              style={[
                styles.actionButton,
                flashEnabled && !frozen && { backgroundColor: primary + "15" },
              ]}
              accessibilityLabel={flashEnabled ? "Turn off light" : "Turn on light"}
              accessibilityRole="button"
            >
              <Animated.View
                style={[
                  flashButtonStyle,
                  styles.actionIconContainer,
                  {
                    backgroundColor: frozen
                      ? actionIconBg + "60"
                      : flashEnabled
                      ? "#F59E0B"
                      : actionIconBg,
                  },
                ]}
              >
                <Ionicons
                  name="flashlight"
                  size={28}
                  color={frozen ? colors.textSecondary + "60" : flashEnabled ? "#FFFFFF" : colors.textSecondary}
                />
              </Animated.View>
              <Text
                className={textClasses.body}
                style={[
                  styles.actionLabel,
                  {
                    color: frozen
                      ? colors.textSecondary + "60"
                      : flashEnabled
                      ? primary
                      : colors.textSecondary,
                  },
                ]}
              >
                Light {flashEnabled && !frozen ? "ON" : "OFF"}
              </Text>
            </Pressable>

            {/* Freeze/Resume Button - Primary Action */}
            <Pressable
              onPress={handleFreeze}
              style={[
                styles.actionButton,
                frozen && { backgroundColor: colors.success + "15" },
              ]}
              accessibilityLabel={frozen ? "Resume camera" : "Freeze image"}
              accessibilityRole="button"
            >
              <Animated.View
                style={[
                  freezeButtonStyle,
                  styles.actionIconContainer,
                  styles.primaryActionIcon,
                  {
                    backgroundColor: frozen ? colors.success : primary,
                    shadowColor: frozen ? colors.success : primary,
                  },
                ]}
              >
                <Ionicons
                  name={frozen ? "play" : "pause"}
                  size={32}
                  color="#FFFFFF"
                />
              </Animated.View>
              <Text
                className={`${textClasses.body} font-semibold`}
                style={[
                  styles.actionLabel,
                  { color: frozen ? colors.success : primary },
                ]}
              >
                {frozen ? "Resume" : "Freeze"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  controlPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  zoomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  zoomButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomSliderContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 4,
  },
  zoomText: {
    fontWeight: "600",
    minWidth: 45,
    textAlign: "right",
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 0,
    paddingHorizontal: 16,
  },
  actionButton: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 20,
    minWidth: 100,
    minHeight: 70,
    borderRadius: 16,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  primaryActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
