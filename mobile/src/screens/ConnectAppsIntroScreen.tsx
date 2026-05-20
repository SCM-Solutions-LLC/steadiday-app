import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";
import { useSlowMode } from "../utils/useSlowMode";
import Button from "../components/Button";
import { BackButton } from "../components/ui";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "ConnectAppsIntro">;
};

export default function ConnectAppsIntroScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const { minTouchTarget } = useSlowMode();

  const handleConnectNow = () => {
    navigation.navigate("ConnectAppsChoice");
  };

  const handleSkip = () => {
    // Skip directly to LocationPermission screen
    navigation.navigate("LocationPermission");
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 32, paddingVertical: 24 }}
        showsVerticalScrollIndicator={true}
      >
        {/* Back Button */}
        <BackButton label="Back" style={{ marginBottom: 24 }} />

        <View className="items-center">
          {/* Icon */}
          <View
            className="rounded-full p-8 mb-8"
            style={{ backgroundColor: primary + "20" }}
          >
            <Ionicons name="apps" size={72} color={primary} />
          </View>

          {/* Title - Simplified language */}
          <Text
            className={`${textClasses.largeTitle} text-center mb-6`}
            style={{ color: colors.textPrimary }}
          >
            Bring in your calendars?
          </Text>

          {/* Description */}
          <Text
            className={`${textClasses.subtitle} text-center leading-relaxed mb-8`}
            style={{ color: colors.textSecondary }}
          >
            We can bring your existing info here so everything is in one place.
          </Text>
        </View>

        {/* Integration options list */}
        <View className="rounded-2xl overflow-hidden mb-8" style={{ backgroundColor: colors.cardBackground }}>
          {[
            { icon: "heart" as const, label: "Apple Health", desc: "Steps, heart rate, sleep data", color: "#FF2D55" },
            { icon: "calendar" as const, label: "Apple Calendar", desc: "Events and appointments", color: "#007AFF" },
            { icon: "checkmark-circle" as const, label: "Apple Reminders", desc: "Tasks and to-dos", color: "#FF9500" },
          ].map((item, index) => (
            <View
              key={item.label}
              className="flex-row items-center px-5 py-4"
              style={index < 2 ? { borderBottomWidth: 1, borderBottomColor: colors.divider } : undefined}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: item.color + "18" }}
              >
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View className="flex-1">
                <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
                  {item.label}
                </Text>
                <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View>
          <Button
            title="Yes, connect my apps"
            onPress={handleConnectNow}
            variant="primary"
            size="large"
            fullWidth
            accessibilityLabel="Connect my apps now"
            style={{ marginBottom: 16 }}
          />

          {/* Enhanced Skip Button - Prominent and reassuring */}
          <Pressable
            onPress={handleSkip}
            className="py-5 px-6 rounded-2xl"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 2,
              borderColor: colors.divider,
              minHeight: minTouchTarget,
            }}
            accessibilityRole="button"
            accessibilityLabel="Skip for now, you can connect apps later in Settings"
          >
            <View className="items-center">
              <Text
                className={`${textClasses.subtitle} mb-1`}
                style={{ color: colors.textPrimary }}
              >
                Not right now
              </Text>
              <Text
                className={`${textClasses.body} text-center`}
                style={{ color: colors.textSecondary }}
              >
                You can always do this later in Settings
              </Text>
            </View>
          </Pressable>

          {/* Reassurance note */}
          <View className="flex-row items-center justify-center mt-6">
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text
              className={`${textClasses.body} ml-2`}
              style={{ color: colors.textSecondary }}
            >
              SteadiDay works great on its own
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
