/*
IMPORTANT NOTICE: DO NOT REMOVE
This module provides functions to call the Grok API through the backend proxy.
All AI calls are routed through the backend to keep API keys secure.

grok-3-latest
grok-3-fast-latest
grok-3-mini-latest
*/
import { config } from "../config/env";
import { logger } from "../utils/logger";
import { AIMessage, AIResponse, AIRequestOptions } from "../types/ai";
import { APP_CLIENT_KEY } from "./constants";

/**
 * Call Grok chat completions through the backend proxy
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const callGrok = async (
  messages: AIMessage[],
  options?: AIRequestOptions
): Promise<AIResponse> => {
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/ai/chat/grok`, {
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
    logger.error("Grok API Error:", error);
    throw error;
  }
};
