# Mobile Port Brief 04 — Pricing, Scoring, Equipment

Subsystem: recipe pricing (cost-per-serving + regional multipliers + AI/override pricing), recipe
scoring / pantry-match algorithm, equipment filtering, and category color mapping.

Scope of files read:
- `src/lib/recipeScoring.ts`
- `src/lib/equipmentFilters.ts`
- `src/lib/categoryColors.ts`
- `src/components/pricing/IngredientPriceRow.tsx`
- `src/components/pricing/LocationSetup.tsx`
- `src/components/pricing/RecipeAIRepriceButton.tsx`

Transitive deps read (they own the real data shapes the above re-export/consume):
- `src/lib/pricing/pricingEngine.ts`
- `src/lib/pricing/regions.ts`
- `src/lib/pricing/locationStorage.ts`
- `src/lib/pricing/locationTypes.ts`
- `src/lib/pricing/aiPriceBook.ts`
- `src/lib/workerClient.ts` (request/response contracts + `AIGroceryPriceEstimate`)
- `src/lib/types.ts` (Recipe / Ingredient / PantryItem / CheapFilters / RecipeScoreResult / enums)
- `src/lib/design/tokens.ts` (`PANTRY_POP` color source for category colors)
- `src/data/ingredients.ts`, `src/data/recipes.ts` (catalog aggregation/exports)

---

## 0. TL;DR port verdict

The **entire pricing/scoring/equipment/color domain is pure TypeScript** and moves into the shared
package essentially unchanged. The only browser couplings are:

1. `localStorage` reads/writes — confined to `locationStorage.ts` and `aiPriceBook.ts` behind
   small `safeRead`/`safeWrite` wrappers. Swap these for an async (or MMKV/sync) KV adapter.
2. `process.env.NEXT_PUBLIC_WORKER_URL` and `fetch` in `workerClient.ts` — works in RN as-is, just
   re-source the env var from Expo config.
3. The three `src/components/pricing/*` components are `"use client"` React DOM (`<li>`, `<input>`,
   `<select>`, lucide-react SVG, Tailwind classNames) — must be **rebuilt as RN views**, but the
   logic/handlers they wrap are all importable from the shared package.

No `window` events, no `FileReader`, no `SpeechRecognition`, no `blob`, no `next/image`,
no `next/link` in this subsystem.

---

## 1. Exported symbols (signatures)

### `src/lib/recipeScoring.ts`
```ts
// Pricing passthroughs (delegate to pricingEngine)
export function calculateRecipeCost(recipe: Recipe): number;            // = quoteRecipe(r).totalCost
export function calculateCostPerServing(recipe: Recipe): number;        // = quoteRecipe(r).costPerServing
export function ingredientCostBreakdown(recipe: Recipe): Array<{
  ingredient: Ingredient | undefined;
  quantity: number;
  optional: boolean;
  note: string | undefined;
  cost: number;
  source: "catalog" | "override" | "ai-estimate" | "fallback";
  confidence: "high" | "medium" | "low";
  appliedUnitCost: number;
  multiplier: number;
  regionLabel: string;
}>;

// Pantry helpers
export function pantrySetFromItems(pantry: PantryItem[]): Set<string>;   // set of ingredientId
export function calculatePantryMatch(recipe: Recipe, pantrySet: Set<string>): { matched: number; total: number };
export function calculateMissingIngredients(recipe: Recipe, pantrySet: Set<string>): RecipeIngredient[];
export function calculateMissingCost(recipe: Recipe, pantrySet: Set<string>): number;

// Ranking (the two top-level scorers)
export function rankCheapRecipes(filters: CheapFilters): RecipeScoreResult[];
export function rankPantryRecipes(pantry: PantryItem[], filters?: Partial<CheapFilters>): RecipeScoreResult[];

// Pantry-page grouping + smart-buy recommender
export function groupPantryResults(results: RecipeScoreResult[], pantry: PantryItem[]): {
  canMakeNow: RecipeScoreResult[];
  needFewItems: RecipeScoreResult[];
  buyOneUnlock: RecipeScoreResult[];
  useSoon: RecipeScoreResult[];
};
export function recommendSmartBuys(pantry: PantryItem[]): Array<{
  ingredientId: string;
  unlocks: number;
  averageCostPerServing: number;
}>;  // top 6, sorted by unlocks desc
```
Module-private (not exported, but algorithmically load-bearing — replicate in shared pkg):
- `CHEAP_TAG_INGREDIENTS: Set<string>` = `{rice, eggs, oats, lentils, black-beans, chickpeas, tortilla, frozen-veg, potato, ramen}`
- `SPICE_IDS: Set<string>` = derived at module load from `INGREDIENT_MAP`: every ingredient with `category === "spice"` plus ids `salt`, `pepper`.
- `timeBucketMaxMinutes(bucket)` → `under-10:10`, `under-20:20`, `under-30:30`, `meal-prep:90`, default `999`.
- `recipeMatchesEquipment`, `recipeMatchesDiet`, `explainCheap` (see §4 for behavior).

