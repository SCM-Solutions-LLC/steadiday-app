import React, { memo } from "react";
import { View, Text, Pressable, Image, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { formatPhoneNumber } from "../../utils/phoneFormatter";
import SwipeableRow from "../SwipeableRow";
import type { EmergencyContact } from "../../types/app";
import { useConfirmModal } from "../ConfirmModal";

interface EmergencyContactCardProps {
  contact: EmergencyContact;
  onEdit: () => void;
  onDelete: () => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

function EmergencyContactCardComponent({ contact, onEdit, onDelete }: EmergencyContactCardProps) {
  const { colors, isDark } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const { destructive } = useConfirmModal();

  // Theme-aware emergency colors
  const emergencyBg = isDark ? "#4A1C1C" : "#FEF2F2";
  const emergencyBorder = isDark ? "#7F1D1D" : "#FCA5A5";
  const emergencyButtonActive = isDark ? "#991B1B" : "#B91C1C";

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleText = (phoneNumber: string) => {
    Linking.openURL(`sms:${phoneNumber}`);
  };

  const handleDeletePress = () => {
    destructive(
      "Remove Trusted Contact",
      `Are you sure you want to remove ${contact.name}?`,
      "Remove",
      onDelete
    );
  };

  return (
    <SwipeableRow onEdit={onEdit} onDelete={handleDeletePress}>
      <View
        className="rounded-3xl p-6 border-2"
        style={{ backgroundColor: emergencyBg, borderColor: emergencyBorder }}
      >
        <View className="flex-row items-center mb-4">
          {contact.imageUri ? (
            <Image
              source={{ uri: contact.imageUri }}
              className="w-16 h-16 rounded-full mr-4"
              style={{ width: 64, height: 64, borderRadius: 32 }}
              accessible={true}
              accessibilityLabel={`Photo of ${contact.name}`}
            />
          ) : (
            <View className="bg-critical w-16 h-16 rounded-full items-center justify-center mr-4">
              <Text className={`text-white ${textClasses.subtitle} font-bold`}>
                {getInitials(contact.name)}
              </Text>
            </View>
          )}
          <View className="flex-1 min-w-0">
            {contact.isPrimary && (
              <View className="self-start bg-critical px-2 py-1 rounded-full mb-1">
                <Text className={`text-white ${textClasses.small} font-bold`}>PRIMARY</Text>
              </View>
            )}
            <Text
              className={`${textClasses.subtitle} font-semibold`}
              style={{ color: colors.textPrimary }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {contact.name}
            </Text>
            {contact.relationship && (
              <Text className={`${textClasses.body} mt-1`} style={{ color: colors.textSecondary }}>
                {contact.relationship}
              </Text>
            )}
            <Text className={`${textClasses.body} mt-1`} style={{ color: colors.textTertiary }}>
              {formatPhoneNumber(contact.phoneNumber)}
            </Text>
          </View>
        </View>

        {/* Emergency Action Buttons */}
        <View className="flex-row justify-around">
          <Pressable
            onPress={() => handleCall(contact.phoneNumber)}
            className="flex-1 bg-critical rounded-2xl py-4 mx-1 items-center"
            style={({ pressed }) => pressed ? { backgroundColor: emergencyButtonActive } : {}}
            accessibilityRole="button"
            accessibilityLabel={`Emergency call ${contact.name}`}
          >
            <Ionicons name="call" size={24} color="white" />
            <Text className={`text-white ${textClasses.button} font-semibold mt-1`}>Call</Text>
          </Pressable>
          <Pressable
            onPress={() => handleText(contact.phoneNumber)}
            className="flex-1 bg-critical rounded-2xl py-4 mx-1 items-center"
            style={({ pressed }) => pressed ? { backgroundColor: emergencyButtonActive } : {}}
            accessibilityRole="button"
            accessibilityLabel={`Emergency text ${contact.name}`}
          >
            <Ionicons name="chatbubble" size={24} color="white" />
            <Text className={`text-white ${textClasses.button} font-semibold mt-1`}>Text</Text>
          </Pressable>
        </View>
      </View>
    </SwipeableRow>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(EmergencyContactCardComponent);
