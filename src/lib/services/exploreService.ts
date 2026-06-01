"use client";

import type { ExternalRecipe, ExternalSearchResult, ExploreFilters } from "@/lib/externalTypes";
import { normalizeSpoonacular } from "@/lib/adapters/spoonacular";
import { normalizeEdamam } from "@/lib/adapters/edamam";
import { normalizeMealDB } from "@/lib/adapters/themealdb";

// ─── Config ──────────────────────────────────────────────────────────────────

export function getExploreSource() {
  const src = process.env.NEXT_PUBLIC_EXPLORE_SOURCE;
  if (src === "spoonacular" && process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY) return "spoonacular" as const;
  if (src === "edamam" && process.env.NEXT_PUBLIC_EDAMAM_APP_ID) return "edamam" as const;
  if (src === "themealdb") return "themealdb" as const;
  return "mock" as const;
}

export function isExploreApiEnabled() {
  return getExploreSource() !== "mock";
}

const PAGE_SIZE = 20;
const SPOONACULAR = "https://api.spoonacular.com";
const EDAMAM = "https://api.edamam.com";
const MEALDB = "https://www.themealdb.com/api/json/v1/1";

// ─── Simple in-memory cache (15 min) ─────────────────────────────────────────

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
      case "spoonacular": result = await spoonacularSearch(filters); break;
      case "edamam":      result = await edamamSearch(filters);      break;
      case "themealdb":   result = await mealDBSearch(filters);      break;
      default:            result = mockSearch(filters);
    }
  } catch (err) {
    console.warn("[Explore] API error, using mock:", err);
    result = mockSearch(filters);
  }

  if (result.source !== "mock") cache.set(key, { data: result, ts: Date.now() });
  return result;
}

