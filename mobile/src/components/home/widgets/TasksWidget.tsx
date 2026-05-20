import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { isSameDay } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import { formatTime, getTaskDate } from "../../../utils/time";
import type { Task, TaskInstance, TaskCategory } from "../../../types/app";
import type { TasksWidgetProps, TaskInstancesWidgetProps } from "../types";

/**
 * Check if a task should appear on a given date
 * Handles both one-time and recurring tasks
 */
function isTaskForDate(task: Task, date: Date): boolean {
  const taskDate = getTaskDate(task);
  const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
  const checkDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Check if task date matches exactly
  if (isSameDay(taskDate, date)) {
    return true;
  }

  // Only check recurring tasks that started on or before this date
  if (taskDateOnly > checkDateOnly) {
    return false;
  }

  // Check if task has ended (for repeatEnding)
  if (task.repeatEnding === "on-date" && task.repeatEndDate) {
    const endDate = new Date(task.repeatEndDate);
    if (checkDateOnly > endDate) {
      return false;
    }
  }

  // Check recurring patterns
  const frequency = task.frequency || "once";

  switch (frequency) {
    case "daily":
    case "twice-daily":
    case "three-times-daily":
      return true;
    case "every-other-day": {
      const daysDiff = Math.floor(
        (checkDateOnly.getTime() - taskDateOnly.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff % 2 === 0;
    }
    case "weekly":
      return taskDate.getDay() === date.getDay();
    case "monthly":
      return taskDate.getDate() === date.getDate();
    case "yearly":
      return taskDate.getMonth() === date.getMonth() &&
              taskDate.getDate() === date.getDate();
    case "once":
    default:
      return false;
  }
}

/**
 * Get category icon for tasks
 */
function getCategoryIcon(category?: TaskCategory | string): string {
  switch (category) {
    case "medical":
      return "medical";
    case "errand":
      return "cart";
    case "personal":
      return "person";
    default:
      return "checkbox";
  }
}

/**
 * TasksWidget - Legacy version using Task[] (for backwards compatibility)
 */
export function TasksWidget({
  tasks,
  textClasses,
  colors,
  primary,
}: TasksWidgetProps) {
  const navigation = useNavigation();

  // Filter today's tasks (including recurring)
  const today = new Date();
  const todaysTasks = tasks
    .filter((task) => {
      if (task.completed) return false;
      return isTaskForDate(task, today);
    })
    .sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    })
    .slice(0, 4);

  return (
    <Pressable
      onPress={() => (navigation as any).navigate("Tasks")}
      accessibilityRole="button"
      accessibilityLabel="View all tasks"
      accessibilityHint="Double tap to open your tasks"
    >
      <View
        className="rounded-3xl p-4 mb-6 border"
        style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className={`${textClasses.subtitle}`} style={{ color: colors.textPrimary }}>
            Today&apos;s Tasks
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
        {todaysTasks.length === 0 ? (
          <Text className={`${textClasses.body}`} style={{ color: colors.textSecondary }}>
            No tasks for today
          </Text>
        ) : (
          todaysTasks.map((task) => (
            <View
              key={task.id}
              className="flex-row items-center py-3 border-b last:border-b-0"
              style={{ borderBottomColor: colors.divider }}
            >
              <Ionicons name={getCategoryIcon(task.category) as any} size={24} color={primary} />
              <View className="ml-3 flex-1">
                <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                  {task.title}
                </Text>
                {task.time && (
                  <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textSecondary }}>
                    {formatTime(task.time)}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </Pressable>
  );
}

/**
 * TaskInstancesWidget - New version using TaskInstance[] for daily planner
 * Shows today's task instances with per-instance completion
 */
export function TaskInstancesWidget({
  instances,
  textClasses,
  colors,
  primary,
}: TaskInstancesWidgetProps) {
  const navigation = useNavigation();

  // Get active (uncompleted) instances, sorted by time, limit to 4
  const activeInstances = instances
    .filter((instance) => !instance.isCompleted)
    .sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    })
    .slice(0, 4);

  return (
    <Pressable
      onPress={() => (navigation as any).navigate("Tasks")}
      accessibilityRole="button"
      accessibilityLabel="View all tasks"
      accessibilityHint="Double tap to open your tasks"
    >
      <View
        className="rounded-3xl p-4 mb-6 border"
        style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className={`${textClasses.subtitle}`} style={{ color: colors.textPrimary }}>
            Today&apos;s Tasks
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
        {activeInstances.length === 0 ? (
          <Text className={`${textClasses.body}`} style={{ color: colors.textSecondary }}>
            No tasks for today
          </Text>
        ) : (
          activeInstances.map((instance) => (
            <View
              key={instance.instanceId}
              className="flex-row items-center py-3 border-b last:border-b-0"
              style={{ borderBottomColor: colors.divider }}
            >
              <Ionicons name={getCategoryIcon(instance.category) as any} size={24} color={primary} />
              <View className="ml-3 flex-1">
                <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                  {instance.title}
                </Text>
                {instance.time && (
                  <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textSecondary }}>
                    {formatTime(instance.time)}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </Pressable>
  );
}
