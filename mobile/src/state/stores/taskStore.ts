import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Task, Note, ParkingSpot } from "../../types/app";
import {
  scheduleTaskNotification,
  cancelNotificationsForTask,
} from "../../utils/notifications";
import {
  syncTaskToCalendar,
  updateTaskInCalendar,
  deleteCalendarEvent,
} from "../../utils/calendarSync";
import { syncTaskCompletionToExternal } from "../../utils/twoWaySync";
import { syncTaskDelete, syncTaskUpsert } from "../../services/storeSync";
import { secureWarn } from "../../utils/secureLogger";
import { formatDateKey, getTaskDateKey } from "../../utils/time";
import { useSettingsStore } from "./settingsStore";

// ============================================================================
// TASK STORE
// Manages tasks, notes, and parking with calendar sync and notifications
// ============================================================================

interface TaskState {
  // Hydration
  _hasHydrated: boolean;

  // Data
  tasks: Task[];
  notes: Note[];
  parkingSpot?: ParkingSpot;
}

interface TaskActions {
  // Tasks
  addTask: (task: Task, calendarSyncEnabled?: boolean, calendarId?: string) => Promise<void>;
  addTasksBatch: (tasks: Task[]) => void; // Atomic batch add for onboarding import
  updateTask: (id: string, updates: Partial<Task>, calendarSyncEnabled?: boolean, calendarId?: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;

  // Essentials limit enforcement
  enforceEssentialsLimit: (maxActive: number) => void; // Archive overflow imported tasks

  // Queries
  getTaskById: (id: string) => Task | undefined;
  getTasksForDate: (date: string) => Task[];
  getUpcomingTasks: (limit?: number) => Task[];
  getOverdueTasks: () => Task[];

  // Notes
  addNote: (note: Note) => void;
  updateNote: (id: string, content: string) => void;
  removeNote: (id: string) => void;

  // Parking
  saveParkingSpot: (spot: ParkingSpot) => void;
  clearParkingSpot: () => void;
}

type TaskStore = TaskState & TaskActions;

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      notes: [],
      parkingSpot: undefined,
      _hasHydrated: false,

      // Add task with notifications and calendar sync
      addTask: async (task, calendarSyncEnabled = false, calendarId) => {
        // Check if task with this ID already exists
        const existingTask = get().tasks.find((t) => t.id === task.id);
        if (existingTask) {
          secureWarn(`Task with ID ${task.id} already exists, skipping duplicate.`);
          return;
        }

        // For imported tasks, also check by external identity to prevent duplicates
        // from different ID formats (synced-cal-* vs synced-apple-calendar-*)
        if (task.sourceSystem && task.sourceContainerId && task.sourceItemId) {
          const existingByExternalKey = get().tasks.find(
            (t) =>
              t.sourceSystem === task.sourceSystem &&
              t.sourceContainerId === task.sourceContainerId &&
              t.sourceItemId === task.sourceItemId
          );
          if (existingByExternalKey) {
            secureWarn(`Task with external key ${task.sourceSystem}:${task.sourceContainerId}:${task.sourceItemId} already exists (id: ${existingByExternalKey.id}), skipping duplicate.`);
            return;
          }
        }

        // Schedule notification if reminder is enabled, respecting user's notification preference
        const notificationSource = useSettingsStore.getState().notificationSource || "steadiday";
        const notificationId = await scheduleTaskNotification(task, notificationSource as any);

        // Sync to calendar if enabled
        let calendarEventId: string | undefined;
        if (calendarSyncEnabled && calendarId) {
          const eventId = await syncTaskToCalendar(task, calendarId);
          if (eventId) {
            calendarEventId = eventId;
          }
        }

        const taskWithNotification = {
          ...task,
          notificationIds: notificationId.length > 0 ? notificationId : undefined,
          calendarEventId,
        };

        set((state) => ({
          tasks: [...state.tasks, taskWithNotification],
        }));

        syncTaskUpsert(taskWithNotification);
      },

