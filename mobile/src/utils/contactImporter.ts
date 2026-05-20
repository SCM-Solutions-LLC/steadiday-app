import * as Contacts from "expo-contacts";
import { logger } from "./logger";

export interface PhoneContact {
  id: string;
  name: string;
  phoneNumber: string;
  isFavorite?: boolean;
  imageUri?: string; // Profile picture URI
}

export async function requestContactPermissions(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === "granted";
}

export async function fetchPhoneContacts(): Promise<PhoneContact[]> {
  try {
    const hasPermission = await requestContactPermissions();

    if (!hasPermission) {
      return [];
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name, Contacts.Fields.Image],
      sort: Contacts.SortTypes.FirstName,
    });

    if (!data || data.length === 0) {
      return [];
    }

    const phoneContacts: PhoneContact[] = [];

    for (const contact of data) {
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        // Get the first phone number
        const phoneNumber = contact.phoneNumbers[0].number || contact.phoneNumbers[0].digits;

        if (phoneNumber) {
          phoneContacts.push({
            id: contact.id || `${Date.now()}-${Math.random()}`,
            name: contact.name || "Unknown",
            phoneNumber: phoneNumber,
            isFavorite: false, // expo-contacts doesn't expose starred/favorite status
            imageUri: contact.image?.uri, // Profile picture URI
          });
        }
      }
    }

    return phoneContacts;
  } catch (error) {
    logger.error("Error fetching contacts:", error);
    return [];
  }
}

// Function to fetch only favorite/starred contacts
// Note: expo-contacts doesn't provide direct access to favorite/starred status
// This is a limitation of the Expo Contacts API
export async function fetchFavoriteContacts(): Promise<PhoneContact[]> {
  // Unfortunately, expo-contacts does not expose the favorite/starred status
  // iOS and Android both support favorite contacts, but Expo's API doesn't expose this
  // As a workaround, we return all contacts and let users select their favorites manually
  return fetchPhoneContacts();
}
