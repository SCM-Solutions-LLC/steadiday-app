import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { SubpageHeader } from "../components/ui";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useTheme } from "../utils/useTheme";
import { getTextSizeClasses } from "../utils/textSizes";
import { ScreenErrorBoundary } from "../components/ui";

type Gender = "female" | "male";

interface Screening {
  id: string;
  name: string;
  frequency: string;
  description: string;
  ageNote?: string;
  isImportant?: boolean;
}

interface ScreeningCategory {
  id: string;
  name: string;
  icon: string;
  screenings: Screening[];
  genderSpecific?: Gender;
}

const SCREENING_CATEGORIES: ScreeningCategory[] = [
  {
    id: "routine",
    name: "Routine Checkups",
    icon: "medical",
    screenings: [
      {
        id: "wellness-visit",
        name: "Annual Wellness Visit",
        frequency: "Yearly",
        description: "Comprehensive health assessment with your primary care doctor, including medication review and preventive care planning.",
      },
      {
        id: "blood-pressure",
        name: "Blood Pressure Check",
        frequency: "Yearly",
        description: "Monitor blood pressure to detect hypertension early. More frequent checks if you have high blood pressure.",
      },
      {
        id: "cholesterol",
        name: "Cholesterol Screening",
        frequency: "Every 4-6 years",
        description: "Lipid panel to check total cholesterol, HDL, LDL, and triglycerides.",
      },
      {
        id: "diabetes",
        name: "Diabetes Screening",
        frequency: "Every 3 years",
        description: "Fasting blood glucose or A1C test to check for diabetes or prediabetes.",
      },
    ],
  },
  {
    id: "cancer",
    name: "Cancer Screenings",
    icon: "shield-checkmark",
    screenings: [
      {
        id: "colorectal",
        name: "Colorectal Cancer Screening",
        frequency: "Every 10 years",
        description: "Colonoscopy or other screening tests to detect polyps or early cancer.",
        ageNote: "Recommended until age 75",
      },
      {
        id: "lung",
        name: "Lung Cancer Screening",
        frequency: "Yearly",
        description: "Low-dose CT scan for adults with significant smoking history.",
        ageNote: "For eligible adults 50-80 with 20+ pack-year smoking history",
      },
    ],
  },
  {
    id: "vision-hearing",
    name: "Vision & Hearing",
    icon: "eye",
    screenings: [
      {
        id: "eye-exam",
        name: "Eye Exam",
        frequency: "Every 1-2 years",
        description: "Comprehensive eye exam to check vision, glaucoma, cataracts, and macular degeneration.",
      },
      {
        id: "hearing",
        name: "Hearing Test",
        frequency: "Every 3 years",
        description: "Audiological evaluation to detect hearing loss.",
        ageNote: "Recommended every 3 years after age 60",
      },
    ],
  },
  {
    id: "dental",
    name: "Dental Care",
    icon: "happy",
    screenings: [
      {
        id: "dental-exam",
        name: "Dental Exam & Cleaning",
        frequency: "Every 6 months",
        description: "Professional cleaning and oral health examination to prevent gum disease and detect oral cancer.",
      },
    ],
  },
  {
    id: "vaccinations",
    name: "Vaccinations",
    icon: "bandage",
    screenings: [
      {
        id: "flu",
        name: "Flu Shot",
        frequency: "Yearly",
        description: "Annual influenza vaccination, best given in September-October before flu season.",
        isImportant: true,
      },
      {
        id: "pneumonia",
        name: "Pneumonia Vaccines",
        frequency: "At 65+",
        description: "Two vaccines (PCV15/PCV20 and PPSV23) to protect against pneumococcal disease.",
        isImportant: true,
      },
      {
        id: "shingles",
        name: "Shingles Vaccine",
        frequency: "2 doses",
        description: "Shingrix vaccine given in two doses, 2-6 months apart. Recommended for adults 50+.",
        isImportant: true,
      },
      {
        id: "covid",
        name: "COVID-19 Vaccine",
        frequency: "Per CDC guidelines",
        description: "Stay up to date with recommended COVID-19 vaccines and boosters.",
        isImportant: true,
      },
    ],
  },
  {
    id: "women",
    name: "Women's Health",
    icon: "female",
    genderSpecific: "female",
    screenings: [
      {
        id: "mammogram",
        name: "Mammogram",
        frequency: "Every 1-2 years",
        description: "Breast cancer screening with mammography.",
        ageNote: "Recommended until age 75, or based on individual risk",
        isImportant: true,
      },
      {
        id: "bone-density-women",
        name: "Bone Density Scan (DEXA)",
        frequency: "Every 2 years",
        description: "Screen for osteoporosis to prevent fractures.",
        ageNote: "Recommended for women 65+",
        isImportant: true,
      },
    ],
  },
  {
    id: "men",
    name: "Men's Health",
    icon: "male",
    genderSpecific: "male",
    screenings: [
      {
        id: "prostate",
        name: "Prostate Cancer Discussion",
        frequency: "Discuss with doctor",
        description: "Talk with your doctor about whether PSA testing is right for you based on your risk factors.",
      },
      {
        id: "aaa",
        name: "Abdominal Aortic Aneurysm",
        frequency: "One-time",
        description: "Ultrasound screening for men with smoking history.",
        ageNote: "One-time screening for men 65-75 who have ever smoked",
      },
      {
        id: "bone-density-men",
        name: "Bone Density Scan",
        frequency: "If at risk",
        description: "Screen for osteoporosis if you have risk factors.",
        ageNote: "Consider at age 70+ or if at risk",
      },
    ],
  },
];

