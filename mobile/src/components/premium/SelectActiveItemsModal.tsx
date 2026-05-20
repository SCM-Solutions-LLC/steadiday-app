import React, { useState } from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useTheme } from "../../utils/useTheme";
import { ESSENTIALS_LIMITS } from "../../config/featureAccess";
import * as Haptics from "expo-haptics";

interface ItemSelection {
  id: string;
  name: string;
  isSelected: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selections: {
    medications: string[];
    tasks: string[];
    emergencyContacts: string[];
  }) => void;
  medications: ItemSelection[];
  tasks: ItemSelection[];
  emergencyContacts: ItemSelection[];
}

export default function SelectActiveItemsModal({
  visible,
  onClose,
  onConfirm,
  medications: initialMedications,
  tasks: initialTasks,
  emergencyContacts: initialContacts,
}: Props) {
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);
  const { colors, primary, primaryLight } = useTheme();

  const [medications, setMedications] = useState(initialMedications);
  const [tasks, setTasks] = useState(initialTasks);
  const [emergencyContacts, setEmergencyContacts] = useState(initialContacts);

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const selectedMedsCount = medications.filter((m) => m.isSelected).length;
  const selectedTasksCount = tasks.filter((t) => t.isSelected).length;
  const selectedContactsCount = emergencyContacts.filter(
    (c) => c.isSelected
  ).length;

  const toggleMedication = (id: string) => {
    const currentSelected = medications.filter((m) => m.isSelected).length;
    const item = medications.find((m) => m.id === id);
    if (!item) return;

    if (
      item.isSelected ||
      currentSelected < ESSENTIALS_LIMITS.maxMedications
    ) {
      triggerHaptic();
      setMedications(
        medications.map((m) =>
          m.id === id ? { ...m, isSelected: !m.isSelected } : m
        )
      );
    }
  };

  const toggleTask = (id: string) => {
    const currentSelected = tasks.filter((t) => t.isSelected).length;
    const item = tasks.find((t) => t.id === id);
    if (!item) return;

    if (item.isSelected || currentSelected < ESSENTIALS_LIMITS.maxTasks) {
      triggerHaptic();
      setTasks(
        tasks.map((t) =>
          t.id === id ? { ...t, isSelected: !t.isSelected } : t
        )
      );
    }
  };

  const toggleContact = (id: string) => {
    const currentSelected = emergencyContacts.filter((c) => c.isSelected).length;
    const item = emergencyContacts.find((c) => c.id === id);
    if (!item) return;

    if (
      item.isSelected ||
      currentSelected < ESSENTIALS_LIMITS.maxEmergencyContacts
    ) {
      triggerHaptic();
      setEmergencyContacts(
        emergencyContacts.map((c) =>
          c.id === id ? { ...c, isSelected: !c.isSelected } : c
        )
      );
    }
  };

  const handleConfirm = () => {
    triggerHaptic();
    onConfirm({
      medications: medications.filter((m) => m.isSelected).map((m) => m.id),
      tasks: tasks.filter((t) => t.isSelected).map((t) => t.id),
      emergencyContacts: emergencyContacts
        .filter((c) => c.isSelected)
        .map((c) => c.id),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <SafeAreaView className="flex-1" edges={["bottom"]}>
          <View
            className="flex-1 mt-12 rounded-t-3xl"
            style={{ backgroundColor: colors.cardBackground }}
          >
            {/* Header */}
            <View className="items-center pt-6 pb-4 px-8">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: primaryLight }}
              >
                <Ionicons name="list" size={40} color={primary} />
              </View>
              <Text
                className={`${textClasses.title} text-center mb-2`}
                style={{ color: colors.textPrimary }}
              >
                Choose What to Keep Active
              </Text>
              <Text
                className={`${textClasses.body} text-center`}
                style={{ color: colors.textSecondary }}
              >
                {"Select which items you want to keep using.\nOthers will be saved but hidden."}
              </Text>
            </View>

            <ScrollView
              className="flex-1 px-8"
              showsVerticalScrollIndicator={false}
            >
              {/* Medications */}
              {medications.length > ESSENTIALS_LIMITS.maxMedications && (
                <View className="mb-6">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text
                      className={`${textClasses.subtitle} font-semibold`}
                      style={{ color: colors.textPrimary }}
                    >
                      Medications
                    </Text>
                    <Text
                      className={`${textClasses.small}`}
                      style={{
                        color:
                          selectedMedsCount === ESSENTIALS_LIMITS.maxMedications
                            ? "#10B981"
                            : colors.textSecondary,
                      }}
                    >
                      {selectedMedsCount}/{ESSENTIALS_LIMITS.maxMedications}{" "}
                      selected
                    </Text>
                  </View>
                  <View
                    className="rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    {medications.map((med, index) => (
                      <Pressable
                        key={med.id}
                        onPress={() => toggleMedication(med.id)}
                        className="flex-row items-center p-4"
                        style={{
                          borderBottomWidth:
                            index < medications.length - 1 ? 1 : 0,
                          borderBottomColor: colors.divider,
                          backgroundColor: med.isSelected
                            ? primaryLight
                            : "transparent",
                        }}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: med.isSelected }}
                      >
                        <View
                          className="w-6 h-6 rounded-lg border-2 items-center justify-center mr-4"
                          style={{
                            borderColor: med.isSelected
                              ? primary
                              : colors.border,
                            backgroundColor: med.isSelected
                              ? primary
                              : "transparent",
                          }}
                        >
                          {med.isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="white"
                            />
                          )}
                        </View>
                        <Text
                          className={`${textClasses.body} flex-1`}
                          style={{ color: colors.textPrimary }}
                        >
                          {med.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Tasks */}
              {tasks.length > ESSENTIALS_LIMITS.maxTasks && (
                <View className="mb-6">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text
                      className={`${textClasses.subtitle} font-semibold`}
                      style={{ color: colors.textPrimary }}
                    >
                      Tasks
                    </Text>
                    <Text
                      className={`${textClasses.small}`}
                      style={{
                        color:
                          selectedTasksCount === ESSENTIALS_LIMITS.maxTasks
                            ? "#10B981"
                            : colors.textSecondary,
                      }}
                    >
                      {selectedTasksCount}/{ESSENTIALS_LIMITS.maxTasks} selected
                    </Text>
                  </View>
                  <View
                    className="rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    {tasks.map((task, index) => (
                      <Pressable
                        key={task.id}
                        onPress={() => toggleTask(task.id)}
                        className="flex-row items-center p-4"
                        style={{
                          borderBottomWidth: index < tasks.length - 1 ? 1 : 0,
                          borderBottomColor: colors.divider,
                          backgroundColor: task.isSelected
                            ? primaryLight
                            : "transparent",
                        }}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: task.isSelected }}
                      >
                        <View
                          className="w-6 h-6 rounded-lg border-2 items-center justify-center mr-4"
                          style={{
                            borderColor: task.isSelected
                              ? primary
                              : colors.border,
                            backgroundColor: task.isSelected
                              ? primary
                              : "transparent",
                          }}
                        >
                          {task.isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="white"
                            />
                          )}
                        </View>
                        <Text
                          className={`${textClasses.body} flex-1`}
                          style={{ color: colors.textPrimary }}
                        >
                          {task.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Trusted Contacts */}
              {emergencyContacts.length >
                ESSENTIALS_LIMITS.maxEmergencyContacts && (
                <View className="mb-6">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text
                      className={`${textClasses.subtitle} font-semibold`}
                      style={{ color: colors.textPrimary }}
                    >
                      Trusted Contacts
                    </Text>
                    <Text
                      className={`${textClasses.small}`}
                      style={{
                        color:
                          selectedContactsCount ===
                          ESSENTIALS_LIMITS.maxEmergencyContacts
                            ? "#10B981"
                            : colors.textSecondary,
                      }}
                    >
                      {selectedContactsCount}/
                      {ESSENTIALS_LIMITS.maxEmergencyContacts} selected
                    </Text>
                  </View>
                  <View
                    className="rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    {emergencyContacts.map((contact, index) => (
                      <Pressable
                        key={contact.id}
                        onPress={() => toggleContact(contact.id)}
                        className="flex-row items-center p-4"
                        style={{
                          borderBottomWidth:
                            index < emergencyContacts.length - 1 ? 1 : 0,
                          borderBottomColor: colors.divider,
                          backgroundColor: contact.isSelected
                            ? primaryLight
                            : "transparent",
                        }}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: contact.isSelected }}
                      >
                        <View
                          className="w-6 h-6 rounded-lg border-2 items-center justify-center mr-4"
                          style={{
                            borderColor: contact.isSelected
                              ? primary
                              : colors.border,
                            backgroundColor: contact.isSelected
                              ? primary
                              : "transparent",
                          }}
                        >
                          {contact.isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="white"
                            />
                          )}
                        </View>
                        <Text
                          className={`${textClasses.body} flex-1`}
                          style={{ color: colors.textPrimary }}
                        >
                          {contact.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Info note */}
              <View
                className="rounded-2xl p-4 mb-6 flex-row items-start"
                style={{ backgroundColor: primaryLight }}
              >
                <Ionicons name="information-circle" size={24} color={primary} />
                <Text
                  className={`${textClasses.small} ml-3 flex-1`}
                  style={{ color: colors.textPrimary }}
                >
                  {"Items you don't select will be saved and will become active again if you resubscribe."}
                </Text>
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View
              className="px-8 pb-6 pt-4"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <Pressable
                onPress={handleConfirm}
                className="py-5 rounded-2xl items-center mb-3"
                style={{ backgroundColor: primary, minHeight: 56 }}
                accessibilityRole="button"
                accessibilityLabel="Confirm selection"
              >
                <Text
                  className={`${textClasses.subtitle} font-semibold text-white`}
                >
                  Confirm Selection
                </Text>
              </Pressable>

              <Pressable
                onPress={onClose}
                className="py-3 items-center"
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text
                  className={`${textClasses.body}`}
                  style={{ color: colors.textSecondary }}
                >
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
