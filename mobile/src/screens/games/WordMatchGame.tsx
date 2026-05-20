import React, { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, ScrollView, useWindowDimensions, PixelRatio } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
} from "react-native-reanimated";

import { getDailySeed, seededShuffle } from "../../utils/dailySeed";

// Font scaling utilities for accessibility
const getFontScale = () => PixelRatio.getFontScale();

// Game icon color for word-match
const GAME_ICON_COLOR = "#6366F1"; // Indigo

// Number of rounds in the game
const WORD_ROUNDS = 3;

// All word pairs pool - much larger pool for daily variety
const ALL_EASY_PAIRS = [
  { word: "Happy", match: "Joyful" },
  { word: "Quick", match: "Fast" },
  { word: "Big", match: "Large" },
  { word: "Small", match: "Tiny" },
  { word: "Smart", match: "Clever" },
  { word: "Angry", match: "Mad" },
  { word: "Start", match: "Begin" },
  { word: "End", match: "Finish" },
  { word: "Cold", match: "Chilly" },
  { word: "Hot", match: "Warm" },
  { word: "Dark", match: "Dim" },
  { word: "Bright", match: "Shiny" },
  { word: "Sick", match: "Ill" },
  { word: "Nice", match: "Kind" },
  { word: "Close", match: "Near" },
  { word: "Gift", match: "Present" },
  { word: "Late", match: "Tardy" },
  { word: "Glad", match: "Pleased" },
  { word: "Shut", match: "Closed" },
  { word: "Leap", match: "Jump" },
];

const ALL_MEDIUM_PAIRS = [
  { word: "Brave", match: "Courageous" },
  { word: "Quiet", match: "Silent" },
  { word: "Rich", match: "Wealthy" },
  { word: "Old", match: "Ancient" },
  { word: "Kind", match: "Gentle" },
  { word: "Strong", match: "Powerful" },
  { word: "Tired", match: "Exhausted" },
  { word: "Easy", match: "Simple" },
  { word: "Hard", match: "Difficult" },
  { word: "Wet", match: "Damp" },
  { word: "Swift", match: "Rapid" },
  { word: "Loud", match: "Noisy" },
  { word: "Thin", match: "Slender" },
  { word: "Sad", match: "Unhappy" },
  { word: "Odd", match: "Strange" },
  { word: "Rude", match: "Impolite" },
  { word: "Calm", match: "Peaceful" },
  { word: "Scary", match: "Frightening" },
  { word: "Clean", match: "Spotless" },
  { word: "Shiny", match: "Gleaming" },
];

const ALL_HARD_PAIRS = [
  { word: "Beautiful", match: "Lovely" },
  { word: "Abundant", match: "Plentiful" },
  { word: "Serene", match: "Tranquil" },
  { word: "Frugal", match: "Thrifty" },
  { word: "Cunning", match: "Crafty" },
  { word: "Vivid", match: "Vibrant" },
  { word: "Arduous", match: "Strenuous" },
  { word: "Candid", match: "Forthright" },
  { word: "Benign", match: "Harmless" },
  { word: "Feeble", match: "Fragile" },
  { word: "Jovial", match: "Cheerful" },
  { word: "Prudent", match: "Cautious" },
  { word: "Placid", match: "Calm" },
  { word: "Verbose", match: "Wordy" },
  { word: "Nimble", match: "Agile" },
  { word: "Solemn", match: "Serious" },
  { word: "Tenacious", match: "Persistent" },
  { word: "Radiant", match: "Glowing" },
  { word: "Elated", match: "Overjoyed" },
  { word: "Obscure", match: "Unclear" },
  { word: "Diligent", match: "Industrious" },
  { word: "Eloquent", match: "Articulate" },
];

// Props interface for the game
export interface EnhancedGameProps {
  onComplete: (gameId: string, stats: { score: number; attempts: number }) => void;
  onClose: () => void;
  colors: any;
  textClasses: any;
  triggerHaptic: (type: string) => void;
  primary: string;
  isDark: boolean;
  onNextGame?: () => void;
}

// Celebration dot animation component
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

// Celebration dots container
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

// Game Header Component
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

