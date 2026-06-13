/**
 * Recipe bridge — turns the shared catalog (seed `Recipe`s) and the user's
 * `CustomRecipe`s (AI + hand-built) into one normalized `RecipeView` for cards
 * and detail screens, and re-exports the shared pricing/nutrition engines so
 * the phone computes cost & macros identically to the website.
 */
import { RECIPES, RECIPE_MAP } from "@/data/recipes";
import { getRecipeImage } from "@/data/recipeImages";
import { INGREDIENT_MAP, CATEGORY_LABEL } from "@/data/ingredients";
import {
  calculateCostPerServing,
  calculateRecipeCost,
} from "@/lib/recipeScoring";
import { bestEffortNutrition } from "@/lib/nutritionEngine";
import type { Recipe, NutritionEstimate } from "@/lib/types";
import type { CustomRecipe } from "@/lib/customRecipeTypes";
import { getCustomRecipes, getCustomRecipe } from "@/lib/customRecipeStorage";
import { localImageUri } from "./imageStore";
import { ALL_RECIPES, getCatalogRecipe } from "./catalog";
import type { AccentKey } from "~/theme";

export type RecipeSource = "seed" | "custom-ai" | "custom-user";

export interface RecipeView {
  id: string;
  source: RecipeSource;
  name: string;
  description: string;
  imageUri?: string;
  emoji: string;
  accent: AccentKey;
  costPerServing: number;
  totalTimeMinutes: number;
  nutrition: NutritionEstimate;
  equipment: string[];
  dietTags: string[];
  servings: number;
  cuisine?: string;
}

const ACCENTS: AccentKey[] = ["pantry", "ai-chef", "nourish", "grocery", "cheap", "saved", "explore"];

export function accentForId(id: string): AccentKey {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

export function ingredientLabel(id: string): string {
  return INGREDIENT_MAP.get(id)?.name ?? id;
}

export function categoryLabel(cat: string): string {
  return (CATEGORY_LABEL as Record<string, string>)[cat] ?? cat;
}

// ── seed recipes ─────────────────────────────────────────────────────────────

export function seedToView(r: Recipe): RecipeView {
  const img = getRecipeImage(r.id);
  return {
    id: r.id,
    source: "seed",
    name: r.name,
    description: r.description,
    imageUri: img?.src,
    emoji: r.emoji || "🍽️",
    accent: accentForId(r.id),
    costPerServing: calculateCostPerServing(r),
    totalTimeMinutes: r.totalTimeMinutes,
    nutrition: bestEffortNutrition(r).estimate,
    equipment: r.equipment,
    dietTags: r.dietTags,
    servings: r.servings,
    cuisine: r.cuisine,
  };
}

let _seedViews: RecipeView[] | null = null;
export function allSeedViews(): RecipeView[] {
  if (!_seedViews) _seedViews = ALL_RECIPES.map(seedToView);
  return _seedViews;
}

export function getSeedRecipe(id: string): Recipe | undefined {
  return getCatalogRecipe(id);
}

// ── custom recipes ───────────────────────────────────────────────────────────

export function customNutrition(c: CustomRecipe): NutritionEstimate {
  const n = c.estimatedNutrition;
  if (n && (n.calories || n.protein || n.carbs || n.fat)) {
    return { calories: n.calories, protein: n.protein, carbs: n.carbs, fat: n.fat, fiber: n.fiber };
  }
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function customToView(c: CustomRecipe): RecipeView {
  // Image: prefer a local file (mobile) → remote/data url stored in meta.
  const uri = localImageUri(c.id) ?? c.image?.src ?? undefined;
  return {
    id: c.id,
    source: c.isAIGenerated ? "custom-ai" : "custom-user",
    name: c.name,
    description: c.description,
    imageUri: uri,
    emoji: emojiForMeal(c.mealType),
    accent: c.isAIGenerated ? "ai-chef" : "saved",
    costPerServing: c.estimatedCostPerServing || 0,
    totalTimeMinutes: c.totalTimeMinutes || 0,
    nutrition: customNutrition(c),
    equipment: c.equipment || [],
    dietTags: c.tags || [],
    servings: c.servings || 1,
    cuisine: c.cuisineStyle,
  };
}

export function allCustomViews(): RecipeView[] {
  return getCustomRecipes().map(customToView);
}

export function getCustom(id: string): CustomRecipe | undefined {
  return getCustomRecipe(id);
}

export function getAnyView(id: string): RecipeView | undefined {
  const seed = RECIPE_MAP.get(id);
  if (seed) return seedToView(seed);
  const custom = getCustomRecipe(id);
  if (custom) return customToView(custom);
  return undefined;
}

function emojiForMeal(meal: string): string {
  switch (meal) {
    case "breakfast": return "🍳";
    case "lunch": return "🥗";
    case "dinner": return "🍝";
    case "snack": return "🍎";
    default: return "🍲";
  }
}

export { RECIPES, RECIPE_MAP, calculateCostPerServing, calculateRecipeCost, bestEffortNutrition };
export type { Recipe, CustomRecipe, NutritionEstimate };
