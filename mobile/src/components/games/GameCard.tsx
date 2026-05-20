import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Enhanced color themes for each game — includes gradient stops and accents
const GAME_CARD_THEMES: Record<
  string,
  {
    bgLight: string;
    bgDark: string;
    accentLight: string;
    accentDark: string;
    iconBgLight: string;
    iconBgDark: string;
  }
> = {
  "word-scramble": {
    bgLight: "#F3EEFF",
    bgDark: "#2D1B69",
    accentLight: "#E8DEFF",
    accentDark: "#3D2680",
    iconBgLight: "#DCCFFF",
    iconBgDark: "#4C3599",
  },
  "word-match": {
    bgLight: "#EEF0FF",
    bgDark: "#1E2460",
    accentLight: "#DDE2FF",
    accentDark: "#2D3580",
    iconBgLight: "#C7CFFF",
    iconBgDark: "#3B4599",
  },
  "number-pattern": {
    bgLight: "#E6FFF0",
    bgDark: "#0B3D2B",
    accentLight: "#CCFFE0",
    accentDark: "#145940",
    iconBgLight: "#A8F0C8",
    iconBgDark: "#1A7050",
  },
  "memory-cards": {
    bgLight: "#FFF8E6",
    bgDark: "#3D2E0A",
    accentLight: "#FFF0CC",
    accentDark: "#594515",
    iconBgLight: "#FFE5A0",
    iconBgDark: "#70591F",
  },
  "reaction-tap": {
    bgLight: "#FFF0EE",
    bgDark: "#3D1410",
    accentLight: "#FFE0DC",
    accentDark: "#59201A",
    iconBgLight: "#FFC9C2",
    iconBgDark: "#702B24",
  },
  "pattern-tap": {
    bgLight: "#F5EEFF",
    bgDark: "#2A1550",
    accentLight: "#E8D9FF",
    accentDark: "#3B2070",
    iconBgLight: "#D4BFFF",
    iconBgDark: "#4D2E90",
  },
  "breathing-exercise": {
    bgLight: "#ECFDF5",
    bgDark: "#0A3D2A",
    accentLight: "#D1FAE5",
    accentDark: "#145940",
    iconBgLight: "#A7F3D0",
    iconBgDark: "#1A7050",
  },
  "logic-grid": {
    bgLight: "#EEF2FF",
    bgDark: "#1E2060",
    accentLight: "#DDE2FF",
    accentDark: "#2D3580",
    iconBgLight: "#C7CFFF",
    iconBgDark: "#3B4599",
  },
};

// Re-export for backwards compatibility
export const GAME_CARD_COLORS: Record<string, { light: string; dark: string }> =
  Object.fromEntries(
    Object.entries(GAME_CARD_THEMES).map(([key, val]) => [
      key,
      { light: val.bgLight, dark: val.bgDark },
    ])
  );

export { GAME_CARD_THEMES };

export interface GameCardProps {
  game: {
    id: string;
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    duration: string;
    iconColor: string;
  };
  onPress: () => void;
  colors: any;
  isDark: boolean;
}

function GameCard({ game, onPress, colors, isDark }: GameCardProps) {
  const theme = GAME_CARD_THEMES[game.id] || {
    bgLight: "#F8FAFC",
    bgDark: "#1E293B",
    accentLight: "#E2E8F0",
    accentDark: "#334155",
    iconBgLight: "#CBD5E1",
    iconBgDark: "#475569",
  };

  const cardBg = isDark ? theme.bgDark : theme.bgLight;
  const accentBg = isDark ? theme.accentDark : theme.accentLight;
  const iconBg = isDark ? theme.iconBgDark : theme.iconBgLight;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 22,
          padding: 16,
          minHeight: 170,
          overflow: "hidden",
          shadowColor: isDark ? "#000" : game.iconColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 14,
          elevation: 6,
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.04)",
        }}
      >
        {/* Decorative circle — top-right */}
        <View
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: accentBg,
            opacity: 0.6,
          }}
        />
        {/* Decorative circle — bottom-left */}
        <View
          style={{
            position: "absolute",
            bottom: -15,
            left: -15,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: accentBg,
            opacity: 0.3,
          }}
        />

        {/* Icon */}
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.8)",
          }}
        >
          <Ionicons name={game.icon} size={26} color={game.iconColor} />
        </View>

        {/* Title — allows 2 lines for longer names */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: isDark ? "#FFFFFF" : colors.textPrimary,
            marginBottom: 3,
            lineHeight: 20,
            letterSpacing: -0.2,
          }}
          numberOfLines={2}
        >
          {game.title}
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 13,
            color: isDark
              ? "rgba(255,255,255,0.6)"
              : colors.textSecondary,
            marginBottom: 12,
            lineHeight: 17,
          }}
          numberOfLines={1}
        >
          {game.subtitle}
        </Text>

        {/* Duration badge */}
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: isDark
              ? "rgba(255,255,255,0.12)"
              : "rgba(0,0,0,0.05)",
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isDark
                ? "rgba(255,255,255,0.7)"
                : colors.textTertiary,
            }}
          >
            {game.duration}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default GameCard;
