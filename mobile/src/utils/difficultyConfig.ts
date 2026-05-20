/**
 * Progressive Difficulty Configuration for Daily Life Logic
 *
 * Difficulty increases as user completes puzzles:
 * - More tasks (3 → 6)
 * - More rules (1 → 5+)
 * - New rule types unlock progressively
 * - Hints become less prominent at higher levels
 */

import { RuleType } from "./puzzleGenerator";

// =============================================================================
// TYPES
// =============================================================================

export type DifficultyName = "Beginner" | "Easy" | "Medium" | "Hard" | "Expert" | "Master";

export type HintDisplay = "always" | "on_tap" | "minimal";

export interface DifficultyConfig {
  level: number;
  name: DifficultyName;
  taskCount: number;
  ruleCount: number;
  allowedRuleTypes: RuleType[];
  hintDisplay: HintDisplay;
  showRuleExplanations: boolean;
  allowUndoMoves: boolean;
  mistakesAllowed: number;
  // Visual theming
  badgeColor: string;
  badgeEmoji: string;
}

// =============================================================================
// DIFFICULTY CONFIGURATIONS (26 levels)
// =============================================================================

const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  // ========= BEGINNER (Levels 1-3) =========
  // Learn the basics with simple FIRST/LAST rules - NOW 4 TASKS
  {
    level: 1,
    name: "Beginner",
    taskCount: 4,  // Increased from 3
    ruleCount: 1,
    allowedRuleTypes: ["first"],
    hintDisplay: "always",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 3,
    badgeColor: "#10B981",
    badgeEmoji: "🌱",
  },
  {
    level: 2,
    name: "Beginner",
    taskCount: 4,  // Increased from 3
    ruleCount: 1,
    allowedRuleTypes: ["first", "last"],
    hintDisplay: "always",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 3,
    badgeColor: "#10B981",
    badgeEmoji: "🌱",
  },
  {
    level: 3,
    name: "Beginner",
    taskCount: 4,  // Increased from 3
    ruleCount: 2,
    allowedRuleTypes: ["first", "last"],
    hintDisplay: "always",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 3,
    badgeColor: "#10B981",
    badgeEmoji: "🌱",
  },

  // ========= EASY (Levels 4-7) =========
  // Add more tasks and introduce ORDER rules
  {
    level: 4,
    name: "Easy",
    taskCount: 4,
    ruleCount: 2,
    allowedRuleTypes: ["first", "last"],
    hintDisplay: "always",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 3,
    badgeColor: "#3B82F6",
    badgeEmoji: "⭐",
  },
  {
    level: 5,
    name: "Easy",
    taskCount: 4,
    ruleCount: 2,
    allowedRuleTypes: ["first", "last"],
    hintDisplay: "always",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 3,
    badgeColor: "#3B82F6",
    badgeEmoji: "⭐",
  },
  {
    level: 6,
    name: "Easy",
    taskCount: 4,
    ruleCount: 2,
    allowedRuleTypes: ["first", "last", "before"],
    hintDisplay: "always",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 2,
    badgeColor: "#3B82F6",
    badgeEmoji: "⭐",
  },
  {
    level: 7,
    name: "Easy",
    taskCount: 4,
    ruleCount: 3,
    allowedRuleTypes: ["first", "last", "before"],
    hintDisplay: "always",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 2,
    badgeColor: "#3B82F6",
    badgeEmoji: "⭐",
  },

  // ========= MEDIUM (Levels 8-12) =========
  // More complex ORDER combinations
  {
    level: 8,
    name: "Medium",
    taskCount: 4,
    ruleCount: 3,
    allowedRuleTypes: ["first", "last", "before"],
    hintDisplay: "always",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 2,
    badgeColor: "#8B5CF6",
    badgeEmoji: "🔥",
  },
  {
    level: 9,
    name: "Medium",
    taskCount: 4,
    ruleCount: 3,
    allowedRuleTypes: ["first", "last", "before"],
    hintDisplay: "always",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 2,
    badgeColor: "#8B5CF6",
    badgeEmoji: "🔥",
  },
  {
    level: 10,
    name: "Medium",
    taskCount: 5,
    ruleCount: 3,
    allowedRuleTypes: ["first", "last", "before"],
    hintDisplay: "always",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 2,
    badgeColor: "#8B5CF6",
    badgeEmoji: "🔥",
  },
  {
    level: 11,
    name: "Medium",
    taskCount: 5,
    ruleCount: 4,
    allowedRuleTypes: ["first", "last", "before"],
    hintDisplay: "always",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 2,
    badgeColor: "#8B5CF6",
    badgeEmoji: "🔥",
  },
  {
    level: 12,
    name: "Medium",
    taskCount: 5,
    ruleCount: 4,
    allowedRuleTypes: ["first", "last", "before"],
    hintDisplay: "always",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 2,
    badgeColor: "#8B5CF6",
    badgeEmoji: "🔥",
  },

  // ========= HARD (Levels 13-18) =========
  // Introduce NOT NEXT TO rules
  {
    level: 13,
    name: "Hard",
    taskCount: 5,
    ruleCount: 4,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "on_tap",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 2,
    badgeColor: "#F59E0B",
    badgeEmoji: "💪",
  },
  {
    level: 14,
    name: "Hard",
    taskCount: 5,
    ruleCount: 4,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "on_tap",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 2,
    badgeColor: "#F59E0B",
    badgeEmoji: "💪",
  },
  {
    level: 15,
    name: "Hard",
    taskCount: 5,
    ruleCount: 4,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "on_tap",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 2,
    badgeColor: "#F59E0B",
    badgeEmoji: "💪",
  },
  {
    level: 16,
    name: "Hard",
    taskCount: 5,
    ruleCount: 4,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "on_tap",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 2,
    badgeColor: "#F59E0B",
    badgeEmoji: "💪",
  },
  {
    level: 17,
    name: "Hard",
    taskCount: 5,
    ruleCount: 5,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "on_tap",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 1,
    badgeColor: "#F59E0B",
    badgeEmoji: "💪",
  },
  {
    level: 18,
    name: "Hard",
    taskCount: 6,
    ruleCount: 5,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "on_tap",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 1,
    badgeColor: "#F59E0B",
    badgeEmoji: "💪",
  },

  // ========= EXPERT (Levels 19-25) =========
  // Maximum complexity, hints on tap only
  {
    level: 19,
    name: "Expert",
    taskCount: 6,
    ruleCount: 5,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "on_tap",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 1,
    badgeColor: "#EF4444",
    badgeEmoji: "🏆",
  },
  {
    level: 20,
    name: "Expert",
    taskCount: 6,
    ruleCount: 5,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "on_tap",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 1,
    badgeColor: "#EF4444",
    badgeEmoji: "🏆",
  },
  {
    level: 21,
    name: "Expert",
    taskCount: 6,
    ruleCount: 5,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "on_tap",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 1,
    badgeColor: "#EF4444",
    badgeEmoji: "🏆",
  },
  {
    level: 22,
    name: "Expert",
    taskCount: 6,
    ruleCount: 5,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "on_tap",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 1,
    badgeColor: "#EF4444",
    badgeEmoji: "🏆",
  },
  {
    level: 23,
    name: "Expert",
    taskCount: 6,
    ruleCount: 5,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "on_tap",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 1,
    badgeColor: "#EF4444",
    badgeEmoji: "🏆",
  },
  {
    level: 24,
    name: "Expert",
    taskCount: 6,
    ruleCount: 5,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "on_tap",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 1,
    badgeColor: "#EF4444",
    badgeEmoji: "🏆",
  },
  {
    level: 25,
    name: "Expert",
    taskCount: 6,
    ruleCount: 5,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "on_tap",
    showRuleExplanations: true,
    allowUndoMoves: true,
    mistakesAllowed: 1,
    badgeColor: "#EF4444",
    badgeEmoji: "🏆",
  },

  // ========= MASTER (Level 26+) =========
  // Maximum challenge, minimal hints
  {
    level: 26,
    name: "Master",
    taskCount: 6,
    ruleCount: 5,
    allowedRuleTypes: ["first", "last", "before", "not_adjacent"],
    hintDisplay: "minimal",
    showRuleExplanations: false,
    allowUndoMoves: true,
    mistakesAllowed: 1,
    badgeColor: "#A855F7",
    badgeEmoji: "👑",
  },
];

