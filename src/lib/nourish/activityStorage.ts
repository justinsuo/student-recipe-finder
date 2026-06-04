import type {
  OAuthToken,
  ActivityProvider,
  DailyActivitySummary,
  ActivitySettings,
} from "./activityTypes";
import { DEFAULT_ACTIVITY_SETTINGS } from "./activityTypes";

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
  fitbitToken: "srf:nourish-fitbit-token",
  stravaToken: "srf:nourish-strava-token",
  activityCache: "srf:nourish-activity-cache",
  activitySettings: "srf:nourish-activity-settings",
  pkceVerifier: "srf:nourish-pkce-verifier", // session-scoped, cleared after exchange
} as const;

// ─── Primitives ───────────────────────────────────────────────────────────────

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

function tokenKey(provider: ActivityProvider): string {
  return provider === "fitbit" ? KEYS.fitbitToken : KEYS.stravaToken;
}

export function getToken(provider: ActivityProvider): OAuthToken | null {
  return safeRead<OAuthToken | null>(tokenKey(provider), null);
}

export function setToken(provider: ActivityProvider, token: OAuthToken): void {
  safeWrite(tokenKey(provider), token);
}

export function clearToken(provider: ActivityProvider): void {
  safeRemove(tokenKey(provider));
}

export function isConnected(provider: ActivityProvider): boolean {
  return getToken(provider) !== null;
}

export function isTokenExpired(token: OAuthToken): boolean {
  // Treat as expired 60s before actual expiry to allow refresh headroom
  return Date.now() >= token.expiresAt - 60_000;
}

// ─── PKCE verifier (session-scoped temp storage) ──────────────────────────────

export function savePkceVerifier(verifier: string): void {
  safeWrite(KEYS.pkceVerifier, verifier);
}

export function consumePkceVerifier(): string | null {
  const v = safeRead<string | null>(KEYS.pkceVerifier, null);
  safeRemove(KEYS.pkceVerifier);
  return v;
}

// ─── Activity cache ───────────────────────────────────────────────────────────

const CACHE_TTL_TODAY_MS = 1000 * 60 * 60;    // 1 hour for today
const CACHE_TTL_PAST_MS = 1000 * 60 * 60 * 24; // 24 hours for past dates

function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function cacheIsStale(summary: DailyActivitySummary): boolean {
  const ttl = summary.date === today() ? CACHE_TTL_TODAY_MS : CACHE_TTL_PAST_MS;
  return Date.now() - summary.fetchedAt > ttl;
}

export function getCachedActivity(
  provider: ActivityProvider,
  date: string,
): DailyActivitySummary | null {
  const cache = safeRead<DailyActivitySummary[]>(KEYS.activityCache, []);
  const entry = cache.find((e) => e.provider === provider && e.date === date);
  if (!entry) return null;
  if (cacheIsStale(entry)) return null;
  return entry;
}

export function setCachedActivity(summary: DailyActivitySummary): void {
  const cache = safeRead<DailyActivitySummary[]>(KEYS.activityCache, []);
  const idx = cache.findIndex(
    (e) => e.provider === summary.provider && e.date === summary.date,
  );
  if (idx >= 0) {
    cache[idx] = summary;
  } else {
    cache.push(summary);
    // Keep cache bounded: max 60 entries (2 providers × 30 days)
    if (cache.length > 60) {
      cache.sort((a, b) => a.fetchedAt - b.fetchedAt);
      cache.splice(0, cache.length - 60);
    }
  }
  safeWrite(KEYS.activityCache, cache);
}

export function clearActivityCache(provider?: ActivityProvider): void {
  if (!provider) {
    safeRemove(KEYS.activityCache);
    return;
  }
  const cache = safeRead<DailyActivitySummary[]>(KEYS.activityCache, []);
  safeWrite(KEYS.activityCache, cache.filter((e) => e.provider !== provider));
}

// ─── Activity settings ────────────────────────────────────────────────────────

export function getActivitySettings(): ActivitySettings {
  return safeRead<ActivitySettings>(KEYS.activitySettings, DEFAULT_ACTIVITY_SETTINGS);
}

export function setActivitySettings(settings: ActivitySettings): void {
  safeWrite(KEYS.activitySettings, settings);
}
