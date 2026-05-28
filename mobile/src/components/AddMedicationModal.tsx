import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Medication, MedicationFrequency, MedicationItem } from "../types/app";
import { getTextSizeClasses } from "../utils/textSizes";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useTheme } from "../utils/useTheme";
import { useMedicationForm } from "./medications/hooks";
import {
  PhotoImportSection,
  BasicInfoSection,
  FrequencySection,
  TimeSelectionSection,
  PharmacySection,
  RemindersSection,
} from "./medications/forms";
import { logger } from "../utils/logger";
import { extractMedicationFromPhoto, hasAnyExtractedField } from "../api/vision";
import { useConfirmModal } from "./ConfirmModal";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (medication: Medication) => void;
  editingMedication?: Medication | null;
  suggestionFromAppleHealth?: MedicationItem | null;
}

export default function AddMedicationModal({
  visible,
  onClose,
  onSave,
  editingMedication,
  suggestionFromAppleHealth,
}: Props) {
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const { primary, primaryLight, colors } = useTheme();
  const { alert } = useConfirmModal();

  const {
    formState,
    updateField,
    handleFrequencyChange,
    updateTimeAtIndex,
    buildMedication,
    isValid,
    resetForm,
  } = useMedicationForm({ editingMedication });

  // Ref to track if Apple Health suggestion has been applied (run once only)
  const hasAppliedSuggestionRef = useRef(false);
  // Refs for stable function references to avoid infinite loops
  const updateFieldRef = useRef(updateField);
  const handleFrequencyChangeRef = useRef(handleFrequencyChange);

  // Keep refs up to date
  useEffect(() => {
    updateFieldRef.current = updateField;
    handleFrequencyChangeRef.current = handleFrequencyChange;
  });

  // Reset form when modal opens fresh (not editing)
  useEffect(() => {
    if (visible && !editingMedication && !suggestionFromAppleHealth) {
      resetForm();
    }
  }, [visible]);

  // Reset suggestion tracking when modal opens/closes or suggestion changes
  useEffect(() => {
    if (!visible) {
      hasAppliedSuggestionRef.current = false;
    }
  }, [visible, suggestionFromAppleHealth]);

  // Pre-fill form from Apple Health suggestion (run once per modal open)
  useEffect(() => {
    // Guard: Only apply once per modal open
    if (!suggestionFromAppleHealth || !visible || editingMedication || hasAppliedSuggestionRef.current) {
      return;
    }

    // Mark as applied to prevent re-running
    hasAppliedSuggestionRef.current = true;

    // Use refs to avoid dependency on changing functions
    const updateFn = updateFieldRef.current;
    const freqFn = handleFrequencyChangeRef.current;

    updateFn("name", suggestionFromAppleHealth.medicationName);
    if (suggestionFromAppleHealth.doseText) {
      updateFn("dosage", suggestionFromAppleHealth.doseText);
    }

    // Try to parse schedule text into frequency
    const scheduleText = suggestionFromAppleHealth.scheduleText?.toLowerCase() || "";
    if (scheduleText.includes("twice") || scheduleText.includes("2x") || scheduleText.includes("two times")) {
      freqFn("twice-daily");
    } else if (scheduleText.includes("three") || scheduleText.includes("3x")) {
      freqFn("three-times-daily");
    } else if (scheduleText.includes("every other") || scheduleText.includes("alternate")) {
      freqFn("every-other-day");
    } else if (scheduleText.includes("weekly") || scheduleText.includes("once a week")) {
      freqFn("weekly");
    }
    // Default is daily, no change needed
  }, [suggestionFromAppleHealth, visible, editingMedication]);

  // Shared props for form sections
  const sectionProps = {
    formState,
    updateField,
    textClasses,
    colors,
    primary,
    primaryLight,
  };

  // Check if form has unsaved changes
  const hasUnsavedChanges = Boolean(
    formState.name ||
    formState.dosage ||
    formState.pharmacyName ||
    formState.pharmacyPhone ||
    formState.pharmacyAddress
  );

  const handleSave = () => {
    if (!isValid) return;
    const medication = buildMedication(editingMedication);

    // Add linked provider info if this came from Apple Health suggestion
    if (suggestionFromAppleHealth && !editingMedication) {
      medication.linkedProviderId = suggestionFromAppleHealth.id;
      medication.linkedProviderName = suggestionFromAppleHealth.medicationName;
      medication.linkedProviderDosage = suggestionFromAppleHealth.doseText;
      medication.dataSource = "apple_health";
    }

    onSave(medication);
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges && !editingMedication) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to close?",
        [
          { text: "Keep Editing", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: onClose }
        ]
      );
    } else {
      onClose();
    }
  };

  // Map an extracted free-text frequency phrase to the app's MedicationFrequency enum.
  const mapFrequency = (raw: string | null): MedicationFrequency | null => {
    if (!raw) return null;
    const text = raw.toLowerCase();
    if (/every other day|alternate days?/.test(text)) return "every-other-day";
    if (/three (times|x)|3 (times|x)|every 4-?6 hours|every 4 hours|every 6 hours/.test(text)) return "three-times-daily";
    if (/twice|two times|2 times|2x|every 12 hours/.test(text)) return "twice-daily";
    if (/weekly|once a week/.test(text)) return "weekly";
    return "daily";
  };

  const handleAnalyzePhoto = async (photoUri: string) => {
    updateField("isAnalyzingPhoto", true);
    try {
      const data = await extractMedicationFromPhoto(photoUri);

      if (!hasAnyExtractedField(data)) {
        alert(
          "Unable to Read Label",
          "Could not read the medication information from this photo. Please try again with a clearer image, or enter the details manually."
        );
        return;
      }

      // Apply only non-null, non-empty fields. Never write the string "null".
      if (data.medication_name) updateField("name", data.medication_name);
      if (data.dosage) updateField("dosage", data.dosage);
      if (data.instructions) updateField("notes", data.instructions);

      const mappedFrequency = mapFrequency(data.frequency);
      if (mappedFrequency) handleFrequencyChange(mappedFrequency);

      alert(
        "Medication Detected",
        "We filled in what we could read. Please review the details and tap Save when they look right."
      );
    } catch (error) {
      logger.error("[MedicationPhoto] Photo analysis failed:", error instanceof Error ? error.message : "unknown");
      alert(
        "Photo Analysis Failed",
        "We couldn't read this label clearly. You can fill in the details manually."
      );
    } finally {
      updateField("isAnalyzingPhoto", false);
    }
  };

  const dismissDropdowns = () => {
    updateField("showNameSuggestions", false);
    updateField("showDosageSuggestions", false);
    updateField("showPharmacySuggestions", false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        edges={["top", "bottom"]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Header */}
          <View
            className="px-6 py-4 border-b flex-row justify-between items-center"
            style={{ borderBottomColor: colors.divider }}
          >
            <Pressable onPress={handleClose} className="py-2" style={{ minHeight: 48 }}>
              <Text className={`${textClasses.button}`} style={{ color: primary }}>
                Cancel
              </Text>
            </Pressable>
            <Text
              className={`${textClasses.subtitle}`}
              style={{ color: colors.textPrimary }}
            >
              {editingMedication ? "Edit Medication" : suggestionFromAppleHealth ? (Platform.OS === "android" ? "Add from Health Connect" : "Add from Apple Health") : "Add Medication"}
            </Text>
            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              className="py-2"
              style={{ minHeight: 48 }}
            >
              <Text
                className={`${textClasses.button}`}
                style={{ color: isValid ? primary : colors.textSecondary }}
              >
                Save
              </Text>
            </Pressable>
          </View>

            <ScrollView
              className="flex-1 px-6 py-6"
              scrollEventThrottle={16}
              onScrollBeginDrag={dismissDropdowns}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              scrollIndicatorInsets={{ right: 1 }}
              contentContainerStyle={{ paddingBottom: 120 }}
              bounces={true}
            >
              {/* Photo Import (only for new medications) */}
              {!editingMedication && (
                <PhotoImportSection
                  {...sectionProps}
                  onAnalyzePhoto={handleAnalyzePhoto}
                />
              )}

              {/* Basic Info */}
              <BasicInfoSection {...sectionProps} />

              {/* Frequency */}
              <FrequencySection
                {...sectionProps}
                onFrequencyChange={handleFrequencyChange}
              />

              {/* Time Selection */}
              <TimeSelectionSection
                {...sectionProps}
                onUpdateTimeAtIndex={updateTimeAtIndex}
              />

              {/* Pharmacy */}
              <PharmacySection {...sectionProps} />

              {/* Reminders */}
              <RemindersSection {...sectionProps} />
            </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
