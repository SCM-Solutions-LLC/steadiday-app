import { format } from "date-fns";

import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useCheckInStore } from "../state/stores/checkInStore";
import { useHealthStore } from "../state/stores/healthStore";
import { useMedicationStore } from "../state/stores/medicationStore";
import { useTaskInstanceStore } from "../state/stores/taskInstanceStore";
import { logger } from "../utils/logger";

const todayDate = () => format(new Date(), "yyyy-MM-dd");

function countTaskCompletionsForDate(date: string): number {
  const completions = useTaskInstanceStore.getState().completions;
  return Object.values(completions).filter(
    (c) => c.occurrenceDate === date
  ).length;
}

function countMedicationsTakenForDate(date: string): number {
  const logs = useMedicationStore.getState().medicationLogs;
  return logs.filter((log) => {
    if (log.status !== "taken") return false;
    const when = log.actualTime ?? log.scheduledTime;
    return when?.startsWith(date);
  }).length;
}

function hasCheckInForDate(date: string): boolean {
  const entry = useCheckInStore.getState().checkInsByDate[date];
  return Boolean(entry && !entry.skipped && entry.value);
}

function stepsForDate(date: string): number | null {
  const metric = useHealthStore.getState().getHealthMetricForDate(date);
  return typeof metric?.steps === "number" ? metric.steps : null;
}

/**
 * Upserts today's row in daily_activity_summary.
 * Fire-and-forget: never throws — the caller should not await for UX flows.
 */
export async function syncDailyActivitySummary(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  const date = todayDate();
  try {
    const payload = {
      user_id: userId,
      summary_date: date,
      last_active_at: new Date().toISOString(),
      tasks_completed: countTaskCompletionsForDate(date),
      medications_taken: countMedicationsTakenForDate(date),
      check_in_completed: hasCheckInForDate(date),
      step_count: stepsForDate(date),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("daily_activity_summary")
      .upsert(payload, { onConflict: "user_id,summary_date" });

    if (error) {
      logger.warn("[activitySync] Upsert failed:", error.message);
    }
  } catch (error) {
    logger.warn("[activitySync] Threw:", error);
  }
}
