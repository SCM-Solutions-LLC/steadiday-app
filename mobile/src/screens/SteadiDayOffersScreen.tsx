import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { BackButton } from "../components/ui";

// v1.0: This screen is not registered in navigation (IAP disabled).
// Kept for future use when IAP is re-enabled. Using a loose navigation type to avoid TS errors.
type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList>;
};

// Essentials plan features (available to all users)
const essentialsFeatures = [
  {
    icon: "checkbox-outline",
    title: "Track Daily Tasks",
    description: "Keep track of your appointments, errands, and daily activities with easy reminders",
  },
  {
    icon: "medical-outline",
    title: "Medication Management",
    description: "Never miss a dose with medication reminders and tracking",
  },
  {
    icon: "people-outline",
    title: "Trusted Contacts",
    description: "Quick access to your trusted contacts when you need them most",
  },
  {
    icon: "alert-circle-outline",
    title: "SOS & Fall Detection",
    description: "Get help quickly with one-tap SOS and optional fall detection alerts",
  },
  {
    icon: "card-outline",
    title: "Insurance Cards",
    description: "Store and access your insurance cards anytime",
  },
  {
    icon: "medical-outline",
    title: "My Doctors",
    description: "Keep your healthcare providers organized in one place",
  },
];

// Premium-only features
const premiumFeaturesList = [
  {
    icon: "heart-outline",
    title: "Health Monitoring",
    description: "View your health metrics and sync with Apple Health",
  },
  {
    icon: "construct-outline",
    title: "Helpful Tools",
    description: "Use magnifier, flashlight, parking locator, and more everyday tools",
  },
  {
    icon: "sparkles-outline",
    title: "Mind Breaks",
    description: "Relaxing activities to help you unwind and destress",
  },
  {
    icon: "gift-outline",
    title: "Early Access to New Features",
    description: "Be the first to access all future features and updates",
  },
];

export default function SteadiDayOffersScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();

  const handleContinue = () => {
    // Navigate to Legal Consent screen first before user info
    navigation.navigate("LegalConsent");
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

        {/* Header */}
        <View className="items-center mb-8">
          <View
            style={{
              backgroundColor: colors.primaryLight,
              borderRadius: 999,
              padding: 20,
              marginBottom: 20,
              borderWidth: 3,
              borderColor: primary,
            }}
          >
            <Ionicons name="sparkles" size={56} color={primary} />
          </View>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: colors.textPrimary,
              textAlign: "center",
              marginBottom: 12,
              lineHeight: 38,
            }}
          >
            What SteadiDay Offers
          </Text>
          <Text
            style={{
              fontSize: 18,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 26,
              paddingHorizontal: 8,
            }}
          >
            Your personal assistant for daily wellness and peace of mind
          </Text>
        </View>

        {/* Essentials Features List */}
        <View className="mb-6">
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.textSecondary,
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Included Free
          </Text>
          {essentialsFeatures.map((feature, index) => (
            <View
              key={index}
              style={{
                backgroundColor: colors.cardBackground,
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "flex-start",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  backgroundColor: colors.primaryLight,
                  borderRadius: 16,
                  padding: 12,
                  marginRight: 16,
                }}
              >
                <Ionicons name={feature.icon as any} size={28} color={primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  {feature.title}
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.textSecondary,
                    lineHeight: 22,
                  }}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Premium Features Section */}
        <View className="mb-8">
          <View
            style={{
              backgroundColor: colors.premium + "15",
              borderRadius: 24,
              padding: 24,
              borderWidth: 2,
              borderColor: colors.premium,
            }}
          >
            <View className="flex-row items-center mb-4">
              <View
                style={{
                  backgroundColor: colors.premium,
                  borderRadius: 12,
                  padding: 10,
                  marginRight: 14,
                }}
              >
                <Ionicons name="star" size={24} color={colors.onPremium} />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.textPrimary,
                }}
              >
                Unlock with Premium
              </Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                lineHeight: 22,
                marginBottom: 16,
              }}
            >
              Get the most out of SteadiDay with these premium features:
            </Text>
            {premiumFeaturesList.map((feature, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.premium + "40",
                    borderRadius: 10,
                    padding: 8,
                    marginRight: 12,
                  }}
                >
                  <Ionicons name={feature.icon as any} size={20} color={colors.premium} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginBottom: 2,
                    }}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      lineHeight: 20,
                    }}
                  >
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Spacing for Button */}
        <View className="h-4" />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={{ paddingHorizontal: 32, paddingBottom: 24, backgroundColor: colors.background }}>
        <Button
          title="Get Started"
          onPress={handleContinue}
          variant="primary"
          size="large"
          fullWidth
          accessibilityLabel="Continue to setup"
        />
      </View>
    </Screen>
  );
}
