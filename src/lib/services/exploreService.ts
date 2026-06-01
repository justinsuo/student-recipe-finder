"use client";

import type { ExternalRecipe, ExternalSearchResult, ExploreFilters } from "@/lib/externalTypes";
import { normalizeSpoonacular } from "@/lib/adapters/spoonacular";
import { normalizeEdamam } from "@/lib/adapters/edamam";
import { normalizeMealDB } from "@/lib/adapters/themealdb";

// ─── Config ──────────────────────────────────────────────────────────────────
// Default is TheMealDB — completely free, no key required, real food photos.

export function getExploreSource() {
  const src = process.env.NEXT_PUBLIC_EXPLORE_SOURCE;
  if (src === "spoonacular" && process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY) return "spoonacular" as const;
  if (src === "edamam" && process.env.NEXT_PUBLIC_EDAMAM_APP_ID) return "edamam" as const;
  // Default to TheMealDB — no key needed
  return "themealdb" as const;
}

const PAGE_SIZE = 20;
const SPOONACULAR = "https://api.spoonacular.com";
const EDAMAM = "https://api.edamam.com";
const MEALDB = "https://www.themealdb.com/api/json/v1/1";

// All TheMealDB categories — gives broad variety
const MEALDB_CATEGORIES = [
  "Chicken", "Beef", "Seafood", "Pasta", "Pork", "Lamb",
  "Vegetarian", "Vegan", "Breakfast", "Dessert", "Starter",
  "Side", "Miscellaneous", "Goat",
];

// TheMealDB area → cuisine name mapping
const MEALDB_AREAS = [
  "American", "British", "Canadian", "Chinese", "Croatian", "Dutch",
  "Egyptian", "Filipino", "French", "Greek", "Indian", "Irish",
  "Italian", "Jamaican", "Japanese", "Kenyan", "Malaysian", "Mexican",
  "Moroccan", "Polish", "Portuguese", "Russian", "Spanish", "Thai",
  "Tunisian", "Turkish", "Vietnamese",
];

// ─── Cache ────────────────────────────────────────────────────────────────────

const cache = new Map<string, { data: ExternalSearchResult; ts: number }>();
const TTL = 15 * 60 * 1000;

function getCached(key: string): ExternalSearchResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL) { cache.delete(key); return null; }
  return entry.data;
}

// Stores full meal objects fetched from MealDB filter endpoint
const mealDetailCache = new Map<string, object>();

// ─── Main search ──────────────────────────────────────────────────────────────

export async function searchExternalRecipes(filters: ExploreFilters): Promise<ExternalSearchResult> {
  const source = getExploreSource();
  const key = `${source}:${JSON.stringify(filters)}`;
  const hit = getCached(key);
  if (hit) return hit;

  let result: ExternalSearchResult;
  try {
    switch (source) {
      case "spoonacular": result = await spoonacularSearch(filters); break;
      case "edamam":      result = await edamamSearch(filters);      break;
      default:            result = await mealDBSearch(filters);
    }
  } catch (err) {
    console.warn("[Explore] Error:", err);
    result = await mealDBFallback();
  }

  cache.set(key, { data: result, ts: Date.now() });
  return result;
}

// ─── TheMealDB — default, free, no key ───────────────────────────────────────

async function mealDBSearch(filters: ExploreFilters): Promise<ExternalSearchResult> {
  // Case 1: user searched by text
  if (filters.query.trim()) {
    const res = await fetch(`${MEALDB}/search.php?s=${encodeURIComponent(filters.query)}`);
    const data = await res.json();
    const meals = (data.meals ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recipes = meals.map((m: any) => normalizeMealDB(m));
    return paginate(recipes, filters.page);
  }

  // Case 2: user filtered by cuisine
  if (filters.cuisine) {
    const areaMatch = MEALDB_AREAS.find(a => a.toLowerCase() === filters.cuisine.toLowerCase());
    if (areaMatch) {
      const meals = await fetchMealsByArea(areaMatch);
      return paginate(meals, filters.page);
    }
    // Fall through to category search
    const catMatch = MEALDB_CATEGORIES.find(c => c.toLowerCase().includes(filters.cuisine.toLowerCase()));
    if (catMatch) {
      const meals = await fetchMealsByCategory(catMatch);
      return paginate(meals, filters.page);
    }
  }

  // Case 3: no filter — load multiple categories for variety, paginate across them
  const allMeals = await fetchAllCategories(filters.page);
  return allMeals;
}

async function fetchMealsByArea(area: string): Promise<ExternalRecipe[]> {
  const cacheKey = `area:${area}`;
  if (mealDetailCache.has(cacheKey)) {
    return mealDetailCache.get(cacheKey) as ExternalRecipe[];
  }
  // Filter endpoint returns minimal data — need to look up each meal for photos/details
  const res = await fetch(`${MEALDB}/filter.php?a=${encodeURIComponent(area)}`);
  const data = await res.json();
  const meals = await lookupMeals(data.meals ?? []);
  mealDetailCache.set(cacheKey, meals);
  return meals;
}

async function fetchMealsByCategory(category: string): Promise<ExternalRecipe[]> {
  const cacheKey = `cat:${category}`;
  if (mealDetailCache.has(cacheKey)) {
    return mealDetailCache.get(cacheKey) as ExternalRecipe[];
  }
  const res = await fetch(`${MEALDB}/filter.php?c=${encodeURIComponent(category)}`);
  const data = await res.json();
  const meals = await lookupMeals(data.meals ?? []);
  mealDetailCache.set(cacheKey, meals);
  return meals;
}

// Look up full details for filter results (which only return id + name + thumb)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function lookupMeals(filterResults: any[]): Promise<ExternalRecipe[]> {
  if (!filterResults?.length) return [];
  // Fetch full detail for each meal (up to 30 to avoid too many requests)
  const limited = filterResults.slice(0, 30);
  const results = await Promise.allSettled(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    limited.map(async (m: any) => {
      const res = await fetch(`${MEALDB}/lookup.php?i=${m.idMeal}`);
      const data = await res.json();
      return data.meals?.[0] ? normalizeMealDB(data.meals[0]) : null;
    })
  );
  return results
    .filter((r): r is PromiseFulfilledResult<ExternalRecipe | null> => r.status === "fulfilled" && r.value !== null)
    .map(r => r.value!);
}

