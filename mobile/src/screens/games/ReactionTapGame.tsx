import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  cancelAnimation,
} from "react-native-reanimated";

// Game icon color for reaction tap
const REACTION_TAP_COLOR = "#EF4444"; // Red

// =============================================================================
// INTERFACES
// =============================================================================
interface EnhancedGameProps {
  onComplete: (gameId: string, stats: { score: number; attempts: number }) => void;
  onClose: () => void;
  colors: any;
  textClasses: any;
  triggerHaptic: (type: string) => void;
  primary: string;
  isDark: boolean;
  onNextGame?: () => void;
  bestTime?: number | null;
  onNewBestTime?: (time: number) => void;
}

// =============================================================================
// GAME HEADER COMPONENT
// =============================================================================
function GameHeader({
  title,
  subtitle,
  onClose,
  colors,
  textClasses,
  iconColor,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  colors: any;
  textClasses: any;
  iconColor?: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ position: "relative" }}>
      {/* Subtle colored accent at top - extends into safe area */}
      {iconColor && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 80 + insets.top,
            backgroundColor: iconColor + "08",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}
        />
      )}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: "transparent",
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: colors.textPrimary,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: 14,
                marginTop: 2,
                color: colors.textSecondary,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <Pressable
          onPress={onClose}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.divider,
          }}
          accessibilityRole="button"
          accessibilityLabel="Close game"
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="close" size={28} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

// =============================================================================
// CELEBRATION DOT COMPONENT
// =============================================================================
function CelebrationDot({
  delay,
  translateX,
  iconColor,
}: {
  delay: number;
  translateX: number;
  iconColor: string;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const translateY = useSharedValue(0);
  const dotOpacity = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-120, { duration: 1500 }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
    dotOpacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 1300 })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX }],
    opacity: dotOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: "absolute",
          bottom: 0,
          left: screenWidth / 2 - 6,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: iconColor,
        },
      ]}
    />
  );
}

// =============================================================================
// CELEBRATION DOTS COMPONENT
// =============================================================================
function CelebrationDots({ iconColor }: { iconColor: string }) {
  const dots = [
    { delay: 0, translateX: -80 },
    { delay: 100, translateX: -50 },
    { delay: 200, translateX: -20 },
    { delay: 300, translateX: 10 },
    { delay: 400, translateX: 40 },
    { delay: 500, translateX: 70 },
    { delay: 600, translateX: 100 },
    { delay: 700, translateX: 130 },
  ];

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
      {dots.map((dot, i) => (
        <CelebrationDot
          key={i}
          delay={dot.delay}
          translateX={dot.translateX}
          iconColor={iconColor}
        />
      ))}
    </View>
  );
}

// =============================================================================
// ENHANCED GAME RESULTS COMPONENT
// =============================================================================
interface EnhancedGameResultsProps {
  title: string;
  subtitle: string;
  stats?: { label: string; value: string }[];
  onDone: () => void;
  onPlayAgain?: () => void;
  onTryAgain?: () => void;
  onNextGame?: () => void;
  showTryAgain?: boolean;
  colors: any;
  textClasses: any;
  primary: string;
  iconColor: string;
  isDark: boolean;
}

