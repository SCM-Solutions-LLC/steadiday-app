import React, { useState, useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView, Modal } from "react-native";
import { Screen } from "../components/Screen";
import { useHealthStore } from "../state/stores/healthStore";
import { useMindBreaksStore } from "../state/stores/mindBreaksStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import { getTextSizeClasses } from "../utils/textSizes";
import { useTheme } from "../utils/useTheme";
import { useResponsive } from "../utils/useResponsive";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenErrorBoundary } from "../components/ui";
import WordScrambleGame from "./games/WordScrambleGame";
import WordMatchGame from "./games/WordMatchGame";
import NumberPatternGame from "./games/NumberPatternGame";
import MemoryCardsGame from "./games/MemoryCardsGame";
import ReactionTapGame from "./games/ReactionTapGame";
import PatternTapGame from "./games/PatternTapGame";

import BreathingExerciseGame from "./games/BreathingExerciseGame";
import MuscleRelaxationGame from "./games/MuscleRelaxationGame";
import LogicGridPuzzleGame from "./games/LogicGridPuzzleGame";
import FeaturedGameCard from "../components/games/FeaturedGameCard";
import GameSwitcherTabs, { GAME_ICON_COLORS } from "../components/games/GameSwitcherTabs";

// Game definitions
interface GameDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  duration: string;
  iconColor: string;
}

// Category labels for each game
const GAME_CATEGORY: Record<string, string> = {
  "word-scramble": "WORDS",
  "word-match": "WORDS",
  "number-pattern": "NUMBERS",
  "memory-cards": "MEMORY",
  "reaction-tap": "REACTION",
  "pattern-tap": "PATTERNS",
  "logic-grid": "LOGIC",
};

// Category-based colors — games in the same category share a color
const NYT_GAME_COLORS: Record<string, { bg: string; bgDark: string; text: string }> = {
  "word-scramble":   { bg: "#7C6FD4", bgDark: "#5A4FB0", text: "#FFFFFF" },
  "word-match":      { bg: "#7C6FD4", bgDark: "#5A4FB0", text: "#FFFFFF" },
  "number-pattern":  { bg: "#2EAA6F", bgDark: "#238856", text: "#FFFFFF" },
  "memory-cards":    { bg: "#E6A840", bgDark: "#C48E30", text: "#FFFFFF" },
  "reaction-tap":    { bg: "#E05C5C", bgDark: "#B84A4A", text: "#FFFFFF" },
  "pattern-tap":     { bg: "#4A90D9", bgDark: "#3A73B0", text: "#FFFFFF" },
  "logic-grid":      { bg: "#6B7280", bgDark: "#4B5563", text: "#FFFFFF" },
};

// NYT-style icon colors - vibrant colored backgrounds with white icons
const NYT_ICON_STYLES: Record<string, { iconBg: string; iconColor: string }> = {
  "word-scramble":   { iconBg: "rgba(255,255,255,0.25)", iconColor: "#FFFFFF" },
  "word-match":      { iconBg: "rgba(255,255,255,0.25)", iconColor: "#FFFFFF" },
  "number-pattern":  { iconBg: "rgba(255,255,255,0.25)", iconColor: "#FFFFFF" },
  "memory-cards":    { iconBg: "rgba(255,255,255,0.25)", iconColor: "#FFFFFF" },
  "reaction-tap":    { iconBg: "rgba(255,255,255,0.25)", iconColor: "#FFFFFF" },
  "pattern-tap":     { iconBg: "rgba(255,255,255,0.25)", iconColor: "#FFFFFF" },
  "logic-grid":      { iconBg: "rgba(255,255,255,0.25)", iconColor: "#FFFFFF" },
};

