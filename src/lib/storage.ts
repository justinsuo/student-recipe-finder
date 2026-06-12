"use client";

import { STARTER_PANTRY_IDS } from "@/data/pantryPresets";
import type { GroceryItem, PantryItem } from "@/lib/types";

const KEYS = {
  pantry: "srf:pantry",
  grocery: "srf:grocery",
  saved: "srf:saved",
  pantrySeeded: "srf:pantry-seeded",
} as const;

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/parse errors
  }
}

function rawHas(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

export const storage = {
  getPantry(): PantryItem[] {
    // First-ever load (no pantry entry at all) seeds a starter pantry so a
    // brand-new user can immediately try recipe matching without typing
    // 30 ingredients first. We only seed when the KEY IS ABSENT — if the
    // user has explicitly cleared their pantry (key present but []), we
    // respect that. The `pantrySeeded` flag prevents re-seeding after they
    // later wipe localStorage and restart.
    if (typeof window !== "undefined" && !rawHas(KEYS.pantry) && !rawHas(KEYS.pantrySeeded)) {
      const starter: PantryItem[] = STARTER_PANTRY_IDS.map((ingredientId) => ({
        ingredientId,
      }));
      safeWrite(KEYS.pantry, starter);
      safeWrite(KEYS.pantrySeeded, true);
      return starter;
    }
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
