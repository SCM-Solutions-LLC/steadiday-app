import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Screen } from "../components/Screen";
import { useMedicationStore } from "../state/stores/medicationStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { useHealthRecordsStore } from "../state/stores/healthRecordsStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import AddMedicationModal from "../components/AddMedicationModal";
import { Medication, MedicationItem } from "../types/app";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { BackButton } from "../components/ui";
import { useConfirmModal } from "../components/ConfirmModal";
import { useHealthRecordsSync } from "../hooks";
import { logger } from "../utils/logger";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "MultipleMedications">;
};

export default function MultipleMedicationsScreen({ navigation }: Props) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [suggestionToAdd, setSuggestionToAdd] = useState<MedicationItem | null>(null);
  const { destructive } = useConfirmModal();

  // Ref to track if sync has been attempted (run once only)
  const hasSyncedRef = useRef(false);
  // Ref to track if component is mounted (prevent state updates after unmount)
  const isMountedRef = useRef(true);

  // Medication actions from useMedicationStore
  const addMedicationToStore = useMedicationStore((s) => s.addMedication);

  // Subscription state to check if user has premium
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);

  // Apple Health medications (Premium only)
  // IMPORTANT: Select the raw array, not a function call, to avoid infinite re-renders
  const medicationItems = useHealthRecordsStore((s) => s.medicationItems);
  const appleHealthMeds = useMemo(
    () => medicationItems.filter((m) => m.sourceType === "apple_health"),
    [medicationItems]
  );
  const { isSyncing, syncAllHealthRecords } = useHealthRecordsSync();

  const { colors, primary } = useTheme();

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync Apple Health medications ONCE on mount for Premium users
  // Uses hasSyncedRef to ensure we only attempt sync once per screen visit
  // IMPORTANT: This is wrapped with timeout to prevent freezing in TestFlight
  useEffect(() => {
    // Guard: Only sync once, only for premium users
    if (!isPremiumUnlocked || hasSyncedRef.current) {
      return;
    }

    // Mark as synced IMMEDIATELY to prevent any possibility of re-running
    hasSyncedRef.current = true;

    logger.log("[MultipleMedications] Starting Apple Health sync (once)");

    // Create an abort controller for cleanup
    let isAborted = false;
    const SYNC_TIMEOUT_MS = 15000; // 15 second timeout for onboarding

    // Run sync in async function with timeout protection
    const runSync = async () => {
      try {
        // Create a timeout promise to prevent indefinite hangs
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Sync timed out"));
          }, SYNC_TIMEOUT_MS);
        });

        // Race between sync and timeout
        await Promise.race([
          syncAllHealthRecords("manual", { skipOnboardingCheck: true }),
          timeoutPromise,
        ]);

        if (!isAborted && isMountedRef.current) {
          logger.log("[MultipleMedications] Apple Health sync completed");
        }
      } catch (error) {
        if (!isAborted && isMountedRef.current) {
          logger.error("[MultipleMedications] Apple Health sync failed or timed out:", error);
          // Silently fail - user can still add medications manually
        }
      }
    };

    runSync();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isAborted = true;
    };
  }, [isPremiumUnlocked, syncAllHealthRecords]);

  // Filter Apple Health medications to only show active ones not already added
  const suggestedAppleHealthMeds = useMemo(() => {
    return appleHealthMeds.filter((ahMed) => {
      // Only show active medications
      if (ahMed.status !== "active") return false;
      // Check if already linked by ID
      const isLinkedById = medications.some((med) => med.linkedProviderId === ahMed.id);
      if (isLinkedById) return false;
      // Check if name matches (case-insensitive)
      const isMatchedByName = medications.some(
        (med) => med.name.toLowerCase() === ahMed.medicationName.toLowerCase()
      );
      return !isMatchedByName;
    });
  }, [appleHealthMeds, medications]);

  // No mock medication apps - medications come from Apple Health (Premium) or manual entry
  // The useEffect for connectedApps has been removed as it was using mock data

  // Get app name from syncSource ID
  const getAppNameFromId = (appId: string) => {
    if (appId === "apple-health") return "Apple Health";
    return appId;
  };

  const handleAddMedication = (medication: Medication) => {
    setMedications([...medications, medication]);
    setShowAddModal(false);
    setSuggestionToAdd(null);
  };

  const handleEditMedication = (medication: Medication) => {
    setMedications(medications.map((med) => (med.id === medication.id ? medication : med)));
    setEditingMedication(null);
    setShowAddModal(false);
    setSuggestionToAdd(null);
  };

  // Handler for adding a suggested medication from Apple Health
  const handleAddFromAppleHealth = (ahMed: MedicationItem) => {
    setSuggestionToAdd(ahMed);
    setEditingMedication(null);
    setShowAddModal(true);
  };

  const handleDeleteMedication = (id: string) => {
    destructive(
      "Delete Medication",
      "Are you sure you want to remove this medication?",
      "Delete",
      () => setMedications(medications.filter((med) => med.id !== id))
    );
  };

  const handleContinue = () => {
    // Save all medications to store
    medications.forEach((med) => addMedicationToStore(med));
    navigation.navigate("MultipleTasksScreen");
  };

  const handleSkip = () => {
    navigation.navigate("MultipleTasksScreen");
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1">
        <ScrollView className="flex-1 px-10 py-8" showsVerticalScrollIndicator={true}>
          {/* Back Button */}
          <BackButton label="Back" style={{ marginBottom: 20 }} />

          <Text className="text-4xl font-semibold text-center mb-5 leading-tight" style={{ color: colors.textPrimary }}>
            Add Your Medications
          </Text>
          <Text className="text-2xl text-center mb-8 leading-relaxed px-4" style={{ color: colors.textSecondary }}>
            Add as many medications as you need. You can edit or add more later.
          </Text>

          {/* Apple Health Premium Note - only show if not premium */}
          {!isPremiumUnlocked && (
            <View
              style={{
                backgroundColor: colors.premium + "15",
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.premium,
              }}
            >
              <View
                style={{
                  backgroundColor: colors.premium,
                  borderRadius: 10,
                  padding: 8,
                  marginRight: 12,
                }}
              >
                <Ionicons name="heart" size={20} color={colors.onPremium} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.textPrimary,
                    lineHeight: 22,
                  }}
                >
                  <Text style={{ fontWeight: "600" }}>Premium tip:</Text> Your medications can be automatically pulled from Apple Health with Premium.
                </Text>
              </View>
            </View>
          )}

          {/* Apple Health Medications Section (Premium only) */}
          {isPremiumUnlocked && (suggestedAppleHealthMeds.length > 0 || isSyncing) && (
            <View className="mb-8">
              <View className="flex-row items-center mb-4">
                <View
                  style={{
                    backgroundColor: colors.info + "20",
                    borderRadius: 12,
                    padding: 8,
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="heart" size={24} color={colors.info} />
                </View>
                <Text className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>
                  From Apple Health
                </Text>
                {isSyncing && (
                  <ActivityIndicator size="small" color={primary} style={{ marginLeft: 12 }} />
                )}
              </View>

              {suggestedAppleHealthMeds.length > 0 && (
                <Text className="text-lg mb-4 leading-relaxed" style={{ color: colors.textSecondary }}>
                  We found these medications in Apple Health. Tap any to add with reminders.
                </Text>
              )}

              {suggestedAppleHealthMeds.map((med) => (
                <Pressable
                  key={med.id}
                  onPress={() => handleAddFromAppleHealth(med)}
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: 20,
                    padding: 20,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.info,
                    borderStyle: "dashed",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${med.medicationName} from Apple Health`}
                >
                  <View
                    style={{
                      backgroundColor: colors.info + "15",
                      borderRadius: 14,
                      padding: 14,
                      marginRight: 16,
                    }}
                  >
                    <Ionicons name="medical" size={28} color={colors.info} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                      {med.medicationName}
                    </Text>
                    {med.doseText && (
                      <Text className="text-lg" style={{ color: colors.textSecondary }}>
                        {med.doseText}
                      </Text>
                    )}
                    {med.scheduleText && (
                      <Text className="text-base" style={{ color: colors.textSecondary }}>
                        {med.scheduleText}
                      </Text>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text className="text-lg font-medium mr-2" style={{ color: primary }}>
                      Add
                    </Text>
                    <Ionicons name="add-circle" size={32} color={primary} />
                  </View>
                </Pressable>
              ))}

              {isSyncing && suggestedAppleHealthMeds.length === 0 && (
                <View
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: 16,
                    padding: 24,
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator size="small" color={primary} />
                  <Text className="text-base mt-3" style={{ color: colors.textSecondary }}>
                    Checking Apple Health...
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Medications List */}
          {medications.length > 0 && (
            <View className="mb-8">
              {medications.map((med) => (
                <View
                  key={med.id}
                  style={{
                    backgroundColor: colors.primaryLight,
                    borderRadius: 20,
                    padding: 20,
                    marginBottom: 16,
                    borderColor: colors.success,
                    borderWidth: 2
                  }}
                >
                  {/* Content Section */}
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2 flex-wrap">
                      <Text className="text-2xl font-semibold mr-3" style={{ color: colors.textPrimary }}>
                        {med.name}
                      </Text>
                      {med.syncSource && (
                        <View style={{
                          backgroundColor: colors.success,
                          paddingHorizontal: 10,
                          paddingVertical: 3,
                          borderRadius: 9999
                        }}>
                          <Text className="text-xs text-white font-semibold">
                            {getAppNameFromId(med.syncSource)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xl mb-4" style={{ color: colors.textSecondary }}>{med.dosage}</Text>
                    <View className="flex-row items-center">
                      <Ionicons name="time" size={22} color={colors.success} />
                      <Text style={{ color: colors.success }} className="text-lg ml-2 font-semibold">
                        {med.frequency} at {med.specificTime}
                      </Text>
                    </View>
                    {med.reminderEnabled && (
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="notifications" size={20} color={colors.success} />
                        <Text style={{ color: colors.success }} className="text-base ml-2 font-semibold">Reminder enabled</Text>
                      </View>
                    )}
                  </View>

                  {/* Buttons Section - Separated at Bottom */}
                  <View style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    paddingTop: 12,
                    borderTopColor: colors.success,
                    borderTopWidth: 1,
                    opacity: 0.4
                  }}>
                    <Pressable
                      onPress={() => {
                        setEditingMedication(med);
                        setShowAddModal(true);
                      }}
                      style={{
                        backgroundColor: colors.success,
                        padding: 12,
                        borderRadius: 9999,
                        marginRight: 10,
                        minWidth: 52,
                        minHeight: 52,
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Ionicons name="create" size={24} color="white" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteMedication(med.id)}
                      style={{
                        backgroundColor: colors.error,
                        padding: 12,
                        borderRadius: 9999,
                        minWidth: 52,
                        minHeight: 52,
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Ionicons name="trash" size={24} color="white" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Add Medication Button */}
          <Pressable
            onPress={() => {
              setEditingMedication(null);
              setShowAddModal(true);
            }}
            style={{
              backgroundColor: colors.cardBackground,
              borderColor: colors.success,
              borderWidth: 2,
              borderStyle: "dashed",
              borderRadius: 28,
              padding: 40,
              marginBottom: 32
            }}
          >
            <View className="items-center">
              <Ionicons name="add-circle" size={64} color={colors.success} />
              <Text style={{ color: colors.success }} className="text-2xl font-semibold mt-5">
                Add {medications.length === 0 ? "First" : "Another"} Medication
              </Text>
            </View>
          </Pressable>

          {medications.length > 0 && (
            <Text className="text-xl text-center mb-6 leading-relaxed" style={{ color: colors.textSecondary }}>
              Added {medications.length} medication{medications.length !== 1 ? "s" : ""}
            </Text>
          )}

          {/* Buttons — inside scroll content so user must scroll to reach them */}
          <View className="mt-12 pt-8 pb-10">
            {medications.length > 0 ? (
              <Button
                title="Continue"
                onPress={handleContinue}
                variant="primary"
                size="large"
                fullWidth
                accessibilityLabel="Continue"
                style={{ marginBottom: 20 }}
              />
            ) : (
              <Button
                title="Skip for now"
                onPress={handleSkip}
                variant="secondary"
                size="large"
                fullWidth
                accessibilityLabel="Skip for now"
              />
            )}
          </View>
        </ScrollView>
      </View>

      {/* Add/Edit Medication Modal */}
      <AddMedicationModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingMedication(null);
          setSuggestionToAdd(null);
        }}
        onSave={editingMedication ? handleEditMedication : handleAddMedication}
        editingMedication={editingMedication}
        suggestionFromAppleHealth={suggestionToAdd}
      />
    </Screen>
  );
}
