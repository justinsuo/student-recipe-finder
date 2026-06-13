# 09 — Nourish Engine Modules (mobile port brief)

Subsystem: `src/lib/nourish/` (all modules **except** `types.ts` and `storage.ts`, which are covered separately — though their shapes are reproduced here for reference since these modules depend on them heavily).

Modules covered: `adaptiveTdee.ts`, `aiMealLogger.ts`, `calcEngine.ts`, `exercise.ts`, `fasting.ts`, `mealEstimator.ts`, `mealPlan.ts`, `meals.ts`, `recipeIntegration.ts`, `streak.ts`, `usdaClient.ts`.

Overall design intent: a **pure calc core** (`calcEngine`) with zero I/O, surrounded by storage-backed feature modules (each owns its own localStorage key with the same `read/write` guard pattern), plus two network clients (USDA + Anthropic Haiku). Recipes from the main Waivy catalog get bridged into the diary via `recipeIntegration`.

---

## 0. Shared types referenced everywhere (from `types.ts`)

Reproduced verbatim because nearly every module imports these. **No browser coupling — fully portable.**

```ts
export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary" | "light" | "moderate" | "very_active" | "extra_active";
export type GoalMode = "cut" | "maintain" | "bulk" | "recomp";
export type TargetSource = "formula" | "adaptive" | "manual";
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
export type FoodSource = "usda" | "custom" | "recipe";
export type PreferredUnits = "metric" | "imperial";

export interface UserProfile {
  heightCm: number;          // canonical cm
  weightKg: number;          // canonical kg
  age: number;               // whole years
  sex?: Sex;                 // optional (Mifflin); omit for body-comp flow
  bodyFatFraction?: number;  // 0–1, unlocks Katch-McArdle
  activityLevel: ActivityLevel;
  preferredUnits: PreferredUnits;
}

export interface TargetSnapshot {
  effectiveFrom: string;     // YYYY-MM-DD
  mode: GoalMode;
  weeklyRateKg: number;      // + = gain, - = loss
  calorieTarget: number;
  proteinG: number; carbG: number; fatG: number; fiberG: number;
  source: TargetSource;
}

export interface WeightEntry { id: string; date: string; weightKg: number; } // date YYYY-MM-DD

export interface FoodItem {
  id: string;
  source: FoodSource;
  externalId?: string;        // USDA fdcId or recipe id when not "custom"
  name: string;
  brand?: string;
  servingDescription: string; // "1 medium apple" or "100g"
  servingGrams?: number;      // grams per serving (scaling)
  kcal: number; proteinG: number; carbG: number; fatG: number;
  fiberG?: number;
}

export interface DiaryEntry {
  id: string;
  date: string;               // YYYY-MM-DD
  meal: MealSlot;
  food: FoodItem;
  quantityServings: number;
  snapshotKcal: number;       // macro snapshot at log time (history-stable)
  snapshotProteinG: number;
  snapshotCarbG: number;
  snapshotFatG: number;
  loggedAt: string;           // ISO timestamp
}

export interface DayTotals { kcal: number; proteinG: number; carbG: number; fatG: number; }
export function entryTotals(entry: DiaryEntry): DayTotals;     // snapshot* × quantity
export function sumTotals(entries: DiaryEntry[]): DayTotals;

export interface UsdaSearchResult {
  fdcId: number; description: string; brandOwner?: string;
  servingSize?: number; servingSizeUnit?: string;
  foodNutrients: { nutrientId: number; nutrientName: string; value: number; unitName: string; }[];
}
```

### Storage helpers these modules call (from `storage.ts`)
- `getProfile()`, `getTargets()`, `setTargets()`, `getDiaryEntries()`, `getWeightLog()`, `getAdaptiveLastRun()`, `setAdaptiveLastRun(date)`, `getFoodCacheEntry(key)`, `setFoodCacheEntry(key, val)`, `todayString()`, `dateToLocalString(d)`, `newId()`.
- **localStorage keys owned by `storage.ts`** (listed for completeness; these modules read/write through it): `srf:nourish-profile`, `srf:nourish-targets`, `srf:nourish-weight-log`, `srf:nourish-diary`, `srf:nourish-custom-foods`, `srf:nourish-food-cache`, `srf:nourish-onboarded`, `srf:nourish-adaptive-last-run`, `srf:nourish-water-log`, `srf:nourish-recent-foods`. Exported as `NOURISH_KEYS`.

