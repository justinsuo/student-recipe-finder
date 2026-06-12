# Mobile Port Brief 07 — Worker Client + Chatbot (Pesto)

Subsystem files:
- `src/lib/workerClient.ts` — thin HTTP client for the Cloudflare Worker (AI / OpenAI proxy).
- `src/lib/chatbot.ts` — fully local, deterministic rule-based chatbot ("Pesto"). **No network, no AI, no storage.**

Supporting/consumer files referenced for shapes:
- `src/lib/types.ts` (`Recipe`, `PantryItem`, `DietTag`, `Equipment`, `MealType`, etc.)
- `src/lib/recipeScoring.ts` (`rankCheapRecipes`, `rankPantryRecipes`, `calculateCostPerServing`)
- `src/data/ingredients.ts` (`INGREDIENTS`, `INGREDIENT_MAP`), `src/data/recipes.ts` (`RECIPES`, `RECIPE_MAP`)
- `src/components/layout/Chatbot.tsx` (the only UI consumer of `chatRespond`)
- `worker/src/index.ts` (the server side of every `workerClient` call)

---

## PART A — `src/lib/workerClient.ts`

### A.1 Purpose & configuration

A thin `fetch`-based client. It proxies **all OpenAI calls** through a Cloudflare Worker so the OpenAI key never reaches the client. (Anthropic Haiku calls go elsewhere — `src/lib/anthropic.ts`, browser-direct — and are NOT part of this file.)

Worker base URL configuration:

```ts
const WORKER_URL = (process.env.NEXT_PUBLIC_WORKER_URL ?? "").replace(/\/$/, "");
```

- Injected at **build time** via env var `NEXT_PUBLIC_WORKER_URL`.
- Trailing slash stripped once at module load.
- If empty, the app is "AI offline" — every POST throws `"AI is not configured. NEXT_PUBLIC_WORKER_URL is not set on this build."`
- File starts with `"use client";` (Next.js client-component directive).
- Timeout constant: `WORKER_TIMEOUT_MS = 60_000` (60s; generous because recipe generation is slow).

Note: `NEXT_PUBLIC_WORKER_URL` is **not** in `.env.local.example` (that file only documents Spoonacular/Edamam/Explore + `ANTHROPIC_API_KEY`). The worker URL is expected to be set in the build/CI environment.

### A.2 Exported symbols (full signatures)

**Config helpers**
```ts
export function isWorkerConfigured(): boolean;   // WORKER_URL.length > 0
export function workerUrl(): string;             // returns WORKER_URL (possibly "")
```

**Ingredient intelligence**
```ts
export type IngredientCategory =
  | "grains-and-starches" | "pasta-and-noodles" | "beans-and-lentils"
  | "canned-goods" | "frozen" | "fresh-vegetables" | "fruit"
  | "eggs-and-dairy" | "meat-and-seafood" | "tofu-and-plant-protein"
  | "condiments-and-sauces" | "spices" | "bread-and-tortillas"
  | "snacks" | "beverages" | "baking" | "other";
// NOTE: this is a DIFFERENT enum from the domain `IngredientCategory` in
// src/lib/types.ts (which is "grain"|"protein"|... ). They collide by name —
// in the shared package give them distinct names (e.g. AICategory vs IngredientCategory).

export type IngredientRole =
  | "main" | "protein" | "carb" | "vegetable" | "fruit" | "fat"
  | "seasoning" | "sauce" | "acid" | "sweetener" | "binder" | "liquid" | "other";

export interface ResolvedIngredient { /* see A.4 */ }
export interface ResolveResult { /* see A.4 */ }
export async function resolveIngredients(
  rawInput: string,
  inputSource: "typed" | "voice" | "pasted" | "manual" = "typed",
): Promise<ResolveResult>;

export interface EnrichResult { /* see A.4 */ }
export async function enrichIngredient(name: string): Promise<EnrichResult>;

export interface MatchResult { /* see A.4 */ }
export async function matchIngredient(pantry: string, required: string): Promise<MatchResult>;
```

