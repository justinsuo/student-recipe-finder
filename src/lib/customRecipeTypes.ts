/**
 * Shared types for AI-generated and user-created recipes that live alongside
 * the built-in seed recipes.
 */

export interface CustomRecipeImage {
  src?: string; // remote URL OR data: URL
  b64?: string; // raw base64 (no data: prefix) — stored separately to avoid bloat
  alt: string;
  sourceName: string;
  license: string;
  isAIGenerated: boolean;
  isFallback: boolean;
  generatedPrompt?: string;
  generatedAt?: string;
  model?: string;
}

export interface CustomRecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  userAlreadyHas?: boolean;
  optional?: boolean;
  category?: string;
}

export interface CustomRecipeStep {
  title?: string;
  instruction: string;
  timerMinutes?: number | null;
  safetyNote?: string | null;
}

export interface BaseCustomRecipe {
  id: string;
  name: string;
  description: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "meal-prep";
  cuisineStyle?: string;
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
  ingredients: CustomRecipeIngredient[];
  steps: string[];
  guidedCookingSteps?: CustomRecipeStep[];
  cheapTips?: string[];
  substitutions?: Array<{
    original: string;
    swap: string;
    why?: string;
    estimatedSavings?: number | null;
  }>;
  makeItCheaper?: string[];
  makeItHealthier?: string[];
  makeItHigherProtein?: string[];
  studentTips?: string[];
  storageInstructions?: string;
  reheatingInstructions?: string;
  safetyNotes?: string[];
  estimatedNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  tags?: string[];
  image: CustomRecipeImage;
  createdAt: string;
  updatedAt: string;
}

export interface AIGeneratedRecipe extends BaseCustomRecipe {
  isAIGenerated: true;
  isUserCreated: false;
  userRequestSummary?: string;
  whyThisFits?: string;
  missingIngredients?: Array<{
    name: string;
    estimatedCost: number;
    importance: "required" | "recommended" | "optional";
    cheapSubstitute?: string | null;
  }>;
  estimatedMissingIngredientCost?: number;
}

export interface UserCreatedRecipe extends BaseCustomRecipe {
  isAIGenerated: false;
  isUserCreated: true;
  notes?: string;
}

export type CustomRecipe = AIGeneratedRecipe | UserCreatedRecipe;

export function isAIGenerated(r: CustomRecipe): r is AIGeneratedRecipe {
  return r.isAIGenerated === true;
}
