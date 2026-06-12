# Subsystem 13 — Explore, Recipe Detail, Guided Cooking

Engineering brief for porting the Waivy Next.js web subsystem to an Expo React Native iPhone app that **shares** this logic. Target: extract pure logic + types into a shared package, leave a thin platform adapter for storage/network/env, rebuild only the view layer natively.

Covers:
- `src/app/explore/page.tsx` (+ `layout.tsx`)
- `src/lib/adapters/{edamam,spoonacular,themealdb}.ts`
- `src/lib/services/exploreService.ts`
- `src/lib/externalTypes.ts`
- `src/app/recipes/[id]/page.tsx`
- `src/app/recipes/custom/page.tsx`
- `src/components/recipe/*` (8 files)
- Supporting libs touched by the above: `foodPhotos`, `customRecipeStorage`, `customRecipeTypes`, `workerClient`, `anthropic`, `chatbot`, `AppStore`, `storage`, `userProgress`, `haptics`, `equipmentFilters`, `types`.

---

## 0. TL;DR architecture

- **Explore** is a fully **client-side search engine.** Default data source is the **local bundled recipe library** (`GLOBAL_RECIPES` + `EXPLORE_RECIPES`), no key needed. Optional live sources (TheMealDB keyless, Spoonacular/Edamam keyed) are selected by `NEXT_PUBLIC_EXPLORE_SOURCE` env. All search/sort/filter/paginate logic is pure TS → moves to shared package unchanged.
- **Recipe detail** (`/recipes/[id]`) is a **static** page generated from the bundled `RECIPES` array. Rendering, guided cooking, pricing, nutrition, equipment notes are client components.
- **Custom/AI recipe detail** (`/recipes/custom?id=...`) reads a `localStorage`-backed `CustomRecipe`, can (re)generate an image via the Cloudflare Worker.
- **Guided cooking** ("Start cooking") is a self-contained client state machine: step paging + a per-step countdown timer auto-detected from step text. No network, no storage.
- **"Ask AI Chef" / Pesto chatbot** is a global floating widget. Its in-recipe brain (`chatRespond`) is **rule-based and local** (no AI call). A separate Haiku path (`anthropic.ts`) exists for AI Chef generation and a primed `pantryChat`, both browser-direct to Anthropic.

---

## 1. Core data shapes (copy verbatim into shared `@waivy/core`)

### 1.1 `src/lib/externalTypes.ts` — Explore types (the contract for Explore + adapters)

```ts
export type ExternalSource = "spoonacular" | "edamam" | "themealdb" | "mock" | "local";

export interface ExternalIngredient {
  name: string;
  amount: string | null;
  unit: string | null;
}

export interface ExternalSubstitution {
  ingredient: string;
  swap: string;
}

export interface ExternalRecipe {
  id: string;               // e.g. "spoonacular-716429" or "local-chana-masala"
  source: ExternalSource;
  sourceUrl: string;        // kept in data but never rendered in UI
  title: string;
  cuisine: string;
  image: string;
  mealType: string | null;
  totalTimeMinutes: number | null;
  servings: number | null;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  rating: number | null;    // 0–5
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
  cuisineId?: string;              // kebab-case e.g. "chinese"
  dishType?: string | null;
  region?: string;
  country?: string;
  estimatedCost?: number;          // USD per serving
  studentFriendlyScore?: number;   // 1–10
  spiceLevel?: number;             // 0–5
  proteinType?: string;            // "chicken" | "tofu" | "legumes" | ...
  equipmentNeeded?: string[];
  storageTips?: string;
  substitutions?: ExternalSubstitution[];
  flavorProfile?: string[];
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
  query: string;
  cuisine: string;
  region: string;
  diet: string;
  mealType: string;
  difficulty: string;
  maxTime: number | null;
  maxCost: number | null;
  spiceLevel: number | null;
  proteinType: string;
  studentMode: boolean;
  sort: "popular" | "rating" | "fastest" | "cheapest" | "easiest" | "score";
  page: number;
}
```

### 1.2 `src/lib/types.ts` — canonical local `Recipe` (used by `/recipes/[id]` + all recipe components)

Key exports (copy verbatim):