      // Batch add tasks atomically (for onboarding import)
      // Does not trigger notifications or calendar sync since imported tasks
      // already exist in their source (Calendar/Reminders)
      addTasksBatch: (newTasks: Task[]) => {
        if (!newTasks.length) return;

        // Build a set of existing IDs and external keys for deduplication
        const existingTasks = get().tasks;
        const existingIds = new Set(existingTasks.map((t) => t.id));
        const existingExternalKeys = new Set<string>();

        existingTasks.forEach((t) => {
          if (t.sourceSystem && t.sourceContainerId && t.sourceItemId) {
            existingExternalKeys.add(`${t.sourceSystem}:${t.sourceContainerId}:${t.sourceItemId}`);
          }
        });

        // Helper to validate and fix task times
        const validateTaskTimes = (task: Task): Task => {
          // If task has both time and endTime, validate that endTime >= startTime
          if (task.time && task.endTime && task.endTime <= task.time) {
            // Auto-fix: set endTime to startTime + 1 hour
            const [hours, minutes] = task.time.split(":").map(Number);
            let newHours = hours + 1;
            let newMinutes = minutes;

            // If this pushes past midnight, cap at 23:59
            if (newHours >= 24) {
              newHours = 23;
              newMinutes = 59;
            }

            return {
              ...task,
              endTime: `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`,
            };
          }
          return task;
        };

        // Filter out duplicates and validate times
        const tasksToAdd = newTasks
          .map(validateTaskTimes) // Apply time validation
          .filter((task) => {
            // Check by ID
            if (existingIds.has(task.id)) {
              secureWarn(`Batch: Task with ID ${task.id} already exists, skipping.`);
              return false;
            }

            // Check by external key
            if (task.sourceSystem && task.sourceContainerId && task.sourceItemId) {
              const externalKey = `${task.sourceSystem}:${task.sourceContainerId}:${task.sourceItemId}`;
              if (existingExternalKeys.has(externalKey)) {
                secureWarn(`Batch: Task with external key ${externalKey} already exists, skipping.`);
                return false;
              }
              // Add to set to prevent duplicates within the batch
              existingExternalKeys.add(externalKey);
            }

            existingIds.add(task.id);
            return true;
          });

        if (tasksToAdd.length > 0) {
          set((state) => ({
            tasks: [...state.tasks, ...tasksToAdd],
          }));
          tasksToAdd.forEach(syncTaskUpsert);
        }
      },

