/**
 * The set of `srf:` storage keys that participate in cross-device sync.
 *
 * These are user-AUTHORED documents (pantry, grocery, saved, custom recipes &
 * ingredients, pricing prefs, progress, and the full Nourish tracker). Each is
 * an independently JSON-serializable blob — the sync engine treats every key as
 * one syncable document and reconciles with per-key last-write-wins.
 *
 * Deliberately EXCLUDED (local-only / regenerable, would bloat or break sync):
 *   srf:custom-recipe-images  — base64 image blobs (up to ~6MB); mobile keeps
 *                               these on the device filesystem instead.
 *   srf:resolved-cache        — AI ingredient-resolution cache
 *   srf:nourish-food-cache    — USDA lookup cache (24h TTL)
 *   srf:ai-price-book         — AI price cache
 *   srf:recent-searches       — local UX nicety
 *   srf:nourish-adaptive-last-run — local scheduler timestamp
 */
export const SYNCED_KEYS: readonly string[] = [
  // Core app
  "srf:pantry",
  "srf:grocery",
  "srf:saved",
  "srf:custom-recipes",
  "srf:custom-ingredients",
  "srf:location",
  "srf:price-overrides",
  "srf:user-progress",
  "srf:haptics-enabled",
  // Nourish (nutrition tracker)
  "srf:nourish-profile",
  "srf:nourish-targets",
  "srf:nourish-weight-log",
  "srf:nourish-diary",
  "srf:nourish-custom-foods",
  "srf:nourish-recent-foods",
  "srf:nourish-water-log",
  "srf:nourish-meals",
  "srf:nourish-meal-plan",
  "srf:nourish-exercise-log",
  "srf:nourish-fasting-active",
  "srf:nourish-fasting-log",
  "srf:nourish-onboarded",
];

export const SYNCED_KEY_SET: ReadonlySet<string> = new Set(SYNCED_KEYS);

/** Internal bookkeeping keys (never synced, never user-facing). */
export const SYNC_CODE_KEY = "srf:sync-code";
export const SYNC_META_KEY = "srf:sync-meta"; // { [key]: localUpdatedAtMs }
export const SYNC_PUSHED_KEY = "srf:sync-pushed"; // { [key]: lastPushedMs }
export const SYNC_LAST_AT_KEY = "srf:sync-last-at"; // ISO of last successful sync
