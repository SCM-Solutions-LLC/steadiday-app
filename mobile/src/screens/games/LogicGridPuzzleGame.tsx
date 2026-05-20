import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// =============================================================================
// TYPES
// =============================================================================
interface LogicGridPuzzleGameProps {
  onComplete: () => void;
  onClose: () => void;
  colors: any;
  textClasses: any;
  triggerHaptic: () => void;
  primary: string;
  isDark: boolean;
  onNextGame?: () => void;
}

interface Puzzle {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  intro: string;
  categories: { name: string; items: string[] }[];
  clues: string[];
  solution: Record<string, boolean>;
}

// =============================================================================
// PUZZLES
// =============================================================================
const PUZZLES: Puzzle[] = [
  {
    title: "Garden Club Gathering",
    difficulty: "Easy",
    intro: "Four members of the Sunny Acres Garden Club each planted a different flower in a different colored pot this spring. Using the clues below, can you figure out which member planted which flower in which pot?",
    categories: [
      { name: "Member", items: ["Alice", "Brenda", "Carlos", "Diana"] },
      { name: "Flower", items: ["Roses", "Tulips", "Daisies", "Sunflowers"] },
      { name: "Pot Color", items: ["Red Pot", "Blue Pot", "Green Pot", "Yellow Pot"] },
    ],
    clues: [
      "Alice didn't plant roses or tulips, and her pot wasn't red.",
      "The person with the blue pot planted sunflowers.",
      "Carlos planted tulips but not in the green pot.",
      "Brenda's pot was red, and she didn't plant daisies.",
      "Diana didn't use the yellow pot.",
    ],
    solution: {
      "0-0,1-0": false, "0-0,1-1": false, "0-0,1-2": true, "0-0,1-3": false,
      "0-1,1-0": true, "0-1,1-1": false, "0-1,1-2": false, "0-1,1-3": false,
      "0-2,1-0": false, "0-2,1-1": true, "0-2,1-2": false, "0-2,1-3": false,
      "0-3,1-0": false, "0-3,1-1": false, "0-3,1-2": false, "0-3,1-3": true,
      "0-0,2-0": false, "0-0,2-1": false, "0-0,2-2": true, "0-0,2-3": false,
      "0-1,2-0": true, "0-1,2-1": false, "0-1,2-2": false, "0-1,2-3": false,
      "0-2,2-0": false, "0-2,2-1": false, "0-2,2-2": false, "0-2,2-3": true,
      "0-3,2-0": false, "0-3,2-1": true, "0-3,2-2": false, "0-3,2-3": false,
      "1-0,2-0": true, "1-0,2-1": false, "1-0,2-2": false, "1-0,2-3": false,
      "1-1,2-0": false, "1-1,2-1": false, "1-1,2-2": false, "1-1,2-3": true,
      "1-2,2-0": false, "1-2,2-1": false, "1-2,2-2": true, "1-2,2-3": false,
      "1-3,2-0": false, "1-3,2-1": true, "1-3,2-2": false, "1-3,2-3": false,
    },
  },
  {
    title: "Morning Coffee Run",
    difficulty: "Easy",
    intro: "Four coworkers each ordered a different drink at the coffee shop and sat at a different table. Using the clues, determine who ordered what and where they sat.",
    categories: [
      { name: "Person", items: ["Frank", "Grace", "Henry", "Irene"] },
      { name: "Drink", items: ["Latte", "Espresso", "Mocha", "Tea"] },
      { name: "Table", items: ["Window", "Corner", "Patio", "Counter"] },
    ],
    clues: [
      "Frank sat at the window but didn't order a latte.",
      "The person who ordered tea sat at the counter.",
      "Grace didn't order espresso and didn't sit at the patio.",
      "Henry ordered a mocha.",
      "Irene didn't sit at the corner.",
    ],
    solution: {
      "0-0,1-0": false, "0-0,1-1": true, "0-0,1-2": false, "0-0,1-3": false,
      "0-1,1-0": true, "0-1,1-1": false, "0-1,1-2": false, "0-1,1-3": false,
      "0-2,1-0": false, "0-2,1-1": false, "0-2,1-2": true, "0-2,1-3": false,
      "0-3,1-0": false, "0-3,1-1": false, "0-3,1-2": false, "0-3,1-3": true,
      "0-0,2-0": true, "0-0,2-1": false, "0-0,2-2": false, "0-0,2-3": false,
      "0-1,2-0": false, "0-1,2-1": true, "0-1,2-2": false, "0-1,2-3": false,
      "0-2,2-0": false, "0-2,2-1": false, "0-2,2-2": true, "0-2,2-3": false,
      "0-3,2-0": false, "0-3,2-1": false, "0-3,2-2": false, "0-3,2-3": true,
      "1-0,2-0": false, "1-0,2-1": true, "1-0,2-2": false, "1-0,2-3": false,
      "1-1,2-0": true, "1-1,2-1": false, "1-1,2-2": false, "1-1,2-3": false,
      "1-2,2-0": false, "1-2,2-1": false, "1-2,2-2": true, "1-2,2-3": false,
      "1-3,2-0": false, "1-3,2-1": false, "1-3,2-2": false, "1-3,2-3": true,
    },
  },
  {
    title: "Book Club Picks",
    difficulty: "Medium",
    intro: "Four members of a book club each chose a different genre for this month's read and each prefers reading at a different time of day. Can you match each member to their genre and preferred reading time?",
    categories: [
      { name: "Member", items: ["Olivia", "Paul", "Quinn", "Rosa"] },
      { name: "Genre", items: ["Mystery", "Romance", "Sci-Fi", "Biography"] },
      { name: "Time", items: ["Morning", "Afternoon", "Evening", "Night"] },
    ],
    clues: [
      "Quinn picked sci-fi and reads in the afternoon.",
      "The person who chose romance reads in the evening.",
      "Olivia reads in the morning and didn't pick mystery.",
      "Paul doesn't read at night.",
      "Rosa didn't pick biography.",
    ],
    solution: {
      "0-0,1-0": false, "0-0,1-1": false, "0-0,1-2": false, "0-0,1-3": true,
      "0-1,1-0": false, "0-1,1-1": true, "0-1,1-2": false, "0-1,1-3": false,
      "0-2,1-0": false, "0-2,1-1": false, "0-2,1-2": true, "0-2,1-3": false,
      "0-3,1-0": true, "0-3,1-1": false, "0-3,1-2": false, "0-3,1-3": false,
      "0-0,2-0": true, "0-0,2-1": false, "0-0,2-2": false, "0-0,2-3": false,
      "0-1,2-0": false, "0-1,2-1": false, "0-1,2-2": true, "0-1,2-3": false,
      "0-2,2-0": false, "0-2,2-1": true, "0-2,2-2": false, "0-2,2-3": false,
      "0-3,2-0": false, "0-3,2-1": false, "0-3,2-2": false, "0-3,2-3": true,
      "1-0,2-0": false, "1-0,2-1": false, "1-0,2-2": false, "1-0,2-3": true,
      "1-1,2-0": false, "1-1,2-1": false, "1-1,2-2": true, "1-1,2-3": false,
      "1-2,2-0": false, "1-2,2-1": true, "1-2,2-2": false, "1-2,2-3": false,
      "1-3,2-0": true, "1-3,2-1": false, "1-3,2-2": false, "1-3,2-3": false,
    },
  },
  {
    title: "Pet Show Ribbons",
    difficulty: "Medium",
    intro: "At the annual Sunny Acres Pet Show, four owners each entered a different type of pet and won a different colored ribbon. Use the clues to match each owner with their pet and ribbon!",
    categories: [
      { name: "Owner", items: ["Tom", "Uma", "Victor", "Wendy"] },
      { name: "Pet", items: ["Dog", "Cat", "Parrot", "Rabbit"] },
      { name: "Ribbon", items: ["Gold", "Silver", "Bronze", "White"] },
    ],
    clues: [
      "Tom didn't enter the dog or the cat.",
      "The parrot owner won the gold ribbon.",
      "Uma won the silver ribbon but didn't enter the rabbit.",
      "Victor didn't win the bronze ribbon.",
      "Wendy entered the dog.",
      "The rabbit owner won the white ribbon.",
    ],
    solution: {
      "0-0,1-0": false, "0-0,1-1": false, "0-0,1-2": true, "0-0,1-3": false,
      "0-1,1-0": false, "0-1,1-1": true, "0-1,1-2": false, "0-1,1-3": false,
      "0-2,1-0": false, "0-2,1-1": false, "0-2,1-2": false, "0-2,1-3": true,
      "0-3,1-0": true, "0-3,1-1": false, "0-3,1-2": false, "0-3,1-3": false,
      "0-0,2-0": true, "0-0,2-1": false, "0-0,2-2": false, "0-0,2-3": false,
      "0-1,2-0": false, "0-1,2-1": true, "0-1,2-2": false, "0-1,2-3": false,
      "0-2,2-0": false, "0-2,2-1": false, "0-2,2-2": false, "0-2,2-3": true,
      "0-3,2-0": false, "0-3,2-1": false, "0-3,2-2": true, "0-3,2-3": false,
      "1-0,2-0": false, "1-0,2-1": false, "1-0,2-2": true, "1-0,2-3": false,
      "1-1,2-0": false, "1-1,2-1": true, "1-1,2-2": false, "1-1,2-3": false,
      "1-2,2-0": true, "1-2,2-1": false, "1-2,2-2": false, "1-2,2-3": false,
      "1-3,2-0": false, "1-3,2-1": false, "1-3,2-2": false, "1-3,2-3": true,
    },
  },
  {
    title: "Neighborhood Block Party",
    difficulty: "Hard",
    intro: "Five neighbors on Maple Street each brought a different dish to the annual block party. Each neighbor lives at a different house number. Using the clues, figure out who brought what and where they live!",
    categories: [
      { name: "Neighbor", items: ["Ed", "Fiona", "George", "Helen", "Ivan"] },
      { name: "Dish", items: ["Lasagna", "Coleslaw", "Brownies", "Potato Salad", "Cornbread"] },
      { name: "House", items: ["#12", "#14", "#16", "#18", "#20"] },
    ],
    clues: [
      "Fiona brought the lasagna and lives at house #12.",
      "The person from house #20 brought cornbread.",
      "Ed lives at #18 and didn't bring potato salad or coleslaw.",
      "Helen doesn't live at #16 or #20.",
      "Ivan doesn't live at #12 or #14, and he didn't bring cornbread.",
      "The person at #14 brought potato salad.",
      "George doesn't live at #16.",
    ],
    solution: {
      "0-0,1-0": false, "0-0,1-1": false, "0-0,1-2": true, "0-0,1-3": false, "0-0,1-4": false,
      "0-1,1-0": true, "0-1,1-1": false, "0-1,1-2": false, "0-1,1-3": false, "0-1,1-4": false,
      "0-2,1-0": false, "0-2,1-1": false, "0-2,1-2": false, "0-2,1-3": false, "0-2,1-4": true,
      "0-3,1-0": false, "0-3,1-1": false, "0-3,1-2": false, "0-3,1-3": true, "0-3,1-4": false,
      "0-4,1-0": false, "0-4,1-1": true, "0-4,1-2": false, "0-4,1-3": false, "0-4,1-4": false,
      "0-0,2-0": false, "0-0,2-1": false, "0-0,2-2": false, "0-0,2-3": true, "0-0,2-4": false,
      "0-1,2-0": true, "0-1,2-1": false, "0-1,2-2": false, "0-1,2-3": false, "0-1,2-4": false,
      "0-2,2-0": false, "0-2,2-1": false, "0-2,2-2": false, "0-2,2-3": false, "0-2,2-4": true,
      "0-3,2-0": false, "0-3,2-1": true, "0-3,2-2": false, "0-3,2-3": false, "0-3,2-4": false,
      "0-4,2-0": false, "0-4,2-1": false, "0-4,2-2": true, "0-4,2-3": false, "0-4,2-4": false,
      "1-0,2-0": true, "1-0,2-1": false, "1-0,2-2": false, "1-0,2-3": false, "1-0,2-4": false,
      "1-1,2-0": false, "1-1,2-1": false, "1-1,2-2": true, "1-1,2-3": false, "1-1,2-4": false,
      "1-2,2-0": false, "1-2,2-1": false, "1-2,2-2": false, "1-2,2-3": true, "1-2,2-4": false,
      "1-3,2-0": false, "1-3,2-1": true, "1-3,2-2": false, "1-3,2-3": false, "1-3,2-4": false,
      "1-4,2-0": false, "1-4,2-1": false, "1-4,2-2": false, "1-4,2-3": false, "1-4,2-4": true,
    },
  },
  {
    title: "Vacation Postcards",
    difficulty: "Hard",
    intro: "Five friends each went on vacation to a different destination and each sent a postcard featuring a different landmark. Can you figure out who went where and which landmark was on their postcard?",
    categories: [
      { name: "Friend", items: ["Amy", "Ben", "Clara", "David", "Elena"] },
      { name: "Destination", items: ["Hawaii", "London", "Paris", "Tokyo", "Rome"] },
      { name: "Landmark", items: ["Eiffel Tower", "Colosseum", "Big Ben", "Mt. Fuji", "Diamond Head"] },
    ],
    clues: [
      "The person who went to Paris sent a postcard of the Eiffel Tower.",
      "Ben went to Tokyo but his postcard didn't show Mount Fuji.",
      "Clara didn't go to Hawaii or Rome.",
      "The person who went to Rome sent a postcard of the Colosseum.",
      "Amy's postcard featured Diamond Head.",
      "Elena didn't go to London, and her postcard didn't show Big Ben.",
      "David didn't go to Paris.",
      "The person who went to London sent a postcard of Mount Fuji.",
    ],
    solution: {
      "0-0,1-0": true, "0-0,1-1": false, "0-0,1-2": false, "0-0,1-3": false, "0-0,1-4": false,
      "0-1,1-0": false, "0-1,1-1": false, "0-1,1-2": false, "0-1,1-3": true, "0-1,1-4": false,
      "0-2,1-0": false, "0-2,1-1": true, "0-2,1-2": false, "0-2,1-3": false, "0-2,1-4": false,
      "0-3,1-0": false, "0-3,1-1": false, "0-3,1-2": false, "0-3,1-3": false, "0-3,1-4": true,
      "0-4,1-0": false, "0-4,1-1": false, "0-4,1-2": true, "0-4,1-3": false, "0-4,1-4": false,
      "0-0,2-0": false, "0-0,2-1": false, "0-0,2-2": false, "0-0,2-3": false, "0-0,2-4": true,
      "0-1,2-0": false, "0-1,2-1": false, "0-1,2-2": true, "0-1,2-3": false, "0-1,2-4": false,
      "0-2,2-0": false, "0-2,2-1": false, "0-2,2-2": false, "0-2,2-3": true, "0-2,2-4": false,
      "0-3,2-0": false, "0-3,2-1": true, "0-3,2-2": false, "0-3,2-3": false, "0-3,2-4": false,
      "0-4,2-0": true, "0-4,2-1": false, "0-4,2-2": false, "0-4,2-3": false, "0-4,2-4": false,
      "1-0,2-0": false, "1-0,2-1": false, "1-0,2-2": false, "1-0,2-3": false, "1-0,2-4": true,
      "1-1,2-0": false, "1-1,2-1": false, "1-1,2-2": false, "1-1,2-3": true, "1-1,2-4": false,
      "1-2,2-0": true, "1-2,2-1": false, "1-2,2-2": false, "1-2,2-3": false, "1-2,2-4": false,
      "1-3,2-0": false, "1-3,2-1": false, "1-3,2-2": true, "1-3,2-3": false, "1-3,2-4": false,
      "1-4,2-0": false, "1-4,2-1": true, "1-4,2-2": false, "1-4,2-3": false, "1-4,2-4": false,
    },
  },
];

