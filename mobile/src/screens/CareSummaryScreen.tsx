import React, { useMemo, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Share } from "react-native";
import { Screen } from "../components/Screen";
import { SubpageHeader } from "../components/ui";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { format, subDays, addDays, isToday, startOfDay } from "date-fns";
import * as Haptics from "expo-haptics";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useMedicationStore } from "../state/stores/medicationStore";
import { useTaskStore } from "../state/stores/taskStore";
import { useHealthRecordsStore } from "../state/stores/healthRecordsStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import {
  useCheckInStore,
  getCheckInDisplayText,
  CheckInEntry,
} from "../state/stores/checkInStore";
import { getTextSizeClasses } from "../utils/textSizes";
import { useSlowMode } from "../utils/useSlowMode";
import { formatTimeForDevice, getTaskDateKey } from "../utils/time";
import { ScreenErrorBoundary, PrivacyFooterLink, CustomToggle, SourceLabel, AnimatedGuideTip } from "../components/ui";
import { useTipStore, TIP_IDS } from "../state/stores/tipStore";
import { usePremiumFeature, usePurchase } from "../hooks";
import { PremiumUpgradePrompt } from "../components/premium";
import { DataSource, getDataSourceLabel } from "../types/app";
import CalendarModal from "../components/CalendarModal";

// Item with source tracking for privacy transparency
interface SourcedItem {
  title: string;
  subtitle?: string;
  source: DataSource;
  completed?: boolean;
}

// Toggle state for what to include in share (per-session, not persisted)
interface ShareToggles {
  checkIn: boolean;
  medications: boolean;
  tasks: boolean; // Combined appointments + reminders
  // v1.0: labResults, healthMetrics, medicalRecords hidden — clinical records removed
}

// Expandable section state
interface ExpandedSections {
  medications: boolean;
  tasks: boolean; // Combined appointments + reminders
  // v1.0: labResults, healthMetrics, medicalRecords hidden — clinical records removed
}

// Max items to show before expand
const MAX_PREVIEW_ITEMS = 3;
const MAX_SHARE_CHARS = 900;

/**
 * CareSummaryScreen - View and share daily summaries with date navigation
 *
 * Features:
 * - Date navigation (previous/next day, date picker)
 * - Read-only mode for past dates
 * - Per-share toggles (not persisted)
 * - Premium toggles for health data from Apple Health
 * - Expand/collapse for long lists
 * - 900 character limit for share text
 */
