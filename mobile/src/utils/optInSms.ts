import { Alert } from "react-native";
import * as SMS from "expo-sms";
import { TrustedContact } from "../types/app";
import { useUserStore } from "../state/stores/userStore";
import { logger } from "./logger";

const dismissedContactIds = new Set<string>();
let dismissedAll = false;

function getFirstName(fullName: string): string {
  return fullName.split(" ")[0] || fullName;
}

function buildMessage(contactName: string, userName: string): string {
  const firstName = getFirstName(contactName);
  return (
    `Hi ${firstName}! I just added you as an emergency contact in my SteadiDay app. ` +
    "If the app ever detects a fall or I press the emergency button, " +
    "you'll get an automated text from (434) 448-9187 with my location. " +
    "It will look something like this:\n\n" +
    `"SteadiDay Emergency Alert: ${userName} may have had a fall and is not responding. ` +
    'Last known location: maps.google.com/?q=..."\n\n' +
    "Just wanted you to know so you recognize it if it ever happens! " +
    "You can reply STOP to that number anytime to opt out."
  );
}

export async function promptAndSendOptIn(contact: TrustedContact): Promise<void> {
  if (contact.optInSmsSent) return;
  if (!contact.phoneNumber || contact.phoneNumber.replace(/[^0-9]/g, "").length < 10) return;
  if (dismissedContactIds.has(contact.id) || dismissedAll) return;

  const isAvailable = await SMS.isAvailableAsync();
  if (!isAvailable) return;

  const userName = useUserStore.getState().userProfile.name || "A SteadiDay user";

  return new Promise<void>((resolve) => {
    Alert.alert(
      `Let ${getFirstName(contact.name)} know`,
      `Would you like to send ${getFirstName(contact.name)} a quick text letting them know they'll receive emergency alerts from SteadiDay? This helps them recognize the message if an emergency ever happens.`,
      [
        {
          text: "Not Now",
          style: "cancel",
          onPress: () => {
            dismissedContactIds.add(contact.id);
            resolve();
          },
        },
        {
          text: "Send Text",
          onPress: async () => {
            try {
              const message = buildMessage(contact.name, userName);
              const { result } = await SMS.sendSMSAsync(
                [contact.phoneNumber],
                message
              );
              if (result === "sent") {
                useUserStore.getState().updateEmergencyContact(contact.id, {
                  optInSmsSent: true,
                });
              }
            } catch (error) {
              logger.error("[OptInSMS] Failed to open SMS compose:", error);
            }
            resolve();
          },
        },
      ]
    );
  });
}

export async function promptAndSendOptInForMultiple(
  contacts: TrustedContact[]
): Promise<void> {
  const eligible = contacts.filter(
    (c) =>
      !c.optInSmsSent &&
      c.phoneNumber &&
      c.phoneNumber.replace(/[^0-9]/g, "").length >= 10 &&
      !dismissedContactIds.has(c.id)
  );

  if (eligible.length === 0 || dismissedAll) return;

  const isAvailable = await SMS.isAvailableAsync();
  if (!isAvailable) return;

  const userName = useUserStore.getState().userProfile.name || "A SteadiDay user";

  for (const contact of eligible) {
    const shouldContinue = await new Promise<boolean>((resolve) => {
      Alert.alert(
        `Let ${getFirstName(contact.name)} know`,
        `Would you like to send ${getFirstName(contact.name)} a quick text letting them know they'll receive emergency alerts from SteadiDay? This helps them recognize the message if an emergency ever happens.`,
        [
          {
            text: "Not Now",
            style: "cancel",
            onPress: () => {
              dismissedContactIds.add(contact.id);
              dismissedAll = true;
              resolve(false);
            },
          },
          {
            text: "Send Text",
            onPress: async () => {
              try {
                const message = buildMessage(contact.name, userName);
                const { result } = await SMS.sendSMSAsync(
                  [contact.phoneNumber],
                  message
                );
                if (result === "sent") {
                  useUserStore.getState().updateEmergencyContact(contact.id, {
                    optInSmsSent: true,
                  });
                }
              } catch (error) {
                logger.error("[OptInSMS] Failed to open SMS compose:", error);
              }
              resolve(true);
            },
          },
        ]
      );
    });

    if (!shouldContinue) break;
  }
}