const GAMES: GameDefinition[] = [
  {
    id: "word-scramble",
    title: "Word Scramble",
    subtitle: "Unscramble letters",
    description: "Rearrange jumbled letters to form words",
    icon: "shuffle",
    duration: "3 min",
    iconColor: GAME_ICON_COLORS["word-scramble"],
  },
  {
    id: "word-match",
    title: "Word Match",
    subtitle: "Connect meanings",
    description: "Match words with similar meanings",
    icon: "link",
    duration: "1 min",
    iconColor: GAME_ICON_COLORS["word-match"],
  },
  {
    id: "number-pattern",
    title: "Number Flow",
    subtitle: "Find what comes next",
    description: "Discover the pattern in sequences",
    icon: "trending-up",
    duration: "1 min",
    iconColor: GAME_ICON_COLORS["number-pattern"],
  },
  {
    id: "memory-cards",
    title: "Memory Match",
    subtitle: "Reveal and remember",
    description: "Find all matching pairs",
    icon: "copy",
    duration: "2 min",
    iconColor: GAME_ICON_COLORS["memory-cards"],
  },
  {
    id: "reaction-tap",
    title: "Reaction Tap",
    subtitle: "Notice and respond",
    description: "Test your reflexes",
    icon: "hand-left",
    duration: "1 min",
    iconColor: GAME_ICON_COLORS["reaction-tap"],
  },
  {
    id: "pattern-tap",
    title: "Pattern Tap",
    subtitle: "Watch and repeat",
    description: "Remember the sequence",
    icon: "keypad",
    duration: "2 min",
    iconColor: GAME_ICON_COLORS["pattern-tap"],
  },
  {
    id: "logic-grid",
    title: "Logic Grid",
    subtitle: "Solve with clues",
    description: "Deduce matches using logic clues",
    icon: "grid-outline" as keyof typeof Ionicons.glyphMap,
    duration: "~5 min",
    iconColor: GAME_ICON_COLORS["logic-grid"],
  },
];

type GameId = (typeof GAMES)[number]["id"];

// Game of the Day rotation — breathing exercise removed
const GAME_OF_THE_DAY_ROTATION: { [key: number]: string } = {
  0: "word-scramble",    // Sunday
  1: "word-match",       // Monday
  2: "number-pattern",   // Tuesday
  3: "memory-cards",     // Wednesday
  4: "logic-grid",       // Thursday
  5: "reaction-tap",     // Friday
  6: "pattern-tap",      // Saturday
};

const getTodaysFeaturedGame = (): GameDefinition => {
  const dayOfWeek = new Date().getDay();
  const featuredGameId = GAME_OF_THE_DAY_ROTATION[dayOfWeek];
  const featuredGame = GAMES.find(g => g.id === featuredGameId);
  return featuredGame || GAMES[0];
};

const getDayName = (): string => {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
};

// =============================================================================
// NYT-STYLE GAME CARD
// =============================================================================
interface NYTGameCardProps {
  game: GameDefinition;
  onPress: () => void;
  isDark: boolean;
}

function NYTGameCard({ game, onPress, isDark }: NYTGameCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  const gameColor = NYT_GAME_COLORS[game.id] || { bg: "#6B7280", bgDark: "#4B5563", text: "#FFFFFF" };
  const iconStyle = NYT_ICON_STYLES[game.id] || { iconBg: "rgba(255,255,255,0.2)", iconColor: "rgba(255,255,255,0.9)" };
  const cardBg = isDark ? gameColor.bgDark : gameColor.bg;
  const category = GAME_CATEGORY[game.id] || "";

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            backgroundColor: cardBg,
            borderRadius: 20,
            paddingVertical: 14,
            paddingHorizontal: 18,
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isDark ? 0.25 : 0.12,
            shadowRadius: 8,
            elevation: 4,
          },
        ]}
      >
        {/* Left side: text */}
        <View style={{ flex: 1, marginRight: 14 }}>
          {category !== "" && (
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "rgba(255,255,255,0.7)",
                letterSpacing: 1.2,
                marginBottom: 4,
              }}
            >
              {category}
            </Text>
          )}
          <Text
            style={{
              fontSize: 22,
              fontWeight: "900",
              color: gameColor.text,
              letterSpacing: -0.3,
            }}
          >
            {game.title}
          </Text>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "rgba(255,255,255,0.22)",
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 10,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
            >
              {game.duration}
            </Text>
          </View>
        </View>

        {/* Right side: icon */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: iconStyle.iconBg,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <Ionicons name={game.icon} size={34} color={iconStyle.iconColor} />
        </View>
      </Animated.View>
    </Pressable>
  );
}