**Recipe generation**
```ts
export interface GenerateRecipeInput { /* see A.4 */ }
export interface GeneratedRecipe { /* see A.4 — large */ }
export async function generateRecipe(input: GenerateRecipeInput): Promise<GeneratedRecipe>;

export type OptionLabel =
  | "best-match" | "cheapest" | "fastest" | "most-creative"
  | "uses-most-pantry" | "high-protein" | "comfort-food" | "wildcard";
export interface GeneratedRecipeOption { /* see A.4 */ }
export interface GeneratedRecipeOptionSet { /* see A.4 */ }
export interface GenerateOptionsInput { /* see A.4 */ }
export async function generateRecipeOptions(input: GenerateOptionsInput): Promise<GeneratedRecipeOptionSet>;
```

**Image generation**
```ts
export interface GenerateImageResult { b64_json?: string; url?: string; prompt: string; model: string; }
export async function generateRecipeImage(opts: {
  recipeName?: string; prompt?: string; ingredients?: string[]; method?: string;
}): Promise<GenerateImageResult>;
```

**Recipe sources (URL/text import, web search, remix)**
```ts
export interface RecipeSourceMetadata { /* see A.4 */ }
export interface ImportRecipeResult { recipe: GeneratedRecipe; source: RecipeSourceMetadata; }
export async function importRecipeUrl(opts: {
  url: string; ingredients?: string[]; budgetPerServing?: number;
  equipment?: string[]; dietTags?: string[]; servings?: number;
}): Promise<ImportRecipeResult>;
export async function importRecipeText(opts: {
  text: string; sourceUrl?: string;
  sourcePlatform?: "tiktok"|"instagram"|"youtube"|"pinterest"|"reddit"|"other";
  creatorName?: string; ingredients?: string[]; budgetPerServing?: number;
  equipment?: string[]; dietTags?: string[]; servings?: number;
}): Promise<ImportRecipeResult>;

export interface WebRecipeCandidate { /* see A.4 */ }
export async function webSearchRecipes(opts: {
  ingredients?: string[]; cravings?: string; equipment?: string[];
  dietTags?: string[]; budgetPerServing?: number; maxResults?: number;
}): Promise<{ candidates: WebRecipeCandidate[] }>;
```

**AI grocery pricing**
```ts
export interface GroceryPriceSource { /* see A.4 */ }
export interface AIGroceryPriceEstimate { /* see A.4 */ }
export interface EstimateIngredientResult { estimate: AIGroceryPriceEstimate; recipeAmountCost?: number; }
export async function estimateIngredientPrice(opts: {
  ingredientName: string; recipeQuantity?: number; recipeUnit?: string;
  location?: { city?: string; state?: string; zipCode?: string; label?: string };
  preferBudgetStores?: boolean;
}): Promise<EstimateIngredientResult>;

export async function remixRecipe(opts: {
  baseRecipe: unknown; userRequest: string; pantryIngredients?: string[];
  budgetPerServing?: number; equipment?: string[]; dietTags?: string[];
  preserveSourceAttribution?: boolean;
}): Promise<GeneratedRecipe>;
```

### A.3 The single transport primitive: `postJson<T>`

Private (not exported). Every public function above is a one-line wrapper around it.

```ts
async function postJson<T>(path: string, body: unknown): Promise<T>
```

Behavior:
1. If `WORKER_URL` empty → throw `"AI is not configured…"`.
2. `AbortController` + `setTimeout(60_000)` cap. On abort → throw `"AI request timed out — try again"`.
3. `fetch(`${WORKER_URL}${path}`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body), signal })`.
4. On non-2xx:
   - tries `res.json()` → `{ error?: string }`, falls back to `res.text()`.
   - `429` → throw `"AI is rate-limited — try again in a moment"`.
   - else → throw `"AI request failed (${status}): ${detail.slice(0,200)}"`.