```ts
export type IngredientCategory = "grain"|"protein"|"vegetable"|"fruit"|"dairy"|"canned"|"condiment"|"spice"|"frozen"|"snack";
export type Equipment = "microwave"|"stovetop"|"oven"|"rice-cooker"|"air-fryer"|"no-kitchen";
export type DietTag = "vegetarian"|"vegan"|"high-protein"|"gluten-free"|"dairy-free";
export type MealType = "breakfast"|"lunch"|"dinner"|"snack"|"meal-prep";
export type Difficulty = "easy"|"medium"|"hard";
export type TimeBucket = "under-10"|"under-20"|"under-30"|"meal-prep";
export type HeatLevel = "low"|"medium-low"|"medium"|"medium-high"|"high"|"none";
export type FlavorBadge = "spicy"|"tangy"|"umami"|"garlicky"|"smoky"|"savory"|"creamy"|"crispy";

export interface RecipeIngredient { ingredientId: string; quantity: number; optional?: boolean; note?: string; }
export interface Substitution { forIngredientId: string; swap: string; savings?: string; }
export interface NutritionEstimate { calories: number; protein: number; carbs: number; fat: number; fiber?: number; }
export interface GuidedCookingStep { title: string; instruction: string; timerMinutes?: number; }

export interface RecipeInstructionStep {           // <-- DetailedSteps consumes this
  shortStep: string;
  detailedExplanation: string;
  timerMinutes?: number | null;
  heatLevel?: HeatLevel;
  textureCue?: string | null;
  tasteCue?: string | null;
  beginnerTip?: string | null;
  safetyNote?: string | null;
}

export interface RecipeImage {                     // curated photo metadata (NOT the component)
  src: string; alt: string; sourceName: string; sourceUrl: string;
  license: string; attributionRequired: boolean; attributionText?: string; verifiedMatch: boolean;
}

export interface Recipe {
  id: string; name: string; description: string; mealType: MealType; servings: number;
  ingredients: RecipeIngredient[]; steps: string[]; totalTimeMinutes: number;
  difficulty: Difficulty; equipment: Equipment[]; dietTags: DietTag[];
  cheapTips: string[]; substitutions: Substitution[];
  healthierTips?: string[]; batchPrepTips?: string[]; whatToBuyNext?: string[];
  estimatedNutrition: NutritionEstimate; emoji: string; accentColor: string;
  cuisine?: string; tags?: string[];
  prepTimeMinutes?: number; cookTimeMinutes?: number; dormFriendly?: boolean; mealPrepFriendly?: boolean;
  allergyTags?: string[]; whyCheap?: string; storageInstructions?: string; reheatingInstructions?: string;
  guidedCookingSteps?: GuidedCookingStep[]; optionalAddIns?: string[]; youtubeId?: string;
  primaryCookingMethod?: "stovetop"|"oven"|"rice-cooker"|"air-fryer"|"microwave"|"air-fryer-and-microwave"|"no-cook";
  noStovetopRequired?: boolean;
  crispinessLevel?: "soft"|"lightly crispy"|"crispy"|"extra crispy";
  microwaveTimeMinutes?: number; airFryerTimeMinutes?: number; airFryerTemperatureF?: number;
  detailedSteps?: RecipeInstructionStep[]; flavorExplanation?: string;
  seasoningUpgrades?: string[]; tasteTroubleshooting?: string[]; flavorBadges?: FlavorBadge[];
  variantGroup?: string; variantType?: "original"|"calorie-friendly"|"protein-friendly"; variantNote?: string;
}

export interface RecipeScoreResult {
  recipe: Recipe; costPerServing: number; totalCost: number;
  pantryMatched: number; pantryTotal: number;
  missingIngredients: RecipeIngredient[]; missingCost: number;
  matchPercent: number; score: number; reasons: string[];
}
// also: Ingredient, CheapFilters, PantryItem, GroceryItem (see file)
```

### 1.3 `src/lib/customRecipeTypes.ts` — AI/user recipe shape (used by `/recipes/custom`)

```ts
export interface CustomRecipeImage {
  src?: string;            // remote URL OR data: URL
  b64?: string;            // raw base64 (no data: prefix), stored separately
  alt: string; sourceName: string; license: string;
  isAIGenerated: boolean; isFallback: boolean;
  generatedPrompt?: string; generatedAt?: string; model?: string;
}
export interface CustomRecipeIngredient {
  name: string; quantity: number; unit: string; estimatedCost: number;
  userAlreadyHas?: boolean; optional?: boolean; category?: string;
}
export interface CustomRecipeStep { title?: string; instruction: string; timerMinutes?: number|null; safetyNote?: string|null; }

export interface BaseCustomRecipe {
  id: string; name: string; description: string;
  mealType: "breakfast"|"lunch"|"dinner"|"snack"|"meal-prep";
  cuisineStyle?: string; servings: number;
  prepTimeMinutes: number; cookTimeMinutes: number; totalTimeMinutes: number;
  difficulty: "very easy"|"easy"|"medium";
  equipment: string[]; primaryCookingMethod: string; noStovetopRequired: boolean;
  estimatedTotalCost: number; estimatedCostPerServing: number;
  ingredients: CustomRecipeIngredient[]; steps: string[];
  guidedCookingSteps?: CustomRecipeStep[]; cheapTips?: string[];
  substitutions?: Array<{ original: string; swap: string; why?: string; estimatedSavings?: number|null }>;
  makeItCheaper?: string[]; makeItHealthier?: string[]; makeItHigherProtein?: string[]; studentTips?: string[];
  storageInstructions?: string; reheatingInstructions?: string; safetyNotes?: string[];
  estimatedNutrition?: { calories: number; protein: number; carbs: number; fat: number; fiber?: number };
  tags?: string[]; image: CustomRecipeImage; createdAt: string; updatedAt: string;
}
export interface AIGeneratedRecipe extends BaseCustomRecipe {
  isAIGenerated: true; isUserCreated: false;
  userRequestSummary?: string; whyThisFits?: string;
  missingIngredients?: Array<{ name: string; estimatedCost: number; importance: "required"|"recommended"|"optional"; cheapSubstitute?: string|null }>;
  estimatedMissingIngredientCost?: number;
}
export interface UserCreatedRecipe extends BaseCustomRecipe { isAIGenerated: false; isUserCreated: true; notes?: string; }
export type CustomRecipe = AIGeneratedRecipe | UserCreatedRecipe;
export function isAIGenerated(r: CustomRecipe): r is AIGeneratedRecipe; // r.isAIGenerated === true
```

---

## 2. Explore API adapter contracts

All three adapters are **pure functions** (`raw any → ExternalRecipe`). They are source-specific normalizers. They move into the shared package unchanged; they do no I/O. The I/O lives in `exploreService.ts`.

### 2.1 Source selection — `getExploreSource()` (env-driven)

