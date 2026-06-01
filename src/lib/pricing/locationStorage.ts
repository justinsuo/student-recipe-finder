import type {
  IngredientPriceOverride,
  UserLocation,
} from "./locationTypes";
import { REGIONS, getRegion, zipToRegion } from "./regions";

const LOCATION_KEY = "srf:location";
const OVERRIDES_KEY = "srf:price-overrides";

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

// ---------- Location ----------

const DEFAULT_LOCATION: UserLocation = {
  regionId: "national",
  manualRegion: false,
  updatedAt: new Date(0).toISOString(),
};

export function getLocation(): UserLocation {
  return safeRead<UserLocation>(LOCATION_KEY, DEFAULT_LOCATION);
}

export function setLocationFromZip(zip: string): UserLocation {
  const regionId = zipToRegion(zip);
  const loc: UserLocation = {
    zipCode: zip.trim().slice(0, 5),
    regionId,
    manualRegion: false,
    updatedAt: new Date().toISOString(),
  };
  safeWrite(LOCATION_KEY, loc);
  return loc;
}

export function setLocationManual(regionId: string): UserLocation {
  const region = getRegion(regionId);
  const loc: UserLocation = {
    regionId: region.id,
    manualRegion: true,
    updatedAt: new Date().toISOString(),
  };
  safeWrite(LOCATION_KEY, loc);
  return loc;
}

export function clearLocation() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCATION_KEY);
}

export function listRegions() {
  return REGIONS;
}

// ---------- Price overrides ----------

export function getOverrides(): Record<string, IngredientPriceOverride> {
  return safeRead<Record<string, IngredientPriceOverride>>(OVERRIDES_KEY, {});
}

export function getOverride(
  ingredientId: string,
): IngredientPriceOverride | undefined {
  return getOverrides()[ingredientId];
}

export function setOverride(
  ingredientId: string,
  unitCost: number,
  unit: string,
  note?: string,
) {
  const map = getOverrides();
  map[ingredientId] = {
    ingredientId,
    unitCost,
    unit,
    note,
    updatedAt: new Date().toISOString(),
  };
  safeWrite(OVERRIDES_KEY, map);
}

export function deleteOverride(ingredientId: string) {
  const map = getOverrides();
  delete map[ingredientId];
  safeWrite(OVERRIDES_KEY, map);
}
