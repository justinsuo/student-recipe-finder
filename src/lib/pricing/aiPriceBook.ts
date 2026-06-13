import type { AIGroceryPriceEstimate } from "@/lib/workerClient";
import { kv } from "@shared/platform/kv";

/**
 * Local cache of AI-backed grocery price estimates, keyed by
 * `<ingredientId>|<regionId>`. Estimates persist forever in localStorage
 * (with quota guards) so the user only pays for each estimate once.
 */

const KEY = "srf:ai-price-book";
const MAX_ENTRIES = 400;

export interface CachedAIPriceEntry {
  ingredientId: string;
  regionId: string;
  estimate: AIGroceryPriceEstimate;
  appliedUnitCost?: number; // pre-computed cost in the catalog's native unit
  cachedAt: string;
}

function safeRead<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = kv().getItem(KEY);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(value: unknown) {
  if (typeof window === "undefined") return;
  try {
    kv().setItem(KEY, JSON.stringify(value));
  } catch {
    /* quota — ignore */
  }
}

function key(ingredientId: string, regionId: string): string {
  return `${ingredientId}|${regionId}`;
}

export function getAIPrice(
  ingredientId: string,
  regionId: string,
): CachedAIPriceEntry | undefined {
  const map = safeRead<Record<string, CachedAIPriceEntry>>({});
  return map[key(ingredientId, regionId)];
}

export function setAIPrice(entry: CachedAIPriceEntry) {
  const map = safeRead<Record<string, CachedAIPriceEntry>>({});
  map[key(entry.ingredientId, entry.regionId)] = entry;
  // Soft cap — evict oldest if too many
  const entries = Object.entries(map);
  if (entries.length > MAX_ENTRIES) {
    entries.sort((a, b) => (a[1].cachedAt < b[1].cachedAt ? -1 : 1));
    const drop = entries.slice(0, entries.length - MAX_ENTRIES);
    for (const [k] of drop) delete map[k];
  }
  safeWrite(map);
}

export function deleteAIPrice(ingredientId: string, regionId: string) {
  const map = safeRead<Record<string, CachedAIPriceEntry>>({});
  delete map[key(ingredientId, regionId)];
  safeWrite(map);
}

export function clearAIPriceBook() {
  safeWrite({});
}

export function listAIPrices(): CachedAIPriceEntry[] {
  const map = safeRead<Record<string, CachedAIPriceEntry>>({});
  return Object.values(map);
}

/**
 * Pick the best normalized price-per-unit for the catalog's native unit.
 * Returns the price per the catalog unit (e.g. tbsp for "soy-sauce") and
 * the normalized price metadata that fed the calc.
 */
export function applyEstimateToUnit(
  estimate: AIGroceryPriceEstimate,
  catalogUnit: string,
): number | null {
  const np = estimate.normalizedPrices ?? {};
  const u = catalogUnit.toLowerCase();
  const direct: Record<string, number | null | undefined> = {
    oz: np.pricePerOz,
    lb: np.pricePerLb,
    g: np.pricePerGram,
    gram: np.pricePerGram,
    each: np.pricePerEach,
    egg: np.pricePerEach,
    item: np.pricePerEach,
    tbsp: np.pricePerTbsp,
    tablespoon: np.pricePerTbsp,
    tsp: np.pricePerTsp,
    teaspoon: np.pricePerTsp,
    cup: np.pricePerCup,
  };
  const v = direct[u];
  if (typeof v === "number" && Number.isFinite(v)) return v;

  // Try simple package-fallback math: if package unit matches catalog unit,
  // use package price ÷ package size.
  const pkg = estimate.selectedBudgetEstimate;
  if (pkg.packageUnit.toLowerCase() === u && pkg.packageSize > 0) {
    return pkg.packagePrice / pkg.packageSize;
  }
  return null;
}
