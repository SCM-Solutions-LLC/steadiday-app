import React from "react";
import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../utils/useTheme";
import { getTextSizeClasses } from "../utils/textSizes";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useSlowMode } from "../utils/useSlowMode";

export type ButtonVariant = "primary" | "secondary" | "outline";
export type ButtonSize = "small" | "medium" | "large";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

/**
 * Theme-aware Button component with rounded pill styling
 * Automatically uses the correct text color (onPrimary) based on the selected theme
 *
 * Usage:
 * <Button title="Get Started" onPress={handlePress} />
 * <Button title="Log In" onPress={handlePress} variant="outline" />
 * <Button title="Save" onPress={handlePress} loading={true} />
 */
export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "large",
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const { colors, primary, onPrimary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const { enabled: slowMode } = useSlowMode();

  // Determine background color based on variant
  const getBackgroundColor = () => {
    if (disabled) {
      return colors.buttonDisabled;
    }
    switch (variant) {
      case "primary":
        return primary;
      case "secondary":
        return colors.cardBackground;
      case "outline":
        return "transparent";
      default:
        return primary;
    }
  };

  // Determine text color based on variant
  const getTextColor = () => {
    if (disabled) {
      return colors.buttonDisabledText;
    }
    switch (variant) {
      case "primary":
        return onPrimary; // Theme-aware text color
      case "secondary":
        return colors.textPrimary;
      case "outline":
        return primary;
      default:
        return onPrimary;
    }
  };

  // Determine border style for outline variant
  const getBorderStyle = () => {
    if (variant === "outline") {
      return {
        borderWidth: 2,
        borderColor: disabled ? colors.buttonDisabled : primary,
      };
    }
    return {};
  };

  // Size-based padding (with extra spacing when Slow Mode is on)
  const getPadding = () => {
    const extra = slowMode ? 6 : 0;
    switch (size) {
      case "small":
        return { paddingHorizontal: 16 + extra, paddingVertical: 12 + extra };
      case "medium":
        return { paddingHorizontal: 24 + extra, paddingVertical: 16 + extra };
      case "large":
        return { paddingHorizontal: 32 + extra, paddingVertical: 20 + extra };
      default:
        return { paddingHorizontal: 32 + extra, paddingVertical: 20 + extra };
    }
  };

  // Min height based on size (taller when Slow Mode is on)
  const getMinHeight = () => {
    if (slowMode) {
      switch (size) {
        case "small":
          return 56;
        case "medium":
          return 64;
        case "large":
          return 72;
        default:
          return 72;
      }
    }
    switch (size) {
      case "small":
        return 44; // Apple's minimum touch target
      case "medium":
        return 52;
      case "large":
        return 60;
      default:
        return 60;
    }
  };

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: getBackgroundColor(),
          ...getBorderStyle(),
          ...getPadding(),
          minHeight: getMinHeight(),
          borderRadius: 999, // Fully rounded pill shape
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.8 : 1, // Slightly dimmed but still visible
          width: fullWidth ? "100%" : undefined,
        },
        style,
      ]}
      className="active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              {
                color: getTextColor(),
                fontWeight: "600",
                fontSize: size === "small" ? 16 : size === "medium" ? 18 : 20,
              },
              textStyle,
            ]}
            className={icon ? "ml-2" : ""}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