### `src/lib/equipmentFilters.ts`
```ts
export type EquipmentProfile = "any" | "microwave-only" | "air-fryer-only"
  | "microwave-and-air-fryer" | "no-stovetop";
export function profileEquipment(profile: EquipmentProfile): Equipment[];
export function recipeFitsEquipment(recipe: Recipe, allowed: Equipment[]): boolean; // empty allowed = all pass
export function isAirFryerRecipe(recipe: Recipe): boolean;
export function isMicrowaveRecipe(recipe: Recipe): boolean;
export function isNoStoveRecipe(recipe: Recipe): boolean;
```

### `src/lib/categoryColors.ts`
```ts
export type CategoryKey = "ai-chef" | "pantry" | "cheap" | "nourish" | "protein" | "carbs" | "fat"
  | "water" | "air-fryer" | "microwave" | "use-soon" | "spicy" | "saved" | "grocery" | "explore"
  | "vegetarian" | "meal-prep" | "dorm-friendly";
export type TailwindTone = "violet" | "emerald" | "amber" | "orange" | "rose" | "teal"
  | "indigo" | "sky" | "cyan" | "red";
export const CATEGORY_COLORS: Record<CategoryKey, { hex: string; tone: TailwindTone; label: string }>;
export function categoryHex(key: CategoryKey | string): string;   // fallback PANTRY_POP.basil (#2FBF71)
export function categoryTone(key: CategoryKey | string): TailwindTone; // fallback "emerald"
```

### `src/lib/pricing/pricingEngine.ts`
```ts
export function quoteIngredient(ingredientId: string, quantity: number, location?: UserLocation): PriceQuote | null;
export function quoteRecipe(recipe: Recipe, options?: { location?: UserLocation; pantrySet?: Set<string> }): RecipeLocalPrice;
export function localCostPerServing(recipe: Recipe): number;
export function localTotalCost(recipe: Recipe): number;
```

### `src/lib/pricing/regions.ts`
```ts
export const REGIONS: PriceRegion[];                 // 14 regions (see §3)
export function getRegion(id: string): PriceRegion;  // falls back to REGIONS[0] ("national")
export function zipToRegion(zip: string): string;    // 3-digit ZIP prefix → regionId
```

### `src/lib/pricing/locationStorage.ts`  (localStorage-backed)
```ts
export function getLocation(): UserLocation;                                 // reads "srf:location"
export function setLocationFromZip(zip: string): UserLocation;              // writes "srf:location"
export function setLocationManual(regionId: string): UserLocation;         // writes "srf:location"
export function clearLocation(): void;                                       // removes "srf:location"
export function listRegions(): PriceRegion[];                                // = REGIONS
export function getOverrides(): Record<string, IngredientPriceOverride>;     // reads "srf:price-overrides"
export function getOverride(ingredientId: string): IngredientPriceOverride | undefined;
export function setOverride(ingredientId: string, unitCost: number, unit: string, note?: string): void;
export function deleteOverride(ingredientId: string): void;
```

### `src/lib/pricing/aiPriceBook.ts`  (localStorage-backed)
```ts
export interface CachedAIPriceEntry { ingredientId: string; regionId: string;
  estimate: AIGroceryPriceEstimate; appliedUnitCost?: number; cachedAt: string; }
export function getAIPrice(ingredientId: string, regionId: string): CachedAIPriceEntry | undefined;
export function setAIPrice(entry: CachedAIPriceEntry): void;   // soft-cap 400 entries, evicts oldest by cachedAt
export function deleteAIPrice(ingredientId: string, regionId: string): void;
export function clearAIPriceBook(): void;
export function listAIPrices(): CachedAIPriceEntry[];
export function applyEstimateToUnit(estimate: AIGroceryPriceEstimate, catalogUnit: string): number | null;
```

