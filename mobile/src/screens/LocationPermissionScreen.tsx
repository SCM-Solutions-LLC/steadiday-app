import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";
import Button from "../components/Button";
import { BackButton } from "../components/ui";
import { logger } from "../utils/logger";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "LocationPermission">;
};

export default function LocationPermissionScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const handleEnableLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        updateSettings({ useDeviceLocation: true });
      }
      setPermissionRequested(true);
    } catch (error) {
      logger.error("Error requesting location permission:", error);
      setPermissionRequested(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigation.navigate("EmergencyContact");
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]} extraBottomPadding={0}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 40, paddingTop: 32, paddingBottom: 60 }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <BackButton label="Back" style={{ marginBottom: 16 }} />

        {/* Content */}
        <View className="items-center mb-6">
          <View className="rounded-full p-6 mb-6" style={{ backgroundColor: colors.cardBackground }}>
            <Ionicons name="location" size={64} color={primary} />
          </View>
          <Text className={`${textClasses.largeTitle} text-center mb-4 leading-tight`} style={{ color: colors.textPrimary }}>
            Location Services
          </Text>
          <Text className={`${textClasses.subtitle} text-center leading-loose px-4`} style={{ color: colors.textSecondary }}>
            Your location helps trusted contacts find you quickly
          </Text>
          <Text className={`${textClasses.body} text-center leading-relaxed mt-3 px-4`} style={{ color: colors.textTertiary }}>
            We only use your location for weather and trusted contacts.
          </Text>
        </View>

        {/* Explanation Card */}
        <View
          className="rounded-2xl p-4 mb-4"
          style={{
            backgroundColor: colors.primaryLight,
            borderWidth: 1,
            borderColor: primary
          }}
        >
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={24} color={primary} />
            <View className="flex-1 ml-3">
              <Text className={`${textClasses.subtitle} mb-2`} style={{ color: colors.textPrimary }}>
                How it works
              </Text>
              <Text className={`${textClasses.body} leading-relaxed`} style={{ color: colors.textSecondary }}>
                When you use the SOS button, your location is automatically shared with your trusted contacts via SMS so they know exactly where you are.
              </Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View className="mt-8 pt-4">
          <Button
            title="Continue"
            onPress={permissionRequested ? handleContinue : handleEnableLocation}
            variant="primary"
            size="large"
            fullWidth
            loading={isLoading}
            icon={!isLoading ? <Ionicons name={permissionRequested ? "arrow-forward" : "location"} size={28} color="white" /> : undefined}
            accessibilityLabel={permissionRequested ? "Continue to next step" : "Continue to enable location services"}
            style={{ marginBottom: 12 }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
