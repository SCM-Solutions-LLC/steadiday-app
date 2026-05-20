import React, { useState } from "react";
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator, ActionSheetIOS, Platform, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { SOSModalProps } from "../types";

const SOS_MODAL_MAX_WIDTH = 600;

export function SOSModal({
  visible,
  onClose,
  onCall911,
  onSendSOSTextAll,
  onCallEmergencyContact,
  emergencyContacts,
  textClasses,
  colors,
  sending = false,
}: SOSModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [showContactPicker, setShowContactPicker] = useState(false);
  const emergencyMarkedContacts = emergencyContacts.filter((c) => c.isEmergencyContact);
  const primaryContact = emergencyMarkedContacts.find((c) => c.isPrimary) || emergencyMarkedContacts[0];
  const nonPrimaryContacts = emergencyMarkedContacts.filter((c) => c.id !== primaryContact?.id);

  const handleCall911 = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onCall911();
  };

  const handleCallOtherContact = () => {
    if (Platform.OS === "ios") {
      const contactOptions = nonPrimaryContacts.map((c) => `Call ${c.name}`);
      const options = [...contactOptions, "Cancel"];
      const cancelButtonIndex = options.length - 1;
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: "Call a trusted contact",
        },
        (buttonIndex) => {
          if (buttonIndex !== cancelButtonIndex && buttonIndex < nonPrimaryContacts.length) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onCallEmergencyContact(nonPrimaryContacts[buttonIndex]!);
          }
        }
      );
    } else {
      setShowContactPicker(true);
    }
  };

  const contactNamesList = emergencyMarkedContacts.map((c) => c.name).join(", ");
  const primaryName = primaryContact?.name || "Trusted Contact";

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View
          className="rounded-3xl w-full overflow-hidden"
          style={{
            backgroundColor: colors.cardBackground,
            maxHeight: "90%",
            maxWidth: Math.min(windowWidth - 48, SOS_MODAL_MAX_WIDTH),
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24 }}
            scrollEnabled={!sending}
          >
            {/* Header */}
            <View className="items-center mb-6">
              <View
                className="rounded-full p-4 mb-4"
                style={{ backgroundColor: colors.errorBackground }}
              >
                <Ionicons name="alert-circle" size={48} color={colors.error} />
              </View>
              <Text
                className={`${textClasses.title} text-center mb-2`}
                style={{ color: colors.textPrimary }}
              >
                Emergency Help
              </Text>
              <Text
                className={`${textClasses.body} text-center leading-relaxed`}
                style={{ color: colors.textSecondary }}
              >
                Choose how to get help
              </Text>
            </View>

            {/* Call 911 - Most prominent (RED) */}
            <Pressable
              onPress={handleCall911}
              className="rounded-2xl p-5 mb-4 active:opacity-80"
              style={{ backgroundColor: colors.error, minHeight: 64 }}
              accessibilityRole="button"
              accessibilityLabel="Call 911 emergency services"
            >
              <View className="flex-row items-center justify-center">
                <View
                  className="rounded-full p-3 mr-4"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <Ionicons name="call" size={28} color="white" />
                </View>
                <View className="flex-1">
                  <Text className={`${textClasses.subtitle} font-bold text-white`}>
                    Call 911
                  </Text>
                  <Text className="text-white/80 text-base mt-1">
                    Emergency services
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Trusted Contacts Section */}
            {emergencyMarkedContacts.length > 0 && (
              <View className="mb-4">
                <Text
                  className={`${textClasses.small} mb-3 font-semibold`}
                  style={{ color: colors.textSecondary }}
                >
                  TRUSTED CONTACTS
                </Text>

                {/* Text All Emergency Contacts */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    onSendSOSTextAll();
                  }}
                  className="rounded-2xl p-5 mb-3 active:opacity-80"
                  style={{ backgroundColor: colors.success, minHeight: 56 }}
                  accessibilityRole="button"
                  accessibilityLabel="Text all trusted contacts"
                >
                  <View className="flex-row items-center justify-center">
                    <View
                      className="rounded-full p-3 mr-4"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      <Ionicons name="chatbubble" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className={`${textClasses.body} font-bold text-white`}>
                        Text All Trusted Contacts
                      </Text>
                      <Text className="text-white/80 text-sm mt-1">
                        Send SOS with your location to {contactNamesList}
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {/* Call Primary Contact */}
                {primaryContact && (
                  <View>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onCallEmergencyContact(primaryContact);
                      }}
                      className="rounded-2xl p-5 active:opacity-80"
                      style={{ backgroundColor: colors.success, minHeight: 56 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Call ${primaryName}`}
                    >
                      <View className="flex-row items-center justify-center">
                        <View
                          className="rounded-full p-3 mr-4"
                          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                        >
                          <Ionicons name="call" size={24} color="white" />
                        </View>
                        <View className="flex-1">
                          <Text className={`${textClasses.body} font-bold text-white`}>
                            Call {primaryName}
                          </Text>
                          <Text className="text-white/80 text-sm mt-1">
                            Direct phone call
                          </Text>
                        </View>
                      </View>
                    </Pressable>

                    {nonPrimaryContacts.length > 0 && (
                      <Pressable
                        onPress={handleCallOtherContact}
                        className="mt-2 py-2 active:opacity-60"
                        accessibilityRole="button"
                        accessibilityLabel="Call other contact"
                      >
                        <Text
                          className={`${textClasses.small} text-center font-medium`}
                          style={{ color: colors.info }}
                        >
                          Call other contact
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Medical ID Info */}
            <View
              className="rounded-2xl p-4 mb-4 border"
              style={{ backgroundColor: colors.infoBackground, borderColor: colors.onInfo }}
            >
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={colors.onInfo}
                  style={{ marginTop: 2, marginRight: 10 }}
                />
                <View className="flex-1">
                  <Text
                    className={`${textClasses.small} font-semibold mb-1`}
                    style={{ color: colors.textPrimary }}
                  >
                    About Medical ID
                  </Text>
                  <Text
                    className="text-sm leading-relaxed"
                    style={{ color: colors.textSecondary }}
                  >
                    {Platform.OS === "ios"
                      ? "To view or edit your Medical ID, open the Health app and tap Medical ID."
                      : "To view or edit your medical information, open your device Settings and look for Emergency Information."}
                  </Text>
                </View>
              </View>
            </View>

            {/* Cancel Button */}
            <Pressable
              onPress={onClose}
              className="rounded-2xl p-4 active:opacity-80"
              style={{ backgroundColor: colors.background }}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text
                className={`${textClasses.body} font-semibold text-center`}
                style={{ color: colors.textSecondary }}
              >
                Cancel
              </Text>
            </Pressable>
          </ScrollView>

          {/* Android Contact Picker Overlay */}
          {showContactPicker && Platform.OS !== "ios" && (
            <View
              className="absolute inset-0 px-6 justify-center"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <Text
                className={`${textClasses.subtitle} font-semibold text-center mb-6`}
                style={{ color: colors.textPrimary }}
              >
                Call a trusted contact
              </Text>
              {nonPrimaryContacts.map((contact) => (
                <Pressable
                  key={contact.id}
                  onPress={() => {
                    setShowContactPicker(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onCallEmergencyContact(contact);
                  }}
                  className="rounded-2xl p-4 mb-3 active:opacity-80"
                  style={{ backgroundColor: colors.success }}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${contact.name}`}
                >
                  <View className="flex-row items-center">
                    <View
                      className="rounded-full p-2 mr-3"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      <Ionicons name="call" size={20} color="white" />
                    </View>
                    <Text className={`${textClasses.body} font-semibold text-white`}>
                      Call {contact.name}
                    </Text>
                  </View>
                </Pressable>
              ))}
              <Pressable
                onPress={() => setShowContactPicker(false)}
                className="rounded-2xl p-4 mt-2 active:opacity-80"
                style={{ backgroundColor: colors.background }}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text
                  className={`${textClasses.body} font-semibold text-center`}
                  style={{ color: colors.textSecondary }}
                >
                  Cancel
                </Text>
              </Pressable>
            </View>
          )}

          {/* Sending Overlay - shown while preparing SOS text */}
          {sending && (
            <View
              className="absolute inset-0 items-center justify-center px-8"
              style={{ backgroundColor: colors.cardBackground }}
              accessible={true}
              accessibilityLiveRegion="polite"
              accessibilityLabel="Preparing emergency message"
            >
              <View
                className="rounded-full p-4 mb-5"
                style={{ backgroundColor: colors.errorBackground }}
              >
                <ActivityIndicator size="large" color={colors.error} />
              </View>
              <Text
                className={`${textClasses.subtitle} font-semibold text-center mb-2`}
                style={{ color: colors.textPrimary }}
              >
                Preparing message…
              </Text>
              <Text
                className={`${textClasses.body} text-center leading-relaxed`}
                style={{ color: colors.textSecondary }}
              >
                Getting your location and preparing message…
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
