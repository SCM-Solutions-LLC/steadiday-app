import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  Alert,
} from "react-native";
import { Screen } from "../../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { useUserStore } from "../../state/stores/userStore";
import { useSubscriptionStore } from "../../state/stores/subscriptionStore";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import { findBestFaqMatch, getQuestionsForCategory } from "../../utils/faqMatcher";
import { FAQ_CATEGORIES, FAQItem, FAQAction } from "../../data/faqData";
import { saveFeedback } from "../../utils/feedbackStorage";
import { maybeRequestReview } from "../../utils/reviewPrompt";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from "expo-audio";
import { transcribeAudio } from "../../api/transcribe-audio";

// Formsubmit endpoint for unanswered questions
const QUESTION_ENDPOINT = "https://formsubmit.co/ajax/support@steadiday.com";

// Message types
interface ChatMessage {
  id: string;
  type: "user" | "bot";
  text: string;
  // For category browsing
  categoryQuestions?: FAQItem[];
  categoryLabel?: string;
  categoryIcon?: string;
  // For answers
  matchedQuestion?: string;
  matchedQuestionId?: string;
  matchedFaq?: FAQItem; // Full FAQ item for actions and haptics
  // For suggestions
  suggestions?: string[];
  // For unanswered
  showSendToSupport?: boolean;
  questionToSend?: string;
  // Show "None of these" option
  showNoneOption?: boolean;
  // For answer feedback
  showFeedback?: boolean;
  // For action buttons (deep links)
  actions?: FAQAction[];
  // For question refinement before support
  showRefinementOptions?: boolean;
  originalQuestion?: string;
  // For "Can I help with anything else?" prompt
  showAnythingElse?: boolean;
  timestamp: Date;
}

// Question categories for refinement
type QuestionCategory = "subscription" | "technical" | "feature" | null;

// Track which messages have expanded questions
interface ExpandedState {
  [messageId: string]: boolean;
}

// Track feedback given for messages
interface FeedbackState {
  [messageId: string]: "helpful" | "not_helpful" | null;
}

// Maximum questions to show initially
const INITIAL_QUESTION_LIMIT = 4;

// Calculate typing delay based on answer length (capped at 2500ms)
const calculateTypingDelay = (answerLength: number): number => {
  const baseDelay = 400;
  const perCharDelay = 8;
  const maxDelay = 2500;
  return Math.min(baseDelay + (answerLength * perCharDelay), maxDelay);
};

// Get personalized greeting based on user context
const getPersonalizedGreeting = (
  userName: string | undefined,
  isPremium: boolean,
  recentlyUpgraded: boolean,
  trustedContactCount: number,
  lastScreen?: string
): string => {
  const name = userName || "there";

  // Recently upgraded to Premium
  if (recentlyUpgraded && isPremium) {
    return `Welcome to Premium, ${name}! 🎉 Want to see how the new Health features work?`;
  }

  // No trusted contacts - suggest setting them up
  if (trustedContactCount === 0) {
    return `Hi ${name}! I noticed you haven't set up any trusted contacts yet. Would you like help setting them up? They're important for emergencies.`;
  }

  // Context-based greetings
  if (lastScreen === "Meds" || lastScreen === "MedsScreen") {
    return `Hi ${name}! I see you were looking at medications. Need help with reminders or adding a new medication?`;
  }

  if (lastScreen === "Health" || lastScreen === "HealthScreen") {
    return `Hi ${name}! Need help with tracking your health metrics or understanding your data?`;
  }

  if (lastScreen === "Tasks" || lastScreen === "TasksScreen") {
    return `Hi ${name}! Need help managing your tasks or setting up reminders?`;
  }

  // Default greeting
  return `Hi ${name}! I'm here to help you with SteadiDay. Choose a topic below or type your question.`;
};

/**
 * HelpChatScreen - Interactive chat-style help interface with guided browsing
 *
 * Flow:
 * 1. User taps topic -> Shows list of questions in that category
 * 2. User taps question -> Shows answer
 * 3. "None of these" -> Allows free typing
 * 4. No match found -> Offer to send to support team
 */
