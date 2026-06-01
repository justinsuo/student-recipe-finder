import { INGREDIENT_MAP } from "@/data/ingredients";
import type { Recipe, RecipeIngredient } from "@/lib/types";
import type {
  PriceConfidence,
  PriceQuote,
  RecipeLocalPrice,
  UserLocation,
} from "./locationTypes";
import { getRegion } from "./regions";
import { getLocation, getOverride } from "./locationStorage";

/**
 * Quote a single ingredient at the user's region. Uses (in priority order):
 *   1. User override (high confidence)
 *   2. Catalog base price × region multiplier (medium confidence)
 *   3. Returns null if no base price is known (caller should fall back)
 */
export function quoteIngredient(
  ingredientId: string,
  quantity: number,
  location?: UserLocation,
): PriceQuote | null {
  const loc = location ?? getLocation();
  const region = getRegion(loc.regionId);
  const override = getOverride(ingredientId);
  const builtIn = INGREDIENT_MAP.get(ingredientId);

  // Built-in only — also gives us name + unit
  if (override && builtIn) {
    const applied = override.unitCost;
    return {
      ingredientId,
      ingredientName: builtIn.name,
      baseUnitCost: builtIn.estimatedUnitCost,
      appliedUnitCost: applied,
      quantity,
      unit: override.unit || builtIn.unit,
      totalCost: applied * quantity,
      regionLabel: region.shortLabel ?? region.label,
      multiplier: region.multiplier,
      source: "override",
      confidence: "high",
      note: override.note,
    };
  }
  if (builtIn) {
    const applied = builtIn.estimatedUnitCost * region.multiplier;
    return {
      ingredientId,
      ingredientName: builtIn.name,
      baseUnitCost: builtIn.estimatedUnitCost,
      appliedUnitCost: applied,
      quantity,
      unit: builtIn.unit,
      totalCost: applied * quantity,
      regionLabel: region.shortLabel ?? region.label,
      multiplier: region.multiplier,
      source: "catalog",
      confidence: region.id === "national" ? "medium" : "medium",
    };
  }
  // No built-in match — caller (e.g. for custom ingredients) should resolve
  return null;
}

function worstOf(...c: PriceConfidence[]): PriceConfidence {
  if (c.includes("low")) return "low";
  if (c.includes("medium")) return "medium";
  return "high";
}

export function quoteRecipe(
  recipe: Recipe,
  options?: {
    location?: UserLocation;
    pantrySet?: Set<string>;
  },
): RecipeLocalPrice {
  const loc = options?.location ?? getLocation();
  const region = getRegion(loc.regionId);
  const breakdown: PriceQuote[] = [];
  let total = 0;
  let missingTotal = 0;
  let confidence: PriceConfidence = "high";

  for (const ri of recipe.ingredients as RecipeIngredient[]) {
    if (ri.optional) continue;
    const q = quoteIngredient(ri.ingredientId, ri.quantity, loc);
    if (!q) continue;
    breakdown.push(q);
    total += q.totalCost;
    if (options?.pantrySet && !options.pantrySet.has(ri.ingredientId)) {
      missingTotal += q.totalCost;
    }
    confidence = worstOf(confidence, q.confidence);
  }

  return {
    totalCost: total,
    costPerServing: total / Math.max(1, recipe.servings),
    regionLabel: region.shortLabel ?? region.label,
    multiplier: region.multiplier,
    breakdown,
    missingTotalCost: missingTotal,
    worstConfidence: confidence,
  };
}

/**
 * Cheap helper for components that only need cost-per-serving with current
 * user location applied.
 */
export function localCostPerServing(recipe: Recipe): number {
  return quoteRecipe(recipe).costPerServing;
}

export function localTotalCost(recipe: Recipe): number {
  return quoteRecipe(recipe).totalCost;
}
