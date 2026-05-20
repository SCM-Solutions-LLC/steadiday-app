import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Language } from "../types/app";
import { languages, t } from "../utils/translations";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";

export default function LanguageSelectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Settings from useSettingsStore (flat state)
  const language = useSettingsStore((s) => s.language) as Language;
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const { colors, primary } = useTheme();

  // Check if we're in onboarding or settings context
  // Get the parent navigator - if we're inside OnboardingStack, there's a parent
  const parentState = navigation.getParent()?.getState();
  const isOnboarding = parentState?.routes?.some(r => r.name === "OnboardingStack") ||
    navigation.getState()?.routeNames?.includes("Welcome");

  const handleSelectLanguage = (selectedLanguage: Language) => {
    updateSettings({ language: selectedLanguage });
  };

  const handleContinue = () => {
    if (isOnboarding) {
      // @ts-ignore - OnboardingStack navigation
      navigation.navigate("Authentication", { mode: "create" });
    } else {
      // Settings context - just go back
      navigation.goBack();
    }
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1">
        {/* Header with back button for settings context */}
        {!isOnboarding && (
          <View className="px-8 py-6 border-b flex-row items-center" style={{ backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }}>
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
              {t("selectLanguage", language)}
            </Text>
          </View>
        )}

        <ScrollView className="flex-1 px-10 py-12">
          {isOnboarding && (
            <View className="items-center mb-10">
              <View className="rounded-full p-8 mb-8" style={{ backgroundColor: primary + "20" }}>
                <Ionicons name="globe" size={80} color={primary} />
              </View>
              <Text className="text-4xl font-semibold text-center mb-6 leading-tight" style={{ color: colors.textPrimary }}>
                {t("selectLanguage", language)}
              </Text>
              <Text className="text-2xl text-center leading-relaxed" style={{ color: colors.textSecondary }}>
                {t("chooseLanguage", language)}
              </Text>
            </View>
          )}

          <View className="space-y-4">
            {languages.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => handleSelectLanguage(lang.code)}
                className="flex-row items-center justify-between p-8 rounded-3xl border-2"
                style={{
                  backgroundColor: language === lang.code ? primary + "20" : colors.cardBackground,
                  borderColor: language === lang.code ? primary : colors.divider,
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: language === lang.code }}
              >
                <View>
                  <Text className="text-3xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {lang.nativeName}
                  </Text>
                  <Text className="text-xl" style={{ color: colors.textSecondary }}>{lang.name}</Text>
                </View>
                {language === lang.code && (
                  <View className="rounded-full p-3 min-w-[56px] min-h-[56px] items-center justify-center" style={{ backgroundColor: primary }}>
                    <Ionicons name="checkmark" size={32} color="white" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {isOnboarding && (
          <View className="px-10 pb-10">
            <Button
              title={t("continue", language)}
              onPress={handleContinue}
              variant="primary"
              size="large"
              fullWidth
              accessibilityLabel={t("continue", language)}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
