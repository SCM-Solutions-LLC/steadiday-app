import React, { useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import * as Haptics from "expo-haptics";

/**
 * HelpScreen - FAQs, tutorials, and support options
 *
 * Senior-friendly features:
 * - Large tap targets
 * - Clear section headers
 * - Easy access to support options
 * - Comprehensive categorized FAQ
 */

// FAQ categories with questions
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  questions: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: "Getting Started",
    questions: [
      {
        question: "How do I set up my profile?",
        answer: "Go to Settings and tap on your name at the top to edit your profile information including your name, photo, and trusted contact details.",
      },
      {
        question: "How do I customize my home screen?",
        answer: "On the Home screen, tap \"Edit\" in the top right corner. You can add, remove, and reorder widgets to customize what you see first.",
      },
      {
        question: "What is the difference between Essentials and Premium?",
        answer: "Essentials mode is free and includes medications, tasks, reminders, and emergency SOS. Premium unlocks health tracking, Apple Health sync, food & water logging, and additional tools.",
      },
    ],
  },
  {
    title: "Medications",
    questions: [
      {
        question: "How do I add a new medication?",
        answer: "Go to the Meds tab and tap \"Add a Medication\". You can enter the medication name, dosage, frequency, and set up reminders. You can also take a photo of your medication bottle to auto-fill the information.",
      },
      {
        question: "How do I mark a medication as taken?",
        answer: "On the Meds tab, tap the circle next to any medication to mark it as taken. You will see a checkmark and the time you took it.",
      },
      {
        question: "Can I set multiple reminder times?",
        answer: "Yes! When adding a medication, choose a frequency like \"Twice a day\" or \"Three times a day\" and set the specific times for each dose.",
      },
      {
        question: "How do I add pharmacy information?",
        answer: "When adding or editing a medication, scroll down to the Pharmacy section to add your pharmacy's name, phone number, and address for easy refill requests.",
      },
    ],
  },
  {
    title: "Tasks & Reminders",
    questions: [
      {
        question: "How do I set up reminders?",
        answer: "Go to the Tasks tab and tap \"Add Task\". Enter your task details and enable the reminder toggle. You can choose when to be reminded and even set a second reminder as backup.",
      },
      {
        question: "Can I create recurring tasks?",
        answer: "Yes! When adding a task, tap on \"Repeat\" to set it as daily, weekly, monthly, or create a custom schedule.",
      },
      {
        question: "How do I sync with Apple Calendar?",
        answer: "Go to Settings > Connected Apps and turn on Apple Calendar. Your calendar events will appear in SteadiDay, and tasks you create can sync back to your calendar.",
      },
      {
        question: "How do I sync with Apple Reminders?",
        answer: "Go to Settings > Connected Apps and turn on Apple Reminders. Your reminders will appear as tasks in SteadiDay.",
      },
    ],
  },
  {
    title: "Syncing & Connected Apps",
    questions: [
      {
        question: "How does syncing with Apple Calendar work?",
        answer: "It's two-way sync! Tasks you create in SteadiDay appear in Apple Calendar, and events from Apple Calendar appear in SteadiDay. Changes sync both ways when you pull down to refresh.",
      },
      {
        question: "How does syncing with Apple Reminders work?",
        answer: "Similar to Calendar - it's two-way. Tasks sync between SteadiDay and Apple Reminders. Pull down on the Tasks screen to refresh and get the latest.",
      },
      {
        question: "Does syncing happen automatically?",
        answer: "Syncing happens when you pull down to refresh on the Tasks or Meds screens. It does not sync automatically in the background to preserve battery life.",
      },
      {
        question: "Why don't I see my calendar events?",
        answer: "Make sure Apple Calendar is connected in Settings > Connected Apps. Then go to the Tasks screen and pull down to refresh. Only events from the next 90 days are synced.",
      },
      {
        question: "Will tasks I create show up in Apple Calendar?",
        answer: "Yes! If you have Apple Calendar connected, tasks you create in SteadiDay will automatically appear in your calendar. Make sure calendar sync is enabled in Settings.",
      },
      {
        question: "What is Apple Health sync?",
        answer: "Apple Health sync is a Premium feature that imports your medications, lab results, and health metrics (steps, heart rate, etc.) from Apple Health into SteadiDay.",
      },
      {
        question: "Why can't I connect Apple Health?",
        answer: "Apple Health integration requires a Premium subscription. Go to Settings > Upgrade to Premium to unlock this feature.",
      },
      {
        question: "How do I refresh my data from connected apps?",
        answer: "On the Tasks or Meds screen, pull down (swipe down from the top of the list) to refresh. You'll see a \"Synced successfully\" message when complete.",
      },
      {
        question: "Can I disconnect an app?",
        answer: "Yes! Go to Settings > Connected Apps and tap the toggle next to any app to disconnect it. Your data in SteadiDay will remain, but it won't sync anymore.",
      },
      {
        question: "What happens if I edit a synced task?",
        answer: "If you edit a task that came from Apple Calendar or Reminders, the changes sync back to the original app. If you delete it in SteadiDay, it only removes it locally.",
      },
    ],
  },
  {
    title: "Emergency & Safety",
    questions: [
      {
        question: "How do I call for help in an emergency?",
        answer: "Tap the red SOS button on your home screen. This will show options to call 911 or contact your trusted contact directly.",
      },
      {
        question: "How do I add a trusted contact?",
        answer: "Go to the Care Team tab or Settings > Trusted Contacts. Tap \"Add Contact\" to add someone who can be reached quickly in an emergency.",
      },
      {
        question: "Can I share my location in an emergency?",
        answer: "Yes! When you use the SOS feature, you have the option to share your current location with your trusted contacts via text message.",
      },
      {
        question: "Is the SOS feature always available?",
        answer: "Yes, the SOS emergency feature is free for all users and cannot be removed from your home screen for your safety.",
      },
    ],
  },
  {
    title: "Care Summary & Sharing",
    questions: [
      {
        question: "What is Care Summary?",
        answer: "Care Summary gives you a daily overview of your medications, tasks, and health check-in that you can share with family members or caregivers.",
      },
      {
        question: "How do I share my Care Summary?",
        answer: "Go to the Care Summary widget on your home screen or find it in Settings. Tap \"Share Care Summary\" to send it via text message to anyone you choose.",
      },
      {
        question: "What information is included in Care Summary?",
        answer: "Care Summary includes your daily check-in mood, completed and pending medications, and completed tasks. Premium users can also include health metrics.",
      },
    ],
  },
  {
    title: "Settings & Accessibility",
    questions: [
      {
        question: "How do I change the text size?",
        answer: "Go to Settings > Text Size & Accessibility. You can choose from multiple text sizes to make everything easier to read.",
      },
      {
        question: "How do I enable dark mode?",
        answer: "Go to Settings > Appearance and choose \"Dark\" mode, or select \"System\" to automatically match your phone's display settings.",
      },
      {
        question: "How do I change the app's color theme?",
        answer: "Go to Settings > Appearance and choose from Warm Cream, Soft Blue, Sage Green, or Purple themes.",
      },
      {
        question: "Can I enable high contrast mode?",
        answer: "Yes! Go to Settings > Text Size & Accessibility and turn on High Contrast for better visibility.",
      },
    ],
  },
  {
    title: "Privacy & Security",
    questions: [
      {
        question: "Is my health data secure?",
        answer: "Yes! Your medication and health data stays on your device. We do not upload your personal health information to any servers.",
      },
      {
        question: "Can I use Face ID to protect my data?",
        answer: "Yes! Go to Settings > Security and enable Face ID or Touch ID to require authentication when opening the app.",
      },
      {
        question: "How do I delete my data?",
        answer: "Go to Settings > Privacy & Data. You can export your data or delete all your information from the app.",
      },
    ],
  },
  {
    title: "Premium Features",
    questions: [
      {
        question: "What features are included in Premium?",
        answer: "Premium includes Apple Health integration, health metrics tracking, food & water logging, medical records storage, additional tools like magnifier and flashlight, and more widgets for your home screen.",
      },
      {
        question: "How do I upgrade to Premium?",
        answer: "Go to Settings and tap \"Upgrade to Premium\". You can choose monthly, annual, or lifetime subscription options.",
      },
      {
        question: "Can I try Premium before buying?",
        answer: "Premium features are clearly marked throughout the app. You can see what is included before deciding to upgrade.",
      },
    ],
  },
];

