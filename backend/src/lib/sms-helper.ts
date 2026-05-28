import Twilio from "twilio";

export interface SMSContact {
  name: string;
  phone: string;
}

export interface SMSResult {
  sent: number;
  failed: number;
  contacts: { name: string; status: "sent" | "failed" }[];
}

export async function sendEmergencySMS(
  userName: string,
  contacts: SMSContact[],
  latitude: number,
  longitude: number
): Promise<SMSResult> {
  if (contacts.length === 0) {
    return { sent: 0, failed: 0, contacts: [] };
  }

  const twilioClient = Twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  const hasLocation = latitude !== 0 || longitude !== 0;
  const locationBlock = hasLocation
    ? `\n\n\u{1F4CD} Location:\nhttps://maps.apple.com/?q=${latitude},${longitude}\nhttps://maps.google.com/?q=${latitude},${longitude}`
    : "";

  const messageBody =
    `\u{1F198} SteadiDay Emergency Alert\n\n` +
    `${userName} may need help. The app detected a possible fall and they haven't responded.` +
    locationBlock +
    `\n\nPlease call or check on them right away.`;

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
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          service: "emergency-sms",
          event: "sms_send_failed",
          error: reason?.message || reason?.code,
        })
      );
    }
    return {
      name: contact.name,
      status: (result.status === "fulfilled" ? "sent" : "failed") as "sent" | "failed",
    };
  });

  return {
    sent: contactResults.filter((r) => r.status === "sent").length,
    failed: contactResults.filter((r) => r.status === "failed").length,
    contacts: contactResults,
  };
}