export default function MindBreaksScreen() {
  const { colors, primary, isDark } = useTheme();
  const responsive = useResponsive();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  // Health store
  const lastBrainGame = useHealthStore((s) => s.lastBrainGame);
  const updateLastBrainGame = useHealthStore((s) => s.updateLastBrainGame);

  // Mind breaks store — use getCurrentStreak for live streak
  const getCurrentStreak = useMindBreaksStore((s) => s.getCurrentStreak);
  const bestStreak = useMindBreaksStore((s) => s.bestStreak) ?? 0;
  const bestReactionTime = useMindBreaksStore((s) => s.bestReactionTime);
  const recordGamePlayed = useMindBreaksStore((s) => s.recordGamePlayed);
  const updateBestReactionTime = useMindBreaksStore((s) => s.updateBestReactionTime);

  const currentStreak = getCurrentStreak();

  const [activeGame, setActiveGame] = useState<GameId | "word-scramble" | "breathing-exercise" | null>(null);
  const [visitedGames, setVisitedGames] = useState<Set<string>>(new Set());

  const todaysFeaturedGame = useMemo(() => getTodaysFeaturedGame(), []);
  const dayName = useMemo(() => getDayName(), []);

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  const handleGamePress = useCallback(
    (gameId: string) => {
      triggerHaptic();
      setActiveGame(gameId as GameId);
      setVisitedGames((prev) => new Set(prev).add(gameId));
    },
    [triggerHaptic]
  );

  const handleGameComplete = useCallback(() => {
    updateLastBrainGame(new Date().toISOString());
    recordGamePlayed();
    setActiveGame(null);
    setVisitedGames(new Set());
  }, [updateLastBrainGame, recordGamePlayed]);

  const handleCloseGame = useCallback(() => {
    setActiveGame(null);
    setVisitedGames(new Set());
  }, []);

  return (
    <ScreenErrorBoundary screenName="Mind Breaks">
      <Screen variant="scroll" edges={["top"]} extraBottomPadding={0}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={true}>
          {/* Header */}
          <View style={{ paddingHorizontal: responsive.horizontalPadding, paddingTop: 24, paddingBottom: 16 }}>
            <Text
              style={{
                fontSize: responsive.scaleFont(34),
                fontWeight: "900",
                color: colors.textPrimary,
                letterSpacing: -0.5,
              }}
            >
              Mind Breaks
            </Text>
            <Text
              style={{
                fontSize: responsive.scaleFont(15),
                color: colors.textSecondary,
                marginTop: 4,
              }}
            >
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </Text>
          </View>

          {/* Streak Card */}
          {currentStreak > 0 && (
            <View className="px-6 mb-4 mt-2">
              <View
                className="rounded-2xl overflow-hidden"
                style={{
                  shadowColor: "#10B981",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                  }}
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                      style={{ backgroundColor: "rgba(255,255,255,0.95)", flexShrink: 0 }}
                    >
                      <Text style={{ fontSize: 24 }}>{"🔥"}</Text>
                    </View>

                    <View className="flex-1 mr-3">
                      <Text
                        className={`${textClasses.title} font-bold`}
                        style={{ color: "#FFFFFF" }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {currentStreak} Day Streak!
                      </Text>
                      <Text
                        className={`${textClasses.small} mt-0.5`}
                        style={{ color: "rgba(255,255,255,0.85)" }}
                        numberOfLines={1}
                      >
                        {bestStreak > currentStreak
                          ? `Best: ${bestStreak} days`
                          : "Keep up the great work!"}
                      </Text>
                    </View>

                    {/* Progress dots (7 days) */}
                    <View className="flex-row items-center" style={{ flexShrink: 0 }}>
                      {Array.from({ length: 7 }).map((_, i) => (
                        <View
                          key={i}
                          className="w-2.5 h-2.5 rounded-full mx-0.5"
                          style={{
                            backgroundColor: i < Math.min(currentStreak, 7)
                              ? "rgba(255,255,255,0.95)"
                              : "rgba(255,255,255,0.3)",
                          }}
                        />
                      ))}
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Game of the Day */}
          <FeaturedGameCard
            game={todaysFeaturedGame}
            dayName={dayName}
            onPress={() => handleGamePress(todaysFeaturedGame.id as GameId | "word-scramble")}
            colors={colors}
            textClasses={textClasses}
            hapticEnabled={hapticEnabled}
          />

          {/* All Games — NYT-style vertical stack */}
          <View style={{ paddingHorizontal: responsive.horizontalPadding, marginBottom: 8 }}>
            <Text
              style={{
                fontSize: responsive.scaleFont(24),
                fontWeight: "900",
                color: colors.textPrimary,
                marginBottom: 18,
                letterSpacing: -0.3,
              }}
            >
              All Games
            </Text>

            <View style={responsive.gridColumns >= 2 ? { flexDirection: "row", flexWrap: "wrap", gap: 10 } : undefined}>
              {GAMES.filter((g) => g.id !== todaysFeaturedGame.id).map((game) => (
                <View key={game.id} style={responsive.gridColumns >= 2 ? { width: "48.5%" } : undefined}>
                  <NYTGameCard
                    game={game}
                    onPress={() => handleGamePress(game.id as GameId)}
                    isDark={isDark}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Wellness — Breathing Exercise + Muscle Relaxation */}
          <View style={{ paddingHorizontal: responsive.horizontalPadding, marginTop: 8, marginBottom: 40 }}>
            <Text
              style={{
                fontSize: responsive.scaleFont(24),
                fontWeight: "900",
                color: colors.textPrimary,
                marginBottom: 18,
                letterSpacing: -0.3,
              }}
            >
              Wellness
            </Text>

            <Pressable
              onPress={() => handleGamePress("breathing-exercise")}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.97 : 1 }],
                opacity: pressed ? 0.95 : 1,
              })}
            >
              <View
                style={{
                  backgroundColor: isDark ? "#0A3D2A" : "#ECFDF5",
                  borderRadius: 20,
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "#D1FAE5",
                  shadowColor: "#10B981",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isDark ? 0.15 : 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                  marginBottom: 10,
                }}
              >
                <View style={{ flex: 1, marginRight: 14 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "800",
                      color: isDark ? "#FFFFFF" : "#065F46",
                    }}
                  >
                    Breathing Exercise
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: isDark ? "rgba(255,255,255,0.7)" : "#047857",
                      lineHeight: 20,
                      marginTop: 2,
                    }}
                  >
                    {"Guided breathing for relaxation"}
                  </Text>
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(6,95,70,0.12)",
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 10,
                      marginTop: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isDark ? "rgba(255,255,255,0.85)" : "#065F46",
                      }}
                    >
                      2 min
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: isDark ? "rgba(167,243,208,0.15)" : "#A7F3D0",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="leaf-outline" size={28} color={isDark ? "#A7F3D0" : "#065F46"} />
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handleGamePress("muscle-relaxation")}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.97 : 1 }],
                opacity: pressed ? 0.95 : 1,
              })}
            >
              <View
                style={{
                  backgroundColor: isDark ? "#1A1030" : "#F5F3FF",
                  borderRadius: 20,
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "#DDD6FE",
                  shadowColor: "#8B5CF6",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isDark ? 0.15 : 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View style={{ flex: 1, marginRight: 14 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "800",
                      color: isDark ? "#FFFFFF" : "#3B0764",
                    }}
                  >
                    Muscle Relaxation
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: isDark ? "rgba(255,255,255,0.7)" : "#6D28D9",
                      lineHeight: 20,
                      marginTop: 2,
                    }}
                  >
                    {"Progressive muscle relaxation"}
                  </Text>
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(59,7,100,0.1)",
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 10,
                      marginTop: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isDark ? "rgba(255,255,255,0.85)" : "#3B0764",
                      }}
                    >
                      3 min
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: isDark ? "rgba(139,92,246,0.15)" : "#DDD6FE",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="body-outline" size={28} color={isDark ? "#C4B5FD" : "#3B0764"} />
                </View>
              </View>
            </Pressable>
          </View>

          {/* Bottom padding for tab bar */}
          <View className="h-8" />
        </ScrollView>

        {/* Game Modal */}
        <Modal
          visible={activeGame !== null}
          animationType="slide"
          presentationStyle="fullScreen"
          transparent={false}
          onRequestClose={handleCloseGame}
        >
          <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <View className="flex-1">
              {/* Keep visited games mounted to preserve state when switching via tabs */}
              {visitedGames.has("word-scramble") && (
                <View style={activeGame === "word-scramble" ? { flex: 1 } : { display: "none" }}>
                  <WordScrambleGame
                    onComplete={handleGameComplete}
                    onClose={handleCloseGame}
                  />
                </View>
              )}
              {visitedGames.has("word-match") && (
                <View style={activeGame === "word-match" ? { flex: 1 } : { display: "none" }}>
                  <WordMatchGame
                    onComplete={handleGameComplete}
                    onClose={handleCloseGame}
                    colors={colors}
                    textClasses={textClasses}
                    triggerHaptic={triggerHaptic}
                    primary={primary}
                    isDark={isDark}
                    onNextGame={() => handleGamePress("number-pattern")}
                  />
                </View>
              )}
              {visitedGames.has("number-pattern") && (
                <View style={activeGame === "number-pattern" ? { flex: 1 } : { display: "none" }}>
                  <NumberPatternGame
                    onComplete={handleGameComplete}
                    onClose={handleCloseGame}
                    colors={colors}
                    textClasses={textClasses}
                    triggerHaptic={triggerHaptic}
                    primary={primary}
                    isDark={isDark}
                    onNextGame={() => handleGamePress("memory-cards")}
                  />
                </View>
              )}
              {visitedGames.has("memory-cards") && (
                <View style={activeGame === "memory-cards" ? { flex: 1 } : { display: "none" }}>
                  <MemoryCardsGame
                    onComplete={handleGameComplete}
                    onClose={handleCloseGame}
                    colors={colors}
                    textClasses={textClasses}
                    triggerHaptic={triggerHaptic}
                    primary={primary}
                    isDark={isDark}
                    onNextGame={() => handleGamePress("pattern-tap")}
                  />
                </View>
              )}
              {visitedGames.has("reaction-tap") && (
                <View style={activeGame === "reaction-tap" ? { flex: 1 } : { display: "none" }}>
                  <ReactionTapGame
                    onComplete={handleGameComplete}
                    onClose={handleCloseGame}
                    colors={colors}
                    textClasses={textClasses}
                    triggerHaptic={triggerHaptic}
                    primary={primary}
                    isDark={isDark}
                    bestTime={bestReactionTime}
                    onNewBestTime={updateBestReactionTime}
                  />
                </View>
              )}
              {visitedGames.has("pattern-tap") && (
                <View style={activeGame === "pattern-tap" ? { flex: 1 } : { display: "none" }}>
                  <PatternTapGame
                    onComplete={handleGameComplete}
                    onClose={handleCloseGame}
                    colors={colors}
                    textClasses={textClasses}
                    triggerHaptic={triggerHaptic}
                    primary={primary}
                    isDark={isDark}
                    onNextGame={() => handleGamePress("word-match")}
                  />
                </View>
              )}

              {visitedGames.has("breathing-exercise") && (
                <View style={activeGame === "breathing-exercise" ? { flex: 1 } : { display: "none" }}>
                  <BreathingExerciseGame
                    onComplete={handleGameComplete}
                    onClose={handleCloseGame}
                    colors={colors}
                    textClasses={textClasses}
                    triggerHaptic={triggerHaptic}
                    primary={primary}
                    isDark={isDark}
                  />
                </View>
              )}
              {visitedGames.has("muscle-relaxation") && (
                <View style={activeGame === "muscle-relaxation" ? { flex: 1 } : { display: "none" }}>
                  <MuscleRelaxationGame
                    onComplete={handleGameComplete}
                    onClose={handleCloseGame}
                    colors={colors}
                    textClasses={textClasses}
                    triggerHaptic={triggerHaptic}
                    primary={primary}
                    isDark={isDark}
                  />
                </View>
              )}
              {visitedGames.has("logic-grid") && (
                <View style={activeGame === "logic-grid" ? { flex: 1 } : { display: "none" }}>
                  <LogicGridPuzzleGame
                    onComplete={handleGameComplete}
                    onClose={handleCloseGame}
                    colors={colors}
                    textClasses={textClasses}
                    triggerHaptic={triggerHaptic}
                    primary={primary}
                    isDark={isDark}
                    onNextGame={() => handleGamePress("word-match")}
                  />
                </View>
              )}
            </View>

            {/* Game Switcher Tabs */}
            {activeGame && activeGame !== "breathing-exercise" && activeGame !== "muscle-relaxation" && (
              <GameSwitcherTabs
                currentGame={activeGame}
                onSwitchGame={(gameId) => handleGamePress(gameId)}
                colors={colors}
                isDark={isDark}
              />
            )}
          </View>
        </Modal>

      </Screen>
    </ScreenErrorBoundary>
  );
}

// GameProps interface for game components
interface GameProps {
  onComplete: () => void;
  onClose: () => void;
  colors: any;
  textClasses: any;
  triggerHaptic: () => void;
  primary: string;
  isDark: boolean;
}
