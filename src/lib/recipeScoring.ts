import { INGREDIENT_MAP } from "@/data/ingredients";
import { RECIPES } from "@/data/recipes";
import {
  quoteIngredient,
  quoteRecipe,
} from "@/lib/pricing/pricingEngine";
import type {
  CheapFilters,
  PantryItem,
  Recipe,
  RecipeIngredient,
  RecipeScoreResult,
  Equipment,
  DietTag,
} from "@/lib/types";

const CHEAP_TAG_INGREDIENTS = new Set([
  "rice",
  "eggs",
  "oats",
  "lentils",
  "black-beans",
  "chickpeas",
  "tortilla",
  "frozen-veg",
  "potato",
  "ramen",
]);

const SPICE_IDS = new Set(
  Array.from(INGREDIENT_MAP.values())
    .filter((i) => i.category === "spice" || ["salt", "pepper"].includes(i.id))
    .map((i) => i.id),
);

export function calculateRecipeCost(recipe: Recipe): number {
  return quoteRecipe(recipe).totalCost;
}

export function calculateCostPerServing(recipe: Recipe): number {
  return quoteRecipe(recipe).costPerServing;
}

export function ingredientCostBreakdown(recipe: Recipe) {
  return recipe.ingredients.map((ri) => {
    const ing = INGREDIENT_MAP.get(ri.ingredientId);
    const q = quoteIngredient(ri.ingredientId, ri.quantity);
    return {
      ingredient: ing,
      quantity: ri.quantity,
      optional: ri.optional ?? false,
      note: ri.note,
      cost: q?.totalCost ?? 0,
      source: q?.source ?? "fallback",
      confidence: q?.confidence ?? "low",
      appliedUnitCost: q?.appliedUnitCost ?? 0,
      multiplier: q?.multiplier ?? 1,
      regionLabel: q?.regionLabel ?? "US avg",
    };
  });
}

export function pantrySetFromItems(pantry: PantryItem[]): Set<string> {
  return new Set(pantry.map((p) => p.ingredientId));
}

export function calculatePantryMatch(
  recipe: Recipe,
  pantrySet: Set<string>,
): { matched: number; total: number } {
  // Count only non-optional, non-pantry-staple-spice ingredients
  const required = recipe.ingredients.filter((ri) => !ri.optional);
  const matched = required.filter((ri) => pantrySet.has(ri.ingredientId)).length;
  return { matched, total: required.length };
}

export function calculateMissingIngredients(
  recipe: Recipe,
  pantrySet: Set<string>,
): RecipeIngredient[] {
  return recipe.ingredients.filter(
    (ri) => !ri.optional && !pantrySet.has(ri.ingredientId),
  );
}

export function calculateMissingCost(
  recipe: Recipe,
  pantrySet: Set<string>,
): number {
  return calculateMissingIngredients(recipe, pantrySet).reduce((sum, ri) => {
    const q = quoteIngredient(ri.ingredientId, ri.quantity);
    return sum + (q?.totalCost ?? 0);
  }, 0);
}

function timeBucketMaxMinutes(bucket: CheapFilters["time"]): number {
  switch (bucket) {
    case "under-10":
      return 10;
    case "under-20":
      return 20;
    case "under-30":
      return 30;
    case "meal-prep":
      return 90;
    default:
      return 999;
  }
}

function recipeMatchesEquipment(recipe: Recipe, allowed: Equipment[]): boolean {
  if (allowed.length === 0) return true;
  if (allowed.includes("no-kitchen")) {
    // Only allow no-cook recipes
    return recipe.equipment.includes("no-kitchen") || recipe.equipment.includes("microwave");
  }
  // recipe must be cookable with at least one of the user's equipment
  return recipe.equipment.some((e) => allowed.includes(e));
}

function recipeMatchesDiet(recipe: Recipe, diet: DietTag[]): boolean {
  if (diet.length === 0) return true;
  return diet.every((d) => recipe.dietTags.includes(d));
}

