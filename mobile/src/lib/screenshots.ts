/**
 * Screenshot-tour mode. When a `shots.json` flag file is present in the app's
 * Documents dir, the app seeds attractive demo data and auto-walks through every
 * key screen, announcing each one (writing `shot-current.txt`) so an external
 * capture script can grab a clean device screenshot per screen. This is how the
 * repo's screenshot gallery stays current — see mobile/scripts/capture-screenshots.sh.
 *
 * It only runs when the flag file exists, so it never affects normal use.
 */
import * as FileSystem from "expo-file-system/legacy";
import { storage } from "@/lib/storage";
import { saveCustomRecipe, emptyUserRecipe } from "@/lib/customRecipeStorage";
import { RECIPES } from "@/data/recipes";
import { getRecipeImage } from "@/data/recipeImages";
import * as N from "@/lib/nourish/storage";
import type { FoodItem } from "@/lib/nourish/types";

const DIR = FileSystem.documentDirectory ?? "";

export interface ShotsConfig {
  enabled: boolean;
  perRouteMs?: number;
}

let _config: ShotsConfig | null = null;
export function shotsConfig(): ShotsConfig | null {
  return _config;
}

/** Read the flag file at boot. Cheap no-op when absent. */
export async function loadShotsFlag(): Promise<void> {
  try {
    const f = DIR + "shots.json";
    const info = await FileSystem.getInfoAsync(f);
    if (!info.exists) return;
    const cfg = JSON.parse(await FileSystem.readAsStringAsync(f));
    if (cfg && cfg.enabled) _config = cfg;
  } catch {
    // no flag → normal app
  }
}

export async function announce(name: string): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(DIR + "shot-current.txt", name);
  } catch {
    // ignore
  }
}

/** A recipe id that has a real photo, for a good detail screenshot. */
export function demoRecipeId(): string {
  const withPhoto = RECIPES.find((r) => getRecipeImage(r.id));
  return (withPhoto ?? RECIPES[0]).id;
}

/** Populate every surface with realistic demo data for the gallery. */
export function seedDemoData(): void {
  // Pantry
  storage.setPantry(
    ["eggs", "rice", "onion", "garlic", "soy-sauce", "chicken-breast", "spinach", "black-beans", "tortilla", "frozen-veg"].map((id, i) => ({
      ingredientId: id,
      ...(i < 2 ? { useSoon: true } : {}),
    })),
  );
  // Grocery
  storage.setGrocery(
    [
      { ingredientId: "milk", quantity: 1, recipeIds: [], checked: false },
      { ingredientId: "bell-pepper", quantity: 2, recipeIds: [], checked: false },
      { ingredientId: "cheese", quantity: 1, recipeIds: [], checked: true },
      { ingredientId: "oats", quantity: 1, recipeIds: [], checked: false },
    ],
  );
  // Saved
  storage.setSaved(RECIPES.slice(0, 6).map((r) => r.id));
  // A user-made recipe for Studio/Saved
  const ur = emptyUserRecipe();
  ur.name = "My Dorm Ramen Upgrade";
  ur.description = "Instant ramen made real with egg, frozen veg and chili crisp.";
  ur.servings = 1;
  ur.totalTimeMinutes = 12;
  ur.ingredients = [
    { name: "ramen", quantity: 1, unit: "pack", estimatedCost: 0.4 },
    { name: "eggs", quantity: 1, unit: "egg", estimatedCost: 0.25 },
    { name: "frozen veg", quantity: 0.5, unit: "cup", estimatedCost: 0.3 },
  ];
  ur.steps = ["Boil the ramen 3 minutes.", "Crack in the egg and stir.", "Add frozen veg and chili crisp."];
  ur.estimatedNutrition = { calories: 520, protein: 21, carbs: 62, fat: 19 };
  ur.estimatedCostPerServing = 0.95;
  saveCustomRecipe(ur);

  // Nourish: goal + logged meals + water so the dashboard looks alive
  const today = N.todayString();
  N.setTargets({
    effectiveFrom: today,
    mode: "maintain",
    weeklyRateKg: 0,
    calorieTarget: 2200,
    proteinG: 140,
    carbG: 240,
    fatG: 70,
    fiberG: 30,
    source: "manual",
  });
  const meal = (name: string, kcal: number, p: number, c: number, fat: number): FoodItem => ({
    id: N.newId(),
    source: "custom",
    name,
    servingDescription: "1 serving",
    kcal,
    proteinG: p,
    carbG: c,
    fatG: fat,
  });
  N.getDiaryForDate(today).forEach((e) => N.deleteDiaryEntry(e.id));
  [
    { f: meal("Greek yogurt + berries", 280, 22, 34, 6), m: "breakfast" as const },
    { f: meal("Chicken rice bowl", 610, 45, 68, 16), m: "lunch" as const },
    { f: meal("Apple + peanut butter", 240, 7, 28, 12), m: "snack" as const },
  ].forEach(({ f, m }) =>
    N.addDiaryEntry({
      id: N.newId(),
      date: today,
      meal: m,
      food: f,
      quantityServings: 1,
      snapshotKcal: f.kcal,
      snapshotProteinG: f.proteinG,
      snapshotCarbG: f.carbG,
      snapshotFatG: f.fatG,
      loggedAt: today + "T12:00:00.000Z",
    }),
  );
  N.setWaterForDate({ date: today, mlConsumed: 1250, goalMl: 2000 });
}
