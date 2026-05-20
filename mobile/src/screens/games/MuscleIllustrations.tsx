import React, { useEffect } from "react";
import { View } from "react-native";
import Svg, {
  Path,
  Circle,
  Ellipse,
  Defs,
  RadialGradient,
  Stop,
  LinearGradient,
  Rect,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// =============================================================================
// SHARED
// =============================================================================
type Phase = "tense" | "relax" | "intro" | "transition" | "complete";

const SKIN_LIGHT = "#FDDCB5";
const SKIN_MID = "#F5C9A0";
const SKIN_SHADOW = "#E0A87A";
const SKIN_DEEP = "#D49570";
const MUSCLE_GLOW = "#FF6B6B";
const NAIL_COLOR = "#F5D5C0";
const NAIL_EDGE = "#E8B89A";
const HAIR_COLOR = "#B8A99A";
const HAIR_SHADOW = "#9C8E80";

const SIZE = 220;

function useMuscleAnimation(phase: Phase) {
  const tension = useSharedValue(0);
  const tremor = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (phase === "tense") {
      tension.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.quad),
      });
      tremor.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 180 }),
          withTiming(-0.7, { duration: 180 }),
          withTiming(0.3, { duration: 180 }),
          withTiming(-0.3, { duration: 180 }),
          withTiming(0, { duration: 180 })
        ),
        -1,
        false
      );
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 500 }),
          withTiming(0.97, { duration: 500 })
        ),
        -1,
        true
      );
    } else if (phase === "relax") {
      tension.value = withTiming(0, {
        duration: 1500,
        easing: Easing.out(Easing.quad),
      });
      tremor.value = withTiming(0, { duration: 400 });
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000 }),
          withTiming(0.98, { duration: 2000 })
        ),
        -1,
        true
      );
    } else {
      tension.value = withTiming(0, { duration: 400 });
      tremor.value = withTiming(0, { duration: 200 });
      pulse.value = withTiming(1, { duration: 400 });
    }
  }, [phase]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tremor.value }, { scale: pulse.value }],
  }));

  return { tension, containerStyle };
}

