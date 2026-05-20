import React from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SOSWidgetProps } from "../types";

const SOS_MAX_WIDTH = 600;

export function SOSWidget({
  textClasses,
  onPress,
}: SOSWidgetProps) {
  const { width } = useWindowDimensions();
  const needsConstraint = width > SOS_MAX_WIDTH;

  return (
    <View style={needsConstraint ? { alignItems: "center" } : undefined}>
      <Pressable
        onPress={onPress}
        className="bg-critical rounded-3xl p-10 active:bg-[#A32E2E] min-h-[120px] items-center justify-center mb-6"
        style={needsConstraint ? { maxWidth: SOS_MAX_WIDTH, width: "100%" } : undefined}
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS button"
        accessibilityHint="Activates emergency mode to call your trusted contacts immediately"
      >
        <View className="flex-row items-center">
          <Ionicons name="alert-circle" size={40} color="white" />
          <Text className={`${textClasses.title} text-white font-semibold ml-4`}>SOS</Text>
        </View>
        <Text className={`${textClasses.subtitle} text-white mt-3`}>Tap for emergency help</Text>
      </Pressable>
    </View>
  );
}
