import React, { useEffect } from "react";
import { View, DimensionValue, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../../utils/useTheme";

// ============================================================================
// BASE SKELETON COMPONENT - Shimmer animation
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
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    // Smooth pulsing animation
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      false // Don't reverse
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

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

// ============================================================================
// SKELETON CARD - Generic card placeholder
// ============================================================================
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
// MEDICATION SKELETON - For medication list items
// ============================================================================
export function MedicationSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-2xl p-5 mb-3 border"
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: colors.divider,
      }}
    >
      <View className="flex-row items-center">
        {/* Icon placeholder */}
        <Skeleton width={56} height={56} borderRadius={16} />

        {/* Content */}
        <View className="flex-1 ml-4">
          <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={16} style={{ marginBottom: 6 }} />
          <Skeleton width="30%" height={14} />
        </View>

        {/* Action button placeholder */}
        <Skeleton width={48} height={48} borderRadius={24} />
      </View>
    </View>
  );
}

// ============================================================================
// TASK SKELETON - For task list items
// ============================================================================
export function TaskSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-2xl p-5 mb-3 border"
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: colors.divider,
      }}
    >
      <View className="flex-row items-start">
        {/* Checkbox placeholder */}
        <Skeleton width={28} height={28} borderRadius={14} />

        {/* Content */}
        <View className="flex-1 ml-4">
          <Skeleton width="75%" height={18} style={{ marginBottom: 8 }} />
          <View className="flex-row items-center">
            <Skeleton width={16} height={16} borderRadius={8} />
            <Skeleton width="30%" height={14} style={{ marginLeft: 8 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// CONTACT SKELETON - For contact list items
// ============================================================================
export function ContactSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-2xl p-5 mb-3 border"
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: colors.divider,
      }}
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        <Skeleton width={56} height={56} borderRadius={28} />

        {/* Content */}
        <View className="flex-1 ml-4">
          <Skeleton width="50%" height={20} style={{ marginBottom: 8 }} />
          <Skeleton width="35%" height={14} />
        </View>

        {/* Call button */}
        <Skeleton width={48} height={48} borderRadius={24} />
      </View>
    </View>
  );
}

// ============================================================================
// INSURANCE CARD SKELETON - For insurance cards
// ============================================================================
export function InsuranceCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-2xl p-6 mb-4"
      style={{ backgroundColor: colors.cardBackground }}
    >
      {/* Card type badge */}
      <Skeleton width={80} height={24} borderRadius={12} style={{ marginBottom: 16 }} />

      {/* Provider name */}
      <Skeleton width="70%" height={24} style={{ marginBottom: 12 }} />

      {/* Member ID */}
      <View className="flex-row items-center mb-3">
        <Skeleton width={80} height={16} />
        <Skeleton width="40%" height={16} style={{ marginLeft: 8 }} />
      </View>

      {/* Group number */}
      <View className="flex-row items-center">
        <Skeleton width={80} height={16} />
        <Skeleton width="30%" height={16} style={{ marginLeft: 8 }} />
      </View>
    </View>
  );
}

// ============================================================================
// DOCTOR SKELETON - For doctor list items
// ============================================================================
export function DoctorSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-2xl p-5 mb-3 border"
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: colors.divider,
      }}
    >
      <View className="flex-row items-start">
        {/* Doctor icon */}
        <Skeleton width={56} height={56} borderRadius={16} />

        {/* Content */}
        <View className="flex-1 ml-4">
          <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={16} style={{ marginBottom: 6 }} />
          <Skeleton width="70%" height={14} />
        </View>
      </View>

      {/* Action buttons */}
      <View className="flex-row mt-4 pt-4 border-t" style={{ borderTopColor: colors.divider }}>
        <Skeleton width="45%" height={44} borderRadius={12} />
        <Skeleton width="45%" height={44} borderRadius={12} style={{ marginLeft: 12 }} />
      </View>
    </View>
  );
}

