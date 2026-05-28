import type {
  Medication,
  MedicationLog,
  Task,
  TaskInstanceCompletion,
} from "../types/app";
import type { CheckInEntry } from "../state/stores/checkInStore";
import {
  toCloudCheckIn,
  toCloudMedication,
  toCloudMedicationLog,
  toCloudTask,
  toCloudTaskCompletion,
} from "../lib/syncPayloads";
import { syncWrite } from "./syncService";

/**
 * Cached user id, set by AuthContext on session changes. Allows store actions
 * to remain synchronous — they don't need to await supabase.auth.getSession()
 * before queueing a sync write.
 *
 * If null (guest user), every sync helper here is a no-op.
 */
let currentUserId: string | null = null;

export function setSyncUserId(id: string | null): void {
  currentUserId = id;
}

export function getSyncUserId(): string | null {
  return currentUserId;
}

// ---- Tasks ---------------------------------------------------------------

export function syncTaskUpsert(task: Task): void {
  if (!currentUserId) return;
  void syncWrite("tasks", "upsert", toCloudTask(task, currentUserId));
}

export function syncTaskDelete(taskId: string): void {
  if (!currentUserId) return;
  void syncWrite("tasks", "upsert", {
    id: taskId,
    user_id: currentUserId,
    deleted_at: new Date().toISOString(),
    title: "",
    updated_at: new Date().toISOString(),
  });
}

// ---- Task completions ----------------------------------------------------

export function syncTaskCompletionUpsert(
  completion: TaskInstanceCompletion
): void {
  if (!currentUserId) return;
  void syncWrite(
    "task_completions",
    "upsert",
    toCloudTaskCompletion(completion, currentUserId)
  );
}

// ---- Medications (photo fields stripped by toCloudMedication) -----------

export function syncMedicationUpsert(med: Medication): void {
  if (!currentUserId) return;
  void syncWrite(
    "medications",
    "upsert",
    toCloudMedication(med, currentUserId)
  );
}

export function syncMedicationDelete(medicationId: string): void {
  if (!currentUserId) return;
  void syncWrite("medications", "upsert", {
    id: medicationId,
    user_id: currentUserId,
    deleted_at: new Date().toISOString(),
    name: "",
    updated_at: new Date().toISOString(),
  });
}

// ---- Medication logs -----------------------------------------------------

export function syncMedicationLogUpsert(log: MedicationLog): void {
  if (!currentUserId) return;
  void syncWrite(
    "medication_logs",
    "upsert",
    toCloudMedicationLog(log, currentUserId)
  );
}

// ---- Check-ins -----------------------------------------------------------

export function syncCheckInUpsert(date: string, entry: CheckInEntry): void {
  if (!currentUserId) return;
  const row = toCloudCheckIn(date, entry, currentUserId);
  if (!row) return;
  void syncWrite("check_ins", "upsert", row);
}
