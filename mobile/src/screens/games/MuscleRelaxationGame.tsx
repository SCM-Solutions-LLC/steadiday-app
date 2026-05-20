import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Circle as SvgCircle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useFrameCallback,
  SharedValue,
} from "react-native-reanimated";

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// =============================================================================
// TYPES
// =============================================================================
interface MuscleRelaxationGameProps {
  onComplete: () => void;
  onClose: () => void;
  colors: any;
  textClasses: any;
  triggerHaptic: () => void;
  primary: string;
  isDark: boolean;
  onNextGame?: () => void;
}

interface MuscleGroup {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
  instruction: string;
  relaxText: string;
  tenseDuration: number;
  relaxDuration: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const ACCENT_COLOR = "#8B5CF6";
const PREP_DURATION = 5;

const MUSCLE_GROUPS: MuscleGroup[] = [
  { name: "Hands", icon: "hand-left-outline", emoji: "\u270B", instruction: "Make tight fists with both hands. Squeeze as hard as you can.", relaxText: "Open your hands slowly. Feel the tension melt away.", tenseDuration: 5, relaxDuration: 10 },
  { name: "Arms", icon: "fitness-outline", emoji: "\uD83D\uDCAA", instruction: "Bend your elbows and flex your biceps. Hold them tight.", relaxText: "Let your arms drop gently. Feel them become heavy and loose.", tenseDuration: 5, relaxDuration: 10 },
  { name: "Shoulders", icon: "body-outline", emoji: "\uD83E\uDDD8", instruction: "Raise your shoulders up toward your ears. Hold them there.", relaxText: "Let your shoulders drop down. Feel the weight release.", tenseDuration: 5, relaxDuration: 10 },
  { name: "Face", icon: "happy-outline", emoji: "\uD83D\uDE42", instruction: "Scrunch your face tightly. Squeeze your eyes, nose, and mouth together.", relaxText: "Soften your face completely. Smooth out every muscle.", tenseDuration: 5, relaxDuration: 10 },
  { name: "Chest", icon: "heart-outline", emoji: "\uD83E\uDEC1", instruction: "Take a deep breath and hold it. Feel your chest expand.", relaxText: "Exhale slowly and fully. Let your chest soften.", tenseDuration: 5, relaxDuration: 10 },
  { name: "Legs", icon: "walk-outline", emoji: "\uD83E\uDDB5", instruction: "Straighten your legs and point your toes toward your face.", relaxText: "Release your legs slowly. Let them feel heavy and warm.", tenseDuration: 5, relaxDuration: 10 },
  { name: "Feet", icon: "footsteps-outline", emoji: "\uD83E\uDDB6", instruction: "Curl your toes downward as tightly as you can. Hold.", relaxText: "Release your toes. Feel them spread and relax.", tenseDuration: 5, relaxDuration: 10 },
];

// =============================================================================
// BODY ZONES SVG
// =============================================================================
const BODY_ZONES: Record<string, string> = {
  head: "M 100 10 C 82 10, 72 22, 72 38 C 72 50, 78 58, 84 62 C 89 64, 94 66, 100 66 C 106 66, 111 64, 116 62 C 122 58, 128 50, 128 38 C 128 22, 118 10, 100 10 Z",
  neck: "M 90 60 L 90 76 C 90 79, 94 81, 100 81 C 106 81, 110 79, 110 76 L 110 60 Z",
  shoulders: "M 90 78 C 78 78, 64 80, 54 86 C 48 89, 46 94, 50 96 L 70 92 L 90 88 L 110 88 L 130 92 L 150 96 C 154 94, 152 89, 146 86 C 136 80, 122 78, 110 78 Z",
  torso: "M 66 90 C 60 94, 57 100, 56 110 C 55 120, 57 132, 62 142 C 64 154, 67 168, 70 180 C 74 188, 86 192, 100 192 C 114 192, 126 188, 130 180 C 133 168, 136 154, 138 142 C 143 132, 145 120, 144 110 C 143 100, 140 94, 134 90 C 124 88, 112 86, 100 86 C 88 86, 76 88, 66 90 Z",
  leftUpperArm: "M 54 94 C 49 102, 45 116, 43 130 C 42 142, 43 152, 46 160 L 60 158 C 60 150, 60 140, 62 128 C 64 114, 68 102, 71 96 Z",
  rightUpperArm: "M 146 94 C 151 102, 155 116, 157 130 C 158 142, 157 152, 154 160 L 140 158 C 140 150, 140 140, 138 128 C 136 114, 132 102, 129 96 Z",
  leftForearm: "M 46 160 C 44 172, 40 188, 38 204 C 37 216, 37 226, 39 232 L 54 232 C 54 226, 54 216, 56 204 C 57 190, 59 174, 60 158 Z",
  rightForearm: "M 154 160 C 156 172, 160 188, 162 204 C 163 216, 163 226, 161 232 L 146 232 C 146 226, 146 216, 144 204 C 143 190, 141 174, 140 158 Z",
  leftHand: "M 39 232 C 35 236, 31 242, 29 248 C 27 254, 31 260, 37 260 C 42 260, 47 258, 50 254 C 54 248, 54 240, 54 232 Z",
  rightHand: "M 161 232 C 165 236, 169 242, 171 248 C 173 254, 169 260, 163 260 C 158 260, 153 258, 150 254 C 146 248, 146 240, 146 232 Z",
  leftThigh: "M 72 190 C 70 204, 66 224, 64 244 C 62 260, 62 272, 65 282 L 85 282 C 85 272, 86 260, 88 248 C 90 232, 94 214, 96 200 C 92 194, 84 190, 78 190 Z",
  rightThigh: "M 128 190 C 130 204, 134 224, 136 244 C 138 260, 138 272, 135 282 L 115 282 C 115 272, 114 260, 112 248 C 110 232, 106 214, 104 200 C 108 194, 116 190, 122 190 Z",
  leftCalf: "M 65 282 C 63 298, 61 318, 61 336 C 61 352, 61 366, 64 376 L 80 376 C 82 366, 82 352, 82 338 C 82 320, 84 300, 85 284 Z",
  rightCalf: "M 135 282 C 137 298, 139 318, 139 336 C 139 352, 139 366, 136 376 L 120 376 C 118 366, 118 352, 118 338 C 118 320, 116 300, 115 284 Z",
  leftFoot: "M 64 376 C 60 380, 54 384, 50 386 C 46 388, 46 392, 52 394 L 80 394 C 84 394, 84 390, 82 388 C 80 384, 80 380, 80 376 Z",
  rightFoot: "M 136 376 C 140 380, 146 384, 150 386 C 154 388, 154 392, 148 394 L 120 394 C 116 394, 116 390, 118 388 C 120 384, 120 380, 120 376 Z",
};

// Groups that remain "complete" (green) after passing through each muscle group.
const ZONE_MAP: Record<string, string[]> = {
  Hands: ["leftHand", "rightHand"],
  Arms: ["leftUpperArm", "rightUpperArm", "leftForearm", "rightForearm"],
  Shoulders: ["shoulders", "neck"],
  Face: ["head"],
  Chest: ["torso"],
  Legs: ["leftThigh", "rightThigh", "leftCalf", "rightCalf"],
  Feet: ["leftFoot", "rightFoot"],
};

// =============================================================================
// BODY OUTLINE COMPONENT (animated silhouette)
// =============================================================================
interface BodyAnims {
  handsTension: SharedValue<number>;
  armsTension: SharedValue<number>;
  shouldersTension: SharedValue<number>;
  faceTension: SharedValue<number>;
  chestTension: SharedValue<number>;
  legsTension: SharedValue<number>;
  feetTension: SharedValue<number>;
  breathing: SharedValue<number>;
}

// Container & viewBox constants — shared by every nested Animated.View layer.
// Each layer spans the full container and renders its own Svg with the SAME
// viewBox, so body parts stay at exact coordinates across layers.
const CONTAINER_W = 220;
const CONTAINER_H = 280;
const VIEW_BOX = "15 0 170 400";
// SVG coord (x, y) → View coord: ((x - 15) * 0.7 + 50.5, y * 0.7)
// scale = min(220/170, 280/400) = 0.7 (height-fit). Horizontal pad = (220-119)/2 = 50.5.
const PIVOT = {
  leftWrist: "72px 162px",
  rightWrist: "148px 162px",
  leftElbow: "72px 112px",
  rightElbow: "148px 112px",
  leftAnkle: "86px 263px",
  rightAnkle: "134px 263px",
  head: "110px 27px",
  chestCenter: "110px 77px",
  hips: "110px 140px",
} as const;

const LAYER: any = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

function BodyOutline({
  activeGroup,
  completedGroups,
  phase,
  anims,
}: {
  activeGroup: string | null;
  completedGroups: string[];
  phase: "prep" | "tense" | "relax" | "transition" | "complete";
  anims?: BodyAnims;
}) {
  const activeZones = activeGroup ? (ZONE_MAP[activeGroup] || []) : [];
  const completedZones = completedGroups.flatMap((g) => ZONE_MAP[g] || []);

  const SKIN_BASE = "#E8DFD5";
  const SKIN_SHADE = "#C9BEB0";
  const COMPLETED_TINT = "#A7F3D0";

  const activeColor = (() => {
    if (phase === "tense") return "#EF4444";
    if (phase === "relax") return "#10B981";
    if (phase === "prep") return "#F59E0B";
    return null;
  })();

  const fillFor = (zone: string) => {
    if (completedZones.includes(zone) && !activeZones.includes(zone)) return COMPLETED_TINT;
    return SKIN_BASE;
  };

  const strokeFor = (zone: string) => {
    if (completedZones.includes(zone) && !activeZones.includes(zone)) return "#6EE7B7";
    return SKIN_SHADE;
  };

  const highlightFill = activeColor ? activeColor + "55" : "transparent";
  const highlightStroke = activeColor || "transparent";

  const renderZone = (zone: string) => (
    <Path
      key={zone}
      d={BODY_ZONES[zone]}
      fill={fillFor(zone)}
      stroke={strokeFor(zone)}
      strokeWidth={0.4}
    />
  );

  const renderHighlight = (zone: string) => {
    if (!activeZones.includes(zone) || !activeColor) return null;
    return (
      <Path
        key={zone + "-hl"}
        d={BODY_ZONES[zone]}
        fill={highlightFill}
        stroke={highlightStroke}
        strokeWidth={1.2}
      />
    );
  };

  // ---------------------------------------------------------------------------
  // Skeletal animation — nested Animated.Views with transformOrigin at each
  // joint. Per-muscle tensions drive rotate/scale/translate transforms.
  // ---------------------------------------------------------------------------
  const upperBodyStyle = useAnimatedStyle(() => {
    const shoulder = anims?.shouldersTension.value ?? 0;
    const chest = anims?.chestTension.value ?? 0;
    const breath = anims?.breathing.value ?? 0;
    return {
      transform: [{ translateY: -11 * shoulder - 3 * chest - 1.2 * breath }],
    };
  });

  const torsoStyle = useAnimatedStyle(() => {
    const chest = anims?.chestTension.value ?? 0;
    const breath = anims?.breathing.value ?? 0;
    return {
      transform: [
        { scaleX: 1 + 0.055 * chest + 0.008 * breath },
        { scaleY: 1 + 0.07 * chest + 0.012 * breath },
      ],
    };
  });

  const faceStyle = useAnimatedStyle(() => {
    const face = anims?.faceTension.value ?? 0;
    return {
      transform: [
        { translateY: 2 * face },
        { scaleX: 1 - 0.1 * face },
        { scaleY: 1 - 0.08 * face },
      ],
    };
  });

  const leftForearmStyle = useAnimatedStyle(() => {
    const arm = anims?.armsTension.value ?? 0;
    return {
      transform: [{ rotate: (-105 * arm) + "deg" }],
    };
  });

  const rightForearmStyle = useAnimatedStyle(() => {
    const arm = anims?.armsTension.value ?? 0;
    return {
      transform: [{ rotate: (105 * arm) + "deg" }],
    };
  });

  const leftHandStyle = useAnimatedStyle(() => {
    const hand = anims?.handsTension.value ?? 0;
    return {
      transform: [
        { rotate: (-18 * hand) + "deg" },
        { scale: 1 - 0.18 * hand },
      ],
    };
  });

  const rightHandStyle = useAnimatedStyle(() => {
    const hand = anims?.handsTension.value ?? 0;
    return {
      transform: [
        { rotate: (18 * hand) + "deg" },
        { scale: 1 - 0.18 * hand },
      ],
    };
  });

  const leftFootStyle = useAnimatedStyle(() => {
    const leg = anims?.legsTension.value ?? 0;
    const feet = anims?.feetTension.value ?? 0;
    return {
      transform: [
        { rotate: (-32 * leg + 22 * feet) + "deg" },
        { scale: 1 - 0.16 * feet },
      ],
    };
  });

  const rightFootStyle = useAnimatedStyle(() => {
    const leg = anims?.legsTension.value ?? 0;
    const feet = anims?.feetTension.value ?? 0;
    return {
      transform: [
        { rotate: (32 * leg - 22 * feet) + "deg" },
        { scale: 1 - 0.16 * feet },
      ],
    };
  });

  const legsStyle = useAnimatedStyle(() => {
    const leg = anims?.legsTension.value ?? 0;
    return {
      transform: [{ scaleY: 1 + 0.025 * leg }],
    };
  });

  // Face features: eye close + mouth morph (these SVG animated props DO work)
  const leftEyeProps = useAnimatedProps(() => {
    const t = anims?.faceTension.value ?? 0;
    return { opacity: 1 - 0.7 * t } as any;
  });
  const rightEyeProps = useAnimatedProps(() => {
    const t = anims?.faceTension.value ?? 0;
    return { opacity: 1 - 0.7 * t } as any;
  });
  const mouthProps = useAnimatedProps(() => {
    const t = anims?.faceTension.value ?? 0;
    const curve = 49 - 5 * t;
    return { d: "M 94 46 Q 100 " + curve + " 106 46" } as any;
  });

  // Helper: render a sub-Svg containing only the given zone paths.
  const subSvg = (zones: string[], extra?: React.ReactNode) => (
    <Svg
      viewBox={VIEW_BOX}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
    >
      {zones.map((z) => (
        <React.Fragment key={z}>
          {renderZone(z)}
          {renderHighlight(z)}
        </React.Fragment>
      ))}
      {extra}
    </Svg>
  );

  return (
    <View
      style={{
        width: CONTAINER_W,
        height: CONTAINER_H,
        position: "relative",
      }}
    >
      {/* Legs base (thighs + calves) — slight stretch for Legs tension */}
      <Animated.View style={[LAYER, legsStyle, { transformOrigin: PIVOT.hips }]}>
        {subSvg(["leftThigh", "rightThigh", "leftCalf", "rightCalf"])}
      </Animated.View>

      {/* Feet — hinge at each ankle for Legs (toes up) / Feet (toe curl) */}
      <Animated.View style={[LAYER, leftFootStyle, { transformOrigin: PIVOT.leftAnkle }]}>
        {subSvg(["leftFoot"])}
      </Animated.View>
      <Animated.View style={[LAYER, rightFootStyle, { transformOrigin: PIVOT.rightAnkle }]}>
        {subSvg(["rightFoot"])}
      </Animated.View>

      {/* Torso — scales at chest center (breath + Chest tension) */}
      <Animated.View style={[LAYER, torsoStyle, { transformOrigin: PIVOT.chestCenter }]}>
        <Svg viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bodyShade" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#D4C9BA" stopOpacity="0.35" />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="1" stopColor="#D4C9BA" stopOpacity="0.35" />
            </LinearGradient>
          </Defs>
          {renderZone("torso")}
          <Path d={BODY_ZONES.torso} fill="url(#bodyShade)" />
          <Path
            d="M 100 96 L 100 160"
            fill="none"
            stroke={SKIN_SHADE}
            strokeWidth={0.4}
            opacity={0.35}
          />
          {renderHighlight("torso")}
        </Svg>
      </Animated.View>

      {/* Upper body — translates up for Shoulders tension. Contains shoulders,
          neck, upper arms, and nested forearms, hands, and face. */}
      <Animated.View style={[LAYER, upperBodyStyle]}>
        {/* Static parts of upper body (shoulders, neck, upper arms) */}
        {subSvg(["shoulders", "neck", "leftUpperArm", "rightUpperArm"])}

        {/* Left forearm hinges at left elbow */}
        <Animated.View style={[LAYER, leftForearmStyle, { transformOrigin: PIVOT.leftElbow }]}>
          {subSvg(["leftForearm"])}
          {/* Left hand nested inside forearm, hinges at wrist */}
          <Animated.View style={[LAYER, leftHandStyle, { transformOrigin: PIVOT.leftWrist }]}>
            {subSvg(["leftHand"])}
          </Animated.View>
        </Animated.View>

        {/* Right forearm + right hand (mirror) */}
        <Animated.View style={[LAYER, rightForearmStyle, { transformOrigin: PIVOT.rightElbow }]}>
          {subSvg(["rightForearm"])}
          <Animated.View style={[LAYER, rightHandStyle, { transformOrigin: PIVOT.rightWrist }]}>
            {subSvg(["rightHand"])}
          </Animated.View>
        </Animated.View>

        {/* Head + face (scales at head for Face tension) */}
        <Animated.View style={[LAYER, faceStyle, { transformOrigin: PIVOT.head }]}>
          <Svg viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
            {renderZone("head")}
            <AnimatedSvgCircle cx={92} cy={36} r={2.2} fill="#4B3F36" animatedProps={leftEyeProps} />
            <AnimatedSvgCircle cx={108} cy={36} r={2.2} fill="#4B3F36" animatedProps={rightEyeProps} />
            <Path d="M 87 31 Q 92 29 97 31" fill="none" stroke="#4B3F36" strokeWidth={0.9} opacity={0.7} />
            <Path d="M 103 31 Q 108 29 113 31" fill="none" stroke="#4B3F36" strokeWidth={0.9} opacity={0.7} />
            <AnimatedPath animatedProps={mouthProps} fill="none" stroke="#4B3F36" strokeWidth={1} opacity={0.75} />
            <Path d="M 76 50 Q 82 58 88 60" fill="none" stroke={SKIN_SHADE} strokeWidth={0.4} opacity={0.5} />
            <Path d="M 124 50 Q 118 58 112 60" fill="none" stroke={SKIN_SHADE} strokeWidth={0.4} opacity={0.5} />
            {renderHighlight("head")}
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// BREATHING CIRCLE COMPONENT
// =============================================================================
const PHASE_FILL: Record<string, string> = {
  prep: "rgba(245, 158, 11, 0.2)",
  tense: "rgba(239, 68, 68, 0.25)",
  relax: "rgba(16, 185, 129, 0.2)",
  transition: "rgba(139, 92, 246, 0.15)",
  complete: "rgba(16, 185, 129, 0.2)",
  intro: "rgba(245, 158, 11, 0.2)",
};
const PHASE_STROKE: Record<string, string> = {
  prep: "#F59E0B",
  tense: "#EF4444",
  relax: "#10B981",
  transition: "#8B5CF6",
  complete: "#10B981",
  intro: "#F59E0B",
};

function BreathingCircle({
  phase,
  emoji,
}: {
  phase: "prep" | "tense" | "relax" | "transition" | "complete" | "intro";
  emoji: string;
}) {
  const scale = useSharedValue(0.85);
  const fillColor = useSharedValue(PHASE_FILL.prep);
  const strokeColor = useSharedValue(PHASE_STROKE.prep);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.0, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [scale]);

  useEffect(() => {
    const fill = PHASE_FILL[phase] ?? PHASE_FILL.prep;
    const stroke = PHASE_STROKE[phase] ?? PHASE_STROKE.prep;
    fillColor.value = withTiming(fill, { duration: 600 });
    strokeColor.value = withTiming(stroke, { duration: 600 });
  }, [phase, fillColor, strokeColor]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: fillColor.value,
    borderColor: strokeColor.value,
  }));

