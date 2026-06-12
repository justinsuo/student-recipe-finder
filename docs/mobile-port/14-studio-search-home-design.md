# 14 — Recipe Studio, Smart Search, Home, Design System & Haptics

Engineering brief for porting the **Recipe Studio**, **smart search**, **home hero**, the floating **Pesto chatbot**, and the **full Pantry Pop design system + haptics** from the Waivy Next.js app to a shared package consumed by an Expo React Native iPhone app.

Source of truth: `/Users/justinsuo/waivy`. All paths below are relative to that root unless absolute.

---

## 0. TL;DR port strategy

| Layer | Move to shared pkg unchanged | Thin platform adapter | Rebuild natively |
| --- | --- | --- | --- |
| Search algorithm (`src/lib/search/*` except React component) | ✅ pure TS | — | — |
| Chatbot intent engine (`src/lib/chatbot.ts`) | ✅ pure TS | — | — |
| Design tokens (`src/lib/design/tokens.ts`) | ✅ pure consts | — | — |
| Types (`customRecipeTypes.ts`, `types.ts`) | ✅ | — | — |
| Worker request/response contracts (the TS interfaces + `postJson` shape) | ✅ interfaces | `fetch` works in RN; `AbortController` works; keep | — |
| Custom recipe storage (`customRecipeStorage.ts`) | logic ✅ | swap `localStorage` → AsyncStorage (sync→async) | image cache → FileSystem |
| Recent searches (`recentSearches.ts`) | logic ✅ | swap `localStorage` → AsyncStorage | — |
| Haptics (`src/lib/haptics.ts`) | API surface ✅ | rewrite body to `expo-haptics` | — |
| `SmartRecipeSearch`, `SearchZeroState`, `HighlightedMatch` | logic ✅ | — | rebuild as RN views (DOM/`<mark>`/listbox ARIA → RN) |
| `Chatbot.tsx` (Pesto UI) | intent call ✅ | — | rebuild (fixed overlay, FlatList, KeyboardAvoidingView) |
| `ExplodedRecipeHero` / `PantryToRecipePreview` (`motion/react`, scroll-pin) | concept | — | rebuild with Reanimated |
| Recipe Studio pages (`recipe-studio/page.tsx`, `new/page.tsx`) | save/build logic ✅ | — | rebuild forms as RN |
| `ThreeDButton` (CSS 3D press) | variant/size token tables ✅ | — | rebuild press anim with Pressable + Reanimated |
| `globals.css` keyframes / Tailwind | — | — | rebuild as RN styles / NativeWind + Reanimated |

---

## 1. Design system — Pantry Pop palette + tokens

File: `src/lib/design/tokens.ts` (pure TS, **moves to shared package unchanged**, zero browser coupling). Mirrors CSS vars in `globals.css`.

### 1.1 `PANTRY_POP` (canonical hex)
```ts
export const PANTRY_POP = {
  background: "#FFF8ED",   // warm cream — body background
  surface: "#FFFFFF",
  surfaceSoft: "#FFF1D9",  // soft card tint
  oat: "#F6E7CF",
  borderSoft: "#E8D8C4",
  textMain: "#241A12",     // espresso
  textMuted: "#6B5A4A",    // warm gray
  basil: "#2FBF71",        // primary action
  basilShadow: "#16834A",  // 3D depth shadow for basil
  carrot: "#FF8A3D",
  butter: "#FFD166",
  tomato: "#EF4444",
  grape: "#7C5CFF",
  teal: "#20C7A5",
  sky: "#3BA7FF",
  pink: "#FF6B9E",
} as const;
```

### 1.2 `PALETTE` (semantic, derived from PANTRY_POP)
```ts
export const PALETTE = {
  brand: { 50:"#e8faf0", 100:"#cff5e1", 300:"#7fdbab",
           500:PANTRY_POP.basil, 600:"#27a763", 700:PANTRY_POP.basilShadow, 900:"#0d5a32" },
  surface: { page:PANTRY_POP.background, elevated:PANTRY_POP.surface, soft:PANTRY_POP.surfaceSoft, oat:PANTRY_POP.oat },
  text:    { primary:PANTRY_POP.textMain, secondary:PANTRY_POP.textMuted, muted:"#a39685", inverse:PANTRY_POP.surface },
  border:  { soft:PANTRY_POP.borderSoft },
  accent:  PANTRY_POP,
} as const;
```

### 1.3 `CATEGORY_COLOR` — maps category keys → tailwind tone names
Type: `export type CategoryKey = keyof typeof CATEGORY_COLOR;`
```ts
export const CATEGORY_COLOR = {
  "ai-chef":"violet", pantry:"emerald", cheap:"amber", nourish:"orange",
  saved:"rose", grocery:"teal", explore:"indigo",
  protein:"violet", carbs:"sky", fat:"amber", fiber:"emerald", water:"cyan",
  "air-fryer":"orange", microwave:"sky", "no-stove":"emerald",
  "use-soon":"amber", spicy:"red",
  vegetarian:"emerald", vegan:"emerald", "high-protein":"violet",
  "gluten-free":"amber", "dairy-free":"sky", "meal-prep":"teal", "dorm-friendly":"emerald",
} as const;
```
> RN note: these are **Tailwind tone names**, not hex. In RN you must map `"emerald" | "violet" | ...` to concrete hex (Badge/TagChip equivalents). Keep this table in shared pkg; add a `TONE_HEX` resolver in the RN layer.

Spec mapping (from CLAUDE.md / theme-research): AI Chef=grape `#7C5CFF`(violet); Pantry=basil `#2FBF71`(emerald); Cheap=butter `#FFD166`(amber); Nourish=carrot `#FF8A3D`(orange); Saved=pink `#FF6B9E`(rose); Grocery=teal `#20C7A5`; Explore=indigo `#6366F1`.