---

## 1. `calcEngine.ts` — pure calorie/macro/TDEE math (NO I/O)

Header comment: "Pure, side-effect-free calculation engine… All inputs in canonical SI units (kg, cm). No I/O, no state." The one impurity is a default-arg call to `dateToLocalString(new Date())` in `deriveTargets`.

### Exported constants
```ts
export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_CARB = 4;
export const KCAL_PER_G_FAT = 9;
export const KCAL_PER_KG_FAT = 7700;           // 1 kg body fat ≈ 7700 kcal
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725, extra_active: 1.9,
};
```

### Exported types
```ts
export interface MacroTargets { proteinG: number; carbG: number; fatG: number; fiberG: number; }
```

### Exported functions + math
- `bmrMifflin(weightKg, heightCm, age, sex): number` — Mifflin-St Jeor. `base = 10·kg + 6.25·cm − 5·age`; `+5` male, `−161` female.
- `bmrKatchMcArdle(weightKg, bodyFatFraction): number` — `lbm = kg·(1−bf)`; `370 + 21.6·lbm`.
- `bestBmr(profile): number` — picks Katch-McArdle if `0 < bodyFatFraction < 1`, else Mifflin if `sex` set, else average of male+female Mifflin.
- `tdee(bmr, activityLevel): number` — `bmr × ACTIVITY_MULTIPLIERS[level]`.
- `goalCalories(tdeeKcal, mode, weeklyRateKg): number` — maintain/recomp → `round(tdee)`; else `round(tdee + (weeklyRateKg·7700)/7)`. (weeklyRateKg sign drives surplus/deficit.)
- `maxWeeklyRateKg(weightKg, mode): { min: number; max: number }` — cut: `{min:-(kg·0.01), max:0}` (1%/wk cut cap); bulk: `{min:0, max:kg·0.005}` (0.5%/wk lean-bulk cap); else `{0,0}`.
- `macroTargets(calorieTarget, weightKg, mode): MacroTargets` —
  - protein: `round(kg × (mode==="cut" ? 2.3 : 2.0))`
  - fat: `round(max(kg·0.8, calorieTarget·0.25/9))` (0.8 g/kg floor or 25% kcal)
  - carbs: `round(max(0, cal − protein·4 − fat·9)/4)`
  - fiber: `round((cal/1000)·14)`
- `reconcileMacros(targets, calorieTarget): { ok; computed; delta }` — checks macros reconcile to ±10 kcal.
- `deriveTargets(profile, mode, weeklyRateKg, source="formula", effectiveFrom=dateToLocalString(new Date())): TargetSnapshot` — **the single entry point** used by onboarding, profile edits, adaptive re-derivation. Chains `bestBmr → tdee → goalCalories → macroTargets`.
- `ewmaWeight(weights: {date; weightKg}[], alpha=0.1): number | null` — EWMA of sorted weights (smoothing trend).
- `adaptiveTdeeEstimate(entries: {date; kcal}[], weights: {date; weightKg}[], windowDays=14): number | null` — back-calculates real TDEE: filters to last `windowDays`, needs ≥3 entries & ≥2 weights; `avgIntake = mean(kcal)`; `netKcal = (lastW − firstW)·7700`; `tdee = avgIntake − netKcal/days` where `days = recentEntries.length`. Returns `null` on insufficient data.
- Unit conversions: `kgToLbs`, `lbsToKg`, `cmToInches`, `inchesToCm`, `inchesToFeetAndInches(totalInches): {feet; inches}`, `feetAndInchesToCm(feet, inches)`.

**Browser coupling:** none. **RN: moves to shared package unchanged.**

---

