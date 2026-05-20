import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView, useWindowDimensions } from "react-native";
// ScrollView still used for the main game scroll container
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../utils/useTheme";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import * as Haptics from "expo-haptics";

// =============================================================================
// WORD DATA - 7 themed word sets (one per day of week)
// =============================================================================
const DAILY_WORD_SETS = {
  0: { // Sunday — words ordered shortest→longest (easy→hard)
    theme: "Relaxation",
    emoji: "☀️",
    words: [
      { word: "SPA", hint: "A place for relaxing treatments", difficulty: 1 },
      { word: "CALM", hint: "Peaceful and quiet", difficulty: 1 },
      { word: "BREEZE", hint: "A gentle wind", difficulty: 2 },
      { word: "GARDEN", hint: "A place to grow flowers and vegetables", difficulty: 2 },
      { word: "PEACEFUL", hint: "Calm and quiet, no stress", difficulty: 3 },
    ],
  },
  1: { // Monday — words ordered shortest→longest (easy→hard)
    theme: "Kitchen",
    emoji: "🍳",
    words: [
      { word: "OVEN", hint: "Where you bake a cake", difficulty: 1 },
      { word: "SPOON", hint: "You eat soup with this", difficulty: 1 },
      { word: "APRON", hint: "Protects your clothes while cooking", difficulty: 2 },
      { word: "RECIPE", hint: "Instructions for cooking", difficulty: 2 },
      { word: "SPATULA", hint: "Flat tool for flipping pancakes", difficulty: 3 },
    ],
  },
  2: { // Tuesday — words ordered shortest→longest (easy→hard)
    theme: "Nature",
    emoji: "🌿",
    words: [
      { word: "OAK", hint: "A type of tree with acorns", difficulty: 1 },
      { word: "RIVER", hint: "Flowing water", difficulty: 1 },
      { word: "FOREST", hint: "Many trees together", difficulty: 2 },
      { word: "MEADOW", hint: "A field of grass and wildflowers", difficulty: 2 },
      { word: "MOUNTAIN", hint: "Very tall land formation", difficulty: 3 },
    ],
  },
  3: { // Wednesday — words ordered shortest→longest (easy→hard)
    theme: "Travel",
    emoji: "✈️",
    words: [
      { word: "MAP", hint: "Helps you find your way", difficulty: 1 },
      { word: "BEACH", hint: "Sandy shore by the ocean", difficulty: 1 },
      { word: "HOTEL", hint: "Where you stay on vacation", difficulty: 2 },
      { word: "AIRPORT", hint: "Where planes take off and land", difficulty: 2 },
      { word: "PASSPORT", hint: "ID required for international travel", difficulty: 3 },
    ],
  },
  4: { // Thursday — words ordered shortest→longest (easy→hard)
    theme: "Family",
    emoji: "👨‍👩‍👧‍👦",
    words: [
      { word: "HUG", hint: "A warm embrace from someone you love", difficulty: 1 },
      { word: "DINNER", hint: "Evening meal together", difficulty: 2 },
      { word: "GRANDMA", hint: "Your parent's mother", difficulty: 2 },
      { word: "HOLIDAY", hint: "Special day of celebration", difficulty: 2 },
      { word: "BIRTHDAY", hint: "Annual celebration of your birth", difficulty: 3 },
    ],
  },
  5: { // Friday — words ordered shortest→longest (easy→hard)
    theme: "Music",
    emoji: "🎵",
    words: [
      { word: "DRUM", hint: "You hit it to make a beat", difficulty: 1 },
      { word: "PIANO", hint: "Keyboard instrument", difficulty: 1 },
      { word: "GUITAR", hint: "Stringed instrument", difficulty: 2 },
      { word: "MELODY", hint: "A tune you can hum", difficulty: 2 },
      { word: "CONCERT", hint: "Live music performance", difficulty: 3 },
    ],
  },
  6: { // Saturday — words ordered shortest→longest (easy→hard)
    theme: "Animals",
    emoji: "🐾",
    words: [
      { word: "OWL", hint: "A wise nocturnal bird", difficulty: 1 },
      { word: "EAGLE", hint: "Majestic bird of prey", difficulty: 1 },
      { word: "RABBIT", hint: "Hops and has long ears", difficulty: 2 },
      { word: "DOLPHIN", hint: "Smart ocean mammal", difficulty: 2 },
      { word: "PENGUIN", hint: "Bird that cannot fly but swims", difficulty: 3 },
    ],
  },
};

