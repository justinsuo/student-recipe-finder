# Mobile Port Brief — 02: Recipe Data & Aggregation

Subsystem that defines, merges, and image-resolves the entire recipe catalog for
Waivy. This is the data backbone consumed by the home page, cheap-recipes,
pantry match, saved, explore, recipe detail, and the Nourish meal-logging
features. **It is almost entirely pure TypeScript data + pure functions** — the
single best candidate to move into a shared cross-platform package nearly
unchanged.

Scope of files covered:
- `src/data/recipes.ts` — canonical `RECIPES` catalog (seed + air-fryer + microwave)
- `src/data/airFryerRecipes.ts` — `AIR_FRYER_RECIPES`
- `src/data/microwaveRecipes.ts` — `MICROWAVE_RECIPES`
- `src/data/exploreRecipes.ts` — `EXPLORE_RECIPES` (external/local explore dataset)
- `src/data/globalRecipes/index.ts` (+ region files) — `GLOBAL_RECIPES`
- `src/data/macroRecipes/index.ts` + `manifest.ts` + `plan.ts` (+ batch files) — `MACRO_RECIPES`, `MACRO_RECIPE_MAP`
- `src/data/recipeImages.ts` — `RECIPE_IMAGES`, `getRecipeImage()`
- `src/data/recipePhotoMap.ts` — `RECIPE_PHOTO_MAP`
- `src/lib/foodPhotos.ts` — `resolveRecipeImage()`, `getCuisineGradient()`

Two type families are involved: the canonical `Recipe` (`src/lib/types.ts`) and
the external/explore `ExternalRecipe` (`src/lib/externalTypes.ts`). They are
**not interchangeable** — see "Two recipe shapes" below.

---

## 1. Two recipe shapes (critical)

There are **two distinct recipe object types**. The catalog is NOT one unified
shape; it is two parallel worlds keyed by which type they use.

### 1a. `Recipe` — canonical internal recipe (`src/lib/types.ts`)

Used by: `RECIPES` (seed/air-fryer/microwave) and `MACRO_RECIPES`.
Image path: `getRecipeImage(recipe.id)` → `RECIPE_IMAGES`.

