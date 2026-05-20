import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";

interface TutorialTooltipProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  position?: "top" | "bottom" | "center";
}

export default function TutorialTooltip({
  visible,
  title,
  message,
  onClose,
  position = "center",
}: TutorialTooltipProps) {
  const { colors, isDark, primary, onPrimary } = useTheme();

  if (!visible) return null;

  const getPositionStyles = () => {
    switch (position) {
      case "top":
        return "justify-start pt-20";
      case "bottom":
        return "justify-end pb-20";
      case "center":
      default:
        return "justify-center";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className={`flex-1 bg-black/50 px-6 ${getPositionStyles()}`}
        onPress={onClose}
      >
        <Pressable
          className="rounded-3xl p-6"
          style={{
            backgroundColor: colors.modalBackground,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Ionicons name="bulb" size={24} color={colors.primary} />
              </View>
              <Text
                className="text-2xl font-bold flex-1"
                style={{ color: colors.textPrimary }}
                numberOfLines={2}
              >
                {title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-10 h-10 rounded-full items-center justify-center ml-2"
              style={({ pressed }) => pressed ? { backgroundColor: colors.primaryLight } : {}}
              accessibilityRole="button"
              accessibilityLabel="Close tooltip"
            >
              <Ionicons name="close" size={28} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Message */}
          <Text
            className="text-lg leading-relaxed mb-6"
            style={{ color: colors.textSecondary }}
          >
            {message}
          </Text>

          {/* Got It Button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              backgroundColor: primary,
              borderRadius: 16,
              paddingVertical: 16,
              opacity: pressed ? 0.9 : 1,
            })}
            accessibilityRole="button"
            accessibilityLabel="Got it"
          >
            <Text className="text-xl font-semibold text-center" style={{ color: onPrimary }}>
              Got it!
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
