import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import Button from "../../components/Button";
import { useConfirmModal } from "../../components/ConfirmModal";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../context/AuthContext";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useTheme } from "../../utils/useTheme";

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "SupabaseForgotPassword"
  >;
};

export default function SupabaseForgotPasswordScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();
  const { alert } = useConfirmModal();
  const { sendPasswordReset, isConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      alert("Email required", "Please enter the email for your account.");
      return;
    }
    setSubmitting(true);
    const { error } = await sendPasswordReset(email.trim().toLowerCase());
    setSubmitting(false);
    if (error) {
      alert("Could not send link", error);
      return;
    }
    setSent(true);
  };

  return (
    <Screen variant="keyboard" edges={["bottom"]} horizontalPadding={20}>
      <View style={{ paddingTop: 12, paddingBottom: 24 }}>
        <Text
          style={{
            fontSize: 30,
            fontWeight: "700",
            color: colors.textPrimary,
            marginBottom: 8,
          }}
        >
          Reset password
        </Text>
        <Text style={{ fontSize: 17, color: colors.textSecondary, lineHeight: 24 }}>
          Enter the email connected to your SteadiDay account and we will send you
          a link to choose a new password.
        </Text>
      </View>

      {sent ? (
        <View
          style={{
            backgroundColor: colors.cardBackground,
            padding: 18,
            borderRadius: 14,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.textPrimary,
              marginBottom: 6,
            }}
          >
            Check your inbox
          </Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 22 }}>
            If an account exists for {email.trim()}, a reset link is on its way.
            Open it on this device to finish.
          </Text>
        </View>
      ) : (
        <>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.textPrimary,
              marginBottom: 6,
            }}
          >
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            style={{
              backgroundColor: colors.cardBackground,
              color: colors.textPrimary,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 18,
              minHeight: 56,
            }}
          />

          <View style={{ marginTop: 24 }}>
            <Button
              title="Send Reset Link"
              onPress={handleSend}
              loading={submitting}
              disabled={!isConfigured}
              fullWidth
            />
          </View>
        </>
      )}

      <Pressable
        onPress={() => navigation.goBack()}
        style={{
          marginTop: 24,
          paddingVertical: 14,
          alignItems: "center",
        }}
        accessibilityRole="button"
      >
        <Text style={{ color: primary, fontSize: 16, fontWeight: "600" }}>
          Back to sign in
        </Text>
      </Pressable>
    </Screen>
  );
}