function explainCheap(recipe: Recipe): string[] {
  const reasons: string[] = [];
  const cheapIngredientNames = recipe.ingredients
    .filter((ri) => CHEAP_TAG_INGREDIENTS.has(ri.ingredientId))
    .map((ri) => INGREDIENT_MAP.get(ri.ingredientId)?.name)
    .filter(Boolean) as string[];
  if (cheapIngredientNames.length > 0) {
    reasons.push(`Cheap because it uses ${cheapIngredientNames.slice(0, 3).join(", ")}`);
  }
  if (recipe.ingredients.filter((ri) => !ri.optional).length <= 6) {
    reasons.push("Short ingredient list");
  }
  if (recipe.totalTimeMinutes <= 15) {
    reasons.push(`Done in ${recipe.totalTimeMinutes} minutes`);
  }
  return reasons;
}

export function rankCheapRecipes(filters: CheapFilters): RecipeScoreResult[] {
  const maxTime = timeBucketMaxMinutes(filters.time);
  const results: RecipeScoreResult[] = [];

  for (const recipe of RECIPES) {
    if (!recipeMatchesEquipment(recipe, filters.equipment)) continue;
    if (!recipeMatchesDiet(recipe, filters.diet)) continue;
    if (recipe.totalTimeMinutes > maxTime) continue;
    if (filters.cuisine && filters.cuisine !== "any" && recipe.cuisine !== filters.cuisine) continue;
    if (filters.mealType && filters.mealType !== "any" && recipe.mealType !== filters.mealType) continue;

    const costPerServing = calculateCostPerServing(recipe);
    if (costPerServing > filters.budgetPerServing) continue;

    const reasons = explainCheap(recipe);
    // Scoring: cheaper is better, faster is better
    const costScore = Math.max(0, 100 - costPerServing * 25);
    const timeScore = Math.max(0, 60 - recipe.totalTimeMinutes);
    const score = costScore + timeScore;

    results.push({
      recipe,
      costPerServing,
      totalCost: calculateRecipeCost(recipe),
      pantryMatched: 0,
      pantryTotal: recipe.ingredients.filter((r) => !r.optional).length,
      missingIngredients: recipe.ingredients.filter((r) => !r.optional),
      missingCost: calculateRecipeCost(recipe),
      matchPercent: 0,
      score,
      reasons,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

export function rankPantryRecipes(
  pantry: PantryItem[],
  filters: Partial<CheapFilters> = {},
): RecipeScoreResult[] {
  const pantrySet = pantrySetFromItems(pantry);
  // Treat spices/staples as "available" so recipes aren't unfairly penalized
  const effectivePantry = new Set<string>(pantrySet);
  for (const id of SPICE_IDS) effectivePantry.add(id);

  const results: RecipeScoreResult[] = [];
  const maxTime = filters.time ? timeBucketMaxMinutes(filters.time) : 999;

  for (const recipe of RECIPES) {
    if (filters.equipment && !recipeMatchesEquipment(recipe, filters.equipment)) continue;
    if (filters.diet && !recipeMatchesDiet(recipe, filters.diet)) continue;
    if (recipe.totalTimeMinutes > maxTime) continue;

    const { matched, total } = calculatePantryMatch(recipe, effectivePantry);
    const missing = calculateMissingIngredients(recipe, effectivePantry);
    const missingCost = calculateMissingCost(recipe, effectivePantry);
    const matchPercent = total === 0 ? 0 : Math.round((matched / total) * 100);
    const costPerServing = calculateCostPerServing(recipe);

    // Skip recipes where user has none of the actual non-spice items
    const nonSpicePantryMatches = recipe.ingredients.filter(
      (ri) => !ri.optional && pantrySet.has(ri.ingredientId),
    ).length;
    if (nonSpicePantryMatches === 0) continue;

    const reasons: string[] = [];
    if (matched > 0) reasons.push(`Uses ${nonSpicePantryMatches} ingredients you already have`);
    if (missing.length > 0 && missingCost < 2) {
      reasons.push(`Only $${missingCost.toFixed(2)} missing`);
    }
    if (recipe.totalTimeMinutes <= 15) reasons.push(`Done in ${recipe.totalTimeMinutes} minutes`);

    // Score: heavily favor more pantry matches, then less missing, then cheaper
    const score =
      matchPercent * 2 +
      Math.max(0, 30 - missing.length * 5) +
      Math.max(0, 30 - missingCost * 5) +
      Math.max(0, 20 - costPerServing * 4);

    results.push({
      recipe,
      costPerServing,
      totalCost: calculateRecipeCost(recipe),
      pantryMatched: nonSpicePantryMatches,
      pantryTotal: total,
      missingIngredients: missing,
      missingCost,
      matchPercent,
      score,
      reasons,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Group pantry results into the four buckets shown on /pantry.
 */
export function groupPantryResults(
  results: RecipeScoreResult[],
  pantry: PantryItem[],
) {
  const useSoonSet = new Set(pantry.filter((p) => p.useSoon).map((p) => p.ingredientId));

  const canMakeNow: RecipeScoreResult[] = [];
  const needFewItems: RecipeScoreResult[] = [];
  const buyOneUnlock: RecipeScoreResult[] = [];
  const useSoon: RecipeScoreResult[] = [];

  for (const r of results) {
    const usesExpiring = r.recipe.ingredients.some((ri) => useSoonSet.has(ri.ingredientId));
    if (usesExpiring) useSoon.push(r);

    if (r.missingIngredients.length === 0) canMakeNow.push(r);
    else if (r.missingIngredients.length <= 2) needFewItems.push(r);
    else if (r.missingIngredients.length === 1) buyOneUnlock.push(r);
    else if (r.missingCost < 3) buyOneUnlock.push(r);
  }

  return { canMakeNow, needFewItems, buyOneUnlock, useSoon };
}

/**
 * Suggests cheap pantry staples that would unlock the most additional recipes
 * if the user added them.
 */
export function recommendSmartBuys(pantry: PantryItem[]): {
  ingredientId: string;
  unlocks: number;
  averageCostPerServing: number;
}[] {
  const pantrySet = pantrySetFromItems(pantry);
  const effective = new Set(pantrySet);
  for (const id of SPICE_IDS) effective.add(id);

  // Candidate staples (cheap items that don't perish quickly)
  const candidates = [
    "rice", "eggs", "pasta", "oats", "lentils", "black-beans",
    "chickpeas", "tortilla", "frozen-veg", "potato", "soy-sauce",
    "garlic", "onion", "peanut-butter", "tuna",
  ].filter((id) => !pantrySet.has(id));

  return candidates
    .map((id) => {
      const probe = new Set(effective);
      probe.add(id);
      const unlocks: number[] = [];
      for (const recipe of RECIPES) {
        const before = recipe.ingredients.filter(
          (ri) => !ri.optional && effective.has(ri.ingredientId),
        ).length;
        const after = recipe.ingredients.filter(
          (ri) => !ri.optional && probe.has(ri.ingredientId),
        ).length;
        // Newly unlocked: now zero missing where before there was one needed item
        const missingBefore = recipe.ingredients.filter(
          (ri) => !ri.optional && !effective.has(ri.ingredientId),
        ).length;
        const missingAfter = recipe.ingredients.filter(
          (ri) => !ri.optional && !probe.has(ri.ingredientId),
        ).length;
        if (after > before && missingAfter <= 1 && missingBefore > 1) {
          unlocks.push(calculateCostPerServing(recipe));
        }
      }
      const avg =
        unlocks.length > 0 ? unlocks.reduce((a, b) => a + b, 0) / unlocks.length : 0;
      return { ingredientId: id, unlocks: unlocks.length, averageCostPerServing: avg };
    })
    .filter((s) => s.unlocks > 0)
    .sort((a, b) => b.unlocks - a.unlocks)
    .slice(0, 6);
}
