/**
 * Email Service - SteadiDay
 *
 * This service handles all email functionality for the app.
 *
 * CURRENT STATUS: Template-only mode
 * - Email templates are defined and ready
 * - Functions return mock data for testing
 * - No actual emails are sent
 *
 * TO ENABLE REAL EMAIL SENDING:
 * 1. Set up a backend email service (SendGrid, AWS SES, Mailgun, etc.)
 * 2. Add your API keys to .env file
 * 3. Uncomment the API calls in the functions below
 * 4. Update ENABLE_EMAIL_SENDING to true
 */

import * as MailComposer from "expo-mail-composer";
import { logger } from "../utils/logger";

// Feature flag - set to true when backend email service is configured
const ENABLE_EMAIL_SENDING = false;

// Backend API endpoint (update this when you set up your email backend)
const EMAIL_API_ENDPOINT = "https://your-backend.com/api/send-email";

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  verificationLink: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  emailId?: string;
}

/**
 * Welcome Email Template
 * This is sent when a user creates an account and logs in for the first time
 */
export function getWelcomeEmailTemplate(data: WelcomeEmailData): { subject: string; body: string; htmlBody: string } {
  const { userName, verificationLink } = data;
  const displayName = userName || "there";

  const subject = "Welcome to SteadiDay";

  const body = `Hi ${displayName},

Welcome to SteadiDay.

Your app helps you stay on top of your day:
• Track daily tasks
• Manage your medications
• View your health metrics like walking, sleep, exercise, and heart rate
• Sync with Apple Health to keep your information current
• Use short exercises that support memory and focus
• Connect supported apps for a single place to manage your health and wellness
• Use helpful tools like the magnifier, flashlight, notes, and parking

Confirm your email to finish setting up your account:
${verificationLink}

If you did not create this account, ignore this message.

Thank you for using SteadiDay.`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SteadiDay</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F7F7F7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 40px 40px 20px; text-align: center; background-color: #2F80ED;">
        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">SteadiDay</h1>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 20px; color: #1A1A1A; font-size: 24px; font-weight: 600;">Hi ${displayName},</h2>

        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
          Welcome to SteadiDay.
        </p>

        <p style="margin: 0 0 10px; color: #333333; font-size: 16px; line-height: 1.6;">
          Your app helps you stay on top of your day:
        </p>

        <ul style="margin: 0 0 30px; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
          <li>Track daily tasks</li>
          <li>Manage your medications</li>
          <li>View your health metrics like walking, sleep, exercise, and heart rate</li>
          <li>Sync with Apple Health to keep your information current</li>
          <li>Use short exercises that support memory and focus</li>
          <li>Connect supported apps for a single place to manage your health and wellness</li>
          <li>Use helpful tools like the magnifier, flashlight, notes, and parking</li>
        </ul>

        <!-- Verification Button -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <a href="${verificationLink}" style="display: inline-block; padding: 16px 32px; background-color: #2F80ED; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                Confirm Your Email
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 30px 0 10px; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
          Or copy and paste this link into your browser:
        </p>
        <p style="margin: 0 0 30px; color: #2F80ED; font-size: 14px; line-height: 1.6; text-align: center; word-break: break-all;">
          ${verificationLink}
        </p>

        <hr style="border: none; border-top: 1px solid #DDDDDD; margin: 30px 0;">

        <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
          If you did not create this account, ignore this message.
        </p>

        <p style="margin: 20px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
          Thank you for using SteadiDay.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 40px; background-color: #F7F7F7; text-align: center;">
        <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
          © ${new Date().getFullYear()} SteadiDay. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, body, htmlBody };
}

/**
 * Send Welcome Email
 *
 * CURRENT: Returns mock response without sending email
 * FUTURE: Sends actual email via backend API when ENABLE_EMAIL_SENDING is true
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResponse> {
  try {
    const emailTemplate = getWelcomeEmailTemplate(data);

    if (!ENABLE_EMAIL_SENDING) {
      // Mock mode - just log and return success
      logger.log("📧 [EMAIL SERVICE - MOCK MODE]");
      logger.log("To:", data.userEmail);
      logger.log("Subject:", emailTemplate.subject);
      logger.log("Verification Link:", data.verificationLink);
      logger.log("---");
      logger.log("✅ Email would be sent in production mode");

      return {
        success: true,
        message: "Email logged (mock mode - no email actually sent)",
        emailId: `mock-${Date.now()}`,
      };
    }

    // PRODUCTION MODE (uncomment when backend is ready)
    // const response = await fetch(EMAIL_API_ENDPOINT, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     // Add your API key header here
    //     // "Authorization": `Bearer ${YOUR_API_KEY}`,
    //   },
    //   body: JSON.stringify({
    //     to: data.userEmail,
    //     subject: emailTemplate.subject,
    //     text: emailTemplate.body,
    //     html: emailTemplate.htmlBody,
    //   }),
    // });
    //
    // if (!response.ok) {
    //   throw new Error(`Email API error: ${response.statusText}`);
    // }
    //
    // const result = await response.json();
    //
    // return {
    //   success: true,
    //   message: "Welcome email sent successfully",
    //   emailId: result.id || result.messageId,
    // };

    return {
      success: true,
      message: "Email service not configured",
      emailId: `mock-${Date.now()}`,
    };
  } catch (error) {
    logger.error("Error sending welcome email:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to send welcome email",
    };
  }
}

/**
 * Open Mail Composer (Fallback for manual email sending)
 * This opens the device's email client for manual sending
 */
export async function openWelcomeEmailComposer(data: WelcomeEmailData): Promise<boolean> {
  try {
    const isAvailable = await MailComposer.isAvailableAsync();

    if (!isAvailable) {
      logger.log("Mail composer is not available on this device");
      return false;
    }

    const emailTemplate = getWelcomeEmailTemplate(data);

    await MailComposer.composeAsync({
      recipients: [data.userEmail],
      subject: emailTemplate.subject,
      body: emailTemplate.body,
    });

    return true;
  } catch (error) {
    logger.error("Error opening mail composer:", error);
    return false;
  }
}

/**
 * Generate Verification Link
 * Creates a verification link that can be used to verify the user's email
 *
 * CURRENT: Returns a mock deep link
 * FUTURE: Should generate a secure token and link to your backend
 */
export function generateVerificationLink(userId: string, email: string): string {
  // Mock verification link - replace with your backend URL
  // React Native compatible base64 encoding (no Buffer needed)
  const dataString = `${userId}:${email}:${Date.now()}`;
  const token = btoa(dataString);

  // Deep link format for the app
  // When you set up a backend, this should be: https://your-backend.com/verify?token=${token}
  return `steadiday://verify?token=${token}`;
}

/**
 * Verify Email Token
 * Validates the verification token from the email link
 *
 * CURRENT: Basic token validation
 * FUTURE: Should validate against backend and check expiration
 */
export function verifyEmailToken(token: string): { valid: boolean; userId?: string; email?: string } {
  try {
    // React Native compatible base64 decoding (no Buffer needed)
    const decoded = atob(token);
    const [userId, email, timestamp] = decoded.split(":");

    if (!userId || !email || !timestamp) {
      return { valid: false };
    }

    // Check if token is older than 24 hours (86400000 milliseconds)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 86400000) {
      logger.log("Verification token expired");
      return { valid: false };
    }

    return { valid: true, userId, email };
  } catch (error) {
    logger.error("Error verifying token:", error);
    return { valid: false };
  }
}
