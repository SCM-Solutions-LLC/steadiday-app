import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { TextSize } from "../types/app";
import Button from "../components/Button";

const TEXT_SIZE_OPTIONS: Array<{ value: TextSize; label: string; previewSize: number }> = [
  { value: "normal", label: "Normal", previewSize: 16 },
  { value: "large", label: "Large", previewSize: 18 },
  { value: "extra-large", label: "Extra Large", previewSize: 22 },
];

export default function TextSizeSelectionScreen() {
  const navigation = useNavigation<any>();
  const textSize = useSettingsStore((s) => s.textSize);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const { colors, primary } = useTheme();

  const parentState = navigation.getParent()?.getState();
  const currentState = navigation.getState();
  const isOnboarding =
    parentState?.routes?.some((r: any) => r.name === "OnboardingStack") ||
    currentState?.routeNames?.includes("Welcome");

  const handleSelect = (size: TextSize) => {
    updateSettings({ textSize: size });
  };

  const handleContinue = () => {
    if (isOnboarding) {
      navigation.navigate("LanguageSelection");
    } else {
      navigation.goBack();
    }
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1">
        {!isOnboarding && (
          <View
            className="px-8 py-6 border-b flex-row items-center"
            style={{ backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              className="mr-4 p-2 active:opacity-50"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={28} color={primary} />
            </Pressable>
            <Text className="text-3xl font-semibold" style={{ color: colors.textPrimary }}>
              Choose Your Text Size
            </Text>
          </View>
        )}

        <ScrollView className="flex-1 px-10 py-12">
          {isOnboarding && (
            <View className="items-center mb-10">
              <View className="rounded-full p-8 mb-8" style={{ backgroundColor: primary + "20" }}>
                <Ionicons name="text" size={80} color={primary} />
              </View>
              <Text
                className="text-4xl font-semibold text-center mb-6 leading-tight"
                style={{ color: colors.textPrimary }}
              >
                Choose Your Text Size
              </Text>
              <Text
                className="text-2xl text-center leading-relaxed"
                style={{ color: colors.textSecondary }}
              >
                Pick the size that is easiest for you to read. You can change this anytime in Settings.
              </Text>
            </View>
          )}

          <View className="space-y-4">
            {TEXT_SIZE_OPTIONS.map((opt) => {
              const isSelected = textSize === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleSelect(opt.value)}
                  className="flex-row items-center justify-between p-8 rounded-3xl border-2 mb-4"
                  style={{
                    backgroundColor: isSelected ? primary + "20" : colors.cardBackground,
                    borderColor: isSelected ? primary : colors.divider,
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`Select ${opt.label} text size`}
                >
                  <View className="flex-1">
                    <Text
                      className="font-semibold mb-2"
                      style={{ color: colors.textPrimary, fontSize: opt.previewSize + 6 }}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={{ color: colors.textSecondary, fontSize: opt.previewSize }}
                    >
                      This is how text will look
                    </Text>
                  </View>
                  {isSelected && (
                    <View
                      className="rounded-full p-3 min-w-[56px] min-h-[56px] items-center justify-center ml-4"
                      style={{ backgroundColor: primary }}
                    >
                      <Ionicons name="checkmark" size={32} color="white" />
                    </View>
                  )}
                </Pressable>
              );
            })}
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
  );
}
