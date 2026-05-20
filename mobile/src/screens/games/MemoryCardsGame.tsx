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

// Game icon color for memory cards
const MEMORY_CARDS_COLOR = "#F59E0B"; // Amber

// Number of rounds in the game
const MEMORY_ROUNDS = 3;

// Difficulty label per round
const MEMORY_DIFFICULTY = ["Easy", "Medium", "Hard"] as const;

// Flip-back delay decreases each round (ms): R1=1200, R2=900, R3=600
const getFlipBackDelay = (round: number) => Math.max(600, 1400 - round * 300);
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
  const { width: SCREEN_WIDTH } = useWindowDimensions();
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
          left: SCREEN_WIDTH / 2 - 6,
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
// MEMORY CARD COMPONENT
// =============================================================================
function MemoryCard({
  card,
  isFlipped,
  onFlip,
  colors,
  iconColor,
  size,
  isDark,
}: {
  card: { id: number; icon: string; matched: boolean };
  isFlipped: boolean;
  onFlip: () => void;
  colors: any;
  iconColor: string;
  size: number;
  isDark: boolean;
}) {
  const scale = useSharedValue(1);

  // Use the provided size directly - already calculated dynamically
  const cardSize = size;
  // Scale icon based on card size - smaller cards need smaller icons
  const iconSize = Math.max(Math.min(size * 0.45, 48), 28);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Pressable
      onPress={onFlip}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={
        isFlipped || card.matched
          ? `Card showing ${card.icon}`
          : "Face down card"
      }
      accessibilityRole="button"
    >
      <Animated.View
        className="rounded-2xl items-center justify-center"
        style={[
          animatedStyle,
          {
            width: cardSize,
            height: cardSize,
            backgroundColor: card.matched
              ? colors.success + "18"
              : isFlipped
              ? iconColor + "15"
              : isDark ? "#1E3A5F" : "#D4E5F7",
            borderWidth: card.matched ? 2.5 : isFlipped ? 2.5 : 1.5,
            borderColor: card.matched ? colors.success : isFlipped ? iconColor : isDark ? "#2A4A6F" : "#B8D4EE",
            // Enhanced shadow with glow for flipped/matched cards
            shadowColor: card.matched ? colors.success : isFlipped ? iconColor : "#000",
            shadowOffset: { width: 0, height: isFlipped ? 6 : 3 },
            shadowOpacity: card.matched ? 0.35 : isFlipped ? 0.25 : 0.1,
            shadowRadius: isFlipped ? 10 : 6,
            elevation: isFlipped ? 6 : 3,
          },
        ]}
      >
        {isFlipped ? (
          <Ionicons name={card.icon as any} size={iconSize} color={card.matched ? colors.success : iconColor} />
        ) : (
          <View
            className="rounded-full items-center justify-center"
            style={{
              width: Math.max(cardSize * 0.4, 30),
              height: Math.max(cardSize * 0.4, 30),
              backgroundColor: "rgba(255,255,255,0.15)",
            }}
          >
            <Ionicons name="help-outline" size={Math.max(cardSize * 0.25, 18)} color="rgba(255,255,255,0.6)" />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// MEMORY CARDS GAME COMPONENT
// =============================================================================
function MemoryCardsGame({ onComplete, onClose, colors, textClasses, triggerHaptic, primary, isDark, onNextGame }: EnhancedGameProps) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const SCREEN_WIDTH = Math.min(screenW, 560);
  const SCREEN_HEIGHT = screenH;
  const insets = useSafeAreaInsets();
  const [gameKey, setGameKey] = useState(0);
  const [cards, setCards] = useState<{ id: number; icon: string; matched: boolean }[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalAttempts, setTotalAttempts] = useState(0);

  // Pair counts increase with rounds: 4, 6, 8
  const getPairCount = (round: number) => round === 1 ? 4 : round === 2 ? 6 : 8;
  // Column counts increase with rounds: 2, 3, 4
  const getColumnCount = (round: number) => round === 1 ? 2 : round === 2 ? 3 : 4;

  const generateCards = useCallback(() => {
    const icons = ["heart", "star", "leaf", "flower", "sunny", "moon", "cloud", "water", "diamond", "rose", "flame", "musical-note"];
    const pairCount = getPairCount(currentRound);
    // Use date-based seed for daily variety
    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
    const roundSeed = daySeed + currentRound * 31 + gameKey * 97;
    let s = roundSeed;
    const seededRandom = () => {
      s = (s * 1664525 + 1013904223) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    const shuffledIcons = [...icons].sort(() => seededRandom() - 0.5);
    const selectedIcons = shuffledIcons.slice(0, pairCount);
    const cardPairs = [...selectedIcons, ...selectedIcons].map((icon, index) => ({
      id: index,
      icon,
      matched: false,
    }));
    // Shuffle card positions with different seed offset
    s = roundSeed + 12345;
    setCards(cardPairs.sort(() => seededRandom() - 0.5));
  }, [currentRound]);

  useEffect(() => {
    generateCards();
  }, [gameKey, currentRound]);

  const startNextRound = () => {
    setFlippedCards([]);
    setRoundCompleted(false);
    setMatchCount(0);
    setTotalAttempts((prev) => prev + attempts);
    setAttempts(0);
    setCurrentRound((r) => r + 1);
    setGameKey((k) => k + 1);
  };

  const resetGame = () => {
    setFlippedCards([]);
    setRoundCompleted(false);
    setGameCompleted(false);
    setMatchCount(0);
    setAttempts(0);
    setTotalAttempts(0);
    setCurrentRound(1);
    setGameKey((k) => k + 1);
  };

  const handleCardFlip = (cardId: number) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.matched || flippedCards.includes(cardId) || flippedCards.length >= 2) return;

    triggerHaptic("light");
    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setAttempts((prev) => prev + 1);
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.icon === secondCard.icon) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCards((prev) =>
          prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, matched: true } : c))
        );
        setFlippedCards([]);
        setMatchCount((prev) => prev + 1);

        const matchedCount = cards.filter((c) => c.matched).length + 2;
        if (matchedCount === cards.length) {
          setTimeout(() => {
            if (currentRound >= MEMORY_ROUNDS) {
              setGameCompleted(true);
              const finalAttempts = totalAttempts + attempts + 1;
              onComplete("memory-cards", { score: MEMORY_ROUNDS, attempts: finalAttempts });
            } else {
              setRoundCompleted(true);
            }
          }, 500);
        }
      } else {
        setTimeout(() => setFlippedCards([]), getFlipBackDelay(currentRound));
      }
    }
  };

  // Round complete screen
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
            backgroundColor: MEMORY_CARDS_COLOR + "08",
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
          }}
        />
        <GameHeader title="Memory Match" onClose={onClose} colors={colors} textClasses={textClasses} iconColor={MEMORY_CARDS_COLOR} />
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ fontSize: 60 }}>&#x2728;</Text>
          <Text className="text-2xl font-bold text-center mt-4" style={{ color: colors.textPrimary }}>
            Round {currentRound} Complete!
          </Text>
          <Text className="text-lg text-center mt-2 mb-6" style={{ color: colors.textSecondary }}>
            {MEMORY_ROUNDS - currentRound} round{MEMORY_ROUNDS - currentRound > 1 ? "s" : ""} remaining
          </Text>

          {/* Round indicator */}
          <View className="flex-row mb-8">
            {Array.from({ length: MEMORY_ROUNDS }).map((_, i) => (
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
              backgroundColor: MEMORY_CARDS_COLOR,
              shadowColor: MEMORY_CARDS_COLOR,
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
  if (gameCompleted) {
    const finalAttempts = totalAttempts + attempts;
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <GameHeader title="Memory Match" onClose={onClose} colors={colors} textClasses={textClasses} iconColor={MEMORY_CARDS_COLOR} />
        <EnhancedGameResults
          title="All Rounds Complete!"
          subtitle="Amazing memory! You completed all 3 rounds."
          stats={[
            { label: "Rounds", value: `${MEMORY_ROUNDS}/${MEMORY_ROUNDS}` },
            { label: "Total attempts", value: `${finalAttempts}` },
          ]}
          onDone={onClose}
          onPlayAgain={resetGame}
          onNextGame={onNextGame}
          colors={colors}
          textClasses={textClasses}
          primary={primary}
          iconColor={MEMORY_CARDS_COLOR}
          isDark={isDark}
        />
      </SafeAreaView>
    );
  }

  // Calculate card size to fit ALL cards on screen without scrolling
  // Round 1: 4 pairs = 8 cards (4 rows x 2 cols)
  // Round 2: 6 pairs = 12 cards (4 rows x 3 cols)
  // Round 3: 8 pairs = 16 cards (4 rows x 4 cols)
  const TILE_GAP = 10;
  const COLUMNS = getColumnCount(currentRound);
  const GRID_PADDING = 20;
  const numCards = cards.length;
  const numRows = Math.ceil(numCards / COLUMNS);

  // Available height for cards = screen - safe area - header - round indicators - pairs badge - attempts - padding
  const headerHeight = insets.top + 80;
  const GAME_SWITCHER_HEIGHT = 90; // GameSwitcherTabs at bottom of modal
  const fixedContentHeight = 40 + 50 + 40 + 24; // round indicators + pairs badge + attempts counter + padding
  const availableHeight = SCREEN_HEIGHT - headerHeight - fixedContentHeight - insets.bottom - GAME_SWITCHER_HEIGHT;
  const availableWidth = SCREEN_WIDTH - (GRID_PADDING * 2);

  // Calculate card size based on what fits
  const cardSizeByHeight = (availableHeight - (TILE_GAP * (numRows - 1))) / numRows;
  const cardSizeByWidth = (availableWidth - (TILE_GAP * (COLUMNS - 1))) / COLUMNS;
  const cardSize = Math.min(cardSizeByHeight, cardSizeByWidth, 120); // Max 120px

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
          backgroundColor: MEMORY_CARDS_COLOR + "08",
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }}
      />
      <GameHeader
        title="Memory Match"
        subtitle={`Round ${currentRound} of ${MEMORY_ROUNDS} · ${MEMORY_DIFFICULTY[currentRound - 1]} · ${getPairCount(currentRound)} pairs`}
        onClose={onClose}
        colors={colors}
        textClasses={textClasses}
        iconColor={MEMORY_CARDS_COLOR}
      />

      {/* Game Area - NO ScrollView, everything fits on screen */}
      <View className="flex-1 px-5 py-3">
        {/* Round indicator */}
        <View className="flex-row justify-center mb-3">
          {Array.from({ length: MEMORY_ROUNDS }).map((_, i) => (
            <View
              key={i}
              className="w-8 h-8 rounded-full mx-1 items-center justify-center"
              style={{
                backgroundColor: i < currentRound - 1
                  ? colors.success
                  : i === currentRound - 1
                  ? MEMORY_CARDS_COLOR
                  : colors.divider,
              }}
            >
              {i < currentRound - 1 ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Text style={{ color: i === currentRound - 1 ? "#FFFFFF" : colors.textSecondary, fontWeight: "600", fontSize: 12 }}>
                  {i + 1}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Pairs Badge */}
        <View className="items-center mb-3">
          <View
            className="px-4 py-2 rounded-full"
            style={{ backgroundColor: colors.success + "15" }}
          >
            <Text className="text-base font-bold" style={{ color: colors.success }}>
              Pairs: {matchCount}/{cards.length / 2}
            </Text>
          </View>
        </View>

        {/* Card Grid - All cards visible */}
        <View className="flex-1 justify-center items-center">
          <View
            className="flex-row flex-wrap justify-center"
            style={{
              maxWidth: (cardSize * COLUMNS) + (TILE_GAP * (COLUMNS - 1)),
              gap: TILE_GAP,
            }}
          >
            {cards.map((card) => (
              <MemoryCard
                key={card.id}
                card={card}
                isFlipped={flippedCards.includes(card.id) || card.matched}
                onFlip={() => handleCardFlip(card.id)}
                colors={colors}
                iconColor={MEMORY_CARDS_COLOR}
                size={cardSize}
                isDark={isDark}
              />
            ))}
          </View>
        </View>

        {/* Attempts counter */}
        <View className="items-center py-2">
          <Text className="text-base" style={{ color: colors.textTertiary }}>
            Attempts: {attempts}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default MemoryCardsGame;
