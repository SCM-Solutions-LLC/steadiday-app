import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, AccessibilityInfo, LayoutAnimation, UIManager, Platform } from "react-native";
import { Screen } from "../components/Screen";
import { useUIStore } from "../state/stores/uiStore";
import { useTipStore, TIP_IDS } from "../state/stores/tipStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getTextSizeClasses } from "../utils/textSizes";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MagnifierScreen from "./tools/MagnifierScreen";
import FlashlightScreen from "./tools/FlashlightScreen";
import FindMyCarScreen from "./tools/FindMyCarScreen";
import NotesScreen from "./tools/NotesScreen";

import ShareLocationScreen from "./tools/ShareLocationScreen";
import FoodTrackerScreen from "./FoodTrackerScreen";
import WaterTrackerScreen from "./WaterTrackerScreen";
import HistoryScreen from "./HistoryScreen";
import { useTheme } from "../utils/useTheme";
import { ScreenErrorBoundary, InlineTip, AnimatedGuideTip, PrivacyFooter } from "../components/ui";
import {
  ListItemCard,
  SectionHeader,
  CARD_HEIGHTS,
} from "../components/ui/SharedCards";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { SLOW_WIDGET_ANIMATION } from "../components/home/types";

export type ToolsStackParamList = {
  ToolsHome: undefined;
  Magnifier: undefined;
  Flashlight: undefined;
  FindMyCar: undefined;
  Notes: undefined;

  ShareLocation: undefined;
  FoodTracker: undefined;
  WaterTracker: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<ToolsStackParamList>();

type Tool = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  iconColor: string;
  iconBgColor: string;
  screen: keyof ToolsStackParamList;
};

type ToolCategory = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  tools: Tool[];
};

// Tool color palette - cohesive and intentional
const TOOL_COLORS = {
  foodTracker: {
    bg: "#FDECEA",
    icon: "#E74C3C",
  },
  waterTracker: {
    bg: "#E8F4FD",
    icon: "#3498DB",
  },
  history: {
    bg: "#F3E8FD",
    icon: "#9B59B6",
  },
  magnifier: {
    bg: "#E8F8F5",
    icon: "#1ABC9C",
  },
  flashlight: {
    bg: "#FEF9E7",
    icon: "#F39C12",
  },
  notes: {
    bg: "#FCE4EC",
    icon: "#E91E63",
  },

  shareLocation: {
    bg: "#E8F5E9",
    icon: "#4CAF50",
  },
  parking: {
    bg: "#EDE7F6",
    icon: "#7C4DFF",
  },
};

// Section colors for headers
const SECTION_COLORS = {
  healthWellness: "#E57373",
  dailyEssentials: "#5C9A8B",
  phoneHelpers: "#7986CB",
  favorites: "#FFB74D",
};

