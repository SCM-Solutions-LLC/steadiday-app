import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  ZoomIn,
} from "react-native-reanimated";

// =============================================================================
// TYPES
// =============================================================================

interface BreathingExerciseGameProps {
  onComplete: () => void;
  onClose: () => void;
  colors: any;
  textClasses: any;
  triggerHaptic: () => void;
  primary: string;
  isDark: boolean;
  onNextGame?: () => void;
}

interface BreathingPhase {
  name: string;
  duration: number;
  action: "inhale" | "hold" | "exhale" | "rest";
}

interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  icon: string;
  phases: BreathingPhase[];
  cycles: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: "calm",
    name: "Calm",
    description: "4-7-8 technique for deep relaxation",
    icon: "moon",
    phases: [
      { name: "Breathe In", duration: 4, action: "inhale" },
      { name: "Hold", duration: 7, action: "hold" },
      { name: "Breathe Out", duration: 8, action: "exhale" },
    ],
    cycles: 3,
  },
  {
    id: "balance",
    name: "Balance",
    description: "Box breathing for focus and calm",
    icon: "grid-outline",
    phases: [
      { name: "Breathe In", duration: 4, action: "inhale" },
      { name: "Hold", duration: 4, action: "hold" },
      { name: "Breathe Out", duration: 4, action: "exhale" },
      { name: "Rest", duration: 4, action: "rest" },
    ],
    cycles: 3,
  },
];

// Richer color palettes per pattern
const PATTERN_PALETTES: Record<
  string,
  {
    circle: string;
    circleLight: string;
    glow: string;
    shadow: string;
    accent: string;
    backgroundTint: string;
    dark: {
      circle: string;
      circleLight: string;
      glow: string;
      shadow: string;
      accent: string;
      backgroundTint: string;
    };
  }
> = {
  calm: {
    circle: "#818CF8",
    circleLight: "#A5B4FC",
    glow: "#6366F130",
    shadow: "#4F46E5",
    accent: "#6366F1",
    backgroundTint: "#EEF2FF",
    dark: {
      circle: "#6366F1",
      circleLight: "#818CF8",
      glow: "#6366F125",
      shadow: "#4F46E5",
      accent: "#818CF8",
      backgroundTint: "#1E1B4B",
    },
  },
  balance: {
    circle: "#14B8A6",
    circleLight: "#5EEAD4",
    glow: "#14B8A630",
    shadow: "#0D9488",
    accent: "#0D9488",
    backgroundTint: "#F0FDFA",
    dark: {
      circle: "#0D9488",
      circleLight: "#2DD4BF",
      glow: "#14B8A625",
      shadow: "#0F766E",
      accent: "#2DD4BF",
      backgroundTint: "#042F2E",
    },
  },
};

const getPatternPalette = (patternId: string, isDark: boolean) => {
  const palette = PATTERN_PALETTES[patternId] || PATTERN_PALETTES["calm"];
  return isDark ? palette.dark : palette;
};

const getPatternColors = (patternId: string, isDark: boolean) => {
  const p = getPatternPalette(patternId, isDark);
  return { circle: p.circle, glow: p.glow, shadow: p.shadow };
};

const getTotalDuration = (pattern: BreathingPattern): number => {
  const cycleDuration = pattern.phases.reduce((sum, p) => sum + p.duration, 0);
  return cycleDuration * pattern.cycles;
};

