/**
 * RxNorm API Client
 *
 * RxNorm is a normalized naming system for clinical drugs maintained by the
 * National Library of Medicine (NLM). It provides standardized drug names
 * covering 99% of commonly prescribed US medications.
 *
 * API Documentation: https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html
 *
 * Rate Limit: 20 requests per second per IP address
 * No API key required
 */

import { logger } from "../utils/logger";

const RXNORM_BASE_URL = "https://rxnav.nlm.nih.gov/REST";

export interface RxNormDrugSuggestion {
  rxcui: string;
  name: string;
  synonym?: string;
}

export interface RxNormDrugInfo {
  rxcui: string;
  name: string;
  tty: string; // Term type (e.g., "SBD" = Semantic Branded Drug)
  synonym?: string;
}

/**
 * Search for drug names using RxNorm's approximate term search
 * This is the best endpoint for autocomplete as it handles typos and partial matches
 *
 * @param searchTerm - The partial drug name to search for
 * @param maxResults - Maximum number of results to return (default: 10)
 * @returns Array of drug suggestions
 */
export async function searchDrugs(
  searchTerm: string,
  maxResults: number = 10
): Promise<RxNormDrugSuggestion[]> {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return [];
  }

  try {
    const encodedTerm = encodeURIComponent(searchTerm.trim());
    const url = `${RXNORM_BASE_URL}/approximateTerm.json?term=${encodedTerm}&maxEntries=${maxResults}`;

    logger.log("[RxNorm] Searching for:", searchTerm);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error("[RxNorm] API error:", response.status);
      return [];
    }

    const data = await response.json();

    // Parse the response
    const candidates = data?.approximateGroup?.candidate;
    if (!candidates || !Array.isArray(candidates)) {
      logger.log("[RxNorm] No results found");
      return [];
    }

    // Map to our format and deduplicate by name
    const seen = new Set<string>();
    const results: RxNormDrugSuggestion[] = [];

    for (const candidate of candidates) {
      const name = candidate.name;
      const normalizedName = name?.toLowerCase();

      if (name && !seen.has(normalizedName)) {
        seen.add(normalizedName);
        results.push({
          rxcui: candidate.rxcui || "",
          name: name,
        });
      }

      if (results.length >= maxResults) break;
    }

    logger.log("[RxNorm] Found", results.length, "results");
    return results;

  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.log("[RxNorm] Request timed out");
    } else {
      logger.error("[RxNorm] Search error:", error);
    }
    return [];
  }
}

/**
 * Get spelling suggestions for a drug name
 * Useful when user types something incorrect
 *
 * @param searchTerm - The potentially misspelled drug name
 * @returns Array of spelling suggestions
 */
export async function getSpellingSuggestions(
  searchTerm: string
): Promise<string[]> {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return [];
  }

  try {
    const encodedTerm = encodeURIComponent(searchTerm.trim());
    const url = `${RXNORM_BASE_URL}/spellingsuggestions.json?name=${encodedTerm}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const suggestions = data?.suggestionGroup?.suggestionList?.suggestion;

    if (!suggestions || !Array.isArray(suggestions)) {
      return [];
    }

    return suggestions.slice(0, 5);

  } catch (error) {
    logger.error("[RxNorm] Spelling suggestions error:", error);
    return [];
  }
}

/**
 * Get drug information by RxCUI (RxNorm Concept Unique Identifier)
 *
 * @param rxcui - The RxNorm concept ID
 * @returns Drug information or null
 */
export async function getDrugByRxcui(
  rxcui: string
): Promise<RxNormDrugInfo | null> {
  if (!rxcui) {
    return null;
  }

  try {
    const url = `${RXNORM_BASE_URL}/rxcui/${rxcui}/properties.json`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const props = data?.properties;

    if (!props) {
      return null;
    }

    return {
      rxcui: props.rxcui,
      name: props.name,
      tty: props.tty,
      synonym: props.synonym,
    };

  } catch (error) {
    logger.error("[RxNorm] Get drug by RXCUI error:", error);
    return null;
  }
}

/**
 * Search for drugs and return just the names (for simple autocomplete)
 * Falls back to empty array on error - never throws
 *
 * @param searchTerm - The partial drug name to search for
 * @param maxResults - Maximum number of results to return
 * @returns Array of drug name strings
 */
export async function searchDrugNames(
  searchTerm: string,
  maxResults: number = 10
): Promise<string[]> {
  const results = await searchDrugs(searchTerm, maxResults);
  return results.map(r => r.name);
}
