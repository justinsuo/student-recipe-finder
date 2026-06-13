# Waivy for iPhone

A native iOS app (Expo / React Native) version of [Waivy](https://justinsuo.github.io/waivy/) — the AI cooking, pantry, grocery & nutrition assistant for students. It is **not** the website in a webview: it's a mobile-first rebuild with bottom tabs, bottom sheets, gestures, haptics, full-screen guided cooking, camera/voice, and local notifications — while **sharing the website's exact business logic** so recipes, pricing, nutrition and AI never diverge between the two.

## Architecture (why it's not duplicated)

The mobile app lives in `/mobile`. It shares the web app's logic **in place** instead of copying it:

```
waivy/
├── src/              the Next.js web app (recipes, ingredients, the
│                     nutrition / pricing / scoring engines, the Nourish
│                     calc engine, the AI clients) — ONE source of truth
├── shared/src/       NEW cross-platform glue, imported by BOTH apps:
│                       platform/kv.ts      sync storage facade (localStorage ⇄ AsyncStorage)
│                       platform/config.ts  config facade (NEXT_PUBLIC_* ⇄ EXPO_PUBLIC_*)
│                       sync/*              cross-device sync engine (Cloudflare KV)
├── worker/           the Cloudflare Worker (OpenAI proxy + /sync endpoints)
└── mobile/           THIS app (Expo). Imports the above as packages:
                        @/...       → ../src        (web app's shared logic)
                        @shared/... → ../shared/src  (facades + sync)
                        ~/...       → ./src          (this app's own code)
```

Those `@waivy/web` and `@waivy/shared` package links are created in `node_modules` by `scripts/link-shared.js` (runs on `postinstall`). Metro resolves shared code through `node_modules` because it refuses relative imports that escape the project root.

The web app's storage modules were refactored once to read through the `kv()` / `config()` facades, so the **same** `src/lib` engines run unchanged on the phone (a synchronous in-memory mirror is hydrated from AsyncStorage at boot and persists asynchronously).

## Cross-device sync ("edit one side → it changes on the other")

Both apps read/write the same `srf:` keys. When you set a **sync code** (Settings → Sync), every change to your pantry, grocery list, saved recipes, custom recipes, and the whole Nourish diary is pushed to the Worker's KV store and pulled back on the other device — so editing your ingredients on the website updates the phone, and vice-versa. Reconciliation is per-key last-write-wins; it syncs on edit (debounced), on app foreground, and every 20s. The OpenAI key never reaches the device — all generation is proxied by the Worker.

## Screens

Bottom tabs: **Home · AI Chef · Pantry · Nourish · Grocery**. Plus stack/modal screens: Recipe detail, Guided cooking (full-screen), Ask-AI-Chef chat, Recipes hub, Cheap recipes, Explore world, Saved, Recipe Studio (+ manual builder), Settings, and Nourish's Log food / Diary / Goals / Progress.

Every recipe — seed, AI-generated, saved, explore, or hand-built — supports **Ask AI Chef** and **Start Guided Cooking**. Generated recipes always show real macros (recomputed by the shared nutrition engine, never 0).

## Native features

Haptics (expo-haptics), camera/photo ingredient scan (expo-image-picker + Haiku vision), text-to-speech step reading + keep-awake in guided cooking (expo-speech, expo-keep-awake), local notifications for cooking timers (expo-notifications), SVG charts (react-native-svg), bottom sheets, AsyncStorage + filesystem image cache (expo-file-system), safe-area & keyboard-aware layouts. Each degrades to a polished fallback when unavailable.

## Run it

```bash
cd mobile
npm install            # also links @waivy/web + @waivy/shared
npx expo start         # press i for the iOS simulator, or scan the QR in Expo Go
```

Then open **Settings** in the app and paste your Cloudflare Worker URL to enable AI Chef, pricing, image generation, and sync. (See `.env.example` to bake those in at build time instead.) The app is fully usable offline for browsing recipes, the pantry, the grocery list, and manual Nourish logging.

```bash
npx expo export --platform ios   # production bundle
npx expo-doctor                  # environment check
```

## Screenshots — auto-updated on every push

The repo's [screenshot gallery](../docs/screenshots/) regenerates itself, so the
images are never stale:

- The app has a built-in **tour mode** (`src/lib/screenshots.ts` +
  `src/components/ScreenshotDriver.tsx`). When a `shots.json` flag file is dropped
  into its container, it seeds realistic demo data and auto-walks every screen,
  announcing each one.
- [`scripts/capture-screenshots.sh`](scripts/capture-screenshots.sh) flips that
  flag, grabs a clean `simctl io` screenshot per screen into `docs/screenshots/`,
  and downscales them.
- A [`pre-push` git hook](../.githooks/pre-push) runs the capture before every
  push (when a booted sim + Metro are available) and won't let stale images ship.
  Enable it once per clone:

  ```bash
  git config core.hooksPath .githooks      # from the repo root
  ```

  Capture manually any time: `bash mobile/scripts/capture-screenshots.sh`.

## Theme

The "Pantry Pop" palette (cream `#FFF8ED`, basil `#2FBF71`, carrot/butter/grape/teal/sky/pink accents) lives in `src/theme/index.ts`, mirroring the web tokens.
