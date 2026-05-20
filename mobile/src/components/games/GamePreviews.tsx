import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  interpolateColor,
  Easing,
  type SharedValue,
} from "react-native-reanimated";

// =============================================================================
// GAME PREVIEW ANIMATIONS - Simple, iconic previews that fit in small containers
// Each preview is designed to be ~40x40px and clearly show the game mechanic
// =============================================================================

interface PreviewProps {
  colors: any;
  isDark: boolean;
}

// Word Match Preview - Two words connecting with a line
export function WordMatchPreview({ colors, isDark }: PreviewProps) {
  const lineProgress = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    const runAnimation = () => {
      lineProgress.value = 0;
      glow.value = 0;

      // Line draws across
      lineProgress.value = withDelay(
        300,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
      );

      // Glow when connected
      glow.value = withDelay(
        800,
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0.5, { duration: 800 })
        )
      );
    };

    runAnimation();
    const interval = setInterval(runAnimation, 2000);
    return () => clearInterval(interval);
  }, []);

  const lineStyle = useAnimatedStyle(() => ({
    width: lineProgress.value * 16,
    opacity: 0.5 + lineProgress.value * 0.5,
  }));

  const dotLeftStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      glow.value,
      [0, 1],
      [isDark ? "#818CF8" : "#4F46E5", isDark ? "#22C55E" : "#16A34A"]
    ),
    transform: [{ scale: 1 + glow.value * 0.2 }],
  }));

  const dotRightStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      glow.value,
      [0, 1],
      [isDark ? "#818CF8" : "#4F46E5", isDark ? "#22C55E" : "#16A34A"]
    ),
    transform: [{ scale: 1 + glow.value * 0.2 }],
  }));

  return (
    <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Left dot/word indicator */}
        <Animated.View
          style={[
            dotLeftStyle,
            {
              width: 10,
              height: 10,
              borderRadius: 5,
            },
          ]}
        />

        {/* Connecting line */}
        <Animated.View
          style={[
            lineStyle,
            {
              height: 2,
              backgroundColor: isDark ? "#22C55E" : "#16A34A",
              marginHorizontal: 2,
              borderRadius: 1,
            },
          ]}
        />

        {/* Right dot/word indicator */}
        <Animated.View
          style={[
            dotRightStyle,
            {
              width: 10,
              height: 10,
              borderRadius: 5,
            },
          ]}
        />
      </View>
    </View>
  );
}

// Word Scramble Preview - Letters shuffling into place
export function WordScramblePreview({ colors, isDark }: PreviewProps) {
  const shuffle = useSharedValue(1);
  const solved = useSharedValue(0);

  useEffect(() => {
    const runAnimation = () => {
      shuffle.value = 1;
      solved.value = 0;

      // Letters move to correct positions
      shuffle.value = withDelay(
        400,
        withSpring(0, { damping: 12, stiffness: 100 })
      );

      // Show solved state
      solved.value = withDelay(900, withTiming(1, { duration: 300 }));
    };

    runAnimation();
    const interval = setInterval(runAnimation, 2200);
    return () => clearInterval(interval);
  }, []);

  const letter1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: shuffle.value * 8 }],
  }));

  const letter2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: shuffle.value * -6 }],
  }));

  const letter3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: shuffle.value * 4 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      solved.value,
      [0, 1],
      [isDark ? "rgba(139,92,246,0.6)" : "#7C3AED", isDark ? "#22C55E" : "#16A34A"]
    ),
  }));

  const letterColor = isDark ? "#FFFFFF" : "#7C3AED";
  const bgColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(124,58,237,0.15)";

  return (
    <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[
          glowStyle,
          {
            flexDirection: "row",
            gap: 2,
            padding: 4,
            borderRadius: 6,
            borderWidth: 1.5,
            backgroundColor: bgColor,
          },
        ]}
      >
        <Animated.View style={letter1Style}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: letterColor }}>A</Text>
        </Animated.View>
        <Animated.View style={letter2Style}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: letterColor }}>B</Text>
        </Animated.View>
        <Animated.View style={letter3Style}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: letterColor }}>C</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// Number Flow Preview - Numbers in sequence with one filling in