      // Update task with notification rescheduling
      updateTask: async (id, updates, calendarSyncEnabled = false, calendarId) => {
        const existingTask = get().tasks.find((t) => t.id === id);
        if (!existingTask) return;

        // Cancel existing notifications
        await cancelNotificationsForTask(id, existingTask.notificationIds);

        // Create updated task object
        // Mark as locally edited if this is an imported task
        const updatedTask = {
          ...existingTask,
          ...updates,
          isLocallyEdited: existingTask.isImported ? true : existingTask.isLocallyEdited,
        };

        // Schedule new notification if reminder is enabled, respecting user's notification preference
        const notificationSource = useSettingsStore.getState().notificationSource || "steadiday";
        const notificationId = await scheduleTaskNotification(updatedTask, notificationSource as any);

        // Update calendar event if sync is enabled
        let calendarEventId = existingTask.calendarEventId;
        if (calendarSyncEnabled && calendarId) {
          if (existingTask.calendarEventId) {
            await updateTaskInCalendar(updatedTask, existingTask.calendarEventId);
          } else {
            const eventId = await syncTaskToCalendar(updatedTask, calendarId);
            if (eventId) {
              calendarEventId = eventId;
            }
          }
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...updates,
                  isLocallyEdited: existingTask.isImported ? true : t.isLocallyEdited,
                  notificationIds: notificationId.length > 0 ? notificationId : undefined,
                  calendarEventId,
                }
              : t
          ),
        }));

        const updated = get().tasks.find((t) => t.id === id);
        if (updated) syncTaskUpsert(updated);
      },

      // Remove task and clean up notifications/calendar
      removeTask: async (id) => {
        const task = get().tasks.find((t) => t.id === id);

        // Cancel notifications
        await cancelNotificationsForTask(id, task?.notificationIds);

        // Delete calendar event
        if (task?.calendarEventId) {
          await deleteCalendarEvent(task.calendarEventId);
        }

        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));

        syncTaskDelete(id);
      },

      // Toggle task completion and sync externally
      toggleTaskComplete: async (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? new Date().toISOString() : undefined,
                }
              : t
          ),
        }));

        // Sync completion status to external source if applicable
        const task = get().tasks.find((t) => t.id === id);
        if (task) syncTaskUpsert(task);
        if (task?.syncSource) {
          await syncTaskCompletionToExternal(task);
        }
      },

      // Enforce Essentials limit: archive overflow imported tasks
      // Called when Essentials user has more than maxActive active tasks
      // Prioritizes keeping manual tasks active, archives imported tasks first
      enforceEssentialsLimit: (maxActive: number) => {
        const tasks = get().tasks;
        const activeTasks = tasks.filter((t) => !t.completed && !t.archivedAt);

        if (activeTasks.length <= maxActive) {
          return; // No overflow, nothing to do
        }

        // Separate manual vs imported tasks
        const manualTasks = activeTasks.filter((t) => !t.isImported);
        const importedTasks = activeTasks.filter((t) => t.isImported);

        // Sort imported tasks: oldest date first (archive those first)
        const sortedImported = [...importedTasks].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB;
        });

        // Calculate how many imported tasks to archive
        const overflowCount = activeTasks.length - maxActive;
        const tasksToArchive = sortedImported.slice(0, overflowCount);

        if (tasksToArchive.length === 0) {
          return; // No imported tasks to archive
        }

        const archiveIds = new Set(tasksToArchive.map((t) => t.id));
        const archiveTimestamp = new Date().toISOString();

        set((state) => ({
          tasks: state.tasks.map((t) =>
            archiveIds.has(t.id)
              ? { ...t, archivedAt: archiveTimestamp }
              : t
          ),
        }));

        secureWarn(
          `Essentials limit enforced: archived ${tasksToArchive.length} imported tasks to stay within ${maxActive} active limit.`
        );
      },

      // Query: Get task by ID
      getTaskById: (id) => get().tasks.find((t) => t.id === id),

      // Query: Get tasks for a specific date (including recurring tasks)
      // PART 4: Uses centralized getTaskDateKey for timezone-aware comparison
      getTasksForDate: (date) => {
        // Parse input date and get its key in device timezone
        const targetDateKey = date.includes("T")
          ? formatDateKey(new Date(date))
          : date; // Already YYYY-MM-DD format

        // Parse the target date for recurring task calculations
        const [year, month, day] = targetDateKey.split("-").map(Number);
        const targetDate = new Date(year, month - 1, day);

        return get().tasks.filter((task) => {
          if (!task.date) return false;

          // Use centralized helper for timezone-aware comparison
          const taskDateKey = getTaskDateKey(task);

          // Exact date match
          if (taskDateKey === targetDateKey) {
            return true;
          }

          // Check recurring patterns for tasks that started before this date
          const frequency = task.frequency || "once";
          if (frequency === "once") {
            return false;
          }

          // Parse task date for recurring calculations
          const [taskYear, taskMonth, taskDay] = taskDateKey.split("-").map(Number);
          const taskDate = new Date(taskYear, taskMonth - 1, taskDay);

          // Only check recurring tasks that started on or before this date
          if (taskDate > targetDate) {
            return false;
          }

          // Check if task has ended (for repeatEnding)
          if (task.repeatEnding === "on-date" && task.repeatEndDate) {
            const endDate = new Date(task.repeatEndDate);
            if (targetDate > endDate) {
              return false;
            }
          }

          switch (frequency) {
            case "daily":
            case "twice-daily":
            case "three-times-daily":
              // Daily tasks show every day after start date
              return true;

            case "every-other-day": {
              // Calculate days since task start
              const daysDiff = Math.floor(
                (targetDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              return daysDiff % 2 === 0;
            }

            case "weekly": {
              // Show on same day of week
              return taskDate.getDay() === targetDate.getDay();
            }

            case "monthly": {
              // Show on same day of month
              return taskDate.getDate() === targetDate.getDate();
            }

            case "yearly": {
              // Show on same month and day
              return taskDate.getMonth() === targetDate.getMonth() &&
                      taskDate.getDate() === targetDate.getDate();
            }

            default:
              return false;
          }
        });
      },

      // Query: Get upcoming tasks sorted by date
      // PART 4: Uses centralized helpers for timezone-aware comparison
      getUpcomingTasks: (limit = 10) => {
        const todayStr = formatDateKey(new Date());
        return get()
          .tasks.filter((task) => {
            if (task.completed) return false;
            if (!task.date) return true;
            // Use centralized helper for timezone-aware comparison
            const taskDateKey = getTaskDateKey(task);
            return taskDateKey >= todayStr;
          })
          .sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            // Use centralized helpers for date keys
            const dateA = getTaskDateKey(a);
            const dateB = getTaskDateKey(b);
            return dateA.localeCompare(dateB);
          })
          .slice(0, limit);
      },

      // Query: Get overdue tasks
      // PART 4: Uses centralized helpers for timezone-aware comparison
      getOverdueTasks: () => {
        const todayStr = formatDateKey(new Date());
        return get().tasks.filter((task) => {
          if (task.completed) return false;
          if (!task.date) return false;
          // Use centralized helper for timezone-aware comparison
          const taskDateKey = getTaskDateKey(task);
          return taskDateKey < todayStr;
        });
      },

      // Notes
      addNote: (note) =>
        set((state) => ({
          notes: [...state.notes, note],
        })),

      updateNote: (id, content) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n
          ),
        })),

      removeNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),

      // Parking
      saveParkingSpot: (spot) => set({ parkingSpot: spot }),
      clearParkingSpot: () => set({ parkingSpot: undefined }),
    }),
    {
      name: "task-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;

          // Migrate old tasks to include reminderEnabled field
          if (state.tasks && state.tasks.length > 0) {
            state.tasks = state.tasks.map((task) => ({
              ...task,
              frequency: task.frequency || "once",
              reminderEnabled: task.reminderEnabled !== undefined ? task.reminderEnabled : true,
            }));
          }

          // Remove duplicate tasks (by ID and by external key)
          if (state.tasks && state.tasks.length > 0) {
            const seenIds = new Set<string>();
            const seenExternalKeys = new Set<string>();
            state.tasks = state.tasks.filter((task) => {
              if (!task?.id) return true;

              // Check for duplicate ID
              if (seenIds.has(task.id)) {
                secureWarn(`Removing duplicate task with ID: ${task.id}`);
                return false;
              }
              seenIds.add(task.id);

              // Check for duplicate external key (prevents duplicates from different ID formats)
              if (task.sourceSystem && task.sourceContainerId && task.sourceItemId) {
                const externalKey = `${task.sourceSystem}:${task.sourceContainerId}:${task.sourceItemId}`;
                if (seenExternalKeys.has(externalKey)) {
                  secureWarn(`Removing duplicate task with external key: ${externalKey}`);
                  return false;
                }
                seenExternalKeys.add(externalKey);
              }

              return true;
            });
          }
        }
      },
    }
  )
);
