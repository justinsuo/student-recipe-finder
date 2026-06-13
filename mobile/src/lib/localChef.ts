/**
 * On-device AI Chef. When no Worker/Anthropic backend is configured, this
 * produces real recipe "options" tailored to the user's pantry + constraints by
 * ranking the shared 229-recipe catalog with the real scoring/pricing/nutrition
 * engines — so AI Chef always works, instantly and offline, with honest cost &
 * macros. When a Worker URL IS set, the worker path (GPT originals) is used
 * instead (see ai.ts).
 */
import { INGREDIENT_MAP } from "@/data/ingredients";
import {
  calculateCostPerServing,
  ingredientCostBreakdown,
} from "@/lib/recipeScoring";
import { bestEffortNutrition } from "@/lib/nutritionEngine";
import { ALL_RECIPES, rankPantryCatalog, rankCheapCatalog } from "./catalog";
import type { Recipe, Equipment, DietTag } from "@/lib/types";
import type { GeneratedRecipe, GeneratedRecipeOptionSet, OptionLabel } from "@/lib/workerClient";

function ingredientLabel(id: string): string {
  return INGREDIENT_MAP.get(id)?.name ?? id;
}

export interface LocalChefInput {
  pantryIds: string[];
  budgetPerServing?: number;
  servings?: number;
  equipment?: string[];
  dietTags?: string[];
  notes?: string;
}

function mapDifficulty(d: Recipe["difficulty"]): GeneratedRecipe["difficulty"] {
  return d === "hard" ? "medium" : d;
}

function recipeToGenerated(r: Recipe, pantry: Set<string>, why: string): GeneratedRecipe {
  const nut = bestEffortNutrition(r).estimate;
  const cps = calculateCostPerServing(r);
  const costByIng = new Map<string, number>();
  for (const b of ingredientCostBreakdown(r)) {
    if (b.ingredient) costByIng.set(b.ingredient.id, b.cost);
  }
  const missing = r.ingredients.filter((ri) => !ri.optional && !pantry.has(ri.ingredientId));
  return {
    name: r.name,
    description: r.description,
    userRequestSummary: "",
    whyThisFits: why,
    mealType: r.mealType,
    cuisineStyle: r.cuisine ?? "",
    servings: r.servings,
    prepTimeMinutes: r.prepTimeMinutes ?? Math.round(r.totalTimeMinutes * 0.3),
    cookTimeMinutes: r.cookTimeMinutes ?? Math.round(r.totalTimeMinutes * 0.7),
    totalTimeMinutes: r.totalTimeMinutes,
    difficulty: mapDifficulty(r.difficulty),
    equipment: r.equipment,
    primaryCookingMethod: r.primaryCookingMethod ?? "stovetop",
    noStovetopRequired: !!r.noStovetopRequired,
    estimatedTotalCost: Number((cps * r.servings).toFixed(2)),
    estimatedCostPerServing: Number(cps.toFixed(2)),
    estimatedMissingIngredientCost: Number(missing.reduce((s, ri) => s + (costByIng.get(ri.ingredientId) ?? 0), 0).toFixed(2)),
    ingredients: r.ingredients.map((ri) => ({
      name: ingredientLabel(ri.ingredientId),
      quantity: ri.quantity,
      unit: INGREDIENT_MAP.get(ri.ingredientId)?.unit ?? "",
      estimatedCost: Number((costByIng.get(ri.ingredientId) ?? 0).toFixed(2)),
      userAlreadyHas: pantry.has(ri.ingredientId),
      optional: !!ri.optional,
      category: INGREDIENT_MAP.get(ri.ingredientId)?.category ?? "",
    })),
    missingIngredients: missing.map((ri) => ({
      name: ingredientLabel(ri.ingredientId),
      estimatedCost: Number((costByIng.get(ri.ingredientId) ?? 0).toFixed(2)),
      importance: "required" as const,
      cheapSubstitute: null,
    })),
    steps: r.steps,
    guidedCookingSteps: (r.guidedCookingSteps ?? []).map((s) => ({
      title: s.title,
      instruction: s.instruction,
      timerMinutes: s.timerMinutes ?? null,
      safetyNote: null,
    })),
    cheapTips: r.cheapTips ?? [],
    substitutions: (r.substitutions ?? []).map((s) => ({
      original: ingredientLabel(s.forIngredientId),
      swap: s.swap,
      why: s.savings ?? "",
      estimatedSavings: null,
    })),
    makeItCheaper: [],
    makeItHealthier: r.healthierTips ?? [],
    makeItHigherProtein: [],
    pantryStaplesUsed: r.ingredients.filter((ri) => pantry.has(ri.ingredientId)).map((ri) => ingredientLabel(ri.ingredientId)),
    optionalAddIns: r.optionalAddIns ?? [],
    studentTips: r.cheapTips ?? [],
    storageInstructions: r.storageInstructions ?? "",
    reheatingInstructions: r.reheatingInstructions ?? "",
    safetyNotes: [],
    estimatedNutrition: { calories: nut.calories, protein: nut.protein, carbs: nut.carbs, fat: nut.fat, fiber: nut.fiber ?? 0 },
    tags: r.tags ?? [],
    imagePromptHint: r.name,
  };
}

