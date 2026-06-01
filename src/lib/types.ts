export type IngredientCategory =
  | "grain"
  | "protein"
  | "vegetable"
  | "fruit"
  | "dairy"
  | "canned"
  | "condiment"
  | "spice"
  | "frozen"
  | "snack";

export type Equipment =
  | "microwave"
  | "stovetop"
  | "oven"
  | "rice-cooker"
  | "air-fryer"
  | "no-kitchen";

export type DietTag =
  | "vegetarian"
  | "vegan"
  | "high-protein"
  | "gluten-free"
  | "dairy-free";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "meal-prep";

export type Difficulty = "easy" | "medium" | "hard";

export type TimeBucket = "under-10" | "under-20" | "under-30" | "meal-prep";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  estimatedUnitCost: number; // cost per `unit`
  unit: string; // "cup", "tbsp", "egg", "oz", "clove", "slice"
  commonPackageSize?: string;
  shelfLifeDays?: number;
  tags?: string[];
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number; // in `unit` matching the ingredient's unit
  optional?: boolean;
  note?: string;
}

export interface Substitution {
  forIngredientId: string;
  swap: string;
  savings?: string;
}

export interface NutritionEstimate {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams (optional)
}

export interface GuidedCookingStep {
  title: string;
  instruction: string;
  timerMinutes?: number;
}

export interface RecipeImage {
  src: string;
  alt: string;
  sourceName: string;
  sourceUrl: string;
  license: string;
  attributionRequired: boolean;
  attributionText?: string;
  verifiedMatch: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  mealType: MealType;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  totalTimeMinutes: number;
  difficulty: Difficulty;
  equipment: Equipment[];
  dietTags: DietTag[];
  cheapTips: string[];
  substitutions: Substitution[];
  healthierTips?: string[];
  batchPrepTips?: string[];
  whatToBuyNext?: string[];
  estimatedNutrition: NutritionEstimate;
  emoji: string; // visual placeholder
  accentColor: string; // tailwind bg class
  cuisine?: string;
  tags?: string[]; // e.g. "dorm-friendly", "one-pot"

  // Extended optional fields used by the larger recipe set
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  dormFriendly?: boolean;
  mealPrepFriendly?: boolean;
  allergyTags?: string[]; // contains-nuts, contains-soy, etc.
  whyCheap?: string;
  storageInstructions?: string;
  reheatingInstructions?: string;
  guidedCookingSteps?: GuidedCookingStep[];
  optionalAddIns?: string[];
  youtubeId?: string;

  // Air-fryer + microwave method fields
  primaryCookingMethod?:
    | "stovetop"
    | "oven"
    | "rice-cooker"
    | "air-fryer"
    | "microwave"
    | "air-fryer-and-microwave"
    | "no-cook";
  noStovetopRequired?: boolean;
  crispinessLevel?: "soft" | "lightly crispy" | "crispy" | "extra crispy";
  microwaveTimeMinutes?: number;
  airFryerTimeMinutes?: number;
  airFryerTemperatureF?: number;
}

export interface CheapFilters {
  budgetPerServing: number;
  servings: number;
  equipment: Equipment[];
  diet: DietTag[];
  time: TimeBucket | "any";
  cuisine?: string;
  mealType?: MealType | "any";
}

export interface PantryItem {
  ingredientId: string;
  quantity?: number;
  useSoon?: boolean;
}

export interface GroceryItem {
  ingredientId: string;
  quantity: number;
  recipeIds: string[]; // recipes that need this item
  checked: boolean;
}

export interface RecipeScoreResult {
  recipe: Recipe;
  costPerServing: number;
  totalCost: number;
  pantryMatched: number;
  pantryTotal: number;
  missingIngredients: RecipeIngredient[];
  missingCost: number;
  matchPercent: number;
  score: number;
  reasons: string[];
}
