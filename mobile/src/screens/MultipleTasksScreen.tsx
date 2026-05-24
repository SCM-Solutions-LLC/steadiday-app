import React, { useState, useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { Screen } from "../components/Screen";
import { useTaskStore } from "../state/stores/taskStore";
import { useUserStore } from "../state/stores/userStore";
import { useIntegrationsStore } from "../state/stores/integrationsStore";
import { useTipStore } from "../state/stores/tipStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import { Task, TaskCategory } from "../types/app";
import { appleCalendarService } from "../sync/appleCalendarSync";
import { appleRemindersService } from "../sync/appleRemindersSync";
import { useTheme } from "../utils/useTheme";
import { getTaskDate } from "../utils/time";
import AddTaskModal from "../components/AddTaskModal";
import Button from "../components/Button";
import { BackButton } from "../components/ui";
import { useConfirmModal } from "../components/ConfirmModal";
import { logger } from "../utils/logger";
import { useFocusEffect } from "@react-navigation/native";
import {
  TaskFilterType,
  TimeWindowDays,
  generateTaskKey,
  getRepeatsBadgeColors,
  getSourceSystemDisplayName,
  getSourceSystemColor,
  formatTaskDateSubtitle,
  formatReminderDateSubtitle,
  isTaskRepeating,
} from "../components/tasks/types";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "MultipleTasksScreen">;
};

const categories: { value: TaskCategory; label: string; icon: string }[] = [
  { value: "medical", label: "Medical", icon: "medical" },
  { value: "errand", label: "Errand", icon: "cart" },
  { value: "personal", label: "Personal", icon: "person" },
  { value: "other", label: "Other", icon: "ellipsis-horizontal" },
];

// Filter chip options - updated per Part D requirements
const filterChips: { value: TaskFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "recurring", label: "Recurring" },
  { value: "one-time", label: "One-time" },
  { value: "events", label: "Calendar" },
  { value: "reminders", label: "Reminders" },
];

// Time window options - updated to show "Next X days"
const timeWindowOptions: { value: TimeWindowDays; label: string }[] = [
  { value: 7, label: "Next 7 days" },
  { value: 30, label: "Next 30 days" },
  { value: 90, label: "Next 90 days" },
];

// Part C: Maximum active tasks limit
const MAX_ACTIVE_TASKS = 15;

/**
 * PART 2: Generate dedupe key for onboarding import
 * key = sourceSystem + sourceContainerId + normalizedTitle + startKey
 * Where:
 * - normalizedTitle = title lowercased, trimmed, collapse whitespace
 * - startKey = dueDateLocal for all-day events OR event.startDate ISO string for timed events
 */
