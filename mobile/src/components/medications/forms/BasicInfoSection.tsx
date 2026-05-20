import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { FormSectionProps } from "../types";
import {
  uniqueCommonMedications,
  getDosageSuggestionsForMedication,
} from "../../../utils/medicationData";
import { fuzzyFilterStrings } from "../../../utils/fuzzySearch";
import { searchDrugNames } from "../../../api/rxnorm";
import { logger } from "../../../utils/logger";

export function BasicInfoSection({
  formState,
  updateField,
  textClasses,
  colors,
  primary,
  primaryLight,
}: FormSectionProps) {
  const { name, dosage, showNameSuggestions, showDosageSuggestions } =
    formState;

  // State for RxNorm API results
  const [rxNormSuggestions, setRxNormSuggestions] = useState<string[]>([]);
  const [isLoadingRxNorm, setIsLoadingRxNorm] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch RxNorm suggestions when name changes (debounced)
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't search if name is too short
    if (name.trim().length < 2) {
      setRxNormSuggestions([]);
      setIsLoadingRxNorm(false);
      return;
    }

    // Debounce the API call by 300ms
    setIsLoadingRxNorm(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        logger.log("[BasicInfoSection] Fetching RxNorm suggestions for:", name);
        const results = await searchDrugNames(name, 15);
        setRxNormSuggestions(results);
        logger.log("[BasicInfoSection] Got", results.length, "RxNorm results");
      } catch (error) {
        logger.error("[BasicInfoSection] RxNorm search error:", error);
        setRxNormSuggestions([]);
      } finally {
        setIsLoadingRxNorm(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [name]);

  // Combine RxNorm results with local fallback, prioritizing RxNorm
  const nameSuggestions = (() => {
    // If we have RxNorm results, use them primarily
    if (rxNormSuggestions.length > 0) {
      // Also add local matches that aren't in RxNorm results
      const localMatches = name.trim().length === 0
        ? []
        : fuzzyFilterStrings(uniqueCommonMedications, name, 10);

      const combined = [...rxNormSuggestions];
      for (const local of localMatches) {
        if (!combined.some(r => r.toLowerCase() === local.toLowerCase())) {
          combined.push(local);
        }
        if (combined.length >= 20) break;
      }
      return combined;
    }

    // Fallback to local dictionary if RxNorm returns nothing
    return (
      name.trim().length === 0
        ? uniqueCommonMedications.slice(0, 20)
        : fuzzyFilterStrings(uniqueCommonMedications, name, 20)
    ).filter((med) => med && med.trim().length > 0);
  })();

  // Use smart dosage suggestions that prioritize medication-specific dosages
  const allDosageSuggestions = getDosageSuggestionsForMedication(name, dosage);
  const dosageSuggestions = (
    dosage.trim().length === 0
      ? allDosageSuggestions
      : fuzzyFilterStrings(allDosageSuggestions, dosage, 35)
  ).filter((d) => d && d.trim().length > 0);

  return (
    <>
      {/* Medication Name with Autocomplete */}
      <Text
        className={`${textClasses.body} font-semibold mb-2`}
        style={{ color: colors.textPrimary }}
      >
        Medication Name
      </Text>
      <TextInput
        value={name}
        onChangeText={(text) => {
          updateField("name", text);
          updateField("showNameSuggestions", true);
        }}
        onFocus={() => updateField("showNameSuggestions", true)}
        placeholder="Enter medication name"
        placeholderTextColor={colors.textSecondary}
        className={`px-6 py-4 rounded-xl mb-2`}
        style={{
          backgroundColor: colors.cardBackground,
          color: colors.textPrimary,
          minHeight: 52,
          fontSize: 17,
        }}
      />
      {showNameSuggestions && (nameSuggestions.length > 0 || isLoadingRxNorm) && (
        <View
          className="border-2 rounded-xl mb-4 shadow-lg"
          style={{
            maxHeight: 350,
            zIndex: 10,
            backgroundColor: colors.cardBackground,
            borderColor: primary,
          }}
        >
          <View
            className="px-6 py-3 border-b flex-row items-center justify-between"
            style={{ backgroundColor: primaryLight, borderBottomColor: primary }}
          >
            <Text
              style={{ color: primary, fontSize: 15, fontWeight: "600" }}
            >
              {isLoadingRxNorm
                ? "Searching..."
                : `Tap to select or keep typing${nameSuggestions.length > 0 ? ` (${nameSuggestions.length} options)` : ""}`}
            </Text>
            {isLoadingRxNorm && (
              <ActivityIndicator size="small" color={primary} />
            )}
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {nameSuggestions.map((suggestion, index) => (
              <Pressable
                key={`${suggestion}-${index}`}
                onPress={() => {
                  updateField("name", suggestion);
                  updateField("showNameSuggestions", false);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 24,
                  paddingVertical: 18,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.divider,
                  minHeight: 72,
                  justifyContent: "center",
                  backgroundColor: pressed ? colors.divider : "transparent",
                })}
              >
                <Text
                  style={{ color: colors.textPrimary, fontWeight: "500", fontSize: 19 }}
                  numberOfLines={2}
                >
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      {!showNameSuggestions && <View className="mb-4" />}

      {/* Dosage with Autocomplete */}
      <Text
        className={`${textClasses.body} font-semibold mb-2`}
        style={{ color: colors.textPrimary }}
      >
        Dosage
      </Text>
      <TextInput
        value={dosage}
        onChangeText={(text) => {
          updateField("dosage", text);
          updateField("showDosageSuggestions", true);
        }}
        onFocus={() => updateField("showDosageSuggestions", true)}
        placeholder="e.g., 10 mg"
        placeholderTextColor={colors.textSecondary}
        className={`px-6 py-4 rounded-xl mb-2`}
        style={{
          backgroundColor: colors.cardBackground,
          color: colors.textPrimary,
          minHeight: 52,
          fontSize: 17,
        }}
      />
      {showDosageSuggestions && dosageSuggestions.length > 0 && (
        <View
          className="border-2 rounded-xl mb-4 shadow-lg"
          style={{
            zIndex: 10,
            backgroundColor: colors.cardBackground,
            borderColor: primary,
          }}
        >
          <View
            className="px-6 py-3 border-b"
            style={{ backgroundColor: primaryLight, borderBottomColor: primary }}
          >
            <Text
              style={{ color: primary, fontSize: 15, fontWeight: "600" }}
            >
              Tap to select or keep typing ({dosageSuggestions.length} options)
            </Text>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            style={{ maxHeight: 300 }}
          >
            {dosageSuggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => {
                  updateField("dosage", suggestion);
                  updateField("showDosageSuggestions", false);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 24,
                  paddingVertical: 18,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.divider,
                  minHeight: 72,
                  justifyContent: "center",
                  backgroundColor: pressed ? colors.divider : "transparent",
                })}
              >
                <Text
                  style={{ color: colors.textPrimary, fontWeight: "500", fontSize: 19 }}
                  numberOfLines={2}
                >
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      {!showDosageSuggestions && <View className="mb-4" />}
    </>
  );
}
