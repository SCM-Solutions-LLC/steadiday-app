import { useState, useEffect, useRef, useCallback } from "react";
import { DeviceMotion } from "expo-sensors";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useSettingsStore } from "../../../state/stores/settingsStore";

const FALL_KEEP_AWAKE_TAG = "fall-detection-countdown";

interface UseFallDetectionOptions {
  enabled: boolean;
  onFallDetected: () => void;
}

const BASE_COUNTDOWN_SECONDS = 30;
const SLOW_MODE_COUNTDOWN_SECONDS = 30;

export function useFallDetection({
  enabled,
  onFallDetected,
}: UseFallDetectionOptions) {
  const slowModeEnabled = useSettingsStore((s) => s.slowModeEnabled) ?? true;
  const countdownStart = slowModeEnabled
    ? SLOW_MODE_COUNTDOWN_SECONDS
    : BASE_COUNTDOWN_SECONDS;

  const [showFallAlert, setShowFallAlert] = useState(false);
  const [fallCountdown, setFallCountdown] = useState(countdownStart);
  const [lastFallAlertTime, setLastFallAlertTime] = useState<number>(0);
  const accelerationHistory = useRef<number[]>([]);
  const onFallDetectedRef = useRef(onFallDetected);

  useEffect(() => {
    onFallDetectedRef.current = onFallDetected;
  }, [onFallDetected]);
  const FALL_COOLDOWN_MS = 60000; // 1 minute cooldown between fall alerts

  // Fall detection thresholds (adjusted to significantly reduce false positives)
  // A real fall typically generates 4-8G of impact, while setting down a phone is usually 2-4G
  const IMPACT_THRESHOLD = 6.5; // Requires strong impact (upper range of real falls)
  const STILLNESS_THRESHOLD = 0.5; // Requires near-complete stillness after impact
  const MAX_STILLNESS_READING = 0.8; // No single reading can exceed this during stillness period
  const HISTORY_SIZE = 30; // 3 seconds of data at 100ms interval for better pattern detection

  // Fall detection with accelerometer
  useEffect(() => {
    if (!enabled) return;

    DeviceMotion.setUpdateInterval(100);
    const subscription = DeviceMotion.addListener((motionData) => {
      const { x, y, z } = motionData.acceleration || { x: 0, y: 0, z: 0 };
      const totalAcceleration = Math.sqrt(x * x + y * y + z * z);

      // Keep a rolling history of the last 20 readings (2 seconds at 100ms interval)
      accelerationHistory.current.push(totalAcceleration);
      if (accelerationHistory.current.length > HISTORY_SIZE) {
        accelerationHistory.current.shift();
      }

      const now = Date.now();
      const timeSinceLastAlert = now - lastFallAlertTime;

      if (timeSinceLastAlert < FALL_COOLDOWN_MS) {
        return; // Still in cooldown period
      }

      // Check if we have enough history and detect spike followed by sustained stillness
      if (accelerationHistory.current.length >= HISTORY_SIZE) {
        const history = accelerationHistory.current;

        // First 1 second (10 readings) - look for impact spike
        const firstThird = history.slice(0, 10);
        const maxAcceleration = Math.max(...firstThird);

        // Last 2 seconds (20 readings) - check for sustained stillness
        // Longer stillness window reduces false positives from phone being set down
        const lastTwoThirds = history.slice(10);
        const avgStillness =
          lastTwoThirds.reduce((a: number, b: number) => a + b, 0) / lastTwoThirds.length;

        // Also check that ALL readings in the stillness period are low (not just average)
        // This prevents triggering when phone is picked up quickly after being set down
        const maxStillnessReading = Math.max(...lastTwoThirds);

        // Detect fall: high spike (>6.5G) followed by 2 seconds of sustained stillness
        const hasImpactSpike = maxAcceleration > IMPACT_THRESHOLD;
        const hasSustainedStillness = avgStillness < STILLNESS_THRESHOLD && maxStillnessReading < MAX_STILLNESS_READING;

        if (hasImpactSpike && hasSustainedStillness && !showFallAlert) {
          setShowFallAlert(true);
          setFallCountdown(countdownStart);
          setLastFallAlertTime(now);
          accelerationHistory.current = []; // Reset history
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, showFallAlert, lastFallAlertTime]);

  // Keep screen awake during countdown
  useEffect(() => {
    if (showFallAlert) {
      activateKeepAwakeAsync(FALL_KEEP_AWAKE_TAG).catch(() => {});
    } else {
      deactivateKeepAwake(FALL_KEEP_AWAKE_TAG);
    }
    return () => {
      deactivateKeepAwake(FALL_KEEP_AWAKE_TAG);
    };
  }, [showFallAlert]);

  // Fall alert countdown
  useEffect(() => {
    if (!showFallAlert || fallCountdown <= 0) {
      if (fallCountdown <= 0 && showFallAlert) {
        deactivateKeepAwake(FALL_KEEP_AWAKE_TAG);
        onFallDetectedRef.current();
        setShowFallAlert(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      setFallCountdown(fallCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showFallAlert, fallCountdown]);

  const cancelFallAlert = useCallback(() => {
    setShowFallAlert(false);
    setFallCountdown(countdownStart);
  }, [countdownStart]);

  const triggerFallAlert = useCallback(() => {
    setShowFallAlert(false);
    onFallDetectedRef.current();
  }, []);

  const triggerExternalFallAlert = useCallback(() => {
    if (showFallAlert) return;
    const now = Date.now();
    if (now - lastFallAlertTime < FALL_COOLDOWN_MS) return;
    setShowFallAlert(true);
    setFallCountdown(countdownStart);
    setLastFallAlertTime(now);
    accelerationHistory.current = [];
  }, [showFallAlert, lastFallAlertTime, countdownStart]);

  return {
    showFallAlert,
    fallCountdown,
    cancelFallAlert,
    triggerFallAlert,
    triggerExternalFallAlert,
  };
}
