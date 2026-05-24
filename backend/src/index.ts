import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { sampleRouter } from "./routes/sample";
import { aiRouter } from "./routes/ai";
import { emergencyRouter } from "./routes/emergency";
import { escalationRouter } from "./routes/escalation";
import { startEscalationWorker } from "./lib/escalation-worker";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

const app = new Hono();

// --- Security headers ---
app.use(
  "*",
  secureHeaders({
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    strictTransportSecurity: "max-age=31536000; includeSubDomains",
    contentSecurityPolicy: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  })
);

app.use("*", async (c, next) => {
  await next();
  c.res.headers.delete("x-powered-by");
});

// CORS middleware - validates origin against allowlist
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
];

const emergencyAllowedOrigins = [
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
];

app.use(
  "/api/emergency/*",
  cors({
    origin: (origin) => {
      if (!origin) return null;
      if (emergencyAllowedOrigins.some((re) => re.test(origin))) return origin;
      return null;
    },
    credentials: false,
  })
);

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// --- Emergency endpoint: reject unauthorized browser origins ---
app.use("/api/emergency/*", async (c, next) => {
  const origin = c.req.header("origin");
  if (origin && !emergencyAllowedOrigins.some((re) => re.test(origin))) {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
});

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// --- Emergency body size limit (10 KB) ---
const EMERGENCY_MAX_BODY_SIZE = 10 * 1024;

app.use("/api/emergency/*", async (c, next) => {
  const contentLength = c.req.header("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!Number.isNaN(size) && size > EMERGENCY_MAX_BODY_SIZE) {
      return c.json({ error: "Request too large" }, 413);
    }
  }
  await next();
});

// --- Image analysis body size limit (5 MB) ---
const IMAGE_ANALYZE_MAX_BODY_SIZE = 5 * 1024 * 1024;

app.use("/api/ai/image/*", async (c, next) => {
  const contentLength = c.req.header("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!Number.isNaN(size) && size > IMAGE_ANALYZE_MAX_BODY_SIZE) {
      return c.json({ error: "Request too large" }, 413);
    }
  }
  await next();
});

// --- Body size limit middleware (100 KB) ---
const MAX_BODY_SIZE = 100 * 1024; // 100 KB

app.use("/api/*", async (c, next) => {
  if (c.req.path.startsWith("/api/ai/image/")) {
    await next();
    return;
  }
  const contentLength = c.req.header("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!Number.isNaN(size) && size > MAX_BODY_SIZE) {
      return c.json({ error: "Request too large" }, 413);
    }
  }
  await next();
});

// --- Image analysis rate limiter (10 req / hour per IP) ---
const IMAGE_RATE_WINDOW_MS = 60 * 60 * 1000;
const IMAGE_RATE_MAX = 10;
const imageRateLimitMap = new Map<string, number[]>();

setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of imageRateLimitMap) {
    const valid = timestamps.filter((ts) => now - ts < IMAGE_RATE_WINDOW_MS);
    if (valid.length === 0) {
      imageRateLimitMap.delete(ip);
    } else {
      imageRateLimitMap.set(ip, valid);
    }
  }
}, 5 * 60 * 1000);

app.use("/api/ai/image/*", async (c, next) => {
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const timestamps = imageRateLimitMap.get(ip) ?? [];
  const recentTimestamps = timestamps.filter((ts) => now - ts < IMAGE_RATE_WINDOW_MS);

  if (recentTimestamps.length >= IMAGE_RATE_MAX) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  recentTimestamps.push(now);
  imageRateLimitMap.set(ip, recentTimestamps);

  await next();
});

// --- In-memory rate limiter for /api/ai/* routes (20 req/min per IP) ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const rateLimitMap = new Map<string, number[]>();

// Periodic cleanup of stale entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap) {
    const valid = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, valid);
    }
  }
}, CLEANUP_INTERVAL_MS);

app.use("/api/ai/*", async (c, next) => {
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];

  // Filter to only timestamps within the current window
  const recentTimestamps = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recentTimestamps.length >= RATE_LIMIT_MAX) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  recentTimestamps.push(now);
  rateLimitMap.set(ip, recentTimestamps);

  await next();
});

// --- Emergency rate limiter (5 req / 15 min per IP) ---
const EMERGENCY_RATE_WINDOW_MS = 15 * 60 * 1000;
const EMERGENCY_RATE_MAX = 20;
const emergencyRateLimitMap = new Map<string, number[]>();

setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of emergencyRateLimitMap) {
    const valid = timestamps.filter((ts) => now - ts < EMERGENCY_RATE_WINDOW_MS);
    if (valid.length === 0) {
      emergencyRateLimitMap.delete(ip);
    } else {
      emergencyRateLimitMap.set(ip, valid);
    }
  }
}, CLEANUP_INTERVAL_MS);

app.use("/api/emergency/*", async (c, next) => {
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const timestamps = emergencyRateLimitMap.get(ip) ?? [];
  const recentTimestamps = timestamps.filter((ts) => now - ts < EMERGENCY_RATE_WINDOW_MS);

  if (recentTimestamps.length >= EMERGENCY_RATE_MAX) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  recentTimestamps.push(now);
  emergencyRateLimitMap.set(ip, recentTimestamps);

  await next();
});

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/ai", aiRouter);
app.route("/api/emergency", emergencyRouter);
app.route("/api/emergency", escalationRouter);

// Start the escalation worker (polls for pending escalations past deadline)
startEscalationWorker();

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