## 2. `adaptiveTdee.ts` — weekly adaptive TDEE service (storage-backed)

Re-estimates TDEE from actual intake + weight trend, then re-derives + persists targets with `source:"adaptive"`. "Safe to call on every page load."

```ts
const MIN_DAYS_BETWEEN_UPDATES = 7;
export interface AdaptiveResult {
  updated: boolean;
  adaptiveTdee: number | null;
  formulaTdee: number | null;   // always null in current impl
  previousTarget: number | null;
  newTarget: number | null;
  reason: string;               // "no-profile" | "next-update-in-N-days" | "insufficient-data" | "implausible-estimate" | "updated"
}
```

- `maybeUpdateAdaptiveTdee(): AdaptiveResult` — Throttles to once per 7 days via `getAdaptiveLastRun()` (`daysSince = floor((Date.now() − Date(lastRun+"T12:00:00"))/86_400_000)`). Builds intake series by summing `snapshotKcal × quantityServings` per `date` from `getDiaryEntries()`; weight series from `getWeightLog()`. Calls `adaptiveTdeeEstimate(..., 14)`. Rejects estimates `<800` or `>6000` kcal as implausible. On success: `goalCalories` + `macroTargets` → builds new `TargetSnapshot(source:"adaptive")` → `setTargets()`. Always `setAdaptiveLastRun(todayString())` on any terminal branch.
- `getAdaptiveTdeeDisplay(): { adaptiveTdee: number|null; hasEnoughData: boolean; daysSinceLastUpdate: number|null }` — read-only display variant; does NOT mutate targets.

**Browser coupling:** indirect via storage (localStorage). Uses `Date.now()`/`new Date()`. **RN: moves to shared package once storage is adapter-ized; logic unchanged.**

---

## 3. `aiMealLogger.ts` — Anthropic Haiku vision/text food identification (NETWORK)

Strategy comment: "AI identifies components + gram estimates → USDA grounds the macros. Never let the model emit nutrition numbers directly."

### Config (module constants)
```ts
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL   = "claude-haiku-4-5-20251001";
const API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ?? "";
```

### Exported symbols
```ts
export function isAiLoggingEnabled(): boolean;   // API_KEY.length > 0

export interface AiMealComponent {
  name: string;             // USDA-searchable, e.g. "grilled chicken breast"
  estimatedGrams: number;   // required
  estimationBasis: string;  // one sentence
  confidence: "high" | "medium" | "low";
  hiddenCalories?: string;
}

// returns ComponentsResponse (interface is module-internal, not exported):
//   { components: AiMealComponent[]; overallConfidence?: "high"|"medium"|"low"; uncertainties?: string[] }
export async function identifyMealComponents(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
  description?: string,
): Promise<ComponentsResponse>;

export async function identifyMealFromText(description: string): Promise<ComponentsResponse>;

export const HIDDEN_EXTRAS: ReadonlyArray<{
  name: string; searchTerm: string; typicalGrams: number; emoji: string;
}>;  // 6 entries: cooking oil, dressing, sauce/gravy, drink, cheese, bread
```

