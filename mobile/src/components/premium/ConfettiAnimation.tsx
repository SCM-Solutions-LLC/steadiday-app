import React, { useEffect, useMemo } from "react";
import { View, Dimensions, StyleSheet, AccessibilityInfo } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Confetti colors - premium gold theme with more variety
const CONFETTI_COLORS = [
  "#FFD700", // Gold
  "#FFA500", // Orange
  "#FFB347", // Light Orange
  "#F5DEB3", // Wheat
  "#FFFFFF", // White
  "#FFE4B5", // Moccasin
  "#FF6B6B", // Coral Red
  "#4ECDC4", // Teal
  "#A855F7", // Purple
  "#3B82F6", // Blue
];

// Sparkle/Star colors for firework effect
const SPARKLE_COLORS = [
  "#FFD700", // Gold
  "#FFFFFF", // White
  "#FFA500", // Orange
  "#FF69B4", // Hot Pink
  "#00FFFF", // Cyan
];

interface ConfettiPieceProps {
  index: number;
  onComplete?: () => void;
  isLast: boolean;
  wave: number; // Which wave of confetti (0, 1, 2)
}

/**
 * Single confetti piece with animated fall and rotation
 */
function ConfettiPiece({ index, onComplete, isLast, wave }: ConfettiPieceProps) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  // Random properties for this piece
  const config = useMemo(() => {
    const startX = Math.random() * SCREEN_WIDTH;
    const endX = startX + (Math.random() - 0.5) * 250;
    const size = 6 + Math.random() * 10;
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    // Stagger waves for continuous celebration
    const waveDelay = wave * 800;
    const delay = waveDelay + Math.random() * 400;
    const duration = 2200 + Math.random() * 1200;
    const rotations = 3 + Math.random() * 4;
    // Randomly choose shape: rectangle, circle, or star
    const shapeType = Math.random() < 0.2 ? "star" : Math.random() < 0.5 ? "circle" : "rectangle";

    return { startX, endX, size, color, delay, duration, rotations, shapeType };
  }, [wave]);

  useEffect(() => {
    const { startX, endX, delay, duration, rotations } = config;

    translateX.value = startX;

    // Initial pop effect
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.3, { damping: 8 }),
        withTiming(1, { duration: 200 })
      )
    );

    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 50, {
        duration: duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    translateX.value = withDelay(
      delay,
      withTiming(endX, {
        duration: duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    rotate.value = withDelay(
      delay,
      withTiming(rotations * 360, {
        duration: duration,
        easing: Easing.linear,
      })
    );

    // Fade out near the end
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, {
        duration: duration * 0.3,
      }, (finished) => {
        if (finished && isLast && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, [config, isLast, onComplete, opacity, rotate, scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Render different shapes
  const getShapeStyle = () => {
    if (config.shapeType === "circle") {
      return {
        width: config.size,
        height: config.size,
        borderRadius: config.size / 2,
      };
    } else if (config.shapeType === "star") {
      return {
        width: config.size,
        height: config.size,
        borderRadius: 2,
      };
    }
    // Rectangle (default)
    return {
      width: config.size,
      height: config.size * 0.6,
      borderRadius: config.size * 0.1,
    };
  };

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: config.color,
          ...getShapeStyle(),
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Sparkle/Firework burst component
 */
interface SparkleProps {
  delay: number;
  centerX: number;
  centerY: number;
  index: number;
}

function Sparkle({ delay, centerX, centerY, index }: SparkleProps) {
  const translateX = useSharedValue(centerX);
  const translateY = useSharedValue(centerY);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  const config = useMemo(() => {
    const angle = (index / 8) * Math.PI * 2;
    const distance = 60 + Math.random() * 80;
    const endX = centerX + Math.cos(angle) * distance;
    const endY = centerY + Math.sin(angle) * distance;
    const color = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
    const size = 4 + Math.random() * 6;

    return { endX, endY, color, size };
  }, [centerX, centerY, index]);

  useEffect(() => {
    // Pop in
    opacity.value = withDelay(delay, withTiming(1, { duration: 100 }));
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.5, { damping: 6 }),
        withTiming(0.8, { duration: 300 })
      )
    );

    // Burst outward
    translateX.value = withDelay(
      delay,
      withTiming(config.endX, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      })
    );

    translateY.value = withDelay(
      delay,
      withTiming(config.endY, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Fade out
    opacity.value = withDelay(
      delay + 400,
      withTiming(0, { duration: 300 })
    );
  }, [config, delay, opacity, scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          width: config.size,
          height: config.size,
          backgroundColor: config.color,
          borderRadius: config.size / 2,
          shadowColor: config.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 4,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Firework burst - multiple sparkles from one point
 */
interface FireworkBurstProps {
  delay: number;
  x: number;
  y: number;
}

function FireworkBurst({ delay, x, y }: FireworkBurstProps) {
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        <Sparkle
          key={i}
          delay={delay}
          centerX={x}
          centerY={y}
          index={i}
        />
      ))}
    </>
  );
}

interface ConfettiAnimationProps {
  /**
   * Whether the animation is playing
   */
  isPlaying: boolean;
  /**
   * Callback when animation completes
   */
  onComplete?: () => void;
  /**
   * Number of confetti pieces (default: 50)
   */
  pieceCount?: number;
}

/**
 * ConfettiAnimation - Celebratory confetti effect for Premium purchase
 *
 * Features:
 * - Gold-themed colors matching Premium branding
 * - Multiple waves of confetti for continuous celebration
 * - Firework bursts for extra excitement
 * - Respects Reduce Motion accessibility setting
 * - Auto-stops after ~4-5 seconds
 * - Lightweight using react-native-reanimated
 */
export default function ConfettiAnimation({
  isPlaying,
  onComplete,
  pieceCount = 50,
}: ConfettiAnimationProps) {
  const [reduceMotion, setReduceMotion] = React.useState(false);

  // Firework burst positions (random locations on screen)
  const fireworkBursts = useMemo(() => [
    { x: SCREEN_WIDTH * 0.2, y: SCREEN_HEIGHT * 0.25, delay: 200 },
    { x: SCREEN_WIDTH * 0.8, y: SCREEN_HEIGHT * 0.2, delay: 600 },
    { x: SCREEN_WIDTH * 0.5, y: SCREEN_HEIGHT * 0.15, delay: 1000 },
    { x: SCREEN_WIDTH * 0.3, y: SCREEN_HEIGHT * 0.3, delay: 1400 },
    { x: SCREEN_WIDTH * 0.7, y: SCREEN_HEIGHT * 0.35, delay: 1800 },
  ], []);

  useEffect(() => {
    // Check for Reduce Motion setting
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  // Don't show animation if reduce motion is enabled or not playing
  if (reduceMotion || !isPlaying) {
    return null;
  }

  // Calculate pieces per wave (3 waves total)
  const piecesPerWave = Math.ceil(pieceCount / 3);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Wave 1 - Immediate burst */}
      {Array.from({ length: piecesPerWave }).map((_, index) => (
        <ConfettiPiece
          key={`wave1-${index}`}
          index={index}
          wave={0}
          isLast={false}
          onComplete={undefined}
        />
      ))}

      {/* Wave 2 - Second burst */}
      {Array.from({ length: piecesPerWave }).map((_, index) => (
        <ConfettiPiece
          key={`wave2-${index}`}
          index={index}
          wave={1}
          isLast={false}
          onComplete={undefined}
        />
      ))}

      {/* Wave 3 - Final burst */}
      {Array.from({ length: piecesPerWave }).map((_, index) => (
        <ConfettiPiece
          key={`wave3-${index}`}
          index={index}
          wave={2}
          isLast={index === piecesPerWave - 1}
          onComplete={onComplete}
        />
      ))}

      {/* Firework bursts */}
      {fireworkBursts.map((burst, index) => (
        <FireworkBurst
          key={`burst-${index}`}
          delay={burst.delay}
          x={burst.x}
          y={burst.y}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    overflow: "hidden",
  },
  confettiPiece: {
    position: "absolute",
  },
  sparkle: {
    position: "absolute",
  },
});
