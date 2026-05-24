import { Hono } from "hono";
import OpenAI from "openai";
import { z } from "zod";

const aiRouter = new Hono();

// Timeout constant
const AI_TIMEOUT_MS = 60000;

// Centralized model for image analysis — use a low-cost vision model
const IMAGE_ANALYSIS_MODEL = "gpt-4o-mini";

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

const messageContentSchema = z.union([
  z.string(),
  z.array(z.record(z.string(), z.unknown())),
]);

const messageSchema = z.object({
  role: z.string(),
  content: messageContentSchema,
});

const openaiChatSchema = z.object({
  messages: z.array(messageSchema).nonempty("Messages array cannot be empty"),
  model: z
    .enum(["gpt-4o-mini", "gpt-4.1-mini"])
    .default("gpt-4o-mini"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().max(4096).default(2048),
});

const grokChatSchema = z.object({
  messages: z.array(messageSchema).nonempty("Messages array cannot be empty"),
  model: z
    .enum(["grok-3-beta", "grok-3-latest", "grok-3-fast-latest", "grok-3-mini-latest"])
    .default("grok-3-beta"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().max(4096).default(2048),
});

const imageAnalyzeSchema = z.object({
  base64Image: z.string().max(7_000_000, "Image too large (max ~5MB)"),
  prompt: z.string().min(1, "Prompt is required").max(2000, "Prompt too long (max 2000 chars)"),
  timeoutMs: z.number().min(5000).max(60000).default(30000),
});

const transcribeModelSchema = z.enum(["gpt-4o-transcribe", "whisper-1"]);
const transcribeLanguageSchema = z.string().length(2, "Language must be a 2-letter code");

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Simple API key authentication for all AI routes
aiRouter.use("*", async (c, next) => {
  const expectedKey = process.env.APP_CLIENT_KEY;
  if (!expectedKey) {
    return c.json({ error: "AI service not available" }, 503);
  }
  const clientKey = c.req.header("X-App-Key");
  if (clientKey !== expectedKey) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

// Initialize OpenAI client — returns null when the key is not configured
const getOpenAIClient = (): OpenAI | null => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

// Initialize Grok client — returns null when the key is not configured
const getGrokClient = (): OpenAI | null => {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: "https://api.x.ai/v1",
  });
};

/**
 * POST /chat - OpenAI chat completions
 * Accepts: { messages, model?, temperature?, maxTokens? }
 */
aiRouter.post("/chat", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = openaiChatSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message || "Invalid request body" }, 400);
    }

    const { messages, model, temperature, maxTokens } = parsed.data;
    const client = getOpenAIClient();
    if (!client) {
      return c.json({ error: "AI service not available" }, 503);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const response = await client.chat.completions.create(
        {
          model,
          messages: messages as any,
          temperature,
          max_tokens: maxTokens,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      return c.json({
        content: response.choices[0]?.message?.content || "",
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      });
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        return c.json({ error: "Request timed out" }, 408);
      }
      throw error;
    }
  } catch (error) {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), route: "/api/ai/chat", status: 500, error: error instanceof Error ? error.name : "unknown" }));
    return c.json({ error: "AI request failed" }, 500);
  }
});

/**
 * POST /chat/grok - Grok chat completions
 * Accepts: { messages, model?, temperature?, maxTokens? }
 */
aiRouter.post("/chat/grok", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = grokChatSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message || "Invalid request body" }, 400);
    }

    const { messages, model, temperature, maxTokens } = parsed.data;
    const client = getGrokClient();
    if (!client) {
      return c.json({ error: "AI service not available" }, 503);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const response = await client.chat.completions.create(
        {
          model,
          messages: messages as any,
          temperature,
          max_tokens: maxTokens,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      return c.json({
        content: response.choices[0]?.message?.content || "",
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      });
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        return c.json({ error: "Request timed out" }, 408);
      }
      throw error;
    }
  } catch (error) {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), route: "/api/ai/chat/grok", status: 500, error: error instanceof Error ? error.name : "unknown" }));
    return c.json({ error: "AI request failed" }, 500);
  }
});

/**
 * POST /image/analyze - Analyze image with OpenAI vision
 * Accepts: { base64Image, prompt, timeoutMs? }
 */
aiRouter.post("/image/analyze", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = imageAnalyzeSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message || "Invalid request body" }, 400);
    }

    const { base64Image, prompt, timeoutMs } = parsed.data;
    const client = getOpenAIClient();
    if (!client) {
      return c.json({ error: "AI service not available" }, 503);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.min(timeoutMs, AI_TIMEOUT_MS));

    try {
      const response = await client.chat.completions.create(
        {
          model: IMAGE_ANALYSIS_MODEL,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      return c.json({
        content: response.choices[0]?.message?.content || "",
      });
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        return c.json({ error: "Image analysis timed out" }, 408);
      }
      throw error;
    }
  } catch (error) {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), route: "/api/ai/image/analyze", status: 500, error: error instanceof Error ? error.name : "unknown" }));
    return c.json({ error: "Image analysis failed" }, 500);
  }
});

/**
 * POST /audio/transcribe - Transcribe audio with OpenAI Whisper
 * Accepts: form data with audio file
 */
aiRouter.post("/audio/transcribe", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const rawModel = (formData.get("model") as string) || "gpt-4o-transcribe";
    const rawLanguage = (formData.get("language") as string) || "en";

    if (!file || !(file instanceof File)) {
      return c.json({ error: "Audio file is required" }, 400);
    }

    // Validate model
    const modelResult = transcribeModelSchema.safeParse(rawModel);
    if (!modelResult.success) {
      return c.json({ error: modelResult.error.issues[0]?.message || "Invalid model" }, 400);
    }

    // Validate language
    const langResult = transcribeLanguageSchema.safeParse(rawLanguage);
    if (!langResult.success) {
      return c.json({ error: langResult.error.issues[0]?.message || "Invalid language code" }, 400);
    }

    const model = modelResult.data;
    const language = langResult.data;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return c.json({ error: "AI service not available" }, 503);
    }

    // Forward to OpenAI transcription API
    const openaiFormData = new FormData();
    openaiFormData.append("file", file);
    openaiFormData.append("model", model);
    openaiFormData.append("language", language);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: openaiFormData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(JSON.stringify({ timestamp: new Date().toISOString(), route: "/api/ai/audio/transcribe", status: response.status, error: "upstream_error" }));
        return c.json({ error: "Transcription failed" }, 500);
      }

      const result = (await response.json()) as { text: string };
      return c.json({ text: result.text });
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        return c.json({ error: "Transcription timed out" }, 408);
      }
      throw error;
    }
  } catch (error) {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), route: "/api/ai/audio/transcribe", status: 500, error: error instanceof Error ? error.name : "unknown" }));
    return c.json({ error: "Transcription failed" }, 500);
  }
});

export { aiRouter };
