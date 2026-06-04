/**
 * Macro-friendly recipe library — 2,000 original dishes, each with three
 * complete, independently-followable variants:
 *   • original          — the standard recipe
 *   • calorie-friendly  — lower calorie density via smart substitutions
 *   • protein-friendly  — higher protein via lean-protein boosts
 *
 * Variants share a `variantGroup` slug and are linked by `variantType`.
 * Per-serving macros are pre-computed from INGREDIENT_NUTRITION (USDA-based)
 * and stored in `estimatedNutrition`.
 *
 * This array is intentionally separate from RECIPES so it does NOT generate
 * static /recipes/[id] pages. The Nourish feature's RecipesTab consumes both
 * RECIPES and MACRO_RECIPES for logging.
 */

import type { Recipe } from "@/lib/types";

// ── Batch imports (added as each batch is generated) ──────────────────────
import { BATCH_001 } from "./batch-001";
import { BATCH_002 } from "./batch-002";
import { BATCH_003 } from "./batch-003";
import { BATCH_004 } from "./batch-004";
import { BATCH_005 } from "./batch-005";
import { BATCH_006 } from "./batch-006";
import { BATCH_007 } from "./batch-007";
import { BATCH_008 } from "./batch-008";
import { BATCH_009 } from "./batch-009";
import { BATCH_010 } from "./batch-010";

export const MACRO_RECIPES: Recipe[] = [
  ...BATCH_001,
  ...BATCH_002,
  ...BATCH_003,
  ...BATCH_004,
  ...BATCH_005,
  ...BATCH_006,
  ...BATCH_007,
  ...BATCH_008,
  ...BATCH_009,
  ...BATCH_010,
];

export const MACRO_RECIPE_MAP = new Map(MACRO_RECIPES.map((r) => [r.id, r]));
