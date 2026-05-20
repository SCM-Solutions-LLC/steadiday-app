import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTaskStore } from "../state/stores/taskStore";
import { useUIStore } from "../state/stores/uiStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useTheme } from "../utils/useTheme";
import { getTextSizeClasses } from "../utils/textSizes";
import { ScreenErrorBoundary } from "../components/ui";
import AddTaskModal from "../components/AddTaskModal";
import {
  TASK_TEMPLATE_CATEGORIES,
  TaskTemplate,
  TaskTemplateCategory,
  templateToTaskData,
} from "../utils/taskTemplates";
import { Task } from "../types/app";

export default function TaskTemplatesScreen() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight, onPrimary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const textClasses = getTextSizeClasses(textSize);

  // Task store
  const addTask = useTaskStore((s) => s.addTask);

  // UI store for enabled templates
  const enabledTemplateIds = useUIStore((s) => s.enabledTemplateIds || []);
  const toggleTemplateEnabled = useUIStore((s) => s.toggleTemplateEnabled);

  // Local state
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Add Task Modal state - for customization before adding
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [prefilledTask, setPrefilledTask] = useState<Partial<Task> | null>(null);

  const toggleCategory = useCallback((categoryId: string) => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }, [hapticEnabled]);

  // When template is tapped - open modal with pre-filled data for customization
  const handleTemplatePress = useCallback((template: TaskTemplate) => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Convert template to task data for pre-filling the modal
    const taskData = templateToTaskData(template);

    const prefilled: Partial<Task> = {
      title: taskData.title,
      category: taskData.category,
      frequency: taskData.frequency,
      date: taskData.date,
      time: taskData.time,
      reminderEnabled: taskData.reminderEnabled,
      reminderMinutes: taskData.reminderMinutes,
      notes: taskData.notes,
      sourceSystem: "manual",
      isImported: false,
      isReadOnly: false,
      syncStatus: "unlinked",
    };

    setSelectedTemplate(template);
    setPrefilledTask(prefilled);
    setShowAddTaskModal(true);
  }, [hapticEnabled]);

  // Handle saving the task from the modal
  const handleSaveTask = useCallback(async (taskData: Partial<Task>) => {
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title || "Untitled Task",
      category: taskData.category || "personal",
      frequency: taskData.frequency || "once",
      date: taskData.date || new Date().toISOString().split("T")[0],
      time: taskData.time,
      reminderEnabled: taskData.reminderEnabled ?? true,
      reminderMinutes: taskData.reminderMinutes ?? 15,
      notes: taskData.notes,
      completed: false,
      sourceSystem: "manual",
      isImported: false,
      isReadOnly: false,
      syncStatus: "unlinked",
      // Copy any other fields from taskData
      ...taskData,
    } as Task;

    await addTask(newTask);

    // Mark template as used if we have one
    if (selectedTemplate) {
      toggleTemplateEnabled(selectedTemplate.id);
    }

    setShowAddTaskModal(false);
    setSelectedTemplate(null);
    setPrefilledTask(null);
  }, [hapticEnabled, addTask, selectedTemplate, toggleTemplateEnabled]);

  const isTemplateEnabled = useCallback((templateId: string) => {
    return enabledTemplateIds.includes(templateId);
  }, [enabledTemplateIds]);

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily": return "Daily";
      case "weekly": return "Weekly";
      case "monthly": return "Monthly";
      case "yearly": return "Yearly";
      default: return frequency;
    }
  };

  // Template item - flat list style (simpler than category headers)
  const renderTemplate = (template: TaskTemplate, isLast: boolean) => {
    const enabled = isTemplateEnabled(template.id);

    return (
      <Pressable
        key={template.id}
        onPress={() => !enabled && handleTemplatePress(template)}
        disabled={enabled}
        className="flex-row items-center py-4 px-4"
        style={{
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.divider,
          opacity: enabled ? 0.6 : 1,
        }}
        accessibilityRole="button"
        accessibilityLabel={`${enabled ? "Already added: " : "Tap to add "} ${template.title}`}
        accessibilityState={{ disabled: enabled }}
      >
        {/* Small icon */}
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: enabled ? colors.border : primaryLight }}
        >
          <Ionicons
            name={template.icon as any}
            size={20}
            color={enabled ? colors.textSecondary : primary}
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text
            className={`${textClasses.body} font-medium`}
            style={{ color: enabled ? colors.textSecondary : colors.textPrimary }}
          >
            {template.title}
          </Text>
          <Text
            className={`${textClasses.small}`}
            style={{ color: colors.textTertiary }}
            numberOfLines={1}
          >
            {getFrequencyLabel(template.frequency)} • {template.description}
          </Text>
        </View>

        {/* Right side - Status */}
        {enabled ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        ) : (
          <View className="flex-row items-center">
            <Text
              className={`${textClasses.small} mr-2`}
              style={{ color: primary }}
            >
              Add
            </Text>
            <Ionicons name="add-circle-outline" size={22} color={primary} />
          </View>
        )}
      </Pressable>
    );
  };

  // Category header - distinctly styled (filled background when expanded)
  const renderCategory = (category: TaskTemplateCategory) => {
    const isExpanded = expandedCategories.includes(category.id);
    const enabledCount = category.templates.filter((t) => isTemplateEnabled(t.id)).length;
    const totalCount = category.templates.length;
    const progressPercent = (enabledCount / totalCount) * 100;

    return (
      <View key={category.id} className="mb-4">
        {/* Category Header - distinct from templates */}
        <Pressable
          onPress={() => toggleCategory(category.id)}
          className="flex-row items-center px-4 py-4 rounded-2xl"
          style={{
            backgroundColor: isExpanded ? primary : colors.cardBackground,
            borderWidth: isExpanded ? 0 : 1,
            borderColor: colors.border,
            minHeight: 72,
          }}
          accessibilityRole="button"
          accessibilityLabel={`${category.name}, ${enabledCount} of ${totalCount} added`}
          accessibilityState={{ expanded: isExpanded }}
        >
          {/* Large icon */}
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
            style={{
              backgroundColor: isExpanded ? "rgba(255,255,255,0.2)" : primaryLight
            }}
          >
            <Ionicons
              name={category.icon as any}
              size={28}
              color={isExpanded ? "#FFFFFF" : primary}
            />
          </View>

          <View className="flex-1">
            <Text
              className={`${textClasses.body} font-bold mb-1`}
              style={{ color: isExpanded ? "#FFFFFF" : colors.textPrimary }}
            >
              {category.name}
            </Text>

            {/* Progress bar */}
            <View
              className="h-2 rounded-full overflow-hidden"
              style={{
                backgroundColor: isExpanded ? "rgba(255,255,255,0.3)" : colors.border,
                maxWidth: 120,
              }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: isExpanded ? "#FFFFFF" : primary,
                }}
              />
            </View>

            <Text
              className={`${textClasses.small} mt-1`}
              style={{ color: isExpanded ? "rgba(255,255,255,0.8)" : colors.textSecondary }}
            >
              {enabledCount}/{totalCount} added
            </Text>
          </View>

          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={isExpanded ? "#FFFFFF" : colors.textSecondary}
          />
        </Pressable>

        {/* Templates list - inside a bordered container */}
        {isExpanded && (
          <View
            className="mt-2 rounded-xl overflow-hidden border"
            style={{
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            }}
          >
            {category.templates.map((template, index) =>
              renderTemplate(template, index === category.templates.length - 1)
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenErrorBoundary screenName="TaskTemplates">
      <Screen
        variant="static"
        edges={["top"]}
      >
        {/* Header */}
        <View
          className="px-6 py-4 border-b flex-row items-center"
          style={{
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.divider,
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-12 h-12 items-center justify-center rounded-full mr-3"
            style={{ backgroundColor: colors.background }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text
            className={`${textClasses.title} font-semibold flex-1`}
            style={{ color: colors.textPrimary }}
          >
            Task Templates
          </Text>
        </View>

        <ScrollView className="flex-1 px-5 py-5" showsVerticalScrollIndicator={true}>
          {/* Intro Card */}
          <View
            className="p-4 rounded-2xl mb-5 border"
            style={{ backgroundColor: primaryLight, borderColor: primary + "40" }}
          >
            <View className="flex-row items-start">
              <Ionicons
                name="bulb"
                size={22}
                color={primary}
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <View className="flex-1">
                <Text
                  className={`${textClasses.body} font-semibold mb-1`}
                  style={{ color: colors.textPrimary }}
                >
                  Customize Before Adding
                </Text>
                <Text
                  className={`${textClasses.small} leading-relaxed`}
                  style={{ color: colors.textSecondary }}
                >
                  Tap any template to customize the date, time, location, and reminders before adding it to your tasks.
                </Text>
              </View>
            </View>
          </View>

          {/* Categories */}
          {TASK_TEMPLATE_CATEGORIES.map(renderCategory)}

          {/* Bottom spacing */}
          <View className="h-6" />
        </ScrollView>

        {/* Add Task Modal - for customization */}
        <AddTaskModal
          visible={showAddTaskModal}
          onClose={() => {
            setShowAddTaskModal(false);
            setSelectedTemplate(null);
            setPrefilledTask(null);
          }}
          onSave={handleSaveTask}
          editingTask={prefilledTask as Task | null}
        />
      </Screen>
    </ScreenErrorBoundary>
  );
}
