/**
 * Image resolution for the explore page.
 *
 * Priority:
 *   1. RECIPE_PHOTO_MAP — dish-specific Wikimedia photo (exact match)
 *   2. null — caller shows a cuisine-gradient fallback (no wrong/duplicate photos)
 *
 * resolveRecipeImage() returns null when no dish-specific photo exists so that
 * the explore page can render a clean gradient rather than a mismatched food photo.
 *
 * getCuisineGradient() provides the CSS gradient string for that fallback.
 */

import type { ExternalRecipe } from "@/lib/externalTypes";
import { RECIPE_PHOTO_MAP } from "@/data/recipePhotoMap";

// ── Dish-specific photo lookup ────────────────────────────────────────────────

/**
 * Returns the Wikimedia Commons URL for this exact dish, or null if none exists.
 * When null, the caller should render a getCuisineGradient() fallback.
 */
export function resolveRecipeImage(recipe: ExternalRecipe): string | null {
  // Already a stable non-Unsplash URL (e.g. TheMealDB, Spoonacular) — keep it
  if (!recipe.image.includes("source.unsplash.com")) return recipe.image;
  // Dish-specific verified photo
  return RECIPE_PHOTO_MAP[recipe.id] ?? null;
}

// ── Cuisine → gradient ────────────────────────────────────────────────────────