// ============================================================================
// WIDGET SKELETON - For home screen widgets
// ============================================================================
export function WidgetSkeleton({ height = 120 }: { height?: number }) {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-2xl p-5 mb-4"
      style={{
        backgroundColor: colors.cardBackground,
        height,
      }}
    >
      <View className="flex-row items-center mb-4">
        <Skeleton width={40} height={40} borderRadius={12} />
        <Skeleton width="40%" height={20} style={{ marginLeft: 12 }} />
      </View>
      <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={16} />
    </View>
  );
}

// ============================================================================
// LIST SKELETON - Multiple skeleton items
// ============================================================================
interface ListSkeletonProps {
  count?: number;
  ItemSkeleton?: React.ComponentType;
}

export function ListSkeleton({
  count = 3,
  ItemSkeleton = SkeletonCard,
}: ListSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ItemSkeleton key={index} />
      ))}
    </>
  );
}

// ============================================================================
// SCREEN SKELETON - Full screen loading placeholder
// ============================================================================
interface ScreenSkeletonProps {
  headerHeight?: number;
  itemCount?: number;
  ItemSkeleton?: React.ComponentType;
}

export function ScreenSkeleton({
  headerHeight = 60,
  itemCount = 4,
  ItemSkeleton = SkeletonCard,
}: ScreenSkeletonProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header placeholder */}
      <View
        className="px-6 py-4"
        style={{ height: headerHeight }}
      >
        <Skeleton width="50%" height={28} />
      </View>

      {/* Content */}
      <View className="px-6 pt-4">
        <ListSkeleton count={itemCount} ItemSkeleton={ItemSkeleton} />
      </View>
    </View>
  );
}

// ============================================================================
// LOADING OVERLAY - Semi-transparent overlay with spinner alternative
// ============================================================================
export function LoadingOverlay() {
  return (
    <View
      className="absolute inset-0 items-center justify-center"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
    >
      <View
        className="w-20 h-20 rounded-2xl items-center justify-center"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.1)" }}
      >
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>
    </View>
  );
}

// ============================================================================
// WEATHER WIDGET SKELETON - For the weather widget on home screen
// ============================================================================
export function WeatherWidgetSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-3xl p-4 mb-6 border"
      style={{ backgroundColor: colors.cardBackground, borderColor: colors.divider }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Skeleton width={80} height={20} borderRadius={4} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>

      {/* Weather content */}
      <View className="flex-row items-center">
        <Skeleton width={64} height={64} borderRadius={16} />
        <View className="ml-4 flex-1">
          <Skeleton width={80} height={32} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width={100} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width={120} height={14} borderRadius={4} />
        </View>
      </View>

      {/* Location bar */}
      <View className="mt-3 pt-3 border-t flex-row items-center" style={{ borderTopColor: colors.divider }}>
        <Skeleton width={18} height={18} borderRadius={9} />
        <Skeleton width="60%" height={14} borderRadius={4} style={{ marginLeft: 8 }} />
      </View>
    </View>
  );
}

// ============================================================================
// HEALTH METRIC CARD SKELETON - For health metric cards
// ============================================================================
export function HealthMetricCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-3xl p-5 mb-4 border-2"
      style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
    >
      {/* Header row */}
      <View className="flex-row items-center mb-4">
        <Skeleton width={56} height={56} borderRadius={16} />
        <View className="flex-1 ml-3">
          <Skeleton width="50%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width="70%" height={16} borderRadius={4} />
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>

      {/* Progress bar */}
      <Skeleton width="100%" height={12} borderRadius={6} style={{ marginBottom: 8 }} />
      <Skeleton width={80} height={14} borderRadius={4} style={{ alignSelf: "flex-end", marginBottom: 16 }} />

      {/* Mini chart */}
      <View className="flex-row items-end justify-between" style={{ height: 80 }}>
        {Array.from({ length: 7 }).map((_, index) => (
          <View key={index} className="flex-1 items-center" style={{ marginHorizontal: 2 }}>
            <Skeleton width="100%" height={Math.random() * 40 + 20} borderRadius={4} />
            <Skeleton width={24} height={12} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>
    </View>
  );
}
