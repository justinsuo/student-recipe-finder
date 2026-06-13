# Subsystem 03 — Ingredients + Nutrition Data & Engine

Engineering brief for porting the Waivy nutrition subsystem from the Next.js web app to a shared package consumed by an Expo React Native iPhone app.

## Files covered

| File | Role |
| --- | --- |
| `src/data/ingredients.ts` | Catalog of 255 ingredients (id, name, category, cost, unit, package size, shelf life, tags). Also exports `INGREDIENT_MAP`, `CATEGORY_LABEL`, `QUICK_ADD_STAPLES`. |
| `src/data/ingredientNutrition.ts` | 255 per-unit nutrition records keyed by ingredient id. Exports `INGREDIENT_NUTRITION` + `NutritionPerUnit` type. |
| `src/data/pantryPresets.ts` | 8 curated pantry starter packs (id, name, emoji, description, ingredient id list). Exports `PANTRY_PRESETS` + `PantryPreset` type. |
| `src/lib/nutritionEngine.ts` | Deterministic macro engine: per-ingredient → recipe totals → per-serving, plus free-form (AI) name-matched nutrition. |

Supporting type source: `src/lib/types.ts` (`Ingredient`, `RecipeIngredient`, `NutritionEstimate`, `Recipe`, `IngredientCategory`).

**Headline finding: this entire subsystem is pure TypeScript + data. There are ZERO browser/Next/DOM/network/localStorage couplings.** It is portable to React Native unchanged. The only port concern is the `@/` path alias and whatever the consuming UI does with the outputs.

---

## 1. Exported symbols (signatures / types)

### `src/lib/types.ts` (shared types this subsystem depends on)

```ts
export type IngredientCategory =
  | "grain" | "protein" | "vegetable" | "fruit" | "dairy"
  | "canned" | "condiment" | "spice" | "frozen" | "snack";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  estimatedUnitCost: number; // cost per `unit`
  unit: string;              // "cup", "tbsp", "egg", "oz", "clove", "slice"
  commonPackageSize?: string;
  shelfLifeDays?: number;
  tags?: string[];
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;   // in `unit` matching the ingredient's unit
  optional?: boolean;
  note?: string;
}

export interface NutritionEstimate {
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
  fiber?: number;  // grams (optional)
}
// `Recipe` (large interface) — consumed by calculateRecipeMacros / bestEffortNutrition.
// Only these fields are read by this subsystem: ingredients: RecipeIngredient[],
// servings: number, estimatedNutrition: NutritionEstimate.
```

### `src/data/ingredients.ts`

```ts
export const INGREDIENTS: Ingredient[];                 // 255 rows
export const INGREDIENT_MAP: Map<string, Ingredient>;   // = new Map(INGREDIENTS.map(i => [i.id, i]))
export const CATEGORY_LABEL: Record<string, string>;    // category slug -> display label
export const QUICK_ADD_STAPLES: string[];               // 17 ingredient ids (UI quick-add chips)
```

### `src/data/ingredientNutrition.ts`

```ts
export interface NutritionPerUnit {
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
  fiber?: number;  // grams
  confidence: "high" | "medium" | "low";
}
export const INGREDIENT_NUTRITION: Record<string, NutritionPerUnit>; // 255 entries keyed by ingredient id
```

### `src/data/pantryPresets.ts`

```ts
export interface PantryPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  ingredientIds: string[];
}
export const PANTRY_PRESETS: PantryPreset[];  // 8 presets
```

### `src/lib/nutritionEngine.ts`

