import React, { useEffect, useRef } from "react";
import { Animated, Easing, ViewStyle } from "react-native";

interface Props {
  active: boolean;
  color?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * PulsingHighlight - Wraps content with a pulsing glow effect
 *
 * Used to draw attention to important UI elements for seniors.
 * The animation is slow (1000ms) to be calming and noticeable.
 */
export default function PulsingHighlight({
  active,
  color = "#3B82F6",
  children,
  style,
}: Props) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [active, pulseAnim]);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  if (!active) {
    return <>{children}</>;
  }

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale }],
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glowOpacity as unknown as number,
          shadowRadius: 15,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
