# Mobile Port Brief — 01: Core Types & Domain Model

**Scope:** the canonical domain model shared by the entire Waivy app.

**Files covered (read fully):**
- `src/lib/types.ts` — built-in seed `Recipe` model + pantry/grocery/filter/scoring types
- `src/lib/customRecipeTypes.ts` — AI-generated & user-created recipe model
- `src/lib/externalTypes.ts` — external-API / global-dataset recipe model
- `src/lib/nourish/types.ts` — Nourish (nutrition tracking) model + 2 pure helpers

**Headline:** All four files are **pure TypeScript type declarations plus 3 pure helper functions** (`isAIGenerated`, `entryTotals`, `sumTotals`). They contain **zero** browser/Next-only couplings — no `window`, no `localStorage`, no `'use client'`, no DOM, no `fetch`, no `next/*`. They are **100% portable to React Native unchanged** and belong in the shared package verbatim. The couplings only appear in the *consumers* of these types (storage/USDA/adapter modules), summarized at the end so the shared boundary is clear.

---

## 1. `src/lib/types.ts` — Seed Recipe domain model

This is the canonical shape for built-in seed recipes. Per project rules (`CLAUDE.md` §10/§14): the field list must not break; UI reads `estimatedNutrition`, `equipment`, `dietTags`, `accentColor`, `emoji`, `totalTimeMinutes` directly; recipe IDs are stable.

### Exported union/string types (no runtime values)
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

export type HeatLevel =
  | "low" | "medium-low" | "medium" | "medium-high" | "high" | "none";

export type FlavorBadge =
  | "spicy" | "tangy" | "umami" | "garlicky" | "smoky" | "savory" | "creamy" | "crispy";
```

### Exported interfaces (verbatim)
```ts
export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  estimatedUnitCost: number; // cost per `unit`
  unit: string; // "cup", "tbsp", "egg", "oz", "clove", "slice"
  commonPackageSize?: string;
  shelfLifeDays?: number;
  tags?: string[];
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number; // in `unit` matching the ingredient's unit
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
  accentColor: string;  // tailwind bg class  ⚠ see RN note below
  cuisine?: string;
  tags?: string[];      // e.g. "dorm-friendly", "one-pot"

  // Extended optional fields used by the larger recipe set
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  dormFriendly?: boolean;
  mealPrepFriendly?: boolean;
  allergyTags?: string[]; // contains-nuts, contains-soy, etc.
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

  // Macro-friendly recipe variants — three records per dish share the same
  // variantGroup slug so the UI can surface them together.
  variantGroup?: string;
  variantType?: "original" | "calorie-friendly" | "protein-friendly";
  variantNote?: string;
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

export interface PantryItem {
  ingredientId: string;
  quantity?: number;
  useSoon?: boolean;   // scorer prioritizes these (CLAUDE.md §10)
}