### 1.4 Motion / radius / depth tokens
```ts
export const MOTION = {
  duration: { fast:150, base:220, slow:360, page:700 },           // ms
  easing:   { out:"cubic-bezier(0.16, 1, 0.3, 1)", inOut:"cubic-bezier(0.65, 0, 0.35, 1)" },
} as const;
export const BUTTON_DEPTH_PX = 4;   // 3D button press depth (≥6px feels mushy)
export const RADIUS = {
  sm:"0.75rem" /*12*/, md:"1rem" /*16*/, lg:"1.25rem" /*20*/,
  xl:"1.5rem" /*24*/, "2xl":"2rem" /*32*/, pill:"9999px",
} as const;
```
> RN note: `RADIUS` values are **rem strings** — convert to numeric px for RN (`12,16,20,24,32` and a large pill value e.g. `9999`). `MOTION.easing` are cubic-bezier strings — in Reanimated use `Easing.bezier(0.16,1,0.3,1)` and `Easing.bezier(0.65,0,0.35,1)`.

### 1.5 `globals.css` — what it defines (`src/app/globals.css`, **Next/Tailwind-only, rebuild**)
- `:root` CSS vars mirror PANTRY_POP + motion (`--background`, `--surface`, `--primary`=`#2fbf71`, `--primary-shadow`=`#16834a`, accents, `--motion-fast/base/slow`, `--ease-out`, `--ease-in-out`). RN equivalent = the `tokens.ts` consts.
- `.app-main` bottom padding `9rem` mobile / `3rem` desktop — room for BottomNav (~76px) + floating Pesto + safe area. RN: handle via SafeAreaView + tab bar inset.
- Keyframes (CSS, must be rebuilt in Reanimated/Moti): `shimmer`, `fadeIn`, `emojiFloat`, `fadeUp`, `popIn`, `pulseGlow` (basil glow halo behind Pesto button + AI badges), `navUnderlineSlide`, `brandBob`, `shaderSpin`, `shaderDrift`, `chromeShimmer`.
- `.dot-grid` decorative radial-gradient texture (`rgba(47,191,113,0.18)` basil dots, 22px grid) — used behind home hero + Pesto panel header. RN: rebuild with an SVG/Image pattern or skip.
- `@media (prefers-reduced-motion: reduce)` kills all animation. RN equivalent: `AccessibilityInfo.isReduceMotionEnabled()` → gate animations.

### 1.6 Typography
- Fonts: `--font-geist-sans` / `--font-geist-mono` (Geist via `next/font`), fallback `system-ui, sans-serif`. RN: bundle Geist via `expo-font` or fall back to system. `-webkit-font-smoothing: antialiased` / `text-rendering` are web-only no-ops in RN.

### 1.7 `ThreeDButton` design (`src/components/ui/ThreeDButton.tsx`, **rebuild; reuse token tables**)
Exports: `ThreeDButton` (forwardRef button), `ThreeDLink` (Next `Link` variant), and prop types `ThreeDButtonProps`, `ThreeDLinkProps`.
- `Variant = "primary"|"secondary"|"success"|"warning"|"danger"|"ghost"|"soft"`; `Size = "sm"|"md"|"lg"`.
- BaseProps: `{ variant?, size?, loading?, leftIcon?, rightIcon?, block?, className?, children, haptic? }`. `ThreeDLink` adds `href:string` (and forbids button-only props).
- **3D press technique** (load-bearing for the look): a thick **bottom border** (`border-b-[var(--3d-depth,4px)]`, depth = `BUTTON_DEPTH_PX`) simulates depth; on `:active` the bottom border shrinks to 0 **and** the face `translateY(+4px)` + `brightness(0.96)` → "pressed into page". Hover: `-translate-y-px` + `brightness(1.03)`.
- Face palettes (gradient top→bottom + colored bottom-border = the shadow color):
  - primary/success: `#3AD081→#2FBF71`, border `#16834A`, white text.
  - secondary: `white→#FFF8ED`, border `#E8D8C4`, espresso text.
  - warning: `#FFD166→#FFB347`, border `#B97A12`, text `#3A2A0F`.
  - danger: `rose-500→rose-600`, border `rose-700`, white.
  - soft: `violet-100→violet-200`, border `violet-300`, `violet-900`.
  - ghost: transparent, no shadow.
- Sizes: sm `h-9 px-3.5 text-xs`, md `h-11 px-5 text-sm`, lg `h-12 px-6 text-base`.
- Fires `hapticLight()` on press (unless `haptic=false`).
> RN rebuild: `Pressable` + Reanimated. Simulate the bottom-border depth with a colored shadow `View` underneath the face and animate `translateY` on `onPressIn/Out`. Map gradients via `expo-linear-gradient`. Call `hapticLight()` (RN haptics adapter).

### 1.8 Card / spacing conventions seen across these files (for RN parity)
- Cards: white bg, `border-stone-200`/`#E8D8C4`, rounded `2xl`/`3xl` (16–24px), subtle shadow; recipe mini cards use `aspect-[4/3]` image then padded body.
- Primary CTA = basil solid pill; secondary = white outline; focus ring `ring-2 ring-emerald-500 ring-offset-2`.
- Tap targets ≥40×40px; floating Pesto button is 56×56 (`h-14 w-14`).

---

## 2. Haptics API (`src/lib/haptics.ts`)

**Move the API surface to shared pkg; rewrite the body** for RN (`expo-haptics`). All functions take no args, return `void`, fire-and-forget.

### 2.1 Exports
```ts
export function isHapticsEnabled(): boolean   // reads localStorage flag; default true
export function setHapticsEnabled(enabled: boolean): void
export function hapticLight(): void     // vibrate(10)         — tap: pill/button/chip
export function hapticMedium(): void    // vibrate(18)         — commit form / save recipe
export function hapticSuccess(): void   // vibrate([12,30,24]) — goal hit / generated / logged
export function hapticWarning(): void   // vibrate([8,40,8])   — warning before destructive
export function hapticError(): void     // vibrate([18,50,18,50,18]) — cancel/failure
```

