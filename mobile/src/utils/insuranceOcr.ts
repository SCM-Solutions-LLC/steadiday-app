import { analyzeImageWithAI } from "../api/openai";
import * as FileSystem from 'expo-file-system/legacy';
import { logger } from "./logger";

interface ExtractedInsuranceData {
  providerName?: string;
  memberId?: string;
  groupNumber?: string;
  policyHolder?: string;
}

export async function extractInsuranceData(imageUri: string): Promise<ExtractedInsuranceData> {
  try {
    // Read the image file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const prompt = `Extract the following information from this insurance card image. Return ONLY a JSON object with these fields (use null if not found):
{
  "providerName": "insurance company name",
  "memberId": "member/subscriber ID number",
  "groupNumber": "group number",
  "policyHolder": "name of policy holder/subscriber"
}

Important: Return ONLY the JSON object, no additional text or explanation.`;

    // Use the backend proxy for image analysis
    const content = await analyzeImageWithAI(base64, prompt, 30000);

    if (!content) {
      throw new Error("No response from OCR");
    }

    // Clean the response - remove markdown code blocks if present
    let cleanedContent = content.trim();

    // Remove markdown code block formatting if present
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    // Parse the JSON response
    const parsed = JSON.parse(cleanedContent);

    // Clean up the extracted data
    return {
      providerName: parsed.providerName || undefined,
      memberId: parsed.memberId || undefined,
      groupNumber: parsed.groupNumber || undefined,
      policyHolder: parsed.policyHolder || undefined,
    };
  } catch (error) {
    logger.error("Error extracting insurance data:", error);
    throw error;
  }
}
