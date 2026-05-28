import * as FileSystem from "expo-file-system";

import { logger } from "../utils/logger";
import { prepareImageForVision } from "../utils/prepareImageForVision";
import { analyzeImageWithAI } from "./openai";

const VISION_MODEL = "gpt-4o";
const VISION_DETAIL = "high" as const;

export interface ExtractedMedication {
  medication_name: string | null;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  prescriber: string | null;
  pharmacy: string | null;
  refills: string | null;
  quantity: string | null;
}

export interface ExtractedInsuranceCard {
  plan_name: string | null;
  insurance_company: string | null;
  member_id: string | null;
  group_number: string | null;
  payer_id: string | null;
  rx_bin: string | null;
  rx_pcn: string | null;
  rx_group: string | null;
  member_name: string | null;
  effective_date: string | null;
}

const EMPTY_MEDICATION: ExtractedMedication = {
  medication_name: null,
  dosage: null,
  frequency: null,
  instructions: null,
  prescriber: null,
  pharmacy: null,
  refills: null,
  quantity: null,
};

const EMPTY_INSURANCE: ExtractedInsuranceCard = {
  plan_name: null,
  insurance_company: null,
  member_id: null,
  group_number: null,
  payer_id: null,
  rx_bin: null,
  rx_pcn: null,
  rx_group: null,
  member_name: null,
  effective_date: null,
};

const MEDICATION_PROMPT = `You are a precise medication label parser. Return ONLY valid JSON — no markdown, no code blocks, no explanation. Use null for any field not clearly visible.

Extract medication information. Return exactly:
{
  "medication_name": "full drug name (brand or generic)",
  "dosage": "strength and unit (e.g. 10mg)",
  "frequency": "how often (e.g. twice daily)",
  "instructions": "special instructions or null",
  "prescriber": "doctor name or null",
  "pharmacy": "pharmacy name or null",
  "refills": "refills remaining or null",
  "quantity": "quantity dispensed or null"
}`;

const INSURANCE_PROMPT = `You are a precise insurance card parser. Return ONLY valid JSON — no markdown, no code blocks, no explanation. Use null for any field not clearly visible.

Extract insurance information. Return exactly:
{
  "plan_name": "insurance plan name",
  "insurance_company": "company name",
  "member_id": "member or subscriber ID",
  "group_number": "group number",
  "payer_id": "payer ID (usually 5 digits)",
  "rx_bin": "RX BIN number",
  "rx_pcn": "RX PCN number",
  "rx_group": "RX group number",
  "member_name": "insured member name",
  "effective_date": "MM/DD/YYYY or null"
}`;

function parseJsonStrict<T>(raw: string, fallback: T): T {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") return parsed as T;
  } catch {
    // fall through
  }
  return fallback;
}

async function safeDelete(uri: string | null | undefined): Promise<void> {
  if (!uri) return;
  if (!uri.startsWith("file://")) return; // ph:// from photo library — not a temp file
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // best-effort cleanup
  }
}

/**
 * Extract medication info from a photo URI.
 *
 * Always deletes BOTH the source photo URI and the preprocessed temp file in
 * a `finally` block — no photo ever persists past this call. The source URI
 * is only valid during the awaited call (callers that show a preview should
 * use the URI directly; the file is guaranteed to exist until the promise
 * settles, then it's gone).
 */
export async function extractMedicationFromPhoto(
  photoUri: string
): Promise<ExtractedMedication> {
  let preparedUri: string | null = null;
  try {
    const prepared = await prepareImageForVision(photoUri);
    preparedUri = prepared.uri;

    const raw = await analyzeImageWithAI(
      prepared.base64,
      MEDICATION_PROMPT,
      30000,
      { model: VISION_MODEL, detail: VISION_DETAIL }
    );

    return parseJsonStrict<ExtractedMedication>(raw, EMPTY_MEDICATION);
  } catch (error) {
    logger.error("[vision] Medication extraction failed:", error);
    return EMPTY_MEDICATION;
  } finally {
    await Promise.allSettled([
      safeDelete(photoUri),
      preparedUri && preparedUri !== photoUri ? safeDelete(preparedUri) : Promise.resolve(),
    ]);
  }
}

/**
 * Extract insurance card fields from a photo URI.
 * Same cleanup semantics as extractMedicationFromPhoto — always deletes
 * source + preprocessed temp files in `finally`.
 */
export async function extractInsuranceFromPhoto(
  photoUri: string
): Promise<ExtractedInsuranceCard> {
  let preparedUri: string | null = null;
  try {
    const prepared = await prepareImageForVision(photoUri);
    preparedUri = prepared.uri;

    const raw = await analyzeImageWithAI(
      prepared.base64,
      INSURANCE_PROMPT,
      30000,
      { model: VISION_MODEL, detail: VISION_DETAIL }
    );

    return parseJsonStrict<ExtractedInsuranceCard>(raw, EMPTY_INSURANCE);
  } catch (error) {
    logger.error("[vision] Insurance extraction failed:", error);
    return EMPTY_INSURANCE;
  } finally {
    await Promise.allSettled([
      safeDelete(photoUri),
      preparedUri && preparedUri !== photoUri ? safeDelete(preparedUri) : Promise.resolve(),
    ]);
  }
}

/**
 * Returns true if the extracted payload has at least one non-null field.
 */
export function hasAnyExtractedField(
  payload: ExtractedMedication | ExtractedInsuranceCard
): boolean {
  return Object.values(payload).some(
    (v) => v !== null && v !== undefined && String(v).trim() !== ""
  );
}