### 2.2 localStorage
- **Key:** `"srf:haptics-enabled"`. **Value:** raw string `"true"` / `"false"`. Absent ⇒ enabled (default). `isHapticsEnabled()` reads fresh each call (no cache).

### 2.3 Browser coupling → RN adaptation
- Web body uses `window.navigator.vibrate(...)` (Android-only; iOS Safari/desktop no-op). `safeWindow()` guards SSR.
- RN: replace each `fire(pattern)` with `expo-haptics`:
  - `hapticLight` → `Haptics.impactAsync(ImpactFeedbackStyle.Light)`
  - `hapticMedium` → `Haptics.impactAsync(Medium)`
  - `hapticSuccess` → `Haptics.notificationAsync(NotificationFeedbackType.Success)`
  - `hapticWarning` → `Haptics.notificationAsync(Warning)`
  - `hapticError` → `Haptics.notificationAsync(Error)`
- Replace `localStorage` flag with AsyncStorage (becomes async; provide a cached sync getter loaded at boot since callers expect sync `void`).

---

## 3. Smart Search subsystem

### 3.1 Pure logic (`src/lib/search/*`) — **moves to shared package unchanged** (zero browser coupling except recentSearches)

**`searchNormalization.ts`** exports:
```ts
function singularize(token: string): string
function normalize(text: string): string        // lowercase, NFKD, strip marks/punct, collapse ws
function expandAlias(text: string): string       // ACV→apple cider vinegar, garbanzos→chickpeas...
function tokenize(query: string): string[]       // alias-expand, normalize, drop stop words, singularize, len≥2
function termInText(term: string, normalizedText: string): boolean
```
- `STOP_WORDS` (the/a/with/recipe/easy/quick/best/...), `ALIAS_MAP` (single-direction: `acv→apple cider vinegar`, `garbanzos→chickpeas`, `scallions→green onions`, `cilantro→coriander`, `aubergine→eggplant`, `capsicum→bell pepper`, `pb→peanut butter`, `veg/veggies→vegetables`, etc.). All module-private.

**`fuzzyMatch.ts`** exports:
```ts
function editDistance(a: string, b: string): number          // Levenshtein (rolling DP)
function isFuzzyMatch(query: string, target: string): boolean // length-scaled tolerance (1/2/3)
function bestFuzzyMatch(query, candidates: string[]): { match: string; distance: number } | null
```

**`recipeSearch.ts`** exports:
```ts
type SearchScope = "all" | "names" | "ingredients" | "tags";
interface RecipeSearchIndexItem { recipeId; title; normalizedTitle; description; normalizedDescription;
  ingredients:string[]; normalizedIngredients:string[]; tags:string[]; equipment:string[];
  cuisineStyle?:string; mealType:string; searchableText:string; recipe:Recipe; }
interface MatchReason { field:"title"|"ingredient"|"tag"|"equipment"|"cuisine"|"description"|"mealType"; value:string; }
interface SearchHit { item:RecipeSearchIndexItem; score:number; reasons:MatchReason[]; }

function buildRecipeIndex(recipes: Recipe[]): RecipeSearchIndexItem[]
function searchRecipes(query, index, options?:{scope?:SearchScope; pantryBoostIds?:Set<string>}): SearchHit[]
function suggestForQuery(query, index, maxPerKind=5):
  { recipes:{value:string;recipeId:string}[]; ingredients:string[]; tags:string[] }
```
**Algorithm (`searchRecipes`):**
1. Empty/no-token query ⇒ `[]`.
2. Per token (and its alias expansion), take max score across fields by scope:
   - title: exact `100`, prefix `80`, includes `60`
   - ingredient: exact `55`, prefix `45`, includes `35`
   - tag: exact/prefix `38`; equipment includes `28`; cuisine `22`; mealType `18`; description `12`
   - fuzzy fallback (token len ≥3, no exact): title `28`, ingredient `22`
   - token with 0 score ⇒ `allTokensFound=false` but loop continues.
3. Bonuses: full-phrase title exact `+40`, phrase-in-title `+25`, all-tokens-found multi-token `+15`, pantry boost `+4` per ingredient in `pantryBoostIds`.
4. Dedupe reasons by `field|value`; keep hits with `score>0`; sort desc by score.

**`suggestForQuery`** (autocomplete + "did you mean") returns ranked recipe names (with ids), ingredient names, tag names — title includes `q` scored 70/100/200, token-subset 50; ingredient includes 50/80, token 30; tag 40/80. Each capped to `maxPerKind`, deduped.

> **RN: all of the above is pure TS → use as-is.** Build the index once per recipes-array identity (memoize). `RecipeSearchIndexItem.recipe` requires the `Recipe` type and `INGREDIENT_MAP` (data dir).

### 3.2 `recentSearches.ts` — pure logic + **one localStorage adapter point**
Exports:
```ts
function getRecentSearches(): string[]
function addRecentSearch(q: string): void   // dedupe (case-insensitive), unshift, cap 8
function removeRecentSearch(q: string): void
function clearRecentSearches(): void
const TRENDING_SUGGESTIONS: string[]  // ["Air fryer meals","Microwave dinners","Under $2",
                                      //  "High protein","Rice bowls","Meal prep","Vegetarian","Dorm-friendly"]
```
- **localStorage key:** `"srf:recent-searches"`. **Value:** `JSON.stringify(string[])`, max 8 entries, newest first.
- Browser coupling: `window.localStorage` guarded by `typeof window === "undefined"`.
- **RN adapt:** swap the `safeRead`/`safeWrite` internals to AsyncStorage. Because callers are synchronous (`getRecentSearches()` returns `string[]` immediately and components call it in render/handlers), wrap in an in-memory cache hydrated on app boot, or refactor callers to async + state.

