/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");

module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  corePlugins: {
    space: false,
  },
  theme: {
    extend: {
      colors: {
        // Primary - dynamically themed (use useTheme hook for theme colors)
        primary: {
          DEFAULT: "#2F80ED", // Soft blue - fallback
          light: "#E5F2FF",
          dark: "#1E5FBF",
        },
        // Secondary Sage Green - success states, wellness
        sage: {
          DEFAULT: "#6DB193",
          light: "#E8F5F0",
          dark: "#4F9170",
        },
        // Critical Red - emergency and warnings
        critical: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
          dark: "#DC2626",
        },
        // Status colors
        success: "#6DB193",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#2F80ED",
        // Light mode colors
        light: {
          bg: "#F7F7F7",
          card: "#FFFFFF",
          divider: "#DDDDDD",
          border: "#DDDDDD",
          heading: "#1A1A1A",
          body: "#666666",
          tertiary: "#999999",
        },
        // Dark mode colors
        dark: {
          bg: "#121212",
          card: "#1E1E1E",
          modal: "#2A2A2A",
          text: "#FFFFFF",
          textSecondary: "#B3B3B3",
          textTertiary: "#808080",
          border: "#3A3A3A",
          divider: "#2A2A2A",
        },
      },
      fontSize: {
        xs: "14px",
        sm: "16px",
        base: "18px",
        lg: "20px",
        xl: "22px",
        "2xl": "24px",
        "3xl": "26px",
        "4xl": "32px",
        "5xl": "40px",
        "6xl": "48px",
        "7xl": "56px",
        "8xl": "64px",
        "9xl": "72px",
      },
      lineHeight: {
        relaxed: "1.75",
        loose: "2",
      },
      spacing: {
        18: "72px",
        22: "88px",
        26: "104px",
      },
    },
  },
  darkMode: "class",
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      const spacing = theme("spacing");

      // space-{n}  ->  gap: {n}
      matchUtilities(
        { space: (value) => ({ gap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );

      // space-x-{n}  ->  column-gap: {n}
      matchUtilities(
        { "space-x": (value) => ({ columnGap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );

      // space-y-{n}  ->  row-gap: {n}
      matchUtilities(
        { "space-y": (value) => ({ rowGap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );
    }),
  ],
};
