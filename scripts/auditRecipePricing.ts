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

import { RECIPES } from "../src/data/recipes";
import {
  calculateCostPerServing,
  ingredientCostBreakdown,
} from "../src/lib/recipeScoring";

const MIN_CPS = 0.1;
const MAX_CPS = 8;

let issues = 0;

console.log(`Auditing ${RECIPES.length} recipes…\n`);

for (const recipe of RECIPES) {
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
    const name = line.ingredient?.name ?? "(unknown ingredient)";
    if (!line.ingredient) {
      problems.push(`'${name}' not found in INGREDIENT_MAP`);
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

console.log(
  `\nDone. ${issues} recipe(s) with pricing concerns. (advisory; build still passes)`,
);