### Network contract — Anthropic Messages API
- **POST** `https://api.anthropic.com/v1/messages`
- **Headers:** `Content-Type: application/json`, `x-api-key: <key>`, `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true`.
- **Request body:** `{ model, max_tokens: 1200, system: <VISION_SYSTEM|TEXT_SYSTEM>, messages: [{ role, content }] }`. For vision, `content` is an array: `[{ type:"image", source:{ type:"base64", media_type, data: imageBase64 } }, { type:"text", text }]`. For text-only, `content` is a string.
- **Response shape consumed:** `{ content: { type: string; text?: string }[] }`. Picks first `type==="text"`, strips ```` ```json ```` fences, `JSON.parse`, validates `components` is an array and filters each to `{name:string, estimatedGrams:number>0}`. On any parse failure returns `{ components: [] }`.
- The system prompts (`VISION_SYSTEM`, `TEXT_SYSTEM`) instruct the model to output ONLY JSON, identify foods + estimate grams for the visible portion, never calories/macros.

**Browser/Next coupling:**
- `process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY` → must become Expo `process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY` (or `expo-constants`/secure config).
- `anthropic-dangerous-direct-browser-access: true` is a browser-CORS-only header; harmless but unnecessary in RN (native fetch has no CORS). Keep or drop.
- `imageBase64` input: in the web app this base64 is produced by browser `FileReader`/canvas. In RN, source it from `expo-image-picker`/`expo-camera` (they return base64 directly) or `expo-file-system` `readAsStringAsync(..., { encoding: Base64 })`. **No FileReader in RN.**
- `fetch` + `JSON` are available in RN. The function logic itself ports unchanged.

**RN:** thin adapter for the API key + image acquisition; the call + parsing logic moves to shared package.

---

## 4. `mealEstimator.ts` — USDA grounding layer (NETWORK via usdaClient)

"The model handles what and how much; the database handles macros."

```ts
export interface GroundedComponent {
  aiName: string;
  grams: number;                       // AI estimate, user-adjustable
  aiConfidence: "high" | "medium" | "low";
  estimationBasis: string;
  usdaFood: FoodItem | null;           // best USDA match
  scaled: { kcal: number; proteinG: number; carbG: number; fatG: number } | null;
  confirmed: boolean;
  kcalRange: { low: number; high: number } | null;  // ±20%
}

export async function groundComponentsInUsda(components: AiMealComponent[]): Promise<GroundedComponent[]>;
export function rescaleComponent(component: GroundedComponent, newGrams: number): GroundedComponent;
export function sumGroundedMacros(components: GroundedComponent[]): {
  kcal: number; proteinG: number; carbG: number; fatG: number;
  kcalRange: { low: number; high: number };
};
```

Math: `scaleFromUsda(food, grams)` (internal) — `baseGrams = food.servingGrams ?? 100`, `scale = grams/baseGrams`, scales each macro (kcal rounded; macros to 1 decimal). `groundComponentsInUsda` runs `searchUsda({query: c.name, pageSize:1})` per component in parallel (`Promise.all`), takes `foods[0]`, scales to `estimatedGrams`, derives `kcalRange = {low: round(kcal·0.8), high: round(kcal·1.2)}`. No-match components are still returned (so the user can fix manually).

**Browser coupling:** only transitively through `searchUsda`. Pure math otherwise. **RN: moves to shared package unchanged.**

---

## 5. `usdaClient.ts` — USDA FoodData Central client + cache + React hook (NETWORK + CACHE + HOOK)

```ts
// internal: BASE="https://api.nal.usda.gov/fdc/v1"; nutrient IDs ENERGY 1008, PROTEIN 1003, CARBS 1005, FAT 1004, FIBER 1079.
export function usingDemoKey(): boolean;        // apiKey() === "DEMO_KEY"
export function usdaToFoodItem(raw: UsdaSearchResult): FoodItem;

export interface SearchOptions {
  query: string;
  dataType?: string[];      // default ["Foundation","SR Legacy","Survey (FNDDS)"]
  pageSize?: number;        // default 20
  signal?: AbortSignal;
}
export interface SearchResponse { foods: FoodItem[]; totalHits: number; error?: string; }

export async function searchUsda(opts: SearchOptions): Promise<SearchResponse>;
export async function fetchUsdaFood(fdcId: string | number): Promise<FoodItem | null>;

