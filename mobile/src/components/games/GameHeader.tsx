/**
 * Game Header
 *
 * Premium header component for game screens with proper safe area handling
 * and subtle colored accent.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "../../utils/useResponsive";

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  colors: any;
  textClasses: any;
  iconColor?: string;
}

export default function GameHeader({
  title,
  subtitle,
  onClose,
  colors,
  textClasses,
  iconColor,
}: GameHeaderProps) {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();

  const accentHeight = responsive.scale(80) + insets.top;
  const closeSize = responsive.responsiveValue({ sm: 36, md: 40, lg: 44, xl: 48 });
  const closeIconSize = responsive.responsiveValue({ sm: 20, md: 22, lg: 24, xl: 26 });
  const titleSize = responsive.scaleFont(24);
  const subtitleSize = responsive.scaleFont(14);
  const hPadding = responsive.horizontalPadding;

  return (
    <View style={{ position: "relative" }}>
      {iconColor && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: accentHeight,
            backgroundColor: iconColor + "08",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}
        />
      )}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: hPadding,
          paddingBottom: 16,
          backgroundColor: "transparent",
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: responsive.contentMaxWidth,
          alignSelf: "center",
          width: "100%",
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{
              fontSize: titleSize,
              fontWeight: "bold",
              color: colors.textPrimary,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: subtitleSize,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <Pressable
          onPress={onClose}
          style={{
            width: closeSize,
            height: closeSize,
            borderRadius: closeSize / 2,
            backgroundColor: colors.cardBackground,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Close game"
        >
          <Ionicons name="close" size={closeIconSize} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

export type { GameHeaderProps };