  return (
    <View
      style={{
        width: 220,
        height: 220,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[
          {
            width: 220,
            height: 220,
            borderRadius: 110,
            borderWidth: 2,
            alignItems: "center",
            justifyContent: "center",
          },
          circleStyle,
        ]}
      >
        <Text style={{ fontSize: 72 }}>{emoji}</Text>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// COUNTDOWN CIRCLE COMPONENT
// =============================================================================
function CountdownCircle({
  totalDuration,
  countdown,
  color,
  phaseKey,
}: {
  totalDuration: number;
  countdown: number;
  color: string;
  phaseKey: string;
}) {
  const size = 120;
  const strokeWidth = 6;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);
  const phaseStart = useSharedValue(Date.now());
  const currentPhaseKey = useRef(phaseKey);

  useEffect(() => {
    if (currentPhaseKey.current !== phaseKey) {
      currentPhaseKey.current = phaseKey;
      phaseStart.value = Date.now();
      progress.value = 0;
    }
  }, [phaseKey]);

  useFrameCallback(() => {
    const elapsed = (Date.now() - phaseStart.value) / 1000;
    const p = Math.min(elapsed / totalDuration, 1);
    progress.value = p;
  });

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E7E5E4"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedSvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 42, fontWeight: "900", color, fontVariant: ["tabular-nums"] }}>{countdown}</Text>
      </View>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const MuscleRelaxationGame: React.FC<MuscleRelaxationGameProps> = ({
  onComplete,
  onClose,
  colors,
  isDark,
  triggerHaptic,
}) => {
  const insets = useSafeAreaInsets();

  const [started, setStarted] = useState(false);
  const [showPreExercise, setShowPreExercise] = useState(false);
  const [pendingGroups, setPendingGroups] = useState<MuscleGroup[] | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<MuscleGroup[]>(MUSCLE_GROUPS);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [phase, setPhase] = useState<"intro" | "prep" | "tense" | "relax" | "transition" | "complete">("intro");
  const [countdown, setCountdown] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [round, setRound] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompleted = useRef(false);
  const [phaseKey, setPhaseKey] = useState("init");

  // Animations
  const progressWidth = useSharedValue(0);

  // Per-muscle tension shared values (0 = relaxed, 1 = fully tensed)
  const handsTension = useSharedValue(0);
  const armsTension = useSharedValue(0);
  const shouldersTension = useSharedValue(0);
  const faceTension = useSharedValue(0);
  const chestTension = useSharedValue(0);
  const legsTension = useSharedValue(0);
  const feetTension = useSharedValue(0);
  const breathing = useSharedValue(0);

  const bodyAnims = useMemo<BodyAnims>(
    () => ({
      handsTension,
      armsTension,
      shouldersTension,
      faceTension,
      chestTension,
      legsTension,
      feetTension,
      breathing,
    }),
    // Shared values are stable refs — safe empty deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const currentGroup = selectedGroups[currentGroupIndex];
  const totalGroups = selectedGroups.length;

  // Completed groups (all groups before current)
  const completedGroupNames = selectedGroups.slice(0, currentGroupIndex).map((g) => g.name);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const progress = (currentGroupIndex / totalGroups) * 100;
    progressWidth.value = withTiming(progress, { duration: 500 });
  }, [currentGroupIndex, totalGroups]);

  // Start subtle idle breathing loop once
  useEffect(() => {
    breathing.value = withRepeat(
      withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathing]);

  // Drive the correct per-muscle tension shared value based on phase
  useEffect(() => {
    const target: Record<string, SharedValue<number>> = {
      Hands: handsTension,
      Arms: armsTension,
      Shoulders: shouldersTension,
      Face: faceTension,
      Chest: chestTension,
      Legs: legsTension,
      Feet: feetTension,
    };
    const sv = currentGroup ? target[currentGroup.name] : undefined;
    if (!sv) return;

    if (phase === "tense") {
      sv.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });
    } else {
      // relax / prep / transition / complete -> return to 0
      sv.value = withTiming(0, { duration: 1200, easing: Easing.out(Easing.quad) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentGroup?.name]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPhase = useCallback((
    phaseName: "prep" | "tense" | "relax",
    duration: number,
    onDone: () => void,
  ) => {
    clearTimer();
    setPhase(phaseName);
    setCountdown(duration);
    setPhaseKey(`${phaseName}-${currentGroupIndex}-${Date.now()}`);
    triggerHaptic();

    let remaining = duration;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearTimer();
        onDone();
      }
    }, 1000);
  }, [clearTimer, triggerHaptic, currentGroupIndex]);

  const runGroupSequence = useCallback((groupIndex: number, groups: MuscleGroup[]) => {
    const group = groups[groupIndex];
    const groupCount = groups.length;

    // Prep phase
    clearTimer();
    setPhase("prep");
    setCountdown(PREP_DURATION);
    setPhaseKey(`prep-${groupIndex}-${Date.now()}`);

    let prepRemaining = PREP_DURATION;
    timerRef.current = setInterval(() => {
      prepRemaining -= 1;
      setCountdown(prepRemaining);
      if (prepRemaining <= 0) {
        clearTimer();
        triggerHaptic();

        // Tense phase
        setPhase("tense");
        setCountdown(group.tenseDuration);
        setPhaseKey(`tense-${groupIndex}-${Date.now()}`);

        let tenseRemaining = group.tenseDuration;
        timerRef.current = setInterval(() => {
          tenseRemaining -= 1;
          setCountdown(tenseRemaining);
          if (tenseRemaining <= 0) {
            clearTimer();
            triggerHaptic();

            // Relax phase
            setPhase("relax");
            setCountdown(group.relaxDuration);
            setPhaseKey(`relax-${groupIndex}-${Date.now()}`);

            let relaxRemaining = group.relaxDuration;
            timerRef.current = setInterval(() => {
              relaxRemaining -= 1;
              setCountdown(relaxRemaining);
              if (relaxRemaining <= 0) {
                clearTimer();
                triggerHaptic();

                if (groupIndex < groupCount - 1) {
                  // Transition to next group
                  setPhase("transition");
                  setTimeout(() => {
                    setCurrentGroupIndex(groupIndex + 1);
                    runGroupSequence(groupIndex + 1, groups);
                  }, 1500);
                } else {
                  // All done
                  setPhase("complete");
                  setCompleted(true);
                  if (!hasCompleted.current) {
                    hasCompleted.current = true;
                    setTimeout(() => onComplete(), 2000);
                  }
                }
              }
            }, 1000);
          }
        }, 1000);
      }
    }, 1000);
  }, [clearTimer, triggerHaptic, onComplete]);

  const startExercise = useCallback((groups?: MuscleGroup[]) => {
    const activeGroups = groups || selectedGroups;
    setPendingGroups(activeGroups);
    setShowPreExercise(true);
  }, [selectedGroups]);

  const beginAfterIntro = useCallback(() => {
    const activeGroups = pendingGroups || selectedGroups;
    setSelectedGroups(activeGroups);
    setShowPreExercise(false);
    setStarted(true);
    setCurrentGroupIndex(0);
    setCompleted(false);
    hasCompleted.current = false;
    runGroupSequence(0, activeGroups);
  }, [pendingGroups, selectedGroups, runGroupSequence]);

  const handleAnotherRound = useCallback(() => {
    setRound((r) => r + 1);
    setCompleted(false);
    setCurrentGroupIndex(0);
    hasCompleted.current = false;
    runGroupSequence(0, selectedGroups);
  }, [selectedGroups, runGroupSequence]);

  const handleRepeatLast = useCallback(() => {
    const lastGroup = selectedGroups[selectedGroups.length - 1];
    setCompleted(false);
    setCurrentGroupIndex(selectedGroups.length - 1);
    hasCompleted.current = false;

    // Run just the last group
    clearTimer();
    setPhase("prep");
    setCountdown(PREP_DURATION);
    setPhaseKey(`prep-repeat-${Date.now()}`);

    let prepRemaining = PREP_DURATION;
    timerRef.current = setInterval(() => {
      prepRemaining -= 1;
      setCountdown(prepRemaining);
      if (prepRemaining <= 0) {
        clearTimer();
        triggerHaptic();

        setPhase("tense");
        setCountdown(lastGroup.tenseDuration);
        setPhaseKey(`tense-repeat-${Date.now()}`);

        let tenseRemaining = lastGroup.tenseDuration;
        timerRef.current = setInterval(() => {
          tenseRemaining -= 1;
          setCountdown(tenseRemaining);
          if (tenseRemaining <= 0) {
            clearTimer();
            triggerHaptic();

            setPhase("relax");
            setCountdown(lastGroup.relaxDuration);
            setPhaseKey(`relax-repeat-${Date.now()}`);

            let relaxRemaining = lastGroup.relaxDuration;
            timerRef.current = setInterval(() => {
              relaxRemaining -= 1;
              setCountdown(relaxRemaining);
              if (relaxRemaining <= 0) {
                clearTimer();
                triggerHaptic();
                setPhase("complete");
                setCompleted(true);
              }
            }, 1000);
          }
        }, 1000);
      }
    }, 1000);
  }, [selectedGroups, clearTimer, triggerHaptic]);

  const progressAnimStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` }));

  const getPhaseColor = () => {
    if (phase === "tense") return "#EF4444";
    if (phase === "relax") return "#10B981";
    if (phase === "prep") return "#D97706";
    if (phase === "transition") return ACCENT_COLOR;
    return "#10B981";
  };

  const getPhaseLabel = () => {
    if (phase === "tense") return "Tense";
    if (phase === "relax") return "Relax";
    if (phase === "prep") return "Get Ready";
    if (phase === "transition") return "Great job!";
    return "";
  };

  const getInstructionText = () => {
    if (phase === "tense") return currentGroup?.instruction || "";
    if (phase === "relax") return currentGroup?.relaxText || "";
    if (phase === "transition") return "Get ready for the next muscle group...";
    return "";
  };

  // ==========================================================================
  // PRE-EXERCISE SCREEN ("Before we begin")
  // ==========================================================================
  if (showPreExercise) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? colors.background : "#F5F0EB", paddingTop: insets.top }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
          <Pressable onPress={onClose} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? colors.surfaceSubtle : "#E8E2D9", alignItems: "center", justifyContent: "center" }} accessibilityLabel="Close" accessibilityRole="button">
            <Ionicons name="close" size={26} color={isDark ? "#FFFFFF" : "#333333"} />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={ZoomIn.duration(600).springify()} style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{ width: 130, height: 130, borderRadius: 65, backgroundColor: ACCENT_COLOR + "12", alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: ACCENT_COLOR + "18", alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: ACCENT_COLOR + "22", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="leaf-outline" size={36} color={ACCENT_COLOR} />
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: isDark ? "#FFFFFF" : "#1C1917", textAlign: "center", marginBottom: 24 }}>
              Before we begin
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).duration(500)} style={{ width: "100%" }}>
            <View style={{ backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF", borderRadius: 20, padding: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: ACCENT_COLOR + "15", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                  <Ionicons name="body-outline" size={22} color={ACCENT_COLOR} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "500", color: isDark ? "#D4D4D4" : "#57534E", flex: 1, lineHeight: 22 }}>Find a comfortable position</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: ACCENT_COLOR + "15", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                  <Ionicons name="phone-portrait-outline" size={22} color={ACCENT_COLOR} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "500", color: isDark ? "#D4D4D4" : "#57534E", flex: 1, lineHeight: 22 }}>Set your phone where you can see it</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: ACCENT_COLOR + "15", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                  <Ionicons name="hand-left-outline" size={22} color={ACCENT_COLOR} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "500", color: isDark ? "#D4D4D4" : "#57534E", flex: 1, lineHeight: 22 }}>You will need both hands free</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(500).duration(500)}>
            <Text style={{ fontSize: 15, fontWeight: "500", color: isDark ? "#999999" : "#A8A29E", textAlign: "center", marginTop: 20, fontStyle: "italic" }}>
              Take your time and breathe naturally
            </Text>
          </Animated.View>
        </ScrollView>

        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 32 }}>
          <Pressable
            onPress={beginAfterIntro}
            accessibilityLabel="I'm Ready"
            accessibilityRole="button"
          >
            <View style={{
              backgroundColor: ACCENT_COLOR,
              borderRadius: 16,
              height: 58,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              shadowColor: ACCENT_COLOR,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 6,
            }}>
              <Text style={{ fontSize: 19, fontWeight: "700", color: "#FFFFFF" }}>{"I'm Ready"}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ==========================================================================
  // INTRO SCREEN
  // ==========================================================================
  if (!started) {
    const fullDuration = MUSCLE_GROUPS.reduce((sum, g) => sum + g.tenseDuration + g.relaxDuration + PREP_DURATION, 0);
    const fullMinutes = Math.ceil(fullDuration / 60);

    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-row items-center px-4 py-3">
          <Pressable onPress={onClose} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? colors.surfaceSubtle : "#F0EDE4", alignItems: "center", justifyContent: "center" }} accessibilityLabel="Close" accessibilityRole="button">
            <Ionicons name="close" size={26} color={isDark ? "#FFFFFF" : "#333333"} />
          </Pressable>
        </View>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={ZoomIn.duration(500).springify()} className="items-center mt-8 mb-6">
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: ACCENT_COLOR + "20", alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: ACCENT_COLOR + "30", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="body-outline" size={48} color={ACCENT_COLOR} />
              </View>
            </View>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.textPrimary, textAlign: "center", marginBottom: 8 }}>Muscle Relaxation</Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: "center", marginBottom: 28, lineHeight: 24, paddingHorizontal: 16 }}>{"Tense and release muscle groups to deeply relax your body."}</Text>
          </Animated.View>

          {/* Full Body Card */}
          <Animated.View entering={FadeInDown.delay(250).duration(500).springify()}>
            <Pressable onPress={() => startExercise(MUSCLE_GROUPS)} accessibilityRole="button" accessibilityLabel={"Full body relaxation, about " + fullMinutes + " minutes"}>
              {({ pressed }) => (
                <View style={{ backgroundColor: ACCENT_COLOR + (isDark ? "20" : "10"), borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1.5, borderColor: ACCENT_COLOR + "35", transform: [{ scale: pressed ? 0.97 : 1 }] }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: ACCENT_COLOR + "25", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                      <Ionicons name="body-outline" size={28} color={ACCENT_COLOR} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.3 }}>Full Body</Text>
                      <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>{"All 7 muscle groups sequentially"}</Text>
                    </View>
                    <View style={{ backgroundColor: ACCENT_COLOR, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>Start</Text>
                      <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {MUSCLE_GROUPS.map((group) => (
                      <View key={group.name} style={{ flexDirection: "row", alignItems: "center", backgroundColor: ACCENT_COLOR + "15", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 14, marginRight: 4 }}>{group.emoji}</Text>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: ACCENT_COLOR }}>{group.name}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: ACCENT_COLOR + "15" }}>
                    <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 4 }}>~{fullMinutes} min</Text>
                    <View style={{ width: 1, height: 12, backgroundColor: colors.textSecondary + "30", marginHorizontal: 10 }} />
                    <Ionicons name="repeat-outline" size={15} color={colors.textSecondary} />
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 4 }}>{MUSCLE_GROUPS.length} groups</Text>
                  </View>
                </View>
              )}
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <Animated.View entering={FadeIn.delay(350).duration(400)}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginHorizontal: 14 }}>or focus on one area</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }} />
            </View>
          </Animated.View>

          {/* Individual muscle group cards */}
          {MUSCLE_GROUPS.map((group, index) => (
            <Animated.View key={group.name} entering={FadeInDown.delay(400 + index * 70).duration(400).springify()}>
              <Pressable onPress={() => startExercise([group])} accessibilityRole="button" accessibilityLabel={group.name + " relaxation"}>
                {({ pressed }) => (
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, backgroundColor: isDark ? colors.cardBackground : "#FFFFFF", borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: pressed ? ACCENT_COLOR + "50" : colors.border, transform: [{ scale: pressed ? 0.98 : 1 }] }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: ACCENT_COLOR + "15", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                      <Text style={{ fontSize: 24 }}>{group.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textPrimary }}>{group.name}</Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>{group.instruction}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: ACCENT_COLOR }}>{group.tenseDuration + group.relaxDuration + PREP_DURATION}s</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary + "80"} style={{ marginTop: 2 }} />
                    </View>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ==========================================================================
  // COMPLETE SCREEN
  // ==========================================================================
  if (completed) {
    const allGroupNames = selectedGroups.map((g) => g.name);
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-row items-center px-4 py-3">
          <Pressable onPress={onClose} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? colors.surfaceSubtle : "#F0EDE4", alignItems: "center", justifyContent: "center" }} accessibilityLabel="Close" accessibilityRole="button">
            <Ionicons name="close" size={26} color={isDark ? "#FFFFFF" : "#333333"} />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ alignItems: "center", paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ marginTop: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 34, fontWeight: "900", color: colors.textPrimary, textAlign: "center" }}>All Done!</Text>
            {round > 1 && (
              <Text style={{ fontSize: 17, fontWeight: "600", color: ACCENT_COLOR, textAlign: "center", marginTop: 4 }}>Round {round}</Text>
            )}
          </Animated.View>

          <Animated.View entering={ZoomIn.delay(200).duration(500).springify()} style={{ marginBottom: 20 }}>
            <BodyOutline
              activeGroup={null}
              completedGroups={allGroupNames}
              phase="complete"
              anims={bodyAnims}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 22, fontWeight: "500", color: colors.textSecondary, textAlign: "center", lineHeight: 32, paddingHorizontal: 16 }}>
              {"Your body should feel calm and completely at ease."}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600).duration(500)} style={{ width: "100%", alignItems: "center", gap: 12 }}>
            {/* Another Round */}
            <Pressable
              onPress={handleAnotherRound}
              style={({ pressed }) => ({
                backgroundColor: ACCENT_COLOR,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 40,
                width: "100%",
                alignItems: "center",
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
              accessibilityLabel="Another Round"
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>Another Round</Text>
            </Pressable>

            {/* Repeat Last Group */}
            <Pressable
              onPress={handleRepeatLast}
              style={({ pressed }) => ({
                borderWidth: 2,
                borderColor: ACCENT_COLOR,
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 40,
                width: "100%",
                alignItems: "center",
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
              accessibilityLabel={"Repeat " + selectedGroups[selectedGroups.length - 1].name + " Only"}
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 18, fontWeight: "600", color: ACCENT_COLOR }}>
                {"Repeat " + selectedGroups[selectedGroups.length - 1].name + " Only"}
              </Text>
            </Pressable>

            {/* Done */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                paddingVertical: 14,
                paddingHorizontal: 40,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
              accessibilityLabel="Done"
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 18, fontWeight: "600", color: colors.textSecondary }}>Done</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================================================
  // EXERCISE SCREEN
  // ==========================================================================
  const phaseDuration = phase === "prep" ? PREP_DURATION : phase === "tense" ? currentGroup.tenseDuration : phase === "relax" ? currentGroup.relaxDuration : 0;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={onClose} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? colors.surfaceSubtle : "#F0EDE4", alignItems: "center", justifyContent: "center" }} accessibilityLabel="Close" accessibilityRole="button">
          <Ionicons name="close" size={26} color={isDark ? "#FFFFFF" : "#333333"} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.textSecondary }}>
          {round > 1 ? "Round " + round + " \u2022 " : ""}{currentGroupIndex + 1} of {totalGroups}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: isDark ? colors.surfaceSubtle : "#E5E7EB", overflow: "hidden" }}>
          <Animated.View style={[progressAnimStyle, { height: 6, borderRadius: 3, backgroundColor: ACCENT_COLOR }]} />
        </View>
      </View>

      {/* Main content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", paddingHorizontal: 24, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Muscle group name (no emoji — emoji lives in the breathing circle) */}
        <View style={{ alignItems: "center", marginTop: 8, marginBottom: 4 }}>
          <Text style={{ fontSize: 30, fontWeight: "800", color: colors.textPrimary }}>{currentGroup.name}</Text>
        </View>

        {/* Instruction text — shown during prep above the circle, during tense/relax below */}
        {(phase === "prep") && (
          <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 8, maxWidth: 340, marginVertical: 8 }}>
            <Text style={{ fontSize: 22, fontWeight: "500", color: colors.textSecondary, textAlign: "center", lineHeight: 30 }}>
              {currentGroup.instruction}
            </Text>
          </Animated.View>
        )}

        {/* Breathing Circle */}
        <View style={{ marginVertical: 12 }}>
          <BreathingCircle
            phase={phase === "intro" ? "prep" : phase}
            emoji={currentGroup.emoji}
          />
        </View>

        {/* Countdown Circle (all active phases) */}
        {(phase === "tense" || phase === "relax" || phase === "prep") && (
          <View style={{ marginBottom: 12 }}>
            <CountdownCircle
              totalDuration={phase === "prep" ? PREP_DURATION : phaseDuration}
              countdown={countdown}
              color={phase === "prep" ? "#D97706" : getPhaseColor()}
              phaseKey={phaseKey}
            />
          </View>
        )}

        {/* Phase Label (all active phases — sentence case, reduced size) */}
        {(phase === "tense" || phase === "relax" || phase === "prep") && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text style={{
              fontSize: 27,
              fontWeight: "800",
              color: phase === "prep" ? "#F59E0B" : getPhaseColor(),
              textAlign: "center",
              marginBottom: 8,
              letterSpacing: 1,
            }}>
              {getPhaseLabel()}
            </Text>
          </Animated.View>
        )}

        {/* Instruction text (tense/relax only — below the label) */}
        {(phase === "tense" || phase === "relax") && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={{ paddingHorizontal: 8, maxWidth: 340 }}>
            <Text style={{ fontSize: 22, fontWeight: "500", color: colors.textSecondary, textAlign: "center", lineHeight: 30 }}>
              {getInstructionText()}
            </Text>
          </Animated.View>
        )}

        {/* Transition */}
        {phase === "transition" && (
          <Animated.View entering={ZoomIn.duration(300).springify()} style={{ alignItems: "center" }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: ACCENT_COLOR + "15", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: ACCENT_COLOR + "25", marginBottom: 16 }}>
              <Ionicons name="checkmark" size={48} color={ACCENT_COLOR} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: ACCENT_COLOR, textAlign: "center" }}>Great job!</Text>
            <Text style={{ fontSize: 17, color: colors.textSecondary, textAlign: "center", marginTop: 4 }}>Get ready for the next muscle group...</Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

export default MuscleRelaxationGame;
