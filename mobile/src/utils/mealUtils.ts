import type { MealType } from "../types/app";

/**
 * Get the suggested meal type based on the current time
 * Used to auto-expand the current meal section and suggest it when adding food
 */
export const getMealTypeForTime = (date: Date = new Date()): MealType => {
  const hour = date.getHours();

  if (hour >= 5 && hour < 11) {
    return "breakfast";
  } else if (hour >= 11 && hour < 15) {
    return "lunch";
  } else if (hour >= 15 && hour < 18) {
    return "snacks";
  } else if (hour >= 18 && hour < 22) {
    return "dinner";
  } else {
    return "snacks"; // Late night
  }
};

/**
 * Get meal display name with time range hint
 */
export const getMealDisplayInfo = (
  mealType: MealType
): { name: string; timeHint: string } => {
  switch (mealType) {
    case "breakfast":
      return { name: "Breakfast", timeHint: "5am - 11am" };
    case "lunch":
      return { name: "Lunch", timeHint: "11am - 3pm" };
    case "dinner":
      return { name: "Dinner", timeHint: "6pm - 10pm" };
    case "snacks":
      return { name: "Snacks", timeHint: "Anytime" };
  }
};

/**
 * Check if the given meal type is the current suggested meal
 */
export const isCurrentMeal = (mealType: MealType): boolean => {
  return getMealTypeForTime() === mealType;
};

/**
 * Format time for display (e.g., "8:00 AM")
 */
export const formatTimeForDisplay = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Parse time string (HH:MM) to Date object for today
 */
export const parseTimeString = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Convert Date to time string (HH:MM)
 */
export const dateToTimeString = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};
