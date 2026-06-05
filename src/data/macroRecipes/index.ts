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
import { BATCH_011 } from "./batch-011";
import { BATCH_012 } from "./batch-012";
import { BATCH_013 } from "./batch-013";
import { BATCH_014 } from "./batch-014";
import { BATCH_015 } from "./batch-015";
import { BATCH_016 } from "./batch-016";
import { BATCH_017 } from "./batch-017";
import { BATCH_018 } from "./batch-018";
import { BATCH_019 } from "./batch-019";
import { BATCH_020 } from "./batch-020";
import { BATCH_021 } from "./batch-021";
import { BATCH_022 } from "./batch-022";
import { BATCH_023 } from "./batch-023";
import { BATCH_024 } from "./batch-024";
import { BATCH_025 } from "./batch-025";
import { BATCH_026 } from "./batch-026";
import { BATCH_027 } from "./batch-027";
import { BATCH_028 } from "./batch-028";
import { BATCH_029 } from "./batch-029";
import { BATCH_030 } from "./batch-030";
import { BATCH_031 } from "./batch-031";
import { BATCH_032 } from "./batch-032";
import { BATCH_033 } from "./batch-033";
import { BATCH_034 } from "./batch-034";
import { BATCH_035 } from "./batch-035";
import { BATCH_036 } from "./batch-036";
import { BATCH_037 } from "./batch-037";
import { BATCH_038 } from "./batch-038";
import { BATCH_039 } from "./batch-039";
import { BATCH_040 } from "./batch-040";
import { BATCH_041 } from "./batch-041";
import { BATCH_042 } from "./batch-042";
import { BATCH_043 } from "./batch-043";
import { BATCH_044 } from "./batch-044";
import { BATCH_045 } from "./batch-045";
import { BATCH_046 } from "./batch-046";
import { BATCH_047 } from "./batch-047";
import { BATCH_048 } from "./batch-048";
import { BATCH_049 } from "./batch-049";
import { BATCH_050 } from "./batch-050";
import { BATCH_051 } from "./batch-051";
import { BATCH_052 } from "./batch-052";
import { BATCH_053 } from "./batch-053";
import { BATCH_054 } from "./batch-054";
import { BATCH_055 } from "./batch-055";
import { BATCH_056 } from "./batch-056";
import { BATCH_057 } from "./batch-057";
import { BATCH_058 } from "./batch-058";
import { BATCH_059 } from "./batch-059";
import { BATCH_060 } from "./batch-060";
import { BATCH_061 } from "./batch-061";
import { BATCH_062 } from "./batch-062";
import { BATCH_063 } from "./batch-063";
import { BATCH_064 } from "./batch-064";
import { BATCH_065 } from "./batch-065";
import { BATCH_066 } from "./batch-066";
import { BATCH_067 } from "./batch-067";
import { BATCH_068 } from "./batch-068";
import { BATCH_069 } from "./batch-069";
import { BATCH_070 } from "./batch-070";
import { BATCH_071 } from "./batch-071";
import { BATCH_072 } from "./batch-072";

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
  ...BATCH_011,
  ...BATCH_012,
  ...BATCH_013,
  ...BATCH_014,
  ...BATCH_015,
  ...BATCH_016,
  ...BATCH_017,
  ...BATCH_018,
  ...BATCH_019,
  ...BATCH_020,
  ...BATCH_021,
  ...BATCH_022,
  ...BATCH_023,
  ...BATCH_024,
  ...BATCH_025,
  ...BATCH_026,
  ...BATCH_027,
  ...BATCH_028,
  ...BATCH_029,
  ...BATCH_030,
  ...BATCH_031,
  ...BATCH_032,
  ...BATCH_033,
  ...BATCH_034,
  ...BATCH_035,
  ...BATCH_036,
  ...BATCH_037,
  ...BATCH_038,
  ...BATCH_039,
  ...BATCH_040,
  ...BATCH_041,
  ...BATCH_042,
  ...BATCH_043,
  ...BATCH_044,
  ...BATCH_045,
  ...BATCH_046,
  ...BATCH_047,
  ...BATCH_048,
  ...BATCH_049,
  ...BATCH_050,
  ...BATCH_051,
  ...BATCH_052,
  ...BATCH_053,
  ...BATCH_054,
  ...BATCH_055,
  ...BATCH_056,
  ...BATCH_057,
  ...BATCH_058,
  ...BATCH_059,
  ...BATCH_060,
  ...BATCH_061,
  ...BATCH_062,
  ...BATCH_063,
  ...BATCH_064,
  ...BATCH_065,
  ...BATCH_066,
  ...BATCH_067,
  ...BATCH_068,
  ...BATCH_069,
  ...BATCH_070,
  ...BATCH_071,
  ...BATCH_072,
];

export const MACRO_RECIPE_MAP = new Map(MACRO_RECIPES.map((r) => [r.id, r]));
