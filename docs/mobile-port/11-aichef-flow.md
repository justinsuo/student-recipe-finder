# AI Chef Flagship Flow — Mobile Port Brief

Subsystem: `src/app/ai-chef/page.tsx` (1937 lines) + `src/components/ai/*` (4 files), plus the
data/network contracts they depend on (`workerClient.ts`, `anthropic.ts`, `customRecipeTypes.ts`,
`customRecipeStorage.ts`, `customIngredientStorage.ts`, `LogGeneratedRecipeButton.tsx`,
`AppStore.tsx`, `storage.ts`).

This is the flagship "generate a recipe from my pantry + constraints" screen. It must be rebuilt
mobile-native, but the **logic + data contracts below are shareable verbatim** in an Expo app.

---

## 0. High-level flow

```
User picks a MODE (pantry | have | imagine | web | url | paste)
  → fills constraints (budget, servings, equipment, diet, time, creativity, autoImage, notes/cravings)
  → taps Generate
      ├─ MODE pantry/have/imagine ──► runOptions(false)  → 4-up parallel options
      │      ├─ if isAiEnabled()  → generateRecipeQuickOptions() (4 parallel Haiku calls, browser, ~3-5s)
      │      └─ else if worker     → generateRecipeOptions() (1 worker mega-call, ~22s)
      │      → persist all 4 to localStorage, lazy-gen image for main option
      │      → user picks an option bubble → selectOption() lazy-gens its image
      └─ MODE web/url/paste ───────► run()  → single GeneratedRecipe
             ├─ web  → webSearchRecipes() → list of WebRecipeCandidate cards (no recipe yet)
             ├─ url  → importRecipeUrl()  → {recipe, source}
             ├─ paste→ importRecipeText() → {recipe, source}
             └─ (fallthrough) → generateRecipeQuick() [Haiku] OR generateRecipe() [worker]
             → reconcileNutrition() → persist → autoImage gen
Refinements (only after a single `recipe` exists): run("make it cheaper" | "make it higher protein"
  | "make it faster" | "use fewer missing ingredients" | "regenerate with new creative angle")
Output → save (bookmark), add missing → grocery, log → Nourish diary.
```

Two parallel render paths exist in the page:
- **Options article** (`selectedOption && selectedOptionId`) — the 4-up bubble flow (pantry/have/imagine).
- **Single recipe article** (`recipe && savedId`) — web/url/paste + refinements.

---

## 1. Exported symbols (the page file)

`src/app/ai-chef/page.tsx` exports exactly **one** symbol:

```ts
export default function AIChefPageWrapper(): JSX.Element
```
It wraps `<AIChefPage/>` in a React `<Suspense fallback={…}>`. `AIChefPage`, `Chip`, `ModeChip`,
and all helpers (`reconcileNutrition`, `money`, `pickOne`, `buildCreativeSeed`) are **module-private**.

### Module-private constants (copy into shared package)
```ts
const STARTER_PROMPTS: string[]        // 4 example prompts (imagine/craving mode)
const EQUIPMENT_OPTS = ["microwave","stovetop","oven","rice-cooker","air-fryer"];
const DIET_OPTS = ["vegetarian","vegan","high-protein","gluten-free","dairy-free"];
const CREATIVE_CUISINES: string[]      // 8 e.g. "Korean × Italian"
const CREATIVE_TECHNIQUES: string[]    // 8 e.g. "steam-then-sear"
const CREATIVE_FORMATS: string[]       // 8 e.g. "served on a savory waffle"
const CREATIVE_FLAVOR_ANCHORS: string[]// 8 e.g. "gochujang + honey"
```

### Module-private helpers
```ts
function reconcileNutrition(r: GeneratedRecipe): GeneratedRecipe
//   Recomputes per-serving macros via calculateNutritionForFreeForm(r.ingredients, r.servings||1).
//   Prefers the deterministic engine result when AI returned all-zero/non-finite macros OR
//   when calc.confidence !== "low". Fixes the visible "0 calories" bug. PURE — fully portable.

function money(n: unknown): string   // "x.xx" or "—" (guards AI returning non-numeric cost). PURE.

function pickOne<T>(arr: readonly T[], salt: number): T   // Math.random-based pick. PURE-ish.
function buildCreativeSeed(): string  // composes one cuisine+technique+format+anchor sentence. PURE.
```

