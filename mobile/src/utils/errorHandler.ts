import { Alert } from "react-native";
import { logger } from "./logger";

interface ErrorOptions {
  context: string;         // Where the error happened, e.g. "SOS.callEmergency"
  userMessage?: string;    // If set, show an Alert to the user
  silent?: boolean;        // If true, log but don't alert
}

/**
 * Standardized error handler for the app
 *
 * Usage:
 * ```ts
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   handleError(error, {
 *     context: "MyScreen.riskyOperation",
 *     userMessage: "Could not complete the operation. Please try again.",
 *   });
 * }
 * ```
 */
export function handleError(error: unknown, options: ErrorOptions): void {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(`[${options.context}] ${message}`, error);

  if (options.userMessage && !options.silent) {
    Alert.alert("Something went wrong", options.userMessage);
  }
}

/**
 * Wraps an async function with error handling
 * Useful for fire-and-forget async operations
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: ErrorOptions
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | undefined> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      return undefined;
    }
  };
}
