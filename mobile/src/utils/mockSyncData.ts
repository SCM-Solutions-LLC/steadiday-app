import { Task, Medication, FamilyMessage } from "../types/app";

/**
 * Mock data that simulates syncing from connected apps
 */

export const getMockTasksForApp = (appId: string): Task[] => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (appId) {
    case "apple-calendar":
      return [
        {
          id: `synced-${appId}-1`,
          title: "Doctor Appointment",
          notes: "Annual checkup with Dr. Smith",
          date: tomorrow.toISOString().split("T")[0],
          time: "10:00",
          completed: false,
          frequency: "once",
          reminderEnabled: true,
          category: "medical",
          syncSource: "calendar",
          sourceSystem: "apple_calendar",
          isImported: true,
          isReadOnly: true,
          syncStatus: "linked",
        },
        {
          id: `synced-${appId}-2`,
          title: "Grocery Shopping",
          notes: "Pick up prescriptions and essentials",
          date: now.toISOString().split("T")[0],
          time: "15:00",
          completed: false,
          frequency: "once",
          reminderEnabled: true,
          category: "errand",
          syncSource: "calendar",
          sourceSystem: "apple_calendar",
          isImported: true,
          isReadOnly: true,
          syncStatus: "linked",
        },
      ];

    case "google-calendar":
      return [
        {
          id: `synced-${appId}-1`,
          title: "Physical Therapy",
          notes: "Weekly PT session",
          date: tomorrow.toISOString().split("T")[0],
          time: "14:00",
          completed: false,
          frequency: "weekly",
          reminderEnabled: true,
          category: "medical",
          syncSource: "calendar",
          sourceSystem: "google_calendar",
          isImported: true,
          isReadOnly: true,
          syncStatus: "linked",
        },
      ];

    case "apple-reminders":
      return [
        {
          id: `synced-${appId}-1`,
          title: "Call Sarah",
          notes: "Check in about weekend plans",
          date: now.toISOString().split("T")[0],
          time: "17:00",
          completed: false,
          frequency: "once",
          reminderEnabled: true,
          category: "personal",
          syncSource: "reminders",
          sourceSystem: "apple_reminders",
          isImported: true,
          isReadOnly: true,
          syncStatus: "linked",
        },
        {
          id: `synced-${appId}-2`,
          title: "Water plants",
          date: now.toISOString().split("T")[0],
          time: "09:00",
          completed: false,
          frequency: "weekly",
          reminderEnabled: true,
          category: "personal",
          syncSource: "reminders",
          sourceSystem: "apple_reminders",
          isImported: true,
          isReadOnly: true,
          syncStatus: "linked",
        },
      ];

    case "todoist":
      return [
        {
          id: `synced-${appId}-1`,
          title: "Review medical bills",
          notes: "Check insurance coverage",
          date: now.toISOString().split("T")[0],
          time: "11:00",
          completed: false,
          frequency: "once",
          reminderEnabled: true,
          category: "medical",
          syncSource: "calendar",
          sourceSystem: "manual",
          isImported: true,
          isReadOnly: true,
          syncStatus: "linked",
        },
      ];

    // Note: Apple Health does NOT import tasks - only health metrics and medications
    // Tasks should only be imported from calendar apps

    default:
      return [];
  }
};

export const getMockMedicationsForApp = (appId: string): Medication[] => {
  switch (appId) {
    case "apple-health":
      // Apple Health is the only supported medication import source
      return [
        {
          id: `synced-${appId}-med-1`,
          name: "Lisinopril",
          dosage: "10mg",
          frequency: "daily",
          timeOfDay: "morning",
          times: ["08:00"],
          scheduleType: "daily",
          reminderEnabled: true,
          createdAt: new Date().toISOString(),
          syncSource: appId,
        },
        {
          id: `synced-${appId}-med-2`,
          name: "Metformin",
          dosage: "500mg",
          frequency: "twice-daily",
          timeOfDay: "specific",
          times: ["08:00", "20:00"],
          scheduleType: "multiple-times",
          reminderEnabled: true,
          createdAt: new Date().toISOString(),
          syncSource: appId,
        },
      ];

    case "carezone":
      return [
        {
          id: `synced-${appId}-1`,
          name: "Atorvastatin",
          dosage: "20mg",
          frequency: "daily",
          timeOfDay: "night",
          times: ["20:00"],
          scheduleType: "daily",
          reminderEnabled: true,
          createdAt: new Date().toISOString(),
          syncSource: appId,
        },
        {
          id: `synced-${appId}-2`,
          name: "Vitamin D",
          dosage: "1000 IU",
          frequency: "daily",
          timeOfDay: "morning",
          times: ["08:00"],
          scheduleType: "daily",
          reminderEnabled: true,
          createdAt: new Date().toISOString(),
          syncSource: appId,
        },
      ];

    case "mychart":
      return [
        {
          id: `synced-${appId}-1`,
          name: "Aspirin",
          dosage: "81mg",
          frequency: "daily",
          timeOfDay: "morning",
          times: ["09:00"],
          scheduleType: "daily",
          reminderEnabled: true,
          createdAt: new Date().toISOString(),
          syncSource: appId,
        },
      ];

    default:
      return [];
  }
};

export const getMockMessagesForApp = (appId: string): FamilyMessage[] => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  switch (appId) {
    case "apple-calendar":
      return [
        {
          id: `synced-${appId}-1`,
          type: "text",
          content: "Don't forget your appointment tomorrow at 10 AM!",
          fromName: "Calendar Reminder",
          timestamp: yesterday.toISOString(),
        },
      ];

    case "apple-health":
      return [
        {
          id: `synced-${appId}-msg-1`,
          type: "text",
          content: "Great job! You completed your activity goal for the week.",
          fromName: "Health Update",
          timestamp: twoDaysAgo.toISOString(),
        },
        {
          id: `synced-${appId}-msg-2`,
          type: "text",
          content: "You have been taking your medications on time this week. Keep it up!",
          fromName: "Medication Tracker",
          timestamp: yesterday.toISOString(),
        },
      ];

    default:
      return [];
  }
};

/**
 * Get a friendly description of what data was synced
 */
export const getSyncSummary = (appId: string): string => {
  const tasks = getMockTasksForApp(appId);
  const meds = getMockMedicationsForApp(appId);
  const messages = getMockMessagesForApp(appId);

  const parts: string[] = [];

  if (tasks.length > 0) {
    parts.push(`${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`);
  }

  if (meds.length > 0) {
    parts.push(`${meds.length} ${meds.length === 1 ? "medication" : "medications"}`);
  }

  if (messages.length > 0) {
    parts.push(`${messages.length} ${messages.length === 1 ? "update" : "updates"}`);
  }

  if (parts.length === 0) {
    return "Connected successfully";
  }

  return `Synced ${parts.join(", ")}`;
};