function generateOnboardingDedupeKey(task: Task): string {
  const normalizedTitle = (task.title || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  // Use dueDateLocal for all-day events, otherwise use date ISO string
  const startKey = task.dueDateLocal || task.date;

  return `${task.sourceSystem || "unknown"}:${task.sourceContainerId || ""}:${normalizedTitle}:${startKey}`;
}

/**
 * PART 2: Dedupe tasks for onboarding only
 * Removes duplicate rows based on the dedupe key
 */
function dedupeOnboardingTasks(tasks: Task[]): Task[] {
  const seen = new Map<string, Task>();

  for (const task of tasks) {
    const key = generateOnboardingDedupeKey(task);
    if (!seen.has(key)) {
      seen.set(key, task);
    } else {
      logger.log(`[Onboarding Dedupe] Skipping duplicate: "${task.title}" key=${key}`);
    }
  }

  return Array.from(seen.values());
}

export default function MultipleTasksScreen({ navigation }: Props) {
  // Part C: Two lists - all imported tasks and selected active task IDs
  const [importedTasks, setImportedTasks] = useState<Task[]>([]);
  const [selectedActiveTaskIds, setSelectedActiveTaskIds] = useState<Set<string>>(new Set());
  const [showMoreImported, setShowMoreImported] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter state (Part B)
  const [activeFilter, setActiveFilter] = useState<TaskFilterType>("all");
  const [timeWindowDays, setTimeWindowDays] = useState<TimeWindowDays>(7);

  const { colors, primary } = useTheme();
  const { destructive, confirm } = useConfirmModal();

  // Task actions from useTaskStore - use batch method for atomic import
  const addTasksBatch = useTaskStore((s) => s.addTasksBatch);

  // User actions from useUserStore
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  // Tip store - reset session flag after onboarding so tips can show
  const resetSessionTipFlag = useTipStore((s) => s.resetSessionTipFlag);

  // Integrations state - use integrationsStore for connected apps
  const integrations = useIntegrationsStore((s) => s.integrations);

  // Check if calendar apps are connected
  const isAppleCalendarConnected = integrations.find((i) => i.id === "apple-calendar")?.isConnected ?? false;
  const isAppleRemindersConnected = integrations.find((i) => i.id === "apple-reminders")?.isConnected ?? false;

  // Part C: Auto-select up to 15 tasks based on priority (soonest date first, then createdAt)
  const autoSelectTasks = useCallback((tasks: Task[]) => {
    // Sort by date (soonest first), then by createdAt
    const sorted = [...tasks].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      // If same date, use lastSyncedAt as proxy for createdAt
      const createdA = a.lastSyncedAt ? new Date(a.lastSyncedAt).getTime() : 0;
      const createdB = b.lastSyncedAt ? new Date(b.lastSyncedAt).getTime() : 0;
      return createdA - createdB;
    });

    // Select up to MAX_ACTIVE_TASKS
    const selected = new Set<string>();
    for (let i = 0; i < Math.min(sorted.length, MAX_ACTIVE_TASKS); i++) {
      selected.add(sorted[i].id);
    }
    return selected;
  }, []);

  // Fetch tasks when screen focuses (important for coming back from connect apps flow)
  const fetchRealCalendarData = useCallback(async () => {
    logger.log("[MultipleTasksScreen] Checking integrations - Calendar:", isAppleCalendarConnected, "Reminders:", isAppleRemindersConnected);

    if (!isAppleCalendarConnected && !isAppleRemindersConnected) {
      logger.log("[MultipleTasksScreen] No calendar/reminders apps connected");
      return;
    }

    setIsLoading(true);
    const allTasks: Task[] = [];

    // Calculate date range based on time window
    const startDate = new Date();
    const endDate = new Date(Date.now() + timeWindowDays * 24 * 60 * 60 * 1000);

    try {
      if (isAppleCalendarConnected) {
        logger.log("[MultipleTasksScreen] Fetching from Apple Calendar...");
        const events = await appleCalendarService.fetchEventsFromCalendar(startDate, endDate);
        logger.log(`[MultipleTasksScreen] Got ${events.length} events from Apple Calendar`);
        allTasks.push(...events);
      }

      if (isAppleRemindersConnected) {
        logger.log("[MultipleTasksScreen] Fetching from Apple Reminders...");
        const reminders = await appleRemindersService.fetchRemindersFromApp(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Include past week
          endDate
        );
        logger.log(`[MultipleTasksScreen] Got ${reminders.length} reminders from Apple Reminders`);
        allTasks.push(...reminders);
      }
    } catch (error) {
      logger.error("[MultipleTasksScreen] Error fetching calendar data:", error);
    }

    logger.log(`[MultipleTasksScreen] Total tasks fetched: ${allTasks.length}`);
    if (allTasks.length > 0) {
      // PART 2: Apply onboarding-specific dedupe
      const dedupedTasks = dedupeOnboardingTasks(allTasks);
      logger.log(`[MultipleTasksScreen] After dedupe: ${dedupedTasks.length} tasks (removed ${allTasks.length - dedupedTasks.length} duplicates)`);

      setImportedTasks(dedupedTasks);
      // Part C: Auto-select up to 15 tasks
      setSelectedActiveTaskIds(autoSelectTasks(dedupedTasks));
    }
    setIsLoading(false);
  }, [isAppleCalendarConnected, isAppleRemindersConnected, timeWindowDays, autoSelectTasks]);

  // Run fetch when screen gains focus (handles navigation from connect apps)
  useFocusEffect(
    useCallback(() => {
      fetchRealCalendarData();
    }, [fetchRealCalendarData])
  );

  // Helper function to apply filter to tasks
  const applyFilters = useCallback((tasks: Task[]): Task[] => {
    let filtered = [...tasks];

    // Filter by date range (time window)
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    const endDate = new Date(Date.now() + timeWindowDays * 24 * 60 * 60 * 1000);

    filtered = filtered.filter((task) => {
      // Use getTaskDate helper for proper local date parsing
      const taskDate = getTaskDate(task);
      return taskDate >= now && taskDate <= endDate;
    });

    // Apply filter chips
    switch (activeFilter) {
      case "recurring":
        filtered = filtered.filter((task) => isTaskRepeating(task));
        break;
      case "one-time":
        filtered = filtered.filter((task) => !isTaskRepeating(task));
        break;
      case "events":
        filtered = filtered.filter(
          (task) => task.sourceSystem === "apple_calendar" || task.syncSource === "calendar"
        );
        break;
      case "reminders":
        filtered = filtered.filter(
          (task) => task.sourceSystem === "apple_reminders" || task.syncSource === "reminders"
        );
        break;
      case "all":
      default:
        break;
    }

    return filtered;
  }, [activeFilter, timeWindowDays]);

  // Part C: Computed lists - selected active tasks and unselected imported tasks
  // Apply filters to BOTH selected and unselected tasks
  const selectedActiveTasks = useMemo(() => {
    const selected = importedTasks.filter((task) => selectedActiveTaskIds.has(task.id));
    // Apply filters to selected tasks too
    const filtered = applyFilters(selected);
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [importedTasks, selectedActiveTaskIds, applyFilters]);

  // Unselected tasks with filters applied
  const unselectedImportedTasks = useMemo(() => {
    const unselected = importedTasks.filter((task) => !selectedActiveTaskIds.has(task.id));
    // Apply filters to unselected tasks
    const filtered = applyFilters(unselected);
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [importedTasks, selectedActiveTaskIds, applyFilters]);

  // Get list of connected task apps for display
  const getConnectedTaskAppNames = () => {
    const names: string[] = [];
    if (isAppleCalendarConnected) names.push("Apple Calendar");
    if (isAppleRemindersConnected) names.push("Apple Reminders");
    return names.join(", ");
  };

  // Get app name from syncSource (legacy support)
  const getAppNameFromSyncSource = (syncSource: string) => {
    if (syncSource === "calendar") return "Calendar";
    if (syncSource === "reminders") return "Reminders";
    return syncSource;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    const task: Task = {
      id: editingTask?.id || Date.now().toString(),
      ...taskData,
      completed: false,
    } as Task;

    if (editingTask) {
      setImportedTasks(importedTasks.map((t) => (t.id === editingTask.id ? task : t)));
      setEditingTask(null);
    } else {
      // PART 3: New manually added task - add to list
      setImportedTasks([...importedTasks, task]);

      // PART 3: Auto-select if under limit, otherwise show message
      if (selectedActiveTaskIds.size < MAX_ACTIVE_TASKS) {
        setSelectedActiveTaskIds(new Set([...selectedActiveTaskIds, task.id]));
      } else {
        // At limit - show message that task was created but not selected
        Alert.alert(
          "Task Created",
          "You already selected 15 tasks. Unselect one to add this task to your active list.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowAddModal(true);
  };

  // Part C: Toggle task selection (activate/deactivate)
  const handleToggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedActiveTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else if (newSelected.size < MAX_ACTIVE_TASKS) {
      newSelected.add(taskId);
    }
    setSelectedActiveTaskIds(newSelected);
  };

  // Part C: Activate next imported task
  const handleActivateNextImported = () => {
    if (selectedActiveTaskIds.size >= MAX_ACTIVE_TASKS) return;

    // Find the first unselected task (sorted by date)
    const sortedUnselected = [...unselectedImportedTasks].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    if (sortedUnselected.length > 0) {
      const nextTask = sortedUnselected[0];
      setSelectedActiveTaskIds(new Set([...selectedActiveTaskIds, nextTask.id]));
    }
  };

  const handleDeleteTask = (id: string) => {
    destructive(
      "Delete Task",
      "Are you sure you want to remove this task?",
      "Delete",
      () => {
        // Part C: Remove from both lists, do NOT auto-fill
        setImportedTasks(importedTasks.filter((t) => t.id !== id));
        const newSelected = new Set(selectedActiveTaskIds);
        newSelected.delete(id);
        setSelectedActiveTaskIds(newSelected);
      }
    );
  };

  const handleContinue = () => {
    // Part C: Save only selected active tasks to store atomically
    addTasksBatch(selectedActiveTasks);
    // Navigate to LocationPermission screen
    navigation.navigate("LocationPermission");
  };

  const handleSkip = () => {
    // Navigate to LocationPermission screen (skip saving tasks)
    navigation.navigate("LocationPermission");
  };

  // Get badge colors for theme
  const repeatsBadgeColors = getRepeatsBadgeColors(colors);

  // Check if any tasks are repeating (to show helper text)
  const hasRepeatingTasks = importedTasks.some((task) => isTaskRepeating(task));

  // Part C: Selection count
  const selectedCount = selectedActiveTaskIds.size;

  // Render a single task card
  const renderTaskCard = (task: Task, isSelected: boolean = true) => {
    const taskKey = generateTaskKey(task);
    const repeats = isTaskRepeating(task);
    const isReminder = task.sourceSystem === "apple_reminders" || task.syncSource === "reminders";
    const dateSubtitle = isReminder && repeats
      ? formatReminderDateSubtitle(task)
      : formatTaskDateSubtitle(task);

    const sourceDisplayName = task.sourceSystem && task.sourceSystem !== "manual"
      ? getSourceSystemDisplayName(task.sourceSystem)
      : task.syncSource
        ? getAppNameFromSyncSource(task.syncSource)
        : null;
    const sourceColor = task.sourceSystem && task.sourceSystem !== "manual"
      ? getSourceSystemColor(task.sourceSystem)
      : { bg: primary, text: "#FFFFFF" };

    return (
      <Pressable
        key={taskKey}
        onPress={() => handleToggleTaskSelection(task.id)}
        style={({ pressed }) => ({
          backgroundColor: colors.cardBackground,
          borderColor: isSelected ? primary : colors.border,
          borderWidth: isSelected ? 2 : 1.5,
          opacity: pressed ? 0.95 : 1,
          // Add subtle shadow for better card definition in dark mode
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 1,
        })}
        className="rounded-2xl p-5 mb-3"
      >
        {/* Selection indicator + Title row */}
        <View className="flex-row items-start mb-2">
          {/* Checkbox */}
          <Pressable
            onPress={() => handleToggleTaskSelection(task.id)}
            className="mr-3 mt-0.5"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
          >
            <View
              className="w-6 h-6 rounded-md items-center justify-center"
              style={{
                backgroundColor: isSelected ? primary : "transparent",
                borderWidth: isSelected ? 0 : 2,
                borderColor: colors.border,
              }}
            >
              {isSelected && <Ionicons name="checkmark" size={18} color="white" />}
            </View>
          </Pressable>

          {/* Title and Badges */}
          <View className="flex-1 flex-row items-start flex-wrap">
            <Text
              style={{ color: colors.textPrimary }}
              className="text-lg font-semibold mr-2 flex-shrink"
              numberOfLines={2}
            >
              {task.title}
            </Text>

            {sourceDisplayName && (
              <View
                className="px-2 py-0.5 rounded-md flex-row items-center mr-1.5 mb-1"
                style={{ backgroundColor: sourceColor.bg }}
              >
                <Text className="text-xs font-semibold" style={{ color: sourceColor.text }}>
                  {sourceDisplayName}
                </Text>
              </View>
            )}

            {repeats && (
              <View
                className="px-2 py-0.5 rounded-md flex-row items-center mr-1.5 mb-1"
                style={{
                  backgroundColor: repeatsBadgeColors.bg,
                  borderWidth: 1,
                  borderColor: repeatsBadgeColors.border,
                }}
              >
                <Ionicons name="repeat" size={10} color={repeatsBadgeColors.text} />
                <Text
                  className="text-xs ml-1 font-medium"
                  style={{ color: repeatsBadgeColors.text }}
                >
                  Repeats
                </Text>
              </View>
            )}

            {task.isAllDay && (
              <View
                className="px-2 py-0.5 rounded-md mb-1"
                style={{
                  backgroundColor: repeatsBadgeColors.bg,
                  borderWidth: 1,
                  borderColor: repeatsBadgeColors.border,
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: repeatsBadgeColors.text }}
                >
                  All-day
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Date/Time Subtitle */}
        <Text style={{ color: colors.textSecondary }} className="text-base mb-1 ml-9">
          {dateSubtitle}
        </Text>

        {/* Container name */}
        {task.sourceContainerName && (
          <Text
            style={{ color: colors.textSecondary }}
            className="text-sm ml-9"
            numberOfLines={1}
          >
            {task.sourceContainerName}
          </Text>
        )}

        {/* Edit/Delete buttons for selected tasks */}
        {isSelected && (
          <View className="flex-row justify-end mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleEditTask(task);
              }}
              className="flex-row items-center px-4 py-2 rounded-lg"
              style={{
                backgroundColor: colors.surfaceSubtle,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
              accessibilityRole="button"
              accessibilityLabel="Edit task"
            >
              <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
              <Text className="text-sm font-medium ml-1.5" style={{ color: colors.textPrimary }}>
                Edit
              </Text>
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteTask(task.id);
              }}
              className="flex-row items-center px-4 py-2 rounded-lg ml-2"
              style={{
                backgroundColor: "#FFE5E5",
                borderWidth: 1,
                borderColor: "#FFCCCC",
              }}
              accessibilityRole="button"
              accessibilityLabel="Delete task"
            >
              <Ionicons name="trash-outline" size={18} color="#CC3A3A" />
              <Text className="text-sm font-medium ml-1.5" style={{ color: "#CC3A3A" }}>
                Delete
              </Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View className="flex-1">
          <ScrollView
            className="flex-1 px-6 py-6"
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            nestedScrollEnabled={true}
            removeClippedSubviews={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Back Button */}
            <BackButton label="Back" style={{ marginBottom: 12 }} />

            <Text style={{ color: colors.textPrimary }} className="text-3xl font-semibold text-center mb-3 leading-tight">
              Add Your Tasks
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-lg text-center mb-6 leading-relaxed px-2">
              Add appointments and tasks. You can edit or add more later.
            </Text>

            {/* Connected Apps Info - Loading */}
            {isLoading && getConnectedTaskAppNames() && (
              <View style={{ backgroundColor: colors.cardBackground, borderColor: primary }} className="border-2 rounded-2xl p-5 mb-5">
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color={primary} />
                  <Text style={{ color: colors.textSecondary }} className="text-base ml-3">
                    Importing from {getConnectedTaskAppNames()}...
                  </Text>
                </View>
              </View>
            )}

            {/* Connected Apps Info - Success with Selection Count */}
            {!isLoading && importedTasks.length > 0 && getConnectedTaskAppNames() && (
              <View style={{ backgroundColor: colors.cardBackground, borderColor: primary }} className="border-2 rounded-2xl p-5 mb-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="checkmark-circle" size={24} color={primary} />
                  <Text style={{ color: colors.textPrimary }} className="text-lg font-semibold ml-2">
                    Tasks Imported
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary }} className="text-base leading-relaxed">
                  We imported {importedTasks.length} tasks from {getConnectedTaskAppNames()}.
                </Text>
                {/* Part C: Selection status */}
                <View className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Text style={{ color: primary }} className="text-base font-semibold">
                    Selected {selectedCount} of {MAX_ACTIVE_TASKS}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-sm mt-1">
                    Tap tasks below to select or deselect them.
                  </Text>
                </View>
              </View>
            )}

            {/* Onboarding helper text for repeating items */}
            {hasRepeatingTasks && (
              <View
                className="rounded-xl p-4 mb-4"
                style={{ backgroundColor: repeatsBadgeColors.bg, borderWidth: 1, borderColor: repeatsBadgeColors.border }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="repeat" size={18} color={repeatsBadgeColors.text} />
                  <Text style={{ color: repeatsBadgeColors.text }} className="text-sm ml-2 flex-1">
                    Some items repeat. SteadiDay shows the next one only.
                  </Text>
                </View>
              </View>
            )}

            {/* Time Window Selector */}
            {importedTasks.length > 0 && (
              <View className="mb-4">
                <Text style={{ color: colors.textSecondary }} className="text-sm mb-2 font-medium">
                  Show items for:
                </Text>
                <View className="flex-row">
                  {timeWindowOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => setTimeWindowDays(option.value)}
                      className="mr-2 px-4 py-2 rounded-full"
                      style={{
                        backgroundColor: timeWindowDays === option.value ? primary : colors.cardBackground,
                        borderWidth: 1,
                        borderColor: timeWindowDays === option.value ? primary : colors.border,
                      }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{ color: timeWindowDays === option.value ? "#FFFFFF" : colors.textPrimary }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Filter Chips */}
            {importedTasks.length > 0 && (
              <View className="mb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row">
                    {filterChips.map((chip) => (
                      <Pressable
                        key={chip.value}
                        onPress={() => setActiveFilter(chip.value)}
                        className="mr-2 px-4 py-2 rounded-full"
                        style={{
                          backgroundColor: activeFilter === chip.value ? primary : colors.cardBackground,
                          borderWidth: 1,
                          borderColor: activeFilter === chip.value ? primary : colors.border,
                        }}
                      >
                        <Text
                          className="text-sm font-medium"
                          style={{ color: activeFilter === chip.value ? "#FFFFFF" : colors.textPrimary }}
                        >
                          {chip.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* PART 1: Selected Active Tasks List - filtered based on current filter */}
            {selectedActiveTasks.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Text style={{ color: colors.textPrimary }} className="text-lg font-semibold">
                    Active Tasks ({selectedCount}/{MAX_ACTIVE_TASKS})
                  </Text>
                  {activeFilter !== "all" && selectedActiveTasks.length < selectedCount && (
                    <Text style={{ color: colors.textSecondary }} className="text-sm ml-2">
                      (showing {selectedActiveTasks.length})
                    </Text>
                  )}
                </View>
                {selectedActiveTasks.map((task: Task) => renderTaskCard(task, true))}
              </View>
            )}

            {/* Show message when filter hides all selected tasks */}
            {selectedCount > 0 && selectedActiveTasks.length === 0 && activeFilter !== "all" && (
              <View className="mb-6 p-4 rounded-xl" style={{ backgroundColor: colors.surfaceSubtle }}>
                <Text style={{ color: colors.textSecondary }} className="text-base text-center">
                  No selected tasks match the current filter.
                </Text>
                <Pressable
                  onPress={() => setActiveFilter("all")}
                  className="mt-2"
                >
                  <Text style={{ color: primary }} className="text-base font-semibold text-center">
                    Show All
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Part C: "More imported tasks" section */}
            {unselectedImportedTasks.length > 0 && (
              <View className="mb-6">
                <Pressable
                  onPress={() => setShowMoreImported(!showMoreImported)}
                  className="flex-row items-center justify-between py-3 px-4 rounded-xl mb-3"
                  style={{ backgroundColor: colors.surfaceSubtle }}
                >
                  <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                    More imported tasks ({unselectedImportedTasks.length})
                  </Text>
                  <Ionicons
                    name={showMoreImported ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>

                {showMoreImported && (
                  <>
                    {unselectedImportedTasks.map((task) => renderTaskCard(task, false))}

                    {/* Activate next imported button */}
                    {selectedCount < MAX_ACTIVE_TASKS && (
                      <Pressable
                        onPress={handleActivateNextImported}
                        className="flex-row items-center justify-center py-3 px-4 rounded-xl mt-2"
                        style={{ backgroundColor: primary + "20" }}
                      >
                        <Ionicons name="add-circle-outline" size={20} color={primary} />
                        <Text style={{ color: primary }} className="text-base font-semibold ml-2">
                          Activate Next Imported
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Empty state - only show if no imported tasks at all */}
            {!isLoading && importedTasks.length === 0 && (
              <View className="items-center py-8">
                <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary }} className="text-lg mt-4 text-center">
                  No tasks imported yet.
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-base mt-2 text-center px-4">
                  Connect Apple Calendar or Reminders to import tasks, or add your own below.
                </Text>
              </View>
            )}

            {/* Add Task Button */}
            <Pressable
              onPress={() => setShowAddModal(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.border : colors.cardBackground,
                borderColor: primary,
              })}
              className="border-2 border-dashed rounded-2xl p-8 mb-6"
            >
              <View className="items-center">
                <Ionicons name="add-circle" size={48} color={primary} />
                <Text style={{ color: primary }} className="text-xl font-semibold mt-3">
                  Add {importedTasks.length === 0 ? "First" : "Another"} Task
                </Text>
              </View>
            </Pressable>

            {/* Summary text */}
            {importedTasks.length > 0 && (
              <Text style={{ color: colors.textSecondary }} className="text-base text-center mb-4 leading-relaxed">
                {selectedCount} task{selectedCount !== 1 ? "s" : ""} will be added to your active list
              </Text>
            )}

            {/* Buttons — inside scroll content so user must scroll to reach them */}
            <View className="mt-12 pt-8 pb-6">
              {importedTasks.length > 0 || selectedCount > 0 ? (
                <Button
                  title={`Continue with ${selectedCount} Task${selectedCount !== 1 ? "s" : ""}`}
                  onPress={handleContinue}
                  variant="primary"
                  size="large"
                  fullWidth
                  accessibilityLabel="Continue"
                  style={{ marginBottom: 16 }}
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
      </KeyboardAvoidingView>

      {/* Add/Edit Task Modal - conditionally mounted to avoid responder chain issues */}
      {showAddModal && (
        <AddTaskModal
          visible={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
          editingTask={editingTask}
        />
      )}
    </Screen>
  );
}