export interface UseFoodSearchResult { results: FoodItem[]; loading: boolean; error: string | undefined; totalHits: number; }
export function useFoodSearch(query: string): UseFoodSearchResult;   // React hook
```

### Network contract — USDA FDC
- API key: `process.env.NEXT_PUBLIC_USDA_API_KEY ?? "DEMO_KEY"` (DEMO_KEY = 30 req/hr, surfaced as a friendly error on HTTP 429).
- **Search: GET** `${BASE}/foods/search?api_key=…&query=…&dataType=Foundation,SR Legacy,Survey (FNDDS)&pageSize=20&fields=fdcId,description,brandOwner,servingSize,servingSizeUnit,foodNutrients`. Response JSON: `{ totalHits?: number; foods?: UsdaSearchResult[] }`. 429 → friendly error string; other non-OK → `USDA returned <status>`; network/abort handled (AbortError → empty silent result).
- **Detail: GET** `${BASE}/food/{fdcId}?api_key=…&format=abridged` → `UsdaSearchResult` → `usdaToFoodItem`.
- **Caching:** both paths cache through `getFoodCacheEntry`/`setFoodCacheEntry` (localStorage `srf:nourish-food-cache`, 24h TTL per storage.ts). Search cache key = `"<lowercased trimmed query>::<dataType.join(',')>"`; detail cache key = `"fdcId:<id>"`.
- `usdaToFoodItem`: extracts nutrients by ID; `servingGrams = (servingSizeUnit==="g") ? servingSize : 100`; `scale = servingGrams/100`; scales macros; `id = "usda-<fdcId>"`, `source:"usda"`, `externalId = String(fdcId)`.

**Browser/Next coupling:**
- `process.env.NEXT_PUBLIC_USDA_API_KEY` → Expo `EXPO_PUBLIC_USDA_API_KEY`.
- Cache goes through `storage.ts` localStorage → AsyncStorage adapter (note: storage.ts cache read/write is currently **synchronous**; AsyncStorage is async — this is the main impedance for the cache layer, handled in the storage brief).
- `useFoodSearch` is a real **React hook** (`useState`/`useEffect`/`useRef`) with a 400ms debounce and `AbortController` abort-on-new-input. Hook logic is platform-agnostic and works in RN as-is; `AbortController` and `fetch` exist in RN (Hermes/RN ≥0.60). Keep the hook in shared code.

**RN:** `searchUsda`/`fetchUsdaFood`/`usdaToFoodItem`/`useFoodSearch` all port to shared package; only the env var name and the (async) cache adapter need adaptation.

---

## 6. `exercise.ts` — exercise log (STORAGE, self-contained)

```ts
const KEY = "srf:nourish-exercise-log";   // localStorage key (own read/write)

export type ExerciseKind = "walking"|"running"|"cycling"|"weights"|"sport"|"yoga"|"other";
export interface ExerciseEntry {
  id: string; date: string;   // YYYY-MM-DD
  kind: ExerciseKind; name: string;
  durationMinutes: number; caloriesBurned: number;
  notes?: string; createdAt: string;
}
export const EXERCISE_DEFAULTS: Record<ExerciseKind, { label: string; kcalPerMin: number }>;
// walking 4, running 10, cycling 8, weights 6, sport 8, yoga 3, other 5 (kcal/min, ~70kg, conservative MET)

export function getExerciseLog(): ExerciseEntry[];
export function getExerciseForDate(date: string): ExerciseEntry[];
export function addExerciseEntry(entry: ExerciseEntry): void;
export function deleteExerciseEntry(id: string): void;
export function sumExerciseCalories(entries: ExerciseEntry[]): number;   // Σ caloriesBurned
```
Stored value at `srf:nourish-exercise-log` = `ExerciseEntry[]`. Calorie credit math is just MET defaults × minutes (computed in the UI form; module stores the final number). Exercise calories are subtracted from daily remaining only if the `includeExercise` setting is on (handled by the consuming UI, not here).

**Browser coupling:** direct `typeof window === "undefined"` guard + `window.localStorage`. **RN: needs storage adapter (AsyncStorage). Types + sum logic unchanged.**

---

## 7. `fasting.ts` — intermittent fasting timer/log (STORAGE, self-contained)

```ts
const ACTIVE_KEY = "srf:nourish-fasting-active";
const LOG_KEY    = "srf:nourish-fasting-log";

export interface FastingPlan { id: string; label: string; fastingHours: number; eatingHours: number; }
export const FASTING_PLANS: FastingPlan[];   // 12:12, 14:10, 16:8, 18:6

export interface ActiveFast { planId: string; startedAt: string; }   // startedAt ISO
export interface FastEntry {
  id: string; planId: string;
  startedAt: string; endedAt: string;
  durationMs: number; targetMs: number; completed: boolean;
}