5. On success → `return (await res.json()) as T;` (**no runtime validation/coercion in this file** — the cast is unchecked; callers/UI must defend against malformed shapes).

### A.4 Exact data shapes (copied verbatim)

```ts
export interface ResolvedIngredient {
  canonicalName: string;
  displayName: string;
  originalText: string;
  aliases: string[];
  category: IngredientCategory;          // the AI 17-value enum above
  ingredientRole: IngredientRole;
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

export interface ResolveResult {
  ingredients: ResolvedIngredient[];
  ignoredText: string[];
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
}

export interface EnrichResult {
  canonicalName: string;
  category: IngredientCategory;
  aliases: string[];
  estimatedUnitCost?: number | null;
  unit?: string;
  commonPackageSize?: string | null;
  storageType: "pantry" | "fridge" | "freezer" | "unknown";
  shelfLifeDays?: number | null;
  ingredientRole: IngredientRole;
  dietaryTags: string[];
  allergyTags: string[];
  substitutes: string[];
  recipeUseCases: string[];
  isPantryStaple: boolean;
}

export interface MatchResult {
  isMatch: boolean;
  matchType: "exact" | "alias" | "fuzzy" | "semantic" | "category" | "substitute" | "none";
  confidence: number;
  explanation: string;
}

export interface GenerateRecipeInput {
  ingredients?: string[];
  budgetPerServing?: number;
  servings?: number;
  equipment?: string[];
  timeLimit?: string;
  dietTags?: string[];
  mealType?: string;
  cravings?: string;
  creativity?: "practical" | "balanced" | "creative";
  refinement?: string;
}

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
    name: string; quantity: number; unit: string; estimatedCost: number;
    userAlreadyHas: boolean; optional: boolean; category: string;
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
  substitutions: Array<{
    original: string; swap: string; why: string; estimatedSavings?: number | null;
  }>;
  makeItCheaper: string[];
  makeItHealthier: string[];
  makeItHigherProtein: string[];
  pantryStaplesUsed: string[];
  optionalAddIns: string[];
  studentTips: string[];
  storageInstructions: string;
  reheatingInstructions: string;
  safetyNotes: string[];
  estimatedNutrition: { calories: number; protein: number; carbs: number; fat: number; fiber: number; };
  tags: string[];
  imagePromptHint?: string;
}
// NOTE: GeneratedRecipe is the AI/worker shape — DISTINCT from domain `Recipe`
// (src/lib/types.ts). Worker recipes are name-keyed (free-text ingredient names),
// domain recipes are id-keyed (`ingredientId` referencing the catalog). A mapping
// layer converts GeneratedRecipe -> CustomRecipe before persistence.

export interface GeneratedRecipeOption {
  id: string;
  optionLabel: OptionLabel;
  shortReason: string;
  pantryMatchScore: number;
  selectedByDefault: boolean;
  notesInfluenceSummary?: string;
  recipe: GeneratedRecipe;
}
export interface GeneratedRecipeOptionSet {
  mainOptionId: string;
  options: GeneratedRecipeOption[];
}
export interface GenerateOptionsInput {
  pantryIngredients?: string[];
  selectedPantryIngredientIds?: string[];
  ingredients?: string[];
  aiNotes?: string;
  cravingText?: string;
  budgetPerServing?: number;
  servings?: number;
  equipment?: string[];
  dietTags?: string[];
  creativityLevel?: "practical" | "balanced" | "creative";
  appendToExisting?: boolean;
  previousOptions?: Array<{ recipe: { name: string } }>;
}

export interface RecipeSourceMetadata {
  sourceType:
    | "internal" | "ai-generated" | "food-blog" | "recipe-site" | "creator-blog"
    | "youtube" | "instagram" | "tiktok" | "reddit" | "pinterest"
    | "manual-user-link" | "unknown-web";
  sourceUrl?: string;
  sourceName?: string;
  creatorName?: string;
  datePublished?: string;
  dateAccessed: string;
  citationRequired: boolean;
  attributionText?: string;
  imageUrl?: string;
  transformedByAI?: boolean;
  importedFromUserLink?: boolean;
  structuredDataAvailable?: boolean;
}

export interface WebRecipeCandidate {
  name: string;
  summary: string;
  sourceUrl: string;
  sourceName?: string;
  creatorName?: string;
  estimatedTotalTimeMinutes?: number | null;
  estimatedServings?: number | null;
  detectedIngredients: string[];
  detectedEquipment: string[];
  dietTags: string[];
  whyRecommended: string;
  imageUrl?: string | null;
}

export interface GroceryPriceSource {
  storeName?: string;
  productName?: string;
  brand?: string | null;
  packagePrice: number;
  packageSize: number;
  packageUnit: string;
  sourceUrl?: string | null;
  priceType:
    | "local-store" | "online-store" | "regional-average" | "national-average"
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
```

