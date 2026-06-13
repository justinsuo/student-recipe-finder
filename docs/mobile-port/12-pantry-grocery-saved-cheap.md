# Mobile Port Brief — Pantry, Grocery List, Saved, Cheap Recipes

Subsystem map for porting the Waivy Next.js web app to an Expo React Native iPhone app that **shares** core logic. Scope: `/pantry`, `/grocery-list`, `/saved`, `/cheap-recipes` screens plus the 5 pantry input components. All file paths are absolute under `/Users/justinsuo/waivy`.

> **Critical project constraint** (from CLAUDE.md §14): localStorage keys use the legacy `srf:` prefix (`srf:pantry`, `srf:grocery`, `srf:saved`, `srf:custom-recipes`, `srf:location`, etc.). **Do NOT rename them.** Renaming silently wipes every existing user's data. In the RN port, keep the exact same string keys in AsyncStorage to allow data migration parity and shared logic.

---

## 0. Files covered

Screens:
- `src/app/pantry/page.tsx` (+ `layout.tsx` — metadata only)
- `src/app/grocery-list/page.tsx` (+ `layout.tsx`)
- `src/app/saved/page.tsx` (+ `layout.tsx`)
- `src/app/cheap-recipes/page.tsx` (+ `layout.tsx`)

Pantry components (`src/components/pantry/`):
- `PantrySmartAdd.tsx` — typed/paste → worker resolve
- `PantryVoiceInput.tsx` — Web Speech API → worker resolve
- `PantryPhotoUpload.tsx` — fridge photo → Anthropic vision
- `ReceiptUpload.tsx` — receipt photo → Anthropic vision (OCR)
- `PantryAIChat.tsx` — Pesto chat over pantry → Anthropic Haiku

Shared dependencies pulled in (logic that must port with these screens):
`src/lib/AppStore.tsx`, `src/lib/storage.ts`, `src/lib/types.ts`, `src/lib/workerClient.ts`, `src/lib/anthropic.ts`, `src/lib/customIngredientStorage.ts`, `src/lib/customRecipeStorage.ts`, `src/lib/customRecipeTypes.ts`, `src/lib/recipeScoring.ts`, `src/lib/equipmentFilters.ts`, `src/lib/haptics.ts`, `src/lib/userProgress.ts`, `src/lib/pricing/pricingEngine.ts`, `src/lib/pricing/locationStorage.ts`, `src/lib/pricing/locationTypes.ts`, `src/lib/pricing/regions.ts`, `src/data/ingredients.ts`, `src/data/pantryPresets.ts`, `src/data/recipes.ts`, `src/components/pricing/LocationSetup.tsx`.

---

## 1. Screen feature sets & flows

### 1.1 `/pantry` (`PantryPage`)

State: `search` (string), `confirm` (discriminated-union dialog state). Store hooks consumed: `pantry, addPantryItem, removePantryItem, togglePantryUseSoon, clearPantry, addStapleToGrocery`.

Input modes (each rendered as a section component, all gated on AI config):
1. **Presets** — `PANTRY_PRESETS` grid; tapping opens a `ConfirmDialog` ("Add N new items"), then `performLoadPreset()` adds each `ingredientId` not already in pantry (skips dupes + unknown ids). Toast on completion.
2. **Smart paste** (`PantrySmartAdd`) — typed/pasted free text.
3. **Voice** (`PantryVoiceInput`) — Web Speech transcription.
4. **Photo** (`PantryPhotoUpload`) — fridge/pantry photo.
5. **Receipt** (`ReceiptUpload`) — receipt OCR.
6. **AI Chat** (`PantryAIChat`) — Pesto Q&A.
7. **Manual search + quick-add** — debounced-free typeahead over `INGREDIENTS` (filters out items already in pantry, max 8 results), plus `QUICK_ADD_STAPLES` chip row.

Derived/rendered:
- `filtered` (useMemo) — search typeahead results.
- `grouped` (useMemo) — `Map<IngredientCategory | "custom", Ingredient[]>`; built-ins grouped by `category`, custom ingredients (from `getCustomIngredients()`, keyed by id) rendered as proxy `Ingredient` objects under `"custom"`.
- `ranked = rankPantryRecipes(pantry)`, `groups = groupPantryResults(ranked, pantry)`, `smartBuys = recommendSmartBuys(pantry)`.
- Hero stat strip (only when pantry non-empty): ingredient count, "Can make now" count, "Use soon" count, top smart-buy unlock count.
- Pantry chips colored per category via local `PANTRY_TONE_BY_CATEGORY` map; each chip has toggle-use-soon and remove buttons.
- Smart buys section (cheapest single item that unlocks the most recipes; "Add" → `addStapleToGrocery`).
- 4 recipe groups: `useSoon`, `canMakeNow`, `needFewItems`, `buyOneUnlock` (each capped at 6 cards via `RecipeCard`/`RecipeGroup`).
- Empty state when `pantry.length === 0`.
- Two `ConfirmDialog`s: load-preset and clear-pantry.
- `<LocationSetup />` for regional pricing.
- Trailing CTA links to `/ai-chef?usePantry=true`.