```ts
export interface IngredientMacroLine {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  confidence: "high" | "medium" | "low" | "unknown";
}

export interface RecipeMacros {
  perServing: NutritionEstimate;
  totalRecipe: NutritionEstimate;
  servings: number;
  confidence: "high" | "medium" | "low";
  breakdown: IngredientMacroLine[];
  missingIngredientIds: string[]; // ids with no nutrition entry — audit
}

export function getIngredientNutrition(ingredientId: string): NutritionPerUnit | undefined;

export function calculateIngredientMacros(
  ingredientId: string,
  ingredientName: string,
  quantity: number,
  unit: string,
): IngredientMacroLine;

export function calculateRecipeMacros(recipe: Recipe): RecipeMacros;

export function bestEffortNutrition(recipe: Recipe): {
  estimate: NutritionEstimate;
  source: "calculated" | "hand-entered";
  confidence: "high" | "medium" | "low";
  breakdown?: IngredientMacroLine[];
};

export function isHighProtein(n: NutritionEstimate): boolean;          // protein >= 20

export function proteinPerDollar(n: NutritionEstimate, costPerServing: number): number;

export function matchIngredientByName(rawName: string): string | undefined; // catalog id or undefined

export function calculateNutritionForFreeForm(
  ingredients: { name: string; quantity: number; unit?: string }[],
  servings: number,
): {
  perServing: NutritionEstimate;
  totalRecipe: NutritionEstimate;
  matchedCount: number;
  totalCount: number;
  confidence: "high" | "medium" | "low";
};
```

Non-exported internals: `pickWorstConfidence(...)`, `round(n, decimals=0)`, and the local `interface FreeFormIngredient { name: string; quantity: number; unit?: string }`.

---

## 2. Exact data shapes (real interfaces)

`Ingredient`, `RecipeIngredient`, `NutritionEstimate`, `NutritionPerUnit`, `PantryPreset`, `IngredientMacroLine`, `RecipeMacros` are all reproduced verbatim in Section 1. Key invariants:

- **Unit coupling is implicit and load-bearing.** `INGREDIENT_NUTRITION[id]` macros are expressed *per 1 of the `unit`* declared on the matching `INGREDIENTS` row (e.g. `rice.unit="cup"` → nutrition is for 1 cup cooked rice; `eggs.unit="egg"` → 1 large egg; `soy-sauce.unit="tbsp"` → 1 tbsp). The engine does **NO unit conversion** — it multiplies macros × quantity directly. Quantity must already be in the catalog unit.
- `confidence` on `NutritionPerUnit` is `"high" | "medium" | "low"`. The engine adds a fourth state `"unknown"` on `IngredientMacroLine` for ids with no nutrition entry.
- Both `INGREDIENTS` (255 rows) and `INGREDIENT_NUTRITION` (255 keys) are keyed by the same stable ids. A handful of nutrition keys exist for ids referenced by recipes but **not** present in `INGREDIENTS` (e.g. `oyster-sauce` IS in both; but `marinara`, `tomato-paste`, `evoo`, `ghee`, `gochujang`, `msg`, etc. — verify per id). IDs are stable and must never be renamed (saved/grocery lists key off them).
- Example catalog row: `{ id: "rice", name: "Rice", category: "grain", estimatedUnitCost: 0.15, unit: "cup", commonPackageSize: "5 lb bag (~$5)", shelfLifeDays: 365, tags: ["staple", "cheap"] }`
- Example nutrition row: `rice: { calories: 205, protein: 4.3, carbs: 45, fat: 0.4, fiber: 0.6, confidence: "high" }`

---

## 3. The full nutrition pipeline (ingredient+quantity → per-serving macros)

```
RecipeIngredient { ingredientId, quantity }
        │
        ▼  lookup:  INGREDIENT_NUTRITION[ingredientId]  (Record lookup, O(1))
NutritionPerUnit | undefined
        │           ├─ undefined → IngredientMacroLine zeros, confidence:"unknown", id pushed to missing[]
        ▼
PER-INGREDIENT (calculateIngredientMacros):
   mult = Number.isFinite(quantity) ? quantity : 0
   calories = round(nut.calories * mult)        // 0 decimals
   protein  = round(nut.protein  * mult, 1)     // 1 decimal
   carbs    = round(nut.carbs    * mult, 1)
   fat      = round(nut.fat      * mult, 1)
   fiber    = nut.fiber === undefined ? undefined : round(nut.fiber * mult, 1)
        │
        ▼  Σ over recipe.ingredients  (optional ingredients ARE included by default)
RECIPE TOTALS (calculateRecipeMacros):
   totalRecipe = { calories: round(Σcal), protein: round(Σprot,1), carbs, fat, fiber? }
   fiber only included if at least one ingredient had fiber (hasAnyFiber)
   confidence = worst-of via pickWorstConfidence (unknown/low→low; medium downgrades high→medium)
        │
        ▼  divide by servings (recipe.servings || 1)
PER-SERVING:
   perServing.calories = round(total.calories / servings)
   perServing.protein  = round(total.protein / servings, 1)   // …etc.
```

