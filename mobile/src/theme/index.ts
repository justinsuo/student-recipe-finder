/**
 * Waivy mobile theme — the "Pantry Pop" design system, native edition.
 *
 * Mirrors the web app's palette (src/lib/design/tokens.ts) so the two products
 * feel like one brand, but expressed as React Native style primitives (raw hex,
 * numeric spacing/radius, shadow objects) instead of Tailwind classes.
 */

export const colors = {
  // Surfaces
  bg: "#FFF8ED", // warm cream — app background
  surface: "#FFFFFF",
  surfaceSoft: "#FFF1D9",
  oat: "#F6E7CF",
  borderSoft: "#E8D8C4",
  border: "#EADBC7",

  // Text
  text: "#241A12", // espresso
  textMuted: "#6B5A4A", // warm gray
  textFaint: "#A3937F",
  inverse: "#FFFFFF",

  // Primary — basil green with a deeper 3D shadow
  basil: "#2FBF71",
  basilShadow: "#16834A",
  basilSoft: "#E8FAF0",

  // Food accents
  carrot: "#FF8A3D",
  carrotShadow: "#C75F18",
  butter: "#FFD166",
  butterShadow: "#C99A23",
  tomato: "#EF4444",
  tomatoShadow: "#B91C1C",
  grape: "#7C5CFF",
  grapeShadow: "#4F38C7",
  teal: "#20C7A5",
  tealShadow: "#0E8E76",
  sky: "#3BA7FF",
  skyShadow: "#1E72C2",
  pink: "#FF6B9E",
  pinkShadow: "#C73E70",

  // Soft tints (12% backgrounds for chips / pills)
  basilTint: "#E3F7EC",
  carrotTint: "#FFEAD9",
  butterTint: "#FFF3D2",
  grapeTint: "#ECE6FF",
  tealTint: "#D8F6EF",
  skyTint: "#DCEEFF",
  pinkTint: "#FFE2EC",
  tomatoTint: "#FCE3E3",

  scrim: "rgba(36,26,18,0.45)",
} as const;

/** Maps a product/category to its accent + soft tint + shadow + on-color. */
export const accent = {
  "ai-chef": { main: colors.grape, tint: colors.grapeTint, shadow: colors.grapeShadow, on: "#FFFFFF" },
  pantry: { main: colors.basil, tint: colors.basilTint, shadow: colors.basilShadow, on: "#FFFFFF" },
  nourish: { main: colors.carrot, tint: colors.carrotTint, shadow: colors.carrotShadow, on: "#FFFFFF" },
  grocery: { main: colors.teal, tint: colors.tealTint, shadow: colors.tealShadow, on: "#FFFFFF" },
  cheap: { main: colors.butter, tint: colors.butterTint, shadow: colors.butterShadow, on: "#241A12" },
  saved: { main: colors.pink, tint: colors.pinkTint, shadow: colors.pinkShadow, on: "#FFFFFF" },
  explore: { main: colors.sky, tint: colors.skyTint, shadow: colors.skyShadow, on: "#FFFFFF" },
  protein: { main: colors.grape, tint: colors.grapeTint, shadow: colors.grapeShadow, on: "#FFFFFF" },
  carbs: { main: colors.sky, tint: colors.skyTint, shadow: colors.skyShadow, on: "#FFFFFF" },
  fat: { main: colors.butter, tint: colors.butterTint, shadow: colors.butterShadow, on: "#241A12" },
  fiber: { main: colors.basil, tint: colors.basilTint, shadow: colors.basilShadow, on: "#FFFFFF" },
  water: { main: colors.sky, tint: colors.skyTint, shadow: colors.skyShadow, on: "#FFFFFF" },
} as const;

export type AccentKey = keyof typeof accent;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 32,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const font = {
  // System rounded gives an SF-Rounded look on iOS — friendly + food-app warm.
  // Falls back to system on Android.
  display: "System",
  body: "System",
  sizes: {
    xs: 12,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    xxxl: 38,
  },
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    heavy: "800",
  },
} as const;

/** iOS-style soft shadow tiers. */
export const shadow = {
  sm: {
    shadowColor: "#241A12",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: "#241A12",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: "#241A12",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

/** How far a 3D button face presses down. */
export const BUTTON_DEPTH = 4;

export const theme = { colors, accent, radius, space, font, shadow, BUTTON_DEPTH };
export default theme;
