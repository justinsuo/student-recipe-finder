"use client";

/**
 * Thin client for the Cloudflare Worker that proxies OpenAI calls.
 * The Worker URL is injected at build time via NEXT_PUBLIC_WORKER_URL.
 */

const WORKER_URL = (process.env.NEXT_PUBLIC_WORKER_URL ?? "").replace(/\/$/, "");

export function isWorkerConfigured(): boolean {
  return WORKER_URL.length > 0;
}

export function workerUrl(): string {
  return WORKER_URL;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  if (!WORKER_URL) {
    throw new Error(
      "AI is not configured. NEXT_PUBLIC_WORKER_URL is not set on this build.",
    );
  }
  const res = await fetch(`${WORKER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = (await res.json()) as { error?: string };
      detail = j.error ?? "";
    } catch {
      detail = await res.text();
    }
    throw new Error(`AI request failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

// ============== Ingredient Intelligence ==============

export type IngredientCategory =
  | "grains-and-starches"
  | "pasta-and-noodles"
  | "beans-and-lentils"
  | "canned-goods"
  | "frozen"
  | "fresh-vegetables"
  | "fruit"
  | "eggs-and-dairy"
  | "meat-and-seafood"
  | "tofu-and-plant-protein"
  | "condiments-and-sauces"
  | "spices"
  | "bread-and-tortillas"
  | "snacks"
  | "beverages"
  | "baking"
  | "other";

export type IngredientRole =
  | "main"
  | "protein"
  | "carb"
  | "vegetable"
  | "fruit"
  | "fat"
  | "seasoning"
  | "sauce"
  | "acid"
  | "sweetener"
  | "binder"
  | "liquid"
  | "other";

export interface ResolvedIngredient {
  canonicalName: string;
  displayName: string;
  originalText: string;
  aliases: string[];
  category: IngredientCategory;
  ingredientRole: IngredientRole;
  storageType: "pantry" | "fridge" | "freezer" | "unknown";
  shelfLifeDays?: number | null;
  estimatedUnitCost?: number | null;
  unit?: string;
  dietaryTags: string[];
  allergyTags: string[];
  confidence: number;
  notes?: string;
  useSoon?: boolean;
}

export interface ResolveResult {
  ingredients: ResolvedIngredient[];
  ignoredText: string[];
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
}

export async function resolveIngredients(
  rawInput: string,
  inputSource: "typed" | "voice" | "pasted" | "manual" = "typed",
): Promise<ResolveResult> {
  return postJson<ResolveResult>("/ingredients/resolve", {
    rawInput,
    inputSource,
  });
}

export interface EnrichResult {
  canonicalName: string;
  category: IngredientCategory;
  aliases: string[];
  estimatedUnitCost?: number | null;
  unit?: string;
  commonPackageSize?: string | null;
  storageType: "pantry" | "fridge" | "freezer" | "unknown";
  shelfLifeDays?: number | null;
  ingredientRole: IngredientRole;
  dietaryTags: string[];
  allergyTags: string[];
  substitutes: string[];
  recipeUseCases: string[];
  isPantryStaple: boolean;
}

export async function enrichIngredient(name: string): Promise<EnrichResult> {
  return postJson<EnrichResult>("/ingredients/enrich", { name });
}

export interface MatchResult {
  isMatch: boolean;
  matchType:
    | "exact"
    | "alias"
    | "fuzzy"
    | "semantic"
    | "category"
    | "substitute"
    | "none";
  confidence: number;
  explanation: string;
}

export async function matchIngredient(
  pantry: string,
  required: string,
): Promise<MatchResult> {
  return postJson<MatchResult>("/ingredients/match", { pantry, required });
}

// ============== Recipe Generation ==============

export interface GenerateRecipeInput {
  ingredients?: string[];
  budgetPerServing?: number;
  servings?: number;
  equipment?: string[];
  timeLimit?: string;
  dietTags?: string[];
  mealType?: string;
  cravings?: string;
  creativity?: "practical" | "balanced" | "creative";
  refinement?: string;
}

export interface GeneratedRecipe {
  name: string;
  description: string;
  userRequestSummary: string;
  whyThisFits: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "meal-prep";
  cuisineStyle: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  difficulty: "very easy" | "easy" | "medium";
  equipment: string[];
  primaryCookingMethod: string;
  noStovetopRequired: boolean;
  estimatedTotalCost: number;
  estimatedCostPerServing: number;
  estimatedMissingIngredientCost: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
    userAlreadyHas: boolean;
    optional: boolean;
    category: string;
  }>;
  missingIngredients: Array<{
    name: string;
    estimatedCost: number;
    importance: "required" | "recommended" | "optional";
    cheapSubstitute?: string | null;
  }>;
  steps: string[];
  guidedCookingSteps: Array<{
    title: string;
    instruction: string;
    timerMinutes?: number | null;
    safetyNote?: string | null;
  }>;
  cheapTips: string[];
  substitutions: Array<{
    original: string;
    swap: string;
    why: string;
    estimatedSavings?: number | null;
  }>;
  makeItCheaper: string[];
  makeItHealthier: string[];
  makeItHigherProtein: string[];
  pantryStaplesUsed: string[];
  optionalAddIns: string[];
  studentTips: string[];
  storageInstructions: string;
  reheatingInstructions: string;
  safetyNotes: string[];
  estimatedNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  tags: string[];
  imagePromptHint?: string;
}

export async function generateRecipe(
  input: GenerateRecipeInput,
): Promise<GeneratedRecipe> {
  return postJson<GeneratedRecipe>("/generate-recipe", input);
}

// ============== Image Generation ==============

export interface GenerateImageResult {
  b64_json?: string;
  url?: string;
  prompt: string;
  model: string;
}

export async function generateRecipeImage(opts: {
  recipeName?: string;
  prompt?: string;
  ingredients?: string[];
  method?: string;
}): Promise<GenerateImageResult> {
  return postJson<GenerateImageResult>("/generate-recipe-image", opts);
}
