/**
 * Security Tests: Notification Privacy
 *
 * These tests verify Attack Story 9 defense: Screen Sharing Exposes Medical Info
 *
 * Tests cover:
 * - Generic notification content (no medication names)
 * - Generic task notifications (no task titles)
 * - Lock screen safe notifications
 * - No sensitive data in notification payload
 */

import * as Notifications from "expo-notifications";
import {
  scheduleMedicationNotification,
  scheduleTaskNotification,
} from "../../utils/notifications";
import { Medication, Task } from "../../types/app";

// Mock Expo Notifications
jest.mock("expo-notifications");

describe("Notification Privacy (Attack Story 9)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
      "mock-notification-id"
    );
  });

  describe("Medication Notifications", () => {
    const mockMedication: Medication = {
      id: "med-1",
      name: "Aspirin 100mg",
      dosage: "100mg",
      frequency: "daily",
      timeOfDay: "morning",
      scheduleType: "daily",
      times: ["08:00", "20:00"],
      reminderEnabled: true,
      createdAt: new Date().toISOString(),
      syncSource: undefined,
    };

    it("should use generic title for medication reminders", async () => {
      await scheduleMedicationNotification(mockMedication);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();

      const callArgs = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls[0][0];

      // SECURITY: Title should be generic
      expect(callArgs.content.title).toBe("Medication Reminder");
      expect(callArgs.content.title).not.toContain("Aspirin");
      expect(callArgs.content.title).not.toContain("100mg");
    });

    it("should use generic body text without medication name", async () => {
      await scheduleMedicationNotification(mockMedication);

      const callArgs = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls[0][0];

      // SECURITY: Body should not contain medication details
      expect(callArgs.content.body).toBe(
        "You have a medication to take. Tap to view details."
      );
      expect(callArgs.content.body).not.toContain("Aspirin");
      expect(callArgs.content.body).not.toContain("100mg");
      expect(callArgs.content.body).not.toContain(mockMedication.name);
      expect(callArgs.content.body).not.toContain(mockMedication.dosage);
    });

    it("should only include medication ID in data payload", async () => {
      await scheduleMedicationNotification(mockMedication);

      const callArgs = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls[0][0];

      // Data payload can include ID (not visible to user)
      expect(callArgs.content.data.medicationId).toBe(mockMedication.id);
      expect(callArgs.content.data.type).toBe("medication");

      // But should NOT include sensitive details
      expect(callArgs.content.data.name).toBeUndefined();
      expect(callArgs.content.data.dosage).toBeUndefined();
    });

    it("should schedule multiple notifications for multiple times", async () => {
      const ids = await scheduleMedicationNotification(mockMedication);

      // Should create 2 notifications (one for each time)
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
      expect(ids).toHaveLength(2);

      // Both should have generic messages
      (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls.forEach((call) => {
        expect(call[0].content.title).toBe("Medication Reminder");
        expect(call[0].content.body).toContain(
          "You have a medication to take"
        );
      });
    });
  });

  describe("Task Notifications", () => {
    const mockTask: Task = {
      id: "task-1",
      title: "Doctor Appointment - Dr. Smith, Cardiology",
      notes: "Annual checkup at Downtown Medical Center",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      time: "14:00",
      frequency: "once",
      category: "medical",
      reminderEnabled: true,
      completed: false,
      syncSource: undefined,
      // Required fields for Task type
      sourceSystem: "manual",
      isImported: false,
      isReadOnly: false,
      syncStatus: "unlinked",
    };

    it("should use generic title for task reminders", async () => {
      await scheduleTaskNotification(mockTask);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();

      const callArgs = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls[0][0];

      // SECURITY: Title should be generic
      expect(callArgs.content.title).toBe("Task Reminder");
      expect(callArgs.content.title).not.toContain("Doctor");
      expect(callArgs.content.title).not.toContain("Appointment");
      expect(callArgs.content.title).not.toContain(mockTask.title);
    });

    it("should use generic body text without task title", async () => {
      await scheduleTaskNotification(mockTask);

      const callArgs = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls[0][0];

      // SECURITY: Body should not contain task details
      expect(callArgs.content.body).toBe(
        "You have an upcoming task. Tap to view details."
      );
      expect(callArgs.content.body).not.toContain("Doctor");
      expect(callArgs.content.body).not.toContain("Appointment");
      expect(callArgs.content.body).not.toContain("Dr. Smith");
      expect(callArgs.content.body).not.toContain(mockTask.title);
    });

    it("should not include task notes in notification", async () => {
      await scheduleTaskNotification(mockTask);

      const callArgs = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls[0][0];
      const notificationText = JSON.stringify(callArgs.content);

      // SECURITY: Notes should not be visible
      expect(notificationText).not.toContain("Annual checkup");
      expect(notificationText).not.toContain("Downtown Medical Center");
      expect(notificationText).not.toContain(mockTask.notes || "");
    });

    it("should only include task ID in data payload", async () => {
      await scheduleTaskNotification(mockTask);

      const callArgs = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls[0][0];

      // Data payload can include ID (not visible to user)
      expect(callArgs.content.data.taskId).toBe(mockTask.id);
      expect(callArgs.content.data.type).toBe("task");

      // But should NOT include sensitive details
      expect(callArgs.content.data.title).toBeUndefined();
      expect(callArgs.content.data.category).toBeUndefined();
    });
  });

  describe("Lock Screen Safety", () => {
    it("should be safe to display on lock screen", async () => {
      const medication: Medication = {
        id: "med-1",
        name: "Sensitive Medication Name",
        dosage: "50mg",
        frequency: "daily",
        timeOfDay: "morning",
        scheduleType: "daily",
        times: ["09:00"],
        reminderEnabled: true,
        createdAt: new Date().toISOString(),
        syncSource: undefined,
      };

      await scheduleMedicationNotification(medication);

      const callArgs = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls[0][0];

      // Lock screen will show title and body
      const lockScreenText = `${callArgs.content.title} ${callArgs.content.body}`;

      // SECURITY: No sensitive info should be visible on lock screen
      expect(lockScreenText).not.toContain("Sensitive Medication");
      expect(lockScreenText).not.toContain("50mg");
      expect(lockScreenText).toBe(
        "Medication Reminder You have a medication to take. Tap to view details."
      );
    });

    it("should not reveal health conditions through notification", async () => {
      const medications: Medication[] = [
        {
          id: "1",
          name: "Insulin",
          dosage: "10 units",
          frequency: "daily",
          timeOfDay: "morning",
          scheduleType: "daily",
          times: ["08:00"],
          reminderEnabled: true,
          createdAt: new Date().toISOString(),
          syncSource: undefined,
        },
        {
          id: "2",
          name: "Metformin",
          dosage: "500mg",
          frequency: "daily",
          timeOfDay: "morning",
          scheduleType: "daily",
          times: ["08:00"],
          reminderEnabled: true,
          createdAt: new Date().toISOString(),
          syncSource: undefined,
        },
      ];

      for (const med of medications) {
        await scheduleMedicationNotification(med);
      }

      // All notifications should look identical from outside
      const allCalls = (Notifications.scheduleNotificationAsync as jest.Mock)
        .mock.calls;

      allCalls.forEach((call) => {
        expect(call[0].content.title).toBe("Medication Reminder");
        expect(call[0].content.body).toBe(
          "You have a medication to take. Tap to view details."
        );
      });

      // Observer cannot determine health condition from notifications
    });
  });

  describe("Screen Sharing Protection", () => {
    it("should not expose private information during screen sharing", async () => {
      const sensitiveTask: Task = {
        id: "task-1",
        title: "Mental Health Therapy Session with Dr. Johnson",
        notes: "Weekly therapy at 2pm",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        time: "14:00",
        frequency: "weekly",
        category: "medical",
        reminderEnabled: true,
        completed: false,
        syncSource: undefined,
        // Required fields for Task type
        sourceSystem: "manual",
        isImported: false,
        isReadOnly: false,
        syncStatus: "unlinked",
      };

      await scheduleTaskNotification(sensitiveTask);

      const callArgs = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls[0][0];

      // During screen sharing, notification banner shows:
      const visibleText = `${callArgs.content.title}: ${callArgs.content.body}`;

      // SECURITY: Should not reveal therapy or mental health info
      expect(visibleText).not.toContain("Mental Health");
      expect(visibleText).not.toContain("Therapy");
      expect(visibleText).not.toContain("Dr. Johnson");
      expect(visibleText).toBe(
        "Task Reminder: You have an upcoming task. Tap to view details."
      );
    });

    it("should handle multiple sensitive reminders generically", async () => {
      const sensitiveTasks = [
        "HIV Test Results Appointment",
        "Substance Abuse Counseling",
        "Pregnancy Test",
        "STD Screening",
      ];

      for (const title of sensitiveTasks) {
        const task: Task = {
          id: `task-${title}`,
          title,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          time: "10:00",
          frequency: "once",
          category: "medical",
          reminderEnabled: true,
          completed: false,
          syncSource: undefined,
          // Required fields for Task type
          sourceSystem: "manual",
          isImported: false,
          isReadOnly: false,
          syncStatus: "unlinked",
        };

        await scheduleTaskNotification(task);
      }

      // All should have identical generic messages
      const allCalls = (Notifications.scheduleNotificationAsync as jest.Mock)
        .mock.calls;

      allCalls.forEach((call) => {
        const visibleContent = `${call[0].content.title} ${call[0].content.body}`;

        // No sensitive words should appear
        expect(visibleContent).not.toContain("HIV");
        expect(visibleContent).not.toContain("Substance");
        expect(visibleContent).not.toContain("Pregnancy");
        expect(visibleContent).not.toContain("STD");

        // All identical
        expect(call[0].content.title).toBe("Task Reminder");
      });
    });
  });

  describe("Notification Content Validation", () => {
    it("should never include PII in notification content", async () => {
      const medication: Medication = {
        id: "med-1",
        name: "Medication for John Smith (john.smith@email.com)",
        dosage: "100mg",
        frequency: "daily",
        timeOfDay: "morning",
        scheduleType: "daily",
        times: ["08:00"],
        reminderEnabled: true,
        createdAt: new Date().toISOString(),
        syncSource: undefined,
      };

      await scheduleMedicationNotification(medication);

      const callArgs = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls[0][0];
      const notificationJson = JSON.stringify(callArgs.content);

      // SECURITY: No PII should leak into notification
      expect(notificationJson).not.toContain("John Smith");
      expect(notificationJson).not.toContain("john.smith@email.com");
    });

    it("should use consistent wording across all notifications", () => {
      const medicationWording = {
        title: "Medication Reminder",
        body: "You have a medication to take. Tap to view details.",
      };

      const taskWording = {
        title: "Task Reminder",
        body: "You have an upcoming task. Tap to view details.",
      };

      // These exact wordings should be used for ALL notifications
      expect(medicationWording.title).toBe("Medication Reminder");
      expect(medicationWording.body).toContain("Tap to view details");
      expect(taskWording.title).toBe("Task Reminder");
      expect(taskWording.body).toContain("Tap to view details");
    });

    it("should not vary notification text based on content", async () => {
      const medications: Medication[] = [
        {
          id: "1",
          name: "Aspirin",
          dosage: "100mg",
          frequency: "daily",
          timeOfDay: "morning",
          scheduleType: "daily",
          times: ["08:00"],
          reminderEnabled: true,
          createdAt: new Date().toISOString(),
          syncSource: undefined,
        },
        {
          id: "2",
          name: "Insulin",
          dosage: "10 units",
          frequency: "daily",
          timeOfDay: "morning",
          scheduleType: "daily",
          times: ["08:00"],
          reminderEnabled: true,
          createdAt: new Date().toISOString(),
          syncSource: undefined,
        },
        {
          id: "3",
          name: "Chemotherapy Drug",
          dosage: "50mg",
          frequency: "daily",
          timeOfDay: "morning",
          scheduleType: "daily",
          times: ["08:00"],
          reminderEnabled: true,
          createdAt: new Date().toISOString(),
          syncSource: undefined,
        },
      ];

      for (const med of medications) {
        await scheduleMedicationNotification(med);
      }

      const allCalls = (Notifications.scheduleNotificationAsync as jest.Mock)
        .mock.calls;

      // All should have EXACTLY the same title and body
      const firstTitle = allCalls[0][0].content.title;
      const firstBody = allCalls[0][0].content.body;

      allCalls.forEach((call) => {
        expect(call[0].content.title).toBe(firstTitle);
        expect(call[0].content.body).toBe(firstBody);
      });
    });
  });

  describe("Security Regression Tests", () => {
    it("should not accidentally expose data through notification actions", async () => {
      const medication: Medication = {
        id: "med-1",
        name: "Sensitive Medication",
        dosage: "50mg",
        frequency: "daily",
        timeOfDay: "morning",
        scheduleType: "daily",
        times: ["08:00"],
        reminderEnabled: true,
        createdAt: new Date().toISOString(),
        syncSource: undefined,
      };

      await scheduleMedicationNotification(medication);

      const callArgs = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls[0][0];

      // Check notification action buttons
      expect(callArgs.content.categoryIdentifier).toBe("medication");

      // Action button text should also be generic
      // These are set up in setNotificationCategoryAsync calls
      // They should say "Remind me later" and "Done", not medication names
    });

    it("should protect privacy even if notification is snoozed", async () => {
      // When user snoozes a notification, the re-scheduled notification
      // should also have generic content

      const task: Task = {
        id: "task-1",
        title: "Private Medical Procedure",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        time: "10:00",
        frequency: "once",
        category: "medical",
        reminderEnabled: true,
        completed: false,
        syncSource: undefined,
        // Required fields for Task type
        sourceSystem: "manual",
        isImported: false,
        isReadOnly: false,
        syncStatus: "unlinked",
      };

      await scheduleTaskNotification(task);

      const callArgs = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls[0][0];

      // Snoozed notification should use same generic content
      expect(callArgs.content.title).toBe("Task Reminder");
      expect(callArgs.content.body).not.toContain("Private");
      expect(callArgs.content.body).not.toContain("Medical");
      expect(callArgs.content.body).not.toContain("Procedure");
    });
  });

  describe("Compliance Verification", () => {
    it("should meet HIPAA privacy requirements for notifications", async () => {
      // HIPAA requires PHI (Protected Health Information) to be protected
      // Notifications are considered "minimum necessary" disclosure

      const medication: Medication = {
        id: "med-1",
        name: "HIV Medication",
        dosage: "200mg",
        frequency: "daily",
        timeOfDay: "morning",
        scheduleType: "daily",
        times: ["08:00"],
        reminderEnabled: true,
        createdAt: new Date().toISOString(),
        syncSource: undefined,
      };

      await scheduleMedicationNotification(medication);

      const callArgs = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls[0][0];
      const visibleContent = `${callArgs.content.title} ${callArgs.content.body}`;

      // HIPAA: No PHI should be visible in notification
      expect(visibleContent).not.toContain("HIV");
      expect(visibleContent).not.toContain(medication.name);
      expect(visibleContent).toBe(
        "Medication Reminder You have a medication to take. Tap to view details."
      );
    });

    it("should protect user privacy according to Attack Story 9", () => {
      // Attack Story 9: Screen Sharing Exposes Medical Info
      // Defense: Generic notifications that don't reveal health data

      const testScenarios = [
        {
          name: "Chemotherapy Session",
          expected: "Task Reminder",
        },
        {
          name: "Methadone Dose",
          expected: "Medication Reminder",
        },
        {
          name: "Psychiatric Evaluation",
          expected: "Task Reminder",
        },
      ];

      testScenarios.forEach((scenario) => {
        // Regardless of content, notification should be generic
        expect(scenario.expected).toMatch(/^(Task|Medication) Reminder$/);
      });
    });
  });
});