function candidatePool(input: LocalChefInput): Recipe[] {
  const equipment = (input.equipment ?? []) as Equipment[];
  const diet = (input.dietTags ?? []) as DietTag[];
  const budget = input.budgetPerServing && input.budgetPerServing > 0 ? input.budgetPerServing : 999;

  if (input.pantryIds.length > 0) {
    const ranked = rankPantryCatalog(
      input.pantryIds.map((id) => ({ ingredientId: id })),
      { equipment, diet },
    );
    if (ranked.length) return ranked.map((r) => r.recipe);
  }
  const cheap = rankCheapCatalog({ budgetPerServing: budget, equipment, diet });
  if (cheap.length) return cheap.map((r) => r.recipe);
  // last resort: whole catalog by cost
  return [...ALL_RECIPES].sort((a, b) => calculateCostPerServing(a) - calculateCostPerServing(b));
}

/** Build a 4-option set (best-match / cheapest / fastest / high-protein). */
export function generateOptionsLocal(input: LocalChefInput): GeneratedRecipeOptionSet {
  const pantry = new Set(input.pantryIds);
  const pool = candidatePool(input).slice(0, 60);
  if (pool.length === 0) {
    // truly nothing — synthesize from the cheapest recipe so the UI still works
    const fallback = [...ALL_RECIPES].sort((a, b) => calculateCostPerServing(a) - calculateCostPerServing(b))[0];
    pool.push(fallback);
  }

  const byCost = [...pool].sort((a, b) => calculateCostPerServing(a) - calculateCostPerServing(b));
  const byTime = [...pool].sort((a, b) => a.totalTimeMinutes - b.totalTimeMinutes);
  const byProtein = [...pool].sort((a, b) => bestEffortNutrition(b).estimate.protein - bestEffortNutrition(a).estimate.protein);

  const picks: { recipe: Recipe; label: OptionLabel; reason: string }[] = [];
  const used = new Set<string>();
  const add = (r: Recipe | undefined, label: OptionLabel, reason: string) => {
    if (!r || used.has(r.id)) return;
    used.add(r.id);
    picks.push({ recipe: r, label, reason });
  };
  add(pool[0], "best-match", input.pantryIds.length ? "Best use of what's in your pantry" : "A great all-round pick");
  add(byCost[0], "cheapest", `Cheapest option at $${calculateCostPerServing(byCost[0]).toFixed(2)}/serving`);
  add(byTime[0], "fastest", `Fastest — ready in ${byTime[0].totalTimeMinutes} min`);
  add(byProtein[0], "high-protein", `Highest protein (${Math.round(bestEffortNutrition(byProtein[0]).estimate.protein)}g/serving)`);
  // fill to 4 from the pool
  for (const r of pool) {
    if (picks.length >= 4) break;
    add(r, "best-match", "Another good match for your pantry");
  }

  const options = picks.slice(0, 4).map((p, i) => ({
    id: `local-${i + 1}`,
    optionLabel: p.label,
    shortReason: p.reason,
    pantryMatchScore: 0,
    selectedByDefault: i === 0,
    notesInfluenceSummary: input.notes ? `Considered your note: "${input.notes}"` : "",
    recipe: recipeToGenerated(p.recipe, pantry, p.reason),
  }));

  return { mainOptionId: options[0]?.id ?? "local-1", options };
}

/** Local refinement — re-pick from the catalog optimizing for the request. */
export function refineLocal(base: GeneratedRecipe, request: string, input: LocalChefInput): GeneratedRecipe {
  const pantry = new Set(input.pantryIds);
  const pool = candidatePool(input).slice(0, 60).filter((r) => r.name !== base.name);
  if (pool.length === 0) return base;
  const r = request.toLowerCase();
  let pick: Recipe;
  if (r.includes("cheap")) pick = [...pool].sort((a, b) => calculateCostPerServing(a) - calculateCostPerServing(b))[0];
  else if (r.includes("protein")) pick = [...pool].sort((a, b) => bestEffortNutrition(b).estimate.protein - bestEffortNutrition(a).estimate.protein)[0];
  else if (r.includes("fast")) pick = [...pool].sort((a, b) => a.totalTimeMinutes - b.totalTimeMinutes)[0];
  else if (r.includes("fewer")) pick = [...pool].sort((a, b) => a.ingredients.filter((x) => !pantry.has(x.ingredientId)).length - b.ingredients.filter((x) => !pantry.has(x.ingredientId)).length)[0];
  else pick = pool[0];
  return recipeToGenerated(pick, pantry, `Refined for "${request}"`);
}
