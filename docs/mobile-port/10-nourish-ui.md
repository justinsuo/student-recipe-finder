# Nourish — Pages, Components & Shared Logic (Web → Expo RN port brief)

Scope: `src/app/nourish/**` (13 routes + layout), `src/components/nourish/**` (26 components), and the entire `src/lib/nourish/**` domain layer they depend on (15 files). This is the macro/calorie tracking subsystem of Waivy. The goal is to extract the logic into a **shared package** consumed by both the Next.js web app and the Expo React Native iPhone app.

The architecture is deliberately split:
- `src/lib/nourish/**` = **pure logic + localStorage I/O + network clients** (mostly portable; storage + a few `window`/`fetch+blob`/`process.env` couplings need adapters).
- `src/components/nourish/**` = **React components** using DOM/Tailwind/`next/*` (must be rebuilt in RN, but read/write through the same lib functions).

All nutrition data is stored **canonically in metric (kg, cm)**. The UI converts to/from imperial via `UserProfile.preferredUnits`. Macros are stored **per-serving** on `FoodItem` and **snapshotted** on `DiaryEntry` at log time so later edits to a food don't rewrite history.

---

## 1. Feature set & flows

| Area | Route | Component(s) | What it does |
|---|---|---|---|
| Onboarding gate | every `/nourish/*` | `NourishShell` → `OnboardingWizard` | 4-step wizard (stats → activity → goal → live target preview). Writes profile + first `TargetSnapshot` + onboarded flag. |
| Today dashboard | `/nourish` | `NourishClient` → `TodayDashboard` + `NourishInsights` + `FastingTracker` | Calorie ring, 3 macro cards, quick-log row, 4 meal sections (browse by date), water, AI photo logger. Runs weekly adaptive-TDEE check on mount. |
| Logging hub | `/nourish/log-food` | `AddFoodModal`, `QuickAddMacrosModal` | 6 tabs: Search (USDA), Quick add, Voice (→ pantry), Scan meal (→ dashboard), Receipt (→ pantry), From recipe. |
| Add Food modal | (modal) | `AddFoodModal` | 7 sub-modes: search / recent / recipes / snap (photo AI) / barcode / custom / quick. Focus-trapped dialog. |
| Diary | `/nourish/diary` | `DiaryView` | Date navigator, day totals, 4 meal sections, inline serving edit, delete, "log again". |
| Foods | `/nourish/foods` | `FoodsView` | Custom-food CRUD, search, one-tap quick-log to a chosen slot. |
| Meals | `/nourish/meals` | (inline page) | Save today's diary slot as a reusable `NourishMeal`; log to today or schedule across multiple days. |
| Recipes | `/nourish/recipes` | `LogRecipeButton` | Rank seed `RECIPES` by protein/kcal/cost, high-protein filter, log straight to diary. |
| Meal planner | `/nourish/meal-planner` | (inline page) | 7-day grid (recipe or saved meal per slot). "Log day" → diary. "Send week to grocery" → AppStore grocery (pantry-aware). |
| Goals | `/nourish/goals` | (inline page) | Edit `TargetSnapshot` (mode, weekly rate slider, kcal/macros). Recompute from profile. Saves `source:"manual"`. |
| Progress | `/nourish/progress` | `WeeklyReview` + `TrendsView` | Weight EWMA chart, 14-day calorie bar chart, adaptive TDEE card, this/last week review. **recharts**. |
| Fasting | `/nourish/fasting` | `FastingTracker` | Pick window plan, start/stop, live ring timer, 14-day summary + full log. |
| Reports | `/nourish/reports` | `DataExport` | Today/week/month avg macros, goal adherence %, copy-to-clipboard, print, CSV/JSON export. |
| Settings | `/nourish/settings` | `ProfileView`, `DataExport` | Edit profile/goal, haptics toggle, "coming soon" device integrations (HealthKit etc.). |
| Insights | (on dashboard) | `NourishInsights`, `MacroFitSuggestions` | Local recipe ranking against remaining macros + pantry match. Deep-links to AI Chef. |
| Recipe logging sidecars | recipe detail / AI Chef | `LogRecipeButton`, `LogGeneratedRecipeButton` | "Log to Nourish" expander on seed + generated recipes. |

---

## 2. Component inventory (one line each — 26 files)

