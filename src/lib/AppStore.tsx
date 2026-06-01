"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { GroceryItem, PantryItem, Recipe } from "@/lib/types";
import { storage } from "@/lib/storage";
import { INGREDIENT_MAP } from "@/data/ingredients";
import { RECIPE_MAP } from "@/data/recipes";

interface AppStoreValue {
  hydrated: boolean;
  pantry: PantryItem[];
  addPantryItem: (item: PantryItem) => void;
  removePantryItem: (ingredientId: string) => void;
  togglePantryUseSoon: (ingredientId: string) => void;
  clearPantry: () => void;

  grocery: GroceryItem[];
  addGroceryItems: (recipe: Recipe, missingIds: string[]) => void;
  addStapleToGrocery: (ingredientId: string) => void;
  toggleGroceryChecked: (ingredientId: string) => void;
  removeGroceryItem: (ingredientId: string) => void;
  clearGrocery: () => void;

  saved: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [grocery, setGrocery] = useState<GroceryItem[]>([]);
  const [saved, setSaved] = useState<string[]>([]);

  // Hydrate from localStorage on mount. localStorage isn't available during
  // SSR, so this set-in-effect is the correct SSR-safe pattern.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPantry(storage.getPantry());
    setGrocery(storage.getGrocery());
    setSaved(storage.getSaved());
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (hydrated) storage.setPantry(pantry);
  }, [pantry, hydrated]);
  useEffect(() => {
    if (hydrated) storage.setGrocery(grocery);
  }, [grocery, hydrated]);
  useEffect(() => {
    if (hydrated) storage.setSaved(saved);
  }, [saved, hydrated]);

  const addPantryItem = useCallback((item: PantryItem) => {
    setPantry((prev) => {
      if (prev.some((p) => p.ingredientId === item.ingredientId)) return prev;
      return [...prev, item];
    });
  }, []);

  const removePantryItem = useCallback((ingredientId: string) => {
    setPantry((prev) => prev.filter((p) => p.ingredientId !== ingredientId));
  }, []);

  const togglePantryUseSoon = useCallback((ingredientId: string) => {
    setPantry((prev) =>
      prev.map((p) =>
        p.ingredientId === ingredientId ? { ...p, useSoon: !p.useSoon } : p,
      ),
    );
  }, []);

  const clearPantry = useCallback(() => setPantry([]), []);

  const addGroceryItems = useCallback((recipe: Recipe, missingIds: string[]) => {
    setGrocery((prev) => {
      const map = new Map(prev.map((g) => [g.ingredientId, g]));
      for (const id of missingIds) {
        const ri = recipe.ingredients.find((r) => r.ingredientId === id);
        if (!ri) continue;
        const existing = map.get(id);
        if (existing) {
          if (!existing.recipeIds.includes(recipe.id)) {
            existing.recipeIds = [...existing.recipeIds, recipe.id];
          }
        } else {
          map.set(id, {
            ingredientId: id,
            quantity: ri.quantity,
            recipeIds: [recipe.id],
            checked: false,
          });
        }
      }
      return Array.from(map.values());
    });
  }, []);

  const addStapleToGrocery = useCallback((ingredientId: string) => {
    setGrocery((prev) => {
      if (prev.some((g) => g.ingredientId === ingredientId)) return prev;
      return [
        ...prev,
        { ingredientId, quantity: 1, recipeIds: [], checked: false },
      ];
    });
  }, []);

  const toggleGroceryChecked = useCallback((ingredientId: string) => {
    setGrocery((prev) =>
      prev.map((g) =>
        g.ingredientId === ingredientId ? { ...g, checked: !g.checked } : g,
      ),
    );
  }, []);

  const removeGroceryItem = useCallback((ingredientId: string) => {
    setGrocery((prev) => prev.filter((g) => g.ingredientId !== ingredientId));
  }, []);

  const clearGrocery = useCallback(() => setGrocery([]), []);

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }, []);

  const value = useMemo<AppStoreValue>(
    () => ({
      hydrated,
      pantry,
      addPantryItem,
      removePantryItem,
      togglePantryUseSoon,
      clearPantry,
      grocery,
      addGroceryItems,
      addStapleToGrocery,
      toggleGroceryChecked,
      removeGroceryItem,
      clearGrocery,
      saved,
      isSaved,
      toggleSaved,
    }),
    [
      hydrated,
      pantry,
      grocery,
      saved,
      addPantryItem,
      removePantryItem,
      togglePantryUseSoon,
      clearPantry,
      addGroceryItems,
      addStapleToGrocery,
      toggleGroceryChecked,
      removeGroceryItem,
      clearGrocery,
      isSaved,
      toggleSaved,
    ],
  );

  return (
    <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}

// Convenience helpers for use in components
export function ingredientName(id: string): string {
  return INGREDIENT_MAP.get(id)?.name ?? id;
}

export function recipeName(id: string): string {
  return RECIPE_MAP.get(id)?.name ?? id;
}
