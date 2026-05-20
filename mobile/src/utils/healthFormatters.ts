/**
 * Health Value Formatters
 *
 * Utility functions to normalize and format health values from Apple HealthKit
 * Handles locale issues with decimal/thousand separators
 */

type HealthValueType = "steps" | "heartRate" | "sleep" | "exercise" | "weight" | "bloodPressure";

/**
 * Normalize health values from Apple HealthKit
 * - Rounds to whole numbers for steps, exercise minutes, etc.
 * - Handles potential locale issues with decimal separators
 */
export const normalizeHealthValue = (
  value: number | string | null | undefined,
  type: HealthValueType
): number | null => {
  if (value === null || value === undefined) return null;

  // Convert string to number if needed (handles locale issues)
  let numValue: number;
  if (typeof value === "string") {
    // Replace comma with dot for locales that use comma as decimal separator
    // Then parse as float
    numValue = parseFloat(value.replace(",", "."));
  } else {
    numValue = value;
  }

  // Check for valid number
  if (isNaN(numValue)) return null;

  // Round based on type
  switch (type) {
    case "steps":
    case "exercise":
      // Steps and exercise minutes should be whole numbers
      return Math.round(numValue);
    case "heartRate":
      // Heart rate to nearest whole number
      return Math.round(numValue);
    case "sleep":
      // Sleep hours can have one decimal
      return Math.round(numValue * 10) / 10;
    case "weight":
      // Weight to one decimal
      return Math.round(numValue * 10) / 10;
    case "bloodPressure":
      // Blood pressure to whole numbers
      return Math.round(numValue);
    default:
      return Math.round(numValue);
  }
};

/**
 * Format number for display with proper locale
 * Forces US-style formatting with comma as thousands separator
 * This ensures consistent display regardless of device locale
 */
export const formatHealthNumber = (
  value: number | null | undefined,
  decimals: number = 0
): string => {
  if (value === null || value === undefined) return "--";

  // Force US locale to ensure comma as thousands separator
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Calculate progress percentage with proper handling
 * Returns an object with percentage, display text, and exceeded flag
 */
export const calculateHealthProgress = (
  currentValue: number | null | undefined,
  goalValue: number
): { percentage: number; displayText: string; isExceeded: boolean } => {
  if (currentValue === null || currentValue === undefined || goalValue <= 0) {
    return { percentage: 0, displayText: "0% of goal", isExceeded: false };
  }

  const rawPercentage = (currentValue / goalValue) * 100;
  const clampedPercentage = Math.min(rawPercentage, 100); // For progress bar (max 100%)

  if (rawPercentage >= 100) {
    return {
      percentage: 100,
      displayText: rawPercentage >= 150 ? "Goal exceeded!" : "Goal reached!",
      isExceeded: true,
    };
  }

  return {
    percentage: clampedPercentage,
    displayText: `${Math.round(rawPercentage)}% of goal`,
    isExceeded: false,
  };
};

/**
 * Format a health metric value with its unit
 */
export const formatHealthValueWithUnit = (
  value: number | null | undefined,
  unit: string,
  decimals: number = 0
): string => {
  if (value === null || value === undefined) return `-- ${unit}`;
  return `${formatHealthNumber(value, decimals)} ${unit}`;
};
