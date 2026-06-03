/**
 * auditRecipeNutrition.ts
 *
 * Advisory nutrition audit. Walks every seed recipe and reports any whose
 * computed macros look implausible or whose confidence is low.
 *
 *   $ npx tsx scripts/auditRecipeNutrition.ts
 *
 * Does NOT fail the build.
 */

import { RECIPES } from "../src/data/recipes";
import { calculateRecipeMacros } from "../src/lib/nutritionEngine";

const PROTEIN_MAX = 120; // g/serving — anything higher is probably a bug
const CAL_MIN = 80;
const CAL_MAX = 1600;

let issues = 0;
let lowConfidence = 0;

console.log(`Auditing nutrition for ${RECIPES.length} recipes…\n`);

for (const recipe of RECIPES) {
  const macros = calculateRecipeMacros(recipe);
  const perServing = macros.perServing;
  const problems: string[] = [];

  for (const key of ["calories", "protein", "carbs", "fat"] as const) {
    const val = perServing[key];
    if (!Number.isFinite(val)) {
      problems.push(`per-serving.${key} is not a finite number (${val})`);
    } else if (val < 0) {
      problems.push(`per-serving.${key} is negative (${val})`);
    }
  }

  if (perServing.protein > PROTEIN_MAX) {
    problems.push(
      `per-serving.protein is ${perServing.protein}g — over ${PROTEIN_MAX}g threshold`,
    );
  }
  if (perServing.calories < CAL_MIN || perServing.calories > CAL_MAX) {
    problems.push(
      `per-serving.calories is ${perServing.calories} — outside ${CAL_MIN}-${CAL_MAX} range`,
    );
  }

  if (macros.confidence === "low") {
    lowConfidence += 1;
  }

  if (problems.length) {
    issues += 1;
    console.log(`• ${recipe.id} — ${recipe.name}`);
    for (const p of problems) console.log(`    - ${p}`);
  }
}

console.log(
  `\nDone. ${issues} recipe(s) with macro concerns. ${lowConfidence} recipe(s) at low confidence. (advisory)`,
);
