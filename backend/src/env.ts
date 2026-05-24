import { z } from "zod";
import { readFileSync } from "fs";

// Explicitly load .env so values are available even after hot-reload
try {
  const envText = readFileSync(".env", "utf8");
  for (const line of envText.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && match[1] && match[2] !== undefined) {
      const key = match[1];
      const value = match[2];
      if (process.env[key] === undefined) {
        process.env[key] = value.trim();
      }
    }
  }
} catch {
  // .env file not present; rely on environment variables set at process start
}

/**
 * Environment variable schema using Zod
 * This ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().optional().default("3000"),
  NODE_ENV: z.string().optional(),
  BACKEND_URL: z.url("BACKEND_URL must be a valid URL").default("http://localhost:3000"), // Set via the Vibecode enviroment at run-time

  // AI API Keys (server-side only - NOT exposed to client)
  // Optional: AI routes return 503 when these are absent
  OPENAI_API_KEY: z.string().optional(),
  GROK_API_KEY: z.string().optional(),

  // Client authentication key for AI routes
  // Optional: AI routes return 503 when absent
  APP_CLIENT_KEY: z.string().optional(),

  // Twilio SMS (for emergency alerts — optional; SMS endpoints return 503 when absent)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  EMERGENCY_API_SECRET: z.string().optional(),
});

/**
 * Validate and parse environment variables
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    console.log("✅ Environment variables validated successfully");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment variable validation failed:");
      error.issues.forEach((err: any) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      console.error("\nPlease check your .env file and ensure all required variables are set.");
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validated and typed environment variables
 */
export const env = validateEnv();

/**
 * Type of the validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Extend process.env with our environment variables
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line import/namespace
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