```ts
export function getExploreSource(): "spoonacular" | "edamam" | "themealdb" | "local";
```
Logic:
- `NEXT_PUBLIC_EXPLORE_SOURCE === "spoonacular"` AND `NEXT_PUBLIC_SPOONACULAR_API_KEY` set → `"spoonacular"`.
- `NEXT_PUBLIC_EXPLORE_SOURCE === "edamam"` AND both `NEXT_PUBLIC_EDAMAM_APP_ID` + `NEXT_PUBLIC_EDAMAM_APP_KEY` set → `"edamam"`.
- `NEXT_PUBLIC_EXPLORE_SOURCE === "themealdb"` → `"themealdb"` (keyless).
- Otherwise → `"local"` (default, bundled library, no key).

`PAGE_SIZE = 24`. In-memory cache `Map<string,{data,ts}>`, TTL 15 min, key = `${source}:${JSON.stringify(filters)}`.

### 2.2 `searchExternalRecipes(filters: ExploreFilters): Promise<ExternalSearchResult>` — the one entrypoint Explore UI calls

- Reads cache → dispatches to `localSearch` / `spoonacularSearch` / `edamamSearch` / `mealDBSearch`.
- **Any error falls back to `localSearch(filters)`** (so Explore never hard-fails). Logs `console.warn("[Explore] Error:", err)`.

### 2.3 TheMealDB — `normalizeMealDB(meal: any): ExternalRecipe`

Env keys: **none** (keyless public API).
Base URL: `https://www.themealdb.com/api/json/v1/1`.
Network endpoints used (all GET, no body):
| Purpose | URL |
|---|---|
| Text search | `/search.php?s=<query>` → `data.meals[]` |
| Filter by area (cuisine) | `/filter.php?a=<Area>` → stub meals (id+thumb only) |
| Filter by category | `/filter.php?c=<Category>` → stub meals |
| Hydrate full meal | `/lookup.php?i=<idMeal>` → `data.meals[0]` |

Flow: filter endpoints return stubs → `lookupMeals()` fans out up to **30** `/lookup.php` calls via `Promise.allSettled`, drops failures. `fetchAllCategories` rotates 2 categories per page. Caches meal arrays in a module `Map`.

Input shape (raw meal object): `strMeal`, `strArea`, `strCategory`, `strMealThumb`, `strInstructions`, `strSource`, `strTags`, `idMeal`, and `strIngredient1..20` / `strMeasure1..20`.
Normalizer output highlights: `id = themealdb-<idMeal>`, cuisine mapped via `AREA_CUISINE` table, ingredients harvested from the 20 numbered pairs, `instructions` = split `strInstructions` on newlines (keep lines >10 chars), `difficulty` derived from instruction count (≤4 Easy, ≤8 Medium else Hard). `servings`, `totalTimeMinutes`, all macros = `null`.

### 2.4 Spoonacular — `normalizeSpoonacular(raw: any): ExternalRecipe`

Env key: `NEXT_PUBLIC_SPOONACULAR_API_KEY` (required).
Endpoint (GET, no body):
```
https://api.spoonacular.com/recipes/complexSearch?<params>
```
Query params built in `spoonacularSearch`:
`apiKey`, `number=24`, `offset=(page-1)*24`, `addRecipeInformation=true`, `addRecipeNutrition=true`, optional `query`, `cuisine`, `diet`, `maxReadyTime`, and `sort` mapped: `rating→healthiness`, `fastest→time`, else `popularity`.
Response: `{ results[], offset, number, totalResults }`. `hasMore = offset+number < total`.
Normalizer input fields: `id`, `title`, `image`, `sourceUrl`, `cuisines[]`, `dishTypes[]`, `diets[]`, `spoonacularScore`, `readyInMinutes`, `servings`, `analyzedInstructions[].steps[].step`, `extendedIngredients[]{name,amount,unit}`, `nutrition.nutrients[]{name,amount}`.
Output highlights: `id = spoonacular-<id>`, `rating = round(score/20 *10)/10`, macros pulled by nutrient name (Calories/Protein/Carbohydrates/Fat), `difficulty` from `readyInMinutes` (≤20 Easy, ≤45 Medium else Hard).

### 2.5 Edamam — `normalizeEdamam(hit: any): ExternalRecipe`

Env keys: `NEXT_PUBLIC_EDAMAM_APP_ID` + `NEXT_PUBLIC_EDAMAM_APP_KEY` (both required).
Endpoint (GET, no body): `https://api.edamam.com/api/recipes/v2` with params `type=public`, `app_id`, `app_key`, `from`, `to=from+24`, optional `q`, `cuisineType`, `diet`, `time=1-<maxTime>`.
Response: `{ hits[], count, _links.next }`. `hasMore = !!data._links?.next`. Each item is `{ recipe: {...} }`.
Normalizer input (`hit.recipe`): `uri` (id parsed from `#recipe_`), `url`, `label`, `cuisineType[]`, `image`, `mealType[]`, `totalTime`, `yield`, `dietLabels[]`, `dishType[]`, `ingredientLines[]`, `calories`, `totalNutrients{PROCNT,CHOCDF,FAT}`.
Output: macros divided by `yield` (per-serving), `difficulty` from `totalTime` (≤20 Easy, ≤50 Medium else Hard). Ingredients are raw `ingredientLines` strings (amount/unit = null).

### 2.6 Local search — `localSearch(filters): ExternalSearchResult` (the default)

Pure function over `[...GLOBAL_RECIPES, ...EXPLORE_RECIPES]` (both arrays of `ExternalRecipe`, bundled in `src/data/`). Applies in order: text haystack search (title/cuisine/country/region/culturalNote/diets/tags/flavorProfile/ingredient names), then cuisine/region/diet/mealType/difficulty/maxTime/maxCost/spiceLevel/proteinType filters, then `studentMode` (keeps `studentFriendlyScore >= 7`). Sort modes: `fastest`/`cheapest`/`easiest`/`score`/`rating`/`popular(=insertion order)`. Paginate by `PAGE_SIZE=24`. `source: "local"`.

