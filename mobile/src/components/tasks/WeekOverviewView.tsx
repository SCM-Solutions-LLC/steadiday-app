import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, isSameDay, isToday, startOfWeek, addDays } from "date-fns";
import { Task } from "../../types/app";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useTheme } from "../../utils/useTheme";
import { formatTime, formatDateKey, getTaskDateKey } from "../../utils/time";
import * as Haptics from "expo-haptics";

interface Props {
  tasks: Task[];
  onDayPress: (date: Date) => void;
  onTaskPress: (task: Task) => void;
}

/**
 * Get the effective date for a task for date comparison
 * Uses the centralized getTaskDateKey helper which:
 * - Uses dueDateLocal for all-day events (prevents timezone shifting)
 * - Uses formatDateKey for timed events (timezone-aware)
 *
 * PART 4: Uses the centralized formatDateKey helper
 */
function getTaskDateForComparison(task: Task): Date {
  // Get the date key using the centralized helper
  const dateKey = getTaskDateKey(task);

  // Parse the YYYY-MM-DD string as local date
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * WeekOverviewView - Visual week overview for seniors
 *
 * Features:
 * - 7-day horizontal view with large day labels
 * - Color-coded dots showing task count per day
 * - Today clearly highlighted
 * - Tapping a day shows tasks for that day below
 * - Week navigation with left/right chevrons
 * - Senior-friendly: large touch targets, clear visual indicators
 */
export default function WeekOverviewView({
  tasks,
  onDayPress,
  onTaskPress,
}: Props) {
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled =
    useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const textClasses = getTextSizeClasses(textSize);
  const { colors, primary, primaryLight } = useTheme();

  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [weekOffset, setWeekOffset] = React.useState<number>(0);

  // Get week dates starting from Sunday, with offset for navigation
  const today = new Date();
  const baseWeekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekStart = addDays(baseWeekStart, weekOffset * 7);
  const weekEnd = addDays(weekStart, 6);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get tasks for a specific date (including recurring tasks)
  // PART 4: Uses timezone-aware formatDateKey for date comparison
  const getTasksForDate = (date: Date): Task[] => {
    // Get the comparison date's key in device timezone
    const checkDateKey = formatDateKey(date);

    return tasks.filter((task) => {
      // Get the task's date key using the centralized helper
      const taskDateKey = getTaskDateKey(task);

      // Simple string comparison for exact date match
      if (taskDateKey === checkDateKey) {
        return true;
      }

      // For recurring tasks, we need Date objects
      const taskDate = getTaskDateForComparison(task);
      const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
      const checkDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

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
          // Daily tasks show every day after start date
          return true;

        case "every-other-day": {
          // Calculate days since task start
          const daysDiff = Math.floor(
            (checkDateOnly.getTime() - taskDateOnly.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysDiff % 2 === 0;
        }

        case "weekly": {
          // Show on same day of week
          return taskDate.getDay() === date.getDay();
        }

        case "monthly": {
          // Show on same day of month
          return taskDate.getDate() === date.getDate();
        }

        case "yearly": {
          // Show on same month and day
          return taskDate.getMonth() === date.getMonth() &&
                  taskDate.getDate() === date.getDate();
        }

        case "once":
        default:
          // One-time tasks only on exact date
          return false;
      }
    });
  };

  // Get tasks for selected date
  const selectedDateTasks = getTasksForDate(selectedDate);
  const activeTasks = selectedDateTasks.filter((t) => !t.completed);
  const completedTasks = selectedDateTasks.filter((t) => t.completed);

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleDayPress = (date: Date) => {
    triggerHaptic();
    setSelectedDate(date);
    onDayPress(date);
  };

  const handlePreviousWeek = () => {
    triggerHaptic();
    setWeekOffset(weekOffset - 1);
    // Select first day of the new week
    const newWeekStart = addDays(baseWeekStart, (weekOffset - 1) * 7);
    setSelectedDate(newWeekStart);
  };

  const handleNextWeek = () => {
    triggerHaptic();
    setWeekOffset(weekOffset + 1);
    // Select first day of the new week
    const newWeekStart = addDays(baseWeekStart, (weekOffset + 1) * 7);
    setSelectedDate(newWeekStart);
  };

  const handleGoToToday = () => {
    triggerHaptic();
    setWeekOffset(0);
    setSelectedDate(today);
  };

  // Format week range label (e.g., "Jan 4 – Jan 10")
  const weekRangeLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`;
  const isCurrentWeek = weekOffset === 0;

  // Render dots for task count (max 4 visible)
  const renderTaskDots = (taskCount: number, completed: number) => {
    if (taskCount === 0) return null;
    const maxDots = 4;
    const dotsToShow = Math.min(taskCount, maxDots);
    const activeCount = taskCount - completed;

    return (
      <View className="flex-row justify-center mt-1" style={{ gap: 3 }}>
        {Array.from({ length: dotsToShow }, (_, i) => (
          <View
            key={i}
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor: i < activeCount ? primary : "#10B981",
            }}
          />
        ))}
        {taskCount > maxDots && (
          <Text
            style={{
              fontSize: 10,
              color: colors.textSecondary,
              marginLeft: 2,
            }}
          >
            +{taskCount - maxDots}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1">
      {/* Week Overview Header */}
      <View
        className="mb-4 p-4 rounded-2xl"
        style={{
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* Week Navigation Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={handlePreviousWeek}
            className="p-2 rounded-xl"
            style={{ backgroundColor: colors.background }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Previous week"
          >
            <Ionicons name="chevron-back" size={24} color={primary} />
          </Pressable>

          <View className="items-center flex-1">
            <Text
              className={`${textClasses.subtitle} text-center font-semibold`}
              style={{ color: colors.textPrimary }}
            >
              {weekRangeLabel}
            </Text>
            <Text
              className={`${textClasses.small} text-center mt-1`}
              style={{ color: colors.textSecondary }}
            >
              {format(weekStart, "yyyy")}
            </Text>
          </View>

          <Pressable
            onPress={handleNextWeek}
            className="p-2 rounded-xl"
            style={{ backgroundColor: colors.background }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Next week"
          >
            <Ionicons name="chevron-forward" size={24} color={primary} />
          </Pressable>
        </View>

        {/* "Today" button when not on current week */}
        {!isCurrentWeek && (
          <Pressable
            onPress={handleGoToToday}
            className="self-center px-4 py-2 rounded-full mb-4"
            style={{ backgroundColor: primary }}
            accessibilityRole="button"
            accessibilityLabel="Go to today"
          >
            <Text className="text-sm font-semibold text-white">Go to Today</Text>
          </Pressable>
        )}

        {/* 7-Day Horizontal View */}
        <View className="flex-row justify-between">
          {weekDates.map((date) => {
            const dayTasks = getTasksForDate(date);
            const completedCount = dayTasks.filter((t) => t.completed).length;
            const isTodayDate = isToday(date);
            const isSelected = isSameDay(date, selectedDate);

            return (
              <Pressable
                key={date.toISOString()}
                onPress={() => handleDayPress(date)}
                className="items-center py-3 px-2 rounded-xl"
                style={{
                  minWidth: 48,
                  minHeight: 72,
                  backgroundColor: isSelected
                    ? primaryLight
                    : isTodayDate
                      ? `${primary}10`
                      : "transparent",
                  borderWidth: isTodayDate ? 2 : 0,
                  borderColor: isTodayDate ? primary : "transparent",
                }}
                accessibilityRole="button"
                accessibilityLabel={`${format(date, "EEEE, MMMM d")}. ${dayTasks.length} tasks.`}
                accessibilityState={{ selected: isSelected }}
              >
                {/* Day abbreviation */}
                <Text
                  className="font-semibold mb-1"
                  style={{
                    fontSize: 12,
                    color: isSelected ? primary : colors.textSecondary,
                  }}
                >
                  {format(date, "EEE")}
                </Text>

                {/* Day number */}
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isTodayDate ? primary : "transparent",
                  }}
                >
                  <Text
                    className="font-bold"
                    style={{
                      fontSize: 16,
                      color: isTodayDate
                        ? "white"
                        : isSelected
                          ? primary
                          : colors.textPrimary,
                    }}
                  >
                    {format(date, "d")}
                  </Text>
                </View>

                {/* Task dots */}
                {renderTaskDots(dayTasks.length, completedCount)}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Selected Day Label */}
      <View className="flex-row items-center mb-4">
        <Ionicons name="calendar" size={20} color={primary} />
        <Text
          className={`${textClasses.subtitle} ml-2`}
          style={{ color: colors.textPrimary }}
        >
          {isToday(selectedDate)
            ? "Today"
            : format(selectedDate, "EEEE, MMMM d")}
        </Text>
        <Text
          className={`${textClasses.body} ml-auto`}
          style={{ color: colors.textSecondary }}
        >
          {selectedDateTasks.length === 0
            ? "No tasks"
            : `${selectedDateTasks.length} task${selectedDateTasks.length !== 1 ? "s" : ""}`}
        </Text>
      </View>

      {/* Tasks for Selected Day */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {selectedDateTasks.length === 0 ? (
          <View
            className="rounded-2xl p-6 items-center"
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons
              name="checkbox-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text
              className={`${textClasses.body} text-center mt-4`}
              style={{ color: colors.textSecondary }}
            >
              No tasks scheduled for this day
            </Text>
            <Text
              className={`${textClasses.small} text-center mt-2`}
              style={{ color: colors.textTertiary }}
            >
              {"Tap \"Add a Task\" to schedule something"}
            </Text>
          </View>
        ) : (
          <>
            {/* Active Tasks */}
            {activeTasks.length > 0 && (
              <View className="mb-6">
                <Text
                  className={`${textClasses.body} font-semibold mb-3`}
                  style={{ color: colors.textSecondary }}
                >
                  To Do ({activeTasks.length})
                </Text>
                {activeTasks
                  .sort((a, b) => {
                    if (!a.time) return 1;
                    if (!b.time) return -1;
                    return a.time.localeCompare(b.time);
                  })
                  .map((task) => (
                    <WeekTaskItem
                      key={task.id}
                      task={task}
                      onPress={() => onTaskPress(task)}
                      textClasses={textClasses}
                      colors={colors}
                      primary={primary}
                    />
                  ))}
              </View>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <View className="mb-6">
                <Text
                  className={`${textClasses.body} font-semibold mb-3`}
                  style={{ color: colors.textSecondary }}
                >
                  Completed ({completedTasks.length})
                </Text>
                {completedTasks.map((task) => (
                  <WeekTaskItem
                    key={task.id}
                    task={task}
                    onPress={() => onTaskPress(task)}
                    textClasses={textClasses}
                    colors={colors}
                    primary={primary}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Simplified task item for week view
interface WeekTaskItemProps {
  task: Task;
  onPress: () => void;
  textClasses: ReturnType<typeof getTextSizeClasses>;
  colors: ReturnType<typeof useTheme>["colors"];
  primary: string;
}

function WeekTaskItem({
  task,
  onPress,
  textClasses,
  colors,
  primary,
}: WeekTaskItemProps) {
  const categoryColors: Record<string, string> = {
    health: "#EF4444",
    appointment: "#3B82F6",
    errand: "#F59E0B",
    personal: "#8B5CF6",
    other: "#6B7280",
  };

  const categoryColor = categoryColors[task.category || "other"] || "#6B7280";

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center p-4 rounded-2xl mb-3"
      style={{
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: task.completed ? 0.6 : 1,
      }}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}${task.time ? ` at ${task.time}` : ""}${task.completed ? ", completed" : ""}`}
    >
      {/* Category indicator */}
      <View
        className="w-3 h-12 rounded-full mr-4"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Task info */}
      <View className="flex-1">
        <Text
          className={`${textClasses.body} font-semibold`}
          style={{
            color: colors.textPrimary,
            textDecorationLine: task.completed ? "line-through" : "none",
          }}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        {task.time && (
          <Text
            className={`${textClasses.small} mt-1`}
            style={{ color: colors.textSecondary }}
          >
            {formatTime(task.time)}
          </Text>
        )}
      </View>

      {/* Completion status */}
      <View
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{
          backgroundColor: task.completed ? "#10B981" : colors.background,
          borderWidth: task.completed ? 0 : 2,
          borderColor: colors.border,
        }}
      >
        {task.completed && (
          <Ionicons name="checkmark" size={18} color="white" />
        )}
      </View>
    </Pressable>
  );
}