export default function HealthScreeningsScreen() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const textClasses = getTextSizeClasses(textSize);

  const [selectedGender, setSelectedGender] = useState<Gender>("female");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["routine"]);

  const toggleCategory = useCallback((categoryId: string) => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }, [hapticEnabled]);

  const handleGenderToggle = useCallback((gender: Gender) => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedGender(gender);
  }, [hapticEnabled]);

  const filteredCategories = SCREENING_CATEGORIES.filter((category) => {
    if (!category.genderSpecific) return true;
    return category.genderSpecific === selectedGender;
  });

  const renderScreening = (screening: Screening) => (
    <View
      key={screening.id}
      className="p-4 rounded-2xl mb-3 border"
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: screening.isImportant ? colors.success : colors.border,
        borderWidth: screening.isImportant ? 2 : 1,
      }}
    >
      <View className="flex-row items-start">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Text
              className={`${textClasses.body} font-semibold flex-1`}
              style={{ color: colors.textPrimary }}
            >
              {screening.name}
            </Text>
            {screening.isImportant && (
              <View
                className="px-2 py-1 rounded-full ml-2"
                style={{ backgroundColor: colors.successBackground }}
              >
                <Text className={`${textClasses.small} font-medium`} style={{ color: colors.onSuccess }}>
                  Important
                </Text>
              </View>
            )}
          </View>
          <View
            className="self-start px-3 py-1 rounded-full mb-2"
            style={{ backgroundColor: primary + "20" }}
          >
            <Text className={`${textClasses.small} font-medium`} style={{ color: primary }}>
              {screening.frequency}
            </Text>
          </View>
          <Text
            className={`${textClasses.small} leading-relaxed`}
            style={{ color: colors.textSecondary }}
          >
            {screening.description}
          </Text>
          {screening.ageNote && (
            <Text
              className={`${textClasses.small} mt-2 italic`}
              style={{ color: colors.textTertiary }}
            >
              {screening.ageNote}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderCategory = (category: ScreeningCategory) => {
    const isExpanded = expandedCategories.includes(category.id);

    return (
      <View key={category.id} className="mb-4">
        <Pressable
          onPress={() => toggleCategory(category.id)}
          className="flex-row items-center p-5 rounded-2xl border-2"
          style={{
            backgroundColor: colors.cardBackground,
            borderColor: isExpanded ? primary : colors.border,
            minHeight: 72,
          }}
          accessibilityRole="button"
          accessibilityLabel={`${category.name}, ${category.screenings.length} screenings`}
          accessibilityState={{ expanded: isExpanded }}
        >
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
            style={{ backgroundColor: primaryLight }}
          >
            <Ionicons name={category.icon as any} size={28} color={primary} />
          </View>
          <View className="flex-1">
            <Text
              className={`${textClasses.subtitle} font-semibold`}
              style={{ color: colors.textPrimary }}
            >
              {category.name}
            </Text>
            <Text
              className={`${textClasses.small}`}
              style={{ color: colors.textSecondary }}
            >
              {category.screenings.length} screening{category.screenings.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={colors.textSecondary}
          />
        </Pressable>

        {isExpanded && (
          <View className="mt-3 ml-4">
            {category.screenings.map(renderScreening)}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenErrorBoundary screenName="HealthScreenings">
      <Screen variant="scroll" edges={["top"]}>
        {/* Header - SENIOR-FRIENDLY: Labeled back button */}
        <SubpageHeader
          title="Health Screenings"
          backLabel="Health"
          onBack={() => navigation.goBack()}
        />

        <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={true}>
          {/* Intro */}
          <Text
            className={`${textClasses.body} mb-4`}
            style={{ color: colors.textSecondary }}
          >
            Recommended preventive screenings for adults 65+. Discuss with your doctor which screenings are right for you.
          </Text>

          {/* Gender Toggle */}
          <View
            className="flex-row rounded-2xl p-2 mb-6"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Pressable
              onPress={() => handleGenderToggle("female")}
              className="flex-1 flex-row items-center justify-center py-4 rounded-xl"
              style={{
                backgroundColor: selectedGender === "female" ? primary : "transparent",
                minHeight: 56,
              }}
              accessibilityRole="tab"
              accessibilityLabel="Female screenings"
              accessibilityState={{ selected: selectedGender === "female" }}
            >
              <Ionicons
                name="female"
                size={22}
                color={selectedGender === "female" ? "white" : colors.textSecondary}
                style={{ marginRight: 8 }}
              />
              <Text
                className={`${textClasses.body} font-semibold`}
                style={{ color: selectedGender === "female" ? "white" : colors.textSecondary }}
              >
                Female
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleGenderToggle("male")}
              className="flex-1 flex-row items-center justify-center py-4 rounded-xl"
              style={{
                backgroundColor: selectedGender === "male" ? primary : "transparent",
                minHeight: 56,
              }}
              accessibilityRole="tab"
              accessibilityLabel="Male screenings"
              accessibilityState={{ selected: selectedGender === "male" }}
            >
              <Ionicons
                name="male"
                size={22}
                color={selectedGender === "male" ? "white" : colors.textSecondary}
                style={{ marginRight: 8 }}
              />
              <Text
                className={`${textClasses.body} font-semibold`}
                style={{ color: selectedGender === "male" ? "white" : colors.textSecondary }}
              >
                Male
              </Text>
            </Pressable>
          </View>

          {/* Categories */}
          {filteredCategories.map(renderCategory)}

          {/* Medical Disclaimer */}
          <View
            className="p-5 rounded-2xl mb-4 border"
            style={{ backgroundColor: colors.warningBackground, borderColor: colors.warning }}
          >
            <View className="flex-row items-start">
              <Ionicons
                name="warning"
                size={24}
                color={colors.warning}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <View className="flex-1">
                <Text
                  className={`${textClasses.body} font-semibold mb-2`}
                  style={{ color: colors.onWarning }}
                >
                  Medical Disclaimer
                </Text>
                <Text
                  className={`${textClasses.small} leading-relaxed`}
                  style={{ color: colors.textSecondary }}
                >
                  This information is for educational purposes only and should not replace professional medical advice. Always consult your healthcare provider about which screenings are appropriate for your individual health needs.
                </Text>
              </View>
            </View>
          </View>

          {/* Sources */}
          <View
            className="p-4 rounded-2xl mb-8"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text
              className={`${textClasses.small} font-semibold mb-2`}
              style={{ color: colors.textPrimary }}
            >
              Sources
            </Text>
            <Text
              className={`${textClasses.small} leading-relaxed`}
              style={{ color: colors.textSecondary }}
            >
              U.S. Preventive Services Task Force (USPSTF), Centers for Disease Control and Prevention (CDC), Medicare Preventive Services
            </Text>
          </View>
        </ScrollView>
      </Screen>
    </ScreenErrorBoundary>
  );
}