```ts
export type IngredientCategory =
  | "grain" | "protein" | "vegetable" | "fruit" | "dairy"
  | "canned" | "condiment" | "spice" | "frozen" | "snack";

export type Equipment =
  | "microwave" | "stovetop" | "oven" | "rice-cooker" | "air-fryer" | "no-kitchen";

export type DietTag =
  | "vegetarian" | "vegan" | "high-protein" | "gluten-free" | "dairy-free";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "meal-prep";
export type Difficulty = "easy" | "medium" | "hard";
export type TimeBucket = "under-10" | "under-20" | "under-30" | "meal-prep";

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;      // in `unit` matching the ingredient's unit
  optional?: boolean;
  note?: string;
}

export interface Substitution {
  forIngredientId: string;
  swap: string;
  savings?: string;
}

export interface NutritionEstimate {
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
  fiber?: number;  // grams (optional)
}

export interface GuidedCookingStep {
  title: string;
  instruction: string;
  timerMinutes?: number;
}

export type HeatLevel =
  | "low" | "medium-low" | "medium" | "medium-high" | "high" | "none";

export interface RecipeInstructionStep {
  shortStep: string;
  detailedExplanation: string;
  timerMinutes?: number | null;
  heatLevel?: HeatLevel;
  textureCue?: string | null;
  tasteCue?: string | null;
  beginnerTip?: string | null;
  safetyNote?: string | null;
}

export type FlavorBadge =
  | "spicy" | "tangy" | "umami" | "garlicky" | "smoky" | "savory" | "creamy" | "crispy";

export interface RecipeImage {
  src: string;
  alt: string;
  sourceName: string;
  sourceUrl: string;
  license: string;
  attributionRequired: boolean;
  attributionText?: string;
  verifiedMatch: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  mealType: MealType;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  totalTimeMinutes: number;
  difficulty: Difficulty;
  equipment: Equipment[];
  dietTags: DietTag[];
  cheapTips: string[];
  substitutions: Substitution[];
  healthierTips?: string[];
  batchPrepTips?: string[];
  whatToBuyNext?: string[];
  estimatedNutrition: NutritionEstimate;
  emoji: string;        // visual placeholder
  accentColor: string;  // tailwind bg class, e.g. "bg-amber-100"
  cuisine?: string;
  tags?: string[];      // e.g. "dorm-friendly", "one-pot"

  // Extended optional fields used by the larger recipe set
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  dormFriendly?: boolean;
  mealPrepFriendly?: boolean;
  allergyTags?: string[];      // contains-nuts, contains-soy, etc.
  whyCheap?: string;
  storageInstructions?: string;
  reheatingInstructions?: string;
  guidedCookingSteps?: GuidedCookingStep[];
  optionalAddIns?: string[];
  youtubeId?: string;

  // Air-fryer + microwave method fields
  primaryCookingMethod?:
    | "stovetop" | "oven" | "rice-cooker" | "air-fryer"
    | "microwave" | "air-fryer-and-microwave" | "no-cook";
  noStovetopRequired?: boolean;
  crispinessLevel?: "soft" | "lightly crispy" | "crispy" | "extra crispy";
  microwaveTimeMinutes?: number;
  airFryerTimeMinutes?: number;
  airFryerTemperatureF?: number;

  // Beginner-friendly extended instructions + flavor metadata
  detailedSteps?: RecipeInstructionStep[];
  flavorExplanation?: string;
  seasoningUpgrades?: string[];
  tasteTroubleshooting?: string[];
  flavorBadges?: FlavorBadge[];

  // Macro-friendly recipe variants (3 records/dish share a variantGroup slug)
  variantGroup?: string;
  variantType?: "original" | "calorie-friendly" | "protein-friendly";
  variantNote?: string; // "what changed" note shown on cf/pf variants
}
```

> Note: `ingredients[].ingredientId` is a foreign key into the ingredient
> catalog (`src/data/ingredients.ts`, a separate subsystem). Pricing/nutrition
> engines resolve these IDs. The recipe object stores **only** the IDs +
> quantities, not the resolved ingredient names/costs.

### 1b. `ExternalRecipe` — explore/global recipe (`src/lib/externalTypes.ts`)

Used by: `EXPLORE_RECIPES` and `GLOBAL_RECIPES` (and adapter output from
Spoonacular/Edamam/TheMealDB).
Image path: `resolveRecipeImage(recipe)` → `RECIPE_PHOTO_MAP` or gradient.

```ts
export type ExternalSource = "spoonacular" | "edamam" | "themealdb" | "mock" | "local";

export interface ExternalIngredient {
  name: string;          // free text, NOT an ingredientId
  amount: string | null;
  unit: string | null;
}

export interface ExternalSubstitution {
  ingredient: string;
  swap: string;
}

export interface ExternalRecipe {
  id: string;            // e.g. "spoonacular-716429", "local-chana-masala", "cn-tomato-egg"
  source: ExternalSource;
  sourceUrl: string;     // kept in data, never rendered
  title: string;
  cuisine: string;
  image: string;         // may be source.unsplash.com (placeholder) → resolver swaps it
  mealType: string | null;
  totalTimeMinutes: number | null;
  servings: number | null;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  rating: number | null;             // 0–5
  diets: string[];
  tags: string[];
  ingredients: ExternalIngredient[];
  instructions: string[];
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  culturalNote: string | null;

  // Extended fields for local/global recipes
  cuisineId?: string;             // kebab-case e.g. "chinese", "south-african"
  dishType?: string | null;       // "main course", "dessert"
  region?: string;
  country?: string;
  estimatedCost?: number;          // USD per serving
  studentFriendlyScore?: number;   // 1–10
  spiceLevel?: number;             // 0–5
  proteinType?: string;            // "chicken" | "tofu" | "legumes" | "seafood" | "none" …
  equipmentNeeded?: string[];
  storageTips?: string;
  substitutions?: ExternalSubstitution[];
  flavorProfile?: string[];        // ["savory","umami","spicy",…]
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
}

export interface ExternalSearchResult {
  recipes: ExternalRecipe[];
  total: number;
  page: number;
  hasMore: boolean;
  source: ExternalSource;
}

export interface ExploreFilters {
  query: string; cuisine: string; region: string; diet: string;
  mealType: string; difficulty: string;
  maxTime: number | null; maxCost: number | null; spiceLevel: number | null;
  proteinType: string; studentMode: boolean;
  sort: "popular" | "rating" | "fastest" | "cheapest" | "easiest" | "score";
  page: number;
}
```

