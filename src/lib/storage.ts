"use client";

import type { GroceryItem, PantryItem } from "@/lib/types";
import { kv } from "@shared/platform/kv";

const KEYS = {
  pantry: "srf:pantry",
  grocery: "srf:grocery",
  saved: "srf:saved",
} as const;

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = kv().getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    kv().setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/parse errors
  }
}

export const storage = {
  getPantry(): PantryItem[] {
    return safeRead<PantryItem[]>(KEYS.pantry, []);
  },
  setPantry(items: PantryItem[]) {
    safeWrite(KEYS.pantry, items);
  },
  getGrocery(): GroceryItem[] {
    return safeRead<GroceryItem[]>(KEYS.grocery, []);
  },
  setGrocery(items: GroceryItem[]) {
    safeWrite(KEYS.grocery, items);
  },
  getSaved(): string[] {
    return safeRead<string[]>(KEYS.saved, []);
  },
  setSaved(ids: string[]) {
    safeWrite(KEYS.saved, ids);
  },
};

export const STORAGE_KEYS = KEYS;