### `src/lib/workerClient.ts` (only the pricing-relevant export; see §5 for contract)
```ts
export function isWorkerConfigured(): boolean;
export function workerUrl(): string;
export interface GroceryPriceSource { ... }
export interface AIGroceryPriceEstimate { ... }
export interface EstimateIngredientResult { estimate: AIGroceryPriceEstimate; recipeAmountCost?: number; }
export async function estimateIngredientPrice(opts: {...}): Promise<EstimateIngredientResult>;
```
(Module also exports many non-pricing AI helpers — out of scope here.)

### `src/components/pricing/*` (React, DOM — rebuild in RN)
```ts
export function IngredientPriceRow(props: { ingredient: Ingredient; quantity: number; optional?: boolean; onChange?: () => void }): JSX.Element;
export function LocationSetup(props: { variant?: "compact" | "card"; onChange?: () => void }): JSX.Element | null;
export function RecipeAIRepriceButton(props: { recipe: Recipe; onComplete?: () => void }): JSX.Element | null;
```

---

## 2. Exact data shapes (copied interface definitions)

From `src/lib/pricing/locationTypes.ts`:
```ts
export type PriceConfidence = "high" | "medium" | "low";

export interface PriceRegion {
  id: string;
  label: string;        // e.g. "SF Bay Area"
  shortLabel?: string;  // e.g. "Bay Area"
  multiplier: number;   // 1.0 = national average
  notes?: string;
}

export interface UserLocation {
  zipCode?: string;      // exact ZIP, stored locally only
  cityName?: string;
  regionId: string;
  manualRegion?: boolean; // true when user picked a region (not a ZIP)
  updatedAt: string;      // ISO string
}

export interface IngredientPriceOverride {
  ingredientId: string;
  unitCost: number;       // dollars per unit
  unit: string;
  note?: string;
  updatedAt: string;      // ISO string
}

export interface PriceQuote {
  ingredientId: string;
  ingredientName: string;
  baseUnitCost: number;   // national US base
  appliedUnitCost: number;// base*multiplier OR override OR AI estimate
  quantity: number;
  unit: string;
  totalCost: number;      // appliedUnitCost * quantity
  regionLabel: string;
  multiplier: number;
  source: "catalog" | "override" | "ai-estimate" | "fallback";
  confidence: PriceConfidence;
  note?: string;
}

export interface RecipeLocalPrice {
  totalCost: number;
  costPerServing: number;
  regionLabel: string;
  multiplier: number;
  breakdown: PriceQuote[];
  missingTotalCost: number;  // cost of non-pantry ingredients only
  worstConfidence: PriceConfidence;
}
```

From `src/lib/types.ts` (the canonical domain types this subsystem reads):
```ts
export type IngredientCategory = "grain" | "protein" | "vegetable" | "fruit" | "dairy"
  | "canned" | "condiment" | "spice" | "frozen" | "snack";
export type Equipment = "microwave" | "stovetop" | "oven" | "rice-cooker" | "air-fryer" | "no-kitchen";
export type DietTag = "vegetarian" | "vegan" | "high-protein" | "gluten-free" | "dairy-free";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "meal-prep";
export type TimeBucket = "under-10" | "under-20" | "under-30" | "meal-prep";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  estimatedUnitCost: number;     // cost per `unit`
  unit: string;                  // "cup","tbsp","egg","oz","clove","slice"...
  commonPackageSize?: string;
  shelfLifeDays?: number;
  tags?: string[];
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;              // in the ingredient's `unit`
  optional?: boolean;
  note?: string;
}

export interface PantryItem {
  ingredientId: string;
  quantity?: number;
  useSoon?: boolean;             // scorer prioritizes these
}

export interface CheapFilters {
  budgetPerServing: number;
  servings: number;
  equipment: Equipment[];
  diet: DietTag[];
  time: TimeBucket | "any";
  cuisine?: string;
  mealType?: MealType | "any";
}

export interface RecipeScoreResult {
  recipe: Recipe;
  costPerServing: number;
  totalCost: number;
  pantryMatched: number;
  pantryTotal: number;
  missingIngredients: RecipeIngredient[];
  missingCost: number;
  matchPercent: number;
  score: number;
  reasons: string[];
}
```
`Recipe` is the big canonical interface (`src/lib/types.ts` lines 112–176). Fields this subsystem
actually reads: `id, name, servings, ingredients[], totalTimeMinutes, equipment[], dietTags[],
cuisine?, mealType, primaryCookingMethod?, noStovetopRequired?`. Full interface is large (macro
variants, guided steps, air-fryer fields, flavor metadata) — port it whole, but only the listed
fields matter for pricing/scoring/equipment.

