import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from "expo-sharing";
import { logger } from "./logger";

const FEEDBACK_KEY = "help_feedback";

export interface FeedbackEntry {
  id: string;
  timestamp: string;
  type: "faq_helpful" | "satisfaction";
  questionId?: string;
  questionText?: string;
  helpful?: boolean;
  rating?: number; // 1 = Not helpful, 2 = Okay, 3 = Helpful
  feedbackText?: string; // User's written explanation
}

/**
 * Save a feedback entry to local storage
 */
export const saveFeedback = async (
  feedback: Omit<FeedbackEntry, "id" | "timestamp">
): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(FEEDBACK_KEY);
    const feedbackList: FeedbackEntry[] = existing ? JSON.parse(existing) : [];

    feedbackList.push({
      ...feedback,
      id: `fb_${Date.now()}`,
      timestamp: new Date().toISOString(),
    });

    await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbackList));
  } catch (error) {
    logger.error("Failed to save feedback:", error);
  }
};

/**
 * Get all feedback entries
 */
export const getAllFeedback = async (): Promise<FeedbackEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(FEEDBACK_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    logger.error("Failed to get feedback:", error);
    return [];
  }
};

/**
 * Get feedback summary stats for developer menu
 */
export const getFeedbackStats = async () => {
  const feedback = await getAllFeedback();

  const faqFeedback = feedback.filter((f) => f.type === "faq_helpful");
  const satisfactionFeedback = feedback.filter((f) => f.type === "satisfaction");

  const helpfulCount = faqFeedback.filter((f) => f.helpful === true).length;
  const notHelpfulCount = faqFeedback.filter((f) => f.helpful === false).length;

  const avgSatisfaction =
    satisfactionFeedback.length > 0
      ? satisfactionFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) /
        satisfactionFeedback.length
      : 0;

  // Find which questions got "No" feedback (need improvement)
  const needsImprovement = faqFeedback
    .filter((f) => f.helpful === false)
    .reduce(
      (acc, f) => {
        if (f.questionId) {
          acc[f.questionId] = (acc[f.questionId] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

  // Get written feedback entries
  const writtenFeedback = feedback
    .filter((f) => f.feedbackText)
    .map((f) => ({
      rating: f.rating,
      text: f.feedbackText,
      timestamp: f.timestamp,
      type: f.type,
    }))
    .slice(-20); // Last 20 written responses

  return {
    totalResponses: feedback.length,
    faqHelpful: helpfulCount,
    faqNotHelpful: notHelpfulCount,
    helpfulRate:
      faqFeedback.length > 0
        ? Math.round((helpfulCount / faqFeedback.length) * 100)
        : 0,
    avgSatisfaction: avgSatisfaction.toFixed(1),
    satisfactionCount: satisfactionFeedback.length,
    needsImprovement: Object.entries(needsImprovement)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5), // Top 5 questions needing improvement
    writtenFeedback,
  };
};

/**
 * Export feedback as CSV file
 */
export const exportFeedbackCSV = async (): Promise<boolean> => {
  try {
    const feedback = await getAllFeedback();

    if (feedback.length === 0) {
      return false;
    }

    // Create CSV header and rows
    const header =
      "Timestamp,Type,Question ID,Question,Helpful,Rating,Written Feedback\n";
    const rows = feedback
      .map(
        (f) =>
          `"${f.timestamp}","${f.type}","${f.questionId || ""}","${f.questionText?.replace(/"/g, '""') || ""}","${f.helpful ?? ""}","${f.rating ?? ""}","${f.feedbackText?.replace(/"/g, '""') || ""}"`
      )
      .join("\n");

    const csv = header + rows;

    // Save to file and share
    const fileName = `steadiday_feedback_${new Date().toISOString().split("T")[0]}.csv`;
    const filePath = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(filePath, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(filePath, {
      mimeType: "text/csv",
      dialogTitle: "Export Help Feedback",
    });

    return true;
  } catch (error) {
    logger.error("Failed to export feedback:", error);
    return false;
  }
};

/**
 * Clear all feedback (for testing)
 */
export const clearAllFeedback = async (): Promise<void> => {
  await AsyncStorage.removeItem(FEEDBACK_KEY);
};
