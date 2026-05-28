import { Ionicons } from "@expo/vector-icons";
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
  navigation: NativeStackNavigationProp<RootStackParamList, "SupabaseSignUp">;
};

export default function SupabaseSignUpScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();
  const { alert } = useConfirmModal();
  const { signUpWithEmail, isConfigured } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const inputStyle = {
    backgroundColor: colors.cardBackground,
    color: colors.textPrimary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    minHeight: 56,
  } as const;

  const labelStyle = {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.textPrimary,
    marginTop: 18,
    marginBottom: 6,
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Name required", "Please enter your name.");
      return;
    }
    if (!email.trim()) {
      alert("Email required", "Please enter your email address.");
      return;
    }
    if (password.length < 8) {
      alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords don’t match", "Please re-enter the same password.");
      return;
    }
    setSubmitting(true);
    const { error } = await signUpWithEmail(
      email.trim().toLowerCase(),
      password,
      name.trim()
    );
    setSubmitting(false);
    if (error) {
      alert("Sign up failed", error);
      return;
    }
    alert(
      "Check your email",
      "We sent a confirmation link to verify your address. Open it on this device to finish setting up your account."
    );
    navigation.goBack();
  };

  return (
    <Screen variant="keyboard" edges={["bottom"]} horizontalPadding={20}>
      <View style={{ paddingTop: 12, paddingBottom: 16 }}>
        <Text
          style={{
            fontSize: 30,
            fontWeight: "700",
            color: colors.textPrimary,
            marginBottom: 8,
          }}
        >
          Create your account
        </Text>
        <Text style={{ fontSize: 17, color: colors.textSecondary, lineHeight: 24 }}>
          Backing up to the cloud lets you keep your data safe across devices and
          share it with family members you trust.
        </Text>
      </View>

      <Text style={{ ...labelStyle, marginTop: 12 }}>Your name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="First name"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        style={inputStyle}
      />

      <Text style={labelStyle}>Email</Text>
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
        style={inputStyle}
      />

      <Text style={labelStyle}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password-new"
        textContentType="newPassword"
        style={inputStyle}
      />

      <Text style={labelStyle}>Confirm password</Text>
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter password"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password-new"
        textContentType="newPassword"
        style={inputStyle}
      />

      <View style={{ marginTop: 24 }}>
        <Button
          title="Create Account"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!isConfigured}
          fullWidth
        />
      </View>

      <Pressable
        onPress={() => navigation.goBack()}
        style={{
          marginTop: 18,
          paddingVertical: 14,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
        }}
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={18} color={primary} style={{ marginRight: 6 }} />
        <Text style={{ color: primary, fontSize: 16, fontWeight: "600" }}>
          Already have an account? Sign in
        </Text>
      </Pressable>
    </Screen>
  );
}