From `src/lib/workerClient.ts` — AI price estimate shapes (also referenced by `aiPriceBook`):
```ts
export interface GroceryPriceSource {
  storeName?: string;
  productName?: string;
  brand?: string | null;
  packagePrice: number;
  packageSize: number;
  packageUnit: string;
  sourceUrl?: string | null;
  priceType: "local-store" | "online-store" | "regional-average" | "national-average"
    | "historical-average" | "ai-estimated" | "user-entered";
  sourceQuality?: "direct-product" | "search-result" | "average-data" | "estimated";
  confidence: "high" | "medium" | "low";
  notes?: string | null;
}

export interface AIGroceryPriceEstimate {
  ingredientName: string;
  canonicalIngredientName: string;
  locationLabel?: string | null;
  typicalPackage: { packageSize: number; packageUnit: string; lowPrice: number; averagePrice: number; highPrice: number; };
  selectedBudgetEstimate: { packagePrice: number; packageSize: number; packageUnit: string; reasoning: string; };
  normalizedPrices: {
    pricePerOz?: number | null; pricePerLb?: number | null; pricePerGram?: number | null;
    pricePerEach?: number | null; pricePerTbsp?: number | null; pricePerTsp?: number | null;
    pricePerCup?: number | null;
  };
  sources: GroceryPriceSource[];
  confidence: "high" | "medium" | "low";
  explanation: string;
  warnings: string[];
}

export interface EstimateIngredientResult {
  estimate: AIGroceryPriceEstimate;
  recipeAmountCost?: number;
}
```

Catalog aggregation (data files — do NOT dump rows):
- `src/data/ingredients.ts`: `export const INGREDIENTS: Ingredient[]` (one literal array; ~70+ rows,
  e.g. `{ id: "rice", name: "Rice", category: "grain", estimatedUnitCost: 0.15, unit: "cup",
  commonPackageSize: "5 lb bag (~$5)", shelfLifeDays: 365, tags: ["staple","cheap"] }`), then
  `export const INGREDIENT_MAP = new Map(INGREDIENTS.map(i => [i.id, i]))`.
- `src/data/recipes.ts`: `export const RECIPES: Recipe[]` (literal array), then
  `export const RECIPE_MAP = new Map(RECIPES.map(r => [r.id, r]))`.
- Both are plain in-memory constants — fully portable, no platform deps.

---

## 3. Regional pricing multipliers (the full list)

`REGIONS` (`src/lib/pricing/regions.ts`) — anchored to national baseline 1.00, coarse buckets
informed by BLS Consumer Expenditure "Food at home" data:

| id | label | shortLabel | multiplier |
| --- | --- | --- | --- |
| `national` | US national average | US avg | 1.00 |
| `ny-metro` | NYC / Northeast metro | NYC metro | 1.22 |
| `bay-area` | SF Bay Area | Bay Area | 1.25 |
| `la-metro` | Los Angeles / Southern California | LA metro | 1.18 |
| `seattle` | Seattle / Pacific Northwest urban | Seattle | 1.16 |
| `boston` | Boston / New England urban | Boston | 1.17 |
| `dc-metro` | DC / Mid-Atlantic urban | DC metro | 1.12 |
| `chicago` | Chicago / Midwest urban | Chicago | 1.04 |
| `texas-metro` | Texas urban (Austin/Dallas/Houston) | Texas urban | 1.00 |
| `south-urban` | Southeast urban (Atlanta/Charlotte/Miami) | SE urban | 0.98 |
| `midwest-suburban` | Midwest suburban / small-city | Midwest | 0.92 |
| `rural` | Rural / low cost-of-living | Rural | 0.85 |
| `hawaii` | Hawaii | (none → uses label) | 1.42 |
| `alaska` | Alaska | (none → uses label) | 1.32 |

