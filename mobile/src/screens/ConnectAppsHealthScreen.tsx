import React from "react";
import { View, Text, Pressable, ScrollView, Platform } from "react-native";
import { Screen } from "../components/Screen";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "../state/stores/uiStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { BackButton } from "../components/ui";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "ConnectAppsHealth">;
};

export default function ConnectAppsHealthScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();

  const connectedApps = useUIStore((s) => s.connectedApps);
  const healthApps = connectedApps.filter((app) => app.category === "health" && app.isInstalled);
  const appleHealthConnected = useSubscriptionStore((s) => s.appleHealthConnected);

  const isIOS = Platform.OS === "ios";
  const healthSourceName = isIOS ? "Apple Health" : "Health Connect (Google's health data app)";
  const healthSourceShort = isIOS ? "Apple Health" : "Health Connect";
  const wearableName = isIOS ? "Apple Watch" : "your fitness tracker";
  const settingsPath = isIOS
    ? "iPhone Settings \u2192 Health \u2192 SteadiDay"
    : "phone Settings \u2192 Health Connect";

  const handleAppPress = (appId: string) => {
    navigation.navigate("ConnectAppsDetail", { appId });
  };

  const handleAddApp = () => {
    navigation.navigate("ConnectAppsAdd");
  };

  const handleAutoDetect = () => {
    navigation.navigate("ConnectAppsAutoDetect", { category: "health" });
  };

  const handleDone = () => {
    navigation.navigate("LanguageSelection");
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1">
        <ScrollView className="flex-1 px-10 py-12">
          <BackButton label="Back" style={{ marginBottom: 24 }} />

          <Text className="text-4xl font-semibold text-center mb-6 leading-tight" style={{ color: colors.textPrimary }}>
            Connect health apps
          </Text>
          <Text className="text-2xl text-center mb-10 leading-relaxed" style={{ color: colors.textSecondary }}>
            Choose the health apps you use.
          </Text>

          {/* What we read from health source */}
          <View
            style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
            className="rounded-3xl p-6 mb-6 border-2"
            accessibilityRole="text"
            accessibilityLabel={`What SteadiDay reads from ${healthSourceShort}`}
          >
            <Text className="text-xl font-semibold mb-4" style={{ color: colors.textPrimary }}>
              {`What we'll read from ${healthSourceName}`}
            </Text>

            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.successBackground }}>
                <Ionicons name="footsteps" size={20} color={colors.success} />
              </View>
              <Text className="text-lg" style={{ color: colors.textPrimary }}>Steps and movement</Text>
            </View>

            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.infoBackground }}>
                <Ionicons name="moon" size={20} color={colors.info} />
              </View>
              <Text className="text-lg" style={{ color: colors.textPrimary }}>Sleep</Text>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.errorBackground }}>
                <Ionicons name="heart" size={20} color={colors.error} />
              </View>
              <Text className="text-lg" style={{ color: colors.textPrimary }}>Heart rate</Text>
            </View>

            <Text className="text-base leading-relaxed" style={{ color: colors.textSecondary }}>
              {`We read your activity. We never write or share it. You can change access anytime in ${settingsPath}.`}
            </Text>
          </View>

          {/* After you allow access */}
          <View
            style={{ backgroundColor: colors.infoBackground, borderColor: colors.info }}
            className="rounded-3xl p-6 mb-8 border"
            accessibilityRole="text"
            accessibilityLabel={`Steps after you allow ${healthSourceShort} access`}
          >
            <Text className="text-xl font-semibold mb-4" style={{ color: colors.textPrimary }}>
              After you allow access
            </Text>

            <Text className="text-base mb-4 leading-relaxed" style={{ color: colors.textSecondary }}>
              We read your activity. We never write or share it.
            </Text>

            <View className="flex-row items-start mb-3">
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: primary }}>
                <Text className="text-sm font-bold text-white">1</Text>
              </View>
              <Text className="text-lg flex-1 leading-relaxed" style={{ color: colors.textPrimary }}>
                {isIOS ? "Apple will ask which data to share \u2014 tap " : "Android will ask which data to share \u2014 tap "}
                <Text className="font-bold">{isIOS ? "Turn On All" : "Allow All"}</Text>.
              </Text>
            </View>

            <View className="flex-row items-start mb-3">
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: primary }}>
                <Text className="text-sm font-bold text-white">2</Text>
              </View>
              <Text className="text-lg flex-1 leading-relaxed" style={{ color: colors.textPrimary }}>
                {`Wear ${wearableName} to start collecting heart rate and sleep.`}
              </Text>
            </View>

            <View className="flex-row items-start">
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: primary }}>
                <Text className="text-sm font-bold text-white">3</Text>
              </View>
              <Text className="text-lg flex-1 leading-relaxed" style={{ color: colors.textPrimary }}>
                {"Insights get better over the first 3\u20137 days."}
              </Text>
            </View>
          </View>

          {/* Health apps list */}
          <View className="space-y-4">
            {healthApps.map((app) => (
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
                    <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: colors.primaryLight }}>
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
              accessibilityLabel="Auto detect health apps"
            >
              <Text className="text-xl font-semibold" style={{ color: primary }}>
                Auto detect health apps
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
            title={appleHealthConnected ? "Done" : `Connect to ${healthSourceShort}`}
            onPress={handleDone}
            variant="primary"
            size="large"
            fullWidth
            accessibilityLabel={appleHealthConnected ? "Done" : `Connect to ${healthSourceShort}`}
          />
        </View>
      </View>
    </Screen>
  );
}