| File | Purpose |
|---|---|
| `NourishClient.tsx` | Client wrapper for Today page; mounts dashboard + insights + fasting; fires `maybeUpdateAdaptiveTdee()` on mount. |
| `NourishShell.tsx` | Shared shell for all `/nourish/*` routes: hydration skeleton, onboarding gate, `PageHeader`, sticky `NourishSubNav`. |
| `NourishSubNav.tsx` | Sticky sub-nav — 12 links grouped Track/Plan/Review/Manage; uses `usePathname` + `aria-current`. |
| `OnboardingWizard.tsx` | 4-step setup wizard with live target preview; writes profile/targets/onboarded. |
| `TodayDashboard.tsx` | Today's hub: date strip, streak chip, calorie ring, macro cards, quick-log row, meal sections, water, photo logger, modals. |
| `NourishInsights.tsx` | "What should I cook?" panel — ranks recipes vs remaining macros + pantry; protein-staple nudge; AI Chef deep links. |
| `FastingTracker.tsx` | IF tracker: plan pills, start/stop, live SVG ring timer (1s/30s tick), recent fasts. |
| `AddFoodModal.tsx` | 7-tab focus-trapped add-food dialog (search/recent/recipes/snap/barcode/custom/quick). |
| `QuickAddMacrosModal.tsx` | Bottom-sheet modal: type kcal/macros, pick slot, log one-off `FoodItem`. |
| `BarcodeScanner.tsx` | Camera barcode scan (`BarcodeDetector` + `getUserMedia`) + manual entry → Open Food Facts lookup → log. |
| `PhotoMealLogger.tsx` | Photo/text → Anthropic Haiku component ID → USDA grounding → review/adjust grams → log aggregated entry. |
| `DiaryView.tsx` | Full diary: date nav, day totals bar, 4 meal sections, inline serving edit, delete, re-log. |
| `FoodsView.tsx` | Custom-food list/search/delete + one-tap quick-log to slot. |
| `ProfileView.tsx` | Profile + goal editor with live target preview; units toggle; re-run-wizard; embeds `DataExport`. |
| `TrendsView.tsx` | **recharts** weight EWMA line + 14-day calorie bar; adaptive-TDEE card; embeds `WeeklyReview`. |
| `WeeklyReview.tsx` | This-week / last-week stat cards (avg macros vs target, weight change, logging adherence). No charts. |
| `CalorieProgressRing.tsx` | Hero SVG calorie ring (gradient stroke, animated dash, over/exercise arcs). |
| `MacroRing.tsx` | Generic single-macro SVG radial ring (used as a reusable primitive). |
| `MacroCard.tsx` | One macro card: big number, animated progress bar, % chip, remaining/over. |
| `MacroFitSuggestions.tsx` | Lists seed recipes fitting remaining macro budget (via `findMacroFitRecipes`). |
| `WaterTracker.tsx` | Daily water: glasses visual, fill bar, quick-add ml buttons, editable goal. |
| `ExerciseLogger.tsx` | Bottom-sheet: pick kind/minutes → MET auto-kcal (override), save, list/delete today's sessions. |
| `QuickLogActions.tsx` | 7-tile quick-log grid (Log food / Voice / Scan meal / Scan receipt / Quick add / Water / Exercise). |
| `DataExport.tsx` | Export JSON (full) / diary CSV / weight CSV via Blob + anchor download. |
| `LogRecipeButton.tsx` | "Log to Nourish" expander for a seed `Recipe`. |
| `LogGeneratedRecipeButton.tsx` | "Log to Nourish" expander for an AI Chef `GeneratedRecipe`. |

---

## 3. Domain layer — every exported symbol (`src/lib/nourish/**`)

