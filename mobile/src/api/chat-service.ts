/*
IMPORTANT NOTICE: DO NOT REMOVE
./src/api/chat-service.ts
If the user wants to use AI to generate text, answer questions, or analyze images you can use the functions defined in this file to communicate with the OpenAI and Grok APIs.
All AI calls are routed through the backend to keep API keys secure.
*/
import { AIMessage, AIRequestOptions, AIResponse } from "../types/ai";
import { callOpenAI, analyzeImageWithAI } from "./openai";
import { callGrok } from "./grok";
import { logger } from "../utils/logger";

/**
 * Get a text response from OpenAI
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const getOpenAITextResponse = async (messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse> => {
  try {
    const defaultModel = "gpt-4o"; //accepts images as well, use this for image analysis

    return await callOpenAI(messages, {
      model: options?.model || defaultModel,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens || 2048,
    });
  } catch (error) {
    logger.error("OpenAI API Error:", error);
    throw error;
  }
};

/**
 * Get a simple chat response from OpenAI
 * @param prompt - The prompt to send to the AI
 * @returns The response from the AI
 */
export const getOpenAIChatResponse = async (prompt: string): Promise<AIResponse> => {
  return await getOpenAITextResponse([{ role: "user", content: prompt }]);
};

/**
 * Get a text response from Grok
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const getGrokTextResponse = async (messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse> => {
  try {
    const defaultModel = "grok-3-beta";

    return await callGrok(messages, {
      model: options?.model || defaultModel,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens || 2048,
    });
  } catch (error) {
    logger.error("Grok API Error:", error);
    throw error;
  }
};

/**
 * Get a simple chat response from Grok
 * @param prompt - The prompt to send to the AI
 * @returns The response from the AI
 */
export const getGrokChatResponse = async (prompt: string): Promise<AIResponse> => {
  return await getGrokTextResponse([{ role: "user", content: prompt }]);
};

// Re-export the new function name for direct use
export { analyzeImageWithAI };
