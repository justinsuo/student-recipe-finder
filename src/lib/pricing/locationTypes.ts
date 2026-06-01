/**
 * Types for the regional pricing engine.
 *
 * Strategy: we don't (and can't) scrape store-specific live prices. Instead
 * we keep a built-in per-ingredient *base* US price, multiply by a regional
 * cost-of-living factor, and let the user override any individual ingredient
 * price by hand. AI is used only as a fallback for ingredients that don't
 * have a base price in the catalog.
 *
 * Every displayed price carries metadata: the region used, the multiplier,
 * whether it was user-edited, and the confidence label. We never show fake
 * store-specific prices.
 */

export type PriceConfidence = "high" | "medium" | "low";

export interface PriceRegion {
  id: string;
  label: string; // e.g. "SF Bay Area"
  shortLabel?: string; // e.g. "Bay Area"
  multiplier: number; // 1.0 = national average
  notes?: string;
}

export interface UserLocation {
  // Used to look up the region. The exact ZIP is stored locally only.
  zipCode?: string;
  cityName?: string;
  regionId: string;
  // Set when the user explicitly chose a region rather than entering a ZIP.
  manualRegion?: boolean;
  updatedAt: string;
}

export interface IngredientPriceOverride {
  ingredientId: string;
  unitCost: number; // dollars per unit
  unit: string;
  note?: string;
  updatedAt: string;
}

export interface PriceQuote {
  ingredientId: string;
  ingredientName: string;
  baseUnitCost: number; // national US base
  appliedUnitCost: number; // base * multiplier (or override)
  quantity: number;
  unit: string;
  totalCost: number; // applied * quantity
  regionLabel: string;
  multiplier: number;
  source: "catalog" | "override" | "ai-estimate" | "fallback";
  confidence: PriceConfidence;
  note?: string;
}

export interface RecipeLocalPrice {
  totalCost: number;
  costPerServing: number;
  regionLabel: string;
  multiplier: number;
  breakdown: PriceQuote[];
  // Cost only of ingredients the user does not have in pantry
  missingTotalCost: number;
  // Lowest-confidence quote in the basket — used to badge the recipe
  worstConfidence: PriceConfidence;
}
