import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useUserStore } from "../state/stores/userStore";
import { verifyEmailToken } from "../api/email-service";
import { logger } from "../utils/logger";
import { useTheme } from "../utils/useTheme";

export default function EmailVerificationHandler() {
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const setUserAuth = useUserStore((s) => s.setUserAuth);
  const userProfile = useUserStore((s) => s.userProfile);
  const { colors, primary } = useTheme();

  useEffect(() => {
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    try {
      const { hostname, queryParams } = Linking.parse(url);

      if (hostname === "verify" && queryParams?.token) {
        setVerificationStatus("verifying");

        const token = Array.isArray(queryParams.token) ? queryParams.token[0] : queryParams.token;
        const result = verifyEmailToken(token);

        if (result.valid && result.userId && result.email) {
          if (userProfile.auth?.email === result.email) {
            setUserAuth({
              ...userProfile.auth,
              emailVerified: true,
            });

            setVerificationStatus("success");

            setTimeout(() => {
              setVerificationStatus("idle");
            }, 3000);
          } else {
            setVerificationStatus("error");

            setTimeout(() => {
              setVerificationStatus("idle");
            }, 3000);
          }
        } else {
          setVerificationStatus("error");

          setTimeout(() => {
            setVerificationStatus("idle");
          }, 3000);
        }
      }
    } catch (error) {
      logger.error("Error handling deep link:", error);
      setVerificationStatus("error");

      setTimeout(() => {
        setVerificationStatus("idle");
      }, 3000);
    }
  };

  if (verificationStatus === "idle") {
    return null;
  }

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <SafeAreaView>
        <View
          style={{
            backgroundColor: colors.cardBackground,
            borderRadius: 24,
            padding: 32,
            marginHorizontal: 40,
            alignItems: "center",
            shadowColor: colors.textPrimary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {verificationStatus === "verifying" && (
            <>
              <ActivityIndicator size="large" color={primary} style={{ marginBottom: 16 }} />
              <Text style={{ fontSize: 20, fontWeight: "600", color: colors.textPrimary, textAlign: "center" }}>
                Verifying Email...
              </Text>
            </>
          )}

          {verificationStatus === "success" && (
            <>
              <View style={{ backgroundColor: colors.success, borderRadius: 999, padding: 16, marginBottom: 16 }}>
                <Ionicons name="checkmark" size={48} color={colors.onPrimary} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "600", color: colors.textPrimary, textAlign: "center", marginBottom: 8 }}>
                Email Verified!
              </Text>
              <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: "center" }}>
                Your email has been successfully verified.
              </Text>
            </>
          )}

          {verificationStatus === "error" && (
            <>
              <View style={{ backgroundColor: colors.error, borderRadius: 999, padding: 16, marginBottom: 16 }}>
                <Ionicons name="close" size={48} color={colors.onPrimary} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "600", color: colors.textPrimary, textAlign: "center", marginBottom: 8 }}>
                Verification Failed
              </Text>
              <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: "center" }}>
                Invalid or expired verification link.
              </Text>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
