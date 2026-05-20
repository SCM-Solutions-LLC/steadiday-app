// Color palette for SteadiDay app
// Designed for adults aged 50-70 with high contrast and readability

export const colors = {
  // Primary Blue - main accent, buttons, highlights
  primary: {
    main: "#2F80ED",
    light: "#4FA3FF", // for dark mode
  },

  // Secondary Sage Green - success states, wellness context
  sage: {
    main: "#6DB193",
    light: "#8CC9AE",
  },

  // Critical Red - emergency button and warnings
  critical: {
    main: "#CC3A3A",
    dark: "#A82E2E",
  },

  // Light mode colors
  light: {
    background: "#F7F7F7",
    card: "#EFEFEF",
    divider: "#DDDDDD",
    heading: "#1A1A1A",
    body: "#333333",
  },

  // Dark mode colors
  dark: {
    background: "#121212",
    card: "#1E1E1E",
    text: "#E6E6E6",
    textSecondary: "#B3B3B3",
    accentBlue: "#4FA3FF",
  },
};

// Helper function to get appropriate color based on theme
export const getThemedColor = (isDark: boolean, lightColor: string, darkColor: string) => {
  return isDark ? darkColor : lightColor;
};