### Component-internal state (defines the form contract)
```ts
mode: "pantry" | "have" | "imagine" | "web" | "url" | "paste"   // default "pantry"
selectedPantryIds: Set<string>          // pantry ingredientIds to include (default = all pantry)
ingredients: string                     // comma/newline textarea (have/web modes)
cravings: string                        // craving text (imagine/pantry/web)
importUrl: string                       // url mode
pasteText, pasteSourceUrl, pasteCreator: string
pastePlatform: "tiktok"|"instagram"|"youtube"|"pinterest"|"reddit"|"other"  // default "tiktok"
webCandidates: WebRecipeCandidate[] | null
sourceMeta: RecipeSourceMetadata | null
budget: number    // default 3, slider 0.5–30 step 0.5
servings: number  // default 2, slider 1–6 step 1
equipment: string[]                     // default [...EQUIPMENT_OPTS] (all on)
diet: string[]                          // default []
timeLimit: string                       // "any"|"under 10/20/30 minutes"|"meal prep", default "any"
creativity: "practical"|"balanced"|"creative"   // default "balanced"
autoImage: boolean                      // default true
aiNotes: string                         // "Notes for AI" (pantry mode, creative direction)
// loading flags + results:
loading, imageLoading, appending: boolean
error, imageError: string | null
recipe: GeneratedRecipe | null          // single-recipe path
savedId: string | null
savedImageDataUrl: string | null
options: GeneratedRecipeOption[]        // 4-up path
selectedOptionId: string | null
optionImages: Record<string,string>     // optionId → data-url/url
optionSavedIds: Record<string,string>   // optionId → custom recipe id
generatingImageIds: Set<string>
```

### Key page functions (port as hook/controller methods)
- `run(refinement?: string)` — single-recipe path. Branches by mode; for non-import modes uses
  `generateRecipeQuick` (if `isAiEnabled()`) else `generateRecipe`. Calls `reconcileNutrition`,
  persists an `AIGeneratedRecipe`, toasts, then (if `autoImage`) generates + stores an image.
- `runOptions(append = false)` — 4-up path. Requires `isWorkerConfigured()` (early-returns otherwise,
  even though the quick path is Haiku — note this gating quirk). Builds creative seed when `mode==="imagine"`.
  Uses `generateRecipeQuickOptions` if `isAiEnabled()` else `generateRecipeOptions`. Persists every option,
  lazy-gens main image, toasts. Guards the "0 options returned" edge with a real error.
- `generateImageForOption(o)` — per-option lazy image gen; updates `optionImages` + re-saves recipe image.
- `persistOption(o): string` — reconciles nutrition, saves `AIGeneratedRecipe`, returns id (idempotent per option).
- `selectOption(id)` — sets selection; lazy-gens image if `autoImage` and none yet.
- `addAllMissingToGrocery()` — resolves each missing ingredient to a built-in or custom ingredient id,
  then calls `addGroceryItems(recipeLike, [id])` per item.
- `toggleSet(set,v)` — array toggle helper.

---

## 2. The 4 `src/components/ai/*` components

### `GeneratedRecipeOptionBubbles.tsx`
```ts
export function GeneratedRecipeOptionBubbles(props: {
  options: GeneratedRecipeOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  images: Record<string, string | undefined>;   // optionId → data-url
  generatingImageIds: Set<string>;
}): JSX.Element
```
Horizontal-scroll strip of 4 cards (image/spinner/placeholder, label pill, name, shortReason,
$ per serving + total minutes). Label color/text maps:
`LABEL_TONES`/`LABEL_TEXT` keyed by `OptionLabel`
(`best-match`, `cheapest`, `fastest`, `most-creative`, `uses-most-pantry`, `high-protein`,
`comfort-food`, `wildcard`).

