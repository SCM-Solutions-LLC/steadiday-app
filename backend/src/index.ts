import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { sampleRouter } from "./routes/sample";
import { aiRouter } from "./routes/ai";
import { emergencyRouter } from "./routes/emergency";
import { logger } from "hono/logger";

const app = new Hono();

// CORS middleware - validates origin against allowlist
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
];

app.use(
  "/api/emergency/*",
  cors({
    origin: () => "*",
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

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// --- Body size limit middleware (15 MB) ---
const MAX_BODY_SIZE = 15 * 1024 * 1024; // 15 MB in bytes

app.use("/api/*", async (c, next) => {
  const contentLength = c.req.header("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!Number.isNaN(size) && size > MAX_BODY_SIZE) {
      return c.json({ error: "Request too large" }, 413);
    }
  }
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

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/ai", aiRouter);
app.route("/api/emergency", emergencyRouter);

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
