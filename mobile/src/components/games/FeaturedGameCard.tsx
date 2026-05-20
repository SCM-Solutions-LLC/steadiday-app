/**
 * Featured Game Card
 *
 * The "Game of the Day" card displayed prominently at the top of MindBreaksScreen.
 * Features an animated preview and prominent call-to-action.
 */

import React, { useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  FEATURED_PREVIEW_COMPONENTS,
  FEATURED_CARD_COLORS,
} from "./FeaturedGamePreviews";

interface GameDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  duration: string;
  iconColor: string;
}

interface FeaturedGameCardProps {
  game: GameDefinition;
  dayName: string;
  onPress: () => void;
  colors: any;
  textClasses: any;
  hapticEnabled: boolean;
}

export default function FeaturedGameCard({
  game,
  dayName,
  onPress,
  colors,
  textClasses,
  hapticEnabled,
}: FeaturedGameCardProps) {
  const handlePressIn = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  const FeaturedPreview = FEATURED_PREVIEW_COMPONENTS[game.id];
  const cardColor = FEATURED_CARD_COLORS[game.id] || game.iconColor;

  return (
    <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
      {/* Section Label */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            letterSpacing: 1,
            color: colors.textTertiary,
            textTransform: "uppercase",
          }}
        >
          Game of the Day
        </Text>
        <View
          style={{
            marginLeft: 10,
            backgroundColor: cardColor + "20",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: cardColor }}>
            {dayName}
          </Text>
        </View>
      </View>

      {/* Featured Card - Compact design */}
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.95 : 1,
        })}
      >
        <View
          style={{
            backgroundColor: cardColor,
            borderRadius: 20,
            overflow: "hidden",
            shadowColor: cardColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Main content row */}
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
            {/* Animation Preview Area - More prominent */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
                overflow: "hidden",
              }}
            >
              {FeaturedPreview ? (
                <FeaturedPreview />
              ) : (
                <Ionicons name={game.icon} size={36} color="#FFFFFF" />
              )}
            </View>

            {/* Text Content */}
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  marginBottom: 4,
                }}
              >
                {game.title}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.85)",
                  marginBottom: 8,
                }}
                numberOfLines={2}
              >
                {game.description}
              </Text>
              {/* Duration badge */}
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "rgba(255,255,255,0.25)",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#FFFFFF" }}>
                  {game.duration}
                </Text>
              </View>
            </View>

            {/* Play Arrow */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="play" size={22} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export type { GameDefinition, FeaturedGameCardProps };
