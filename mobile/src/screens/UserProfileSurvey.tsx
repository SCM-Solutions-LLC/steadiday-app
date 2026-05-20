import React, { useState, useCallback } from "react";
import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";
import {
  setSurveyStatus,
  saveUserProfile,
} from "../utils/userProfileStorage";
import {
  EVENTS,
  trackProfileSurveyQuestion,
  trackProfileSurveyComplete,
} from "../utils/analytics";
interface UserProfileSurveyProps {
  visible: boolean;
  onClose: () => void;
}

const QUESTIONS = [
  {
    title: "Who is using SteadiDay?",
    key: "setupRole",
    event: EVENTS.PROFILE_Q1_ANSWERED,
    options: [
      "I'm using it for myself",
      "A family member set it up for me",
      "I'm setting it up for a parent or loved one",
      "I'm a professional caregiver",
    ],
  },
  {
    title: "How did you hear about SteadiDay?",
    key: "source",
    event: EVENTS.PROFILE_Q2_ANSWERED,
    options: [
      "Friend or family member",
      "App Store search",
      "Facebook or Instagram",
      "Google search or ad",
      "News article or blog",
      "Senior center or community group",
      "Other",
    ],
  },
  {
    title: "What made you download SteadiDay?",
    key: "motivation",
    event: EVENTS.PROFILE_Q3_ANSWERED,
    options: [
      "Emergency SOS feature",
      "Health and wellness tracking",
      "Reminders and tasks",
      "Simple, easy-to-use design",
      "All of the above",
      "Something else",
    ],
  },
] as const;

export default function UserProfileSurvey({ visible, onClose }: UserProfileSurveyProps) {
  const { primary, colors } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  const handleSkip = useCallback(async () => {
    triggerHaptic();
    await setSurveyStatus("skipped");
    await trackProfileSurveyComplete({
      setup_role: answers.setupRole || "",
      source: answers.source || "",
      motivation: answers.motivation || "",
      status: "skipped",
    });
    setStep(0);
    setAnswers({});
    onClose();
  }, [answers, onClose, triggerHaptic]);

  const handleSelectOption = useCallback(
    async (questionKey: string, eventName: string, option: string) => {
      triggerHaptic();
      const updatedAnswers = { ...answers, [questionKey]: option };
      setAnswers(updatedAnswers);

      await trackProfileSurveyQuestion(eventName, {
        answer: option,
      });

      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
      } else {
        setStep(QUESTIONS.length);
        const profile = {
          setupRole: updatedAnswers.setupRole || "",
          source: updatedAnswers.source || "",
          motivation: updatedAnswers.motivation || "",
          completedAt: new Date().toISOString(),
        };
        await saveUserProfile(profile);
        await setSurveyStatus("completed");
        await trackProfileSurveyComplete({
          setup_role: profile.setupRole,
          source: profile.source,
          motivation: profile.motivation,
          status: "completed",
        });
      }
    },
    [answers, step, triggerHaptic]
  );

  const handleDone = useCallback(() => {
    triggerHaptic();
    setStep(0);
    setAnswers({});
    onClose();
  }, [onClose, triggerHaptic]);

  const isThankYou = step === QUESTIONS.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <View
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        <View
          className="flex-1 mt-12 rounded-t-3xl"
          style={{
            backgroundColor: colors.background,
            paddingBottom: insets.bottom,
          }}
        >
          {isThankYou ? (
            <View className="flex-1 items-center justify-center px-8">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-6"
                style={{ backgroundColor: primary + "20" }}
              >
                <Ionicons name="heart" size={40} color={primary} />
              </View>
              <Text
                className={`${textClasses.title} text-center mb-3`}
                style={{ color: colors.textPrimary }}
              >
                Thank you
              </Text>
              <Text
                className={`${textClasses.body} text-center mb-10 leading-relaxed`}
                style={{ color: colors.textSecondary }}
              >
                {"Your answers help us build a better SteadiDay for everyone."}
              </Text>
              <Pressable
                onPress={handleDone}
                className="w-full rounded-2xl items-center justify-center"
                style={{
                  backgroundColor: primary,
                  minHeight: 60,
                  paddingVertical: 16,
                }}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.onPrimary }}
                >
                  Done
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Header with progress and skip */}
              <View className="flex-row items-center justify-between px-6 pt-6 pb-2">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: primary }}
                >
                  {step + 1} of {QUESTIONS.length}
                </Text>
                <Pressable
                  onPress={handleSkip}
                  className="px-4 py-2 rounded-xl"
                  style={{ backgroundColor: colors.cardBackground }}
                  accessibilityRole="button"
                  accessibilityLabel="Skip survey"
                >
                  <Text
                    className={`${textClasses.body}`}
                    style={{ color: colors.textSecondary }}
                  >
                    Skip
                  </Text>
                </Pressable>
              </View>

              {/* Progress bar */}
              <View className="px-6 mb-4">
                <View
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: colors.divider }}
                >
                  <View
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: primary,
                      width: `${((step + 1) / QUESTIONS.length) * 100}%`,
                    }}
                  />
                </View>
              </View>

              {/* Title area */}
              <View className="px-6 mb-2">
                <Text
                  className={`${textClasses.title} mb-2`}
                  style={{ color: colors.textPrimary }}
                >
                  {"Help us make SteadiDay better"}
                </Text>
                <Text
                  className={`${textClasses.body} mb-6`}
                  style={{ color: colors.textSecondary }}
                >
                  {"Three quick taps. No typing. Skip anytime."}
                </Text>
              </View>

              {/* Question */}
              <ScrollView
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
              >
                <Text
                  className={`${textClasses.subtitle} font-semibold mb-5`}
                  style={{ color: colors.textPrimary }}
                >
                  {QUESTIONS[step].title}
                </Text>

                {QUESTIONS[step].options.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() =>
                      handleSelectOption(
                        QUESTIONS[step].key,
                        QUESTIONS[step].event,
                        option
                      )
                    }
                    className="rounded-2xl mb-3 px-5 flex-row items-center"
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      minHeight: 60,
                      paddingVertical: 16,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={option}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-4"
                      style={{ backgroundColor: primary + "15" }}
                    >
                      <Ionicons
                        name="radio-button-off"
                        size={22}
                        color={primary}
                      />
                    </View>
                    <Text
                      className={`${textClasses.body} flex-1`}
                      style={{ color: colors.textPrimary }}
                    >
                      {option}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