### 3.3 `SmartRecipeSearch.tsx` (`src/components/search/`) — **rebuild UI, reuse logic**
`"use client"`. Exports `SmartRecipeSearch(props)`.
```ts
interface Props {
  recipes: Recipe[];
  value: string;
  onChange: (v: string) => void;
  scope?: SearchScope;
  onScopeChange?: (s: SearchScope) => void;
  placeholder?: string;
  zeroResults?: boolean;   // declared but currently unused beyond doc
}
interface Suggestion { kind:"recipe"|"ingredient"|"tag"|"recent"|"trending"; value:string; recipeId?:string; }
```
Behavior: memoized index via `buildRecipeIndex`; empty query ⇒ recents(≤5)+trending(≤6); typed ⇒ `suggestForQuery(...,4)` flattened to ≤10; keyboard nav (Arrow/Enter/Escape), grouped rendering, `addRecentSearch` on apply/Enter.
**Browser/Next couplings to replace in RN:**
- `role="combobox"/"listbox"/"option"`, `aria-*`, `useId` → RN accessibility props.
- `document.addEventListener("mousedown", onClickAway)` (click-outside) → RN: tap-outside via overlay/`Modal` or `Keyboard`/blur.
- `<input type="search">`, `inputRef.focus()` → RN `TextInput` + ref `.focus()`.
- lucide-react icons → `lucide-react-native` or `@expo/vector-icons`.
- `clsx` + Tailwind classes → NativeWind or StyleSheet.
- `<HighlightedMatch>` (`<mark>`) → RN `<Text>` with styled spans.

### 3.4 `HighlightedMatch.tsx` — **rebuild (DOM-only render), logic is portable**
`"use client"`. `HighlightedMatch({ text, query })`. Tokenizes query, finds + merges match ranges in `normalize(text)`, reconstructs against original text (bails if `normText.length !== text.length`), wraps matches in `<mark className="bg-emerald-100 text-emerald-900">`.
- RN: return `<Text>` with nested `<Text style={{backgroundColor:'#d1fae5', color:'#064e3b', fontWeight:'600'}}>` segments. The range-finding logic is pure and reusable.

### 3.5 `SearchZeroState.tsx` — **rebuild UI, reuse fuzzy logic**
`"use client"`. Exports `SearchZeroState(props)`:
```ts
interface Props {
  query: string;
  hidingFilters?: { label: string; clear: () => void }[];
  filtersHidingMatches?: boolean;
  onClearAll?: () => void;
  onApplySuggestion?: (suggestion: string) => void;
  index: RecipeSearchIndexItem[];
}
```
Builds a haystack of titles+ingredients, runs `bestFuzzyMatch` for "Did you mean", plus up to 4 substring suggestions. Renders AI-Chef deep link: `` `/ai-chef?notes=${encodeURIComponent(`Make me a recipe based on: ${query}`)}` ``.
- Next coupling: `next/link`, `Button` primitive, lucide icons. RN: navigation via Expo Router `Link`/`router.push`, rebuild button. The fuzzy/suggestion computation is portable.

---

## 4. Pesto floating chatbot

### 4.1 `src/lib/chatbot.ts` — **pure TS rule-based engine → moves to shared package unchanged**
Exports:
```ts
interface ChatContext { pantry: PantryItem[]; savedRecipeIds: string[]; }
interface ChatReply  { message: string; recipeIds?: string[]; }
function chatRespond(message: string, context: ChatContext): ChatReply
```
- Runs ordered intent handlers: greeting → help → saved → pantry → protein → quick → cheap → fallback. Detects diet/equipment/mealType/budget/ingredients/maxTime via keyword maps; ranks via `rankCheapRecipes`/`rankPantryRecipes` (from `recipeScoring`); messages use `**markdown bold**`. Returns `recipeIds` for card rendering.
- Dependencies: `@/data/ingredients` (`INGREDIENTS`, `INGREDIENT_MAP`), `@/data/recipes` (`RECIPES`), `@/lib/recipeScoring`, `@/lib/types`. All pure/data — bring along. **No network, no browser APIs.** Note: Pesto here is fully **on-device deterministic** (not the Anthropic-backed chat referenced in CLAUDE.md).

### 4.2 `src/components/layout/Chatbot.tsx` — **rebuild UI, reuse `chatRespond`**
`"use client"`. Exports `Chatbot()`. Internal `ChatMessage { id; role:"assistant"|"user"; content:string; recipeIds?:string[] }`. `STARTER_PROMPTS` quick chips. Greets as **Pesto**; on send, calls `chatRespond(text, { pantry, savedRecipeIds: saved })` from `useAppStore()`, appends user+assistant messages. Includes a tiny `renderMarkdown` (only `**bold**`).
**Browser/Next couplings to replace:**
- Floating 56×56 button fixed bottom-right (`fixed bottom-24 right-4 md:bottom-6`), `pulseGlow` halo, tooltip on hover. RN: absolute-positioned `Pressable` over the tab navigator; pulse via Reanimated; no hover tooltip.
- **Hide-while-typing:** listens to `document` `focusin`/`focusout` for INPUT/TEXTAREA/contentEditable to hide the button (keyboard overlap). **Critical behavior — must preserve.** RN: use `Keyboard.addListener('keyboardDidShow'/'Hide')` to hide/show.
- `document.addEventListener("keydown", Escape)` to close → RN: hardware back / close button only.
- Panel: `fixed inset-x-3 bottom-44 ... max-h-[72vh]`, `fadeUp` animation, `.dot-grid` header, auto-scroll-to-bottom via `scrollRef.scrollTop`. RN: `Modal`/bottom sheet + `FlatList` (`scrollToEnd`) + `KeyboardAvoidingView`. `env(safe-area-inset-bottom)` → `useSafeAreaInsets`.
- `next/link` recipe cards → Expo Router. lucide-react → native icon set. `RECIPE_MAP`, `calculateCostPerServing` are portable.

