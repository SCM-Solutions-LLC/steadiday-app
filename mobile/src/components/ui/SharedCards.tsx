/**
 * SharedCards - Premium unified card system for Mind Breaks and Tools
 *
 * Design Principles:
 * - Fixed heights for consistent visual rhythm
 * - No animation on initial mount
 * - Animation only on user interaction (press, complete, etc.)
 * - Performance optimized: opacity and transform only
 * - Strict layout slots for predictable positioning
 */

import React, { useCallback } from "react";
import { View, Text, Pressable, PixelRatio, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  type SharedValue,
} from "react-native-reanimated";
import { useResponsive } from "../../utils/useResponsive";

const getFontScale = () => PixelRatio.getFontScale();
const isLargeFont = () => getFontScale() >= 1.2;

// =============================================================================
// CARD HEIGHT CONSTANTS - Fixed for visual rhythm
// =============================================================================
export const CARD_HEIGHTS = {
  hero: 200,           // Today's Pick, Featured items
  standard: 96,        // Tool list items, Game list items
  compact: 80,         // Secondary items
  gridItem: 180,       // 2-column grid items (games, learning)
  gridItemSmall: 160,  // Smaller 2-column items
};

// =============================================================================
// SHARED TYPES
// =============================================================================
interface BaseCardProps {
  colors: any;
  textClasses: any;
  isDark: boolean;
  hapticEnabled?: boolean;
}

// =============================================================================
// HERO FEATURE CARD - For Today's Pick, Featured Tools
// Fixed height: 200px
// =============================================================================
interface HeroFeatureCardProps extends BaseCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  badge?: string;
  actionLabel: string;
  onPress: () => void;
  completed?: boolean;
  glowIntensity?: SharedValue<number>;
}