export function NumberFlowPreview({ colors, isDark }: PreviewProps) {
  const answerOpacity = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    const runAnimation = () => {
      answerOpacity.value = 0;
      pulse.value = 1;

      // Pulse the empty spot
      pulse.value = withSequence(
        withTiming(1.1, { duration: 200 }),
        withTiming(0.9, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );

      // Answer fills in
      answerOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));
    };

    runAnimation();
    const interval = setInterval(runAnimation, 2000);
    return () => clearInterval(interval);
  }, []);

  const answerStyle = useAnimatedStyle(() => ({
    opacity: answerOpacity.value,
    transform: [{ scale: 0.5 + answerOpacity.value * 0.5 }],
  }));

  const emptyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    borderColor: interpolateColor(
      answerOpacity.value,
      [0, 1],
      [isDark ? "#34D399" : "#10B981", isDark ? "#22C55E" : "#16A34A"]
    ),
  }));

  const numColor = isDark ? "#FFFFFF" : "#059669";
  const bgColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(5,150,105,0.15)";

  return (
    <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
      <View style={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
        <View
          style={{
            width: 12,
            height: 14,
            borderRadius: 3,
            backgroundColor: bgColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "600", color: numColor }}>2</Text>
        </View>
        <Animated.View
          style={[
            emptyStyle,
            {
              width: 12,
              height: 14,
              borderRadius: 3,
              backgroundColor: isDark ? "rgba(52,211,153,0.3)" : "#D1FAE5",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderStyle: "dashed",
            },
          ]}
        >
          <Animated.Text
            style={[
              answerStyle,
              { fontSize: 9, fontWeight: "700", color: isDark ? "#22C55E" : "#16A34A" },
            ]}
          >
            4
          </Animated.Text>
        </Animated.View>
        <View
          style={{
            width: 12,
            height: 14,
            borderRadius: 3,
            backgroundColor: bgColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "600", color: numColor }}>6</Text>
        </View>
      </View>
    </View>
  );
}