---

## 5. Home hero components (`src/components/home/`) — **rebuild with Reanimated**

### 5.1 `ExplodedRecipeHero.tsx`
Exports `ExplodedRecipeHero()`. Scroll-driven "exploded view": a recipe card (`egg-fried-rice`) separates into ingredient chips → cost/macro badges → pantry-vs-grocery → reassembles into a "Start AI Chef" CTA. Heavily coupled to **`motion/react` (Framer Motion)** v12: `useScroll({target,offset})`, `useTransform`, `useReducedMotion`, `MotionValue`. Uses a 320vh tall section with a `sticky top-0 h-screen` pinned scene; all keyframe offsets clamped to `[0,1]`.
- Pulls live data: `RECIPE_MAP.get("egg-fried-rice")`, `calculateCostPerServing`, `bestEffortNutrition(recipe).estimate` (fallback `{cps:1.84, calories:480, protein:22}`).
- Provides `StaticFallback` for SSR/first-paint/reduced-motion.
- Tone palettes are inline hex (BASIL/BUTTER/CARROT/GRAPE/PINK/TEAL) matching Pantry Pop accents.
**RN rebuild:** `motion/react` + scroll-pin + `sticky` + `100vh`/`320vh` units do **not** exist in RN. Reimplement with `react-native-reanimated` `useScrollViewOffset` / `useAnimatedScrollHandler` + `interpolate`, or ship the static fallback layout as the mobile hero (recommended for v1). `useReducedMotion` → `AccessibilityInfo`.

### 5.2 `PantryToRecipePreview.tsx`
Exports `PantryToRecipePreview()`. Compact "3 pantry chips → arrow → real recipe card" using `motion/react` entrance animations (`initial/animate/transition`). Live numbers from `RECIPE_MAP.get("egg-fried-rice")`. `next/link` to `/recipes/{id}?from=home`.
**RN rebuild:** simple Reanimated/Moti entrance (`FadeInUp` staggered). Replace `next/link`, inline Tailwind hex chips, `supports-[backdrop-filter]` blur (→ `expo-blur` `BlurView` or solid bg).

---

## 6. Recipe Studio — create / edit flow

### 6.1 `src/app/recipe-studio/page.tsx` (hub) — **rebuild UI, reuse storage**
`"use client"`. Default export `RecipeStudioPage()`. Loads custom recipes on mount (`getCustomRecipes()` in `useEffect`), splits into `isAIGenerated` vs user-created, renders two link cards (`/ai-chef`, `/recipe-studio/new`) + two grids of `RecipeMiniCard`. Delete via `ConfirmDialog` → `deleteCustomRecipe(id)` + toast.
- `RecipeMiniCard` resolves image: `recipe.image?.src ?? imageDataUrl(getStoredRecipeImage(id).b64)` else `ChefHat` placeholder; links to `/recipes/custom?id={id}`; shows `$X.XX/serving · N min`.
- Next couplings: `next/link`, `ScrollReveal` (motion), `<img>`, `useToast`, lucide. RN: Expo Router, FlatList, `<Image>`, native toast.

### 6.2 `src/app/recipe-studio/new/page.tsx` (builder) — **rebuild form, reuse save logic** (the most important flow)
`"use client"`. Default export `ManualRecipeBuilderPage()`.
- Local form types:
  ```ts
  interface IngredientRow { name; quantity:number; unit:string; estimatedCost:number; optional:boolean; userAlreadyHas:boolean; }
  interface StepRow { instruction:string; timerMinutes?:number; }
  ```
- `EQUIPMENT_OPTS = ["microwave","stovetop","oven","rice-cooker","air-fryer","no-kitchen"]`.
- `coerceNumberInput(raw, fallback, min=0)` — guards NaN to keep `.toFixed()` from crashing.
- Live totals: `totalCost = Σ(non-optional estimatedCost)`, `costPerServing = totalCost / max(1, servings)`.
- **Save flow (`save()`):** validate name/≥1 ingredient/≥1 step → `makeCustomRecipeId(name,"user")` → build `UserCreatedRecipe` (id, mealType, servings, prep/cook/total time, difficulty, equipment, derived `primaryCookingMethod`, `noStovetopRequired`, cost fields, ingredients, steps as `string[]`, tags split on commas, notes, `image: fallbackImageMeta()`, ISO `createdAt/updatedAt`, `isAIGenerated:false`, `isUserCreated:true`) → `saveCustomRecipe(recipe)`.
- **Auto-image:** if `autoImage && isWorkerConfigured()` → `await generateRecipeImage({ recipeName, ingredients:first8, method })`. On `b64_json` → `storeRecipeImage(id,b64,{prompt,model})`; if stored OK re-save recipe with a `data:` `image.src` (else toast "cache full"). On `url` → re-save with remote `image.src`. Errors are non-fatal. Then `router.push(`/recipes/custom?id=${id}`)`.
**Browser/Next couplings:** `useRouter` (`next/navigation`), `next/link`, `Button`/`Card`/`PageHeader`/`Toast` primitives, native `<input type="number/checkbox">`/`<select>`/`<textarea>`, lucide icons. **RN rebuild:** Expo Router `useRouter`, `TextInput`(numeric keyboards), `Switch`, a Picker for select, native toast. The save/image orchestration is portable (uses worker client + storage).

---

## 7. Data shapes (copy these interfaces verbatim into the shared pkg)