### `AIChefPantrySelector.tsx`
```ts
export function AIChefPantrySelector(props: {
  selectedIds: Set<string>;
  onChange: (ids: Set<string>) => void;
}): JSX.Element
```
Controlled chip toggles. Reads `useAppStore().pantry` + `hydrated`, resolves ids→names via
`INGREDIENT_MAP` (built-in) and `getCustomIngredients()` (localStorage). Toggling a chip only
includes/excludes for the request — never mutates the pantry. Shows empty state with link to `/pantry`,
"Select all"/"Select none", `useSoon` badge.

### `AIChefSteppedLoader.tsx`
```ts
export function AIChefSteppedLoader(props?: {
  label?: string;        // default "Cooking up your options"
  stages?: string[];     // default DEFAULT_STAGES (6 stages)
  intervalMs?: number;   // default 900
}): JSX.Element
```
Pure presentational staged "AI is thinking" panel. Auto-advances a timer with `setInterval`; honors
`prefers-reduced-motion` via `window.matchMedia`.

### `AIChefDemoHero.tsx`
```ts
export function AIChefDemoHero(): JSX.Element
```
Marketing hero (input→AI orb→recipe preview). Uses `motion/react` (`motion`, `useReducedMotion`) and
`next/link`. Hardcoded demo content (chicken/rice/broccoli, "$2.40/serving"). No data deps.

---

## 3. Exact data shapes (copy verbatim — these are the shareable contracts)

### From `src/lib/workerClient.ts`

```ts
export interface GeneratedRecipe {
  name: string;
  description: string;
  userRequestSummary: string;
  whyThisFits: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "meal-prep";
  cuisineStyle: string;
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
  estimatedMissingIngredientCost: number;
  ingredients: Array<{
    name: string; quantity: number; unit: string;
    estimatedCost: number; userAlreadyHas: boolean; optional: boolean; category: string;
  }>;
  missingIngredients: Array<{
    name: string; estimatedCost: number;
    importance: "required" | "recommended" | "optional";
    cheapSubstitute?: string | null;
  }>;
  steps: string[];
  guidedCookingSteps: Array<{
    title: string; instruction: string;
    timerMinutes?: number | null; safetyNote?: string | null;
  }>;
  cheapTips: string[];
  substitutions: Array<{ original: string; swap: string; why: string; estimatedSavings?: number | null }>;
  makeItCheaper: string[];
  makeItHealthier: string[];
  makeItHigherProtein: string[];
  pantryStaplesUsed: string[];
  optionalAddIns: string[];
  studentTips: string[];
  storageInstructions: string;
  reheatingInstructions: string;
  safetyNotes: string[];
  estimatedNutrition: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  tags: string[];
  imagePromptHint?: string;
}

export type OptionLabel =
  | "best-match" | "cheapest" | "fastest" | "most-creative"
  | "uses-most-pantry" | "high-protein" | "comfort-food" | "wildcard";

export interface GeneratedRecipeOption {
  id: string;
  optionLabel: OptionLabel;
  shortReason: string;
  pantryMatchScore: number;
  selectedByDefault: boolean;
  notesInfluenceSummary?: string;
  recipe: GeneratedRecipe;
}
export interface GeneratedRecipeOptionSet { mainOptionId: string; options: GeneratedRecipeOption[]; }

export interface GenerateRecipeInput {
  ingredients?: string[]; budgetPerServing?: number; servings?: number;
  equipment?: string[]; timeLimit?: string; dietTags?: string[];
  mealType?: string; cravings?: string;
  creativity?: "practical" | "balanced" | "creative"; refinement?: string;
}
export interface GenerateOptionsInput {
  pantryIngredients?: string[]; selectedPantryIngredientIds?: string[]; ingredients?: string[];
  aiNotes?: string; cravingText?: string; budgetPerServing?: number; servings?: number;
  equipment?: string[]; dietTags?: string[];
  creativityLevel?: "practical" | "balanced" | "creative";
  appendToExisting?: boolean; previousOptions?: Array<{ recipe: { name: string } }>;
}
export interface GenerateImageResult { b64_json?: string; url?: string; prompt: string; model: string; }

export interface RecipeSourceMetadata {
  sourceType: "internal"|"ai-generated"|"food-blog"|"recipe-site"|"creator-blog"|"youtube"
    |"instagram"|"tiktok"|"reddit"|"pinterest"|"manual-user-link"|"unknown-web";
  sourceUrl?: string; sourceName?: string; creatorName?: string;
  datePublished?: string; dateAccessed: string; citationRequired: boolean;
  attributionText?: string; imageUrl?: string;
  transformedByAI?: boolean; importedFromUserLink?: boolean; structuredDataAvailable?: boolean;
}
export interface ImportRecipeResult { recipe: GeneratedRecipe; source: RecipeSourceMetadata; }

export interface WebRecipeCandidate {
  name: string; summary: string; sourceUrl: string;
  sourceName?: string; creatorName?: string;
  estimatedTotalTimeMinutes?: number | null; estimatedServings?: number | null;
  detectedIngredients: string[]; detectedEquipment: string[]; dietTags: string[];
  whyRecommended: string; imageUrl?: string | null;
}
```