function ToolsHomeScreen() {
  // Enable LayoutAnimation on Android
  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const favoriteToolIds = useUIStore((s) => s.favoriteToolIds);
  const toggleFavoriteTool = useUIStore((s) => s.toggleFavoriteTool);
  const navigation = useNavigation<NativeStackNavigationProp<ToolsStackParamList>>();
  const textClasses = getTextSizeClasses(textSize);
  const { primary, primaryLight, colors, isDark } = useTheme();
  const [isEditMode, setIsEditMode] = useState(false);

  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setShouldReduceMotion);
  }, []);

  const triggerHaptic = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticEnabled) {
      Haptics.impactAsync(style);
    }
  }, [hapticEnabled]);

  const toolCategories: ToolCategory[] = [
    {
      id: "health-wellness",
      name: "Health & Wellness",
      icon: "heart",
      iconColor: SECTION_COLORS.healthWellness,
      tools: [
        {
          id: "food-tracker",
          name: "Food Tracker",
          icon: "restaurant",
          description: "Log meals and track calories",
          iconColor: TOOL_COLORS.foodTracker.icon,
          iconBgColor: TOOL_COLORS.foodTracker.bg,
          screen: "FoodTracker",
        },
        {
          id: "water-tracker",
          name: "Water Tracker",
          icon: "water",
          description: "Track daily water intake",
          iconColor: TOOL_COLORS.waterTracker.icon,
          iconBgColor: TOOL_COLORS.waterTracker.bg,
          screen: "WaterTracker",
        },
        {
          id: "history",
          name: "History",
          icon: "calendar",
          description: "View your food & water log",
          iconColor: TOOL_COLORS.history.icon,
          iconBgColor: TOOL_COLORS.history.bg,
          screen: "History",
        },
      ],
    },
    {
      id: "daily-essentials",
      name: "Daily Essentials",
      icon: "apps",
      iconColor: SECTION_COLORS.dailyEssentials,
      tools: [
        {
          id: "magnifier",
          name: "Magnifier",
          icon: "search",
          description: "Zoom in to read small text",
          iconColor: TOOL_COLORS.magnifier.icon,
          iconBgColor: TOOL_COLORS.magnifier.bg,
          screen: "Magnifier",
        },
        {
          id: "flashlight",
          name: "Flashlight",
          icon: "flashlight",
          description: "Turn on your phone light",
          iconColor: TOOL_COLORS.flashlight.icon,
          iconBgColor: TOOL_COLORS.flashlight.bg,
          screen: "Flashlight",
        },
        {
          id: "notes",
          name: "Notes",
          icon: "document-text",
          description: "Quick notes and reminders",
          iconColor: TOOL_COLORS.notes.icon,
          iconBgColor: TOOL_COLORS.notes.bg,
          screen: "Notes",
        },
      ],
    },
    {
      id: "phone-helpers",
      name: "Phone Helpers",
      icon: "phone-portrait",
      iconColor: SECTION_COLORS.phoneHelpers,
      tools: [

        {
          id: "share-location",
          name: "Share Location",
          icon: "location",
          description: "Send your location to contacts",
          iconColor: TOOL_COLORS.shareLocation.icon,
          iconBgColor: TOOL_COLORS.shareLocation.bg,
          screen: "ShareLocation",
        },
        {
          id: "find-car",
          name: "Parking",
          icon: "car",
          description: "Remember where you parked",
          iconColor: TOOL_COLORS.parking.icon,
          iconBgColor: TOOL_COLORS.parking.bg,
          screen: "FindMyCar",
        },
      ],
    },
  ];

  const [categories, setCategories] = useState(toolCategories);
  const allTools = categories.flatMap((category) => category.tools);
  const favoriteTools = allTools.filter((tool) => favoriteToolIds.includes(tool.id));

  const moveToolUp = (categoryIndex: number, toolIndex: number) => {
    if (toolIndex > 0) {
      triggerHaptic();
      LayoutAnimation.configureNext(SLOW_WIDGET_ANIMATION);
      const newCategories = [...categories];
      const tools = [...newCategories[categoryIndex].tools];
      [tools[toolIndex - 1], tools[toolIndex]] = [tools[toolIndex], tools[toolIndex - 1]];
      newCategories[categoryIndex] = { ...newCategories[categoryIndex], tools };
      setCategories(newCategories);
    }
  };

  const moveToolDown = (categoryIndex: number, toolIndex: number) => {
    const category = categories[categoryIndex];
    if (toolIndex < category.tools.length - 1) {
      triggerHaptic();
      LayoutAnimation.configureNext(SLOW_WIDGET_ANIMATION);
      const newCategories = [...categories];
      const tools = [...newCategories[categoryIndex].tools];
      [tools[toolIndex], tools[toolIndex + 1]] = [tools[toolIndex + 1], tools[toolIndex]];
      newCategories[categoryIndex] = { ...newCategories[categoryIndex], tools };
      setCategories(newCategories);
    }
  };

  const renderTool = (tool: Tool, showReorderControls: boolean, categoryIndex?: number, toolIndex?: number) => {
    const isFavorite = favoriteToolIds.includes(tool.id);
    const category = categoryIndex !== undefined ? categories[categoryIndex] : null;

    if (isEditMode) {
      return (
        <EditModeToolCard
          key={tool.id}
          tool={tool}
          isFavorite={isFavorite}
          onToggleFavorite={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            LayoutAnimation.configureNext(SLOW_WIDGET_ANIMATION);
            toggleFavoriteTool(tool.id);
          }}
          onMoveUp={categoryIndex !== undefined && toolIndex !== undefined && toolIndex > 0
            ? () => moveToolUp(categoryIndex, toolIndex)
            : undefined
          }
          onMoveDown={categoryIndex !== undefined && toolIndex !== undefined && category && toolIndex < category.tools.length - 1
            ? () => moveToolDown(categoryIndex, toolIndex)
            : undefined
          }
          colors={colors}
          textClasses={textClasses}
          isDark={isDark}
          primary={primary}
        />
      );
    }

    return (
      <ListItemCard
        key={tool.id}
        title={tool.name}
        description={tool.description}
        icon={tool.icon}
        iconColor={tool.iconColor}
        iconBgColor={tool.iconBgColor}
        onPress={() => navigation.navigate(tool.screen)}
        isFavorite={isFavorite}
        colors={colors}
        textClasses={textClasses}
        isDark={isDark}
        hapticEnabled={hapticEnabled}
      />
    );
  };

  return (
    <ScreenErrorBoundary screenName="Tools">
      <Screen variant="static" edges={["top"]} extraBottomPadding={0}>
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          {/* Welcoming Header */}
          <View
            className="px-6 pt-5 pb-4"
            style={{
              backgroundColor: colors.cardBackground,
              borderBottomWidth: 1,
              borderBottomColor: colors.divider,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className={`${textClasses.largeTitle} font-bold`}
                  style={{ color: colors.textPrimary }}
                >
                  Tools
                </Text>
                <Text
                  className={`${textClasses.body} mt-1`}
                  style={{ color: colors.textSecondary }}
                >
                  Helpful features at your fingertips
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  setIsEditMode(!isEditMode);
                }}
                className="px-5 py-2.5 rounded-xl"
                style={{
                  backgroundColor: isEditMode ? primary : primary + "15",
                }}
                accessibilityRole="button"
                accessibilityLabel={isEditMode ? "Done editing" : "Edit tools"}
              >
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: isEditMode ? "#FFFFFF" : primary }}
                >
                  {isEditMode ? "Done" : "Edit"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Tools List */}
          <ScrollView
            className="flex-1 px-5 pt-5"
            showsVerticalScrollIndicator={true}
            bounces={true}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Favorites Section */}
            {favoriteTools.length > 0 && !isEditMode && (
              <View className="mb-5">
                <SectionHeader
                  title="Favorites"
                  icon="star"
                  iconColor={SECTION_COLORS.favorites}
                  colors={colors}
                  textClasses={textClasses}
                />
                {favoriteTools.map((tool) => renderTool(tool, false))}
              </View>
            )}

            {/* All Tools by Category */}
            {categories.map((category, categoryIndex) => (
              <View key={category.id} className="mb-5">
                <SectionHeader
                  title={category.name}
                  icon={category.icon}
                  iconColor={category.iconColor}
                  colors={colors}
                  textClasses={textClasses}
                />
                {category.tools.map((tool, toolIndex) =>
                  renderTool(tool, true, categoryIndex, toolIndex)
                )}
              </View>
            ))}

            {/* Privacy Footer - at end of scroll content */}
            <PrivacyFooter />
          </ScrollView>

          {/* Tips */}
          <InlineTip tipId={TIP_IDS.TOOLS} />
          <AnimatedGuideTip
            tipId={TIP_IDS.TOOLS_EDIT_BUTTON}
            title="Customize Your Tools"
            message="Tap the Edit button to reorder tools and add favorites. Star your most-used tools to see them at the top!"
            icon="pencil-outline"
            arrowPosition="up-right"
            cardPosition="top"
          />
        </View>
      </Screen>
    </ScreenErrorBoundary>
  );
}

