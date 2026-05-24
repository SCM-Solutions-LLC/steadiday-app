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
    `Hi ${firstName}! You've been added as an emergency contact in my SteadiDay app. ` +
    `If I press the SOS button or the app detects a fall, ` +
    `you'll get an automated text with my location. ` +
    `Just wanted you to know so you recognize it if it ever comes through.`
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
