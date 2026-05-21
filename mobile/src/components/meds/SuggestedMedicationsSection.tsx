/**
 * SuggestedMedicationsSection - Shows health provider medications not yet added
 * Premium-only feature
 * Note: Health Connect medication sync is not currently implemented on Android
 */
import React, { useMemo } from "react";
import { View, Text, Pressable, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHealthRecordsStore } from "../../state/stores/healthRecordsStore";
import { useMedicationStore } from "../../state/stores/medicationStore";
import { useSubscriptionStore } from "../../state/stores/subscriptionStore";
import { useHealthRecordsSync } from "../../hooks";
import { MedicationItem } from "../../types/app";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useSettingsStore } from "../../state/stores/settingsStore";

interface Props {
  onAddMedication: (suggestion: MedicationItem) => void;
}

export default function SuggestedMedicationsSection({ onAddMedication }: Props) {
  const { colors, primary, primaryLight } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  // Premium check
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);

  // Get medication items (stable array reference from store)
  const medicationItems = useHealthRecordsStore((s) => s.medicationItems);

  // Filter to Apple Health meds using useMemo to avoid creating new arrays every render
  const appleHealthMeds = useMemo(
    () => medicationItems.filter((m) => m.sourceType === "apple_health"),
    [medicationItems]
  );

  // Get existing medications to filter out already-added ones
  const existingMedications = useMedicationStore((s) => s.medications);

  // Sync state
  const { isSyncing, syncAllHealthRecords } = useHealthRecordsSync();

  // Filter to only show medications not yet added
  // Check by linkedProviderId OR by matching name (fuzzy match)
  const suggestedMeds = appleHealthMeds.filter((ahMed) => {
    // Check if already linked by ID
    const isLinkedById = existingMedications.some(
      (med) => med.linkedProviderId === ahMed.id
    );
    if (isLinkedById) return false;

    // Check if name matches (case-insensitive)
    const isMatchedByName = existingMedications.some(
      (med) => med.name.toLowerCase() === ahMed.medicationName.toLowerCase()
    );
    if (isMatchedByName) return false;

    // Only show active medications
    return ahMed.status === "active";
  });

  // Do not render if not premium or no suggestions
  if (!isPremiumUnlocked) return null;
  if (suggestedMeds.length === 0 && !isSyncing) return null;

  return (
    <View className="mb-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: colors.info + "20" }}
          >
            <Ionicons name="heart" size={16} color={colors.info} />
          </View>
          <Text
            className={`${textClasses.body} font-semibold`}
            style={{ color: colors.textPrimary }}
          >
            {Platform.OS === "android" ? "From Health Connect" : "From Apple Health"}
          </Text>
        </View>

        {/* Sync button */}
        <Pressable
          onPress={() => syncAllHealthRecords("manual")}
          disabled={isSyncing}
          className="flex-row items-center px-3 py-1.5 rounded-full"
          style={{ backgroundColor: primaryLight }}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={primary} />
          ) : (
            <>
              <Ionicons name="refresh" size={14} color={primary} />
              <Text className="text-sm ml-1 font-medium" style={{ color: primary }}>
                Sync
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Suggested medications list */}
      {suggestedMeds.map((med) => (
        <Pressable
          key={med.id}
          onPress={() => onAddMedication(med)}
          className="flex-row items-center p-4 rounded-2xl mb-2"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.info,
            borderStyle: "dashed",
          }}
          accessibilityRole="button"
          accessibilityLabel={`Add ${med.medicationName} to your medications`}
        >
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: colors.info + "15" }}
          >
            <Ionicons name="medical" size={24} color={colors.info} />
          </View>

          <View className="flex-1">
            <Text
              className={`${textClasses.body} font-semibold`}
              style={{ color: colors.textPrimary }}
            >
              {med.medicationName}
            </Text>
            {med.doseText && (
              <Text
                className={`${textClasses.small}`}
                style={{ color: colors.textSecondary }}
              >
                {med.doseText}
              </Text>
            )}
            {med.scheduleText && (
              <Text
                className={`${textClasses.small}`}
                style={{ color: colors.textSecondary }}
              >
                {med.scheduleText}
              </Text>
            )}
          </View>

          <View className="flex-row items-center">
            <Text className="text-sm font-medium mr-1" style={{ color: primary }}>
              Add
            </Text>
            <Ionicons name="add-circle" size={24} color={primary} />
          </View>
        </Pressable>
      ))}

      {/* Loading state */}
      {isSyncing && suggestedMeds.length === 0 && (
        <View
          className="p-4 rounded-2xl items-center"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <ActivityIndicator size="small" color={primary} />
          <Text
            className={`${textClasses.small} mt-2`}
            style={{ color: colors.textSecondary }}
          >
            {Platform.OS === "android" ? "Checking Health Connect..." : "Checking Apple Health..."}
          </Text>
        </View>
      )}
    </View>
  );
}