// Scramble a word (Fisher-Yates shuffle)
function scrambleWord(word: string): string[] {
  const letters = word.split("");
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  // Make sure it's actually scrambled
  if (letters.join("") === word) {
    return scrambleWord(word);
  }
  return letters;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
interface WordScrambleGameProps {
  onComplete: () => void;
  onClose: () => void;
}

export default function WordScrambleGame({ onComplete, onClose }: WordScrambleGameProps) {
  const { colors, isDark } = useTheme();
  const { width: screenW } = useWindowDimensions();
  const SCREEN_WIDTH = Math.min(screenW, 560);
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);
  const insets = useSafeAreaInsets();

  // Get today's word set based on day of week
  const dayOfWeek = new Date().getDay();
  const todaySet = DAILY_WORD_SETS[dayOfWeek as keyof typeof DAILY_WORD_SETS];

  // Game state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [gameState, setGameState] = useState<"playing" | "correct" | "complete">("playing");

  const currentWordData = todaySet.words[currentWordIndex];
  const currentWord = currentWordData.word;

  // Initialize/reset scrambled letters when word changes
  useEffect(() => {
    setAvailableLetters(scrambleWord(currentWord));
    setSelectedLetters([]);
    setGameState("playing");
  }, [currentWordIndex, currentWord]);

  const triggerHaptic = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticEnabled) {
      Haptics.impactAsync(style);
    }
  }, [hapticEnabled]);

  // Handle tapping an available letter
  const handleLetterTap = useCallback((letter: string, index: number) => {
    if (gameState !== "playing") return;

    triggerHaptic();

    const newSelected = [...selectedLetters, letter];
    setSelectedLetters(newSelected);

    const newAvailable = [...availableLetters];
    newAvailable.splice(index, 1);
    setAvailableLetters(newAvailable);

    // Check if word is complete
    if (newSelected.length === currentWord.length) {
      if (newSelected.join("") === currentWord) {
        // Correct!
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        setGameState("correct");

        // Auto advance after delay
        setTimeout(() => {
          if (currentWordIndex < todaySet.words.length - 1) {
            setCurrentWordIndex(currentWordIndex + 1);
          } else {
            setGameState("complete");
            onComplete();
          }
        }, 1200);
      } else {
        // Wrong - shake and reset
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => {
          setSelectedLetters([]);
          setAvailableLetters(scrambleWord(currentWord));
        }, 600);
      }
    }
  }, [selectedLetters, availableLetters, currentWord, currentWordIndex, todaySet.words.length, gameState, triggerHaptic, onComplete]);

  // Handle tapping a selected letter to remove it
  const handleSelectedTap = useCallback((letter: string, index: number) => {
    if (gameState !== "playing") return;

    triggerHaptic();

    const newSelected = [...selectedLetters];
    newSelected.splice(index, 1);
    setSelectedLetters(newSelected);

    setAvailableLetters([...availableLetters, letter]);
  }, [selectedLetters, availableLetters, gameState, triggerHaptic]);

  // Clear all selected letters
  const handleClear = useCallback(() => {
    if (gameState !== "playing") return;
    triggerHaptic();
    setSelectedLetters([]);
    setAvailableLetters(scrambleWord(currentWord));
  }, [currentWord, gameState, triggerHaptic]);

  // Calculate letter tile size — all letters must fit on one row
  const letterSize = useMemo(() => {
    const maxWidth = SCREEN_WIDTH - 32;
    const letterCount = currentWord.length;
    const gap = 8; // marginHorizontal * 2
    const calculatedSize = (maxWidth - (gap * letterCount)) / letterCount;
    // Cap at 64px so even short words don't get huge tiles
    return Math.min(Math.floor(calculatedSize), 64);
  }, [currentWord.length, SCREEN_WIDTH]);

  // =============================================================================
  // COMPLETION SCREEN
  // =============================================================================
  if (gameState === "complete") {
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
            backgroundColor: "#8B5CF6" + "08",
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
          }}
        />
        {/* Header - SENIOR-FRIENDLY: Larger close button, proper spacing */}
        <View className="flex-row items-center justify-between px-4 py-4" style={{ minHeight: 80 }}>
          <View className="flex-1 mr-3">
            <Text
              className={`${textClasses.title} font-bold`}
              style={{ color: colors.textPrimary }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Word Scramble
            </Text>
            <View className="flex-row items-center mt-1">
              <Text style={{ fontSize: 18, marginRight: 6 }}>{todaySet.emoji}</Text>
              <Text
                className={`${textClasses.small}`}
                style={{ color: colors.textSecondary }}
                numberOfLines={1}
              >
                {todaySet.theme}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.divider, flexShrink: 0 }}
          >
            <Ionicons name="close" size={28} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Success Content - SENIOR-FRIENDLY: Large text and stats */}
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ fontSize: 72 }}>🎉</Text>
          <Text
            className={`${textClasses.largeTitle} font-bold text-center mt-4`}
            style={{ color: colors.textPrimary }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            Excellent!
          </Text>
          <Text
            className={`${textClasses.body} text-center mt-3`}
            style={{ color: colors.textSecondary }}
          >
            You unscrambled all 5 words!
          </Text>

          {/* Stats - SENIOR-FRIENDLY: Large numbers */}
          <View className="flex-row mt-8 mb-10">
            <View className="items-center mx-6">
              <Text className="font-bold" style={{ color: colors.success, fontSize: 40 }}>
                5/5
              </Text>
              <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                Words Solved
              </Text>
            </View>
          </View>

          {/* Done Button - SENIOR-FRIENDLY: Large touch target */}
          <Pressable
            onPress={onClose}
            className="w-full py-5 rounded-2xl items-center"
            style={{ backgroundColor: colors.success, minHeight: 64 }}
          >
            <Text className={`${textClasses.subtitle} font-bold`} style={{ color: "#FFFFFF" }}>
              Done
            </Text>
          </Pressable>

          <Text
            className={`${textClasses.small} text-center mt-5`}
            style={{ color: colors.textTertiary }}
          >
            Come back tomorrow for new words!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =============================================================================
  // GAME SCREEN
  // =============================================================================
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Subtle gradient accent at top */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 200,
          backgroundColor: "#8B5CF6" + "08",
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }}
      />
      {/* Header — explicit safe area + horizontal padding to prevent corner clipping */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{ fontSize: 24, fontWeight: "bold", color: colors.textPrimary }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            Word Scramble
          </Text>
          <View className="flex-row items-center mt-1">
            <Text style={{ fontSize: 18, marginRight: 6 }}>{todaySet.emoji}</Text>
            <Text
              className={`${textClasses.small}`}
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {todaySet.theme} Theme
            </Text>
          </View>
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
            flexShrink: 0,
          }}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          accessibilityRole="button"
          accessibilityLabel="Close game"
        >
          <Ionicons name="close" size={28} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Scrollable Content - prevents overlap */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        {/* Progress Bar */}
        <View className="px-4 mb-4">
          <View className="flex-row items-center justify-between mb-3 flex-wrap" style={{ gap: 8 }}>
            <Text className={`${textClasses.small} font-semibold`} style={{ color: colors.textSecondary }}>
              Word {currentWordIndex + 1} of {todaySet.words.length}
            </Text>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              {[1, 2, 3].map((star) => (
                <Text key={star} style={{ fontSize: 14, opacity: star <= (currentWordData as any).difficulty ? 1 : 0.25 }}>
                  ⭐
                </Text>
              ))}
            </View>
          </View>
          <View className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: colors.divider }}>
            <View
              className="h-full rounded-full"
              style={{
                backgroundColor: colors.success,
                width: `${(currentWordIndex / todaySet.words.length) * 100}%`,
              }}
            />
          </View>
        </View>

        {/* Answer Area */}
        <View className="px-4 mb-6 mt-4">
          {/* Instructions - guaranteed spacing */}
          <View
            style={{
              minHeight: 50,
              marginBottom: 16,
              justifyContent: "center",
            }}
          >
            <Text
              className={`${textClasses.small} text-center font-medium`}
              style={{ color: colors.textSecondary }}
            >
              Tap letters to spell the word
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 8 }}>
            {currentWord.split("").map((_, index) => {
              const isCorrect = gameState === "correct";
              const hasLetter = selectedLetters[index];

              return (
                <Pressable
                  key={index}
                  onPress={() => hasLetter && handleSelectedTap(selectedLetters[index], index)}
                  disabled={!hasLetter || gameState !== "playing"}
                  style={{ width: letterSize, height: letterSize + 10, marginHorizontal: 4 }}
                >
                  <View
                    className="flex-1 rounded-2xl items-center justify-center"
                    style={{
                      backgroundColor: isCorrect
                        ? colors.success + "20"
                        : hasLetter
                        ? (isDark ? colors.cardBackground : "#EEF2FF")
                        : (isDark ? colors.cardBackground + "80" : "#F9FAFB"),
                      borderWidth: 2.5,
                      borderColor: isCorrect
                        ? colors.success
                        : hasLetter
                        ? "#6366F1"
                        : colors.border,
                      borderStyle: hasLetter ? "solid" : "dashed",
                      shadowColor: hasLetter ? "#6366F1" : "transparent",
                      shadowOffset: { width: 0, height: hasLetter ? 3 : 0 },
                      shadowOpacity: hasLetter ? 0.2 : 0,
                      shadowRadius: 6,
                      elevation: hasLetter ? 3 : 0,
                    }}
                  >
                    <Text className="font-bold" style={{ fontSize: letterSize * 0.55, color: isCorrect ? colors.success : colors.textPrimary }}>
                      {selectedLetters[index] || ""}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View
            style={{
              minHeight: 30,
              marginTop: 12,
              justifyContent: "center",
            }}
          >
            <Text className={`${textClasses.body} text-center`} style={{ color: colors.textTertiary }}>
              Tap a placed letter to remove it
            </Text>
          </View>
        </View>

        {/* Scrambled Letters */}
        <View className="px-4 mb-6" style={{ marginTop: 16 }}>
          <View className="flex-row justify-center flex-wrap">
            {availableLetters.map((letter, index) => (
              <Pressable
                key={`${letter}-${index}`}
                onPress={() => handleLetterTap(letter, index)}
                disabled={gameState !== "playing"}
                style={{ width: letterSize, height: letterSize + 10, marginHorizontal: 5, marginVertical: 5 }}
              >
                {({ pressed }) => (
                  <View
                    className="flex-1 rounded-2xl items-center justify-center"
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderWidth: 2,
                      borderColor: colors.border,
                      transform: [{ scale: pressed ? 0.92 : 1 }],
                      // Enhanced shadow for 3D effect
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: pressed ? 1 : 4 },
                      shadowOpacity: pressed ? 0.1 : 0.15,
                      shadowRadius: pressed ? 2 : 6,
                      elevation: pressed ? 2 : 4,
                    }}
                  >
                    <Text className="font-bold" style={{ fontSize: letterSize * 0.55, color: colors.textPrimary }}>
                      {letter}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-4 mt-4 mb-6">
          <Pressable
            onPress={handleClear}
            disabled={gameState !== "playing" || selectedLetters.length === 0}
            className="py-4 rounded-2xl flex-row items-center justify-center"
            style={{ backgroundColor: colors.divider, opacity: selectedLetters.length === 0 ? 0.5 : 1, minHeight: 56 }}
          >
            <Ionicons name="refresh" size={22} color={colors.textSecondary} />
            <Text className={`${textClasses.body} font-semibold ml-2`} style={{ color: colors.textSecondary }}>
              Clear
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Correct Feedback Overlay */}
      {gameState === "correct" && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <View
            style={{
              paddingHorizontal: 48,
              paddingVertical: 32,
              borderRadius: 24,
              alignItems: "center",
              backgroundColor: colors.cardBackground,
              marginHorizontal: 32,
              alignSelf: "center",
            }}
          >
            <Text style={{ fontSize: 64 }}>✅</Text>
            <Text style={{ fontSize: 32, fontWeight: "700", marginTop: 12, color: colors.success }}>
              Correct!
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