// =============================================================================
// CELL KEY HELPER
// =============================================================================
const getCellKey = (
  rowCatIdx: number,
  rowItemIdx: number,
  colCatIdx: number,
  colItemIdx: number
): string => {
  const a = `${Math.min(rowCatIdx, colCatIdx)}-${rowCatIdx < colCatIdx ? rowItemIdx : colItemIdx}`;
  const b = `${Math.max(rowCatIdx, colCatIdx)}-${rowCatIdx < colCatIdx ? colItemIdx : rowItemIdx}`;
  return `${a},${b}`;
};

// =============================================================================
// RESPONSIVE GRID SIZING — increased sizes for 50+ readability
// =============================================================================
const MAX_GRID_WIDTH = 600;
const GRID_PADDING = 12;

const calculateGridSizes = (itemCount: number, screenWidth: number) => {
  const effectiveWidth = Math.min(screenWidth, MAX_GRID_WIDTH);
  const availableWidth = effectiveWidth - 2 * GRID_PADDING;

  const catLabelWidth = 28;
  const baseRowLabelWidth = itemCount <= 4 ? 90 : 78;
  const rowLabelWidth = Math.min(
    baseRowLabelWidth,
    Math.max(50, availableWidth * 0.18)
  );

  const totalCellColumns = 2 * itemCount;
  const cellSize = Math.floor(
    (availableWidth - catLabelWidth - rowLabelWidth) / totalCellColumns
  );
  const finalCellSize = Math.min(Math.max(cellSize, 34), 56);

  const cellFontSize = Math.max(Math.floor(finalCellSize * 0.5), 13);
  const rowLabelFontSize = Math.min(Math.max(Math.floor(finalCellSize * 0.4), 12), 16);
  const colHeaderFontSize = Math.min(Math.max(Math.floor(finalCellSize * 0.35), 12), 14);

  return {
    catLabelWidth,
    rowLabelWidth,
    cellSize: finalCellSize,
    cellFontSize,
    rowLabelFontSize,
    colHeaderFontSize,
    maxGridWidth: effectiveWidth,
  };
};

