# Mobile Port Brief — Subsystem 05: Storage & App State

Scope: `src/lib/storage.ts`, `src/lib/AppStore.tsx`, `src/lib/customRecipeStorage.ts`, `src/lib/customIngredientStorage.ts`, `src/lib/userProgress.ts`, `src/lib/nourish/storage.ts`.

This subsystem is the **entire persistence + in-memory app-state layer** of Waivy. It is a thin synchronous wrapper over `window.localStorage` plus one React Context store (`AppStore`). There is **no server, no DB, no network** in this subsystem — every byte lives in `localStorage` under the `srf:` prefix. (One USDA HTTP contract is mentioned only as a cache consumer; the network call itself lives elsewhere.)

The single most important fact for the cross-platform sync design: **all persistence is `JSON.stringify` → `localStorage.setItem(key, ...)` and `JSON.parse(localStorage.getItem(key))`, guarded by `typeof window === "undefined"` (SSR) and `try/catch` (quota/corruption).** Porting = replace that one primitive with an async key/value adapter. Nothing else in the storage layer touches the browser.

---

## 1. Complete localStorage key inventory

Every key uses the literal `srf:` prefix (legacy "Student Recipe Finder" name — **never rename; renaming silently wipes all existing user data**). Keys **owned by this subsystem** are marked ✅. Keys that exist in the wider app but are owned by other subsystems are listed at the bottom for completeness (so the shared KV namespace is fully mapped).

| Key string | Owner module | Stored value shape (after `JSON.parse`) | Fallback when absent |
| --- | --- | --- | --- |
| `srf:pantry` ✅ | storage.ts | `PantryItem[]` | `[]` |
| `srf:grocery` ✅ | storage.ts | `GroceryItem[]` | `[]` |
| `srf:saved` ✅ | storage.ts | `string[]` (recipe IDs) | `[]` |
| `srf:custom-recipes` ✅ | customRecipeStorage.ts | `CustomRecipe[]` (`AIGeneratedRecipe \| UserCreatedRecipe`) | `[]` |
| `srf:custom-recipe-images` ✅ | customRecipeStorage.ts | `Record<string /*recipeId*/, StoredImage>` | `{}` |
| `srf:custom-ingredients` ✅ | customIngredientStorage.ts (+ read in AppStore.tsx) | `CustomIngredient[]` | `[]` |
| `srf:resolved-cache` ✅ | customIngredientStorage.ts | `Record<string /*lowercased raw phrase*/, CachedResolution>` | `{}` |
| `srf:user-progress` ✅ | userProgress.ts | `UserProgress` (single object) | `DEFAULT` (all-zero `UserProgress`) |
| `srf:nourish-profile` ✅ | nourish/storage.ts | `UserProfile \| null` | `null` |
| `srf:nourish-targets` ✅ | nourish/storage.ts | `TargetSnapshot \| null` | `null` |
| `srf:nourish-weight-log` ✅ | nourish/storage.ts | `WeightEntry[]` | `[]` |
| `srf:nourish-diary` ✅ | nourish/storage.ts | `DiaryEntry[]` | `[]` |
| `srf:nourish-custom-foods` ✅ | nourish/storage.ts | `FoodItem[]` | `[]` |
| `srf:nourish-food-cache` ✅ | nourish/storage.ts | `CacheEntry[]` (USDA search cache, 24h TTL, capped 200) | `[]` |
| `srf:nourish-onboarded` ✅ | nourish/storage.ts | `boolean` | `false` |
| `srf:nourish-adaptive-last-run` ✅ | nourish/storage.ts | `string \| null` (ISO date) | `null` |
| `srf:nourish-water-log` ✅ | nourish/storage.ts | `WaterEntry[]` | `[]` |
| `srf:nourish-recent-foods` ✅ | nourish/storage.ts | `FoodItem[]` (most-recent-first, capped 20) | `[]` |