### 3.1 `types.ts`
**Type aliases:**
```ts
type Sex = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "very_active" | "extra_active";
type GoalMode = "cut" | "maintain" | "bulk" | "recomp";
type TargetSource = "formula" | "adaptive" | "manual";
type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
type FoodSource = "usda" | "custom" | "recipe";
type PreferredUnits = "metric" | "imperial";
```
**Interfaces (copied verbatim):**
```ts
interface UserProfile {
  heightCm: number;            // canonical cm
  weightKg: number;            // canonical kg
  age: number;
  sex?: Sex;                   // omit for body-comp flow
  bodyFatFraction?: number;    // 0–1, unlocks Katch-McArdle
  activityLevel: ActivityLevel;
  preferredUnits: PreferredUnits;
}

interface TargetSnapshot {
  effectiveFrom: string;       // YYYY-MM-DD
  mode: GoalMode;
  weeklyRateKg: number;        // + gain / − loss
  calorieTarget: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
  source: TargetSource;
}

interface WeightEntry { id: string; date: string /* YYYY-MM-DD */; weightKg: number; }

interface FoodItem {
  id: string;
  source: FoodSource;
  externalId?: string;         // USDA fdcId or recipe id
  name: string;
  brand?: string;
  servingDescription: string;  // "1 medium apple" / "100g"
  servingGrams?: number;       // grams per serving (for scaling)
  kcal: number; proteinG: number; carbG: number; fatG: number; fiberG?: number; // per-serving
}

interface DiaryEntry {
  id: string;
  date: string;                // YYYY-MM-DD
  meal: MealSlot;
  food: FoodItem;
  quantityServings: number;
  snapshotKcal: number; snapshotProteinG: number; snapshotCarbG: number; snapshotFatG: number; // snapshot at log time
  loggedAt: string;            // ISO timestamp
}

interface DayTotals { kcal: number; proteinG: number; carbG: number; fatG: number; }

interface UsdaSearchResult {
  fdcId: number; description: string; brandOwner?: string;
  servingSize?: number; servingSizeUnit?: string;
  foodNutrients: { nutrientId: number; nutrientName: string; value: number; unitName: string; }[];
}
```
**Functions:** `entryTotals(entry): DayTotals` (snapshot × servings); `sumTotals(entries[]): DayTotals`.

### 3.2 `storage.ts` — THE localStorage layer (all keys here)
`NOURISH_KEYS` const + exports:
- `getProfile(): UserProfile | null` / `setProfile(p)`
- `getTargets(): TargetSnapshot | null` / `setTargets(s)`
- `getWeightLog(): WeightEntry[]` / `addWeightEntry(e)` (one per date) / `deleteWeightEntry(id)`
- `getDiaryEntries(): DiaryEntry[]` / `getDiaryForDate(date): DiaryEntry[]` / `addDiaryEntry(e)` / `updateDiaryEntry(e)` / `deleteDiaryEntry(id)`
- `getCustomFoods(): FoodItem[]` / `saveCustomFood(f)` (upsert by id) / `deleteCustomFood(id)`
- `getFoodCacheEntry(query): unknown|null` / `setFoodCacheEntry(query, results)` — 24h TTL, capped 200 entries
- `isOnboarded(): boolean` / `setOnboarded(v)`
- `getAdaptiveLastRun(): string|null` / `setAdaptiveLastRun(date)`
- `getRecentFoods(): FoodItem[]` / `pushRecentFood(f)` — dedupe by id, cap 20
- `getWaterLog(): WaterEntry[]` / `getWaterForDate(date): WaterEntry` / `setWaterForDate(e)`
- `getProteinStreak(targetProteinG, threshold=0.85): number`
- **Utilities (pure, portable):** `dateToLocalString(d): string` (LOCAL YYYY-MM-DD — do NOT use `toISOString().slice(0,10)`, it shifts ±1 day off-UTC), `todayString(): string`, `newId(): string`
- Exported interface `WaterEntry { date: string; mlConsumed: number; goalMl: number; }`

`safeRead`/`safeWrite` are internal, **guarded by `typeof window === "undefined"`** and try/catch.