export default function HelpChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { colors, primary, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const userName = useUserStore((s) => s.userProfile.name);
  const trustedContacts = useUserStore((s) => s.userProfile.emergencyContacts);
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);
  const textClasses = getTextSizeClasses(textSize);

  // Get last screen from route params if available
  const lastScreen = (route.params as { fromScreen?: string } | undefined)?.fromScreen;

  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSendingQuestion, setIsSendingQuestion] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<ExpandedState>({});
  const [messageFeedback, setMessageFeedback] = useState<FeedbackState>({});
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyRating, setSurveyRating] = useState<number | null>(null);
  const [surveyFeedbackText, setSurveyFeedbackText] = useState("");
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [questionCategory, setQuestionCategory] = useState<QuestionCategory>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const handleMicPress = useCallback(async () => {
    if (isTranscribing) return;

    if (isRecording) {
      try {
        await audioRecorder.stop();
        setIsRecording(false);
        setIsTranscribing(true);

        if (hapticEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        const uri = audioRecorder.uri;
        if (!uri) {
          setIsTranscribing(false);
          return;
        }

        const transcribedText = await transcribeAudio(uri);
        setIsTranscribing(false);

        if (transcribedText && transcribedText.trim()) {
          setInputText(transcribedText.trim());
        }
      } catch {
        setIsRecording(false);
        setIsTranscribing(false);
        if (hapticEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        const errorMsg: ChatMessage = {
          id: `bot-error-${Date.now()}`,
          type: "bot",
          text: "Sorry, I could not understand the audio. Please try again or type your question instead.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } else {
      try {
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) return;

        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setIsRecording(true);

        if (hapticEnabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch {
        setIsRecording(false);
        if (hapticEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    }
  }, [isRecording, isTranscribing, audioRecorder, hapticEnabled]);

  // Generate personalized greeting
  const personalizedGreeting = getPersonalizedGreeting(
    userName,
    isPremiumUnlocked,
    false, // recentlyUpgraded - simplified for now
    trustedContacts?.length || 0,
    lastScreen
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "bot",
      text: personalizedGreeting,
      timestamp: new Date(),
    },
  ]);

  // Typing animation
  const typingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [isTyping, typingAnim]);

  // Scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, showSurvey, surveyRating]);

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  // Handle topic button tap - show category questions
  const handleTopicTap = useCallback(
    (categoryId: string) => {
      triggerHaptic();

      const result = getQuestionsForCategory(categoryId);
      if (!result) return;

      // Add user message showing they selected a topic
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        text: `${result.categoryIcon} ${result.categoryLabel}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      setTimeout(() => {
        // Bot responds with list of questions in that category
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: `Here are common questions about ${result.categoryLabel}. Tap one to see the answer:`,
          categoryQuestions: result.questions,
          categoryLabel: result.categoryLabel,
          categoryIcon: result.categoryIcon,
          showNoneOption: true,
          showFeedback: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
      }, 600);
    },
    [triggerHaptic]
  );

  // Handle tapping a specific question from the list
  const handleQuestionTap = useCallback(
    (faq: FAQItem) => {
      triggerHaptic();

      // Add user "asking" the question
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        text: faq.question,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      // Variable typing duration based on answer length
      const typingDelay = calculateTypingDelay(faq.answer.length);

      setTimeout(() => {
        // Bot provides the answer
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: faq.answer,
          matchedQuestion: faq.question,
          matchedQuestionId: faq.id,
          matchedFaq: faq,
          actions: faq.actions,
          showFeedback: true,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);

        // Priority-based haptics
        if (hapticEnabled) {
          if (faq.isSafety) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setTimeout(() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }, 100);
          } else if (faq.isHealth) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }

        // Follow up: "Can I help you with anything else?"
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            const followUp: ChatMessage = {
              id: `bot-followup-${Date.now()}`,
              type: "bot",
              text: "Can I help you with anything else?",
              showAnythingElse: true,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, followUp]);
            setIsTyping(false);
          }, 600);
        }, 1500);
      }, typingDelay);
    },
    [triggerHaptic, hapticEnabled]
  );

  // Handle "None of these" - prompt to type question
  const handleNoneOfThese = useCallback(() => {
    triggerHaptic();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: "None of these",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        type: "bot",
        text: "No problem! Please type your question below and I'll try to help. If I can't find an answer, I'll send it to our team to get back to you.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 600);
  }, [triggerHaptic]);

  // Handle free-text question
  const handleSend = useCallback(
    (text: string = inputText) => {
      if (!text.trim()) return;

      triggerHaptic();
      Keyboard.dismiss();

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        text: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText("");
      setIsTyping(true);

      setTimeout(() => {
        const result = findBestFaqMatch(text);

        let botMessage: ChatMessage;

        if (result.found && result.confidence !== "low") {
          botMessage = {
            id: `bot-${Date.now()}`,
            type: "bot",
            text: result.answer!,
            matchedQuestion: result.matchedQuestion,
            matchedQuestionId: result.matchedFaq?.id,
            matchedFaq: result.matchedFaq,
            actions: result.matchedFaq?.actions,
            suggestions: result.relatedQuestions.slice(0, 2),
            showFeedback: true,
            timestamp: new Date(),
          };

          if (hapticEnabled) {
            if (result.matchedFaq?.isSafety) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }, 100);
            } else if (result.matchedFaq?.isHealth) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }

          // Follow up after matched answer
          setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => {
              const followUp: ChatMessage = {
                id: `bot-followup-${Date.now()}`,
                type: "bot",
                text: "Can I help you with anything else?",
                showAnythingElse: true,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, followUp]);
              setIsTyping(false);
            }, 600);
          }, 1500);
        } else {
          // No good match - show refinement options first
          botMessage = {
            id: `bot-${Date.now()}`,
            type: "bot",
            text: "I couldn't find a specific answer for that. Can you help me understand what you're asking about?",
            showRefinementOptions: true,
            originalQuestion: text.trim(),
            timestamp: new Date(),
          };
        }

        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
      }, 600);
    },
    [inputText, hapticEnabled, triggerHaptic]
  );

  // Handle question category refinement selection
  const handleRefinementSelect = useCallback(
    (category: QuestionCategory, originalQuestion: string) => {
      triggerHaptic();
      setQuestionCategory(category);

      const categoryLabels: Record<string, string> = {
        subscription: "Subscription & Billing",
        technical: "Technical Issue",
        feature: "How to Use a Feature",
      };

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        text: categoryLabels[category || ""] || "Other",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      setTimeout(() => {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: `Thanks for clarifying! I'll send your question about "${originalQuestion}" to our ${categoryLabels[category || ""] || ""} team. Would you like me to send it now?`,
          showSendToSupport: true,
          questionToSend: `[${categoryLabels[category || ""]}] ${originalQuestion}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
      }, 500);
    },
    [triggerHaptic]
  );

  // Send unanswered question to support
  const handleSendToSupport = useCallback(
    async (question: string) => {
      triggerHaptic();
      setIsSendingQuestion(true);

      try {
        const response = await fetch(QUESTION_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            _subject: "SteadiDay Help Chat: Unanswered Question",
            _template: "table",
            question: question,
            userName: userName || "Anonymous",
            timestamp: new Date().toISOString(),
            source: "Help Chat - Unanswered",
          }),
        });

        if (response.ok) {
          const botMessage: ChatMessage = {
            id: `bot-${Date.now()}`,
            type: "bot",
            text: "Got it! I've sent your question to our team. They'll review it and may reach out if they need more details. Is there anything else I can help you with?",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);

          if (hapticEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          throw new Error("Failed to send");
        }
      } catch {
        Alert.alert(
          "Couldn't Send",
          "We couldn't send your question right now. Please try the Send Feedback option in Settings, or try again later."
        );
      } finally {
        setIsSendingQuestion(false);
      }
    },
    [userName, hapticEnabled, triggerHaptic]
  );

  // Handle "Yes" for anything else prompt - restart with topic selection
  const handleAnythingElseYes = useCallback(() => {
    triggerHaptic();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: "Yes, I have another question",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: `bot-restart-${Date.now()}`,
        type: "bot",
        text: "Of course! Choose a topic below or type your question.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 500);
  }, [triggerHaptic]);

  // Handle "No" for anything else prompt
  const handleAnythingElseNo = useCallback(() => {
    triggerHaptic();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: "No, that's all. Thanks!",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: `bot-goodbye-${Date.now()}`,
        type: "bot",
        text: "You're welcome! If you need help in the future, you can find me anytime in Settings. Have a great day!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 500);
  }, [triggerHaptic]);

  // Navigate to feedback screen
  const handleGoToFeedback = useCallback(() => {
    triggerHaptic();
    navigation.navigate("Feedback");
  }, [navigation, triggerHaptic]);

  // Handle deep link action button tap
  const handleActionTap = useCallback(
    (action: FAQAction) => {
      triggerHaptic();
      if (action.type === "navigate") {
        // Close chat and navigate to target screen
        navigation.goBack();
        setTimeout(() => {
          navigation.navigate(action.target as never);
        }, 100);
      }
    },
    [navigation, triggerHaptic]
  );

  // Toggle expanded state for questions list
  const toggleExpanded = useCallback(
    (messageId: string) => {
      triggerHaptic();
      setExpandedMessages((prev) => ({
        ...prev,
        [messageId]: !prev[messageId],
      }));
    },
    [triggerHaptic]
  );

  // Handle feedback response
  const handleFeedback = useCallback(
    async (messageId: string, helpful: boolean, questionId?: string, questionText?: string) => {
      triggerHaptic();
      setMessageFeedback((prev) => ({
        ...prev,
        [messageId]: helpful ? "helpful" : "not_helpful",
      }));

      // Save feedback to storage
      await saveFeedback({
        type: "faq_helpful",
        questionId,
        questionText,
        helpful,
      });

      if (hapticEnabled) {
        Haptics.notificationAsync(
          helpful
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
      }

      // Track feedback count and show survey after 3
      const newCount = feedbackCount + 1;
      setFeedbackCount(newCount);
      if (newCount >= 3 && !showSurvey && !surveySubmitted) {
        setTimeout(() => setShowSurvey(true), 1000);
      }
    },
    [triggerHaptic, hapticEnabled, feedbackCount, showSurvey, surveySubmitted]
  );

  // Handle survey rating selection
  const handleSurveyRating = useCallback(
    (rating: number) => {
      triggerHaptic();
      setSurveyRating(rating);

      if (hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
    [triggerHaptic, hapticEnabled]
  );

  // Handle survey submission
  const handleSurveySubmit = useCallback(async () => {
    triggerHaptic();

    // Save satisfaction feedback
    await saveFeedback({
      type: "satisfaction",
      rating: surveyRating ?? undefined,
      feedbackText: surveyFeedbackText.trim() || undefined,
    });

    setSurveySubmitted(true);

    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Close survey after showing thank you
    setTimeout(() => {
      setShowSurvey(false);
    }, 2000);

    if (surveyRating === 3) {
      setTimeout(() => {
        maybeRequestReview();
      }, 2500);
    }
  }, [triggerHaptic, hapticEnabled, surveyRating, surveyFeedbackText]);

  const lastBotMessage = [...messages].reverse().find((m) => m.type === "bot");
  const showQuickTopics =
    messages.length === 1 ||
    (lastBotMessage?.text === "Of course! Choose a topic below or type your question.");

  return (
    <Screen variant="static" edges={["top"]}>
      {/* Polished Chat Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
          paddingHorizontal: 16,
          backgroundColor: colors.cardBackground,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        }}
      >
        {/* Back Button */}
        <Pressable
          onPress={() => navigation.goBack()}
          className="mr-3 items-center justify-center active:opacity-70"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.background,
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>

        {/* Avatar with Online Indicator */}
        <View style={{ position: "relative", marginRight: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "700",
              }}
            >
              S
            </Text>
          </View>
          {/* Online indicator */}
          <View
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#4CAF50",
              borderWidth: 2,
              borderColor: colors.cardBackground,
            }}
          />
        </View>

        {/* Header Text */}
        <View style={{ flex: 1 }}>
          <Text
            className={`${textClasses.body} font-semibold`}
            style={{ color: colors.textPrimary }}
          >
            SteadiDay Support
          </Text>
          <Text
            className={`${textClasses.small}`}
            style={{ color: colors.textSecondary, marginTop: 2 }}
          >
            Here to help 24/7
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          style={{ backgroundColor: colors.background }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <View key={message.id} className="mb-4">
              {/* Message Bubble */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: message.type === "user" ? "flex-end" : "flex-start",
                  justifyContent: message.type === "user" ? "flex-end" : "flex-start",
                }}
              >
                {/* Bot Avatar (small) */}
                {message.type === "bot" && (
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: primary,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 8,
                      alignSelf: "flex-end",
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
                      S
                    </Text>
                  </View>
                )}

                <View
                  className="rounded-3xl px-5 py-4 max-w-[80%]"
                  style={{
                    backgroundColor:
                      message.type === "user" ? primary : colors.cardBackground,
                    borderWidth: message.type === "bot" ? 1 : 0,
                    borderColor: colors.border,
                    borderBottomLeftRadius: message.type === "bot" ? 4 : 24,
                    borderBottomRightRadius: message.type === "user" ? 4 : 24,
                    // Shadow for bot messages
                    ...(message.type === "bot" && {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 1,
                    }),
                  }}
                >
                  {/* Found Answer Badge */}
                  {message.matchedQuestion && (
                    <View
                      className="flex-row items-center mb-2 pb-2"
                      style={{
                        borderBottomWidth: 1,
                        borderBottomColor: colors.divider,
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      <Text
                        className={`${textClasses.small} ml-2 font-semibold`}
                        style={{ color: "#10B981" }}
                      >
                        Found answer
                      </Text>
                    </View>
                  )}

                  {/* Welcome Message Emoji */}
                  {message.id === "welcome" && (
                    <Text style={{ fontSize: 28, marginBottom: 8 }}>👋</Text>
                  )}

                  <Text
                    className={`${textClasses.body} leading-relaxed`}
                    style={{
                      color: message.type === "user" ? "white" : colors.textPrimary,
                    }}
                  >
                    {message.text}
                  </Text>
                </View>
              </View>

              {/* Category Questions List */}
              {message.categoryQuestions && message.categoryQuestions.length > 0 && (
                <View className="mt-3 ml-10">
                  {(() => {
                    const isExpanded = expandedMessages[message.id];
                    const questionsToShow = isExpanded
                      ? message.categoryQuestions
                      : message.categoryQuestions.slice(0, INITIAL_QUESTION_LIMIT);
                    const hasMore =
                      message.categoryQuestions.length > INITIAL_QUESTION_LIMIT;

                    return (
                      <>
                        {questionsToShow.map((faq) => (
                          <Pressable
                            key={faq.id}
                            onPress={() => handleQuestionTap(faq)}
                            className="rounded-2xl px-4 py-4 mb-2 border active:opacity-70 flex-row items-center"
                            style={{
                              backgroundColor: colors.cardBackground,
                              borderColor: colors.border,
                              minHeight: 56,
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={faq.question}
                          >
                            <Text
                              className={`${textClasses.body} flex-1`}
                              style={{ color: colors.textPrimary }}
                            >
                              {faq.question}
                            </Text>
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={colors.textSecondary}
                            />
                          </Pressable>
                        ))}

                        {/* Show More / Show Less Button */}
                        {hasMore && (
                          <Pressable
                            onPress={() => toggleExpanded(message.id)}
                            className="rounded-2xl px-4 py-3 mb-2 active:opacity-70 flex-row items-center justify-center"
                            style={{
                              backgroundColor: colors.primaryLight,
                              minHeight: 48,
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={
                              isExpanded ? "Show fewer questions" : "Show more questions"
                            }
                          >
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={20}
                              color={primary}
                            />
                            <Text
                              className={`${textClasses.body} ml-2`}
                              style={{ color: primary, fontWeight: "500" }}
                            >
                              {isExpanded
                                ? "Show less"
                                : `Show ${message.categoryQuestions.length - INITIAL_QUESTION_LIMIT} more`}
                            </Text>
                          </Pressable>
                        )}
                      </>
                    );
                  })()}

                  {/* None of These Option */}
                  {message.showNoneOption && (
                    <Pressable
                      onPress={handleNoneOfThese}
                      className="rounded-2xl px-4 py-4 mt-2 border-2 border-dashed active:opacity-70 flex-row items-center justify-center"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.textSecondary,
                        minHeight: 56,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="None of these - type my own question"
                    >
                      <Ionicons
                        name="create-outline"
                        size={22}
                        color={colors.textSecondary}
                      />
                      <Text
                        className={`${textClasses.body} ml-2`}
                        style={{ color: colors.textSecondary }}
                      >
                        None of these - let me type my question
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Send to Support Button */}
              {message.showSendToSupport && message.questionToSend && (
                <View className="mt-3 ml-10">
                  <Pressable
                    onPress={() => handleSendToSupport(message.questionToSend!)}
                    disabled={isSendingQuestion}
                    className="rounded-2xl px-5 py-4 flex-row items-center justify-center active:opacity-70"
                    style={{
                      backgroundColor: "#10B981",
                      minHeight: 56,
                      opacity: isSendingQuestion ? 0.7 : 1,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Send question to support team"
                  >
                    <Ionicons
                      name={isSendingQuestion ? "hourglass" : "send"}
                      size={22}
                      color="white"
                    />
                    <Text
                      className={`${textClasses.body} font-semibold ml-2`}
                      style={{ color: "white" }}
                    >
                      {isSendingQuestion ? "Sending..." : "Yes, Send to Support Team"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleGoToFeedback}
                    className="rounded-2xl px-5 py-3 mt-2 flex-row items-center justify-center active:opacity-70"
                    style={{ minHeight: 48 }}
                    accessibilityRole="button"
                    accessibilityLabel="Go to feedback form instead"
                  >
                    <Text className={`${textClasses.body}`} style={{ color: primary }}>
                      Or send detailed feedback instead
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Question Refinement Options */}
              {message.showRefinementOptions && message.originalQuestion && (
                <View className="mt-3 ml-10">
                  <Pressable
                    onPress={() => handleRefinementSelect("subscription", message.originalQuestion!)}
                    className="rounded-2xl px-4 py-4 mb-2 border active:opacity-70 flex-row items-center"
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      minHeight: 56,
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={{ fontSize: 20, marginRight: 12 }}>💳</Text>
                    <Text
                      className={`${textClasses.body} flex-1`}
                      style={{ color: colors.textPrimary }}
                    >
                      Subscription or billing question
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </Pressable>

                  <Pressable
                    onPress={() => handleRefinementSelect("technical", message.originalQuestion!)}
                    className="rounded-2xl px-4 py-4 mb-2 border active:opacity-70 flex-row items-center"
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      minHeight: 56,
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={{ fontSize: 20, marginRight: 12 }}>🔧</Text>
                    <Text
                      className={`${textClasses.body} flex-1`}
                      style={{ color: colors.textPrimary }}
                    >
                      Technical issue or bug
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </Pressable>

                  <Pressable
                    onPress={() => handleRefinementSelect("feature", message.originalQuestion!)}
                    className="rounded-2xl px-4 py-4 mb-2 border active:opacity-70 flex-row items-center"
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      minHeight: 56,
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={{ fontSize: 20, marginRight: 12 }}>❓</Text>
                    <Text
                      className={`${textClasses.body} flex-1`}
                      style={{ color: colors.textPrimary }}
                    >
                      How to use a feature
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>
              )}

              {/* "Can I help with anything else?" Buttons */}
              {message.showAnythingElse && (
                <View className="mt-3 ml-10 flex-row" style={{ gap: 10 }}>
                  <Pressable
                    onPress={handleAnythingElseYes}
                    className="rounded-2xl px-5 py-4 flex-row items-center justify-center active:opacity-70"
                    style={{
                      backgroundColor: primary,
                      minHeight: 52,
                      flex: 1,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Yes, I have another question"
                  >
                    <Text
                      className={`${textClasses.body} font-semibold`}
                      style={{ color: "white" }}
                    >
                      Yes, please
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAnythingElseNo}
                    className="rounded-2xl px-5 py-4 flex-row items-center justify-center active:opacity-70"
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderWidth: 1,
                      borderColor: colors.border,
                      minHeight: 52,
                      flex: 1,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="No thanks, I'm done"
                  >
                    <Text
                      className={`${textClasses.body} font-semibold`}
                      style={{ color: colors.textPrimary }}
                    >
                      No, thanks
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Deep Link Action Buttons */}
              {message.actions && message.actions.length > 0 && (
                <View className="mt-3 ml-10">
                  {message.actions.map((action, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleActionTap(action)}
                      className="rounded-2xl px-4 py-4 mb-2 flex-row items-center justify-center active:opacity-70"
                      style={{
                        backgroundColor: primary,
                        minHeight: 56,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={action.label}
                    >
                      {action.icon && (
                        <Text style={{ fontSize: 20, marginRight: 8 }}>{action.icon}</Text>
                      )}
                      <Text
                        className={`${textClasses.body} font-semibold`}
                        style={{ color: "white" }}
                      >
                        {action.label}
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Related Suggestions */}
              {message.type === "bot" &&
                message.suggestions &&
                message.suggestions.length > 0 &&
                !message.categoryQuestions && (
                  <View className="mt-3 ml-10">
                    <Text
                      className={`${textClasses.small} mb-2`}
                      style={{ color: colors.textSecondary }}
                    >
                      Related questions:
                    </Text>
                    {message.suggestions.map((suggestion, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => handleSend(suggestion)}
                        className="rounded-2xl px-4 py-3 mb-2 border active:opacity-70"
                        style={{
                          backgroundColor: colors.cardBackground,
                          borderColor: colors.border,
                          minHeight: 48,
                        }}
                      >
                        <Text
                          className={`${textClasses.body}`}
                          style={{ color: primary }}
                        >
                          {suggestion}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

              {/* Was This Helpful? Feedback */}
              {message.showFeedback && !messageFeedback[message.id] && (
                <View
                  className="mt-3 ml-10 rounded-2xl px-4 py-4"
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    className={`${textClasses.body} mb-3`}
                    style={{ color: colors.textPrimary, textAlign: "center" }}
                  >
                    Did this answer your question?
                  </Text>
                  <View className="flex-row justify-center" style={{ gap: 16 }}>
                    <Pressable
                      onPress={() =>
                        handleFeedback(
                          message.id,
                          true,
                          message.matchedQuestionId,
                          message.matchedQuestion
                        )
                      }
                      className="flex-row items-center px-5 py-3 rounded-full active:opacity-70"
                      style={{ backgroundColor: "#10B981" }}
                      accessibilityRole="button"
                      accessibilityLabel="Yes, this was helpful"
                    >
                      <Ionicons name="thumbs-up" size={20} color="white" />
                      <Text
                        className={`${textClasses.body} ml-2 font-semibold`}
                        style={{ color: "white" }}
                      >
                        Yes
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        handleFeedback(
                          message.id,
                          false,
                          message.matchedQuestionId,
                          message.matchedQuestion
                        )
                      }
                      className="flex-row items-center px-5 py-3 rounded-full active:opacity-70"
                      style={{ backgroundColor: colors.error || "#EF4444" }}
                      accessibilityRole="button"
                      accessibilityLabel="No, this was not helpful"
                    >
                      <Ionicons name="thumbs-down" size={20} color="white" />
                      <Text
                        className={`${textClasses.body} ml-2 font-semibold`}
                        style={{ color: "white" }}
                      >
                        No
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Feedback Confirmation */}
              {message.showFeedback && messageFeedback[message.id] && (
                <View
                  className="mt-3 ml-10 rounded-2xl px-4 py-3 flex-row items-center justify-center"
                  style={{
                    backgroundColor:
                      messageFeedback[message.id] === "helpful"
                        ? "#D1FAE5"
                        : "#FEE2E2",
                  }}
                >
                  <Ionicons
                    name={
                      messageFeedback[message.id] === "helpful"
                        ? "checkmark-circle"
                        : "alert-circle"
                    }
                    size={20}
                    color={
                      messageFeedback[message.id] === "helpful"
                        ? "#10B981"
                        : "#EF4444"
                    }
                  />
                  <Text
                    className={`${textClasses.body} ml-2`}
                    style={{
                      color:
                        messageFeedback[message.id] === "helpful"
                          ? "#10B981"
                          : "#EF4444",
                    }}
                  >
                    {messageFeedback[message.id] === "helpful"
                      ? "Thanks for your feedback!"
                      : "Sorry it wasn't helpful. Try another question or contact support."}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <View className="mb-4" style={{ flexDirection: "row", alignItems: "flex-end" }}>
              {/* Bot Avatar */}
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
              >
                <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
                  S
                </Text>
              </View>
              <View
                className="rounded-3xl px-5 py-4"
                style={{
                  backgroundColor: colors.cardBackground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderBottomLeftRadius: 4,
                }}
              >
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  {[0, 1, 2].map((i) => (
                    <Animated.View
                      key={i}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.textSecondary,
                        opacity: typingAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange:
                            i === 0
                              ? [0.3, 1, 0.3]
                              : i === 1
                                ? [0.3, 0.3, 1]
                                : [1, 0.3, 0.3],
                        }),
                      }}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Satisfaction Survey */}
          {showSurvey && !surveySubmitted && (
            <View className="mb-4" style={{ flexDirection: "row", alignItems: "flex-end" }}>
              {/* Bot Avatar */}
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                  alignSelf: "flex-start",
                  marginTop: 4,
                }}
              >
                <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
                  S
                </Text>
              </View>
              <View
                className="rounded-3xl px-5 py-5 flex-1"
                style={{
                  backgroundColor: colors.primaryLight,
                  borderWidth: 2,
                  borderColor: primary,
                  borderBottomLeftRadius: 4,
                  maxWidth: "85%",
                }}
              >
                {/* Initial Emoji Selection */}
                {surveyRating === null && (
                  <>
                    <Text
                      className={`${textClasses.body} font-semibold mb-1`}
                      style={{ color: colors.textPrimary, textAlign: "center" }}
                    >
                      How was your experience?
                    </Text>
                    <Text
                      className={`${textClasses.small} mb-4`}
                      style={{ color: colors.textSecondary, textAlign: "center" }}
                    >
                      Your feedback helps us improve
                    </Text>
                    <View className="flex-row justify-center" style={{ gap: 20 }}>
                      <Pressable
                        onPress={() => handleSurveyRating(1)}
                        className="items-center active:opacity-70"
                        accessibilityRole="button"
                        accessibilityLabel="Not satisfied"
                      >
                        <Text style={{ fontSize: 40 }}>😞</Text>
                        <Text
                          className={`${textClasses.small} mt-1`}
                          style={{ color: colors.textSecondary }}
                        >
                          Not helpful
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleSurveyRating(2)}
                        className="items-center active:opacity-70"
                        accessibilityRole="button"
                        accessibilityLabel="Neutral"
                      >
                        <Text style={{ fontSize: 40 }}>😐</Text>
                        <Text
                          className={`${textClasses.small} mt-1`}
                          style={{ color: colors.textSecondary }}
                        >
                          Okay
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleSurveyRating(3)}
                        className="items-center active:opacity-70"
                        accessibilityRole="button"
                        accessibilityLabel="Satisfied"
                      >
                        <Text style={{ fontSize: 40 }}>😊</Text>
                        <Text
                          className={`${textClasses.small} mt-1`}
                          style={{ color: colors.textSecondary }}
                        >
                          Helpful
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}

                {/* After Emoji Selected - Show Text Input */}
                {surveyRating !== null && (
                  <>
                    <View
                      className="flex-row items-center justify-center mb-3"
                      style={{ gap: 12 }}
                    >
                      <Text style={{ fontSize: 36 }}>
                        {surveyRating === 1 ? "😞" : surveyRating === 2 ? "😐" : "😊"}
                      </Text>
                      <Pressable onPress={() => setSurveyRating(null)}>
                        <Text
                          className={`${textClasses.small}`}
                          style={{ color: primary, textDecorationLine: "underline" }}
                        >
                          Change
                        </Text>
                      </Pressable>
                    </View>

                    <Text
                      className={`${textClasses.body} mb-3`}
                      style={{ color: colors.textPrimary, textAlign: "center" }}
                    >
                      {surveyRating === 1
                        ? "We're sorry to hear that. What could we improve?"
                        : surveyRating === 2
                          ? "Thanks! Any suggestions to make it better?"
                          : "Great! What did you find most helpful?"}
                    </Text>

                    <TextInput
                      style={{
                        backgroundColor: colors.cardBackground,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 12,
                        fontSize: 15,
                        color: colors.textPrimary,
                        minHeight: 80,
                        textAlignVertical: "top",
                        marginBottom: 12,
                      }}
                      placeholder="Optional: Tell us more..."
                      placeholderTextColor={colors.textSecondary}
                      value={surveyFeedbackText}
                      onChangeText={setSurveyFeedbackText}
                      multiline
                      maxLength={500}
                      numberOfLines={3}
                    />

                    <Pressable
                      onPress={handleSurveySubmit}
                      className="rounded-full py-3 px-6 items-center active:opacity-70"
                      style={{ backgroundColor: primary }}
                      accessibilityRole="button"
                      accessibilityLabel="Submit feedback"
                    >
                      <Text
                        className={`${textClasses.body} font-semibold`}
                        style={{ color: "white" }}
                      >
                        {surveyFeedbackText.trim() ? "Submit Feedback" : "Skip & Submit"}
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Survey Thank You */}
          {surveySubmitted && (
            <View className="mb-4" style={{ flexDirection: "row", alignItems: "flex-end" }}>
              {/* Bot Avatar */}
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
              >
                <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
                  S
                </Text>
              </View>
              <View
                className="rounded-3xl px-5 py-4"
                style={{
                  backgroundColor: "#D1FAE5",
                  borderWidth: 1,
                  borderColor: "#10B981",
                  borderBottomLeftRadius: 4,
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text
                    className={`${textClasses.body} ml-2`}
                    style={{ color: "#10B981" }}
                  >
                    Thanks for your feedback! 🙏
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick Topic Buttons - Polished 2-column grid */}
          {showQuickTopics && (
            <View className="mt-2">
              <Text
                className={`${textClasses.small} mb-3 ml-1`}
                style={{ color: colors.textSecondary, fontWeight: "500" }}
              >
                Choose a topic:
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                }}
              >
                {FAQ_CATEGORIES.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => handleTopicTap(category.id)}
                    className="rounded-xl active:opacity-70"
                    style={{
                      backgroundColor:
                        category.id === "troubleshooting"
                          ? isDark ? "#4A1C1C" : "#FEE2E2"
                          : colors.cardBackground,
                      borderWidth: 1.5,
                      borderColor:
                        category.id === "troubleshooting" ? (isDark ? "#7F2D2D" : "#FECACA") : colors.border,
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      marginBottom: 10,
                      width: "48%",
                      // Shadow
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 3,
                      elevation: 1,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={category.label}
                  >
                    <Text
                      className={`${textClasses.body}`}
                      style={{
                        color: colors.textPrimary,
                        textAlign: "center",
                        fontWeight: "500",
                      }}
                      numberOfLines={1}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View className="h-4" />
        </ScrollView>

        {/* Polished Input Area */}
        <View
          className="px-4 py-3"
          style={{
            backgroundColor: colors.cardBackground,
            borderTopWidth: 1,
            borderTopColor: colors.divider,
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          <View
            className="flex-row items-center"
            style={{
              backgroundColor: colors.background,
              borderRadius: 28,
              borderWidth: 1.5,
              borderColor: colors.border,
              paddingLeft: 16,
              paddingRight: 4,
              paddingVertical: 4,
            }}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={isTranscribing ? "Transcribing..." : isRecording ? "Listening..." : "Type or tap mic..."}
              placeholderTextColor={isRecording ? "#EF4444" : colors.textTertiary || colors.textSecondary}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              className={`flex-1 py-3 ${textClasses.body}`}
              style={{
                color: colors.textPrimary,
                maxHeight: 100,
              }}
              multiline
              editable={!isRecording && !isTranscribing}
              accessibilityLabel="Type your question"
            />
            <Pressable
              onPress={handleMicPress}
              disabled={isTranscribing}
              className="items-center justify-center rounded-full active:opacity-70"
              style={{
                width: 44,
                height: 44,
                backgroundColor: isRecording ? "#EF4444" : isTranscribing ? colors.border : colors.background,
                borderWidth: isRecording ? 0 : 1.5,
                borderColor: isRecording ? "transparent" : colors.border,
                marginRight: 4,
              }}
              accessibilityRole="button"
              accessibilityLabel={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isTranscribing ? (
                <Ionicons name="hourglass" size={20} color={colors.textSecondary} />
              ) : (
                <Ionicons
                  name={isRecording ? "stop" : "mic"}
                  size={20}
                  color={isRecording ? "white" : colors.textSecondary}
                />
              )}
            </Pressable>
            <Pressable
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
              className="items-center justify-center rounded-full active:opacity-70"
              style={{
                width: 44,
                height: 44,
                backgroundColor: inputText.trim() ? primary : colors.border,
              }}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? "white" : colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