export default function CareSummaryScreen() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight } = useTheme();
  const { primaryButtonHeight, minTouchTarget } = useSlowMode();

  // Settings
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);

  // Premium status
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);

  // Premium feature gating
  const {
    showUpgradePrompt,
    triggeredFeature,
    closeUpgradePrompt,
    checkFeatureAccess,
  } = usePremiumFeature();

  // Purchase handling
  const {
    handlePurchase,
    handleRestore,
    isLoading: isPurchaseLoading,
  } = usePurchase();

  // Data stores
  const medications = useMedicationStore((s) => s.medications);
  const medicationLogs = useMedicationStore((s) => s.medicationLogs);
  const tasks = useTaskStore((s) => s.tasks);
  const getAppleHealthMedications = useHealthRecordsStore(
    (s) => s.getAppleHealthMedications
  );

  // Check-in store
  const getCheckInForDate = useCheckInStore((s) => s.getCheckInForDate);

  // Date selection state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Expanded sections state
  const [expanded, setExpanded] = useState<ExpandedSections>({
    medications: false,
    tasks: false,
  });

  // Format date strings
  const selectedDateString = format(selectedDate, "yyyy-MM-dd");
  const formattedDate = format(selectedDate, "EEEE, MMMM d");
  const isSelectedDateToday = isToday(selectedDate);
  const isReadOnly = !isSelectedDateToday;

  // Get check-in for selected date
  const checkInEntry: CheckInEntry | null = getCheckInForDate(selectedDateString);
  const hasCheckInData =
    checkInEntry && !checkInEntry.skipped && checkInEntry.value !== null;
  const checkInReason = checkInEntry?.reason || null;

  // Helper to check if medication was taken on selected date
  const isMedicationTakenOnDate = useCallback((medId: string) => {
    const dateStart = startOfDay(selectedDate);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    return medicationLogs.some(
      (log) =>
        log.medicationId === medId &&
        log.status === "taken" &&
        new Date(log.scheduledTime) >= dateStart &&
        new Date(log.scheduledTime) < dateEnd
    );
  }, [medicationLogs, selectedDate]);

  // Toggle state - default based on data availability for selected date
  const [toggles, setToggles] = useState<ShareToggles>({
    checkIn: true, // Will be checked against hasCheckInData
    medications: true,
    tasks: true,
    // v1.0: labResults, healthMetrics, medicalRecords removed — clinical records removed
  });

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  // Date navigation handlers
  const handlePreviousDay = useCallback(() => {
    triggerHaptic();
    setSelectedDate((prev) => subDays(prev, 1));
  }, [triggerHaptic]);

  const handleNextDay = useCallback(() => {
    if (!isSelectedDateToday) {
      triggerHaptic();
      setSelectedDate((prev) => addDays(prev, 1));
    }
  }, [isSelectedDateToday, triggerHaptic]);

  // Get check-in status text
  const getCheckInStatusText = (): string => {
    if (!checkInEntry) {
      return "Not completed";
    }
    if (checkInEntry.skipped) {
      return "Skipped";
    }
    return getCheckInDisplayText(checkInEntry.value);
  };

  // Get medications for selected date with source tracking
  const dateMedications: SourcedItem[] = useMemo(() => {
    // Show ALL medications (not just ones with reminders enabled)
    const manualMeds: SourcedItem[] = medications
      .map((med) => ({
        title: med.name,
        subtitle: med.dosage || undefined,
        source: (med.dataSource || "steadiday") as DataSource,
        completed: isMedicationTakenOnDate(med.id),
      }));

    // For Premium users, also include Apple Health medications
    if (isPremiumUnlocked) {
      const healthMeds = getAppleHealthMedications();
      const healthMedItems: SourcedItem[] = healthMeds
        .filter((med) => med.status === "active")
        .map((med) => ({
          title: med.displayName,
          subtitle: med.doseText || undefined,
          source: "apple_health" as DataSource,
          completed: false, // Can't track Apple Health med completion
        }));
      return [...manualMeds, ...healthMedItems];
    }

    return manualMeds;
  }, [medications, getAppleHealthMedications, isPremiumUnlocked, isMedicationTakenOnDate]);

  // Get tasks for selected date with source tracking (include both completed and pending)
  const dateTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.date) return false;
      const taskDateKey = getTaskDateKey(task);
      return taskDateKey === selectedDateString;
    });
  }, [tasks, selectedDateString]);

  // All tasks for selected date (no split into appointments/reminders)
  // Format times according to device preference (12h or 24h)
  const dateTaskItems: SourcedItem[] = useMemo(
    () =>
      dateTasks.map((task) => ({
        title: task.title,
        subtitle: task.time ? formatTimeForDevice(task.time) : undefined,
        source: getTaskSource(task),
        completed: task.completed,
      })),
    [dateTasks]
  );

  // Helper to get task source
  function getTaskSource(task: { dataSource?: DataSource; syncSource?: string }): DataSource {
    if (task.dataSource) return task.dataSource;
    if (task.syncSource === "calendar") return "apple_calendar";
    if (task.syncSource === "reminders") return "ios_reminders";
    return "steadiday";
  }

  // Check if sections have data
  const hasMedicationsData = dateMedications.length > 0;
  const hasTasksData = dateTaskItems.length > 0;

  // Toggle handler
  const handleToggle = useCallback(
    (key: keyof ShareToggles, isPremiumToggle: boolean = false) => {
      if (isPremiumToggle && !isPremiumUnlocked) {
        checkFeatureAccess("care_summary_premium");
        return;
      }
      triggerHaptic();
      setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    [isPremiumUnlocked, checkFeatureAccess, triggerHaptic]
  );

  // Expand/collapse handler
  const toggleExpand = useCallback(
    (key: keyof ExpandedSections) => {
      triggerHaptic();
      setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    [triggerHaptic]
  );

  // Generate share text with 900 char limit
  // Uses checkmarks for completed items since strikethrough doesn't work in SMS
  const generateShareText = useCallback((): string => {
    const sections: string[] = [];
    const footerText = isSelectedDateToday
      ? "Everything here is for today only."
      : "Everything here is for this day only.";
    const footer = `\n${footerText}\n\nSent from SteadiDay`;

    // Header
    sections.push(`Care Summary for ${formattedDate}\n`);

    // Check-in (only if toggle ON and has data)
    if (toggles.checkIn && hasCheckInData) {
      let checkInSection = `Check-in: ${getCheckInStatusText()}`;
      if (checkInReason) {
        checkInSection += `\n  "${checkInReason}"`;
      }
      sections.push(checkInSection + "\n");
    }

    // Medications - use checkmarks for completed items
    if (toggles.medications && hasMedicationsData) {
      let medSection = "Medications:\n";
      dateMedications.forEach((med) => {
        const dosageText = med.subtitle ? ` (${med.subtitle})` : "";
        const prefix = med.completed ? "✓" : "○";
        const suffix = med.completed ? " (done)" : "";
        medSection += `  ${prefix} ${med.title}${dosageText}${suffix}\n`;
      });
      sections.push(medSection);
    }

    // Tasks - use checkmarks for completed items
    if (toggles.tasks && hasTasksData) {
      const completedCount = dateTaskItems.filter(t => t.completed).length;
      let taskSection = `Tasks (${completedCount}/${dateTaskItems.length} done):\n`;
      dateTaskItems.forEach((task) => {
        const timeText = task.subtitle ? ` at ${task.subtitle}` : "";
        const prefix = task.completed ? "✓" : "○";
        taskSection += `  ${prefix} ${task.title}${timeText}\n`;
      });
      sections.push(taskSection);
    }

    // Build result
    let result = sections.join("\n") + footer;

    // Truncate if needed, preserving footer
    if (result.length > MAX_SHARE_CHARS) {
      const availableSpace = MAX_SHARE_CHARS - footer.length - 30; // 30 for truncation indicator
      let truncatedContent = sections.join("\n");

      if (truncatedContent.length > availableSpace) {
        truncatedContent =
          truncatedContent.substring(0, availableSpace) + "\n\nAnd more from this day...";
      }
      result = truncatedContent + footer;
    }

    // If nothing to share
    if (sections.length <= 1) {
      result = `Care Summary for ${formattedDate}\n\nNo updates to share.${footer}`;
    }

    return result;
  }, [
    formattedDate,
    toggles,
    hasCheckInData,
    checkInReason,
    hasMedicationsData,
    hasTasksData,
    dateMedications,
    dateTaskItems,
    isSelectedDateToday,
    getCheckInStatusText,
  ]);

  // Handle share action
  const handleShareSummary = async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const shareText = generateShareText();

    try {
      await Share.share({ message: shareText });
    } catch (error) {
      // User cancelled or error occurred
    }
  };

  // Render expandable section with completion status
  const renderExpandableList = (
    items: { title: string; subtitle?: string; completed?: boolean }[],
    sectionKey: keyof ExpandedSections,
    icon: string,
    label: string
  ) => {
    if (items.length === 0) return null;

    const isExpanded = expanded[sectionKey];
    const displayItems = isExpanded ? items : items.slice(0, MAX_PREVIEW_ITEMS);
    const hasMore = items.length > MAX_PREVIEW_ITEMS;
    const completedCount = items.filter(i => i.completed).length;

    return (
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={colors.textSecondary}
          />
          <Text
            className={`${textClasses.small} font-semibold ml-2`}
            style={{ color: colors.textSecondary }}
          >
            {label} ({completedCount}/{items.length} done)
          </Text>
        </View>
        {displayItems.map((item, index) => (
          <View key={index} className="flex-row items-center ml-6 mb-1">
            {item.completed !== undefined && (
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: item.completed ? "#22C55E" : "transparent",
                  borderWidth: item.completed ? 0 : 2,
                  borderColor: item.completed ? undefined : colors.border,
                  marginRight: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.completed && (
                  <Ionicons name="checkmark" size={12} color="white" />
                )}
              </View>
            )}
            <Text
              className={`${textClasses.body} flex-1`}
              style={{
                color: item.completed ? colors.textSecondary : colors.textPrimary,
                textDecorationLine: item.completed ? "line-through" : "none",
              }}
            >
              {item.title}
              {item.subtitle ? ` (${item.subtitle})` : ""}
            </Text>
          </View>
        ))}
        {hasMore && (
          <Pressable
            onPress={() => toggleExpand(sectionKey)}
            className="flex-row items-center ml-6 mt-1"
            style={{ minHeight: minTouchTarget }}
          >
            <Text
              className={`${textClasses.small}`}
              style={{ color: primary }}
            >
              {isExpanded
                ? "Show less"
                : `Show all ${items.length} for this day`}
            </Text>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={primary}
              style={{ marginLeft: 4 }}
            />
          </Pressable>
        )}
      </View>
    );
  };

  // Render toggle row
  const renderToggleRow = (
    key: keyof ShareToggles,
    label: string,
    hasData: boolean,
    isPremiumToggle: boolean = false,
    helperText?: string
  ) => {
    const isEnabled = toggles[key];
    const isLocked = isPremiumToggle && !isPremiumUnlocked;
    const isDisabled = !hasData && !isPremiumToggle;

    return (
      <View key={key}>
        <Pressable
          onPress={() => handleToggle(key, isPremiumToggle)}
          disabled={isDisabled && !isLocked}
          className="flex-row items-center py-3"
          style={{ opacity: isDisabled && !isLocked ? 0.5 : 1, minHeight: minTouchTarget }}
        >
          <View className="flex-1 flex-row items-center flex-wrap">
            <Text
              className={`${textClasses.body}`}
              style={{ color: colors.textPrimary }}
            >
              {label}
            </Text>
            {isLocked && (
              <View
                className="ml-2 px-2 py-0.5 rounded-full flex-row items-center"
                style={{ backgroundColor: colors.premium }}
              >
                <Ionicons name="lock-closed" size={10} color={colors.onPremium} />
                <Text
                  className="text-xs font-semibold ml-1"
                  style={{ color: colors.onPremium }}
                >
                  Premium
                </Text>
              </View>
            )}
            {!hasData && !isPremiumToggle && (
              <Text
                className={`${textClasses.small} ml-2`}
                style={{ color: colors.textTertiary }}
              >
                (no data)
              </Text>
            )}
          </View>
          <CustomToggle
            value={isEnabled && (hasData || isPremiumToggle)}
            onValueChange={() => handleToggle(key, isPremiumToggle)}
            disabled={isDisabled && !isLocked}
          />
        </Pressable>
        {helperText && isPremiumToggle && (
          <Text
            className={`${textClasses.small} -mt-1 mb-2`}
            style={{ color: colors.textTertiary, marginLeft: 0 }}
          >
            {helperText}
          </Text>
        )}
      </View>
    );
  };

  // Check if any content is enabled for sharing
  const hasContentToShare =
    (toggles.checkIn && hasCheckInData) ||
    (toggles.medications && hasMedicationsData) ||
    (toggles.tasks && hasTasksData);

  return (
    <ScreenErrorBoundary screenName="CareSummary">
      <Screen variant="static" edges={["top"]} extraBottomPadding={0}>
        {/* Header - SENIOR-FRIENDLY: Labeled back button */}
        <SubpageHeader
          title="Care Summary"
          backLabel="Home"
          onBack={() => {
            triggerHaptic();
            navigation.goBack();
          }}
          subtitle={isReadOnly ? "Viewing past day (read-only)" : "Preview and share"}
        />

        <ScrollView
          className="flex-1 px-6 py-4"
          showsVerticalScrollIndicator={true}
        >
          {/* Date Navigation */}
          <View
            className="rounded-2xl p-4 mb-6 flex-row items-center justify-between"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Pressable
              onPress={handlePreviousDay}
              className="p-2 rounded-xl"
              style={{
                backgroundColor: primaryLight,
                minWidth: minTouchTarget,
                minHeight: minTouchTarget,
                justifyContent: "center",
                alignItems: "center",
              }}
              accessibilityRole="button"
              accessibilityLabel="Previous day"
            >
              <Ionicons name="chevron-back" size={24} color={primary} />
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic();
                setShowDatePicker(true);
              }}
              className="flex-1 mx-4 items-center"
              accessibilityRole="button"
              accessibilityLabel="Pick a date"
            >
              <Text
                className={`${textClasses.subtitle} font-semibold text-center`}
                style={{ color: colors.textPrimary }}
              >
                {formattedDate}
              </Text>
              {isReadOnly && (
                <View className="flex-row items-center mt-1">
                  <Ionicons
                    name="eye-outline"
                    size={14}
                    color={colors.textTertiary}
                  />
                  <Text
                    className={`${textClasses.small} ml-1`}
                    style={{ color: colors.textTertiary }}
                  >
                    Read-only
                  </Text>
                </View>
              )}
              <Text
                className={`${textClasses.small} mt-1`}
                style={{ color: primary }}
              >
                Tap to pick date
              </Text>
            </Pressable>

            <Pressable
              onPress={handleNextDay}
              disabled={isSelectedDateToday}
              className="p-2 rounded-xl"
              style={{
                backgroundColor: isSelectedDateToday
                  ? colors.border
                  : primaryLight,
                minWidth: minTouchTarget,
                minHeight: minTouchTarget,
                justifyContent: "center",
                alignItems: "center",
                opacity: isSelectedDateToday ? 0.5 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel="Next day"
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isSelectedDateToday ? colors.textTertiary : primary}
              />
            </Pressable>
          </View>

          {/* Calendar Modal */}
          <CalendarModal
            visible={showDatePicker}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
            }}
            onClose={() => setShowDatePicker(false)}
            maxDate={new Date()}
          />

          {/* What to Include - Per-Share Toggles */}
          <View
            className="rounded-2xl p-5 mb-6"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center mb-4">
              <Ionicons
                name="options-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text
                className={`${textClasses.body} font-semibold ml-2`}
                style={{ color: colors.textPrimary }}
              >
                What to include
              </Text>
            </View>

            {/* Basic toggles */}
            {renderToggleRow("checkIn", "Check-in status", hasCheckInData ?? false)}
            <View style={{ height: 1, backgroundColor: colors.divider }} />
            {renderToggleRow("medications", "Medications", hasMedicationsData)}
            <View style={{ height: 1, backgroundColor: colors.divider }} />
            {renderToggleRow("tasks", "Tasks", hasTasksData)}

            {/* Premium toggles */}
            <View
              className="mt-4 pt-4"
              style={{ borderTopWidth: 1, borderTopColor: colors.divider }}
            >
            {/* v1.0: Health Data (Premium) toggles removed — clinical records disabled */}
            </View>
          </View>

          {/* Preview */}
          <Text
            className={`${textClasses.subtitle} font-semibold mb-4`}
            style={{ color: colors.textPrimary }}
          >
            Preview
          </Text>

          <View
            className="rounded-2xl p-5 mb-6"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Date Header */}
            <Text
              className={`${textClasses.body} font-semibold mb-4`}
              style={{ color: colors.textPrimary }}
            >
              {formattedDate}
            </Text>

            {/* Check-In Section */}
            {toggles.checkIn && hasCheckInData && (
              <View className="mb-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name="heart-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text
                    className={`${textClasses.small} font-semibold ml-2`}
                    style={{ color: colors.textSecondary }}
                  >
                    Check-in
                  </Text>
                </View>
                <Text
                  className={`${textClasses.body} ml-6`}
                  style={{ color: colors.textPrimary }}
                >
                  {getCheckInStatusText()}
                </Text>
                {checkInReason && (
                  <Text
                    className={`${textClasses.body} ml-6 mt-1`}
                    style={{ color: colors.textSecondary, fontStyle: "italic" }}
                  >
                    {`"${checkInReason}"`}
                  </Text>
                )}
              </View>
            )}

            {/* Medications Section with expand/collapse */}
            {toggles.medications &&
              hasMedicationsData &&
              renderExpandableList(
                dateMedications.map((m) => ({
                  title: m.title,
                  subtitle: m.subtitle,
                  completed: m.completed,
                })),
                "medications",
                "medical-outline",
                "Medications"
              )}

            {/* Tasks Section with expand/collapse */}
            {toggles.tasks &&
              hasTasksData &&
              renderExpandableList(
                dateTaskItems.map((t) => ({
                  title: t.title,
                  subtitle: t.subtitle,
                  completed: t.completed,
                })),
                "tasks",
                "checkbox-outline",
                "Tasks"
              )}

            {/* Empty state */}
            {!hasContentToShare && (
              <Text
                className={`${textClasses.body}`}
                style={{ color: colors.textSecondary }}
              >
                No updates to share for this day.
              </Text>
            )}
          </View>

          {/* Privacy Footer */}
          <PrivacyFooterLink text="Nothing is shared without your permission" />
        </ScrollView>

        {/* Share Button - Fixed at bottom */}
        <View
          className="px-6 py-4 border-t"
          style={{
            backgroundColor: colors.background,
            borderTopColor: colors.divider,
          }}
        >
          <Pressable
            onPress={handleShareSummary}
            className="flex-row items-center justify-center rounded-2xl active:opacity-80"
            style={{
              backgroundColor: primary,
              minHeight: primaryButtonHeight,
            }}
            accessibilityRole="button"
            accessibilityLabel={`Share care summary for ${formattedDate}`}
          >
            <Ionicons name="share-outline" size={22} color={colors.onPrimary} />
            <Text
              className={`${textClasses.body} font-semibold ml-3`}
              style={{ color: colors.onPrimary }}
            >
              Share Care Summary
            </Text>
          </Pressable>
          <Text
            className={`${textClasses.small} text-center mt-3`}
            style={{ color: colors.textSecondary }}
          >
            Opens your messaging app. You choose who to send it to.
          </Text>
        </View>

        {/* v1.0: Premium upgrade prompt disabled — IAP removed */}
        {false && (<PremiumUpgradePrompt
          visible={showUpgradePrompt}
          onClose={closeUpgradePrompt}
          onPurchase={async (tier) => {
            const result = await handlePurchase(tier);
            if (result.success) {
              closeUpgradePrompt();
            }
          }}
          onRestore={async () => {
            const result = await handleRestore();
            if (result.success) {
              closeUpgradePrompt();
            }
          }}
          featureId={triggeredFeature}
          isLoading={isPurchaseLoading}
        />)}

        {/* Animated Guide: Care Summary */}
        <AnimatedGuideTip
          tipId={TIP_IDS.CARE_SUMMARY_GUIDE}
          title="Care Summary"
          message="Care Summary lets you quickly share your daily health updates with family caregivers. Toggle what to include, then share with a tap!"
          icon="heart"
        />
      </Screen>
    </ScreenErrorBoundary>
  );
}
