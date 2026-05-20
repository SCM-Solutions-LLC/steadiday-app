/**
 * Featured Game Previews
 *
 * Animated preview components for the "Game of the Day" featured card.
 * Each game has its own compact animated preview that loops continuously.
 */

import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  type SharedValue,
} from "react-native-reanimated";

// =============================================================================
// WORD MATCH PREVIEW - Two connected tiles
// =============================================================================
export function FeaturedWordMatchPreview() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0, { duration: 600 })
      ),
      -1,
      false
    );
  }, []);

  const lineStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + pulse.value * 0.5,
    transform: [{ scaleX: 0.8 + pulse.value * 0.2 }],
  }));

  return (
    <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 8,
          paddingVertical: 6,
          borderRadius: 6,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#4F46E5" }}>A</Text>
      </View>
      <Animated.View
        style={[
          lineStyle,
          { width: 16, height: 3, backgroundColor: "#FFFFFF", borderRadius: 2 },
        ]}
      />
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 8,
          paddingVertical: 6,
          borderRadius: 6,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#4F46E5" }}>B</Text>
      </View>
    </View>
  );
}

// =============================================================================
// WORD SCRAMBLE PREVIEW - Letters shuffling
// =============================================================================
function ScrambleLetter({
  letter,
  index,
  offset,
}: {
  letter: string;
  index: number;
  offset: SharedValue<number>;
}) {
  const animStyle = useAnimatedStyle(() => {
    let translateX = 0;
    // Reduced from 28 to 12 to prevent clipping in the 80x80 container
    if (index === 0) translateX = offset.value * 12;
    if (index === 2) translateX = -offset.value * 12;
    return { transform: [{ translateX }] };
  });

  return (
    <Animated.View
      style={[
        animStyle,
        {
          width: 20,
          height: 24,
          backgroundColor: "#FFFFFF",
          borderRadius: 5,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: "#7C3AED" }}>{letter}</Text>
    </Animated.View>
  );
}

export function FeaturedWordScramblePreview() {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withDelay(400, withTiming(0, { duration: 500 })),
        withDelay(400, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
  }, []);

  const letters = ["W", "O", "R", "D"];

  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {letters.map((letter, i) => (
        <ScrambleLetter key={i} letter={letter} index={i} offset={offset} />
      ))}
    </View>
  );
}

