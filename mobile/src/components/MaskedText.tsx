/**
 * MaskedText Component
 *
 * SECURITY DEFENSE: Attack Story 9 - Screen Sharing Exposure
 *
 * This component protects sensitive information when seniors share their screen
 * over Zoom, FaceTime, or other video calls while asking family for help.
 *
 * WHAT IT PROTECTS:
 * - Medical record numbers
 * - Insurance policy numbers
 * - Phone numbers
 * - Addresses
 * - Social security numbers
 * - Any other sensitive personal information
 *
 * HOW IT WORKS:
 * - Displays sensitive text as masked dots (••••••••) by default
 * - User can tap the eye icon to reveal the actual value
 * - Tap again to hide it
 * - Senior-friendly with large tap targets
 *
 * USAGE:
 * <MaskedText
 *   value="123-45-6789"
 *   label="Medical Record Number"
 *   maskByDefault={true}
 * />
 */

import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";

interface MaskedTextProps {
  /** The sensitive value to display/mask */
  value: string;
  /** Optional label to show above the value */
  label?: string;
  /** Whether to start with value masked (default: true) */
  maskByDefault?: boolean;
  /** Character to use for masking (default: '•') */
  maskChar?: string;
  /** Text size class (default: 'text-base') */
  textSize?: string;
  /** Whether this is in a card/form context (affects styling) */
  inCard?: boolean;
}

/**
 * MaskedText Component
 *
 * Shows sensitive text with show/hide toggle
 *
 * SECURITY: Prevents accidental exposure during screen sharing
 */
export default function MaskedText({
  value,
  label,
  maskByDefault = true,
  maskChar = "•",
  textSize = "text-base",
  inCard = false,
}: MaskedTextProps) {
  const [isMasked, setIsMasked] = useState(maskByDefault);
  const { colors, primary } = useTheme();

  // Generate masked version (show same length as actual value)
  const maskedValue = maskChar.repeat(Math.min(value.length, 12));

  // Don't render if no value
  if (!value) {
    return null;
  }

  return (
    <View className={inCard ? "" : "mb-4"}>
      {/* Label */}
      {label && (
        <Text className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
          {label}
        </Text>
      )}

      {/* Value with show/hide button */}
      <View
        className="flex-row items-center justify-between rounded-xl px-4 py-3"
        style={{ backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.border }}
      >
        {/* The actual or masked value */}
        <Text
          className={`${textSize} flex-1 mr-3`}
          style={{ color: colors.textPrimary }}
          numberOfLines={1}
        >
          {isMasked ? maskedValue : value}
        </Text>

        {/* Show/Hide toggle button */}
        {/* SECURITY: Large tap target for seniors */}
        <Pressable
          onPress={() => setIsMasked(!isMasked)}
          className="p-2 rounded-lg active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={
            isMasked ? `Show ${label || "value"}` : `Hide ${label || "value"}`
          }
          accessibilityHint="Tap to show or hide sensitive information"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isMasked ? "eye-outline" : "eye-off-outline"}
            size={24}
            color={primary}
          />
        </Pressable>
      </View>

      {/* Helper text */}
      {maskByDefault && (
        <Text className="text-xs mt-1 ml-1" style={{ color: colors.textSecondary }}>
          Tap the eye icon to {isMasked ? "show" : "hide"}
        </Text>
      )}
    </View>
  );
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Medical Record Number:
 * <MaskedText
 *   value={medicalRecordNumber}
 *   label="Medical Record Number"
 *   maskByDefault={true}
 * />
 *
 * 2. Insurance Policy Number:
 * <MaskedText
 *   value={policyNumber}
 *   label="Policy Number"
 *   maskByDefault={true}
 * />
 *
 * 3. Phone Number:
 * <MaskedText
 *   value={phoneNumber}
 *   label="Emergency Contact Phone"
 *   maskByDefault={true}
 * />
 *
 * 4. Social Security Number:
 * <MaskedText
 *   value={ssn}
 *   label="SSN"
 *   maskByDefault={true}
 * />
 *
 * WHY THIS MATTERS:
 *
 * Seniors often share their screens when:
 * - Video calling family for tech help
 * - Showing doctors their medical info
 * - Getting help from friends
 * - Recording tutorials for themselves
 *
 * Without masking, sensitive data is exposed in:
 * - Screen recordings
 * - Screenshots
 * - Video calls
 * - Screen sharing sessions
 *
 * With masking:
 * - Default state is safe (dots only)
 * - User controls when to reveal
 * - Easy to hide again quickly
 * - Clear visual indicator (eye icon)
 */

/**
 * SECURITY NOTES:
 *
 * 1. Always mask by default for maximum safety
 * 2. Use for ANY data that could be used for identity theft
 * 3. Medical record numbers
 * 4. Insurance policy/group numbers
 * 5. Phone numbers (can be used for SIM swapping)
 * 6. Full addresses
 * 7. Dates of birth
 * 8. Partial SSN or full SSN
 * 9. Driver's license numbers
 * 10. Passport numbers
 *
 * DO NOT mask:
 * - User's own name (needed for context)
 * - Non-sensitive labels or categories
 * - Public information
 * - App navigation elements
 */