// Enhanced Game Results Screen
function EnhancedGameResults({
  title,
  subtitle,
  stats,
  onDone,
  onPlayAgain,
  onNextGame,
  colors,
  textClasses,
  primary,
  iconColor,
  isDark,
}: {
  title: string;
  subtitle: string;
  stats?: { label: string; value: string }[];
  onDone: () => void;
  onPlayAgain?: () => void;
  onNextGame?: () => void;
  colors: any;
  textClasses: any;
  primary: string;
  iconColor: string;
  isDark: boolean;
}) {
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
      <CelebrationDots iconColor={iconColor} />

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
            <Ionicons name="checkmark" size={64} color={iconColor} />
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

        {/* Action Buttons */}
        <View className="w-full">
          {onPlayAgain && (
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

// Word Tile Component - ENLARGED for senior audience with font scaling support
function WordTile({
  word,
  isMatched,
  isSelected,
  onPress,
  colors,
  textClasses,
  iconColor,
}: {
  word: string;
  isMatched: boolean;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
  textClasses: any;
  iconColor: string;
}) {
  const scale = useSharedValue(1);
  const fontScale = getFontScale();
  const { width: screenW } = useWindowDimensions();
  const SCREEN_WIDTH = Math.min(screenW, 560);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!isMatched) {
      scale.value = withSpring(0.95, { damping: 15 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  useEffect(() => {
    if (isMatched) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 10 }),
        withSpring(1, { damping: 15 })
      );
    }
  }, [isMatched]);

  // Adaptive width: single column for very large fonts, 2 columns otherwise
  const useSingleColumn = fontScale >= 1.35;
  const buttonWidth = useSingleColumn
    ? SCREEN_WIDTH - 40
    : (SCREEN_WIDTH - 48) / 2;

  // Scale height based on font scale for proper text fit
  const minHeight = Math.max(64, 56 * fontScale);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isMatched}
      accessibilityLabel={`${word}${isMatched ? ", matched" : ""}${isSelected ? ", selected" : ""}`}
      accessibilityRole="button"
    >
      <Animated.View
        className="m-2 rounded-2xl items-center justify-center"
        style={[
          animatedStyle,
          {
            width: buttonWidth,
            minHeight: minHeight,
            paddingHorizontal: 16,
            paddingVertical: 18,
            backgroundColor: isMatched
              ? colors.success + "20"
              : isSelected
              ? iconColor + "20"
              : colors.cardBackground,
            borderWidth: 3,
            borderColor: isMatched
              ? colors.success
              : isSelected
              ? iconColor
              : colors.border,
            opacity: isMatched ? 0.6 : 1,
          },
        ]}
      >
        <Text
          className="font-bold text-center"
          style={{
            color: isMatched ? colors.success : isSelected ? iconColor : colors.textPrimary,
            fontSize: Math.max(16, 20 / fontScale),
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {word}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

type WordPair = { word: string; match: string };

// Helper to get word pairs for a given round (1-indexed) using daily seed
function getPairsForRound(round: number, seed: number): WordPair[] {
  const pairCount = round === 1 ? 4 : round === 2 ? 5 : 6;
  const pool = round === 1 ? ALL_EASY_PAIRS : round === 2 ? ALL_MEDIUM_PAIRS : ALL_HARD_PAIRS;
  // Use seed + round to get different shuffles per round
  const shuffled = seededShuffle(pool, seed + round * 7919);
  return shuffled.slice(0, pairCount);
}

// Difficulty label per round
const ROUND_DIFFICULTY = ["Easy", "Medium", "Hard"] as const;

// Main WordMatchGame component
function WordMatchGame({ onComplete, onClose, colors, textClasses, triggerHaptic, primary, isDark, onNextGame }: EnhancedGameProps) {
  const { width: screenW, height: SCREEN_HEIGHT } = useWindowDimensions();
  const SCREEN_WIDTH = Math.min(screenW, 560);
  const insets = useSafeAreaInsets();
  const [gameKey, setGameKey] = useState(0);
  const [dailySeed] = useState(() => getDailySeed());
  const [currentRound, setCurrentRound] = useState(1);
  const wordPairs: WordPair[] = useMemo(() => getPairsForRound(currentRound, dailySeed), [currentRound, dailySeed]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<string[] | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  const allWords = useMemo(() => {
    const words = wordPairs.map((p: WordPair) => p.word);
    const matches = wordPairs.map((p: WordPair) => p.match);
    return seededShuffle([...words, ...matches], dailySeed + currentRound * 31 + gameKey * 97);
  }, [wordPairs, gameKey, dailySeed, currentRound]);

  const startNextRound = () => {
    setSelectedWord(null);
    setMatchedPairs([]);
    setRoundCompleted(false);
    setTotalMatches((prev) => prev + matchCount);
    setMatchCount(0);
    setCurrentRound((r) => r + 1);
    setGameKey((k) => k + 1);
  };

  const resetGame = () => {
    setSelectedWord(null);
    setMatchedPairs([]);
    setRoundCompleted(false);
    setGameCompleted(false);
    setMatchCount(0);
    setTotalMatches(0);
    setCurrentRound(1);
    setGameKey((k) => k + 1);
  };

  const handleWordSelect = (word: string) => {
    triggerHaptic("light");

    if (matchedPairs.includes(word)) return;

    const pair = wordPairs.find((p: WordPair) => p.word === word || p.match === word);
    if (!pair) return;

    if (!selectedWord) {
      setSelectedWord(word);
      return;
    }

    if (selectedWord === word) {
      setSelectedWord(null);
      return;
    }

    const selectedPair = wordPairs.find((p: WordPair) => p.word === selectedWord || p.match === selectedWord);
    if (selectedPair && pair === selectedPair) {
      const newMatched = [...matchedPairs, selectedWord, word];
      setMatchedPairs(newMatched);
      setSelectedWord(null);
      setMatchCount((prev) => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (newMatched.length === wordPairs.length * 2) {
        setTimeout(() => {
          if (currentRound >= WORD_ROUNDS) {
            setGameCompleted(true);
            onComplete("word-match", { score: totalMatches + matchCount + 1, attempts: 0 });
          } else {
            setRoundCompleted(true);
          }
        }, 500);
      }
    } else {
      // Wrong match - flash both words red briefly
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWrongPair([selectedWord, word]);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedWord(null);
      }, 500);
    }
  };

  // Round complete screen
  if (roundCompleted && !gameCompleted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
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
        <GameHeader title="Word Match" onClose={onClose} colors={colors} textClasses={textClasses} iconColor={GAME_ICON_COLOR} />
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ fontSize: 60 }}>🎯</Text>
          <Text className="text-2xl font-bold text-center mt-4" style={{ color: colors.textPrimary }}>
            Round {currentRound} Complete!
          </Text>
          <Text className="text-lg text-center mt-2 mb-6" style={{ color: colors.textSecondary }}>
            {WORD_ROUNDS - currentRound} round{WORD_ROUNDS - currentRound > 1 ? "s" : ""} remaining
          </Text>

          {/* Round indicator */}
          <View className="flex-row mb-8">
            {Array.from({ length: WORD_ROUNDS }).map((_, i) => (
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
              backgroundColor: GAME_ICON_COLOR,
              shadowColor: GAME_ICON_COLOR,
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
    const finalMatches = totalMatches + matchCount;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Word Match" onClose={onClose} colors={colors} textClasses={textClasses} iconColor={GAME_ICON_COLOR} />
        <EnhancedGameResults
          title="All Rounds Complete!"
          subtitle="Excellent vocabulary! You matched all the word pairs."
          stats={[
            { label: "Rounds", value: `${WORD_ROUNDS}/${WORD_ROUNDS}` },
            { label: "Total pairs matched", value: `${finalMatches}` },
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

  // Calculate button sizes for 2-column layout that fits all 8 words on screen - SENIOR FRIENDLY
  const WORD_GAP = 14;
  const COLUMNS = 2;
  const PADDING = 20;
  const availableWidth = SCREEN_WIDTH - (PADDING * 2) - WORD_GAP;
  const buttonWidth = availableWidth / COLUMNS;
  // 8 words = 4 rows, calculate height to fit on screen
  // Available height = screen - safe area - header - round indicators - progress dots - instructions - padding
  const headerHeight = insets.top + 80;
  const GAME_SWITCHER_HEIGHT = 90; // GameSwitcherTabs at bottom of modal
  const fixedContentHeight = 40 + 30 + 50 + 24; // round indicators + progress dots + instructions + padding
  const availableHeight = SCREEN_HEIGHT - headerHeight - fixedContentHeight - insets.bottom - GAME_SWITCHER_HEIGHT;
  const numRows = Math.ceil(allWords.length / COLUMNS);
  const buttonHeight = Math.min((availableHeight - (WORD_GAP * (numRows - 1))) / numRows, 80);

  // Get font size based on text size setting
  const getWordFontSize = () => {
    if (textClasses.body === "text-xl") return 24; // extra-large
    if (textClasses.body === "text-lg") return 22; // large
    return 20; // normal
  };
  const wordFontSize = getWordFontSize();

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
        title="Word Match"
        subtitle={`Round ${currentRound} of ${WORD_ROUNDS} · ${ROUND_DIFFICULTY[currentRound - 1]} · ${wordPairs.length} pairs`}
        onClose={onClose}
        colors={colors}
        textClasses={textClasses}
        iconColor={GAME_ICON_COLOR}
      />

      {/* Game Area - ScrollView for larger rounds */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 12 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Round indicator */}
        <View className="flex-row justify-center mb-3">
          {Array.from({ length: WORD_ROUNDS }).map((_, i) => (
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

        {/* Progress dots */}
        <View className="flex-row items-center justify-center mb-2">
          {wordPairs.map((_: WordPair, index: number) => (
            <View
              key={index}
              className="w-2.5 h-2.5 rounded-full mx-1.5"
              style={{
                backgroundColor: index < matchCount ? colors.success : colors.divider,
              }}
            />
          ))}
        </View>

        {/* Instructions */}
        <View style={{ marginBottom: 16 }}>
          <Text
            className="text-base text-center font-medium"
            style={{ color: colors.textSecondary }}
          >
            Tap two words that mean the same thing
          </Text>
        </View>

        {/* 2-Column Word Grid */}
        <View className="flex-1 justify-center">
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: WORD_GAP,
            }}
          >
            {allWords.map((word, index) => {
              const isMatched = matchedPairs.includes(word);
              const isSelected = selectedWord === word;
              const isWrong = wrongPair?.includes(word) ?? false;

              return (
                <Pressable
                  key={`${gameKey}-${word}-${index}`}
                  onPress={() => handleWordSelect(word)}
                  disabled={isMatched || isWrong}
                  accessibilityLabel={`${word}${isMatched ? ", matched" : ""}${isSelected ? ", selected" : ""}`}
                  accessibilityRole="button"
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        width: buttonWidth,
                        height: buttonHeight,
                        borderRadius: 16,
                        borderWidth: isMatched || isSelected || isWrong ? 2.5 : 1,
                        borderColor: isWrong
                          ? "#EF4444"
                          : isMatched
                          ? colors.success
                          : isSelected
                          ? GAME_ICON_COLOR
                          : colors.border,
                        backgroundColor: isWrong
                          ? "#EF444418"
                          : isMatched
                          ? colors.success + "15"
                          : isSelected
                          ? GAME_ICON_COLOR + "15"
                          : colors.cardBackground,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 12,
                        opacity: isMatched ? 0.6 : 1,
                        transform: [{ scale: pressed && !isMatched ? 0.96 : 1 }],
                        shadowColor: isWrong ? "#EF4444" : isSelected ? GAME_ICON_COLOR : "#000",
                        shadowOffset: { width: 0, height: isSelected || isWrong ? 4 : 2 },
                        shadowOpacity: isSelected || isWrong ? 0.2 : 0.1,
                        shadowRadius: isSelected || isWrong ? 8 : 4,
                        elevation: isSelected || isWrong ? 4 : 2,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: wordFontSize,
                          fontWeight: "600",
                          color: isWrong
                            ? "#EF4444"
                            : isMatched
                            ? colors.success
                            : isSelected
                            ? GAME_ICON_COLOR
                            : colors.textPrimary,
                        }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {word}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default WordMatchGame;