---

## 2. Exported symbols (full list, by file)

| File | Export | Type / Signature |
| --- | --- | --- |
| `src/data/recipes.ts` | `RECIPES` | `Recipe[]` — `[...BASE_RECIPES, ...AIR_FRYER_RECIPES, ...MICROWAVE_RECIPES]` |
| `src/data/recipes.ts` | `RECIPE_MAP` | `Map<string, Recipe>` — `new Map(RECIPES.map(r => [r.id, r]))` |
| `src/data/recipes.ts` | *(internal)* `BASE_RECIPES` | `Recipe[]` — 100 seed recipes (NOT exported) |
| `src/data/airFryerRecipes.ts` | `AIR_FRYER_RECIPES` | `Recipe[]` |
| `src/data/microwaveRecipes.ts` | `MICROWAVE_RECIPES` | `Recipe[]` |
| `src/data/exploreRecipes.ts` | `EXPLORE_RECIPES` | `ExternalRecipe[]` (auto-generated, JSON-literal style) |
| `src/data/globalRecipes/index.ts` | `GLOBAL_RECIPES` | `ExternalRecipe[]` — spread of 31 region arrays |
| `src/data/globalRecipes/<region>.ts` | e.g. `EAST_ASIA_RECIPES`, `JAPANESE_RECIPES`, … | `ExternalRecipe[]` (one per region file) |
| `src/data/macroRecipes/index.ts` | `MACRO_RECIPES` | `Recipe[]` — spread of `BATCH_001…BATCH_101` |
| `src/data/macroRecipes/index.ts` | `MACRO_RECIPE_MAP` | `Map<string, Recipe>` |
| `src/data/macroRecipes/batch-NNN.ts` | `BATCH_001` … `BATCH_101` | `Recipe[]` |
| `src/data/macroRecipes/manifest.ts` | `MANIFEST` | `BatchRecord[]` (build-time progress ledger) |
| `src/data/macroRecipes/manifest.ts` | `BatchRecord` | `interface` (see below) |
| `src/data/macroRecipes/plan.ts` | `DISH_CONCEPTS` | `DishConcept[]` (build-time taxonomy plan) |
| `src/data/macroRecipes/plan.ts` | `DishConcept` | `interface` (see below) |
| `src/data/recipeImages.ts` | `RECIPE_IMAGES` | `Record<string, RecipeImage>` (keyed by recipe id) |
| `src/data/recipeImages.ts` | `getRecipeImage` | `(id: string) => RecipeImage \| undefined` |
| `src/data/recipePhotoMap.ts` | `RECIPE_PHOTO_MAP` | `Record<string, string>` (recipe id → photo URL) |
| `src/lib/foodPhotos.ts` | `resolveRecipeImage` | `(recipe: ExternalRecipe) => string \| null` |
| `src/lib/foodPhotos.ts` | `getCuisineGradient` | `(cuisine: string) => string` (returns CSS `linear-gradient(...)`) |

Build-time-only types (used by data-generation scripts, not the running app):

