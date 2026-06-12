/**
 * Mobile storage mirror.
 *
 * The shared business logic (recipes, pantry, pricing, Nourish) reads and writes
 * synchronously through the `kv()` facade. React Native's AsyncStorage is async,
 * so we keep a synchronous in-memory mirror that is hydrated from AsyncStorage
 * once at boot and writes through asynchronously. This lets the exact same web
 * storage modules run unchanged on the phone.
 *
 * It also emits a change event on every write so the UI (via useSyncExternalStore
 * in store.ts) re-renders — both for local edits and for values applied by the
 * cross-device sync engine.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SyncKV } from "@shared/platform/kv";

const mem = new Map<string, string>();

type Listener = (key: string) => void;
const listeners = new Set<Listener>();

export function subscribeKV(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function emit(key: string): void {
  for (const l of Array.from(listeners)) {
    try {
      l(key);
    } catch {
      // a broken listener must not break storage
    }
  }
}

/** Load all `srf:` keys from disk into the synchronous mirror. Call once at boot. */
export async function hydrateKV(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const ours = allKeys.filter((k) => k.startsWith("srf:"));
    if (ours.length === 0) return;
    const pairs = await AsyncStorage.multiGet(ours);
    for (const [k, v] of pairs) {
      if (v != null) mem.set(k, v);
    }
  } catch {
    // first launch / storage unavailable — start empty
  }
}

export const mobileKV: SyncKV = {
  getItem: (key) => (mem.has(key) ? (mem.get(key) as string) : null),
  setItem: (key, value) => {
    const prev = mem.get(key);
    mem.set(key, value);
    if (prev !== value) {
      AsyncStorage.setItem(key, value).catch(() => {});
      emit(key);
    }
  },
  removeItem: (key) => {
    if (mem.has(key)) {
      mem.delete(key);
      AsyncStorage.removeItem(key).catch(() => {});
      emit(key);
    }
  },
  getAllKeys: () => Array.from(mem.keys()),
};
