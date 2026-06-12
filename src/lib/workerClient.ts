"use client";

/**
 * Thin client for the Cloudflare Worker that proxies OpenAI calls.
 * The Worker URL is injected at build time via NEXT_PUBLIC_WORKER_URL.
 */

import { config } from "@shared/platform/config";

const WORKER_URL = config().workerUrl;

export function isWorkerConfigured(): boolean {
  return WORKER_URL.length > 0;
}

export function workerUrl(): string {
  return WORKER_URL;
}

const WORKER_TIMEOUT_MS = 60_000;

async function postJson<T>(path: string, body: unknown): Promise<T> {
  if (!WORKER_URL) {
    throw new Error(
      "AI is not configured. NEXT_PUBLIC_WORKER_URL is not set on this build.",
    );
  }
  // Cap the request so a hung worker (cold start that overran) doesn't
  // leave the UI spinning forever. The recipe-generation flow is slow,
  // so the cap here is more generous than the direct Anthropic one.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WORKER_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") {
      throw new Error("AI request timed out — try again");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    let detail = "";
    try {
      const j = (await res.json()) as { error?: string };
      detail = j.error ?? "";
    } catch {
      detail = await res.text();
    }
    if (res.status === 429) {
      throw new Error("AI is rate-limited — try again in a moment");
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

// ============== Multi-option Recipe Generation ==============

export type OptionLabel =
  | "best-match"
  | "cheapest"
  | "fastest"
  | "most-creative"
  | "uses-most-pantry"
  | "high-protein"
  | "comfort-food"
  | "wildcard";

export interface GeneratedRecipeOption {
  id: string;
  optionLabel: OptionLabel;
  shortReason: string;
  pantryMatchScore: number;
  selectedByDefault: boolean;
  notesInfluenceSummary?: string;
  recipe: GeneratedRecipe;
}

export interface GeneratedRecipeOptionSet {
  mainOptionId: string;
  options: GeneratedRecipeOption[];
}

export interface GenerateOptionsInput {
  pantryIngredients?: string[];
  selectedPantryIngredientIds?: string[];
  ingredients?: string[];
  aiNotes?: string;
  cravingText?: string;
  budgetPerServing?: number;
  servings?: number;
  equipment?: string[];
  dietTags?: string[];
  creativityLevel?: "practical" | "balanced" | "creative";
  appendToExisting?: boolean;
  previousOptions?: Array<{ recipe: { name: string } }>;
}

export async function generateRecipeOptions(
  input: GenerateOptionsInput,
): Promise<GeneratedRecipeOptionSet> {
  return postJson<GeneratedRecipeOptionSet>("/generate-recipe-options", input);
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

// ============== Recipe Sources (URL import, web search, remix) ==============

export interface RecipeSourceMetadata {
  sourceType:
    | "internal"
    | "ai-generated"
    | "food-blog"
    | "recipe-site"
    | "creator-blog"
    | "youtube"
    | "instagram"
    | "tiktok"
    | "reddit"
    | "pinterest"
    | "manual-user-link"
    | "unknown-web";
  sourceUrl?: string;
  sourceName?: string;
  creatorName?: string;
  datePublished?: string;
  dateAccessed: string;
  citationRequired: boolean;
  attributionText?: string;
  imageUrl?: string;
  transformedByAI?: boolean;
  importedFromUserLink?: boolean;
  structuredDataAvailable?: boolean;
}

export interface ImportRecipeResult {
  recipe: GeneratedRecipe;
  source: RecipeSourceMetadata;
}

export async function importRecipeUrl(opts: {
  url: string;
  ingredients?: string[];
  budgetPerServing?: number;
  equipment?: string[];
  dietTags?: string[];
  servings?: number;
}): Promise<ImportRecipeResult> {
  return postJson<ImportRecipeResult>("/recipes/import-url", opts);
}

export async function importRecipeText(opts: {
  text: string;
  sourceUrl?: string;
  sourcePlatform?: "tiktok" | "instagram" | "youtube" | "pinterest" | "reddit" | "other";
  creatorName?: string;
  ingredients?: string[];
  budgetPerServing?: number;
  equipment?: string[];
  dietTags?: string[];
  servings?: number;
}): Promise<ImportRecipeResult> {
  return postJson<ImportRecipeResult>("/recipes/import-text", opts);
}

export interface WebRecipeCandidate {
  name: string;
  summary: string;
  sourceUrl: string;
  sourceName?: string;
  creatorName?: string;
  estimatedTotalTimeMinutes?: number | null;
  estimatedServings?: number | null;
  detectedIngredients: string[];
  detectedEquipment: string[];
  dietTags: string[];
  whyRecommended: string;
  imageUrl?: string | null;
}

export async function webSearchRecipes(opts: {
  ingredients?: string[];
  cravings?: string;
  equipment?: string[];
  dietTags?: string[];
  budgetPerServing?: number;
  maxResults?: number;
}): Promise<{ candidates: WebRecipeCandidate[] }> {
  return postJson<{ candidates: WebRecipeCandidate[] }>("/recipes/web-search", opts);
}

// ============== AI Grocery Pricing ==============

export interface GroceryPriceSource {
  storeName?: string;
  productName?: string;
  brand?: string | null;
  packagePrice: number;
  packageSize: number;
  packageUnit: string;
  sourceUrl?: string | null;
  priceType:
    | "local-store"
    | "online-store"
    | "regional-average"
    | "national-average"
    | "historical-average"
    | "ai-estimated"
    | "user-entered";
  sourceQuality?: "direct-product" | "search-result" | "average-data" | "estimated";
  confidence: "high" | "medium" | "low";
  notes?: string | null;
}

export interface AIGroceryPriceEstimate {
  ingredientName: string;
  canonicalIngredientName: string;
  locationLabel?: string | null;
  typicalPackage: {
    packageSize: number;
    packageUnit: string;
    lowPrice: number;
    averagePrice: number;
    highPrice: number;
  };
  selectedBudgetEstimate: {
    packagePrice: number;
    packageSize: number;
    packageUnit: string;
    reasoning: string;
  };
  normalizedPrices: {
    pricePerOz?: number | null;
    pricePerLb?: number | null;
    pricePerGram?: number | null;
    pricePerEach?: number | null;
    pricePerTbsp?: number | null;
    pricePerTsp?: number | null;
    pricePerCup?: number | null;
  };
  sources: GroceryPriceSource[];
  confidence: "high" | "medium" | "low";
  explanation: string;
  warnings: string[];
}

export interface EstimateIngredientResult {
  estimate: AIGroceryPriceEstimate;
  recipeAmountCost?: number;
}

export async function estimateIngredientPrice(opts: {
  ingredientName: string;
  recipeQuantity?: number;
  recipeUnit?: string;
  location?: {
    city?: string;
    state?: string;
    zipCode?: string;
    label?: string;
  };
  preferBudgetStores?: boolean;
}): Promise<EstimateIngredientResult> {
  return postJson<EstimateIngredientResult>(
    "/pricing/estimate-ingredient",
    opts,
  );
}

export async function remixRecipe(opts: {
  baseRecipe: unknown;
  userRequest: string;
  pantryIngredients?: string[];
  budgetPerServing?: number;
  equipment?: string[];
  dietTags?: string[];
  preserveSourceAttribution?: boolean;
}): Promise<GeneratedRecipe> {
  return postJson<GeneratedRecipe>("/recipes/remix", opts);
}
