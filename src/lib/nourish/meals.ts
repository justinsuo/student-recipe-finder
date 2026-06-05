// Reusable meal library — saved groups of foods the user logs together
// (e.g. "my usual breakfast"). Stored in localStorage under
// srf:nourish-meals so it survives reloads without a backend.

import type { DiaryEntry, FoodItem, MealSlot } from "./types";

const KEY = "srf:nourish-meals";

export interface NourishMealItem {
  food: FoodItem;
  quantityServings: number;
}

export interface NourishMeal {
  id: string;
  name: string;
  description?: string;
  defaultSlot?: MealSlot;
  items: NourishMealItem[];
  /** Cached at save time — sum of per-item food macros × quantity. */
  totalKcal: number;
  totalProteinG: number;
  totalCarbG: number;
  totalFatG: number;
  createdAt: string;
  updatedAt: string;
}

function safeRead<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

export function getMeals(): NourishMeal[] {
  return safeRead<NourishMeal[]>([]);
}

export function getMeal(id: string): NourishMeal | undefined {
  return getMeals().find((m) => m.id === id);
}

export function saveMeal(meal: NourishMeal): void {
  const meals = getMeals();
  const idx = meals.findIndex((m) => m.id === meal.id);
  if (idx >= 0) meals[idx] = meal;
  else meals.push(meal);
  safeWrite(meals);
}

export function deleteMeal(id: string): void {
  safeWrite(getMeals().filter((m) => m.id !== id));
}

/**
 * Sum macros across the meal items so the UI doesn't recompute on every
 * render. Call before save.
 */
export function totalMealMacros(items: NourishMealItem[]): {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
} {
  return items.reduce(
    (acc, it) => ({
      kcal: acc.kcal + it.food.kcal * it.quantityServings,
      proteinG: acc.proteinG + it.food.proteinG * it.quantityServings,
      carbG: acc.carbG + it.food.carbG * it.quantityServings,
      fatG: acc.fatG + it.food.fatG * it.quantityServings,
    }),
    { kcal: 0, proteinG: 0, carbG: 0, fatG: 0 },
  );
}

/**
 * Build the DiaryEntry list you'd push to log() if the user picked this
 * meal on a given date + slot. Caller still has to write to the diary.
 */
export function mealToDiaryEntries(
  meal: NourishMeal,
  date: string,
  slot: MealSlot,
  newIdFn: () => string,
): DiaryEntry[] {
  const loggedAt = new Date().toISOString();
  return meal.items.map((it) => ({
    id: newIdFn(),
    date,
    meal: slot,
    food: it.food,
    quantityServings: it.quantityServings,
    snapshotKcal: it.food.kcal,
    snapshotProteinG: it.food.proteinG,
    snapshotCarbG: it.food.carbG,
    snapshotFatG: it.food.fatG,
    loggedAt,
  }));
}

/**
 * Convert an existing day's diary entries into a saved meal (lets users
 * say "save today's breakfast as a meal" for future quick-logging).
 */
export function entriesToMeal(
  entries: DiaryEntry[],
  name: string,
  description: string | undefined,
  newIdFn: () => string,
  nowIso: string,
): NourishMeal {
  const items: NourishMealItem[] = entries.map((e) => ({
    food: e.food,
    quantityServings: e.quantityServings,
  }));
  const totals = totalMealMacros(items);
  return {
    id: newIdFn(),
    name,
    description,
    defaultSlot: entries[0]?.meal,
    items,
    totalKcal: totals.kcal,
    totalProteinG: totals.proteinG,
    totalCarbG: totals.carbG,
    totalFatG: totals.fatG,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