```ts
// src/data/macroRecipes/manifest.ts
export interface BatchRecord {
  batch: number;       // 1-based batch number
  range: string;       // e.g. "001–010"
  theme: string;       // short description of the batch content
  slugs: string[];     // all variant ids written (3 per dish)
  completedAt: string; // ISO date
}

// src/data/macroRecipes/plan.ts
export interface DishConcept {
  slug: string;        // base slug; variants get -cf / -pf suffixes
  name: string;
  cuisine: string;
  mealType: string;
  primaryProtein: string;
  cookingMethod: string;
  batch: number;
  done: boolean;
}
```

---

## 3. How sources are merged into one catalog

There is **no single global "merge everything" array.** Instead, two catalogs
exist in parallel, plus build-time spreads inside each:

### 3a. `RECIPES` (canonical `Recipe[]`) — `src/data/recipes.ts`
```ts
const BASE_RECIPES: Recipe[] = [ /* 100 inline seed recipes */ ];
export const RECIPES: Recipe[] = [
  ...BASE_RECIPES,        // 100
  ...AIR_FRYER_RECIPES,   // 60   (imported from ./airFryerRecipes)
  ...MICROWAVE_RECIPES,   // 69   (imported from ./microwaveRecipes)
];                        // = 229 total
export const RECIPE_MAP = new Map(RECIPES.map((r) => [r.id, r]));
```
This is the **only** array that generates static `/recipes/[id]` pages.

### 3b. `MACRO_RECIPES` (canonical `Recipe[]`) — `src/data/macroRecipes/index.ts`
```ts
export const MACRO_RECIPES: Recipe[] = [ ...BATCH_001, ...BATCH_002, … ...BATCH_101 ];
export const MACRO_RECIPE_MAP = new Map(MACRO_RECIPES.map((r) => [r.id, r]));
```
Kept **separate from `RECIPES` on purpose** (docstring): it does NOT generate
static pages. Each "dish" has 3 variant records sharing a `variantGroup` slug,
linked by `variantType` (`original` / `calorie-friendly` / `protein-friendly`).
Variant ids are `<slug>`, `<slug>-cf`, `<slug>-pf`.

### 3c. `GLOBAL_RECIPES` (`ExternalRecipe[]`) — `src/data/globalRecipes/index.ts`
Spread of 31 region arrays (east Asia, Japanese, Korean, Taiwanese, Thai,
Vietnamese, Indian, Middle East, European, African, Latin America, Mexican,
Oceania, mixed, extras, etc.). Each region file exports one
`<REGION>_RECIPES: ExternalRecipe[]`.

### 3d. `EXPLORE_RECIPES` (`ExternalRecipe[]`) — `src/data/exploreRecipes.ts`
Auto-generated JSON-literal dataset (ids like `gen-cn-001`, `source: "local"`).

### 3e. The runtime merge for Explore — `src/lib/services/exploreService.ts`
The only place where `ExternalRecipe` sources are combined at runtime:
```ts
const ALL_RECIPES = [...GLOBAL_RECIPES, ...EXPLORE_RECIPES];  // = 1,005 ExternalRecipe
```
…filtered/sorted/paginated by `ExploreFilters` inside `localSearch()`.

### Consumers (where catalogs are read)
`RECIPES` / `RECIPE_MAP`: home, cheap-recipes, pantry match (`recipeScoring`),
saved, grocery-list, recipe detail, chatbot, AppStore, Nourish recipes/meal-planner.
`MACRO_RECIPES`: Nourish meal-logging (`RecipesTab`, AddFoodModal).
`GLOBAL_RECIPES` + `EXPLORE_RECIPES`: `/explore` via `exploreService`.

---

## 4. Recipe counts per source (verified by grep)

