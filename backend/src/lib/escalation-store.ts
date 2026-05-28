import { Database } from "bun:sqlite";
import path from "path";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const DB_PATH = path.join(import.meta.dir, "../../data/escalation.db");

// Ensure data directory exists
import { mkdirSync } from "fs";
mkdirSync(path.dirname(DB_PATH), { recursive: true });

// ---------------------------------------------------------------------------
// Field-level encryption (AES-256-GCM) for user_name and contacts columns.
// Key is loaded from DB_ENCRYPTION_KEY at module load; missing/malformed key
// throws immediately so the process exits before serving any request.
// ---------------------------------------------------------------------------
const ENCRYPTION_VERSION = "v1";
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function loadEncryptionKey(): Buffer {
  const raw = process.env.DB_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "DB_ENCRYPTION_KEY is required. Generate one with: openssl rand -hex 32"
    );
  }
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(
      "DB_ENCRYPTION_KEY must be 64 hex characters (32 bytes / 256 bits). Generate one with: openssl rand -hex 32"
    );
  }
  return Buffer.from(raw, "hex");
}

const ENCRYPTION_KEY = loadEncryptionKey();

function encryptField(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const packed = Buffer.concat([iv, authTag, ciphertext]).toString("base64");
  return `${ENCRYPTION_VERSION}:${packed}`;
}

function decryptField(stored: string): string {
  // Transparent passthrough for rows written before encryption was added.
  // Such rows expire via the 24h cleanup; no auto-rewrite on read.
  if (!stored.startsWith(`${ENCRYPTION_VERSION}:`)) {
    return stored;
  }
  const packed = Buffer.from(stored.slice(ENCRYPTION_VERSION.length + 1), "base64");
  const iv = packed.subarray(0, IV_BYTES);
  const authTag = packed.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
  const ciphertext = packed.subarray(IV_BYTES + AUTH_TAG_BYTES);
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

const db = new Database(DB_PATH, { create: true });

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS escalation_sessions (
    session_id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    contacts TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    ended_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS escalations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    escalation_id TEXT NOT NULL UNIQUE,
    session_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'cancelled', 'sent', 'failed')),
    latitude REAL,
    longitude REAL,
    created_at INTEGER NOT NULL,
    deadline_at INTEGER NOT NULL,
    cancelled_at INTEGER,
    sent_at INTEGER,
    failed_at INTEGER,
    error_message TEXT,
    FOREIGN KEY (session_id) REFERENCES escalation_sessions(session_id)
  );

  CREATE INDEX IF NOT EXISTS idx_escalations_status_deadline
    ON escalations(status, deadline_at);

  CREATE INDEX IF NOT EXISTS idx_escalations_session
    ON escalations(session_id);
