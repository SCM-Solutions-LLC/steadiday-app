import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, Pressable, InteractionManager } from "react-native";
import { Screen } from "../components/Screen";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTaskStore } from "../state/stores/taskStore";
import { useAppStore } from "../state/appStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useIntegrationsStore } from "../state/stores/integrationsStore";
import { Ionicons } from "@expo/vector-icons";
import { getTextSizeClasses } from "../utils/textSizes";
import { Task } from "../types/app";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import UnifiedTip from "../components/UnifiedTip";
import * as Haptics from "expo-haptics";
import { usePremiumFeature, usePurchase } from "../hooks";
import { PremiumUpgradePrompt } from "../components/premium";
import { ESSENTIALS_LIMITS } from "../config/featureAccess";
import {
  useToast,
  EmptyState,
  RefreshableScrollView,
  SearchInput,
  ScreenErrorBoundary,
  PrivacyFooter,
  DismissableInfoBox,
  InlineTip,
} from "../components/ui";
import { useTipStore, TIP_IDS } from "../state/stores/tipStore";
import {
  TaskCard,
  TaskFormModal,
  useTaskFilters,
  TaskFormData,
  WeekOverviewView,
  generateTaskKey,
} from "../components/tasks";
import { useEngagementStore } from "../state/stores/engagementStore";
import { maybeRequestReview } from "../utils/reviewPrompt";
import { logger } from "../utils/logger";

