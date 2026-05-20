import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";

/**
 * Banner component that appears when the device is offline
 * Returns null when connected to prevent any text from showing
 */
export function OfflineBanner() {
  const isConnected = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  // Don't render anything when online
  if (isConnected) {
    return null;
  }

  // Only render banner when offline
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingTop: insets.top,
      }}
    >
      <View
        className="flex-row items-center justify-center px-4 py-3"
        style={{ backgroundColor: "#FEF3C7" }}
      >
        <Ionicons name="cloud-offline" size={20} color="#D97706" />
        <Text
          className={`${textClasses.small} ml-2 font-medium`}
          style={{ color: "#92400E" }}
        >
          {"You're offline. Changes will sync when connected."}
        </Text>
      </View>
    </View>
  );
}
