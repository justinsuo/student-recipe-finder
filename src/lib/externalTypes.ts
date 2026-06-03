// Types for recipes fetched from external APIs (Spoonacular, Edamam, TheMealDB)
// and from the local global recipe dataset.
// These are separate from the local Recipe type so nothing existing breaks.

export type ExternalSource = "spoonacular" | "edamam" | "themealdb" | "mock" | "local";

export interface ExternalIngredient {
  name: string;
  amount: string | null;
  unit: string | null;
}

export interface ExternalSubstitution {
  ingredient: string;
  swap: string;
}

export interface ExternalRecipe {
  id: string;               // e.g. "spoonacular-716429" or "local-chana-masala"
  source: ExternalSource;
  sourceUrl: string;        // kept in data but never rendered in UI
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
  instructions: string[];
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  culturalNote: string | null;

  // Extended fields for local/global recipes
  region?: string;
  country?: string;
  estimatedCost?: number;           // USD per serving
  studentFriendlyScore?: number;    // 1–10
  spiceLevel?: number;              // 0–5
  proteinType?: string;             // "chicken" | "beef" | "tofu" | "eggs" | "legumes" | "seafood" | "none" …
  equipmentNeeded?: string[];
  storageTips?: string;
  substitutions?: ExternalSubstitution[];
  flavorProfile?: string[];         // ["savory","umami","spicy",…]
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
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
  region: string;
  diet: string;
  mealType: string;
  difficulty: string;
  maxTime: number | null;
  maxCost: number | null;
  spiceLevel: number | null;
  proteinType: string;
  studentMode: boolean;
  sort: "popular" | "rating" | "fastest" | "cheapest" | "easiest" | "score";
  page: number;
}
