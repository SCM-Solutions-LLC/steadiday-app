// Supabase Edge Function: exchange Google OAuth authorization code OR refresh
// token for access tokens. Keeps GOOGLE_CLIENT_SECRET off the device.
//
// Deploy with:
//   supabase functions deploy google-calendar-token
//
// Required secrets (set via `supabase secrets set ...`):
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, apikey",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return jsonResponse(
      { error: "Server missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET" },
      500,
    );
  }

  let payload: {
    code?: string;
    redirectUri?: string;
    refresh_token?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const params = new URLSearchParams();
  params.set("client_id", GOOGLE_CLIENT_ID);
  params.set("client_secret", GOOGLE_CLIENT_SECRET);

  if (payload.refresh_token) {
    params.set("grant_type", "refresh_token");
    params.set("refresh_token", payload.refresh_token);
  } else if (payload.code && payload.redirectUri) {
    params.set("grant_type", "authorization_code");
    params.set("code", payload.code);
    params.set("redirect_uri", payload.redirectUri);
  } else {
    return jsonResponse(
      { error: "Must provide either { code, redirectUri } or { refresh_token }" },
      400,
    );
  }

  try {
    const googleResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const tokens = await googleResponse.json();

    if (!googleResponse.ok) {
      return jsonResponse(
        { error: tokens.error_description ?? tokens.error ?? "Token exchange failed" },
        googleResponse.status,
      );
    }

    return jsonResponse(tokens);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