export function HeroFeatureCard({
  title,
  subtitle,
  icon,
  iconColor,
  badge,
  actionLabel,
  onPress,
  completed,
  colors,
  textClasses,
  isDark,
  hapticEnabled = true,
}: HeroFeatureCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          animatedStyle,
          {
            height: CARD_HEIGHTS.hero,
            borderRadius: 24,
            backgroundColor: colors.cardBackground,
            overflow: "hidden",
            shadowColor: iconColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 6,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Top accent bar */}
        <View
          style={{
            height: 4,
            backgroundColor: iconColor,
          }}
        />

        {/* Content container with strict slots */}
        <View style={{ flex: 1, padding: 20, flexDirection: "row" }}>
          {/* LEFT SLOT: Icon */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: iconColor + "15",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
              borderWidth: 1,
              borderColor: iconColor + "25",
            }}
          >
            <Ionicons name={icon} size={36} color={iconColor} />
          </View>

          {/* MIDDLE SLOT: Text content */}
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text
              className={`${textClasses.title} font-bold`}
              style={{ color: colors.textPrimary }}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              className={`${textClasses.body} mt-1`}
              style={{ color: colors.textSecondary }}
              numberOfLines={2}
            >
              {subtitle}
            </Text>

            {/* Badge slot */}
            {badge && (
              <View
                style={{
                  alignSelf: "flex-start",
                  marginTop: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: iconColor + "15",
                  borderWidth: 1,
                  borderColor: iconColor + "30",
                }}
              >
                <Text
                  className={`${textClasses.small} font-medium`}
                  style={{ color: iconColor }}
                >
                  {badge}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* BOTTOM SLOT: Action button */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <View
            style={{
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: iconColor,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: iconColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
            }}
          >
            <Ionicons name={completed ? "checkmark" : "play"} size={20} color="#FFFFFF" />
            <Text
              style={{
                color: "#FFFFFF",
                fontWeight: "700",
                fontSize: 16,
                marginLeft: 8,
              }}
            >
              {completed ? "Play Again" : actionLabel}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// LIST ITEM CARD - For Tools list, Settings list
// Fixed height: 96px
// =============================================================================
interface ListItemCardProps extends BaseCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor?: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  isFavorite?: boolean;
}

export function ListItemCard({
  title,
  description,
  icon,
  iconColor,
  iconBgColor,
  onPress,
  rightElement,
  showChevron = true,
  isFavorite,
  colors,
  textClasses,
  isDark,
  hapticEnabled = true,
}: ListItemCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          animatedStyle,
          {
            height: CARD_HEIGHTS.standard,
            borderRadius: 20,
            backgroundColor: colors.cardBackground,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            marginBottom: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 2,
            borderWidth: 1,
            borderColor: colors.border + "80",
          },
        ]}
      >
        {/* LEFT SLOT: Icon with soft background */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: iconBgColor || iconColor + "15",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <Ionicons name={icon} size={28} color={iconColor} />
        </View>

        {/* MIDDLE SLOT: Content */}
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              className={`${textClasses.body} font-semibold`}
              style={{ color: colors.textPrimary }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {isFavorite && (
              <Ionicons
                name="star"
                size={14}
                color={colors.warning}
                style={{ marginLeft: 6 }}
              />
            )}
          </View>
          <Text
            className={`${textClasses.small} mt-0.5`}
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            {description}
          </Text>
        </View>

        {/* RIGHT SLOT: Chevron or custom element */}
        {rightElement || (showChevron && (
          <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
        ))}
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// GRID CARD - For 2-column layouts (Games, Learning categories)
// Fixed height: 180px
// =============================================================================
interface GridCardProps extends BaseCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  badge?: string;
  onPress: () => void;
  index?: number;
}

export function GridCard({
  title,
  subtitle,
  icon,
  iconColor,
  badge,
  onPress,
  colors,
  textClasses,
  isDark,
  hapticEnabled = true,
  index = 0,
}: GridCardProps) {
  const scale = useSharedValue(1);
  const { width: screenWidth } = useWindowDimensions();
  const responsive = useResponsive();
  const fontScale = getFontScale();
  const useSingleColumn = fontScale >= 1.2;

  const effectiveWidth = responsive.contentMaxWidth ? Math.min(screenWidth, responsive.contentMaxWidth) : screenWidth;
  const columns = useSingleColumn ? 1 : responsive.gridColumns;
  const gap = 16;
  const padding = 48;
  const cardWidth = useSingleColumn
    ? effectiveWidth - padding
    : (effectiveWidth - padding - gap * (columns - 1)) / columns;

  const cardHeight = useSingleColumn ? 140 : CARD_HEIGHTS.gridItem;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          animatedStyle,
          {
            width: cardWidth,
            height: cardHeight,
            borderRadius: 20,
            backgroundColor: colors.cardBackground,
            overflow: "hidden",
            marginBottom: 12,
            shadowColor: iconColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 3,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Top accent bar */}
        <View
          style={{
            height: 3,
            backgroundColor: iconColor,
          }}
        />

        {/* Content - horizontal for single column, vertical otherwise */}
        <View style={{
          flex: 1,
          padding: 16,
          flexDirection: useSingleColumn ? "row" : "column",
          alignItems: useSingleColumn ? "center" : "flex-start",
        }}>
          {/* Icon */}
          <View
            style={{
              width: useSingleColumn ? 56 : 52,
              height: useSingleColumn ? 56 : 52,
              borderRadius: 14,
              backgroundColor: iconColor + "15",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: useSingleColumn ? 0 : 12,
              marginRight: useSingleColumn ? 16 : 0,
              borderWidth: 1,
              borderColor: iconColor + "25",
            }}
          >
            <Ionicons name={icon} size={26} color={iconColor} />
          </View>

          {/* Text content */}
          <View style={{ flex: 1 }}>
            <Text
              className={`${textClasses.body} font-bold`}
              style={{ color: colors.textPrimary }}
              numberOfLines={useSingleColumn ? 1 : 2}
            >
              {title}
            </Text>
            <Text
              className={`${textClasses.small} mt-1`}
              style={{ color: colors.textSecondary }}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          </View>

          {/* Badge - positioned differently for single column */}
          {badge && (
            <View
              style={{
                position: useSingleColumn ? "relative" : "absolute",
                bottom: useSingleColumn ? undefined : 12,
                right: useSingleColumn ? undefined : 12,
                marginLeft: useSingleColumn ? 12 : 0,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
                backgroundColor: isDark ? colors.surfaceSubtle : colors.divider,
              }}
            >
              <Text
                className={`${textClasses.caption} font-medium`}
                style={{ color: colors.textSecondary }}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// COMPACT GRID CARD - For smaller 2-column items
// Fixed height: 160px
// =============================================================================
interface CompactGridCardProps extends BaseCardProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  onPress: () => void;
}

export function CompactGridCard({
  title,
  subtitle,
  icon,
  iconColor,
  onPress,
  colors,
  textClasses,
  isDark,
  hapticEnabled = true,
}: CompactGridCardProps) {
  const scale = useSharedValue(1);
  const { width: screenWidth } = useWindowDimensions();
  const responsive = useResponsive();
  const fontScale = getFontScale();
  const useSingleColumn = fontScale >= 1.2;

  const effectiveWidth = responsive.contentMaxWidth ? Math.min(screenWidth, responsive.contentMaxWidth) : screenWidth;
  const columns = useSingleColumn ? 1 : responsive.gridColumns;
  const gap = 12;
  const padding = 48;
  const cardWidth = useSingleColumn
    ? effectiveWidth - padding
    : (effectiveWidth - padding - gap * (columns - 1)) / columns;

  const cardHeight = useSingleColumn ? 120 : CARD_HEIGHTS.gridItemSmall;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          animatedStyle,
          {
            width: cardWidth,
            height: cardHeight,
            borderRadius: 18,
            backgroundColor: colors.cardBackground,
            padding: 14,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: iconColor,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
            flexDirection: useSingleColumn ? "row" : "column",
            alignItems: useSingleColumn ? "center" : "flex-start",
          },
        ]}
      >
        {/* Icon */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: iconColor + "18",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: useSingleColumn ? 0 : 10,
            marginRight: useSingleColumn ? 14 : 0,
            borderWidth: 1,
            borderColor: iconColor + "25",
          }}
        >
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>

        {/* Text content */}
        <View style={{ flex: 1 }}>
          <Text
            className={`${textClasses.body} font-semibold`}
            style={{ color: colors.textPrimary }}
            numberOfLines={useSingleColumn ? 1 : 2}
          >
            {title}
          </Text>

          {/* Subtitle */}
          {subtitle && (
            <Text
              className={`${textClasses.small} mt-0.5`}
              style={{ color: colors.textSecondary }}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// SECTION HEADER - Consistent section titles with colored backgrounds
// =============================================================================
interface SectionHeaderProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  colors: any;
  textClasses: any;
  rightElement?: React.ReactNode;
  variant?: "default" | "pill";
}

export function SectionHeader({
  title,
  icon,
  iconColor,
  colors,
  textClasses,
  rightElement,
  variant = "pill",
}: SectionHeaderProps) {
  if (variant === "pill" && icon && iconColor) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 14,
          marginBottom: 14,
          borderRadius: 14,
          backgroundColor: iconColor + "12",
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
            backgroundColor: iconColor + "20",
          }}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: iconColor,
            letterSpacing: 0.3,
            flex: 1,
          }}
        >
          {title}
        </Text>
        {rightElement}
      </View>
    );
  }

  // Default variant (simple text + icon)
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={iconColor || colors.textPrimary}
          style={{ marginRight: 10 }}
        />
      )}
      <Text
        className={`${textClasses.subtitle} font-bold`}
        style={{ color: colors.textPrimary, flex: 1 }}
      >
        {title}
      </Text>
      {rightElement}
    </View>
  );
}

// =============================================================================
// CATEGORY PANEL - Background container for grouped items
// =============================================================================
interface CategoryPanelProps {
  children: React.ReactNode;
  colors: any;
  isDark: boolean;
}

export function CategoryPanel({ children, colors, isDark }: CategoryPanelProps) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        borderRadius: 24,
        paddingTop: 20,
        paddingBottom: 8,
        paddingHorizontal: 8,
        marginBottom: 24,
        backgroundColor: isDark ? colors.cardBackground : colors.surfaceSubtle,
      }}
    >
      {children}
    </View>
  );
}
