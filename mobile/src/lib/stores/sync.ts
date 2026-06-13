/** Reactive sync state for the Settings screen + a header indicator. */
import { useCallback } from "react";
import { useKVRaw } from "../store";
import {
  getSyncCode,
  setSyncCode,
  generateSyncCode,
  isSyncEnabled,
  lastSyncedAt,
  linkAndSync,
  syncNow,
} from "@shared/sync/syncClient";
import { SYNC_CODE_KEY, SYNC_LAST_AT_KEY } from "@shared/sync/keys";

export function useSync() {
  useKVRaw(SYNC_CODE_KEY);
  useKVRaw(SYNC_LAST_AT_KEY);
  const code = getSyncCode();
  const enabled = isSyncEnabled();
  const lastAt = lastSyncedAt();

  const link = useCallback((c: string) => linkAndSync(c), []);
  const create = useCallback(() => linkAndSync(generateSyncCode()), []);
  const unlink = useCallback(() => setSyncCode(null), []);
  const now = useCallback(() => syncNow(), []);

  return { code, enabled, lastAt, link, create, unlink, now };
}
