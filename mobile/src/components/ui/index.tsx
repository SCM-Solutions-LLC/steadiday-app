import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  RefreshControl,
  AccessibilityInfo,
  ViewStyle,
  StyleProp,
  DimensionValue,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../utils/useTheme";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { logger } from "../../utils/logger";

// ============================================================================
// TOAST COMPONENT
// ============================================================================
export type ToastType = "success" | "error" | "info" | "undo";

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss?: () => void;
  onUndo?: () => void;
}

export function Toast({
  visible,
  message,
  type,
  duration = 3000,
  onDismiss,
  onUndo,
}: ToastProps) {
  const { colors, primary } = useTheme();
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(100);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return { bg: colors.success, icon: "checkmark-circle" as const, iconColor: "#FFFFFF" };
      case "error":
        return { bg: colors.error, icon: "alert-circle" as const, iconColor: "#FFFFFF" };
      case "info":
        return { bg: primary, icon: "information-circle" as const, iconColor: "#FFFFFF" };
      case "undo":
        return { bg: "#374151", icon: "refresh" as const, iconColor: "#FFFFFF" };
      default:
        return { bg: colors.textPrimary, icon: "information-circle" as const, iconColor: "#FFFFFF" };
    }
  };

  const styles = getToastStyles();

  const handleDismiss = useCallback(() => {
    opacity.value = withTiming(0, { duration: 150 });
    translateY.value = withTiming(100, { duration: 150 }, () => {
      if (onDismiss) {
        runOnJS(onDismiss)();
      }
    });
  }, [opacity, translateY, onDismiss]);

  useEffect(() => {
    if (visible) {
      // Trigger haptic
      if (hapticEnabled) {
        if (type === "success") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === "error") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }

      // Animate in
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) });

      // Auto dismiss (except undo toasts which stay longer)
      const dismissDuration = type === "undo" ? 5000 : duration;
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, dismissDuration);
    } else {
      // Animate out
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(100, { duration: 150 });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, type, duration, hapticEnabled, opacity, translateY, handleDismiss]);

  const handleUndo = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (onUndo) {
      onUndo();
    }
    handleDismiss();
  }, [onUndo, handleDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Don't read shared values directly - use visible state instead
  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: 100,
          left: 20,
          right: 20,
          zIndex: 9999,
        },
        animatedStyle,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View
        className="flex-row items-center px-5 py-4 rounded-2xl"
        style={{
          backgroundColor: styles.bg,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name={styles.icon} size={24} color={styles.iconColor} />
        <Text
          className={`${textClasses.body} flex-1 ml-3`}
          style={{ color: "#FFFFFF" }}
          numberOfLines={2}
        >
          {message}
        </Text>
        {type === "undo" && onUndo && (
          <Pressable
            onPress={handleUndo}
            className="ml-4 px-4 py-2 rounded-lg"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            accessibilityRole="button"
            accessibilityLabel="Undo action"
          >
            <Text className="text-white font-semibold">Undo</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================================
// useToast HOOK
// ============================================================================
interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  onUndo?: () => void;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "info",
  });

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showSuccess = useCallback((message: string) => {
    setToast({ visible: true, message, type: "success" });
  }, []);

  const showError = useCallback((message: string) => {
    setToast({ visible: true, message, type: "error" });
  }, []);

  const showUndo = useCallback((message: string, onUndo: () => void) => {
    setToast({ visible: true, message, type: "undo", onUndo });
  }, []);

  const ToastComponent = (
    <Toast
      visible={toast.visible}
      message={toast.message}
      type={toast.type}
      onDismiss={hideToast}
      onUndo={toast.onUndo}
    />
  );

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showUndo,
    ToastComponent,
  };
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================
interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  tip?: string;
  secondaryTip?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  illustration?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  tip,
  secondaryTip,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  illustration,
}: EmptyStateProps) {
  const { colors, primary, primaryLight } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  // Entrance animation
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 24 }, animatedStyle]}>
      {illustration ? (
        <View className="mb-6">
          {illustration}
        </View>
      ) : (
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: primaryLight }}
        >
          <Ionicons name={icon} size={48} color={primary} />
        </View>
      )}

      <Text
        className={`${textClasses.subtitle} text-center mb-3 font-semibold`}
        style={{ color: colors.textPrimary }}
      >
        {title}
      </Text>

      <Text
        className={`${textClasses.body} text-center mb-6 leading-relaxed px-4`}
        style={{ color: colors.textSecondary }}
      >
        {description}
      </Text>

      {tip && (
        <View
          className="flex-row items-start rounded-2xl p-4 mb-4 w-full"
          style={{ backgroundColor: "#FEF9C3" }}
        >
          <Ionicons name="bulb" size={20} color="#CA8A04" style={{ marginTop: 2 }} />
          <Text
            className={`${textClasses.small} flex-1 ml-3 leading-relaxed`}
            style={{ color: "#854D0E" }}
          >
            {tip}
          </Text>
        </View>
      )}

      {secondaryTip && (
        <View
          className="flex-row items-start rounded-2xl p-4 mb-6 w-full"
          style={{ backgroundColor: primaryLight }}
        >
          <Ionicons name="information-circle" size={20} color={primary} style={{ marginTop: 2 }} />
          <Text
            className={`${textClasses.small} flex-1 ml-3 leading-relaxed`}
            style={{ color: colors.textPrimary }}
          >
            {secondaryTip}
          </Text>
        </View>
      )}

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="w-full py-4 rounded-2xl items-center justify-center"
          style={{ backgroundColor: primary, minHeight: 56 }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text className={`${textClasses.button} text-white font-semibold`}>
            {actionLabel}
          </Text>
        </Pressable>
      )}

      {secondaryActionLabel && onSecondaryAction && (
        <Pressable
          onPress={onSecondaryAction}
          className="mt-4"
          accessibilityRole="button"
          accessibilityLabel={secondaryActionLabel}
        >
          <Text
            className={`${textClasses.body} font-semibold`}
            style={{ color: primary }}
          >
            {secondaryActionLabel}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// ============================================================================
// REFRESHABLE SCROLL VIEW
// ============================================================================
interface RefreshableScrollViewProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  className?: string;
  showsVerticalScrollIndicator?: boolean;
}

export function RefreshableScrollView({
  children,
  onRefresh,
  style,
  contentContainerStyle,
  className,
  showsVerticalScrollIndicator = true,
}: RefreshableScrollViewProps) {
  const [refreshing, setRefreshing] = useState(false);
  const { primary } = useTheme();
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);

  const handleRefresh = useCallback(async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setRefreshing(true);
    try {
      await onRefresh();
      if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      logger.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, hapticEnabled]);

  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      className={className}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={primary}
          colors={[primary]}
        />
      }
    >
      {children}
    </ScrollView>
  );
}

