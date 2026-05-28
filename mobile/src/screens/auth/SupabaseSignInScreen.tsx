import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as AppleAuthentication from "expo-apple-authentication";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";

import Button from "../../components/Button";
import { useConfirmModal } from "../../components/ConfirmModal";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../context/AuthContext";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useTheme } from "../../utils/useTheme";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "SupabaseSignIn">;
};

export default function SupabaseSignInScreen({ navigation }: Props) {
  const { colors, primary, isDark } = useTheme();
  const { alert } = useConfirmModal();
  const { signInWithEmail, signInWithAppleIdToken, isConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      alert("Missing details", "Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    const { error } = await signInWithEmail(email.trim().toLowerCase(), password);
    setSubmitting(false);
    if (error) {
      alert("Sign in failed", error);
      return;
    }
    navigation.goBack();
  };

  const handleAppleSignIn = async () => {
    try {
      setSubmitting(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        alert("Sign in failed", "Apple did not return an identity token.");
        return;
      }
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(" ")
        .trim();
      const { error } = await signInWithAppleIdToken(
        credential.identityToken,
        fullName || undefined
      );
      if (error) {
        alert("Sign in failed", error);
        return;
      }
      navigation.goBack();
    } catch (error: unknown) {
      const code = (error as { code?: string } | null)?.code;
      if (code === "ERR_REQUEST_CANCELED") return;
      const message =
        error instanceof Error ? error.message : "Unable to sign in with Apple.";
      alert("Sign in failed", message);
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <Screen variant="keyboard" edges={["bottom"]} horizontalPadding={20}>
      <View style={{ paddingTop: 12, paddingBottom: 28 }}>
        <Text
          style={{
            fontSize: 30,
            fontWeight: "700",
            color: colors.textPrimary,
            marginBottom: 8,
          }}
        >
          Welcome back
        </Text>
        <Text style={{ fontSize: 17, color: colors.textSecondary, lineHeight: 24 }}>
          Sign in to back up your SteadiDay data and stay connected with the people
          who care about you.
        </Text>
      </View>

      {!isConfigured && (
        <View
          style={{
            backgroundColor: isDark ? "#3A2A00" : "#FFF4D6",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 15 }}>
            Cloud sign-in is not configured for this build. Set
            EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable it.
          </Text>
        </View>
      )}

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
        style={inputStyle}
      />

      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: colors.textPrimary,
          marginTop: 18,
          marginBottom: 6,
        }}
      >
        Password
      </Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        style={inputStyle}
      />

      <Pressable
        onPress={() => navigation.navigate("SupabaseForgotPassword")}
        style={{ alignSelf: "flex-end", marginTop: 12, padding: 8 }}
        accessibilityRole="button"
      >
        <Text style={{ color: primary, fontSize: 16, fontWeight: "600" }}>
          Forgot password?
        </Text>
      </Pressable>

      <View style={{ marginTop: 16 }}>
        <Button
          title="Sign In"
          onPress={handleSignIn}
          loading={submitting}
          disabled={!isConfigured}
          fullWidth
        />
      </View>

      {Platform.OS === "ios" && appleAvailable && (
        <View style={{ marginTop: 16 }}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={
              isDark
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={28}
            style={{ height: 56, width: "100%" }}
            onPress={handleAppleSignIn}
          />
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginVertical: 24,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: colors.cardBackground }} />
        <Text style={{ marginHorizontal: 12, color: colors.textSecondary }}>or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.cardBackground }} />
      </View>

      <Pressable
        onPress={() => navigation.navigate("SupabaseSignUp")}
        style={{ paddingVertical: 12, alignItems: "center" }}
        accessibilityRole="button"
      >
        <Text style={{ color: primary, fontSize: 17, fontWeight: "600" }}>
          Create a new account
        </Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.goBack()}
        style={{
          marginTop: 8,
          paddingVertical: 16,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
        }}
        accessibilityRole="button"
        accessibilityLabel="Continue without an account"
      >
        <Ionicons
          name="arrow-forward-circle-outline"
          size={22}
          color={colors.textSecondary}
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
          Continue without an account
        </Text>
      </Pressable>
    </Screen>
  );
}
