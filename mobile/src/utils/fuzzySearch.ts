/**
 * Fuzzy Search Utility
 *
 * Helps older users find what they're looking for even with typos or misspellings.
 * Uses Levenshtein distance algorithm to calculate similarity between strings.
 */

/**
 * Calculate Levenshtein distance between two strings
 * This measures how many single-character edits (insertions, deletions, substitutions)
 * are needed to change one string into another
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1, where 1 is exact match)
 */
function similarityScore(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

/**
 * Check if search term matches item with fuzzy logic
 * Returns a score from 0-100 indicating match quality
 */
export function fuzzyMatch(searchTerm: string, itemText: string): number {
  const search = searchTerm.toLowerCase().trim();
  const item = itemText.toLowerCase().trim();

  if (!search) return 0;
  if (item === search) return 100; // Exact match

  // Check if item contains search term (substring match)
  if (item.includes(search)) return 90;

  // Check if item starts with search term
  if (item.startsWith(search)) return 85;

  // Check if search term is contained in any word in the item
  const itemWords = item.split(/\s+/);
  for (const word of itemWords) {
    if (word.startsWith(search)) return 80;
    if (word.includes(search)) return 75;
  }

  // Calculate similarity score for fuzzy matching
  const similarity = similarityScore(search, item);

  // Also check similarity for individual words
  let maxWordSimilarity = 0;
  for (const word of itemWords) {
    const wordSim = similarityScore(search, word);
    maxWordSimilarity = Math.max(maxWordSimilarity, wordSim);
  }

  const bestSimilarity = Math.max(similarity, maxWordSimilarity);

  // Convert similarity to score (0-70 range for fuzzy matches)
  // We use a threshold - only return matches above 60% similarity
  if (bestSimilarity >= 0.6) {
    return Math.floor(bestSimilarity * 70);
  }

  return 0; // No match
}

/**
 * Filter and sort array of items based on fuzzy search
 * Returns items sorted by relevance (best matches first)
 */
export function fuzzyFilter<T>(
  items: T[],
  searchTerm: string,
  getItemText: (item: T) => string,
  minScore: number = 40 // Minimum score to be included in results
): T[] {
  if (!searchTerm.trim()) {
    return items; // Return all items if no search term
  }

  // Calculate scores for all items
  const scoredItems = items
    .map(item => ({
      item,
      score: fuzzyMatch(searchTerm, getItemText(item))
    }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score); // Sort by score descending

  return scoredItems.map(({ item }) => item);
}

/**
 * Simple fuzzy filter for string arrays
 */
export function fuzzyFilterStrings(
  items: string[],
  searchTerm: string,
  minScore: number = 40
): string[] {
  return fuzzyFilter(items, searchTerm, (item) => item, minScore);
}

/**
 * Example usage:
 *
 * // For medications
 * const medications = ["Aspirin", "Ibuprofen", "Acetaminophen"];
 * fuzzyFilterStrings(medications, "aspin"); // Returns ["Aspirin"]
 * fuzzyFilterStrings(medications, "ibuprofn"); // Returns ["Ibuprofen"]
 *
 * // For objects
 * const doctors = [
 *   { name: "Dr. Sarah Johnson", specialty: "Cardiology" },
 *   { name: "Dr. Michael Chen", specialty: "Family Medicine" }
 * ];
 * fuzzyFilter(doctors, "sara jonson", (doc) => doc.name);
 * // Returns [{ name: "Dr. Sarah Johnson", ... }]
 */
