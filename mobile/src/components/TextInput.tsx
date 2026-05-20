import React from "react";
import {
  TextInput as RNTextInput,
  TextInputProps,
  Platform,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useTheme } from "../utils/useTheme";

interface ThemedTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  // If true, applies the full themed styling (border, background, etc.)
  // If false, just sets cursor color (backwards compatible)
  themed?: boolean;
}

// Enhanced TextInput with visible cursor color and optional themed styling
// For senior-friendly UI with visible borders and high contrast
export const TextInput = React.forwardRef<RNTextInput, ThemedTextInputProps>(
  ({ label, error, helperText, themed = false, style, ...props }, ref) => {
    const { colors, primary } = useTheme();
    const hasError = !!error;

    // If themed mode is enabled, wrap with label and helper text
    if (themed) {
      return (
        <View style={styles.container}>
          {label && (
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {label}
            </Text>
          )}

          <RNTextInput
            ref={ref}
            {...props}
            style={[
              styles.themedInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: hasError ? colors.error : colors.inputBorder,
                color: colors.textPrimary,
              },
              style,
            ]}
            placeholderTextColor={colors.inputPlaceholder}
            cursorColor={primary}
            selectionColor={Platform.OS === "ios" ? primary : `${primary}80`}
          />

          {(error || helperText) && (
            <Text
              style={[
                styles.helperText,
                { color: hasError ? colors.error : colors.textSecondary },
              ]}
            >
              {error || helperText}
            </Text>
          )}
        </View>
      );
    }

    // Basic mode - just set cursor/selection color for visibility
    return (
      <RNTextInput
        ref={ref}
        {...props}
        style={style}
        // Set cursor/caret color to primary for visibility
        cursorColor={primary}
        selectionColor={Platform.OS === "ios" ? primary : `${primary}80`}
        placeholderTextColor={
          props.placeholderTextColor || colors.inputPlaceholder
        }
      />
    );
  }
);

TextInput.displayName = "TextInput";

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  themedInput: {
    borderWidth: 1.5, // Visible border for accessibility
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18, // Larger text for older adults
    minHeight: 56, // Comfortable touch target
  },
  helperText: {
    fontSize: 14,
    marginTop: 6,
  },
});

// Export a pre-themed version for convenience
export const ThemedTextInput = React.forwardRef<
  RNTextInput,
  Omit<ThemedTextInputProps, "themed">
>((props, ref) => <TextInput ref={ref} {...props} themed />);

ThemedTextInput.displayName = "ThemedTextInput";
