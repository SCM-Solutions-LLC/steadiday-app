import React, { useEffect, useRef } from "react";
import { View, Text, Modal, Pressable, ScrollView, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import type { TrustedContact } from "../../../types/app";
import type { BaseWidgetProps } from "../types";
import * as SMS from "expo-sms";
import { logger } from "../../../utils/logger";

interface FallEmergencyModalProps {
  visible: boolean;
  contactResults: { name: string; status: "sent" | "failed" }[];
  backendSuccess: boolean;
  failReason?: string;
  contacts: TrustedContact[];
  userName: string;
  latitude?: number;
  longitude?: number;
  onDismiss: () => void;
  onRetry?: () => void;
  textClasses: BaseWidgetProps["textClasses"];
  colors: BaseWidgetProps["colors"];
}

function getFailMessage(reason?: string): string {
  switch (reason) {
    case "no_valid_contacts":
      return "No emergency contacts are set up. Tap above to call 911 or add contacts in Settings.";
    case "app_key_not_configured":
      return "The emergency service is not fully set up on the server. Tap above to call 911 or text your contacts manually below.";
    case "auth_failed":
      return "Could not authenticate with the emergency server. Tap above to call 911 or text your contacts manually below.";
    case "twilio_not_configured":
      return "The emergency text service is not configured on the server. Tap above to call 911 or text your contacts manually below.";
    case "network_error":
      return "Could not reach the server. Check your internet connection. Tap above to call 911 or text your contacts manually below.";
    case "invalid_request":
      return "The emergency request was invalid. Tap above to call 911 or text your contacts manually below.";
    default:
      return "Could not send emergency texts automatically. Tap above to call 911 or text your contacts manually below.";
  }
}

export function FallEmergencyModal({
  visible,
  contactResults,
  backendSuccess,
  failReason,
  contacts,
  userName,
  latitude,
  longitude,
  onDismiss,
  onRetry,
  textClasses,
  colors,
}: FallEmergencyModalProps) {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (visible) {
      activateKeepAwakeAsync("fall-emergency").catch(() => {});
      playAlarm();
    }
    return () => {
      stopAlarm();
      deactivateKeepAwake("fall-emergency");
    };
  }, [visible]);

  const playAlarm = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        require("../../../../assets/alarm.wav"),
        { isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      logger.error("Failed to play alarm sound:", e);
    }
  };

  const stopAlarm = async () => {
    const sound = soundRef.current;
    if (!sound) return;
    soundRef.current = null;
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.stopAsync().catch(() => {});
        await sound.unloadAsync().catch(() => {});
      }
    } catch {
      // Sound already unloaded or in a transitional state — safe to ignore
    }
  };

  const handleCall911 = async () => {
    try {
      const url = "tel:911";
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      }
    } catch (e) {
      logger.error("Error calling 911:", e);
    }
  };

  const handleCallContact = async (phone: string) => {
    try {
      const digits = phone.replace(/[^0-9+]/g, "");
      const url = `tel:${digits}`;
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      }
    } catch (e) {
      logger.error("Error calling contact:", e);
    }
  };

  const handleTextContact = async (contact: TrustedContact) => {
    try {
      const smsAvailable = await SMS.isAvailableAsync();
      if (!smsAvailable) return;
      const locationLine =
        latitude && longitude
          ? `\n\n\u{1F4CD} GPS Location: https://maps.google.com/?q=${latitude},${longitude}`
          : "";
      await SMS.sendSMSAsync(
        [contact.phoneNumber],
        `\u{1F198} EMERGENCY ALERT\n\nThis is ${userName}'s SteadiDay app. ${userName} may have had a fall and needs help immediately.${locationLine}\n\nPlease call or check on them right away.`
      );
    } catch (e) {
      logger.error("Error texting contact:", e);
    }
  };

  const handleFalseAlarm = () => {
    stopAlarm();
    onDismiss();
  };

  const sentNames = contactResults
    .filter((r) => r.status === "sent")
    .map((r) => r.name);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1" style={{ backgroundColor: colors.cardBackground }}>
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Call 911 */}
          <Pressable
            onPress={handleCall911}
            className="rounded-2xl p-6 mb-6 active:opacity-80"
            style={{ backgroundColor: colors.error, minHeight: 80 }}
            accessibilityRole="button"
            accessibilityLabel="Call 911"
          >
            <View className="flex-row items-center justify-center">
              <View
                className="rounded-full p-3 mr-4"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <Ionicons name="call" size={32} color="white" />
              </View>
              <Text className="text-2xl font-bold text-white">Call 911</Text>
            </View>
          </Pressable>

          {/* Status message */}
          <View
            className="rounded-2xl p-5 mb-6 border"
            style={{
              backgroundColor: backendSuccess ? colors.successBackground : colors.warningBackground,
              borderColor: backendSuccess ? colors.success : colors.warning,
            }}
          >
            <View className="flex-row items-start">
              <Ionicons
                name={backendSuccess ? "checkmark-circle" : "alert-circle"}
                size={24}
                color={backendSuccess ? colors.success : colors.warning}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <Text
                className={`${textClasses.body} flex-1 leading-relaxed`}
                style={{ color: colors.textPrimary }}
              >
                {backendSuccess
                  ? `Emergency texts sent to ${sentNames.join(", ")}. Tap above to call 911.`
                  : getFailMessage(failReason)}
              </Text>
            </View>
            {!backendSuccess && onRetry && (
              <Pressable
                onPress={onRetry}
                className="mt-3 rounded-xl p-3 active:opacity-80"
                style={{ backgroundColor: colors.warning }}
                accessibilityRole="button"
                accessibilityLabel="Retry sending emergency texts"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="refresh" size={18} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-base font-semibold text-white">
                    Retry Sending Texts
                  </Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Manual contact buttons */}
          {contacts.length > 0 && (
            <View className="mb-6">
              <Text
                className={`${textClasses.small} mb-3 font-semibold`}
                style={{ color: colors.textSecondary }}
              >
                CONTACT MANUALLY
              </Text>
              {contacts.map((contact) => (
                <View key={contact.id} className="mb-3">
                  <Pressable
                    onPress={() => handleTextContact(contact)}
                    className="rounded-2xl p-4 mb-2 active:opacity-80"
                    style={{ backgroundColor: colors.success }}
                    accessibilityRole="button"
                    accessibilityLabel={`Text ${contact.name}`}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="rounded-full p-2 mr-3"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                      >
                        <Ionicons name="chatbubble" size={20} color="white" />
                      </View>
                      <Text className={`${textClasses.body} font-semibold text-white`}>
                        Text {contact.name}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => handleCallContact(contact.phoneNumber)}
                    className="rounded-2xl p-4 active:opacity-80"
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
                </View>
              ))}
            </View>
          )}

          {/* False Alarm */}
          <Pressable
            onPress={handleFalseAlarm}
            className="rounded-2xl p-4 active:opacity-80 mt-4"
            style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
            accessibilityRole="button"
            accessibilityLabel="I am OK, false alarm"
          >
            <Text
              className={`${textClasses.body} font-semibold text-center`}
              style={{ color: colors.textSecondary }}
            >
              {"I'm OK \u2014 False Alarm"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
