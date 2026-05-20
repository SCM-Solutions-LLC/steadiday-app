import React, { useRef, useCallback } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets, Edge } from "react-native-safe-area-context";
import { useTheme } from "../utils/useTheme";
import { useResponsive } from "../utils/useResponsive";
import { ScreenErrorBoundary } from "./ui";

// ============================================================================
// SCREEN WRAPPER COMPONENT
// ============================================================================
// This component provides a standardized layout for all screens to ensure:
// - Consistent safe area handling (top/bottom)
// - No header cutoffs or disappearing headers
// - No content clipping on notched devices
// - Proper keyboard avoidance
// - Consistent bottom padding for scroll content
// ============================================================================

/**
 * Screen variant types:
 * - "scroll": Content can scroll (uses ScrollView)
 * - "static": Fixed content that doesn't scroll (uses View)
 * - "keyboard": Has text inputs, uses KeyboardAvoidingView with ScrollView
 */
export type ScreenVariant = "scroll" | "static" | "keyboard";

interface ScreenProps {
  children: React.ReactNode;
  /**
   * Screen variant determines scroll and keyboard behavior
   * @default "scroll"
   */
  variant?: ScreenVariant;
  /**
   * Safe area edges to apply
   * - For screens with React Navigation header: ["bottom"]
   * - For screens without header: ["top", "bottom"]
   * @default ["top", "bottom"]
   */
  edges?: Edge[];
  /**
   * Background color override (defaults to theme background)
   */
  backgroundColor?: string;
  /**
   * Custom style for the outer container
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Custom style for scroll content container
   * Only applies to "scroll" and "keyboard" variants
   */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Whether to show scroll indicator
   * @default true
   */
  showsVerticalScrollIndicator?: boolean;
  /**
   * Pull to refresh handler (only for scroll/keyboard variants)
   */
  onRefresh?: () => Promise<void>;
  /**
   * Whether refresh is currently in progress
   */
  refreshing?: boolean;
  /**
   * Extra bottom padding (in addition to safe area)
   * Useful for screens with fixed bottom buttons
   * @default 24
   */
  extraBottomPadding?: number;
  /**
   * Horizontal padding for content
   * @default 0
   */
  horizontalPadding?: number;
  /**
   * Whether the screen has a fixed bottom bar
   * Adds extra padding to scroll content
   * @default false
   */
  hasBottomBar?: boolean;
  /**
   * Height of the bottom bar (if hasBottomBar is true)
   * @default 80
   */
  bottomBarHeight?: number;
  /**
   * Max content width override. Undefined = auto (responsive), "none" = no capping.
   */
  maxContentWidth?: number | "none";
  /**
   * Test ID for the screen container
   */
  testID?: string;
}

/**
 * Screen - Unified screen wrapper component
 *
 * Usage:
 * ```tsx
 * // Simple scrolling screen
 * <Screen>
 *   <YourContent />
 * </Screen>
 *
 * // Static screen (no scroll)
 * <Screen variant="static">
 *   <YourContent />
 * </Screen>
 *
 * // Form screen with keyboard avoidance
 * <Screen variant="keyboard">
 *   <TextInput />
 *   <TextInput />
 * </Screen>
 *
 * // Screen with React Navigation header (only need bottom safe area)
 * <Screen edges={["bottom"]}>
 *   <YourContent />
 * </Screen>
 *
 * // Screen with fixed bottom button bar
 * <Screen hasBottomBar bottomBarHeight={80}>
 *   <YourContent />
 * </Screen>
 * ```
 */
