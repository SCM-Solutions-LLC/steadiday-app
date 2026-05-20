import React from "react";
import { View, Text, Pressable, Image, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatPhoneNumber } from "../../../utils/phoneFormatter";
import { useUserStore } from "../../../state/stores/userStore";
import type { EmergencyContactsWidgetProps } from "../types";

export function EmergencyContactsWidget({
  textClasses,
  colors,
  primary,
  onNavigate,
}: EmergencyContactsWidgetProps) {
  const emergencyContacts = useUserStore((s) => s.userProfile.emergencyContacts);
  const primaryContact = emergencyContacts.find((c) => c.isPrimary) || emergencyContacts[0];

  const handleCall = () => {
    if (primaryContact?.phoneNumber) {
      Linking.openURL(`tel:${primaryContact.phoneNumber}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View
      className="rounded-3xl p-4 mb-6 border"
      style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
    >
      <Text className={`${textClasses.subtitle} mb-3`} style={{ color: colors.textPrimary }}>
        Trusted Contact
      </Text>

      {primaryContact ? (
        <View>
          <View className="flex-row items-center mb-4">
            {primaryContact.imageUri ? (
              <Image
                source={{ uri: primaryContact.imageUri }}
                className="w-14 h-14 rounded-full"
                style={{ width: 56, height: 56, borderRadius: 28 }}
                accessible={true}
                accessibilityLabel={`Trusted contact ${primaryContact.name}`}
              />
            ) : (
              <View
                className="w-14 h-14 rounded-full items-center justify-center"
                style={{ backgroundColor: primary }}
              >
                <Text className={`${textClasses.body} text-white font-bold`}>
                  {getInitials(primaryContact.name)}
                </Text>
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
                {primaryContact.name}
              </Text>
              <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                {primaryContact.relationship}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleCall}
            className="bg-green-600 rounded-2xl py-4 flex-row items-center justify-center active:bg-green-700"
            style={{ minHeight: 56 }}
            accessibilityRole="button"
            accessibilityLabel={`Call ${primaryContact.name}`}
            accessibilityHint={`Calls your primary trusted contact ${primaryContact.name} at ${formatPhoneNumber(primaryContact.phoneNumber)}`}
          >
            <Ionicons name="call" size={24} color="white" />
            <Text className={`${textClasses.button} text-white font-semibold ml-3`}>
              Call {formatPhoneNumber(primaryContact.phoneNumber)}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="items-center py-4">
          <Ionicons name="person-add" size={32} color={colors.textSecondary} />
          <Text className={`${textClasses.body} mt-2 text-center`} style={{ color: colors.textSecondary }}>
            No trusted contacts added
          </Text>
          <Pressable
            onPress={onNavigate}
            className="mt-3 px-6 py-3 rounded-xl"
            style={{ backgroundColor: primary, minHeight: 48 }}
            accessibilityRole="button"
            accessibilityLabel="Add trusted contact"
            accessibilityHint="Opens the screen to add a trusted contact"
          >
            <Text className={`${textClasses.button} text-white font-semibold`}>Add Contact</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