**`round(n, decimals=0)`** — `Math.round(n * 10^d) / 10^d`; returns `0` for non-finite input. Calories use 0 decimals; protein/carbs/fat/fiber use 1 decimal.

**`pickWorstConfidence(current, next)`** — if `next` is `"unknown"`/`"low"` → `"low"`; if `next==="medium"` and `current==="high"` → `"medium"`; else keep `current`. Starts at `"high"`.

**`bestEffortNutrition(recipe)` decision logic (this is what the UI should call for display):**
1. `recipe.ingredients.length === 0` → return `recipe.estimatedNutrition`, `source:"hand-entered"`, `confidence:"medium"` (short-circuit so authoring a custom recipe doesn't show zeros).
2. Else compute `calculateRecipeMacros`. If `missingIngredientIds.length / ingredients.length > 0.5` → fall back to `recipe.estimatedNutrition`, `source:"hand-entered"`.
3. Else return `calc.perServing`, `source:"calculated"`, plus `breakdown`.

**Free-form path (`calculateNutritionForFreeForm`)** — used for AI Chef recipes given as free-text ingredient names:
- Each `{ name, quantity }` → `matchIngredientByName(name)` → catalog id → `INGREDIENT_NUTRITION[id]`. Unmatched names contribute zero and are skipped.
- Same multiply/sum/divide math. Confidence downgraded by match ratio: `<0.6 → "low"`; `<0.85 (and currently high) → "medium"`.

**`matchIngredientByName(rawName)`** — normalizes (`toLowerCase`, strip `()`, strip non-`[a-z0-9\s-]`, trim) then scores every `INGREDIENTS` row: exact name=100; substring either direction = matched-string length; else word-overlap ×3. Returns best id if score ≥ 3, else `undefined`. Pure string logic, RN-safe.

---

## 4. localStorage keys

**None.** This subsystem touches no storage. (For context, persistence lives elsewhere in the app under the legacy `srf:` prefix: `srf:pantry`, `srf:grocery`, `srf:saved`, `srf:custom-recipes`, `srf:location`. Pantry presets feed `srf:pantry` writes, but that write happens in UI/store code outside these files. The mobile app must replicate those keys via AsyncStorage when it ports the pantry/store subsystem — out of scope here, but `PANTRY_PRESETS[].ingredientIds` is the payload that gets written into the pantry.)

---

## 5. Network / request-response contracts

**None.** No `fetch`, no URLs, no API calls anywhere in these four files. All data is static, bundled at build time. (`calculateNutritionForFreeForm` is designed to consume the shape AI Chef returns, but the network call that produces that shape lives in `src/lib/anthropic.ts` / `workerClient.ts`, not here.)

---

## 6. Browser / Next-only couplings

**None found.** Confirmed by grep for `window`, `localStorage`, `document`, `process.env`, `'use client'`, `next/*`, `fetch(`, `navigator`, `FileReader`, `Blob` across all four files → `NO_BROWSER_COUPLINGS_FOUND`.

Specifics:
- No `'use client'` directive (these are plain modules, not React components).
- No `process.env.NEXT_PUBLIC_*`.
- No DOM, no `window`, no `localStorage`.
- No `next/image` / `next/link`.
- Uses only `Number`, `Math`, `Set`, string methods, regex, `Record`, `Map` — all standard JS available in Hermes (RN engine).

**The single mechanical adaptation: the `@/` path alias.**
```ts
import type { Recipe, NutritionEstimate } from "@/lib/types";
import { INGREDIENT_NUTRITION, type NutritionPerUnit } from "@/data/ingredientNutrition";
import { INGREDIENTS } from "@/data/ingredients";
```
`@/` maps to `src/` via `tsconfig.json` paths in Next. In the shared package these become package-relative imports (e.g. `../data/ingredients`) or a configured alias in the Metro/Babel config + the package's own `tsconfig`. No code change beyond import resolution.

**Minor: bundle size.** The two 255-row data files are ~50KB of TS source combined. Fine to bundle in RN; no lazy-loading needed.

---

## 7. RN port plan

**Moves into the shared package UNCHANGED (no platform adapter):**
- `src/data/ingredients.ts` → shared. Pure data + `Map`/`Record` derivations.
- `src/data/ingredientNutrition.ts` → shared. Pure data + `NutritionPerUnit` type.
- `src/data/pantryPresets.ts` → shared. Pure data.
- `src/lib/nutritionEngine.ts` → shared. Pure functions, deterministic, no I/O. This is the crown jewel — both web and mobile import the identical engine so macros never diverge between platforms.
- The relevant types from `src/lib/types.ts` (`Ingredient`, `RecipeIngredient`, `NutritionEstimate`, `IngredientCategory`, plus the parts of `Recipe` the engine reads).

**Needs a thin platform adapter:** none for this subsystem. The only build-time concern is path-alias resolution (`@/` → relative or shared-package alias) and ensuring the shared `tsconfig`/Metro config resolves `@/data/*` and `@/lib/*`. Recommend extracting `types.ts` into the shared package as the canonical source both apps re-export.

**Must be rebuilt natively / lives outside this subsystem:**
- Persistence: the web app's `localStorage` (`srf:*` keys) writes that consume `PANTRY_PRESETS[].ingredientIds` must be reimplemented with `@react-native-async-storage/async-storage`, preserving the exact `srf:` key strings for any future data-sharing/migration. (Not part of these four files — flagged for the pantry/store subsystem.)
- Any UI that renders `IngredientMacroLine` / `RecipeMacros` / preset cards (emoji, description) is native RN UI work — but the data/engine feeding it ports unchanged.

**Recommended package layout:**
```
@waivy/core (shared, platform-agnostic)
  ├─ data/ingredients.ts
  ├─ data/ingredientNutrition.ts
  ├─ data/pantryPresets.ts
  ├─ lib/types.ts            (canonical Ingredient/Recipe/Nutrition types)
  └─ lib/nutritionEngine.ts  (the engine)
```
Both `apps/web` (Next) and `apps/mobile` (Expo) import from `@waivy/core`. Zero forked logic.

---

## 8. Gotchas for the porter

1. **No unit conversion exists.** If the mobile UI ever lets users enter quantities in a different unit than the catalog unit, the engine will silently mis-multiply. Conversion must be added upstream of `calculateIngredientMacros`, not inside it.
2. **Optional ingredients count toward macros by default** (matches the pricing engine). Don't "fix" this in the port.
3. **Fiber is conditionally omitted** from totals/per-serving when no ingredient supplied fiber — `NutritionEstimate.fiber` is optional and may be absent, not `0`. RN UI must handle `fiber === undefined`.
4. **`calculateRecipeMacros` passes the ingredient id as the name** (`ingredientName: ing.ingredientId`) because seed `RecipeIngredient` only carries the id. The UI resolves the human name via `INGREDIENT_MAP`/`INGREDIENTS` separately. Mobile must do the same.
5. **`missingIngredientIds`** drives the >50% fallback in `bestEffortNutrition`. Keep nutrition keys in sync with any new catalog ids or recipes silently degrade to hand-entered estimates.
6. Stable ids: never rename ingredient ids — saved lists, grocery lists, and presets all key off them.
