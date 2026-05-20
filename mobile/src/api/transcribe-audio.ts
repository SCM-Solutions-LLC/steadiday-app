/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom audio transcription service that routes through the backend proxy.
All AI calls are routed through the backend to keep API keys secure.
*/

import { config } from "../config/env";
import { logger } from "../utils/logger";
import { APP_CLIENT_KEY } from "./constants";

/**
 * Transcribe an audio file
 * @param localAudioUri - The local URI of the audio file to transcribe. Obtained via the expo-av library.
 * @returns The text of the audio file
 */
export const transcribeAudio = async (localAudioUri: string) => {
  try {
    // Create FormData for the audio file
    const formData = new FormData();
    formData.append("file", {
      uri: localAudioUri,
      type: "audio/m4a",
      name: "recording.m4a",
    } as any);
    formData.append("model", "gpt-4o-transcribe");
    formData.append("language", "en");

    // Route through backend proxy instead of calling OpenAI directly
    const response = await fetch(`${config.apiBaseUrl}/api/ai/audio/transcribe`, {
      method: "POST",
      headers: {
        "X-App-Key": APP_CLIENT_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Transcription failed" }));
      throw new Error(error.error || "Transcription failed");
    }

    const result = await response.json();
    return result.text;
  } catch (error) {
    logger.error("Transcription error:", error);
    throw error;
  }
};