### A.5 Network contracts (every endpoint)

Base = `NEXT_PUBLIC_WORKER_URL` (trailing slash stripped). **All data endpoints are `POST`, `Content-Type: application/json`, JSON body, JSON response.** Worker also exposes `GET /health` → `{ ok: true }` and `GET /diagnostics` (model/key status; not called by `workerClient.ts`). Unknown method → `405 {error}`. Unknown path → `404 {error:"Not found"}`.

| Function | Path | Method | Request body | Success response |
|---|---|---|---|---|
| `resolveIngredients` | `/ingredients/resolve` | POST | `{ rawInput: string, inputSource: "typed"\|"voice"\|"pasted"\|"manual" }` | `ResolveResult` |
| `enrichIngredient` | `/ingredients/enrich` | POST | `{ name: string }` | `EnrichResult` |
| `matchIngredient` | `/ingredients/match` | POST | `{ pantry: string, required: string }` | `MatchResult` |
| `generateRecipe` | `/generate-recipe` | POST | `GenerateRecipeInput` | `GeneratedRecipe` |
| `generateRecipeOptions` | `/generate-recipe-options` | POST | `GenerateOptionsInput` | `GeneratedRecipeOptionSet` |
| `generateRecipeImage` | `/generate-recipe-image` | POST | `{ recipeName?, prompt?, ingredients?, method? }` | `GenerateImageResult` |
| `importRecipeUrl` | `/recipes/import-url` | POST | `{ url, ingredients?, budgetPerServing?, equipment?, dietTags?, servings? }` | `ImportRecipeResult` |
| `importRecipeText` | `/recipes/import-text` | POST | `{ text, sourceUrl?, sourcePlatform?, creatorName?, ingredients?, budgetPerServing?, equipment?, dietTags?, servings? }` | `ImportRecipeResult` |
| `webSearchRecipes` | `/recipes/web-search` | POST | `{ ingredients?, cravings?, equipment?, dietTags?, budgetPerServing?, maxResults? }` | `{ candidates: WebRecipeCandidate[] }` |
| `estimateIngredientPrice` | `/pricing/estimate-ingredient` | POST | `{ ingredientName, recipeQuantity?, recipeUnit?, location?, preferBudgetStores? }` | `EstimateIngredientResult` |
| `remixRecipe` | `/recipes/remix` | POST | `{ baseRecipe, userRequest, pantryIngredients?, budgetPerServing?, equipment?, dietTags?, preserveSourceAttribution? }` | `GeneratedRecipe` |

