/**
 * Pantry Pop — category → color mapping.
 *
 * Most code should NOT reach for raw hex. Use the `tailwindTone` for
 * badges / chips / icons (so the rest of the Tailwind ecosystem of
 * bg-*-100, text-*-700, ring-*-500 utilities composes cleanly), and the
 * `hex` only when you need a runtime color (canvas, SVG fill, computed
 * style). Both come from the same source-of-truth list.
 */

import { PANTRY_POP } from "./design/tokens";

export type CategoryKey =
  | "ai-chef"
  | "pantry"
  | "cheap"
  | "nourish"
  | "protein"
  | "carbs"
  | "fat"
  | "water"
  | "air-fryer"
  | "microwave"
  | "use-soon"
  | "spicy"
  | "saved"
  | "grocery"
  | "explore"
  | "vegetarian"
  | "meal-prep"
  | "dorm-friendly";

/** Tailwind tone name (drives bg-{tone}-*, text-{tone}-*, ring-{tone}-*). */
export type TailwindTone =
  | "violet"
  | "emerald"
  | "amber"
  | "orange"
  | "rose"
  | "teal"
  | "indigo"
  | "sky"
  | "cyan"
  | "red";

export const CATEGORY_COLORS: Record<
  CategoryKey,
  { hex: string; tone: TailwindTone; label: string }
> = {
  // ── Product surfaces ─────────────────────────────────────────────────
  "ai-chef":   { hex: PANTRY_POP.grape,  tone: "violet",  label: "AI Chef" },
  pantry:      { hex: PANTRY_POP.basil,  tone: "emerald", label: "Pantry" },
  cheap:       { hex: PANTRY_POP.butter, tone: "amber",   label: "Cheap" },
  nourish:     { hex: PANTRY_POP.carrot, tone: "orange",  label: "Nourish" },
  saved:       { hex: PANTRY_POP.pink,   tone: "rose",    label: "Saved" },
  grocery:     { hex: PANTRY_POP.teal,   tone: "teal",    label: "Grocery" },
  explore:     { hex: "#6366F1",         tone: "indigo",  label: "Explore" },

  // ── Macros (nutrition tracker convention) ────────────────────────────
  protein:     { hex: "#8B5CF6",         tone: "violet",  label: "Protein" },
  carbs:       { hex: PANTRY_POP.sky,    tone: "sky",     label: "Carbs" },
  fat:         { hex: "#F59E0B",         tone: "amber",   label: "Fat" },
  water:       { hex: "#06B6D4",         tone: "cyan",    label: "Water" },

  // ── Cooking method ───────────────────────────────────────────────────
  "air-fryer": { hex: PANTRY_POP.carrot, tone: "orange",  label: "Air fryer" },
  microwave:   { hex: PANTRY_POP.sky,    tone: "sky",     label: "Microwave" },

  // ── Pantry / inventory states ────────────────────────────────────────
  "use-soon":  { hex: "#F59E0B",         tone: "amber",   label: "Use soon" },
  spicy:       { hex: PANTRY_POP.tomato, tone: "red",     label: "Spicy" },

  // ── Diet ─────────────────────────────────────────────────────────────
  vegetarian:    { hex: "#10B981",       tone: "emerald", label: "Vegetarian" },
  "meal-prep":   { hex: "#14B8A6",       tone: "teal",    label: "Meal prep" },
  "dorm-friendly": { hex: "#22C55E",     tone: "emerald", label: "Dorm-friendly" },
};

/** Resolve a category key to its hex (with a sensible fallback). */
export function categoryHex(key: CategoryKey | string): string {
  return (
    (CATEGORY_COLORS as Record<string, { hex: string }>)[key]?.hex ??
    PANTRY_POP.basil
  );
}

/** Resolve a category key to its Tailwind tone name. */
export function categoryTone(key: CategoryKey | string): TailwindTone {
  return (
    (CATEGORY_COLORS as Record<string, { tone: TailwindTone }>)[key]?.tone ??
    "emerald"
  );
}
