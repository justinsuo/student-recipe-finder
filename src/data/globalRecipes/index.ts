// Global recipe library — merges all regional batches into one array.
// Each batch file is added incrementally; this index re-exports the combined list.

import { EAST_ASIA_RECIPES } from "./eastAsia";

export const GLOBAL_RECIPES = [...EAST_ASIA_RECIPES];