export function getActiveFast(): ActiveFast | null;
export function startFast(planId: string): ActiveFast;               // startedAt = now ISO
export function endFast(nowMs: number, newIdFn: () => string): FastEntry | null;
export function getFastingLog(): FastEntry[];
```
Stored values: `srf:nourish-fasting-active` = `ActiveFast | null`; `srf:nourish-fasting-log` = `FastEntry[]` (capped at 60 via `.slice(0,60)`, newest first with `unshift`). Fasting logic: `targetMs = (plan.fastingHours ?? 16)·3_600_000`; `durationMs = max(0, nowMs − Date.parse(startedAt))`; `completed = durationMs >= targetMs`. The live countdown is computed client-side from `startedAt + plan.fastingHours` (timer state is NOT persisted; only start time is).

**Browser coupling:** `typeof window`/`window.localStorage`. `endFast` takes `nowMs` + `newIdFn` injected (good — keeps it testable/portable). **RN: storage adapter only. Note: a backgrounded RN app won't tick a JS timer — the UI must recompute elapsed from `startedAt` on resume (the design already supports this).**

---

## 8. `meals.ts` — reusable meal library ("my usual breakfast") (STORAGE)

```ts
const KEY = "srf:nourish-meals";

export interface NourishMealItem { food: FoodItem; quantityServings: number; }
export interface NourishMeal {
  id: string; name: string; description?: string;
  defaultSlot?: MealSlot;
  items: NourishMealItem[];
  totalKcal: number; totalProteinG: number; totalCarbG: number; totalFatG: number;  // cached at save
  createdAt: string; updatedAt: string;
}

export function getMeals(): NourishMeal[];
export function getMeal(id: string): NourishMeal | undefined;
export function saveMeal(meal: NourishMeal): void;          // upsert by id
export function deleteMeal(id: string): void;
export function totalMealMacros(items: NourishMealItem[]): { kcal; proteinG; carbG; fatG };
export function mealToDiaryEntries(meal, date, slot: MealSlot, newIdFn: () => string): DiaryEntry[];
export function entriesToMeal(entries: DiaryEntry[], name, description: string|undefined, newIdFn, nowIso): NourishMeal;
```
Stored value `srf:nourish-meals` = `NourishMeal[]`. `mealToDiaryEntries` snapshots each food's macros into a `DiaryEntry` (`snapshot*` = `food.*`, `quantityServings` preserved, `loggedAt = new Date().toISOString()`) — caller writes to diary. `entriesToMeal` is the inverse ("save today's breakfast as a meal"). `totalMealMacros` sums `food.* × quantityServings`.

**Browser coupling:** `typeof window`/localStorage. Pure-math + transform funcs (`totalMealMacros`, `mealToDiaryEntries`, `entriesToMeal`) are portable. **RN: storage adapter only.**

---

## 9. `mealPlan.ts` — 7-day meal-plan grid (STORAGE)

```ts
const KEY = "srf:nourish-meal-plan";

export type PlanItemKind = "recipe" | "meal";
export interface PlanItem {
  date: string;           // YYYY-MM-DD
  slot: MealSlot;
  kind: PlanItemKind;
  refId: string;          // Recipe.id when kind="recipe", NourishMeal.id when kind="meal"
  name: string;           // cached display name
  kcal?: number;          // cached per-serving
  proteinG?: number;
}