---

## 3. Explore page (`src/app/explore/page.tsx`)

Client component (`"use client"`). Self-contained; the only cross-module deps are `searchExternalRecipes`, `resolveRecipeImage`, `getCuisineGradient`, and presentational UI (`PageHeader`, `SkeletonRecipeGrid`, `AnimatedNumber`).

State & behavior:
- `filters: ExploreFilters` (defaults in `DEFAULT_FILTERS`), debounced text input (400ms), `recipes` accumulated across "Load more", `total`, `hasMore`, `loading`, `loadingMore`, `selected` (detail modal), `resultSource`.
- **Race guard:** monotonic `loadReqRef` request id — only the latest response is applied (prevents stale "ch" results overwriting "chicken").
- `isDemo = resultSource === "mock"` shows a demo banner; `resultSource === "themealdb"` shows a "Powered by TheMealDB" banner.
- Filter UI: cuisine chips (`CUISINES`), diet chips (`DIETS`), max-time chips (`TIMES`: 15/30/60), sort chips, Student Mode toggle, active-filter chip row.
- Tapping a card opens an in-page **`DetailPanel`** modal (not navigation) — renders the `ExternalRecipe` directly (ingredients, instructions, macros, cultural note). Escape closes (web only).

Image resolution helpers — `src/lib/foodPhotos.ts`:
```ts
export function resolveRecipeImage(recipe: ExternalRecipe): string | null;
// returns recipe.image unless it's a source.unsplash.com URL; then RECIPE_PHOTO_MAP[id] ?? null
export function getCuisineGradient(cuisine: string): string;
// returns a CSS "linear-gradient(135deg, c1, c2)" string keyed by cuisine, with partial + hash fallback
```
`RECIPE_PHOTO_MAP` (`src/data/recipePhotoMap.ts`) is `Record<string,string>` (recipeId → dish photo URL), ~802 entries.

---

## 4. Recipe detail screen — sections (`/recipes/[id]` → `RecipeDetailClient`)

### 4.1 Routing
- `src/app/recipes/[id]/page.tsx` — **server component**, `generateStaticParams()` from `RECIPES`, `generateMetadata()` from `RECIPE_MAP`, `notFound()` if id missing, renders `<RecipeDetailClient recipe={recipe} />`.
- `RECIPES` / `RECIPE_MAP` exported from `src/data/recipes.ts` (`Recipe[]` and `Map<string,Recipe>`).

### 4.2 `RecipeDetailClient` sections (top → bottom)
1. Back-link (resolves from `?from=` param via `BACK_LINKS` map: `nourish-recipes|cheap|saved|pantry|explore|home`, default cheap-recipes).
2. **Header** — eyebrow, name, description, badges (cost/serving via `calculateCostPerServing`, time, difficulty, servings, dietTags), `<EquipmentBadges>`.
3. **Action buttons** — `Start cooking` (enters guided mode), `Save recipe` (toggles store + `bumpProgress("recipesSaved")` milestone toast), `Add N missing items to grocery` (when pantry-missing > 0 → `addGroceryItems` + `bumpProgress("groceryItemsAdded")`).
4. `<LogRecipeButton>` (Nourish log).
5. **Hero image** — `<RecipeImage variant="hero" showAttribution>`.
6. **YouTube embed** (if `recipe.youtubeId`) — `<iframe>` to `youtube.com/embed/<id>`.
7. **Cost breakdown** card — `ingredientCostBreakdown`, `quoteRecipe`, editable rows (`IngredientPriceRow`), AI reprice button. `priceRev` state forces re-quote on edit.
8. **Steps** card — numbered `recipe.steps[]`.
9. **`<DetailedSteps>`** (if `recipe.detailedSteps?.length`) — beginner long-form steps.
10. `flavorExplanation`, `seasoningUpgrades`, `tasteTroubleshooting` cards (conditional).
11. **`<CookingMethodCard>`** — air-fryer / microwave equipment notes (conditional).
12. Grid: `cheapTips`, `substitutions` (cheap swaps), `healthierTips`, `batchPrepTips`.
13. `whatToBuyNext` card.
14. **Nutrition** card — `bestEffortNutrition(recipe)`, `isHighProtein()` badge, confidence label.

### 4.3 Recipe sub-components

`CookingMethodCard({ recipe })` — shows air-fryer and/or microwave tip sections based on `isAirFryerRecipe`/`isMicrowaveRecipe`. Returns null when neither. Reads `airFryerTemperatureF`, `airFryerTimeMinutes`, `crispinessLevel`, `microwaveTimeMinutes`.

`DetailedSteps({ steps: RecipeInstructionStep[] })` — renders each step's `shortStep`, `detailedExplanation`, and badge chips for `heatLevel` (via `HEAT_LABEL`), `timerMinutes`, `textureCue`, `tasteCue`, `beginnerTip`, `safetyNote`.

`EquipmentBadges({ recipe })` — Air fryer / Microwave / No stove / Crispy / Nmin / Meal prep badges via `equipmentFilters`.

`RecipeImage({ recipe, variant?, className?, overlay?, showAttribution? })` — curated photo from `getRecipeImage(recipe.id)` (`RECIPE_IMAGES` in `src/data/recipeImages.ts`) with gradient+emoji fallback; resets error state on `recipe.id` change.

