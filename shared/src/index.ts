/**
 * @waivy/shared — platform-agnostic glue shared by the web app (Next.js) and
 * the iPhone app (Expo). This package intentionally holds only the NEW
 * cross-platform plumbing:
 *   - platform/kv      synchronous storage facade (localStorage ⇄ AsyncStorage)
 *   - platform/config  build-time config facade (NEXT_PUBLIC_* ⇄ EXPO_PUBLIC_*)
 *   - sync/*           cross-device sync engine (Cloudflare KV via the Worker)
 *
 * The heavy business logic (recipes, ingredients, nutrition/pricing/scoring
 * engines, the Nourish calc engine, AI clients) is NOT duplicated here — it
 * lives once in `src/lib` + `src/data` and is consumed by both platforms. The
 * web app imports it normally; the mobile app aliases `@/ → ../src` and imports
 * the exact same modules, which now read storage/config through these facades.
 */
export * from "./platform/kv";
export * from "./platform/config";
export * from "./sync/keys";
export * from "./sync/syncClient";
export * from "./sync/trackedKV";