// =============================================================================
// PUZZLE PROGRESSION
// =============================================================================
const getNextPuzzle = (currentIndex: number): number => {
  const current = PUZZLES[currentIndex];
  const diffOrder: Array<"Easy" | "Medium" | "Hard"> = ["Easy", "Medium", "Hard"];

  // Try same difficulty first
  const sameDifficulty = PUZZLES
    .map((p, i) => ({ puzzle: p, index: i }))
    .filter((p) => p.puzzle.difficulty === current.difficulty && p.index !== currentIndex);

  if (sameDifficulty.length > 0) {
    return sameDifficulty[Math.floor(Math.random() * sameDifficulty.length)].index;
  }

  // Move to next difficulty
  const nextDiffIdx = diffOrder.indexOf(current.difficulty) + 1;
  if (nextDiffIdx < diffOrder.length) {
    const nextDiff = diffOrder[nextDiffIdx];
    const harder = PUZZLES
      .map((p, i) => ({ puzzle: p, index: i }))
      .filter((p) => p.puzzle.difficulty === nextDiff);
    if (harder.length > 0) {
      return harder[Math.floor(Math.random() * harder.length)].index;
    }
  }

  // Wrap around
  return Math.floor(Math.random() * PUZZLES.length);
};

const getInitialPuzzleIndex = (): number => {
  // Use date-based seed to show a different puzzle each day
  const today = new Date();
  const daySeed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
  return daySeed % PUZZLES.length;
};