// Edit Mode Tool Card - Separate component for edit mode
function EditModeToolCard({
  tool,
  isFavorite,
  onToggleFavorite,
  onMoveUp,
  onMoveDown,
  colors,
  textClasses,
  isDark,
  primary,
}: {
  tool: Tool;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  colors: any;
  textClasses: any;
  isDark: boolean;
  primary: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          height: CARD_HEIGHTS.standard,
          borderRadius: 20,
          backgroundColor: colors.cardBackground,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border + "80",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 2,
        },
      ]}
    >
      {/* Icon with soft background */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: tool.iconBgColor,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <Ionicons name={tool.icon} size={28} color={tool.iconColor} />
      </View>

      {/* Title */}
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text
          className={`${textClasses.body} font-semibold`}
          style={{ color: colors.textPrimary }}
          numberOfLines={1}
        >
          {tool.name}
        </Text>
      </View>

      {/* Favorite Toggle */}
      <Pressable
        onPress={onToggleFavorite}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 8,
          backgroundColor: isFavorite ? colors.warning : colors.divider,
        }}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
      >
        <Ionicons
          name={isFavorite ? "star" : "star-outline"}
          size={22}
          color={isFavorite ? "#FFFFFF" : colors.textTertiary}
        />
      </Pressable>

      {/* Reorder Controls */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        <Pressable
          onPress={onMoveUp}
          disabled={!onMoveUp}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: onMoveUp ? primary : colors.divider,
          }}
          accessibilityRole="button"
          accessibilityLabel={`Move ${tool.name} up`}
        >
          <Ionicons
            name="arrow-up"
            size={18}
            color={onMoveUp ? "#FFFFFF" : colors.textTertiary}
          />
        </Pressable>
        <Pressable
          onPress={onMoveDown}
          disabled={!onMoveDown}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: onMoveDown ? primary : colors.divider,
          }}
          accessibilityRole="button"
          accessibilityLabel={`Move ${tool.name} down`}
        >
          <Ionicons
            name="arrow-down"
            size={18}
            color={onMoveDown ? "#FFFFFF" : colors.textTertiary}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function ToolsScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ToolsHome" component={ToolsHomeScreen} />
      <Stack.Screen
        name="Magnifier"
        component={MagnifierScreen}
        options={{
          headerShown: true,
          headerTitle: "Magnifier",
          headerBackTitle: "Tools",
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="Flashlight"
        component={FlashlightScreen}
        options={{
          headerShown: true,
          headerTitle: "Flashlight",
          headerBackTitle: "Tools",
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="FindMyCar"
        component={FindMyCarScreen}
        options={{
          headerShown: true,
          headerTitle: "Find My Car",
          headerBackTitle: "Tools",
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          headerShown: true,
          headerTitle: "Notes",
          headerBackTitle: "Tools",
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="ShareLocation"
        component={ShareLocationScreen}
        options={{
          headerShown: true,
          headerTitle: "Share Location",
          headerBackTitle: "Tools",
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="FoodTracker"
        component={FoodTrackerScreen}
        options={{
          headerShown: true,
          headerTitle: "Food Tracker",
          headerBackTitle: "Tools",
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="WaterTracker"
        component={WaterTrackerScreen}
        options={{
          headerShown: true,
          headerTitle: "Water Tracker",
          headerBackTitle: "Tools",
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{
          headerShown: true,
          headerTitle: "History",
          headerBackTitle: "Tools",
          headerLargeTitle: false,
        }}
      />
    </Stack.Navigator>
  );
}
