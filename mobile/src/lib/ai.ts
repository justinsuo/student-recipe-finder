/**
 * Mobile AI layer.
 *
 * Generation goes through the Cloudflare Worker (OpenAI key stays server-side —
 * never on the device). If the Worker isn't set but an Anthropic key is present,
 * we fall back to the browser-Haiku path (also used by the web). The local
 * rule-based "Pesto" chatbot answers offline so Ask-AI-Chef always works.
 *
 * Nutrition for generated recipes is ALWAYS recomputed with the shared engine so
 * macros are real (never 0), per the product rule that model output isn't trusted.
 */
import { isWorkerConfigured } from "@/lib/workerClient";
import {
  generateRecipe,
  generateRecipeOptions,
  generateRecipeImage,
  remixRecipe,
  type GeneratedRecipe,
  type GenerateOptionsInput,
  type GeneratedRecipeOptionSet,
} from "@/lib/workerClient";
import {
  isAiEnabled,
  generateRecipeQuick,
  generateRecipeQuickOptions,
  recognizeIngredientsFromText,
  type HaikuRecipeInput,
} from "@/lib/anthropic";
import { calculateNutritionForFreeForm } from "@/lib/nutritionEngine";
import { chatRespond, type ChatContext, type ChatReply } from "@/lib/chatbot";
import { makeCustomRecipeId, fallbackImageMeta, saveCustomRecipe } from "@/lib/customRecipeStorage";
import type { AIGeneratedRecipe } from "@/lib/customRecipeTypes";
import type { NutritionEstimate } from "@/lib/types";
import { saveRecipeImageB64, saveRecipeImageFromUrl } from "./imageStore";

export function aiAvailable(): boolean {
  return isWorkerConfigured() || isAiEnabled();
}

export function aiMode(): "worker" | "haiku" | "offline" {
  if (isWorkerConfigured()) return "worker";
  if (isAiEnabled()) return "haiku";
  return "offline";
}

export interface ChefInput {
  pantryIngredients?: string[];
  selectedPantryIngredientIds?: string[];
  cravingText?: string;
  aiNotes?: string;
  budgetPerServing?: number;
  servings?: number;
  equipment?: string[];
  dietTags?: string[];
  creativityLevel?: "practical" | "balanced" | "creative";
  refinement?: string;
}

/** Generate 4 recipe options (best-match / cheapest / fastest / wildcard). */
export async function generateOptions(input: ChefInput): Promise<GeneratedRecipeOptionSet> {
  if (isWorkerConfigured()) {
    const wInput: GenerateOptionsInput = {
      pantryIngredients: input.pantryIngredients,
      selectedPantryIngredientIds: input.selectedPantryIngredientIds,
      ingredients: input.pantryIngredients,
      aiNotes: input.aiNotes,
      cravingText: input.cravingText,
      budgetPerServing: input.budgetPerServing,
      servings: input.servings,
      equipment: input.equipment,
      dietTags: input.dietTags,
      creativityLevel: input.creativityLevel,
    };
    const set = await generateRecipeOptions(wInput);
    return repairOptionNutrition(set);
  }
  if (isAiEnabled()) {
    const hInput: HaikuRecipeInput = {
      pantryIngredients: input.pantryIngredients,
      cravings: [input.cravingText, input.aiNotes].filter(Boolean).join(". "),
      budgetPerServing: input.budgetPerServing,
      servings: input.servings,
      equipment: input.equipment,
      dietTags: input.dietTags,
      refinement: input.refinement,
      creativityBoost: input.creativityLevel === "creative",
    } as HaikuRecipeInput;
    const set = await generateRecipeQuickOptions(hInput);
    return repairOptionNutrition(set);
  }
  throw new Error("AI is offline");
}

/** Refine a recipe ("make it cheaper", "higher protein", …). */
export async function refine(base: GeneratedRecipe, userRequest: string, input: ChefInput): Promise<GeneratedRecipe> {
  if (isWorkerConfigured()) {
    const out = await remixRecipe({
      baseRecipe: base,
      userRequest,
      pantryIngredients: input.pantryIngredients,
      budgetPerServing: input.budgetPerServing,
      equipment: input.equipment,
      dietTags: input.dietTags,
    });
    return { ...out, estimatedNutrition: recomputeNutrition(out) };
  }
  const out = await generateRecipeQuick({
    pantryIngredients: input.pantryIngredients,
    cravings: input.cravingText,
    budgetPerServing: input.budgetPerServing,
    servings: input.servings,
    equipment: input.equipment,
    dietTags: input.dietTags,
    refinement: userRequest,
  } as HaikuRecipeInput);
  return { ...out, estimatedNutrition: recomputeNutrition(out) };
}

// ── nutrition recompute (never 0 macros) ─────────────────────────────────────

export function recomputeNutrition(gen: GeneratedRecipe): GeneratedRecipe["estimatedNutrition"] {
  const ff = calculateNutritionForFreeForm(
    (gen.ingredients || []).map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
    gen.servings || 1,
  );
  const engine = ff.perServing;
  if (engine.calories > 0) {
    return {
      calories: engine.calories,
      protein: engine.protein,
      carbs: engine.carbs,
      fat: engine.fat,
      fiber: engine.fiber ?? 0,
    };
  }
  const model = gen.estimatedNutrition;
  if (model && model.calories > 0) return model;
  return { calories: engine.calories, protein: engine.protein, carbs: engine.carbs, fat: engine.fat, fiber: engine.fiber ?? 0 };
}

