import { Hono } from "hono";
import { z } from "zod";
import Twilio from "twilio";
import { sendEmergencySMS } from "../lib/sms-helper";

const emergencyRouter = new Hono();

const smsRequestSchema = z.object({
  apiSecret: z.string().optional(),
  action: z.enum(["emergency", "opt_in_confirmation"]).optional(),
  userName: z.string().min(1).max(100),
  contacts: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone must be E.164 format"),
      })
    )
    .max(5)
    .optional(),
  contactName: z.string().min(1).max(100).optional(),
  contactPhone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone must be E.164 format").optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

function logEmergency(level: "info" | "warn" | "error", event: string, data: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "emergency-sms",
    event,
    ...data,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

emergencyRouter.post("/sms", async (c) => {
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown";

  const body = await c.req.json().catch(() => null);
  if (!body) {
    logEmergency("warn", "invalid_json", { ip });
    return c.json({ error: "Invalid request" }, 400);
  }

  const parsed = smsRequestSchema.safeParse(body);
  if (!parsed.success) {
    logEmergency("warn", "validation_failed", { ip, fields: parsed.error.issues.map((i) => i.path.join(".")) });
    return c.json({ error: "Invalid request" }, 400);
  }

  const expectedClientKey = process.env.APP_CLIENT_KEY;
  if (!expectedClientKey) {
    logEmergency("error", "app_key_not_configured", { ip });
    return c.json({ success: false, error: "Backend app key is not configured", reason: "app_key_not_configured" }, 503);
  }

  const clientKey = c.req.header("X-App-Key");
  const headerAuth = clientKey === expectedClientKey;
  const bodyAuth = parsed.data.apiSecret && parsed.data.apiSecret === process.env.EMERGENCY_API_SECRET;

  if (!headerAuth && !bodyAuth) {
    logEmergency("warn", "auth_failed", { ip });
    return c.json({ success: false, error: "Invalid app key", reason: "auth_failed" }, 401);
  }

  const action = parsed.data.action || "emergency";

  // Handle opt-in confirmation SMS
  if (action === "opt_in_confirmation") {
    const { contactName, contactPhone, userName } = parsed.data;
    if (!contactPhone || !userName) {
      logEmergency("warn", "missing_opt_in_fields", { ip });
      return c.json({ error: "contactPhone and userName are required for opt_in_confirmation" }, 400);
    }

    try {
      const twilioClient = Twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      );

      const messageBody =
        `You have been added as an emergency contact in SteadiDay by ${userName}. ` +
        `You will only receive SMS alerts if an emergency is detected (such as a fall). ` +
        `Message frequency varies — typically zero messages. ` +
        `Msg & data rates may apply. Reply STOP to opt out. Reply HELP for help. SCM Solutions LLC.`;

      await twilioClient.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: contactPhone,
      });

      logEmergency("info", "opt_in_sent", { ip, userName, contactName: contactName || "contact" });
      return c.json({ success: true, message: "Opt-in confirmation sent" });
    } catch (error: any) {
      logEmergency("error", "opt_in_failed", { ip, userName, contactName: contactName || "contact", error: error?.message });
      return c.json({ success: false, error: "Could not send confirmation" }, 500);
    }
  }

  // Handle emergency SMS (existing behavior)
  const { userName, contacts, latitude, longitude } = parsed.data;
  if (!contacts || contacts.length === 0 || latitude === undefined || longitude === undefined) {
    logEmergency("warn", "missing_emergency_fields", { ip, userName });
    return c.json({ error: "contacts, latitude, and longitude are required for emergency action" }, 400);
  }

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    logEmergency("error", "twilio_not_configured", { ip, userName });
    return c.json({ success: false, error: "SMS service not configured", reason: "twilio_not_configured", contacts: contacts.map(c => ({ name: c.name, status: "failed" as const })) }, 503);
  }

  try {
    const result = await sendEmergencySMS(userName, contacts, latitude, longitude);
    logEmergency("info", "emergency_sms_complete", { ip, userName, contactCount: contacts.length, sent: result.sent, failed: result.failed });
    return c.json({
      success: result.sent > 0,
      sent: result.sent,
      failed: result.failed,
      contacts: result.contacts,
    });
  } catch (error: any) {
    logEmergency("error", "emergency_sms_error", { ip, userName, error: error?.message });
    return c.json({ success: false, error: "Failed to send emergency SMS", reason: "send_error", contacts: contacts.map(c => ({ name: c.name, status: "failed" as const })) }, 500);
  }
});

export { emergencyRouter };
