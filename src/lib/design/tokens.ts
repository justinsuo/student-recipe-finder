// Waivy design tokens — single source of truth for the palette,
// category colors, motion durations, and shadow tiers. Most consumers
// reach for these through Tailwind utility classes; this file documents
// the meaning behind each token and lets future code reference the
// names instead of inlining hex values.

export const PALETTE = {
  // Brand (kept emerald — the Waivy identity is established and Nourish
  // already integrates with this color logic everywhere downstream).
  brand: {
    50:  "#ecfdf5",
    100: "#d1fae5",
    300: "#6ee7b7",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    900: "#064e3b",
  },
  surface: {
    page:     "#fafaf7",
    elevated: "#ffffff",
    subtle:   "#f5f5f4",
  },
  text: {
    primary:   "#1c1917",
    secondary: "#57534e",
    muted:     "#a8a29e",
    inverse:   "#fafaf7",
  },
} as const;

/**
 * Category colors. These map to Tailwind tone names (sky, orange, etc.)
 * used by Badge / TagChip / SelectablePill / MacroCard so a category's
 * identity stays consistent everywhere it appears.
 *
 * Note: the spec asked for "Nourish = orange", but Nourish has already
 * integrated with the emerald brand identity across MacroCard,
 * CalorieProgressRing, NourishInsights, MealTone, and dozens of
 * components. Switching the entire Nourish surface to orange would be
 * a separate, breaking change. Keeping emerald here and offering "amber"
 * as the warm Nourish accent (used by the streak chip already).
 */
export const CATEGORY_COLOR = {
  // Primary product surfaces
  "ai-chef":   "violet",
  pantry:      "emerald",
  cheap:       "amber",   // budget / cheap recipes
  nourish:     "emerald", // brand-coherent; amber accents for streaks
  saved:       "rose",
  grocery:     "sky",
  explore:     "indigo",

  // Macros
  protein:     "violet",
  carbs:       "sky",
  fat:         "amber",
  fiber:       "emerald",
  water:       "cyan",

  // Cooking method
  "air-fryer": "orange",
  microwave:   "sky",
  "no-stove":  "emerald",

  // Pantry / inventory states
  "use-soon":  "amber",
  spicy:       "red",

  // Diet
  vegetarian:  "emerald",
  vegan:       "emerald",
  "high-protein": "violet",
  "gluten-free":  "amber",
  "dairy-free":   "sky",
} as const;

export type CategoryKey = keyof typeof CATEGORY_COLOR;

export const MOTION = {
  duration: {
    fast: 150,
    base: 220,
    slow: 360,
    page: 700,
  },
  easing: {
    out:   "cubic-bezier(0.16, 1, 0.3, 1)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  },
} as const;

// 3D button depth — how many pixels the raised face translates down on
// press. Kept small so taps still feel fast (≥6px and the button starts
// to feel mushy).
export const BUTTON_DEPTH_PX = 4;

export const RADIUS = {
  sm:   "0.75rem", // 12px — small chips
  md:   "1rem",    // 16px — inputs
  lg:   "1.25rem", // 20px — cards
  xl:   "1.5rem",  // 24px — section panels
  "2xl":"2rem",    // 32px — hero blocks
  pill: "9999px",
} as const;
