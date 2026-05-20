import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "../../utils/useResponsive";

const GAME_ICON_COLORS: Record<string, string> = {
  "word-scramble": "#8B5CF6",
  "word-match": "#6366F1",
  "number-pattern": "#10B981",
  "memory-cards": "#F59E0B",
  "reaction-tap": "#EF4444",
  "pattern-tap": "#8B5CF6",
  "breathing-exercise": "#10B981",
  "logic-grid": "#6366F1",
};

const QUICK_GAMES = [
  { id: "word-scramble", icon: "shuffle", label: "Scramble", color: GAME_ICON_COLORS["word-scramble"] },
  { id: "number-pattern", icon: "calculator", label: "Numbers", color: GAME_ICON_COLORS["number-pattern"] },
  { id: "memory-cards", icon: "grid", label: "Memory", color: GAME_ICON_COLORS["memory-cards"] },
  { id: "pattern-tap", icon: "apps", label: "Pattern", color: GAME_ICON_COLORS["pattern-tap"] },
  { id: "reaction-tap", icon: "flash", label: "Reaction", color: GAME_ICON_COLORS["reaction-tap"] },
  { id: "word-match", icon: "text", label: "Words", color: GAME_ICON_COLORS["word-match"] },
  { id: "logic-grid", icon: "grid-outline", label: "Logic", color: GAME_ICON_COLORS["logic-grid"] },
];

interface GameSwitcherTabsProps {
  currentGame: string;
  onSwitchGame: (gameId: string) => void;
  colors: any;
  isDark: boolean;
}

export default function GameSwitcherTabs({ currentGame, onSwitchGame, colors, isDark }: GameSwitcherTabsProps) {
  const responsive = useResponsive();
  const iconContainerSize = responsive.responsiveValue({ sm: 36, md: 44, lg: 48, xl: 52 });
  const iconFontSize = responsive.responsiveValue({ sm: 20, md: 24, lg: 26, xl: 28 });
  const labelSize = responsive.responsiveValue({ sm: 11, md: 12, lg: 13, xl: 14 });
  const tabMinSize = responsive.responsiveValue({ sm: 56, md: 64, lg: 72, xl: 80 });
  const vPadding = responsive.isLandscape && responsive.isPhone ? 4 : 8;

  return (
    <View style={{ backgroundColor: isDark ? colors.cardBackground : "#F8FAFC", borderTopWidth: 1, borderTopColor: colors.divider }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: responsive.isTablet ? 16 : 8,
          paddingVertical: vPadding,
          gap: responsive.isTablet ? 8 : 4,
          ...(responsive.isTablet ? { flexGrow: 1, justifyContent: "center" as const } : {}),
        }}
      >
        {QUICK_GAMES.map((game) => {
          const isActive = currentGame === game.id;
          return (
            <Pressable
              key={game.id}
              onPress={() => onSwitchGame(game.id)}
              style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 8, paddingVertical: vPadding, minWidth: tabMinSize, minHeight: tabMinSize, borderRadius: 14, backgroundColor: isActive ? game.color + "20" : "transparent" }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Switch to ${game.label} game`}
            >
              <View style={{ width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2, alignItems: "center", justifyContent: "center", marginBottom: 4, backgroundColor: isActive ? game.color : colors.divider }}>
                <Ionicons name={game.icon as any} size={iconFontSize} color={isActive ? "#FFFFFF" : colors.textSecondary} />
              </View>
              <Text style={{ fontSize: labelSize, fontWeight: isActive ? "700" : "500", color: isActive ? game.color : colors.textSecondary }}>{game.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export { GAME_ICON_COLORS, QUICK_GAMES };
export type { GameSwitcherTabsProps };
