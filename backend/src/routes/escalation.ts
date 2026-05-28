import { Hono } from "hono";
import { z } from "zod";
import {
  registerSession,
  getSession,
  endSession,
  createEscalation,
  cancelEscalation,
  cancelActiveEscalation,
  getActiveEscalation,
} from "../lib/escalation-store";

const escalationRouter = new Hono();

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone must be E.164 format"),
});

function log(level: "info" | "warn" | "error", event: string, data: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "escalation-api",
    event,
    ...data,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

function getIp(c: any): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

function authenticate(c: any): boolean {
  const clientKey = c.req.header("X-App-Key");
  const expectedKey = process.env.APP_CLIENT_KEY;
  return !!expectedKey && clientKey === expectedKey;
}

// POST /register-session
escalationRouter.post("/register-session", async (c) => {
  const ip = getIp(c);

  if (!authenticate(c)) {
    log("warn", "auth_failed", { ip, endpoint: "register-session" });
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const schema = z.object({
    sessionId: z.string().min(1).max(100),
    userName: z.string().min(1).max(100),
    contacts: z.array(contactSchema).max(5),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    log("warn", "validation_failed", { ip, fields: parsed.error.issues.map((i) => i.path.join(".")) });
    return c.json({ error: "Invalid request" }, 400);
  }

  const { sessionId, userName, contacts } = parsed.data;

  try {
    registerSession(sessionId, userName, contacts);
    log("info", "session_registered", { ip, sessionId, contactCount: contacts.length });
    return c.json({ success: true, sessionId });
  } catch (err: any) {
    log("error", "session_register_failed", { ip, sessionId, error: err?.message });
    return c.json({ error: "Internal error" }, 500);
  }
});

// POST /fall-alert
escalationRouter.post("/fall-alert", async (c) => {
  const ip = getIp(c);

  if (!authenticate(c)) {
    log("warn", "auth_failed", { ip, endpoint: "fall-alert" });
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const schema = z.object({
    sessionId: z.string().min(1).max(100),
    idempotencyKey: z.string().min(1).max(200),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    log("warn", "validation_failed", { ip, fields: parsed.error.issues.map((i) => i.path.join(".")) });
    return c.json({ error: "Invalid request" }, 400);
  }

  const { sessionId, idempotencyKey, latitude, longitude } = parsed.data;

  const session = getSession(sessionId);
  if (!session) {
    log("warn", "session_not_found", { ip, sessionId });
    return c.json({ error: "Session not found" }, 404);
  }

  if (session.endedAt) {
    log("warn", "session_ended", { ip, sessionId });
    return c.json({ error: "Session has ended" }, 410);
  }

  try {
    const { created, escalation } = createEscalation(
      sessionId,
      idempotencyKey,
      latitude ?? null,
      longitude ?? null
    );

    log("info", "fall_alert_received", {
      ip,
      sessionId,
      escalationId: escalation.escalationId,
      created,
      deadlineAt: escalation.deadlineAt,
      latitude: latitude != null ? Math.round(latitude * 1000) / 1000 : null,
      longitude: longitude != null ? Math.round(longitude * 1000) / 1000 : null,
    });

    return c.json({
      success: true,
      escalationId: escalation.escalationId,
      deadlineAt: escalation.deadlineAt,
      status: escalation.status,
      created,
    });
  } catch (err: any) {
    log("error", "fall_alert_failed", { ip, sessionId, error: err?.message });
    return c.json({ error: "Internal error" }, 500);
  }
});

// POST /fall-cancel
escalationRouter.post("/fall-cancel", async (c) => {
  const ip = getIp(c);

  if (!authenticate(c)) {
    log("warn", "auth_failed", { ip, endpoint: "fall-cancel" });
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const schema = z.object({
    sessionId: z.string().min(1).max(100),
    escalationId: z.string().min(1).max(200).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const { sessionId, escalationId } = parsed.data;

  try {
    let cancelled: boolean;
    if (escalationId) {
      cancelled = cancelEscalation(escalationId);
    } else {
      cancelled = cancelActiveEscalation(sessionId);
    }

    log("info", "fall_cancel", {
      ip,
      sessionId,
      escalationId: escalationId ?? "all_pending",
      cancelled,
    });

    return c.json({ success: true, cancelled });
  } catch (err: any) {
    log("error", "fall_cancel_failed", { ip, sessionId, error: err?.message });
    return c.json({ error: "Internal error" }, 500);
  }
});

// POST /end-session
escalationRouter.post("/end-session", async (c) => {
  const ip = getIp(c);

  if (!authenticate(c)) {
    log("warn", "auth_failed", { ip, endpoint: "end-session" });
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const schema = z.object({
    sessionId: z.string().min(1).max(100),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const { sessionId } = parsed.data;

  try {
    endSession(sessionId);
    log("info", "session_ended", { ip, sessionId });
    return c.json({ success: true });
  } catch (err: any) {
    log("error", "session_end_failed", { ip, sessionId, error: err?.message });
    return c.json({ error: "Internal error" }, 500);
  }
});

// GET /status — get active escalation for a session (used by JS to sync countdown)
escalationRouter.get("/status/:sessionId", async (c) => {
  if (!authenticate(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("sessionId");
  const session = getSession(sessionId);
  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  const active = getActiveEscalation(sessionId);
  if (!active) {
    return c.json({ active: false });
  }

  return c.json({
    active: true,
    escalationId: active.escalationId,
    status: active.status,
    deadlineAt: active.deadlineAt,
    createdAt: active.createdAt,
    remainingMs: Math.max(0, active.deadlineAt - Date.now()),
  });
});

export { escalationRouter };
