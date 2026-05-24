import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { Screen } from "../components/Screen";
import { useMedicationStore } from "../state/stores/medicationStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useUIStore } from "../state/stores/uiStore";
import { useTipStore, TIP_IDS } from "../state/stores/tipStore";
import { useAppStore } from "../state/appStore";
import { Ionicons } from "@expo/vector-icons";
import { getTextSizeClasses } from "../utils/textSizes";
import { formatTime, formatISOToLocalTime } from "../utils/time";
import { Medication, MedicationItem } from "../types/app";
import AddMedicationModal from "../components/AddMedicationModal";
import SwipeableRow from "../components/SwipeableRow";
import UnifiedTip from "../components/UnifiedTip";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { usePremiumFeature, usePurchase, useMedicationLinkSync } from "../hooks";
import { PremiumUpgradePrompt } from "../components/premium";
import { SuggestedMedicationsSection, MedicationUpdateBadge } from "../components/meds";
import { ESSENTIALS_LIMITS } from "../config/featureAccess";
import {
  useToast,
  EmptyState,
  RefreshableScrollView,
  SearchInput,
  ScreenErrorBoundary,
  AnimatedTip,
  PrivacyFooterLink,
  InlineTip,
} from "../components/ui";
import { useEngagementStore } from "../state/stores/engagementStore";
import { maybeRequestReview } from "../utils/reviewPrompt";