export function getPlan(): PlanItem[];
export function getPlanForDate(date: string): PlanItem[];
export function getPlanCell(date: string, slot: MealSlot): PlanItem | undefined;
export function upsertPlanItem(item: PlanItem): void;            // unique by (date, slot)
export function removePlanItem(date: string, slot: MealSlot): void;
export function nextSevenDays(today: string): string[];         // LOCAL-time YYYY-MM-DD ×7
```
Stored value `srf:nourish-meal-plan` = `PlanItem[]`. Cells unique by `(date, slot)`. **Important date note (already in code):** `nextSevenDays` builds dates in LOCAL time via `new Date(today + "T00:00:00")` and manual `getFullYear/getMonth/getDate` — deliberately NOT `toISOString().slice(0,10)`, which would shift a day for users east of UTC. **Preserve this in RN** (Hermes Date behaves the same; keep the local-time construction).

**Browser coupling:** `typeof window`/localStorage. **RN: storage adapter only; date logic unchanged.**

---

## 10. `streak.ts` — logging streak (PURE)

```ts
export function currentStreak(entries: DiaryEntry[], todayStr: string): number;
export function bestStreak(entries: DiaryEntry[]): number;
```
A "streak day" = any day with ≥1 diary entry. `currentStreak` counts consecutive days ending at `todayStr` (inclusive); if today has no entry it starts from yesterday (benefit of the doubt), safety-capped at 365. `bestStreak` finds the longest consecutive run across all entry dates (day diff via `86_400_000`). Internal `ymd(Date)` builds local YYYY-MM-DD.

**Browser coupling:** none (`new Date(str + "T00:00:00")` only). **RN: moves to shared package unchanged.**

---

## 11. `recipeIntegration.ts` — Waivy recipe → diary bridge (the recipe-logging path)

This is **how Waivy catalog recipes get logged into the Nourish diary.**

```ts
import type { Recipe } from "@/lib/types";
import { bestEffortNutrition } from "@/lib/nutritionEngine";

