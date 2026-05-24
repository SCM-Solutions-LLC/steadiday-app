import {
  getPendingPastDeadline,
  markEscalationSent,
  markEscalationFailed,
  cleanup,
} from "./escalation-store";
import { sendEmergencySMS } from "./sms-helper";

const POLL_INTERVAL_MS = 2_000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function log(level: "info" | "error", event: string, data: Record<string, unknown> = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "escalation-worker",
    event,
    ...data,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

async function processPendingEscalations(): Promise<void> {
  let pending;
  try {
    pending = getPendingPastDeadline();
  } catch (err: any) {
    log("error", "db_query_failed", { error: err?.message });
    return;
  }

  if (pending.length === 0) return;

  log("info", "processing_pending", { count: pending.length });

  for (const { escalation, userName, contacts } of pending) {
    if (contacts.length === 0) {
      markEscalationFailed(escalation.id, "No emergency contacts configured");
      log("info", "escalation_no_contacts", { escalationId: escalation.escalationId });
      continue;
    }

    try {
      const result = await sendEmergencySMS(
        userName,
        contacts,
        escalation.latitude ?? 0,
        escalation.longitude ?? 0
      );

      if (result.sent > 0) {
        markEscalationSent(escalation.id);
        log("info", "escalation_sent", {
          escalationId: escalation.escalationId,
          sent: result.sent,
          failed: result.failed,
        });
      } else {
        markEscalationFailed(escalation.id, `All ${result.failed} SMS sends failed`);
        log("error", "escalation_all_failed", {
          escalationId: escalation.escalationId,
          failed: result.failed,
        });
      }
    } catch (err: any) {
      markEscalationFailed(escalation.id, err?.message || "Unknown error");
      log("error", "escalation_error", {
        escalationId: escalation.escalationId,
        error: err?.message,
      });
    }
  }
}

export function startEscalationWorker(): void {
  if (pollTimer) return;

  log("info", "worker_started", { pollIntervalMs: POLL_INTERVAL_MS });

  processPendingEscalations();

  pollTimer = setInterval(() => {
    processPendingEscalations();
  }, POLL_INTERVAL_MS);

  cleanupTimer = setInterval(() => {
    try {
      cleanup();
      log("info", "cleanup_complete");
    } catch (err: any) {
      log("error", "cleanup_failed", { error: err?.message });
    }
  }, CLEANUP_INTERVAL_MS);
}

export function stopEscalationWorker(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
  log("info", "worker_stopped");
}
