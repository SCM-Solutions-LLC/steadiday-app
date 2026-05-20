import { Hono } from "hono";
import { z } from "zod";
import Twilio from "twilio";

const emergencyRouter = new Hono();

const smsRequestSchema = z.object({
  apiSecret: z.string(),
  userName: z.string().min(1),
  contacts: z
    .array(
      z.object({
        name: z.string().min(1),
        phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone must be E.164 format"),
      })
    )
    .min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
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

  const { apiSecret, userName, contacts, latitude, longitude } = parsed.data;

  if (apiSecret !== process.env.EMERGENCY_API_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
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
