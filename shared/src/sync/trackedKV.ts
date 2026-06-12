/**
 * Wraps a SyncKV so that any write to a SYNCED key automatically records a
 * dirty timestamp and (optionally) schedules a sync. This keeps the storage
 * modules ignorant of sync — they just read/write through `kv()` as before, and
 * the wrapper handles change tracking centrally on both web and mobile.
 *
 * No recursion risk: the bookkeeping keys (srf:sync-meta etc.) are NOT in the
 * synced set, so `markDirty`'s own write does not re-trigger tracking.
 */
import type { SyncKV } from "../platform/kv";
import { SYNCED_KEY_SET } from "./keys";
import { markDirty } from "./syncClient";

export function makeTrackedKV(base: SyncKV, onDirty?: () => void): SyncKV {
  const touch = (k: string) => {
    if (SYNCED_KEY_SET.has(k)) {
      markDirty(k);
      onDirty?.();
    }
  };
  return {
    getItem: (k) => base.getItem(k),
    setItem: (k, v) => {
      base.setItem(k, v);
      touch(k);
    },
    removeItem: (k) => {
      base.removeItem(k);
      touch(k);
    },
    getAllKeys: () => base.getAllKeys(),
  };
}