export default function TasksScreen() {
  const navigation = useNavigation();

  // Deferred render: show lightweight placeholder until navigation transition completes
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    // Fallback: ensure screen becomes interactive even if InteractionManager is blocked
    // (e.g. when Animated.spring from onboarding doesn't complete before unmount)
    const timeout = setTimeout(() => setIsReady(true), 500);
    return () => {
      task.cancel();
      clearTimeout(timeout);
    };
  }, []);

  // Task data from useTaskStore
  const tasks = useTaskStore((s) => s.tasks);
  const taskStoreHydrated = useTaskStore((s) => s._hasHydrated);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const toggleTaskComplete = useTaskStore((s) => s.toggleTaskComplete);

  // Settings from useSettingsStore
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);

  // Non-task data from useAppStore
  const performTwoWaySync = useAppStore((s) => s.performTwoWaySync);

  // Check if integrations are connected for auto-sync
  const appleCalendarConnected = useIntegrationsStore((s) => s.appleCalendar.isConnected);
  const appleCalendarIds = useIntegrationsStore((s) => s.appleCalendar.selectedCalendarIds);
  const appleRemindersConnected = useIntegrationsStore((s) => s.appleReminders.isConnected);
  const appleReminderIds = useIntegrationsStore((s) => s.appleReminders.selectedListIds);
  const lastSyncedAt = useIntegrationsStore((s) => s.appleCalendar.lastSyncedAt);

  // Track whether sync has succeeded (not just attempted)
  const hasSyncedRef = useRef(false);
  const isSyncingRef = useRef(false);

  // Sync function that can be called from multiple triggers
  const triggerSync = useCallback(async () => {
    const hasCalendar = appleCalendarConnected && appleCalendarIds.length > 0;
    const hasReminders = appleRemindersConnected && appleReminderIds.length > 0;

    if (!(hasCalendar || hasReminders)) return;
    if (hasSyncedRef.current || isSyncingRef.current) return;

    isSyncingRef.current = true;
    try {
      const syncPromise = performTwoWaySync();
      const timeoutPromise = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Sync timeout")), 10000)
      );
      await Promise.race([syncPromise, timeoutPromise]);
      hasSyncedRef.current = true;
    } catch (error) {
      logger.log("[TasksScreen] Sync failed or timed out, will retry on next trigger");
    } finally {
      isSyncingRef.current = false;
    }
  }, [appleCalendarConnected, appleCalendarIds.length, appleRemindersConnected, appleReminderIds.length, performTwoWaySync]);

  // Keep a stable ref to triggerSync so useFocusEffect doesn't re-run on identity changes
  const triggerSyncRef = useRef(triggerSync);
  triggerSyncRef.current = triggerSync;

  // Auto-sync on screen focus - defer well past animations to prevent freeze
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const task = InteractionManager.runAfterInteractions(() => {
        // Extra delay lets the screen fully paint before heavy native calendar calls
        const timer = setTimeout(() => {
          if (!cancelled) {
            requestAnimationFrame(() => {
              if (!cancelled) triggerSyncRef.current();
            });
          }
        }, 800);
        if (cancelled) clearTimeout(timer);
      });
      return () => {
        cancelled = true;
        task.cancel();
        isSyncingRef.current = false;
        hasSyncedRef.current = false;
      };
    }, [])
  );

  // Premium feature gating
  const {
    checkItemLimit,
    checkFeatureAccess,
    getRemainingCount,
    isPremiumUnlocked,
    showUpgradePrompt,
    triggeredFeature,
    limitMessage,
    closeUpgradePrompt,
  } = usePremiumFeature();

  // Purchase handling
  const { handlePurchase, handleRestore, isLoading: isPurchaseLoading } = usePurchase();

  // Count only ACTIVE tasks for Essentials limits
  // Active = not completed AND not archived
  const activeTaskCount = tasks.filter(t => !t.completed && !t.archivedAt).length;
  const remainingTasks = getRemainingCount("tasks", activeTaskCount);

  const { primary, primaryLight, colors } = useTheme();
  const textClasses = getTextSizeClasses(textSize);
  const { showSuccess, showError, showUndo, ToastComponent } = useToast();

  // Local state
  const [viewMode, setViewMode] = useState<"today" | "week">("today");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const deletedTaskRef = useRef<Task | null>(null);

  // Use the task filters hook
  const {
    searchQuery,
    setSearchQuery,
    todaysTasks,
    filteredTodaysTasks,
    activeTasks,
    completedTasks,
  } = useTaskFilters({ tasks });

  // Tip state for animated tips
  const showTip = useTipStore((s) => s.showTip);
  const hasTipBeenSeen = useTipStore((s) => s.hasTipBeenSeen);
  const hasSeenTooltip = useTipStore((s) => s.hasSeenTooltip);
  const markTooltipAsShown = useTipStore((s) => s.markTooltipAsShown);
  const tipsCompleted = useTipStore((s) => s.tipsCompleted);

  // Swipe tooltip state
  const [showSwipeTooltip, setShowSwipeTooltip] = useState(false);

  // Show swipe tooltip for first-time users (only during first session after onboarding)
  useEffect(() => {
    if (tasks.length > 0 && !hasSeenTooltip("swipe-tasks") && !tipsCompleted) {
      const timer = setTimeout(() => {
        setShowSwipeTooltip(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tasks.length, hasSeenTooltip, tipsCompleted]);

  const handleDismissSwipeTooltip = useCallback(() => {
    setShowSwipeTooltip(false);
    markTooltipAsShown("swipe-tasks");
  }, [markTooltipAsShown]);

  // Show animated tips for seniors
  useEffect(() => {
    const showAnimatedTips = async () => {
      // Wait a bit before showing tips
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Show add first task tip if they have no tasks
      if (tasks.length === 0 && !hasTipBeenSeen(TIP_IDS.ADD_FIRST_TASK)) {
        showTip(TIP_IDS.ADD_FIRST_TASK);
      } else if (isPremiumUnlocked && !hasTipBeenSeen(TIP_IDS.BROWSE_TEMPLATES)) {
        // Show browse templates tip for premium users
        showTip(TIP_IDS.BROWSE_TEMPLATES);
      }
    };
    showAnimatedTips();
  }, [tasks.length, isPremiumUnlocked, hasTipBeenSeen, showTip]);

  // Handlers
  const handleAdd = useCallback(() => {
    // v1.0: All features free, skip limit check since upgrade prompt is disabled
    setEditingTask(null);
    setShowAddModal(true);
  }, []);

  const handleBrowseTemplates = useCallback(() => {
    // Task templates is a Premium feature
    if (!checkFeatureAccess("task-templates")) {
      return; // Upgrade prompt will show automatically
    }
    navigation.navigate("TaskTemplates" as never);
  }, [checkFeatureAccess, navigation]);

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setShowAddModal(true);
  }, []);

  const handleSaveTask = useCallback((formData: TaskFormData) => {
    const timeStr = formData.hasTime
      ? `${formData.time?.getHours().toString().padStart(2, "0")}:${formData.time?.getMinutes().toString().padStart(2, "0")}`
      : undefined;

    // Convert alert timing to minutes
    const alertToMinutes = (alert: string): number => {
      switch (alert) {
        case "at_time": return 0;
        case "5_min": return 5;
        case "15_min": return 15;
        case "30_min": return 30;
        default: return 0;
      }
    };

    const reminderMinutes = formData.reminderEnabled ? alertToMinutes(formData.firstAlert) : undefined;
    const secondReminderMinutes = formData.reminderEnabled && formData.secondAlert !== "none"
      ? alertToMinutes(formData.secondAlert)
      : undefined;

    if (editingTask) {
      updateTask(editingTask.id, {
        title: formData.title,
        date: formData.date.toISOString(),
        time: timeStr,
        category: formData.category,
        frequency: formData.frequency,
        reminderEnabled: formData.reminderEnabled,
        reminderMinutes,
        secondReminderMinutes,
        soundReminderEnabled: formData.soundReminderEnabled,
        notes: formData.notes || undefined,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
      showSuccess("Task updated!");
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        title: formData.title,
        date: formData.date.toISOString(),
        time: timeStr,
        category: formData.category,
        frequency: formData.frequency,
        reminderEnabled: formData.reminderEnabled,
        reminderMinutes,
        secondReminderMinutes,
        soundReminderEnabled: formData.soundReminderEnabled,
        notes: formData.notes || undefined,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        completed: false,
        // Manual task defaults
        sourceSystem: "manual",
        isImported: false,
        isReadOnly: false,
        syncStatus: "unlinked",
      };
      addTask(newTask);
      showSuccess("Task added!");
    }

    setShowAddModal(false);
  }, [editingTask, updateTask, addTask, showSuccess]);

  const handleDelete = useCallback((id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    deletedTaskRef.current = task;
    removeTask(id);

    showUndo(`"${task.title}" deleted`, () => {
      if (deletedTaskRef.current) {
        addTask(deletedTaskRef.current);
        showSuccess("Task restored!");
        deletedTaskRef.current = null;
      }
    });
  }, [tasks, removeTask, addTask, showUndo, showSuccess]);

  const handleToggleComplete = useCallback((id: string) => {
    const task = tasks.find((t) => t.id === id);
    toggleTaskComplete(id);

    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (task && !task.completed) {
      showSuccess("Nice work! Task completed.");

      // Track engagement (only when completing, not uncompleting)
      useEngagementStore.getState().incrementTasksCompleted();
      setTimeout(() => maybeRequestReview(), 2000);
    } else if (task && task.completed) {
      showSuccess("Task unmarked");
    }
  }, [tasks, toggleTaskComplete, hapticEnabled, showSuccess]);

  const handleRefresh = useCallback(async () => {
    try {
      await performTwoWaySync();
      showSuccess("Synced successfully!");
    } catch (error) {
      showError("Sync failed. Please try again.");
    }
  }, [performTwoWaySync, showSuccess, showError]);

  // Render a task card with unique key (Part I - FlatList Key Fix)
  const renderTaskItem = useCallback((task: Task) => (
    <TaskCard
      key={generateTaskKey(task)}
      task={task}
      textClasses={textClasses}
      colors={colors}
      primary={primary}
      primaryLight={primaryLight}
      onToggleComplete={handleToggleComplete}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  ), [textClasses, colors, primary, primaryLight, handleToggleComplete, handleEdit, handleDelete]);

  if (!isReady || !taskStoreHydrated) {
    return (
      <ScreenErrorBoundary screenName="Tasks">
        <Screen variant="static" edges={["top"]} extraBottomPadding={0}>
          <View className="flex-1 items-center justify-center">
            <View className="items-center">
              <Ionicons name="checkbox-outline" size={48} color={primary} style={{ marginBottom: 16, opacity: 0.5 }} />
              <Text className={`${textClasses.body}`} style={{ color: colors.textSecondary }}>
                Loading tasks...
              </Text>
            </View>
          </View>
        </Screen>
      </ScreenErrorBoundary>
    );
  }

  return (
    <ScreenErrorBoundary screenName="Tasks">
    <Screen variant="static" edges={["top"]} extraBottomPadding={0}>
      <View className="flex-1">
        {/* Header */}
        <View
          className="px-8 py-6 border-b"
          style={{ backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }}
        >
          <Text className={`${textClasses.title} mb-6`} style={{ color: colors.textPrimary }}>
            Tasks
          </Text>

          {/* Large Add Task Button */}
          <Button
            title="Add a Task"
            onPress={handleAdd}
            variant="primary"
            size="large"
            fullWidth
            icon={<Ionicons name="add-circle" size={36} color="white" />}
            accessibilityLabel="Add a task"
            style={{ marginBottom: 16, minHeight: 56 }}
          />

          {/* Browse Templates Button */}
          <Pressable
            onPress={handleBrowseTemplates}
            className="flex-row items-center py-4 px-4 rounded-2xl mb-6"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 56
            }}
            accessibilityRole="button"
            accessibilityLabel={isPremiumUnlocked ? "Browse task templates" : "Browse task templates. Premium feature. Tap to upgrade."}
          >
            <Ionicons name="list" size={24} color={primary} />
            <Text className={`${textClasses.body} font-semibold ml-3 flex-1`} style={{ color: colors.textPrimary }}>
              Browse Templates
            </Text>
            {!isPremiumUnlocked && (
              <View className="flex-row items-center">
                <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
                <Text className={`${textClasses.small} ml-1`} style={{ color: colors.textSecondary }}>
                  Premium
                </Text>
              </View>
            )}
            {isPremiumUnlocked && (
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
          </Pressable>

          {/* View Toggle */}
          <View className="flex-row rounded-2xl p-2" style={{ backgroundColor: colors.background }}>
            <Pressable
              onPress={() => setViewMode("today")}
              className="flex-1 py-4 rounded-xl"
              style={{
                backgroundColor: viewMode === "today" ? colors.cardBackground : "transparent",
                minHeight: 48,
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: viewMode === "today" }}
            >
              <Text
                className={`${textClasses.subtitle} text-center font-semibold`}
                style={{ color: viewMode === "today" ? primary : colors.textSecondary }}
              >
                Today
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode("week")}
              className="flex-1 py-4 rounded-xl"
              style={{
                backgroundColor: viewMode === "week" ? colors.cardBackground : "transparent",
                minHeight: 48,
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: viewMode === "week" }}
            >
              <Text
                className={`${textClasses.subtitle} text-center font-semibold`}
                style={{ color: viewMode === "week" ? primary : colors.textSecondary }}
              >
                Week
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Limit Indicator for Essentials users - Part D: Only show when limit is exactly reached */}
        {!isPremiumUnlocked && activeTaskCount === ESSENTIALS_LIMITS.maxTasks && (
          <View
            className="mx-8 mt-4 px-4 py-3 rounded-xl flex-row items-center justify-between"
            style={{ backgroundColor: colors.warningBackground }}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons
                name="alert-circle"
                size={20}
                color={colors.warning}
              />
              <Text
                className={`${textClasses.small} ml-2 flex-1`}
                style={{ color: colors.onWarning }}
              >
                Limit reached ({ESSENTIALS_LIMITS.maxTasks}/{ESSENTIALS_LIMITS.maxTasks})
              </Text>
            </View>
            <Pressable
              onPress={() => checkItemLimit("tasks", ESSENTIALS_LIMITS.maxTasks)}
              className="px-3 py-2 rounded-lg ml-2"
              style={{ backgroundColor: primary, minHeight: 36 }}
            >
              <Text className="text-white text-sm font-semibold">Upgrade</Text>
            </Pressable>
          </View>
        )}

        {/* Tasks List with Pull-to-Refresh */}
        <RefreshableScrollView onRefresh={handleRefresh} className="flex-1 px-8 py-6">
          {/* Search Input - only show if there are tasks */}
          {todaysTasks.length > 0 && viewMode === "today" && (
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search tasks..."
            />
          )}

          {viewMode === "today" ? (
            <>
              {/* Search with no results */}
              {searchQuery.trim() && filteredTodaysTasks.length === 0 && (
                <EmptyState
                  icon="search"
                  title="No results found"
                  description={`No tasks match "${searchQuery}". Try different keywords.`}
                  actionLabel="Clear Search"
                  onAction={() => setSearchQuery("")}
                />
              )}

              {/* Active Tasks */}
              {activeTasks.length > 0 && (
                <View className="mb-8">
                  <Text className={`${textClasses.title} mb-4`} style={{ color: colors.textPrimary }}>
                    To Do
                  </Text>
                  {activeTasks.map(renderTaskItem)}
                </View>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <View className="mb-8">
                  <Text className={`${textClasses.title} mb-4`} style={{ color: colors.textPrimary }}>
                    Completed
                  </Text>
                  {completedTasks.map(renderTaskItem)}
                </View>
              )}

              {/* Empty State - only when no search and no tasks */}
              {!searchQuery.trim() && activeTasks.length === 0 && completedTasks.length === 0 && (
                <>
                  <EmptyState
                    icon="checkbox-outline"
                    title="No tasks yet"
                    description="Tap the 'Add a Task' button above to get started. Tasks help you stay on track with appointments, errands, and more."
                  />
                  {/* Dismissible sync tip */}
                  <View className="px-4 -mt-2">
                    <DismissableInfoBox
                      id="tasks_sync_tip"
                      icon="bulb"
                      iconColor="#CA8A04"
                      lightBgColor="#FEF9C3"
                      lightBorderColor="#FDE68A"
                      message="Tip: You can sync tasks from Apple Calendar or Apple Reminders in Settings > Connected Apps"
                      permanent={true}
                    />
                  </View>
                  {/* Part D: Hint when Today shows none but 15 active tasks exist elsewhere */}
                  {activeTaskCount === ESSENTIALS_LIMITS.maxTasks && (
                    <View
                      className="mt-4 px-4 py-3 rounded-xl"
                      style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}
                    >
                      <Text className={`${textClasses.small} text-center`} style={{ color: colors.textSecondary }}>
                        {ESSENTIALS_LIMITS.maxTasks} active tasks exist across other dates. Switch to Week or All to view them.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </>
          ) : (
            // Week View - Visual overview with day selection
            <WeekOverviewView
              tasks={tasks}
              onDayPress={() => {
                // Optional: Could navigate or filter
              }}
              onTaskPress={(task) => handleEdit(task)}
            />
          )}

          {/* Privacy Footer */}
          <PrivacyFooter />
        </RefreshableScrollView>
      </View>

      {/* Add/Edit Modal - conditionally mounted to avoid iOS responder chain issues */}
      {showAddModal && (
        <TaskFormModal
          visible={showAddModal}
          editingTask={editingTask}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveTask}
          textClasses={textClasses}
          colors={colors}
          primary={primary}
          primaryLight={primaryLight}
        />
      )}

      {/* Swipe Tooltip - conditionally mounted to avoid iOS responder chain issues */}
      {showSwipeTooltip && (
        <UnifiedTip
          visible={showSwipeTooltip}
          onDismiss={handleDismissSwipeTooltip}
          tipId="swipe-tasks"
          title="Swipe to Edit or Delete"
          description="Swipe any task left to reveal edit and delete options."
          icon="hand-left-outline"
          iconColor="#2F80ED"
          animationType="swipe"
          demoContent={
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-full items-center justify-center mr-3" style={{ backgroundColor: primary + "20" }}>
                  <Ionicons name="checkbox" size={24} color={primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-800">Example Task</Text>
                  <Text className="text-sm text-gray-600">Swipe left to see options</Text>
                </View>
              </View>
              <Ionicons name="chevron-back" size={24} color="#999999" />
            </View>
          }
          instructions={[
            {
              icon: "pencil",
              iconBgColor: "#2F80ED",
              title: "Swipe left to edit",
              description: "Swipe any item left to reveal the edit button",
            },
            {
              icon: "trash",
              iconBgColor: "#CC3A3A",
              title: "Swipe left to delete",
              description: "The delete button appears next to edit",
            },
          ]}
        />
      )}

      {/* First-time user tip */}
      <InlineTip tipId={TIP_IDS.TASKS_FIRST_USE} />

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