const GRADIENTS: Record<string, readonly [string, string]> = {
  // East Asian
  Chinese:         ["#c0392b", "#922b21"],
  Cantonese:       ["#c0392b", "#922b21"],
  Shanghainese:    ["#c0392b", "#7b241c"],
  Sichuan:         ["#c0392b", "#e74c3c"],
  Taiwanese:       ["#2980b9", "#c0392b"],
  Japanese:        ["#8e44ad", "#d7bde2"],
  Korean:          ["#c0392b", "#e67e22"],
  // Southeast Asian
  Thai:            ["#1e8449", "#f1c40f"],
  Vietnamese:      ["#c0392b", "#f1c40f"],
  Filipino:        ["#1a5276", "#c0392b"],
  Indonesian:      ["#c0392b", "#f39c12"],
  Malaysian:       ["#c0392b", "#f1c40f"],
  Singaporean:     ["#c0392b", "#f1c40f"],
  Burmese:         ["#f1c40f", "#c0392b"],
  Cambodian:       ["#1a5276", "#e67e22"],
  Laotian:         ["#c0392b", "#1e8449"],
  Bruneian:        ["#f1c40f", "#1a1a1a"],
  // South Asian
  Indian:          ["#e67e22", "#f39c12"],
  "North Indian":  ["#e67e22", "#f39c12"],
  "South Indian":  ["#1e8449", "#f39c12"],
  Pakistani:       ["#1e8449", "#27ae60"],
  "Sri Lankan":    ["#c0392b", "#f39c12"],
  Nepali:          ["#c0392b", "#1a5276"],
  Bangladeshi:     ["#1e8449", "#c0392b"],
  // Middle East & Central Asia
  Persian:         ["#1a5276", "#c0392b"],
  Iranian:         ["#1a5276", "#c0392b"],
  Turkish:         ["#c0392b", "#f1c40f"],
  Lebanese:        ["#c0392b", "#27ae60"],
  Syrian:          ["#1a1a1a", "#c0392b"],
  Israeli:         ["#1a5276", "#f5f5f5"],
  Egyptian:        ["#d35400", "#f1c40f"],
  Moroccan:        ["#d35400", "#f39c12"],
  Afghan:          ["#1a1a1a", "#c0392b"],
  Uzbek:           ["#1a5276", "#f1c40f"],
  Azerbaijani:     ["#1a5276", "#c0392b"],
  Iraqi:           ["#1a1a1a", "#27ae60"],
  Omani:           ["#c0392b", "#27ae60"],
  Yemeni:          ["#c0392b", "#f1c40f"],
  Kuwaiti:         ["#1e8449", "#c0392b"],
  Saudi:           ["#1e8449", "#f1c40f"],
  Emirati:         ["#1e8449", "#f1c40f"],
  Mongolian:       ["#1a5276", "#c0392b"],
  // African
  Ethiopian:       ["#c0392b", "#f1c40f"],
  Kenyan:          ["#1a1a1a", "#c0392b"],
  Nigerian:        ["#1e8449", "#808000"],
  Ghanaian:        ["#c0392b", "#f39c12"],
  Senegalese:      ["#1e8449", "#f1c40f"],
  Tanzanian:       ["#1a5276", "#c0392b"],
  Malawian:        ["#1a1a1a", "#c0392b"],
  Zimbabwean:      ["#1a1a1a", "#c0392b"],
  "South African": ["#1e8449", "#f1c40f"],
  Algerian:        ["#1e8449", "#f1c40f"],
  // European
  Italian:         ["#1e8449", "#c0392b"],
  French:          ["#1a5276", "#c0392b"],
  Spanish:         ["#c0392b", "#f1c40f"],
  Greek:           ["#1a5276", "#f5f5f5"],
  Portuguese:      ["#1e8449", "#c0392b"],
  German:          ["#1a1a1a", "#c0392b"],
  Austrian:        ["#c0392b", "#f5f5f5"],
  Hungarian:       ["#c0392b", "#27ae60"],
  Polish:          ["#c0392b", "#f5f5f5"],
  Czech:           ["#1a5276", "#c0392b"],
  Romanian:        ["#1a5276", "#f1c40f"],
  Bulgarian:       ["#1e8449", "#f5f5f5"],
  Ukrainian:       ["#1a5276", "#f1c40f"],
  British:         ["#c0392b", "#1a5276"],
  Irish:           ["#1e8449", "#f5f5f5"],
  Scandinavian:    ["#1a5276", "#f5f5f5"],
  Maltese:         ["#c0392b", "#f5f5f5"],
  // Americas
  Mexican:         ["#1e8449", "#c0392b"],
  Peruvian:        ["#c0392b", "#f5f5f5"],
  Colombian:       ["#f1c40f", "#1a5276"],
  Venezuelan:      ["#c0392b", "#1e8449"],
  Brazilian:       ["#1e8449", "#f1c40f"],
  Argentine:       ["#1a5276", "#f5f5f5"],
  Chilean:         ["#c0392b", "#1a5276"],
  Ecuadorian:      ["#f1c40f", "#1a5276"],
  Bolivian:        ["#c0392b", "#f1c40f"],
  Trinidadian:     ["#c0392b", "#1a1a1a"],
  Jamaican:        ["#1e8449", "#f1c40f"],
  Dominican:       ["#1a5276", "#c0392b"],
  "Puerto Rican":  ["#c0392b", "#1a5276"],
  Cuban:           ["#1a5276", "#c0392b"],
  American:        ["#1a5276", "#c0392b"],
  Cajun:           ["#c0392b", "#d35400"],
  Creole:          ["#8e44ad", "#c0392b"],
  Southern:        ["#d35400", "#f39c12"],
  Hawaiian:        ["#1a5276", "#27ae60"],
  Canadian:        ["#c0392b", "#f5f5f5"],
  // Oceania
  Australian:      ["#c0392b", "#f1c40f"],
  "New Zealand":   ["#1a1a1a", "#c0392b"],
  Samoan:          ["#c0392b", "#1a5276"],
  Fijian:          ["#1a5276", "#c0392b"],
  Tongan:          ["#c0392b", "#f5f5f5"],
  Palauan:         ["#1a5276", "#c0392b"],
};

const FALLBACK_COLORS = [
  ["#1a5276", "#2980b9"],
  ["#1e8449", "#27ae60"],
  ["#c0392b", "#e74c3c"],
  ["#d35400", "#e67e22"],
  ["#7d3c98", "#8e44ad"],
  ["#1a5276", "#922b21"],
  ["#d35400", "#1e8449"],
] as const;

/**
 * Returns a CSS `linear-gradient(...)` string for the given cuisine name.
 * Used as a fallback when no dish-specific photo is available.
 */
export function getCuisineGradient(cuisine: string): string {
  const exact = GRADIENTS[cuisine];
  if (exact) return `linear-gradient(135deg, ${exact[0]}, ${exact[1]})`;

  // Partial match (e.g. "North Indian" → "Indian")
  for (const [key, colors] of Object.entries(GRADIENTS)) {
    if (cuisine.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(cuisine.toLowerCase())) {
      return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
    }
  }

  // Hash-based deterministic fallback for unknown cuisines
  const n = cuisine.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
  const pair = FALLBACK_COLORS[Math.abs(n) % FALLBACK_COLORS.length];
  return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
}