### From `src/lib/anthropic.ts` (Haiku fast path)
```ts
export interface HaikuRecipeInput {
  pantryIngredients?: string[]; cravings?: string; budgetPerServing?: number; servings?: number;
  equipment?: string[]; dietTags?: string[]; timeLimit?: string; refinement?: string;
  creativityBoost?: boolean;   // imagine mode: raises temp to 0.95 + injects CREATIVITY_DIRECTIVE
  creativeSeed?: string;       // per-click variation seed
}
export function isAiEnabled(): boolean;     // NEXT_PUBLIC_ANTHROPIC_API_KEY present
export function generateRecipeQuick(opts: HaikuRecipeInput): Promise<GeneratedRecipe>;
export function generateRecipeQuickOptions(opts: HaikuRecipeInput): Promise<GeneratedRecipeOptionSet>;
// (also: recognizeIngredientsFrom Image/Receipt/Text, pantryChat — used by pantry sub-uploads)
```
Internally a `SlimHaikuRecipe` (subset) is parsed then `expandToFullRecipe()` fills defaults
(missingIngredients=[], guidedCookingSteps=[], nutrition all-0 → later fixed by `reconcileNutrition`).
Model = `claude-haiku-4-5-20251001`, temp 0.6 (0.95 creative). 4 parallel calls in options path with
distinct role hints (`SAFE_ROLES` vs `CREATIVE_ROLES`).

### From `src/lib/customRecipeTypes.ts` (the persisted shape)
```ts
export interface CustomRecipeImage {
  src?: string; b64?: string; alt: string; sourceName: string; license: string;
  isAIGenerated: boolean; isFallback: boolean;
  generatedPrompt?: string; generatedAt?: string; model?: string;
}
export interface CustomRecipeIngredient {
  name: string; quantity: number; unit: string; estimatedCost: number;
  userAlreadyHas?: boolean; optional?: boolean; category?: string;
}
export interface BaseCustomRecipe { /* id,name,description,mealType,servings,times,difficulty,
  equipment,primaryCookingMethod,noStovetopRequired,costs,ingredients,steps,...,image,createdAt,updatedAt */ }
export interface AIGeneratedRecipe extends BaseCustomRecipe {
  isAIGenerated: true; isUserCreated: false;
  userRequestSummary?: string; whyThisFits?: string;
  missingIngredients?: Array<{ name:string; estimatedCost:number;
    importance:"required"|"recommended"|"optional"; cheapSubstitute?:string|null }>;
  estimatedMissingIngredientCost?: number;
}
export type CustomRecipe = AIGeneratedRecipe | UserCreatedRecipe;
```