### 7.1 Custom recipes — `src/lib/customRecipeTypes.ts` (pure, **moves unchanged**)
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
export interface CustomRecipeStep {
  title?: string; instruction: string; timerMinutes?: number | null; safetyNote?: string | null;
}
export interface BaseCustomRecipe {
  id: string; name: string; description: string;
  mealType: "breakfast"|"lunch"|"dinner"|"snack"|"meal-prep";
  cuisineStyle?: string; servings: number;
  prepTimeMinutes: number; cookTimeMinutes: number; totalTimeMinutes: number;
  difficulty: "very easy"|"easy"|"medium";
  equipment: string[]; primaryCookingMethod: string; noStovetopRequired: boolean;
  estimatedTotalCost: number; estimatedCostPerServing: number;
  ingredients: CustomRecipeIngredient[];
  steps: string[]; guidedCookingSteps?: CustomRecipeStep[];
  cheapTips?: string[];
  substitutions?: Array<{ original:string; swap:string; why?:string; estimatedSavings?:number|null }>;
  makeItCheaper?: string[]; makeItHealthier?: string[]; makeItHigherProtein?: string[];
  studentTips?: string[]; storageInstructions?: string; reheatingInstructions?: string;
  safetyNotes?: string[];
  estimatedNutrition?: { calories:number; protein:number; carbs:number; fat:number; fiber?:number };
  tags?: string[]; image: CustomRecipeImage; createdAt: string; updatedAt: string;
}
export interface AIGeneratedRecipe extends BaseCustomRecipe {
  isAIGenerated: true; isUserCreated: false;
  userRequestSummary?: string; whyThisFits?: string;
  missingIngredients?: Array<{ name:string; estimatedCost:number;
    importance:"required"|"recommended"|"optional"; cheapSubstitute?:string|null }>;
  estimatedMissingIngredientCost?: number;
}
export interface UserCreatedRecipe extends BaseCustomRecipe {
  isAIGenerated: false; isUserCreated: true; notes?: string;
}
export type CustomRecipe = AIGeneratedRecipe | UserCreatedRecipe;
export function isAIGenerated(r: CustomRecipe): r is AIGeneratedRecipe; // r.isAIGenerated === true
```

### 7.2 Core seed types — `src/lib/types.ts` (subset the chatbot/search consume)
```ts
export type Equipment = "microwave"|"stovetop"|"oven"|"rice-cooker"|"air-fryer"|"no-kitchen";
export type DietTag = "vegetarian"|"vegan"|"high-protein"|"gluten-free"|"dairy-free";
export type MealType = "breakfast"|"lunch"|"dinner"|"snack"|"meal-prep";
export interface RecipeIngredient { ingredientId: string; quantity: number; optional?: boolean; note?: string; }
export interface NutritionEstimate { calories:number; protein:number; carbs:number; fat:number; fiber?:number; }
export interface PantryItem  { ingredientId: string; quantity?: number; useSoon?: boolean; }
export interface GroceryItem { ingredientId: string; quantity: number; recipeIds: string[]; checked: boolean; }
// Recipe (canonical seed shape) — large; key fields read by these features:
//   id, name, description, mealType, servings, ingredients[], steps[], totalTimeMinutes,
//   difficulty, equipment[], dietTags[], estimatedNutrition, emoji, accentColor, cuisine?, tags?
//   (+ many optional extended fields). Use the full def from src/lib/types.ts.
```

---

## 8. localStorage keys (all touched by this subsystem)

> CLAUDE.md §14: **never rename the `srf:` prefix** — renaming silently wipes users. In RN, mirror these exact keys in AsyncStorage so a future web↔native sync/migration stays trivial.

| Key | Written by | Value shape |
| --- | --- | --- |
| `srf:haptics-enabled` | `haptics.ts` | raw `"true"`/`"false"` (absent ⇒ enabled) |
| `srf:recent-searches` | `recentSearches.ts` | `JSON` `string[]` (max 8, newest first) |
| `srf:custom-recipes` | `customRecipeStorage.ts` | `JSON` `CustomRecipe[]` |
| `srf:custom-recipe-images` | `customRecipeStorage.ts` | `JSON` `Record<recipeId, StoredImage>` (see below); caps: 1.5MB/img, 6MB total, LRU evict by `storedAt` |
| `srf:custom-ingredients` | read by `AppStore.ingredientName` | `JSON` `Array<{id; displayName?; canonicalName?}>` |
| `srf:pantry` | `storage.ts` | `JSON` `PantryItem[]` |
| `srf:grocery` | `storage.ts` | `JSON` `GroceryItem[]` |
| `srf:saved` | `storage.ts` | `JSON` `string[]` (recipe IDs) |

`StoredImage` (internal to `customRecipeStorage.ts`):
```ts
interface StoredImage { id: string; b64: string; prompt?: string; model?: string; storedAt: string; bytes: number; }
```

### 8.1 `customRecipeStorage.ts` exports (logic portable; storage adapter needed)
```ts
function makeCustomRecipeId(name: string, prefix: "gen"|"user"): string
function getCustomRecipes(): CustomRecipe[]
function getCustomRecipe(id: string): CustomRecipe | undefined
function saveCustomRecipe(r: CustomRecipe): CustomRecipe          // upsert by id
function deleteCustomRecipe(id: string): void                     // + deletes its image
function storeRecipeImage(recipeId, b64, meta?:{prompt?;model?}): { ok: boolean; reason?: string }
function getStoredRecipeImage(id: string): StoredImage | undefined
function deleteRecipeImage(id: string): void
function imageDataUrl(b64: string, mediaType="image/png"): string // `data:${type};base64,${b64}`
function fallbackImageMeta(): CustomRecipeImage
function emptyUserRecipe(): UserCreatedRecipe
function isAIRecipe(r: CustomRecipe): r is AIGeneratedRecipe
```
- **Browser coupling:** all reads/writes via `window.localStorage` (SSR-guarded), `JSON.parse/stringify`, `Math.random().toString(36)` ids.
- **RN adapt:** the recipe JSON list → AsyncStorage (sync API becomes async — wrap with a hydrated in-memory cache or refactor callers to async). **Base64 images should NOT live in AsyncStorage** (slow, size limits) — store image bytes via `expo-file-system` and keep only the file URI in the recipe; replace `imageDataUrl` data-URLs with `file://` URIs. Keep the LRU/byte-cap eviction concept against the FileSystem cache.