// =============================================================================
// GRID CELL COMPONENT
// =============================================================================
interface GridCellProps {
  cellKey: string;
  mark: boolean | null;
  highlight: "correct" | "wrong" | undefined;
  disabled: boolean;
  onPress: (key: string) => void;
  gridColors: any;
  cellSize: number;
  cellFontSize: number;
}

const GridCell = React.memo(function GridCell({
  cellKey,
  mark,
  highlight,
  disabled,
  onPress,
  gridColors,
  cellSize,
  cellFontSize,
}: GridCellProps) {
  let bgColor = gridColors.cellBg;
  if (disabled && mark === undefined) {
    bgColor = gridColors.cellBgDisabled;
  } else if (highlight === "correct") {
    bgColor = gridColors.highlightCorrect;
  } else if (highlight === "wrong") {
    bgColor = gridColors.highlightWrong;
  } else if (mark === false) {
    bgColor = gridColors.cellBgX;
  } else if (mark === true) {
    bgColor = gridColors.cellBgCheck;
  }

  const label =
    mark === false ? "Marked X" : mark === true ? "Marked check" : "Empty";

  return (
    <Pressable
      onPress={disabled ? undefined : () => onPress(cellKey)}
      disabled={disabled}
      accessibilityLabel={`Grid cell ${cellKey}, ${label}`}
      accessibilityRole="button"
      style={{
        width: cellSize,
        height: cellSize,
        backgroundColor: bgColor,
        borderWidth: 0.5,
        borderColor: gridColors.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {mark === false && (
        <Text
          style={{
            fontSize: cellFontSize,
            fontWeight: "700",
            color: gridColors.xColor,
          }}
        >
          X
        </Text>
      )}
      {mark === true && (
        <Ionicons
          name="checkmark"
          size={cellFontSize + 2}
          color={gridColors.checkColor}
        />
      )}
    </Pressable>
  );
});

// =============================================================================
// MAIN COMPONENT — launches directly into a puzzle (no selection screen)
// =============================================================================
const LogicGridPuzzleGame: React.FC<LogicGridPuzzleGameProps> = ({
  onComplete,
  onClose,
  colors,
  textClasses,
  triggerHaptic,
  primary,
  isDark,
  onNextGame,
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // State — launch directly into a puzzle
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(() => getInitialPuzzleIndex());
  const [marks, setMarks] = useState<Record<string, boolean | null>>({});
  const [solvedClues, setSolvedClues] = useState<Set<number>>(new Set());
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [won, setWon] = useState(false);
  const [highlights, setHighlights] = useState<Record<string, "correct" | "wrong">>({});
  const [notes, setNotes] = useState("");
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTriggeredComplete = useRef(false);

  const puzzle = PUZZLES[currentPuzzleIndex];

  // Grid colors
  const gridColors = useMemo(
    () => ({
      cellBg: isDark ? colors.cardBackground : "#FFFFFF",
      cellBgX: isDark ? "#4A2525" : "#FFF5F5",
      cellBgCheck: isDark ? "#1E4A1E" : "#E8F5E9",
      cellBgDisabled: isDark ? "#2A2A2A" : "#E8E5DC",
      border: isDark ? colors.border : "#C5BFA7",
      headerBg: isDark ? colors.surfaceSubtle : "#F4F1E8",
      catLabel0: primary,
      catLabel1: isDark ? "#7EBDAA" : "#5A7D6A",
      catLabel2: isDark ? "#C4A882" : "#7A6B5A",
      xColor: isDark ? "#FF8A80" : "#B55454",
      checkColor: isDark ? "#A5D6A7" : "#2E7D32",
      highlightCorrect: isDark ? "#2E7D32" : "#D4EDDA",
      highlightWrong: isDark ? "#D32F2F" : "#F8D7DA",
    }),
    [isDark, colors, primary]
  );

  // Responsive grid sizes
  const gridSizes = useMemo(() => {
    return calculateGridSizes(puzzle.categories[0].items.length, screenWidth);
  }, [puzzle, screenWidth]);

  // Timer
  useEffect(() => {
    if (timerRunning && !won) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, won]);

  const formatTime = useCallback((seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  // Check solution
  const checkSolution = useCallback(() => {
    const solution = puzzle.solution;
    const allKeys = Object.keys(solution);
    const allFilled = allKeys.every((key) => marks[key] !== undefined && marks[key] !== null);

    if (!allFilled) return;

    let allCorrect = true;
    const newHighlights: Record<string, "correct" | "wrong"> = {};

    for (const key of allKeys) {
      if (marks[key] === solution[key]) {
        newHighlights[key] = "correct";
      } else {
        newHighlights[key] = "wrong";
        allCorrect = false;
      }
    }

    setHighlights(newHighlights);

    if (allCorrect) {
      setWon(true);
      setTimerRunning(false);
      triggerHaptic();
      if (!hasTriggeredComplete.current) {
        hasTriggeredComplete.current = true;
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } else {
      setTimeout(() => {
        setHighlights({});
      }, 2000);
    }
  }, [puzzle, marks, onComplete, triggerHaptic]);

  // Auto-check when all cells filled
  useEffect(() => {
    if (won) return;
    const solution = puzzle.solution;
    const allKeys = Object.keys(solution);
    const allFilled = allKeys.every((key) => marks[key] !== undefined && marks[key] !== null);
    if (allFilled) {
      checkSolution();
    }
  }, [marks, puzzle, won, checkSolution]);

  // Manual check
  const handleManualCheck = useCallback(() => {
    triggerHaptic();
    const solution = puzzle.solution;
    const allKeys = Object.keys(solution);
    const newHighlights: Record<string, "correct" | "wrong"> = {};
    let allCorrect = true;

    for (const key of allKeys) {
      const mark = marks[key];
      if (mark === undefined || mark === null) continue;
      if (mark === solution[key]) {
        newHighlights[key] = "correct";
      } else {
        newHighlights[key] = "wrong";
        allCorrect = false;
      }
    }

    setHighlights(newHighlights);

    const allFilled = allKeys.every((key) => marks[key] !== undefined && marks[key] !== null);
    if (allFilled && allCorrect) {
      setWon(true);
      setTimerRunning(false);
      if (!hasTriggeredComplete.current) {
        hasTriggeredComplete.current = true;
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } else {
      setTimeout(() => {
        setHighlights({});
      }, 2000);
    }
  }, [puzzle, marks, onComplete, triggerHaptic]);

  // Cell press handler
  const handleCellPress = useCallback(
    (key: string) => {
      if (won) return;
      triggerHaptic();

      if (!timerRunning) {
        setTimerRunning(true);
      }

      setMarks((prev) => {
        const current = prev[key];
        let next: boolean | null;
        if (current === undefined || current === null) {
          next = false; // empty -> X
        } else if (current === false) {
          next = true; // X -> check
        } else {
          next = null; // check -> empty
        }
        return { ...prev, [key]: next };
      });
    },
    [won, timerRunning, triggerHaptic]
  );

  // Toggle clue strikethrough
  const toggleClue = useCallback((idx: number) => {
    triggerHaptic();
    setSolvedClues((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, [triggerHaptic]);

  // Clear grid
  const handleClearGrid = useCallback(() => {
    triggerHaptic();
    setMarks({});
    setHighlights({});
    setSolvedClues(new Set());
    setTimerRunning(false);
    setTimerSeconds(0);
    setWon(false);
    setNotes("");
    hasTriggeredComplete.current = false;
  }, [triggerHaptic]);

  // Next puzzle
  const handleNextPuzzle = useCallback(() => {
    triggerHaptic();
    const nextIdx = getNextPuzzle(currentPuzzleIndex);
    setCurrentPuzzleIndex(nextIdx);
    setMarks({});
    setHighlights({});
    setSolvedClues(new Set());
    setTimerRunning(false);
    setTimerSeconds(0);
    setWon(false);
    setNotes("");
    setHowToPlayOpen(false);
    hasTriggeredComplete.current = false;
  }, [currentPuzzleIndex, triggerHaptic]);

  // Difficulty badge colors
  const getDifficultyColors = (diff: string) => {
    if (diff === "Easy") {
      return {
        bg: isDark ? "#1E4A1E" : "#D4EDDA",
        text: isDark ? "#A5D6A7" : "#155724",
      };
    }
    if (diff === "Medium") {
      return {
        bg: isDark ? "#4A3A20" : "#FFF3CD",
        text: isDark ? "#FFE082" : "#856404",
      };
    }
    return {
      bg: isDark ? "#4A1E1E" : "#F8D7DA",
      text: isDark ? "#FF8A80" : "#721C24",
    };
  };

  // =========================================================================
  // PUZZLE PLAY SCREEN
  // =========================================================================
  const cat0 = puzzle.categories[0];
  const cat1 = puzzle.categories[1];
  const cat2 = puzzle.categories[2];
  const itemCount = cat0.items.length;

  const catLabelColors = [gridColors.catLabel0, gridColors.catLabel1, gridColors.catLabel2];
  const diffColors = getDifficultyColors(puzzle.difficulty);

  const activeClueIndices = puzzle.clues.map((_, i) => i).filter((i) => !solvedClues.has(i));
  const solvedClueIndices = puzzle.clues.map((_, i) => i).filter((i) => solvedClues.has(i));

  const renderColumnHeaders = () => {
    const allCols = [
      ...cat1.items.map((item, i) => ({ item, catIdx: 1, itemIdx: i })),
      ...cat2.items.map((item, i) => ({ item, catIdx: 2, itemIdx: i })),
    ];

    const headerHeight = 110;

    return (
      <View className="flex-row" style={{ marginLeft: gridSizes.catLabelWidth + gridSizes.rowLabelWidth }}>
        {allCols.map((col, i) => (
          <View
            key={`colhdr-${i}`}
            style={{
              width: gridSizes.cellSize,
              height: headerHeight,
              backgroundColor: gridColors.headerBg,
              borderWidth: 0.5,
              borderColor: gridColors.border,
              overflow: "visible",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: headerHeight - 10,
                height: gridSizes.cellSize,
                transform: [{ rotate: "-90deg" }],
                alignItems: "flex-start",
                justifyContent: "center",
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                style={{
                  fontSize: Math.max(gridSizes.colHeaderFontSize, 12),
                  fontWeight: "700",
                  color: catLabelColors[col.catIdx],
                  textAlign: "left",
                }}
              >
                {col.item}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderCatNameHeaders = () => (
    <View className="flex-row" style={{ marginLeft: gridSizes.catLabelWidth + gridSizes.rowLabelWidth }}>
      <View
        style={{
          width: gridSizes.cellSize * itemCount,
          height: 24,
          backgroundColor: gridColors.headerBg,
          borderWidth: 0.5,
          borderColor: gridColors.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={{
            fontSize: gridSizes.colHeaderFontSize + 2,
            fontWeight: "700",
            color: catLabelColors[1],
          }}
        >
          {cat1.name}
        </Text>
      </View>
      <View
        style={{
          width: gridSizes.cellSize * itemCount,
          height: 24,
          backgroundColor: gridColors.headerBg,
          borderWidth: 0.5,
          borderColor: gridColors.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={{
            fontSize: gridSizes.colHeaderFontSize + 2,
            fontWeight: "700",
            color: catLabelColors[2],
          }}
        >
          {cat2.name}
        </Text>
      </View>
    </View>
  );

  const renderCategoryLabel = (text: string, catIdx: number, rowSpan: number) => (
    <View
      style={{
        width: gridSizes.catLabelWidth,
        height: gridSizes.cellSize * rowSpan,
        backgroundColor: gridColors.headerBg,
        borderWidth: 0.5,
        borderColor: gridColors.border,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          transform: [{ rotate: "-90deg" }],
          width: gridSizes.cellSize * rowSpan - 4,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={{
            fontSize: gridSizes.rowLabelFontSize,
            fontWeight: "700",
            color: catLabelColors[catIdx],
            textAlign: "center",
          }}
        >
          {text}
        </Text>
      </View>
    </View>
  );

  const renderTopSection = () => {
    return (
      <View className="flex-row">
        {renderCategoryLabel(cat0.name, 0, itemCount)}
        <View>
          {cat0.items.map((rowItem, rowItemIdx) => (
            <View key={`toprow-${rowItemIdx}`} className="flex-row">
              <View
                style={{
                  width: gridSizes.rowLabelWidth,
                  height: gridSizes.cellSize,
                  backgroundColor: gridColors.headerBg,
                  borderWidth: 0.5,
                  borderColor: gridColors.border,
                  alignItems: "flex-end",
                  justifyContent: "center",
                  paddingRight: 4,
                  paddingLeft: 2,
                }}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                  style={{
                    fontSize: gridSizes.rowLabelFontSize,
                    fontWeight: "600",
                    color: catLabelColors[0],
                    textAlign: "right",
                  }}
                >
                  {rowItem}
                </Text>
              </View>

              {cat1.items.map((_, colItemIdx) => {
                const key = getCellKey(0, rowItemIdx, 1, colItemIdx);
                return (
                  <GridCell
                    key={key}
                    cellKey={key}
                    mark={marks[key] ?? null}
                    highlight={highlights[key]}
                    disabled={won}
                    onPress={handleCellPress}
                    gridColors={gridColors}
                    cellSize={gridSizes.cellSize}
                    cellFontSize={gridSizes.cellFontSize}
                  />
                );
              })}

              {cat2.items.map((_, colItemIdx) => {
                const key = getCellKey(0, rowItemIdx, 2, colItemIdx);
                return (
                  <GridCell
                    key={key}
                    cellKey={key}
                    mark={marks[key] ?? null}
                    highlight={highlights[key]}
                    disabled={won}
                    onPress={handleCellPress}
                    gridColors={gridColors}
                    cellSize={gridSizes.cellSize}
                    cellFontSize={gridSizes.cellFontSize}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderBottomSection = () => {
    return (
      <View className="flex-row">
        {renderCategoryLabel(cat2.name, 2, itemCount)}
        <View>
          {cat2.items.map((rowItem, rowItemIdx) => (
            <View key={`botrow-${rowItemIdx}`} className="flex-row">
              <View
                style={{
                  width: gridSizes.rowLabelWidth,
                  height: gridSizes.cellSize,
                  backgroundColor: gridColors.headerBg,
                  borderWidth: 0.5,
                  borderColor: gridColors.border,
                  alignItems: "flex-end",
                  justifyContent: "center",
                  paddingRight: 4,
                  paddingLeft: 2,
                }}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                  style={{
                    fontSize: gridSizes.rowLabelFontSize,
                    fontWeight: "600",
                    color: catLabelColors[2],
                    textAlign: "right",
                  }}
                >
                  {rowItem}
                </Text>
              </View>

              {cat1.items.map((_, colItemIdx) => {
                const key = getCellKey(2, rowItemIdx, 1, colItemIdx);
                return (
                  <GridCell
                    key={key}
                    cellKey={key}
                    mark={marks[key] ?? null}
                    highlight={highlights[key]}
                    disabled={won}
                    onPress={handleCellPress}
                    gridColors={gridColors}
                    cellSize={gridSizes.cellSize}
                    cellFontSize={gridSizes.cellFontSize}
                  />
                );
              })}

              {cat2.items.map((_, colItemIdx) => (
                <View
                  key={`disabled-${rowItemIdx}-${colItemIdx}`}
                  style={{
                    width: gridSizes.cellSize,
                    height: gridSizes.cellSize,
                    backgroundColor: gridColors.cellBgDisabled,
                    borderWidth: 0.5,
                    borderColor: gridColors.border,
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background, paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={onClose}
          className="mr-3"
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isDark ? colors.surfaceSubtle : "#F0EDE4",
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Ionicons
            name="close"
            size={26}
            color={isDark ? "#FFFFFF" : "#333333"}
          />
        </Pressable>
        <View className="flex-1" />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.textSecondary,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatTime(timerSeconds)}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title + Difficulty */}
        <View className="px-4 mb-2">
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: 4,
            }}
          >
            {puzzle.title}
          </Text>
          <View className="flex-row items-center mb-2">
            <View
              style={{
                backgroundColor: diffColors.bg,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: diffColors.text,
                }}
              >
                {puzzle.difficulty.toUpperCase()}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                color: colors.textTertiary,
                marginLeft: 8,
              }}
            >
              Puzzle {currentPuzzleIndex + 1} of {PUZZLES.length} {"\u00B7"} {itemCount} items per category
            </Text>
          </View>
        </View>

        {/* Intro */}
        <View className="px-4 mb-3">
          <Text
            style={{
              fontSize: 18,
              color: colors.textSecondary,
              lineHeight: 26,
              fontStyle: "italic",
            }}
          >
            {puzzle.intro}
          </Text>
        </View>

        {/* Victory Banner */}
        {won && (
          <View
            className="mx-4 mb-4"
            style={{
              backgroundColor: isDark ? "#1B5E2030" : "#D4EDDA",
              borderWidth: 2,
              borderColor: isDark ? "#4CAF50" : "#82C091",
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 32 }}>{"\uD83C\uDF89"}</Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: isDark ? "#B9F6CA" : "#256029",
              }}
            >
              Puzzle Complete!
            </Text>
            <Text
              style={{
                fontSize: 17,
                color: isDark ? "#C8E6C9" : "#3A7A3E",
                marginTop: 4,
              }}
            >
              Solved in {formatTime(timerSeconds)}
            </Text>

            {/* Next Puzzle Button */}
            <Pressable
              onPress={handleNextPuzzle}
              style={{
                backgroundColor: primary,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 32,
                marginTop: 16,
                minHeight: 56,
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityLabel="Next Puzzle"
              accessibilityRole="button"
            >
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>
                Next Puzzle
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={{
                marginTop: 12,
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
              accessibilityLabel="Done"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: "600" }}>
                Done
              </Text>
            </Pressable>
          </View>
        )}

        {/* Zoom hint */}
        <View className="flex-row items-center justify-center px-4 mb-2">
          <Text style={{ fontSize: 13, color: colors.textTertiary }}>
            Pinch to zoom in on the grid
          </Text>
        </View>

        {/* Grid — native pinch-to-zoom via ScrollView, scroll disabled to allow page scrolling */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={itemCount > 4}
          style={{ marginBottom: 8 }}
          contentContainerStyle={{ paddingHorizontal: GRID_PADDING }}
        >
          <ScrollView
            minimumZoomScale={1}
            maximumZoomScale={3}
            bouncesZoom
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <View>
              {renderCatNameHeaders()}
              {renderColumnHeaders()}
              {renderTopSection()}
              {renderBottomSection()}
            </View>
          </ScrollView>
        </ScrollView>

        {/* Action Buttons */}
        <View className="flex-row px-4 mt-4 mb-4" style={{ gap: 12 }}>
          <Pressable
            onPress={handleManualCheck}
            disabled={won}
            style={{
              flex: 1,
              height: 56,
              borderRadius: 14,
              backgroundColor: won
                ? isDark ? "#333333" : "#CCCCCC"
                : primary,
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityLabel="Check answers"
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#FFFFFF" }}>
              Check
            </Text>
          </Pressable>
          <Pressable
            onPress={handleClearGrid}
            style={{
              flex: 1,
              height: 56,
              borderRadius: 14,
              backgroundColor: isDark ? colors.surfaceSubtle : "#F0EDE4",
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityLabel="Clear grid"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: isDark ? "#FFFFFF" : "#333333",
              }}
            >
              Clear Grid
            </Text>
          </Pressable>
        </View>

        {/* Clues */}
        <View className="px-4 mb-4">
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: 8,
            }}
          >
            Clues
          </Text>
          <Text
            className="mb-3"
            style={{
              fontSize: 15,
              color: colors.textSecondary,
            }}
          >
            Tap a clue to cross it off when solved.
          </Text>
          {activeClueIndices.map((idx) => (
            <Pressable
              key={idx}
              onPress={() => toggleClue(idx)}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 16,
                backgroundColor: isDark ? colors.cardBackground : "#FFFFFF",
                borderRadius: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: isDark ? colors.border : "#E0DDD4",
                minHeight: 52,
                justifyContent: "center",
              }}
              accessibilityLabel={`Clue ${idx + 1}: ${puzzle.clues[idx]}`}
              accessibilityRole="button"
            >
              <View className="flex-row items-start">
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: primary,
                    marginRight: 8,
                    minWidth: 28,
                  }}
                >
                  {idx + 1}.
                </Text>
                <Text
                  style={{
                    fontSize: 17,
                    color: colors.textPrimary,
                    lineHeight: 24,
                    flex: 1,
                  }}
                >
                  {puzzle.clues[idx]}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Solved Clues */}
        {solvedClueIndices.length > 0 && (
          <View className="px-4 mb-4">
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              Solved Clues (tap to restore)
            </Text>
            {solvedClueIndices.map((idx) => (
              <Pressable
                key={idx}
                onPress={() => toggleClue(idx)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: isDark ? colors.cardBackground : "#FFFFFF",
                  borderRadius: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: isDark ? colors.border : "#E0DDD4",
                  minHeight: 52,
                  justifyContent: "center",
                  opacity: 0.5,
                }}
                accessibilityLabel={`Solved clue ${idx + 1}: ${puzzle.clues[idx]}, tap to restore`}
                accessibilityRole="button"
              >
                <View className="flex-row items-start">
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "700",
                      color: primary,
                      marginRight: 8,
                      minWidth: 28,
                      textDecorationLine: "line-through",
                    }}
                  >
                    {idx + 1}.
                  </Text>
                  <Text
                    style={{
                      fontSize: 17,
                      color: colors.textPrimary,
                      lineHeight: 24,
                      flex: 1,
                      textDecorationLine: "line-through",
                    }}
                  >
                    {puzzle.clues[idx]}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Notes */}
        <View className="px-4 mb-4">
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: 8,
            }}
          >
            Notes
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Jot down your reasoning here..."
            placeholderTextColor={colors.textSecondary}
            multiline
            style={{
              backgroundColor: isDark ? colors.cardBackground : "#FFFFFF",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? colors.border : "#E0DDD4",
              padding: 16,
              fontSize: 17,
              color: colors.textPrimary,
              minHeight: 100,
              textAlignVertical: "top",
            }}
          />
        </View>

        {/* How to Play */}
        <View className="px-4 mb-4">
          <Pressable
            onPress={() => setHowToPlayOpen(!howToPlayOpen)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: isDark ? colors.cardBackground : "#FFFFFF",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? colors.border : "#E0DDD4",
              padding: 16,
              minHeight: 56,
            }}
            accessibilityLabel="How to Play"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.textPrimary,
              }}
            >
              How to Play
            </Text>
            <Ionicons
              name={howToPlayOpen ? "chevron-up" : "chevron-down"}
              size={24}
              color={colors.textSecondary}
            />
          </Pressable>
          {howToPlayOpen && (
            <View
              style={{
                backgroundColor: isDark ? colors.cardBackground : "#FFFFFF",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDark ? colors.border : "#E0DDD4",
                padding: 16,
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  color: colors.textPrimary,
                  lineHeight: 26,
                  marginBottom: 8,
                }}
              >
                {"Each puzzle has 3 categories with items each. Your goal is to figure out which items from different categories go together."}
              </Text>
              <Text
                style={{
                  fontSize: 17,
                  color: colors.textPrimary,
                  lineHeight: 26,
                  marginBottom: 8,
                }}
              >
                {"Tap a cell to cycle through: empty \u2192 X (no match) \u2192 \u2713 (match) \u2192 empty."}
              </Text>
              <Text
                style={{
                  fontSize: 17,
                  color: colors.textPrimary,
                  lineHeight: 26,
                  marginBottom: 8,
                }}
              >
                {"Use the clues to eliminate possibilities. Each item matches exactly one item in every other category."}
              </Text>
              <Text
                style={{
                  fontSize: 17,
                  color: colors.textPrimary,
                  lineHeight: 26,
                }}
              >
                {"Tap clues to cross them off as you use them. When all cells are filled, the puzzle auto-checks your answer."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default LogicGridPuzzleGame;