// =============================================================================
// HAND — Palm-up view, fingers curl into fist
// =============================================================================
export function HandIllustration({ phase }: { phase: Phase }) {
  const { tension, containerStyle } = useMuscleAnimation(phase);

  // Palm — wider at top, tapers to wrist
  const palm = useAnimatedProps(() => {
    const t = tension.value;
    const squeeze = interpolate(t, [0, 1], [0, 7]);
    return {
      d: `M ${72 - squeeze} 92 C ${67 - squeeze} 98, ${64 - squeeze} 108, ${66 - squeeze} 120 C ${68 - squeeze} 130, 74 136, 80 139 C 88 141, 116 141, 124 139 C 130 136, ${136 + squeeze} 130, ${138 + squeeze} 120 C ${140 + squeeze} 108, ${137 + squeeze} 98, ${132 + squeeze} 92 Z`,
    };
  });

  // Index finger — tapered with rounded tip
  const indexFinger = useAnimatedProps(() => {
    const t = tension.value;
    const tipY = interpolate(t, [0, 1], [38, 90]);
    const curl = interpolate(t, [0, 1], [0, 22]);
    const midY = interpolate(t, [0, 1], [62, 86]);
    return {
      d: `M 76 93 C 74 86, 73 ${midY + 6}, ${72 + curl * 0.3} ${midY} C ${71 + curl * 0.5} ${tipY + 10}, ${74 + curl * 0.7} ${tipY + 3}, ${78 + curl * 0.8} ${tipY} C ${80 + curl * 0.7} ${tipY - 2}, ${84 + curl * 0.5} ${tipY - 2}, ${86 + curl * 0.4} ${tipY} C ${88 + curl * 0.3} ${tipY + 3}, ${89 + curl * 0.2} ${tipY + 10}, ${90 + curl * 0.15} ${midY} C 90 ${midY + 6}, 90 86, 90 93 Z`,
    };
  });

  // Middle finger — tallest
  const middleFinger = useAnimatedProps(() => {
    const t = tension.value;
    const tipY = interpolate(t, [0, 1], [30, 86]);
    const curl = interpolate(t, [0, 1], [0, 20]);
    const midY = interpolate(t, [0, 1], [54, 82]);
    return {
      d: `M 90 92 C 89 84, 88 ${midY + 8}, ${89 + curl * 0.3} ${midY} C ${89 + curl * 0.4} ${tipY + 10}, ${92 + curl * 0.6} ${tipY + 2}, ${96 + curl * 0.7} ${tipY} C ${98 + curl * 0.6} ${tipY - 2}, ${102 + curl * 0.4} ${tipY - 2}, ${104 + curl * 0.3} ${tipY} C ${106 + curl * 0.2} ${tipY + 2}, ${107 + curl * 0.15} ${tipY + 10}, ${108 + curl * 0.1} ${midY} C 108 ${midY + 8}, 107 84, 106 92 Z`,
    };
  });

  // Ring finger
  const ringFinger = useAnimatedProps(() => {
    const t = tension.value;
    const tipY = interpolate(t, [0, 1], [38, 88]);
    const curl = interpolate(t, [0, 1], [0, 18]);
    const midY = interpolate(t, [0, 1], [60, 84]);
    return {
      d: `M 106 93 C 106 86, 106 ${midY + 6}, ${107 + curl * 0.3} ${midY} C ${107 + curl * 0.4} ${tipY + 9}, ${110 + curl * 0.55} ${tipY + 2}, ${113 + curl * 0.6} ${tipY} C ${115 + curl * 0.5} ${tipY - 2}, ${118 + curl * 0.3} ${tipY - 2}, ${120 + curl * 0.2} ${tipY} C ${121 + curl * 0.15} ${tipY + 2}, ${122 + curl * 0.1} ${tipY + 9}, ${122 + curl * 0.08} ${midY} C 122 ${midY + 6}, 122 86, 122 93 Z`,
    };
  });

  // Pinky finger — shortest
  const pinkyFinger = useAnimatedProps(() => {
    const t = tension.value;
    const tipY = interpolate(t, [0, 1], [50, 92]);
    const curl = interpolate(t, [0, 1], [0, 14]);
    const midY = interpolate(t, [0, 1], [68, 88]);
    return {
      d: `M 122 95 C 122 90, 122 ${midY + 5}, ${123 + curl * 0.25} ${midY} C ${123 + curl * 0.35} ${tipY + 8}, ${125 + curl * 0.5} ${tipY + 2}, ${128 + curl * 0.55} ${tipY} C ${130 + curl * 0.4} ${tipY - 1}, ${132 + curl * 0.25} ${tipY - 1}, ${133 + curl * 0.15} ${tipY} C ${134 + curl * 0.1} ${tipY + 2}, ${134 + curl * 0.05} ${tipY + 8}, ${134 + curl * 0.03} ${midY} C 134 ${midY + 5}, 134 90, 134 95 Z`,
    };
  });

  // Thumb — rests alongside palm when relaxed, wraps across when tense
  const thumb = useAnimatedProps(() => {
    const t = tension.value;
    const tipX = interpolate(t, [0, 1], [58, 88]);
    const tipY = interpolate(t, [0, 1], [106, 86]);
    const baseX = interpolate(t, [0, 1], [64, 72]);
    const baseY = interpolate(t, [0, 1], [130, 108]);
    return {
      d: `M 72 136 C 68 134, ${baseX + 2} ${baseY + 4}, ${baseX} ${baseY} C ${baseX - 2} ${baseY - 6}, ${baseX - 4} ${tipY + 12}, ${tipX} ${tipY + 4} C ${tipX - 2} ${tipY + 1}, ${tipX - 2} ${tipY - 2}, ${tipX} ${tipY - 3} C ${tipX + 3} ${tipY - 4}, ${tipX + 7} ${tipY - 3}, ${tipX + 8} ${tipY} C ${tipX + 9} ${tipY + 4}, ${tipX + 6} ${tipY + 10}, ${tipX + 2} ${tipY + 14} C ${baseX + 8} ${baseY + 2}, 72 134, 76 138 Z`,
    };
  });

  // Wrist/forearm — smooth tapered curves
  const wrist = useAnimatedProps(() => {
    const t = tension.value;
    const tighten = interpolate(t, [0, 1], [0, 4]);
    return {
      d: `M 80 139 C ${74 + tighten} 144, ${70 + tighten} 152, ${68 + tighten} 162 C ${66 + tighten} 172, ${66 + tighten} 180, ${68 + tighten} 190 C ${86} 192, ${118} 192, ${136 - tighten} 190 C ${138 - tighten} 180, ${138 - tighten} 172, ${136 - tighten} 162 C ${134 - tighten} 152, ${130 - tighten} 144, 124 139 Z`,
    };
  });

  // Knuckle highlights
  const knuckles = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 0.5, 1], [0.06, 0.18, 0.4]),
  }));

  // Tendon lines
  const tendons = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 0.5, 1], [0.02, 0.1, 0.3]),
    strokeWidth: interpolate(tension.value, [0, 1], [0.3, 0.8]),
  }));

  // Finger creases
  const creases = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 1], [0.12, 0.3]),
  }));

  // Nail visibility (only when fingers are open)
  const nails = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 0.5, 1], [0.6, 0.3, 0]),
  }));

  return (
    <Animated.View style={[containerStyle, { width: SIZE, height: SIZE }]}>
      <Svg width={SIZE} height={SIZE} viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="hg" cx="50%" cy="44%" rx="46%" ry="50%">
            <Stop offset="0%" stopColor={SKIN_LIGHT} />
            <Stop offset="40%" stopColor={SKIN_LIGHT} />
            <Stop offset="70%" stopColor={SKIN_MID} />
            <Stop offset="100%" stopColor={SKIN_SHADOW} />
          </RadialGradient>
          <LinearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={SKIN_MID} />
            <Stop offset="50%" stopColor={SKIN_SHADOW} />
            <Stop offset="100%" stopColor={SKIN_DEEP} />
          </LinearGradient>
          <LinearGradient id="fingerG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={SKIN_LIGHT} />
            <Stop offset="50%" stopColor={SKIN_MID} />
            <Stop offset="100%" stopColor={SKIN_SHADOW} />
          </LinearGradient>
          <RadialGradient id="thumbG" cx="40%" cy="40%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={SKIN_LIGHT} />
            <Stop offset="100%" stopColor={SKIN_MID} />
          </RadialGradient>
        </Defs>

        {/* Wrist / forearm */}
        <AnimatedPath
          animatedProps={wrist}
          fill="url(#fg)"
          stroke={SKIN_SHADOW}
          strokeWidth={0.8}
          strokeLinejoin="round"
        />

        {/* Wrist creases */}
        <Path d="M 78 142 Q 102 146, 126 142" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" opacity={0.2} strokeLinecap="round" />
        <Path d="M 76 147 Q 102 150, 128 147" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" opacity={0.14} strokeLinecap="round" />

        {/* Wrist bone bump (ulna) */}
        <Ellipse cx={134} cy={155} rx={4} ry={6} fill={SKIN_MID} opacity={0.3} />

        {/* Palm */}
        <AnimatedPath animatedProps={palm} fill="url(#hg)" stroke={SKIN_SHADOW} strokeWidth={0.9} strokeLinejoin="round" />

        {/* Palm highlight */}
        <Ellipse cx={100} cy={112} rx={16} ry={10} fill={SKIN_LIGHT} opacity={0.25} />

        {/* Palm crease (heart line) */}
        <Path d="M 74 110 Q 90 105, 100 108 Q 112 112, 128 106" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" opacity={0.15} strokeLinecap="round" />
        {/* Palm crease (head line) */}
        <Path d="M 76 120 Q 96 116, 126 118" stroke={SKIN_SHADOW} strokeWidth={0.35} fill="none" opacity={0.12} strokeLinecap="round" />

        {/* Hypothenar pad (pinky side) */}
        <Ellipse cx={130} cy={120} rx={6} ry={12} fill={SKIN_MID} opacity={0.15} />

        {/* Fingers */}
        <AnimatedPath animatedProps={indexFinger} fill="url(#fingerG)" stroke={SKIN_SHADOW} strokeWidth={0.7} strokeLinejoin="round" />
        <AnimatedPath animatedProps={middleFinger} fill="url(#fingerG)" stroke={SKIN_SHADOW} strokeWidth={0.7} strokeLinejoin="round" />
        <AnimatedPath animatedProps={ringFinger} fill="url(#fingerG)" stroke={SKIN_SHADOW} strokeWidth={0.7} strokeLinejoin="round" />
        <AnimatedPath animatedProps={pinkyFinger} fill="url(#fingerG)" stroke={SKIN_SHADOW} strokeWidth={0.7} strokeLinejoin="round" />

        {/* Thumb */}
        <AnimatedPath animatedProps={thumb} fill="url(#thumbG)" stroke={SKIN_SHADOW} strokeWidth={0.8} strokeLinejoin="round" />

        {/* Thenar pad (thumb muscle) */}
        <Ellipse cx={68} cy={126} rx={8} ry={10} fill={SKIN_MID} opacity={0.12} />

        {/* Fingernails (visible when open) */}
        <AnimatedEllipse cx={82} cy={42} rx={4} ry={3} fill={NAIL_COLOR} stroke={NAIL_EDGE} strokeWidth={0.4} animatedProps={nails} />
        <AnimatedEllipse cx={98} cy={34} rx={4.5} ry={3} fill={NAIL_COLOR} stroke={NAIL_EDGE} strokeWidth={0.4} animatedProps={nails} />
        <AnimatedEllipse cx={114} cy={42} rx={4} ry={3} fill={NAIL_COLOR} stroke={NAIL_EDGE} strokeWidth={0.4} animatedProps={nails} />
        <AnimatedEllipse cx={130} cy={54} rx={3.5} ry={2.5} fill={NAIL_COLOR} stroke={NAIL_EDGE} strokeWidth={0.4} animatedProps={nails} />

        {/* Tendon lines */}
        <AnimatedPath animatedProps={tendons} d="M 82 93 C 82 80, 80 66, 80 52" stroke={SKIN_DEEP} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={tendons} d="M 98 92 C 98 76, 97 60, 97 46" stroke={SKIN_DEEP} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={tendons} d="M 114 93 C 114 80, 114 66, 114 52" stroke={SKIN_DEEP} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={tendons} d="M 128 95 C 128 84, 128 74, 129 62" stroke={SKIN_DEEP} fill="none" strokeLinecap="round" />

        {/* Knuckle dimples */}
        <AnimatedEllipse cx={82} cy={93} rx={5} ry={2.5} fill={SKIN_SHADOW} animatedProps={knuckles} />
        <AnimatedEllipse cx={98} cy={92} rx={5.5} ry={2.5} fill={SKIN_SHADOW} animatedProps={knuckles} />
        <AnimatedEllipse cx={114} cy={93} rx={5} ry={2.5} fill={SKIN_SHADOW} animatedProps={knuckles} />
        <AnimatedEllipse cx={128} cy={95} rx={4} ry={2} fill={SKIN_SHADOW} animatedProps={knuckles} />

        {/* Finger joint creases — two per finger */}
        <AnimatedPath animatedProps={creases} d="M 77 74 Q 82 72, 88 74" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={creases} d="M 78 58 Q 82 56, 87 58" stroke={SKIN_SHADOW} strokeWidth={0.35} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={creases} d="M 91 68 Q 98 66, 105 68" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={creases} d="M 92 50 Q 98 48, 104 50" stroke={SKIN_SHADOW} strokeWidth={0.35} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={creases} d="M 107 72 Q 114 70, 120 72" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={creases} d="M 108 56 Q 114 54, 119 56" stroke={SKIN_SHADOW} strokeWidth={0.35} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={creases} d="M 124 80 Q 128 78, 132 80" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

// =============================================================================
// ARM — Side-view flexing arm, compact layout that fits the circle
// =============================================================================
export function ArmIllustration({ phase }: { phase: Phase }) {
  const { tension, containerStyle } = useMuscleAnimation(phase);

  // Shoulder cap (deltoid) — blends into upper arm
  const deltoid = useAnimatedProps(() => {
    const t = tension.value;
    const bulge = interpolate(t, [0, 1], [0, 5]);
    return {
      d: `M 66 46 C 70 ${34 - bulge}, 82 ${28 - bulge}, 100 ${26 - bulge} C 118 ${28 - bulge}, 130 ${34 - bulge}, 134 46 C 126 50, 114 52, 100 52 C 86 52, 74 50, 66 46 Z`,
    };
  });

  // Upper arm — fills more of the circle vertically
  const upperArm = useAnimatedProps(() => {
    const t = tension.value;
    const bicepBulge = interpolate(t, [0, 1], [0, 18]);
    const tricepBulge = interpolate(t, [0, 1], [0, 6]);
    return {
      d: `M 74 46 C ${70 - bicepBulge * 0.4} 56, ${64 - bicepBulge * 0.7} 68, ${62 - bicepBulge * 0.9} 82 C ${60 - bicepBulge * 0.7} 94, ${64 - bicepBulge * 0.3} 104, 72 112 C 78 118, 88 120, 100 120 C 112 120, 122 118, 128 112 C ${136 + tricepBulge * 0.3} 104, ${140 + tricepBulge * 0.7} 94, ${138 + tricepBulge * 0.9} 82 C ${136 + tricepBulge * 0.7} 68, ${130 + tricepBulge * 0.4} 56, 126 46 Z`,
    };
  });

  // Bicep glow
  const bicepGlow = useAnimatedProps(() => {
    const t = tension.value;
    return {
      cx: interpolate(t, [0, 1], [84, 66]),
      cy: interpolate(t, [0, 1], [80, 76]),
      rx: interpolate(t, [0, 1], [8, 22]),
      ry: interpolate(t, [0, 1], [10, 16]),
      opacity: interpolate(t, [0, 1], [0, 0.3]),
    };
  });

  // Forearm — bends up when flexing, rests at a natural slight angle
  const forearm = useAnimatedProps(() => {
    const t = tension.value;
    const wristX = interpolate(t, [0, 1], [80, 52]);
    const wristY = interpolate(t, [0, 1], [168, 36]);
    const midX = interpolate(t, [0, 1], [86, 58]);
    const midY = interpolate(t, [0, 1], [144, 76]);
    return {
      d: `M 82 120 C 80 128, ${midX - 4} ${midY - 14}, ${wristX - 4} ${wristY + 14} C ${wristX - 6} ${wristY + 6}, ${wristX - 4} ${wristY}, ${wristX} ${wristY - 2} C ${wristX + 8} ${wristY - 4}, ${wristX + 16} ${wristY - 2}, ${wristX + 18} ${wristY + 2} C ${wristX + 20} ${wristY + 8}, ${wristX + 18} ${wristY + 14}, ${wristX + 14} ${wristY + 18} C ${midX + 18} ${midY - 10}, 118 128, 116 120 Z`,
    };
  });

  // Hand/fist — larger, more visible
  const fist = useAnimatedProps(() => {
    const t = tension.value;
    return {
      cx: interpolate(t, [0, 1], [80, 52]),
      cy: interpolate(t, [0, 1], [176, 28]),
      rx: interpolate(t, [0, 1], [12, 16]),
      ry: interpolate(t, [0, 1], [10, 13]),
    };
  });

  // Fist knuckle bumps
  const fistKnuckles = useAnimatedProps(() => {
    const t = tension.value;
    const cx = interpolate(t, [0, 1], [80, 52]);
    const cy = interpolate(t, [0, 1], [168, 18]);
    return {
      d: `M ${cx - 10} ${cy} Q ${cx - 4} ${cy - 4}, ${cx} ${cy - 5} Q ${cx + 4} ${cy - 4}, ${cx + 10} ${cy}`,
      opacity: interpolate(t, [0.2, 1], [0, 0.35]),
    };
  });

  // Finger lines on relaxed hand
  const fingerLines = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 0.4], [0.2, 0]),
  }));

  // Vein
  const vein = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0.2, 1], [0, 0.22]),
    strokeWidth: interpolate(tension.value, [0, 1], [0.3, 0.9]),
  }));

  // Separation line
  const sepLine = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 0.5, 1], [0.04, 0.14, 0.3]),
  }));

  // Elbow crease
  const elbowCrease = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 1], [0.06, 0.25]),
  }));

  // Striations
  const striations = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0.5, 1], [0, 0.14]),
  }));

  return (
    <Animated.View style={[containerStyle, { width: SIZE, height: SIZE }]}>
      <Svg width={SIZE} height={SIZE} viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="ag" cx="38%" cy="35%" rx="50%" ry="55%">
            <Stop offset="0%" stopColor={SKIN_LIGHT} />
            <Stop offset="45%" stopColor={SKIN_MID} />
            <Stop offset="100%" stopColor={SKIN_SHADOW} />
          </RadialGradient>
          <RadialGradient id="bicG" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={MUSCLE_GLOW} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={MUSCLE_GLOW} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="dG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={SKIN_LIGHT} />
            <Stop offset="60%" stopColor={SKIN_MID} />
            <Stop offset="100%" stopColor={SKIN_SHADOW} />
          </LinearGradient>
          <LinearGradient id="fArmG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={SKIN_MID} />
            <Stop offset="60%" stopColor={SKIN_SHADOW} />
            <Stop offset="100%" stopColor={SKIN_DEEP} />
          </LinearGradient>
        </Defs>

        {/* Deltoid */}
        <AnimatedPath animatedProps={deltoid} fill="url(#dG)" stroke={SKIN_SHADOW} strokeWidth={0.8} strokeLinejoin="round" />

        {/* Upper arm */}
        <AnimatedPath animatedProps={upperArm} fill="url(#ag)" stroke={SKIN_SHADOW} strokeWidth={0.9} strokeLinejoin="round" />

        {/* Upper arm highlight */}
        <Ellipse cx={86} cy={72} rx={10} ry={14} fill={SKIN_LIGHT} opacity={0.15} />

        {/* Bicep glow */}
        <AnimatedEllipse animatedProps={bicepGlow} fill="url(#bicG)" />

        {/* Bicep/tricep separation */}
        <AnimatedPath animatedProps={sepLine} d="M 124 48 C 130 68, 130 88, 126 108" stroke={SKIN_SHADOW} strokeWidth={0.6} fill="none" strokeLinecap="round" />

        {/* Vein */}
        <AnimatedPath animatedProps={vein} d="M 76 54 C 70 66, 66 80, 70 96 C 72 104, 76 112, 82 118" stroke="#C4856B" fill="none" strokeLinecap="round" />

        {/* Striations */}
        <AnimatedPath animatedProps={striations} d="M 66 66 C 70 68, 74 74, 76 80" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={striations} d="M 64 78 C 68 80, 72 86, 74 92" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />

        {/* Elbow crease */}
        <AnimatedPath animatedProps={elbowCrease} d="M 82 118 Q 100 124, 116 118" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" strokeLinecap="round" />

        {/* Forearm */}
        <AnimatedPath animatedProps={forearm} fill="url(#fArmG)" stroke={SKIN_SHADOW} strokeWidth={0.8} strokeLinejoin="round" />

        {/* Fist/hand */}
        <AnimatedEllipse animatedProps={fist} fill={SKIN_LIGHT} stroke={SKIN_SHADOW} strokeWidth={0.7} />

        {/* Fist knuckle bumps */}
        <AnimatedPath animatedProps={fistKnuckles} stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" strokeLinecap="round" />

        {/* Finger lines on relaxed hand */}
        <AnimatedPath animatedProps={fingerLines} d="M 72 172 L 72 182" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={fingerLines} d="M 78 172 L 78 184" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={fingerLines} d="M 84 172 L 84 182" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

// =============================================================================
// SHOULDERS — Upper body front view, neck/trap focus
// =============================================================================
export function ShoulderIllustration({ phase }: { phase: Phase }) {
  const { tension, containerStyle } = useMuscleAnimation(phase);

  // Head — with chin shape
  const head = useAnimatedProps(() => {
    const t = tension.value;
    return {
      cy: interpolate(t, [0, 1], [38, 48]),
      rx: 20 as number,
      ry: 24 as number,
    };
  });

  // Neck — thicker, with natural taper
  const neck = useAnimatedProps(() => {
    const t = tension.value;
    const shrink = interpolate(t, [0, 1], [0, 18]);
    return {
      d: `M 86 ${68 + shrink} C 86 ${62 + shrink * 0.5}, 90 54, 100 52 C 110 54, 114 ${62 + shrink * 0.5}, 114 ${68 + shrink} Z`,
    };
  });

  // Torso — cropped to upper chest, emphasis on shoulder area
  const body = useAnimatedProps(() => {
    const t = tension.value;
    const shY = interpolate(t, [0, 1], [72, 56]);
    return {
      d: `M 36 ${shY + 4} C 34 ${shY + 14}, 36 ${shY + 28}, 42 ${shY + 42} C 52 ${shY + 56}, 72 ${shY + 64}, 100 ${shY + 66} C 128 ${shY + 64}, 148 ${shY + 56}, 158 ${shY + 42} C 164 ${shY + 28}, 166 ${shY + 14}, 164 ${shY + 4} C 146 ${shY - 6}, 124 ${shY - 10}, 100 ${shY - 10} C 76 ${shY - 10}, 54 ${shY - 6}, 36 ${shY + 4} Z`,
    };
  });

  // Left trapezius
  const leftTrap = useAnimatedProps(() => {
    const t = tension.value;
    const raise = interpolate(t, [0, 1], [0, 22]);
    const bulge = interpolate(t, [0, 1], [0, 12]);
    const shY = interpolate(t, [0, 1], [72, 56]);
    return {
      d: `M 86 ${68 - raise * 0.3} C 72 ${62 - raise - bulge * 0.5}, 56 ${64 - raise - bulge * 0.9}, 42 ${66 - raise - bulge} C 38 ${67 - raise - bulge}, 36 ${shY}, 36 ${shY + 4} C 50 ${shY + 6}, 70 ${shY + 2}, 86 ${shY} Z`,
    };
  });

  // Right trapezius
  const rightTrap = useAnimatedProps(() => {
    const t = tension.value;
    const raise = interpolate(t, [0, 1], [0, 22]);
    const bulge = interpolate(t, [0, 1], [0, 12]);
    const shY = interpolate(t, [0, 1], [72, 56]);
    return {
      d: `M 114 ${68 - raise * 0.3} C 128 ${62 - raise - bulge * 0.5}, 144 ${64 - raise - bulge * 0.9}, 158 ${66 - raise - bulge} C 162 ${67 - raise - bulge}, 164 ${shY}, 164 ${shY + 4} C 150 ${shY + 6}, 130 ${shY + 2}, 114 ${shY} Z`,
    };
  });

  // Trap glow
  const trapGlowL = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 0.5, 1], [0, 0.06, 0.3]),
    rx: interpolate(tension.value, [0, 1], [8, 20]),
    ry: interpolate(tension.value, [0, 1], [5, 12]),
    cx: interpolate(tension.value, [0, 1], [62, 58]),
    cy: interpolate(tension.value, [0, 1], [68, 52]),
  }));
  const trapGlowR = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 0.5, 1], [0, 0.06, 0.3]),
    rx: interpolate(tension.value, [0, 1], [8, 20]),
    ry: interpolate(tension.value, [0, 1], [5, 12]),
    cx: interpolate(tension.value, [0, 1], [138, 142]),
    cy: interpolate(tension.value, [0, 1], [68, 52]),
  }));

  // Neck tension lines
  const neckLines = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0.3, 1], [0, 0.3]),
  }));

  // Collarbone
  const collarbone = useAnimatedProps(() => {
    const t = tension.value;
    const shY = interpolate(t, [0, 1], [72, 56]);
    return {
      d: `M 44 ${shY + 6} Q 100 ${shY - 2}, 156 ${shY + 6}`,
      opacity: interpolate(t, [0, 1], [0.15, 0.35]),
    };
  });

  // Chest line hints
  const chestLines = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 1], [0.05, 0.14]),
  }));

  return (
    <Animated.View style={[containerStyle, { width: SIZE, height: SIZE }]}>
      <Svg width={SIZE} height={SIZE} viewBox="0 0 200 185">
        <Defs>
          <RadialGradient id="sg" cx="50%" cy="35%" rx="55%" ry="55%">
            <Stop offset="0%" stopColor={SKIN_LIGHT} />
            <Stop offset="45%" stopColor={SKIN_MID} />
            <Stop offset="100%" stopColor={SKIN_SHADOW} />
          </RadialGradient>
          <RadialGradient id="tglow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={MUSCLE_GLOW} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={MUSCLE_GLOW} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={SKIN_LIGHT} />
            <Stop offset="35%" stopColor={SKIN_MID} />
            <Stop offset="100%" stopColor={SKIN_SHADOW} />
          </LinearGradient>
          <RadialGradient id="headG" cx="50%" cy="40%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={SKIN_LIGHT} />
            <Stop offset="70%" stopColor={SKIN_MID} />
            <Stop offset="100%" stopColor={SKIN_SHADOW} />
          </RadialGradient>
        </Defs>

        {/* Main body */}
        <AnimatedPath animatedProps={body} fill="url(#bodyG)" stroke={SKIN_SHADOW} strokeWidth={0.7} strokeLinejoin="round" />

        {/* Body highlight */}
        <Ellipse cx={100} cy={100} rx={24} ry={18} fill={SKIN_LIGHT} opacity={0.1} />

        {/* Chest center line */}
        <AnimatedPath animatedProps={chestLines} d="M 100 78 L 100 126" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        {/* Pec hints */}
        <AnimatedPath animatedProps={chestLines} d="M 76 92 Q 88 88, 98 90" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={chestLines} d="M 102 90 Q 112 88, 124 92" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />

        {/* Deltoid caps */}
        <Ellipse cx={38} cy={76} rx={8} ry={6} fill={SKIN_MID} stroke={SKIN_SHADOW} strokeWidth={0.4} opacity={0.5} />
        <Ellipse cx={162} cy={76} rx={8} ry={6} fill={SKIN_MID} stroke={SKIN_SHADOW} strokeWidth={0.4} opacity={0.5} />

        {/* Left trap */}
        <AnimatedPath animatedProps={leftTrap} fill="url(#sg)" stroke={SKIN_SHADOW} strokeWidth={0.9} strokeLinejoin="round" />
        <AnimatedEllipse animatedProps={trapGlowL} fill="url(#tglow)" />

        {/* Right trap */}
        <AnimatedPath animatedProps={rightTrap} fill="url(#sg)" stroke={SKIN_SHADOW} strokeWidth={0.9} strokeLinejoin="round" />
        <AnimatedEllipse animatedProps={trapGlowR} fill="url(#tglow)" />

        {/* Collarbone */}
        <AnimatedPath animatedProps={collarbone} stroke={SKIN_SHADOW} strokeWidth={0.7} fill="none" strokeLinecap="round" />

        {/* Neck */}
        <AnimatedPath animatedProps={neck} fill={SKIN_LIGHT} stroke={SKIN_SHADOW} strokeWidth={0.6} />

        {/* SCM neck muscles */}
        <AnimatedPath animatedProps={neckLines} d="M 93 54 C 91 60, 89 66, 88 72" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={neckLines} d="M 107 54 C 109 60, 111 66, 112 72" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />

        {/* Head */}
        <AnimatedEllipse cx={100} animatedProps={head} fill="url(#headG)" stroke={SKIN_SHADOW} strokeWidth={0.7} />

        {/* Head highlight */}
        <Ellipse cx={96} cy={32} rx={8} ry={6} fill={SKIN_LIGHT} opacity={0.2} />

        {/* Hair (silver/gray) */}
        <Path d="M 80 22 C 80 12, 90 6, 100 6 C 110 6, 120 12, 120 22 C 118 16, 110 12, 100 12 C 90 12, 82 16, 80 22 Z" fill={HAIR_COLOR} stroke={HAIR_SHADOW} strokeWidth={0.4} opacity={0.6} />

        {/* Ears */}
        <Ellipse cx={79} cy={38} rx={4} ry={8} fill={SKIN_MID} stroke={SKIN_SHADOW} strokeWidth={0.4} />
        <Ellipse cx={121} cy={38} rx={4} ry={8} fill={SKIN_MID} stroke={SKIN_SHADOW} strokeWidth={0.4} />

        {/* Eyes */}
        <Ellipse cx={92} cy={36} rx={2.5} ry={2} fill="#776655" />
        <Ellipse cx={108} cy={36} rx={2.5} ry={2} fill="#776655" />
        <Ellipse cx={92} cy={35.5} rx={1} ry={0.8} fill={SKIN_LIGHT} opacity={0.6} />
        <Ellipse cx={108} cy={35.5} rx={1} ry={0.8} fill={SKIN_LIGHT} opacity={0.6} />

        {/* Eyebrows */}
        <Path d="M 87 32 Q 92 30, 97 32" stroke="#8B7B6B" strokeWidth={1.2} fill="none" strokeLinecap="round" />
        <Path d="M 103 32 Q 108 30, 113 32" stroke="#8B7B6B" strokeWidth={1.2} fill="none" strokeLinecap="round" />

        {/* Nose */}
        <Path d="M 100 36 C 99 40, 97 44, 96 46 Q 100 48, 104 46 C 103 44, 101 40, 100 36" fill={SKIN_MID} opacity={0.4} />

        {/* Mouth — friendly neutral */}
        <Path d="M 95 50 Q 100 52, 105 50" stroke="#C4A090" strokeWidth={0.6} fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

// =============================================================================
// FACE — Expressive scrunching with hair and character
// =============================================================================
export function FaceIllustration({ phase }: { phase: Phase }) {
  const { tension, containerStyle } = useMuscleAnimation(phase);

  const faceShape = useAnimatedProps(() => {
    const t = tension.value;
    return {
      rx: interpolate(t, [0, 1], [58, 55]),
      ry: interpolate(t, [0, 1], [68, 65]),
    };
  });

  const leftEye = useAnimatedProps(() => {
    const t = tension.value;
    const openness = interpolate(t, [0, 1], [9, 0.5]);
    const squeeze = interpolate(t, [0, 1], [0, 5]);
    return {
      d: `M ${66 + squeeze} 88 Q ${80 + squeeze * 0.5} ${88 - openness * 2.2}, ${94 + squeeze * 0.2} 88 Q ${80 + squeeze * 0.5} ${88 + openness * 1.3}, ${66 + squeeze} 88 Z`,
    };
  });

  const rightEye = useAnimatedProps(() => {
    const t = tension.value;
    const openness = interpolate(t, [0, 1], [9, 0.5]);
    const squeeze = interpolate(t, [0, 1], [0, -5]);
    return {
      d: `M ${106 + squeeze * 0.2} 88 Q ${120 + squeeze * 0.5} ${88 - openness * 2.2}, ${134 + squeeze} 88 Q ${120 + squeeze * 0.5} ${88 + openness * 1.3}, ${106 + squeeze * 0.2} 88 Z`,
    };
  });

  const leftPupil = useAnimatedProps(() => ({
    r: interpolate(tension.value, [0, 1], [4, 0.5]),
    cy: interpolate(tension.value, [0, 1], [86, 88]),
  }));

  const rightPupil = useAnimatedProps(() => ({
    r: interpolate(tension.value, [0, 1], [4, 0.5]),
    cy: interpolate(tension.value, [0, 1], [86, 88]),
  }));

  const leftBrow = useAnimatedProps(() => {
    const t = tension.value;
    const furrow = interpolate(t, [0, 1], [0, 12]);
    const tilt = interpolate(t, [0, 1], [0, 6]);
    return {
      d: `M 64 ${74 + furrow - tilt} Q 80 ${68 + furrow}, 96 ${74 + furrow + tilt}`,
    };
  });

  const rightBrow = useAnimatedProps(() => {
    const t = tension.value;
    const furrow = interpolate(t, [0, 1], [0, 12]);
    const tilt = interpolate(t, [0, 1], [0, 6]);
    return {
      d: `M 104 ${74 + furrow + tilt} Q 120 ${68 + furrow}, 136 ${74 + furrow - tilt}`,
    };
  });

  const mouth = useAnimatedProps(() => {
    const t = tension.value;
    const width = interpolate(t, [0, 1], [18, 3]);
    const curve = interpolate(t, [0, 1], [5, -3]);
    const y = interpolate(t, [0, 1], [125, 122]);
    return {
      d: `M ${100 - width} ${y} Q 100 ${y + curve}, ${100 + width} ${y}`,
    };
  });

  const noseLines = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0.1, 0.7], [0, 0.5]),
  }));

  const wrinkles = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0.2, 0.8], [0, 0.4]),
  }));

  const crowsFeet = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0.3, 1], [0, 0.5]),
  }));

  const jaw = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0.3, 1], [0, 0.22]),
  }));

  const cheekTension = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0.2, 1], [0, 0.28]),
  }));

  return (
    <Animated.View style={[containerStyle, { width: SIZE, height: SIZE }]}>
      <Svg width={SIZE} height={SIZE} viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="fgrad" cx="50%" cy="44%" rx="50%" ry="54%">
            <Stop offset="0%" stopColor={SKIN_LIGHT} />
            <Stop offset="40%" stopColor={SKIN_LIGHT} />
            <Stop offset="70%" stopColor={SKIN_MID} />
            <Stop offset="100%" stopColor={SKIN_SHADOW} />
          </RadialGradient>
        </Defs>

        {/* Neck — wider, with taper */}
        <Path
          d="M 86 152 C 84 160, 84 172, 86 188 Q 100 194, 114 188 C 116 172, 116 160, 114 152"
          fill={SKIN_MID}
          stroke={SKIN_SHADOW}
          strokeWidth={0.6}
        />
        {/* Adam's apple hint */}
        <Ellipse cx={100} cy={162} rx={3} ry={4} fill={SKIN_SHADOW} opacity={0.08} />

        {/* Face */}
        <AnimatedEllipse cx={100} cy={102} animatedProps={faceShape} fill="url(#fgrad)" stroke={SKIN_SHADOW} strokeWidth={0.8} />

        {/* Face highlight */}
        <Ellipse cx={94} cy={88} rx={18} ry={14} fill={SKIN_LIGHT} opacity={0.15} />

        {/* Chin shape */}
        <Path d="M 88 160 Q 100 170, 112 160" fill={SKIN_MID} opacity={0.08} />

        {/* Hair — silver/gray */}
        <Path
          d="M 42 86 C 42 50, 62 28, 100 28 C 138 28, 158 50, 158 86 C 156 72, 144 42, 100 42 C 56 42, 44 72, 42 86 Z"
          fill={HAIR_COLOR}
          stroke={HAIR_SHADOW}
          strokeWidth={0.5}
          opacity={0.7}
        />
        {/* Hair highlight */}
        <Path
          d="M 70 40 C 80 34, 92 30, 100 30 C 108 30, 116 32, 122 36"
          stroke={SKIN_LIGHT}
          strokeWidth={1.5}
          fill="none"
          opacity={0.3}
          strokeLinecap="round"
        />

        {/* Ears */}
        <Ellipse cx={42} cy={100} rx={6} ry={14} fill={SKIN_MID} stroke={SKIN_SHADOW} strokeWidth={0.5} />
        <Path d="M 44 94 C 40 98, 40 104, 44 106" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" opacity={0.3} />
        <Ellipse cx={158} cy={100} rx={6} ry={14} fill={SKIN_MID} stroke={SKIN_SHADOW} strokeWidth={0.5} />
        <Path d="M 156 94 C 160 98, 160 104, 156 106" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" opacity={0.3} />

        {/* Forehead wrinkles (appear when tense) */}
        <AnimatedPath animatedProps={wrinkles} d="M 72 56 Q 100 53, 128 56" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={wrinkles} d="M 75 62 Q 100 59, 125 62" stroke={SKIN_SHADOW} strokeWidth={0.45} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={wrinkles} d="M 78 68 Q 100 65, 122 68" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />

        {/* Eyebrows */}
        <AnimatedPath animatedProps={leftBrow} stroke="#8B7B6B" strokeWidth={2} strokeLinecap="round" fill="none" />
        <AnimatedPath animatedProps={rightBrow} stroke="#8B7B6B" strokeWidth={2} strokeLinecap="round" fill="none" />

        {/* Eyes */}
        <AnimatedPath animatedProps={leftEye} fill="#FFFFFF" stroke="#666" strokeWidth={0.8} />
        <AnimatedPath animatedProps={rightEye} fill="#FFFFFF" stroke="#666" strokeWidth={0.8} />

        {/* Pupils — slightly larger */}
        <AnimatedCircle cx={80} animatedProps={leftPupil} fill="#443322" />
        <AnimatedCircle cx={120} animatedProps={rightPupil} fill="#443322" />
        {/* Pupil highlights */}
        <Circle cx={78} cy={84} r={1.5} fill="white" opacity={0.5} />
        <Circle cx={118} cy={84} r={1.5} fill="white" opacity={0.5} />

        {/* Upper eyelids (subtle shadow) */}
        <Path d="M 66 84 Q 80 78, 94 84" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" opacity={0.2} strokeLinecap="round" />
        <Path d="M 106 84 Q 120 78, 134 84" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" opacity={0.2} strokeLinecap="round" />

        {/* Crow's feet */}
        <AnimatedPath animatedProps={crowsFeet} d="M 58 84 C 54 80, 52 78, 50 78" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={crowsFeet} d="M 58 88 C 53 88, 50 88, 48 88" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={crowsFeet} d="M 58 92 C 54 96, 52 98, 50 98" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={crowsFeet} d="M 142 84 C 146 80, 148 78, 150 78" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={crowsFeet} d="M 142 88 C 147 88, 150 88, 152 88" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={crowsFeet} d="M 142 92 C 146 96, 148 98, 150 98" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" strokeLinecap="round" />

        {/* Nose — larger with bridge */}
        <Path d="M 100 78 C 98 86, 96 94, 93 104" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" opacity={0.25} strokeLinecap="round" />
        <Path d="M 93 104 Q 96 108, 100 109 Q 104 108, 107 104" fill={SKIN_MID} stroke={SKIN_SHADOW} strokeWidth={0.5} opacity={0.4} />
        {/* Nostrils */}
        <Ellipse cx={96} cy={106} rx={2.5} ry={1.5} fill={SKIN_SHADOW} opacity={0.15} />
        <Ellipse cx={104} cy={106} rx={2.5} ry={1.5} fill={SKIN_SHADOW} opacity={0.15} />

        {/* Nose crinkle lines */}
        <AnimatedPath animatedProps={noseLines} d="M 88 96 Q 84 100, 86 106" stroke={SKIN_SHADOW} strokeWidth={0.6} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={noseLines} d="M 112 96 Q 116 100, 114 106" stroke={SKIN_SHADOW} strokeWidth={0.6} fill="none" strokeLinecap="round" />

        {/* Nasolabial folds (smile lines) */}
        <AnimatedPath animatedProps={cheekTension} d="M 82 104 C 80 112, 82 118, 86 124" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={cheekTension} d="M 118 104 C 120 112, 118 118, 114 124" stroke={SKIN_SHADOW} strokeWidth={0.5} fill="none" strokeLinecap="round" />

        {/* Mouth */}
        <AnimatedPath animatedProps={mouth} stroke="#C4756B" strokeWidth={1.8} fill="none" strokeLinecap="round" />

        {/* Jaw tension line */}
        <AnimatedPath animatedProps={jaw} d="M 55 115 Q 100 152, 145 115" stroke={SKIN_SHADOW} strokeWidth={0.6} fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

// =============================================================================
// CHEST — Upper torso with arms stubs, pec definition
// =============================================================================
export function ChestIllustration({ phase }: { phase: Phase }) {
  const { tension, containerStyle } = useMuscleAnimation(phase);

  // Torso — broader shoulders, tapered waist
  const torso = useAnimatedProps(() => {
    const t = tension.value;
    const expand = interpolate(t, [0, 1], [0, 14]);
    return {
      d: `M ${58 - expand * 0.6} 72 C ${48 - expand * 0.7} 88, ${52 - expand * 0.5} 108, ${58 - expand * 0.3} 132 C ${64} 150, 80 164, 100 166 C 120 164, ${136} 150, ${142 + expand * 0.3} 132 C ${148 + expand * 0.5} 108, ${152 + expand * 0.7} 88, ${142 + expand * 0.6} 72 C ${136 + expand * 0.3} 64, 120 ${62 - expand * 0.2}, 100 ${62 - expand * 0.2} C 80 ${62 - expand * 0.2}, ${64 - expand * 0.3} 64, ${58 - expand * 0.6} 72 Z`,
    };
  });

  // Left pec
  const leftPec = useAnimatedProps(() => {
    const t = tension.value;
    const expand = interpolate(t, [0, 1], [0, 10]);
    return {
      d: `M 82 78 C ${68 - expand} ${90 + expand * 0.3}, ${70 - expand * 0.4} 108, 82 112 Q 92 114, 98 108 C 96 94, 90 82, 82 78`,
    };
  });

  // Right pec
  const rightPec = useAnimatedProps(() => {
    const t = tension.value;
    const expand = interpolate(t, [0, 1], [0, 10]);
    return {
      d: `M 118 78 C ${132 + expand} ${90 + expand * 0.3}, ${130 + expand * 0.4} 108, 118 112 Q 108 114, 102 108 C 104 94, 110 82, 118 78`,
    };
  });

  const pecGlow = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 0.5, 1], [0, 0.08, 0.25]),
  }));

  const ribs = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0.25, 1], [0, 0.2]),
  }));

  const sternum = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 1], [0.06, 0.28]),
  }));

  const abs = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 1], [0.04, 0.16]),
  }));

  const collarbone = useAnimatedProps(() => {
    const t = tension.value;
    const expand = interpolate(t, [0, 1], [0, 10]);
    return {
      d: `M ${60 - expand} 76 Q 100 68, ${140 + expand} 76`,
    };
  });

  return (
    <Animated.View style={[containerStyle, { width: SIZE, height: SIZE }]}>
      <Svg width={SIZE} height={SIZE} viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="cg" cx="50%" cy="36%" rx="52%" ry="55%">
            <Stop offset="0%" stopColor={SKIN_LIGHT} />
            <Stop offset="40%" stopColor={SKIN_LIGHT} />
            <Stop offset="70%" stopColor={SKIN_MID} />
            <Stop offset="100%" stopColor={SKIN_SHADOW} />
          </RadialGradient>
          <RadialGradient id="pglow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={MUSCLE_GLOW} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={MUSCLE_GLOW} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="chestHeadG" cx="50%" cy="40%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={SKIN_LIGHT} />
            <Stop offset="100%" stopColor={SKIN_MID} />
          </RadialGradient>
        </Defs>

        {/* Neck */}
        <Path
          d="M 90 36 C 90 42, 90 48, 90 56 Q 100 60, 110 56 C 110 48, 110 42, 110 36"
          fill={SKIN_MID}
          stroke={SKIN_SHADOW}
          strokeWidth={0.6}
        />

        {/* Head */}
        <Circle cx={100} cy={28} r={18} fill="url(#chestHeadG)" stroke={SKIN_SHADOW} strokeWidth={0.6} />
        {/* Hair */}
        <Path d="M 82 20 C 82 12, 90 6, 100 6 C 110 6, 118 12, 118 20 C 116 14, 108 10, 100 10 C 92 10, 84 14, 82 20 Z" fill={HAIR_COLOR} opacity={0.6} />
        {/* Eyes */}
        <Circle cx={94} cy={26} r={1.5} fill="#776655" />
        <Circle cx={106} cy={26} r={1.5} fill="#776655" />
        {/* Mouth */}
        <Path d="M 96 33 Q 100 35, 104 33" stroke="#C4A090" strokeWidth={0.5} fill="none" strokeLinecap="round" />

        {/* Torso */}
        <AnimatedPath animatedProps={torso} fill="url(#cg)" stroke={SKIN_SHADOW} strokeWidth={0.8} strokeLinejoin="round" />

        {/* Torso highlight */}
        <Ellipse cx={100} cy={96} rx={18} ry={14} fill={SKIN_LIGHT} opacity={0.1} />

        {/* Collarbone */}
        <AnimatedPath animatedProps={collarbone} stroke={SKIN_SHADOW} strokeWidth={0.6} fill="none" opacity={0.25} strokeLinecap="round" />

        {/* Arm stubs — visible on sides of torso */}
        <Path
          d="M 50 78 C 40 84, 34 96, 36 108 C 38 114, 42 118, 48 116 C 50 106, 50 92, 50 82"
          fill={SKIN_MID}
          stroke={SKIN_SHADOW}
          strokeWidth={0.5}
          opacity={0.65}
          strokeLinejoin="round"
        />
        <Path
          d="M 150 78 C 160 84, 166 96, 164 108 C 162 114, 158 118, 152 116 C 150 106, 150 92, 150 82"
          fill={SKIN_MID}
          stroke={SKIN_SHADOW}
          strokeWidth={0.5}
          opacity={0.65}
          strokeLinejoin="round"
        />

        {/* Deltoid caps on shoulders */}
        <Ellipse cx={52} cy={76} rx={7} ry={4} fill={SKIN_MID} stroke={SKIN_SHADOW} strokeWidth={0.4} opacity={0.45} />
        <Ellipse cx={148} cy={76} rx={7} ry={4} fill={SKIN_MID} stroke={SKIN_SHADOW} strokeWidth={0.4} opacity={0.45} />

        {/* Pecs */}
        <AnimatedPath animatedProps={leftPec} fill={SKIN_MID} stroke={SKIN_SHADOW} strokeWidth={0.5} opacity={0.28} />
        <AnimatedPath animatedProps={rightPec} fill={SKIN_MID} stroke={SKIN_SHADOW} strokeWidth={0.5} opacity={0.28} />

        {/* Pec glow */}
        <AnimatedEllipse cx={82} cy={96} rx={16} ry={12} animatedProps={pecGlow} fill="url(#pglow)" />
        <AnimatedEllipse cx={118} cy={96} rx={16} ry={12} animatedProps={pecGlow} fill="url(#pglow)" />

        {/* Sternum */}
        <AnimatedPath animatedProps={sternum} d="M 100 80 L 100 126" stroke={SKIN_SHADOW} strokeWidth={0.6} fill="none" strokeLinecap="round" />

        {/* Ribs */}
        <AnimatedPath animatedProps={ribs} d="M 70 108 Q 84 104, 98 108" stroke={SKIN_SHADOW} strokeWidth={0.35} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={ribs} d="M 102 108 Q 116 104, 130 108" stroke={SKIN_SHADOW} strokeWidth={0.35} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={ribs} d="M 72 118 Q 84 114, 98 118" stroke={SKIN_SHADOW} strokeWidth={0.3} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={ribs} d="M 102 118 Q 116 114, 128 118" stroke={SKIN_SHADOW} strokeWidth={0.3} fill="none" strokeLinecap="round" />

        {/* Abs */}
        <AnimatedPath animatedProps={abs} d="M 100 124 L 100 158" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={abs} d="M 86 132 Q 100 130, 114 132" stroke={SKIN_SHADOW} strokeWidth={0.3} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={abs} d="M 87 142 Q 100 140, 113 142" stroke={SKIN_SHADOW} strokeWidth={0.3} fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

// =============================================================================
// LEGS — Front view with natural muscle contours and proper feet
// =============================================================================
export function LegIllustration({ phase }: { phase: Phase }) {
  const { tension, containerStyle } = useMuscleAnimation(phase);

  // Left leg — natural contour with subtle muscle bulge
  const leftLeg = useAnimatedProps(() => {
    const t = tension.value;
    const qB = interpolate(t, [0, 1], [0, 6]);
    const cB = interpolate(t, [0, 1], [0, 4]);
    return {
      d: `M 58 26 C ${55 - qB * 0.4} 36, ${52 - qB * 0.6} 50, ${53 - qB * 0.5} 68 C ${54 - qB * 0.3} 78, ${55 - qB * 0.2} 84, 56 90 C ${54 - cB * 0.3} 96, ${52 - cB * 0.5} 106, ${52 - cB * 0.4} 118 C ${53 - cB * 0.2} 128, 54 136, 54 142 C 54 148, 53 152, 50 156 C 48 160, 46 162, 46 164 C 46 167, 48 168, 52 168 C 58 168, 64 168, 68 168 C 72 168, 74 167, 72 164 C 70 162, 70 158, 70 154 C 70 150, 70 144, 72 138 C ${74 + cB * 0.3} 128, ${76 + cB * 0.5} 118, ${78 + cB * 0.4} 106 C ${76 + cB * 0.3} 96, ${78 + qB * 0.2} 84, ${80 + qB * 0.3} 78 C ${82 + qB * 0.5} 68, ${84 + qB * 0.4} 50, 82 36 C 80 26, 78 26, 78 26 Z`,
    };
  });

  // Right leg — mirrored
  const rightLeg = useAnimatedProps(() => {
    const t = tension.value;
    const qB = interpolate(t, [0, 1], [0, 6]);
    const cB = interpolate(t, [0, 1], [0, 4]);
    return {
      d: `M 122 26 C ${125 + qB * 0.4} 36, ${128 + qB * 0.6} 50, ${127 + qB * 0.5} 68 C ${126 + qB * 0.3} 78, ${125 + qB * 0.2} 84, 124 90 C ${126 + cB * 0.3} 96, ${128 + cB * 0.5} 106, ${128 + cB * 0.4} 118 C ${127 + cB * 0.2} 128, 126 136, 126 142 C 126 148, 127 152, 130 156 C 132 160, 134 162, 134 164 C 134 167, 132 168, 128 168 C 122 168, 116 168, 112 168 C 108 168, 106 167, 108 164 C 110 162, 110 158, 110 154 C 110 150, 110 144, 108 138 C ${106 - cB * 0.3} 128, ${104 - cB * 0.5} 118, ${102 - cB * 0.4} 106 C ${104 - cB * 0.3} 96, ${102 - qB * 0.2} 84, ${100 - qB * 0.3} 78 C ${98 - qB * 0.5} 68, ${96 - qB * 0.4} 50, 98 36 C 100 26, 102 26, 102 26 Z`,
    };
  });

  // Quad glow
  const quadGlowL = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 0.5, 1], [0, 0.06, 0.22]),
    rx: interpolate(tension.value, [0, 1], [5, 12]),
    ry: interpolate(tension.value, [0, 1], [10, 18]),
  }));
  const quadGlowR = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 0.5, 1], [0, 0.06, 0.22]),
    rx: interpolate(tension.value, [0, 1], [5, 12]),
    ry: interpolate(tension.value, [0, 1], [10, 18]),
  }));

  // Kneecaps
  const knees = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 1], [0.1, 0.38]),
  }));

  // Muscle definition lines
  const calfLines = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0.15, 1], [0, 0.25]),
  }));

  const innerLines = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 1], [0.05, 0.16]),
  }));

  // Hip/pelvis
  const hip = useAnimatedProps(() => {
    const t = tension.value;
    return {
      d: `M 48 16 C 60 ${10 - t * 3}, 100 ${6 - t * 4}, 140 ${10 - t * 3} C 148 ${12 - t * 2}, 152 18, 152 24 C 152 28, 148 30, 144 30 C 130 32, 100 34, 70 32 C 60 30, 52 28, 48 24 C 48 18, 48 16, 48 16 Z`,
    };
  });

  // Ankle bone bumps
  const ankles = useAnimatedProps(() => ({
    opacity: interpolate(tension.value, [0, 1], [0.15, 0.3]),
  }));

  return (
    <Animated.View style={[containerStyle, { width: SIZE, height: SIZE }]}>
      <Svg width={SIZE} height={SIZE} viewBox="0 0 200 175">
        <Defs>
          <RadialGradient id="lg" cx="50%" cy="28%" rx="50%" ry="55%">
            <Stop offset="0%" stopColor={SKIN_LIGHT} />
            <Stop offset="45%" stopColor={SKIN_MID} />
            <Stop offset="100%" stopColor={SKIN_SHADOW} />
          </RadialGradient>
          <RadialGradient id="qglow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={MUSCLE_GLOW} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={MUSCLE_GLOW} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="hipG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={SKIN_LIGHT} />
            <Stop offset="60%" stopColor={SKIN_MID} />
            <Stop offset="100%" stopColor={SKIN_SHADOW} />
          </LinearGradient>
        </Defs>

        {/* Hip/pelvis */}
        <AnimatedPath animatedProps={hip} fill="url(#hipG)" stroke={SKIN_SHADOW} strokeWidth={0.6} strokeLinejoin="round" />

        {/* Hip bone hints */}
        <Ellipse cx={56} cy={20} rx={4} ry={3} fill={SKIN_SHADOW} opacity={0.1} />
        <Ellipse cx={144} cy={20} rx={4} ry={3} fill={SKIN_SHADOW} opacity={0.1} />

        {/* Left leg */}
        <AnimatedPath animatedProps={leftLeg} fill="url(#lg)" stroke={SKIN_SHADOW} strokeWidth={0.8} strokeLinejoin="round" />
        {/* Right leg */}
        <AnimatedPath animatedProps={rightLeg} fill="url(#lg)" stroke={SKIN_SHADOW} strokeWidth={0.8} strokeLinejoin="round" />

        {/* Leg highlights */}
        <Ellipse cx={68} cy={50} rx={5} ry={12} fill={SKIN_LIGHT} opacity={0.1} />
        <Ellipse cx={114} cy={50} rx={5} ry={12} fill={SKIN_LIGHT} opacity={0.1} />

        {/* Quad glow */}
        <AnimatedEllipse cx={68} cy={54} animatedProps={quadGlowL} fill="url(#qglow)" />
        <AnimatedEllipse cx={114} cy={54} animatedProps={quadGlowR} fill="url(#qglow)" />

        {/* Quad separation lines */}
        <AnimatedPath animatedProps={calfLines} d="M 68 32 C 66 46, 64 60, 64 78" stroke={SKIN_SHADOW} strokeWidth={0.35} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={calfLines} d="M 112 32 C 114 46, 116 60, 116 78" stroke={SKIN_SHADOW} strokeWidth={0.35} fill="none" strokeLinecap="round" />

        {/* Kneecaps */}
        <AnimatedEllipse cx={66} cy={92} rx={6} ry={4} fill={SKIN_SHADOW} animatedProps={knees} />
        <AnimatedEllipse cx={114} cy={92} rx={6} ry={4} fill={SKIN_SHADOW} animatedProps={knees} />

        {/* Calf definition */}
        <AnimatedPath animatedProps={calfLines} d="M 56 98 C 54 108, 54 120, 55 132" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={calfLines} d="M 124 98 C 126 108, 126 120, 125 132" stroke={SKIN_SHADOW} strokeWidth={0.4} fill="none" strokeLinecap="round" />

        {/* Inner thigh lines */}
        <AnimatedPath animatedProps={innerLines} d="M 76 30 C 78 46, 78 62, 76 82" stroke={SKIN_SHADOW} strokeWidth={0.35} fill="none" strokeLinecap="round" />
        <AnimatedPath animatedProps={innerLines} d="M 104 30 C 102 46, 102 62, 104 82" stroke={SKIN_SHADOW} strokeWidth={0.35} fill="none" strokeLinecap="round" />

        {/* Ankle bone bumps */}
        <AnimatedEllipse cx={52} cy={155} rx={2.5} ry={3} fill={SKIN_SHADOW} animatedProps={ankles} />
        <AnimatedEllipse cx={70} cy={155} rx={2.5} ry={3} fill={SKIN_SHADOW} animatedProps={ankles} />
        <AnimatedEllipse cx={110} cy={155} rx={2.5} ry={3} fill={SKIN_SHADOW} animatedProps={ankles} />
        <AnimatedEllipse cx={128} cy={155} rx={2.5} ry={3} fill={SKIN_SHADOW} animatedProps={ankles} />

        {/* Toe hints */}
        <Path d="M 52 166 Q 58 164, 66 166" stroke={SKIN_SHADOW} strokeWidth={0.3} fill="none" opacity={0.12} strokeLinecap="round" />
        <Path d="M 114 166 Q 120 164, 126 166" stroke={SKIN_SHADOW} strokeWidth={0.3} fill="none" opacity={0.12} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

// =============================================================================
// MASTER COMPONENT
// =============================================================================
export function AnatomicalIllustration({
  muscleName,
  phase,
  phaseColor,
}: {
  muscleName: string;
  phase: Phase;
  phaseColor: string;
}) {
  const ringScale1 = useSharedValue(0.85);
  const ringOpacity1 = useSharedValue(0);
  const ringScale2 = useSharedValue(0.85);
  const ringOpacity2 = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (phase === "tense") {
      glowOpacity.value = withTiming(0.16, { duration: 600 });
      ringScale1.value = 0.85;
      ringOpacity1.value = 0;
      ringScale1.value = withRepeat(
        withTiming(1.25, {
          duration: 2800,
          easing: Easing.out(Easing.quad),
        }),
        -1,
        false
      );
      ringOpacity1.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 200 }),
          withTiming(0, {
            duration: 2600,
            easing: Easing.in(Easing.quad),
          })
        ),
        -1,
        false
      );
      ringScale2.value = 0.85;
      ringOpacity2.value = 0;
      ringScale2.value = withDelay(
        1000,
        withRepeat(
          withTiming(1.25, {
            duration: 2800,
            easing: Easing.out(Easing.quad),
          }),
          -1,
          false
        )
      );
      ringOpacity2.value = withDelay(
        1000,
        withRepeat(
          withSequence(
            withTiming(0.15, { duration: 200 }),
            withTiming(0, {
              duration: 2600,
              easing: Easing.in(Easing.quad),
            })
          ),
          -1,
          false
        )
      );
    } else if (phase === "relax") {
      glowOpacity.value = withTiming(0.05, { duration: 1500 });
      ringOpacity1.value = withTiming(0, { duration: 800 });
      ringOpacity2.value = withTiming(0, { duration: 800 });
    } else {
      glowOpacity.value = withTiming(0, { duration: 400 });
      ringOpacity1.value = withTiming(0, { duration: 300 });
      ringOpacity2.value = withTiming(0, { duration: 300 });
    }
  }, [phase]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale1.value }],
    opacity: ringOpacity1.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale2.value }],
    opacity: ringOpacity2.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const getIllustration = () => {
    switch (muscleName) {
      case "Hands":
        return <HandIllustration phase={phase} />;
      case "Arms":
        return <ArmIllustration phase={phase} />;
      case "Shoulders":
        return <ShoulderIllustration phase={phase} />;
      case "Face":
        return <FaceIllustration phase={phase} />;
      case "Chest":
        return <ChestIllustration phase={phase} />;
      case "Legs":
        return <LegIllustration phase={phase} />;
      default:
        return <HandIllustration phase={phase} />;
    }
  };

  return (
    <View
      style={{
        width: 260,
        height: 260,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[
          ring1Style,
          {
            position: "absolute",
            width: 240,
            height: 240,
            borderRadius: 120,
            borderWidth: 2,
            borderColor: phaseColor,
          },
        ]}
      />
      <Animated.View
        style={[
          ring2Style,
          {
            position: "absolute",
            width: 240,
            height: 240,
            borderRadius: 120,
            borderWidth: 1.5,
            borderColor: phaseColor,
          },
        ]}
      />
      <Animated.View
        style={[
          glowStyle,
          {
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: phaseColor,
          },
        ]}
      />
      <View
        style={{
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: phaseColor + "10",
          borderWidth: 1.5,
          borderColor: phaseColor + "20",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {getIllustration()}
      </View>
    </View>
  );
}