### 8.2 `AppStore.tsx` (chatbot's data source) — **rebuild as RN Context provider**
React Context. Exports `AppStoreProvider`, `useAppStore(): AppStoreValue`, `ingredientName(id)`, `recipeName(id)`.
`AppStoreValue` = `{ hydrated, pantry, addPantryItem, removePantryItem, togglePantryUseSoon, clearPantry, grocery, addGroceryItems, addStapleToGrocery, toggleGroceryChecked, removeGroceryItem, clearGrocery, saved:string[], isSaved, toggleSaved }`. Hydrates from `storage.ts` (the `srf:pantry/grocery/saved` keys) on mount, persists on change.
- The Context/reducer logic is portable; only `storage.ts` needs the AsyncStorage adapter. CLAUDE.md §14: `AppStoreProvider` must wrap `ToastProvider`.

---

## 9. Network / request-response contracts (Cloudflare Worker via `workerClient.ts`)

`src/lib/workerClient.ts` — **interfaces move to shared pkg; the fetch transport works in RN unchanged** (uses standard `fetch` + `AbortController`, both available in React Native).

- **Base URL:** `process.env.NEXT_PUBLIC_WORKER_URL` (trailing slash stripped). `isWorkerConfigured()` = URL non-empty; `workerUrl()` returns it.
  - **RN env coupling:** `process.env.NEXT_PUBLIC_*` does not exist in Expo. Use `expo-constants` / `app.config` `extra`, or `EXPO_PUBLIC_WORKER_URL`. Likewise `NEXT_PUBLIC_ANTHROPIC_API_KEY` (used by `anthropic.ts`, read at module load).
- **Transport (`postJson<T>(path, body)`):** `POST {WORKER_URL}{path}`, `Content-Type: application/json`, `body: JSON.stringify(body)`, 60s `AbortController` timeout. Throws friendly errors: missing URL, AbortError → "AI request timed out", 429 → "rate-limited", other → `AI request failed (status): detail`.

**Endpoints used by THIS subsystem** (the only one the studio builder calls is `/generate-recipe-image`; the rest are catalogued for completeness):

| Function | Method/Path | Request body | Response |
| --- | --- | --- | --- |
| `generateRecipeImage(opts)` | `POST /generate-recipe-image` | `{ recipeName?; prompt?; ingredients?:string[]; method? }` | `GenerateImageResult` `{ b64_json?:string; url?:string; prompt:string; model:string }` |
| `generateRecipe(input)` | `POST /generate-recipe` | `GenerateRecipeInput` | `GeneratedRecipe` |
| `generateRecipeOptions(input)` | `POST /generate-recipe-options` | `GenerateOptionsInput` | `GeneratedRecipeOptionSet` `{ mainOptionId; options:GeneratedRecipeOption[] }` |
| `resolveIngredients(rawInput,inputSource?)` | `POST /ingredients/resolve` | `{ rawInput; inputSource:"typed"|"voice"|"pasted"|"manual" }` | `ResolveResult` |
| `enrichIngredient(name)` | `POST /ingredients/enrich` | `{ name }` | `EnrichResult` |
| `matchIngredient(pantry,required)` | `POST /ingredients/match` | `{ pantry; required }` | `MatchResult` |
| `importRecipeUrl(opts)` | `POST /recipes/import-url` | `{ url; ingredients?; budgetPerServing?; equipment?; dietTags?; servings? }` | `ImportRecipeResult` |
| `importRecipeText(opts)` | `POST /recipes/import-text` | `{ text; sourceUrl?; sourcePlatform?; creatorName?; ... }` | `ImportRecipeResult` |
| `webSearchRecipes(opts)` | `POST /recipes/web-search` | `{ ingredients?; cravings?; equipment?; dietTags?; budgetPerServing?; maxResults? }` | `{ candidates: WebRecipeCandidate[] }` |
| `estimateIngredientPrice(opts)` | `POST /pricing/estimate-ingredient` | `{ ingredientName; recipeQuantity?; recipeUnit?; location?; preferBudgetStores? }` | `EstimateIngredientResult` |
| `remixRecipe(opts)` | `POST /recipes/remix` | `{ baseRecipe; userRequest; ... }` | `GeneratedRecipe` |

Key response interfaces (image flow uses only the first):
```ts
interface GenerateImageResult { b64_json?: string; url?: string; prompt: string; model: string; }
interface GeneratedRecipe { name; description; userRequestSummary; whyThisFits;
  mealType:"breakfast"|"lunch"|"dinner"|"snack"|"meal-prep"; cuisineStyle; servings;
  prepTimeMinutes; cookTimeMinutes; totalTimeMinutes; difficulty:"very easy"|"easy"|"medium";
  equipment:string[]; primaryCookingMethod; noStovetopRequired;
  estimatedTotalCost; estimatedCostPerServing; estimatedMissingIngredientCost;
  ingredients:Array<{name;quantity;unit;estimatedCost;userAlreadyHas;optional;category}>;
  missingIngredients:Array<{name;estimatedCost;importance:"required"|"recommended"|"optional";cheapSubstitute?:string|null}>;
  steps:string[]; guidedCookingSteps:Array<{title;instruction;timerMinutes?:number|null;safetyNote?:string|null}>;
  cheapTips:string[]; substitutions:Array<{original;swap;why;estimatedSavings?:number|null}>;
  makeItCheaper:string[]; makeItHealthier:string[]; makeItHigherProtein:string[];
  pantryStaplesUsed:string[]; optionalAddIns:string[]; studentTips:string[];
  storageInstructions; reheatingInstructions; safetyNotes:string[];
  estimatedNutrition:{calories;protein;carbs;fat;fiber}; tags:string[]; imagePromptHint?; }
```
(Full `GenerateRecipeInput`, `GenerateOptionsInput`, `ResolveResult`, `EnrichResult`, `MatchResult`, `RecipeSourceMetadata`, `AIGroceryPriceEstimate`, etc. are defined verbatim in `workerClient.ts` — copy as-is.)

