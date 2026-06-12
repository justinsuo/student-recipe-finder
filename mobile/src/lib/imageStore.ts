/**
 * On-device recipe image storage. AI-generated images can be large base64
 * blobs; storing those in AsyncStorage is slow and size-capped, so we write
 * them to the app's document directory and keep only a small id→filename index
 * in kv (NOT synced — images stay local per device).
 */
import * as FileSystem from "expo-file-system/legacy";
import { kv } from "@shared/platform/kv";

const INDEX_KEY = "srf:rn-image-index"; // { [recipeId]: filename }
const DIR = `${FileSystem.documentDirectory}recipe-images/`;

let ensured = false;

async function ensureDir(): Promise<void> {
  if (ensured) return;
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
    }
  } catch {
    // ignore — writes will surface real errors
  }
  ensured = true;
}

function readIndex(): Record<string, string> {
  try {
    return JSON.parse(kv().getItem(INDEX_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function writeIndex(idx: Record<string, string>): void {
  kv().setItem(INDEX_KEY, JSON.stringify(idx));
}

function safeName(recipeId: string): string {
  return recipeId.replace(/[^a-z0-9-_]/gi, "_");
}

/** Synchronous lookup of a previously-saved local image uri. */
export function localImageUri(recipeId: string): string | undefined {
  const f = readIndex()[recipeId];
  return f ? DIR + f : undefined;
}

export async function saveRecipeImageB64(recipeId: string, b64: string): Promise<string> {
  await ensureDir();
  const filename = `${safeName(recipeId)}.png`;
  const uri = DIR + filename;
  await FileSystem.writeAsStringAsync(uri, b64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const idx = readIndex();
  idx[recipeId] = filename;
  writeIndex(idx);
  return uri;
}

export async function saveRecipeImageFromUrl(recipeId: string, url: string): Promise<string> {
  await ensureDir();
  const filename = `${safeName(recipeId)}.img`;
  const uri = DIR + filename;
  const res = await FileSystem.downloadAsync(url, uri);
  const idx = readIndex();
  idx[recipeId] = filename;
  writeIndex(idx);
  return res.uri;
}

export async function deleteRecipeImage(recipeId: string): Promise<void> {
  const idx = readIndex();
  const f = idx[recipeId];
  if (f) {
    try {
      await FileSystem.deleteAsync(DIR + f, { idempotent: true });
    } catch {
      // ignore
    }
    delete idx[recipeId];
    writeIndex(idx);
  }
}