export function Screen({
  children,
  variant = "scroll",
  edges = ["top", "bottom"],
  backgroundColor,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = true,
  onRefresh,
  refreshing = false,
  extraBottomPadding = 24,
  horizontalPadding,
  hasBottomBar = false,
  bottomBarHeight = 80,
  maxContentWidth,
  testID,
}: ScreenProps) {
  const { colors, primary } = useTheme();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const scrollRef = useRef<ScrollView>(null);

  // Flash scroll indicators briefly so users know the screen is scrollable
  const handleScrollViewLayout = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.flashScrollIndicators();
    }, 300);
  }, []);

  const bgColor = backgroundColor ?? colors.background;
  const effectivePadding = horizontalPadding ?? (responsive.isTablet || responsive.isLandscape ? responsive.horizontalPadding : 4);
  const effectiveMaxWidth = maxContentWidth === "none" ? undefined : (maxContentWidth ?? responsive.contentMaxWidth);

  // Calculate bottom padding for scroll content
  // Include safe area bottom inset + extra padding + optional bottom bar height
  const bottomPadding = (() => {
    let padding = extraBottomPadding;
    // Only add safe area bottom if we're handling it (i.e., "bottom" is in edges)
    // If React Navigation handles it, we don't double-add
    if (!edges.includes("bottom")) {
      padding += insets.bottom;
    }
    if (hasBottomBar) {
      padding += bottomBarHeight;
    }
    return padding;
  })();

  // Common scroll view props
  const scrollViewProps = {
    showsVerticalScrollIndicator,
    keyboardShouldPersistTaps: "handled" as const,
    keyboardDismissMode: "interactive" as const,
    automaticallyAdjustContentInsets: false,
    contentInsetAdjustmentBehavior: "never" as const,
    scrollIndicatorInsets: { bottom: bottomPadding },
  };

  const contentCapStyle: ViewStyle | undefined = effectiveMaxWidth ? {
    maxWidth: effectiveMaxWidth,
    width: "100%",
    alignSelf: "center",
  } : undefined;

  const scrollContentStyle: StyleProp<ViewStyle> = [
    {
      flexGrow: 1,
      paddingBottom: bottomPadding,
      paddingHorizontal: effectivePadding,
    },
    contentCapStyle,
    contentContainerStyle,
  ];

  // Refresh control (if onRefresh is provided)
  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={primary}
      colors={[primary]}
    />
  ) : undefined;

  // Render content based on variant
  const renderContent = () => {
    switch (variant) {
      case "static":
        return (
          <View
            style={[
              {
                flex: 1,
                paddingBottom: bottomPadding,
                paddingHorizontal: effectivePadding,
              },
              contentCapStyle,
              contentContainerStyle,
            ]}
          >
            {children}
          </View>
        );

      case "keyboard":
        return (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <ScrollView
              ref={scrollRef}
              {...scrollViewProps}
              contentContainerStyle={scrollContentStyle}
              refreshControl={refreshControl}
              onLayout={handleScrollViewLayout}
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        );

      case "scroll":
      default:
        return (
          <ScrollView
            ref={scrollRef}
            {...scrollViewProps}
            contentContainerStyle={scrollContentStyle}
            refreshControl={refreshControl}
            onLayout={handleScrollViewLayout}
          >
            {children}
          </ScrollView>
        );
    }
  };

  return (
    <ScreenErrorBoundary screenName="Screen">
      <SafeAreaView
        style={[{ flex: 1, backgroundColor: bgColor }, style]}
        edges={edges}
        testID={testID}
      >
        <StatusBar
          barStyle={colors.textPrimary === "#000000" || colors.textPrimary === "#1A1A1A" ? "dark-content" : "light-content"}
          backgroundColor={bgColor}
        />
        {renderContent()}
      </SafeAreaView>
    </ScreenErrorBoundary>
  );
}

// ============================================================================
// SCREEN HEADER COMPONENT
// ============================================================================
// For screens that need a custom header instead of React Navigation header

interface ScreenHeaderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * ScreenHeader - Custom header component for screens without React Navigation header
 *
 * Usage:
 * ```tsx
 * <Screen edges={["bottom"]}> // Let Screen handle top safe area
 *   <ScreenHeader>
 *     <Text>My Header</Text>
 *   </ScreenHeader>
 *   <YourContent />
 * </Screen>
 * ```
 */
export function ScreenHeader({ children, style }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          paddingTop: insets.top,
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ============================================================================
// SCREEN FOOTER COMPONENT
// ============================================================================
// For fixed bottom bars/buttons

interface ScreenFooterProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Whether to include safe area bottom padding
   * @default true
   */
  includeSafeArea?: boolean;
}

/**
 * ScreenFooter - Fixed bottom bar component
 *
 * Usage:
 * ```tsx
 * <Screen hasBottomBar bottomBarHeight={80}>
 *   <YourScrollContent />
 *   <ScreenFooter>
 *     <Button title="Continue" />
 *   </ScreenFooter>
 * </Screen>
 * ```
 */
export function ScreenFooter({ children, style, includeSafeArea = true }: ScreenFooterProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: includeSafeArea ? insets.bottom : 0,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default Screen;