### Store / pantry / nourish shapes
```ts
// src/lib/types.ts
export interface PantryItem  { ingredientId: string; quantity?: number; useSoon?: boolean; }
export interface GroceryItem { ingredientId: string; quantity: number; recipeIds: string[]; checked: boolean; }
// src/lib/nourish/types.ts
export interface FoodItem  { id; source:"usda"|"custom"|"recipe"; externalId?; name; brand?;
  servingDescription; servingGrams?; kcal; proteinG; carbG; fatG; fiberG?; }
export interface DiaryEntry{ id; date; meal:MealSlot; food:FoodItem; quantityServings;
  snapshotKcal; snapshotProteinG; snapshotCarbG; snapshotFatG; loggedAt; }
```

---

## 4. localStorage keys touched (DO NOT RENAME the `srf:` prefix)

| Key | Module | Stored value shape | Touched how |
| --- | --- | --- | --- |
| `srf:custom-recipes` | customRecipeStorage | `CustomRecipe[]` | save/read every generated recipe + option |
| `srf:custom-recipe-images` | customRecipeStorage | `Record<recipeId, StoredImage>` where `StoredImage = {id,b64,prompt?,model?,storedAt,bytes}` | `storeRecipeImage` (1.5 MB/image, 6 MB total cap, oldest-evicted) |
| `srf:custom-ingredients` | customIngredientStorage | `CustomIngredient[]` | read (resolve pantry id→name); write when missing→grocery creates a custom ingredient |
| `srf:resolved-cache` | customIngredientStorage | `Record<string, CachedResolution>` | (indirect, smart-add) |
| `srf:pantry` | storage.ts / AppStore | `PantryItem[]` | read (selected pantry ingredients) |
| `srf:grocery` | storage.ts / AppStore | `GroceryItem[]` | write via `addGroceryItems` (add missing) |
| `srf:saved` | storage.ts / AppStore | `string[]` (recipe ids) | read/write via `isSaved`/`toggleSaved` (bookmark) |
| `srf:location` | storage.ts | location object | (indirect via pricing) |
| `srf:nourish-diary` | nourish/storage | `DiaryEntry[]` | write via `addDiaryEntry` (Log to Nourish) |

`STORAGE_KEYS` exported from `storage.ts`; `NOURISH_KEYS` from `nourish/storage.ts`. All reads/writes are
SSR-guarded (`typeof window === "undefined"`).

---

## 5. Network / request-response contracts

All worker calls go through `postJson(path, body)` → `POST {NEXT_PUBLIC_WORKER_URL}{path}`,
`Content-Type: application/json`, 60s AbortController timeout. 429 → "rate-limited"; non-ok → throws
`AI request failed (status): detail`.

| Function | Method + Path | Request body | Response |
| --- | --- | --- | --- |
| `generateRecipe` | POST `/generate-recipe` | `GenerateRecipeInput` | `GeneratedRecipe` |
| `generateRecipeOptions` | POST `/generate-recipe-options` | `GenerateOptionsInput` | `GeneratedRecipeOptionSet` |
| `generateRecipeImage` | POST `/generate-recipe-image` | `{recipeName?,prompt?,ingredients?,method?}` | `{b64_json?,url?,prompt,model}` |
| `importRecipeUrl` | POST `/recipes/import-url` | `{url,ingredients?,budgetPerServing?,equipment?,dietTags?,servings?}` | `ImportRecipeResult` |
| `importRecipeText` | POST `/recipes/import-text` | `{text,sourceUrl?,sourcePlatform?,creatorName?,ingredients?,budgetPerServing?,equipment?,dietTags?,servings?}` | `ImportRecipeResult` |
| `webSearchRecipes` | POST `/recipes/web-search` | `{ingredients?,cravings?,equipment?,dietTags?,budgetPerServing?,maxResults?}` | `{candidates: WebRecipeCandidate[]}` |

**Direct Anthropic (browser)** — `generateRecipeQuick` / `generateRecipeQuickOptions`:
- POST `https://api.anthropic.com/v1/messages`
- Headers: `x-api-key: NEXT_PUBLIC_ANTHROPIC_API_KEY`, `anthropic-version: 2023-06-01`,
  `anthropic-dangerous-direct-browser-access: true`
