import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, Keyboard, Alert } from "react-native";
import { Screen } from "../components/Screen";
import { SubpageHeader } from "../components/ui";
import { useUserStore } from "../state/stores/userStore";
import { useUIStore } from "../state/stores/uiStore";
import { useTipStore } from "../state/stores/tipStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getTextSizeClasses } from "../utils/textSizes";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { useConfirmModal } from "../components/ConfirmModal";

// Formsubmit.co endpoint - sends to support@steadiday.com
const FEEDBACK_ENDPOINT = "https://formsubmit.co/ajax/support@steadiday.com";

type FeedbackType = "bug" | "suggestion" | "praise" | "question";

export default function FeedbackScreen() {
  const { colors, primary } = useTheme();
  const navigation = useNavigation();

  // Settings from useSettingsStore
  const textSize = useSettingsStore((s) => s.textSize);

  // User data from useUserStore
  const userName = useUserStore((s) => s.userProfile.name);

  // Tip state from useTipStore
  const dismissedInfoCards = useTipStore((s) => s.dismissedInfoCards || []);
  const dismissInfoCard = useTipStore((s) => s.dismissInfoCard);

  // Helper function for checking if card is dismissed
  const isCardDismissed = (cardId: string) => dismissedInfoCards.includes(cardId);
  const textClasses = getTextSizeClasses(textSize);

  const { alert } = useConfirmModal();

  const [selectedType, setSelectedType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes: { id: FeedbackType; label: string; icon: string; color: string; description: string }[] = [
    {
      id: "bug",
      label: "Report a Bug",
      icon: "bug",
      color: "bg-red-600",
      description: "Something not working right?",
    },
    {
      id: "suggestion",
      label: "Suggestion",
      icon: "bulb",
      color: "bg-blue-600",
      description: "Have an idea to improve the app?",
    },
    {
      id: "praise",
      label: "Praise",
      icon: "heart",
      color: "bg-pink-600",
      description: "Tell us what you love!",
    },
    {
      id: "question",
      label: "Question",
      icon: "help-circle",
      color: "bg-purple-600",
      description: "Need help with something?",
    },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert("Message Required", "Please enter your feedback message.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(FEEDBACK_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          _subject: `SteadiDay Feedback: ${selectedType}`,
          _template: "table", // Nice formatted email
          type: selectedType,
          message: message,
          userName: userName || "Anonymous",
          appVersion: "1.0.0",
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Clear the form
        setMessage("");
        setSelectedType("suggestion");

        // Show success alert with navigation back
        Alert.alert(
          "Thank You!",
          "Your feedback has been sent successfully. We appreciate you helping us improve SteadiDay!",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error("Failed to send");
      }
    } catch (error) {
      alert(
        "Couldn't Send",
        "We couldn't send your feedback right now. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTypeInfo = feedbackTypes.find((t) => t.id === selectedType);

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      {/* Header - SENIOR-FRIENDLY: Labeled back button */}
      <SubpageHeader
        title="Send Feedback"
        backLabel="Settings"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable className="flex-1" onPress={Keyboard.dismiss}>
          <ScrollView className="flex-1 px-6 py-6">
            {/* Welcome Message */}
            {!isCardDismissed("feedback-welcome") && (
              <View
                className="rounded-2xl p-6 mb-6"
                style={{
                  backgroundColor: colors.primaryLight,
                  borderWidth: 2,
                  borderColor: primary + "40",
                }}
              >
                <View className="flex-row items-start">
                  <Ionicons name="chatbubbles" size={32} color={primary} />
                  <View className="flex-1 ml-4">
                    <Text className={`${textClasses.subtitle} mb-2`} style={{ color: colors.textPrimary }}>
                      We Value Your Feedback!
                    </Text>
                    <Text className={`${textClasses.body}`} style={{ color: colors.textSecondary }}>
                      Help us make SteadiDay better for you. Share your thoughts, ideas, or report any issues.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => dismissInfoCard("feedback-welcome")}
                    className="p-1 ml-2 active:opacity-50"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={24} color={primary} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Feedback Type Selection */}
            <View className="mb-6">
              <Text className={`${textClasses.subtitle} mb-4`} style={{ color: colors.textPrimary }}>
                What would you like to share?
              </Text>
              <View className="flex-row flex-wrap justify-between">
                {feedbackTypes.map((type) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <Pressable
                      key={type.id}
                      onPress={() => setSelectedType(type.id)}
                      className="w-[48%] mb-3 rounded-2xl p-5 border-2"
                      style={{
                        backgroundColor: isSelected ? colors.primaryLight : colors.cardBackground,
                        borderColor: isSelected ? primary : colors.border,
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                    >
                      <View
                        className={`${isSelected ? type.color : ""} w-12 h-12 rounded-xl items-center justify-center mb-3`}
                        style={!isSelected ? { backgroundColor: colors.background } : {}}
                      >
                        <Ionicons
                          name={type.icon as any}
                          size={24}
                          color={isSelected ? "#ffffff" : colors.textSecondary}
                        />
                      </View>
                      <Text
                        className={`${textClasses.body} font-semibold mb-1`}
                        style={{ color: colors.textPrimary }}
                      >
                        {type.label}
                      </Text>
                      <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                        {type.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Message Input */}
            <View className="mb-6">
              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Your Message
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Tell us more..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className={`px-5 py-4 rounded-2xl ${textClasses.body} min-h-[150px] border-2`}
                style={{
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
                placeholderTextColor={colors.textTertiary || colors.textSecondary}
                accessibilityLabel="Feedback message"
              />
            </View>

            {/* Submit Button */}
            <Button
              title="Submit Feedback"
              onPress={handleSubmit}
              variant="primary"
              size="large"
              fullWidth
              disabled={isSubmitting || !message.trim()}
              loading={isSubmitting}
              icon={!isSubmitting ? <Ionicons name="send" size={24} color="white" /> : undefined}
              style={{ marginBottom: 24 }}
              accessibilityLabel="Submit feedback"
            />

            {/* Contact Info */}
            <View
              className="rounded-2xl p-5 mb-6"
              style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}
            >
              <Text className={`${textClasses.small} text-center`} style={{ color: colors.textSecondary }}>
                Your feedback helps us create a better experience for everyone. Thank you for being part of the SteadiDay community!
              </Text>
            </View>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}