export function recipeToDiaryFood(recipe: Recipe): FoodItem;
export function findMacroFitRecipes(
  recipes: Recipe[],
  remainingKcal: number, remainingProteinG: number, remainingCarbG: number, remainingFatG: number,
  tolerance = 0.15, maxResults = 6,
): Recipe[];
```

- `recipeToDiaryFood(recipe)` — calls `bestEffortNutrition(recipe).estimate` (a `NutritionEstimate = { calories; protein; carbs; fat; fiber? }`) and wraps it as a per-serving `FoodItem`:
  ```ts
  { id: `recipe-${recipe.id}`, source: "recipe", externalId: recipe.id,
    name: recipe.name, servingDescription: `1 serving (of ${recipe.servings})`,
    kcal: estimate.calories, proteinG: estimate.protein, carbG: estimate.carbs,
    fatG: estimate.fat, fiberG: estimate.fiber }
  ```
  The UI then builds a `DiaryEntry` from this FoodItem (snapshotting macros) and writes via `addDiaryEntry` → one-tap recipe logging.
- `findMacroFitRecipes(...)` — "what should I cook to fill my remaining budget?" Filters out recipes that bust any macro by >`tolerance` (15%), scores each by `pFill·2 + calFill` (protein-weighted, each clamped 0–1), returns top `maxResults` by score. Returns `[]` if `remainingKcal <= 0`.

**Couplings / dependencies (NOT browser, but cross-module):**
- Depends on the main Waivy `Recipe` type and `bestEffortNutrition` from `src/lib/nutritionEngine.ts` (which itself reads the ingredient/pricing catalog). For the RN port, `nutritionEngine` + `Recipe` + the recipe/ingredient data must also live in (or be imported by) the shared package. This module has **no window/DOM** of its own — fully portable once its imports resolve.

`NutritionEstimate` (from `src/lib/types.ts`): `{ calories: number; protein: number; carbs: number; fat: number; fiber?: number }`.

---

## Browser/Next-only couplings summary (and adaptations)

| Coupling | Where | RN adaptation |
| --- | --- | --- |
| `window.localStorage` (sync) + `typeof window === "undefined"` guards | `exercise`, `fasting`, `meals`, `mealPlan` (own keys); `adaptiveTdee`, `usdaClient` (via storage.ts) | Replace with a storage adapter over `@react-native-async-storage/async-storage`. AsyncStorage is **async**, so either (a) hydrate into an in-memory cache on app start and keep these getters sync, or (b) make getters async. The USDA 24h cache (in storage.ts) is the trickiest because `searchUsda` reads it synchronously today. |
| `process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY` | `aiMealLogger` | `process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY` (or expo-constants/secure store). |
| `process.env.NEXT_PUBLIC_USDA_API_KEY` | `usdaClient` | `process.env.EXPO_PUBLIC_USDA_API_KEY`. |
| `anthropic-dangerous-direct-browser-access: true` header | `aiMealLogger` | No CORS in RN — header is a harmless no-op; keep or drop. |
| `imageBase64` produced by browser FileReader/canvas | `aiMealLogger` (caller) | Use `expo-image-picker`/`expo-camera` (return base64) or `expo-file-system.readAsStringAsync(uri,{encoding:'base64'})`. No `FileReader`/`<canvas>` in RN. |
| `fetch`, `AbortController`, `JSON`, `Date`, `Date.now()` | `usdaClient`, `aiMealLogger`, `adaptiveTdee`, `fasting` | All available in RN/Hermes — no change. |
| React hook `useFoodSearch` (`useState/useEffect/useRef`) | `usdaClient` | Works in RN as-is (debounce + AbortController). Keep in shared. |
| `Recipe` + `bestEffortNutrition` (catalog-dependent) | `recipeIntegration` | Ship `nutritionEngine`/`Recipe`/recipe+ingredient data into the shared package. |
| `'use client'` directive | None of these files declare it (they're plain TS libs) | N/A. |
| `next/image`, `next/link`, DOM, CSS, SpeechRecognition | None present in these modules | N/A here (live in UI components, separate brief). |

No `next/image`, `next/link`, CSS, DOM, or `SpeechRecognition` usage in any of these engine modules — they are all plain TS/React-logic.

---

## RN port plan

**Moves into the shared package UNCHANGED (pure or DI'd, no platform APIs):**
- `calcEngine.ts` — all TDEE/BMR/macro/goal/adaptive/unit math.
- `streak.ts` — streak math.
- `mealEstimator.ts` — USDA grounding/scaling (transitive network only).
- `recipeIntegration.ts` — recipe→FoodItem bridge + macro-fit scorer (needs `Recipe`/`nutritionEngine` also in shared).
- Pure transforms in `meals.ts` (`totalMealMacros`, `mealToDiaryEntries`, `entriesToMeal`) and `mealPlan.ts` (`nextSevenDays`).
- `types.ts` shapes (shared model layer).

**Needs a thin platform adapter (storage + env), logic intact:**
- `exercise.ts`, `fasting.ts`, `meals.ts`, `mealPlan.ts` — swap their inline `read/write` localStorage helpers for an injected/shared storage adapter (AsyncStorage). Keep keys identical for parity (`srf:nourish-exercise-log`, `srf:nourish-fasting-active`, `srf:nourish-fasting-log`, `srf:nourish-meals`, `srf:nourish-meal-plan`).
- `adaptiveTdee.ts` — depends only on storage; ports once storage adapter exists.
- `usdaClient.ts` — env var rename + async cache adapter; `searchUsda`/`fetchUsdaFood`/`usdaToFoodItem`/`useFoodSearch` otherwise unchanged.
- `aiMealLogger.ts` — env var rename; everything else (fetch + JSON parse/validate) is portable.

**Must be (re)built natively / at the call site (not in these modules, but required to feed them):**
- Image capture → base64 for `identifyMealComponents` (expo-camera / expo-image-picker / expo-file-system) — replaces browser FileReader/canvas.
- The **async storage hydration strategy** for the food cache (storage.ts) so `searchUsda`'s synchronous cache read keeps working, OR refactor `getFoodCacheEntry`/`setFoodCacheEntry` to async and `await` them in `searchUsda`/`fetchUsdaFood`.
- Secure handling of the public API keys (consider moving Anthropic + USDA calls behind a proxy on mobile, since `EXPO_PUBLIC_*` is bundled into the app the same way `NEXT_PUBLIC_*` ships to the browser).
- Background-safe fasting timer: recompute elapsed from `startedAt` on app resume (no persisted ticking timer); optionally wire `expo-notifications` for fast-complete alerts.
```
