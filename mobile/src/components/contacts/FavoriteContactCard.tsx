import React, { memo } from "react";
import { View, Text, Pressable, Image, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../utils/useTheme";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { formatPhoneNumber } from "../../utils/phoneFormatter";
import SwipeableRow from "../SwipeableRow";
import type { FavoriteContact } from "../../types/app";

interface FavoriteContactCardProps {
  contact: FavoriteContact;
  index: number;
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

const AVATAR_COLORS = ["#2F80ED", "#6DB193", "#8B5CF6", "#F59E0B", "#EC4899"];
const getAvatarColor = (index: number) => {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
};

function FavoriteContactCardComponent({ contact, index, onEdit, onDelete }: FavoriteContactCardProps) {
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleVideoCall = (phoneNumber: string) => {
    Linking.openURL(`facetime:${phoneNumber}`);
  };

  const handleText = (phoneNumber: string) => {
    Linking.openURL(`sms:${phoneNumber}`);
  };

  return (
    <SwipeableRow onEdit={onEdit} onDelete={onDelete}>
      <View className="rounded-3xl p-6 border-2" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
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
            <View
              className="w-16 h-16 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: getAvatarColor(index) }}
            >
              <Text className={`text-white ${textClasses.subtitle} font-bold`}>
                {getInitials(contact.name)}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className={`${textClasses.subtitle} font-semibold`} style={{ color: colors.textPrimary }}>
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

        {/* Action Buttons */}
        <View className="flex-row justify-around">
          <Pressable
            onPress={() => handleCall(contact.phoneNumber)}
            className="flex-1 rounded-2xl py-4 mx-1 items-center active:opacity-80"
            style={{ backgroundColor: colors.success }}
            accessibilityRole="button"
            accessibilityLabel={`Call ${contact.name}`}
          >
            <Ionicons name="call" size={24} color="white" />
            <Text className={`text-white ${textClasses.button} font-semibold mt-1`}>Call</Text>
          </Pressable>
          <Pressable
            onPress={() => handleVideoCall(contact.phoneNumber)}
            className="flex-1 rounded-2xl py-4 mx-1 items-center active:opacity-80"
            style={{ backgroundColor: primary }}
            accessibilityRole="button"
            accessibilityLabel={`Video call ${contact.name}`}
          >
            <Ionicons name="videocam" size={24} color="white" />
            <Text className={`text-white ${textClasses.button} font-semibold mt-1`}>Video</Text>
          </Pressable>
          <Pressable
            onPress={() => handleText(contact.phoneNumber)}
            className="flex-1 rounded-2xl py-4 mx-1 items-center active:opacity-80"
            style={{ backgroundColor: colors.info }}
            accessibilityRole="button"
            accessibilityLabel={`Text ${contact.name}`}
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
export default memo(FavoriteContactCardComponent);
