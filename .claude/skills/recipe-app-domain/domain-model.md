# Domain model — at-a-glance

A compact summary of every shape an agent will likely touch.

## Recipe (`src/lib/types.ts`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable; saved/grocery lists key off it |
| `name` | string | Headline |
| `description` | string | 1-2 sentences |
| `mealType` | `breakfast \| lunch \| dinner \| snack` | |
| `servings` | number | Used for cost/serving |
| `ingredients` | `RecipeIngredient[]` | `{ ingredientId, quantity, optional?, note? }` |
| `steps` | `string[]` | Plain steps |
| `detailedSteps` | `DetailedStep[]?` | Optional: timer, heat, cues, safety |
| `guidedCookingSteps` | `GuidedStep[]?` | Optional: "cook now" mode |
| `totalTimeMinutes` | number | |
| `prepTimeMinutes`, `cookTimeMinutes` | number? | Optional split |
| `difficulty` | `easy \| medium \| hard` | |
| `equipment` | `Equipment[]` | enum below |
| `dietTags` | `DietTag[]` | `vegetarian \| vegan \| high-protein \| gluten-free \| dairy-free` |
| `cheapTips` | `string[]` | Money-saving hints |
| `substitutions` | `Substitution[]` | `{ forIngredientId, swap, savings }` |
| `estimatedNutrition` | `NutritionEstimate` | `{ calories, protein, carbs, fat, fiber }` per serving |
| `emoji` | string | Used in fallback image |
| `accentColor` | string | Tailwind `bg-…` class for the fallback gradient |
| `primaryCookingMethod` | `'stovetop' \| 'oven' \| 'microwave' \| 'air-fryer' \| 'no-cook' \| 'rice-cooker'` | |
| `dormFriendly` | boolean? | |
| `mealPrepFriendly` | boolean? | |
| `allergyTags` | string[]? | |
| `airFryerTemperatureF`, `airFryerTimeMinutes` | number? | |
| `microwaveTimeMinutes` | number? | |
| `crispinessLevel` | `1 \| 2 \| 3`? | |
| `tags` | string[]? | UI display tags |

## Equipment enum

```
microwave | stovetop | oven | rice-cooker | air-fryer | no-kitchen
```

## DietTag enum

```
vegetarian | vegan | high-protein | gluten-free | dairy-free
```

## Ingredient (`src/data/ingredients.ts`)

| Field | Type |
| --- | --- |
| `id` | string |
| `name` | string |
| `category` | `grain \| protein \| vegetable \| fruit \| dairy \| canned \| condiment \| spice \| frozen \| snack` |
| `unit` | `cup \| tbsp \| tsp \| egg \| oz \| lb \| clove \| slice \| each` |
| `estimatedUnitCost` | number (USD, per unit — prorated for sauces/spices) |
| `commonPackageSize` | string |
| `shelfLifeDays` | number |
| `tags` | string[] |

## Nutrition per ingredient (`src/data/ingredientNutrition.ts`)

`INGREDIENT_NUTRITION: Record<ingredientId, NutritionPerUnit>`

`NutritionPerUnit = { calories, protein, carbs, fat, fiber, confidence: 'high' | 'medium' | 'low' }`

## CustomRecipe (`src/lib/customRecipeTypes.ts`)

Superset of `Recipe`. Extra fields:

- `isAIGenerated: boolean`
- `cuisineStyle: string`
- `estimatedTotalCost`, `estimatedCostPerServing` (precomputed at gen time)
- `image: { src? | b64? | isFallback, isAIGenerated }`
- `ingredients: CustomRecipeIngredient[]` (each has `name`, `quantity`, `unit`, `estimatedCost`, `userAlreadyHas`, `optional`, `category`)
- Storage: `srf:custom-recipes` in localStorage

## Pantry (`AppStore`)

`PantryItem = { ingredientId, useSoon: boolean, addedAt: number, customId?, quantityNote? }`

Storage key: `srf:pantry`.

## Grocery (`AppStore`)

`GroceryItem = { id, name, quantity, unit, category, checked, estimatedCost, sourceRecipeId? }`

Storage key: `srf:grocery`.

## Saved (`AppStore`)

`string[]` — recipe IDs (seed or custom).

Storage key: `srf:saved`.

## Pricing — `PriceQuote` (`src/lib/pricing/locationTypes.ts`)

```
{
  ingredientName, baseUnitCost, appliedUnitCost, quantity, unit,
  totalCost, regionLabel, multiplier,
  source: 'override' | 'ai-estimate' | 'catalog',
  confidence: 'high' | 'medium' | 'low'
}
```

## Search hit (`src/lib/search/recipeSearch.ts`)

```
SearchHit = { item: Recipe, score: number, reasons: Array<{ field, value }> }
```
