/*
IMPORTANT NOTICE: DO NOT REMOVE
This module provides functions to call the OpenAI API through the backend proxy.
All AI calls are routed through the backend to keep API keys secure.

valid model names:
gpt-4.1-2025-04-14
o4-mini-2025-04-16
gpt-4o-2024-11-20
*/
import { config } from "../config/env";
import { logger } from "../utils/logger";
import { AIMessage, AIResponse, AIRequestOptions } from "../types/ai";
import { APP_CLIENT_KEY } from "./constants";

/**
 * Call OpenAI chat completions through the backend proxy
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const callOpenAI = async (
  messages: AIMessage[],
  options?: AIRequestOptions
): Promise<AIResponse> => {
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Key": APP_CLIENT_KEY,
      },
      body: JSON.stringify({
        messages,
        model: options?.model,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "AI request failed");
    }

    return response.json();
  } catch (error) {
    logger.error("OpenAI API Error:", error);
    throw error;
  }
};

/**
 * Analyze an image using OpenAI's vision model through the backend proxy
 * @param base64Image - The base64 encoded image string
 * @param prompt - The prompt/question about the image
 * @param timeoutMs - Optional timeout in milliseconds (default: 30000)
 * @returns The AI's analysis of the image
 */
export const analyzeImageWithAI = async (
  base64Image: string,
  prompt: string,
  timeoutMs: number = 30000
): Promise<string> => {
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/ai/image/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Key": APP_CLIENT_KEY,
      },
      body: JSON.stringify({ base64Image, prompt, timeoutMs }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Image analysis failed");
    }

    const result = await response.json();
    return result.content || "";
  } catch (error) {
    logger.error("Image Analysis Error:", error);
    throw error;
  }
};
