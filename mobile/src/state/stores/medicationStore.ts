import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Medication, MedicationLog } from "../../types/app";
import {
  scheduleMedicationNotification,
  cancelNotificationsForMedication,
} from "../../utils/notifications";
import { syncMedicationToCalendar } from "../../utils/calendarSync";
import { secureError } from "../../utils/secureLogger";
import { useSettingsStore } from "./settingsStore";

// ============================================================================
// MEDICATION STORE
// Manages medications, schedules, and medication logs
// ============================================================================

interface MedicationState {
  // Hydration
  _hasHydrated: boolean;

  // Data
  medications: Medication[];
  medicationLogs: MedicationLog[];
}

interface MedicationActions {
  // Medications
  addMedication: (medication: Medication) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  removeMedication: (id: string) => void;

  // Medication Logs
  logMedication: (log: MedicationLog) => void;
  updateMedicationLog: (
    id: string,
    status: MedicationLog["status"],
    actualTime?: string
  ) => void;
  removeMedicationLogForToday: (medicationId: string) => void;

  // Queries
  getMedicationById: (id: string) => Medication | undefined;
  getTodaysMedications: () => Medication[];
  getMedicationLogsForWeek: (medicationId: string) => MedicationLog[];
}

type MedicationStore = MedicationState & MedicationActions;

export const useMedicationStore = create<MedicationStore>()(
  persist(
    (set, get) => ({
      medications: [],
      medicationLogs: [],
      _hasHydrated: false,

      // Add medication with notifications
      addMedication: (medication) => {
        // Schedule notifications asynchronously with user's notification preference
        if (medication.reminderEnabled) {
          const notificationSource = useSettingsStore.getState().notificationSource || "steadiday";
          scheduleMedicationNotification(medication, notificationSource as any)
            .then((notificationIds) => {
              // Update the medication with notification IDs
              if (notificationIds.length > 0) {
                set((state) => ({
                  medications: state.medications.map((m) =>
                    m.id === medication.id
                      ? { ...m, notificationIds }
                      : m
                  ),
                }));
              }
            })
            .catch((e) =>
              secureError("Failed to schedule medication notification", e)
            );
        }

        set((state) => ({
          medications: [...state.medications, medication],
        }));
      },

      // Update medication
      updateMedication: (id, updates) => {
        const medication = get().medications.find((m) => m.id === id);
        if (!medication) return;

        const updated = { ...medication, ...updates };

        set((state) => ({
          medications: state.medications.map((m) =>
            m.id === id ? updated : m
          ),
        }));

        // Reschedule notifications if times, alerts, or reminder settings changed
        if (
          updates.times ||
          updates.frequency ||
          updates.reminderEnabled !== undefined ||
          updates.firstAlert !== undefined ||
          updates.secondAlert !== undefined
        ) {
          cancelNotificationsForMedication(id, medication.notificationIds).then(() => {
            if (updated.reminderEnabled) {
              const notificationSource = useSettingsStore.getState().notificationSource || "steadiday";
              scheduleMedicationNotification(updated, notificationSource as any)
                .then((notificationIds) => {
                  // Update the medication with new notification IDs
                  set((state) => ({
                    medications: state.medications.map((m) =>
                      m.id === id
                        ? { ...m, notificationIds: notificationIds.length > 0 ? notificationIds : undefined }
                        : m
                    ),
                  }));
                })
                .catch((e) =>
                  secureError("Failed to reschedule medication notification", e)
                );
            }
          });
        }
      },

      // Remove medication
      removeMedication: (id) => {
        const medication = get().medications.find((m) => m.id === id);
        cancelNotificationsForMedication(id, medication?.notificationIds).catch((e) =>
          secureError("Failed to cancel medication notifications", e)
        );

        set((state) => ({
          medications: state.medications.filter((m) => m.id !== id),
          medicationLogs: state.medicationLogs.filter(
            (l) => l.medicationId !== id
          ),
        }));
      },

      // Log medication taken/skipped/missed
      logMedication: (log) =>
        set((state) => ({
          medicationLogs: [...state.medicationLogs, log],
        })),

      // Update existing log
      updateMedicationLog: (id, status, actualTime) =>
        set((state) => ({
          medicationLogs: state.medicationLogs.map((log) =>
            log.id === id
              ? {
                  ...log,
                  status,
                  actualTime: actualTime || log.actualTime,
                }
              : log
          ),
        })),

      // Remove today's medication log (for unchecking)
      removeMedicationLogForToday: (medicationId) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        set((state) => ({
          medicationLogs: state.medicationLogs.filter((log) => {
            // Keep logs that don't match the medication
            if (log.medicationId !== medicationId) return true;
            // Keep logs that aren't from today
            const logDate = new Date(log.scheduledTime);
            logDate.setHours(0, 0, 0, 0);
            return logDate.getTime() !== today.getTime();
          }),
        }));
      },

      // Get medication by ID
      getMedicationById: (id) => get().medications.find((m) => m.id === id),

      // Get today's medications based on schedule
      getTodaysMedications: () => {
        const today = new Date();
        const dayOfWeek = today.getDay();

        return get().medications.filter((med) => {
          // Check if medication applies today based on schedule type
          if (med.scheduleType === "specific-days" && med.daysOfWeek) {
            return med.daysOfWeek.includes(dayOfWeek);
          }

          if (med.frequency === "every-other-day" && med.startDate) {
            const startDate = new Date(med.startDate);
            const daysSinceStart = Math.floor(
              (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysSinceStart % 2 === 0;
          }

          if (med.frequency === "weekly" && med.startDate) {
            const startDate = new Date(med.startDate);
            return today.getDay() === startDate.getDay();
          }

          return true; // Daily medications
        });
      },

      // Get logs for the past week
      getMedicationLogsForWeek: (medicationId) => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        return get().medicationLogs.filter(
          (log) =>
            log.medicationId === medicationId &&
            new Date(log.scheduledTime) >= oneWeekAgo
        );
      },
    }),
    {
      name: "medication-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);
