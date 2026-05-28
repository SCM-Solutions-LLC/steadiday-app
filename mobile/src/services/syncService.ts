import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { logger } from "../utils/logger";

const SYNC_QUEUE_KEY = "supabase_sync_queue_v1";
const MAX_QUEUE_SIZE = 500;

export type SyncTable =
  | "profiles"
  | "tasks"
  | "task_completions"
  | "medications"
  | "medication_logs"
  | "check_ins"
  | "daily_activity_summary";

export type SyncOperation = "upsert" | "delete";

interface QueuedSyncOperation {
  id: string;
  table: SyncTable;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  matchColumn?: string;
  queuedAt: number;
}

let draining = false;

export async function syncWrite(
  table: SyncTable,
  operation: SyncOperation,
  payload: Record<string, unknown>,
  options?: { matchColumn?: string }
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const netState = await NetInfo.fetch().catch(() => null);
  if (netState?.isConnected === false) {
    await queueSync(table, operation, payload, options?.matchColumn);
    return;
  }

  try {
    await executeSync(table, operation, payload, options?.matchColumn);
  } catch (error) {
    logger.warn(`[sync] ${operation} ${table} failed, queuing:`, error);
    await queueSync(table, operation, payload, options?.matchColumn);
  }
}

async function executeSync(
  table: SyncTable,
  operation: SyncOperation,
  payload: Record<string, unknown>,
  matchColumn?: string
): Promise<void> {
  if (operation === "upsert") {
    const { error } = await supabase.from(table).upsert(payload);
    if (error) throw error;
    return;
  }

  const column = matchColumn ?? "id";
  const value = payload[column];
  if (value === undefined || value === null) {
    throw new Error(`Cannot delete from ${table}: missing ${column}`);
  }
  const { error } = await supabase.from(table).delete().eq(column, value);
  if (error) throw error;
}

async function queueSync(
  table: SyncTable,
  operation: SyncOperation,
  payload: Record<string, unknown>,
  matchColumn?: string
): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    const queue: QueuedSyncOperation[] = existing ? JSON.parse(existing) : [];
    queue.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      table,
      operation,
      payload,
      matchColumn,
      queuedAt: Date.now(),
    });
    if (queue.length > MAX_QUEUE_SIZE) {
      queue.splice(0, queue.length - MAX_QUEUE_SIZE);
    }
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    logger.error("[sync] Failed to enqueue operation:", error);
  }
}

export async function drainSyncQueue(): Promise<void> {
  if (!isSupabaseConfigured || draining) return;
  draining = true;

  try {
    const existing = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (!existing) return;

    const queue: QueuedSyncOperation[] = JSON.parse(existing);
    if (queue.length === 0) return;

    const stillFailing: QueuedSyncOperation[] = [];
    for (const op of queue) {
      try {
        await executeSync(op.table, op.operation, op.payload, op.matchColumn);
      } catch (error) {
        logger.warn(`[sync] Drain ${op.operation} ${op.table} failed:`, error);
        stillFailing.push(op);
      }
    }

    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(stillFailing));
  } catch (error) {
    logger.error("[sync] Drain failed:", error);
  } finally {
    draining = false;
  }
}

export function registerSyncQueueDrain(): () => void {
  if (!isSupabaseConfigured) return () => {};
  const subscription = NetInfo.addEventListener((state) => {
    if (state.isConnected) drainSyncQueue();
  });
  return subscription;
}

export async function getQueueDepth(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return 0;
    return (JSON.parse(raw) as QueuedSyncOperation[]).length;
  } catch {
    return 0;
  }
}