// Memory Match Preview - Two cards flipping to reveal match
export function MemoryMatchPreview({ colors, isDark }: PreviewProps) {
  const flip1 = useSharedValue(0);
  const flip2 = useSharedValue(0);
  const matchGlow = useSharedValue(0);

  useEffect(() => {
    const runAnimation = () => {
      flip1.value = 0;
      flip2.value = 0;
      matchGlow.value = 0;

      // First card flips
      flip1.value = withDelay(300, withTiming(1, { duration: 300 }));

      // Second card flips
      flip2.value = withDelay(700, withTiming(1, { duration: 300 }));

      // Match glow
      matchGlow.value = withDelay(1100, withSpring(1, { damping: 10 }));
    };

    runAnimation();
    const interval = setInterval(runAnimation, 2200);
    return () => clearInterval(interval);
  }, []);

  const card1Style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      flip1.value,
      [0, 0.5, 1],
      [
        isDark ? "rgba(236,72,153,0.4)" : "#F9A8D4",
        isDark ? "rgba(255,255,255,0.3)" : "#FFFFFF",
        isDark ? "rgba(255,255,255,0.3)" : "#FFFFFF",
      ]
    ),
    borderColor: interpolateColor(
      matchGlow.value,
      [0, 1],
      [isDark ? "rgba(236,72,153,0.6)" : "#EC4899", isDark ? "#22C55E" : "#16A34A"]
    ),
  }));

  const card2Style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      flip2.value,
      [0, 0.5, 1],
      [
        isDark ? "rgba(236,72,153,0.4)" : "#F9A8D4",
        isDark ? "rgba(255,255,255,0.3)" : "#FFFFFF",
        isDark ? "rgba(255,255,255,0.3)" : "#FFFFFF",
      ]
    ),
    borderColor: interpolateColor(
      matchGlow.value,
      [0, 1],
      [isDark ? "rgba(236,72,153,0.6)" : "#EC4899", isDark ? "#22C55E" : "#16A34A"]
    ),
  }));

  const icon1Style = useAnimatedStyle(() => ({
    opacity: flip1.value > 0.5 ? 1 : 0,
    transform: [{ scale: flip1.value > 0.5 ? 1 : 0.5 }],
  }));

  const icon2Style = useAnimatedStyle(() => ({
    opacity: flip2.value > 0.5 ? 1 : 0,
    transform: [{ scale: flip2.value > 0.5 ? 1 : 0.5 }],
  }));

  const questionColor = isDark ? "rgba(255,255,255,0.6)" : "#BE185D";

  return (
    <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        <Animated.View
          style={[
            card1Style,
            {
              width: 16,
              height: 20,
              borderRadius: 4,
              borderWidth: 1.5,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Animated.Text style={[icon1Style, { fontSize: 10 }]}>⭐</Animated.Text>
          <Animated.Text
            style={[
              { position: "absolute", fontSize: 8, fontWeight: "600", color: questionColor },
              useAnimatedStyle(() => ({ opacity: flip1.value < 0.5 ? 1 : 0 })),
            ]}
          >
            ?
          </Animated.Text>
        </Animated.View>
        <Animated.View
          style={[
            card2Style,
            {
              width: 16,
              height: 20,
              borderRadius: 4,
              borderWidth: 1.5,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Animated.Text style={[icon2Style, { fontSize: 10 }]}>⭐</Animated.Text>
          <Animated.Text
            style={[
              { position: "absolute", fontSize: 8, fontWeight: "600", color: questionColor },
              useAnimatedStyle(() => ({ opacity: flip2.value < 0.5 ? 1 : 0 })),
            ]}
          >
            ?
          </Animated.Text>
        </Animated.View>
      </View>
    </View>
  );
}

// Pattern Tap Preview - Grid cells lighting up in sequence
export function PatternTapPreview({ colors, isDark }: PreviewProps) {
  const cell0 = useSharedValue(0);
  const cell1 = useSharedValue(0);
  const cell2 = useSharedValue(0);
  const cell3 = useSharedValue(0);

  useEffect(() => {
    const runAnimation = () => {
      cell0.value = 0;
      cell1.value = 0;
      cell2.value = 0;
      cell3.value = 0;

      // Sequential lighting pattern
      cell0.value = withDelay(
        100,
        withSequence(withTiming(1, { duration: 200 }), withTiming(0.3, { duration: 300 }))
      );
      cell3.value = withDelay(
        400,
        withSequence(withTiming(1, { duration: 200 }), withTiming(0.3, { duration: 300 }))
      );
      cell1.value = withDelay(
        700,
        withSequence(withTiming(1, { duration: 200 }), withTiming(0.3, { duration: 300 }))
      );
      cell2.value = withDelay(
        1000,
        withSequence(withTiming(1, { duration: 200 }), withTiming(0.3, { duration: 300 }))
      );
    };

    runAnimation();
    const interval = setInterval(runAnimation, 1800);
    return () => clearInterval(interval);
  }, []);

  const inactiveColor = isDark ? "rgba(255,255,255,0.15)" : "#E5E7EB";
  const activeColor = isDark ? "#A78BFA" : "#8B5CF6";

  const CellView = ({ cellValue }: { cellValue: SharedValue<number> }) => {
    const style = useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(cellValue.value, [0, 1], [inactiveColor, activeColor]),
      transform: [{ scale: 1 + cellValue.value * 0.1 }],
    }));

    return (
      <Animated.View
        style={[
          style,
          {
            width: 14,
            height: 14,
            borderRadius: 3,
          },
        ]}
      />
    );
  };

  return (
    <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", width: 32, gap: 2 }}>
        <CellView cellValue={cell0} />
        <CellView cellValue={cell1} />
        <CellView cellValue={cell2} />
        <CellView cellValue={cell3} />
      </View>
    </View>
  );
}

// Reaction Tap Preview - Circle changing color from wait to tap
export function ReactionTapPreview({ colors, isDark }: PreviewProps) {
  const colorProgress = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const runAnimation = () => {
      colorProgress.value = 0;
      scale.value = 1;

      // Pulse while waiting
      scale.value = withSequence(
        withTiming(1.05, { duration: 300 }),
        withTiming(0.95, { duration: 300 }),
        withTiming(1, { duration: 200 })
      );

      // Turn green
      colorProgress.value = withDelay(800, withTiming(1, { duration: 150 }));

      // Tap effect
      scale.value = withDelay(
        900,
        withSequence(withTiming(0.85, { duration: 80 }), withSpring(1.1, { damping: 10 }))
      );
    };

    runAnimation();
    const interval = setInterval(runAnimation, 1800);
    return () => clearInterval(interval);
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(colorProgress.value, [0, 1], ["#F59E0B", "#22C55E"]),
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[
          circleStyle,
          {
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
          },
        ]}
      >
        <Ionicons name="flash" size={14} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

// Map game IDs to preview components
export const GamePreviewComponents: Record<string, React.FC<PreviewProps>> = {
  "word-match": WordMatchPreview,
  "word-scramble": WordScramblePreview,
  "number-pattern": NumberFlowPreview,
  "memory-cards": MemoryMatchPreview,
  "pattern-tap": PatternTapPreview,
  "reaction-tap": ReactionTapPreview,
};
