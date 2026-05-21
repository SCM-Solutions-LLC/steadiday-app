import { Hono } from "hono";
import { z } from "zod";
import Twilio from "twilio";

const emergencyRouter = new Hono();

const smsRequestSchema = z.object({
  apiSecret: z.string(),
  action: z.enum(["emergency", "opt_in_confirmation"]).optional(),
  userName: z.string().min(1),
  contacts: z
    .array(
      z.object({
        name: z.string().min(1),
        phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone must be E.164 format"),
      })
    )
    .optional(),
  contactName: z.string().min(1).optional(),
  contactPhone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone must be E.164 format").optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

emergencyRouter.post("/sms", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = smsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.issues }, 400);
  }

  const { apiSecret } = parsed.data;

  if (apiSecret !== process.env.EMERGENCY_API_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const action = parsed.data.action || "emergency";

  // Handle opt-in confirmation SMS
  if (action === "opt_in_confirmation") {
    const { contactName, contactPhone, userName } = parsed.data;
    if (!contactPhone || !userName) {
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

      console.log(`[OptInSMS] Sent opt-in confirmation to ${contactName || "contact"} (${contactPhone}) from user="${userName}"`);
      return c.json({ success: true, message: "Opt-in confirmation sent" });
    } catch (error: any) {
      console.error(`[OptInSMS] FAILED to send to ${contactName || "contact"} (${contactPhone}):`, error?.message || error);
      return c.json({ success: false, error: "Could not send confirmation" }, 500);
    }
  }

  // Handle emergency SMS (existing behavior)
  const { userName, contacts, latitude, longitude } = parsed.data;
  if (!contacts || contacts.length === 0 || latitude === undefined || longitude === undefined) {
    return c.json({ error: "contacts, latitude, and longitude are required for emergency action" }, 400);
  }

  const twilioClient = Twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  const messageBody =
    `SteadiDay Emergency Alert: ${userName} may have had a fall and is not responding.\n\n` +
    `Their last known location:\n` +
    `https://maps.google.com/?q=${latitude},${longitude}\n\n` +
    `Please check on them or call 911 immediately.`;

  const results = await Promise.allSettled(
    contacts.map((contact) =>
      twilioClient.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: contact.phone,
      })
    )
  );

  const contactResults = results.map((result, index) => {
    const contact = contacts[index]!;
    if (result.status === "rejected") {
      const reason = result.reason;
      console.error(
        `[EmergencySMS] FAILED to send to ${contact.name} (${contact.phone}):`,
        reason?.message || reason?.code || reason
      );
    }
    return {
      name: contact.name,
      status: result.status === "fulfilled" ? ("sent" as const) : ("failed" as const),
    };
  });

  const sentCount = contactResults.filter((r) => r.status === "sent").length;
  const failedCount = contactResults.filter((r) => r.status === "failed").length;
  console.log(`[EmergencySMS] ${sentCount} sent, ${failedCount} failed for user="${userName}"`);

  return c.json({
    success: sentCount > 0,
    sent: sentCount,
    failed: failedCount,
    contacts: contactResults,
  });
});

export { emergencyRouter };
