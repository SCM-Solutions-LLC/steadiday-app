import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Linking, Dimensions } from "react-native";
import { Screen } from "../../components/Screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useTheme } from "../../utils/useTheme";
import { useConfirmModal } from "../../components/ConfirmModal";
import { ScreenErrorBoundary } from "../../components/ui";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInUp,
  FadeIn,
  Layout,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type LearningCategory = "healthy-aging" | "food-facts" | "fitness" | "tech-basics";

// Route params type
type LearningBitesRouteParams = {
  LearningBites: {
    category?: string;
  };
};

// Category icon colors - preserved as per requirements
const CATEGORY_ICON_COLORS = {
  "healthy-aging": "#EC4899", // Pink
  "food-facts": "#22C55E", // Green
  "fitness": "#3B82F6", // Blue
  "tech-basics": "#F97316", // Orange
};

interface LearningBite {
  id: string;
  category: LearningCategory;
  title: string;
  content: string;
  icon: string;
  tips?: string[];
  source: {
    name: string;
    url: string;
    description: string;
  };
}

const learningBites: LearningBite[] = [
  {
    id: "1",
    category: "healthy-aging",
    title: "Stay Socially Connected",
    content: "Regular social interaction is linked to better cognitive health and longer lifespan. Even a quick phone call with a friend can boost your mood and mental sharpness.",
    icon: "people",
    tips: [
      "Call a friend or family member today",
      "Join a local club or group activity",
      "Schedule regular video calls",
    ],
    source: {
      name: "National Institute on Aging (NIH)",
      url: "https://www.nia.nih.gov/health/social-wellness-and-older-people",
      description: "Research-backed insights on social wellness from the National Institutes of Health",
    },
  },
  {
    id: "2",
    category: "healthy-aging",
    title: "Quality Sleep Matters",
    content: "Adults over 50 need 7-9 hours of sleep per night. Good sleep helps with memory, immune function, and overall health.",
    icon: "moon",
    tips: [
      "Keep a consistent sleep schedule",
      "Avoid screens 1 hour before bed",
      "Keep your bedroom cool and dark",
    ],
    source: {
      name: "National Sleep Foundation",
      url: "https://www.thensf.org/how-sleep-changes-in-your-60s/",
      description: "Expert guidance on sleep health for older adults",
    },
  },
  {
    id: "3",
    category: "food-facts",
    title: "Colorful Plates Are Healthier",
    content: "Eating a variety of colorful fruits and vegetables ensures you get different vitamins and nutrients. Aim for at least 5 different colors each day.",
    icon: "restaurant",
    tips: [
      "Red: Tomatoes, peppers, strawberries",
      "Orange: Carrots, sweet potatoes, oranges",
      "Green: Spinach, broccoli, kiwi",
    ],
    source: {
      name: "Harvard School of Public Health",
      url: "https://www.hsph.harvard.edu/nutritionsource/what-should-you-eat/vegetables-and-fruits/",
      description: "Evidence-based nutrition guidance from Harvard University",
    },
  },
  {
    id: "4",
    category: "food-facts",
    title: "Hydration Is Key",
    content: "Many people mistake thirst for hunger. Drinking 6-8 glasses of water daily helps with energy, digestion, and skin health.",
    icon: "water",
    tips: [
      "Start your day with a glass of water",
      "Keep a water bottle nearby",
      "Eat water-rich foods like cucumbers",
    ],
    source: {
      name: "Mayo Clinic",
      url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256",
      description: "Trusted medical advice on hydration from Mayo Clinic",
    },
  },
  {
    id: "5",
    category: "fitness",
    title: "Walking Is Wonderful",
    content: "Just 30 minutes of walking per day can reduce the risk of heart disease, improve mood, and strengthen bones. Every step counts!",
    icon: "walk",
    tips: [
      "Take a morning or evening walk",
      "Walk with a friend for motivation",
      "Use the stairs when possible",
    ],
    source: {
      name: "American Heart Association",
      url: "https://www.heart.org/en/healthy-living/fitness/walking",
      description: "Heart-healthy exercise recommendations from the American Heart Association",
    },
  },
  {
    id: "6",
    category: "fitness",
    title: "Balance Exercises",
    content: "Balance exercises help prevent falls, which are a leading cause of injury for older adults. Simple exercises can be done at home.",
    icon: "fitness",
    tips: [
      "Stand on one foot while brushing teeth",
      "Practice heel-to-toe walking",
      "Try gentle yoga or tai chi",
    ],
    source: {
      name: "Centers for Disease Control (CDC)",
      url: "https://www.cdc.gov/falls/facts.html",
      description: "Fall prevention strategies from the CDC",
    },
  },
  {
    id: "7",
    category: "tech-basics",
    title: "Taking Great Photos",
    content: "To take clear photos with your phone, tap the screen where you want to focus. Clean your camera lens regularly for sharper pictures.",
    icon: "camera",
    tips: [
      "Hold your phone steady with both hands",
      "Use natural light when possible",
      "Get closer instead of zooming",
    ],
    source: {
      name: "AARP",
      url: "https://www.aarp.org/home-family/personal-technology/",
      description: "Technology tips for older adults from AARP",
    },
  },
  {
    id: "8",
    category: "tech-basics",
    title: "Video Calls Made Easy",
    content: "Video calls help you stay connected with loved ones. Make sure you are in a well-lit area and position the camera at eye level.",
    icon: "videocam",
    tips: [
      "Test your video before important calls",
      "Sit near a window for natural light",
      "Use headphones for better sound",
    ],
    source: {
      name: "AARP",
      url: "https://www.aarp.org/home-family/personal-technology/",
      description: "Technology tips for older adults from AARP",
    },
  },
  {
    id: "9",
    category: "healthy-aging",
    title: "Brain Fitness",
    content: "Learning new things creates new brain connections. Try puzzles, reading, learning a language, or picking up a new hobby.",
    icon: "bulb",
    tips: [
      "Do daily crossword puzzles",
      "Learn a new skill or hobby",
      "Play memory games",
    ],
    source: {
      name: "Alzheimer's Association",
      url: "https://www.alz.org/help-support/brain_health/stay_mentally_active",
      description: "Brain health recommendations from the Alzheimer's Association",
    },
  },
  {
    id: "10",
    category: "food-facts",
    title: "The Power of Fiber",
    content: "Fiber helps with digestion and keeps you feeling full longer. Aim for whole grains, beans, fruits, and vegetables.",
    icon: "nutrition",
    tips: [
      "Choose whole grain bread",
      "Add beans to soups and salads",
      "Eat fruit with the skin on",
    ],
    source: {
      name: "Cleveland Clinic",
      url: "https://my.clevelandclinic.org/health/articles/15050-fiber",
      description: "Evidence-based nutrition information from Cleveland Clinic",
    },
  },
];

