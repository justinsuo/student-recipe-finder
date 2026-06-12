/**
 * App configuration facade shared by web and mobile.
 *
 * The web app reads secrets/URLs from `process.env.NEXT_PUBLIC_*` (Next inlines
 * these at build time via a literal-member-expression replacement, so the
 * accesses below MUST stay written as `process.env.NEXT_PUBLIC_X`). The mobile
 * app reads `process.env.EXPO_PUBLIC_*` (Expo inlines those) and/or calls
 * `setConfig()` at boot with values from `expo-constants`.
 *
 * Reading through `config()` instead of `process.env` directly means the same
 * AI / worker / USDA / explore client code runs on both platforms.
 *
 * Security: only public/proxy values live here. The OpenAI key never leaves the
 * Cloudflare Worker. The Anthropic key is `*_PUBLIC_*` by design (browser Haiku
 * for the web) and is optional — when absent, AI features degrade gracefully.
 */

export interface WaivyConfig {
  /** Cloudflare Worker base URL (OpenAI proxy + sync). No trailing slash. */
  workerUrl: string;
  /** Optional Anthropic Haiku key for low-latency browser/native AI. */
  anthropicApiKey: string;
  /** Optional USDA FoodData Central key (falls back to DEMO_KEY downstream). */
  usdaApiKey: string;
  /** Explore data source: spoonacular | edamam | themealdb | mock | local. */
  exploreSource: string;
  spoonacularApiKey: string;
  edamamAppId: string;
  edamamAppKey: string;
}

function firstNonEmpty(...vals: Array<string | undefined>): string {
  for (const v of vals) {
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "";
}

function fromEnv(): WaivyConfig {
  // NOTE: each access is a literal `process.env.<NAME>` so bundler inlining works.
  return {
    workerUrl: stripTrailingSlash(
      firstNonEmpty(
        process.env.NEXT_PUBLIC_WORKER_URL,
        process.env.EXPO_PUBLIC_WORKER_URL,
      ),
    ),
    anthropicApiKey: firstNonEmpty(
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    ),
    usdaApiKey: firstNonEmpty(
      process.env.NEXT_PUBLIC_USDA_API_KEY,
      process.env.EXPO_PUBLIC_USDA_API_KEY,
    ),
    exploreSource: firstNonEmpty(
      process.env.NEXT_PUBLIC_EXPLORE_SOURCE,
      process.env.EXPO_PUBLIC_EXPLORE_SOURCE,
      "local",
    ),
    spoonacularApiKey: firstNonEmpty(
      process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY,
      process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY,
    ),
    edamamAppId: firstNonEmpty(
      process.env.NEXT_PUBLIC_EDAMAM_APP_ID,
      process.env.EXPO_PUBLIC_EDAMAM_APP_ID,
    ),
    edamamAppKey: firstNonEmpty(
      process.env.NEXT_PUBLIC_EDAMAM_APP_KEY,
      process.env.EXPO_PUBLIC_EDAMAM_APP_KEY,
    ),
  };
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

let _override: Partial<WaivyConfig> | null = null;

/** Merge platform-provided config (mobile calls this once at boot). */
export function setConfig(c: Partial<WaivyConfig>): void {
  const cleaned: Partial<WaivyConfig> = { ...c };
  if (typeof cleaned.workerUrl === "string") {
    cleaned.workerUrl = stripTrailingSlash(cleaned.workerUrl);
  }
  _override = { ..._override, ...cleaned };
}

/** The active resolved config. */
export function config(): WaivyConfig {
  const base = fromEnv();
  return _override ? { ...base, ..._override } : base;
}
