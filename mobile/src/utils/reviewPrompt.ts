import { useEngagementStore } from "../state/stores/engagementStore";
import { logger } from "./logger";

/**
 * Check if conditions are met and request an App Store review.
 * Apple controls when/if the dialog actually appears — calling this
 * does NOT guarantee the prompt will show. Apple limits it to
 * approximately 3 times per 365-day period per device.
 *
 * expo-store-review requires a native build — gracefully no-ops in Expo Go.
 */
export async function maybeRequestReview(): Promise<void> {
  try {
    const { shouldRequestReview, markReviewRequested } =
      useEngagementStore.getState();

    if (!shouldRequestReview()) {
      return;
    }

    // Dynamically import to avoid crashing in Expo Go (no native module)
    let StoreReview: typeof import("expo-store-review");
    try {
      StoreReview = await import("expo-store-review");
    } catch {
      logger.log("[ReviewPrompt] expo-store-review native module not available");
      return;
    }

    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) {
      logger.log("[ReviewPrompt] Store review not available on this device");
      return;
    }

    await StoreReview.requestReview();
    markReviewRequested();
    logger.log("[ReviewPrompt] Review requested successfully");
  } catch (error) {
    logger.error("[ReviewPrompt] Error requesting review:", error);
  }
}
