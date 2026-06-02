---
name: recipe-app-domain
description: The Student Recipe Finder domain model — what a Recipe, Pantry, Ingredient, etc. actually is in this codebase. Read before touching anything that reads or writes recipe data.
when_to_use:
  - You are adding a field to Recipe or CustomRecipe
  - You are reading from pantry, grocery, or saved
  - You are building UI that shows ingredients, equipment, or macros
  - You're not sure if a feature already exists
---

# Recipe App Domain

> This is not just a recipe database. It is a student cooking assistant that uses pantry, budget, AI, pricing, nutrition, and grocery planning.

The model lives in `src/lib/types.ts`, `src/lib/customRecipeTypes.ts`, and `src/data/*`. The summary table is in [domain-model.md](./domain-model.md).

## Core concepts

### Pantry

What the user already owns. `PantryItem[]` in `AppStore`. Persisted to `localStorage` under `srf:pantry`.

- `ingredientId` — refers to `INGREDIENTS` from `src/data/ingredients.ts`.
- `useSoon: boolean` — user flag. Recipes that use these float to the top of the scorer.
- Quantities are tracked loosely (rough portion estimates, not strict measurements).
- "Custom" pantry items use `customIngredientStorage` — they're AI-recognized or hand-entered items that aren't in the seed catalog.

### Ingredient

Catalog item, `src/data/ingredients.ts`. Each has:

- `id`, `name`, `category` (grain | protein | vegetable | fruit | dairy | canned | condiment | spice | frozen | snack)
- `estimatedUnitCost` and `unit` (cup, tbsp, egg, oz, clove, slice, lb)
- `commonPackageSize`, `shelfLifeDays`, `tags`

Per-ingredient nutrition is in `src/data/ingredientNutrition.ts` (USDA-derived per-unit calories/macros + a confidence level).

### Recipe (seed)

`Recipe` type in `src/lib/types.ts`. Read-only catalog. Includes:

- Identity: `id`, `name`, `description`, `emoji`, `accentColor`
- Math: `servings`, `totalTimeMinutes`, `estimatedNutrition`
- Composition: `ingredients: RecipeIngredient[]`, `steps: string[]`
- Equipment: `equipment: Equipment[]` and the derived flags (`primaryCookingMethod`, `noStovetopRequired`, `airFryerTimeMinutes`, `microwaveTimeMinutes`, `crispinessLevel`)
- Filters: `dietTags`, `dormFriendly`, `mealPrepFriendly`, `tags`
- Help: `cheapTips`, `substitutions`, `detailedSteps[]`, `guidedCookingSteps[]`

There are ~235 seed recipes across `recipes.ts`, `airFryerRecipes.ts`, and `microwaveRecipes.ts`.

### Custom recipe

`CustomRecipe` in `src/lib/customRecipeTypes.ts`. A superset of `Recipe` used for:

- AI Chef generated recipes (`isAIGenerated: true`)
- User-created recipes from `/recipe-studio/new`

Stored in `localStorage` (`srf:custom-recipes`). Images stored as base64 (capped: 1.5 MB / image, 6 MB total, oldest-first eviction).

### Grocery list

`GroceryItem[]` in `AppStore`. Items keyed by ingredient. Comes from "missing items" on recipe detail pages, plus manual add. Persisted to `srf:grocery`.

### Saved

`string[]` of recipe IDs (covers both seed and custom). Persisted to `srf:saved`. Surfaced on `/saved` with tabs.

### Equipment

Enum: `microwave`, `stovetop`, `oven`, `rice-cooker`, `air-fryer`, `no-kitchen`.

The filter system at `/cheap-recipes` lets users pick "what I own" — recipes are only shown if their equipment is a subset of the user's tools (or marked `noStovetopRequired`).

### Cooking methods (derived)

