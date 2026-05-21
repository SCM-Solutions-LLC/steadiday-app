import React from "react";
import { View, Text, Pressable, Modal, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";
import type { MedicationChange } from "../hooks/useMedicationLinkSync";
import * as Haptics from "expo-haptics";

interface Props {
  visible: boolean;
  changes: MedicationChange[];
  onUpdateMedication: (change: MedicationChange) => void;
  onRemoveMedication: (change: MedicationChange) => void;
  onKeepAsIs: (change: MedicationChange) => void;
  onDismiss: () => void;
}

export default function MedicationLinkChangeModal({
  visible,
  changes,
  onUpdateMedication,
  onRemoveMedication,
  onKeepAsIs,
  onDismiss,
}: Props) {
  const { colors, primary, primaryLight } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  if (changes.length === 0) return null;

  const currentChange = changes[0]; // Handle one at a time

  const getChangeIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (currentChange.type) {
      case "removed":
        return "alert-circle";
      case "dosage_changed":
        return "medical";
      case "name_changed":
        return "create";
      default:
        return "information-circle";
    }
  };

  const getChangeTitle = () => {
    switch (currentChange.type) {
      case "removed":
        return "Medication No Longer in Records";
      case "dosage_changed":
        return "Dosage Changed";
      case "name_changed":
        return "Medication Name Updated";
      default:
        return "Medication Changed";
    }
  };

  // Note: Health Connect medication sync is not currently implemented on Android
  const healthSource = Platform.OS === "android" ? "Health Connect" : "Apple Health";

  const getChangeDescription = () => {
    const medName = currentChange.userMedication.name;
    switch (currentChange.type) {
      case "removed":
        return `"${medName}" is no longer in your ${healthSource} medication records. Would you like to remove it from your medications list?`;
      case "dosage_changed":
        return `The dosage for "${medName}" has changed from ${currentChange.oldValue} to ${currentChange.newValue}. Would you like to update your medication?`;
      case "name_changed":
        return `"${currentChange.oldValue}" has been updated to "${currentChange.newValue}" in your records. Would you like to update the name?`;
      default:
        return "A linked medication has changed.";
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View className="flex-1 bg-black/50 justify-end">
        <SafeAreaView edges={["bottom"]}>
          <View
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.cardBackground }}
          >
            {/* Header */}
            <View className="items-center mb-6">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{
                  backgroundColor:
                    currentChange.type === "removed" ? colors.errorBackground : primaryLight,
                }}
              >
                <Ionicons
                  name={getChangeIcon()}
                  size={32}
                  color={currentChange.type === "removed" ? colors.error : primary}
                />
              </View>
              <Text
                className={`${textClasses.title} text-center mb-2`}
                style={{ color: colors.textPrimary }}
              >
                {getChangeTitle()}
              </Text>
              <Text
                className={`${textClasses.body} text-center`}
                style={{ color: colors.textSecondary }}
              >
                {getChangeDescription()}
              </Text>
            </View>

            {/* Remaining count */}
            {changes.length > 1 && (
              <Text
                className={`${textClasses.small} text-center mb-4`}
                style={{ color: colors.textSecondary }}
              >
                {changes.length - 1} more change{changes.length > 2 ? "s" : ""} to review
              </Text>
            )}

            {/* Actions */}
            <View className="gap-3">
              {currentChange.type === "removed" ? (
                <>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      onRemoveMedication(currentChange);
                    }}
                    className="py-4 rounded-2xl items-center"
                    style={{ backgroundColor: colors.error }}
                  >
                    <Text className={`${textClasses.body} font-semibold text-white`}>
                      Remove from My Medications
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      onKeepAsIs(currentChange);
                    }}
                    className="py-4 rounded-2xl items-center border"
                    style={{ borderColor: colors.border }}
                  >
                    <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                      Keep It (Unlink from Provider)
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      onUpdateMedication(currentChange);
                    }}
                    className="py-4 rounded-2xl items-center"
                    style={{ backgroundColor: primary }}
                  >
                    <Text className={`${textClasses.body} font-semibold text-white`}>
                      Update My Medication
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      onKeepAsIs(currentChange);
                    }}
                    className="py-4 rounded-2xl items-center border"
                    style={{ borderColor: colors.border }}
                  >
                    <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                      Keep Current Settings
                    </Text>
                  </Pressable>
                </>
              )}

              <Pressable
                onPress={() => {
                  triggerHaptic();
                  onDismiss();
                }}
                className="py-3 items-center"
              >
                <Text className={`${textClasses.body}`} style={{ color: colors.textSecondary }}>
                  Review Later
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
