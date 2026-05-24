import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Screen } from "../components/Screen";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "../state/stores/uiStore";
import { detectInstalledApps, getInstalledApps } from "../utils/appDetection";
import { ConnectedApp } from "../types/app";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import CustomSwitch from "../components/CustomSwitch";
import { BackButton } from "../components/ui";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "ConnectAppsAutoDetect">;
  route: RouteProp<OnboardingStackParamList, "ConnectAppsAutoDetect">;
};

export default function ConnectAppsAutoDetectScreen({ navigation, route }: Props) {
  const { colors, primary } = useTheme();
  const { category } = route.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [detectedApps, setDetectedApps] = useState<ConnectedApp[]>([]);

  // UI state from useUIStore
  const connectedApps = useUIStore((s) => s.connectedApps);
  const toggleAppConnection = useUIStore((s) => s.toggleAppConnection);

  useEffect(() => {
    const detectApps = async () => {
      setIsLoading(true);
      // Detect which apps are installed
      const appsWithInstallStatus = await detectInstalledApps(connectedApps);
      // Filter to only show installed apps
      let installed = getInstalledApps(appsWithInstallStatus);

      // Filter by category if provided
      if (category) {
        installed = installed.filter((app) => app.category === category);
      }

      setDetectedApps(installed);
      setIsLoading(false);
    };

    detectApps();
  }, [category]);

  const handleDone = () => {
    navigation.navigate("LocationPermission");
  };

  if (isLoading) {
    return (
      <Screen variant="static" edges={["top", "bottom"]}>
        <View className="flex-1 justify-center items-center px-10">
          <ActivityIndicator size="large" color={primary} />
          <Text className="text-2xl text-center mt-8 leading-relaxed" style={{ color: colors.textSecondary }}>
            Looking for apps you already use…
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1">
        <ScrollView className="flex-1 px-10 py-12">
          {/* Back Button */}
          <BackButton label="Back" style={{ marginBottom: 24 }} />

          <Text className="text-4xl font-semibold text-center mb-6 leading-tight" style={{ color: colors.textPrimary }}>
            Found {detectedApps.length} {detectedApps.length === 1 ? "app" : "apps"}
          </Text>
          <Text className="text-2xl text-center mb-10 leading-relaxed" style={{ color: colors.textSecondary }}>
            {detectedApps.length > 0
              ? "Turn on the ones you want to connect."
              : "No supported apps found on your device."}
          </Text>

          {detectedApps.length > 0 && (
            <View className="space-y-4">
              {detectedApps.map((app) => (
                <View
                  key={app.id}
                  className="rounded-3xl p-6"
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderWidth: 2,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center">
                    <View className="flex-row items-center flex-1">
                      <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: primary + "20" }}>
                        <Ionicons name={app.icon as any} size={28} color={primary} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                          {app.name}
                        </Text>
                        <Text className="text-base mt-1" style={{ color: colors.success }}>
                          Installed
                        </Text>
                      </View>
                    </View>
                    <CustomSwitch
                      value={app.isConnected}
                      onValueChange={(value: boolean) => toggleAppConnection(app.id)}
                      inactiveTrackColor={colors.border}
                      activeTrackColor="#A3D4C1"
                      activeThumbColor="#FFFFFF"
                      inactiveThumbColor="#FFFFFF"
                      accessibilityLabel={`Connect ${app.name}`}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Info Card about app detection */}
        <View className="px-10 pb-4">
          <View className="rounded-2xl p-4" style={{ backgroundColor: primary + "20" }}>
            <View className="flex-row items-center">
              <Ionicons name="information-circle" size={20} color={primary} />
              <Text className="text-sm ml-2 flex-1 leading-relaxed" style={{ color: colors.textSecondary }}>
                Some apps may not appear due to privacy restrictions.
              </Text>
            </View>
          </View>
        </View>

        <View className="px-10 pb-10">
          <Button
            title="Done"
            onPress={handleDone}
            variant="primary"
            size="large"
            fullWidth
            accessibilityLabel="Done"
          />
        </View>
      </View>
    </Screen>
  );
}
