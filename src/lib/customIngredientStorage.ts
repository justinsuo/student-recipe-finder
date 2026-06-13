"use client";

import type { ResolvedIngredient } from "@/lib/workerClient";
import { kv } from "@shared/platform/kv";

/**
 * Custom (AI-resolved or user-created) pantry ingredients live alongside the
 * built-in catalog. They are stored in localStorage and keyed by their
 * generated `id`. The pantry's PantryItem.ingredientId can reference either
 * a built-in id from src/data/ingredients.ts OR a custom id like "custom-...".
 */

const CUSTOM_KEY = "srf:custom-ingredients";
const CACHE_KEY = "srf:resolved-cache";

export interface CustomIngredient {
  id: string; // "custom-<slug>-<n>"
  canonicalName: string;
  displayName: string;
  aliases: string[];
  category: ResolvedIngredient["category"];
  ingredientRole: ResolvedIngredient["ingredientRole"];
  storageType: ResolvedIngredient["storageType"];
  shelfLifeDays?: number | null;
  estimatedUnitCost?: number | null;
  unit?: string;
  dietaryTags: string[];
  allergyTags: string[];
  notes?: string;
  isCustomIngredient: true;
  createdByUser: boolean;
  createdByAI: boolean;
  createdAt: string;
  updatedAt: string;
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = kv().getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    kv().setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function getCustomIngredients(): CustomIngredient[] {
  return safeRead<CustomIngredient[]>(CUSTOM_KEY, []);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function makeCustomId(name: string): string {
  const base = slugify(name) || "ingredient";
  const existing = new Set(getCustomIngredients().map((c) => c.id));
  let id = `custom-${base}`;
  let i = 2;
  while (existing.has(id)) {
    id = `custom-${base}-${i++}`;
  }
  return id;
}

export function saveCustomIngredient(c: CustomIngredient): CustomIngredient {
  const all = getCustomIngredients();
  const idx = all.findIndex((x) => x.id === c.id);
  if (idx >= 0) all[idx] = c;
  else all.push(c);
  safeWrite(CUSTOM_KEY, all);
  return c;
}

export function deleteCustomIngredient(id: string) {
  const all = getCustomIngredients().filter((c) => c.id !== id);
  safeWrite(CUSTOM_KEY, all);
}

/**
 * Try to find an existing custom or built-in ingredient that matches a
 * canonical name or alias. Returns the matching id if found.
 */
export function findExistingByName(
  name: string,
  builtInMap: { name: string; id: string }[],
): { id: string; source: "builtin" | "custom" } | null {
  const target = name.trim().toLowerCase();
  // built-in by name
  for (const b of builtInMap) {
    if (b.name.toLowerCase() === target) {
      return { id: b.id, source: "builtin" };
    }
  }
  for (const c of getCustomIngredients()) {
    if (c.canonicalName.toLowerCase() === target) {
      return { id: c.id, source: "custom" };
    }
    if (c.displayName.toLowerCase() === target) {
      return { id: c.id, source: "custom" };
    }
    if (c.aliases.some((a) => a.toLowerCase() === target)) {
      return { id: c.id, source: "custom" };
    }
  }
  return null;
}

export function resolvedToCustom(r: ResolvedIngredient): CustomIngredient {
  return {
    id: makeCustomId(r.canonicalName || r.displayName || "ingredient"),
    canonicalName: r.canonicalName,
    displayName: r.displayName || r.canonicalName,
    aliases: r.aliases || [],
    category: r.category,
    ingredientRole: r.ingredientRole,
    storageType: r.storageType,
    shelfLifeDays: r.shelfLifeDays ?? null,
    estimatedUnitCost: r.estimatedUnitCost ?? null,
    unit: r.unit,
    dietaryTags: r.dietaryTags || [],
    allergyTags: r.allergyTags || [],
    notes: r.notes,
    isCustomIngredient: true,
    createdByUser: false,
    createdByAI: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ---------- Resolution cache (avoid re-asking the AI for the same phrase) ----------

interface CachedResolution {
  raw: string;
  ingredients: ResolvedIngredient[];
  at: string;
}

export function getCachedResolution(raw: string): ResolvedIngredient[] | null {
  const map = safeRead<Record<string, CachedResolution>>(CACHE_KEY, {});
  const key = raw.trim().toLowerCase();
  return map[key]?.ingredients ?? null;
}

export function setCachedResolution(raw: string, items: ResolvedIngredient[]) {
  const map = safeRead<Record<string, CachedResolution>>(CACHE_KEY, {});
  const key = raw.trim().toLowerCase();
  map[key] = { raw, ingredients: items, at: new Date().toISOString() };
  safeWrite(CACHE_KEY, map);
}
