/**
 * Production-safe logger
 * Only logs in development builds
 */

// Check __DEV__ safely - it's a React Native global that's always available
// Using __DEV__ is more reliable than process.env.NODE_ENV in React Native
const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, but could send to error tracking in production
    console.error(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log("[DEBUG]", ...args);
    }
  },
};

export default logger;
