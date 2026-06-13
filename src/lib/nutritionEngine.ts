import type { Recipe, NutritionEstimate } from "@/lib/types";
import { INGREDIENT_NUTRITION, type NutritionPerUnit } from "@/data/ingredientNutrition";
import { INGREDIENTS } from "@/data/ingredients";

/**
 * Deterministic recipe macros, computed from each ingredient's per-unit
 * nutrition (USDA averages, see `ingredientNutrition.ts`) multiplied by the
 * quantity in the recipe and summed. Symmetric with the pricing engine.
 *
 * `quantity` on each RecipeIngredient is expressed in the same `unit` that
 * the matching catalog ingredient declares, so the math is straightforward:
 *   total_calories  = Σ ingredient.calories  × quantity
 *   total_protein   = Σ ingredient.protein   × quantity
 *   …etc.
 *
 * Optional ingredients are *included* by default — they contribute to the
 * macros if the cook follows the recipe as written. This matches what we
 * do for cost.
 */

export interface IngredientMacroLine {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  confidence: "high" | "medium" | "low" | "unknown";
}

export interface RecipeMacros {
  perServing: NutritionEstimate;
  totalRecipe: NutritionEstimate;
  servings: number;
  confidence: "high" | "medium" | "low";
  breakdown: IngredientMacroLine[];
  /** Ingredient IDs we had no nutrition entry for — useful for audit. */
  missingIngredientIds: string[];
}

function pickWorstConfidence(
  current: "high" | "medium" | "low",
  next: NutritionPerUnit["confidence"] | "unknown",
): "high" | "medium" | "low" {
  if (next === "unknown" || next === "low") return "low";
  if (next === "medium" && current === "high") return "medium";
  return current;
}

/**
 * Look up nutrition for a catalog ingredient by ID. Returns undefined if
 * we don't have data for it (caller decides how to handle).
 */
export function getIngredientNutrition(
  ingredientId: string,
): NutritionPerUnit | undefined {
  return INGREDIENT_NUTRITION[ingredientId];
}

/**
 * Compute macros for one recipe ingredient (catalog ID + quantity).
 * Unknown ingredients return zeros with confidence: "unknown".
 */
export function calculateIngredientMacros(
  ingredientId: string,
  ingredientName: string,
  quantity: number,
  unit: string,
): IngredientMacroLine {
  const nut = INGREDIENT_NUTRITION[ingredientId];
  if (!nut) {
    return {
      ingredientId,
      ingredientName,
      quantity,
      unit,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      confidence: "unknown",
    };
  }
  const q = Number(quantity);
  const mult = Number.isFinite(q) ? q : 0;
  return {
    ingredientId,
    ingredientName,
    quantity,
    unit,
    calories: round(nut.calories * mult),
    protein: round(nut.protein * mult, 1),
    carbs: round(nut.carbs * mult, 1),
    fat: round(nut.fat * mult, 1),
    fiber: nut.fiber === undefined ? undefined : round(nut.fiber * mult, 1),
    confidence: nut.confidence,
  };
}

/**
 * Sum recipe macros from catalog ingredients. Works on the seed `Recipe`
 * shape (recipes.ts / airFryerRecipes.ts / microwaveRecipes.ts).
 */