### 3.3 `calcEngine.ts` — pure math (100% portable, no I/O)
Constants: `KCAL_PER_G_PROTEIN=4`, `KCAL_PER_G_CARB=4`, `KCAL_PER_G_FAT=9`, `KCAL_PER_KG_FAT=7700`, `ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number>`.
Functions:
- `bmrMifflin(weightKg, heightCm, age, sex): number`
- `bmrKatchMcArdle(weightKg, bodyFatFraction): number`
- `bestBmr(profile): number`
- `tdee(bmr, activityLevel): number`
- `goalCalories(tdeeKcal, mode, weeklyRateKg): number`
- `maxWeeklyRateKg(weightKg, mode): { min: number; max: number }`
- `interface MacroTargets { proteinG; carbG; fatG; fiberG }`
- `macroTargets(calorieTarget, weightKg, mode): MacroTargets` (protein 2.0–2.3 g/kg, fat floor 0.8 g/kg, carbs fill, fiber 14g/1000kcal)
- `reconcileMacros(targets, calorieTarget): { ok; computed; delta }`
- `deriveTargets(profile, mode, weeklyRateKg, source="formula", effectiveFrom=today): TargetSnapshot` ← **single entry point** used by onboarding/profile/adaptive
- `ewmaWeight(weights[], alpha=0.1): number | null`
- `adaptiveTdeeEstimate(entries[], weights[], windowDays=14): number | null`
- Unit conversions: `kgToLbs`, `lbsToKg`, `cmToInches`, `inchesToCm`, `inchesToFeetAndInches(total): {feet,inches}`, `feetAndInchesToCm(feet,inches)`
- ⚠️ imports `dateToLocalString` from `storage.ts` (so calcEngine transitively pulls in storage; keep storage's pure utils separable or this couples math to the storage module).

### 3.4 `adaptiveTdee.ts` — weekly auto-retune (reads+writes storage)
- `interface AdaptiveResult { updated; adaptiveTdee; formulaTdee; previousTarget; newTarget; reason }`
- `maybeUpdateAdaptiveTdee(): AdaptiveResult` — throttled to 7 days, guards 800–6000 kcal, re-derives targets with `source:"adaptive"`. Called on dashboard mount.
- `getAdaptiveTdeeDisplay(): { adaptiveTdee; hasEnoughData; daysSinceLastUpdate }` — read-only.

### 3.5 `usdaClient.ts` — USDA FoodData Central (network + React hook)
- `usingDemoKey(): boolean`
- `usdaToFoodItem(raw: UsdaSearchResult): FoodItem`
- `interface SearchOptions { query; dataType?; pageSize?; signal?: AbortSignal }`
- `interface SearchResponse { foods: FoodItem[]; totalHits: number; error?: string }`
- `searchUsda(opts): Promise<SearchResponse>` — cached 24h; AbortSignal cancellable
- `fetchUsdaFood(fdcId): Promise<FoodItem | null>`
- `interface UseFoodSearchResult { results; loading; error; totalHits }`
- `useFoodSearch(query): UseFoodSearchResult` — **React hook**, 400ms debounce + abort-on-new-input (portable to RN as-is).

### 3.6 `openFoodFacts.ts`
- `lookupBarcode(barcode): Promise<FoodItem | null>` — GET to OFF API, cached. Returns `FoodItem` with `source:"usda"` so branded items show in search.

### 3.7 `aiMealLogger.ts` — Anthropic Haiku vision/text (network)
- `isAiLoggingEnabled(): boolean`
- `interface AiMealComponent { name; estimatedGrams; estimationBasis; confidence:"high"|"medium"|"low"; hiddenCalories? }`
- `identifyMealComponents(imageBase64, mediaType, description?): Promise<{ components: AiMealComponent[]; overallConfidence?; uncertainties? }>`
- `identifyMealFromText(description): Promise<...same...>`
- `HIDDEN_EXTRAS: readonly { name; searchTerm; typicalGrams; emoji }[]`

### 3.8 `mealEstimator.ts` — USDA grounding of AI output (network via searchUsda)
- `interface GroundedComponent { aiName; grams; aiConfidence; estimationBasis; usdaFood: FoodItem|null; scaled: {kcal,proteinG,carbG,fatG}|null; confirmed: boolean; kcalRange: {low,high}|null }`
- `groundComponentsInUsda(components: AiMealComponent[]): Promise<GroundedComponent[]>` (parallel USDA lookups)
- `rescaleComponent(component, newGrams): GroundedComponent`
- `sumGroundedMacros(components): { kcal; proteinG; carbG; fatG; kcalRange:{low,high} }`

### 3.9 `meals.ts` — reusable saved meals (own localStorage key)
- `interface NourishMealItem { food: FoodItem; quantityServings: number }`
- `interface NourishMeal { id; name; description?; defaultSlot?: MealSlot; items: NourishMealItem[]; totalKcal; totalProteinG; totalCarbG; totalFatG; createdAt; updatedAt }`
- `getMeals()` / `getMeal(id)` / `saveMeal(m)` (upsert) / `deleteMeal(id)`
- `totalMealMacros(items): {kcal,proteinG,carbG,fatG}`
- `mealToDiaryEntries(meal, date, slot, newIdFn): DiaryEntry[]`
- `entriesToMeal(entries, name, description, newIdFn, nowIso): NourishMeal`

### 3.10 `mealPlan.ts` — 7-day planner (own localStorage key)
- `type PlanItemKind = "recipe" | "meal"`
- `interface PlanItem { date; slot: MealSlot; kind: PlanItemKind; refId: string; name: string; kcal?: number; proteinG?: number }`
- `getPlan()` / `getPlanForDate(date)` / `getPlanCell(date, slot)` / `upsertPlanItem(item)` / `removePlanItem(date, slot)`
- `nextSevenDays(today): string[]` (LOCAL-time date strings)

### 3.11 `fasting.ts` — IF log (2 localStorage keys)
- `interface FastingPlan { id; label; fastingHours; eatingHours }`
- `FASTING_PLANS: FastingPlan[]` (12:12, 14:10, 16:8, 18:6)
- `interface ActiveFast { planId; startedAt /* ISO */ }`
- `interface FastEntry { id; planId; startedAt; endedAt; durationMs; targetMs; completed }`
- `getActiveFast()` / `startFast(planId): ActiveFast` / `endFast(nowMs, newIdFn): FastEntry|null` (log capped 60) / `getFastingLog(): FastEntry[]`

### 3.12 `exercise.ts` — exercise log (own localStorage key)
- `type ExerciseKind = "walking"|"running"|"cycling"|"weights"|"sport"|"yoga"|"other"`
- `interface ExerciseEntry { id; date; kind: ExerciseKind; name; durationMinutes; caloriesBurned; notes?; createdAt }`
- `EXERCISE_DEFAULTS: Record<ExerciseKind, { label; kcalPerMin }>` (MET-based, 70kg)
- `getExerciseLog()` / `getExerciseForDate(date)` / `addExerciseEntry(e)` / `deleteExerciseEntry(id)` / `sumExerciseCalories(entries): number`

### 3.13 `streak.ts` — pure
- `currentStreak(entries, todayStr): number` (lenient — accepts yesterday-ending if today unlogged)
- `bestStreak(entries): number`

### 3.14 `recipeIntegration.ts` — bridge to Recipe domain
- `recipeToDiaryFood(recipe: Recipe): FoodItem` (via `bestEffortNutrition`)
- `findMacroFitRecipes(recipes, remainingKcal, remainingProteinG, remainingCarbG, remainingFatG, tolerance=0.15, maxResults=6): Recipe[]`
- ⚠️ depends on `@/lib/types` (Recipe) and `@/lib/nutritionEngine` — both must come along into the shared package.

### 3.15 `barcodeDetector.d.ts` — ambient `BarcodeDetector` Web API typings (web-only).

---

## 4. localStorage keys (exact strings + stored shape)

> ⚠️ **The `srf:` prefix is legacy and MUST NOT be renamed** (project rule §14 — renaming wipes user data). For RN, AsyncStorage/MMKV should reuse these exact key strings so a future web↔native sync/import path is trivial.

| Key | Module | Stored value shape |
|---|---|---|
| `srf:nourish-profile` | storage | `UserProfile \| null` |
| `srf:nourish-targets` | storage | `TargetSnapshot \| null` |
| `srf:nourish-weight-log` | storage | `WeightEntry[]` |
| `srf:nourish-diary` | storage | `DiaryEntry[]` |
| `srf:nourish-custom-foods` | storage | `FoodItem[]` |
| `srf:nourish-food-cache` | storage | `{ query; results: unknown; cachedAt: number }[]` (24h TTL, ≤200) |
| `srf:nourish-onboarded` | storage | `boolean` |
| `srf:nourish-adaptive-last-run` | storage | `string \| null` (YYYY-MM-DD) |
| `srf:nourish-water-log` | storage | `WaterEntry[]` |
| `srf:nourish-recent-foods` | storage | `FoodItem[]` (≤20) |
| `srf:nourish-meals` | meals | `NourishMeal[]` |
| `srf:nourish-meal-plan` | mealPlan | `PlanItem[]` |
| `srf:nourish-fasting-active` | fasting | `ActiveFast \| null` |
| `srf:nourish-fasting-log` | fasting | `FastEntry[]` (≤60) |
| `srf:nourish-exercise-log` | exercise | `ExerciseEntry[]` |
| `srf:user-progress` | userProgress (shared) | `UserProgress` (mealsLogged etc.) |
| `srf:haptics-enabled` | haptics (shared) | `"true" \| "false"` (string; absent = enabled) |

Also touched indirectly via AppStore: `srf:pantry`, `srf:grocery` (planner grocery roll-up, insights pantry match) — outside this subsystem but a dependency.

---

## 5. Network / request-response contracts

### 5.1 USDA FoodData Central (`usdaClient.ts`)
- **Key:** `process.env.NEXT_PUBLIC_USDA_API_KEY` (falls back to `"DEMO_KEY"` — 30 req/hr).
- **Search:** `GET https://api.nal.usda.gov/fdc/v1/foods/search?api_key=…&query=…&dataType=Foundation,SR Legacy,Survey (FNDDS)&pageSize=20&fields=fdcId,description,brandOwner,servingSize,servingSizeUnit,foodNutrients`
  - Response: `{ totalHits?: number; foods?: UsdaSearchResult[] }` → mapped to `SearchResponse`. 429 → friendly error string.
- **Detail:** `GET https://api.nal.usda.gov/fdc/v1/food/{fdcId}?api_key=…&format=abridged` → `UsdaSearchResult`.
- Nutrient IDs: ENERGY 1008, PROTEIN 1003, CARBS 1005, FAT 1004, FIBER 1079. Per-100g default unless `servingSizeUnit==="g"`.

### 5.2 Open Food Facts (`openFoodFacts.ts`) — no key
- `GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json?fields=code,product_name,brands,serving_description,serving_quantity,nutriments,nutriment_data_per`
- Response `{ status: 0|1; product?: { product_name; brands; serving_quantity; nutriments: {"energy-kcal_100g","proteins_100g",…} } }` → `FoodItem` (status≠1 → null).

### 5.3 Anthropic Haiku (`aiMealLogger.ts`) — **called directly from the browser**
- **Key:** `process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY` (may be empty → AI features show offline state).
- `POST https://api.anthropic.com/v1/messages`
  - Headers: `Content-Type: application/json`, `x-api-key: <key>`, `anthropic-version: 2023-06-01`, **`anthropic-dangerous-direct-browser-access: true`**.
  - Body: `{ model: "claude-haiku-4-5-20251001", max_tokens: 1200, system, messages }`. Vision messages send `{ type:"image", source:{ type:"base64", media_type, data } }`.
  - Response: `{ content: { type; text? }[] }` — text is JSON (strip ``` fences), parsed to `{ components: AiMealComponent[] }`. Defensive: filters to valid components.

> RN note: the `anthropic-dangerous-direct-browser-access` header is a browser-CORS shim; on native there's no CORS so it's harmless but unnecessary. The key being `NEXT_PUBLIC_*` means it ships in the bundle — same risk on native; consider routing through a backend instead.

---

## 6. Browser / Next-only couplings → RN adaptation

| Coupling | Where | RN fix |
|---|---|---|
| `window.localStorage` (all `safeRead`/`safeWrite`) | every storage module (`storage`, `meals`, `mealPlan`, `fasting`, `exercise`, `userProgress`, `haptics`) | Behind a **`KV` adapter** interface (`getItem/setItem` sync). Web → `localStorage`; RN → MMKV (sync) or a sync wrapper over AsyncStorage hydrated at boot. All these modules assume **synchronous** reads/writes — preserve that. |
| `typeof window === "undefined"` SSR guards | storage modules | Harmless on RN (always falsy) but no-ops; the KV adapter removes the need. |
| `process.env.NEXT_PUBLIC_USDA_API_KEY` / `…_ANTHROPIC_API_KEY` | `usdaClient`, `aiMealLogger` | Expo: `process.env.EXPO_PUBLIC_*` or `expo-constants` `extra`. Inject via a config module the shared package reads. |
| `fetch` | usda/off/anthropic clients | Works in RN as-is. |
| `recharts` (`LineChart`, `BarChart`, `XAxis`, `Tooltip`, `ResponsiveContainer`, `ReferenceLine`) | `TrendsView` | **Rebuild with `react-native-svg` + `victory-native`/`react-native-gifted-charts`**, or hand-roll SVG. recharts is DOM-only. |
| Raw `<svg>`/`<circle>`/`<linearGradient>` | `CalorieProgressRing`, `MacroRing`, `FastingTracker` ring | Port to `react-native-svg` (`Svg`, `Circle`, `Defs`, `LinearGradient`, `Stop`). Geometry/dash math is pure — reuse it. |
| `next/link`, `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`) | shell, subnav, pages, insights | Replace with Expo Router / React Navigation (`Link`, `useRouter`, `usePathname`, `useLocalSearchParams`). |
| `next/image` | not used here (uses `RecipeImage` + plain `<img>`) | `PhotoMealLogger` previews use `<img>`/`URL.createObjectURL` → RN `<Image source={{uri}}>` + `expo-image-manipulator`. |
| `'use client'` directives | every component + several lib files | Drop entirely in RN. |
| Tailwind classNames / `clsx` | every component | No Tailwind in RN by default. Rebuild styling (NativeWind keeps classNames, else `StyleSheet`). All visual structure must be re-authored. |
| `document.createElement("canvas")` + `<img>` decode + `canvas.toDataURL` (image downscale to 768px, base64) | `PhotoMealLogger.processImage` | Use `expo-image-picker` (capture/library) + `expo-image-manipulator` (resize + base64). Feed base64 to `identifyMealComponents`. |
| `BarcodeDetector` Web API + `navigator.mediaDevices.getUserMedia` + `<video>` + `requestAnimationFrame` scan loop | `BarcodeScanner` | Rebuild with `expo-camera` / `expo-barcode-scanner` (`onBarCodeScanned`). Keep `lookupBarcode()` lib unchanged. Manual-entry input path is portable. |
| `navigator.clipboard.writeText` | `reports/page.tsx` (`copySummary`) | `expo-clipboard` `setStringAsync`. |
| `window.print()` | `reports/page.tsx` (`printPage`) | No native equivalent — replace with `expo-print` (PDF) / share sheet, or drop. |
| `Blob` + `URL.createObjectURL` + anchor `download` | `DataExport` | `expo-file-system` write file + `expo-sharing` share sheet. Logic that builds JSON/CSV strings is portable. |
| `navigator.vibrate` (Vibration API) | `haptics.ts` | Swap to `expo-haptics` (`impactAsync`/`notificationAsync`). Keep the enabled-flag + pattern semantics; the `srf:haptics-enabled` KV stays. |
| `window.matchMedia("(prefers-reduced-motion: reduce)")` | `FastingTracker` tick interval | RN `AccessibilityInfo.isReduceMotionEnabled()`. |
| Focus trap (`document.addEventListener("keydown")`, Tab cycling, `document.activeElement`) | `AddFoodModal`, `QuickAddMacrosModal` Escape | Native modals (`react-native` `Modal`) handle focus/back-button; rebuild dismissal with hardware back + backdrop press. |
| `motion-safe:` Tailwind + `@/components/motion/AnimatedNumber` | rings, macro cards | Re-implement count-up with `react-native-reanimated`; respect reduce-motion. |
| `.toLocaleDateString` / `Intl.DateTimeFormat` | many components | Works in RN (Hermes has Intl) but verify locale data is bundled; otherwise format manually. |

---

## 7. Cross-subsystem dependencies (must travel with Nourish)

- `@/lib/types` (`Recipe`), `@/data/recipes` (`RECIPES`, `RECIPE_MAP`), `@/data/macroRecipes` (`MACRO_RECIPES`), `@/data/ingredients` (`INGREDIENT_MAP`) — read by recipes/planner/insights/AddFoodModal.
- `@/lib/nutritionEngine` (`bestEffortNutrition`, `isHighProtein`), `@/lib/recipeScoring` (`calculateCostPerServing`, `calculateMissingIngredients`, `calculatePantryMatch`, `pantrySetFromItems`) — recipe nutrition/cost/pantry math.
- `@/lib/AppStore` (`useAppStore` → `{ pantry, grocery, addGroceryItems, addStapleToGrocery }`) — planner grocery roll-up + insights. **Context/hook; needs a shared store implementation in RN.**
- `@/lib/workerClient` (`GeneratedRecipe` type) — `LogGeneratedRecipeButton`.
- `@/lib/userProgress` (`bumpProgress`, `milestoneMessage`, `UserProgress`) + `@/lib/haptics` — shared celebratory/haptic layer.
- UI primitives `@/components/ui/*` (`Button`, `SelectablePill`, `EmptyState`, `SectionHeading`, `PageHeader`, `Toast`/`useToast`, `IconTile`, `HorizontalCarousel`, `CategoryChip`), `@/components/recipe/RecipeImage`, `@/components/motion/AnimatedNumber`, `lucide-react` icons — **all UI, rebuild natively** (lucide → `lucide-react-native`).

---

## 8. RN port plan

**Tier 1 — moves into shared package unchanged (pure logic):**
`calcEngine.ts` (all BMR/TDEE/macro/EWMA/unit math), `streak.ts`, `types.ts` (incl. `entryTotals`/`sumTotals`), `recipeIntegration.ts` (given nutritionEngine travels too), the pure helpers in `mealEstimator.ts`/`meals.ts`/`fasting.ts`/`exercise.ts` that don't touch storage (`totalMealMacros`, `mealToDiaryEntries`, `entriesToMeal`, `sumGroundedMacros`, `rescaleComponent`, `sumExerciseCalories`, `nextSevenDays`), and the JSON/CSV string builders in `DataExport`. Network clients `usdaClient`/`openFoodFacts`/`aiMealLogger`/`mealEstimator` move over with only the env-var + (optional) backend-proxy change. The `useFoodSearch` hook ports unchanged.

**Tier 2 — needs a thin platform adapter (small, mechanical):**
All storage modules (`storage`, `meals`, `mealPlan`, `fasting`, `exercise`, `adaptiveTdee`, `userProgress`) — introduce a synchronous **`KV` adapter** and swap `window.localStorage` for it (keep exact `srf:` keys). `haptics.ts` — swap `navigator.vibrate` → `expo-haptics`, keep the flag. Env config module for the two `NEXT_PUBLIC_*` keys → `EXPO_PUBLIC_*`. Clipboard/export/print/image-resize → Expo APIs behind small wrappers.

**Tier 3 — must be rebuilt natively (UI):**
Every file in `src/components/nourish/**` and every `src/app/nourish/**` page — re-author with RN primitives + `react-native-svg` (rings) + `victory-native`/`gifted-charts` (the recharts in `TrendsView`) + Expo Router navigation + `expo-camera`/`expo-barcode-scanner` (BarcodeScanner) + `expo-image-picker`/`expo-image-manipulator` (PhotoMealLogger) + `react-native` `Modal` (AddFoodModal/QuickAdd/Exercise sheets) + a shared `AppStore` context + native versions of the `ui/*` primitives. Behavior, data flow, and all reads/writes stay routed through the Tier-1/Tier-2 lib so functionality doesn't regress.

**Suggested package boundary:** `@waivy/nourish-core` = Tier 1 + Tier 2 (logic + clients + KV/haptics/env adapter interfaces, no React-DOM, no Tailwind). Web injects `localStorage`/`fetch`/Vibration adapters; RN injects MMKV/Expo adapters. UI stays per-platform.

---

## 9. Gotchas / invariants to preserve

- **Local-time date strings everywhere.** `dateToLocalString`/`todayString`/`nextSevenDays`/streak code deliberately avoid `toISOString().slice(0,10)`. Keep this — diary, planner, streaks, weekly stats all key off local YYYY-MM-DD and break ±1 day off-UTC otherwise.
- **Macro snapshots on `DiaryEntry`.** Always copy `food.kcal`/`proteinG`/… into `snapshot*` at log time. `entryTotals` reads the snapshots × `quantityServings`, not the live `food`.
- **Storage helpers are synchronous.** Components call `getX()` in `useEffect` and render immediately; an async KV would require refactoring every component's hydration. Prefer a sync RN KV (MMKV) or pre-hydrate.
- **AI/USDA/OFF must degrade gracefully** when keys/network are missing (project rule §11) — `isAiLoggingEnabled()` gate, `usingDemoKey()` banner, try/catch returning empty/null.
- **Adaptive TDEE** mutates targets silently on dashboard mount (throttled 7d, clamped 800–6000). Keep the throttle key (`srf:nourish-adaptive-last-run`).
- One weigh-in per date (`addWeightEntry` replaces same-date), recent foods cap 20, food cache cap 200/24h, fasting log cap 60.
