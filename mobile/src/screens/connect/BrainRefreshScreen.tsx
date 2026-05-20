import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Screen } from "../../components/Screen";
import { useHealthStore } from "../../state/stores/healthStore";
import { useUIStore } from "../../state/stores/uiStore";
import { useTipStore } from "../../state/stores/tipStore";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import { getTextSizeClasses } from "../../utils/textSizes";
import { format, isToday, parseISO } from "date-fns";
import { useTheme } from "../../utils/useTheme";
import Button from "../../components/Button";

type GameType = "word-match" | "number-pattern" | "memory-cards";

interface BrainGame {
  id: string;
  type: GameType;
  date: string;
  completed: boolean;
  score?: number;
}

export default function BrainRefreshScreen() {
  const { colors, primary } = useTheme();

  // Settings from useSettingsStore
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  // Health data from useHealthStore
  const lastBrainGame = useHealthStore((s) => s.lastBrainGame);
  const updateLastBrainGame = useHealthStore((s) => s.updateLastBrainGame);

  // Tip state from useTipStore
  const dismissedInfoCards = useTipStore((s) => s.dismissedInfoCards || []);
  const dismissInfoCard = useTipStore((s) => s.dismissInfoCard);

  // Helper function for checking if card is dismissed
  const isCardDismissed = (cardId: string) => dismissedInfoCards.includes(cardId);

  const [currentGame, setCurrentGame] = useState<GameType | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Word Match Game State
  const [wordPairs, setWordPairs] = useState<{ word: string; match: string }[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);

  // Number Pattern Game State
  const [numberSequence, setNumberSequence] = useState<number[]>([]);
  const [missingIndex, setMissingIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [numberAnswers, setNumberAnswers] = useState<number[]>([]);

  // Memory Cards Game State
  const [memoryCards, setMemoryCards] = useState<{ id: number; icon: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);

  const todayGameCompleted = lastBrainGame && isToday(parseISO(lastBrainGame));

  useEffect(() => {
    if (!todayGameCompleted) {
      selectRandomGame();
    }
  }, []);

  const selectRandomGame = () => {
    const games: GameType[] = ["word-match", "number-pattern", "memory-cards"];
    const randomGame = games[Math.floor(Math.random() * games.length)];
    setCurrentGame(randomGame);
    initializeGame(randomGame);
  };

  const initializeGame = (type: GameType) => {
    setGameCompleted(false);
    setSelectedWord(null);
    setMatchedPairs([]);
    setSelectedAnswer(null);
    setFlippedCards([]);
    setMatchedCards([]);

    if (type === "word-match") {
      const pairs = [
        { word: "Happy", match: "Joyful" },
        { word: "Quick", match: "Fast" },
        { word: "Big", match: "Large" },
        { word: "Small", match: "Tiny" },
      ];
      setWordPairs(pairs);
    } else if (type === "number-pattern") {
      // Generate a simple pattern: adding 2, 3, or 5
      const increment = [2, 3, 5][Math.floor(Math.random() * 3)];
      const start = Math.floor(Math.random() * 10) + 1;
      const sequence = [start, start + increment, start + increment * 2, start + increment * 3, start + increment * 4];
      const missing = Math.floor(Math.random() * 4) + 1; // Don't hide first one
      setNumberSequence(sequence);
      setMissingIndex(missing);

      // Generate answer options
      const correctAnswer = sequence[missing];
      const wrongAnswers = [
        correctAnswer - increment,
        correctAnswer + increment,
        correctAnswer + 1,
      ].filter((n) => n !== correctAnswer && n > 0);
      const answers = [correctAnswer, ...wrongAnswers.slice(0, 3)].sort(() => Math.random() - 0.5);
      setNumberAnswers(answers);
    } else if (type === "memory-cards") {
      const icons = ["heart", "star", "leaf", "flower", "sunny", "moon"];
      const selectedIcons = icons.slice(0, 4);
      const cards = [...selectedIcons, ...selectedIcons]
        .map((icon, index) => ({
          id: index,
          icon,
          flipped: false,
          matched: false,
        }))
        .sort(() => Math.random() - 0.5);
      setMemoryCards(cards);
    }
  };

  const handleWordSelect = (word: string, isMatch: boolean) => {
    if (isMatch && selectedWord) {
      setMatchedPairs([...matchedPairs, selectedWord, word]);
      setSelectedWord(null);
      if (matchedPairs.length + 2 === wordPairs.length * 2) {
        completeGame();
      }
    } else if (!isMatch) {
      if (selectedWord === word) {
        setSelectedWord(null);
      } else {
        setSelectedWord(word);
      }
    }
  };

  const handleNumberAnswer = (answer: number) => {
    setSelectedAnswer(answer);
    if (answer === numberSequence[missingIndex]) {
      setTimeout(() => completeGame(), 1000);
    }
  };

  const handleCardFlip = (cardId: number) => {
    if (flippedCards.length === 2 || matchedCards.includes(cardId) || flippedCards.includes(cardId)) {
      return;
    }

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const [firstId, secondId] = newFlipped;
      const firstCard = memoryCards.find((c) => c.id === firstId);
      const secondCard = memoryCards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.icon === secondCard.icon) {
        setMatchedCards([...matchedCards, firstId, secondId]);
        setFlippedCards([]);

        if (matchedCards.length + 2 === memoryCards.length) {
          setTimeout(() => completeGame(), 500);
        }
      } else {
        setTimeout(() => setFlippedCards([]), 1000);
      }
    }
  };

  const completeGame = () => {
    setGameCompleted(true);
    updateLastBrainGame(new Date().toISOString());
  };

  const renderWordMatchGame = () => {
    const words = wordPairs.map((p) => p.word);
    const matches = wordPairs.map((p) => p.match);
    const allWords = [...words, ...matches].sort(() => Math.random() - 0.5);

    return (
      <View>
        <Text className={`${textClasses.body} mb-6 text-center`} style={{ color: colors.textSecondary }}>
          Match the words with similar meanings
        </Text>
        <View className="flex-row flex-wrap justify-center">
          {allWords.map((word) => {
            const isMatched = matchedPairs.includes(word);
            const isSelected = selectedWord === word;
            const pair = wordPairs.find((p) => p.word === word || p.match === word);
            const canMatch = selectedWord && pair && (pair.word === selectedWord || pair.match === selectedWord) && word !== selectedWord;

            return (
              <Pressable
                key={word}
                onPress={() => !isMatched && handleWordSelect(word, !!canMatch)}
                disabled={isMatched}
                style={{
                  backgroundColor: isMatched ? colors.success + "20" : isSelected ? primary + "20" : colors.cardBackground,
                  borderColor: isMatched ? colors.success : isSelected ? primary : colors.divider,
                  borderWidth: 2,
                }}
                className="m-2 px-6 py-4 rounded-xl"
                accessibilityRole="button"
              >
                <Text className={`${textClasses.body} font-semibold`} style={{ color: isMatched ? colors.success : isSelected ? primary : colors.textPrimary }}>
                  {word}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderNumberPatternGame = () => {
    const isCorrect = selectedAnswer === numberSequence[missingIndex];
    const isWrong = selectedAnswer !== null && !isCorrect;

    return (
      <View>
        <Text className={`${textClasses.body} mb-6 text-center`} style={{ color: colors.textSecondary }}>
          What number comes next in the pattern?
        </Text>
        <View className="flex-row justify-center mb-8 flex-wrap">
          {numberSequence.map((num, index) => (
            <View
              key={index}
              style={{
                backgroundColor: index === missingIndex ? primary + "20" : colors.cardBackground,
                borderColor: index === missingIndex ? primary : colors.divider,
                borderWidth: 2,
                borderStyle: index === missingIndex ? "dashed" : "solid",
              }}
              className="m-2 w-16 h-16 rounded-xl items-center justify-center"
            >
              <Text className={textClasses.subtitle} style={{ color: index === missingIndex ? primary : colors.textPrimary }}>
                {index === missingIndex ? "?" : num}
              </Text>
            </View>
          ))}
        </View>
        <Text className={`${textClasses.body} mb-4 text-center font-semibold`} style={{ color: colors.textSecondary }}>
          Choose the missing number:
        </Text>
        <View className="flex-row justify-center flex-wrap">
          {numberAnswers.map((answer) => (
            <Pressable
              key={answer}
              onPress={() => handleNumberAnswer(answer)}
              disabled={selectedAnswer !== null}
              style={{
                backgroundColor: selectedAnswer === answer
                  ? isCorrect
                    ? colors.success + "20"
                    : colors.error + "20"
                  : colors.cardBackground,
                borderColor: selectedAnswer === answer
                  ? isCorrect
                    ? colors.success
                    : colors.error
                  : colors.divider,
                borderWidth: 2,
              }}
              className="m-2 w-20 h-20 rounded-xl items-center justify-center"
              accessibilityRole="button"
            >
              <Text className={textClasses.subtitle} style={{ color: selectedAnswer === answer ? (isCorrect ? colors.success : colors.error) : colors.textPrimary }}>
                {answer}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderMemoryCardsGame = () => {
    return (
      <View>
        <Text className={`${textClasses.body} mb-6 text-center`} style={{ color: colors.textSecondary }}>
          Find all matching pairs
        </Text>
        <View className="flex-row flex-wrap justify-center">
          {memoryCards.map((card) => {
            const isFlipped = flippedCards.includes(card.id) || matchedCards.includes(card.id);
            const isMatched = matchedCards.includes(card.id);

            return (
              <Pressable
                key={card.id}
                onPress={() => handleCardFlip(card.id)}
                style={{
                  backgroundColor: isMatched ? colors.success + "20" : isFlipped ? primary + "20" : colors.divider,
                  borderColor: isMatched ? colors.success : isFlipped ? primary : colors.border,
                  borderWidth: 2,
                }}
                className="m-2 w-20 h-20 rounded-xl items-center justify-center"
                accessibilityRole="button"
              >
                {isFlipped ? (
                  <Ionicons name={card.icon as any} size={32} color={isMatched ? colors.success : primary} />
                ) : (
                  <Ionicons name="help" size={32} color={colors.textSecondary} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  if (todayGameCompleted && !currentGame) {
    return (
      <Screen variant="static" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="rounded-full p-6 mb-6" style={{ backgroundColor: colors.success + "20" }}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text className={`${textClasses.title} text-center mb-3`} style={{ color: colors.textPrimary }}>
            Great Job!
          </Text>
          <Text className={`${textClasses.body} text-center mb-8`} style={{ color: colors.textSecondary }}>
            You have completed today&apos;s brain challenge. Come back tomorrow for a new one!
          </Text>
          <Button
            title="Play Again"
            onPress={() => {
              selectRandomGame();
            }}
            variant="primary"
            size="medium"
            accessibilityLabel="Play another brain game"
          />
        </View>
      </Screen>
    );
  }

  if (gameCompleted) {
    return (
      <Screen variant="static" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="rounded-full p-6 mb-6" style={{ backgroundColor: colors.success + "20" }}>
            <Ionicons name="trophy" size={64} color={colors.success} />
          </View>
          <Text className={`${textClasses.title} text-center mb-3`} style={{ color: colors.textPrimary }}>
            Excellent Work!
          </Text>
          <Text className={`${textClasses.body} text-center mb-8`} style={{ color: colors.textSecondary }}>
            You have completed today&apos;s brain refresh challenge. Keep your mind sharp by coming back tomorrow!
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen variant="static" edges={["bottom"]}>
      <ScrollView className="flex-1 px-6 py-6">
        <View className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: colors.cardBackground }}>
          <View className="flex-row items-center mb-6">
            <View className="rounded-full p-3 mr-3" style={{ backgroundColor: colors.info + "20" }}>
              <Ionicons name="bulb" size={28} color={colors.info} />
            </View>
            <View className="flex-1">
              <Text className={textClasses.subtitle} style={{ color: colors.textPrimary }}>
                Daily Brain Refresh
              </Text>
              <Text className={textClasses.small} style={{ color: colors.textSecondary }}>
                {format(new Date(), "EEEE, MMMM d")}
              </Text>
            </View>
          </View>

          {currentGame === "word-match" && renderWordMatchGame()}
          {currentGame === "number-pattern" && renderNumberPatternGame()}
          {currentGame === "memory-cards" && renderMemoryCardsGame()}
        </View>

        {!isCardDismissed("brain-refresh-info") && (
          <View className="rounded-2xl p-5 mt-6 border-2" style={{ backgroundColor: primary + "10", borderColor: primary }}>
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={24} color={primary} />
              <Text className={`${textClasses.small} ml-3 flex-1`} style={{ color: colors.textSecondary }}>
                Daily brain challenges help keep your mind sharp and engaged. Complete one challenge per day!
              </Text>
              <Pressable
                onPress={() => dismissInfoCard("brain-refresh-info")}
                className="p-1 active:opacity-50 ml-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={primary} />
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
