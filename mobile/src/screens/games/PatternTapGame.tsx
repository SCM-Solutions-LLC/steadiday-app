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


// Game icon color for pattern tap
const PATTERN_TAP_COLOR = "#8B5CF6"; // Purple

// Number of rounds in the game
const PATTERN_ROUNDS = 3;

// Difficulty label per round
const PATTERN_DIFFICULTY = ["Easy", "Medium", "Hard"] as const;

// Flash duration decreases each round (ms): R1=500, R2=400, R3=300
const getFlashDuration = (round: number) => Math.max(300, 600 - round * 100);
// Gap between flashes also shrinks: R1=700, R2=550, R3=400
const getFlashGap = (round: number) => Math.max(400, 800 - round * 150);
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
// PATTERN CELL COMPONENT
// =============================================================================
function PatternCell({
  index,
  isActive,
  isUserTapped,
  onPress,
  disabled,
  colors,
  iconColor,
  size,
}: {
  index: number;
  isActive: boolean;
  isUserTapped: boolean;
  onPress: () => void;
  disabled: boolean;
  colors: any;
  iconColor: string;
  size: number;
}) {
  const scale = useSharedValue(1);
  // Use the provided size directly - no minimum override
  const cellSize = size;

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
      accessibilityLabel={`Tile ${index + 1}`}
      accessibilityRole="button"
    >
      <Animated.View
        className="rounded-2xl items-center justify-center"
        style={[
          animatedStyle,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: isActive
              ? iconColor
              : isUserTapped
              ? colors.success + "30"
              : colors.cardBackground,
            borderWidth: 2.5,
            borderColor: isActive
              ? iconColor
              : isUserTapped
              ? colors.success
              : colors.border,
            // Glow effect when active
            shadowColor: isActive
              ? iconColor
              : isUserTapped
              ? colors.success
              : "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isActive ? 0.6 : isUserTapped ? 0.4 : 0,
            shadowRadius: isActive ? 16 : 8,
            elevation: isActive ? 8 : 0,
          },
        ]}
      />
    </Pressable>
  );
}

