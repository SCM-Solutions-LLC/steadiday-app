// =============================================================================
// FAQ MATCHER - Smart keyword matching + category browsing
// =============================================================================

import { FAQ_DATABASE, FAQItem, FAQ_CATEGORIES, getCategoryInfo, getAdaptedFaqDatabase } from "../data/faqData";

export interface MatchResult {
  found: boolean;
  answer?: string;
  matchedQuestion?: string;
  matchedFaq?: FAQItem;
  confidence?: "high" | "medium" | "low";
  relatedQuestions: string[];
}

export interface CategoryQuestionsResult {
  categoryId: string;
  categoryLabel: string;
  categoryIcon: string;
  questions: FAQItem[];
}

/**
 * Get all questions for a category (for topic button browsing)
 */
export function getQuestionsForCategory(categoryId: string): CategoryQuestionsResult | null {
  const category = getCategoryInfo(categoryId);
  if (!category) return null;

  const questions = getAdaptedFaqDatabase().filter(faq => faq.category === categoryId);

  return {
    categoryId: category.id,
    categoryLabel: category.label,
    categoryIcon: category.icon,
    questions,
  };
}

/**
 * Find the best matching FAQ for a user's question
 */
export function findBestFaqMatch(userInput: string): MatchResult {
  const input = userInput.toLowerCase().trim();
  const inputWords = input.split(/\s+/).filter(word => word.length > 2);

  const adaptedFaqs = getAdaptedFaqDatabase();

  // Score each FAQ
  const scored = adaptedFaqs.map(faq => {
    let score = 0;

    faq.keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();

      // Exact phrase match
      if (input.includes(keywordLower)) {
        score += keywordLower.split(" ").length > 1 ? 15 : 10;
      }

      // Word matches
      inputWords.forEach(word => {
        if (keywordLower.includes(word)) {
          score += 3;
        }
        if (word.length > 4 && keywordLower.includes(word.slice(0, -1))) {
          score += 2;
        }
      });
    });

    // Question text similarity
    const questionLower = faq.question.toLowerCase();
    inputWords.forEach(word => {
      if (questionLower.includes(word)) {
        score += 2;
      }
    });

    return { faq, score };
  });

  const sorted = scored.sort((a, b) => b.score - a.score);

  const relatedQuestions = sorted
    .slice(1, 5)
    .filter(item => item.score > 3)
    .map(item => item.faq.question);

  const bestMatch = sorted[0];

  if (bestMatch.score >= 8) {
    return {
      found: true,
      answer: bestMatch.faq.answer,
      matchedQuestion: bestMatch.faq.question,
      matchedFaq: bestMatch.faq,
      confidence: bestMatch.score >= 15 ? "high" : "medium",
      relatedQuestions,
    };
  } else if (bestMatch.score >= 4) {
    return {
      found: true,
      answer: bestMatch.faq.answer,
      matchedQuestion: bestMatch.faq.question,
      matchedFaq: bestMatch.faq,
      confidence: "low",
      relatedQuestions,
    };
  }

  return {
    found: false,
    relatedQuestions: adaptedFaqs.slice(0, 4).map(faq => faq.question),
  };
}

/**
 * Get FAQs by category
 */
export function getFaqsByCategory(category: string): FAQItem[] {
  return getAdaptedFaqDatabase().filter(faq => faq.category === category);
}

/**
 * Search FAQs with text
 */
export function searchFaqs(query: string): FAQItem[] {
  const queryLower = query.toLowerCase();
  return getAdaptedFaqDatabase().filter(faq =>
    faq.question.toLowerCase().includes(queryLower) ||
    faq.answer.toLowerCase().includes(queryLower) ||
    faq.keywords.some(k => k.toLowerCase().includes(queryLower))
  );
}