`RecipeCard({ result?, recipe?, highlight?, from? })` — grid card (also used on home/cheap/saved/pantry/explore). Wraps a `next/link` to `/recipes/<id>?from=<from>`. Save button, pantry match %, cost+time overlay, nutrition row, tag chips, missing-ingredient callout. Uses `motion/react` for hover/tap spring.

`RecipeGrid({ results?, recipes?, emptyTitle?, emptyDescription?, emptyAction?, from? })` — staggered `motion/react` grid of `RecipeCard`, `EmptyState` when empty.

`RecipeStatsRow({ costPerServing?, totalTimeMinutes?, calories?, protein?, carbs?, servings? })` — pure presentational color-coded stat pills (used on AI Chef results). No deps beyond lucide icons.

`equipmentFilters.ts` exports (pure):
```ts
export type EquipmentProfile = "any"|"microwave-only"|"air-fryer-only"|"microwave-and-air-fryer"|"no-stovetop";
export function profileEquipment(profile: EquipmentProfile): Equipment[];
export function recipeFitsEquipment(recipe: Recipe, allowed: Equipment[]): boolean;
export function isAirFryerRecipe(recipe: Recipe): boolean;
export function isMicrowaveRecipe(recipe: Recipe): boolean;
export function isNoStoveRecipe(recipe: Recipe): boolean;
```

---

## 5. GUIDED COOKING mode (the `CookingMode` component inside `RecipeDetailClient.tsx`)

Triggered by `setCookingMode(true)` from the "Start cooking" button. Fully self-contained client state machine — **no network, no storage, no AppStore**. Pure inputs: `recipe.name`, `recipe.steps[]`.

State machine:
- `step: number` (current index), `timerSeconds: number | null`.
- `total = recipe.steps.length`; renders an "empty steps" guard screen when `total === 0`.
- Progress bar width = `((step+1)/total)*100`%.
- Each render: big step heading = `recipe.steps[step]`.
- **Timer auto-detect:** `detectMinutes(text)` regex `/(\d+)\s*(min|minute|minutes)/i` on the current step text. If a number is found and no timer running, shows a "Start N min timer" button.
- Nav: `Previous` / `Next step` (clamps; resets `timerSeconds = null` on every move), `Done cooking` on last step (calls `onExit`).

`CountdownTimer({ seconds, onDone })`:
- Local `remaining` state, ticks down with `setTimeout(…, 1000)` per second.
- `onDoneRef` keeps latest callback; `firedRef` guards single-fire on reach-zero. Restarts cleanly when `seconds` prop changes.
- Renders `mm:ss` (monospace) + a "Stop" button (fires `onDone`).

> RN port note: the timer fires `onDone` when the screen is foregrounded and ticking. There is **no background timer / no notification** — on iOS the JS timer pauses when backgrounded. To match user expectation natively you'll want a local notification (see §8).

The recipe type also carries a richer `guidedCookingSteps?: GuidedCookingStep[]` ( `{ title, instruction, timerMinutes? }` ) and custom recipes carry `CustomRecipeStep[]`, but the current web `CookingMode` only walks the flat `steps: string[]`. The structured timer field is available if the native guided UI wants explicit timers instead of regex detection.

---

## 6. Chatbot / "Ask AI Chef" wiring

There are **two distinct AI surfaces**; do not conflate them.

### 6.1 Pesto floating chatbot (`src/components/layout/Chatbot.tsx`) — the in-app "Ask" widget

- Global floating button (hidden while a text input/textarea is focused via `focusin`/`focusout` listeners — to avoid covering the mobile keyboard). Escape closes. Opens a panel with starter prompts.
- **Its responses are RULE-BASED and LOCAL** — `chatRespond(message, { pantry, savedRecipeIds })` from `src/lib/chatbot.ts`. **No network call.** It pattern-matches intent (greeting / help / saved / pantry / protein / quick / cheap / fallback), ranks bundled `RECIPES` via `recipeScoring`, and returns:
  ```ts
  export interface ChatContext { pantry: PantryItem[]; savedRecipeIds: string[]; }
  export interface ChatReply { message: string; recipeIds?: string[]; }
  export function chatRespond(message: string, context: ChatContext): ChatReply;
  ```
- Local `ChatMessage` view type: `{ id, role: "assistant"|"user", content, recipeIds? }`.
- When a reply has `recipeIds`, the bubble renders `next/link` cards to `/recipes/<id>` using `RECIPE_MAP` + `calculateCostPerServing`.
- A tiny `renderMarkdown` supports `**bold**` only.
- **How it's "wired into a recipe":** indirectly — it surfaces recipe cards that deep-link into `/recipes/[id]`. It does not receive a specific recipe context. The Explore empty-state also links to `/ai-chef` ("Ask AI Chef").

### 6.2 Real AI paths (`src/lib/anthropic.ts` + `src/lib/workerClient.ts`)

These power AI Chef generation + image gen (used by `/recipes/custom` for image regenerate), not the Pesto chat bubble.

**Anthropic (browser-direct, Haiku)** — `src/lib/anthropic.ts`:
- `const MODEL = "claude-haiku-4-5-20251001"`, `API_URL = "https://api.anthropic.com/v1/messages"`, key = `NEXT_PUBLIC_ANTHROPIC_API_KEY`.
- POST with headers `x-api-key`, `anthropic-version: 2023-06-01`, **`anthropic-dangerous-direct-browser-access: true`**, body `{ model, max_tokens, temperature, system, messages }`. 30s `AbortController` timeout.
- Exports: `isAiEnabled()`, `recognizeIngredientsFromImage(b64, mediaType)`, `recognizeIngredientsFromReceipt(...)`, `recognizeIngredientsFromText(transcript)` → all return `VisionResult { recognized: {id,name,confidence}[]; unrecognized: string[]; raw }`; `generateRecipeQuick(HaikuRecipeInput): GeneratedRecipe`; `generateRecipeQuickOptions(...): GeneratedRecipeOptionSet` (4 parallel Haiku calls); `pantryChat(pantryDescription, history: {role,content}[]): Promise<string>` (a primed Pesto-persona chat — **not currently used by the floating Chatbot, which is rule-based**).

