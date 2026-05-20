/**
 * Connection Handler Utility
 *
 * Handles network connectivity and development-mode Metro bundler warnings
 * gracefully to improve user experience, especially for older adults who
 * may be confused by technical error messages.
 */

import NetInfo, { NetInfoState, NetInfoStateType } from "@react-native-community/netinfo";
import { secureLog, secureWarn } from "./secureLogger";

// ============================================================================
// Types
// ============================================================================

export type ConnectionStatus = "connected" | "offline" | "limited" | "unknown";

export interface ConnectionState {
  status: ConnectionStatus;
  type: NetInfoStateType;
  isInternetReachable: boolean | null;
}

// ============================================================================
// Connection State Tracking
// ============================================================================

let currentConnectionState: ConnectionState = {
  status: "unknown",
  type: NetInfoStateType.unknown,
  isInternetReachable: null,
};

let connectionListeners: Array<(state: ConnectionState) => void> = [];

/**
 * Initialize network monitoring
 * Call this once at app startup
 */
export function initConnectionHandler(): () => void {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const newState = mapNetInfoToConnectionState(state);

    // Log connection changes
    if (newState.status !== currentConnectionState.status) {
      secureLog(`Connection status changed: ${newState.status}`);
    }

    currentConnectionState = newState;

    // Notify all listeners
    connectionListeners.forEach((listener) => {
      try {
        listener(newState);
      } catch (e) {
        secureWarn("Error in connection listener", e);
      }
    });
  });

  return unsubscribe;
}

/**
 * Map NetInfo state to our simplified ConnectionState
 */
function mapNetInfoToConnectionState(state: NetInfoState): ConnectionState {
  let status: ConnectionStatus = "unknown";

  if (state.isConnected === false) {
    status = "offline";
  } else if (state.isInternetReachable === false) {
    status = "limited";
  } else if (state.isConnected && state.isInternetReachable) {
    status = "connected";
  }

  return {
    status,
    type: state.type,
    isInternetReachable: state.isInternetReachable,
  };
}

/**
 * Get current connection state
 */
export function getConnectionState(): ConnectionState {
  return currentConnectionState;
}

/**
 * Subscribe to connection state changes
 * Returns unsubscribe function
 */
export function onConnectionChange(
  listener: (state: ConnectionState) => void
): () => void {
  connectionListeners.push(listener);

  return () => {
    connectionListeners = connectionListeners.filter((l) => l !== listener);
  };
}

/**
 * Check if device is online (has internet connectivity)
 */
export function isOnline(): boolean {
  return currentConnectionState.status === "connected";
}

/**
 * Check if device has any network connection (may not have internet)
 */
export function hasNetworkConnection(): boolean {
  return (
    currentConnectionState.status === "connected" ||
    currentConnectionState.status === "limited"
  );
}

// ============================================================================
// User-Friendly Error Messages
// ============================================================================

/**
 * Get a user-friendly message for the current connection status
 * Designed for older adults - clear, simple language
 */
export function getConnectionStatusMessage(): string | null {
  switch (currentConnectionState.status) {
    case "offline":
      return "You are not connected to the internet. Some features may not work.";
    case "limited":
      return "Your internet connection is limited. Some features may be slow.";
    case "connected":
      return null; // No message needed when connected
    case "unknown":
      return null;
  }
}

/**
 * Transform technical network errors into user-friendly messages
 */
export function getNetworkErrorMessage(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Development-mode Metro bundler errors
  if (
    lowerMessage.includes("metro") ||
    lowerMessage.includes("bundle") ||
    lowerMessage.includes("packager")
  ) {
    // These are development-only errors, don't show to users in production
    if (__DEV__) {
      return "Development server connection lost. The app will reconnect automatically.";
    }
    return "Please restart the app if you experience issues.";
  }

  // Network timeout
  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return "The request is taking too long. Please check your internet connection and try again.";
  }

  // Connection refused / server unavailable
  if (
    lowerMessage.includes("network request failed") ||
    lowerMessage.includes("connection refused") ||
    lowerMessage.includes("fetch failed")
  ) {
    if (!isOnline()) {
      return "You are not connected to the internet. Please check your connection and try again.";
    }
    return "Could not connect to the server. Please try again in a moment.";
  }

  // DNS errors
  if (lowerMessage.includes("dns") || lowerMessage.includes("resolve")) {
    return "Could not reach the server. Please check your internet connection.";
  }

  // SSL/TLS errors
  if (
    lowerMessage.includes("ssl") ||
    lowerMessage.includes("certificate") ||
    lowerMessage.includes("tls")
  ) {
    return "Secure connection failed. Please check your device date and time settings.";
  }

  // Generic fallback - simple and clear
  return "Something went wrong with the connection. Please try again.";
}

// ============================================================================
// Retry Logic for Network Operations
// ============================================================================

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  onRetry: () => {},
};

/**
 * Execute an async operation with automatic retry on network errors
 * Uses exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };

  let lastError: unknown;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if offline - it will definitely fail
      if (!hasNetworkConnection()) {
        throw new Error(getNetworkErrorMessage(error));
      }

      // Last attempt - throw the error
      if (attempt > opts.maxRetries) {
        throw error;
      }

      // Notify about retry
      opts.onRetry(attempt, error);
      secureLog(`Network operation failed, retrying (${attempt}/${opts.maxRetries})...`);

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, opts.maxDelayMs);
    }
  }

  throw lastError;
}

// ============================================================================
// React Hook for Connection Status
// ============================================================================

import { useState, useEffect } from "react";

/**
 * React hook to get current connection state
 * Automatically updates when connection changes
 */
export function useConnectionState(): ConnectionState {
  const [state, setState] = useState<ConnectionState>(getConnectionState());

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = onConnectionChange(setState);

    // Check current state in case it changed before subscription
    NetInfo.fetch().then((netState) => {
      setState(mapNetInfoToConnectionState(netState));
    });

    return unsubscribe;
  }, []);

  return state;
}

/**
 * React hook to get simple online/offline status
 */
export function useIsOnline(): boolean {
  const state = useConnectionState();
  return state.status === "connected";
}