### 1.2 `/grocery-list` (`GroceryListPage`)

Store hooks: `grocery, pantry, toggleGroceryChecked, removeGroceryItem, clearGrocery, addStapleToGrocery`.

- Hydrates custom ingredients into `customById` (state) on mount and on every `grocery` change (so AI-Chef custom items aren't dropped).
- `grouped` (useMemo) → `{ map: Map<IngredientCategory | "custom", Row[]>, total, unchecked }` where `Row = { id, name, cost, quantity, recipeIds, checked }`. Cost per built-in row via `quoteIngredient(id, quantity)?.totalCost`; custom row via `(custom.estimatedUnitCost ?? 0) * quantity`.
- Renders grouped checklist: checkbox (`toggleGroceryChecked`), name (strikethrough when checked), "for {recipe names}" links (via `RECIPE_MAP`, first 2 + "+N more"), per-row cost + remove.
- Estimated-total card: `grouped.total` + remaining (`grouped.unchecked`) when partially checked.
- Smart buys section (same as pantry; button disabled if `alreadyOnList`).
- Clear-all `ConfirmDialog`.
- Empty state with CTAs to `/cheap-recipes` and `/pantry`.

### 1.3 `/saved` (`SavedPage`)

Store hooks: `saved` (string[] of recipe ids), `hydrated`.

- Local state: `filter` ∈ `"all" | "database" | "ai" | "user"`, `customRecipes` (loaded from `getCustomRecipes()` on mount + on `saved` change).
- Splits saved ids into: `databaseSaved` (resolved via `RECIPE_MAP`), `customSaved` (custom recipes whose id is in `saved`), then partitions custom into AI-generated vs user-created via `isAIGenerated` flag.
- Tab counts: `dbCount`, `aiCount`, `userCount`, `totalCount`.
- Sticky filter chip bar (`FilterChip`, `aria-pressed`).
- Sections: "From the database" (`RecipeGrid recipes={...} from="saved"`), "AI Generated", "Created by you" (custom cards via `CustomCard`).
- `CustomCard`: image from `recipe.image?.src` OR `getStoredRecipeImage(id)` b64 → `imageDataUrl()`; AI/Yours badge; `$X/serving · N min` line. Links to `/recipes/custom?id={id}`.
- Empty state only when `hydrated && totalCount === 0`.

### 1.4 `/cheap-recipes` (`CheapRecipesPage`)

Master filter UI. Local state:
- `filters: CheapFilters` (defaults: `budgetPerServing: 3, servings: 2, equipment: [], diet: [], time: "any", mealType: "any"`).
- `sort: "cheapest" | "fastest" | "protein" | "best"` (default `"best"`).
- `query`, `debouncedQuery` (180ms debounce), `scope: SearchScope`.
- `dormOnly`, `mealPrepOnly` (booleans), `methodOnly: "any" | "air-fryer" | "microwave" | "no-stove" | "under-2"`.
- `visibleCount` (paging, `PAGE_SIZE = 12`), `hydrated` (suppresses "Showing 0 of 0" pre-hydration).

Flows:
- On mount, reads `?method=` from `window.location.search` (set by homepage category cards) → sets `methodOnly`.
- `searchIndex = buildRecipeIndex(RECIPES)` (once).
- `queryHitIds` = set of recipe ids matching the smart search (`searchRecipes`), or null when no query.
- `results` (useMemo): `rankCheapRecipes(filters)` → method filters (`isAirFryerRecipe`/`isMicrowaveRecipe`/`isNoStoveRecipe`/`under-2`) → dorm filter → meal-prep filter → query filter → sort.
- Filter UI: smart search (`SmartRecipeSearch`), method chips, dorm/meal-prep toggles, budget slider (0.5–30) + quick-budget buttons, servings slider (1–6), time chips, meal-type chips, equipment chips (multi), diet chips (multi), sort chips.
- Active-filter chips bar (each removable) + "Clear all".
- Results count, `RecipeGrid` (or `SearchZeroState` when query yields nothing), "Load more" button.
- `<LocationSetup variant="compact" />`.

---

## 2. Exported symbols, signatures & types

### 2.1 `src/lib/types.ts` (pure types — port unchanged)

```ts
export type IngredientCategory = "grain" | "protein" | "vegetable" | "fruit" | "dairy" | "canned" | "condiment" | "spice" | "frozen" | "snack";
export type Equipment = "microwave" | "stovetop" | "oven" | "rice-cooker" | "air-fryer" | "no-kitchen";
export type DietTag = "vegetarian" | "vegan" | "high-protein" | "gluten-free" | "dairy-free";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "meal-prep";
export type Difficulty = "easy" | "medium" | "hard";
export type TimeBucket = "under-10" | "under-20" | "under-30" | "meal-prep";

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
  quantity: number;
  optional?: boolean;
  note?: string;
}

export interface NutritionEstimate { calories: number; protein: number; carbs: number; fat: number; fiber?: number; }

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
  useSoon?: boolean;
}

export interface GroceryItem {
  ingredientId: string;
  quantity: number;
  recipeIds: string[];
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
`Recipe` is large (see `types.ts` lines 112–176) — the screens read `id, name, description, mealType, servings, ingredients, steps, totalTimeMinutes, difficulty, equipment, dietTags, estimatedNutrition, emoji, accentColor, tags, cuisine, dormFriendly, mealPrepFriendly, primaryCookingMethod, noStovetopRequired`. Port the full interface unchanged.

### 2.2 `src/lib/AppStore.tsx` — React context (`'use client'`)

```ts
interface AppStoreValue {
  hydrated: boolean;
  pantry: PantryItem[];
  addPantryItem: (item: PantryItem) => void;
  removePantryItem: (ingredientId: string) => void;
  togglePantryUseSoon: (ingredientId: string) => void;
  clearPantry: () => void;
  grocery: GroceryItem[];
  addGroceryItems: (recipe: Recipe, missingIds: string[]) => void;
  addStapleToGrocery: (ingredientId: string) => void;
  toggleGroceryChecked: (ingredientId: string) => void;
  removeGroceryItem: (ingredientId: string) => void;
  clearGrocery: () => void;
  saved: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
}
export function AppStoreProvider({ children }): JSX.Element
export function useAppStore(): AppStoreValue   // throws if outside provider
export function ingredientName(id: string): string   // built-in → custom (localStorage) → id
export function recipeName(id: string): string
```
Behavior notes:
- Hydrates from `storage.get*()` in a mount effect; `hydrated` flips true after.
- Persists pantry/grocery/saved back via `storage.set*()` whenever they change *and* `hydrated`.
- `addPantryItem` de-dupes by `ingredientId`. `addGroceryItems` merges `recipeIds` immutably. `addStapleToGrocery` adds `{ ingredientId, quantity: 1, recipeIds: [], checked: false }`.
- `ingredientName()` directly reads `window.localStorage.getItem("srf:custom-ingredients")` (a browser coupling — see §5).

### 2.3 `src/lib/storage.ts` (`'use client'`)

```ts
export const STORAGE_KEYS: { pantry: "srf:pantry"; grocery: "srf:grocery"; saved: "srf:saved" };
export const storage: {
  getPantry(): PantryItem[];   setPantry(items: PantryItem[]): void;
  getGrocery(): GroceryItem[]; setGrocery(items: GroceryItem[]): void;
  getSaved(): string[];        setSaved(ids: string[]): void;
};
```
All reads/writes go through `safeRead`/`safeWrite` which guard on `typeof window === "undefined"` and try/catch JSON. **This is the single file to swap to an async storage adapter** (see §6).

### 2.4 `src/lib/recipeScoring.ts` (pure logic — port unchanged)

```ts
export function calculateRecipeCost(recipe: Recipe): number;
export function calculateCostPerServing(recipe: Recipe): number;
export function ingredientCostBreakdown(recipe: Recipe): Array<{ ingredient, quantity, optional, note, cost, source, confidence, appliedUnitCost, multiplier, regionLabel }>;
export function pantrySetFromItems(pantry: PantryItem[]): Set<string>;
export function calculatePantryMatch(recipe, pantrySet): { matched: number; total: number };
export function calculateMissingIngredients(recipe, pantrySet): RecipeIngredient[];
export function calculateMissingCost(recipe, pantrySet): number;
export function rankCheapRecipes(filters: CheapFilters): RecipeScoreResult[];
export function rankPantryRecipes(pantry: PantryItem[], filters?: Partial<CheapFilters>): RecipeScoreResult[];
export function groupPantryResults(results, pantry): { canMakeNow; needFewItems; buyOneUnlock; useSoon: RecipeScoreResult[] };
export function recommendSmartBuys(pantry: PantryItem[]): { ingredientId: string; unlocks: number; averageCostPerServing: number }[];
```
Notes: spices/staples treated as "available" (`SPICE_IDS`). `recommendSmartBuys` probes a fixed candidate staple list. **No browser APIs** — pure given the data modules + pricing engine. Pure port.

### 2.5 `src/lib/equipmentFilters.ts` (pure)

```ts
export type EquipmentProfile = "any" | "microwave-only" | "air-fryer-only" | "microwave-and-air-fryer" | "no-stovetop";
export function profileEquipment(profile): Equipment[];
export function recipeFitsEquipment(recipe, allowed: Equipment[]): boolean;
export function isAirFryerRecipe(recipe): boolean;
export function isMicrowaveRecipe(recipe): boolean;
export function isNoStoveRecipe(recipe): boolean;
```
Pure port.

### 2.6 `src/lib/customIngredientStorage.ts` (`'use client'`)

localStorage keys: `srf:custom-ingredients`, `srf:resolved-cache`.

```ts
export interface CustomIngredient {
  id: string;                 // "custom-<slug>-<n>"
  canonicalName: string;
  displayName: string;
  aliases: string[];
  category: ResolvedIngredient["category"];
  ingredientRole: ResolvedIngredient["ingredientRole"];
  storageType: ResolvedIngredient["storageType"];
  shelfLifeDays?: number | null;
  estimatedUnitCost?: number | null;
  unit?: string;
  dietaryTags: string[];
  allergyTags: string[];
  notes?: string;
  isCustomIngredient: true;
  createdByUser: boolean;
  createdByAI: boolean;
  createdAt: string;          // ISO
  updatedAt: string;          // ISO
}
export function getCustomIngredients(): CustomIngredient[];
export function makeCustomId(name: string): string;
export function saveCustomIngredient(c: CustomIngredient): CustomIngredient;
export function deleteCustomIngredient(id: string): void;
export function findExistingByName(name, builtInMap: {name;id}[]): { id; source: "builtin" | "custom" } | null;
export function resolvedToCustom(r: ResolvedIngredient): CustomIngredient;
export function getCachedResolution(raw: string): ResolvedIngredient[] | null;
export function setCachedResolution(raw: string, items: ResolvedIngredient[]): void;
```
Resolution-cache stored value shape (under `srf:resolved-cache`): `Record<lowercasedRawText, { raw: string; ingredients: ResolvedIngredient[]; at: string }>`.

### 2.7 `src/lib/customRecipeStorage.ts` (`'use client'`)

localStorage keys: `srf:custom-recipes` (recipe array), `srf:custom-recipe-images` (`Record<recipeId, StoredImage>`).

```ts
interface StoredImage { id: string; b64: string; prompt?: string; model?: string; storedAt: string; bytes: number; }  // not exported
export function makeCustomRecipeId(name: string, prefix: "gen" | "user"): string;
export function getCustomRecipes(): CustomRecipe[];
export function getCustomRecipe(id: string): CustomRecipe | undefined;
export function saveCustomRecipe(r: CustomRecipe): CustomRecipe;
export function deleteCustomRecipe(id: string): void;     // also deletes its image
export function storeRecipeImage(recipeId, b64, meta?): { ok: boolean; reason?: string };   // 1.5MB/img, 6MB total cap w/ LRU eviction
export function getStoredRecipeImage(id: string): StoredImage | undefined;
export function deleteRecipeImage(id: string): void;
export function imageDataUrl(b64: string, mediaType = "image/png"): string;   // `data:...;base64,...`
export function fallbackImageMeta(): CustomRecipeImage;
export function emptyUserRecipe(): UserCreatedRecipe;
export function isAIRecipe(r: CustomRecipe): r is AIGeneratedRecipe;
```

### 2.8 `src/lib/customRecipeTypes.ts` (pure types)

```ts
export interface CustomRecipeImage {
  src?: string; b64?: string; alt: string; sourceName: string; license: string;
  isAIGenerated: boolean; isFallback: boolean;
  generatedPrompt?: string; generatedAt?: string; model?: string;
}
export interface CustomRecipeIngredient { name; quantity: number; unit; estimatedCost: number; userAlreadyHas?; optional?; category?; }
export interface CustomRecipeStep { title?; instruction; timerMinutes?: number|null; safetyNote?: string|null; }
export interface BaseCustomRecipe { id; name; description; mealType; cuisineStyle?; servings; prepTimeMinutes; cookTimeMinutes; totalTimeMinutes; difficulty; equipment: string[]; primaryCookingMethod; noStovetopRequired; estimatedTotalCost; estimatedCostPerServing; ingredients: CustomRecipeIngredient[]; steps: string[]; guidedCookingSteps?; cheapTips?; substitutions?; makeItCheaper?; makeItHealthier?; makeItHigherProtein?; studentTips?; storageInstructions?; reheatingInstructions?; safetyNotes?; estimatedNutrition?; tags?; image: CustomRecipeImage; createdAt; updatedAt; }
export interface AIGeneratedRecipe extends BaseCustomRecipe { isAIGenerated: true; isUserCreated: false; userRequestSummary?; whyThisFits?; missingIngredients?; estimatedMissingIngredientCost?; }
export interface UserCreatedRecipe extends BaseCustomRecipe { isAIGenerated: false; isUserCreated: true; notes?; }
export type CustomRecipe = AIGeneratedRecipe | UserCreatedRecipe;
export function isAIGenerated(r: CustomRecipe): r is AIGeneratedRecipe;
```

### 2.9 `src/lib/userProgress.ts` (localStorage `srf:user-progress`)

```ts
export interface UserProgress { pantryItemsAdded; recipesGenerated; recipesSaved; mealsLogged; groceryItemsAdded; useSoonIngredientsUsed: number; }
export function getUserProgress(): UserProgress;
export function bumpProgress(key: keyof UserProgress, by = 1): number;
export function milestoneMessage(key, count): string | null;   // milestones at 1,5,10,25,50,100,250,500
```

### 2.10 `src/lib/haptics.ts` (localStorage `srf:haptics-enabled`)

```ts
export function isHapticsEnabled(): boolean;     // default true
export function setHapticsEnabled(enabled): void;
export function hapticLight(): void; hapticMedium(): void; hapticSuccess(): void; hapticWarning(): void; hapticError(): void;
```
Uses `navigator.vibrate` — **browser-only** (no-ops on iOS Safari today; in RN replace with `expo-haptics`, see §5).

### 2.11 `src/data/ingredients.ts` (data + maps)

```ts
export const INGREDIENTS: Ingredient[];                       // ~450 rows
export const INGREDIENT_MAP: Map<string, Ingredient>;         // new Map(INGREDIENTS.map(i => [i.id, i]))
export const CATEGORY_LABEL: Record<string, string>;          // category → display label
export const QUICK_ADD_STAPLES: string[];                     // 17 ingredient ids
```
Pure data — ports unchanged (TS module). Build-time constant; no I/O.

### 2.12 `src/data/pantryPresets.ts`

```ts
export interface PantryPreset { id: string; name: string; emoji: string; description: string; ingredientIds: string[]; }
export const PANTRY_PRESETS: PantryPreset[];
```
Pure data. Port unchanged.

### 2.13 `src/lib/pricing/*`

`locationTypes.ts`:
```ts
export type PriceConfidence = "high" | "medium" | "low";
export interface PriceRegion { id; label; shortLabel?; multiplier: number; notes?; }
export interface UserLocation { zipCode?; cityName?; regionId: string; manualRegion?: boolean; updatedAt: string; }
export interface IngredientPriceOverride { ingredientId; unitCost: number; unit; note?; updatedAt; }
export interface PriceQuote { ingredientId; ingredientName; baseUnitCost; appliedUnitCost; quantity; unit; totalCost; regionLabel; multiplier; source: "catalog"|"override"|"ai-estimate"|"fallback"; confidence; note?; }
export interface RecipeLocalPrice { totalCost; costPerServing; regionLabel; multiplier; breakdown: PriceQuote[]; missingTotalCost; worstConfidence; }
```
`pricingEngine.ts` (pure): `quoteIngredient(id, quantity, location?)`, `quoteRecipe(recipe, {location?, pantrySet?})`, `localCostPerServing(recipe)`, `localTotalCost(recipe)`.
`locationStorage.ts` (`srf:location`, `srf:price-overrides`): `getLocation()`, `setLocationFromZip(zip)`, `setLocationManual(regionId)`, `clearLocation()`, `listRegions()`, `getOverrides()`, `getOverride(id)`, `setOverride(...)`, `deleteOverride(id)`.
`regions.ts`: `REGIONS: PriceRegion[]`, `getRegion(id)`, `zipToRegion(zip)`.

### 2.14 `src/lib/workerClient.ts` — Cloudflare Worker client (`'use client'`)

Reads `process.env.NEXT_PUBLIC_WORKER_URL`. Used by `PantrySmartAdd` and `PantryVoiceInput` (the `resolveIngredients` + `isWorkerConfigured` exports). Full surface includes recipe generation / pricing / import endpoints (not all used by this subsystem).

Relevant to this subsystem:
```ts
export function isWorkerConfigured(): boolean;
export function workerUrl(): string;
export type IngredientCategory = "grains-and-starches" | "pasta-and-noodles" | ... | "other";   // worker taxonomy, NOT the data-model one
export type IngredientRole = "main" | "protein" | "carb" | ... | "other";
export interface ResolvedIngredient {
  canonicalName: string; displayName: string; originalText: string; aliases: string[];
  category: IngredientCategory; ingredientRole: IngredientRole;
  storageType: "pantry" | "fridge" | "freezer" | "unknown";
  shelfLifeDays?: number | null; estimatedUnitCost?: number | null; unit?: string;
  dietaryTags: string[]; allergyTags: string[]; confidence: number; notes?: string; useSoon?: boolean;
}
export interface ResolveResult { ingredients: ResolvedIngredient[]; ignoredText: string[]; clarificationNeeded: boolean; clarificationQuestion?: string; }
export async function resolveIngredients(rawInput: string, inputSource: "typed"|"voice"|"pasted"|"manual" = "typed"): Promise<ResolveResult>;
```
(Also exports: `enrichIngredient`, `matchIngredient`, `generateRecipe`, `generateRecipeOptions`, `generateRecipeImage`, `importRecipeUrl/Text`, `webSearchRecipes`, `estimateIngredientPrice`, `remixRecipe`, with `GeneratedRecipe`, `GeneratedRecipeOption(Set)`, `AIGroceryPriceEstimate`, etc. — see §4.)

### 2.15 `src/lib/anthropic.ts` — direct-browser Anthropic Haiku (`'use client'`)

Reads `process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY`. Used by `PantryPhotoUpload`, `ReceiptUpload`, `PantryAIChat`.
```ts
export function isAiEnabled(): boolean;
export interface DetectedIngredient { id: string; name: string; confidence: number; }
export interface VisionResult { recognized: DetectedIngredient[]; unrecognized: string[]; raw: string; }
export async function recognizeIngredientsFromImage(imageBase64: string, mediaType: string): Promise<VisionResult>;
export async function recognizeIngredientsFromReceipt(imageBase64: string, mediaType: string): Promise<VisionResult>;
export async function recognizeIngredientsFromText(transcript: string): Promise<VisionResult>;
export interface PantryChatTurn { role: "user" | "assistant"; content: string; }
export async function pantryChat(pantryDescription: string, history: PantryChatTurn[]): Promise<string>;
export interface HaikuRecipeInput { ... }   // AI Chef fast path (not used by these screens)
export async function generateRecipeQuick(opts): Promise<GeneratedRecipe>;
export async function generateRecipeQuickOptions(opts): Promise<GeneratedRecipeOptionSet>;
```

---

## 3. localStorage keys touched (exact strings + stored value shapes)

| Key | Written by | Stored value shape |
| --- | --- | --- |
| `srf:pantry` | AppStore via `storage.setPantry` | `PantryItem[]` |
| `srf:grocery` | AppStore via `storage.setGrocery` | `GroceryItem[]` |
| `srf:saved` | AppStore via `storage.setSaved` | `string[]` (recipe ids) |
| `srf:custom-ingredients` | `customIngredientStorage.saveCustomIngredient`; read directly by `AppStore.ingredientName` | `CustomIngredient[]` |
| `srf:resolved-cache` | `setCachedResolution` | `Record<string, { raw: string; ingredients: ResolvedIngredient[]; at: string }>` |
| `srf:custom-recipes` | `customRecipeStorage.saveCustomRecipe` (read by `/saved`) | `CustomRecipe[]` |
| `srf:custom-recipe-images` | `storeRecipeImage` (read by `/saved` `CustomCard`) | `Record<recipeId, StoredImage>` |
| `srf:location` | `pricing/locationStorage.setLocation*` (via `LocationSetup`) | `UserLocation` |
| `srf:price-overrides` | `pricing/locationStorage.setOverride` | `Record<ingredientId, IngredientPriceOverride>` |
| `srf:user-progress` | `userProgress.bumpProgress` (via `PantrySmartAdd`) | `UserProgress` |
| `srf:haptics-enabled` | `haptics.setHapticsEnabled` | string `"true"` / `"false"` |

All read/write goes through SSR-safe `typeof window === "undefined"` guards + try/catch. In RN there is no `window`; these guards make the calls return fallbacks (empty) and silently no-op writes — i.e. **without an adapter, the entire persistence layer is dead in RN.** See §6.

---

## 4. Network / request-response contracts

### 4.1 Cloudflare Worker — `POST {NEXT_PUBLIC_WORKER_URL}/ingredients/resolve`

Used by Smart Paste + Voice. JSON request/response, 60s client timeout (AbortController), 429 → "rate-limited", non-2xx → `AI request failed (status): detail`.

Request body:
```json
{ "rawInput": "<string>", "inputSource": "typed" | "voice" | "pasted" | "manual" }
```
Response (`ResolveResult`):
```json
{ "ingredients": ResolvedIngredient[], "ignoredText": string[], "clarificationNeeded": boolean, "clarificationQuestion"?: string }
```
(`worker/src/index.ts` confirms this path + JSON shape and returns `{ ingredients: [], ignoredText: [], clarificationNeeded: false }` on failure.)

Other worker endpoints exist (`/ingredients/enrich`, `/ingredients/match`, `/generate-recipe`, `/generate-recipe-options`, `/generate-recipe-image`, `/recipes/import-url`, `/recipes/import-text`, `/recipes/web-search`, `/pricing/estimate-ingredient`, `/recipes/remix`) but are **not** invoked by these four screens.

### 4.2 Anthropic Messages API — `POST https://api.anthropic.com/v1/messages` (direct from browser)

Used by Photo, Receipt, Chat. Headers:
```
Content-Type: application/json
x-api-key: <NEXT_PUBLIC_ANTHROPIC_API_KEY>
anthropic-version: 2023-06-01
anthropic-dangerous-direct-browser-access: true
```
Body:
```json
{ "model": "claude-haiku-4-5-20251001", "max_tokens": <n>, "temperature": <n>, "system": "<prompt>", "messages": [ { "role": "user"|"assistant", "content": string | MessageBlock[] } ] }
```
where for vision, `content` is `[{ "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": "<base64>" } }, { "type": "text", "text": "<catalog + instruction>" }]`.

Response parsed: `json.content[].text` concatenated. Vision responses are model-emitted JSON `{ "recognized": [{id,name,confidence}], "unrecognized": [string] }` then parsed via `parseVisionJson` (strips code fences, slices first `{` … last `}`). 30s timeout. 429 → "rate-limited".

- **Photo** (`recognizeIngredientsFromImage`): `VISION_SYSTEM`, maxTokens 1500, temp 0.1. Client resizes to max 1280px JPEG q0.85 before sending.
- **Receipt** (`recognizeIngredientsFromReceipt`): `RECEIPT_SYSTEM`, maxTokens 2000, temp 0.1. Resize max 1600px JPEG q0.9.
- **Chat** (`pantryChat`): system primes "Pesto" with the rendered pantry list; history sent as messages; maxTokens 700, temp 0.6; returns plain text (markdown rendered client-side).

After vision returns, components keep only `recognized` whose `id` is in `INGREDIENT_MAP`; the rest are pushed into `unrecognized`.

---

## 5. Browser / Next-only couplings (won't work in RN) + adaptations

| Coupling | Where | RN adaptation |
| --- | --- | --- |
| `'use client'` directive | every component + most lib files | Delete it. No meaning in RN/Expo. |
| `window.localStorage` (read/write) | `storage.ts`, `customIngredientStorage.ts`, `customRecipeStorage.ts`, `userProgress.ts`, `haptics.ts`, `pricing/locationStorage.ts`, `AppStore.ingredientName` | Replace with `@react-native-async-storage/async-storage` behind a storage adapter. **Async** — see §6 (the store hydrate-in-effect already tolerates async). Direct `localStorage` reads in `ingredientName` and `customRecipeStorage` must move behind the adapter or become async. |
| `typeof window === "undefined"` SSR guards | all storage helpers | Harmless but always true-ish logic differs; replace guard with adapter availability. |
| `process.env.NEXT_PUBLIC_WORKER_URL` / `NEXT_PUBLIC_ANTHROPIC_API_KEY` | `workerClient.ts`, `anthropic.ts` | Expo uses `process.env.EXPO_PUBLIC_*` (or `expo-constants` / `react-native-config`). Add a config shim that maps to the same `isWorkerConfigured()` / `isAiEnabled()` gates. **Security note:** shipping the Anthropic key in an app binary is worse than in a web bundle — strongly recommend routing Photo/Receipt/Chat through the Worker instead of direct browser calls (see §6). |
| Web Speech API (`window.SpeechRecognition` / `webkitSpeechRecognition`) | `PantryVoiceInput.tsx` (full `SpeechRecognition*` interface set) | **No RN equivalent.** Rebuild natively with `@react-native-voice/voice` (on-device STT) or record audio (`expo-av`) and POST to a transcription endpoint. The downstream flow (transcript → `resolveIngredients(text,"voice")` → chips) is reusable. |
| `<input type="file">` + `capture="environment"` + camera/gallery pickers | `PantryPhotoUpload.tsx`, `ReceiptUpload.tsx` | Replace with `expo-image-picker` (`launchCameraAsync` / `launchImageLibraryAsync`). |
| `URL.createObjectURL` / `revokeObjectURL` (blob preview) | Photo + Receipt | Use the picker's returned local `uri` directly in `<Image source={{uri}}/>`; no blob lifecycle. |
| `new window.Image()` + `<canvas>` + `ctx.drawImage` + `canvas.toBlob` + `btoa` (resize→base64) | `fileToBase64Resized` in Photo (1280px) + Receipt (1600px) | Use `expo-image-manipulator` to resize + return base64 (it has a `base64` output option). Replaces the entire canvas pipeline. |
| `FileReader`/`File`/`Blob`/`Uint8Array`/`arrayBuffer` | resize helpers | Eliminated by `expo-image-manipulator`. |
| `fetch` with `AbortController` | `workerClient.ts`, `anthropic.ts` | `fetch` + `AbortController` both exist in RN. **Port unchanged.** |
| `navigator.vibrate` | `haptics.ts` | Swap to `expo-haptics` (`impactAsync`, `notificationAsync`). Keep the `srf:haptics-enabled` opt-out semantics. |
| `next/link` (`<Link href>`) | `/grocery-list` (recipe links), `/saved` (`CustomCard`), pantry (`ThreeDLink`) | Replace with `expo-router` `<Link>` / `router.push`. Map web routes → RN routes (`/recipes/[id]`, `/recipes/custom?id=`, `/ai-chef`, `/cheap-recipes`, `/pantry`). |
| `next/image` | not in these files (custom cards use plain `<img>`) | `<img>` → RN `<Image>` / `expo-image`. |
| `window.location.search` (read `?method=`) | `/cheap-recipes` mount effect | Replace with `expo-router` `useLocalSearchParams()`. |
| DOM `<input>/<textarea>/<select>/<button>` + Tailwind classNames | every screen + component | Rebuild as `TextInput`, RN `<Picker>` (region select), `Pressable`, `FlatList`. All Tailwind/CSS is web-only; use NativeWind or a parallel RN style system. |
| `<input type="range">` sliders (budget, servings) | `/cheap-recipes` | `@react-native-community/slider`. |
| `<input type="checkbox">` | `/grocery-list` | RN `Pressable` + checkbox component / `expo-checkbox`. |
| CSS animations (`motion-safe:`, keyframes, `ScrollReveal`, `AnimatedNumber`) | all screens | Rebuild with `react-native-reanimated` / `Animated`; respect reduce-motion (`AccessibilityInfo.isReduceMotionEnabled`). |
| `aria-*`, `title`, focus rings | all | Map to RN a11y props (`accessibilityLabel`, `accessibilityRole`, `accessibilityState={{checked}}`). |
| `console.warn` | `AppStore`, `anthropic` parse fallbacks | Fine in RN; keep. |
| `crypto`-free `Math.random()` id gen | `makeCustomRecipeId` | Works in RN; keep (or upgrade to `expo-crypto`/uuid). |

UI primitives referenced but outside this subsystem (must be reimplemented natively but are shared design-system pieces): `Button`, `PageHeader`, `SectionHeading`, `ConfirmDialog`, `Toast`/`useToast`, `ThreeDLink`/`ThreeDButton`, `StatCard`, `VisualEmptyState`, `ScrollReveal`, `AnimatedNumber`, `RecipeCard`, `RecipeGrid`, `CategoryChip`, `SmartRecipeSearch`, `SearchZeroState`, `LocationSetup`.

---

## 6. RN port plan

### A. Moves into the shared package **unchanged** (pure TS, no browser APIs)
- `src/lib/types.ts`
- `src/lib/customRecipeTypes.ts`
- `src/lib/recipeScoring.ts`
- `src/lib/equipmentFilters.ts`
- `src/lib/pricing/pricingEngine.ts`, `pricing/locationTypes.ts`, `pricing/regions.ts`
- `src/data/ingredients.ts`, `src/data/pantryPresets.ts`, `src/data/recipes.ts` (plus the search index builder if shared)
- `src/lib/workerClient.ts` and `src/lib/anthropic.ts` networking (`fetch`/`AbortController` work in RN) — **only the env-var read needs a config shim** (`NEXT_PUBLIC_*` → `EXPO_PUBLIC_*`).

Drop `'use client'` everywhere (no-op in RN, harmless but remove for clarity).

### B. Needs a **thin platform adapter** (logic shared, I/O swapped)
- **Storage layer.** Introduce one async `KeyValueStore` interface (`get(key)`, `set(key,value)`, `remove(key)`) with a web impl (localStorage) and an RN impl (AsyncStorage). Refactor `storage.ts`, `customIngredientStorage.ts`, `customRecipeStorage.ts`, `userProgress.ts`, `haptics.ts`, `pricing/locationStorage.ts`, and `AppStore.ingredientName` to call it. **Keep every `srf:` key string identical.** Because these become async, the helpers' signatures change to `Promise<...>` — `AppStore`'s hydrate-in-effect already awaits-friendly (set state after load); the synchronous in-render reads (`getCustomIngredients()` inside `useMemo` on pantry/grocery, `getStoredRecipeImage` in `CustomCard`) must be hoisted into effects that populate state (the grocery + saved pages already do exactly this pattern with `customById`/`customRecipes` state — replicate for pantry's `grouped`).
- **Config shim.** `isWorkerConfigured()` / `isAiEnabled()` read from Expo env.
- **AppStore context.** Port the React context/hooks unchanged conceptually; only the storage calls become async (hydrate effect). Provider tree order constraint (`AppStoreProvider` wraps Toast) still applies.
- **Haptics.** Replace `navigator.vibrate` body with `expo-haptics`; keep the public API + opt-out flag.
- **Image resize → base64.** Replace `fileToBase64Resized` (canvas) with an `expo-image-manipulator` impl returning `{ base64, mediaType }`. Same downstream `recognizeIngredientsFromImage/Receipt` calls.

### C. Must be **rebuilt natively** (UI + platform features)
- **All four screens' UI** (`pantry`, `grocery-list`, `saved`, `cheap-recipes`) — rebuild views with RN primitives + `FlatList`; reuse all derived-state logic (`grouped`, `rankCheapRecipes`, `groupPantryResults`, filter/sort pipeline) verbatim.
- **Voice input** — Web Speech API has no RN port. Rebuild with `@react-native-voice/voice` (or audio capture + server STT). Keep `resolveIngredients(transcript,"voice")` flow + result chip UI.
- **Photo & Receipt capture** — `expo-image-picker` (camera + library) + `expo-image-manipulator`. Reuse the recognize → filter-by-catalog → add-to-pantry flow.
- **AI Chat** — rebuild the chat surface (message list, starters, input). Reuse `pantryChat` + the `**bold**` markdown mini-renderer (replace `<strong>` with `<Text style={{fontWeight}}>`).
- **Design-system primitives** referenced (`Button`, `Toast`/`useToast`, `ConfirmDialog`, `PageHeader`, `SectionHeading`, `StatCard`, `VisualEmptyState`, `ScrollReveal`, `AnimatedNumber`, `RecipeCard`, `RecipeGrid`, `CategoryChip`, `SmartRecipeSearch`, `SearchZeroState`, `LocationSetup`, `ThreeDLink`) — reimplement once in RN; they ripple across all screens (per CLAUDE.md, `RecipeCard` is shared everywhere).
- **Sliders / checkboxes / region picker** — `@react-native-community/slider`, `expo-checkbox`, RN `Picker`.
- **Routing / deep-link param** (`?method=`, recipe links) — `expo-router`.
- **Animations** — `react-native-reanimated`, honoring reduce-motion.

### D. Strong recommendation
Move the Anthropic direct-browser calls (Photo/Receipt/Chat) behind the Cloudflare Worker for the RN build. Embedding `NEXT_PUBLIC_ANTHROPIC_API_KEY` in a shipped app binary is a materially worse exposure than a web bundle. The `VisionResult` / `PantryChatTurn` contracts can stay identical; only the transport (worker endpoint vs `api.anthropic.com`) changes, isolated inside `anthropic.ts`.
