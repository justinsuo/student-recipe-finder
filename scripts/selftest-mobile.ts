/**
 * Headless self-test of the EXACT shared modules the iPhone app runs.
 * Imports through the same `@/` (web logic) and `@shared/` (facades) aliases,
 * exercises the engines the mobile screens call, and asserts real behavior.
 * Run: npx tsx scripts/selftest-mobile.ts
 */
import { setKV, kv } from "@shared/platform/kv";
import { markDirty } from "@shared/sync/syncClient";
import { SYNCED_KEYS } from "@shared/sync/keys";
import { RECIPES } from "@/data/recipes";
import { INGREDIENTS } from "@/data/ingredients";
import { PANTRY_PRESETS } from "@/data/pantryPresets";
import {
  calculateCostPerServing,
  rankCheapRecipes,
  rankPantryRecipes,
  groupPantryResults,
} from "@/lib/recipeScoring";
import {
  bestEffortNutrition,
  calculateNutritionForFreeForm,
  matchIngredientByName,
} from "@/lib/nutritionEngine";
import { storage } from "@/lib/storage";
import { saveCustomRecipe, getCustomRecipes, emptyUserRecipe } from "@/lib/customRecipeStorage";

// In-memory kv so the storage modules work outside a browser.
function memKV() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    getAllKeys: () => Array.from(m.keys()),
  };
}
setKV(memKV());
// React Native defines a global `window` (unlike Node), so the storage modules'
// SSR guards pass on-device. Mimic that here so the round-trip test is faithful.
(globalThis as Record<string, unknown>).window = (globalThis as Record<string, unknown>).window || {};

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}${detail ? "  — " + detail : ""}`); }
  else { fail++; console.log(`  ✗ ${name}  ${detail}`); }
}

console.log("\n── Catalog & engines (what the app renders) ──");
check("recipe catalog loads", RECIPES.length > 100, `${RECIPES.length} recipes`);
check("ingredient catalog loads", INGREDIENTS.length > 100, `${INGREDIENTS.length} ingredients`);
check("pantry presets load", PANTRY_PRESETS.length >= 8, `${PANTRY_PRESETS.length} presets`);

const sample = RECIPES[0];
const cps = calculateCostPerServing(sample);
check("cost-per-serving is real (>0)", cps > 0, `"${sample.name}" = $${cps.toFixed(2)}/serving`);

const nut = bestEffortNutrition(sample).estimate;
check("nutrition is non-zero (no 0 macros)", nut.calories > 0 && nut.protein >= 0, `${Math.round(nut.calories)} cal, ${nut.protein}g protein`);

// AI Chef free-form nutrition recompute path (the "never 0 macros" rule)
const ff = calculateNutritionForFreeForm(
  [ { name: "eggs", quantity: 3, unit: "egg" }, { name: "rice", quantity: 1, unit: "cup" }, { name: "spinach", quantity: 1, unit: "cup" } ],
  2,
);
check("AI free-form macros recompute (>0)", ff.perServing.calories > 0, `${Math.round(ff.perServing.calories)} cal/serving, matched ${ff.matchedCount}/${ff.totalCount}`);
check("ingredient name matching works", matchIngredientByName("chicken breast") != null, `chicken breast → ${matchIngredientByName("chicken breast")}`);

console.log("\n── Cheap ranking & pantry matching ──");
const cheap = rankCheapRecipes({ budgetPerServing: 5, servings: 1, equipment: [], diet: [], time: "any" });
check("cheap ranking returns results", cheap.length > 0, `${cheap.length} under $5/serving`);
check("cheap results sorted cheapest-first", cheap.length < 2 || cheap[0].costPerServing <= cheap[cheap.length - 1].costPerServing, `top = $${cheap[0]?.costPerServing.toFixed(2)}`);

const pantry = [ { ingredientId: "eggs" }, { ingredientId: "rice" }, { ingredientId: "onion" }, { ingredientId: "garlic" }, { ingredientId: "soy-sauce" } ];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ranked = rankPantryRecipes(pantry as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const groups = groupPantryResults(ranked, pantry as any);
check("pantry matching returns recipes", ranked.length > 0, `${ranked.length} matched, ${groups.canMakeNow.length} cook-now`);

console.log("\n── Storage round-trip (what persists/syncs) ──");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
storage.setPantry(pantry as any);
check("pantry persists & reads back", storage.getPantry().length === 5);
const r = emptyUserRecipe();
r.name = "Selftest Recipe";
saveCustomRecipe(r);
check("custom recipe saves & loads", getCustomRecipes().some((c) => c.name === "Selftest Recipe"));

console.log("\n── Sync dirty-tracking (cross-device) ──");
// Simulate a local edit and confirm it's flagged for upload.
markDirty("srf:pantry");
const meta = JSON.parse(kv().getItem("srf:sync-meta") || "{}");
check("edited key flagged dirty for sync", typeof meta["srf:pantry"] === "number");
check("all synced keys are user-data (no caches)", SYNCED_KEYS.every((k) => k.startsWith("srf:")) && !SYNCED_KEYS.includes("srf:nourish-food-cache"), `${SYNCED_KEYS.length} keys`);

console.log(`\n── RESULT: ${pass} passed, ${fail} failed ──\n`);
process.exit(fail === 0 ? 0 : 1);