**Cloudflare Worker proxy (OpenAI never hits browser)** — `src/lib/workerClient.ts`:
- Base = `NEXT_PUBLIC_WORKER_URL` (trailing slash stripped). `isWorkerConfigured()`, `workerUrl()`.
- `postJson<T>(path, body)` — POST JSON, 60s timeout, translates 429/non-OK into friendly errors.
- Endpoints + request/response contracts (all POST JSON to `${WORKER_URL}<path>`):

| Function | Path | Request body | Response |
|---|---|---|---|
| `resolveIngredients` | `/ingredients/resolve` | `{ rawInput, inputSource }` | `ResolveResult` |
| `enrichIngredient` | `/ingredients/enrich` | `{ name }` | `EnrichResult` |
| `matchIngredient` | `/ingredients/match` | `{ pantry, required }` | `MatchResult` |
| `generateRecipe` | `/generate-recipe` | `GenerateRecipeInput` | `GeneratedRecipe` |
| `generateRecipeOptions` | `/generate-recipe-options` | `GenerateOptionsInput` | `GeneratedRecipeOptionSet` |
| **`generateRecipeImage`** | `/generate-recipe-image` | `{ recipeName?, prompt?, ingredients?, method? }` | `GenerateImageResult` |
| `importRecipeUrl` | `/recipes/import-url` | `{ url, ingredients?, … }` | `ImportRecipeResult` |
| `importRecipeText` | `/recipes/import-text` | `{ text, sourceUrl?, … }` | `ImportRecipeResult` |
| `webSearchRecipes` | `/recipes/web-search` | `{ ingredients?, cravings?, … }` | `{ candidates: WebRecipeCandidate[] }` |
| `estimateIngredientPrice` | `/pricing/estimate-ingredient` | `{ ingredientName, recipeQuantity?, recipeUnit?, location?, preferBudgetStores? }` | `EstimateIngredientResult` |
| `remixRecipe` | `/recipes/remix` | `{ baseRecipe, userRequest, … }` | `GeneratedRecipe` |

`GenerateImageResult` (used by `/recipes/custom`):
```ts
export interface GenerateImageResult { b64_json?: string; url?: string; prompt: string; model: string; }
```
(See `workerClient.ts` for full `GeneratedRecipe`, `GeneratedRecipeOptionSet`, `ResolvedIngredient`, `AIGroceryPriceEstimate`, etc. — large but all plain JSON, portable.)

---

## 7. Custom / AI recipe detail (`src/app/recipes/custom/page.tsx`)

- Client component, reads `?id=` via `useSearchParams`, loads `getCustomRecipe(id)` from localStorage.
- Image source: `recipe.image.src` → else `getStoredRecipeImage(id)` (b64) → `imageDataUrl(b64)`.
- **Generate/Regenerate image:** calls `generateRecipeImage({ recipeName, ingredients[0..8], method })` (Worker), stores b64 via `storeRecipeImage`, persists `recipe.image` via `saveCustomRecipe`. Friendly error mapping for OpenAI org-verification (403/401).
- Sections: hero image, badges, ingredients (with per-item cost), steps, nutrition, cheap tips, storage/reheating. Save toggle via `useAppStore`.

`customRecipeStorage.ts` exports:
```ts
makeCustomRecipeId(name, "gen"|"user"): string
getCustomRecipes(): CustomRecipe[]
getCustomRecipe(id): CustomRecipe | undefined
saveCustomRecipe(r): CustomRecipe
deleteCustomRecipe(id): void
storeRecipeImage(recipeId, b64, meta?): { ok: boolean; reason?: string }
getStoredRecipeImage(id): StoredImage | undefined         // {id,b64,prompt?,model?,storedAt,bytes}
deleteRecipeImage(id): void
imageDataUrl(b64, mediaType="image/png"): string
fallbackImageMeta(): CustomRecipeImage
emptyUserRecipe(): UserCreatedRecipe
isAIRecipe(r): r is AIGeneratedRecipe
```

---

## 8. localStorage keys touched (exact strings + stored value shapes)

> The `srf:` prefix is **legacy** (pre-Waivy "Student Recipe Finder"). Per project rule, never rename — renaming wipes existing user data. In RN these become AsyncStorage keys (string→string JSON), and the prefix should be preserved if migrating existing web users; for a fresh app it can stay for consistency.

| Key (exact) | Written by | Stored value shape |
|---|---|---|
| `srf:pantry` | `storage.setPantry` (`storage.ts`) | `PantryItem[]` = `{ ingredientId: string; quantity?: number; useSoon?: boolean }[]` |
| `srf:grocery` | `storage.setGrocery` | `GroceryItem[]` = `{ ingredientId; quantity; recipeIds: string[]; checked: boolean }[]` |
| `srf:saved` | `storage.setSaved` | `string[]` (recipe ids) |
| `srf:custom-recipes` | `customRecipeStorage` (`RECIPES_KEY`) | `CustomRecipe[]` |
| `srf:custom-recipe-images` | `customRecipeStorage` (`IMAGES_KEY`) | `Record<string, StoredImage>` where `StoredImage = { id; b64; prompt?; model?; storedAt; bytes }`. Caps: 1.5 MB/image, 6 MB total (LRU evict by `storedAt`). |
| `srf:custom-ingredients` | (read in `AppStore.ingredientName`) | `Array<{ id; displayName?; canonicalName? }>` |
| `srf:user-progress` | `userProgress.ts` (`KEY`) | `UserProgress = { pantryItemsAdded; recipesGenerated; recipesSaved; mealsLogged; groceryItemsAdded; useSoonIngredientsUsed }` |
| `srf:haptics-enabled` | `haptics.ts` | `"true"` \| `"false"` (raw string, default enabled when absent) |