**Error envelope (server side, `worker/src/index.ts`):** all non-2xx responses are `{ "error": string }` JSON. Status codes used: `400` (invalid JSON / missing field / input too long, e.g. resolve caps `rawInput` at 2000 chars), `404`, `405`, `429` (rate limit), `500` (OpenAI failure → `{error: <message or "<task> failed">}`). CORS: worker reflects request `Origin` (or uses `ALLOWED_ORIGIN`) with `Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Allow-Headers: Content-Type`. The worker itself holds `OPENAI_API_KEY` and selects OpenAI models via env (`RECIPE_MODEL`, `DEFAULT_TEXT_MODEL`, `DEFAULT_IMAGE_MODEL`, etc.). **None of that matters to the RN client** — RN only needs the base URL + the contracts above.

### A.6 Browser / Next-only couplings in `workerClient.ts`

| Coupling | Where | Works in RN? | Adaptation |
|---|---|---|---|
| `"use client";` directive | line 1 | Ignored/irrelevant in RN | Delete the directive in the shared package. |
| `process.env.NEXT_PUBLIC_WORKER_URL` | line 8 | **No** — Next inlines `NEXT_PUBLIC_*` at build; Expo uses `EXPO_PUBLIC_*` (or `react-native-config` / `app.config`). | Inject base URL via a config param/adapter instead of reading `process.env` directly. Pass it into a `createWorkerClient({ baseUrl })` factory, or read `process.env.EXPO_PUBLIC_WORKER_URL`. |
| `fetch` | line 33 | **Yes** — RN has global `fetch`. | None. |
| `AbortController` / `setTimeout` | lines 29-30 | **Yes** — both exist in RN (Hermes). | None. AbortController is supported in modern RN; verify on your RN/Hermes version, else polyfill. |
| `Response`/`res.json()`/`res.text()` | lines 31-60 | **Yes** | None. |

`workerClient.ts` is **almost fully portable** — the only real change is the env-var source for the base URL. No DOM, no `window`, no `localStorage`, no `FileReader`, no blobs in this file.

---

## PART B — `src/lib/chatbot.ts` (Pesto)

### B.1 Purpose

A **100% local, deterministic, rule-based** chatbot. **No network calls, no AI, no `localStorage`, no `window`/DOM, no `process.env`.** It runs keyword/regex intent detection over the user message and returns canned-but-data-driven replies sourced from the in-memory `RECIPES`/`INGREDIENTS` catalogs + the scoring engine. Persona: "Pesto". This is the cheap, offline fallback chat distinct from the worker AI.

### B.2 Exported symbols

```ts
export interface ChatContext {
  pantry: PantryItem[];        // from src/lib/types.ts
  savedRecipeIds: string[];
}

export interface ChatReply {
  message: string;             // markdown-ish text (supports **bold**, \n)
  recipeIds?: string[];        // up to 4 recipe ids to render as cards
}

export function chatRespond(message: string, context: ChatContext): ChatReply;
```

`chatRespond` is the **only export consumers use**. Everything else (`DIET_KEYWORDS`, `detectDiet`, `handleCheapIntent`, `recipeListReply`, etc.) is module-private.

### B.3 Internal logic (what to preserve when porting)

`chatRespond` runs handlers in priority order and returns the first non-null reply; falls through to `handleFallback`:
1. `handleGreeting` — exact/leading "hi/hello/hey/yo/sup/howdy" → intro message.
2. `handleHelp` — "help" / "what can you do" / "how do you work".
3. `handleSavedRecipes(ctx)` — "saved"/"favorite" → list `ctx.savedRecipeIds` resolved via `RECIPES.find`.
4. `handlePantryIntent(ctx)` — "what can i make"/"i have"/"pantry"/"fridge" → merges `ctx.pantry` with ingredients detected in the text, then `rankPantryRecipes(...)`.
5. `handleProteinIntent` — "protein"/"gym"/"muscle" → top 4 by `estimatedNutrition.protein`.
6. `handleQuickIntent` — "quick"/"fast"/"hungry" → recipes ≤15 min.
7. `handleCheapIntent` — "cheap"/"budget"/"affordable"/"under $"/`under \d+` → `rankCheapRecipes(...)`.
8. `handleFallback` — recipe-name mention → that recipe; else 3 cheapest picks.

