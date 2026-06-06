// Tiny haptics layer over the standard Vibration API. Used by
// ThreeDButton on press, by Pressable wrappers, and by celebratory
// moments (saved a recipe, hit a goal, etc.).
//
// Notes:
//  - The Vibration API is only present on Android Chrome / Firefox and
//    a handful of other mobile browsers. iOS Safari / desktop browsers
//    don't have it. Every helper here no-ops on those.
//  - Users can opt out via a localStorage flag (srf:haptics-enabled).
//    Default is enabled. Setting changes are picked up immediately
//    because each call reads the flag fresh — no cache.

const STORAGE_KEY = "srf:haptics-enabled";

function safeWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window;
}

function vibrationSupported(): boolean {
  const w = safeWindow();
  return !!w && typeof w.navigator?.vibrate === "function";
}

/** Reads the user setting. Default = enabled. */
export function isHapticsEnabled(): boolean {
  const w = safeWindow();
  if (!w) return false;
  try {
    const raw = w.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw !== "false";
  } catch {
    return true;
  }
}

/** Toggle / set the user setting. */
export function setHapticsEnabled(enabled: boolean): void {
  const w = safeWindow();
  if (!w) return;
  try {
    w.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    /* ignore quota */
  }
}

function fire(pattern: number | number[]): void {
  if (!vibrationSupported()) return;
  if (!isHapticsEnabled()) return;
  try {
    window.navigator.vibrate(pattern);
  } catch {
    /* swallow */
  }
}

// ─── Patterns ────────────────────────────────────────────────────────

/** Tap feedback — pill toggle, button press, chip select. */
export function hapticLight(): void {
  fire(10);
}

/** Medium tap — committing a form, saving a recipe. */
export function hapticMedium(): void {
  fire(18);
}

/** Sharp success burst — goal hit, recipe generated, meal logged. */
export function hapticSuccess(): void {
  fire([12, 30, 24]);
}

/** Two soft taps — gentle warning before a destructive confirm. */
export function hapticWarning(): void {
  fire([8, 40, 8]);
}

/** Sharp error stutter — destructive action canceled, generation failed. */
export function hapticError(): void {
  fire([18, 50, 18, 50, 18]);
}
