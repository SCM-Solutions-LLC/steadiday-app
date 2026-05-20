import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { useUserStore } from "../state/stores/userStore";
import { useGoogleAuth, fetchGoogleUserInfo, SocialAuthUser, GOOGLE_AUTH_ENABLED } from "../utils/socialAuth";
import * as AuthSession from "expo-auth-session";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { BackButton } from "../components/ui";
import { useConfirmModal } from "../components/ConfirmModal";
import { logger } from "../utils/logger";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "SocialSignIn">;
};

export default function SocialSignInScreen({ navigation }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const { colors } = useTheme();
  const setUserName = useUserStore((s) => s.setUserName);
  const { request, response, promptAsync } = useGoogleAuth();
  const { alert, confirm } = useConfirmModal();

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleSuccess(authentication.accessToken);
      }
    } else if (response?.type === "error") {
      setIsLoading(false);
      setLoadingProvider(null);
      alert("Sign In Error", "Failed to sign in with Google. Please try again.");
    }
  }, [response]);

  const handleGoogleSuccess = async (accessToken: string) => {
    try {
      const userInfo = await fetchGoogleUserInfo(accessToken);

      if (userInfo) {
        // Update user profile with social auth data
        setUserName(userInfo.name);
        // Note: Email and birthday are not stored separately in the current app structure

        confirm(
          "Welcome!",
          `Signed in as ${userInfo.name}. Your profile has been filled in automatically.`,
          () => navigation.navigate("LocationPermission")
        );
      }
    } catch (error) {
      logger.error("Error handling Google sign-in:", error);
      alert("Error", "Failed to retrieve your profile information.");
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleGoogleSignIn = async () => {
    // Check if OAuth is properly configured
    if (!request) {
      confirm(
        "Google Sign-In Not Configured",
        "Google sign-in requires OAuth credentials from Google Cloud Console. For now, please use manual entry to continue.",
        handleSkip
      );
      return;
    }

    setIsLoading(true);
    setLoadingProvider("google");

    try {
      const result = await promptAsync();

      // Check if the result indicates an error or cancellation
      if (result.type === "error" || result.type === "dismiss" || result.type === "cancel") {
        confirm(
          "Configuration Required",
          "Google Sign-In requires valid OAuth credentials. Please continue with manual entry.",
          handleSkip
        );
        setIsLoading(false);
        setLoadingProvider(null);
      }
    } catch (error) {
      setIsLoading(false);
      setLoadingProvider(null);
      logger.error("Google sign-in error:", error);
      confirm(
        "Configuration Required",
        "Google Sign-In requires valid OAuth credentials. Please continue with manual entry.",
        handleSkip
      );
    }
  };

  const handleFacebookSignIn = async () => {
    confirm(
      "Facebook Sign-In",
      "Facebook sign-in requires additional configuration. Would you like to continue with manual entry or try Google sign-in?",
      handleSkip
    );
  };

  const handleSkip = () => {
    navigation.navigate("ConnectAppsIntro");
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1 px-10 py-12">
        {/* Back Button */}
        <BackButton label="Back" style={{ marginBottom: 24 }} />

        <View className="flex-1 justify-center">
          {/* Title */}
          <View className="items-center mb-12">
            <View style={{ backgroundColor: colors.primary, borderRadius: 999, padding: 24, marginBottom: 24 }}>
              <Ionicons name="person" size={48} color="white" />
            </View>
            <Text style={{ fontSize: 36, fontWeight: "600", color: colors.textPrimary, textAlign: "center", marginBottom: 16, lineHeight: 40 }}>
              Sign In
            </Text>
            <Text style={{ fontSize: 20, color: colors.textSecondary, textAlign: "center", lineHeight: 28 }}>
              Sign in to automatically fill your profile information
            </Text>
          </View>

          {/* Info Box - OAuth Not Configured */}
          {!GOOGLE_AUTH_ENABLED && (
            <View style={{ backgroundColor: colors.warning + "10", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 2, borderColor: colors.warning + "40" }}>
              <View className="flex-row items-start">
                <Ionicons
                  name="warning"
                  size={24}
                  color={colors.warning}
                  style={{ marginRight: 12, marginTop: 2 }}
                />
                <View className="flex-1">
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textPrimary, marginBottom: 8 }}>
                    Social Sign-In Temporarily Unavailable
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                    Google sign-in requires additional setup in Google Cloud Console. Please use manual entry to continue setting up your profile.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Social Sign-In Buttons - Only show if enabled */}
          {GOOGLE_AUTH_ENABLED && (
            <>
              <View className="space-y-4 mb-8">
                {/* Google Sign-In */}
                <Pressable
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
                  style={{ backgroundColor: colors.cardBackground, borderRadius: 16, paddingHorizontal: 32, paddingVertical: 24, borderWidth: 2, borderColor: colors.border }}
                  className="flex-row items-center justify-center active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel="Sign in with Google"
                >
                  {loadingProvider === "google" ? (
                    <ActivityIndicator size="small" color="#4285F4" />
                  ) : (
                    <>
                      <View className="w-8 h-8 mr-4">
                        <Ionicons name="logo-google" size={32} color="#4285F4" />
                      </View>
                      <Text style={{ fontSize: 20, fontWeight: "600", color: colors.textPrimary, flex: 1, textAlign: "center" }}>
                        Continue with Google
                      </Text>
                    </>
                  )}
                </Pressable>

                {/* Facebook Sign-In */}
                <Pressable
                  onPress={handleFacebookSignIn}
                  disabled={isLoading}
                  className="bg-[#1877F2] rounded-2xl px-8 py-6 flex-row items-center justify-center active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel="Sign in with Facebook"
                >
                  {loadingProvider === "facebook" ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <View className="w-8 h-8 mr-4">
                        <Ionicons name="logo-facebook" size={32} color="white" />
                      </View>
                      <Text className="text-xl font-semibold text-white flex-1 text-center">
                        Continue with Facebook
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* Divider */}
              <View className="flex-row items-center mb-8">
                <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
                <Text style={{ fontSize: 18, color: colors.textSecondary, marginHorizontal: 16 }}>or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
              </View>
            </>
          )}

          {/* Continue Button */}
          <Button
            title={GOOGLE_AUTH_ENABLED ? "Enter Information Manually" : "Continue to Profile Setup"}
            onPress={handleSkip}
            variant="primary"
            size="large"
            fullWidth
            disabled={isLoading}
            accessibilityLabel="Continue to profile setup"
          />

          {/* Info Box */}
          {GOOGLE_AUTH_ENABLED && (
            <View style={{ backgroundColor: colors.primaryLight, borderRadius: 16, padding: 20, marginTop: 32, borderWidth: 1, borderColor: colors.primary + "40" }}>
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle"
                  size={24}
                  color={colors.primary}
                  style={{ marginRight: 12, marginTop: 2 }}
                />
                <Text style={{ fontSize: 16, color: colors.textPrimary, lineHeight: 24, flex: 1 }}>
                  Signing in will automatically fill your name and email. Your birthday will still need to be entered manually for privacy reasons.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
