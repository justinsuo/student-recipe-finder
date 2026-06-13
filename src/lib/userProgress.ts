// Small celebratory progress layer. Counts a handful of meaningful
// actions across the app so we can surface subtle reward toasts
// ("Saved your 10th recipe.", "Logged a meal 5 days in a row.") without
// turning into a full XP / level / mascot system.
//
// Storage: a single object under srf:user-progress. SSR-safe + quota-safe
// using the same pattern as other Nourish storage helpers.

import { kv } from "@shared/platform/kv";

const KEY = "srf:user-progress";

export interface UserProgress {
  pantryItemsAdded: number;
  recipesGenerated: number;
  recipesSaved: number;
  mealsLogged: number;
  groceryItemsAdded: number;
  useSoonIngredientsUsed: number;
}

const DEFAULT: UserProgress = {
  pantryItemsAdded: 0,
  recipesGenerated: 0,
  recipesSaved: 0,
  mealsLogged: 0,
  groceryItemsAdded: 0,
  useSoonIngredientsUsed: 0,
};

function read(): UserProgress {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = kv().getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<UserProgress>) };
  } catch {
    return DEFAULT;
  }
}

function write(value: UserProgress): void {
  if (typeof window === "undefined") return;
  try {
    kv().setItem(KEY, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function getUserProgress(): UserProgress {
  return read();
}

/**
 * Increment a counter and return the new value. Useful so consumers can
 * surface "you just hit your Nth thing" toasts cleanly.
 */
export function bumpProgress(
  key: keyof UserProgress,
  by = 1,
): number {
  const next = read();
  next[key] = next[key] + by;
  write(next);
  return next[key];
}

/**
 * Returns a friendly milestone string if the new count crosses a
 * standard milestone (1, 5, 10, 25, 50, 100, 250, 500). Otherwise null.
 * Consumers decide whether to toast it.
 */
export function milestoneMessage(
  key: keyof UserProgress,
  count: number,
): string | null {
  if (![1, 5, 10, 25, 50, 100, 250, 500].includes(count)) return null;
  switch (key) {
    case "pantryItemsAdded":
      return count === 1
        ? "First pantry item added."
        : `${count} pantry items strong.`;
    case "recipesGenerated":
      return count === 1
        ? "First AI Chef recipe generated."
        : `${count} recipes generated with AI Chef.`;
    case "recipesSaved":
      return count === 1
        ? "First recipe saved."
        : `${count} recipes in your collection.`;
    case "mealsLogged":
      return count === 1
        ? "First meal logged to Nourish."
        : `${count} meals logged.`;
    case "groceryItemsAdded":
      return count === 1
        ? "First item on your grocery list."
        : `${count} grocery items added.`;
    case "useSoonIngredientsUsed":
      return count === 1
        ? "First use-soon ingredient cooked. Waste avoided."
        : `${count} use-soon items rescued.`;
  }
}
