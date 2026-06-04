// Open Food Facts API client for barcode lookup.
// Free, no API key required. Good for packaged/branded food.
// https://world.openfoodfacts.org/data

import type { FoodItem } from "./types";
import { getFoodCacheEntry, setFoodCacheEntry } from "./storage";

const BASE = "https://world.openfoodfacts.org/api/v2/product";

interface OFFNutriments {
  "energy-kcal_100g"?: number;
  "proteins_100g"?: number;
  "carbohydrates_100g"?: number;
  "fat_100g"?: number;
  "fiber_100g"?: number;
}

interface OFFProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_description?: string;
  serving_quantity?: number;  // grams per serving
  nutriments?: OFFNutriments;
  nutriment_data_per?: "100g" | "serving";
}

interface OFFResponse {
  status: number; // 1 = found, 0 = not found
  product?: OFFProduct;
}

/**
 * Fetches nutrition for a barcode from Open Food Facts.
 * Returns null if the product is not in the database.
 */
export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  const cacheKey = `off-barcode:${barcode}`;
  const cached = getFoodCacheEntry(cacheKey);
  if (cached) return cached as FoodItem;

  try {
    const res = await fetch(`${BASE}/${barcode}.json?fields=code,product_name,brands,serving_description,serving_quantity,nutriments,nutriment_data_per`);
    if (!res.ok) return null;

    const json = (await res.json()) as OFFResponse;
    if (json.status !== 1 || !json.product) return null;

    const p = json.product;
    const n = p.nutriments ?? {};

    // All nutriment values are per 100g on OFF unless product has serving data
    const servingG = p.serving_quantity && p.serving_quantity > 0 ? p.serving_quantity : 100;
    const scale = servingG / 100;

    const food: FoodItem = {
      id: `off-${barcode}`,
      source: "usda",   // use "usda" for branded = shows in search results
      externalId: barcode,
      name: p.product_name ?? `Product ${barcode}`,
      brand: p.brands?.split(",")[0]?.trim(),
      servingDescription: p.serving_description ?? `${servingG}g`,
      servingGrams: servingG,
      kcal: Math.round((n["energy-kcal_100g"] ?? 0) * scale),
      proteinG: parseFloat(((n["proteins_100g"] ?? 0) * scale).toFixed(1)),
      carbG: parseFloat(((n["carbohydrates_100g"] ?? 0) * scale).toFixed(1)),
      fatG: parseFloat(((n["fat_100g"] ?? 0) * scale).toFixed(1)),
      fiberG: n["fiber_100g"] ? parseFloat((n["fiber_100g"] * scale).toFixed(1)) : undefined,
    };

    setFoodCacheEntry(cacheKey, food);
    return food;
  } catch {
    return null;
  }
}