// Category metadata with enhanced descriptions
const CATEGORY_META: Record<LearningCategory, { title: string; subtitle: string; icon: string }> = {
  "healthy-aging": {
    title: "Healthy Aging",
    subtitle: "Support clarity, balance, and independence",
    icon: "heart",
  },
  "food-facts": {
    title: "Food & Nutrition",
    subtitle: "Practical guidance for everyday meals",
    icon: "restaurant",
  },
  "fitness": {
    title: "Staying Active",
    subtitle: "Simple movement that adds up",
    icon: "fitness",
  },
  "tech-basics": {
    title: "Tech Made Easy",
    subtitle: "Clear help for everyday technology",
    icon: "phone-portrait",
  },
};

export default function LearningBitesScreen() {
  const { colors, primary, isDark } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);
  const route = useRoute<RouteProp<LearningBitesRouteParams, "LearningBites">>();
  const navigation = useNavigation();
  const { alert } = useConfirmModal();
  const insets = useSafeAreaInsets();

  // Get initial category from route params, default to "all"
  const initialCategory = route.params?.category as LearningCategory | undefined;

  // Validate that the category is valid
  const validCategories: LearningCategory[] = ["healthy-aging", "food-facts", "fitness", "tech-basics"];
  const validInitialCategory = initialCategory && validCategories.includes(initialCategory)
    ? initialCategory
    : undefined;

  const [selectedCategory, setSelectedCategory] = useState<LearningCategory | "all">(
    validInitialCategory || "all"
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Update selected category when route params change
  useEffect(() => {
    if (validInitialCategory) {
      setSelectedCategory(validInitialCategory);
    }
  }, [validInitialCategory]);

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const categories: { id: LearningCategory | "all"; label: string; icon: string }[] = [
    { id: "all", label: "All", icon: "apps" },
    { id: "healthy-aging", label: "Aging", icon: "heart" },
    { id: "food-facts", label: "Food", icon: "restaurant" },
    { id: "fitness", label: "Active", icon: "fitness" },
    { id: "tech-basics", label: "Tech", icon: "phone-portrait" },
  ];

  // Get category display name for header
  const getCategoryDisplayName = (category: LearningCategory | "all"): string => {
    if (category === "all") return "Daily Learning";
    return CATEGORY_META[category]?.title || "Daily Learning";
  };

  const getCategorySubtitle = (category: LearningCategory | "all"): string => {
    if (category === "all") return "Thoughtful guidance for everyday life";
    return CATEGORY_META[category]?.subtitle || "Thoughtful guidance for everyday life";
  };

  const filteredBites = selectedCategory === "all"
    ? learningBites
    : learningBites.filter((bite) => bite.category === selectedCategory);

  const getCategoryColor = (category: LearningCategory): string => {
    return CATEGORY_ICON_COLORS[category] || primary;
  };

  const handleExpandToggle = (id: string) => {
    triggerHaptic();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <ScreenErrorBoundary screenName="LearningBites">
      <Screen variant="static" edges={["bottom"]}>
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          {/* Header with back button and title */}
          <View
            className="px-6 pb-4"
            style={{
              backgroundColor: colors.cardBackground,
              borderBottomWidth: 1,
              borderBottomColor: colors.divider,
              paddingTop: insets.top + 16,
            }}
          >
            <View className="flex-row items-center">
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  navigation.goBack();
                }}
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: colors.divider }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
              </Pressable>
              <View className="flex-1">
                <Text
                  className={`${textClasses.title} font-bold`}
                  style={{ color: colors.textPrimary }}
                >
                  {getCategoryDisplayName(selectedCategory)}
                </Text>
                <Text
                  className={`${textClasses.small} mt-0.5`}
                  style={{ color: colors.textSecondary }}
                >
                  {getCategorySubtitle(selectedCategory)}
                </Text>
              </View>
            </View>
          </View>

          {/* Category Filter - Pill Style */}
          <View
            className="py-4"
            style={{
              backgroundColor: isDark ? colors.background : colors.surfaceSubtle,
              borderBottomWidth: 1,
              borderBottomColor: colors.divider,
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {categories.map((cat, index) => {
                const isSelected = selectedCategory === cat.id;
                const iconColor = cat.id === "all"
                  ? (isSelected ? "#FFFFFF" : colors.textSecondary)
                  : (isSelected ? "#FFFFFF" : CATEGORY_ICON_COLORS[cat.id as LearningCategory] || colors.textSecondary);

                return (
                  <Animated.View
                    key={cat.id}
                    entering={FadeIn.delay(index * 50).duration(300)}
                  >
                    <Pressable
                      onPress={() => {
                        triggerHaptic();
                        setSelectedCategory(cat.id);
                      }}
                      className="mr-3 px-5 py-3 rounded-full flex-row items-center"
                      style={{
                        backgroundColor: isSelected
                          ? (cat.id === "all" ? primary : CATEGORY_ICON_COLORS[cat.id as LearningCategory])
                          : colors.cardBackground,
                        borderWidth: 1,
                        borderColor: isSelected
                          ? "transparent"
                          : colors.border,
                        shadowColor: isSelected ? primary : "transparent",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isSelected ? 0.2 : 0,
                        shadowRadius: 4,
                      }}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={18}
                        color={iconColor}
                      />
                      <Text
                        className={`${textClasses.body} ml-2 font-medium`}
                        style={{ color: isSelected ? "#FFFFFF" : colors.textPrimary }}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>

          {/* Learning Bites List - Editorial Cards */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={true}
          >
            {filteredBites.length === 0 ? (
              <View className="flex-1 items-center justify-center py-16">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: colors.divider }}
                >
                  <Ionicons name="book-outline" size={40} color={colors.textTertiary} />
                </View>
                <Text
                  className={`${textClasses.body} text-center mb-2`}
                  style={{ color: colors.textPrimary }}
                >
                  No articles found
                </Text>
                <Text
                  className={`${textClasses.small} text-center mb-6`}
                  style={{ color: colors.textSecondary }}
                >
                  Try selecting a different category
                </Text>
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    navigation.goBack();
                  }}
                  className="px-6 py-3 rounded-xl"
                  style={{ backgroundColor: primary }}
                  accessibilityRole="button"
                >
                  <Text className={`${textClasses.body} font-semibold`} style={{ color: "#FFFFFF" }}>
                    Go Back
                  </Text>
                </Pressable>
              </View>
            ) : (
              filteredBites.map((bite, index) => (
                <LearningBiteCard
                  key={bite.id}
                  bite={bite}
                  isExpanded={expandedId === bite.id}
                  onToggle={() => handleExpandToggle(bite.id)}
                  onSourcePress={async () => {
                    try {
                      const supported = await Linking.canOpenURL(bite.source.url);
                      if (supported) {
                        await Linking.openURL(bite.source.url);
                      } else {
                        alert("Cannot open link", `Please visit: ${bite.source.url}`);
                      }
                    } catch (error) {
                      alert("Error", "Could not open the link");
                    }
                  }}
                  colors={colors}
                  textClasses={textClasses}
                  primary={primary}
                  isDark={isDark}
                  index={index}
                  categoryColor={getCategoryColor(bite.category)}
                />
              ))
            )}

            {/* Bottom padding */}
            <View className="h-8" />
          </ScrollView>
        </View>
      </Screen>
    </ScreenErrorBoundary>
  );
}

// =============================================================================
// LEARNING BITE CARD - Editorial Style with Animation
// =============================================================================
interface LearningBiteCardProps {
  bite: LearningBite;
  isExpanded: boolean;
  onToggle: () => void;
  onSourcePress: () => void;
  colors: any;
  textClasses: any;
  primary: string;
  isDark: boolean;
  index: number;
  categoryColor: string;
}

function LearningBiteCard({
  bite,
  isExpanded,
  onToggle,
  onSourcePress,
  colors,
  textClasses,
  primary,
  isDark,
  index,
  categoryColor,
}: LearningBiteCardProps) {
  const scale = useSharedValue(1);
  const contentHeight = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(400)}
      layout={Layout.springify()}
    >
      <Pressable
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          className="mb-4 rounded-3xl overflow-hidden"
          style={[
            animatedStyle,
            {
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: categoryColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 3,
            },
          ]}
        >
          {/* Top accent bar */}
          <View
            style={{
              height: 3,
              backgroundColor: categoryColor,
            }}
          />

          {/* Card Content */}
          <View className="p-5">
            {/* Header Row */}
            <View className="flex-row items-start">
              {/* Icon */}
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                style={{
                  backgroundColor: categoryColor + "18",
                  borderWidth: 1,
                  borderColor: categoryColor + "30",
                }}
              >
                <Ionicons name={bite.icon as any} size={28} color={categoryColor} />
              </View>

              {/* Title and Preview */}
              <View className="flex-1">
                <Text
                  className={`${textClasses.subtitle} font-bold mb-2`}
                  style={{ color: colors.textPrimary }}
                >
                  {bite.title}
                </Text>
                <Text
                  className={`${textClasses.body}`}
                  style={{ color: colors.textSecondary }}
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {bite.content}
                </Text>
              </View>
            </View>

            {/* Expanded Content */}
            {isExpanded && (
              <Animated.View
                entering={FadeIn.duration(300)}
                className="mt-5"
              >
                {/* Tips Section */}
                {bite.tips && bite.tips.length > 0 && (
                  <View
                    className="rounded-2xl p-4 mb-4"
                    style={{
                      backgroundColor: isDark ? colors.surfaceSubtle : categoryColor + "08",
                      borderWidth: 1,
                      borderColor: categoryColor + "20",
                    }}
                  >
                    <Text
                      className={`${textClasses.body} font-bold mb-3`}
                      style={{ color: colors.textPrimary }}
                    >
                      Quick Tips
                    </Text>
                    {bite.tips.map((tip, tipIndex) => (
                      <View
                        key={tipIndex}
                        className="flex-row items-start mb-2"
                      >
                        <View
                          className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5"
                          style={{ backgroundColor: categoryColor + "20" }}
                        >
                          <Text
                            className="text-xs font-bold"
                            style={{ color: categoryColor }}
                          >
                            {tipIndex + 1}
                          </Text>
                        </View>
                        <Text
                          className={`${textClasses.body} flex-1`}
                          style={{ color: colors.textSecondary }}
                        >
                          {tip}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Source Section */}
                <View
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: isDark ? colors.surfaceSubtle : colors.divider + "50",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-start">
                    <Ionicons
                      name="library"
                      size={18}
                      color={colors.textSecondary}
                      style={{ marginRight: 10, marginTop: 2 }}
                    />
                    <View className="flex-1">
                      <Text
                        className={`${textClasses.small} font-bold mb-1`}
                        style={{ color: colors.textPrimary }}
                      >
                        Source: {bite.source.name}
                      </Text>
                      <Text
                        className={`${textClasses.small} mb-3`}
                        style={{ color: colors.textSecondary }}
                      >
                        {bite.source.description}
                      </Text>
                      <Pressable
                        onPress={onSourcePress}
                        className="flex-row items-center self-start px-4 py-2 rounded-full"
                        style={{
                          backgroundColor: categoryColor + "15",
                          borderWidth: 1,
                          borderColor: categoryColor + "30",
                        }}
                      >
                        <Text
                          className={`${textClasses.small} font-semibold`}
                          style={{ color: categoryColor }}
                        >
                          Learn More
                        </Text>
                        <Ionicons
                          name="open-outline"
                          size={14}
                          color={categoryColor}
                          style={{ marginLeft: 6 }}
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Expand/Collapse Indicator */}
            <View className="flex-row items-center justify-center mt-4 pt-3 border-t" style={{ borderTopColor: colors.divider }}>
              <Text
                className={`${textClasses.small} font-medium mr-2`}
                style={{ color: categoryColor }}
              >
                {isExpanded ? "Show less" : "Read more"}
              </Text>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={categoryColor}
              />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
