import React, { useState, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import { BackButton } from "../components/ui";
import * as Clipboard from "expo-clipboard";

const LIABILITY_URL = "https://steadiday.com/liability";

export default function LiabilityWaiverScreen() {
  const { colors, primary } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handleCopyURL = async () => {
    await Clipboard.setStringAsync(LIABILITY_URL);
  };

  const handleOpenInBrowser = () => {
    Linking.openURL(LIABILITY_URL);
  };

  return (
    <Screen variant="static" edges={["top"]}>
      <View className="flex-1">
        <View className="px-6 pt-4 pb-5" style={{ backgroundColor: colors.cardBackground }}>
          <BackButton label="Settings" />
          <Text className="text-2xl font-semibold mt-4" style={{ color: colors.textPrimary }}>
            Liability Waiver
          </Text>
        </View>

        {error ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="cloud-offline-outline" size={56} color={colors.textTertiary} />
            <Text
              className="text-lg font-semibold mt-4 mb-2 text-center"
              style={{ color: colors.textPrimary }}
            >
              Unable to load
            </Text>
            <Text
              className="text-base text-center mb-6"
              style={{ color: colors.textSecondary }}
            >
              Please visit steadiday.com for our latest policies.
            </Text>
            <View className="flex-row" style={{ gap: 12 }}>
              <Pressable
                onPress={handleCopyURL}
                className="flex-row items-center px-5 py-3 rounded-xl"
                style={{ backgroundColor: colors.divider }}
              >
                <Ionicons name="copy-outline" size={18} color={colors.textPrimary} />
                <Text className="text-base font-medium ml-2" style={{ color: colors.textPrimary }}>
                  Copy URL
                </Text>
              </Pressable>
              <Pressable
                onPress={handleOpenInBrowser}
                className="flex-row items-center px-5 py-3 rounded-xl"
                style={{ backgroundColor: primary }}
              >
                <Ionicons name="open-outline" size={18} color="white" />
                <Text className="text-base font-medium ml-2" style={{ color: "white" }}>
                  Open in Browser
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="flex-1">
            {loading && (
              <View className="absolute inset-0 z-10 items-center justify-center">
                <ActivityIndicator size="large" color={primary} />
                <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>
                  Loading liability waiver...
                </Text>
              </View>
            )}
            <WebView
              ref={webViewRef}
              source={{ uri: LIABILITY_URL }}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                if (nativeEvent.statusCode >= 400) {
                  setLoading(false);
                  setError(true);
                }
              }}
              style={{ flex: 1, opacity: loading ? 0 : 1 }}
              startInLoadingState={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
