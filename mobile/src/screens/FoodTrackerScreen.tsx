import React, { useState, useMemo, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform, Keyboard, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useHealthStore } from "../state/stores/healthStore";
import { useTipStore } from "../state/stores/tipStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";
import { useTheme } from "../utils/useTheme";
import { useOrientation } from "../utils/useOrientation";
import { useNavigation } from "@react-navigation/native";
import type { MealType, PortionSize, HealthLabel, FoodEntry } from "../types/app";
import { searchFood, getDefaultCalories, getDefaultHealthLabel, searchFoods, CommonFood } from "../utils/commonFoods";
import CustomSwitch from "../components/CustomSwitch";
import { useConfirmModal } from "../components/ConfirmModal";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, Extrapolation } from "react-native-reanimated";
import SwipeableRow from "../components/SwipeableRow";
import { getMealTypeForTime, isCurrentMeal } from "../utils/mealUtils";
import MealScheduleSettings from "../components/settings/MealScheduleSettings";
import { useToast } from "../components/ui";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Calorie goal - can be customized later
const DAILY_CALORIE_GOAL = 2000;

export default function FoodTrackerScreen() {
  const navigation = useNavigation();
  const { alert, destructive } = useConfirmModal();

  // Settings from useSettingsStore
  const textSize = useSettingsStore((s) => s.textSize);
  const foodTrackingEnabled = useSettingsStore((s) => s.foodTrackingEnabled);
  const foodNotificationsEnabled = useSettingsStore((s) => s.foodNotificationsEnabled);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  // Health data from useHealthStore
  const foodEntries = useHealthStore((s) => s.foodEntries);
  const addFoodEntry = useHealthStore((s) => s.addFoodEntry);
  const updateFoodEntry = useHealthStore((s) => s.updateFoodEntry);
  const removeFoodEntry = useHealthStore((s) => s.removeFoodEntry);
  const getTodaysCalories = useHealthStore((s) => s.getTodaysCalories);

  // Tip state from useTipStore
  const dismissedInfoCards = useTipStore((s) => s.dismissedInfoCards || []);
  const dismissInfoCard = useTipStore((s) => s.dismissInfoCard);

  const { showSuccess, ToastComponent } = useToast();
  const { primary, primaryLight, colors } = useTheme();
  const textClasses = getTextSizeClasses(textSize);
  const orientation = useOrientation();
  const isLandscape = orientation === "landscape";
  const horizontalPadding = isLandscape ? 48 : 24;

  // Helper function for checking if card is dismissed
  const isCardDismissed = (cardId: string) => dismissedInfoCards.includes(cardId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");
  const [foodName, setFoodName] = useState("");
  const [portionSize, setPortionSize] = useState<PortionSize>("medium");
  const [healthLabel, setHealthLabel] = useState<HealthLabel>("neutral");
  const [calories, setCalories] = useState(0);
  const [calorieInputText, setCalorieInputText] = useState(""); // For manual calorie input
  const [isCalorieOverride, setIsCalorieOverride] = useState(false); // Track if user manually changed calories
  const [showCalorieOptions, setShowCalorieOptions] = useState(false);
  const [foundFood, setFoundFood] = useState<CommonFood | null>(null);
  const [showFoodDropdown, setShowFoodDropdown] = useState(false);
  const [filteredFoods, setFilteredFoods] = useState<CommonFood[]>([]);
  const [expandedMeals, setExpandedMeals] = useState<Set<MealType>>(() => {
    // Auto-expand current meal section based on time
    const currentMeal = getMealTypeForTime();
    return new Set([currentMeal]);
  });

  const todaysTotalCalories = getTodaysCalories();
  const calorieProgress = Math.min(todaysTotalCalories / DAILY_CALORIE_GOAL, 1);
  const remainingCalories = Math.max(DAILY_CALORIE_GOAL - todaysTotalCalories, 0);

  // Animation for calorie ring
  const progressAnimation = useSharedValue(0);

  useEffect(() => {
    progressAnimation.value = withSpring(calorieProgress, {
      damping: 15,
      stiffness: 80,
    });
  }, [calorieProgress]);

  // Get today's entries grouped by meal type
  const todaysEntries = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return foodEntries.filter((entry) => entry.date.startsWith(today));
  }, [foodEntries]);

  const getMealEntries = (mealType: MealType) => {
    return todaysEntries.filter((entry) => entry.mealType === mealType);
  };

  const getMealCalories = (mealType: MealType) => {
    return getMealEntries(mealType).reduce((sum, entry) => sum + entry.calories, 0);
  };

  const handleOpenAddModal = (mealType: MealType) => {
    setEditingEntry(null);
    setSelectedMealType(mealType);
    setFoodName("");
    setPortionSize("medium");
    setHealthLabel("neutral");
    setCalories(0);
    setCalorieInputText("");
    setIsCalorieOverride(false);
    setShowCalorieOptions(false);
    setFoundFood(null);
    setShowAddModal(true);
  };

  const handleEditEntry = (entry: FoodEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingEntry(entry);
    setSelectedMealType(entry.mealType);
    setFoodName(entry.name);
    setPortionSize(entry.portionSize);
    setHealthLabel(entry.healthLabel);
    setCalories(entry.calories);
    setCalorieInputText(entry.calories.toString());
    setIsCalorieOverride(entry.isCalorieOverride ?? false);
    setShowCalorieOptions(false);
    setFoundFood(null);
    setShowAddModal(true);
  };

  // Toggle meal section expansion
  const toggleMealExpansion = (mealType: MealType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedMeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mealType)) {
        newSet.delete(mealType);
      } else {
        newSet.add(mealType);
      }
      return newSet;
    });
  };

  // Handle manual calorie input
  const handleCalorieInputChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, "");
    setCalorieInputText(numericText);

    if (numericText) {
      const value = parseInt(numericText, 10);
      setCalories(value);
      setIsCalorieOverride(true); // User manually entered calories
    } else {
      // If user clears input and we have a found food, revert to database value
      if (foundFood) {
        const defaultCal = portionSize === "small" ? foundFood.caloriesSmall :
                          portionSize === "large" ? foundFood.caloriesLarge :
                          foundFood.caloriesMedium;
        setCalories(defaultCal);
        setIsCalorieOverride(false);
      } else {
        setCalories(0);
        setIsCalorieOverride(false);
      }
    }
  };

  const handleFoodNameChange = (text: string) => {
    setFoodName(text);

    // Show dropdown and filter foods as user types using improved search
    if (text.trim().length > 0) {
      const results = searchFoods(text, 15);
      setFilteredFoods(results);
      setShowFoodDropdown(results.length > 0);
    } else {
      setShowFoodDropdown(false);
      setFilteredFoods([]);
    }

    // Search for exact match
    const food = searchFood(text);
    if (food) {
      setFoundFood(food);
      setHealthLabel(food.healthLabel);
      // Only auto-set calories if user hasn't manually overridden
      if (!isCalorieOverride) {
        setCalories(food.caloriesMedium);
        setCalorieInputText(food.caloriesMedium.toString());
      }
      setShowCalorieOptions(false);
    } else {
      setFoundFood(null);
      setShowCalorieOptions(text.trim().length > 0);
    }
  };

  const handleSelectFood = (food: CommonFood) => {
    setFoodName(food.name);
    setFoundFood(food);
    setHealthLabel(food.healthLabel);
    // Set calories from database unless user has already overridden
    if (!isCalorieOverride) {
      setCalories(food.caloriesMedium);
      setCalorieInputText(food.caloriesMedium.toString());
    }
    setShowCalorieOptions(false);
    setShowFoodDropdown(false);
    setFilteredFoods([]);
    Keyboard.dismiss();
  };

  const handlePortionSizeChange = (size: PortionSize) => {
    setPortionSize(size);

    // Update calories if we found the food in database AND user hasn't manually overridden
    if (foundFood && !isCalorieOverride) {
      let newCalories = foundFood.caloriesMedium;
      switch (size) {
        case "small":
          newCalories = foundFood.caloriesSmall;
          break;
        case "medium":
          newCalories = foundFood.caloriesMedium;
          break;
        case "large":
          newCalories = foundFood.caloriesLarge;
          break;
      }
      setCalories(newCalories);
      setCalorieInputText(newCalories.toString());
    }
  };

  const handleCalorieLevelSelect = (level: "light" | "medium" | "heavy") => {
    const defaultCalories = getDefaultCalories(level);
    setCalories(defaultCalories);
    setCalorieInputText(defaultCalories.toString());
    setHealthLabel(getDefaultHealthLabel());
    setIsCalorieOverride(false); // These are preset options, not manual override
  };

  const handleSave = () => {
    if (!foodName.trim()) {
      alert("Missing Information", "Please enter a food name.");
      return;
    }

    // Allow 0 calorie items (e.g., water, black coffee, etc.)
    // Only require calories to be set if food is not in database
    if (calories === undefined || (calories === 0 && !foundFood && showCalorieOptions)) {
      // Only show error if it's an unknown food without any calorie selection
      alert("Missing Calories", "Please select a calorie estimate or enter calories manually.");
      return;
    }

    if (editingEntry) {
      updateFoodEntry(editingEntry.id, {
        name: foodName.trim(),
        portionSize,
        healthLabel,
        mealType: selectedMealType,
        calories,
        isCalorieOverride,
      });
      setEditingEntry(null);
    } else {
      const newEntry: FoodEntry = {
        id: `food-${Date.now()}`,
        name: foodName.trim(),
        portionSize,
        healthLabel,
        mealType: selectedMealType,
        calories,
        isCalorieOverride,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      addFoodEntry(newEntry);
      showSuccess(`Added ${portionSize} ${foodName.trim()}`);
    }

    setShowAddModal(false);
    Keyboard.dismiss();
  };

  const handleDeleteEntry = (id: string) => {
    destructive(
      "Delete Meal",
      "Are you sure you want to delete this meal entry?",
      "Delete",
      () => removeFoodEntry(id)
    );
  };

  const getMealIcon = (mealType: MealType): string => {
    switch (mealType) {
      case "breakfast":
        return "sunny";
      case "lunch":
        return "partly-sunny";
      case "dinner":
        return "moon";
      case "snacks":
        return "cafe";
    }
  };

  const getMealColor = (mealType: MealType): string => {
    switch (mealType) {
      case "breakfast":
        return colors.warning;
      case "lunch":
        return colors.info;
      case "dinner":
        return primary;
      case "snacks":
        return colors.error;
    }
  };

  const handleTurnOffTracking = () => {
    destructive(
      "Turn off food tracking?",
      "This will stop showing food reminders. You can turn it back on anytime in Settings.",
      "Turn Off",
      () => {
        updateSettings({
          foodTrackingEnabled: false,
          foodNotificationsEnabled: false,
        });
      }
    );
  };

  const handleGoToSettings = () => {
    navigation.navigate("Settings" as never);
  };

  const getHealthLabelColor = (label: HealthLabel): string => {
    switch (label) {
      case "healthy":
        return colors.success;
      case "neutral":
        return colors.textTertiary;
      case "treat":
        return colors.error;
    }
  };

  // Calorie Summary Card Component
  const CalorieSummaryCard = () => {
    const percentage = Math.round(calorieProgress * 100);
    const isOverGoal = todaysTotalCalories > DAILY_CALORIE_GOAL;

    return (
      <View className="mb-6">
        <LinearGradient
          colors={isOverGoal ? [colors.error + "20", colors.error + "10"] : [primary + "15", primary + "08"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: isOverGoal ? colors.error + "30" : primary + "20",
          }}
        >
          <View className="flex-row items-center justify-between">
            {/* Circular Progress */}
            <View className="items-center justify-center" style={{ width: 100, height: 100 }}>
              {/* Background Ring */}
              <View
                style={{
                  position: "absolute",
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  borderWidth: 8,
                  borderColor: isOverGoal ? colors.error + "20" : primary + "15",
                }}
              />
              {/* Progress Ring - using SVG-like appearance with View */}
              <View
                style={{
                  position: "absolute",
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  borderWidth: 8,
                  borderColor: isOverGoal ? colors.error : primary,
                  borderTopColor: "transparent",
                  borderRightColor: calorieProgress > 0.25 ? (isOverGoal ? colors.error : primary) : "transparent",
                  borderBottomColor: calorieProgress > 0.5 ? (isOverGoal ? colors.error : primary) : "transparent",
                  borderLeftColor: calorieProgress > 0.75 ? (isOverGoal ? colors.error : primary) : "transparent",
                  transform: [{ rotate: "-45deg" }],
                }}
              />
              {/* Inner content */}
              <View className="items-center justify-center">
                <Ionicons
                  name={isOverGoal ? "warning" : "flame"}
                  size={28}
                  color={isOverGoal ? colors.error : primary}
                />
                <Text
                  className="text-xs font-bold mt-1"
                  style={{ color: isOverGoal ? colors.error : primary }}
                >
                  {percentage}%
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View className="flex-1 ml-6">
              <Text
                className="text-sm font-medium mb-1"
                style={{ color: colors.textSecondary }}
              >
                {"Today's Calories"}
              </Text>
              <Text
                className="text-4xl font-bold mb-2"
                style={{ color: isOverGoal ? colors.error : colors.textPrimary }}
              >
                {todaysTotalCalories.toLocaleString()}
              </Text>
              <View className="flex-row items-center">
                <View
                  className="px-3 py-1.5 rounded-full mr-2"
                  style={{ backgroundColor: isOverGoal ? colors.error + "20" : colors.success + "20" }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: isOverGoal ? colors.error : colors.success }}
                  >
                    {isOverGoal ? `+${todaysTotalCalories - DAILY_CALORIE_GOAL} over` : `${remainingCalories} left`}
                  </Text>
                </View>
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  of {DAILY_CALORIE_GOAL.toLocaleString()} goal
                </Text>
              </View>
            </View>
          </View>

          {/* Meal breakdown mini-stats */}
          <View className="flex-row mt-5 pt-4 border-t" style={{ borderTopColor: isOverGoal ? colors.error + "20" : primary + "15" }}>
            {(["breakfast", "lunch", "dinner", "snacks"] as MealType[]).map((meal, index) => {
              const mealCals = getMealCalories(meal);
              const mealColor = getMealColor(meal);
              return (
                <View key={meal} className="flex-1 items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: mealColor + "20" }}
                  >
                    <Ionicons name={getMealIcon(meal) as any} size={22} color={mealColor} />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>
                    {mealCals}
                  </Text>
                  <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 2 }}>
                    {meal.charAt(0).toUpperCase() + meal.slice(1, 3)}
                  </Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderMealSection = (mealType: MealType, title: string) => {
    const entries = getMealEntries(mealType);
    const mealColor = getMealColor(mealType);
    const mealIcon = getMealIcon(mealType);
    const mealCalories = getMealCalories(mealType);
    const isExpanded = expandedMeals.has(mealType);
    const isCurrent = isCurrentMeal(mealType);

    return (
      <View key={mealType} className="mb-5">
        {/* Meal Header Card - Pressable to expand/collapse */}
        <Pressable
          onPress={() => entries.length > 0 ? toggleMealExpansion(mealType) : null}
          style={({ pressed }) => ({
            opacity: entries.length > 0 && pressed ? 0.9 : 1,
          })}
        >
          <LinearGradient
            colors={[mealColor + "12", mealColor + "06"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              borderWidth: isCurrent ? 2 : 1,
              borderColor: isCurrent ? mealColor + "50" : mealColor + "20",
              marginBottom: isExpanded && entries.length > 0 ? 12 : 0,
            }}
          >
            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  {/* Expand/Collapse indicator */}
                  {entries.length > 0 && (
                    <View className="mr-2">
                      <Ionicons
                        name={isExpanded ? "chevron-down" : "chevron-forward"}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                    style={{ backgroundColor: mealColor + "20" }}
                  >
                    <Ionicons name={mealIcon as any} size={24} color={mealColor} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text
                        className={`${textClasses.subtitle} font-bold`}
                        style={{ color: colors.textPrimary, fontSize: 22 }}
                        numberOfLines={1}
                      >
                        {title}
                      </Text>
                      {isCurrent && (
                        <View
                          className="ml-2 px-2 py-1 rounded-full"
                          style={{ backgroundColor: mealColor + "25" }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: "700", color: mealColor }}>
                            NOW
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: "500", color: colors.textSecondary }}>
                      {entries.length === 0
                        ? "No meals logged"
                        : `${entries.length} item${entries.length > 1 ? "s" : ""} • ${mealCalories} cal`}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => handleOpenAddModal(mealType)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}
                >
                  <LinearGradient
                    colors={[mealColor, mealColor + "DD"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 16,
                    }}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="add" size={22} color="#FFFFFF" />
                      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 18, marginLeft: 6 }}>Add</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Meal Entries - Collapsible with SwipeableRow */}
        {isExpanded && entries.length > 0 && (
          <View style={{ gap: 0 }}>
            {entries.map((entry) => (
              <SwipeableRow
                key={entry.id}
                onEdit={() => handleEditEntry(entry)}
                onDelete={() => handleDeleteEntry(entry.id)}
              >
                <View
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.divider,
                  }}
                >
                  <View className="p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 mr-3">
                        <Text
                          style={{ fontSize: 20, fontWeight: "600", color: colors.textPrimary, marginBottom: 8 }}
                          numberOfLines={2}
                        >
                          {entry.name}
                        </Text>
                        <View className="flex-row items-center flex-wrap" style={{ gap: 10 }}>
                          <View
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 14,
                              backgroundColor: getHealthLabelColor(entry.healthLabel) + "15",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "600",
                                textTransform: "capitalize",
                                color: getHealthLabelColor(entry.healthLabel),
                              }}
                            >
                              {entry.healthLabel}
                            </Text>
                          </View>
                          <View
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 14,
                              backgroundColor: colors.divider,
                            }}
                          >
                            <Text style={{ fontSize: 16, fontWeight: "500", textTransform: "capitalize", color: colors.textSecondary }}>
                              {entry.portionSize}
                            </Text>
                          </View>
                          {entry.isCalorieOverride && (
                            <View
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 12,
                                backgroundColor: primary + "15",
                              }}
                            >
                              <Text style={{ fontSize: 14, fontWeight: "500", color: primary }}>
                                Custom cal
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View className="items-end">
                        <Text style={{ fontSize: 28, fontWeight: "700", color: mealColor }}>
                          {entry.calories}
                        </Text>
                        <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 2 }}>
                          calories
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </SwipeableRow>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen variant="static" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingVertical: 24,
          maxWidth: isLandscape ? 900 : undefined,
          alignSelf: "center",
          width: "100%",
        }}
      >
        {/* Tracking Toggle */}
        <View
          className="mb-6 rounded-3xl overflow-hidden"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.divider,
          }}
        >
          <LinearGradient
            colors={foodTrackingEnabled ? [colors.success + "08", "transparent"] : ["transparent", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 20 }}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center flex-1 pr-4">
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: foodTrackingEnabled ? colors.success + "15" : colors.divider }}
                >
                  <Ionicons
                    name={foodTrackingEnabled ? "checkmark-circle" : "restaurant-outline"}
                    size={24}
                    color={foodTrackingEnabled ? colors.success : colors.textSecondary}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`${textClasses.subtitle} font-bold`} style={{ color: colors.textPrimary }}>
                    Track my food
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    {foodTrackingEnabled ? "Tracking active" : "Turn on to start"}
                  </Text>
                </View>
              </View>
              <CustomSwitch
                value={foodTrackingEnabled}
                onValueChange={(value: boolean) => updateSettings({ foodTrackingEnabled: value })}
                inactiveTrackColor={colors.divider}
                activeTrackColor={colors.success}
                activeThumbColor={colors.toggleThumb}
                inactiveThumbColor={colors.toggleThumb}
                accessibilityLabel="Toggle food tracking"
              />
            </View>
          </LinearGradient>
        </View>

        {!foodTrackingEnabled ? (
          /* Off State Card */
          <View className="mt-8">
            <LinearGradient
              colors={[primary + "10", primary + "05"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 28,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: primary + "20",
              }}
            >
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-6"
                style={{ backgroundColor: primary + "15" }}
              >
                <Ionicons name="restaurant-outline" size={48} color={primary} />
              </View>
              <Text className="text-2xl font-bold text-center mb-3" style={{ color: colors.textPrimary }}>
                Food tracking is off
              </Text>
              <Text className="text-base text-center leading-relaxed" style={{ maxWidth: 280, color: colors.textSecondary }}>
                Turn on food tracking above to log meals and monitor your daily calorie intake.
              </Text>

              {/* Feature highlights */}
              <View className="mt-6 w-full" style={{ gap: 12 }}>
                {[
                  { icon: "flame-outline", text: "Track daily calories" },
                  { icon: "nutrition-outline", text: "Log breakfast, lunch & dinner" },
                  { icon: "analytics-outline", text: "Monitor eating habits" },
                ].map((item, index) => (
                  <View key={index} className="flex-row items-center px-4">
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: primary + "15" }}
                    >
                      <Ionicons name={item.icon as any} size={16} color={primary} />
                    </View>
                    <Text className="text-sm" style={{ color: colors.textSecondary }}>
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        ) : (
          /* Meal Sections - Tracking Enabled */
          <>
            {/* Calorie Summary Card */}
            <CalorieSummaryCard />

            {/* Meal Schedule Settings - Collapsible */}
            <View className="mb-5">
              <MealScheduleSettings />
            </View>

            {/* Food Tracker Tips Info Card - Compact Version */}
            {!isCardDismissed("food-tracker-tips") && (
              <Pressable
                onPress={() => dismissInfoCard("food-tracker-tips")}
                className="mb-5"
              >
                <View
                  className="rounded-2xl p-4 flex-row items-center"
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderWidth: 1,
                    borderColor: colors.divider,
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: primary + "15" }}
                  >
                    <Ionicons name="bulb" size={20} color={primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      Quick Tip
                    </Text>
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      Type food names to auto-fill calories. Swipe entries left to edit or delete.
                    </Text>
                  </View>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </View>
              </Pressable>
            )}

            {renderMealSection("breakfast", "Breakfast")}
            {renderMealSection("lunch", "Lunch")}
            {renderMealSection("dinner", "Dinner")}
            {renderMealSection("snacks", "Snacks")}

            {/* Bottom Spacing */}
            <View style={{ height: 20 }} />
          </>
        )}
      </ScrollView>

      {ToastComponent}

      {/* Add Meal Modal - Only show when tracking is enabled */}
      {foodTrackingEnabled && (
        <Modal
          visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/50"
        >
          <Pressable
            className="flex-1"
            onPress={() => {
              Keyboard.dismiss();
              setShowAddModal(false);
            }}
          />
          <SafeAreaView className="rounded-t-3xl" style={{ backgroundColor: colors.cardBackground }} edges={["bottom"]}>
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b" style={{ borderBottomColor: colors.divider }}>
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  setEditingEntry(null);
                }}
                className="py-2"
              >
                <Text className={`${textClasses.button}`} style={{ color: colors.textSecondary }}>
                  Cancel
                </Text>
              </Pressable>
              <Text className={`${textClasses.subtitle} font-semibold`} style={{ color: colors.textPrimary }}>
                {editingEntry ? "Edit Meal" : "Add Meal"}
              </Text>
              <Pressable
                onPress={handleSave}
                disabled={!foodName.trim() || (calories === 0 && !foundFood && showCalorieOptions)}
                className="py-2"
              >
                <Text
                  className={`${textClasses.button} font-semibold`}
                  style={{ color: foodName.trim() && (calories > 0 || foundFood) ? primary : "#D1D5DB" }}
                >
                  Save
                </Text>
              </Pressable>
            </View>

            <ScrollView className="px-6 py-6 max-h-[500px]" keyboardShouldPersistTaps="handled">
              {/* Food Name */}
              <View className="mb-6">
                <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                  Food Name
                </Text>
                <View>
                  <TextInput
                    value={foodName}
                    onChangeText={handleFoodNameChange}
                    placeholder="Start typing to search..."
                    className={`rounded-2xl px-4 py-4 border-2 ${textClasses.body}`}
                    style={{ backgroundColor: colors.background, borderColor: colors.divider, color: colors.textPrimary }}
                    placeholderTextColor={colors.textSecondary}
                    autoFocus={true}
                  />

                  {/* Autocomplete Dropdown */}
                  {showFoodDropdown && filteredFoods.length > 0 && (
                    <View className="mt-2 border-2 rounded-2xl max-h-60 overflow-hidden" style={{ backgroundColor: colors.cardBackground, borderColor: colors.divider }}>
                      <ScrollView
                        className="max-h-60"
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {filteredFoods.map((food, index) => (
                          <Pressable
                            key={`${food.name}-${index}`}
                            onPress={() => handleSelectFood(food)}
                            className="px-4 py-5 border-b"
                            style={{ borderBottomColor: colors.divider }}
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1">
                                <Text className={`${textClasses.body} font-medium`} style={{ color: colors.textPrimary }}>
                                  {food.name}
                                </Text>
                                <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textSecondary }}>
                                  {food.caloriesMedium} cal (medium) • {food.healthLabel}
                                </Text>
                              </View>
                              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                            </View>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {foundFood && (
                    <View className="mt-2 flex-row items-center">
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text className={`${textClasses.small} ml-1`} style={{ color: colors.success }}>
                        Found in database! {foundFood.caloriesMedium} cal (medium)
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Portion Size */}
              <View className="mb-6">
                <Text className={`${textClasses.body} font-semibold mb-3`} style={{ color: colors.textPrimary }}>
                  Portion Size
                </Text>
                <View className="flex-row space-x-3">
                  {(["small", "medium", "large"] as PortionSize[]).map((size) => (
                    <Pressable
                      key={size}
                      onPress={() => handlePortionSizeChange(size)}
                      className={`flex-1 py-4 rounded-2xl border-2 ${
                        portionSize === size ? "border-current" : "border-gray-200"
                      }`}
                      style={{
                        backgroundColor: portionSize === size ? primaryLight + "20" : "white",
                        borderColor: portionSize === size ? primary : "#E5E7EB",
                      }}
                    >
                      <Text
                        className={`${textClasses.button} text-center font-semibold capitalize`}
                        style={{ color: portionSize === size ? primary : "#6B7280" }}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Health Label */}
              <View className="mb-6">
                <Text className={`${textClasses.body} font-semibold mb-3`} style={{ color: colors.textPrimary }}>
                  Health Label
                </Text>
                <View className="flex-row space-x-3">
                  {(["healthy", "neutral", "treat"] as HealthLabel[]).map((label) => (
                    <Pressable
                      key={label}
                      onPress={() => setHealthLabel(label)}
                      className={`flex-1 py-4 rounded-2xl border-2 ${
                        healthLabel === label ? "border-current" : "border-gray-200"
                      }`}
                      style={{
                        backgroundColor:
                          healthLabel === label ? getHealthLabelColor(label) + "20" : "white",
                        borderColor: healthLabel === label ? getHealthLabelColor(label) : "#E5E7EB",
                      }}
                    >
                      <Text
                        className={`${textClasses.button} text-center font-semibold capitalize`}
                        style={{
                          color: healthLabel === label ? getHealthLabelColor(label) : "#6B7280",
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Calorie Options (for unknown foods) */}
              {showCalorieOptions && !foundFood && (
                <View className="mb-6">
                  <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                    Calorie Estimate
                  </Text>
                  <Text className={`${textClasses.small} mb-3`} style={{ color: colors.textSecondary }}>
                    This food is not in our database. Please select a calorie estimate:
                  </Text>
                  <View className="flex-row space-x-3">
                    <Pressable
                      onPress={() => handleCalorieLevelSelect("light")}
                      className={`flex-1 py-4 rounded-2xl border-2 ${
                        calories === 150 ? "border-current" : "border-gray-200"
                      }`}
                      style={{
                        backgroundColor: calories === 150 ? primaryLight + "20" : "white",
                        borderColor: calories === 150 ? primary : "#E5E7EB",
                      }}
                    >
                      <Text
                        className={`${textClasses.button} text-center font-semibold`}
                        style={{ color: calories === 150 ? primary : "#6B7280" }}
                      >
                        Light
                      </Text>
                      <Text className={`${textClasses.small} text-center mt-1`} style={{ color: colors.textSecondary }}>
                        150 cal
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleCalorieLevelSelect("medium")}
                      className={`flex-1 py-4 rounded-2xl border-2 ${
                        calories === 350 ? "border-current" : "border-gray-200"
                      }`}
                      style={{
                        backgroundColor: calories === 350 ? primaryLight + "20" : "white",
                        borderColor: calories === 350 ? primary : "#E5E7EB",
                      }}
                    >
                      <Text
                        className={`${textClasses.button} text-center font-semibold`}
                        style={{ color: calories === 350 ? primary : "#6B7280" }}
                      >
                        Medium
                      </Text>
                      <Text className={`${textClasses.small} text-center mt-1`} style={{ color: colors.textSecondary }}>
                        350 cal
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleCalorieLevelSelect("heavy")}
                      className={`flex-1 py-4 rounded-2xl border-2 ${
                        calories === 600 ? "border-current" : "border-gray-200"
                      }`}
                      style={{
                        backgroundColor: calories === 600 ? primaryLight + "20" : "white",
                        borderColor: calories === 600 ? primary : "#E5E7EB",
                      }}
                    >
                      <Text
                        className={`${textClasses.button} text-center font-semibold`}
                        style={{ color: calories === 600 ? primary : "#6B7280" }}
                      >
                        Heavy
                      </Text>
                      <Text className={`${textClasses.small} text-center mt-1`} style={{ color: colors.textSecondary }}>
                        600 cal
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Editable Calories Input - Always visible when food name is entered */}
              {foodName.trim().length > 0 && (
                <View className="rounded-2xl p-4 border" style={{ backgroundColor: colors.background, borderColor: isCalorieOverride ? primary : colors.divider }}>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                      {foundFood ? "Calories (editable)" : "Enter Calories"}
                    </Text>
                    {isCalorieOverride && (
                      <View className="flex-row items-center">
                        <View className="px-2 py-1 rounded-full mr-2" style={{ backgroundColor: primary + "15" }}>
                          <Text style={{ fontSize: 11, fontWeight: "600", color: primary }}>Custom</Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            // Reset to database value if available
                            if (foundFood) {
                              const defaultCal = portionSize === "small" ? foundFood.caloriesSmall :
                                                portionSize === "large" ? foundFood.caloriesLarge :
                                                foundFood.caloriesMedium;
                              setCalories(defaultCal);
                              setCalorieInputText(defaultCal.toString());
                              setIsCalorieOverride(false);
                            }
                          }}
                          className="px-2 py-1"
                        >
                          <Text style={{ fontSize: 12, color: colors.textSecondary, textDecorationLine: "underline" }}>Reset</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center">
                    <TextInput
                      value={calorieInputText}
                      onChangeText={handleCalorieInputChange}
                      placeholder="0"
                      keyboardType="number-pad"
                      className="text-3xl font-bold flex-1"
                      style={{ color: primary, minWidth: 80 }}
                      placeholderTextColor={colors.textSecondary + "50"}
                      maxLength={5}
                    />
                    <Text className="text-xl font-medium ml-2" style={{ color: colors.textSecondary }}>
                      cal
                    </Text>
                  </View>
                  {foundFood && !isCalorieOverride && (
                    <Text className={`${textClasses.small} mt-2`} style={{ color: colors.success }}>
                      Auto-filled from database. Tap to customize.
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
      )}
    </Screen>
  );
}