// =============================================================================
// LEVEL THRESHOLDS - How many puzzles to complete to reach each level
// =============================================================================

const LEVEL_THRESHOLDS: number[] = [
  0,   // Level 1: 0 puzzles
  3,   // Level 2: 3 puzzles
  5,   // Level 3: 5 puzzles
  7,   // Level 4: 7 puzzles
  10,  // Level 5: 10 puzzles
  13,  // Level 6: 13 puzzles
  16,  // Level 7: 16 puzzles
  19,  // Level 8: 19 puzzles
  22,  // Level 9: 22 puzzles
  26,  // Level 10: 26 puzzles
  30,  // Level 11: 30 puzzles
  34,  // Level 12: 34 puzzles
  38,  // Level 13: 38 puzzles
  43,  // Level 14: 43 puzzles
  48,  // Level 15: 48 puzzles
  53,  // Level 16: 53 puzzles
  58,  // Level 17: 58 puzzles
  63,  // Level 18: 63 puzzles
  68,  // Level 19: 68 puzzles
  75,  // Level 20: 75 puzzles
  82,  // Level 21: 82 puzzles
  89,  // Level 22: 89 puzzles
  96,  // Level 23: 96 puzzles
  103, // Level 24: 103 puzzles
  110, // Level 25: 110 puzzles
  120, // Level 26: 120 puzzles (Master)
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate user level based on puzzles completed
 */
export function calculateUserLevel(puzzlesCompleted: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (puzzlesCompleted >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get difficulty config for a specific level
 */
export function getDifficultyConfig(level: number): DifficultyConfig {
  // Clamp level to valid range
  const clampedLevel = Math.max(1, Math.min(level, DIFFICULTY_CONFIGS.length));
  return DIFFICULTY_CONFIGS[clampedLevel - 1];
}

/**
 * Get difficulty config based on puzzles completed
 */
export function getDifficultyConfigByPuzzlesCompleted(puzzlesCompleted: number): DifficultyConfig {
  const level = calculateUserLevel(puzzlesCompleted);
  return getDifficultyConfig(level);
}

/**
 * Get threshold for current level
 */
export function getCurrentLevelThreshold(level: number): number {
  const index = Math.max(0, Math.min(level - 1, LEVEL_THRESHOLDS.length - 1));
  return LEVEL_THRESHOLDS[index];
}

/**
 * Get threshold for next level
 */
export function getNextLevelThreshold(level: number): number {
  const nextIndex = Math.min(level, LEVEL_THRESHOLDS.length - 1);
  return LEVEL_THRESHOLDS[nextIndex];
}

/**
 * Calculate progress within current level (0-100%)
 */
export function calculateLevelProgress(puzzlesCompleted: number): {
  level: number;
  progressInLevel: number;
  puzzlesToNextLevel: number;
  progressPercentage: number;
  isMaxLevel: boolean;
} {
  const level = calculateUserLevel(puzzlesCompleted);
  const currentThreshold = getCurrentLevelThreshold(level);
  const nextThreshold = getNextLevelThreshold(level);

  const isMaxLevel = level >= DIFFICULTY_CONFIGS.length;

  if (isMaxLevel) {
    return {
      level,
      progressInLevel: puzzlesCompleted - currentThreshold,
      puzzlesToNextLevel: 0,
      progressPercentage: 100,
      isMaxLevel: true,
    };
  }

  const levelSize = nextThreshold - currentThreshold;
  const progressInLevel = puzzlesCompleted - currentThreshold;
  const puzzlesToNextLevel = nextThreshold - puzzlesCompleted;
  const progressPercentage = Math.min(100, (progressInLevel / levelSize) * 100);

  return {
    level,
    progressInLevel,
    puzzlesToNextLevel,
    progressPercentage,
    isMaxLevel: false,
  };
}

/**
 * Check if user leveled up
 */
export function checkLevelUp(
  oldPuzzlesCompleted: number,
  newPuzzlesCompleted: number
): {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  newDifficultyName: DifficultyName | null;
} {
  const oldLevel = calculateUserLevel(oldPuzzlesCompleted);
  const newLevel = calculateUserLevel(newPuzzlesCompleted);
  const leveledUp = newLevel > oldLevel;

  return {
    leveledUp,
    oldLevel,
    newLevel,
    newDifficultyName: leveledUp ? getDifficultyConfig(newLevel).name : null,
  };
}

/**
 * Get all difficulty names for display
 */
export function getAllDifficultyNames(): DifficultyName[] {
  return ["Beginner", "Easy", "Medium", "Hard", "Expert", "Master"];
}

/**
 * Get level range for a difficulty name
 */
export function getLevelRangeForDifficulty(name: DifficultyName): { min: number; max: number } {
  const configs = DIFFICULTY_CONFIGS.filter((c) => c.name === name);
  if (configs.length === 0) return { min: 1, max: 1 };
  return {
    min: configs[0].level,
    max: configs[configs.length - 1].level,
  };
}
