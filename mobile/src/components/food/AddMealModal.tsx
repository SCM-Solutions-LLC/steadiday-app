import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useSettingsStore } from "../../state/stores/settingsStore";
import type { MealType, PortionSize, HealthLabel } from "../../types/app";
import { searchFood, getAllFoodNames, CommonFood } from "../../utils/commonFoods";

interface AddMealModalProps {
  visible: boolean;
  mealType: MealType;
  onClose: () => void;
  onSave: (entry: {
    name: string;
    mealType: MealType;
    portionSize: PortionSize;
    healthLabel: HealthLabel;
    calories: number;
  }) => void;
}

export default function AddMealModal({ visible, mealType, onClose, onSave }: AddMealModalProps) {
  const { primary, primaryLight, colors } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  const [foodName, setFoodName] = useState("");
  const [portionSize, setPortionSize] = useState<PortionSize>("medium");
  const [healthLabel, setHealthLabel] = useState<HealthLabel>("neutral");
  const [calories, setCalories] = useState(0);
  const [showCalorieOptions, setShowCalorieOptions] = useState(false);
  const [foundFood, setFoundFood] = useState<CommonFood | null>(null);
  const [showFoodDropdown, setShowFoodDropdown] = useState(false);
  const [filteredFoods, setFilteredFoods] = useState<CommonFood[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setFoodName("");
      setPortionSize("medium");
      setHealthLabel("neutral");
      setCalories(0);
      setShowCalorieOptions(false);
      setFoundFood(null);
      setShowFoodDropdown(false);
      setFilteredFoods([]);
    }
  }, [visible]);

  const getMealTitle = (type: MealType): string => {
    switch (type) {
      case "breakfast": return "Add Breakfast";
      case "lunch": return "Add Lunch";
      case "dinner": return "Add Dinner";
      case "snacks": return "Add Snack";
    }
  };

  const handleFoodNameChange = (text: string) => {
    setFoodName(text);

    // Show dropdown and filter foods as user types
    if (text.trim().length > 0) {
      const allFoods = getAllFoodNames();
      const filtered = allFoods
        .filter(name => name.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 10); // Limit to 10 suggestions

      setFilteredFoods(filtered.map(name => {
        const food = searchFood(name);
        return food!;
      }).filter(Boolean));

      setShowFoodDropdown(filtered.length > 0);
    } else {
      setShowFoodDropdown(false);
      setFilteredFoods([]);
    }

    // Search for exact match
    const food = searchFood(text);
    if (food) {
      setFoundFood(food);
      setHealthLabel(food.healthLabel);
      setCalories(food.caloriesMedium);
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
    setCalories(food.caloriesMedium);
    setShowCalorieOptions(false);
    setShowFoodDropdown(false);
    setFilteredFoods([]);
    Keyboard.dismiss();
  };

  const handlePortionSizeChange = (size: PortionSize) => {
    setPortionSize(size);

    // Update calories if we found the food in database
    if (foundFood) {
      switch (size) {
        case "small":
          setCalories(foundFood.caloriesSmall);
          break;
        case "medium":
          setCalories(foundFood.caloriesMedium);
          break;
        case "large":
          setCalories(foundFood.caloriesLarge);
          break;
      }
    }
  };

  const handleCalorieLevelSelect = (level: "light" | "medium" | "heavy") => {
    switch (level) {
      case "light":
        setCalories(150);
        break;
      case "medium":
        setCalories(350);
        break;
      case "heavy":
        setCalories(600);
        break;
    }
  };

  const handleSave = () => {
    if (!foodName.trim() || !calories) return;

    onSave({
      name: foodName.trim(),
      mealType,
      portionSize,
      healthLabel,
      calories,
    });
    onClose();
  };

  const portionSizes: PortionSize[] = ["small", "medium", "large"];
  const healthLabels: HealthLabel[] = ["healthy", "neutral", "treat"];

  const getHealthLabelColor = (label: HealthLabel): string => {
    switch (label) {
      case "healthy": return "#10B981";
      case "neutral": return "#6B7280";
      case "treat": return "#EF4444";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black/50"
      >
        <Pressable
          className="flex-1"
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <SafeAreaView className="rounded-t-3xl" style={{ backgroundColor: colors.cardBackground }} edges={["bottom"]}>
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b" style={{ borderBottomColor: colors.divider }}>
            <Pressable onPress={onClose} className="py-2">
              <Text className={`${textClasses.button}`} style={{ color: colors.textSecondary }}>
                Cancel
              </Text>
            </Pressable>
            <Text className={`${textClasses.subtitle} font-semibold`} style={{ color: colors.textPrimary }}>
              {getMealTitle(mealType)}
            </Text>
            <Pressable
              onPress={handleSave}
              disabled={!foodName.trim() || !calories}
              className="py-2"
            >
              <Text
                className={`${textClasses.button} font-semibold`}
                style={{ color: foodName.trim() && calories ? primary : "#D1D5DB" }}
              >
                Save
              </Text>
            </Pressable>
          </View>

          <ScrollView className="px-6 py-6 max-h-[500px]">
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
                    >
                      {filteredFoods.map((food, index) => (
                        <Pressable
                          key={`${food.name}-${index}`}
                          onPress={() => handleSelectFood(food)}
                          className="px-4 py-5 border-b"
                          style={{ borderBottomColor: colors.divider }}
                        >
                          <View className="flex-row items-center justify-between">
                            <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                              {food.name}
                            </Text>
                            <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                              {food.caloriesMedium} cal
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Portion Size */}
            <View className="mb-6">
              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Portion Size
              </Text>
              <View className="flex-row space-x-3">
                {portionSizes.map((size) => (
                  <Pressable
                    key={size}
                    onPress={() => handlePortionSizeChange(size)}
                    className="flex-1 py-4 rounded-2xl border-2"
                    style={{
                      backgroundColor: portionSize === size ? primaryLight + "20" : colors.cardBackground,
                      borderColor: portionSize === size ? primary : colors.divider,
                    }}
                  >
                    <Text
                      className={`${textClasses.button} text-center font-semibold capitalize`}
                      style={{ color: portionSize === size ? primary : colors.textSecondary }}
                    >
                      {size}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Health Label */}
            <View className="mb-6">
              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Health Label
              </Text>
              <View className="flex-row space-x-3">
                {healthLabels.map((label) => (
                  <Pressable
                    key={label}
                    onPress={() => setHealthLabel(label)}
                    className="flex-1 py-4 rounded-2xl border-2"
                    style={{
                      backgroundColor: healthLabel === label ? getHealthLabelColor(label) + "20" : colors.cardBackground,
                      borderColor: healthLabel === label ? getHealthLabelColor(label) : colors.divider,
                    }}
                  >
                    <Text
                      className={`${textClasses.button} text-center font-semibold capitalize`}
                      style={{ color: healthLabel === label ? getHealthLabelColor(label) : colors.textSecondary }}
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
                    className="flex-1 py-4 rounded-2xl border-2"
                    style={{
                      backgroundColor: calories === 150 ? primaryLight + "20" : colors.cardBackground,
                      borderColor: calories === 150 ? primary : colors.divider,
                    }}
                  >
                    <Text
                      className={`${textClasses.button} text-center font-semibold`}
                      style={{ color: calories === 150 ? primary : colors.textSecondary }}
                    >
                      Light
                    </Text>
                    <Text className={`${textClasses.small} text-center mt-1`} style={{ color: colors.textSecondary }}>
                      150 cal
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleCalorieLevelSelect("medium")}
                    className="flex-1 py-4 rounded-2xl border-2"
                    style={{
                      backgroundColor: calories === 350 ? primaryLight + "20" : colors.cardBackground,
                      borderColor: calories === 350 ? primary : colors.divider,
                    }}
                  >
                    <Text
                      className={`${textClasses.button} text-center font-semibold`}
                      style={{ color: calories === 350 ? primary : colors.textSecondary }}
                    >
                      Medium
                    </Text>
                    <Text className={`${textClasses.small} text-center mt-1`} style={{ color: colors.textSecondary }}>
                      350 cal
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleCalorieLevelSelect("heavy")}
                    className="flex-1 py-4 rounded-2xl border-2"
                    style={{
                      backgroundColor: calories === 600 ? primaryLight + "20" : colors.cardBackground,
                      borderColor: calories === 600 ? primary : colors.divider,
                    }}
                  >
                    <Text
                      className={`${textClasses.button} text-center font-semibold`}
                      style={{ color: calories === 600 ? primary : colors.textSecondary }}
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

            {/* Calories Display */}
            {calories > 0 && (
              <View className="rounded-2xl p-4 border" style={{ backgroundColor: colors.background, borderColor: colors.divider }}>
                <Text className={`${textClasses.small} mb-1`} style={{ color: colors.textSecondary }}>
                  Estimated Calories
                </Text>
                <Text className="text-3xl font-bold" style={{ color: primary }}>
                  {calories} cal
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
