/**
 * The mobile recipe catalog. The web app keeps its 229 curated `RECIPES`
 * separate from the ~2,982 macro-recipe records (used only by Nourish). On
 * mobile we want a big browsable + AI-Chef library, so we merge the 229 curated
 * recipes with the 994 "original" macro-recipe dishes → ~1,223 recipes, all the
 * same `Recipe` shape (ingredientId-based, so cost/macros/pantry-matching work).
 *
 * Ranking the web functions (rankPantryRecipes/rankCheapRecipes) only ever scan
 * the 229 `RECIPES`, so we re-implement the same scoring here over the full
 * catalog using the shared per-recipe helpers (identical math, more recipes).
 */
import { RECIPES, RECIPE_MAP } from "@/data/recipes";
import { MACRO_RECIPES } from "@/data/macroRecipes/index";
import { INGREDIENTS } from "@/data/ingredients";
import {
  calculateCostPerServing,
  calculatePantryMatch,
  calculateMissingIngredients,
  calculateMissingCost,
  pantrySetFromItems,
} from "@/lib/recipeScoring";
import { recipeFitsEquipment, type EquipmentProfile } from "@/lib/equipmentFilters";
import type { Recipe, Equipment, DietTag, PantryItem, RecipeScoreResult } from "@/lib/types";

const MACRO_ORIGINALS = MACRO_RECIPES.filter((r) => r.variantType === "original");

export const ALL_RECIPES: Recipe[] = [...RECIPES, ...MACRO_ORIGINALS];
export const ALL_RECIPE_MAP: Map<string, Recipe> = new Map(ALL_RECIPES.map((r) => [r.id, r]));

/** All macro variants of a dish (original / calorie-friendly / protein-friendly). */
export function variantsOf(recipe: Recipe): Recipe[] {
  if (!recipe.variantGroup) return [];
  return MACRO_RECIPES.filter((r) => r.variantGroup === recipe.variantGroup);
}

export function getCatalogRecipe(id: string): Recipe | undefined {
  return ALL_RECIPE_MAP.get(id) ?? RECIPE_MAP.get(id);
}

// Spices/staples are "always on hand" so they don't penalize a pantry match —
// mirrors the web scorer's private SPICE_IDS.
const SPICE_IDS = new Set<string>([
  ...INGREDIENTS.filter((i) => i.category === "spice").map((i) => i.id),
  "salt",
  "pepper",
]);

function matchesDiet(recipe: Recipe, diet: DietTag[]): boolean {
  return diet.every((d) => recipe.dietTags.includes(d));
}

/** Pantry-aware ranking over the FULL catalog (same scoring as the web scorer). */
export function rankPantryCatalog(
  pantry: PantryItem[],
  filters: { equipment?: Equipment[]; diet?: DietTag[] } = {},
): RecipeScoreResult[] {
  const pantrySet = pantrySetFromItems(pantry);
  const effective = new Set<string>([...pantrySet, ...SPICE_IDS]);
  const equipment = filters.equipment ?? [];
  const diet = filters.diet ?? [];

  const results: RecipeScoreResult[] = [];
  for (const recipe of ALL_RECIPES) {
    if (equipment.length && !recipeFitsEquipment(recipe, equipment)) continue;
    if (diet.length && !matchesDiet(recipe, diet)) continue;

    // require at least one non-spice, non-optional pantry match
    const nonSpiceMatches = recipe.ingredients.filter(
      (ri) => !ri.optional && pantrySet.has(ri.ingredientId) && !SPICE_IDS.has(ri.ingredientId),
    ).length;
    if (nonSpiceMatches === 0) continue;

    const { matched, total } = calculatePantryMatch(recipe, effective);
    const matchPercent = total > 0 ? (matched / total) * 100 : 0;
    const missing = calculateMissingIngredients(recipe, effective);
    const missingCost = calculateMissingCost(recipe, effective);
    const costPerServing = calculateCostPerServing(recipe);
    const score =
      matchPercent * 2 +
      Math.max(0, 30 - missing.length * 5) +
      Math.max(0, 30 - missingCost * 5) +
      Math.max(0, 20 - costPerServing * 4);

    results.push({
      recipe,
      costPerServing,
      totalCost: costPerServing * recipe.servings,
      pantryMatched: nonSpiceMatches,
      pantryTotal: recipe.ingredients.filter((ri) => !ri.optional).length,
      missingIngredients: missing,
      missingCost,
      matchPercent,
      score,
      reasons: [],
    });
  }
  return results.sort((a, b) => b.score - a.score);
}

/** Cheapest-first ranking over the FULL catalog. */
export function rankCheapCatalog(filters: {
  budgetPerServing: number;
  equipment?: Equipment[];
  diet?: DietTag[];
  maxTimeMinutes?: number;
}): RecipeScoreResult[] {
  const equipment = filters.equipment ?? [];
  const diet = filters.diet ?? [];
  const maxTime = filters.maxTimeMinutes ?? 9999;
  const budget = filters.budgetPerServing > 0 ? filters.budgetPerServing : 9999;

  const results: RecipeScoreResult[] = [];
  for (const recipe of ALL_RECIPES) {
    if (equipment.length && !recipeFitsEquipment(recipe, equipment)) continue;
    if (diet.length && !matchesDiet(recipe, diet)) continue;
    if (recipe.totalTimeMinutes > maxTime) continue;
    const costPerServing = calculateCostPerServing(recipe);
    if (costPerServing > budget) continue;
    const score = Math.max(0, 100 - costPerServing * 25) + Math.max(0, 60 - recipe.totalTimeMinutes);
    results.push({
      recipe,
      costPerServing,
      totalCost: costPerServing * recipe.servings,
      pantryMatched: 0,
      pantryTotal: recipe.ingredients.filter((r) => !r.optional).length,
      missingIngredients: recipe.ingredients.filter((r) => !r.optional),
      missingCost: 0,
      matchPercent: 0,
      score,
      reasons: [],
    });
  }
  return results.sort((a, b) => b.score - a.score || a.costPerServing - b.costPerServing);
}

export type { EquipmentProfile };
