/**
 * Game Results Components
 *
 * Reusable result screens for mind break games.
 * Includes celebration animations, stats display, and action buttons.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
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
} from "react-native-reanimated";

// =============================================================================
// CELEBRATION DOTS ANIMATION - Confetti-like effect for completion screens
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
          bottom: 100,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: iconColor,
        },
      ]}
    />
  );
}

export function CelebrationDots({ iconColor }: { iconColor: string }) {
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
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
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
// GAME RESULTS SCREEN - Basic version
// =============================================================================
interface GameResultsScreenProps {
  title: string;
  subtitle: string;
  stats?: { label: string; value: string }[];
  onDone: () => void;
  onPlayAgain?: () => void;
  onTryAgain?: () => void;
  showTryAgain?: boolean;
  colors: any;
  textClasses: any;
  primary: string;
  iconColor: string;
  isDark: boolean;
}

export function GameResultsScreen({
  title,
  subtitle,
  stats,
  onDone,
  onPlayAgain,
  onTryAgain,
  showTryAgain,
  colors,
  textClasses,
  primary,
  iconColor,
  isDark,
}: GameResultsScreenProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 400 });
    checkmarkScale.value = withDelay(200, withSpring(1, { damping: 10 }));

    // Haptic feedback for completion
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
      {/* Faded board background effect */}
      <View
        className="absolute inset-0 opacity-5"
        style={{ backgroundColor: iconColor }}
      />

      <Animated.View
        style={animatedContainerStyle}
        className="flex-1 items-center justify-center"
      >
        {/* Success Icon with glow */}
        <Animated.View
          style={[
            animatedCheckmarkStyle,
            {
              width: 120,
              height: 120,
              borderRadius: 60,
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
            className="w-24 h-24 rounded-full items-center justify-center"
            style={{ backgroundColor: iconColor + "30" }}
          >
            <Ionicons name="checkmark" size={56} color={iconColor} />
          </View>
        </Animated.View>

        {/* Title */}
        <Text
          className={`${textClasses.largeTitle} font-bold text-center mb-2`}
          style={{ color: colors.textPrimary }}
        >
          {title}
        </Text>

        {/* Subtitle */}
        <Text
          className={`${textClasses.body} text-center mb-8`}
          style={{ color: colors.textSecondary }}
        >
          {subtitle}
        </Text>

        {/* Stats */}
        {stats && stats.length > 0 && (
          <View
            className="w-full rounded-2xl p-5 mb-6"
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
                  index < stats.length - 1 ? "mb-3 pb-3 border-b" : ""
                }`}
                style={{ borderBottomColor: colors.divider }}
              >
                <Text className={textClasses.body} style={{ color: colors.textSecondary }}>
                  {stat.label}
                </Text>
                <Text
                  className={`${textClasses.title} font-bold`}
                  style={{ color: colors.textPrimary }}
                >
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View className="w-full">
          {showTryAgain && onTryAgain && (
            <Pressable
              onPress={onTryAgain}
              className="py-4 rounded-xl mb-3"
              style={{ backgroundColor: iconColor }}
            >
              <Text
                className={`${textClasses.body} font-bold text-center`}
                style={{ color: "#FFFFFF" }}
              >
                Try Again
              </Text>
            </Pressable>
          )}

          {onPlayAgain && !showTryAgain && (
            <Pressable
              onPress={onPlayAgain}
              className="py-4 rounded-xl mb-3"
              style={{ backgroundColor: iconColor }}
            >
              <Text
                className={`${textClasses.body} font-bold text-center`}
                style={{ color: "#FFFFFF" }}
              >
                Play Again
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={onDone}
            className="py-4 rounded-xl"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              className={`${textClasses.body} font-bold text-center`}
              style={{ color: colors.textPrimary }}
            >
              Done
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// ENHANCED GAME RESULTS - Full screen with Next Game option
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

export function EnhancedGameResults({
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
            <Ionicons
              name={showTryAgain ? "refresh" : "checkmark"}
              size={64}
              color={iconColor}
            />
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
          {showTryAgain && onTryAgain && (
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

          {onPlayAgain && !showTryAgain && (
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

export type { GameResultsScreenProps, EnhancedGameResultsProps };
