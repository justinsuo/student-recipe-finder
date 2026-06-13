/**
 * Synchronous key/value facade shared by web and mobile.
 *
 * Why this exists: the whole Waivy persistence layer (pantry, grocery, saved,
 * custom recipes, pricing overrides, the entire Nourish tracker) is written as
 * synchronous `JSON.parse(localStorage.getItem(key))` reads. On the web that
 * is `window.localStorage`. React Native has no `localStorage` — and crucially,
 * RN *does* define a global `window`, so the old `typeof window === "undefined"`
 * SSR guards do NOT protect us (they pass, then `window.localStorage.getItem`
 * throws). Routing every read/write through this facade lets the exact same
 * storage/pricing/scoring/nourish modules run unchanged on both platforms.
 *
 * - Web: the default implementation auto-detects `localStorage`, so the web app
 *   keeps byte-identical behavior with zero wiring.
 * - Mobile: calls `setKV()` once at boot with a synchronous in-memory mirror
 *   that is hydrated from AsyncStorage and writes through asynchronously.
 *
 * The `srf:` key strings are legacy ("Student Recipe Finder") and MUST stay
 * identical across platforms — that is what makes cross-device sync work.
 */

export interface SyncKV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  /** All keys currently held. Used by the sync engine to snapshot state. */
  getAllKeys(): string[];
}

function makeMemoryKV(): SyncKV {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k, v) => {
      m.set(k, v);
    },
    removeItem: (k) => {
      m.delete(k);
    },
    getAllKeys: () => Array.from(m.keys()),
  };
}

function detectDefaultKV(): SyncKV {
  // Web / any environment that exposes a real localStorage.
  try {
    const g = globalThis as unknown as { localStorage?: Storage };
    if (g.localStorage && typeof g.localStorage.getItem === "function") {
      const ls = g.localStorage;
      // Smoke-test that it actually works (Safari private mode can throw).
      const probe = "__waivy_kv_probe__";
      ls.setItem(probe, "1");
      ls.removeItem(probe);
      return {
        getItem: (k) => ls.getItem(k),
        setItem: (k, v) => ls.setItem(k, v),
        removeItem: (k) => ls.removeItem(k),
        getAllKeys: () => {
          const keys: string[] = [];
          for (let i = 0; i < ls.length; i++) {
            const k = ls.key(i);
            if (k != null) keys.push(k);
          }
          return keys;
        },
      };
    }
  } catch {
    // fall through to memory (SSR, RN before setKV, private mode, etc.)
  }
  return makeMemoryKV();
}

let _kv: SyncKV = detectDefaultKV();

/** Override the backing store (mobile binds an AsyncStorage-backed mirror). */
export function setKV(kv: SyncKV): void {
  _kv = kv;
}

/** The active key/value store. */
export function kv(): SyncKV {
  return _kv;
}

/** Convenience helpers used throughout the storage modules. */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = _kv.getItem(key);
    if (raw == null || raw === "") return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    _kv.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / serialization errors — matches old safeWrite behavior
  }
}

export function removeKey(key: string): void {
  try {
    _kv.removeItem(key);
  } catch {
    // ignore
  }
}