- **Air fryer recipe** — `isAirFryerRecipe(r)` from `equipmentFilters.ts`
- **Microwave recipe** — `isMicrowaveRecipe(r)`
- **No-stove recipe** — `isNoStoveRecipe(r)`
- **Dorm-friendly** — `dormFriendly: true` on the recipe, typically combined with microwave/air-fryer/no-cook

### Use-soon flow

The flagship "reduce food waste" feature:

1. User taps "use soon" on a pantry item.
2. Scorer (`rankPantryRecipes` in `recipeScoring.ts`) boosts recipes that use that ingredient.
3. Card surfaces "Uses [ingredient] before it spoils" reason.

Don't break this. It's the differentiator from generic recipe sites.

## Cooking method specifics (matter to copy + filters)

- **Dorm-friendly** = microwave / air fryer / no-cook only. Often combined with shared kitchens.
- **Air fryer** = `air-fryer` equipment. Has `airFryerTemperatureF`, `airFryerTimeMinutes`, `crispinessLevel`.
- **Microwave** = `microwave` equipment. Wattage assumed 1000W; "microwave-safe bowl" warnings on detail page.
- **No-stove** = no `stovetop` in equipment. May still need oven/microwave/air-fryer.

## Spices, sauces, seasonings

Critical: a tablespoon of soy sauce is **not** the price of a whole bottle.

The `pricingEngine` prorates these. The catalog stores `estimatedUnitCost` per tbsp / tsp / clove / slice — never per whole package. When you add a new condiment, do the same. See `.claude/skills/pricing-nutrition/SKILL.md`.

## Recipe images

`src/data/recipeImages.ts`. Maps `recipeId → { src, alt, sourceName, sourceUrl, license, attributionRequired }`. Sources: Wikimedia, Unsplash, Pexels. Always provide `alt`.

If a recipe has no curated image, `<RecipeImage>` falls back to a gradient + emoji using `recipe.accentColor` and `recipe.emoji`. Both fields must always be set on a `Recipe`.

## Guided cooking

`detailedSteps[]` and `guidedCookingSteps[]` are optional but power the "Cook now" mode on the recipe detail page. Each step can carry timer minutes, heat level, taste/texture cues, safety notes. If you add a new recipe, fill these for the headline ones.

## Files to inspect

- `src/lib/types.ts`
- `src/lib/customRecipeTypes.ts`
- `src/lib/equipmentFilters.ts`
- `src/lib/recipeScoring.ts` (scorers, cost-per-serving)
- `src/data/ingredients.ts`, `ingredientNutrition.ts`
- `src/data/recipes.ts`, `airFryerRecipes.ts`, `microwaveRecipes.ts`
- `src/data/recipeImages.ts`
- `src/lib/AppStore.tsx`, `src/lib/storage.ts`
- [domain-model.md](./domain-model.md)

## Quality checklist when adding to the domain

- [ ] New ingredient has `unit`, `estimatedUnitCost` per unit (prorated, not per package), `category`, `shelfLifeDays`
- [ ] New ingredient added to `INGREDIENT_NUTRITION` with confidence
- [ ] New recipe has `emoji` AND `accentColor` (used by the image fallback)
- [ ] New recipe equipment + `noStovetopRequired` are consistent
- [ ] New recipe ingredients reference real `INGREDIENT.id`s (or use custom rows)
- [ ] `dietTags` are honest — don't tag vegetarian if there's bacon
- [ ] Custom recipe shape uses `CustomRecipe`, not raw `Recipe`
- [ ] No new `localStorage` key without an entry in `src/lib/storage.ts`

## Common mistakes

- Treating sauces as one-bottle cost (charges $4 for a tbsp of soy sauce)
- Adding a recipe without `accentColor` (the fallback image crashes)
- Hardcoding nutrition on the recipe instead of using `nutritionEngine`
- Forgetting the "use soon" boost when adding a new scorer
- Skipping the equipment filter check (recipe appears for users without the tool)
- Renaming a recipe ID and orphaning `srf:saved`
