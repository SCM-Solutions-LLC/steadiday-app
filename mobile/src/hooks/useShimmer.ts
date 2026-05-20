import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

/**
 * Custom hook that returns an animated style for shimmer/pulse effects
 * Used for skeleton loading animations
 */
export function useShimmer() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    // Smooth pulsing animation from 0.3 to 0.7
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      false // Don't reverse
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { animatedStyle, opacity };
}
