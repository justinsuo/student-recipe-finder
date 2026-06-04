// Strava OAuth 2.0 — token exchange proxied via Cloudflare Worker
// (Strava requires client_secret, which must not be in the browser).
// Docs: https://developers.strava.com/docs/authentication/
//
// Setup: create a Strava API app at strava.com/settings/api
//   - Authorization Callback Domain: your site's domain
//   - Set NEXT_PUBLIC_STRAVA_CLIENT_ID to the app's Client ID
//   - Set Worker secret STRAVA_CLIENT_SECRET to the app's Client Secret
//   - Set Worker var STRAVA_CLIENT_ID to the app's Client ID

import type { OAuthToken, DailyActivitySummary, Workout } from "./activityTypes";
import {
  getToken,
  setToken,
  clearToken,
  isTokenExpired,
  getCachedActivity,
  setCachedActivity,
} from "./activityStorage";

const CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID ?? "";
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? "";
const AUTH_BASE = "https://www.strava.com/oauth/authorize";
const API_BASE = "https://www.strava.com/api/v3";
// Strava scopes: activity:read gives access to activities
const SCOPE = "read,activity:read";

export function isStravaConfigured(): boolean {
  return CLIENT_ID.length > 0 && WORKER_URL.length > 0;
}

export function isStravaConnected(): boolean {
  return getToken("strava") !== null;
}

// ─── OAuth flow ───────────────────────────────────────────────────────────────

/**
 * Starts the Strava authorization flow. Redirects to Strava's OAuth page.
 * After approval, Strava redirects back to redirectUri with ?code=...
 */
export function startStravaAuth(redirectUri: string): void {
  if (!CLIENT_ID) throw new Error("NEXT_PUBLIC_STRAVA_CLIENT_ID is not set");
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    approval_prompt: "auto",
    scope: SCOPE,
    state: "strava",
  });
  window.location.href = `${AUTH_BASE}?${params.toString()}`;
}

/**
 * Exchanges the Strava auth code for tokens via the Worker proxy.
 * The Worker holds the client_secret and forwards the exchange to Strava.
 */
export async function exchangeStravaCode(
  code: string,
  redirectUri: string,
): Promise<OAuthToken> {
  if (!WORKER_URL) throw new Error("NEXT_PUBLIC_WORKER_URL is not set");

  const res = await fetch(`${WORKER_URL}/oauth/strava/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: `HTTP ${res.status}` }))) as { error?: string };
    throw new Error(`Strava token exchange failed: ${err.error ?? res.status}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number; // unix timestamp seconds (Strava uses seconds, not ms)
    athlete?: {
      id?: number;
      firstname?: string;
      lastname?: string;
      profile_medium?: string;
    };
  };

  const token: OAuthToken = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: json.expires_at * 1000, // convert to ms
    userId: json.athlete?.id ? String(json.athlete.id) : undefined,
    displayName: [json.athlete?.firstname, json.athlete?.lastname].filter(Boolean).join(" ") || undefined,
    profileImageUrl: json.athlete?.profile_medium,
  };

  setToken("strava", token);
  return token;
}

/**
 * Refreshes the Strava access token via the Worker proxy.
 */
export async function refreshStravaToken(): Promise<OAuthToken | null> {
  const existing = getToken("strava");
  if (!existing || !WORKER_URL) return null;

  const res = await fetch(`${WORKER_URL}/oauth/strava/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: existing.refreshToken, grant_type: "refresh_token" }),
  });

  if (!res.ok) {
    clearToken("strava");
    return null;
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };

  const refreshed: OAuthToken = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: json.expires_at * 1000,
    userId: existing.userId,
    displayName: existing.displayName,
    profileImageUrl: existing.profileImageUrl,
  };

  setToken("strava", refreshed);
  return refreshed;
}

/**
 * Disconnects Strava: clears tokens and activity cache.
 * Strava has a deauthorize endpoint but it requires a POST with access_token.
 */
export async function disconnectStrava(): Promise<void> {
  const token = getToken("strava");
  if (token) {
    try {
      await fetch("https://www.strava.com/oauth/deauthorize", {
        method: "POST",
        headers: { Authorization: `Bearer ${token.accessToken}` },
      });
    } catch {
      // Non-fatal
    }
  }
  clearToken("strava");
  const { clearActivityCache } = await import("./activityStorage");
  clearActivityCache("strava");
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function stravaGet<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Strava API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

async function getValidToken(): Promise<string | null> {
  let token = getToken("strava");
  if (!token) return null;
  if (isTokenExpired(token)) {
    token = await refreshStravaToken();
    if (!token) return null;
  }
  return token.accessToken;
}

// ─── Activity data ────────────────────────────────────────────────────────────

interface StravaActivity {
  name?: string;
  type?: string;
  start_date?: string;    // ISO-8601
  elapsed_time?: number;  // seconds
  calories?: number;
  kudos_count?: number;
}

/**
 * Fetches Strava activities for a specific date.
 * Strava returns per-workout activities, not an aggregated daily summary.
 * We sum calories from all workouts on that date.
 */
export async function getStravaActivity(
  date: string,
): Promise<DailyActivitySummary | null> {
  const cached = getCachedActivity("strava", date);
  if (cached) return cached;

  const accessToken = await getValidToken();
  if (!accessToken) return null;

  try {
    // Strava uses Unix timestamps for after/before filtering
    const dateObj = new Date(date + "T00:00:00");
    const after = Math.floor(dateObj.getTime() / 1000);
    const before = after + 86400;

    const activities = await stravaGet<StravaActivity[]>(
      `/athlete/activities?after=${after}&before=${before}&per_page=20`,
      accessToken,
    );

    const workouts: Workout[] = activities.map((a) => ({
      name: a.name ?? a.type ?? "Activity",
      durationMinutes: Math.round((a.elapsed_time ?? 0) / 60),
      caloriesBurned: a.calories ?? undefined,
      startTime: a.start_date,
    }));

    const totalActive = workouts.reduce(
      (sum, w) => sum + (w.caloriesBurned ?? 0),
      0,
    );

    const summary: DailyActivitySummary = {
      date,
      provider: "strava",
      // Strava doesn't give total daily TDEE — only per-workout active calories
      totalCaloriesBurned: undefined,
      activeCalories: totalActive > 0 ? totalActive : undefined,
      steps: undefined,
      activeMinutes: workouts.reduce((s, w) => s + w.durationMinutes, 0),
      workouts,
      fetchedAt: Date.now(),
    };

    setCachedActivity(summary);
    return summary;
  } catch {
    return null;
  }
}
