import React from "react";
import { View, Text, Pressable } from "react-native";
import { Screen } from "../components/Screen";
import { useSettingsStore } from "../state/stores/settingsStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { t } from "../utils/translations";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { BackButton } from "../components/ui";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "FallDetectionSetup">;
};

export default function FallDetectionSetupScreen({ navigation }: Props) {
  const language = useSettingsStore((s) => s.language);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const { colors, primary } = useTheme();

  const handleEnable = () => {
    updateSettings({ fallDetectionEnabled: true });
    // Skip NotificationSettings and SoundsAndHaptics - go directly to MultipleMedications
    navigation.navigate("MultipleMedications");
  };

  const handleSkip = () => {
    updateSettings({ fallDetectionEnabled: false });
    // Skip NotificationSettings and SoundsAndHaptics - go directly to MultipleMedications
    navigation.navigate("MultipleMedications");
  };

  return (
    <Screen variant="scroll" edges={["top", "bottom"]} extraBottomPadding={0}>
      <View className="flex-1 px-10 py-8">
        {/* Back Button */}
        <BackButton label="Back" style={{ marginBottom: 24 }} />

        {/* Content - centered icon and text */}
        <View className="items-center mb-12">
          <View className="rounded-full p-10 mb-10" style={{ backgroundColor: colors.cardBackground }}>
            <Ionicons name="shield-checkmark" size={96} color={primary} />
          </View>
          <Text className="text-4xl font-semibold text-center mb-8 leading-tight" style={{ color: colors.textPrimary }}>
            {t("fallDetectionSetup", language)}
          </Text>
          <Text className="text-2xl text-center leading-loose px-4" style={{ color: colors.textSecondary }}>
            {t("fallDetectionDescription", language)}
          </Text>
        </View>

        {/* Buttons - inside scroll content so user must scroll to reach them */}
        <View className="mt-12 pt-8">
          <Button
            title={t("enableFallDetection", language)}
            onPress={handleEnable}
            variant="primary"
            size="large"
            fullWidth
            icon={<Ionicons name="shield-checkmark" size={36} color="white" />}
            accessibilityLabel={t("enableFallDetection", language)}
            style={{ marginBottom: 20 }}
          />

          <Button
            title={t("skipForNow", language)}
            onPress={handleSkip}
            variant="secondary"
            size="large"
            fullWidth
            accessibilityLabel={t("skipForNow", language)}
          />
        </View>
      </View>
    </Screen>
  );
}
