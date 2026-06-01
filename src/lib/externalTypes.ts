// Types for recipes fetched from external APIs (Spoonacular, Edamam, TheMealDB).
// These are separate from the local Recipe type so nothing existing breaks.

export type ExternalSource = "spoonacular" | "edamam" | "themealdb" | "mock";

export interface ExternalIngredient {
  name: string;
  amount: string | null;
  unit: string | null;
}

export interface ExternalRecipe {
  id: string;               // e.g. "spoonacular-716429"
  source: ExternalSource;
  sourceUrl: string;        // link back to original
  title: string;
  cuisine: string;
  image: string;
  mealType: string | null;
  totalTimeMinutes: number | null;
  servings: number | null;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  rating: number | null;    // 0–5
  diets: string[];
  tags: string[];
  ingredients: ExternalIngredient[];
  instructions: string[];   // may be empty — show "View source" button instead
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  culturalNote: string | null;
}

export interface ExternalSearchResult {
  recipes: ExternalRecipe[];
  total: number;
  page: number;
  hasMore: boolean;
  source: ExternalSource;
}

export interface ExploreFilters {
  query: string;
  cuisine: string;
  diet: string;
  maxTime: number | null;
  sort: "popular" | "rating" | "fastest";
  page: number;
}
