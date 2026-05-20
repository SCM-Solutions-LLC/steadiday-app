//DO NOT REMOVE THIS CODE
// Set up error handlers FIRST, before any imports
// This ensures we catch any errors during module initialization
// v1.2.6 — cross-platform bug fixes

// Global error handlers to catch unhandled errors early
// In production, we suppress fatal errors to prevent crashes
try {
  if (typeof global !== "undefined" && (global as any).ErrorUtils) {
    const originalHandler = (global as any).ErrorUtils.getGlobalHandler?.();
    (global as any).ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
      // Suppress NitroModules native initialization errors — these are handled
      // gracefully by the HealthKit lazy-require and should never crash the app.
      const msg = error?.message ?? "";
      if (msg.includes("NitroModulesProxy") || msg.includes("createHybridObject")) {
        return;
      }

      try {
        console.error("[Global Error Handler] Error:", msg);
        console.error("[Global Error Handler] Is Fatal:", isFatal);
        // Forward to Crashlytics (lazy require — firebase may not be loaded yet)
        try {
          const { recordError } = require("./src/utils/firebase");
          recordError(error, `[GlobalErrorHandler] isFatal=${isFatal}`);
        } catch {
          // Firebase not ready yet — ignore
        }
      } catch {
        // Ignore logging errors
      }

      // In production, don't pass fatal errors to original handler (prevents crash)
      const isDev = typeof __DEV__ !== "undefined" && __DEV__;
      if (isDev && originalHandler) {
        originalHandler(error, isFatal);
      } else if (!isFatal && originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }
} catch {
  // If error handler setup fails, continue anyway
}

// Import reanimated first - required for proper initialization
import "react-native-reanimated";

import "./global.css";
import "react-native-get-random-values";
import { LogBox } from "react-native";

// Suppress known warnings
LogBox.ignoreLogs([
  "Expo AV has been deprecated",
  "Disconnected from Metro",
]);

// Startup logging removed - accessing process.env during early init can cause issues

import { registerRootComponent } from "expo";
import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