- Body: `{model:"claude-haiku-4-5-20251001", max_tokens, temperature, system, messages}`
- 30s timeout. Response `content[]` text → JSON-parsed (`parseHaikuJson`, strips ``` fences).

---

## 6. Browser / Next-only couplings (won't work in RN) + adaptations

| Coupling | Where | RN adaptation |
| --- | --- | --- |
| `"use client"` | every file | Remove — meaningless in RN; all RN code is client. |
| `next/link` (`<Link href>`) | page, hero, pantry selector | Replace with `expo-router` `<Link>` / `router.push`. |
| `next/image` | **not used here** (raw `<img>` + eslint-disable) | n/a, but `<img>` → RN `<Image source={{uri}}>`. |
| Raw `<img src={dataUrl}>` / `<img src={img.url}>` | page hero + bubbles | RN `<Image>`; base64 data-urls work via `{uri: "data:image/png;base64,…"}`. |
| `localStorage` (sync) via `window.localStorage` | all storage modules | Swap for an async KV: `expo-secure-store`/`AsyncStorage` or MMKV (sync). Storage API is currently **synchronous** — wrap behind an async-or-MMKV adapter; MMKV keeps the sync signature. |
| `typeof window === "undefined"` SSR guards | storage, loader, pantry selector | Drop guards (always defined in RN) — but keep storage behind the adapter. |
| `window.matchMedia("(prefers-reduced-motion)")` | `AIChefSteppedLoader` | RN: `AccessibilityInfo.isReduceMotionEnabled()` + `addEventListener('reduceMotionChanged')`. |
| `process.env.NEXT_PUBLIC_WORKER_URL` / `NEXT_PUBLIC_ANTHROPIC_API_KEY` | workerClient, anthropic | Expo: `process.env.EXPO_PUBLIC_WORKER_URL` / `EXPO_PUBLIC_ANTHROPIC_API_KEY` (or `expo-constants`). Same "missing → offline" handling. |
| `fetch` + `AbortController` | both clients | Works in RN as-is (RN polyfills fetch + AbortController). |
| `new URL(c.sourceUrl).hostname` | web candidates render | RN Hermes supports `URL` via `react-native-url-polyfill/auto` (import once at entry). |
| `<a href target="_blank" rel="noreferrer">` (open original) | web/source cards | `Linking.openURL(url)`. |
| `motion/react` (`motion`, `useReducedMotion`) | `AIChefDemoHero` | Replace with `react-native-reanimated` / `moti`. Hero is marketing — likely **rebuild**. |
| Tailwind className strings + CSS keyframes (`fadeUp`, `popIn`, `dot-grid`, `[mask-image]`, `accent-emerald`, gradients, `tabular-nums`) | everywhere | Rebuild styling with NativeWind or StyleSheet; CSS keyframes → Reanimated; range `<input type=range>` → `@react-native-community/slider`; `<select>` → picker; checkbox → Switch. |
| `lucide-react` icons | all | `lucide-react-native`. |
| `toast` (`useToast`) — DOM toast provider | page | RN toast lib (e.g. `react-native-toast-message`) or custom; same kinds success/reward/info/error. |
| `hapticMedium()` (`src/lib/haptics`) | Generate button | `expo-haptics` `Haptics.impactAsync(Medium)`. |
| Sub-uploads `PantryPhotoUpload` / `ReceiptUpload` / `PantrySmartAdd` (file input + `FileReader` + camera) | pantry mode | **Rebuild native**: `expo-image-picker`/`expo-camera` → base64 → `recognizeIngredientsFrom Image/Receipt`. The Anthropic vision functions are reusable; only the file-capture UI is browser-bound. |
| DOM `<textarea>/<input>/<select>` controlled inputs | form | RN `<TextInput>` / picker / slider. |

**Not RN-blocking (portable as-is):** all of `workerClient.ts`, `anthropic.ts` (logic + fetch),
`customRecipeTypes.ts`, `reconcileNutrition`, `money`, `buildCreativeSeed`, `nutritionEngine`,
ingredient resolution, and the storage modules' *logic* (only the `localStorage` calls need an adapter).

---

## 7. RN port plan

**A. Moves into the shared package UNCHANGED (pure TS, no DOM):**
- `workerClient.ts` (all interfaces + functions; `fetch`+`AbortController` work in RN).
- `anthropic.ts` (model config, prompt builders `QUICK_RECIPE_SYSTEM` / `CREATIVITY_DIRECTIVE` /
  `SAFE_ROLES` / `CREATIVE_ROLES`, `expandToFullRecipe`, `parseHaikuJson`, vision parsers).
- `customRecipeTypes.ts`, `types.ts` (PantryItem/GroceryItem), `nourish/types.ts`.
- Pure helpers: `reconcileNutrition`, `money`, `pickOne`, `buildCreativeSeed`, `nutritionEngine`,
  `customIngredientStorage` resolution logic (`resolvedToCustom`, `findExistingByName`).
- The flow controller logic of `run` / `runOptions` / `persistOption` / `generateImageForOption` /
  `selectOption` / `addAllMissingToGrocery` — extract into a framework-agnostic `useAIChef()` hook
  (state via React, side-effects via injected storage/toast/haptic adapters).
- Constants: `STARTER_PROMPTS`, `EQUIPMENT_OPTS`, `DIET_OPTS`, `CREATIVE_*`, `LABEL_TONES`/`LABEL_TEXT`.

**B. Needs a thin platform adapter (logic shared, I/O swapped):**
- **Storage adapter**: replace `window.localStorage` in `customRecipeStorage`, `customIngredientStorage`,
  `storage.ts`, `nourish/storage.ts` with MMKV (keeps sync API) or AsyncStorage (async). Keep the exact
  `srf:` key strings + value shapes so a future shared backend/sync stays compatible.
- **Env adapter**: `NEXT_PUBLIC_*` → `EXPO_PUBLIC_*` (`isWorkerConfigured`, `isAiEnabled` unchanged otherwise).
- **AppStore**: port `AppStoreProvider`/`useAppStore` as-is but back it with the storage adapter; its
  reducer logic (`addGroceryItems`, `toggleSaved`, `isSaved`, pantry sync) is portable.
- **Toast / haptics / reduce-motion**: inject RN implementations behind the same call sites.
- **Linking**: `Linking.openURL` for external recipe sources; `react-native-url-polyfill` for `URL`.

**C. Must be rebuilt natively (UI only — logic comes from A/B):**
- `AIChefPage` screen chrome: mode chips, sliders (budget/servings), pickers (time/platform),
  equipment/diet/creativity chips, autoImage Switch, Generate button, refinement buttons,
  results layout (StatCard grid, ingredients/steps cards, missing-ingredients card).
- `AIChefPantrySelector` (chip toggles — logic portable, chips native).
- `GeneratedRecipeOptionBubbles` (horizontal `FlatList` of option cards).
- `AIChefSteppedLoader` (timer + reduce-motion logic portable; visuals native + Reanimated).
- `AIChefDemoHero` (pure marketing — rebuild with Moti/Reanimated; lowest priority).
- `LogGeneratedRecipeButton` (collapsible logger — logic in `addDiaryEntry` is portable).
- The three pantry sub-uploads (`PantryPhotoUpload`/`ReceiptUpload`/`PantrySmartAdd`) — rebuild capture
  with `expo-image-picker`/`expo-camera`; reuse `recognizeIngredientsFrom*` from `anthropic.ts`.

**Graceful-degradation rules to preserve in RN:**
- If `!isWorkerConfigured()` → show "AI Chef is taking a break" card; disable Generate; `runOptions` no-ops.
  (Note the quirk: `runOptions` is gated on the *worker* even though the quick path is Haiku — match or
  intentionally fix this in the port.)
- If `!isAiEnabled()` → fall back to worker path automatically.
- Image gen failures are **non-fatal** (recipe still saves); 403/"verified" → show OpenAI org-verification hint.
- `reconcileNutrition` + `money` guard bad/zero AI numbers — keep them in the shared layer.
- "0 options returned" → real error toast, never a celebratory "Created 0 recipes".
- Never surface raw model IDs / JSON / HTTP status to the user.