`zipToRegion(zip)` maps the **first 3 ZIP digits** to a region (else `national`):
- 100–119 → ny-metro; 020–028 → boston; 200–229 → dc-metro; 300–349 → south-urban;
  600–608 → chicago; 750–778 → texas-metro; 980–982 & 970–972 → seattle; 900–929 → la-metro;
  940–951 → bay-area; 967–968 → hawaii; 995–999 → alaska.
- Midwest/Plains catch-all (→ midwest-suburban): 500–599, 610–699, 800–838.
- Rural catch-all (→ rural): 240–268, 370–397, 400–427, 700–749.

---

## 4. Algorithms (behavior, exact)

### 4.1 `calculateCostPerServing` chain
`calculateCostPerServing(recipe)` → `quoteRecipe(recipe).costPerServing` →
`totalCost / Math.max(1, recipe.servings)`. `totalCost` sums `quoteIngredient(...).totalCost` over
**non-optional** ingredients only (optional ingredients are skipped in `quoteRecipe`).

`quoteIngredient(id, qty, location?)` price priority:
1. **User override** — only if `override.unit === builtIn.unit` (unit-mismatch overrides are ignored
   to avoid `$/oz × cup` bugs). `source: "override"`, `confidence: "high"`.
2. **Cached AI estimate** (`getAIPrice(id, regionId)`) — uses `cached.appliedUnitCost ??
   applyEstimateToUnit(estimate, builtIn.unit)`, only if finite and > 0. `source: "ai-estimate"`,
   confidence from the estimate.
3. **Catalog × region multiplier** — `builtIn.estimatedUnitCost * region.multiplier`.
   `source: "catalog"`, `confidence: "medium"`.
4. Returns `null` if no `builtIn` (caller falls back to 0 / `"fallback"`).

`worstOf(...confidences)` (private): low > medium > high — recipe inherits the worst quote's
confidence in `RecipeLocalPrice.worstConfidence`.

`applyEstimateToUnit(estimate, catalogUnit)`: maps catalogUnit (lowercased) to a `normalizedPrices`
field (`oz→pricePerOz`, `lb→pricePerLb`, `g|gram→pricePerGram`, `each|egg|item→pricePerEach`,
`tbsp|tablespoon→pricePerTbsp`, `tsp|teaspoon→pricePerTsp`, `cup→pricePerCup`); else if
`selectedBudgetEstimate.packageUnit === catalogUnit` uses `packagePrice / packageSize`; else `null`.

### 4.2 Pantry-match
`calculatePantryMatch` counts only **non-optional** ingredients; `matched` = those in the pantry set,
`total` = all non-optional. `calculateMissingIngredients` = non-optional ingredients not in set.
`calculateMissingCost` = sum of `quoteIngredient(...).totalCost` for the missing ones.

### 4.3 `rankCheapRecipes(filters)`
Iterates `RECIPES`, filtering by: equipment fit, diet (recipe must include all selected tags),
`totalTimeMinutes <= timeBucketMaxMinutes(filters.time)`, optional cuisine match, optional mealType
match, and `costPerServing <= filters.budgetPerServing`. Score =
`max(0, 100 - costPerServing*25) + max(0, 60 - totalTimeMinutes)`. Sorted desc. `pantryMatched` 0,
`missingIngredients` = all non-optional. `reasons` from `explainCheap` (cheap-ingredient names,
"Short ingredient list" if ≤6 non-optional, "Done in N minutes" if ≤15).

### 4.4 `rankPantryRecipes(pantry, filters?)`
Builds `pantrySet` then `effectivePantry` = pantrySet ∪ `SPICE_IDS` (so spices/staples never penalize
a match). Filters (optional): equipment, diet, time. Skips any recipe where the user has **zero**
non-spice non-optional matches. Score:
```
matchPercent*2 + max(0,30 - missing.length*5) + max(0,30 - missingCost*5) + max(0,20 - costPerServing*4)
```
`pantryMatched` = non-spice pantry matches. Reasons: "Uses N ingredients you already have",
"Only $X missing" (if missingCost < 2), "Done in N minutes" (≤15). Sorted desc.