`);

export interface EscalationContact {
  name: string;
  phone: string;
}

export interface EscalationSession {
  sessionId: string;
  userName: string;
  contacts: EscalationContact[];
  createdAt: number;
  endedAt: number | null;
}

export interface Escalation {
  id: number;
  escalationId: string;
  sessionId: string;
  idempotencyKey: string;
  status: "pending" | "cancelled" | "sent" | "failed";
  latitude: number | null;
  longitude: number | null;
  createdAt: number;
  deadlineAt: number;
  cancelledAt: number | null;
  sentAt: number | null;
  failedAt: number | null;
  errorMessage: string | null;
}

const ESCALATION_DEADLINE_MS = 30_000;

const stmts = {
  upsertSession: db.prepare(
    `INSERT INTO escalation_sessions (session_id, user_name, contacts, created_at)
     VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(session_id) DO UPDATE SET
       user_name = excluded.user_name,
       contacts = excluded.contacts,
       ended_at = NULL`
  ),

  getSession: db.prepare(
    `SELECT session_id, user_name, contacts, created_at, ended_at
     FROM escalation_sessions WHERE session_id = ?1`
  ),

  endSession: db.prepare(
    `UPDATE escalation_sessions SET ended_at = ?2 WHERE session_id = ?1`
  ),

  insertEscalation: db.prepare(
    `INSERT INTO escalations (escalation_id, session_id, idempotency_key, status, latitude, longitude, created_at, deadline_at)
     VALUES (?1, ?2, ?3, 'pending', ?4, ?5, ?6, ?7)`
  ),

  getByIdempotencyKey: db.prepare(
    `SELECT * FROM escalations WHERE idempotency_key = ?1`
  ),

  getEscalation: db.prepare(
    `SELECT * FROM escalations WHERE escalation_id = ?1`
  ),

  cancelPending: db.prepare(
    `UPDATE escalations SET status = 'cancelled', cancelled_at = ?2
     WHERE escalation_id = ?1 AND status = 'pending'`
  ),

  cancelPendingBySession: db.prepare(
    `UPDATE escalations SET status = 'cancelled', cancelled_at = ?2
     WHERE session_id = ?1 AND status = 'pending'`
  ),

  markSent: db.prepare(
    `UPDATE escalations SET status = 'sent', sent_at = ?2
     WHERE id = ?1 AND status = 'pending'`
  ),

  markFailed: db.prepare(
    `UPDATE escalations SET status = 'failed', failed_at = ?2, error_message = ?3
     WHERE id = ?1 AND status = 'pending'`
  ),

  getPendingPastDeadline: db.prepare(
    `SELECT e.*, s.user_name, s.contacts AS session_contacts
     FROM escalations e
     JOIN escalation_sessions s ON e.session_id = s.session_id
     WHERE e.status = 'pending' AND e.deadline_at <= ?1
     LIMIT 50`
  ),

  getActiveEscalation: db.prepare(
    `SELECT * FROM escalations
     WHERE session_id = ?1 AND status = 'pending'
     ORDER BY created_at DESC LIMIT 1`
  ),

  cleanupOldSessions: db.prepare(
    `DELETE FROM escalation_sessions
     WHERE ended_at IS NOT NULL AND ended_at < ?1`
  ),

  cleanupOldEscalations: db.prepare(
    `DELETE FROM escalations
     WHERE status IN ('cancelled', 'sent', 'failed') AND created_at < ?1`
  ),
};

export function registerSession(
  sessionId: string,
  userName: string,
  contacts: EscalationContact[]
): void {
  stmts.upsertSession.run(
    sessionId,
    encryptField(userName),
    encryptField(JSON.stringify(contacts)),
    Date.now()
  );
}

export function getSession(sessionId: string): EscalationSession | null {
  const row = stmts.getSession.get(sessionId) as any;
  if (!row) return null;
  return {
    sessionId: row.session_id,
    userName: decryptField(row.user_name),
    contacts: JSON.parse(decryptField(row.contacts)),
    createdAt: row.created_at,
    endedAt: row.ended_at,
  };
}

export function endSession(sessionId: string): void {
  const now = Date.now();
  stmts.cancelPendingBySession.run(sessionId, now);
  stmts.endSession.run(sessionId, now);
}

export interface CreateEscalationResult {
  created: boolean;
  escalation: Escalation;
}

export function createEscalation(
  sessionId: string,
  idempotencyKey: string,
  latitude: number | null,
  longitude: number | null
): CreateEscalationResult {
  const existing = stmts.getByIdempotencyKey.get(idempotencyKey) as any;
  if (existing) {
    return { created: false, escalation: rowToEscalation(existing) };
  }

  const now = Date.now();
  const escalationId = `esc_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const deadlineAt = now + ESCALATION_DEADLINE_MS;

  stmts.insertEscalation.run(
    escalationId,
    sessionId,
    idempotencyKey,
    latitude,
    longitude,
    now,
    deadlineAt
  );

  const row = stmts.getByIdempotencyKey.get(idempotencyKey) as any;
  return { created: true, escalation: rowToEscalation(row) };
}

export function cancelEscalation(escalationId: string): boolean {
  const result = stmts.cancelPending.run(escalationId, Date.now());
  return result.changes > 0;
}

export function cancelActiveEscalation(sessionId: string): boolean {
  const result = stmts.cancelPendingBySession.run(sessionId, Date.now());
  return result.changes > 0;
}

export function getActiveEscalation(sessionId: string): Escalation | null {
  const row = stmts.getActiveEscalation.get(sessionId) as any;
  if (!row) return null;
  return rowToEscalation(row);
}

export interface PendingEscalationWithSession {
  escalation: Escalation;
  userName: string;
  contacts: EscalationContact[];
}

export function getPendingPastDeadline(): PendingEscalationWithSession[] {
  const now = Date.now();
  const rows = stmts.getPendingPastDeadline.all(now) as any[];
  return rows.map((row) => ({
    escalation: rowToEscalation(row),
    userName: decryptField(row.user_name),
    contacts: JSON.parse(decryptField(row.session_contacts)),
  }));
}

export function markEscalationSent(id: number): boolean {
  const result = stmts.markSent.run(id, Date.now());
  return result.changes > 0;
}

export function markEscalationFailed(id: number, errorMessage: string): boolean {
  const result = stmts.markFailed.run(id, Date.now(), errorMessage);
  return result.changes > 0;
}

export function cleanup(): void {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  stmts.cleanupOldSessions.run(oneDayAgo);
  stmts.cleanupOldEscalations.run(oneDayAgo);
}

function rowToEscalation(row: any): Escalation {
  return {
    id: row.id,
    escalationId: row.escalation_id,
    sessionId: row.session_id,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    deadlineAt: row.deadline_at,
    cancelledAt: row.cancelled_at,
    sentAt: row.sent_at,
    failedAt: row.failed_at,
    errorMessage: row.error_message,
  };
}
