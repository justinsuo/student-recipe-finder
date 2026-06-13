"use client";

import type { ExternalRecipe, ExternalSearchResult, ExploreFilters } from "@/lib/externalTypes";
import { normalizeSpoonacular } from "@/lib/adapters/spoonacular";
import { normalizeEdamam } from "@/lib/adapters/edamam";
import { normalizeMealDB } from "@/lib/adapters/themealdb";
import { GLOBAL_RECIPES } from "@/data/globalRecipes";
import { EXPLORE_RECIPES } from "@/data/exploreRecipes";
import { config } from "@shared/platform/config";

// ─── Config ───────────────────────────────────────────────────────────────────

export function getExploreSource() {
  const src = config().exploreSource;
  if (src === "spoonacular" && config().spoonacularApiKey) return "spoonacular" as const;
  if (
    src === "edamam" &&
    config().edamamAppId &&
    config().edamamAppKey
  )
    return "edamam" as const;
  if (src === "themealdb") return "themealdb" as const;
  // Default: serve our local global recipe library — no API key needed
  return "local" as const;
}

const PAGE_SIZE = 24;

// ─── Cache ────────────────────────────────────────────────────────────────────

const cache = new Map<string, { data: ExternalSearchResult; ts: number }>();
const TTL = 15 * 60 * 1000;

function getCached(key: string): ExternalSearchResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL) { cache.delete(key); return null; }
  return entry.data;
}

// ─── Main search ──────────────────────────────────────────────────────────────

export async function searchExternalRecipes(filters: ExploreFilters): Promise<ExternalSearchResult> {
  const source = getExploreSource();
  const key = `${source}:${JSON.stringify(filters)}`;
  const hit = getCached(key);
  if (hit) return hit;

  let result: ExternalSearchResult;
  try {
    switch (source) {
      case "local":        result = localSearch(filters);             break;
      case "spoonacular":  result = await spoonacularSearch(filters); break;
      case "edamam":       result = await edamamSearch(filters);      break;
      default:             result = await mealDBSearch(filters);
    }
  } catch (err) {
    console.warn("[Explore] Error:", err);
    result = localSearch(filters); // always fall back to local
  }

  cache.set(key, { data: result, ts: Date.now() });
  return result;
}

// ─── Local Search (built-in global recipe library) ────────────────────────────

const DIFFICULTY_ORDER: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };

