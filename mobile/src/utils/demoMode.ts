/**
 * Demo Mode Utilities
 *
 * Provides demo mode functionality for App Store review.
 * Demo PIN: 0000
 *
 * When demo mode is active:
 * - Sample data is loaded (medications, tasks, contacts)
 * - User starts on FREE tier so reviewers can test the subscription purchase flow
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "./logger";
import { useMedicationStore } from "../state/stores/medicationStore";
import { useTaskStore } from "../state/stores/taskStore";
import { useUserStore } from "../state/stores/userStore";
import type { Medication, Task, TrustedContact } from "../types/app";

// Demo PIN for local testing only — gated behind __DEV__ at every call site
export const DEMO_PIN = "0000";

/**
 * Returns true only in development builds when pin matches the demo PIN.
 * Production builds always return false — no bypass is possible.
 */
export function isDemoPin(pin: string): boolean {
  if (!__DEV__) return false;
  return pin === DEMO_PIN;
}

const DEMO_MODE_KEY = "steadiday_demo_mode_active";

/**
 * Check if demo mode is currently active
 */
export async function isDemoModeActive(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(DEMO_MODE_KEY);
    return value === "true";
  } catch (error) {
    logger.error("Error checking demo mode status:", error);
    return false;
  }
}

/**
 * Activate demo mode - called when demo PIN is entered
 * Demo mode loads sample data but does NOT unlock premium.
 * This allows App Store reviewers to test the subscription purchase flow.
 */
export async function activateDemoMode(): Promise<void> {
  // Defense-in-depth: demo mode only works in development builds
  if (!__DEV__) return;

  try {
    await AsyncStorage.setItem(DEMO_MODE_KEY, "true");
    logger.log("[Demo Mode] Activated");

    // Load sample data (medications, tasks, contacts)
    loadDemoData();

    logger.log("[Demo Mode] Sample data loaded - user remains on FREE tier");
  } catch (error) {
    logger.error("Error activating demo mode:", error);
  }
}

/**
 * Deactivate demo mode and clear demo data
 */
export async function deactivateDemoMode(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEMO_MODE_KEY);
    clearDemoData();
    logger.log("[Demo Mode] Deactivated");
  } catch (error) {
    logger.error("Error deactivating demo mode:", error);
  }
}

// =============================================================================
// DEMO DATA
// =============================================================================

// Helper to get today's date in ISO format
function getTodayISO(): string {
  return new Date().toISOString();
}

// Helper to get a date relative to today
function getRelativeDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

