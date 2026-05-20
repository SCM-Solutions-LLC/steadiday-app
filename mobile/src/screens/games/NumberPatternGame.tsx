import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native-reanimated";

// Number of rounds in the game
const NUMBER_ROUNDS = 3;

// Game icon color for Number Pattern
const GAME_ICON_COLOR = "#10B981"; // Emerald

// Difficulty label per round
const NUMBER_DIFFICULTY = ["Easy", "Medium", "Hard"] as const;
interface EnhancedGameProps {
  onComplete: (gameId: string, stats: { score: number; attempts: number }) => void;
  onClose: () => void;
  colors: any;
  textClasses: any;
  triggerHaptic: (type: string) => void;
  primary: string;
  isDark: boolean;
  onNextGame?: () => void;
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
// ANSWER TILE COMPONENT - SENIOR-FRIENDLY: Enlarged (minimum 72pt touch target)
// =============================================================================
function AnswerTile({
  answer,
  isSelected,
  isCorrect,
  isWrong,
  onPress,
  disabled,
  colors,
  size,
}: {
  answer: number;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  onPress: () => void;
  disabled: boolean;
  colors: any;
  size: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95, { damping: 15 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      className="m-3"
      accessibilityLabel={`Choose ${answer}`}
      accessibilityRole="button"
    >
      <Animated.View
        className="rounded-3xl items-center justify-center"
        style={[
          animatedStyle,
          {
            width: size,
            height: size,
            minWidth: 120, // SENIOR-FRIENDLY: Increased from 100
            minHeight: 120, // SENIOR-FRIENDLY: Increased from 100
            backgroundColor: isCorrect
              ? colors.success + "20"
              : isWrong
              ? colors.error + "20"
              : colors.cardBackground,
            borderWidth: 3,
            borderColor: isCorrect
              ? colors.success
              : isWrong
              ? colors.error
              : colors.border,
          },
        ]}
      >
        <Text
          className="font-bold"
          style={{
            fontSize: 40, // SENIOR-FRIENDLY: Explicit large font
            color: isCorrect
              ? colors.success
              : isWrong
              ? colors.error
              : colors.textPrimary,
          }}
        >
          {answer}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// NUMBER PATTERN GAME - MAIN COMPONENT
// =============================================================================
function NumberPatternGame({ onComplete, onClose, colors, textClasses, triggerHaptic, primary, isDark, onNextGame }: EnhancedGameProps) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const SCREEN_WIDTH = Math.min(screenW, 560);
  const insets = useSafeAreaInsets();
  const [gameKey, setGameKey] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [missingIndex, setMissingIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gotItRight, setGotItRight] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const generatePuzzle = useCallback(() => {
    // Date-based seeded random for daily variety
    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
    let s = daySeed + currentRound * 7919 + correctAnswers * 31;
    const seededRandom = () => {
      s = (s * 1664525 + 1013904223) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    const seededInt = (min: number, max: number) => Math.floor(seededRandom() * (max - min)) + min;
    const seededPick = <T,>(arr: T[]): T => arr[Math.floor(seededRandom() * arr.length)];

    // Difficulty scales with round:
    // Round 1: simple increments (2, 3, 5) — easy to spot
    // Round 2: larger increments (7, 9, 11) and higher start values
    // Round 3: non-linear step patterns (x2, alternating steps, skip-counting)
    let seq: number[];
    let increment: number;

    if (currentRound === 1) {
      increment = seededPick([2, 3, 5]);
      const start = seededInt(1, 11);
      seq = [start, start + increment, start + increment * 2, start + increment * 3, start + increment * 4];
    } else if (currentRound === 2) {
      increment = seededPick([7, 9, 11, 6, 8]);
      const start = seededInt(5, 25);
      seq = [start, start + increment, start + increment * 2, start + increment * 3, start + increment * 4];
    } else {
      // Round 3: harder — double the increment or alternating steps
      const patternType = seededInt(0, 3);
      const start = seededInt(2, 7);
      if (patternType === 0) {
        // Multiply by 2 each step
        seq = [start, start * 2, start * 4, start * 8, start * 16];
        increment = start;
      } else if (patternType === 1) {
        // Alternating increments: +3, +7, +3, +7
        seq = [start, start + 3, start + 10, start + 13, start + 20];
        increment = 3;
      } else {
        // Large prime-like increments: 13, 17, 19
        increment = seededPick([13, 17, 19]);
        const sp = seededInt(1, 11);
        seq = [sp, sp + increment, sp + increment * 2, sp + increment * 3, sp + increment * 4];
      }
    }

    const missing = seededInt(1, 5);
    setSequence(seq);
    setMissingIndex(missing);

    const correctAnswer = seq[missing];
    const diff = Math.abs(seq[1] - seq[0]);
    const wrongAnswers = [
      correctAnswer - diff,
      correctAnswer + diff,
      correctAnswer + 1,
      correctAnswer - 1,
    ].filter((n) => n !== correctAnswer && n > 0);
    // Use seeded shuffle for answer order
    s = daySeed + currentRound * 113 + correctAnswers * 57;
    setAnswers([correctAnswer, ...wrongAnswers.slice(0, 3)].sort(() => seededRandom() - 0.5));
  }, [currentRound, correctAnswers]);

  useEffect(() => {
    generatePuzzle();
  }, [gameKey]);

  const startNextRound = () => {
    setSelectedAnswer(null);
    setRoundCompleted(false);
    setGotItRight(false);
    setCurrentRound((r) => r + 1);
    setGameKey((k) => k + 1);
  };

  const resetGame = () => {
    setSelectedAnswer(null);
    setRoundCompleted(false);
    setGameCompleted(false);
    setGotItRight(false);
    setCurrentRound(1);
    setCorrectAnswers(0);
    setGameKey((k) => k + 1);
  };

  const retryGame = () => {
    setSelectedAnswer(null);
    setRoundCompleted(false);
    setGotItRight(false);
    setGameKey((k) => k + 1);
  };

  const handleAnswer = (answer: number) => {
    triggerHaptic("light");
    setSelectedAnswer(answer);

    if (answer === sequence[missingIndex]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setGotItRight(true);
      setCorrectAnswers((prev) => prev + 1);
      setTimeout(() => {
        if (currentRound >= NUMBER_ROUNDS) {
          setGameCompleted(true);
          onComplete("number-pattern", { score: correctAnswers + 1, attempts: currentRound });
        } else {
          setRoundCompleted(true);
        }
      }, 800);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => {
        // Wrong answer - let them retry this round
        setRoundCompleted(true);
      }, 1000);
    }
  };

  const isCorrect = selectedAnswer === sequence[missingIndex];
  const isWrong = selectedAnswer !== null && !isCorrect;

  // Round complete screen (between rounds)
  if (roundCompleted && !gameCompleted) {
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
            backgroundColor: GAME_ICON_COLOR + "08",
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
          }}
        />
        <GameHeader title="Number Flow" onClose={onClose} colors={colors} textClasses={textClasses} iconColor={GAME_ICON_COLOR} />
        <View className="flex-1 items-center justify-center px-6">
          {gotItRight ? (
            <>
              <Text style={{ fontSize: 60 }}>🎉</Text>
              <Text className="text-2xl font-bold text-center mt-4" style={{ color: colors.textPrimary }}>
                Round {currentRound} Complete!
              </Text>
              <Text className="text-lg text-center mt-2 mb-6" style={{ color: colors.textSecondary }}>
                {NUMBER_ROUNDS - currentRound} round{NUMBER_ROUNDS - currentRound > 1 ? "s" : ""} remaining
              </Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 60 }}>🤔</Text>
              <Text className="text-2xl font-bold text-center mt-4" style={{ color: colors.textPrimary }}>
                Not quite!
              </Text>
              <Text className="text-lg text-center mt-2 mb-6" style={{ color: colors.textSecondary }}>
                The correct answer was {sequence[missingIndex]}. Try a new pattern!
              </Text>
            </>
          )}