| Source | Export | Type | Count |
| --- | --- | --- | --- |
| Seed (inline) | `BASE_RECIPES` | `Recipe` | 100 |
| Air fryer | `AIR_FRYER_RECIPES` | `Recipe` | 60 |
| Microwave | `MICROWAVE_RECIPES` | `Recipe` | 69 |
| **`RECIPES` total** | `RECIPES` | `Recipe` | **229** |
| Macro-friendly | `MACRO_RECIPES` | `Recipe` | **2,982** records (≈994 dishes × 3 variants; 101 batch files, 30 records each in early batches) |
| Global | `GLOBAL_RECIPES` | `ExternalRecipe` | **859** (31 region files) |
| Explore (generated) | `EXPLORE_RECIPES` | `ExternalRecipe` | **146** |
| **Explore merged** | `[...GLOBAL, ...EXPLORE]` | `ExternalRecipe` | **1,005** |
| Curated photos (canonical) | `RECIPE_IMAGES` | `RecipeImage` | **235** entries |
| Dish photos (external) | `RECIPE_PHOTO_MAP` | URL string | **802** entries (header claims 802/859 ≈ 93% global coverage) |

Note: `RECIPE_IMAGES` (235) covers only a subset of `RECIPES` (229) plus a few
extras — recipes without an entry render the emoji-gradient fallback.

---

## 5. Image / photo resolution (per recipe id)

There are **two completely separate resolution pipelines**, keyed by recipe type.

### 5a. Canonical `Recipe` → `getRecipeImage(id)` (`src/data/recipeImages.ts`)
```ts
export function getRecipeImage(id: string): RecipeImage | undefined {
  return RECIPE_IMAGES[id];
}
```
- Returns a full `RecipeImage` (Wikimedia URL + license + attribution) or
  `undefined`.
- Consumer `RecipeImage.tsx` renders `<img src={img.src}>` and, if missing OR
  `onError`, falls back to an emoji-on-gradient placeholder derived from
  `recipe.accentColor` (`"bg-amber-100"` → `"from-amber-100"`) + `recipe.emoji`.
- Attribution text + source link shown in hero mode.

### 5b. `ExternalRecipe` → `resolveRecipeImage(recipe)` (`src/lib/foodPhotos.ts`)
```ts
export function resolveRecipeImage(recipe: ExternalRecipe): string | null {
  // Stable non-Unsplash URL (TheMealDB/Spoonacular) — keep it
  if (!recipe.image.includes("source.unsplash.com")) return recipe.image;
  // Dish-specific verified photo, else null
  return RECIPE_PHOTO_MAP[recipe.id] ?? null;
}
```
Resolution priority:
1. `recipe.image` if it is NOT a `source.unsplash.com` placeholder → use as-is.
2. Else `RECIPE_PHOTO_MAP[recipe.id]` (verified dish photo URL).
3. Else `null` → caller renders `getCuisineGradient(recipe.cuisine)`.

```ts
export function getCuisineGradient(cuisine: string): string {
  // 1. exact match in GRADIENTS lookup (≈110 cuisines → readonly [colorA, colorB])
  // 2. partial substring match ("North Indian" → "Indian")
  // 3. deterministic hash fallback into FALLBACK_COLORS (7 pairs)
  // returns: `linear-gradient(135deg, <a>, <b>)`
}
```

> Both pipelines depend only on a recipe `id` (and, for 5b, `recipe.image` +
> `recipe.cuisine`). No network, no DOM. Pure lookups.

---

## 6. localStorage keys touched by THIS subsystem

**None.** The recipe-data subsystem is read-only static data + pure functions.
It touches no `localStorage`, no `window`, no `navigator`, no `document`.

For context (owned by *other* subsystems, not this one), the app uses these keys
elsewhere — relevant only because they store recipe IDs that reference this
catalog: `srf:pantry`, `srf:grocery`, `srf:saved`, `srf:custom-recipes`,
`srf:location`. The `srf:` prefix is legacy and **must not be renamed** (renaming
wipes all users). These belong to the storage/AppStore subsystem, not here.

---

## 7. Network / request-response contracts

The **data files have zero network calls.** The only network behavior in this
subsystem's runtime sibling is `exploreService.ts`, which provides remote
fallbacks for the explore feed. Default source is `"local"` (no network).

