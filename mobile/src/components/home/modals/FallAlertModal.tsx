import React from "react";
import { View, Text, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";
import Button from "../../Button";
import type { FallAlertModalProps } from "../types";

export function FallAlertModal({
  visible,
  countdown,
  onCancel,
  onCallNow,
  textClasses,
  colors,
}: FallAlertModalProps) {
  useKeepAwake("fall-alert-modal");

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
        <View
          className="rounded-3xl p-8 w-full max-w-md shadow-2xl"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <View className="items-center mb-6">
            <View className="rounded-full p-4 mb-4" style={{ backgroundColor: colors.warningBackground }}>
              <Ionicons name="warning" size={64} color={colors.warning} />
            </View>
            <Text
              className={`${textClasses.title} text-center mb-2`}
              style={{ color: colors.textPrimary }}
            >
              Fall Detected!
            </Text>
            <Text
              className={`${textClasses.subtitle} text-center mb-4`}
              style={{ color: colors.textSecondary }}
            >
              Are you okay?
            </Text>

            {/* Countdown Display */}
            <View
              className="rounded-2xl p-6 mb-6 w-full"
              style={{
                backgroundColor: colors.warningBackground,
                borderWidth: 2,
                borderColor: colors.warning,
              }}
            >
              <Text
                className="text-6xl font-bold text-center mb-2"
                style={{ color: colors.onWarning }}
              >
                {countdown}
              </Text>
              <Text
                className={`${textClasses.body} text-center`}
                style={{ color: colors.textSecondary }}
              >
                Texting your trusted contacts in {countdown} seconds
              </Text>
            </View>

            <Text
              className={`${textClasses.body} text-center mb-6`}
              style={{ color: colors.textSecondary }}
            >
              {"If you're okay, tap \"I'm Okay\" below"}
            </Text>
          </View>

          {/* I'm Okay Button */}
          <Button
            title="I'm Okay"
            onPress={onCancel}
            variant="primary"
            size="large"
            fullWidth
            style={{ backgroundColor: colors.success, marginBottom: 16 }}
            textStyle={{ fontSize: 28, fontWeight: "700" }}
            accessibilityLabel="I am okay, cancel alert"
          />

          {/* Call Now Button */}
          <Button
            title="Call 911 Now"
            onPress={onCallNow}
            variant="primary"
            size="large"
            fullWidth
            style={{ backgroundColor: colors.error }}
            textStyle={{ fontSize: 20, fontWeight: "600" }}
            accessibilityLabel="Call 911 now"
          />
        </View>
      </View>
    </Modal>
  );
}