// ============================================================================
// SEARCH INPUT
// ============================================================================
interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = "Search...",
  autoFocus = false,
}: SearchInputProps) {
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  return (
    <View
      className="flex-row items-center px-4 rounded-xl mb-4"
      style={{ backgroundColor: colors.inputBackground, minHeight: 52, borderWidth: 1, borderColor: colors.inputBorder }}
    >
      <Ionicons name="search" size={22} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        autoFocus={autoFocus}
        selectionColor={primary}
        cursorColor={primary}
        className={`flex-1 ml-3 ${textClasses.body}`}
        style={{
          color: colors.textPrimary,
          paddingVertical: 12,
        }}
        accessibilityLabel="Search"
        accessibilityHint={placeholder}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText("")}
          className="p-2"
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================
interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    // Create a pulsing animation using withRepeat
    opacity.value = withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) });

    const interval = setInterval(() => {
      opacity.value = withSequence(
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) })
      );
    }, 1600);

    return () => {
      clearInterval(interval);
    };
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: width as DimensionValue,
          height,
          borderRadius,
          backgroundColor: "#E5E7EB",
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-2xl p-5 mb-3"
      style={{ backgroundColor: colors.cardBackground }}
    >
      <View className="flex-row items-start">
        <Skeleton width={48} height={48} borderRadius={24} />
        <View className="flex-1 ml-4">
          <Skeleton width="70%" height={18} style={{ marginBottom: 10 }} />
          <Skeleton width="50%" height={14} />
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// SCREEN ERROR BOUNDARY
// ============================================================================
interface ScreenErrorBoundaryProps {
  children: React.ReactNode;
  screenName?: string;
  onRetry?: () => void;
}

