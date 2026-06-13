/**
 * Reactive bindings over the synchronous kv() store.
 *
 * Every screen reads persisted data with `useKVJson(key, fallback)`. It is a
 * thin `useSyncExternalStore` wrapper: when any code writes that key (a local
 * edit, a preset load, or a value applied by cross-device sync), the hook
 * re-reads and the screen updates. Writes go through the normal shared storage
 * functions (which call kv()), so there is one source of truth.
 */
import { useCallback, useMemo, useRef } from "react";
import { useSyncExternalStore } from "react";
import { kv } from "@shared/platform/kv";
import { subscribeKV } from "./kvMobile";

/** Subscribe to the raw stored string for a key. */
export function useKVRaw(key: string): string | null {
  const subscribe = useCallback(
    (onChange: () => void) =>
      subscribeKV((changed) => {
        if (changed === key) onChange();
      }),
    [key],
  );
  const getSnapshot = useCallback(() => kv().getItem(key), [key]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Subscribe to a key parsed as JSON, with a fallback when absent/corrupt. */
export function useKVJson<T>(key: string, fallback: T): T {
  const raw = useKVRaw(key);
  // Keep a stable reference to the last parsed value so identical raw strings
  // don't produce new object identities (avoids needless child re-renders).
  const lastRaw = useRef<string | null | undefined>(undefined);
  const lastVal = useRef<T>(fallback);
  return useMemo(() => {
    if (raw === lastRaw.current) return lastVal.current;
    lastRaw.current = raw;
    if (raw == null) {
      lastVal.current = fallback;
      return fallback;
    }
    try {
      lastVal.current = JSON.parse(raw) as T;
    } catch {
      lastVal.current = fallback;
    }
    return lastVal.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);
}

/** Read a key once (non-reactive). */
export function readJson<T>(key: string, fallback: T): T {
  const raw = kv().getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