function repairOptionNutrition(set: GeneratedRecipeOptionSet): GeneratedRecipeOptionSet {
  return {
    ...set,
    options: set.options.map((o) => ({
      ...o,
      recipe: { ...o.recipe, estimatedNutrition: recomputeNutrition(o.recipe) },
    })),
  };
}

// ── GeneratedRecipe → CustomRecipe (for saving / display) ────────────────────

export function toCustomRecipe(gen: GeneratedRecipe): AIGeneratedRecipe {
  const now = new Date().toISOString();
  const id = makeCustomRecipeId(gen.name || "ai-recipe", "gen");
  const nutrition = recomputeNutrition(gen);
  return {
    id,
    name: gen.name,
    description: gen.description,
    mealType: gen.mealType,
    cuisineStyle: gen.cuisineStyle,
    servings: gen.servings || 1,
    prepTimeMinutes: gen.prepTimeMinutes || 0,
    cookTimeMinutes: gen.cookTimeMinutes || 0,
    totalTimeMinutes: gen.totalTimeMinutes || 0,
    difficulty: gen.difficulty,
    equipment: gen.equipment || [],
    primaryCookingMethod: gen.primaryCookingMethod || "stovetop",
    noStovetopRequired: !!gen.noStovetopRequired,
    estimatedTotalCost: gen.estimatedTotalCost || 0,
    estimatedCostPerServing: gen.estimatedCostPerServing || 0,
    ingredients: (gen.ingredients || []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      estimatedCost: i.estimatedCost,
      userAlreadyHas: i.userAlreadyHas,
      optional: i.optional,
      category: i.category,
    })),
    steps: gen.steps || [],
    guidedCookingSteps: (gen.guidedCookingSteps || []).map((s) => ({
      title: s.title,
      instruction: s.instruction,
      timerMinutes: s.timerMinutes ?? null,
      safetyNote: s.safetyNote ?? null,
    })),
    cheapTips: gen.cheapTips || [],
    substitutions: (gen.substitutions || []).map((s) => ({
      original: s.original,
      swap: s.swap,
      why: s.why,
      estimatedSavings: s.estimatedSavings ?? null,
    })),
    makeItCheaper: gen.makeItCheaper || [],
    makeItHealthier: gen.makeItHealthier || [],
    makeItHigherProtein: gen.makeItHigherProtein || [],
    studentTips: gen.studentTips || [],
    storageInstructions: gen.storageInstructions,
    reheatingInstructions: gen.reheatingInstructions,
    safetyNotes: gen.safetyNotes || [],
    estimatedNutrition: nutrition as NutritionEstimate,
    tags: gen.tags || [],
    image: fallbackImageMeta(),
    createdAt: now,
    updatedAt: now,
    isAIGenerated: true,
    isUserCreated: false,
    userRequestSummary: gen.userRequestSummary,
    whyThisFits: gen.whyThisFits,
    missingIngredients: (gen.missingIngredients || []).map((m) => ({
      name: m.name,
      estimatedCost: m.estimatedCost,
      importance: m.importance,
      cheapSubstitute: m.cheapSubstitute ?? null,
    })),
    estimatedMissingIngredientCost: gen.estimatedMissingIngredientCost,
  };
}

/** Convert + persist a generated recipe; returns the saved CustomRecipe. */
export function persistGenerated(gen: GeneratedRecipe): AIGeneratedRecipe {
  const custom = toCustomRecipe(gen);
  saveCustomRecipe(custom);
  return custom;
}

// ── background image generation ──────────────────────────────────────────────

export async function generateAndStoreImage(
  recipeId: string,
  gen: { name: string; ingredients?: { name: string }[]; primaryCookingMethod?: string; imagePromptHint?: string },
): Promise<string | null> {
  if (!isWorkerConfigured()) return null;
  try {
    const res = await generateRecipeImage({
      recipeName: gen.name,
      prompt: gen.imagePromptHint,
      ingredients: (gen.ingredients || []).map((i) => i.name),
      method: gen.primaryCookingMethod,
    });
    if (res.b64_json) return await saveRecipeImageB64(recipeId, res.b64_json);
    if (res.url) return await saveRecipeImageFromUrl(recipeId, res.url);
  } catch {
    // image is best-effort — recipe still ships with the emoji fallback
  }
  return null;
}

// ── pantry text parsing ──────────────────────────────────────────────────────

export async function parsePantryText(text: string) {
  if (!isAiEnabled()) return null;
  try {
    return await recognizeIngredientsFromText(text);
  } catch {
    return null;
  }
}

// ── chat (offline-first) ─────────────────────────────────────────────────────

export function chat(message: string, context: ChatContext): ChatReply {
  return chatRespond(message, context);
}

export type { GeneratedRecipe, GeneratedRecipeOptionSet, ChatContext, ChatReply };
