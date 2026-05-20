/**
 * Daily seed utilities for generating consistent-per-day random content.
 * Ensures games show different content each day but consistent within a day.
 */

/** Get a numeric seed based on today's date */
export function getDailySeed(): number {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Create a seeded random number generator (returns 0-1 like Math.random) */
export function createSeededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** Shuffle an array using a seed for consistent daily ordering */
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Pick n items from an array using seeded randomization */
export function seededPick<T>(arr: T[], count: number, seed: number): T[] {
  return seededShuffle(arr, seed).slice(0, count);
}

/** Get a seeded random integer between min (inclusive) and max (exclusive) */
export function seededInt(min: number, max: number, seed: number): number {
  const s = ((seed * 1664525 + 1013904223) & 0x7fffffff);
  return min + (s % (max - min));
}
