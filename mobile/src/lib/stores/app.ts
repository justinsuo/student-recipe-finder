/**
 * Domain stores — reactive hooks over the shared storage functions. These
 * mirror the web AppStore's reducer semantics (dedupe-by-id, merge grocery
 * rows) but persist through the same `srf:` keys so edits sync to the website.
 */
import { useCallback } from "react";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { matchIngredientByName } from "@/lib/nutritionEngine";
import { INGREDIENT_MAP } from "@/data/ingredients";
import type { PantryItem, GroceryItem, Recipe } from "@/lib/types";
import { kv } from "@shared/platform/kv";
import { useKVJson } from "../store";

// ── Pantry ───────────────────────────────────────────────────────────────────

export function usePantry() {
  const pantry = useKVJson<PantryItem[]>(STORAGE_KEYS.pantry, []);

  const add = useCallback((item: PantryItem) => {
    const cur = storage.getPantry();
    if (cur.some((p) => p.ingredientId === item.ingredientId)) return;
    storage.setPantry([...cur, item]);
  }, []);

  const addMany = useCallback((ids: string[]) => {
    const cur = storage.getPantry();
    const have = new Set(cur.map((p) => p.ingredientId));
    const next = [...cur];
    for (const id of ids) {
      if (!have.has(id)) {
        next.push({ ingredientId: id });
        have.add(id);
      }
    }
    storage.setPantry(next);
  }, []);

  const remove = useCallback((id: string) => {
    storage.setPantry(storage.getPantry().filter((p) => p.ingredientId !== id));
  }, []);

  const toggleUseSoon = useCallback((id: string) => {
    storage.setPantry(
      storage.getPantry().map((p) => (p.ingredientId === id ? { ...p, useSoon: !p.useSoon } : p)),
    );
  }, []);

  const clear = useCallback(() => storage.setPantry([]), []);
  const has = useCallback((id: string) => pantry.some((p) => p.ingredientId === id), [pantry]);

  return { pantry, add, addMany, remove, toggleUseSoon, clear, has };
}

// ── Saved ────────────────────────────────────────────────────────────────────

export function useSaved() {
  const saved = useKVJson<string[]>(STORAGE_KEYS.saved, []);
  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);
  const toggleSaved = useCallback((id: string) => {
    const cur = storage.getSaved();
    storage.setSaved(cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]);
  }, []);
  return { saved, isSaved, toggleSaved };
}

// ── Grocery ──────────────────────────────────────────────────────────────────

const FF_NAMES_KEY = "srf:rn-grocery-names"; // { [ffId]: displayName } (local-only)

function ffNames(): Record<string, string> {
  try {
    return JSON.parse(kv().getItem(FF_NAMES_KEY) || "{}");
  } catch {
    return {};
  }
}

export function groceryItemName(id: string): string {
  const builtin = INGREDIENT_MAP.get(id)?.name;
  if (builtin) return builtin;
  if (id.startsWith("ff:")) return ffNames()[id] ?? id.slice(3).replace(/-/g, " ");
  return id;
}

/** Resolve a free-text ingredient name to a catalog id, or a stable ff: id. */
function resolveGroceryId(name: string): string {
  const matched = matchIngredientByName(name);
  if (matched) return matched;
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const id = `ff:${slug}`;
  const map = ffNames();
  if (!map[id]) {
    map[id] = name.trim();
    kv().setItem(FF_NAMES_KEY, JSON.stringify(map));
  }
  return id;
}

export function useGrocery() {
  const grocery = useKVJson<GroceryItem[]>(STORAGE_KEYS.grocery, []);

  const addStaple = useCallback((ingredientId: string) => {
    const cur = storage.getGrocery();
    if (cur.some((g) => g.ingredientId === ingredientId)) return;
    storage.setGrocery([...cur, { ingredientId, quantity: 1, recipeIds: [], checked: false }]);
  }, []);

  /** Add a seed recipe's missing ingredient ids (by ingredientId). */
  const addRecipeMissing = useCallback((recipe: Recipe, missingIds: string[]) => {
    const cur = storage.getGrocery();
    const map = new Map(cur.map((g) => [g.ingredientId, g]));
    for (const id of missingIds) {
      const ri = recipe.ingredients.find((r) => r.ingredientId === id);
      const existing = map.get(id);
      if (existing) {
        if (!existing.recipeIds.includes(recipe.id)) {
          map.set(id, { ...existing, recipeIds: [...existing.recipeIds, recipe.id] });
        }
      } else {
        map.set(id, { ingredientId: id, quantity: ri?.quantity ?? 1, recipeIds: [recipe.id], checked: false });
      }
    }
    storage.setGrocery(Array.from(map.values()));
  }, []);

  /** Add free-text ingredient names (used by AI/custom recipes). */
  const addNames = useCallback((names: string[], recipeId?: string) => {
    const cur = storage.getGrocery();
    const map = new Map(cur.map((g) => [g.ingredientId, g]));
    for (const name of names) {
      const id = resolveGroceryId(name);
      const existing = map.get(id);
      if (existing) {
        if (recipeId && !existing.recipeIds.includes(recipeId)) {
          map.set(id, { ...existing, recipeIds: [...existing.recipeIds, recipeId] });
        }
      } else {
        map.set(id, { ingredientId: id, quantity: 1, recipeIds: recipeId ? [recipeId] : [], checked: false });
      }
    }
    storage.setGrocery(Array.from(map.values()));
  }, []);

  const toggleChecked = useCallback((id: string) => {
    storage.setGrocery(storage.getGrocery().map((g) => (g.ingredientId === id ? { ...g, checked: !g.checked } : g)));
  }, []);

  const remove = useCallback((id: string) => {
    storage.setGrocery(storage.getGrocery().filter((g) => g.ingredientId !== id));
  }, []);

  const clearChecked = useCallback(() => {
    storage.setGrocery(storage.getGrocery().filter((g) => !g.checked));
  }, []);

  const clear = useCallback(() => storage.setGrocery([]), []);

  return { grocery, addStaple, addRecipeMissing, addNames, toggleChecked, remove, clearChecked, clear };
}
