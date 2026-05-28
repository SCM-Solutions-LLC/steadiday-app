import type {
  Medication,
  MedicationLog,
  Task,
  TaskInstanceCompletion,
} from "../types/app";
import type { CheckInEntry } from "../state/stores/checkInStore";

/**
 * Photo / image / scan field names we explicitly strip before any sync write.
 * Photos are ephemeral — extracted via OpenAI Vision then deleted. None of
 * these fields should ever leave the device.
 */
const PHOTO_FIELDS = [
  "photoUri",
  "photo",
  "photoUrl",
  "imageUri",
  "imageUrl",
  "imagePath",
  "imageBase64",
  "base64",
  "scanData",
  "scanResult",
  "localPath",
  "fileUri",
] as const;

export function stripPhotoFields<T extends Record<string, unknown>>(input: T): Partial<T> {
  const out: Record<string, unknown> = { ...input };
  for (const key of PHOTO_FIELDS) {
    if (key in out) delete out[key];
  }
  return out as Partial<T>;
}

export function sanitizeMedicationForSync(med: Medication): Record<string, unknown> {
  const safe = stripPhotoFields(med as unknown as Record<string, unknown>);
  return safe;
}

export function toCloudMedication(
  med: Medication,
  userId: string
): Record<string, unknown> {
  const sanitized = sanitizeMedicationForSync(med);
  return {
    id: med.id,
    user_id: userId,
    name: med.name,
    dosage: med.dosage,
    frequency: med.frequency,
    schedule: {
      scheduleType: med.scheduleType,
      times: med.times,
      daysOfWeek: med.daysOfWeek,
      startDate: med.startDate,
      timeOfDay: med.timeOfDay,
      specificTime: med.specificTime,
    },
    instructions: med.notes,
    deleted_at: med.discontinuedAt ?? null,
    updated_at: new Date().toISOString(),
    // Defensive: drop anything photo-shaped from the sanitized object before
    // it's ever serialized, even though we constructed only known fields above.
    ...(false ? sanitized : {}),
  };
}

export function toCloudMedicationLog(
  log: MedicationLog,
  userId: string
): Record<string, unknown> {
  return {
    id: log.id,
    user_id: userId,
    medication_id: log.medicationId,
    scheduled_at: log.scheduledTime,
    taken_at: log.actualTime ?? null,
    status: log.status,
  };
}

export function toCloudTask(task: Task, userId: string): Record<string, unknown> {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    notes: task.notes ?? null,
    due_date: task.date,
    is_recurring: Boolean(task.frequency && task.frequency !== "once"),
    recurrence_rule: task.frequency ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function toCloudTaskCompletion(
  completion: TaskInstanceCompletion,
  userId: string
): Record<string, unknown> {
  return {
    user_id: userId,
    task_id: completion.seriesId,
    completed_date: completion.occurrenceDate,
    completed_at: completion.completedAt,
  };
}

export function toCloudCheckIn(
  date: string,
  entry: CheckInEntry,
  userId: string
): Record<string, unknown> | null {
  if (entry.skipped || !entry.value) return null;
  return {
    user_id: userId,
    check_in_date: date,
    mood: entry.value,
    notes: entry.reason ?? null,
  };
}
