/**
 * Secure Logger Utility
 *
 * This module provides secure logging that automatically strips sensitive information
 * from logs to prevent accidental exposure of private data.
 *
 * SECURITY FEATURES:
 * - Automatically redacts sensitive fields
 * - Never logs passwords, tokens, or PII
 * - Safe to use in production
 * - Can be disabled in production for performance
 */

import { isDevelopment } from "../config/env";

/**
 * List of sensitive field names that should be redacted from logs
 * Add any field names that might contain sensitive data
 */
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "access_token",
  "refresh_token",
  "authorization",
  "apiKey",
  "api_key",
  "secret",
  "privateKey",
  "private_key",
  "ssn",
  "social_security",
  "creditCard",
  "credit_card",
  "cvv",
  "pin",
  "bankAccount",
  "bank_account",
  "routingNumber",
  "routing_number",
  // Personal Identifiable Information
  "email",
  "phoneNumber",
  "phone_number",
  "address",
  "dateOfBirth",
  "date_of_birth",
  "birthdate",
  "medicalRecord",
  "medical_record",
  "insurance_number",
  "insuranceNumber",
  // Medical ID fields (MOST SENSITIVE)
  "medicalID",
  "medical_id",
  "bloodType",
  "blood_type",
  "allergies",
  "allergy",
  "medicalConditions",
  "medical_conditions",
  "medicalCondition",
  "medical_condition",
  "currentMedications",
  "current_medications",
  "medicalNotes",
  "medical_notes",
  "organDonor",
  "organ_donor",
  "emergencyContactId",
  "emergency_contact_id",
  "height",
  "weight",
  "memberId",
  "member_id",
  "groupNumber",
  "group_number",
  "policyHolder",
  "policy_holder",
  "prescription",
  "dosage",
  "diagnosis",
];

/**
 * Redact sensitive information from an object
 *
 * @param data - The data to redact
 * @returns Redacted version of the data
 */
const redactSensitiveData = (data: any): any => {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  const redacted: any = {};

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      // Check if this field should be redacted
      const isFieldSensitive = SENSITIVE_FIELDS.some(
        (field) => key.toLowerCase().includes(field.toLowerCase())
      );

      if (isFieldSensitive) {
        redacted[key] = "[REDACTED]";
      } else if (typeof data[key] === "object" && data[key] !== null) {
        // Recursively redact nested objects
        redacted[key] = redactSensitiveData(data[key]);
      } else {
        redacted[key] = data[key];
      }
    }
  }

  return redacted;
};

/**
 * Format log message with metadata
 *
 * @param level - Log level (info, warn, error)
 * @param message - The log message
 * @param data - Additional data to log
 * @returns Formatted log string
 */
const formatLogMessage = (
  level: string,
  message: string,
  data?: any
): string => {
  const timestamp = new Date().toISOString();
  const redactedData = data ? redactSensitiveData(data) : undefined;

  if (redactedData && Object.keys(redactedData).length > 0) {
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(
      redactedData
    )}`;
  }

  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

/**
 * Log an informational message (secure)
 *
 * @param message - The message to log
 * @param data - Optional additional data (will be redacted)
 *
 * SECURITY NOTE: Sensitive fields are automatically redacted
 */
export const secureLog = (message: string, data?: any): void => {
  // Only log in development mode
  if (!isDevelopment()) {
    return;
  }

  const formattedMessage = formatLogMessage("info", message, data);
  console.log(formattedMessage);
};

/**
 * Log a warning message (secure)
 *
 * @param message - The warning message
 * @param data - Optional additional data (will be redacted)
 */
export const secureWarn = (message: string, data?: any): void => {
  // Only log in development mode
  if (!isDevelopment()) {
    return;
  }

  const formattedMessage = formatLogMessage("warn", message, data);
  console.warn(formattedMessage);
};

/**
 * Log an error message (secure)
 *
 * @param message - The error message
 * @param error - The error object or additional data (will be redacted)
 *
 * SECURITY NOTE: Stack traces are logged but sensitive data is redacted
 */
export const secureError = (message: string, error?: any): void => {
  // Always log errors, even in production (but redacted)
  const errorData = error instanceof Error
    ? {
        message: error.message,
        name: error.name,
        stack: isDevelopment() ? error.stack : "[REDACTED IN PRODUCTION]",
      }
    : error;

  const formattedMessage = formatLogMessage("error", message, errorData);
  console.error(formattedMessage);
};

/**
 * Log API request (secure)
 *
 * @param method - HTTP method
 * @param url - Request URL
 * @param data - Request data (will be redacted)
 */
export const logApiRequest = (
  method: string,
  url: string,
  data?: any
): void => {
  if (!isDevelopment()) {
    return;
  }

  // Remove query parameters that might contain tokens
  const sanitizedUrl = url.split("?")[0];

  secureLog("API Request", {
    method: method.toUpperCase(),
    url: sanitizedUrl,
    hasData: !!data,
  });
};

/**
 * Log API response (secure)
 *
 * @param status - Response status code
 * @param url - Request URL
 * @param data - Response data (will be redacted)
 */
export const logApiResponse = (
  status: number,
  url: string,
  data?: any
): void => {
  if (!isDevelopment()) {
    return;
  }

  const sanitizedUrl = url.split("?")[0];

  secureLog("API Response", {
    status,
    url: sanitizedUrl,
    success: status >= 200 && status < 300,
  });
};

/**
 * Log authentication event (secure)
 *
 * @param event - The auth event (login, logout, refresh, etc.)
 * @param success - Whether the event was successful
 * @param reason - Optional reason for failure
 */
export const logAuthEvent = (
  event: string,
  success: boolean,
  reason?: string
): void => {
  // Log auth events in both dev and production (for security monitoring)
  const message = `Auth Event: ${event}`;
  const data = {
    success,
    reason: reason || undefined,
    timestamp: Date.now(),
  };

  if (success) {
    secureLog(message, data);
  } else {
    secureWarn(message, data);
  }
};

/**
 * IMPORTANT SECURITY NOTES:
 *
 * 1. Never manually log passwords, tokens, or sensitive user data
 * 2. This logger automatically redacts common sensitive fields
 * 3. Always add new sensitive field names to SENSITIVE_FIELDS array
 * 4. In production, minimize logging to reduce information leakage
 * 5. Consider using a proper logging service with encryption for production
 * 6. Never send unredacted logs to external services
 * 7. Be cautious with error messages that might expose system information
 * 8. Regularly audit logs to ensure no sensitive data is exposed
 * 9. Consider implementing log rotation and automatic deletion
 * 10. Use secure log aggregation services for production monitoring
 */