Config gate (`getExploreSource()`), driven by `process.env.NEXT_PUBLIC_*`:
- `NEXT_PUBLIC_EXPLORE_SOURCE` ∈ `"spoonacular" | "edamam" | "themealdb"`; else `"local"`.
- `NEXT_PUBLIC_SPOONACULAR_API_KEY`, `NEXT_PUBLIC_EDAMAM_APP_ID`,
  `NEXT_PUBLIC_EDAMAM_APP_KEY` required for the respective remote sources.

TheMealDB contract (the only key-free remote source):
- Base: `https://www.themealdb.com/api/json/v1/1`
- `GET /search.php?s=<query>` → `{ meals: MealDBMeal[] | null }`
- `GET /filter.php?a=<area>` → meals by area
- `GET /filter.php?c=<category>` → meals by category
- `GET /lookup.php?i=<id>` → full meal detail
- Areas/categories enumerated as `MEALDB_AREAS` / `MEALDB_CATEGORIES`.
- Raw responses normalized via `normalizeMealDB()` (in `src/lib/adapters/`) into
  `ExternalRecipe`. Spoonacular/Edamam have analogous adapters.

Public API of `exploreService.ts`:
```ts
export function getExploreSource(): "local" | "spoonacular" | "edamam" | "themealdb";
export async function searchExternalRecipes(filters: ExploreFilters): Promise<ExternalSearchResult>;
```
Behavior: in-memory `Map` cache (15-min TTL, key = `source:JSON.stringify(filters)`),
`PAGE_SIZE = 24`, and a try/catch that **always falls back to `localSearch`** on
any remote error. So with no keys the explore feed is 100% offline/local.

Remote **image URLs** referenced by data: `RECIPE_IMAGES.src` →
`upload.wikimedia.org`; `RECIPE_PHOTO_MAP` values → assorted CDN/blog/Wikimedia
hosts; `ExternalRecipe.image` → `source.unsplash.com` placeholders (swapped out
by `resolveRecipeImage`). These are runtime `<img>`/network fetches, not part of
the data module's own logic.

---

## 8. Browser / Next-only couplings (and RN adaptations)

The **pure data + resolver files are fully portable** — no couplings. Couplings
live only in the *consumers* and the explore sibling:

| Coupling | Where | RN problem | Adaptation |
| --- | --- | --- | --- |
| `"use client"` | `exploreService.ts`, `RecipeImage.tsx` | No-op directive in RN | Delete; meaningless in Expo. |
| `<img src=… loading="lazy" onError>` | `RecipeImage.tsx` | No DOM `<img>` | Rebuild with RN `<Image>` (or `expo-image`); use `onError`/`onLoadEnd`; lazy-load is automatic in `FlatList`. |
| CSS `linear-gradient(...)` string from `getCuisineGradient` | `foodPhotos.ts` returns a **CSS string** | RN has no CSS gradients | Keep the **color pair** data; change return to `[colorA, colorB]` (or add a `getCuisineGradientColors()` sibling) and render with `expo-linear-gradient` `<LinearGradient colors={[a,b]}>`. The web `linear-gradient(135deg,…)` ↔ RN `start/end` props. |
| `recipe.accentColor` = Tailwind class (`"bg-amber-100"`), `from-` swap | `RecipeImage.tsx` fallback | No Tailwind/`bg-*` classes in RN | Map `accentColor` token → hex via a small lookup (or via NativeWind if adopted). Emoji renders fine in RN `<Text>`. |
| `process.env.NEXT_PUBLIC_*` | `exploreService.ts` | Different env mechanism | Use Expo public env (`process.env.EXPO_PUBLIC_*` / `expo-constants` `extra`). Rename keys or add an env shim. |
| `next/link`, `next/image` | various consumers (not data files) | Not in RN | `expo-router` `<Link>` / `Pressable` + nav; `expo-image`. |
| Static `output: "export"` / static `/recipes/[id]` pages | Next build | N/A in RN | RN navigates by id in-memory via `RECIPE_MAP.get(id)` — no static generation needed; this actually *simplifies* the port. |
| `fetch` to TheMealDB/Spoonacular/Edamam | `exploreService.ts` | `fetch` exists in RN | Works as-is. Only watch CORS-free (RN has no CORS) and key handling. Spoonacular/Edamam keys exposed in client are already an existing concern; consider proxying. |
| `console.warn` | `exploreService.ts` | Fine in RN | No change. |

