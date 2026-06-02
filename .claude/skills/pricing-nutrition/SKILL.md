---
name: pricing-nutrition
description: Compute prices and macros accurately using the catalog + regional multipliers + user overrides. Never let the model invent prices.
when_to_use:
  - You display a $/serving, total cost, calories, or macros
  - You generate or save a CustomRecipe
  - You add a new ingredient or unit
  - A user reports prices look wrong
---

# Pricing & Nutrition

The two engines are the source of truth. UI must call them. Don't inline math.

## Engines

- **Pricing:** `src/lib/pricing/pricingEngine.ts` (`quoteIngredient`, `quoteRecipe`)
- **Recipe cost wrapper:** `src/lib/recipeScoring.ts` (`calculateCostPerServing`)
- **Nutrition:** `src/lib/nutritionEngine.ts` (`getIngredientNutrition`, `calculateRecipeMacros`, `bestEffortNutrition`, `isHighProtein`)
- **Region data:** `src/lib/pricing/regions.ts` (14 US regions, national avg = 1.0)
- **AI price cache:** `src/lib/pricing/aiPriceBook.ts`
- **User overrides + location:** `src/lib/pricing/locationStorage.ts`

## Pricing rules

### 1. Always go through `quoteIngredient`

Don't multiply `estimatedUnitCost` by quantity in a component. Call:

```ts
import { quoteIngredient } from "@/lib/pricing/pricingEngine";

const quote = quoteIngredient(ingredientId, quantity, location);
// → { totalCost, appliedUnitCost, source, confidence, regionLabel, ... }
```

The engine handles override → AI cache → catalog × regional multiplier in that order.

### 2. Prorate sauces / spices / condiments

A tablespoon of soy sauce is not $4.

In `src/data/ingredients.ts`, the `estimatedUnitCost` is **per unit** (per tbsp, per tsp, per clove, per slice) — NOT per package. When you add a new condiment:

- `unit: 'tbsp'` (or tsp, clove, etc.)
- `estimatedUnitCost: 0.04` (the per-tbsp cost — divide the package price by realistic uses)
- `commonPackageSize: '16 oz / ~32 tbsp'` (for reference only)

If a model returns a recipe whose total cost suspiciously matches a whole bottle of soy sauce, the catalog row is wrong — fix the row, not the recipe.

### 3. Cost-per-serving = total / servings

Use the helper:

```ts
import { calculateCostPerServing } from "@/lib/recipeScoring";
const cps = calculateCostPerServing(recipe);
```

Never write `recipe.totalCost / recipe.servings` inline.

### 4. AI-generated recipes get recomputed prices

After AI Chef returns a `CustomRecipe`:

1. Map each AI ingredient to a catalog ingredient (best effort) or treat as custom.
2. Sum `quoteIngredient(...)` for the matched rows.
3. For unmatched rows, use the AI's `estimatedCost` but mark `source: 'ai-estimate'` and `confidence: 'low'`.
4. Replace the model's `estimatedCostPerServing` with the recomputed value.

The model often lies. The catalog doesn't.

### 5. Pantry-aware pricing

If a recipe ingredient is already in the user's pantry, mark `userAlreadyHas: true` and exclude it from "missing items" cost on the recipe detail page. The total recipe cost still includes the ingredient (the user paid for it once), but the grocery-list dollar amount excludes it.

### 6. Confidence

Every `PriceQuote` carries `confidence`. The UI should show it for AI-estimate rows ("est." pill or "AI estimate" tooltip). Don't claim a $1.84/serving as fact when it's `confidence: 'low'`.

## Nutrition rules

### 1. Per-recipe macros are computed, not stored

The recipe `estimatedNutrition` field is the seed catalog's estimate. The runtime authoritative number comes from `calculateRecipeMacros(recipe)` which sums per-ingredient × quantity.

For UI display, use:

```ts
import { bestEffortNutrition } from "@/lib/nutritionEngine";
const { estimate, confidence } = bestEffortNutrition(recipe);
```

`bestEffortNutrition` returns the engine result when ingredient nutrition is available, otherwise the seed estimate.

### 2. High-protein filter

`isHighProtein(recipe)` returns `true` when protein ≥ 20g per serving. Used by the filter and by AI Chef's "higher protein" refinement.

### 3. Per-serving values

Always per serving in the UI. Never the whole recipe. If the recipe is 4 servings and totals 1600 cal, display 400 cal.

### 4. Don't render NaN

If `bestEffortNutrition` returns `null` (no data), the UI must show `—` or hide the row, never `NaN g protein`.

## Procedure when adding an ingredient

1. Add row to `src/data/ingredients.ts` with prorated `estimatedUnitCost`.
2. Add row to `src/data/ingredientNutrition.ts` with per-unit macros and a confidence (cite USDA if possible).
3. If used in seed recipes, make sure the recipe `RecipeIngredient.quantity` matches the new `unit`.

## Procedure when fixing a "this looks expensive" bug

1. Find the recipe. Read its `ingredients[]`.
2. For each ingredient, run `quoteIngredient(id, qty, location)` mentally — is the per-unit cost right?
3. Is the `unit` correct? (A common bug: `oz` of olive oil quoted as 1 oz of $10 olive oil instead of 1 tbsp.)
4. Is the `quantity` realistic? (A recipe needing "2 cups" of olive oil is rarely real.)
5. If a condiment is overpriced, fix the catalog row's per-unit cost. Don't patch around it.

## Files to inspect

- `src/lib/pricing/pricingEngine.ts`
- `src/lib/pricing/regions.ts`
- `src/lib/pricing/locationTypes.ts`
- `src/lib/pricing/locationStorage.ts`
- `src/lib/pricing/aiPriceBook.ts`
- `src/lib/nutritionEngine.ts`
- `src/lib/recipeScoring.ts`
- `src/data/ingredients.ts`
- `src/data/ingredientNutrition.ts`
- `src/components/pricing/IngredientPriceRow.tsx`
- `src/components/pricing/LocationSetup.tsx`
- `src/components/pricing/RecipeAIRepriceButton.tsx`

## Quality checklist

- [ ] No `recipe.totalCost / recipe.servings` inline math
- [ ] No `ingredient.estimatedUnitCost * 4` inline math (use `quoteIngredient`)
- [ ] AI-generated recipes get re-priced before save
- [ ] AI-generated recipes get re-mac'd before save
- [ ] Sauces / spices have per-tbsp/per-tsp catalog cost, not per-package
- [ ] No `NaN`, `Infinity`, or `undefined` in pricing or macro UI
- [ ] AI-estimate rows are visually labeled in the UI
- [ ] `pantry already has` rows excluded from grocery total, not recipe total
- [ ] New ingredients added to BOTH `ingredients.ts` and `ingredientNutrition.ts`

## Common mistakes

- Trusting the model's `estimatedCostPerServing` on a `CustomRecipe`
- Pricing 1 tbsp of soy sauce as a whole bottle
- Forgetting region multiplier on a new code path
- Hardcoding "$1.84/serving" in a marketing string (don't — read it from data)
- Displaying `NaN` instead of `—` when nutrition data is missing
