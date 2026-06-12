/**
 * Cross-device sync engine — shared verbatim by the web app and the iPhone app.
 *
 * Model: an anonymous "sync code" (8 chars) is the account id. State for that
 * code lives in Cloudflare KV behind the Worker as a map of
 *   { [storageKey]: { value: <stringified JSON>, updatedAt: <ms> } }.
 *
 * Reconciliation is per-key last-write-wins by `updatedAt`. Because every list
 * (pantry / grocery / saved / diary / custom recipes ...) uses stable string
 * ids with upsert-by-id semantics, whole-key LWW is safe and predictable. The
 * app calls `syncNow()` on edit (debounced), on foreground, and on a short
 * interval, so "edit on one device → appears on the other" converges in
 * seconds. The same code path runs on web and mobile, so editing the pantry on
 * the website updates the phone and vice-versa.
 */

import { kv, readJSON, writeJSON } from "../platform/kv";
import { config } from "../platform/config";
import {
  SYNCED_KEYS,
  SYNC_CODE_KEY,
  SYNC_META_KEY,
  SYNC_PUSHED_KEY,
  SYNC_LAST_AT_KEY,
} from "./keys";

type Meta = Record<string, number>;
type RemoteEntry = { value: string; updatedAt: number };
type RemoteDoc = { keys: Record<string, RemoteEntry> };

const REQUEST_TIMEOUT_MS = 15000;

// ---- sync code -------------------------------------------------------------

const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no ambiguous chars

export function getSyncCode(): string | null {
  const c = kv().getItem(SYNC_CODE_KEY);
  return c && c.length > 0 ? c : null;
}

export function setSyncCode(code: string | null): void {
  if (!code) {
    kv().removeItem(SYNC_CODE_KEY);
    return;
  }
  kv().setItem(SYNC_CODE_KEY, code.trim().toLowerCase());
}

export function generateSyncCode(rng: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)];
  }
  return out;
}

export function isSyncEnabled(): boolean {
  return !!getSyncCode() && config().workerUrl.length > 0;
}

// ---- local change tracking -------------------------------------------------

function meta(): Meta {
  return readJSON<Meta>(SYNC_META_KEY, {});
}
function pushed(): Meta {
  return readJSON<Meta>(SYNC_PUSHED_KEY, {});
}

/** Record that a synced key changed locally (call after any write). */
export function markDirty(key: string, at: number = Date.now()): void {
  const m = meta();
  m[key] = at;
  writeJSON(SYNC_META_KEY, m);
}

/** Mark every present synced key dirty — used right after linking a code so a
 *  device's existing data is uploaded on the next sync. */
export function markAllDirty(at: number = Date.now()): void {
  const m = meta();
  for (const key of SYNCED_KEYS) {
    if (kv().getItem(key) != null) m[key] = at;
  }
  writeJSON(SYNC_META_KEY, m);
}

export function lastSyncedAt(): string | null {
  return kv().getItem(SYNC_LAST_AT_KEY);
}

// ---- subscribers (so UI can refresh when remote changes land) --------------

type Listener = (changedKeys: string[]) => void;
const listeners = new Set<Listener>();

export function onRemoteApply(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit(changed: string[]): void {
  if (changed.length === 0) return;
  for (const cb of Array.from(listeners)) {
    try {
      cb(changed);
    } catch {
      // a misbehaving listener must not break sync
    }
  }
}

// ---- transport -------------------------------------------------------------

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const base = config().workerUrl;
  if (!base) throw new Error("sync: worker not configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`sync: ${path} failed (${res.status})`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ---- reconcile -------------------------------------------------------------

/** Build the set of local changes not yet confirmed-pushed. */
function collectChanges(): Record<string, RemoteEntry> {
  const m = meta();
  const p = pushed();
  const changes: Record<string, RemoteEntry> = {};
  for (const key of SYNCED_KEYS) {
    const localAt = m[key];
    if (localAt == null) continue; // never touched locally
    if ((p[key] ?? 0) >= localAt) continue; // already pushed
    const value = kv().getItem(key);
    if (value == null) continue;
    changes[key] = { value, updatedAt: localAt };
  }
  return changes;
}

/** Apply a remote doc to local storage with per-key LWW. Returns changed keys. */
function applyRemote(doc: RemoteDoc): string[] {
  const m = meta();
  const p = pushed();
  const changed: string[] = [];
  let metaDirty = false;
  for (const key of SYNCED_KEYS) {
    const remote = doc.keys?.[key];
    if (!remote) continue;
    const localAt = m[key] ?? 0;
    if (remote.updatedAt <= localAt) continue; // local is same/newer
    // remote wins
    if (kv().getItem(key) !== remote.value) {
      kv().setItem(key, remote.value);
      changed.push(key);
    }
    // Record the remote timestamp as both our local and pushed state so the
    // tracked-kv write above (which marks the key dirty) doesn't cause us to
    // re-upload a value we just downloaded.
    m[key] = remote.updatedAt;
    p[key] = remote.updatedAt;
    metaDirty = true;
  }
  if (metaDirty) {
    writeJSON(SYNC_META_KEY, m);
    writeJSON(SYNC_PUSHED_KEY, p);
  }
  return changed;
}

let inFlight: Promise<string[]> | null = null;

/**
 * Push local edits and pull remote edits in one round-trip. Returns the list of
 * keys whose local value changed because of remote data (so the UI can refresh).
 * Safe to call frequently — concurrent calls are de-duplicated.
 */
export function syncNow(): Promise<string[]> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const code = getSyncCode();
    if (!code || !config().workerUrl) return [];
    const changes = collectChanges();
    const doc = await postJSON<RemoteDoc>("/sync/push", { code, changes });
    // Confirm pushed keys.
    if (Object.keys(changes).length) {
      const p = pushed();
      for (const [key, entry] of Object.entries(changes)) {
        p[key] = entry.updatedAt;
      }
      writeJSON(SYNC_PUSHED_KEY, p);
    }
    const changed = applyRemote(doc || { keys: {} });
    kv().setItem(SYNC_LAST_AT_KEY, new Date().toISOString());
    emit(changed);
    return changed;
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Read-only fetch of the remote doc (no upload). Returns changed keys. */
export async function pull(): Promise<string[]> {
  const code = getSyncCode();
  if (!code || !config().workerUrl) return [];
  const doc = await postJSON<RemoteDoc>("/sync/pull", { code });
  const changed = applyRemote(doc || { keys: {} });
  kv().setItem(SYNC_LAST_AT_KEY, new Date().toISOString());
  emit(changed);
  return changed;
}

/** Link a sync code and immediately upload this device's data + pull remote. */
export async function linkAndSync(code: string): Promise<string[]> {
  setSyncCode(code);
  markAllDirty();
  return syncNow();
}