const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes}m ${seconds}s`;
};

// =============================================================================
// GAME HEADER (slim version)
// =============================================================================

function GameHeader({
  title,
  subtitle,
  onClose,
  colors,
  iconColor,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  colors: any;
  iconColor?: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ position: "relative" }}>
      {iconColor && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 80 + insets.top,
            backgroundColor: iconColor + "08",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}
        />
      )}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: "transparent",
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: colors.textPrimary,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: 14,
                marginTop: 2,
                color: colors.textSecondary,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <Pressable
          onPress={onClose}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.divider,
          }}
          accessibilityRole="button"
          accessibilityLabel="Close game"
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="close" size={28} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

// =============================================================================
// FLOATING PARTICLE
// =============================================================================
function FloatingParticle({
  color,
  size,
  startAngle,
  radius,
  speed,
  active,
}: {
  color: string;
  size: number;
  startAngle: number;
  radius: number;
  speed: number;
  active: boolean;
}) {
  const progress = useSharedValue(0);
  const particleOpacity = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    if (active) {
      particleOpacity.value = withDelay(
        startAngle * 10,
        withTiming(0.35, { duration: 1000 })
      );
      progress.value = withRepeat(
        withTiming(1, { duration: speed, easing: Easing.linear }),
        -1,
        false
      );
      drift.value = withRepeat(
        withSequence(
          withTiming(1, { duration: speed * 0.7, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: speed * 0.7, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      particleOpacity.value = withTiming(0.1, { duration: 800 });
    }
  }, [active]);

  const animStyle = useAnimatedStyle(() => {
    const angle = (startAngle + progress.value * 360) * (Math.PI / 180);
    const driftOffset = interpolate(drift.value, [0, 1], [-8, 8]);
    const x = Math.cos(angle) * (radius + driftOffset);
    const y = Math.sin(angle) * (radius + driftOffset);
    const pulseScale = interpolate(drift.value, [0, 1], [0.85, 1.15]);
    return {
      transform: [{ translateX: x }, { translateY: y }, { scale: pulseScale }],
      opacity: particleOpacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        animStyle,
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    />
  );
}

// =============================================================================
// ENHANCED PATTERN SELECTION CARD
// =============================================================================

function PatternCard({
  pattern,
  onSelect,
  colors,
  isDark,
  index,
}: {
  pattern: BreathingPattern;
  onSelect: () => void;
  colors: any;
  isDark: boolean;
  index: number;
}) {
  const palette = getPatternPalette(pattern.id, isDark);
  const totalSeconds = getTotalDuration(pattern);
  const estimateMinutes = Math.ceil(totalSeconds / 60);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 150).duration(500).springify()}>
      <Pressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${pattern.name} breathing pattern. ${pattern.description}. About ${estimateMinutes} minutes.`}
      >
        <Animated.View
          style={[
            animatedStyle,
            {
              backgroundColor: isDark ? palette.backgroundTint : palette.backgroundTint,
              borderRadius: 24,
              padding: 24,
              overflow: "hidden",
              borderWidth: 1.5,
              borderColor: palette.circle + "30",
              shadowColor: palette.shadow,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.4 : 0.2,
              shadowRadius: 16,
              elevation: 6,
            },
          ]}
        >
          {/* Decorative circle top-right */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: palette.circle + "12",
            }}
          />
          {/* Decorative circle bottom-left */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: -20,
              left: -20,
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: palette.circle + "08",
            }}
          />

          {/* Icon row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: palette.circle + "20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
                borderWidth: 1,
                borderColor: palette.circle + "30",
              }}
            >
              <Ionicons
                name={pattern.icon as any}
                size={28}
                color={palette.circle}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "bold",
                  color: colors.textPrimary,
                  marginBottom: 4,
                  letterSpacing: -0.3,
                }}
              >
                {pattern.name}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: colors.textSecondary,
                  lineHeight: 21,
                }}
              >
                {pattern.description}
              </Text>
            </View>
          </View>

          {/* Phase chips */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {pattern.phases.map((phase, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: palette.circle + "15",
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: palette.circle,
                  }}
                >
                  {phase.name}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: palette.accent,
                    marginLeft: 4,
                  }}
                >
                  {phase.duration}s
                </Text>
              </View>
            ))}
          </View>

          {/* Bottom row: stats + Begin CTA */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: palette.circle + "15",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 4 }}>
                  ~{estimateMinutes} min
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="repeat-outline" size={16} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 4 }}>
                  {pattern.cycles} cycles
                </Text>
              </View>
            </View>

            {/* Begin CTA */}
            <View
              style={{
                backgroundColor: palette.circle,
                borderRadius: 12,
                paddingHorizontal: 18,
                paddingVertical: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
                Begin
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// MULTI-RING BREATHING CIRCLE COMPONENT (ENHANCED)
// =============================================================================

function BreathingCircle({
  action,
  duration,
  patternColors,
  palette,
  isDark,
}: {
  action: "inhale" | "hold" | "exhale" | "rest";
  duration: number;
  patternColors: { circle: string; glow: string; shadow: string };
  palette: { circle: string; circleLight: string; glow: string; accent: string };
  isDark: boolean;
}) {
  const outerScale = useSharedValue(action === "inhale" || action === "hold" ? 0.45 : 1.0);
  const middleScale = useSharedValue(action === "inhale" || action === "hold" ? 0.5 : 1.0);
  const innerScale = useSharedValue(action === "inhale" || action === "hold" ? 0.55 : 1.0);
  const glowOpacity = useSharedValue(0.15);
  const ambientPulse = useSharedValue(0.6);
  const rotation = useSharedValue(0);
  const innerRotation = useSharedValue(0);

  useEffect(() => {
    const durationMs = duration * 1000;
    const easingConfig = Easing.inOut(Easing.ease);

    // Ambient background pulse (always running)
    ambientPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Ring rotations removed for calmer visual (static rings)

    switch (action) {
      case "inhale":
        outerScale.value = 0.45;
        middleScale.value = 0.5;
        innerScale.value = 0.55;
        // Staggered expand
        outerScale.value = withTiming(1.0, { duration: durationMs, easing: easingConfig });
        middleScale.value = withDelay(150, withTiming(1.0, { duration: durationMs - 150, easing: easingConfig }));
        innerScale.value = withDelay(300, withTiming(1.0, { duration: durationMs - 300, easing: easingConfig }));
        glowOpacity.value = withTiming(0.45, { duration: durationMs, easing: easingConfig });
        break;
      case "hold":
        outerScale.value = 1.0;
        middleScale.value = 1.0;
        innerScale.value = 1.0;
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.50, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.35, { duration: 2000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        break;
      case "exhale":
        outerScale.value = 1.0;
        middleScale.value = 1.0;
        innerScale.value = 1.0;
        // Staggered contract (inner first, then middle, then outer)
        innerScale.value = withTiming(0.55, { duration: durationMs, easing: easingConfig });
        middleScale.value = withDelay(150, withTiming(0.5, { duration: durationMs - 150, easing: easingConfig }));
        outerScale.value = withDelay(300, withTiming(0.45, { duration: durationMs - 300, easing: easingConfig }));
        glowOpacity.value = withTiming(0.1, { duration: durationMs, easing: easingConfig });
        break;
      case "rest":
        outerScale.value = 0.45;
        middleScale.value = 0.5;
        innerScale.value = 0.55;
        glowOpacity.value = 0.12;
        // Gentle micro-pulse
        outerScale.value = withRepeat(
          withSequence(
            withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.45, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        middleScale.value = withRepeat(
          withSequence(
            withTiming(0.55, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        break;
    }
  }, [action, duration]);

  const outerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
  }));
  const middleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: middleScale.value }],
  }));
  const innerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));
  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  const ambientAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ambientPulse.value, [0.6, 1], [0.08, 0.20]),
    transform: [{ scale: interpolate(ambientPulse.value, [0.6, 1], [0.95, 1.08]) }],
  }));

  const CIRCLE_SIZE = 240;

  // Generate floating particles (reduced to 4 for calmer visual)
  const particles = [
    { angle: 0, speed: 12000, size: 5, radius: 150 },
    { angle: 90, speed: 10500, size: 6, radius: 155 },
    { angle: 180, speed: 16500, size: 5, radius: 150 },
    { angle: 270, speed: 14000, size: 5, radius: 148 },
  ];

  return (
    <View style={{ width: CIRCLE_SIZE + 40, height: CIRCLE_SIZE + 40, alignItems: "center", justifyContent: "center" }}>
      {/* Floating particles */}
      {particles.map((p, i) => (
        <FloatingParticle
          key={i}
          color={palette.circleLight + "50"}
          size={p.size}
          startAngle={p.angle}
          radius={p.radius}
          speed={p.speed}
          active={action === "inhale" || action === "hold" || action === "exhale" || action === "rest"}
        />
      ))}

      {/* Ambient background glow */}
      <Animated.View
        style={[
          ambientAnimStyle,
          {
            position: "absolute",
            width: CIRCLE_SIZE + 80,
            height: CIRCLE_SIZE + 80,
            borderRadius: (CIRCLE_SIZE + 80) / 2,
            backgroundColor: palette.circle,
          },
        ]}
      />

      {/* Outer glow ring */}
      <Animated.View
        style={[
          glowAnimStyle,
          {
            position: "absolute",
            width: CIRCLE_SIZE + 30,
            height: CIRCLE_SIZE + 30,
            borderRadius: (CIRCLE_SIZE + 30) / 2,
            backgroundColor: palette.glow,
            borderWidth: 1.5,
            borderColor: palette.circle + "25",
          },
        ]}
      />

      {/* Outer ring with rotation */}
      <Animated.View
        style={[
          outerAnimStyle,
          {
            position: "absolute",
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
            backgroundColor: palette.circle + "12",
            borderWidth: 2,
            borderColor: palette.circle + "35",
            // Dashed border effect via multiple decorative dots
          },
        ]}
      >
        {/* Decorative dots on the outer ring */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              top: CIRCLE_SIZE / 2 - 3 + Math.sin((deg * Math.PI) / 180) * (CIRCLE_SIZE / 2 - 4),
              left: CIRCLE_SIZE / 2 - 3 + Math.cos((deg * Math.PI) / 180) * (CIRCLE_SIZE / 2 - 4),
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: palette.circle + "60",
            }}
          />
        ))}
      </Animated.View>

      {/* Middle ring with counter-rotation */}
      <Animated.View
        style={[
          middleAnimStyle,
          {
            position: "absolute",
            width: CIRCLE_SIZE * 0.78,
            height: CIRCLE_SIZE * 0.78,
            borderRadius: (CIRCLE_SIZE * 0.78) / 2,
            backgroundColor: palette.circle + "20",
            borderWidth: 2.5,
            borderColor: palette.circle + "50",
            shadowColor: patternColors.shadow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 8,
          },
        ]}
      >
        {/* Small accent dots on middle ring */}
        {[0, 90, 180, 270].map((deg, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              top: (CIRCLE_SIZE * 0.78) / 2 - 2.5 + Math.sin((deg * Math.PI) / 180) * ((CIRCLE_SIZE * 0.78) / 2 - 3),
              left: (CIRCLE_SIZE * 0.78) / 2 - 2.5 + Math.cos((deg * Math.PI) / 180) * ((CIRCLE_SIZE * 0.78) / 2 - 3),
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: palette.circleLight + "80",
            }}
          />
        ))}
      </Animated.View>

      {/* Inner ring (solid core) */}
      <Animated.View
        style={[
          innerAnimStyle,
          {
            width: CIRCLE_SIZE * 0.52,
            height: CIRCLE_SIZE * 0.52,
            borderRadius: (CIRCLE_SIZE * 0.52) / 2,
            backgroundColor: palette.circle + "30",
            borderWidth: 2,
            borderColor: palette.circleLight + "60",
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      />
    </View>
  );
}

// =============================================================================
// SEGMENTED PROGRESS BAR (ENHANCED)
// =============================================================================

function SegmentedProgress({
  pattern,
  currentCycle,
  currentPhaseIndex,
  palette,
  isDark,
  colors,
}: {
  pattern: BreathingPattern;
  currentCycle: number;
  currentPhaseIndex: number;
  palette: any;
  isDark: boolean;
  colors: any;
}) {
  const phases = pattern.phases;

  return (
    <View style={{ width: "100%", paddingHorizontal: 20 }}>
      {/* Cycle pills */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {Array.from({ length: pattern.cycles }).map((_, idx) => {
          const isCurrent = idx === currentCycle - 1;
          const isDone = idx < currentCycle - 1;
          return (
            <Animated.View
              key={idx}
              style={{
                width: isCurrent ? 42 : 28,
                height: 8,
                borderRadius: 4,
                backgroundColor: isDone
                  ? palette.circle
                  : isCurrent
                  ? palette.circle + "90"
                  : isDark
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(0,0,0,0.08)",
              }}
            />
          );
        })}
      </View>

      {/* Phase segments */}
      <View
        style={{
          flexDirection: "row",
          gap: 4,
          marginBottom: 8,
        }}
      >
        {phases.map((phase, idx) => {
          const isCurrent = idx === currentPhaseIndex;
          const isDone = idx < currentPhaseIndex;
          return (
            <View
              key={idx}
              style={{
                flex: phase.duration,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: isDone
                  ? palette.circle
                  : isCurrent
                  ? palette.accent + "70"
                  : isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.06)",
              }}
            />
          );
        })}
      </View>

      {/* Phase labels */}
      <View style={{ flexDirection: "row", gap: 4 }}>
        {phases.map((phase, idx) => {
          const isCurrent = idx === currentPhaseIndex;
          return (
            <View key={idx} style={{ flex: phase.duration, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: isCurrent ? "700" : "500",
                  color: isCurrent
                    ? palette.circle
                    : isDark
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(0,0,0,0.3)",
                  letterSpacing: 0.3,
                }}
                numberOfLines={1}
              >
                {phase.name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// =============================================================================
// ANIMATED COUNTDOWN NUMBER
// =============================================================================
function AnimatedCountdown({
  value,
  color,
  shadowColor,
}: {
  value: number;
  color: string;
  shadowColor: string;
}) {
  const scale = useSharedValue(1.1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = 1.1;
    opacity.value = 0;
    scale.value = withSpring(1, { damping: 14, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 200 });
  }, [value]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <Text
        style={{
          fontSize: 40,
          fontWeight: "400",
          color: color,
          textShadowColor: shadowColor,
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 8,
        }}
      >
        {value}
      </Text>
    </Animated.View>
  );
}

// =============================================================================
// ANIMATED PHASE LABEL
// =============================================================================
function AnimatedPhaseLabel({
  name,
  color,
  phaseKey,
}: {
  name: string;
  color: string;
  phaseKey: number;
}) {
  const translateY = useSharedValue(12);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = 12;
    opacity.value = 0;
    translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 300 });
  }, [phaseKey]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          color: color,
          textAlign: "center",
          letterSpacing: -0.3,
          textShadowColor: "rgba(0,0,0,0.1)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        }}
      >
        {name}
      </Text>
    </Animated.View>
  );
}

// =============================================================================
// BREATHING DIRECTION INDICATOR
// =============================================================================
function BreathingDirectionIndicator({
  action,
  color,
  duration,
  phaseKey,
}: {
  action: "inhale" | "hold" | "exhale" | "rest";
  color: string;
  duration: number;
  phaseKey: number;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (action === "inhale") {
      translateY.value = 0;
      opacity.value = withTiming(0.5, { duration: 500 });
      translateY.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: duration * 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration * 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else if (action === "exhale") {
      translateY.value = 0;
      opacity.value = withTiming(0.5, { duration: 500 });
      translateY.value = withRepeat(
        withSequence(
          withTiming(12, { duration: duration * 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration * 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(0, { duration: 500 });
      translateY.value = withTiming(0, { duration: 300 });
    }
  }, [phaseKey, action]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (action === "hold" || action === "rest") return null;

  return (
    <Animated.View style={[animStyle, { marginBottom: 4 }]}>
      <Ionicons
        name={action === "inhale" ? "chevron-up" : "chevron-down"}
        size={20}
        color={color}
      />
    </Animated.View>
  );
}

// =============================================================================
// BREATHING EXERCISE GAME
// =============================================================================

function BreathingExerciseGame({
  onComplete,
  onClose,
  colors,
  textClasses,
  triggerHaptic,
  primary,
  isDark,
  onNextGame,
}: BreathingExerciseGameProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // State
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern | null>(null);
  const [gameState, setGameState] = useState<"select" | "breathing" | "complete">("select");
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [phaseKey, setPhaseKey] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Completion animation
  const completeFade = useSharedValue(0);
  const completeScale = useSharedValue(0.9);

  // Current phase info
  const currentPhase = selectedPattern
    ? selectedPattern.phases[currentPhaseIndex]
    : null;

  const palette = selectedPattern
    ? getPatternPalette(selectedPattern.id, isDark)
    : getPatternPalette("calm", isDark);

  const patternColors = selectedPattern
    ? getPatternColors(selectedPattern.id, isDark)
    : getPatternColors("calm", isDark);

  // Start breathing exercise
  const startBreathing = useCallback(
    (pattern: BreathingPattern) => {
      setSelectedPattern(pattern);
      setGameState("breathing");
      setCurrentCycle(1);
      setCurrentPhaseIndex(0);
      setSecondsRemaining(pattern.phases[0].duration);
      setElapsedSeconds(0);
      setPhaseKey(0);
      setIsActive(true);
      triggerHaptic();
    },
    [triggerHaptic]
  );

  // Advance to next phase or cycle
  const advancePhase = useCallback(() => {
    if (!selectedPattern) return;

    const nextPhaseIndex = currentPhaseIndex + 1;

    if (nextPhaseIndex < selectedPattern.phases.length) {
      setCurrentPhaseIndex(nextPhaseIndex);
      setSecondsRemaining(selectedPattern.phases[nextPhaseIndex].duration);
      setPhaseKey((prev) => prev + 1);
      triggerHaptic();
    } else {
      const nextCycle = currentCycle + 1;
      if (nextCycle <= selectedPattern.cycles) {
        setCurrentCycle(nextCycle);
        setCurrentPhaseIndex(0);
        setSecondsRemaining(selectedPattern.phases[0].duration);
        setPhaseKey((prev) => prev + 1);
        triggerHaptic();
      } else {
        setIsActive(false);
        setGameState("complete");
        completeFade.value = withTiming(1, { duration: 600 });
        completeScale.value = withSpring(1, { damping: 12 });
        triggerHaptic();
        onComplete();
      }
    }
  }, [selectedPattern, currentPhaseIndex, currentCycle, triggerHaptic, onComplete]);

  // Countdown timer
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          advancePhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, advancePhase]);

  // Elapsed timer
  useEffect(() => {
    if (!isActive) {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
      return;
    }

    elapsedRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
    };
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []);

  const completeAnimStyle = useAnimatedStyle(() => ({
    opacity: completeFade.value,
    transform: [{ scale: completeScale.value }],
  }));

  // =========================================================================
  // PATTERN SELECTION SCREEN
  // =========================================================================

  if (gameState === "select") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader
          title="Breathing Exercise"
          subtitle="Choose a breathing pattern"
          onClose={onClose}
          colors={colors}
          iconColor={isDark ? "#4F46E5" : "#818CF8"}
        />

        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 28, paddingBottom: insets.bottom + 16 }}>
          {/* Intro text with animation */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text
              style={{
                fontSize: 17,
                color: colors.textSecondary,
                textAlign: "center",
                marginBottom: 28,
                lineHeight: 24,
                paddingHorizontal: 8,
              }}
            >
              {"Take a moment to relax. Select a breathing pattern below to get started."}
            </Text>
          </Animated.View>

          {/* Pattern cards with staggered entry */}
          <View style={{ gap: 20 }}>
            {BREATHING_PATTERNS.map((pattern, index) => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                onSelect={() => startBreathing(pattern)}
                colors={colors}
                isDark={isDark}
                index={index}
              />
            ))}
          </View>
        </View>
      </View>
    );
  }

  // =========================================================================
  // COMPLETION SCREEN
  // =========================================================================

  if (gameState === "complete" && selectedPattern) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Ambient background glow */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: "25%",
            left: "50%",
            marginLeft: -150,
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: palette.circle + "10",
          }}
        />

        <GameHeader
          title="Breathing Exercise"
          onClose={onClose}
          colors={colors}
          iconColor={palette.circle}
        />

        <Animated.View
          style={[
            completeAnimStyle,
            {
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* Meditation icon circle */}
          <Animated.View
            entering={ZoomIn.delay(200).duration(500).springify()}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: palette.circle + "15",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              borderWidth: 2,
              borderColor: palette.circle + "25",
            }}
          >
            <Text style={{ fontSize: 44 }}>{"🧘"}</Text>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(350).duration(500)}>
            <Text
              style={{
                fontSize: 30,
                fontWeight: "800",
                color: colors.textPrimary,
                textAlign: "center",
                marginBottom: 8,
                letterSpacing: -0.5,
              }}
            >
              Well Done
            </Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View entering={FadeInDown.delay(450).duration(500)}>
            <Text
              style={{
                fontSize: 17,
                color: colors.textSecondary,
                textAlign: "center",
                marginBottom: 36,
                lineHeight: 24,
                maxWidth: 300,
              }}
            >
              {"You completed " + selectedPattern.cycles + " cycles of " + selectedPattern.name + " breathing"}
            </Text>
          </Animated.View>

          {/* Stats row */}
          <Animated.View
            entering={FadeInUp.delay(550).duration(500)}
            style={{
              flexDirection: "row",
              gap: 16,
              marginBottom: 40,
              width: "100%",
              maxWidth: 340,
            }}
          >
            {/* Duration stat */}
            <View
              style={{
                flex: 1,
                backgroundColor: palette.circle + "10",
                borderRadius: 18,
                padding: 18,
                alignItems: "center",
                borderWidth: 1,
                borderColor: palette.circle + "20",
              }}
            >
              <Ionicons name="time-outline" size={22} color={palette.circle} />
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: colors.textPrimary,
                  marginTop: 8,
                }}
              >
                {formatDuration(elapsedSeconds)}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginTop: 2,
                  fontWeight: "500",
                }}
              >
                Duration
              </Text>
            </View>

            {/* Cycles stat */}
            <View
              style={{
                flex: 1,
                backgroundColor: palette.circle + "10",
                borderRadius: 18,
                padding: 18,
                alignItems: "center",
                borderWidth: 1,
                borderColor: palette.circle + "20",
              }}
            >
              <Ionicons name="repeat-outline" size={22} color={palette.circle} />
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: colors.textPrimary,
                  marginTop: 8,
                }}
              >
                {selectedPattern.cycles}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginTop: 2,
                  fontWeight: "500",
                }}
              >
                Cycles
              </Text>
            </View>
          </Animated.View>

          {/* Done button */}
          <Animated.View entering={FadeInUp.delay(700).duration(500)}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                width: "100%",
                maxWidth: 340,
                paddingVertical: 18,
                borderRadius: 16,
                backgroundColor: palette.circle,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 56,
                shadowColor: palette.shadow,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 6,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#FFFFFF" }}>Done</Text>
            </Pressable>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeIn.delay(900).duration(600)}>
            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 24,
                fontStyle: "italic",
                opacity: 0.8,
              }}
            >
              Take a deep breath anytime you need one.
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  // =========================================================================
  // BREATHING ANIMATION SCREEN
  // =========================================================================

  if (!selectedPattern || !currentPhase) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Subtle ambient tint covering screen */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: palette.backgroundTint,
          opacity: isDark ? 0.15 : 0.3,
        }}
      />

      <GameHeader
        title="Breathing Exercise"
        subtitle={selectedPattern.name + " Breathing"}
        onClose={onClose}
        colors={colors}
        iconColor={palette.circle}
      />

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        {/* Breathing circle + labels area */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <BreathingCircle
            key={phaseKey}
            action={currentPhase.action}
            duration={currentPhase.duration}
            patternColors={patternColors}
            palette={palette}
            isDark={isDark}
          />

          {/* Animated phase label overlaying the circle */}
          <View
            style={{
              position: "absolute",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BreathingDirectionIndicator
              action={currentPhase.action}
              color={palette.circle}
              duration={currentPhase.duration}
              phaseKey={phaseKey}
            />
            <AnimatedPhaseLabel
              name={currentPhase.name}
              color={palette.circle}
              phaseKey={phaseKey}
            />
          </View>

          {/* Animated countdown below circle */}
          <View style={{ marginTop: 28, alignItems: "center" }}>
            <AnimatedCountdown
              value={secondsRemaining}
              color={palette.accent}
              shadowColor={palette.circle + "30"}
            />
          </View>
        </View>

        {/* Segmented progress at bottom */}
        <View style={{ width: "100%", paddingBottom: 8 }}>
          <SegmentedProgress
            pattern={selectedPattern}
            currentCycle={currentCycle}
            currentPhaseIndex={currentPhaseIndex}
            palette={palette}
            isDark={isDark}
            colors={colors}
          />
        </View>
      </View>
    </View>
  );
}

export default BreathingExerciseGame;