Detection helpers (all pure string ops):
- `detectDiet` → `DietTag[]` via `DIET_KEYWORDS`.
- `detectEquipment` → `Equipment[]` via `EQUIPMENT_KEYWORDS`.
- `detectMealType` → `MealType | undefined`.
- `detectBudget` → regex `/\$?\s?(\d+(?:\.\d+)?)/`; >50 ignored; >20 treated as weekly/5; else as per-serving.
- `detectIngredients` → scans `INGREDIENTS` names (+ naive singular for trailing "s"), returns `ingredient.id[]`.
- `detectMaxTime` → `/(\d+)\s?(min|minutes)/`; "quick"/"fast" → 15.
- `formatRecipeLine` / `recipeListReply` → build the markdown list, slice top 4, set `recipeIds`.

### B.4 Dependencies (must come along into the shared package)

```ts
import { INGREDIENTS, INGREDIENT_MAP } from "@/data/ingredients";
import { RECIPES } from "@/data/recipes";
import { calculateCostPerServing, rankCheapRecipes, rankPantryRecipes } from "@/lib/recipeScoring";
import type { DietTag, Equipment, MealType, PantryItem, Recipe } from "@/lib/types";
```

These are all **pure TS / pure data** (no browser APIs) — they port unchanged. `recipeScoring` depends on `pricingEngine` (also pure). So porting `chatbot.ts` pulls in the whole offline domain core, but none of it is browser-coupled.

Relevant domain types (from `src/lib/types.ts`):
```ts
export type DietTag = "vegetarian" | "vegan" | "high-protein" | "gluten-free" | "dairy-free";
export type Equipment = "microwave" | "stovetop" | "oven" | "rice-cooker" | "air-fryer" | "no-kitchen";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "meal-prep";
export interface PantryItem { ingredientId: string; quantity?: number; useSoon?: boolean; }
// Recipe is large; key fields chatbot reads: id, name, emoji, description,
// totalTimeMinutes, estimatedNutrition.protein, ingredients[].ingredientId.
```

### B.5 Browser / Next-only couplings in `chatbot.ts`

**None.** `chatbot.ts` is pure and fully portable. The `@/` path alias is the only build concern (tsconfig paths → resolve in the shared package).

### B.6 The UI consumer `Chatbot.tsx` (Next-only — must be rebuilt in RN)

`chatbot.ts` itself is portable, but its **only consumer**, `src/components/layout/Chatbot.tsx`, is heavily web-coupled and must be **rebuilt natively**:

| Coupling | Adaptation for RN |
|---|---|
| `"use client";`, JSX with `className`/Tailwind | Rebuild with RN `View`/`Text`/`Pressable` + your RN styling system. |
| `next/link` (`<Link href="/recipes/[id]">`) | Replace with React Navigation / Expo Router navigation. |
| `lucide-react` icons | Swap for `lucide-react-native` or `@expo/vector-icons`. |
| `clsx` class strings | Drop — use RN style objects. |
| DOM event listeners: `document.addEventListener("keydown"/"focusin"/"focusout")`, `HTMLElement`, `isContentEditable`, Escape-to-close, hide-button-while-typing | Rebuild with RN `Keyboard` events / focus state. The "hide floating button while keyboard is up" behavior maps to RN `Keyboard.addListener('keyboardDidShow'/'keyboardDidHide')`. |
| `env(safe-area-inset-bottom)` CSS | Use `react-native-safe-area-context`. |
| `whitespace-pre-wrap` + custom `renderMarkdown` (`**bold**` regex → `<strong>`) | Re-implement: split on `**...**`, render `<Text style={{fontWeight}}>`. Trivial to port; keep the same regex `/\*\*(.+?)\*\*/g`. |
| `RECIPE_MAP.get(id)` to render recipe cards, `calculateCostPerServing` | Pure — reuse from shared package. |
| State source: `useAppStore()` → `{ pantry, saved }` | The store is separate subsystem; RN store must expose the same `{ pantry: PantryItem[], saved: string[] }`. Pass them as `ChatContext` to `chatRespond(message, { pantry, savedRecipeIds: saved })` exactly as today. |