// =============================================================================
// PATTERN TAP GAME COMPONENT
// =============================================================================
function PatternTapGame({ onComplete, onClose, colors, textClasses, triggerHaptic, primary, isDark, onNextGame }: EnhancedGameProps) {
  const { width: screenW, height: SCREEN_HEIGHT } = useWindowDimensions();
  const SCREEN_WIDTH = Math.min(screenW, 560);
  const insets = useSafeAreaInsets();
  const [pattern, setPattern] = useState<number[]>([]);
  const [userPattern, setUserPattern] = useState<number[]>([]);
  const [isShowingPattern, setIsShowingPattern] = useState(false);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<"showing" | "input" | "round-complete" | "complete" | "failed">("showing");
  const [hasStarted, setHasStarted] = useState(false);

  // Grid size increases each round: 3x3, 4x4, 5x5
  const getGridColumns = (round: number) => round + 2; // 3, 4, 5
  const getGridSize = (round: number) => {
    const cols = getGridColumns(round);
    return cols * cols; // 9, 16, 25
  };
  // Pattern length increases each round: 3, 5, 7
  const getPatternLength = (round: number) => round * 2 + 1;

  const generatePattern = useCallback(() => {
    // Use date-based seed for daily variety
    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
    let s = daySeed + currentRound * 7919;
    const seededRandom = () => {
      s = (s * 1664525 + 1013904223) & 0x7fffffff;
      return s / 0x7fffffff;
    };

    const newPattern: number[] = [];
    const patternLen = getPatternLength(currentRound);
    const gridSize = getGridSize(currentRound);
    while (newPattern.length < patternLen) {
      const cell = Math.floor(seededRandom() * gridSize);
      if (!newPattern.includes(cell)) {
        newPattern.push(cell);
      }
    }
    return newPattern;
  }, [currentRound]);

  const showPattern = async (patternToShow: number[], round: number) => {
    setIsShowingPattern(true);
    setGameState("showing");

    const flashDuration = getFlashDuration(round);
    const flashGap = getFlashGap(round);

    for (let i = 0; i < patternToShow.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, flashGap));
      setActiveCell(patternToShow[i]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise((resolve) => setTimeout(resolve, flashDuration));
      setActiveCell(null);
    }

    setIsShowingPattern(false);
    setGameState("input");
  };

  // Auto-start the game on mount
  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);
      const newPattern = generatePattern();
      setPattern(newPattern);
      setTimeout(() => showPattern(newPattern, 1), 500);
    }
  }, []);

  const startNextRound = async () => {
    const nextRound = currentRound + 1;
    setUserPattern([]);
    setCurrentRound(nextRound);
    const newPattern = generatePattern();
    setPattern(newPattern);
    await showPattern(newPattern, nextRound);
  };

  const resetGame = async () => {
    setPattern([]);
    setUserPattern([]);
    setIsShowingPattern(false);
    setActiveCell(null);
    setCurrentRound(1);
    setScore(0);
    setGameState("showing");
    setHasStarted(false);

    // Generate and show new pattern
    setTimeout(async () => {
      const today = new Date();
      const daySeed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
      let s = daySeed + 12345;
      const seededRandom = () => {
        s = (s * 1664525 + 1013904223) & 0x7fffffff;
        return s / 0x7fffffff;
      };
      const newPattern: number[] = [];
      while (newPattern.length < getPatternLength(1)) {
        const cell = Math.floor(seededRandom() * getGridSize(1));
        if (!newPattern.includes(cell)) {
          newPattern.push(cell);
        }
      }
      setPattern(newPattern);
      setHasStarted(true);
      await showPattern(newPattern, 1);
    }, 300);
  };

  const retryRound = async () => {
    setUserPattern([]);
    setGameState("showing");
    await showPattern(pattern, currentRound);
  };

  const handleCellTap = (cellIndex: number) => {
    if (gameState !== "input") return;

    triggerHaptic("light");
    const newUserPattern = [...userPattern, cellIndex];
    setUserPattern(newUserPattern);
    setActiveCell(cellIndex);
    setTimeout(() => setActiveCell(null), 200);

    const currentIndex = newUserPattern.length - 1;

    if (pattern[currentIndex] !== cellIndex) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGameState("failed");
      return;
    }

    if (newUserPattern.length === pattern.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore((prev) => prev + 1);
      if (currentRound >= PATTERN_ROUNDS) {
        setGameState("complete");
        onComplete("pattern-tap", { score: score + 1, attempts: currentRound });
      } else {
        setGameState("round-complete");
      }
    }
  };

  // Round complete screen (between rounds)
  if (gameState === "round-complete") {
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
            backgroundColor: PATTERN_TAP_COLOR + "08",
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
          }}
        />
        <GameHeader title="Pattern Tap" onClose={onClose} colors={colors} textClasses={textClasses} iconColor={PATTERN_TAP_COLOR} />
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ fontSize: 60 }}>🎯</Text>
          <Text className="text-2xl font-bold text-center mt-4" style={{ color: colors.textPrimary }}>
            Round {currentRound} Complete!
          </Text>
          <Text className="text-lg text-center mt-2 mb-6" style={{ color: colors.textSecondary }}>
            {PATTERN_ROUNDS - currentRound} round{PATTERN_ROUNDS - currentRound > 1 ? "s" : ""} remaining
          </Text>

          {/* Round indicator */}
          <View className="flex-row mb-8">
            {Array.from({ length: PATTERN_ROUNDS }).map((_, i) => (
              <View
                key={i}
                className="w-10 h-10 rounded-full mx-2 items-center justify-center"
                style={{
                  backgroundColor: i < currentRound ? colors.success : colors.divider,
                }}
              >
                {i < currentRound ? (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                ) : (
                  <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>{i + 1}</Text>
                )}
              </View>
            ))}
          </View>

          <Pressable
            onPress={startNextRound}
            className="py-4 px-8 rounded-2xl"
            style={{
              backgroundColor: PATTERN_TAP_COLOR,
              shadowColor: PATTERN_TAP_COLOR,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-lg font-bold" style={{ color: "#FFFFFF" }}>
              Next Round
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
  if (gameState === "complete") {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <GameHeader title="Pattern Tap" onClose={onClose} colors={colors} textClasses={textClasses} iconColor={PATTERN_TAP_COLOR} />
        <EnhancedGameResults
          title="All Rounds Complete!"
          subtitle="Excellent pattern memory! Your visual recall is on point."
          stats={[
            { label: "Rounds", value: `${PATTERN_ROUNDS}/${PATTERN_ROUNDS}` },
            { label: "Patterns memorized", value: `${score}` },
          ]}
          onDone={onClose}
          onPlayAgain={resetGame}
          onNextGame={onNextGame}
          colors={colors}
          textClasses={textClasses}
          primary={primary}
          iconColor={PATTERN_TAP_COLOR}
          isDark={isDark}
        />
      </SafeAreaView>
    );
  }

  // Failed screen
  if (gameState === "failed") {
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
            backgroundColor: PATTERN_TAP_COLOR + "08",
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
          }}
        />
        <GameHeader title="Pattern Tap" onClose={onClose} colors={colors} textClasses={textClasses} iconColor={PATTERN_TAP_COLOR} />
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ fontSize: 60 }}>🤔</Text>
          <Text className="text-2xl font-bold text-center mt-4" style={{ color: colors.textPrimary }}>
            Oops!
          </Text>
          <Text className="text-lg text-center mt-2 mb-6" style={{ color: colors.textSecondary }}>
            That was the wrong cell. Try this pattern again!
          </Text>

          {/* Round indicator */}
          <View className="flex-row mb-8">
            {Array.from({ length: PATTERN_ROUNDS }).map((_, i) => (
              <View
                key={i}
                className="w-10 h-10 rounded-full mx-2 items-center justify-center"
                style={{
                  backgroundColor: i < currentRound - 1 ? colors.success : colors.divider,
                }}
              >
                {i < currentRound - 1 ? (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                ) : (
                  <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>{i + 1}</Text>
                )}
              </View>
            ))}
          </View>

          <Pressable
            onPress={retryRound}
            className="py-4 px-8 rounded-2xl"
            style={{
              backgroundColor: PATTERN_TAP_COLOR,
              shadowColor: PATTERN_TAP_COLOR,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-lg font-bold" style={{ color: "#FFFFFF" }}>
              Try Again
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

  // Calculate cell size for grid that always fits on screen
  // Round 1: 3x3, Round 2: 4x4, Round 3: 5x5
  const availableWidth = SCREEN_WIDTH - 48; // 24px padding each side
  const GRID_GAP = 12;
  const GRID_COLUMNS = getGridColumns(currentRound);
  const GRID_ROWS = GRID_COLUMNS;
  const cellFromWidth = Math.floor((availableWidth - (GRID_GAP * (GRID_COLUMNS - 1))) / GRID_COLUMNS);

  // Height budget: screen - safeArea - header(~90) - roundIndicators(50) - instructions(86) - progressDots(50) - padding(24)
  const headerHeight = insets.top + 80;
  const GAME_SWITCHER_HEIGHT = 90; // GameSwitcherTabs at bottom of modal
  const fixedContentHeight = 50 + 86 + 50 + 24; // round indicators + instructions + progress + padding
  const availableGridHeight = SCREEN_HEIGHT - headerHeight - fixedContentHeight - insets.bottom - GAME_SWITCHER_HEIGHT;
  const cellFromHeight = Math.floor((availableGridHeight - (GRID_GAP * (GRID_ROWS - 1))) / GRID_ROWS);

  const cellSize = Math.min(cellFromWidth, cellFromHeight);

  // Total grid width for centering
  const gridTotalWidth = cellSize * GRID_COLUMNS + GRID_GAP * (GRID_COLUMNS - 1);

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
          backgroundColor: PATTERN_TAP_COLOR + "08",
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }}
      />
      <GameHeader
        title="Pattern Tap"
        subtitle={`Round ${currentRound} of ${PATTERN_ROUNDS} · ${PATTERN_DIFFICULTY[currentRound - 1]}`}
        onClose={onClose}
        colors={colors}
        textClasses={textClasses}
        iconColor={PATTERN_TAP_COLOR}
      />

      {/* Game Area - Structured layout to prevent overlap */}
      <View style={{ flex: 1, paddingHorizontal: 24 }}>

        {/* SECTION 1: Round Indicators - Fixed height */}
        <View style={{ height: 50, justifyContent: "center", alignItems: "center" }}>
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            {Array.from({ length: PATTERN_ROUNDS }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  marginHorizontal: 4,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: i < currentRound - 1
                    ? colors.success
                    : i === currentRound - 1
                    ? PATTERN_TAP_COLOR
                    : colors.divider,
                }}
              >
                {i < currentRound - 1 ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={{
                    color: i === currentRound - 1 ? "#FFFFFF" : colors.textSecondary,
                    fontWeight: "600",
                    fontSize: 14
                  }}>
                    {i + 1}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* SECTION 2: Instructions - Fixed height, ABOVE grid */}
        <View style={{
          height: 70,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 16,
        }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              textAlign: "center",
              color: isShowingPattern ? colors.warning : colors.success,
              marginBottom: 4,
            }}
          >
            {isShowingPattern ? "Watch the pattern..." : "Your turn!"}
          </Text>
          <Text
            style={{
              fontSize: 16,
              textAlign: "center",
              color: colors.textTertiary,
            }}
          >
            {getPatternLength(currentRound)} cells to remember
          </Text>
        </View>

        {/* SECTION 3: Grid - Centered, EXACTLY 3 columns */}
        <View style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}>
          <View
            style={{
              width: gridTotalWidth,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: GRID_GAP,
            }}
          >
            {Array.from({ length: getGridSize(currentRound) }).map((_, index) => {
              const isActive = activeCell === index;
              const isUserTapped = userPattern.includes(index);

              return (
                <PatternCell
                  key={index}
                  index={index}
                  isActive={isActive}
                  isUserTapped={isUserTapped}
                  onPress={() => handleCellTap(index)}
                  disabled={isShowingPattern}
                  colors={colors}
                  iconColor={PATTERN_TAP_COLOR}
                  size={cellSize}
                />
              );
            })}
          </View>
        </View>

        {/* SECTION 4: Progress Dots - Fixed height at bottom */}
        <View style={{
          height: 50,
          justifyContent: "center",
          alignItems: "center",
        }}>
          <View style={{ flexDirection: "row" }}>
            {pattern.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  marginHorizontal: 8,
                  backgroundColor: index < userPattern.length
                    ? colors.success
                    : colors.divider,
                }}
              />
            ))}
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

export default PatternTapGame;
