import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "../state/stores/uiStore";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { BackButton } from "../components/ui";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "ConnectAppsCalendar">;
};

export default function ConnectAppsCalendarScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();

  // UI state from useUIStore
  const connectedApps = useUIStore((s) => s.connectedApps);
  const calendarApps = connectedApps.filter((app) => app.category === "calendar" && app.isInstalled);

  const handleAppPress = (appId: string) => {
    navigation.navigate("ConnectAppsDetail", { appId });
  };

  const handleAddApp = () => {
    navigation.navigate("ConnectAppsAdd");
  };

  const handleAutoDetect = () => {
    navigation.navigate("ConnectAppsAutoDetect", { category: "calendar" });
  };

  const handleDone = () => {
    navigation.navigate("LanguageSelection");
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1">
        <ScrollView className="flex-1 px-10 py-12">
          {/* Back Button */}
          <BackButton label="Back" style={{ marginBottom: 24 }} />

          <Text className="text-4xl font-semibold text-center mb-6 leading-tight" style={{ color: colors.textPrimary }}>
            Connect calendar apps
          </Text>
          <Text className="text-2xl text-center mb-10 leading-relaxed" style={{ color: colors.textSecondary }}>
            Connect your calendar and reminders to stay on track.
          </Text>

          <View className="space-y-4">
            {calendarApps.map((app) => (
              <Pressable
                key={app.id}
                onPress={() => handleAppPress(app.id)}
                className="rounded-3xl p-6"
                style={({ pressed }) => ({
                  backgroundColor: pressed ? primary + "20" : colors.cardBackground,
                  borderWidth: 2,
                  borderColor: colors.border,
                })}
                accessibilityRole="button"
                accessibilityLabel={app.name}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: primary + "20" }}>
                      <Ionicons name={app.icon as any} size={28} color={primary} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                        {app.name}
                      </Text>
                      {app.isConnected && (
                        <Text className="text-base mt-1" style={{ color: colors.success }}>
                          Connected
                        </Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={28} color={colors.textSecondary} />
                </View>
              </Pressable>
            ))}
          </View>

          <View className="mt-6 space-y-4">
            <Pressable
              onPress={handleAutoDetect}
              className="items-center py-4"
              accessibilityRole="button"
              accessibilityLabel="Auto detect calendar apps"
            >
              <Text className="text-xl font-semibold" style={{ color: primary }}>
                Auto detect calendar apps
              </Text>
            </Pressable>

            <Pressable
              onPress={handleAddApp}
              className="items-center py-4"
              accessibilityRole="button"
              accessibilityLabel="Add another app not on the list"
            >
              <Text className="text-xl font-semibold" style={{ color: primary }}>
                Add another app not on the list
              </Text>
            </Pressable>
          </View>
        </ScrollView>

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