> The image flow in the studio also handles a **fetch+blob equivalent**: it receives base64 (`b64_json`) and builds a `data:` URL. On RN, prefer writing the base64 to `expo-file-system` and using the file URI (don't keep huge data-URLs in JS state).

---

## 10. Browser / Next-only couplings — consolidated checklist

| Coupling | Where | RN adaptation |
| --- | --- | --- |
| `'use client'` | all components + several libs | drop (no-op in RN) |
| `window` / `typeof window` guards | haptics, storages, AppStore | remove SSR guards; gate on platform if needed |
| `localStorage` (sync) | haptics, recentSearches, customRecipeStorage, storage | AsyncStorage (async) + boot-hydrated sync cache, OR refactor callers |
| `navigator.vibrate` | haptics | `expo-haptics` |
| `process.env.NEXT_PUBLIC_*` | workerClient (`WORKER_URL`), anthropic (`API_KEY`) | `EXPO_PUBLIC_*` / `expo-constants` |
| `fetch` + `AbortController` | workerClient | works as-is in RN |
| base64 → `data:` URL images | customRecipeStorage, studio save | `expo-file-system` URIs |
| `next/link`, `next/navigation` `useRouter` | studio pages, zero-state, previews, chatbot cards | Expo Router `Link` / `useRouter` |
| `<img>` / `next/image` | studio mini cards | RN `<Image>` |
| native `<input>/<select>/<textarea>/<checkbox>` | studio builder, search, chat | `TextInput`/`Switch`/Picker |
| `document.addEventListener` (focusin/out, keydown, mousedown) | Chatbot, SmartRecipeSearch | `Keyboard` listeners, tap-outside overlay, hardware back |
| `useId`, ARIA roles (`combobox/listbox/option`, `aria-*`) | SmartRecipeSearch | RN accessibility props |
| `<mark>` DOM element | HighlightedMatch | styled `<Text>` |
| `motion/react` (Framer) scroll-pin, `useScroll/useTransform`, `sticky top-0`, `vh` | home heroes, `ScrollReveal` | `react-native-reanimated` (or ship static fallback) |
| CSS `@keyframes`, Tailwind classes, `clsx` | everywhere | NativeWind / StyleSheet + Reanimated |
| `prefers-reduced-motion` / `useReducedMotion` | heroes, globals.css | `AccessibilityInfo.isReduceMotionEnabled()` |
| `env(safe-area-inset-bottom)`, `.app-main` padding | globals.css, Chatbot | `react-native-safe-area-context` |
| `backdrop-blur` / `supports-[backdrop-filter]` | PantryToRecipePreview, Pesto panel | `expo-blur` `BlurView` or solid bg |
| lucide-react icons | all | `lucide-react-native` / `@expo/vector-icons` |

---

## 11. RN port plan (by package boundary)

**`@waivy/shared` (pure TS, move unchanged):**
- `lib/design/tokens.ts` (add a `TONE_HEX` resolver for `CATEGORY_COLOR` tailwind names).
- `lib/search/searchNormalization.ts`, `fuzzyMatch.ts`, `recipeSearch.ts`.
- `lib/chatbot.ts` (+ its data/scoring deps `data/recipes`, `data/ingredients`, `lib/recipeScoring`, `lib/nutritionEngine`, `lib/types`).
- Type files: `lib/customRecipeTypes.ts`, the search/worker interfaces from `workerClient.ts`, relevant parts of `lib/types.ts`.
- `lib/recentSearches.ts` and `lib/customRecipeStorage.ts` **logic** behind a small storage interface (`get/set/remove`), so the platform injects localStorage (web) or AsyncStorage+FileSystem (native).

**Thin platform adapters (one impl per platform):**
- Storage adapter (localStorage ↔ AsyncStorage; image bytes ↔ FileSystem).
- Haptics adapter (Vibration API ↔ expo-haptics) — keep the 6 exported function names/signatures.
- Env adapter (`NEXT_PUBLIC_*` ↔ `EXPO_PUBLIC_*`/Constants) feeding `workerUrl()` and the Anthropic key.
- Network: keep `postJson`/`workerClient` transport (fetch works); just feed it the platform base URL.

**Rebuild natively (UI):**
- `SmartRecipeSearch`, `SearchZeroState`, `HighlightedMatch` (RN views; reuse all search logic).
- `Chatbot` (Pesto) — overlay button + bottom-sheet panel + `FlatList` + `KeyboardAvoidingView`; **preserve hide-while-keyboard-open** behavior; reuse `chatRespond`.
- Recipe Studio hub + builder forms (`TextInput`/Switch/Picker); reuse `save()` orchestration, `customRecipeStorage`, `generateRecipeImage`.
- `ThreeDButton`/`ThreeDLink` — `Pressable` + Reanimated press (shadow View + translateY); reuse FACE/RING/SIZE token tables; wire `hapticLight`.
- Home heroes — start with `StaticFallback` layout; optionally add Reanimated scroll interpolation later.
- Re-express `globals.css` keyframes as Reanimated animations; tokens come from `tokens.ts`.

**Build order suggestion:** tokens + types → storage/haptics/env adapters → search logic + UI → ThreeDButton → Recipe Studio builder (uses storage + worker image) → Chatbot → home heroes.