### 4.5 `groupPantryResults(results, pantry)`
`useSoonSet` from pantry items with `useSoon`. Buckets: `useSoon` (recipe uses any expiring item),
`canMakeNow` (0 missing), `buyOneUnlock` (1 missing OR `missingCost < 3`), `needFewItems` (≤2 missing).
(Note: a recipe can land in multiple buckets; `useSoon` is independent of the missing-count buckets.)

### 4.6 `recommendSmartBuys(pantry)`
Probes a fixed candidate staple list (`rice, eggs, pasta, oats, lentils, black-beans, chickpeas,
tortilla, frozen-veg, potato, soy-sauce, garlic, onion, peanut-butter, tuna`, minus what's owned).
For each, counts recipes newly brought to ≤1 missing (`after>before && missingAfter<=1 &&
missingBefore>1`), averages their cost-per-serving. Returns top 6 with `unlocks > 0`, sorted by
`unlocks` desc.

### 4.7 Equipment filtering
`recipeScoring.recipeMatchesEquipment` (private) and `equipmentFilters.recipeFitsEquipment`
(exported) share the rule: empty `allowed` ⇒ all pass; otherwise **every** piece of `recipe.equipment`
must be in `allowed` ("what I have → what I can make"). `recipeMatchesEquipment` additionally
special-cases `no-kitchen` allowed ⇒ only no-cook (`no-kitchen` or `microwave`) recipes pass.
`profileEquipment` maps a profile preset → `Equipment[]`. `isAirFryerRecipe` / `isMicrowaveRecipe` /
`isNoStoveRecipe` are convenience predicates over `primaryCookingMethod` / `equipment` /
`noStovetopRequired`.

### 4.8 Category colors
`CATEGORY_COLORS` maps each `CategoryKey` to `{ hex, tone, label }`. `hex` comes from `PANTRY_POP`
tokens (`src/lib/design/tokens.ts`) or inline hex literals. `tone` is a Tailwind color-family name
(`violet`, `emerald`, ...) used to compose `bg-{tone}-100 / text-{tone}-700 / ring-{tone}-500`.
`PANTRY_POP` values referenced: `grape #7C5CFF`, `basil #2FBF71`, `butter #FFD166`, `carrot #FF8A3D`,
`pink #FF6B9E`, `teal #20C7A5`, `sky #3BA7FF`, `tomato #EF4444`. Inline hexes also used (e.g.
explore `#6366F1`, protein `#8B5CF6`, fat/use-soon `#F59E0B`, water `#06B6D4`, vegetarian `#10B981`,
meal-prep `#14B8A6`, dorm-friendly `#22C55E`).

---

## 5. Network contract (the one in this subsystem)

`estimateIngredientPrice(opts)` → **POST** `${NEXT_PUBLIC_WORKER_URL}/pricing/estimate-ingredient`

Request headers: `Content-Type: application/json`. Body:
```ts
{
  ingredientName: string;
  recipeQuantity?: number;
  recipeUnit?: string;
  location?: { city?: string; state?: string; zipCode?: string; label?: string };
  preferBudgetStores?: boolean;
}
```
(Callers in this subsystem send `{ ingredientName, recipeUnit, location: { label: region.label }, preferBudgetStores: true }`.)

Response: `EstimateIngredientResult` = `{ estimate: AIGroceryPriceEstimate; recipeAmountCost?: number }`
(shapes in §2).

Transport details (in `postJson`): 60s `AbortController` timeout (`"AI request timed out — try
again"`); throws `"AI is not configured…"` if `WORKER_URL` empty; on non-2xx parses `{ error }` JSON
(falls back to text); status 429 → `"AI is rate-limited — try again in a moment"`; else
`"AI request failed (status): detail"`. `WORKER_URL = (process.env.NEXT_PUBLIC_WORKER_URL ?? "")`
with trailing slash stripped. `isWorkerConfigured()` = URL length > 0.

`RecipeAIRepriceButton` batches this call across a recipe's uncached required ingredients with a
manual concurrency cap of 4 (custom promise-pool, not `Promise.allSettled`).

---

## 6. localStorage keys (exact strings + stored value shapes)

| Key | Where | Stored value shape |
| --- | --- | --- |
| `srf:location` | `locationStorage.ts` (`LOCATION_KEY`) | `UserLocation` (single object). Default if absent: `{ regionId: "national", manualRegion: false, updatedAt: new Date(0).toISOString() }`. |
| `srf:price-overrides` | `locationStorage.ts` (`OVERRIDES_KEY`) | `Record<string /*ingredientId*/, IngredientPriceOverride>` (default `{}`). |
| `srf:ai-price-book` | `aiPriceBook.ts` (`KEY`) | `Record<string, CachedAIPriceEntry>` keyed by `` `${ingredientId}|${regionId}` ``. Soft cap 400 entries; evicts oldest by `cachedAt`. Default `{}`. |

All three are read/written through `safeRead`/`safeWrite` helpers that no-op when
`typeof window === "undefined"` (SSR guard) and swallow JSON/quota errors. The `srf:` prefix is
**legacy and must not be renamed** (shared with pantry/grocery/saved/custom keys; renaming wipes user
data — see repo CLAUDE.md §14). Values are written **synchronously**; pricing reads (e.g.
`quoteIngredient` → `getOverride`/`getAIPrice`) assume **synchronous** KV access.

---

## 7. Browser / Next-only couplings & how to adapt

| Coupling | Where | RN adaptation |
| --- | --- | --- |
| `window.localStorage` (sync get/set/remove) | `locationStorage.ts`, `aiPriceBook.ts` | Behind `safeRead`/`safeWrite` already. RN has no `localStorage`. Use a **synchronous** KV (`react-native-mmkv` — sync, fast) to preserve the current sync call pattern, OR refactor `quoteIngredient`/`quoteRecipe` to take an injected store (cleaner). AsyncStorage is async and would force the whole pricing path async — avoid unless you hydrate overrides/AI-book into memory at startup. |
| `typeof window === "undefined"` SSR guards | both storage modules | Harmless in RN (`window` is undefined in RN, so guards would return fallbacks). Replace the guard with an `isAvailable()` check on the KV adapter, or drop it once on a native store. |
| `process.env.NEXT_PUBLIC_WORKER_URL` | `workerClient.ts` | RN has no `NEXT_PUBLIC_*` inlining. Re-source from `expo-constants` (`Constants.expoConfig.extra.workerUrl`) or `process.env.EXPO_PUBLIC_WORKER_URL` (Expo inlines `EXPO_PUBLIC_*`). Keep the same trailing-slash strip + `isWorkerConfigured()`. |
| `fetch` + `AbortController` | `workerClient.postJson` | Both exist in RN (Hermes/RN runtime). Works unchanged. JSON only — no blob/FileReader here. |
| `"use client"` directive | all 3 pricing components + `workerClient.ts` | No-op/strip in RN; meaningless outside Next App Router. |
| DOM elements: `<li>`, `<input type="number">`, `<select>`, `<option>`, `<a target="_blank">`, `<ul>` | all 3 pricing components | Rebuild with RN primitives: `View`/`Text`/`Pressable`, `TextInput` (`keyboardType="numeric"` / `"number-pad"`), a picker (`@react-native-picker/picker` or a bottom-sheet) for region select, `Linking.openURL` for source links. |
| Tailwind `className` strings | all 3 components + `categoryColors` tone usage | No Tailwind in RN. Use NativeWind (keeps className) or convert to `StyleSheet`. The `tone` → `bg-{tone}-*` Tailwind composition does NOT exist in RN — either adopt NativeWind (so tone classnames still resolve) or build a `tone → {bg,text,ring}` color lookup. `hex` values are runtime-safe and work everywhere (use these for native styling). |
| lucide-react (SVG icons) | all 3 components | Swap for `lucide-react-native` (same icon names: Pencil, Check, RotateCcw, Sparkles, Loader2, ChevronDown/Up, MapPin, Trash2, AlertCircle, CheckCircle2). |
| `@/components/ui/Button` (DOM Button) | LocationSetup, RecipeAIRepriceButton | Use the RN `Button` primitive from the shared/native UI package (same `variant`/`size`/`leftIcon` API per repo §7). |
| `new Date().toISOString()`, `Math`, `Set`, `Map` | scoring + storage | Pure JS — portable as-is. |
| `mounted` gate via `useEffect` (LocationSetup returns null pre-mount) | LocationSetup | In RN there's no SSR/hydration mismatch; drop the `mounted` guard and read the store directly on first render (or `useEffect` for async store). |

Not present in this subsystem (so nothing to port): `next/image`, `next/link`,
`SpeechRecognition`, `FileReader`, `Blob`/object URLs, `navigator.*`, `document.*`,
`window` event listeners, CSS modules.

---

## 8. RN port plan

**A. Moves into the shared package UNCHANGED (pure TS, zero platform deps):**
- `recipeScoring.ts` (all exports + private helpers/constants).
- `equipmentFilters.ts` (all exports).
- `pricingEngine.ts` (`quoteIngredient`, `quoteRecipe`, `localCostPerServing`, `localTotalCost`).
- `regions.ts` (`REGIONS`, `getRegion`, `zipToRegion`).
- `locationTypes.ts` (all interfaces/types).
- `categoryColors.ts` — types, `CATEGORY_COLORS`, `categoryHex`, `categoryTone` move unchanged; the
  **`hex` path is fully portable**. Only `tone` consumers need a platform color resolver if not on
  NativeWind. Keep `PANTRY_POP` (`design/tokens.ts`) in the shared pkg.
- Data: `src/data/ingredients.ts`, `src/data/recipes.ts` (constants + maps) — unchanged.
- The non-component type/fn exports of `workerClient.ts` (all the `interface`s + the request
  functions) move into shared; only the env-var sourcing changes (see C).

**B. Needs a thin platform ADAPTER (logic shared, I/O injected):**
- `locationStorage.ts` and `aiPriceBook.ts`: extract `safeRead`/`safeWrite` into a tiny KV interface
  (`{ getItem(k): string|null; setItem(k,v): void; removeItem(k): void }`). Web binds `localStorage`;
  RN binds MMKV (to keep sync semantics). All key strings (`srf:location`, `srf:price-overrides`,
  `srf:ai-price-book`) and value shapes stay identical so a future shared backend stays compatible.
- `workerClient.ts` transport: keep `postJson`/timeout/error mapping shared; inject `WORKER_URL` from
  a platform config (web: `NEXT_PUBLIC_WORKER_URL`; RN: `EXPO_PUBLIC_WORKER_URL` / expo-constants).

**C. Must be REBUILT natively (presentation only — all handlers import from shared):**
- `IngredientPriceRow` → RN row: `View` layout, `TextInput` (numeric) for price edit, `Pressable`
  icon buttons (`lucide-react-native`), AI-sources panel as a `View`, links via `Linking.openURL`.
  Reuses shared `getOverride/setOverride/deleteOverride`, `quoteIngredient`, `getAIPrice/setAIPrice`,
  `applyEstimateToUnit`, `getLocation`, `getRegion`, `estimateIngredientPrice`, `isWorkerConfigured`.
- `LocationSetup` → RN form: `TextInput` (ZIP, `number-pad`, maxLength 5) + a native picker for
  region (replaces `<select>`). Reuses shared `getLocation/setLocationFromZip/setLocationManual/
  clearLocation/listRegions/getRegion`. Drop the `mounted` SSR gate.
- `RecipeAIRepriceButton` → RN button + progress text. Promise-pool logic (concurrency 4) is plain
  JS and can move into a shared `repriceRecipe(recipe, opts)` function, leaving only the button shell
  native. Reuses `estimateIngredientPrice`, `getAIPrice/setAIPrice`, `applyEstimateToUnit`,
  `getLocation`, `getRegion`, `INGREDIENT_MAP`, `isWorkerConfigured`.

**Suggested package layout:**
`@waivy/core` (everything in A + B's logic + KV/config interfaces) →
consumed by both `apps/web` (binds localStorage + NEXT_PUBLIC_) and `apps/mobile`
(binds MMKV + EXPO_PUBLIC_ and provides the native components in C).