All readers use a `safeRead` guard `typeof window === "undefined"` + try/catch. In RN, `window` is undefined-safe-checked but AsyncStorage is **async** — see port plan.

`userProgress` contract (drives save/grocery milestone toasts on recipe detail):
```ts
getUserProgress(): UserProgress
bumpProgress(key: keyof UserProgress, by=1): number
milestoneMessage(key, count): string | null   // crosses 1,5,10,25,50,100,250,500
```

---

## 9. Network / request-response contracts (consolidated)

All requests are client-side `fetch`. No cookies/auth beyond API keys in query string or headers.

1. **TheMealDB** (keyless, GET): `https://www.themealdb.com/api/json/v1/1/{search.php?s=|filter.php?a=|filter.php?c=|lookup.php?i=}`.
2. **Spoonacular** (key in query, GET): `https://api.spoonacular.com/recipes/complexSearch?apiKey=…&number=24&offset=…&addRecipeInformation=true&addRecipeNutrition=true[&query&cuisine&diet&maxReadyTime]&sort=…`.
3. **Edamam** (key in query, GET): `https://api.edamam.com/api/recipes/v2?type=public&app_id=…&app_key=…&from=…&to=…[&q&cuisineType&diet&time]`.
4. **Anthropic** (key in header, POST): `https://api.anthropic.com/v1/messages` — header `anthropic-dangerous-direct-browser-access: true`; body `{ model, max_tokens, temperature, system, messages }`.
5. **Cloudflare Worker** (POST JSON): `${NEXT_PUBLIC_WORKER_URL}<path>` — see §6.2 table. The one used by this subsystem is `/generate-recipe-image`.
6. **Images:** recipe photos are plain `<img src>` to Wikimedia / various CDNs / Unsplash. No API.

Env vars (all `NEXT_PUBLIC_*`, build-time inlined; **assume any can be missing** and degrade gracefully):
`NEXT_PUBLIC_EXPLORE_SOURCE`, `NEXT_PUBLIC_SPOONACULAR_API_KEY`, `NEXT_PUBLIC_EDAMAM_APP_ID`, `NEXT_PUBLIC_EDAMAM_APP_KEY`, `NEXT_PUBLIC_ANTHROPIC_API_KEY`, `NEXT_PUBLIC_WORKER_URL`, (`NEXT_PUBLIC_USDA_API_KEY` used elsewhere).

---

## 10. Browser / Next-only couplings that WON'T work in React Native (+ adaptation)

| Coupling | Where | RN adaptation |
|---|---|---|
| `"use client"` directive | every component | Delete — RN has no server/client split. |
| `next/link` (`<Link href>`) | RecipeCard, RecipeGrid, Chatbot, explore, custom page | Replace with React Navigation / Expo Router `<Link>` / `navigation.navigate`. |
| `next/navigation` (`useSearchParams`, `notFound`, `generateStaticParams`, `generateMetadata`) | `[id]/page`, custom page, RecipeDetailClient | Route params from navigation; static-params/metadata are Next build concepts — drop; do `if (!recipe) return <NotFound/>`. |
| `next/image` `remotePatterns`, `images.unoptimized` | next.config | N/A; use RN `<Image>` / `expo-image`. |
| `process.env.NEXT_PUBLIC_*` | exploreService, anthropic, workerClient | Use `expo-constants` (`Constants.expoConfig.extra`) or `react-native-dotenv` / `EXPO_PUBLIC_*`. Wrap in a single `env` module so shared code imports from one place. |
| `localStorage` (sync) | storage, customRecipeStorage, userProgress, haptics, AppStore | **AsyncStorage (async)** or `expo-secure-store`/MMKV (sync). Storage helpers are currently sync; either move to MMKV (drop-in sync) or make helpers async and adjust `AppStore` hydration (already effect-based, so async is fine). `safeRead`/`safeWrite` get one platform impl. |
| `window`, `document`, `KeyboardEvent`, `document.addEventListener("keydown"/"focusin")` | DetailPanel/Chatbot Escape + keyboard-hide | No DOM. Drop Escape handlers (use modal swipe-down / back). Replace focus-hide-button logic with `Keyboard.addListener('keyboardDidShow'/'Hide')`. |
| `navigator.vibrate` (Vibration API) | haptics.ts | Swap to `expo-haptics` (`Haptics.impactAsync`, `notificationAsync`). iOS has no Web Vibration API, so this is currently a no-op on iOS web anyway — native gives REAL haptics. |
| `fetch` + `AbortController` + timeout | anthropic, workerClient, exploreService | `fetch` + `AbortController` work in RN (Hermes). Keep. |
| Image as base64 `data:` URL (`imageDataUrl`) | custom page, image storage | RN `<Image source={{uri: 'data:image/png;base64,...'}}>` works. Large b64 in AsyncStorage is heavy — prefer writing to `expo-file-system` and storing the file URI instead of inline b64. |
| `<img onError>` fallback, `<iframe>` YouTube embed | RecipeImage, ExploreCard, RecipeDetailClient | `<Image onError>` exists. YouTube `<iframe>` → `react-native-youtube-iframe` or `WebView`. |
| Tailwind classNames / CSS gradients / `linear-gradient(...)` string from `getCuisineGradient` | everywhere + foodPhotos | No Tailwind in RN. Rebuild styles (NativeWind can keep class names, or StyleSheet). `getCuisineGradient` returns a CSS string — instead expose the `[c1,c2]` color pair and feed `expo-linear-gradient`. Recommend adding `getCuisineGradientColors(cuisine): [string,string]` to share the lookup table, keep CSS-string variant web-only. |
| `motion/react` (Framer Motion) | RecipeCard, RecipeGrid | Replace with `react-native-reanimated` / `moti`. |
| `lucide-react` | all components | `lucide-react-native`. |
| CSS keyframe animations (`animate-[fadeUp…]`), `backdrop-blur`, `env(safe-area-inset-bottom)`, `dvh` | many | Reanimated + `react-native-safe-area-context`; blur via `expo-blur`. |
| `Math.round((b64.length*3)/4)` byte math | customRecipeStorage | Pure — keep. |