export interface GroceryItem {
  ingredientId: string;
  quantity: number;
  recipeIds: string[]; // recipes that need this item
  checked: boolean;
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
No functions, no constants, no React. Pure types.

---

## 2. `src/lib/customRecipeTypes.ts` — AI-generated & user-created recipes

Superset of `Recipe`, persisted in `localStorage` under `srf:custom-recipes` (CLAUDE.md §10/§14). Note this is a **separate, parallel** shape from `Recipe` — it does NOT extend it (e.g. ingredients here carry inline `name`/`quantity`/`unit`/`estimatedCost` instead of an `ingredientId` reference).

### Exported interfaces (verbatim)
```ts
export interface CustomRecipeImage {
  src?: string; // remote URL OR data: URL
  b64?: string; // raw base64 (no data: prefix) — stored separately to avoid bloat
  alt: string;
  sourceName: string;
  license: string;
  isAIGenerated: boolean;
  isFallback: boolean;
  generatedPrompt?: string;
  generatedAt?: string;
  model?: string;
}

export interface CustomRecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  userAlreadyHas?: boolean;
  optional?: boolean;
  category?: string;
}

export interface CustomRecipeStep {
  title?: string;
  instruction: string;
  timerMinutes?: number | null;
  safetyNote?: string | null;
}

export interface BaseCustomRecipe {
  id: string;
  name: string;
  description: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "meal-prep";
  cuisineStyle?: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  difficulty: "very easy" | "easy" | "medium";   // ⚠ differs from Recipe.Difficulty
  equipment: string[];                            // ⚠ free-string, not Equipment[]
  primaryCookingMethod: string;
  noStovetopRequired: boolean;
  estimatedTotalCost: number;
  estimatedCostPerServing: number;
  ingredients: CustomRecipeIngredient[];
  steps: string[];
  guidedCookingSteps?: CustomRecipeStep[];
  cheapTips?: string[];
  substitutions?: Array<{
    original: string;
    swap: string;
    why?: string;
    estimatedSavings?: number | null;
  }>;
  makeItCheaper?: string[];
  makeItHealthier?: string[];
  makeItHigherProtein?: string[];
  studentTips?: string[];
  storageInstructions?: string;
  reheatingInstructions?: string;
  safetyNotes?: string[];
  estimatedNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  tags?: string[];
  image: CustomRecipeImage;
  createdAt: string;  // ISO timestamp
  updatedAt: string;  // ISO timestamp
}

export interface AIGeneratedRecipe extends BaseCustomRecipe {
  isAIGenerated: true;
  isUserCreated: false;
  userRequestSummary?: string;
  whyThisFits?: string;
  missingIngredients?: Array<{
    name: string;
    estimatedCost: number;
    importance: "required" | "recommended" | "optional";
    cheapSubstitute?: string | null;
  }>;
  estimatedMissingIngredientCost?: number;
}

export interface UserCreatedRecipe extends BaseCustomRecipe {
  isAIGenerated: false;
  isUserCreated: true;
  notes?: string;
}

export type CustomRecipe = AIGeneratedRecipe | UserCreatedRecipe;
```

### Exported function (runtime — type guard)
```ts
export function isAIGenerated(r: CustomRecipe): r is AIGeneratedRecipe {
  return r.isAIGenerated === true;
}
```
Pure. RN-safe. The `isAIGenerated`/`isUserCreated` boolean literal pair is the discriminant.

---

## 3. `src/lib/externalTypes.ts` — External-API & global-dataset recipes

Deliberately separate from `Recipe` "so nothing existing breaks." Consumed by the adapters in `src/lib/adapters/` (`spoonacular.ts`, `edamam.ts`, `themealdb.ts`) — they normalize provider JSON into `ExternalRecipe`. These are network-backed (see §5).

### Exported types (verbatim)
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
  difficulty: "Easy" | "Medium" | "Hard" | null;  // ⚠ Capitalized, differs from Recipe.Difficulty
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
  cuisineId?: string;              // kebab-case e.g. "chinese", "south-african"
  dishType?: string | null;        // e.g. "main course", "dessert"
  region?: string;
  country?: string;
  estimatedCost?: number;          // USD per serving
  studentFriendlyScore?: number;   // 1–10
  spiceLevel?: number;             // 0–5
  proteinType?: string;            // "chicken" | "beef" | "tofu" | "eggs" | "legumes" | "seafood" | "none" …
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
No functions, no constants, no React. Pure types.

---

## 4. `src/lib/nourish/types.ts` — Nutrition-tracking model + helpers

Canonical storage is **metric (kg, cm)**; the UI converts to/from imperial via `UserProfile.preferredUnits`. These types are persisted across many `srf:nourish-*` localStorage keys (see §4b). The file itself is pure.

### Exported types (verbatim)
```ts
export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary" | "light" | "moderate" | "very_active" | "extra_active";
export type GoalMode = "cut" | "maintain" | "bulk" | "recomp";
export type TargetSource = "formula" | "adaptive" | "manual";
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
export type FoodSource = "usda" | "custom" | "recipe";
export type PreferredUnits = "metric" | "imperial";
```

### Exported interfaces (verbatim)
```ts
export interface UserProfile {
  /** Height in centimetres (canonical). */
  heightCm: number;
  /** Current weight in kilograms (canonical). */
  weightKg: number;
  /** Age in whole years. */
  age: number;
  /** Optional; used for Mifflin-St Jeor. Omit for body-comp flow. */
  sex?: Sex;
  /** Body-fat fraction 0–1 (optional; unlocks Katch-McArdle). */
  bodyFatFraction?: number;
  activityLevel: ActivityLevel;
  preferredUnits: PreferredUnits;
}

export interface TargetSnapshot {
  /** ISO-8601 date this snapshot became effective (YYYY-MM-DD). */
  effectiveFrom: string;
  mode: GoalMode;
  /** Desired change in kg per week (positive = gain, negative = loss). */
  weeklyRateKg: number;
  calorieTarget: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
  source: TargetSource;
}

export interface WeightEntry {
  id: string;
  /** ISO-8601 date (YYYY-MM-DD). */
  date: string;
  /** Weight in kilograms (canonical). */
  weightKg: number;
}

export interface FoodItem {
  id: string;
  source: FoodSource;
  /** USDA fdcId or recipe id when source is not "custom". */
  externalId?: string;
  name: string;
  brand?: string;
  /** Human-readable e.g. "1 medium apple" or "100g". */
  servingDescription: string;
  /** Grams per serving (used for scaling). */
  servingGrams?: number;
  /** Per-serving macros. */
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG?: number;
}

export interface DiaryEntry {
  id: string;
  /** ISO-8601 date (YYYY-MM-DD). */
  date: string;
  meal: MealSlot;
  /** The food or recipe that was logged. */
  food: FoodItem;
  /** Number of servings consumed. */
  quantityServings: number;
  // Snapshot at log time so edits to the food item don't change history.
  snapshotKcal: number;
  snapshotProteinG: number;
  snapshotCarbG: number;
  snapshotFatG: number;
  /** ISO-8601 timestamp of when the entry was created. */
  loggedAt: string;
}

export interface DayTotals {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}

/** Lightweight shape returned from the USDA FoodData Central search API. */
export interface UsdaSearchResult {
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: {
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }[];
}
```

### Exported functions (runtime — pure)
```ts
export function entryTotals(entry: DiaryEntry): DayTotals {
  return {
    kcal: entry.snapshotKcal * entry.quantityServings,
    proteinG: entry.snapshotProteinG * entry.quantityServings,
    carbG: entry.snapshotCarbG * entry.quantityServings,
    fatG: entry.snapshotFatG * entry.quantityServings,
  };
}

export function sumTotals(entries: DiaryEntry[]): DayTotals {
  // reduces entries via entryTotals into a single DayTotals
}
```
Both pure (no I/O, no globals). RN-safe verbatim.

---

## 4b. localStorage keys that persist these types

The **type files don't touch localStorage**, but their *adjacent storage modules* do. Listed so the RN port can map each shape to a persisted key (all under the legacy `srf:` prefix — **must not be renamed**, CLAUDE.md §14).

**Main app — `src/lib/storage.ts` (`STORAGE_KEYS`):**
| Key | Stored value shape |
| --- | --- |
| `srf:pantry` | `PantryItem[]` |
| `srf:grocery` | `GroceryItem[]` |
| `srf:saved` | saved recipe IDs (string[]) / saved-recipes structure |
| `srf:custom-recipes` | `CustomRecipe[]` |
| `srf:location` | region/location config (pricing subsystem) |

**Nourish — `src/lib/nourish/storage.ts` (`NOURISH_KEYS`):**
| Key | Stored value shape |
| --- | --- |
| `srf:nourish-profile` | `UserProfile` |
| `srf:nourish-targets` | `TargetSnapshot[]` (history; latest is active) |
| `srf:nourish-weight-log` | `WeightEntry[]` |
| `srf:nourish-diary` | `DiaryEntry[]` |
| `srf:nourish-custom-foods` | `FoodItem[]` (source `"custom"`) |
| `srf:nourish-food-cache` | cached USDA/food lookups (24 h TTL) |
| `srf:nourish-onboarded` | boolean flag |
| `srf:nourish-adaptive-last-run` | timestamp/string |
| `srf:nourish-water-log` | water entries |
| `srf:nourish-recent-foods` | `FoodItem[]` recents |

**Other nourish modules with their own keys:** `srf:nourish-meals` (meals.ts), `srf:nourish-exercise-log` (exercise.ts), `srf:nourish-fasting-active` + `srf:nourish-fasting-log` (fasting.ts), `srf:nourish-meal-plan` (mealPlan.ts).

> These persistence modules are **out of this subsystem's scope** but are the direct consumers of these types. They are where the browser coupling lives (see §5/§6).

---

## 5. Network / request-response contracts touched via these types

Only one contract is defined *by a type in scope*: `UsdaSearchResult` (in `nourish/types.ts`) is the parsed shape of the USDA FoodData Central response. Contract lives in `src/lib/nourish/usdaClient.ts`:

- **Base:** `https://api.nal.usda.gov/fdc/v1`
- **Auth:** query param `api_key=` from `process.env.NEXT_PUBLIC_USDA_API_KEY ?? "DEMO_KEY"`
- **Search — GET** `/foods/search?api_key=…&query=…&dataType=…&pageSize=…&fields=fdcId,description,brandOwner,servingSize,servingSizeUnit,foodNutrients`
  → response items map 1:1 to `UsdaSearchResult` (`fdcId`, `description`, `brandOwner?`, `servingSize?`, `servingSizeUnit?`, `foodNutrients[{nutrientId,nutrientName,value,unitName}]`).
- **Detail — GET** `/food/{fdcId}?api_key=…&format=abridged`
- `DEMO_KEY` is the no-key fallback; client surfaces a friendly error when key is missing.

`ExternalRecipe` / `ExternalSearchResult` are the **normalized output** of the `src/lib/adapters/*` provider calls (Spoonacular/Edamam/TheMealDB). The provider request/response contracts themselves live in those adapter files (a separate subsystem) — these types are only the post-normalization shape the app consumes.

---

## 6. Browser / Next-only couplings → RN adaptation

**Inside the four target files: NONE.** No `window`, `localStorage`, `FileReader`, `SpeechRecognition`, `fetch`, `next/image`, `next/link`, `'use client'`, DOM, or CSS. They are 100% isomorphic.

Couplings that touch *these shapes* live in adjacent modules and must be adapted when the shared package is wired into RN:

| Coupling | Where | RN adaptation |
| --- | --- | --- |
| `window.localStorage` get/set/JSON | `storage.ts`, `nourish/storage.ts`, `nourish/{meals,exercise,fasting,mealPlan}.ts` | Replace with an async KV adapter (`@react-native-async-storage/async-storage` or `expo-secure-store`/MMKV). Keep the **exact `srf:` key strings**. Note: AsyncStorage is **async** — the web modules are sync; wrap behind a `KVStore` interface in the shared package. |
| `process.env.NEXT_PUBLIC_USDA_API_KEY` / `NEXT_PUBLIC_*` | `usdaClient.ts`, adapters | RN has no `NEXT_PUBLIC_*`. Use `expo-constants` / `app.config` `extra`, or inject a config object into the shared package at init. Keep `DEMO_KEY` fallback. |
| `fetch` to USDA / providers | `usdaClient.ts`, `adapters/*` | RN `fetch` works; no change to call sites. Just ensure base URLs/keys come from injected config, not `process.env`. |
| `Recipe.accentColor` = "tailwind bg class"; emoji visual | UI consumers of `Recipe` | The *type* is fine (`string`). But the **value** is a Tailwind class meaningless in RN. The RN UI layer must map `accentColor` → an RN color value (token map), not consume the class directly. Flag for the UI-port brief. |
| `CustomRecipeImage.b64` / `data:` URLs | image rendering | RN `<Image>` handles `data:`/base64 via `{ uri: 'data:image/...;base64,...' }` or `{ uri }`. Type unchanged; rendering layer differs (no `next/image`). |
| ISO date strings (`YYYY-MM-DD`, ISO timestamps) | nourish types, custom recipe `createdAt/updatedAt` | Plain strings — portable. Keep using string ISO, not `Date`, for JSON-safe persistence. |

---

## 7. RN port plan

**Moves into the shared package UNCHANGED (copy verbatim):**
- All of `types.ts`, `customRecipeTypes.ts`, `externalTypes.ts`, `nourish/types.ts`.
- The 3 helper functions: `isAIGenerated`, `entryTotals`, `sumTotals`.
- These become the single source of truth imported by both Next web and Expo RN. **Do not fork.**

**Needs a thin platform adapter (not in these files, but required to use them):**
- A `KVStore` interface (`get<T>(key): Promise<T|null>`, `set<T>(key, value): Promise<void>`) implemented by `localStorage` (web) and AsyncStorage/MMKV (RN). All `srf:*`/`srf:nourish-*` modules get rewritten against this interface; **keys stay identical** so existing web data shape is preserved and a future sync is trivial.
- A `config` injection object (`{ usdaApiKey, workerUrl, anthropicApiKey, … }`) to replace `process.env.NEXT_PUBLIC_*`.
- `fetch` calls stay as-is (RN-compatible) once keys/base URLs come from injected config.

**Must be rebuilt natively (UI layer, out of this subsystem):**
- Anything that *renders* `accentColor` (Tailwind class → RN color token map).
- Image rendering for `RecipeImage.src` / `CustomRecipeImage.{src,b64}` (RN `<Image>` instead of `next/image`).
- Navigation/links (`next/link` → Expo Router / React Navigation).

**Net:** This subsystem is the cleanest possible port target — it is pure TS with no platform surface. Lift the four files into `packages/shared/src/types/` (+ the 3 helpers), and all platform work is confined to the storage/config adapters that *consume* these types, not the types themselves.
