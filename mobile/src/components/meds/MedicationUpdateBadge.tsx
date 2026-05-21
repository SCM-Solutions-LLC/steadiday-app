/**
 * MedicationUpdateBadge - Shows when a linked medication has updates from a health provider
 *
 * Theme-aware badge that uses semantic color tokens for proper contrast
 * in light, dark, and accessibility modes. Meets WCAG AA contrast minimum (4.5:1).
 * Note: Health Connect medication sync is not currently implemented on Android
 */
import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../utils/useTheme";
import { MedicationChange } from "../../hooks/useMedicationLinkSync";

interface Props {
  change: MedicationChange;
  onPress: () => void;
  compact?: boolean;
}

export default function MedicationUpdateBadge({ change, onPress, compact = false }: Props) {
  const { colors } = useTheme();

  // Get accessibility-friendly description based on change type
  const getChangeDescription = (): string => {
    switch (change.type) {
      case "dosage_changed":
        return "Dosage Updated";
      case "name_changed":
        return "Name Changed";
      case "removed":
        return "Removed from Provider";
      default:
        return "Update Available";
    }
  };

  const healthSource = Platform.OS === "android" ? "Health Connect" : "Apple Health";

  // Get detailed accessibility label for screen readers
  const getAccessibilityLabel = (): string => {
    const description = getChangeDescription();
    switch (change.type) {
      case "dosage_changed":
        return `${description}. Tap to review dosage changes from ${healthSource}.`;
      case "name_changed":
        return `${description}. Tap to review medication name change from ${healthSource}.`;
      case "removed":
        return `${description}. This medication was removed from your health provider records. Tap to review.`;
      default:
        return `${description}. Tap to review changes from ${healthSource}.`;
    }
  };

  if (compact) {
    // Compact badge - just an icon for inline display
    return (
      <Pressable
        onPress={onPress}
        className="ml-2"
        accessibilityRole="button"
        accessibilityLabel={getAccessibilityLabel()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View
          className="w-6 h-6 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.warning }}
        >
          <Ionicons
            name="arrow-up"
            size={14}
            color={colors.onWarning}
            accessibilityElementsHidden
          />
        </View>
      </Pressable>
    );
  }

  // Full badge with text - uses theme-aware colors
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-3 py-1.5 rounded-full mt-2"
      style={{
        backgroundColor: colors.warningBackground,
        borderWidth: 1,
        borderColor: colors.warning + "40",
      }}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <Ionicons
        name="refresh-circle"
        size={18}
        color={colors.onWarning}
        accessibilityElementsHidden
      />
      <Text
        className="text-sm font-medium ml-1.5"
        style={{ color: colors.onWarning }}
        numberOfLines={1}
      >
        {getChangeDescription()}
      </Text>
    </Pressable>
  );
}
