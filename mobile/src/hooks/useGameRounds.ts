/**
 * useGameRounds - Hook for managing multi-round game sessions
 *
 * Each game requires 3 rounds to be considered "complete" for the day.
 * This makes games feel more substantial and engaging.
 */

import { useState, useCallback } from "react";

export const ROUNDS_PER_GAME = 3;

export interface RoundStats {
  roundNumber: number;
  score: number;
  time?: number;
  attempts?: number;
}

export interface GameProgress {
  currentRound: number;
  roundsCompleted: number;
  totalScore: number;
  roundStats: RoundStats[];
  isGameComplete: boolean;
}

export function useGameRounds() {
  const [progress, setProgress] = useState<GameProgress>({
    currentRound: 1,
    roundsCompleted: 0,
    totalScore: 0,
    roundStats: [],
    isGameComplete: false,
  });

  const completeRound = useCallback((stats: Omit<RoundStats, "roundNumber">) => {
    setProgress((prev) => {
      const newRoundsCompleted = prev.roundsCompleted + 1;
      const isComplete = newRoundsCompleted >= ROUNDS_PER_GAME;
      const roundStats: RoundStats = {
        ...stats,
        roundNumber: prev.currentRound,
      };

      return {
        currentRound: isComplete ? prev.currentRound : prev.currentRound + 1,
        roundsCompleted: newRoundsCompleted,
        totalScore: prev.totalScore + stats.score,
        roundStats: [...prev.roundStats, roundStats],
        isGameComplete: isComplete,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setProgress({
      currentRound: 1,
      roundsCompleted: 0,
      totalScore: 0,
      roundStats: [],
      isGameComplete: false,
    });
  }, []);

  const getRemainingRounds = useCallback(() => {
    return ROUNDS_PER_GAME - progress.roundsCompleted;
  }, [progress.roundsCompleted]);

  return {
    progress,
    completeRound,
    resetGame,
    getRemainingRounds,
    ROUNDS_PER_GAME,
  };
}

export default useGameRounds;