export default function MedsScreen() {
  // Medication data from useMedicationStore
  const medications = useMedicationStore((s) => s.medications);
  const medicationLogs = useMedicationStore((s) => s.medicationLogs);
  const addMedication = useMedicationStore((s) => s.addMedication);
  const updateMedication = useMedicationStore((s) => s.updateMedication);
  const removeMedication = useMedicationStore((s) => s.removeMedication);
  const logMedication = useMedicationStore((s) => s.logMedication);
  const removeMedicationLogForToday = useMedicationStore((s) => s.removeMedicationLogForToday);

  // Settings from useSettingsStore
  const textSize = useSettingsStore((s) => s.textSize);

  // UI state from useUIStore (non-tip related)
  const connectedApps = useUIStore((s) => s.connectedApps);

  // Tip state from useTipStore
  const hasSeenTooltip = useTipStore((s) => s.hasSeenTooltip);
  const markTooltipAsShown = useTipStore((s) => s.markTooltipAsShown);

  // Non-UI data from useAppStore
  const performTwoWaySync = useAppStore((s) => s.performTwoWaySync);

  // Premium feature gating
  const {
    checkItemLimit,
    getRemainingCount,
    isPremiumUnlocked,
    showUpgradePrompt,
    triggeredFeature,
    limitMessage,
    closeUpgradePrompt,
  } = usePremiumFeature();

  // Purchase handling
  const { handlePurchase, handleRestore, isLoading: isPurchaseLoading } = usePurchase();

  // Count only ACTIVE medications for Essentials limits
  // Active = not discontinued (no discontinuedAt timestamp)
  const activeMedicationCount = medications.filter(m => !m.discontinuedAt).length;
  const remainingMeds = getRemainingCount("medications", activeMedicationCount);

  const { primary, primaryLight, colors } = useTheme();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [suggestionToAdd, setSuggestionToAdd] = useState<MedicationItem | null>(null);
  const [showSwipeTooltip, setShowSwipeTooltip] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Medication link sync for update detection
  const { detectChanges } = useMedicationLinkSync();

  // For undo functionality
  const deletedMedRef = useRef<Medication | null>(null);

  const textClasses = getTextSizeClasses(textSize);
  const { showSuccess, showError, showUndo, ToastComponent } = useToast();

  // Tip state for animated tips
  const showTip = useTipStore((s) => s.showTip);
  const hasTipBeenSeen = useTipStore((s) => s.hasTipBeenSeen);
  const tipsCompleted = useTipStore((s) => s.tipsCompleted);

  // Show animated tips for seniors
  useEffect(() => {
    const showAnimatedTips = async () => {
      // Wait a bit before showing tips
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Show add first medication tip if they have no medications
      if (medications.length === 0 && !hasTipBeenSeen(TIP_IDS.ADD_FIRST_MEDICATION)) {
        showTip(TIP_IDS.ADD_FIRST_MEDICATION);
      }
    };
    showAnimatedTips();
  }, [medications.length, hasTipBeenSeen, showTip]);

  // Show tooltip for first-time users (only during first session after onboarding)
  useEffect(() => {
    if (medications.length > 0 && !hasSeenTooltip("swipe-meds") && !tipsCompleted) {
      const timer = setTimeout(() => {
        setShowSwipeTooltip(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [medications.length, hasSeenTooltip, tipsCompleted]);

  const handleDismissTooltip = useCallback(() => {
    setShowSwipeTooltip(false);
    markTooltipAsShown("swipe-meds");
  }, [markTooltipAsShown]);

  // Get app name from syncSource ID
  const getAppNameFromId = useCallback((appId: string) => {
    const app = connectedApps.find((a) => a.id === appId);
    return app?.name || appId;
  }, [connectedApps]);

  // Memoized filtered medications
  const filteredMedications = useMemo(() => {
    if (!searchQuery.trim()) return medications;
    const query = searchQuery.toLowerCase();
    return medications.filter(
      (med) =>
        med.name.toLowerCase().includes(query) ||
        med.dosage?.toLowerCase().includes(query)
    );
  }, [medications, searchQuery]);

  // Check if medication was taken today
  const isMedicationTakenToday = useCallback((medId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return medicationLogs.some(
      (log) =>
        log.medicationId === medId &&
        log.status === "taken" &&
        new Date(log.scheduledTime) >= today
    );
  }, [medicationLogs]);

  // Split medications into active (not taken today) and taken sections
  const { activeMedications, takenMedications } = useMemo(() => {
    const active: typeof filteredMedications = [];
    const taken: typeof filteredMedications = [];

    filteredMedications.forEach((med) => {
      if (isMedicationTakenToday(med.id)) {
        taken.push(med);
      } else {
        active.push(med);
      }
    });

    return { activeMedications: active, takenMedications: taken };
  }, [filteredMedications, isMedicationTakenToday]);

  // Get last taken time for medication
  const getLastTakenTime = useCallback((medId: string) => {
    const logs = medicationLogs
      .filter((log) => log.medicationId === medId && log.status === "taken")
      .sort((a, b) => new Date(b.actualTime || b.scheduledTime).getTime() - new Date(a.actualTime || a.scheduledTime).getTime());
    return logs[0]?.actualTime || logs[0]?.scheduledTime || null;
  }, [medicationLogs]);

  // Mark medication as taken
  const handleMarkAsTaken = useCallback((med: Medication) => {
    const now = new Date();
    const log = {
      id: `log-${med.id}-${now.getTime()}`,
      medicationId: med.id,
      scheduledTime: now.toISOString(),
      actualTime: now.toISOString(),
      status: "taken" as const,
    };
    logMedication(log);
    showSuccess(`${med.name} marked as taken!`);

    // Track engagement
    useEngagementStore.getState().incrementMedicationsTaken();
    setTimeout(() => maybeRequestReview(), 2000);
  }, [logMedication, showSuccess]);

  // Uncheck medication (remove today's log)
  const handleUncheckMedication = useCallback((med: Medication) => {
    removeMedicationLogForToday(med.id);
    showSuccess(`${med.name} unmarked`);
  }, [removeMedicationLogForToday, showSuccess]);

  const getMedicationStatus = useCallback((med: Medication) => {
    // Check if already taken today
    if (isMedicationTakenToday(med.id)) {
      const lastTaken = getLastTakenTime(med.id);
      // Use formatISOToLocalTime for correct local timezone display
      const timeText = lastTaken ? formatISOToLocalTime(lastTaken) : "";
      return { status: "taken", text: `Taken${timeText ? ` at ${timeText}` : ""}` };
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (const timeStr of med.times) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const medTime = hours * 60 + minutes;
      const diff = medTime - currentTime;

      if (diff >= -60 && diff <= 0) {
        return { status: "due-now", text: "Due now" };
      } else if (diff > 0 && diff <= 30) {
        return { status: "upcoming", text: "Coming up" };
      }
    }

    // No status badge if not due or taken - cleaner UI
    return { status: "none", text: "" };
  }, [isMedicationTakenToday, getLastTakenTime]);

  const handleAdd = useCallback(() => {
    // Check limit before allowing add
    if (!checkItemLimit("medications", activeMedicationCount)) {
      return; // Upgrade prompt will show automatically
    }
    setEditingMed(null);
    setShowAddModal(true);
  }, [checkItemLimit, activeMedicationCount]);

  const handleEdit = useCallback((med: Medication) => {
    setEditingMed(med);
    setShowAddModal(true);
  }, []);

  // Handler for adding a suggested medication from Apple Health
  const handleAddSuggestedMedication = useCallback((suggestion: MedicationItem) => {
    // Check limit before allowing add
    if (!checkItemLimit("medications", activeMedicationCount)) {
      return; // Upgrade prompt will show automatically
    }
    setSuggestionToAdd(suggestion);
    setEditingMed(null);
    setShowAddModal(true);
  }, [checkItemLimit, activeMedicationCount]);

  const handleSave = useCallback((medication: Medication) => {
    if (editingMed) {
      updateMedication(editingMed.id, medication);
      showSuccess("Medication updated!");
    } else {
      addMedication(medication);
      showSuccess("Medication added!");
    }
    setShowAddModal(false);
    setEditingMed(null);
    setSuggestionToAdd(null);
  }, [editingMed, updateMedication, addMedication, showSuccess]);

  const handleDelete = useCallback((id: string) => {
    const med = medications.find((m) => m.id === id);
    if (!med) return;

    // Store for potential undo
    deletedMedRef.current = med;

    // Remove immediately
    removeMedication(id);

    // Show undo toast
    showUndo(`"${med.name}" deleted`, () => {
      if (deletedMedRef.current) {
        addMedication(deletedMedRef.current);
        showSuccess("Medication restored!");
        deletedMedRef.current = null;
      }
    });
  }, [medications, removeMedication, addMedication, showUndo, showSuccess]);

  const handleRefresh = useCallback(async () => {
    try {
      await performTwoWaySync();
      showSuccess("Synced successfully!");
    } catch (error) {
      showError("Sync failed. Please try again.");
    }
  }, [performTwoWaySync, showSuccess, showError]);

  const getFrequencyText = useCallback((med: Medication) => {
    const freqMap: Record<string, string> = {
      daily: "Once daily",
      "twice-daily": "Twice daily",
      "three-times-daily": "Three times daily",
      "every-other-day": "Every other day",
      weekly: "Once a week",
      "as-needed": "As needed",
    };
    return freqMap[med.frequency] || "Daily";
  }, []);

  const getTimeText = useCallback((med: Medication) => {
    if (med.specificTime) {
      return `at ${formatTime(med.specificTime)}`;
    }
    return "No time set";
  }, []);

  const renderMedicationItem = useCallback((med: Medication) => {
    const status = getMedicationStatus(med);
    const isTaken = status.status === "taken";

    return (
      <SwipeableRow
        key={med.id}
        onEdit={() => handleEdit(med)}
        onDelete={() => handleDelete(med.id)}
      >
        <View
          className="rounded-3xl p-4"
          style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-start">
            {/* Checkmark Button - Left side - Toggleable */}
            <Pressable
              onPress={() => isTaken ? handleUncheckMedication(med) : handleMarkAsTaken(med)}
              className="mr-3 items-center justify-center"
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isTaken ? "#22C55E" : colors.background,
                borderWidth: isTaken ? 0 : 2,
                borderColor: isTaken ? undefined : colors.border,
              }}
              accessibilityRole="button"
              accessibilityLabel={isTaken ? `Unmark ${med.name} as taken` : `Mark ${med.name} as taken`}
              accessibilityState={{ checked: isTaken }}
            >
              <Ionicons
                name="checkmark"
                size={24}
                color={isTaken ? "white" : colors.textSecondary}
              />
            </Pressable>

            {/* Main Content - Tappable for editing */}
            <Pressable
              onPress={() => handleEdit(med)}
              className="flex-1"
              accessibilityRole="button"
              accessibilityLabel={`${med.name}, ${med.dosage}. Tap to edit.`}
            >
              <View className="flex-row items-center mb-2 flex-wrap">
                <Ionicons name="medical" size={28} color={primary} />
                <Text className={`${textClasses.subtitle} font-semibold ml-3`} style={{ color: colors.textPrimary }}>
                  {med.name}
                </Text>
                {med.syncSource && (
                  <View className="ml-2 px-2 py-1 rounded-full" style={{ backgroundColor: primary }}>
                    <Text className="text-xs text-white font-semibold">
                      {getAppNameFromId(med.syncSource)}
                    </Text>
                  </View>
                )}
              </View>
              <Text className={`${textClasses.body} mb-3 leading-relaxed`} style={{ color: colors.textSecondary }}>
                {med.dosage}
              </Text>
              <View className="mb-2">
                <Text className={`${textClasses.button} mb-1`} style={{ color: colors.textPrimary }}>
                  {getFrequencyText(med)}
                </Text>
                <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                  {getTimeText(med)}
                </Text>
              </View>
              {med.reminderEnabled && (
                <View className="flex-row items-center mb-2">
                  <Ionicons name="notifications" size={24} color={primary} />
                  <Text className={`${textClasses.button} ml-2`} style={{ color: colors.textPrimary }}>
                    Reminders on
                  </Text>
                </View>
              )}
              {/* Status Badge - only show if there's a status to display */}
              {status.status !== "none" && (
                <View
                  className="mt-2 px-4 py-2 rounded-full self-start flex-row items-center"
                  style={{
                    backgroundColor:
                      status.status === "taken" ? "#DCFCE7" :
                      status.status === "due-now" ? "#FFE5E5" :
                      status.status === "upcoming" ? "#FFF4E5" :
                      primary + "20"
                  }}
                >
                  {status.status === "taken" && (
                    <Ionicons name="checkmark-circle" size={18} color="#22C55E" style={{ marginRight: 6 }} />
                  )}
                  <Text
                    className={`${textClasses.button}`}
                    style={{
                      color:
                        status.status === "taken" ? "#15803D" :
                        status.status === "due-now" ? "#CC3A3A" :
                        status.status === "upcoming" ? "#F59E0B" :
                        primary
                    }}
                  >
                    {status.text}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Chevron to indicate tappable */}
            <View className="pl-3 justify-center">
              <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </View>
          </View>
        </View>
      </SwipeableRow>
    );
  }, [colors, textClasses, primary, getMedicationStatus, getAppNameFromId, getFrequencyText, getTimeText, handleEdit, handleDelete, handleMarkAsTaken, handleUncheckMedication]);

  return (
    <ScreenErrorBoundary screenName="Medications">
    <Screen variant="static" edges={["top"]} extraBottomPadding={0}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-8 py-6 border-b" style={{ backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }}>
          <Text className={`${textClasses.title} mb-6`} style={{ color: colors.textPrimary }}>Medications</Text>

          {/* Large Add Medication Button */}
          <Button
            title="Add a Medication"
            onPress={handleAdd}
            variant="primary"
            size="large"
            fullWidth
            icon={<Ionicons name="add-circle" size={36} color="white" />}
            accessibilityLabel="Add a medication"
            style={{ minHeight: 56 }}
          />
        </View>

        {/* Limit Indicator for Essentials users */}
        {!isPremiumUnlocked && (
          <View
            className="mx-8 mt-4 px-4 py-3 rounded-xl flex-row items-center justify-between"
            style={{ backgroundColor: remainingMeds <= 2 ? colors.warningBackground : colors.cardBackground }}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons
                name={remainingMeds === 0 ? "alert-circle" : "information-circle"}
                size={20}
                color={remainingMeds === 0 ? colors.warning : colors.textSecondary}
              />
              <Text
                className={`${textClasses.small} ml-2 flex-1`}
                style={{ color: remainingMeds === 0 ? colors.onWarning : colors.textSecondary }}
              >
                {remainingMeds === 0
                  ? `Limit reached (${ESSENTIALS_LIMITS.maxMedications}/${ESSENTIALS_LIMITS.maxMedications})`
                  : `${activeMedicationCount} of ${ESSENTIALS_LIMITS.maxMedications} active medications`
                }
              </Text>
            </View>
            {remainingMeds <= 2 && (
              <Pressable
                onPress={() => checkItemLimit("medications", ESSENTIALS_LIMITS.maxMedications)}
                className="px-3 py-2 rounded-lg ml-2"
                style={{ backgroundColor: primary, minHeight: 36 }}
              >
                <Text className="text-white text-sm font-semibold">Upgrade</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Medications List with Pull-to-Refresh */}
        <RefreshableScrollView
          onRefresh={handleRefresh}
          className="flex-1 px-8 py-6"
        >
          {/* Search Input - only show if there are medications */}
          {medications.length > 0 && (
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search medications..."
            />
          )}

          {/* Search with no results */}
          {searchQuery.trim() && filteredMedications.length === 0 && (
            <EmptyState
              icon="search"
              title="No results found"
              description={`No medications match "${searchQuery}". Try different keywords.`}
              actionLabel="Clear Search"
              onAction={() => setSearchQuery("")}
            />
          )}

          {/* Empty State - only when no search and no medications */}
          {!searchQuery.trim() && medications.length === 0 && (
            <EmptyState
              icon="medical-outline"
              title="No medications added"
              description="Tap the purple 'Add a Medication' button above to get started. Get reminders at the right time and never miss a dose."
            />
          )}

          {/* Suggested Medications from Apple Health (Premium only) */}
          {isPremiumUnlocked && (
            <SuggestedMedicationsSection onAddMedication={handleAddSuggestedMedication} />
          )}

          {/* Active Medications Section (not taken today) */}
          {activeMedications.length > 0 && (
            <View className="mb-6">
              <Text className={`${textClasses.title} mb-4`} style={{ color: colors.textPrimary }}>
                To Take
              </Text>
              {activeMedications.map(renderMedicationItem)}
            </View>
          )}

          {/* Taken Medications Section */}
          {takenMedications.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <Ionicons name="checkmark-circle" size={24} color="#22C55E" style={{ marginRight: 8 }} />
                <Text className={`${textClasses.title}`} style={{ color: colors.textPrimary }}>
                  Taken Today
                </Text>
              </View>
              {takenMedications.map(renderMedicationItem)}
            </View>
          )}

          {/* Privacy Footer */}
          <PrivacyFooterLink text="Your medications stay on your device" />
        </RefreshableScrollView>
      </View>

      {/* Add/Edit Modal */}
      <AddMedicationModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingMed(null);
          setSuggestionToAdd(null);
        }}
        onSave={handleSave}
        editingMedication={editingMed}
        suggestionFromAppleHealth={suggestionToAdd}
      />

      {/* Swipe Tooltip */}
      <UnifiedTip
        visible={showSwipeTooltip}
        onDismiss={handleDismissTooltip}
        tipId="swipe-meds"
        title="Swipe to Edit or Delete"
        description="Swipe any medication left to reveal edit and delete options."
        icon="hand-left-outline"
        iconColor={primary}
        animationType="swipe"
        demoContent={
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-full items-center justify-center mr-3" style={{ backgroundColor: primary }}>
                <Ionicons name="medical" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>Example Medication</Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Swipe left to see options</Text>
              </View>
            </View>
            <Ionicons name="chevron-back" size={24} color={colors.textTertiary} />
          </View>
        }
        instructions={[
          {
            icon: "pencil",
            iconBgColor: primary,
            title: "Swipe left to edit",
            description: "Swipe any item left to reveal the edit button",
          },
          {
            icon: "trash",
            iconBgColor: colors.error,
            title: "Swipe left to delete",
            description: "The delete button appears next to edit",
          },
        ]}
      />

      {/* Animated Tips for Seniors - only shows once */}
      <AnimatedTip
        tipId={TIP_IDS.ADD_FIRST_MEDICATION}
        title="Add Your First Medication"
        message="Tap the big blue button to add a medication. Never miss a dose with helpful reminders."
        position="top"
        arrowDirection="up"
      />

      {/* First-time user tip */}
      <InlineTip tipId={TIP_IDS.MEDS_FIRST_USE} />

      {/* v1.0: Premium upgrade prompt disabled — IAP removed */}
      {false && (<PremiumUpgradePrompt
        visible={showUpgradePrompt}
        onClose={closeUpgradePrompt}
        onPurchase={async (tier) => {
          const result = await handlePurchase(tier);
          if (result.success) {
            showSuccess(result.message);
            closeUpgradePrompt();
          } else {
            showError(result.message);
          }
        }}
        onRestore={async () => {
          const result = await handleRestore();
          if (result.success) {
            showSuccess(result.message);
            closeUpgradePrompt();
          } else {
            showError(result.message);
          }
        }}
        featureId={triggeredFeature}
        limitMessage={limitMessage}
        isLoading={isPurchaseLoading}
      />)}

      {/* Toast notifications */}
      {ToastComponent}
    </Screen>
    </ScreenErrorBoundary>
  );
}
