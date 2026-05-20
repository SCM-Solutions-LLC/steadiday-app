import React, { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from "react-native";
import { Screen } from "../components/Screen";
import { useUserStore } from "../state/stores/userStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { BackButton } from "../components/ui";
import { OnboardingProgress } from "../components/OnboardingProgress";

// Total onboarding steps after authentication (streamlined flow)
const TOTAL_ONBOARDING_STEPS = 5;

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "UserName">;
};

export default function UserNameScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [dateFormat] = useState<"MDY" | "DMY">("MDY"); // Default to US format
  const setUserBirthday = useUserStore((s) => s.setUserBirthday);

  const handleContinue = () => {
    // Save birthday if provided - store in YYYY-MM-DD format regardless of input format
    if (month && day && year) {
      // Always stored as YYYY-MM-DD, variables month and day contain correct values
      const birthday = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      setUserBirthday(birthday);
    }

    // Navigate to LocationPermission screen
    navigation.navigate("LocationPermission");
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <OnboardingProgress currentStep={1} totalSteps={TOTAL_ONBOARDING_STEPS} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 40, paddingVertical: 32, flexGrow: 1 }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
            {/* Back Button */}
            <BackButton label="Back" style={{ marginBottom: 24 }} />

            <Text style={{ color: colors.textPrimary }} className="text-3xl font-semibold text-center mb-6">
              A little about you
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-xl text-center mb-12 leading-relaxed">
              This helps us personalize your experience
            </Text>

            {/* Birthday Fields */}
            <Text style={{ color: colors.textPrimary }} className="text-xl font-semibold mb-3">
              Birthday (Optional)
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-base mb-3">
              {dateFormat === "DMY" ? "DD/MM/YYYY" : "MM/DD/YYYY"}
            </Text>
            <View className="flex-row mb-8 space-x-3">
              <View className="flex-1">
                <TextInput
                  value={dateFormat === "DMY" ? day : month}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 2);
                    dateFormat === "DMY" ? setDay(cleaned) : setMonth(cleaned);
                  }}
                  placeholder={dateFormat === "DMY" ? "DD" : "MM"}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={{
                    backgroundColor: colors.cardBackground,
                    color: colors.textPrimary,
                    borderColor: colors.inputBorder,
                    paddingHorizontal: 16,
                    paddingVertical: 20,
                    borderRadius: 16,
                    fontSize: 20,
                    borderWidth: 1.5,
                    textAlign: "center"
                  }}
                  placeholderTextColor={colors.inputPlaceholder}
                />
              </View>
              <View className="flex-1">
                <TextInput
                  value={dateFormat === "DMY" ? month : day}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 2);
                    dateFormat === "DMY" ? setMonth(cleaned) : setDay(cleaned);
                  }}
                  placeholder={dateFormat === "DMY" ? "MM" : "DD"}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={{
                    backgroundColor: colors.cardBackground,
                    color: colors.textPrimary,
                    borderColor: colors.inputBorder,
                    paddingHorizontal: 16,
                    paddingVertical: 20,
                    borderRadius: 16,
                    fontSize: 20,
                    borderWidth: 1.5,
                    textAlign: "center"
                  }}
                  placeholderTextColor={colors.inputPlaceholder}
                />
              </View>
              <View className="flex-[1.5]">
                <TextInput
                  value={year}
                  onChangeText={(text) => setYear(text.replace(/[^0-9]/g, "").slice(0, 4))}
                  placeholder="YYYY"
                  keyboardType="number-pad"
                  maxLength={4}
                  style={{
                    backgroundColor: colors.cardBackground,
                    color: colors.textPrimary,
                    borderColor: colors.inputBorder,
                    paddingHorizontal: 16,
                    paddingVertical: 20,
                    borderRadius: 16,
                    fontSize: 20,
                    borderWidth: 1.5,
                    textAlign: "center"
                  }}
                  placeholderTextColor={colors.inputPlaceholder}
                />
              </View>
            </View>

            {/* Spacer to push button to bottom */}
            <View style={{ flex: 1, minHeight: 32 }} />

            <Button
              title="Continue"
              onPress={handleContinue}
              variant="primary"
              size="large"
              fullWidth
              accessibilityLabel="Continue"
            />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