export function calculateRecipeMacros(recipe: Recipe): RecipeMacros {
  let confidence: "high" | "medium" | "low" = "high";
  const breakdown: IngredientMacroLine[] = [];
  const missing: string[] = [];

  let totalCal = 0,
    totalProt = 0,
    totalCarb = 0,
    totalFat = 0,
    totalFiber = 0,
    hasAnyFiber = false;

  for (const ing of recipe.ingredients) {
    const nut = INGREDIENT_NUTRITION[ing.ingredientId];
    confidence = pickWorstConfidence(confidence, nut?.confidence ?? "unknown");
    if (!nut) missing.push(ing.ingredientId);

    const line = calculateIngredientMacros(
      ing.ingredientId,
      ing.ingredientId, // seed ingredients only carry the ID; UI looks up name elsewhere
      ing.quantity,
      "", // unit is implicit per catalog
    );
    breakdown.push(line);

    totalCal += line.calories;
    totalProt += line.protein;
    totalCarb += line.carbs;
    totalFat += line.fat;
    if (line.fiber !== undefined) {
      hasAnyFiber = true;
      totalFiber += line.fiber;
    }
  }

  const servings = recipe.servings || 1;
  const total: NutritionEstimate = {
    calories: round(totalCal),
    protein: round(totalProt, 1),
    carbs: round(totalCarb, 1),
    fat: round(totalFat, 1),
    ...(hasAnyFiber ? { fiber: round(totalFiber, 1) } : {}),
  };
  const per: NutritionEstimate = {
    calories: round(total.calories / servings),
    protein: round(total.protein / servings, 1),
    carbs: round(total.carbs / servings, 1),
    fat: round(total.fat / servings, 1),
    ...(hasAnyFiber ? { fiber: round((total.fiber ?? 0) / servings, 1) } : {}),
  };

  return {
    perServing: per,
    totalRecipe: total,
    servings,
    confidence,
    breakdown,
    missingIngredientIds: missing,
  };
}

/**
 * Convenience: returns nutrition for `recipe.ingredients` if we have catalog
 * data; falls back to whatever was hand-written on the seed recipe
 * (`recipe.estimatedNutrition`) when more than half of the ingredients are
 * missing from the catalog.
 */
export function bestEffortNutrition(recipe: Recipe): {
  estimate: NutritionEstimate;
  source: "calculated" | "hand-entered";
  confidence: "high" | "medium" | "low";
  breakdown?: IngredientMacroLine[];
} {
  // A recipe with zero ingredients (custom recipe being authored in
  // /recipe-studio/new) would compute zero macros and a missingRatio of
  // 0, which would silently overwrite the hand-entered estimate with
  // zeros. Short-circuit so the author still sees the macros they
  // typed in.
  if (recipe.ingredients.length === 0) {
    return {
      estimate: recipe.estimatedNutrition,
      source: "hand-entered",
      confidence: "medium",
    };
  }
  // Recipes imported from the web (TheMealDB, tmdb-) and AI-authored famous
  // dishes (gen-) carry AI-estimated per-serving macros — more accurate than
  // recomputing from free-text ingredient amounts that don't map cleanly to
  // catalog units. Trust the stored estimate.
  if (
    (recipe.id.startsWith("tmdb-") || recipe.id.startsWith("gen-")) &&
    recipe.estimatedNutrition?.calories > 0
  ) {
    return {
      estimate: recipe.estimatedNutrition,
      source: "hand-entered",
      confidence: "medium",
    };
  }
  const calc = calculateRecipeMacros(recipe);
  const missingRatio = calc.missingIngredientIds.length / recipe.ingredients.length;
  if (missingRatio > 0.5) {
    return {
      estimate: recipe.estimatedNutrition,
      source: "hand-entered",
      confidence: "medium",
    };
  }
  return {
    estimate: calc.perServing,
    source: "calculated",
    confidence: calc.confidence,
    breakdown: calc.breakdown,
  };
}

/** High-protein helper: returns true when ≥20g protein per serving. */
export function isHighProtein(n: NutritionEstimate): boolean {
  return n.protein >= 20;
}

/** Protein per dollar — handy for the "best value" sort. */
export function proteinPerDollar(
  n: NutritionEstimate,
  costPerServing: number,
): number {
  if (!costPerServing || !Number.isFinite(costPerServing)) return 0;
  return round(n.protein / costPerServing, 1);
}

