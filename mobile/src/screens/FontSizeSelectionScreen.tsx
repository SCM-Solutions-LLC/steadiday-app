import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { useSettingsStore } from "../state/stores/settingsStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { TextSize } from "../types/app";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { BackButton, ScreenErrorBoundary } from "../components/ui";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "Welcome">;
};

const fontSizes: { value: TextSize; label: string; description: string }[] = [
  { value: "normal", label: "Normal", description: "Standard size for most users" },
  { value: "large", label: "Large", description: "Easier to read" },
  { value: "extra-large", label: "Extra Large", description: "Maximum readability" },
];

export default function FontSizeSelectionScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const setTextSize = useSettingsStore((s) => s.setTextSize);
  const [continuePressed, setContinuePressed] = useState(false);

  const handleContinue = () => {
    navigation.navigate("ConnectAppsIntro");
  };

  const getTextSizeForPreview = (size: TextSize) => {
    switch (size) {
      case "normal":
        return "text-xl";
      case "large":
        return "text-2xl";
      case "extra-large":
        return "text-3xl";
    }
  };

  return (
    <ScreenErrorBoundary screenName="FontSizeSelection">
      <Screen variant="static" edges={["top", "bottom"]}>
        <View className="flex-1">
        <ScrollView className="flex-1 px-10 py-8">
          {/* Back Button */}
          <BackButton label="Back" style={{ marginBottom: 24 }} />

          <View className="items-center mb-6">
            <View className="rounded-full p-6 mb-4" style={{ backgroundColor: primary + "20" }}>
              <Ionicons name="text" size={60} color={primary} />
            </View>
            <Text className="text-3xl font-semibold text-center mb-3 leading-tight" style={{ color: colors.textPrimary }}>
              Choose Your Text Size
            </Text>
            <Text className="text-xl text-center leading-relaxed" style={{ color: colors.textSecondary }}>
              Select the size that is most comfortable for you
            </Text>
          </View>

          <View className="space-y-4">
            {fontSizes.map((size) => (
              <Pressable
                key={size.value}
                onPress={() => setTextSize(size.value)}
                className="p-8 rounded-3xl border-2"
                style={{
                  backgroundColor: textSize === size.value ? primary + "20" : colors.cardBackground,
                  borderColor: textSize === size.value ? primary : colors.border,
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: textSize === size.value }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>
                    {size.label}
                  </Text>
                  {textSize === size.value && (
                    <View className="rounded-full p-2 min-w-[40px] min-h-[40px] items-center justify-center" style={{ backgroundColor: primary }}>
                      <Ionicons name="checkmark" size={24} color="white" />
                    </View>
                  )}
                </View>

                {/* Live Preview Text */}
                <View className="rounded-2xl p-6 border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                  <Text className={`${getTextSizeForPreview(size.value)} font-medium mb-2`} style={{ color: colors.textPrimary }}>
                    Sample Text
                  </Text>
                  <Text className={getTextSizeForPreview(size.value)} style={{ color: colors.textSecondary }}>
                    This is how your reminders will look
                  </Text>
                </View>

                <Text className="text-lg mt-3" style={{ color: colors.textSecondary }}>
                  {size.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View className="px-10 pb-10">
          <Button
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            size="large"
            fullWidth
            accessibilityLabel="Continue"
          />
        </View>
      </View>
      </Screen>
    </ScreenErrorBoundary>
  );
}