**No** usage of `localStorage`, `window`, `document`, `navigator`, `FileReader`,
`SpeechRecognition`, or blobs anywhere in the recipe-data subsystem itself.

---

## 9. RN port plan

### Moves into the shared package UNCHANGED (pure TS, zero platform deps)
- All data arrays/maps: `RECIPES`, `RECIPE_MAP`, `AIR_FRYER_RECIPES`,
  `MICROWAVE_RECIPES`, `MACRO_RECIPES`, `MACRO_RECIPE_MAP`, `GLOBAL_RECIPES` (+
  all 31 region files), `EXPLORE_RECIPES`, all 101 `BATCH_NNN`.
- Type modules: `src/lib/types.ts`, `src/lib/externalTypes.ts`.
- Image lookup tables + pure resolvers: `RECIPE_IMAGES`, `getRecipeImage`,
  `RECIPE_PHOTO_MAP`, `resolveRecipeImage`.
- Build-time ledgers (optional to ship): `manifest.ts`, `plan.ts` (only needed
  by data-gen scripts; can stay in a tools-only dir).
- The `@/` path alias must be replicated (tsconfig `paths`) or imports rewritten
  to package-relative.

### Needs a thin platform adapter
- `getCuisineGradient` — split logic: keep a pure `getCuisineGradientColors(cuisine): [string,string]` in shared; web wraps it into a CSS string, RN feeds it to `<LinearGradient>`. (Web's current string-return API can be a thin web-only wrapper.)
- `accentColor` token → color: add a shared `accentColorToHex(token)` map so both
  platforms resolve `"bg-amber-100"` consistently (web keeps Tailwind class; RN
  uses hex).
- Env access in `exploreService` — wrap `getExploreSource()`'s env reads behind a
  tiny `getEnv()` shim (`NEXT_PUBLIC_*` on web, `EXPO_PUBLIC_*` on native).

### Must be rebuilt natively (per platform)
- `RecipeImage` component — rebuild as a RN component using `expo-image`
  + `expo-linear-gradient` + an emoji `<Text>` fallback. Reuse the resolver
    functions verbatim; only the rendering differs.
- Any `next/link` / `next/image` / page-routing in consumers → `expo-router`.
- `exploreService` itself is portable (`fetch` works), but the remote API-key
  exposure should be reconsidered (proxy through the existing Cloudflare Worker
  rather than embedding keys in the mobile bundle).

### Recommended shared-package layout
```
packages/recipe-data/
  types.ts                 (← src/lib/types.ts)
  externalTypes.ts         (← src/lib/externalTypes.ts)
  recipes.ts, airFryerRecipes.ts, microwaveRecipes.ts
  exploreRecipes.ts
  globalRecipes/ (index + 31 regions)
  macroRecipes/  (index + 101 batches; manifest/plan in tools-only)
  recipeImages.ts          (data + getRecipeImage)
  recipePhotoMap.ts
  foodPhotos.ts            (resolveRecipeImage + getCuisineGradientColors)
```
Web app and Expo app both import from `@waivy/recipe-data`. Platform-specific
rendering (`RecipeImage`, gradients, links) stays in each app.

---

## 10. Quick-reference: resolving an image for a recipe id

```
Canonical Recipe (RECIPES / MACRO_RECIPES):
  getRecipeImage(id) → RecipeImage | undefined
    undefined → emoji + gradient(accentColor) fallback

ExternalRecipe (GLOBAL_RECIPES / EXPLORE_RECIPES / explore feed):
  resolveRecipeImage(recipe):
    recipe.image not source.unsplash.com → recipe.image
    else RECIPE_PHOTO_MAP[recipe.id] ?? null
    null → getCuisineGradient(recipe.cuisine) gradient fallback
```
