import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Screen } from "../components/Screen";
import { SubpageHeader } from "../components/ui";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTipStore } from "../state/stores/tipStore";
import { useTheme } from "../utils/useTheme";
import { openPrivacyPolicy, openSecurity, openTermsOfService, openWebsite } from "../utils/openURL";

export default function LegalPrivacyScreen() {
  const navigation = useNavigation();
  const { colors, primary } = useTheme();

  // Tip state from useTipStore
  const dismissedInfoCards = useTipStore((s) => s.dismissedInfoCards || []);
  const dismissInfoCard = useTipStore((s) => s.dismissInfoCard);

  const isCardDismissed = (cardId: string) => dismissedInfoCards.includes(cardId);

  const legalItems = [
    {
      id: "privacy",
      title: "Privacy Policy",
      summary: "How we collect, use, and protect your personal information and health data.",
      icon: "shield-checkmark",
      color: "#2F80ED",
      screen: "PrivacyPolicy",
      externalAction: openPrivacyPolicy,
    },
    {
      id: "terms",
      title: "Terms of Service",
      summary: "The rules and guidelines for using SteadiDay safely and responsibly.",
      icon: "document-text",
      color: "#6DB193",
      screen: "TermsOfService",
      externalAction: openTermsOfService,
    },
    {
      id: "waiver",
      title: "Liability Waiver",
      summary: "Important limits on what SteadiDay can and cannot do for your health and safety.",
      icon: "alert-circle",
      color: "#F59E0B",
      screen: "LiabilityWaiver",
    },
    {
      id: "security",
      title: "Security Statement",
      summary: "How we keep your data safe with encryption and security best practices.",
      icon: "lock-closed",
      color: "#8B5CF6",
      screen: "SecurityStatement",
      externalAction: openSecurity,
    },
    {
      id: "retention",
      title: "Data Retention Policy",
      summary: "How long we keep your data and when it is deleted.",
      icon: "time",
      color: "#EC4899",
      screen: "DataRetentionPolicy",
    },
    {
      id: "breach",
      title: "Data Breach Response",
      summary: "Our plan for responding quickly if your data is ever compromised.",
      icon: "warning",
      color: "#CC3A3A",
      screen: "DataBreachResponse",
    },
  ];

  return (
    <Screen variant="static" edges={["top"]}>
      <View className="flex-1">
        {/* Header - SENIOR-FRIENDLY: Labeled back button */}
        <SubpageHeader
          title="Legal & Privacy"
          backLabel="Settings"
          onBack={() => navigation.goBack()}
        />

        <ScrollView className="flex-1 px-6 py-4">
          <Text className="text-base leading-relaxed mb-6" style={{ color: colors.textSecondary }}>
            Your privacy and security are important to us. Tap any item below to read the full details.
          </Text>

          {legalItems.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate(item.screen as never)}
              className="rounded-2xl p-4 mb-3"
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.border : colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
              })}
              accessibilityRole="button"
              accessibilityLabel={`View ${item.title}`}
            >
              <View className="flex-row items-start">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>
                    {item.title}
                  </Text>
                  <Text className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                    {item.summary}
                  </Text>
                  {/* External link option for items with website versions */}
                  {item.externalAction && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        item.externalAction?.();
                      }}
                      className="flex-row items-center mt-2 active:opacity-70"
                      accessibilityRole="link"
                      accessibilityLabel={`View ${item.title} on website`}
                      accessibilityHint="Opens in browser"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="globe-outline" size={16} color={primary} style={{ marginRight: 4 }} />
                      <Text className="text-sm font-medium" style={{ color: primary }}>
                        View on Website
                      </Text>
                    </Pressable>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} style={{ marginLeft: 8 }} />
              </View>
            </Pressable>
          ))}

          {/* Visit Our Website Section */}
          <View className="mt-4 mb-2">
            <Text className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
              Our Website
            </Text>
          </View>
          <Pressable
            onPress={openWebsite}
            className="rounded-2xl p-4 mb-3"
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.border : colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            })}
            accessibilityRole="link"
            accessibilityLabel="Visit SteadiDay website"
            accessibilityHint="Opens www.steadiday.com in browser"
          >
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: `${primary}20` }}
              >
                <Ionicons name="globe" size={24} color={primary} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>
                  Visit Our Website
                </Text>
                <Text className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                  www.steadiday.com
                </Text>
              </View>
              <Ionicons name="open-outline" size={24} color={colors.textSecondary} style={{ marginLeft: 8 }} />
            </View>
          </Pressable>

          {!isCardDismissed("legal-privacy-info") && (
            <View className="rounded-2xl p-4 mt-4 mb-6" style={{ backgroundColor: primary + "20" }}>
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={24} color={primary} style={{ marginRight: 12, marginTop: 2 }} />
                <Text className="text-sm leading-relaxed flex-1" style={{ color: colors.textPrimary }}>
                  These documents explain your rights and our responsibilities. You can access them anytime from Settings.
                </Text>
                <Pressable
                  onPress={() => dismissInfoCard("legal-privacy-info")}
                  className="p-1 active:opacity-50"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss legal privacy info"
                >
                  <Ionicons name="close" size={24} color={primary} />
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}
