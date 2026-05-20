import React from "react";
import { View, Text, Pressable } from "react-native";
import { Screen } from "../components/Screen";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "ConnectAppsConfirmation">;
  route: RouteProp<OnboardingStackParamList, "ConnectAppsConfirmation">;
};

export default function ConnectAppsConfirmationScreen({ navigation, route }: Props) {
  const { colors, primary } = useTheme();
  const { fromCategory } = route.params || {};

  const handleBackToConnections = () => {
    if (fromCategory === "health") {
      navigation.navigate("ConnectAppsHealth");
    } else if (fromCategory === "medication") {
      navigation.navigate("ConnectAppsMedication");
    } else if (fromCategory === "calendar") {
      navigation.navigate("ConnectAppsCalendar");
    } else {
      navigation.navigate("ConnectAppsChoice");
    }
  };

  const handleContinue = () => {
    navigation.navigate("MultipleTasksScreen");
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1 px-10 py-12 justify-between">
        <View className="flex-1 justify-center items-center">
          <View className="rounded-full p-10 mb-10" style={{ backgroundColor: "#E5F4EF" }}>
            <Ionicons name="checkmark-circle" size={88} color="#6DB193" />
          </View>

          <Text className="text-4xl font-semibold text-center mb-8 leading-tight" style={{ color: colors.textPrimary }}>
            You are all set
          </Text>

          <Text className="text-2xl text-center leading-relaxed px-4" style={{ color: colors.textSecondary }}>
            Your app is now connected. You can add more apps or continue with setup.
          </Text>
        </View>

        <View>
          <Button
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            size="large"
            fullWidth
            accessibilityLabel="Continue with setup"
            style={{ marginBottom: 16 }}
          />

          <Button
            title="Connect more apps"
            onPress={handleBackToConnections}
            variant="outline"
            size="large"
            fullWidth
            accessibilityLabel="Connect more apps"
          />
        </View>
      </View>
    </Screen>
  );
}
