/**
 * App bootstrap — runs once before the UI renders.
 *
 *  1. Hydrate the synchronous storage mirror from AsyncStorage.
 *  2. Install it (wrapped so writes to synced keys schedule a cross-device sync).
 *  3. Apply config: EXPO_PUBLIC_* env (via the facade) + any user overrides
 *     saved in Settings (Worker URL / optional AI keys).
 *  4. Start sync: once now, on a 20s interval, and whenever the app foregrounds.
 */
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { setKV } from "@shared/platform/kv";
import { setConfig } from "@shared/platform/config";
import { makeTrackedKV } from "@shared/sync/trackedKV";
import { isSyncEnabled, syncNow } from "@shared/sync/syncClient";
import { hydrateKV, mobileKV } from "./kvMobile";
import { loadShotsFlag } from "./screenshots";

// Show cooking-timer notifications even while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Per-device settings (NOT synced — each device keeps its own endpoint/keys). */
export const SETTINGS_KEYS = {
  workerUrl: "srf:settings-worker-url",
  anthropic: "srf:settings-anthropic-key",
  usda: "srf:settings-usda-key",
} as const;

let started = false;
let debounce: ReturnType<typeof setTimeout> | null = null;

function scheduleSync(): void {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    if (isSyncEnabled()) syncNow().catch(() => {});
  }, 1200);
}

/** Re-read user config overrides from storage and apply them. */
export function applySavedConfig(): void {
  const workerUrl = mobileKV.getItem(SETTINGS_KEYS.workerUrl) || undefined;
  const anthropicApiKey = mobileKV.getItem(SETTINGS_KEYS.anthropic) || undefined;
  const usdaApiKey = mobileKV.getItem(SETTINGS_KEYS.usda) || undefined;
  setConfig({
    ...(workerUrl ? { workerUrl } : {}),
    ...(anthropicApiKey ? { anthropicApiKey } : {}),
    ...(usdaApiKey ? { usdaApiKey } : {}),
  });
}

export async function bootstrap(): Promise<void> {
  if (started) return;
  started = true;

  await hydrateKV();
  setKV(makeTrackedKV(mobileKV, scheduleSync));
  applySavedConfig();
  await loadShotsFlag();

  if (isSyncEnabled()) syncNow().catch(() => {});
  setInterval(() => {
    if (isSyncEnabled()) syncNow().catch(() => {});
  }, 20000);
  AppState.addEventListener("change", (state) => {
    if (state === "active" && isSyncEnabled()) syncNow().catch(() => {});
  });
}