function localSearch(filters: ExploreFilters): ExternalSearchResult {
  const q = filters.query.trim().toLowerCase();

  const ALL_RECIPES = [...GLOBAL_RECIPES, ...EXPLORE_RECIPES];
  const results = ALL_RECIPES.filter((r) => {
    // Text search
    if (q) {
      const haystack = [
        r.title, r.cuisine, r.country, r.region, r.culturalNote,
        ...(r.diets ?? []), ...(r.tags ?? []), ...(r.flavorProfile ?? []),
        ...(r.ingredients ?? []).map((i) => i.name),
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    // Cuisine filter
    if (filters.cuisine && r.cuisine.toLowerCase() !== filters.cuisine.toLowerCase()) return false;
    // Region filter
    if (filters.region && r.region?.toLowerCase() !== filters.region.toLowerCase()) return false;
    // Diet filter
    if (filters.diet && !r.diets.some((d) => d.toLowerCase().includes(filters.diet.toLowerCase()))) return false;
    // Meal type filter
    if (filters.mealType && r.mealType?.toLowerCase() !== filters.mealType.toLowerCase()) return false;
    // Difficulty filter
    if (filters.difficulty && r.difficulty?.toLowerCase() !== filters.difficulty.toLowerCase()) return false;
    // Max time filter
    if (filters.maxTime != null && r.totalTimeMinutes != null && r.totalTimeMinutes > filters.maxTime) return false;
    // Max cost filter
    if (filters.maxCost != null && r.estimatedCost != null && r.estimatedCost > filters.maxCost) return false;
    // Spice level filter (at most)
    if (filters.spiceLevel != null && r.spiceLevel != null && r.spiceLevel > filters.spiceLevel) return false;
    // Protein type filter
    if (filters.proteinType && r.proteinType?.toLowerCase() !== filters.proteinType.toLowerCase()) return false;
    // Student mode — only show recipes with a score ≥ 7
    if (filters.studentMode && (r.studentFriendlyScore ?? 10) < 7) return false;
    return true;
  });

  // Sort
  switch (filters.sort) {
    case "fastest":
      results.sort((a, b) => (a.totalTimeMinutes ?? 999) - (b.totalTimeMinutes ?? 999));
      break;
    case "cheapest":
      results.sort((a, b) => (a.estimatedCost ?? 999) - (b.estimatedCost ?? 999));
      break;
    case "easiest":
      results.sort((a, b) => (DIFFICULTY_ORDER[a.difficulty ?? "Hard"] ?? 3) - (DIFFICULTY_ORDER[b.difficulty ?? "Hard"] ?? 3));
      break;
    case "score":
      results.sort((a, b) => (b.studentFriendlyScore ?? 0) - (a.studentFriendlyScore ?? 0));
      break;
    case "rating":
      results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    default:
      // "popular" — keep original order (insertion order by cuisine/region)
      break;
  }

  const from = (filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;
  return {
    recipes: results.slice(from, to),
    total: results.length,
    page: filters.page,
    hasMore: to < results.length,
    source: "local",
  };
}

// ─── TheMealDB ────────────────────────────────────────────────────────────────

const MEALDB = "https://www.themealdb.com/api/json/v1/1";
const MEALDB_CATEGORIES = [
  "Chicken", "Beef", "Seafood", "Pasta", "Pork", "Lamb",
  "Vegetarian", "Vegan", "Breakfast", "Dessert", "Starter",
  "Side", "Miscellaneous", "Goat",
];
const MEALDB_AREAS = [
  "American", "British", "Canadian", "Chinese", "Croatian", "Dutch",
  "Egyptian", "Filipino", "French", "Greek", "Indian", "Irish",
  "Italian", "Jamaican", "Japanese", "Kenyan", "Malaysian", "Mexican",
  "Moroccan", "Polish", "Portuguese", "Russian", "Spanish", "Thai",
  "Tunisian", "Turkish", "Vietnamese",
];

const mealDetailCache = new Map<string, object>();

async function mealDBSearch(filters: ExploreFilters): Promise<ExternalSearchResult> {
  if (filters.query.trim()) {
    const res = await fetch(`${MEALDB}/search.php?s=${encodeURIComponent(filters.query)}`);
    if (!res.ok) throw new Error(`MealDB search ${res.status}`);
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recipes = (data.meals ?? []).map((m: any) => normalizeMealDB(m));
    return paginate(recipes, filters.page);
  }
  if (filters.cuisine) {
    const areaMatch = MEALDB_AREAS.find(a => a.toLowerCase() === filters.cuisine.toLowerCase());
    if (areaMatch) return paginate(await fetchMealsByArea(areaMatch), filters.page);
    const catMatch = MEALDB_CATEGORIES.find(c => c.toLowerCase().includes(filters.cuisine.toLowerCase()));
    if (catMatch) return paginate(await fetchMealsByCategory(catMatch), filters.page);
  }
  return fetchAllCategories(filters.page);
}

async function fetchMealsByArea(area: string): Promise<ExternalRecipe[]> {
  const cacheKey = `area:${area}`;
  if (mealDetailCache.has(cacheKey)) return mealDetailCache.get(cacheKey) as ExternalRecipe[];
  const res = await fetch(`${MEALDB}/filter.php?a=${encodeURIComponent(area)}`);
  if (!res.ok) throw new Error(`MealDB area ${res.status}`);
  const data = await res.json();
  const meals = await lookupMeals(data.meals ?? []);
  mealDetailCache.set(cacheKey, meals);
  return meals;
}

async function fetchMealsByCategory(category: string): Promise<ExternalRecipe[]> {
  const cacheKey = `cat:${category}`;
  if (mealDetailCache.has(cacheKey)) return mealDetailCache.get(cacheKey) as ExternalRecipe[];
  const res = await fetch(`${MEALDB}/filter.php?c=${encodeURIComponent(category)}`);
  if (!res.ok) throw new Error(`MealDB category ${res.status}`);
  const data = await res.json();
  const meals = await lookupMeals(data.meals ?? []);
  mealDetailCache.set(cacheKey, meals);
  return meals;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function lookupMeals(filterResults: any[]): Promise<ExternalRecipe[]> {
  if (!filterResults?.length) return [];
  const limited = filterResults.slice(0, 30);
  const results = await Promise.allSettled(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    limited.map(async (m: any) => {
      const res = await fetch(`${MEALDB}/lookup.php?i=${m.idMeal}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.meals?.[0] ? normalizeMealDB(data.meals[0]) : null;
    })
  );
  return results
    .filter((r): r is PromiseFulfilledResult<ExternalRecipe | null> => r.status === "fulfilled" && r.value !== null)
    .map(r => r.value!);
}

async function fetchAllCategories(page: number): Promise<ExternalSearchResult> {
  const idx = (page - 1) % MEALDB_CATEGORIES.length;
  const cats = [MEALDB_CATEGORIES[idx], MEALDB_CATEGORIES[(idx + 1) % MEALDB_CATEGORIES.length]];
  const allMeals: ExternalRecipe[] = [];
  for (const cat of cats) allMeals.push(...await fetchMealsByCategory(cat));
  const seen = new Set<string>();
  const unique = allMeals.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
  return { recipes: unique.slice(0, PAGE_SIZE), total: unique.length, page, hasMore: unique.length > PAGE_SIZE, source: "themealdb" };
}

function paginate(recipes: ExternalRecipe[], page: number): ExternalSearchResult {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;
  return { recipes: recipes.slice(from, to), total: recipes.length, page, hasMore: to < recipes.length, source: "themealdb" };
}

// ─── Spoonacular ─────────────────────────────────────────────────────────────

async function spoonacularSearch(f: ExploreFilters): Promise<ExternalSearchResult> {
  const key = config().spoonacularApiKey;
  const params = new URLSearchParams({
    apiKey: key, number: String(PAGE_SIZE), offset: String((f.page - 1) * PAGE_SIZE),
    addRecipeInformation: "true", addRecipeNutrition: "true",
    ...(f.query && { query: f.query }), ...(f.cuisine && { cuisine: f.cuisine }),
    ...(f.diet && { diet: f.diet }), ...(f.maxTime && { maxReadyTime: String(f.maxTime) }),
    sort: f.sort === "rating" ? "healthiness" : f.sort === "fastest" ? "time" : "popularity",
  });
  const res = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params}`);
  if (!res.ok) throw new Error(`Spoonacular ${res.status}`);
  const data = await res.json();
  const results = data.results ?? [];
  const offset = Number(data.offset ?? (f.page - 1) * PAGE_SIZE);
  const number = Number(data.number ?? results.length);
  const total = Number(data.totalResults ?? 0);
  return {
    recipes: results.map(normalizeSpoonacular),
    total,
    page: f.page,
    hasMore: Number.isFinite(offset + number) && offset + number < total,
    source: "spoonacular",
  };
}

// ─── Edamam ──────────────────────────────────────────────────────────────────

async function edamamSearch(f: ExploreFilters): Promise<ExternalSearchResult> {
  const appId = config().edamamAppId;
  const appKey = config().edamamAppKey;
  const from = (f.page - 1) * PAGE_SIZE;
  const url = new URL("https://api.edamam.com/api/recipes/v2");
  url.searchParams.set("type", "public"); url.searchParams.set("app_id", appId); url.searchParams.set("app_key", appKey);
  url.searchParams.set("from", String(from)); url.searchParams.set("to", String(from + PAGE_SIZE));
  if (f.query) url.searchParams.set("q", f.query);
  if (f.cuisine) url.searchParams.set("cuisineType", f.cuisine);
  if (f.diet) url.searchParams.set("diet", f.diet);
  if (f.maxTime) url.searchParams.set("time", `1-${f.maxTime}`);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Edamam ${res.status}`);
  const data = await res.json();
  return { recipes: (data.hits ?? []).map(normalizeEdamam), total: data.count ?? 0, page: f.page, hasMore: !!data._links?.next, source: "edamam" };
}