export default function HelpScreen() {
  const navigation = useNavigation<any>();
  const { colors, primary, primaryLight } = useTheme();

  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  // Track expanded state: "categoryIndex-questionIndex" format
  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={true}
      >
        {/* Quick Help Banner */}
        <View
          className="rounded-2xl p-4 mb-6 flex-row items-center"
          style={{
            backgroundColor: primaryLight,
            borderWidth: 1,
            borderColor: primary,
          }}
        >
          <Ionicons name="help-circle" size={28} color={primary} />
          <View className="flex-1 ml-3">
            <Text
              className={`${textClasses.body} font-semibold`}
              style={{ color: colors.textPrimary }}
            >
              Need Help?
            </Text>
            <Text
              className={`${textClasses.small}`}
              style={{ color: colors.textSecondary }}
            >
              Find answers to common questions below or contact us for support.
            </Text>
          </View>
        </View>

        {/* FAQs Section - Categorized */}
        {faqCategories.map((category, categoryIndex) => (
          <View key={categoryIndex} className="mb-6">
            <Text
              className={`${textClasses.subtitle} font-semibold mb-3 px-1`}
              style={{ color: colors.textPrimary }}
            >
              {category.title}
            </Text>
            <View
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {category.questions.map((faq, questionIndex) => {
                const faqKey = `${categoryIndex}-${questionIndex}`;
                const isExpanded = expandedFaq === faqKey;
                const isLast = questionIndex === category.questions.length - 1;

                return (
                  <Pressable
                    key={questionIndex}
                    onPress={() => {
                      triggerHaptic();
                      setExpandedFaq(isExpanded ? null : faqKey);
                    }}
                    className={`px-5 py-4 ${!isLast ? "border-b" : ""}`}
                    style={{ borderBottomColor: colors.divider }}
                    accessibilityRole="button"
                    accessibilityLabel={faq.question}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className={`${textClasses.body} font-semibold flex-1 pr-4`}
                        style={{ color: colors.textPrimary }}
                      >
                        {faq.question}
                      </Text>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={colors.textSecondary}
                      />
                    </View>
                    {isExpanded && (
                      <Text
                        className={`${textClasses.body} mt-3`}
                        style={{ color: colors.textSecondary }}
                      >
                        {faq.answer}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Contact Support Section */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            className={`${textClasses.subtitle} font-semibold mb-2`}
            style={{ color: colors.textPrimary }}
          >
            Send Us Feedback
          </Text>
          <Text
            className={`${textClasses.body} mb-6`}
            style={{ color: colors.textSecondary }}
          >
            Have questions or suggestions? We would love to hear from you!
          </Text>

          <Pressable
            onPress={() => {
              triggerHaptic();
              navigation.navigate("Feedback" as never);
            }}
            className="flex-row items-center justify-between py-4"
            style={{ minHeight: 72 }}
            accessibilityRole="button"
            accessibilityLabel="Send feedback"
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: primaryLight }}
              >
                <Ionicons name="chatbubble-ellipses" size={24} color={primary} />
              </View>
              <View className="flex-1">
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: colors.textPrimary }}
                >
                  Send Feedback
                </Text>
                <Text
                  className={`${textClasses.small}`}
                  style={{ color: colors.textSecondary }}
                >
                  Tell us how we can improve
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
