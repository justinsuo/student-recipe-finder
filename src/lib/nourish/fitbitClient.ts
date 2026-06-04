// Fitbit OAuth 2.0 with PKCE — fully client-side, no server secret needed.
// Docs: https://dev.fitbit.com/build/reference/web-api/developer-guide/authorization/
//
// Setup: register a Fitbit app at dev.fitbit.com
//   - Application Type: "Personal" (higher rate limits) or "Client"
//   - OAuth 2.0 Application Type: must be set to "Client" for PKCE
//   - Callback URL: your /nourish page URL (e.g. https://user.github.io/repo/nourish)
//   - Set NEXT_PUBLIC_FITBIT_CLIENT_ID to the app's Client ID

import type { OAuthToken, DailyActivitySummary } from "./activityTypes";
import {
  getToken,
  setToken,
  clearToken,
  isTokenExpired,
  savePkceVerifier,
  consumePkceVerifier,
  getCachedActivity,
  setCachedActivity,
} from "./activityStorage";

const CLIENT_ID = process.env.NEXT_PUBLIC_FITBIT_CLIENT_ID ?? "";
const AUTH_BASE = "https://www.fitbit.com/oauth2/authorize";
const TOKEN_URL = "https://api.fitbit.com/oauth2/token";
const API_BASE = "https://api.fitbit.com";
const SCOPES = "activity heartrate profile settings";

export function isFitbitConfigured(): boolean {
  return CLIENT_ID.length > 0;
}

export function isFitbitConnected(): boolean {
  return getToken("fitbit") !== null;
}

// ─── PKCE helpers (Web Crypto API) ───────────────────────────────────────────

function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function sha256Base64Url(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// ─── OAuth flow ───────────────────────────────────────────────────────────────

/**
 * Starts the Fitbit OAuth PKCE flow. Redirects the browser to Fitbit's
 * authorization page. After approval, Fitbit redirects back to redirectUri
 * with ?code=... in the URL.
 */
export async function startFitbitAuth(redirectUri: string): Promise<void> {
  if (!CLIENT_ID) throw new Error("NEXT_PUBLIC_FITBIT_CLIENT_ID is not set");
  const verifier = randomBase64Url(64);
  const challenge = await sha256Base64Url(verifier);
  savePkceVerifier(verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: SCOPES,
    redirect_uri: redirectUri,
  });
  window.location.href = `${AUTH_BASE}?${params.toString()}`;
}

/**
 * Exchanges the authorization code for tokens. Call this when the page
 * loads with ?code=... in the URL after Fitbit redirects back.
 */
export async function exchangeFitbitCode(
  code: string,
  redirectUri: string,
): Promise<OAuthToken> {
  const verifier = consumePkceVerifier();
  if (!verifier) throw new Error("No PKCE verifier found — was startFitbitAuth called?");

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Fitbit token exchange failed: ${err.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user_id: string;
    token_type: string;
  };

  const token: OAuthToken = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
    userId: json.user_id,
  };

  // Fetch display name
  try {
    const profile = await fitbitGet<{
      user?: { displayName?: string; avatar?: string };
    }>("/1/user/-/profile.json", token.accessToken);
    token.displayName = profile.user?.displayName;
    token.profileImageUrl = profile.user?.avatar;
  } catch {
    // Non-fatal
  }

  setToken("fitbit", token);
  return token;
}

/**
 * Refreshes an expired Fitbit access token using the refresh token.
 * Fitbit PKCE refresh does NOT require the client_secret.
 */
export async function refreshFitbitToken(): Promise<OAuthToken | null> {
  const existing = getToken("fitbit");
  if (!existing) return null;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: existing.refreshToken,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    // Refresh failed — token revoked or expired beyond recovery
    clearToken("fitbit");
    return null;
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user_id: string;
  };

  const refreshed: OAuthToken = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
    userId: json.user_id,
    displayName: existing.displayName,
    profileImageUrl: existing.profileImageUrl,
  };

  setToken("fitbit", refreshed);
  return refreshed;
}

/**
 * Disconnects Fitbit: clears all stored tokens and cached activity data.
 * Also calls the Fitbit revoke endpoint to deauthorize the app.
 */
export async function disconnectFitbit(): Promise<void> {
  const token = getToken("fitbit");
  if (token) {
    // Best-effort revoke (non-fatal if it fails)
    try {
      await fetch("https://api.fitbit.com/oauth2/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token.accessToken}`,
        },
        body: new URLSearchParams({ token: token.accessToken }),
      });
    } catch {
      // Non-fatal
    }
  }
  clearToken("fitbit");
  const { clearActivityCache } = await import("./activityStorage");
  clearActivityCache("fitbit");
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fitbitGet<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Fitbit API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

/** Returns a valid access token, refreshing if needed. */
async function getValidToken(): Promise<string | null> {
  let token = getToken("fitbit");
  if (!token) return null;
  if (isTokenExpired(token)) {
    token = await refreshFitbitToken();
    if (!token) return null;
  }
  return token.accessToken;
}

// ─── Activity data ────────────────────────────────────────────────────────────

interface FitbitActivityDay {
  summary: {
    caloriesOut?: number;
    activityCalories?: number;
    steps?: number;
    fairlyActiveMinutes?: number;
    veryActiveMinutes?: number;
  };
  activities?: Array<{
    name?: string;
    duration?: number; // ms
    calories?: number;
    startTime?: string;
  }>;
}

/**
 * Fetches activity summary for a single date (YYYY-MM-DD).
 * Returns cached data when available.
 */
export async function getFitbitActivity(
  date: string,
): Promise<DailyActivitySummary | null> {
  const cached = getCachedActivity("fitbit", date);
  if (cached) return cached;

  const accessToken = await getValidToken();
  if (!accessToken) return null;

  try {
    const data = await fitbitGet<FitbitActivityDay>(
      `/1/user/-/activities/date/${date}.json`,
      accessToken,
    );

    const summary: DailyActivitySummary = {
      date,
      provider: "fitbit",
      totalCaloriesBurned: data.summary.caloriesOut,
      activeCalories: data.summary.activityCalories,
      steps: data.summary.steps,
      activeMinutes:
        (data.summary.fairlyActiveMinutes ?? 0) +
        (data.summary.veryActiveMinutes ?? 0),
      workouts: (data.activities ?? []).map((a) => ({
        name: a.name ?? "Activity",
        durationMinutes: Math.round((a.duration ?? 0) / 60_000),
        caloriesBurned: a.calories,
        startTime: a.startTime,
      })),
      fetchedAt: Date.now(),
    };

    setCachedActivity(summary);
    return summary;
  } catch {
    return null;
  }
}
