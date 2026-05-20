/**
 * Task Store Tests
 *
 * Tests for the taskStore Zustand store that manages tasks,
 * including adding, completing, archiving, and querying tasks.
 */

import { useTaskStore } from "../../state/stores/taskStore";
import type { Task } from "../../types/app";

// Mock dependencies
jest.mock("../../utils/notifications", () => ({
  scheduleTaskNotification: jest.fn().mockResolvedValue([]),
  cancelNotificationsForTask: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../utils/calendarSync", () => ({
  syncTaskToCalendar: jest.fn().mockResolvedValue(undefined),
  updateTaskInCalendar: jest.fn().mockResolvedValue(undefined),
  deleteCalendarEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../utils/twoWaySync", () => ({
  syncTaskCompletionToExternal: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../utils/secureLogger", () => ({
  secureWarn: jest.fn(),
}));

jest.mock("../../state/stores/settingsStore", () => ({
  useSettingsStore: {
    getState: jest.fn().mockReturnValue({
      notificationSource: "steadiday",
    }),
  },
}));

// Helper to create a minimal valid Task object
function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: "Test Task",
    date: new Date().toISOString(),
    completed: false,
    reminderEnabled: false,
    sourceSystem: "manual",
    isImported: false,
    isReadOnly: false,
    syncStatus: "linked",
    ...overrides,
  };
}

describe("taskStore", () => {
  beforeEach(() => {
    // Reset the store state before each test
    useTaskStore.setState({
      tasks: [],
      notes: [],
      parkingSpot: undefined,
      _hasHydrated: true,
    });
    jest.clearAllMocks();
  });

  describe("addTask", () => {
    it("addTask adds a task to the array", async () => {
      const task = createMockTask({ id: "test-task-1", title: "Buy groceries" });

      await useTaskStore.getState().addTask(task);

      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].id).toBe("test-task-1");
      expect(state.tasks[0].title).toBe("Buy groceries");
    });
  });

  describe("toggleTaskComplete", () => {
    it("toggleTaskComplete toggles the completed state", async () => {
      const task = createMockTask({ id: "toggle-task", completed: false });

      await useTaskStore.getState().addTask(task);
      expect(useTaskStore.getState().tasks[0].completed).toBe(false);

      await useTaskStore.getState().toggleTaskComplete("toggle-task");
      expect(useTaskStore.getState().tasks[0].completed).toBe(true);
      expect(useTaskStore.getState().tasks[0].completedAt).toBeDefined();

      await useTaskStore.getState().toggleTaskComplete("toggle-task");
      expect(useTaskStore.getState().tasks[0].completed).toBe(false);
      expect(useTaskStore.getState().tasks[0].completedAt).toBeUndefined();
    });
  });

  describe("enforceEssentialsLimit", () => {
    it("enforceEssentialsLimit archives overflow tasks", async () => {
      // Add 5 imported tasks
      for (let i = 0; i < 5; i++) {
        await useTaskStore.getState().addTask(
          createMockTask({
            id: `imported-task-${i}`,
            title: `Imported Task ${i}`,
            date: new Date(2024, 0, i + 1).toISOString(), // Different dates
            isImported: true,
            completed: false,
          })
        );
      }

      // Add 2 manual tasks
      for (let i = 0; i < 2; i++) {
        await useTaskStore.getState().addTask(
          createMockTask({
            id: `manual-task-${i}`,
            title: `Manual Task ${i}`,
            isImported: false,
            completed: false,
          })
        );
      }

      expect(useTaskStore.getState().tasks).toHaveLength(7);

      // Enforce limit of 5 active tasks
      useTaskStore.getState().enforceEssentialsLimit(5);

      const state = useTaskStore.getState();
      const activeTasks = state.tasks.filter((t: Task) => !t.completed && !t.archivedAt);
      const archivedTasks = state.tasks.filter((t: Task) => t.archivedAt);

      // Should have 5 active tasks and 2 archived (oldest imported tasks)
      expect(activeTasks).toHaveLength(5);
      expect(archivedTasks).toHaveLength(2);

      // Manual tasks should not be archived
      const archivedManualTasks = archivedTasks.filter((t: Task) => !t.isImported);
      expect(archivedManualTasks).toHaveLength(0);
    });
  });

  describe("getTasksForDate", () => {
    it("getTasksForDate returns correct tasks", async () => {
      const targetDate = "2024-06-15";
      const otherDate = "2024-06-16";

      // Add tasks for target date
      await useTaskStore.getState().addTask(
        createMockTask({
          id: "task-on-date-1",
          title: "Task on target date 1",
          date: `${targetDate}T10:00:00.000Z`,
        })
      );
      await useTaskStore.getState().addTask(
        createMockTask({
          id: "task-on-date-2",
          title: "Task on target date 2",
          date: `${targetDate}T14:00:00.000Z`,
        })
      );

      // Add task for different date
      await useTaskStore.getState().addTask(
        createMockTask({
          id: "task-other-date",
          title: "Task on other date",
          date: `${otherDate}T09:00:00.000Z`,
        })
      );

      const tasksForDate = useTaskStore.getState().getTasksForDate(targetDate);

      expect(tasksForDate).toHaveLength(2);
      expect(tasksForDate.map((t: Task) => t.id)).toContain("task-on-date-1");
      expect(tasksForDate.map((t: Task) => t.id)).toContain("task-on-date-2");
      expect(tasksForDate.map((t: Task) => t.id)).not.toContain("task-other-date");
    });
  });
});
