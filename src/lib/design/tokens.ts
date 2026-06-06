// Waivy design tokens — single source of truth for the palette,
// category colors, motion durations, and shadow tiers. Most consumers
// reach for these through Tailwind utility classes; this file documents
// the meaning behind each token and lets future code reference the
// names instead of inlining hex values.

/**
 * Pantry Pop palette — the canonical hex values for the warm, playful
 * food-app theme. Mirrors the CSS variables in `globals.css`. Use these
 * when you need a raw hex (canvas, inline SVG, computed color) — for
 * everything else prefer Tailwind utility classes so reduced-motion +
 * dark-mode hooks stay centralized.
 */
export const PANTRY_POP = {
  // Surfaces
  background: "#FFF8ED", // warm cream — body background
  surface: "#FFFFFF",
  surfaceSoft: "#FFF1D9", // soft card tint
  oat: "#F6E7CF",
  borderSoft: "#E8D8C4",

  // Text
  textMain: "#241A12", // espresso
  textMuted: "#6B5A4A", // warm gray

  // Primary action — basil green, with a deeper shadow for 3D depth.
  basil: "#2FBF71",
  basilShadow: "#16834A",

  // Food accents
  carrot: "#FF8A3D",
  butter: "#FFD166",
  tomato: "#EF4444",
  grape: "#7C5CFF",
  teal: "#20C7A5",
  sky: "#3BA7FF",
  pink: "#FF6B9E",
} as const;

export const PALETTE = {
  // Brand — basil green from Pantry Pop.
  brand: {
    50: "#e8faf0",
    100: "#cff5e1",
    300: "#7fdbab",
    500: PANTRY_POP.basil, // #2FBF71
    600: "#27a763",
    700: PANTRY_POP.basilShadow, // #16834A
    900: "#0d5a32",
  },
  surface: {
    page: PANTRY_POP.background,
    elevated: PANTRY_POP.surface,
    soft: PANTRY_POP.surfaceSoft,
    oat: PANTRY_POP.oat,
  },
  text: {
    primary: PANTRY_POP.textMain,
    secondary: PANTRY_POP.textMuted,
    muted: "#a39685",
    inverse: PANTRY_POP.surface,
  },
  border: {
    soft: PANTRY_POP.borderSoft,
  },
  accent: PANTRY_POP,
} as const;

/**
 * Category colors. These map to Tailwind tone names (sky, orange, etc.)
 * used by Badge / TagChip / SelectablePill / MacroCard so a category's
 * identity stays consistent everywhere it appears.
 *
 * Pantry Pop spec mapping (see docs/theme-research.md):
 *   AI Chef = grape    (#7C5CFF) → tailwind violet
 *   Pantry  = basil    (#2FBF71) → tailwind emerald
 *   Cheap   = butter   (#FFD166) → tailwind amber
 *   Nourish = carrot   (#FF8A3D) → tailwind orange
 *   Saved   = pink     (#FF6B9E) → tailwind rose
 *   Grocery = teal     (#20C7A5) → tailwind teal
 *   Explore = indigo   (#6366F1) → tailwind indigo
 */
export const CATEGORY_COLOR = {
  // Primary product surfaces
  "ai-chef": "violet",
  pantry: "emerald",
  cheap: "amber",
  nourish: "orange",
  saved: "rose",
  grocery: "teal",
  explore: "indigo",

  // Macros
  protein: "violet",
  carbs: "sky",
  fat: "amber",
  fiber: "emerald",
  water: "cyan",

  // Cooking method
  "air-fryer": "orange",
  microwave: "sky",
  "no-stove": "emerald",

  // Pantry / inventory states
  "use-soon": "amber",
  spicy: "red",

  // Diet
  vegetarian: "emerald",
  vegan: "emerald",
  "high-protein": "violet",
  "gluten-free": "amber",
  "dairy-free": "sky",
  "meal-prep": "teal",
  "dorm-friendly": "emerald",
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
    out: "cubic-bezier(0.16, 1, 0.3, 1)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  },
} as const;

// 3D button depth — how many pixels the raised face translates down on
// press. Kept small so taps still feel fast (≥6px and the button starts
// to feel mushy).
export const BUTTON_DEPTH_PX = 4;

export const RADIUS = {
  sm: "0.75rem", // 12px — small chips
  md: "1rem", // 16px — inputs
  lg: "1.25rem", // 20px — cards
  xl: "1.5rem", // 24px — section panels
  "2xl": "2rem", // 32px — hero blocks
  pill: "9999px",
} as const;
