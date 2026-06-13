/**
 * Verify the on-device AI Chef generator the mobile app uses (no backend).
 * Run: npx tsx scripts/selftest-localchef.ts
 */
import { generateOptionsLocal, refineLocal } from "../mobile/src/lib/localChef";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, d = "") => {
  console.log((c ? "  ✓ " : "  ✗ ") + n + (d ? "  — " + d : ""));
  if (c) { pass++; } else { fail++; }
};

console.log("\n── On-device AI Chef ──");
const input = {
  pantryIds: ["eggs", "rice", "onion", "garlic", "soy-sauce", "chicken-breast", "spinach"],
  budgetPerServing: 5,
  servings: 1,
  equipment: ["stovetop", "microwave"],
  dietTags: [],
  notes: "something high protein and quick",
};
const set = generateOptionsLocal(input);
check("returns 4 options", set.options.length === 4, set.options.map((o) => o.optionLabel).join(", "));
check("exactly one default", set.options.filter((o) => o.selectedByDefault).length === 1);
check("options are distinct recipes", new Set(set.options.map((o) => o.recipe.name)).size === set.options.length);
for (const o of set.options) {
  const r = o.recipe;
  if (!(r.estimatedCostPerServing > 0)) check(`${o.optionLabel}: cost > 0`, false, `$${r.estimatedCostPerServing}`);
  if (!(r.estimatedNutrition.calories > 0)) check(`${o.optionLabel}: calories > 0`, false);
  if (!(r.ingredients.length > 0 && r.steps.length > 0)) check(`${o.optionLabel}: has ingredients+steps`, false);
}
const main = set.options[0].recipe;
check("best-match has real cost", main.estimatedCostPerServing > 0, `$${main.estimatedCostPerServing}/serving`);
check("best-match has real macros (never 0)", main.estimatedNutrition.calories > 0 && main.estimatedNutrition.protein >= 0, `${main.estimatedNutrition.calories} cal, ${main.estimatedNutrition.protein}g protein`);
check("ingredients flag pantry items (userAlreadyHas)", main.ingredients.some((i) => i.userAlreadyHas));
check("missing ingredients computed", Array.isArray(main.missingIngredients));

const cheaper = refineLocal(main, "make it cheaper", input);
check("refine 'cheaper' returns a valid recipe", cheaper.estimatedCostPerServing > 0 && cheaper.steps.length > 0, `${cheaper.name} @ $${cheaper.estimatedCostPerServing}`);
const protein = refineLocal(main, "higher protein", input);
check("refine 'higher protein' returns a recipe", protein.estimatedNutrition.protein > 0, `${protein.name} ${protein.estimatedNutrition.protein}g`);

// No-pantry path (cold start)
const cold = generateOptionsLocal({ pantryIds: [], budgetPerServing: 3, servings: 2, equipment: [], dietTags: [], notes: "" });
check("works with empty pantry (cheap picks)", cold.options.length === 4 && cold.options[0].recipe.estimatedCostPerServing > 0);

console.log(`\n── RESULT: ${pass} passed, ${fail} failed ──\n`);
process.exit(fail === 0 ? 0 : 1);