**No `localStorage` in the chat layer** — chat messages are ephemeral React state (`useState`), reset on unmount. Pantry/saved come from `useAppStore` (which itself reads `srf:pantry` / `srf:saved` — owned by the store subsystem, not this one).

---

## PART C — Storage keys touched

**Neither `workerClient.ts` nor `chatbot.ts` touches `localStorage` directly.** (Confirmed by read.)

- `workerClient.ts`: no storage.
- `chatbot.ts`: no storage; consumes pantry/saved passed in via `ChatContext`.
- The data it relies on (`srf:pantry`, `srf:saved`) is read by `useAppStore` in the **AppStore subsystem** (out of scope for this brief). For the RN port, whatever store provides `{ pantry, saved }` must back those onto `AsyncStorage`/MMKV under the same logical keys (`srf:` prefix is legacy — do not rename, per project CLAUDE.md).

---

## PART D — RN port plan

### D.1 Moves into the shared package UNCHANGED
- **`src/lib/chatbot.ts`** — pure, no browser APIs. Ships as-is (fix `@/` path alias).
- **All `chatbot.ts` dependencies**: `src/lib/recipeScoring.ts`, `src/lib/types.ts`, `src/lib/pricing/*`, `src/data/ingredients.ts`, `src/data/recipes.ts`. Pure TS/data.
- **The transport-agnostic body of `workerClient.ts`** — `postJson` logic, all type/interface definitions, all endpoint wrapper functions. `fetch` + `AbortController` work in RN.

### D.2 Needs a thin platform adapter
- **Worker base URL injection.** Replace `process.env.NEXT_PUBLIC_WORKER_URL` with a platform-neutral config. Recommended: convert `WORKER_URL` from a module constant into an injected value —
  ```ts
  // shared
  export function createWorkerClient(getBaseUrl: () => string) { /* postJson uses getBaseUrl() */ }
  ```
  Web passes `process.env.NEXT_PUBLIC_WORKER_URL`; Expo passes `process.env.EXPO_PUBLIC_WORKER_URL`. `isWorkerConfigured()`/`workerUrl()` then read the injected value. (Minimal alternative: keep module-level but read both `NEXT_PUBLIC_*` and `EXPO_PUBLIC_*`.)
- **`AbortController` polyfill** — present in modern Hermes; add `abortcontroller-polyfill` only if your RN version lacks it.
- **(Optional) runtime response validation** — `postJson` currently does an unchecked `as T`. RN networks are flakier; consider adding zod/io-ts coercion in the shared layer so both platforms get the same defensive parsing.

### D.3 Must be rebuilt natively
- **`src/components/layout/Chatbot.tsx`** — the entire Pesto chat UI (floating button, panel, message bubbles, starter prompts, markdown render, keyboard-hide behavior, recipe-card links). Web-only DOM/Tailwind/`next/link`/lucide-react. Re-implement in RN consuming the shared `chatRespond` + shared `RECIPE_MAP`/`calculateCostPerServing`. Port the `renderMarkdown` `**bold**` logic to RN `<Text>`.
- **Anything that renders `GenerateImageResult`** (image gen) — web shows `b64_json`/`url`; RN `<Image source={{uri: ...}}>` handles `url`; for `b64_json` use `data:image/png;base64,...` URI. (UI concern, not in these two files, but flag for the screens that call `generateRecipeImage`.)

### D.4 Net assessment
- `chatbot.ts`: **0 changes** (pure). Only its UI shell is rebuilt.
- `workerClient.ts`: **~1 change** (base-URL config source). Everything else portable.
- The heavy lift is the **UI** (`Chatbot.tsx`), not the logic in these two files.
