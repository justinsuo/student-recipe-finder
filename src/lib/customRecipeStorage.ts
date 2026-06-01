"use client";

import type {
  AIGeneratedRecipe,
  CustomRecipe,
  CustomRecipeImage,
  UserCreatedRecipe,
} from "@/lib/customRecipeTypes";

const RECIPES_KEY = "srf:custom-recipes";
const IMAGES_KEY = "srf:custom-recipe-images"; // small base64s only, with cap

const MAX_INLINE_IMAGE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB cap per image
const MAX_TOTAL_IMAGE_BYTES = 6 * 1024 * 1024; // 6 MB total

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
    /* quota — fall through */
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function makeCustomRecipeId(name: string, prefix: "gen" | "user"): string {
  const existing = new Set(getCustomRecipes().map((r) => r.id));
  const base = slugify(name) || "recipe";
  let id = `${prefix}-${base}-${Math.random().toString(36).slice(2, 7)}`;
  while (existing.has(id)) {
    id = `${prefix}-${base}-${Math.random().toString(36).slice(2, 7)}`;
  }
  return id;
}

export function getCustomRecipes(): CustomRecipe[] {
  return safeRead<CustomRecipe[]>(RECIPES_KEY, []);
}

export function getCustomRecipe(id: string): CustomRecipe | undefined {
  return getCustomRecipes().find((r) => r.id === id);
}

export function saveCustomRecipe(r: CustomRecipe): CustomRecipe {
  const all = getCustomRecipes();
  const idx = all.findIndex((x) => x.id === r.id);
  if (idx >= 0) all[idx] = r;
  else all.push(r);
  safeWrite(RECIPES_KEY, all);
  return r;
}

export function deleteCustomRecipe(id: string) {
  const all = getCustomRecipes().filter((r) => r.id !== id);
  safeWrite(RECIPES_KEY, all);
  deleteRecipeImage(id);
}

// ---------- Image storage (separate to avoid bloating the recipe blob) ----------

interface StoredImage {
  id: string;
  b64: string;
  prompt?: string;
  model?: string;
  storedAt: string;
  bytes: number;
}

export function storeRecipeImage(
  recipeId: string,
  b64: string,
  meta?: { prompt?: string; model?: string },
): { ok: boolean; reason?: string } {
  if (typeof window === "undefined") return { ok: false, reason: "ssr" };
  const bytes = Math.floor((b64.length * 3) / 4);
  if (bytes > MAX_INLINE_IMAGE_BYTES) {
    return { ok: false, reason: "image too large to cache locally" };
  }
  const map = safeRead<Record<string, StoredImage>>(IMAGES_KEY, {});
  // Evict oldest images if we would blow past total cap
  const totalAfter =
    Object.values(map).reduce((acc, v) => acc + v.bytes, 0) + bytes;
  if (totalAfter > MAX_TOTAL_IMAGE_BYTES) {
    const sorted = Object.values(map).sort((a, b) =>
      a.storedAt < b.storedAt ? -1 : 1,
    );
    while (
      sorted.length > 0 &&
      sorted.reduce((acc, v) => acc + v.bytes, 0) + bytes > MAX_TOTAL_IMAGE_BYTES
    ) {
      const drop = sorted.shift();
      if (drop) delete map[drop.id];
    }
  }
  map[recipeId] = {
    id: recipeId,
    b64,
    prompt: meta?.prompt,
    model: meta?.model,
    storedAt: new Date().toISOString(),
    bytes,
  };
  try {
    window.localStorage.setItem(IMAGES_KEY, JSON.stringify(map));
    return { ok: true };
  } catch {
    return { ok: false, reason: "localStorage quota" };
  }
}

export function getStoredRecipeImage(id: string): StoredImage | undefined {
  const map = safeRead<Record<string, StoredImage>>(IMAGES_KEY, {});
  return map[id];
}

export function deleteRecipeImage(id: string) {
  const map = safeRead<Record<string, StoredImage>>(IMAGES_KEY, {});
  if (map[id]) {
    delete map[id];
    safeWrite(IMAGES_KEY, map);
  }
}

export function imageDataUrl(b64: string, mediaType = "image/png"): string {
  return `data:${mediaType};base64,${b64}`;
}

// ---------- Helpers ----------

export function fallbackImageMeta(): CustomRecipeImage {
  return {
    alt: "Recipe image",
    sourceName: "Fallback",
    license: "Generated placeholder",
    isAIGenerated: false,
    isFallback: true,
  };
}

export function emptyUserRecipe(): UserCreatedRecipe {
  return {
    id: "",
    name: "",
    description: "",
    mealType: "dinner",
    cuisineStyle: "",
    servings: 2,
    prepTimeMinutes: 0,
    cookTimeMinutes: 0,
    totalTimeMinutes: 0,
    difficulty: "easy",
    equipment: [],
    primaryCookingMethod: "stovetop",
    noStovetopRequired: false,
    estimatedTotalCost: 0,
    estimatedCostPerServing: 0,
    ingredients: [],
    steps: [],
    tags: [],
    image: fallbackImageMeta(),
    createdAt: "",
    updatedAt: "",
    isAIGenerated: false,
    isUserCreated: true,
  };
}

export function isAIRecipe(r: CustomRecipe): r is AIGeneratedRecipe {
  return r.isAIGenerated === true;
}