// =============================================================================
// NUMBER FLOW PREVIEW - Numbers in sequence with pulsing
// =============================================================================
export function FeaturedNumberFlowPreview() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      false
    );
  }, []);

  const questionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.15 }],
    backgroundColor: `rgba(255,255,255,${0.9 + pulse.value * 0.1})`,
  }));

  return (
    <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
      {[2, 4, "?", 8].map((num, i) => (
        <Animated.View
          key={i}
          style={[
            num === "?" ? questionStyle : {},
            {
              width: 22,
              height: 26,
              backgroundColor: num === "?" ? "#FFFFFF" : "rgba(255,255,255,0.3)",
              borderRadius: 5,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: num === "?" ? "#0EA5E9" : "#FFFFFF",
            }}
          >
            {num}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

// =============================================================================
// MEMORY MATCH PREVIEW - Cards flipping
// =============================================================================
export function FeaturedMemoryMatchPreview() {
  const flip1 = useSharedValue(0);
  const flip2 = useSharedValue(0);

  useEffect(() => {
    const runAnimation = () => {
      flip1.value = 0;
      flip2.value = 0;
      flip1.value = withDelay(400, withTiming(1, { duration: 250 }));
      flip2.value = withDelay(700, withTiming(1, { duration: 250 }));
      flip1.value = withDelay(1800, withTiming(0, { duration: 250 }));
      flip2.value = withDelay(1800, withTiming(0, { duration: 250 }));
    };
    runAnimation();
    const interval = setInterval(runAnimation, 2800);
    return () => clearInterval(interval);
  }, []);

  const Card = ({
    flipValue,
    emoji,
  }: {
    flipValue: SharedValue<number>;
    emoji: string;
  }) => {
    const flipStyle = useAnimatedStyle(() => ({
      transform: [{ rotateY: `${flipValue.value * 180}deg` }],
      backgroundColor: flipValue.value > 0.5 ? "#FFFFFF" : "rgba(255,255,255,0.3)",
    }));

    const textStyle = useAnimatedStyle(() => ({
      opacity: flipValue.value > 0.5 ? 1 : 0,
    }));

    const questionStyle = useAnimatedStyle(() => ({
      opacity: flipValue.value > 0.5 ? 0 : 1,
    }));

    return (
      <Animated.View
        style={[
          flipStyle,
          {
            width: 28,
            height: 32,
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Animated.Text style={[textStyle, { fontSize: 16, position: "absolute" }]}>
          {emoji}
        </Animated.Text>
        <Animated.Text
          style={[
            questionStyle,
            { fontSize: 14, color: "#FFFFFF", fontWeight: "700", position: "absolute" },
          ]}
        >
          ?
        </Animated.Text>
      </Animated.View>
    );
  };

  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      <Card flipValue={flip1} emoji="⭐" />
      <Card flipValue={flip2} emoji="⭐" />
    </View>
  );
}

// =============================================================================
// PATTERN TAP PREVIEW - Cells lighting up
// =============================================================================
function PatternTapCell({
  index,
  activeIndex,
}: {
  index: number;
  activeIndex: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    backgroundColor:
      Math.round(activeIndex.value) === index
        ? "#FFFFFF"
        : "rgba(255,255,255,0.25)",
    transform: [{ scale: Math.round(activeIndex.value) === index ? 1.1 : 1 }],
  }));

  return (
    <Animated.View style={[style, { width: 24, height: 24, borderRadius: 6 }]} />
  );
}

export function FeaturedPatternTapPreview() {
  const activeIndex = useSharedValue(-1);

  useEffect(() => {
    const runSequence = () => {
      activeIndex.value = -1;
      activeIndex.value = withSequence(
        withTiming(0, { duration: 0 }),
        withDelay(300, withTiming(2, { duration: 0 })),
        withDelay(300, withTiming(3, { duration: 0 })),
        withDelay(300, withTiming(1, { duration: 0 })),
        withDelay(300, withTiming(-1, { duration: 0 }))
      );
    };
    runSequence();
    const interval = setInterval(runSequence, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", width: 56, gap: 6 }}>
      {[0, 1, 2, 3].map((i) => (
        <PatternTapCell key={i} index={i} activeIndex={activeIndex} />
      ))}
    </View>
  );
}

// =============================================================================
// REACTION TAP PREVIEW - Pulsing circle
// =============================================================================
export function FeaturedReactionTapPreview() {
  const scale = useSharedValue(1);
  const isGreen = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      false
    );
    isGreen.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1200 }),
        withTiming(1, { duration: 150 }),
        withDelay(400, withTiming(0, { duration: 150 }))
      ),
      -1,
      false
    );
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: isGreen.value > 0.5 ? "#22C55E" : "#F59E0B",
  }));

  return (
    <Animated.View
      style={[
        circleStyle,
        {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Ionicons name="hand-left" size={22} color="#FFFFFF" />
    </Animated.View>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================
export const FEATURED_PREVIEW_COMPONENTS: Record<string, React.FC> = {
  "word-match": FeaturedWordMatchPreview,
  "word-scramble": FeaturedWordScramblePreview,
  "number-pattern": FeaturedNumberFlowPreview,
  "memory-cards": FeaturedMemoryMatchPreview,
  "pattern-tap": FeaturedPatternTapPreview,
  "reaction-tap": FeaturedReactionTapPreview,
};

export const FEATURED_CARD_COLORS: Record<string, string> = {
  "word-scramble": "#7C3AED", // Vivid purple
  "word-match": "#4F46E5", // Indigo
  "number-pattern": "#0EA5E9", // Sky blue (not green!)
  "memory-cards": "#F59E0B", // Amber
  "pattern-tap": "#A855F7", // Purple
  "reaction-tap": "#EF4444", // Red
};