function round(n: number, decimals = 0): number {
  if (!Number.isFinite(n)) return 0;
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

// ---------- Free-form (AI / custom) ingredient nutrition ----------

/**
 * Match an AI/custom recipe ingredient name to a catalog ID by simple
 * normalized substring matching. Returns the catalog ingredient row that
 * best matches, or undefined.
 *
 * Examples that match:
 *   "cooked white rice (preferably day-old)" → rice
 *   "2 large eggs"                            → eggs
 *   "extra-virgin olive oil"                  → evoo or olive-oil
 */
export function matchIngredientByName(rawName: string): string | undefined {
  const name = rawName
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();
  if (!name) return undefined;

  // Score every catalog ingredient. Highest score wins, min threshold 1.
  let bestId: string | undefined;
  let bestScore = 0;
  for (const ing of INGREDIENTS) {
    const candidate = ing.name.toLowerCase();
    let score = 0;
    if (name === candidate) score = 100;
    else if (name.includes(candidate)) score = candidate.length;
    else if (candidate.includes(name)) score = name.length;
    else {
      // word-level overlap
      const nameWords = new Set(name.split(/\s+/));
      const candWords = candidate.split(/\s+/);
      score = candWords.filter((w) => nameWords.has(w)).length * 3;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = ing.id;
    }
  }
  return bestScore >= 3 ? bestId : undefined;
}

interface FreeFormIngredient {
  name: string;
  quantity: number;
  unit?: string;
}

/**
 * Calculate per-serving + total nutrition for a recipe described with
 * free-form ingredient names (the shape AI Chef returns). Falls back to
 * `undefined` for ingredients we can't match — those contribute zero.
 *
 * The math assumes the recipe's `quantity` is in the same unit the catalog
 * ingredient declares (cup, tbsp, egg, …). When the AI's `unit` clearly
 * differs the result is approximate; we still surface it because *some*
 * data beats none.
 */
export function calculateNutritionForFreeForm(
  ingredients: FreeFormIngredient[],
  servings: number,
): {
  perServing: NutritionEstimate;
  totalRecipe: NutritionEstimate;
  matchedCount: number;
  totalCount: number;
  confidence: "high" | "medium" | "low";
} {
  let totalCal = 0,
    totalProt = 0,
    totalCarb = 0,
    totalFat = 0,
    totalFiber = 0,
    hasAnyFiber = false;
  let matched = 0;
  let confidence: "high" | "medium" | "low" = "high";

  for (const ing of ingredients) {
    const id = matchIngredientByName(ing.name);
    if (!id) continue;
    const nut = INGREDIENT_NUTRITION[id];
    if (!nut) continue;
    matched++;
    confidence = pickWorstConfidence(confidence, nut.confidence);
    const q = Number(ing.quantity);
    const mult = Number.isFinite(q) ? q : 0;
    totalCal += nut.calories * mult;
    totalProt += nut.protein * mult;
    totalCarb += nut.carbs * mult;
    totalFat += nut.fat * mult;
    if (nut.fiber !== undefined) {
      hasAnyFiber = true;
      totalFiber += nut.fiber * mult;
    }
  }

  const matchRatio = ingredients.length ? matched / ingredients.length : 0;
  // If we couldn't match enough ingredients, downgrade confidence — the
  // AI's hand-written `estimatedNutrition` may be more accurate at that
  // point and the caller should decide whether to use ours.
  if (matchRatio < 0.6) confidence = "low";
  else if (matchRatio < 0.85 && confidence === "high") confidence = "medium";

  const s = servings || 1;
  const total: NutritionEstimate = {
    calories: round(totalCal),
    protein: round(totalProt, 1),
    carbs: round(totalCarb, 1),
    fat: round(totalFat, 1),
    ...(hasAnyFiber ? { fiber: round(totalFiber, 1) } : {}),
  };
  const per: NutritionEstimate = {
    calories: round(total.calories / s),
    protein: round(total.protein / s, 1),
    carbs: round(total.carbs / s, 1),
    fat: round(total.fat / s, 1),
    ...(hasAnyFiber ? { fiber: round((total.fiber ?? 0) / s, 1) } : {}),
  };

  return {
    perServing: per,
    totalRecipe: total,
    matchedCount: matched,
    totalCount: ingredients.length,
    confidence,
  };
}