async function fetchAllCategories(page: number): Promise<ExternalSearchResult> {
  // Rotate through categories based on page so each page shows different cuisines
  const categoryIndex = (page - 1) % MEALDB_CATEGORIES.length;
  const categoriesToLoad = [
    MEALDB_CATEGORIES[categoryIndex],
    MEALDB_CATEGORIES[(categoryIndex + 1) % MEALDB_CATEGORIES.length],
  ];

  const allMeals: ExternalRecipe[] = [];
  for (const cat of categoriesToLoad) {
    const meals = await fetchMealsByCategory(cat);
    allMeals.push(...meals);
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = allMeals.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  const from = 0;
  const to = PAGE_SIZE;
  return {
    recipes: unique.slice(from, to),
    total: unique.length,
    page,
    hasMore: unique.length > to,
    source: "themealdb",
  };
}

async function mealDBFallback(): Promise<ExternalSearchResult> {
  // Grab random meals as absolute last resort
  const results: ExternalRecipe[] = [];
  for (let i = 0; i < 8; i++) {
    try {
      const res = await fetch(`${MEALDB}/random.php`);
      const data = await res.json();
      if (data.meals?.[0]) results.push(normalizeMealDB(data.meals[0]));
    } catch { /* skip */ }
  }
  return { recipes: results, total: results.length, page: 1, hasMore: false, source: "themealdb" };
}

function paginate(recipes: ExternalRecipe[], page: number): ExternalSearchResult {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;
  return {
    recipes: recipes.slice(from, to),
    total: recipes.length,
    page,
    hasMore: to < recipes.length,
    source: "themealdb",
  };
}

// ─── Spoonacular ─────────────────────────────────────────────────────────────

async function spoonacularSearch(f: ExploreFilters): Promise<ExternalSearchResult> {
  const key = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY!;
  const params = new URLSearchParams({
    apiKey: key,
    number: String(PAGE_SIZE),
    offset: String((f.page - 1) * PAGE_SIZE),
    addRecipeInformation: "true",
    addRecipeNutrition: "true",
    ...(f.query && { query: f.query }),
    ...(f.cuisine && { cuisine: f.cuisine }),
    ...(f.diet && { diet: f.diet }),
    ...(f.maxTime && { maxReadyTime: String(f.maxTime) }),
    sort: f.sort === "rating" ? "healthiness" : f.sort === "fastest" ? "time" : "popularity",
  });
  const res = await fetch(`${SPOONACULAR}/recipes/complexSearch?${params}`);
  if (!res.ok) throw new Error(`Spoonacular ${res.status}`);
  const data = await res.json();
  return {
    recipes: (data.results ?? []).map(normalizeSpoonacular),
    total: data.totalResults ?? 0,
    page: f.page,
    hasMore: (data.offset + data.number) < data.totalResults,
    source: "spoonacular",
  };
}

// ─── Edamam ──────────────────────────────────────────────────────────────────

async function edamamSearch(f: ExploreFilters): Promise<ExternalSearchResult> {
  const appId = process.env.NEXT_PUBLIC_EDAMAM_APP_ID!;
  const appKey = process.env.NEXT_PUBLIC_EDAMAM_APP_KEY!;
  const from = (f.page - 1) * PAGE_SIZE;
  const url = new URL(`${EDAMAM}/api/recipes/v2`);
  url.searchParams.set("type", "public");
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("from", String(from));
  url.searchParams.set("to", String(from + PAGE_SIZE));
  if (f.query) url.searchParams.set("q", f.query);
  if (f.cuisine) url.searchParams.set("cuisineType", f.cuisine);
  if (f.diet) url.searchParams.set("diet", f.diet);
  if (f.maxTime) url.searchParams.set("time", `1-${f.maxTime}`);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Edamam ${res.status}`);
  const data = await res.json();
  return {
    recipes: (data.hits ?? []).map(normalizeEdamam),
    total: data.count ?? 0,
    page: f.page,
    hasMore: !!data._links?.next,
    source: "edamam",
  };
}
