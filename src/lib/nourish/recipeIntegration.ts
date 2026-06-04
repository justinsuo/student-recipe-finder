// Bridge between the Recipe domain model and the Nourish FoodItem shape.
// Keeps recipe-logging one-tap: compute nutrition → wrap as FoodItem → log.

import type { Recipe } from "@/lib/types";
import { bestEffortNutrition } from "@/lib/nutritionEngine";
import type { FoodItem } from "./types";

/**
 * Converts a seed Recipe into a Nourish FoodItem (per-serving macros).
 * Uses bestEffortNutrition for the best available accuracy.
 */
export function recipeToDiaryFood(recipe: Recipe): FoodItem {
  const { estimate } = bestEffortNutrition(recipe);
  return {
    id: `recipe-${recipe.id}`,
    source: "recipe",
    externalId: recipe.id,
    name: recipe.name,
    servingDescription: `1 serving (of ${recipe.servings})`,
    kcal: estimate.calories,
    proteinG: estimate.protein,
    carbG: estimate.carbs,
    fatG: estimate.fat,
    fiberG: estimate.fiber,
  };
}

/**
 * Finds recipes from the catalog whose per-serving macros fit within the
 * supplied remaining budgets (any macro within `tolerance` fraction over budget
 * is still shown).
 *
 * Sorted by "fit score" — how well the recipe fills the remaining budget without
 * going over on any macro. Higher = better fit.
 */
export function findMacroFitRecipes(
  recipes: Recipe[],
  remainingKcal: number,
  remainingProteinG: number,
  remainingCarbG: number,
  remainingFatG: number,
  tolerance = 0.15,
  maxResults = 6,
): Recipe[] {
  if (remainingKcal <= 0) return [];

  const scored: { recipe: Recipe; score: number }[] = [];

  for (const recipe of recipes) {
    const { estimate } = bestEffortNutrition(recipe);
    const { calories, protein, carbs, fat } = estimate;

    // Skip recipes that would bust any budget by more than the tolerance
    if (calories > remainingKcal * (1 + tolerance)) continue;
    if (protein > remainingProteinG * (1 + tolerance)) continue;
    if (carbs > remainingCarbG * (1 + tolerance)) continue;
    if (fat > remainingFatG * (1 + tolerance)) continue;

    // Score: how much of the remaining budget each macro fills (0–1 each)
    // We bias toward filling protein (×2 weight) since that's typically hardest.
    const calFill = Math.min(calories / remainingKcal, 1);
    const pFill = Math.min(protein / Math.max(remainingProteinG, 1), 1);
    const score = pFill * 2 + calFill;
    scored.push({ recipe, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.recipe);
}