          {/* Round indicator */}
          <View className="flex-row mb-8">
            {Array.from({ length: NUMBER_ROUNDS }).map((_, i) => (
              <View
                key={i}
                className="w-10 h-10 rounded-full mx-2 items-center justify-center"
                style={{
                  backgroundColor: i < currentRound && gotItRight ? colors.success : i < currentRound - 1 ? colors.success : colors.divider,
                }}
              >
                {i < currentRound - 1 || (i === currentRound - 1 && gotItRight) ? (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                ) : (
                  <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>{i + 1}</Text>
                )}
              </View>
            ))}
          </View>

          <Pressable
            onPress={gotItRight ? startNextRound : retryGame}
            className="py-4 px-8 rounded-2xl"
            style={{
              backgroundColor: GAME_ICON_COLOR,
              shadowColor: GAME_ICON_COLOR,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-lg font-bold" style={{ color: "#FFFFFF" }}>
              {gotItRight ? "Next Round" : "Try Again"}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} className="mt-4 py-3">
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              Quit Game
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Game complete screen
  if (gameCompleted) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <GameHeader title="Number Flow" onClose={onClose} colors={colors} textClasses={textClasses} iconColor={GAME_ICON_COLOR} />
        <EnhancedGameResults
          title="All Rounds Complete!"
          subtitle="Excellent pattern recognition! Your logical thinking is on point."
          stats={[
            { label: "Rounds", value: `${NUMBER_ROUNDS}/${NUMBER_ROUNDS}` },
            { label: "Correct answers", value: `${correctAnswers}` },
          ]}
          onDone={onClose}
          onPlayAgain={resetGame}
          onNextGame={onNextGame}
          colors={colors}
          textClasses={textClasses}
          primary={primary}
          iconColor={GAME_ICON_COLOR}
          isDark={isDark}
        />
      </SafeAreaView>
    );
  }

  // Calculate sizes to fit on screen - constrained by BOTH width and height
  const sequenceBoxSize = Math.min((SCREEN_WIDTH - 48) / 5, 72);
  // Height budget: screen - safeArea - header(~90) - roundIndicators(40) - instructions(40) - sequence(~90) - divider(20) - label(40) - padding(40)
  const headerHeight = insets.top + 80;
  const GAME_SWITCHER_HEIGHT = 90; // GameSwitcherTabs at bottom of modal
  const fixedContentHeight = 40 + 40 + sequenceBoxSize + 20 + 20 + 40 + 24;
  const availableAnswerHeight = screenH - headerHeight - fixedContentHeight - insets.bottom - GAME_SWITCHER_HEIGHT;
  const answerButtonSizeByHeight = Math.floor((availableAnswerHeight - 16) / 2);
  const answerButtonSizeByWidth = Math.min(Math.floor((SCREEN_WIDTH - 80) / 2), 150);
  const answerButtonSize = Math.min(answerButtonSizeByWidth, answerButtonSizeByHeight, 150);

  // Get font size multiplier based on text size setting
  const getAnswerFontSize = () => {
    if (textClasses.body === "text-xl") return 48; // extra-large
    if (textClasses.body === "text-lg") return 44; // large
    return 40; // normal
  };
  const answerFontSize = getAnswerFontSize();

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
          backgroundColor: GAME_ICON_COLOR + "08",
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }}
      />
      <GameHeader
        title="Number Flow"
        subtitle={`Round ${currentRound} of ${NUMBER_ROUNDS} · ${NUMBER_DIFFICULTY[currentRound - 1]}`}
        onClose={onClose}
        colors={colors}
        textClasses={textClasses}
        iconColor={GAME_ICON_COLOR}
      />

      {/* Game Area - NO ScrollView */}
      <View className="flex-1 px-4 py-3">
        {/* Round indicator */}
        <View className="flex-row justify-center mb-3">
          {Array.from({ length: NUMBER_ROUNDS }).map((_, i) => (
            <View
              key={i}
              className="w-8 h-8 rounded-full mx-1 items-center justify-center"
              style={{
                backgroundColor: i < currentRound - 1
                  ? colors.success
                  : i === currentRound - 1
                  ? GAME_ICON_COLOR
                  : colors.divider,
              }}
            >
              {i < currentRound - 1 ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Text style={{ color: i === currentRound - 1 ? "#FFFFFF" : colors.textSecondary, fontWeight: "600", fontSize: 14 }}>
                  {i + 1}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={{ marginBottom: 12 }}>
          <Text
            className="text-lg text-center font-medium"
            style={{ color: colors.textSecondary }}
          >
            Find the missing number in the pattern
          </Text>
        </View>

        {/* Sequence Display */}
        <View className="flex-row justify-center flex-wrap mb-4">
          {sequence.map((num, index) => (
            <View key={index} className="m-1">
              <View
                className="rounded-xl items-center justify-center"
                style={{
                  width: sequenceBoxSize,
                  height: sequenceBoxSize,
                  backgroundColor:
                    index === missingIndex
                      ? GAME_ICON_COLOR + "15"
                      : colors.cardBackground,
                  borderWidth: index === missingIndex ? 2.5 : 1.5,
                  borderColor:
                    index === missingIndex
                      ? GAME_ICON_COLOR
                      : colors.border,
                  borderStyle: index === missingIndex ? "dashed" : "solid",
                  // Shadow for depth
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text
                  className="font-bold"
                  style={{
                    fontSize: sequenceBoxSize * 0.4,
                    color:
                      index === missingIndex
                        ? GAME_ICON_COLOR
                        : colors.textPrimary,
                  }}
                >
                  {index === missingIndex ? "?" : num}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View className="h-px mb-4" style={{ backgroundColor: colors.divider }} />

        {/* Choose label */}
        <Text
          className="text-lg text-center mb-4 font-semibold"
          style={{ color: colors.textPrimary }}
        >
          Choose the missing number
        </Text>

        {/* Answer Options - 2x2 Grid centered */}
        <View className="flex-1 justify-center px-2">
          <View className="flex-row flex-wrap justify-center" style={{ gap: 20 }}>
            {answers.map((answer) => {
              const isThisSelected = selectedAnswer === answer;
              const isThisCorrect = isThisSelected && isCorrect;
              const isThisWrong = isThisSelected && isWrong;

              const borderColorExplicit = isThisCorrect
                ? "#22C55E"
                : isThisWrong
                ? "#EF4444"
                : isDark ? "#6B7280" : "#9CA3AF";
              const backgroundColorExplicit = isThisCorrect
                ? "#22C55E18"
                : isThisWrong
                ? "#EF444418"
                : isDark ? colors.cardBackground : "#F9FAFB";
              const textColorExplicit = isThisCorrect
                ? "#22C55E"
                : isThisWrong
                ? "#EF4444"
                : isDark ? "#F9FAFB" : "#111827";

              return (
                <Pressable
                  key={answer}
                  onPress={() => handleAnswer(answer)}
                  disabled={selectedAnswer !== null}
                  accessibilityLabel={`Choose ${answer}`}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    width: answerButtonSize,
                    height: answerButtonSize,
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: pressed && !isThisSelected
                      ? GAME_ICON_COLOR
                      : borderColorExplicit,
                    backgroundColor: pressed && !isThisSelected
                      ? GAME_ICON_COLOR + "10"
                      : backgroundColorExplicit,
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ scale: pressed && selectedAnswer === null ? 0.93 : 1 }],
                    shadowColor: isThisCorrect ? "#22C55E" : isThisWrong ? "#EF4444" : "#000",
                    shadowOffset: { width: 0, height: isThisCorrect || isThisWrong ? 6 : 3 },
                    shadowOpacity: isThisCorrect || isThisWrong ? 0.35 : 0.18,
                    shadowRadius: isThisCorrect || isThisWrong ? 10 : 6,
                    elevation: isThisCorrect || isThisWrong ? 6 : 5,
                  })}
                >
                  <Text
                    className="font-bold"
                    style={{
                      fontSize: answerFontSize,
                      color: textColorExplicit,
                    }}
                  >
                    {answer}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default NumberPatternGame;