---

## 11. RN port plan

### Moves into shared package UNCHANGED (pure TS, no platform deps)
- `src/lib/externalTypes.ts`, `src/lib/types.ts`, `src/lib/customRecipeTypes.ts` — all type defs.
- `src/lib/adapters/{edamam,spoonacular,themealdb}.ts` — pure normalizers.
- `src/lib/equipmentFilters.ts` — pure predicates.
- `src/lib/chatbot.ts` — rule-based responder (depends only on bundled data + scoring).
- Bundled data: `src/data/recipes.ts`, `globalRecipes/*`, `exploreRecipes.ts`, `recipeImages.ts`, `recipePhotoMap.ts`, `ingredients.ts` (consumed by scoring/chat/anthropic catalog).
- `userProgress.ts` milestone logic (the storage I/O part needs the adapter — see below).
- `foodPhotos.ts` lookup table + `resolveRecipeImage` (pure); split the CSS-string emitter from the color-pair lookup.

### Needs a THIN platform adapter (one interface, two impls)
- **Storage** (`storage.ts`, `customRecipeStorage.ts`, `userProgress.ts`, `haptics.ts` flag): define a `KeyValueStore` interface (`get/set/remove`, sync via MMKV or async via AsyncStorage). All `srf:*` keys + value shapes are stable — preserve exactly. `AppStore` already hydrates in an effect, so an async store fits with minimal change.
- **Env** (`exploreService.getExploreSource`, `anthropic` key, `workerClient` URL): single `env.ts` reading `EXPO_PUBLIC_*` / `expo-constants` on native, `process.env.NEXT_PUBLIC_*` on web.
- **Network**: `searchExternalRecipes` + adapters' I/O and `workerClient.postJson` / `anthropic.callAnthropic` use standard `fetch`+`AbortController` — work as-is in RN; just route env through the env adapter. The in-memory caches (`Map`) work unchanged.
- **Haptics**: swap the `navigator.vibrate` fire() for `expo-haptics`, keep the enabled-flag + pattern API surface.
- **Image storage**: keep `storeRecipeImage` API but back it with `expo-file-system` (store file URI) rather than inline b64 in KV, to avoid bloating AsyncStorage.
- **AppStore** (`AppStore.tsx`): the Context + reducer logic is portable; only the `storage` calls and `"use client"` change. Keep `AppStoreProvider`/`useAppStore` API identical so components don't change.

### Must be REBUILT natively (view layer / platform UI)
- `src/app/explore/page.tsx` — rebuild as a screen. **Reuse all logic** (`searchExternalRecipes`, debounce, race-guard `loadReqRef`, filter state, `DEFAULT_FILTERS`). Rebuild: search bar, chip filters, card grid (`FlatList`), and the `DetailPanel` as a native modal/bottom-sheet.
- All `src/components/recipe/*` — rebuild presentational markup (Tailwind → RN styles), keep the prop contracts and the helper calls identical. `RecipeCard`/`RecipeGrid` motion → Reanimated.
- `RecipeDetailClient` — rebuild the scroll view + section list. **`CookingMode` + `CountdownTimer` logic is portable** (pure React state/effects); only the JSX + the timer's foreground/notification behavior need native treatment (add `expo-notifications` local notification so the timer survives backgrounding).
- `/recipes/custom` screen — rebuild markup; reuse `customRecipeStorage` + `generateRecipeImage`.
- **Pesto Chatbot** — rebuild as a native floating button + modal. Keep `chatRespond` (local) unchanged. Replace `focusin`/`focusout` keyboard-hide with `Keyboard` listeners; replace Escape with swipe/back; `next/link` recipe cards → navigation.
- YouTube embed → `react-native-youtube-iframe`.

### Open decisions for the native team
1. **Timer backgrounding** — web timer pauses when app is backgrounded. Add `expo-notifications` scheduled local notification for guided-cooking timers (recommended).
2. **Inline base64 images** — move to file system to avoid AsyncStorage size limits (~6 MB cap logic already exists; native file storage removes the constraint).
3. **Keep `srf:` storage prefix** if you intend to migrate existing web users to the same backend; otherwise irrelevant for a fresh install. Either way, keep the value shapes byte-compatible if any sync/export feature is planned.
4. **AI keys on-device** — `NEXT_PUBLIC_ANTHROPIC_API_KEY` shipped to the browser is already a known trade-off; on a published iOS app an embedded key is extractable. Consider routing Anthropic calls through the Worker too for the mobile build.