export async function fetchExternalById(id: string): Promise<ExternalRecipe | null> {
  try {
    if (id.startsWith("spoonacular-")) {
      const numId = id.replace("spoonacular-", "");
      const key = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY!;
      const res = await fetch(`${SPOONACULAR}/recipes/${numId}/information?includeNutrition=true&apiKey=${key}`);
      if (!res.ok) return null;
      return normalizeSpoonacular(await res.json());
    }
    if (id.startsWith("themealdb-")) {
      const numId = id.replace("themealdb-", "");
      const res = await fetch(`${MEALDB}/lookup.php?i=${numId}`);
      const data = await res.json();
      return data.meals?.[0] ? normalizeMealDB(data.meals[0]) : null;
    }
  } catch { /* fall through */ }
  return null;
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

// ─── TheMealDB ───────────────────────────────────────────────────────────────

async function mealDBSearch(f: ExploreFilters): Promise<ExternalSearchResult> {
  const term = f.query || f.cuisine || "chicken";
  const res = await fetch(`${MEALDB}/search.php?s=${encodeURIComponent(term)}`);
  const data = await res.json();
  const meals = data.meals ?? [];
  const recipes = meals.map(normalizeMealDB);
  return { recipes, total: recipes.length, page: 1, hasMore: false, source: "themealdb" };
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

const MOCK: ExternalRecipe[] = [
  {
    id: "mock-ext-001", source: "mock", sourceUrl: "",
    title: "Kung Pao Chicken", cuisine: "Chinese",
    image: "https://picsum.photos/seed/kungpao/480/320",
    mealType: "dinner", totalTimeMinutes: 30, servings: 4, difficulty: "Medium",
    rating: 4.7, diets: ["dairy-free"], tags: ["spicy", "stir-fry"],
    ingredients: [
      { name: "chicken breast", amount: "500", unit: "g" },
      { name: "peanuts", amount: "80", unit: "g" },
      { name: "dried red chillies", amount: "10", unit: null },
      { name: "soy sauce", amount: "3 tbsp", unit: null },
      { name: "Sichuan peppercorns", amount: "1 tsp", unit: null },
    ],
    instructions: [
      "Cube chicken and marinate with soy sauce and cornstarch for 10 minutes.",
      "Stir-fry dried chillies and peppercorns in hot wok 30 seconds.",
      "Add chicken, stir-fry 3–4 minutes until golden.",
      "Add garlic, ginger, and sauce. Toss in peanuts and serve.",
    ],
    calories: 380, protein: 34, carbs: 14, fat: 21, culturalNote: "A Sichuan classic named after Qing Dynasty governor Ding Baozhen.",
  },
  {
    id: "mock-ext-002", source: "mock", sourceUrl: "",
    title: "Pad Thai", cuisine: "Thai",
    image: "https://picsum.photos/seed/padthai/480/320",
    mealType: "dinner", totalTimeMinutes: 30, servings: 2, difficulty: "Medium",
    rating: 4.8, diets: ["gluten-free"], tags: ["noodles", "stir-fry", "street food"],
    ingredients: [
      { name: "rice noodles", amount: "200", unit: "g" },
      { name: "shrimp", amount: "200", unit: "g" },
      { name: "eggs", amount: "2", unit: null },
      { name: "tamarind paste", amount: "3 tbsp", unit: null },
      { name: "fish sauce", amount: "3 tbsp", unit: null },
      { name: "roasted peanuts", amount: "3 tbsp", unit: null },
    ],
    instructions: [
      "Soak rice noodles 20 minutes. Mix tamarind, fish sauce, sugar into sauce.",
      "Stir-fry tofu and shrimp in wok on high heat.",
      "Add noodles and sauce, toss. Scramble in eggs.",
      "Serve with peanuts, lime, and chilli flakes.",
    ],
    calories: 520, protein: 28, carbs: 62, fat: 18, culturalNote: "Promoted as Thailand's national dish in the 1940s.",
  },
  {
    id: "mock-ext-003", source: "mock", sourceUrl: "",
    title: "Butter Chicken", cuisine: "Indian",
    image: "https://picsum.photos/seed/butterchicken/480/320",
    mealType: "dinner", totalTimeMinutes: 60, servings: 4, difficulty: "Medium",
    rating: 4.9, diets: ["gluten-free"], tags: ["curry", "creamy", "classic"],
    ingredients: [
      { name: "chicken thighs", amount: "700", unit: "g" },
      { name: "heavy cream", amount: "200", unit: "ml" },
      { name: "canned tomatoes", amount: "400", unit: "g" },
      { name: "butter", amount: "3 tbsp", unit: null },
      { name: "garam masala", amount: "2 tsp", unit: null },
    ],
    instructions: [
      "Marinate chicken in yogurt and spices 1 hour. Grill until charred.",
      "Sauté onion, garlic, ginger. Add spices and tomatoes, simmer 15 minutes.",
      "Blend sauce smooth. Add cream and chicken. Simmer 10 minutes.",
    ],
    calories: 510, protein: 42, carbs: 12, fat: 32, culturalNote: "Invented at Moti Mahal restaurant in Delhi in the 1950s using leftover tandoori chicken.",
  },
  {
    id: "mock-ext-004", source: "mock", sourceUrl: "",
    title: "Pasta Carbonara", cuisine: "Italian",
    image: "https://picsum.photos/seed/carbonara/480/320",
    mealType: "dinner", totalTimeMinutes: 30, servings: 2, difficulty: "Medium",
    rating: 4.8, diets: [], tags: ["pasta", "roman", "classic"],
    ingredients: [
      { name: "spaghetti", amount: "200", unit: "g" },
      { name: "guanciale", amount: "150", unit: "g" },
      { name: "egg yolks", amount: "4", unit: null },
      { name: "Pecorino Romano", amount: "80", unit: "g" },
      { name: "black pepper", amount: "1 tbsp", unit: null },
    ],
    instructions: [
      "Cook spaghetti. Reserve 1 cup pasta water.",
      "Render guanciale until crispy.",
      "Whisk yolks with cheese and pepper.",
      "Off heat, toss pasta with guanciale, egg mix, and pasta water until silky.",
    ],
    calories: 680, protein: 32, carbs: 62, fat: 32, culturalNote: "No cream — the silky sauce comes purely from emulsified eggs and pasta water.",
  },
  {
    id: "mock-ext-005", source: "mock", sourceUrl: "",
    title: "Beef Pho", cuisine: "Vietnamese",
    image: "https://picsum.photos/seed/phobo/480/320",
    mealType: "lunch", totalTimeMinutes: 210, servings: 6, difficulty: "Hard",
    rating: 4.9, diets: ["dairy-free", "gluten-free"], tags: ["soup", "noodles", "aromatic"],
    ingredients: [
      { name: "beef marrow bones", amount: "1.5", unit: "kg" },
      { name: "rice noodles", amount: "400", unit: "g" },
      { name: "star anise", amount: "5", unit: null },
      { name: "fish sauce", amount: "3 tbsp", unit: null },
      { name: "fresh herbs", amount: "1 bunch", unit: null },
    ],
    instructions: [
      "Blanch bones, simmer 3–4 hours with charred ginger and spices.",
      "Strain broth, season with fish sauce and rock sugar.",
      "Cook noodles, add to bowls with thinly sliced beef.",
      "Pour boiling broth over. Serve with bean sprouts, herbs, and lime.",
    ],
    calories: 430, protein: 36, carbs: 48, fat: 10, culturalNote: "Born in Hanoi in the early 20th century — the broth is everything.",
  },
  {
    id: "mock-ext-006", source: "mock", sourceUrl: "",
    title: "Tacos al Pastor", cuisine: "Mexican",
    image: "https://picsum.photos/seed/tacoalpastor/480/320",
    mealType: "dinner", totalTimeMinutes: 80, servings: 6, difficulty: "Medium",
    rating: 4.9, diets: ["dairy-free", "gluten-free"], tags: ["tacos", "pork", "street food"],
    ingredients: [
      { name: "pork shoulder", amount: "1", unit: "kg" },
      { name: "dried guajillo chillies", amount: "4", unit: null },
      { name: "pineapple", amount: "½", unit: null },
      { name: "corn tortillas", amount: "18", unit: "small" },
      { name: "achiote paste", amount: "2 tbsp", unit: null },
    ],
    instructions: [
      "Blend rehydrated chillies with achiote into a paste. Marinate pork 1 hour.",
      "Cook pork on hot grill or cast iron pan until charred.",
      "Warm tortillas. Layer pork, pineapple, onion, and cilantro.",
    ],
    calories: 380, protein: 28, carbs: 34, fat: 14, culturalNote: "Evolved from Lebanese shawarma brought to Mexico in the 1930s.",
  },
  {
    id: "mock-ext-007", source: "mock", sourceUrl: "",
    title: "Shakshuka", cuisine: "Lebanese",
    image: "https://picsum.photos/seed/shakshuka/480/320",
    mealType: "breakfast", totalTimeMinutes: 35, servings: 2, difficulty: "Easy",
    rating: 4.7, diets: ["vegetarian", "gluten-free"], tags: ["eggs", "one-pan", "spiced"],
    ingredients: [
      { name: "eggs", amount: "4", unit: null },
      { name: "canned tomatoes", amount: "400", unit: "g" },
      { name: "red bell peppers", amount: "2", unit: null },
      { name: "cumin", amount: "1 tsp", unit: null },
      { name: "feta cheese", amount: "50", unit: "g" },
    ],
    instructions: [
      "Sauté onion, peppers, garlic. Add spices and tomatoes, simmer 10 minutes.",
      "Make wells, crack in eggs. Cover and cook 8–10 minutes.",
      "Top with feta and fresh parsley. Serve with crusty bread.",
    ],
    calories: 280, protein: 18, carbs: 18, fat: 16, culturalNote: "Beloved across the Middle East and North Africa.",
  },
  {
    id: "mock-ext-008", source: "mock", sourceUrl: "",
    title: "Jerk Chicken", cuisine: "Jamaican",
    image: "https://picsum.photos/seed/jerkchicken/480/320",
    mealType: "dinner", totalTimeMinutes: 525, servings: 4, difficulty: "Medium",
    rating: 4.9, diets: ["dairy-free", "gluten-free"], tags: ["grilled", "spicy", "island"],
    ingredients: [
      { name: "whole chicken", amount: "1.5", unit: "kg" },
      { name: "scotch bonnet peppers", amount: "3", unit: null },
      { name: "allspice berries", amount: "2 tbsp", unit: null },
      { name: "thyme", amount: "4 sprigs", unit: null },
      { name: "scallions", amount: "4", unit: null },
    ],
    instructions: [
      "Blend all marinade ingredients into a paste. Score and marinate chicken overnight.",
      "Grill indirect heat 180°C for 30 minutes.",
      "Move to direct heat 15 minutes, basting with marinade.",
    ],
    calories: 480, protein: 52, carbs: 8, fat: 26, culturalNote: "Originated with Jamaican Maroons cooking over pimento wood pit barbecues.",
  },
];

function mockSearch(f: ExploreFilters): ExternalSearchResult {
  let results = [...MOCK];
  const q = f.query.toLowerCase();
  if (q) results = results.filter(r =>
    r.title.toLowerCase().includes(q) ||
    r.cuisine.toLowerCase().includes(q) ||
    r.tags.some(t => t.includes(q))
  );
  if (f.cuisine) results = results.filter(r => r.cuisine.toLowerCase().includes(f.cuisine.toLowerCase()));
  if (f.diet) results = results.filter(r => r.diets.some(d => d.toLowerCase().includes(f.diet.toLowerCase())));
  if (f.maxTime) results = results.filter(r => !r.totalTimeMinutes || r.totalTimeMinutes <= f.maxTime!);
  if (f.sort === "rating") results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  if (f.sort === "fastest") results.sort((a, b) => (a.totalTimeMinutes ?? 999) - (b.totalTimeMinutes ?? 999));
  return { recipes: results, total: results.length, page: 1, hasMore: false, source: "mock" };
}
