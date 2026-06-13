// USDA FoodData Central API client.
// Key: NEXT_PUBLIC_USDA_API_KEY (free — https://fdc.nal.usda.gov/api-guide.html)
// Results are cached for 24 h in localStorage via nourish/storage.ts.

import { getFoodCacheEntry, setFoodCacheEntry } from "./storage";
import type { FoodItem, UsdaSearchResult } from "./types";
import { config } from "@shared/platform/config";

const BASE = "https://api.nal.usda.gov/fdc/v1";

// USDA nutrient IDs we care about
const NUTRIENT = {
  ENERGY: 1008,  // Energy (kcal)
  PROTEIN: 1003, // Protein (g)
  CARBS: 1005,   // Carbohydrate, by difference (g)
  FAT: 1004,     // Total lipid (fat) (g)
  FIBER: 1079,   // Fiber, total dietary (g)
} as const;

function apiKey(): string {
  return config().usdaApiKey || "DEMO_KEY";
}

export function usingDemoKey(): boolean {
  return apiKey() === "DEMO_KEY";
}

function extractNutrient(
  nutrients: UsdaSearchResult["foodNutrients"],
  id: number,
): number {
  return nutrients.find((n) => n.nutrientId === id)?.value ?? 0;
}

/**
 * Converts a raw USDA search result into our canonical FoodItem shape.
 * Per-100g values are the default when no serving size is given.
 */
export function usdaToFoodItem(raw: UsdaSearchResult): FoodItem {
  const kcal = extractNutrient(raw.foodNutrients, NUTRIENT.ENERGY);
  const proteinG = extractNutrient(raw.foodNutrients, NUTRIENT.PROTEIN);
  const carbG = extractNutrient(raw.foodNutrients, NUTRIENT.CARBS);
  const fatG = extractNutrient(raw.foodNutrients, NUTRIENT.FAT);
  const fiberG = extractNutrient(raw.foodNutrients, NUTRIENT.FIBER);

  const servingGrams =
    raw.servingSize && raw.servingSizeUnit?.toLowerCase() === "g"
      ? raw.servingSize
      : 100;

  // Scale per-serving if a serving size is defined and not already per-serving
  const scale = servingGrams / 100;
  const servingDesc =
    raw.servingSize && raw.servingSizeUnit
      ? `${raw.servingSize}${raw.servingSizeUnit}`
      : "100g";

  return {
    id: `usda-${raw.fdcId}`,
    source: "usda",
    externalId: String(raw.fdcId),
    name: raw.description,
    brand: raw.brandOwner,
    servingDescription: servingDesc,
    servingGrams,
    kcal: Math.round(kcal * scale),
    proteinG: parseFloat((proteinG * scale).toFixed(1)),
    carbG: parseFloat((carbG * scale).toFixed(1)),
    fatG: parseFloat((fatG * scale).toFixed(1)),
    fiberG: fiberG > 0 ? parseFloat((fiberG * scale).toFixed(1)) : undefined,
  };
}

export interface SearchOptions {
  query: string;
  /** Preferred data types (Foundation and Survey are the most reliable). */
  dataType?: string[];
  pageSize?: number;
  /** Pass an AbortSignal to cancel in-flight requests on new input. */
  signal?: AbortSignal;
}

export interface SearchResponse {
  foods: FoodItem[];
  totalHits: number;
  error?: string;
}

/**
 * Search USDA FoodData Central for foods matching `query`.
 * Returns cached results when available; otherwise fetches and caches.
 */
export async function searchUsda(opts: SearchOptions): Promise<SearchResponse> {
  const { query, dataType = ["Foundation", "SR Legacy", "Survey (FNDDS)"], pageSize = 20, signal } = opts;

  const trimmed = query.trim();
  if (trimmed.length < 2) return { foods: [], totalHits: 0 };

  const cacheKey = `${trimmed.toLowerCase()}::${dataType.join(",")}`;
  const cached = getFoodCacheEntry(cacheKey);
  if (cached) {
    return cached as SearchResponse;
  }

  const key = apiKey();
  const url = `${BASE}/foods/search?api_key=${encodeURIComponent(key)}&query=${encodeURIComponent(trimmed)}&dataType=${dataType.map(encodeURIComponent).join(",")}&pageSize=${pageSize}&fields=fdcId,description,brandOwner,servingSize,servingSizeUnit,foodNutrients`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) {
      if (res.status === 429) {
        return {
          foods: [],
          totalHits: 0,
          error: apiKey() === "DEMO_KEY"
            ? "Food search is limited to 30 requests/hour on the demo key. Add NEXT_PUBLIC_USDA_API_KEY for unlimited access."
            : "USDA rate limit reached — please wait a moment and try again.",
        };
      }
      return { foods: [], totalHits: 0, error: `USDA returned ${res.status}` };
    }
    const json = (await res.json()) as {
      totalHits?: number;
      foods?: UsdaSearchResult[];
    };
    const foods = (json.foods ?? []).map(usdaToFoodItem);
    const result: SearchResponse = { foods, totalHits: json.totalHits ?? 0 };
    setFoodCacheEntry(cacheKey, result);
    return result;
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") {
      return { foods: [], totalHits: 0 };
    }
    return { foods: [], totalHits: 0, error: "Could not reach USDA — check your connection." };
  }
}

/**
 * Fetch detailed nutrition for a single food by fdcId.
 * Used when the user wants exact micronutrient data (Phase 3).
 */
export async function fetchUsdaFood(fdcId: string | number): Promise<FoodItem | null> {
  const cacheKey = `fdcId:${fdcId}`;
  const cached = getFoodCacheEntry(cacheKey);
  if (cached) return cached as FoodItem;

  try {
    const res = await fetch(`${BASE}/food/${fdcId}?api_key=${encodeURIComponent(apiKey())}&format=abridged`);
    if (!res.ok) return null;
    const json = (await res.json()) as UsdaSearchResult;
    const item = usdaToFoodItem(json);
    setFoodCacheEntry(cacheKey, item);
    return item;
  } catch {
    return null;
  }
}

// ─── Debounce hook ────────────────────────────────────────────────────────────
// Kept in this file so the hook and API client stay co-located.

import { useState, useEffect, useRef } from "react";

export interface UseFoodSearchResult {
  results: FoodItem[];
  loading: boolean;
  error: string | undefined;
  totalHits: number;
}

/**
 * React hook: debounced USDA food search with abort-on-new-input.
 * Fires 400 ms after the last keystroke.
 */
export function useFoodSearch(query: string): UseFoodSearchResult {
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [totalHits, setTotalHits] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setTotalHits(0);
      setLoading(false);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);

    const delay = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const res = await searchUsda({ query: trimmed, signal: abortRef.current.signal });

      setResults(res.foods);
      setTotalHits(res.totalHits);
      setError(res.error);
      setLoading(false);
    }, 400);

    return () => {
      clearTimeout(delay);
      abortRef.current?.abort();
    };
  }, [query]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { results, loading, error, totalHits };
}