interface ScreenErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ScreenErrorBoundary extends React.Component<
  ScreenErrorBoundaryProps,
  ScreenErrorBoundaryState
> {
  constructor(props: ScreenErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const screenName = this.props.screenName || "Unknown";
    logger.error(`[${screenName}] Screen error:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      const screenName = this.props.screenName || "this screen";
      return (
        <View
          className="flex-1 items-center justify-center p-8"
          style={{ backgroundColor: "#FFF9ED" }}
        >
          <View
            className="items-center justify-center rounded-full"
            style={{
              width: 80,
              height: 80,
              backgroundColor: "#FEE2E2",
            }}
          >
            <Ionicons name="warning" size={48} color="#CC3A3A" />
          </View>
          <Text className="text-2xl font-semibold text-center mt-6 text-gray-900">
            Something went wrong
          </Text>
          <Text className="text-base text-center mt-3 text-gray-600 leading-relaxed px-4">
            There was a problem loading {screenName}. Please try again.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            className="mt-8 px-8 py-4 rounded-2xl"
            style={{ backgroundColor: "#2F80ED", minWidth: 160 }}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text className="text-white font-semibold text-lg text-center">
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// WIDGET MOVE ANIMATION HOOK
// ============================================================================
export function useWidgetMoveAnimation(hapticEnabled: boolean) {
  const scale = useSharedValue(1);
  const shadowOpacityVal = useSharedValue(0);
  const itemOpacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: itemOpacity.value,
    };
  });

  const triggerMoveAnimation = useCallback(
    (onComplete: () => void) => {
      // Haptic at start
      if (hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Scale up animation
      scale.value = withSequence(
        withTiming(1.03, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(1.03, { duration: 400 }),
        withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) })
      );

      // Execute the reorder after a brief delay to show the "lift"
      setTimeout(() => {
        onComplete();
        // Success haptic when complete
        if (hapticEnabled) {
          setTimeout(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }, 500);
        }
      }, 150);
    },
    [hapticEnabled, scale]
  );

  const triggerDisplaceAnimation = useCallback(() => {
    // For widgets being pushed out of the way
    itemOpacity.value = withSequence(
      withTiming(0.6, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );
  }, [itemOpacity]);

  return {
    animatedStyle,
    triggerMoveAnimation,
    triggerDisplaceAnimation,
  };
}

// ============================================================================
// RE-EXPORTS FROM SEPARATE FILES
// ============================================================================
export { default as AnimatedTip } from "./AnimatedTip";
export { default as AnimatedGuideTip } from "./AnimatedGuideTip";
export { default as PulsingHighlight } from "./PulsingHighlight";
export { default as CustomToggle } from "./CustomToggle";
export { default as InlineTip } from "./InlineTip";
export { default as WhatThisMeansCard, WhatThisMeansPresets } from "./WhatThisMeansCard";
export { default as PrivacyFooterLink } from "./PrivacyFooterLink";
export { default as SourceLabel, SourceLabelInline } from "./SourceLabel";
export { PrivacyFooter, PrivacyHeader, FixedPrivacyFooter } from "./PrivacyFooter";
export { Screen, ScreenHeader, ScreenFooter, type ScreenVariant } from "../Screen";
export { default as DismissableInfoBox, resetInfoBoxDismissal, resetAllInfoBoxDismissals } from "./DismissableInfoBox";
export { default as SubpageHeader } from "./SubpageHeader";
export { BackButton } from "./BackButton";