// Helper to get local date string YYYY-MM-DD
function getLocalDateString(daysFromNow: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

const DEMO_MEDICATIONS: Medication[] = [
  {
    id: "demo-med-1",
    name: "Vitamin D3",
    dosage: "1000 IU",
    frequency: "daily",
    timeOfDay: "morning",
    specificTime: "08:00",
    reminderEnabled: true,
    firstAlert: "at_time",
    notes: "Take with breakfast for better absorption",
    scheduleType: "daily",
    times: ["08:00"],
    createdAt: getTodayISO(),
    dataSource: "steadiday",
  },
  {
    id: "demo-med-2",
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "daily",
    timeOfDay: "morning",
    specificTime: "08:00",
    reminderEnabled: true,
    firstAlert: "at_time",
    notes: "Blood pressure medication",
    scheduleType: "daily",
    times: ["08:00"],
    pharmacy: {
      name: "CVS Pharmacy",
      phoneNumber: "555-0123",
    },
    createdAt: getTodayISO(),
    dataSource: "steadiday",
  },
  {
    id: "demo-med-3",
    name: "Calcium + Magnesium",
    dosage: "500mg / 250mg",
    frequency: "daily",
    timeOfDay: "afternoon",
    specificTime: "12:00",
    reminderEnabled: true,
    firstAlert: "at_time",
    notes: "Take with lunch",
    scheduleType: "daily",
    times: ["12:00"],
    createdAt: getTodayISO(),
    dataSource: "steadiday",
  },
];

const DEMO_TASKS: Task[] = [
  {
    id: "demo-task-1",
    title: "Doctor appointment - Annual checkup",
    date: getRelativeDate(1),
    dueDateLocal: getLocalDateString(1),
    time: "10:00",
    endTime: "11:00",
    location: "Primary Care Clinic, 123 Health St",
    category: "medical",
    frequency: "once",
    reminderEnabled: true,
    reminderMinutes: 60,
    notes: "Remember to bring insurance card and medication list",
    completed: false,
    sourceSystem: "manual",
    isImported: false,
    isReadOnly: false,
    syncStatus: "linked",
    dataSource: "steadiday",
  },
  {
    id: "demo-task-2",
    title: "Pick up prescription refill",
    date: getTodayISO(),
    dueDateLocal: getLocalDateString(0),
    time: "14:00",
    category: "errand",
    frequency: "once",
    reminderEnabled: true,
    reminderMinutes: 30,
    notes: "CVS Pharmacy - Lisinopril refill ready",
    completed: false,
    sourceSystem: "manual",
    isImported: false,
    isReadOnly: false,
    syncStatus: "linked",
    dataSource: "steadiday",
  },
  {
    id: "demo-task-3",
    title: "Morning walk in the park",
    date: getTodayISO(),
    dueDateLocal: getLocalDateString(0),
    time: "09:00",
    category: "personal",
    frequency: "daily",
    reminderEnabled: true,
    reminderMinutes: 15,
    notes: "30 minute walk for exercise",
    completed: true,
    completedAt: getTodayISO(),
    sourceSystem: "manual",
    isImported: false,
    isReadOnly: false,
    syncStatus: "linked",
    dataSource: "steadiday",
  },
  {
    id: "demo-task-4",
    title: "Call pharmacy about insurance",
    date: getRelativeDate(2),
    dueDateLocal: getLocalDateString(2),
    time: "11:00",
    category: "errand",
    frequency: "once",
    reminderEnabled: true,
    reminderMinutes: 15,
    completed: false,
    sourceSystem: "manual",
    isImported: false,
    isReadOnly: false,
    syncStatus: "linked",
    dataSource: "steadiday",
  },
];

const DEMO_CONTACTS: TrustedContact[] = [
  {
    id: "demo-contact-1",
    name: "Sarah Johnson",
    relationship: "Daughter",
    phoneNumber: "555-0101",
    isPrimary: true,
    isEmergencyContact: true,
  },
  {
    id: "demo-contact-2",
    name: "Dr. Michael Chen",
    relationship: "Primary Doctor",
    phoneNumber: "555-0102",
    isPrimary: false,
    isEmergencyContact: false,
  },
  {
    id: "demo-contact-3",
    name: "Robert Johnson",
    relationship: "Son",
    phoneNumber: "555-0103",
    isPrimary: false,
    isEmergencyContact: true,
  },
];

/**
 * Load demo data into stores
 */
export function loadDemoData(): void {
  const medicationStore = useMedicationStore.getState();
  const taskStore = useTaskStore.getState();
  const userStore = useUserStore.getState();

  // Check if demo data already loaded (prevent duplicates)
  const existingDemoMeds = medicationStore.medications.filter(
    (m) => m.id.startsWith("demo-")
  );
  if (existingDemoMeds.length > 0) {
    logger.log("[Demo Mode] Demo data already loaded, skipping");
    return;
  }

  // Add demo medications
  DEMO_MEDICATIONS.forEach((med) => {
    medicationStore.addMedication(med);
  });

  // Add demo tasks (using batch add to avoid notification scheduling)
  taskStore.addTasksBatch(DEMO_TASKS);

  // Add demo contacts
  DEMO_CONTACTS.forEach((contact) => {
    userStore.addEmergencyContact(contact);
  });

  // Set a demo user name
  userStore.setUserName("Demo User");

  logger.log("[Demo Mode] Demo data loaded successfully");
}

/**
 * Clear demo data from stores
 */
export function clearDemoData(): void {
  const medicationStore = useMedicationStore.getState();
  const taskStore = useTaskStore.getState();
  const userStore = useUserStore.getState();

  // Remove demo medications
  medicationStore.medications
    .filter((m) => m.id.startsWith("demo-"))
    .forEach((m) => medicationStore.removeMedication(m.id));

  // Remove demo tasks
  taskStore.tasks
    .filter((t) => t.id.startsWith("demo-"))
    .forEach((t) => taskStore.removeTask(t.id));

  // Remove demo contacts
  userStore.userProfile.emergencyContacts
    .filter((c) => c.id.startsWith("demo-"))
    .forEach((c) => userStore.removeEmergencyContact(c.id));

  logger.log("[Demo Mode] Demo data cleared");
}

/**
 * Check and restore demo mode on app startup
 * Call this in App.tsx or your root navigator after stores hydrate
 * Demo mode only restores sample data - does NOT unlock premium.
 */
export async function restoreDemoModeIfActive(): Promise<void> {
  // Defense-in-depth: demo mode only restores in development builds
  if (!__DEV__) return;

  try {
    const isDemo = await AsyncStorage.getItem(DEMO_MODE_KEY);

    if (isDemo === "true") {
      logger.log("[Demo Mode] Restoring demo mode on app startup");

      // Ensure demo data exists
      const medicationStore = useMedicationStore.getState();
      const hasDemoMeds = medicationStore.medications.some(m => m.id.startsWith("demo-"));

      if (!hasDemoMeds) {
        logger.log("[Demo Mode] Reloading demo data");
        loadDemoData();
      }
    }
  } catch (error) {
    logger.error("Error restoring demo mode:", error);
  }
}
