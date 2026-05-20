/**
 * Analytics Service — Firebase-backed.
 * All exports preserve their original signatures for backward compatibility.
 */

import { logEvent, setUserProperty as fbSetUserProperty, logScreenView } from "./firebase";
import { secureLog } from "./secureLogger";
import { isDevelopment } from "../config/env";

export const EVENTS = {
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_COMPLETED: "onboarding_completed",
  ONBOARDING_SKIPPED: "onboarding_skipped",
  TASK_CREATED: "task_created",
  TASK_COMPLETED: "task_completed",
  TASK_DELETED: "task_deleted",
  MEDICATION_ADDED: "medication_added",
  MEDICATION_TAKEN: "medication_taken",
  MEDICATION_SKIPPED: "medication_skipped",
  MEDICATION_DELETED: "medication_deleted",
  HEALTH_METRIC_LOGGED: "health_metric_logged",
  APPLE_HEALTH_CONNECTED: "apple_health_connected",
  APPLE_HEALTH_SYNCED: "apple_health_synced",
  SOS_ACTIVATED: "sos_activated",
  EMERGENCY_CONTACT_CALLED: "emergency_contact_called",
  TOOL_USED: "tool_used",
  TEXT_SIZE_CHANGED: "text_size_changed",
  THEME_CHANGED: "theme_changed",
  NOTIFICATIONS_TOGGLED: "notifications_toggled",
  USER_PROFILE_SURVEY: "user_profile_survey",
  PROFILE_Q1_ANSWERED: "profile_q1_answered",
  PROFILE_Q2_ANSWERED: "profile_q2_answered",
  PROFILE_Q3_ANSWERED: "profile_q3_answered",
  FOOD_LOGGED: "food_logged",
  WATER_LOGGED: "water_logged",
  CONTACT_ADDED: "contact_added",
  CONTACT_CALLED: "contact_called",
  CONTACT_MESSAGED: "contact_messaged",
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * Firebase Analytics auto-fires first_open and session_start. This stays
 * for backward compatibility with existing callers.
 */
export async function trackAppOpen(): Promise<void> {
  // No-op — Firebase handles first_open and session_start automatically.
}

function _sanitizeParams(
  properties?: Record<string, any>
): Record<string, string | number> | undefined {
  if (!properties) return undefined;
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "number") {
      out[k] = v;
    } else if (typeof v === "boolean") {
      out[k] = v ? 1 : 0;
    } else {
      out[k] = String(v).substring(0, 100);
    }
  }
  return out;
}

export function trackEvent(name: string, properties?: Record<string, any>): void {
  if (isDevelopment()) {
    secureLog(`[Analytics] Event: ${name}`, properties);
  }
  void logEvent(name, _sanitizeParams(properties));
}

export function trackScreenView(screenName: string): void {
  if (isDevelopment()) {
    secureLog(`[Analytics] Screen View: ${screenName}`);
  }
  void logScreenView(screenName);
}

export function setUserProperty(name: string, value: any): void {
  if (isDevelopment()) {
    secureLog(`[Analytics] User Property: ${name}`, { value });
  }
  void fbSetUserProperty(
    name,
    value === null || value === undefined ? null : String(value)
  );
}

export function identifyUser(userId: string): void {
  // SteadiDay has no accounts. No-op.
  if (isDevelopment()) {
    secureLog(`[Analytics] identifyUser called but ignored (no accounts)`);
  }
}

export function resetAnalytics(): void {
  // SteadiDay has no logout. No-op.
  if (isDevelopment()) {
    secureLog("[Analytics] resetAnalytics called but ignored");
  }
}

export function trackTaskCompleted(taskId: string, hasReminder: boolean): void {
  trackEvent(EVENTS.TASK_COMPLETED, { has_reminder: hasReminder });
}

export function trackMedicationTaken(medicationId: string, onTime: boolean): void {
  trackEvent(EVENTS.MEDICATION_TAKEN, { on_time: onTime });
}

export function trackToolUsed(toolName: string): void {
  trackEvent(EVENTS.TOOL_USED, { tool_name: toolName });
}

export function trackSOSActivated(): void {
  trackEvent(EVENTS.SOS_ACTIVATED, { timestamp: Date.now() });
}

export async function trackProfileSurveyQuestion(
  questionEvent: string,
  params: Record<string, string>
): Promise<void> {
  await logEvent(questionEvent, _sanitizeParams(params));
}

export async function trackProfileSurveyComplete(params: {
  setup_role: string;
  source: string;
  motivation: string;
  status: "completed" | "skipped";
}): Promise<void> {
  await logEvent(EVENTS.USER_PROFILE_SURVEY, _sanitizeParams(params));
}
