import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

import { logger } from "../utils/logger";

WebBrowser.maybeCompleteAuthSession();

const KEYS = {
  ACCESS_TOKEN: "google_calendar_access_token",
  REFRESH_TOKEN: "google_calendar_refresh_token",
  EXPIRY: "google_calendar_token_expiry",
} as const;

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "email",
  "profile",
].join(" ");

const REFRESH_LEEWAY_MS = 5 * 60 * 1000; // refresh 5 min before expiry

function isConfigured(): boolean {
  return Boolean(WEB_CLIENT_ID && SUPABASE_URL);
}

async function exchangeViaEdgeFunction(
  body: Record<string, unknown>
): Promise<{
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
}> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/google-calendar-token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Edge function /google-calendar-token failed (${response.status}): ${text}`
    );
  }
  return response.json();
}

async function persistTokens(tokens: {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}): Promise<void> {
  if (!tokens.access_token) {
    throw new Error("Token exchange returned no access_token");
  }
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, tokens.access_token);
  if (tokens.refresh_token) {
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, tokens.refresh_token);
  }
  if (typeof tokens.expires_in === "number") {
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    await SecureStore.setItemAsync(KEYS.EXPIRY, String(expiresAt));
  }
}

/**
 * Run the full OAuth code-grant flow. The authorization code is exchanged
 * for tokens via a Supabase Edge Function so the Google client secret never
 * lives on the device.
 */
export async function connectGoogleCalendar(): Promise<boolean> {
  if (!isConfigured()) {
    logger.warn(
      "[googleCalendarAuth] Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID or EXPO_PUBLIC_SUPABASE_URL"
    );
    return false;
  }

  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: "steadiday",
      path: "auth/callback",
    });

    const authUrl =
      "https://accounts.google.com/o/oauth2/v2/auth?" +
      `client_id=${WEB_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      "&response_type=code" +
      `&scope=${encodeURIComponent(SCOPES)}` +
      "&access_type=offline" +
      "&prompt=consent";

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    if (result.type !== "success") return false;

    const url = new URL(result.url);
    const code = url.searchParams.get("code");
    if (!code) return false;

    const tokens = await exchangeViaEdgeFunction({ code, redirectUri });
    if (tokens.error) {
      logger.error("[googleCalendarAuth] Token exchange error:", tokens.error);
      return false;
    }

    await persistTokens(tokens);
    return true;
  } catch (error) {
    logger.error("[googleCalendarAuth] Connection failed:", error);
    return false;
  }
}

async function refreshGoogleCalendarToken(): Promise<string | null> {
  try {
    const refreshToken = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    if (!refreshToken) return null;

    const tokens = await exchangeViaEdgeFunction({
      refresh_token: refreshToken,
    });
    if (tokens.error || !tokens.access_token) {
      logger.warn(
        "[googleCalendarAuth] Refresh failed:",
        tokens.error ?? "no access_token"
      );
      return null;
    }

    await persistTokens(tokens);
    return tokens.access_token;
  } catch (error) {
    logger.error("[googleCalendarAuth] Refresh threw:", error);
    return null;
  }
}

/**
 * Returns a valid access token, refreshing it if it is within the leeway
 * window of its expiry. Returns null if there is no stored token or the
 * refresh fails.
 */
export async function getGoogleCalendarToken(): Promise<string | null> {
  try {
    const [token, expiryStr] = await Promise.all([
      SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(KEYS.EXPIRY),
    ]);
    if (!token) return null;

    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      if (Number.isFinite(expiry) && Date.now() > expiry - REFRESH_LEEWAY_MS) {
        return await refreshGoogleCalendarToken();
      }
    }
    return token;
  } catch (error) {
    logger.error("[googleCalendarAuth] getToken threw:", error);
    return null;
  }
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await Promise.allSettled(
    Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k))
  );
}

export async function isGoogleCalendarConnected(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  return Boolean(token);
}