**Keys present elsewhere in the app (NOT in this subsystem's source, listed for the shared namespace map):** `srf:location`, `srf:ai-price-book`, `srf:price-overrides`, `srf:recent-searches`, `srf:haptics-enabled`, `srf:nourish-exercise-log`, `srf:nourish-fasting-active`, `srf:nourish-fasting-log`, `srf:nourish-meal-plan`, `srf:nourish-meals`. These are owned by pricing/search/nourish-extra subsystems — the mobile KV adapter must still reserve/migrate them, but their shapes are defined in those modules.

---

## 2. Exact data shapes (copied real interfaces)

### From `src/lib/types.ts` (core)

```ts
export interface PantryItem {
  ingredientId: string;        // may be a built-in id OR a "custom-..." id
  quantity?: number;
  useSoon?: boolean;
}

export interface GroceryItem {
  ingredientId: string;
  quantity: number;
  recipeIds: string[];         // recipes that need this item ([] = manual staple)
  checked: boolean;
}

// Recipe is large; AppStore only consumes recipe.id, recipe.ingredients[].ingredientId,
// recipe.ingredients[].quantity from it. Full shape lives in src/lib/types.ts.
export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  optional?: boolean;
  note?: string;
}
```

### From `src/lib/customRecipeTypes.ts`

```ts
export interface CustomRecipeImage {
  src?: string;            // remote URL OR data: URL
  b64?: string;            // raw base64 (no data: prefix) — stored separately
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
  difficulty: "very easy" | "easy" | "medium";
  equipment: string[];
  primaryCookingMethod: string;
  noStovetopRequired: boolean;
  estimatedTotalCost: number;
  estimatedCostPerServing: number;
  ingredients: CustomRecipeIngredient[];
  steps: string[];
  guidedCookingSteps?: CustomRecipeStep[];
  cheapTips?: string[];
  substitutions?: Array<{ original: string; swap: string; why?: string; estimatedSavings?: number | null }>;
  makeItCheaper?: string[];
  makeItHealthier?: string[];
  makeItHigherProtein?: string[];
  studentTips?: string[];
  storageInstructions?: string;
  reheatingInstructions?: string;
  safetyNotes?: string[];
  estimatedNutrition?: { calories: number; protein: number; carbs: number; fat: number; fiber?: number };
  tags?: string[];
  image: CustomRecipeImage;
  createdAt: string;
  updatedAt: string;
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
export function isAIGenerated(r: CustomRecipe): r is AIGeneratedRecipe;
```

### `StoredImage` (internal to customRecipeStorage.ts — the value type inside `srf:custom-recipe-images` map)

```ts
interface StoredImage {            // NOT exported, but it IS the on-disk shape
  id: string;                      // === recipeId (the map key)
  b64: string;
  prompt?: string;
  model?: string;
  storedAt: string;                // ISO timestamp
  bytes: number;                   // floor(b64.length * 3 / 4)
}
// On-disk: Record<recipeId, StoredImage> under "srf:custom-recipe-images"
// Caps: MAX_INLINE_IMAGE_BYTES = 1.5 MB/image, MAX_TOTAL_IMAGE_BYTES = 6 MB total
// (LRU-evicts oldest by storedAt when total would exceed cap)
```

### `CustomIngredient` (exported, customIngredientStorage.ts — the value type inside `srf:custom-ingredients`)

```ts
export interface CustomIngredient {
  id: string;                              // "custom-<slug>" or "custom-<slug>-<n>"
  canonicalName: string;
  displayName: string;
  aliases: string[];
  category: ResolvedIngredient["category"];        // = IngredientCategory (10 literals)
  ingredientRole: ResolvedIngredient["ingredientRole"];
  storageType: ResolvedIngredient["storageType"];  // "pantry"|"fridge"|"freezer"|"unknown"
  shelfLifeDays?: number | null;
  estimatedUnitCost?: number | null;
  unit?: string;
  dietaryTags: string[];
  allergyTags: string[];
  notes?: string;
  isCustomIngredient: true;
  createdByUser: boolean;
  createdByAI: boolean;
  createdAt: string;
  updatedAt: string;
}
```

`ResolvedIngredient` (imported from `src/lib/workerClient.ts`, the AI-resolver output that `resolvedToCustom()` consumes):

```ts
export interface ResolvedIngredient {
  canonicalName: string;
  displayName: string;
  originalText: string;
  aliases: string[];
  category: IngredientCategory;   // "grain"|"protein"|"vegetable"|"fruit"|"dairy"|"canned"|"condiment"|"spice"|"frozen"|"snack"
  ingredientRole:                  // "main"|"protein"|"carb"|"vegetable"|"fruit"|"fat"|"seasoning"|"sauce"|"acid"|"sweetener"|"binder"|"liquid"|"other"
    | "main" | "protein" | "carb" | "vegetable" | "fruit" | "fat"
    | "seasoning" | "sauce" | "acid" | "sweetener" | "binder" | "liquid" | "other";
  storageType: "pantry" | "fridge" | "freezer" | "unknown";
  shelfLifeDays?: number | null;
  estimatedUnitCost?: number | null;
  unit?: string;
  dietaryTags: string[];
  allergyTags: string[];
  confidence: number;
  notes?: string;
  useSoon?: boolean;
}
```

### `CachedResolution` (internal, customIngredientStorage.ts — value inside `srf:resolved-cache`)

```ts
interface CachedResolution {        // NOT exported; on-disk value type
  raw: string;                      // original phrase
  ingredients: ResolvedIngredient[];
  at: string;                       // ISO timestamp
}
// On-disk: Record<lowercasedTrimmedPhrase, CachedResolution> under "srf:resolved-cache"
```

### `UserProgress` (exported, userProgress.ts — the entire `srf:user-progress` value)

```ts
export interface UserProgress {
  pantryItemsAdded: number;
  recipesGenerated: number;
  recipesSaved: number;
  mealsLogged: number;
  groceryItemsAdded: number;
  useSoonIngredientsUsed: number;
}
// DEFAULT = all zeros. read() spreads {...DEFAULT, ...parsed} so adding a new
// counter field is backward-compatible.
```

### Nourish shapes (from `src/lib/nourish/types.ts`)

```ts
export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very_active" | "extra_active";
export type GoalMode = "cut" | "maintain" | "bulk" | "recomp";
export type TargetSource = "formula" | "adaptive" | "manual";
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
export type FoodSource = "usda" | "custom" | "recipe";
export type PreferredUnits = "metric" | "imperial";

export interface UserProfile {           // srf:nourish-profile
  heightCm: number;
  weightKg: number;
  age: number;
  sex?: Sex;
  bodyFatFraction?: number;
  activityLevel: ActivityLevel;
  preferredUnits: PreferredUnits;
}

export interface TargetSnapshot {        // srf:nourish-targets
  effectiveFrom: string;                 // YYYY-MM-DD
  mode: GoalMode;
  weeklyRateKg: number;
  calorieTarget: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
  source: TargetSource;
}

export interface WeightEntry {           // element of srf:nourish-weight-log
  id: string;
  date: string;                          // YYYY-MM-DD (one entry per date)
  weightKg: number;
}

export interface FoodItem {              // element of custom-foods / recent-foods; embedded in DiaryEntry
  id: string;
  source: FoodSource;
  externalId?: string;                   // USDA fdcId or recipe id
  name: string;
  brand?: string;
  servingDescription: string;
  servingGrams?: number;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG?: number;
}

export interface DiaryEntry {            // element of srf:nourish-diary
  id: string;
  date: string;                          // YYYY-MM-DD (LOCAL time)
  meal: MealSlot;
  food: FoodItem;                        // embedded snapshot of the food object
  quantityServings: number;
  snapshotKcal: number;                  // frozen at log time (history-stable)
  snapshotProteinG: number;
  snapshotCarbG: number;
  snapshotFatG: number;
  loggedAt: string;                      // ISO timestamp
}

export interface DayTotals { kcal: number; proteinG: number; carbG: number; fatG: number; }

export interface UsdaSearchResult {      // shape cached inside food-cache results (as `unknown`)
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: { nutrientId: number; nutrientName: string; value: number; unitName: string }[];
}
```

### `WaterEntry` (exported from nourish/storage.ts — element of `srf:nourish-water-log`)

```ts
export interface WaterEntry {
  date: string;        // YYYY-MM-DD
  mlConsumed: number;
  goalMl: number;      // default 2000
}
```

### `CacheEntry` (internal to nourish/storage.ts — element of `srf:nourish-food-cache`)

```ts
interface CacheEntry {   // NOT exported; on-disk element type
  query: string;         // trimmed + lowercased query string
  results: unknown;      // raw USDA search payload (UsdaSearchResult[] in practice)
  cachedAt: number;      // epoch ms
}
// CACHE_TTL_MS = 24h. Capped at 200 entries (oldest evicted by cachedAt).
```

---

## 3. AppStore — full public API (the central in-memory store)

`src/lib/AppStore.tsx`. React Context store that mirrors `srf:pantry`, `srf:grocery`, `srf:saved` into React state. **This is the only stateful/reactive piece in the subsystem; everything else is plain function calls.**

### Context value type (`AppStoreValue`)

```ts
interface AppStoreValue {
  hydrated: boolean;                     // false until localStorage read completes on mount

  // PANTRY (mirror of srf:pantry)
  pantry: PantryItem[];
  addPantryItem: (item: PantryItem) => void;          // no-op if ingredientId already present
  removePantryItem: (ingredientId: string) => void;
  togglePantryUseSoon: (ingredientId: string) => void;
  clearPantry: () => void;

  // GROCERY (mirror of srf:grocery)
  grocery: GroceryItem[];
  addGroceryItems: (recipe: Recipe, missingIds: string[]) => void;  // merges recipe's missing ingredients; dedups by ingredientId; appends recipe.id to recipeIds
  addStapleToGrocery: (ingredientId: string) => void; // adds qty 1, recipeIds:[], checked:false; no-op if present
  toggleGroceryChecked: (ingredientId: string) => void;
  removeGroceryItem: (ingredientId: string) => void;
  clearGrocery: () => void;

  // SAVED (mirror of srf:saved — array of recipe IDs)
  saved: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
}
```

### Exported symbols

| Symbol | Signature | Notes |
| --- | --- | --- |
| `AppStoreProvider` | `({ children }: { children: React.ReactNode }) => JSX.Element` | Wrap once near app root. **Must wrap `ToastProvider`** (hydration order). |
| `useAppStore` | `() => AppStoreValue` | Throws `"useAppStore must be used inside AppStoreProvider"` if no provider. |
| `ingredientName` | `(id: string) => string` | Built-in lookup via `INGREDIENT_MAP`, then **directly reads `localStorage["srf:custom-ingredients"]`** for custom ids, falls back to the id. ⚠ browser coupling — see §5. |
| `recipeName` | `(id: string) => string` | `RECIPE_MAP.get(id)?.name ?? id`. Pure, no browser coupling. |

### Hydration & persistence lifecycle (critical for sync design)

1. On mount, a `useEffect` reads all three keys via `storage.get*()` and sets `hydrated = true`. (Synchronous read; safe because `localStorage` is sync.)
2. Three separate `useEffect`s persist `pantry`/`grocery`/`saved` back to `localStorage` whenever they change **and `hydrated` is true** (the guard prevents clobbering stored data with the empty initial state before hydration).
3. All mutations are immutable (`setX(prev => ...)`) and memoized via `useCallback`; the context value is `useMemo`'d. (Important comment in `addGroceryItems`: it must replace, not mutate, existing grocery rows so downstream `useMemo`s relying on referential equality stay correct.)

**RN implication:** because `localStorage` is sync but RN `AsyncStorage`/`expo-secure-store` are async, the hydration effect becomes async (read → `await` → setState → `hydrated = true`). The three persistence effects become fire-and-forget async writes. The public `AppStoreValue` API and all mutation semantics can stay byte-identical.

---

## 4. Full public API of the other storage modules

### `src/lib/storage.ts`

```ts
export const STORAGE_KEYS: { pantry: "srf:pantry"; grocery: "srf:grocery"; saved: "srf:saved" };
export const storage: {
  getPantry(): PantryItem[];
  setPantry(items: PantryItem[]): void;
  getGrocery(): GroceryItem[];
  setGrocery(items: GroceryItem[]): void;
  getSaved(): string[];
  setSaved(ids: string[]): void;
};
```
Internal: `safeRead<T>(key, fallback): T`, `safeWrite(key, value): void` (SSR + try/catch guarded). **Synchronous.**

### `src/lib/customRecipeStorage.ts`

```ts
export function makeCustomRecipeId(name: string, prefix: "gen" | "user"): string;  // "<prefix>-<slug>-<rand5>", collision-checked
export function getCustomRecipes(): CustomRecipe[];
export function getCustomRecipe(id: string): CustomRecipe | undefined;
export function saveCustomRecipe(r: CustomRecipe): CustomRecipe;                    // upsert by id
export function deleteCustomRecipe(id: string): void;                               // also deletes its image
export function storeRecipeImage(
  recipeId: string, b64: string, meta?: { prompt?: string; model?: string }
): { ok: boolean; reason?: string };                                               // returns {ok:false,reason:"ssr"|"image too large..."|"localStorage quota"}
export function getStoredRecipeImage(id: string): StoredImage | undefined;
export function deleteRecipeImage(id: string): void;
export function imageDataUrl(b64: string, mediaType?: string /* default "image/png" */): string;  // -> "data:<mt>;base64,<b64>"
export function fallbackImageMeta(): CustomRecipeImage;                             // placeholder image meta
export function emptyUserRecipe(): UserCreatedRecipe;                               // blank form template
export function isAIRecipe(r: CustomRecipe): r is AIGeneratedRecipe;
```
Keys: `srf:custom-recipes`, `srf:custom-recipe-images`. **Synchronous.**

### `src/lib/customIngredientStorage.ts`

```ts
export interface CustomIngredient { ... }   // (see §2)
export function getCustomIngredients(): CustomIngredient[];
export function makeCustomId(name: string): string;                                // "custom-<slug>" or "custom-<slug>-<n>"
export function saveCustomIngredient(c: CustomIngredient): CustomIngredient;        // upsert by id
export function deleteCustomIngredient(id: string): void;
export function findExistingByName(
  name: string, builtInMap: { name: string; id: string }[]
): { id: string; source: "builtin" | "custom" } | null;
export function resolvedToCustom(r: ResolvedIngredient): CustomIngredient;          // converts AI output -> stored shape (sets createdByAI:true)
export function getCachedResolution(raw: string): ResolvedIngredient[] | null;
export function setCachedResolution(raw: string, items: ResolvedIngredient[]): void;
```
Keys: `srf:custom-ingredients`, `srf:resolved-cache`. **Synchronous.**

### `src/lib/userProgress.ts`

```ts
export interface UserProgress { ... }       // (see §2)
export function getUserProgress(): UserProgress;
export function bumpProgress(key: keyof UserProgress, by?: number /* default 1 */): number;   // increments & returns new count
export function milestoneMessage(key: keyof UserProgress, count: number): string | null;       // friendly toast text on 1,5,10,25,50,100,250,500; else null. PURE — no storage.
```
Key: `srf:user-progress`. **Synchronous.**

### `src/lib/nourish/storage.ts`

```ts
export const NOURISH_KEYS: {       // all "srf:nourish-*" strings
  profile; targets; weightLog; diary; customFoods; foodCache;
  onboarded; adaptiveLastRun; waterLog; recentFoods;
};
export interface WaterEntry { ... }

// Profile / targets
export function getProfile(): UserProfile | null;
export function setProfile(profile: UserProfile): void;
export function getTargets(): TargetSnapshot | null;
export function setTargets(snapshot: TargetSnapshot): void;

// Weight log (one entry per date)
export function getWeightLog(): WeightEntry[];
export function addWeightEntry(entry: WeightEntry): void;       // replaces same-date entry
export function deleteWeightEntry(id: string): void;

// Diary
export function getDiaryEntries(): DiaryEntry[];
export function getDiaryForDate(date: string): DiaryEntry[];
export function addDiaryEntry(entry: DiaryEntry): void;
export function updateDiaryEntry(updated: DiaryEntry): void;
export function deleteDiaryEntry(id: string): void;

// Custom foods
export function getCustomFoods(): FoodItem[];
export function saveCustomFood(food: FoodItem): void;           // upsert by id
export function deleteCustomFood(id: string): void;

// USDA search cache (24h TTL, capped 200)
export function getFoodCacheEntry(query: string): unknown | null;
export function setFoodCacheEntry(query: string, results: unknown): void;

// Onboarding flag
export function isOnboarded(): boolean;
export function setOnboarded(value: boolean): void;

// Date / id utilities (PURE, no storage, no browser — port unchanged)
export function dateToLocalString(d: Date): string;            // YYYY-MM-DD in LOCAL time (NOT toISOString — avoids ±1 day TZ bug)
export function todayString(): string;                         // today's local YYYY-MM-DD
export function newId(): string;                               // `${Date.now().toString(36)}-${rand5}`

// Adaptive TDEE
export function getAdaptiveLastRun(): string | null;
export function setAdaptiveLastRun(date: string): void;

// Recent foods (most-recent-first, dedup by id, cap 20)
export function getRecentFoods(): FoodItem[];
export function pushRecentFood(food: FoodItem): void;

// Water log (one entry per date; default goal 2000ml)
export function getWaterLog(): WaterEntry[];
export function getWaterForDate(date: string): WaterEntry;     // returns {date,0,2000} if absent
export function setWaterForDate(entry: WaterEntry): void;

// Protein streak (derived from diary; counts consecutive days >= target*threshold)
export function getProteinStreak(targetProteinG: number, threshold?: number /* default 0.85 */): number;
```
Keys: all 10 `srf:nourish-*` keys. **Synchronous.** Note `getProteinStreak` walks up to 365 days computing local date strings inline (must match `todayString()` local formatting — do not switch to ISO).

---

## 5. Browser / Next-only couplings (and how to adapt)

| Coupling | Where | Why it breaks in RN | Adaptation |
| --- | --- | --- | --- |
| `window.localStorage` (get/set/Item) | **every module** | No `window`/`localStorage` in RN | Replace with an async KV adapter (`AsyncStorage` or MMKV). MMKV is **synchronous** and would let the get/set signatures stay identical — strongly preferred to minimize churn. AsyncStorage forces sync→async refactor of all getters/setters. |
| `typeof window === "undefined"` SSR guards | every `safeRead`/`safeWrite` | No SSR in Expo; guard is dead but harmless | Drop the guard, or have the adapter treat "no storage" as the fallback path. Keep the `try/catch` for corruption. |
| `"use client"` directive | storage.ts, AppStore.tsx, customRecipeStorage.ts, customIngredientStorage.ts | Next-only pragma; meaningless in RN/Metro | Delete the directive. (userProgress.ts and nourish/storage.ts have none.) |
| `JSON.stringify`/`JSON.parse` | every module | Works in RN | Keep as-is. |
| `data:` URL image storage (`imageDataUrl`, `storeRecipeImage`, base64 blobs in `srf:custom-recipe-images`) | customRecipeStorage.ts | RN `<Image>` *can* render `data:` URIs, but storing 6 MB of base64 in AsyncStorage is slow/risky and AsyncStorage has a per-key size ceiling on Android | Move recipe images to the **filesystem** (`expo-file-system`): write `b64` to a file, store only the file URI + metadata in KV. Keep the same `StoredImage` shape but swap `b64` for `uri`. `imageDataUrl` becomes "return file uri". The LRU eviction logic ports unchanged. |
| `console.warn` in `ingredientName` | AppStore.tsx | Works in RN (no-op-ish) | Keep. |
| React Context / hooks (`createContext`, `useState`, `useEffect`, `useCallback`, `useMemo`, `useContext`) | AppStore.tsx | All work in RN | Keep. Only the hydrate/persist effects change from sync to async if using AsyncStorage. |
| `INGREDIENT_MAP` / `RECIPE_MAP` imports (`@/data/*`) | AppStore.tsx | Pure data modules, port unchanged | Move into shared package. |
| `process.env.NEXT_PUBLIC_*`, `fetch`, `FileReader`, `SpeechRecognition`, `next/image`, `next/link` | **none of these appear in this subsystem** | n/a | No action here. (They live in AI/voice/photo/image subsystems.) |

**No network requests originate in this subsystem.** The only network contract *touched* is the USDA FoodData Central search response, whose results are *cached* (not fetched) here via `getFoodCacheEntry`/`setFoodCacheEntry` and typed as `unknown`/`UsdaSearchResult[]`. The actual HTTP call (URL, method, request body) lives in the Nourish data/search subsystem, not here. Cross-platform note: the USDA cache key is `query.trim().toLowerCase()` with a 24h TTL — replicate exactly so the mobile cache stays compatible.

---

## 6. RN port plan

**Move into the shared package UNCHANGED (pure logic, no browser):**
- All TypeScript types/interfaces: `types.ts`, `customRecipeTypes.ts`, `nourish/types.ts` (incl. `entryTotals`, `sumTotals`), `CustomIngredient`, `UserProgress`, `WaterEntry`, `ResolvedIngredient`.
- Pure functions: `recipeName`, `milestoneMessage`, `dateToLocalString`, `todayString`, `newId`, `imageDataUrl` (logic), `slugify`/`makeCustomId`/`makeCustomRecipeId`, `findExistingByName`, `resolvedToCustom`, `fallbackImageMeta`, `emptyUserRecipe`, `isAIRecipe`/`isAIGenerated`, `getProteinStreak`, all the upsert/dedup/merge/cache-eviction algorithms.
- The `AppStoreValue` interface + every mutation reducer (add/remove/toggle/clear/merge) and the AppStore Provider/hook *structure*.

**Needs a thin platform adapter (one file, swap-the-primitive):**
- Introduce `kv` adapter: `getRaw(key): string|null | Promise<...>`, `setRaw(key, value)`, `removeRaw(key)`. Every `safeRead`/`safeWrite` (duplicated across 5 files — consolidate into one shared util while porting) calls `kv` instead of `window.localStorage`.
  - **Recommended: react-native-mmkv** → synchronous, keeps all getter/setter signatures and the AppStore hydration-in-effect pattern identical (minimal diff, biggest win).
  - Alternative: `@react-native-async-storage/async-storage` → forces every getter/setter to become `async` and the three AppStore persistence effects + hydration effect to `await`. More churn.
- Keep the `srf:` key strings **byte-identical** for any future web↔mobile sync; the key constants (`STORAGE_KEYS`, `NOURISH_KEYS`, and the per-module `*_KEY` consts) move to shared and are the canonical namespace registry.

**Must be rebuilt natively (platform-specific):**
- **Recipe image storage** (`srf:custom-recipe-images` / `storeRecipeImage` / `getStoredRecipeImage`): replace base64-in-KV with `expo-file-system` file storage; KV holds only `{ id, uri, prompt?, model?, storedAt, bytes }`. Preserve the 1.5 MB/image + 6 MB total LRU caps (or relax them since filesystem isn't size-constrained like localStorage). `<Image source={{ uri }}/>` instead of a `data:` URL `<img>`.

**Sync-design takeaways:**
- This whole subsystem is a flat key/value store of independently-serializable JSON blobs. A future cloud-sync layer can treat each `srf:*` key as one syncable document.
- Conflict-prone collections (`srf:nourish-diary`, `srf:nourish-weight-log`, `srf:grocery`, `srf:saved`, `srf:custom-recipes`) all use stable string ids and upsert-by-id semantics → safe for last-write-wins-per-item merge.
- Caches (`srf:resolved-cache`, `srf:nourish-food-cache`, `srf:custom-recipe-images`) are local-only and should **not** sync.
- `srf:user-progress` uses `{...DEFAULT, ...parsed}` merge → adding counters is backward/forward compatible across versions.
