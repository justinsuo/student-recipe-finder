/**
 * auditRecipePricing.ts
 *
 * Advisory pricing audit. Walks every seed recipe, computes cost-per-serving
 * via the real engine, and reports outliers / suspicious rows.
 *
 *   $ npx tsx scripts/auditRecipePricing.ts
 *
 * Does NOT fail the build — it surfaces things a human should eyeball.
 *
 * Thresholds:
 *   - cps < $0.10  → unrealistically cheap, probably missing ingredient cost
 *   - cps > $8     → unrealistically expensive for a "student recipe"
 *   - any ingredient cost < $0.005 → likely a catalog miss
 */

import { CATALOG_RECIPES } from "../src/data/recipes";
import {
  calculateCostPerServing,
  ingredientCostBreakdown,
} from "../src/lib/recipeScoring";

const MIN_CPS = 0.1;
const MAX_CPS = 8;

let issues = 0;
const missingIngredientIds = new Set<string>();

console.log(`Auditing ${CATALOG_RECIPES.length} catalog recipes…\n`);

for (const recipe of CATALOG_RECIPES) {
  const cps = calculateCostPerServing(recipe);
  const breakdown = ingredientCostBreakdown(recipe);

  const problems: string[] = [];

  if (!Number.isFinite(cps)) {
    problems.push(`cost-per-serving is not a finite number (${cps})`);
  } else if (cps < MIN_CPS) {
    problems.push(`cost-per-serving suspiciously low: $${cps.toFixed(3)}`);
  } else if (cps > MAX_CPS) {
    problems.push(`cost-per-serving suspiciously high: $${cps.toFixed(2)}`);
  }

  for (const line of breakdown) {
    const ingredientId = recipe.ingredients[breakdown.indexOf(line)]?.ingredientId ?? "?";
    const name = line.ingredient?.name ?? `(unknown: ${ingredientId})`;
    if (!line.ingredient) {
      problems.push(`ingredientId '${ingredientId}' not found in INGREDIENT_MAP`);
      missingIngredientIds.add(ingredientId);
      continue;
    }
    if (!Number.isFinite(line.cost)) {
      problems.push(`'${name}' has non-finite cost`);
      continue;
    }
    if (line.cost > 0 && line.cost < 0.005) {
      problems.push(
        `'${name}' costs $${line.cost.toFixed(4)} — too low?`,
      );
    }
  }

  if (problems.length) {
    issues += 1;
    console.log(`• ${recipe.id} — ${recipe.name}`);
    for (const p of problems) console.log(`    - ${p}`);
  }
}

if (missingIngredientIds.size > 0) {
  console.log(`\nMissing ingredient IDs (${missingIngredientIds.size} unique):`);
  for (const id of [...missingIngredientIds].sort()) console.log(`  - ${id}`);
}

console.log(
  `\nDone. ${issues} recipe(s) with pricing concerns. (advisory; build still passes)`,
);
