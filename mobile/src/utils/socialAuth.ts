import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { Platform } from "react-native";
import { logger } from "./logger";

WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration from environment variables
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "YOUR_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;

// Check if OAuth is properly configured
export const GOOGLE_AUTH_ENABLED =
  GOOGLE_WEB_CLIENT_ID !== "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com";

// Apple Sign-In is always available on iOS 13+ (no config needed)
export const APPLE_AUTH_ENABLED = Platform.OS === "ios";

export interface SocialAuthUser {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  provider: "google" | "apple";
}

/**
 * Initialize Google Sign-In
 * Returns request, response, and promptAsync function
 */
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ["profile", "email"],
  });

  return { request, response, promptAsync };
}

/**
 * Fetch user info from Google after successful authentication
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<SocialAuthUser | null> {
  try {
    const response = await fetch("https://www.googleapis.com/userinfo/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Google user info");
    }

    const userInfo = await response.json();

    return {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      givenName: userInfo.given_name,
      familyName: userInfo.family_name,
      picture: userInfo.picture,
      provider: "google",
    };
  } catch (error) {
    logger.error("Error fetching Google user info:", error);
    return null;
  }
}

/**
 * Check if Apple Sign-In is available on this device
 */
export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") {
    return false;
  }
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    logger.error("Error checking Apple Auth availability:", error);
    return false;
  }
}

/**
 * Sign in with Apple
 * Returns user info directly from Apple's response
 */
export async function signInWithApple(): Promise<SocialAuthUser | null> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Apple only provides name on first sign-in
    const givenName = credential.fullName?.givenName || undefined;
    const familyName = credential.fullName?.familyName || undefined;
    const name = [givenName, familyName].filter(Boolean).join(" ") || "Apple User";

    return {
      id: credential.user,
      email: credential.email || `${credential.user}@privaterelay.appleid.com`,
      name,
      givenName,
      familyName,
      provider: "apple",
    };
  } catch (error: any) {
    if (error.code === "ERR_REQUEST_CANCELED") {
      // User canceled the sign-in flow
      logger.log("Apple Sign-In canceled by user");
    } else {
      logger.error("Error signing in with Apple:", error);
    }
    return null;
  }
}

/**
 * Sign out and revoke tokens
 */
export async function signOut() {
  // Clear any stored tokens
  // This would be implemented based on your token storage strategy
  logger.log("User signed out");
}