function EnhancedGameResults({
  title,
  subtitle,
  stats,
  onDone,
  onPlayAgain,
  onTryAgain,
  onNextGame,
  showTryAgain,
  colors,
  textClasses,
  primary,
  iconColor,
  isDark,
}: EnhancedGameResultsProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 400 });
    checkmarkScale.value = withDelay(200, withSpring(1, { damping: 10 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedCheckmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  return (
    <View className="flex-1 px-6" style={{ backgroundColor: colors.background }}>
      {/* Celebration dots animation - only show for success (not retry) */}
      {!showTryAgain && <CelebrationDots iconColor={iconColor} />}

      <Animated.View
        style={animatedContainerStyle}
        className="flex-1 items-center justify-center"
      >
        {/* Success Icon */}
        <Animated.View
          style={[
            animatedCheckmarkStyle,
            {
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: iconColor + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
              shadowColor: iconColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
            },
          ]}
        >
          <View
            className="w-28 h-28 rounded-full items-center justify-center"
            style={{ backgroundColor: iconColor + "30" }}
          >
            <Ionicons name={showTryAgain ? "refresh" : "checkmark"} size={64} color={iconColor} />
          </View>
        </Animated.View>

        {/* Title */}
        <Text
          className="text-3xl font-bold text-center mb-3"
          style={{ color: colors.textPrimary }}
        >
          {title}
        </Text>

        {/* Subtitle */}
        <Text
          className="text-lg text-center mb-8 px-4"
          style={{ color: colors.textSecondary, maxWidth: 320 }}
        >
          {subtitle}
        </Text>

        {/* Stats */}
        {stats && stats.length > 0 && (
          <View
            className="w-full rounded-2xl p-5 mb-8"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {stats.map((stat, index) => (
              <View
                key={index}
                className={`flex-row items-center justify-between ${
                  index < stats.length - 1 ? "mb-4 pb-4 border-b" : ""
                }`}
                style={{ borderBottomColor: colors.divider }}
              >
                <Text className="text-lg" style={{ color: colors.textSecondary }}>
                  {stat.label}
                </Text>
                <Text className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons - Large touch targets (56pt minimum) */}
        <View className="w-full">
          {/* Primary Action: Try Again or Play Again */}
          {(showTryAgain && onTryAgain) && (
            <Pressable
              onPress={onTryAgain}
              className="py-5 rounded-2xl mb-3"
              style={{
                backgroundColor: iconColor,
                minHeight: 56,
                shadowColor: iconColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
              accessibilityRole="button"
            >
              <Text className="text-lg font-bold text-center" style={{ color: "#FFFFFF" }}>
                Try Again
              </Text>
            </Pressable>
          )}

          {(onPlayAgain && !showTryAgain) && (
            <Pressable
              onPress={onPlayAgain}
              className="py-5 rounded-2xl mb-3"
              style={{
                backgroundColor: iconColor,
                minHeight: 56,
                shadowColor: iconColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
              accessibilityRole="button"
            >
              <Text className="text-lg font-bold text-center" style={{ color: "#FFFFFF" }}>
                Play Again
              </Text>
            </Pressable>
          )}

          {/* Next Game Button */}
          {onNextGame && (
            <Pressable
              onPress={onNextGame}
              className="py-5 rounded-2xl mb-3 flex-row items-center justify-center"
              style={{
                backgroundColor: colors.cardBackground,
                minHeight: 56,
                borderWidth: 2,
                borderColor: iconColor,
              }}
              accessibilityRole="button"
            >
              <Text className="text-lg font-bold" style={{ color: iconColor }}>
                Next Game
              </Text>
              <Ionicons name="arrow-forward" size={20} color={iconColor} style={{ marginLeft: 8 }} />
            </Pressable>
          )}

          {/* Done button */}
          <Pressable
            onPress={onDone}
            className="py-5 rounded-2xl"
            style={{
              backgroundColor: colors.cardBackground,
              minHeight: 56,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            accessibilityRole="button"
          >
            <Text className="text-lg font-bold text-center" style={{ color: colors.textPrimary }}>
              Done
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// REACTION TAP GAME COMPONENT
// =============================================================================
function ReactionTapGame({
  onComplete,
  onClose,
  colors,
  textClasses,
  triggerHaptic,
  primary,
  isDark,
  onNextGame,
  bestTime,
  onNewBestTime,
}: EnhancedGameProps) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Cap width for tablets, constrain circle by both width and available height
  const SCREEN_WIDTH = Math.min(screenW, 560);
  const GAME_SWITCHER_HEIGHT = 90; // GameSwitcherTabs at bottom of modal
  const availableHeight = screenH - insets.top - insets.bottom - 200 - GAME_SWITCHER_HEIGHT;
  const zoneSize = Math.min(SCREEN_WIDTH * 0.7, availableHeight * 0.7, 360);

  const [gameState, setGameState] = useState<"waiting" | "ready" | "tap" | "result" | "too-early">("waiting");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [tapStartTime, setTapStartTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [bestAttempt, setBestAttempt] = useState<number | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [times, setTimes] = useState<number[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pulseValue = useSharedValue(1);
  const zoneScale = useSharedValue(1);

  useEffect(() => {
    if (gameState === "ready") {
      // Gentle pulse animation while waiting
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseValue);
      pulseValue.value = 1;
    }
  }, [gameState]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const zoneStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoneScale.value }],
  }));

  const startRound = () => {
    setGameState("ready");
    setReactionTime(null);

    const delay = 1500 + Math.random() * 2500;
    timeoutRef.current = setTimeout(() => {
      setGameState("tap");
      setTapStartTime(Date.now());
    }, delay);
  };

  const handleTap = () => {
    triggerHaptic("light");
    zoneScale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );

    if (gameState === "waiting") {
      startRound();
      return;
    }

    if (gameState === "ready") {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGameState("too-early");
      return;
    }

    if (gameState === "tap" && tapStartTime) {
      const time = Date.now() - tapStartTime;
      setReactionTime(time);
      setGameState("result");
      setAttempts((prev) => prev + 1);
      setTimes((prev) => [...prev, time]);

      if (!bestAttempt || time < bestAttempt) {
        setBestAttempt(time);
      }
    }

    if (gameState === "too-early") {
      startRound();
    }

    if (gameState === "result") {
      if (attempts >= 2) {
        setGameCompleted(true);
        onComplete("reaction-tap", { score: bestAttempt || 0, attempts: 3 });
      } else {
        startRound();
      }
    }
  };

  if (gameCompleted) {
    const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

    const resetGame = () => {
      setGameState("waiting");
      setReactionTime(null);
      setTapStartTime(null);
      setAttempts(0);
      setBestAttempt(null);
      setGameCompleted(false);
      setTimes([]);
    };

    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <GameHeader
          title="Reaction Tap"
          onClose={onClose}
          colors={colors}
          textClasses={textClasses}
          iconColor={REACTION_TAP_COLOR}
        />
        <EnhancedGameResults
          title="Nice Reflexes!"
          subtitle="Your focus stayed steady throughout this round."
          stats={[
            { label: "Best time", value: `${bestAttempt}ms` },
            { label: "Average", value: `${avgTime}ms` },
          ]}
          onDone={onClose}
          onPlayAgain={resetGame}
          onNextGame={onNextGame}
          colors={colors}
          textClasses={textClasses}
          primary={primary}
          iconColor={REACTION_TAP_COLOR}
          isDark={isDark}
        />
      </SafeAreaView>
    );
  }

  const getZoneColor = () => {
    switch (gameState) {
      case "waiting":
        return colors.divider;
      case "ready":
        return colors.warning + "40";
      case "tap":
        return colors.success + "40";
      case "result":
        return REACTION_TAP_COLOR + "30";
      case "too-early":
        return colors.error + "40";
      default:
        return colors.divider;
    }
  };

  const getZoneBorderColor = () => {
    switch (gameState) {
      case "waiting":
        return colors.border;
      case "ready":
        return colors.warning;
      case "tap":
        return colors.success;
      case "result":
        return REACTION_TAP_COLOR;
      case "too-early":
        return colors.error;
      default:
        return colors.border;
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Subtle gradient accent at top */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 200,
          backgroundColor: REACTION_TAP_COLOR + "08",
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }}
      />
      <GameHeader
        title="Reaction Tap"
        subtitle="Notice and respond"
        onClose={onClose}
        colors={colors}
        textClasses={textClasses}
        iconColor={REACTION_TAP_COLOR}
      />

      <Pressable onPress={handleTap} className="flex-1 items-center justify-center px-6">
        {/* Central Interaction Zone */}
        <Animated.View
          style={[
            pulseStyle,
            zoneStyle,
            {
              width: zoneSize,
              height: zoneSize,
              borderRadius: zoneSize / 2,
              backgroundColor: getZoneColor(),
              borderWidth: 4,
              borderColor: getZoneBorderColor(),
              alignItems: "center",
              justifyContent: "center",
              // Enhanced shadow/glow effect based on state
              shadowColor: getZoneBorderColor(),
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: gameState === "tap" ? 0.6 : gameState === "ready" ? 0.3 : 0.15,
              shadowRadius: gameState === "tap" ? 30 : gameState === "ready" ? 20 : 10,
              elevation: gameState === "tap" ? 12 : 6,
            },
          ]}
        >
          {gameState === "waiting" && (
            <View className="items-center">
              <Ionicons name="flash" size={64} color={colors.warning} />
              <Text
                className={`${textClasses.title} text-center mt-4`}
                style={{ color: colors.textPrimary }}
              >
                Tap to Start
              </Text>
              <Text
                className={`${textClasses.body} text-center mt-2`}
                style={{ color: colors.textSecondary }}
              >
                Wait for green
              </Text>
            </View>
          )}

          {gameState === "ready" && (
            <View className="items-center">
              <Ionicons name="time" size={64} color={colors.warning} />
              <Text
                className={`${textClasses.title} text-center mt-4`}
                style={{ color: colors.warning }}
              >
                Wait...
              </Text>
            </View>
          )}

          {gameState === "tap" && (
            <View className="items-center">
              <Ionicons name="hand-left" size={80} color={colors.success} />
              <Text
                className={`${textClasses.largeTitle} font-bold text-center mt-4`}
                style={{ color: colors.success }}
              >
                TAP!
              </Text>
            </View>
          )}

          {gameState === "result" && reactionTime && (
            <View className="items-center">
              <Text
                className="text-5xl font-bold"
                style={{ color: REACTION_TAP_COLOR }}
              >
                {reactionTime}
              </Text>
              <Text
                className={`${textClasses.body} mt-1`}
                style={{ color: colors.textSecondary }}
              >
                milliseconds
              </Text>
              <Text
                className={`${textClasses.body} text-center mt-4`}
                style={{ color: colors.textSecondary }}
              >
                {reactionTime < 250 ? "Excellent!" : reactionTime < 350 ? "Good!" : "Keep trying!"}
              </Text>
              <Text
                className={`${textClasses.small} text-center mt-4`}
                style={{ color: colors.textTertiary }}
              >
                {attempts}/3 - Tap to continue
              </Text>
            </View>
          )}

          {gameState === "too-early" && (
            <View className="items-center">
              <Ionicons name="close-circle" size={64} color={colors.error} />
              <Text
                className={`${textClasses.title} text-center mt-4`}
                style={{ color: colors.error }}
              >
                Too Early!
              </Text>
              <Text
                className={`${textClasses.body} text-center mt-2`}
                style={{ color: colors.textSecondary }}
              >
                Tap to try again
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}

export default ReactionTapGame;
