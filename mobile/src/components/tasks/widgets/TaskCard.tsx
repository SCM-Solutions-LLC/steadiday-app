import React, { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatTime } from "../../../utils/time";
import SwipeableRow from "../../SwipeableRow";
import type { TaskCardProps } from "../types";
import {
  getCategoryIcon,
  getCategoryColor,
  getFrequencyLabel,
  getAppNameFromSyncSource,
  getSourceSystemDisplayName,
  getSourceSystemIcon,
  getSourceSystemColor,
  getRepeatsBadgeColors,
  isTaskRepeating,
  formatTaskDateSubtitle,
  formatReminderDateSubtitle,
} from "../types";
import { useTheme } from "../../../utils/useTheme";

function TaskCardComponent({
  task,
  textClasses,
  colors,
  primary,
  primaryLight,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const categoryStyle = getCategoryColor(task.category, primary, primaryLight);
  const { colors: themeColors } = useTheme();

  // Determine source display - prefer new sourceSystem field, fall back to legacy syncSource
  const isImported = task.isImported && task.sourceSystem !== "manual";
  const sourceDisplayName = task.sourceSystem && task.sourceSystem !== "manual"
    ? getSourceSystemDisplayName(task.sourceSystem)
    : task.syncSource
      ? getAppNameFromSyncSource(task.syncSource)
      : null;
  const sourceIcon = task.sourceSystem && task.sourceSystem !== "manual"
    ? getSourceSystemIcon(task.sourceSystem)
    : "cloud";
  const sourceColor = task.sourceSystem && task.sourceSystem !== "manual"
    ? getSourceSystemColor(task.sourceSystem)
    : { bg: primary, text: "#FFFFFF" };

  // Check if task repeats (for Repeats badge)
  const repeats = isTaskRepeating(task);
  const repeatsBadgeColors = getRepeatsBadgeColors(themeColors);

  // Build "Repeats [frequency]" label so users see the actual cadence (e.g. "Repeats daily")
  const repeatsBadgeLabel = (() => {
    if (task.frequency && task.frequency !== "once") {
      return `Repeats ${getFrequencyLabel(task.frequency).toLowerCase()}`;
    }
    return "Repeats";
  })();

  // Format date subtitle based on source type
  const isReminder = task.sourceSystem === "apple_reminders" || task.syncSource === "reminders";
  const dateSubtitle = isReminder && repeats
    ? formatReminderDateSubtitle(task)
    : formatTaskDateSubtitle(task);

  return (
    <SwipeableRow
      key={task.id}
      onEdit={() => onEdit(task)}
      onDelete={() => onDelete(task.id)}
    >
      <View
        className="rounded-3xl p-3 flex-row items-start"
        style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}
      >
        {/* Checkbox - 48pt touch target */}
        <Pressable
          onPress={() => onToggleComplete(task.id)}
          className="w-12 h-12 rounded-xl border-2 items-center justify-center mr-3"
          style={{
            backgroundColor: task.completed ? "#6DB193" : "transparent",
            borderColor: task.completed ? "#6DB193" : colors.divider,
            minWidth: 48,
            minHeight: 48,
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.completed }}
          accessibilityLabel={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed && <Ionicons name="checkmark" size={24} color="white" />}
        </Pressable>

        {/* Task Content */}
        <View className="flex-1 min-w-0">
          <View className="flex-row items-start mb-1">
            {/* Category Icon */}
            <View
              className={`rounded-full p-1.5 mr-2 ${task.category !== "personal" ? categoryStyle.bg : ""}`}
              style={task.category === "personal" ? { backgroundColor: primaryLight + "20" } : undefined}
            >
              <Ionicons
                name={getCategoryIcon(task.category)}
                size={18}
                color={categoryStyle.iconColor}
              />
            </View>

            {/* Title and Badges */}
            <View className="flex-1 min-w-0">
              <View className="flex-row items-start flex-wrap">
                <Text
                  className={`${textClasses.button} leading-tight ${
                    task.completed ? "line-through" : ""
                  }`}
                  style={{
                    color: task.completed ? colors.textSecondary : colors.textPrimary,
                    flexShrink: 1,
                    marginRight: 6,
                  }}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>

                {/* Source badge - shows for imported tasks */}
                {isImported && sourceDisplayName && (
                  <View
                    className="px-2 py-0.5 rounded-lg flex-row items-center mr-1.5 mb-1"
                    style={{ backgroundColor: sourceColor.bg }}
                    accessibilityRole="text"
                    accessibilityLabel={`Imported from ${sourceDisplayName}`}
                  >
                    <Ionicons name={sourceIcon} size={12} color={sourceColor.text} accessibilityElementsHidden />
                    <Text className="text-xs ml-1 font-semibold" style={{ color: sourceColor.text }}>
                      {sourceDisplayName}
                    </Text>
                  </View>
                )}

                {/* Repeats badge - informational only, not tappable */}
                {repeats && (
                  <View
                    className="px-2 py-0.5 rounded-lg flex-row items-center mr-1.5 mb-1"
                    style={{
                      backgroundColor: repeatsBadgeColors.bg,
                      borderWidth: 1,
                      borderColor: repeatsBadgeColors.border,
                    }}
                    accessibilityRole="text"
                    accessibilityLabel={repeatsBadgeLabel}
                  >
                    <Ionicons name="repeat" size={11} color={repeatsBadgeColors.text} accessibilityElementsHidden />
                    <Text
                      className="text-xs ml-1 font-medium"
                      style={{ color: repeatsBadgeColors.text }}
                    >
                      {repeatsBadgeLabel}
                    </Text>
                  </View>
                )}

                {/* All-day badge */}
                {task.isAllDay && (
                  <View
                    className="px-2 py-0.5 rounded-lg mr-1.5 mb-1"
                    style={{
                      backgroundColor: repeatsBadgeColors.bg,
                      borderWidth: 1,
                      borderColor: repeatsBadgeColors.border,
                    }}
                    accessibilityRole="text"
                    accessibilityLabel="All-day event"
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: repeatsBadgeColors.text }}
                    >
                      All-day
                    </Text>
                  </View>
                )}

                {/* Legacy sync badge - for backward compatibility */}
                {!isImported && task.syncSource && (
                  <View
                    className="px-2 py-0.5 rounded-lg flex-row items-center mr-1.5 mb-1"
                    style={{ backgroundColor: primaryLight + "20" }}
                    accessibilityRole="text"
                    accessibilityLabel={`Synced from ${getAppNameFromSyncSource(task.syncSource)}`}
                  >
                    <Ionicons name="cloud" size={12} color={primary} accessibilityElementsHidden />
                    <Text className="text-xs ml-1 font-semibold" style={{ color: primary }}>
                      {getAppNameFromSyncSource(task.syncSource)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Task Details */}
          <View className="ml-8">
            {/* Date line with start and end time */}
            {dateSubtitle && (
              <Text className={`${textClasses.small} mb-0.5`} style={{ color: colors.textSecondary }}>
                {dateSubtitle}
              </Text>
            )}
            {/* Fallback: show just time if no subtitle but time exists */}
            {!dateSubtitle && task.time && (
              <Text className={`${textClasses.small} mb-0.5`} style={{ color: colors.textSecondary }}>
                {formatTime(task.time)}
              </Text>
            )}
            {/* Container name (calendar/list name) for imported tasks */}
            {isImported && task.sourceContainerName && (
              <Text
                className="text-xs mb-0.5"
                style={{ color: colors.textSecondary }}
                numberOfLines={1}
              >
                {task.sourceContainerName}
              </Text>
            )}
            {/* Show frequency only for non-repeating or manually created tasks */}
            {!repeats && (
              <Text
                className={`${textClasses.small} font-semibold mb-1`}
                style={{ color: task.completed ? colors.textSecondary : primary }}
              >
                {getFrequencyLabel(task.frequency)}
              </Text>
            )}
            {task.notes && (
              <Text
                className="text-xs leading-tight"
                style={{ color: colors.textSecondary }}
                numberOfLines={2}
              >
                {task.notes}
              </Text>
            )}
            {/* Read-only indicator for imported tasks */}
            {task.isReadOnly && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="lock-closed" size={10} color={colors.textSecondary} />
                <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
                  Imported
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </SwipeableRow>
  );
}

// Memoize to prevent unnecessary re-renders
export const TaskCard = memo(TaskCardComponent);
