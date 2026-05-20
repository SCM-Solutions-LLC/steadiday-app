import React, { Component, useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../utils/useTheme";
import { logger } from "../utils/logger";
import { recordError } from "../utils/firebase";

// ============================================================================
// ERROR FALLBACK UI - Accessible for older adults
// ============================================================================
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  screenName?: string;
}

export function ErrorFallback({ error, resetError, screenName }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { colors, primary } = useTheme();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
      >
        <View className="items-center">
          {/* Error Icon */}
          <View
            className="w-28 h-28 rounded-full items-center justify-center mb-8"
            style={{ backgroundColor: colors.errorBackground }}
          >
            <Ionicons name="alert-circle" size={64} color={colors.error} />
          </View>

          {/* Title */}
          <Text
            className="text-2xl font-bold text-center mb-4"
            style={{ color: colors.textPrimary }}
          >
            Something went wrong
          </Text>

          {/* Description - Senior friendly */}
          <Text
            className="text-lg text-center mb-8 leading-relaxed px-4"
            style={{ color: colors.textSecondary }}
          >
            {screenName
              ? `There was a problem loading ${screenName}. Please try again.`
              : "There was a problem. Please try again."}
          </Text>

          {/* Retry Button - Large touch target */}
          <Pressable
            onPress={resetError}
            className="w-full py-5 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: primary, minHeight: 64 }}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            accessibilityHint="Tap to reload this screen"
          >
            <View className="flex-row items-center">
              <Ionicons name="refresh" size={24} color={colors.onPrimary} />
              <Text className="text-xl font-semibold ml-3" style={{ color: colors.onPrimary }}>
                Try Again
              </Text>
            </View>
          </Pressable>

          {/* Show Details Toggle */}
          <Pressable
            onPress={() => setShowDetails(!showDetails)}
            className="py-3"
            accessibilityRole="button"
            accessibilityLabel={showDetails ? "Hide error details" : "Show error details"}
          >
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              {showDetails ? "Hide Details" : "Show Details"}
            </Text>
          </Pressable>

          {/* Error Details */}
          {showDetails && (
            <View
              className="mt-4 p-4 rounded-xl w-full"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <Text
                className="text-sm font-mono"
                style={{ color: colors.textPrimary }}
              >
                {error.message}
              </Text>
              {error.stack && (
                <Text
                  className="text-xs font-mono mt-2"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={5}
                >
                  {error.stack.split("\n").slice(0, 5).join("\n")}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// ============================================================================
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  screenName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("[ErrorBoundary] Caught error:", error);
    logger.error("[ErrorBoundary] Error info:", errorInfo);
    console.error(`[ErrorBoundary:${this.props.screenName || "unknown"}]`, error?.message, errorInfo?.componentStack);
    try { recordError(error, `[ErrorBoundary:${this.props.screenName || "unknown"}]`); } catch {}

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          screenName={this.props.screenName}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// withErrorBoundary HOC
// Wraps a component with an error boundary
// ============================================================================
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  screenName?: string
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";

  const ComponentWithErrorBoundary = (props: P) => {
    return (
      <ErrorBoundary screenName={screenName || displayName}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

// ============================================================================
// useErrorHandler HOOK
// For handling errors in functional components
// ============================================================================
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err);
    } else {
      setError(new Error(String(err)));
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Throw to nearest error boundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}

// ============================================================================
// WIDGET ERROR BOUNDARY
// Smaller, inline error display for widgets
// ============================================================================
interface WidgetErrorFallbackProps {
  widgetName: string;
  onRetry: () => void;
}

export function WidgetErrorFallback({ widgetName, onRetry }: WidgetErrorFallbackProps) {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-2xl p-4 items-center"
      style={{ backgroundColor: colors.errorBackground }}
    >
      <Ionicons name="warning-outline" size={24} color={colors.error} />
      <Text
        className="text-sm text-center mt-2"
        style={{ color: colors.onError }}
      >
        Could not load {widgetName}
      </Text>
      <Pressable
        onPress={onRetry}
        className="mt-3 px-4 py-2 rounded-lg"
        style={{ backgroundColor: colors.error }}
        accessibilityRole="button"
        accessibilityLabel={`Retry loading ${widgetName}`}
      >
        <Text className="text-sm font-medium" style={{ color: colors.onPrimary }}>Retry</Text>
      </Pressable>
    </View>
  );
}

interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
  widgetName: string;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
}

export class WidgetErrorBoundary extends Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): WidgetErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(`[WidgetErrorBoundary] Error in ${this.props.widgetName}:`, error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <WidgetErrorFallback
          widgetName={this.props.widgetName}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
