# Subsystem Brief: Cloudflare Worker Backend

**Source files**
- `worker/src/index.ts` (1599 lines) — the entire Worker; single-file, no framework.
- `worker/wrangler.toml` — config + model `[vars]`.
- `worker/package.json` — deps/scripts.
- `worker/README.md` — deploy + model docs.

**Frontend consumer**: `src/lib/workerClient.ts` (calls these endpoints; documents the real client-side request/response TS shapes).

---

## 0. What this is

A single Cloudflare Worker (`waivy-api`) that proxies OpenAI so `OPENAI_API_KEY` never reaches the browser. It is a **plain `export default { fetch }` module Worker** — NOT Hono (the root CLAUDE.md says "Hono + OpenAI" but the actual code is a hand-rolled `switch` router; trust the code). The frontend is a static export (GitHub Pages) and calls these endpoints cross-origin with CORS.

Base URL is injected at frontend build time via `NEXT_PUBLIC_WORKER_URL` (e.g. `https://waivy-api.<subdomain>.workers.dev`). Local dev worker: `http://localhost:8787`.

**This is where mobile sync endpoints will be added.** Routing + CORS patterns to copy are in Section 6.

---

## 1. Environment variables (the `Env` interface)

```ts
interface Env {
  OPENAI_API_KEY: string;          // SECRET (wrangler secret put). Required.
  ALLOWED_ORIGIN?: string;         // SECRET. If set, locks CORS to this origin; else reflects request Origin.
  // Per-task model overrides — each falls back to DEFAULT_TEXT_MODEL, then a hardcoded default.
  DEFAULT_TEXT_MODEL?: string;     // [vars], blanket text fallback
  DEFAULT_IMAGE_MODEL?: string;    // [vars], primary image model
  IMAGE_MODEL_FALLBACK?: string;   // [vars], image fallback on 401/403/404
  RECIPE_MODEL?: string;
  RECIPE_HIGH_QUALITY_MODEL?: string;
  LIGHTWEIGHT_MODEL?: string;
  PRICING_MODEL?: string;
  INGREDIENT_MODEL?: string;
  WEB_RECIPE_MODEL?: string;
}
```

`OPENAI_API_KEY` and `ALLOWED_ORIGIN` are **Worker secrets** (`wrangler secret put`). All model vars are plain `[vars]` in `wrangler.toml`, all optional.

### Hardcoded model defaults (in code, `index.ts`)
```ts
const TEXT_MODEL_DEFAULT          = "gpt-5-nano";
const TEXT_HIGH_QUALITY_DEFAULT   = "gpt-5-nano";
const IMAGE_MODEL_DEFAULT         = "dall-e-3";
const IMAGE_MODEL_FALLBACK_DEFAULT= "gpt-image-1";
```
**But `wrangler.toml` overrides nearly all of these in `[vars]`** (this is what actually ships):
```toml
DEFAULT_TEXT_MODEL = "gpt-4o-mini"   RECIPE_MODEL = "gpt-4o-mini"
RECIPE_HIGH_QUALITY_MODEL = "gpt-4o-mini"   LIGHTWEIGHT_MODEL = "gpt-4o-mini"
PRICING_MODEL = "gpt-4o-mini"   INGREDIENT_MODEL = "gpt-4o-mini"
WEB_RECIPE_MODEL = "gpt-4o-mini"
DEFAULT_IMAGE_MODEL = "gpt-image-1"   IMAGE_MODEL_FALLBACK = "dall-e-2"
```
Net effect in prod: **all text tasks → `gpt-4o-mini`; images → `gpt-image-1` primary, `dall-e-2` fallback.** (README header table lists different values; the `[vars]` block is authoritative. gpt-5-nano was rejected for adding ~25s reasoning latency and breaking the strict ingredient JSON shape.)

`wrangler.toml` other config: `name="waivy-api"`, `main="src/index.ts"`, `compatibility_date="2025-05-01"`, `compatibility_flags=["nodejs_compat"]`.

`package.json`: scripts `dev`=`wrangler dev`, `deploy`=`wrangler deploy`; devDeps `@cloudflare/workers-types`, `typescript ^5.4`, `wrangler ^4.95`.

---

## 2. Internal helpers (exported only as `default { fetch }`; these are module-private)

- `type ModelTask = "recipe" | "recipeHighQuality" | "lightweight" | "pricing" | "ingredient" | "webRecipe"`
- `modelFor(env, task): string` — task → env override → `DEFAULT_TEXT_MODEL` → hardcoded default.
- `imageModelFor(env): { primary: string; fallback: string }`
- `corsHeaders(env, origin): HeadersInit` — see Section 6.
- `jsonResponse(body, status, env, origin): Response` — JSON + CORS, one-stop responder.
- `openaiChatJson(opts): Promise<unknown>` — Chat Completions wrapper (Section 3).
- `openaiImage(env, prompt, size): Promise<ImageResult>` — Images API + fallback (Section 4).
- `openaiResponsesWithWebSearch(opts): Promise<unknown>` — Responses API + `web_search` tool (Section 5).
- HTML/JSON-LD parse helpers for URL import: `extractJsonLd`, `pickImage`, `pickAuthor`, `pickSteps`, `isoDurationToMinutes`, `interface JsonLdRecipe`.
- `buildRecipeUserPrompt`, `buildOptionsUserPrompt`, `buildSearchQuery`, `buildImagePrompt` — prompt builders.

### `openaiChatJson` options
```ts
opts: {
  env: Env; system: string; user: string;
  schema?: Record<string, unknown>;   // accepted but unused
  maxTokens?: number;                  // default 1200
  temperature?: number;                // default 0.4 (ignored for GPT-5)
  model?: string;                      // explicit override
  task?: ModelTask;                    // default "recipe"
}
```

---

## 3. OpenAI Chat Completions wrapper — `openaiChatJson`

- **Endpoint**: `POST https://api.openai.com/v1/chat/completions`
- **Auth**: `Authorization: Bearer ${OPENAI_API_KEY}`
- **Always** `response_format: { type: "json_object" }`, with system+user messages.
- **GPT-5 family handling** (`/^gpt-5/`): uses `max_completion_tokens` (not `max_tokens`), `reasoning_effort: "minimal"`, no temperature; and pads token cap to `max(requested*3, 4000)` because reasoning tokens otherwise eat the budget and return empty content.
- **Non-GPT-5** (e.g. gpt-4o-mini, the prod default): `max_tokens` + `temperature`.
- Parses `choices[0].message.content` as JSON; throws on empty content (logs finish_reason/refusal/reasoning_tokens) or non-JSON.
- Per-call log line: `[ai] chat task=… model=… max_tokens=…`.

---

## 4. OpenAI Images wrapper — `openaiImage` (MOBILE FAST PATH)

- **Endpoint**: `POST https://api.openai.com/v1/images/generations`
- **Body**: `{ model, prompt, n: 1, size }`. `size` ∈ `"1024x1024" | "1024x1536" | "1536x1024"`, default `"1024x1024"`.
- **Quality**: only when model starts with `gpt-image-`, adds `quality: "low"` (~$0.011/img vs ~$0.042 medium / ~$0.167 high — deliberate cheap path for thumbnails). `dall-e-*` reject `quality`, so it is omitted for them.
- **Return type**:
  ```ts
  interface ImageResult { b64_json?: string; url?: string; model: string; }
  ```
  `gpt-image-1` returns `b64_json`; `dall-e-3` returns `url`. **Both response fields are surfaced** to clients, so the consumer must handle either.
- **Fallback logic**: tries `primary` (prod `gpt-image-1`); on `401/403/404` or message matching `verified|verification|access|permission|must be|does not exist|invalid_value|unknown model|not found`, auto-retries with `fallback` (prod `dall-e-2`). One retry only.
- **Mobile note**: `b64_json` is a large base64 blob in JSON — heavy on RN. Prefer requesting a model/path that returns a `url` (dall-e-3), or have mobile add a future endpoint that uploads to R2/CDN and returns a URL. For a fast path, keep `quality:"low"` + `1024x1024`.

`buildImagePrompt(name, ingredients, method)` composes a "realistic homemade food photography… no text/logo/people" prompt with method-specific hints (air-fryer/microwave/other) and first 6 ingredients.

---

## 5. OpenAI Responses + web_search wrapper — `openaiResponsesWithWebSearch`

- **Endpoint**: `POST https://api.openai.com/v1/responses`
- **Body**: `{ model, input: [system,user msgs], tools: [{ type: "web_search" }], max_output_tokens }` (default 2000).
- Extracts text from `output_text` or walks `output[].content[]` for `type==="output_text"`. Then slices first `{`…last `}` and `JSON.parse`s (model may wrap in prose).
- Used by `/recipes/web-search` (task `webRecipe`) and `/pricing/estimate-ingredient` (task `pricing`).

---

## 6. Routing & CORS (COPY THIS PATTERN for new sync routes)

**Entry**: `export default { async fetch(req: Request, env: Env): Promise<Response> }`.

Flow inside `fetch`:
1. `const url = new URL(req.url); const origin = req.headers.get("Origin");`
2. `OPTIONS` → `204` with `corsHeaders(env, origin)` (preflight).
3. `GET /diagnostics` → model report (no key leak).
4. `GET /health` → `{ ok: true }`.
5. Any non-`POST` past here → `405 { error: "Method not allowed" }`.
6. `switch (url.pathname)` over the POST routes (Section 7); `default` → `404 { error: "Not found" }`.

**CORS** (`corsHeaders`):
```ts
const allow = env.ALLOWED_ORIGIN || origin || "*";
{
  "Access-Control-Allow-Origin": allow,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
}
```
Notes for adding sync routes:
- Add a `case "/sync/…": return handleX(req, env);` in the `switch`. New routes are POST by default.
- If you need new request headers (e.g. `Authorization` for a user/device token), **add them to `Access-Control-Allow-Headers`** — currently only `Content-Type` is allowed, so any auth header will be blocked by CORS until added.
- Every handler: read `origin` first, `try { body = await req.json() } catch { return jsonResponse({error:"Invalid JSON"},400,env,origin) }`, then respond via `jsonResponse(...)`. Errors → `{ error: string }` with 400/404/405/500/502.
- **RN native HTTP has no CORS** — CORS is irrelevant to the iPhone client, but keep it (the web app still needs it). Mobile can call all routes directly. Mobile should NOT send an `Origin` header expectation.

---

## 7. EVERY endpoint

CORS-error shape everywhere: `{ "error": string }` with appropriate status. All 11 POST handlers `await req.json()` and 400 on invalid JSON.

### `GET /health`
Response `200`: `{ "ok": true }`. No OpenAI.

### `GET /diagnostics`
Response `200`:
```ts
{
  hasApiKey: boolean;
  models: { recipe, recipeHighQuality, lightweight, pricing, ingredient, webRecipe, image, imageFallback: string };
  envOverrides: { DEFAULT_TEXT_MODEL, DEFAULT_IMAGE_MODEL, IMAGE_MODEL_FALLBACK, RECIPE_MODEL, RECIPE_HIGH_QUALITY_MODEL, LIGHTWEIGHT_MODEL, PRICING_MODEL, INGREDIENT_MODEL, WEB_RECIPE_MODEL: boolean };
  warnings: string[];
  note: string;
}
```
No key exposed. No OpenAI call.

### `POST /ingredients/resolve` — parse phrase → structured ingredients
- **Model/feature**: Chat Completions, task `ingredient` (prod `gpt-4o-mini`), `maxTokens 1500`, `temp 0.1`, `json_object`.
- **Request**: `{ rawInput?: string; inputSource?: string }`. Empty `rawInput` → `200` `{ ingredients:[], ignoredText:[], clarificationNeeded:false }`. `>2000` chars → `400`.
- **Response `200`** (model JSON; coerced client-side):
```ts
{
  ingredients: Array<{
    canonicalName: string; displayName: string; originalText: string;
    aliases: string[];
    category: "grains-and-starches"|"pasta-and-noodles"|"beans-and-lentils"|"canned-goods"|"frozen"|"fresh-vegetables"|"fruit"|"eggs-and-dairy"|"meat-and-seafood"|"tofu-and-plant-protein"|"condiments-and-sauces"|"spices"|"bread-and-tortillas"|"snacks"|"beverages"|"baking"|"other";
    ingredientRole: "main"|"protein"|"carb"|"vegetable"|"fruit"|"fat"|"seasoning"|"sauce"|"acid"|"sweetener"|"binder"|"liquid"|"other";
    storageType: "pantry"|"fridge"|"freezer"|"unknown";
    shelfLifeDays: number|null; estimatedUnitCost: number|null; unit: string;
    dietaryTags: string[]; allergyTags: string[]; confidence: number; notes?: string; useSoon: boolean;
  }>;
  ignoredText: string[];
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
}
```

### `POST /ingredients/enrich` — classify one custom ingredient
- **Model**: Chat, task `ingredient`, `maxTokens 600`, `temp 0.2`.
- **Request**: `{ name?: string }` (missing → `400`).
- **Response `200`**:
```ts
{
  canonicalName: string; category: string /*same enum*/; aliases: string[];
  estimatedUnitCost: number|null; unit: string; commonPackageSize: string|null;
  storageType: "pantry"|"fridge"|"freezer"|"unknown"; shelfLifeDays: number|null;
  ingredientRole: string; dietaryTags: string[]; allergyTags: string[];
  substitutes: string[]; recipeUseCases: string[]; isPantryStaple: boolean;
}
```

### `POST /ingredients/match` — pantry item ↔ recipe requirement
- **Model**: Chat, task `ingredient`, `maxTokens 200`, `temp 0.1`.
- **Request**: `{ pantry?: string; required?: string }` (either missing → `400`).
- **Response `200`**:
```ts
{ isMatch: boolean; matchType: "exact"|"alias"|"fuzzy"|"semantic"|"category"|"substitute"|"none"; confidence: number; explanation: string; }
```

### `POST /generate-recipe` — single AI Chef recipe
- **Model**: Chat, task `recipe` (prod `gpt-4o-mini`), `maxTokens 3000`, `temp 0.6`.
- **Request** (all optional; built into a prompt by `buildRecipeUserPrompt`):
```ts
{ ingredients?: string[]; budgetPerServing?: number; servings?: number;
  equipment?: string[]; timeLimit?: string; dietTags?: string[]; mealType?: string;
  cravings?: string; creativity?: string; refinement?: string; }
```
- **Response `200`** = the full recipe schema (model JSON). Key fields (exact field names — the UI depends on numeric `quantity` + separate `unit` + numeric `estimatedCost`):
```ts
{
  name: string; description: string; userRequestSummary: string; whyThisFits: string;
  mealType: "breakfast"|"lunch"|"dinner"|"snack"|"meal-prep"; cuisineStyle: string;
  servings: number; prepTimeMinutes: number; cookTimeMinutes: number; totalTimeMinutes: number;
  difficulty: "very easy"|"easy"|"medium";
  equipment: Array<"microwave"|"air-fryer"|"stovetop"|"oven"|"rice-cooker">;
  primaryCookingMethod: "microwave"|"air-fryer"|"stovetop"|"oven"|"rice-cooker"|"no-cook"|"mixed";
  noStovetopRequired: boolean;
  estimatedTotalCost: number; estimatedCostPerServing: number; estimatedMissingIngredientCost: number;
  ingredients: Array<{ name: string; quantity: number; unit: string; estimatedCost: number; userAlreadyHas: boolean; optional: boolean; category: string; }>;
  missingIngredients: Array<{ name: string; estimatedCost: number; importance: "required"|"recommended"|"optional"; cheapSubstitute: string|null; }>;
  steps: string[]; cheapTips: string[];
  substitutions: Array<{ original: string; swap: string; why: string; estimatedSavings: number|null; }>;
  makeItCheaper: string[]; studentTips: string[]; storageInstructions: string; reheatingInstructions: string;
  safetyNotes: string[];
  estimatedNutrition: { calories: number; protein: number; carbs: number; fat: number; fiber: number; };
  tags: string[];
  flavorBadges: Array<"spicy"|"tangy"|"umami"|"garlicky"|"smoky"|"savory"|"creamy"|"crispy">;
  imagePromptHint: string;
}
```

### `POST /generate-recipe-options` — 1 main + 3 alternates
- **Model**: **4 PARALLEL** Chat calls (`Promise.all`), task `recipe`, each `maxTokens 1500`, `temp 0.6`, using `RECIPE_SYSTEM` with a per-role hint. Roles: `best-match`/`cheapest`/`fastest`/`wildcard` (ids `opt-1..opt-4`). Parallel = wall time of slowest call (~8–12s) not sum.
- **Request**: superset of `/generate-recipe` (built by `buildOptionsUserPrompt`):
```ts
{ pantryIngredients?: string[]; ingredients?: string[]; selectedPantryIngredientIds?: string[];
  aiNotes?: string; cravingText?: string; budgetPerServing?: number; servings?: number;
  equipment?: string[]; dietTags?: string[]; creativityLevel?: string;
  appendToExisting?: boolean; previousOptions?: Array<{ recipe?: { name?: string } }>; }
```
- **Response `200`**:
```ts
{
  mainOptionId: string; // e.g. "opt-1"
  options: Array<{
    id: string; optionLabel: "best-match"|"cheapest"|"fastest"|"wildcard"|string;
    shortReason: string; pantryMatchScore: number; selectedByDefault: boolean;
    notesInfluenceSummary: string;
    recipe: <full recipe schema as above>; // each option holds a complete recipe object
  }>;
}
```
Failed sub-calls are dropped; if all fail → `500`. Exactly one `selectedByDefault:true` guaranteed.

### `POST /generate-recipe-image` — recipe thumbnail (MOBILE FAST PATH)
- **Model/feature**: Images API via `openaiImage`, size `"1024x1024"`, prod primary `gpt-image-1` (`quality:"low"`), fallback `dall-e-2`.
- **Request**: `{ recipeName?: string; prompt?: string; ingredients?: string[]; method?: string }`. If no `prompt`, builds one from `recipeName`+`ingredients`+`method`. No usable prompt → `400`.
- **Response `200`**: `{ b64_json?: string; url?: string; prompt: string; model: string }` — handle EITHER `b64_json` or `url`.

### `POST /recipes/import-url` — import + adapt a recipe from a web URL
- **Feature**: `fetch`es the target URL server-side (`User-Agent: Waivy/1.0…`, `cf:{cacheTtl:0}`, follow redirects), extracts schema.org JSON-LD `Recipe` (incl. `@graph`), then **Chat** (task `recipe`, `maxTokens 3000`) to paraphrase/adapt.
- **Request**: `{ url?: string; ingredients?: string[]; budgetPerServing?: number; equipment?: string[]; dietTags?: string[]; servings?: number }`. Non-`http(s)` url → `400`. Source non-200 → `502` with paste-instead hint.
- **Two response branches**, both `200`:
  - JSON-LD found: `{ recipe: <recipe schema>, source: { sourceType:"recipe-site", sourceUrl, sourceName, creatorName?, imageUrl?, datePublished?, dateAccessed, citationRequired:true, attributionText, transformedByAI:true, structuredDataAvailable:true } }`
  - No JSON-LD (falls back to title + cleaned 4000-char text excerpt): `{ recipe, source: { sourceType:"unknown-web", sourceUrl, citationRequired:true, attributionText, transformedByAI:true, dateAccessed, structuredDataAvailable:false } }`
- **`JsonLdRecipe` interface** (parsed from page):
```ts
interface JsonLdRecipe {
  "@type"?: string|string[]; name?: string; description?: string;
  image?: string|{url?:string}|Array<string|{url?:string}>;
  author?: string|{name?:string}|Array<string|{name?:string}>;
  recipeIngredient?: string[];
  recipeInstructions?: string|Array<string|{text?:string;name?:string}>;
  totalTime?: string; prepTime?: string; cookTime?: string;  // ISO-8601 durations
  recipeYield?: string|number; recipeCuisine?: string; datePublished?: string;
}
```

### `POST /recipes/import-text` — import from pasted caption/transcript
- **Model**: Chat, task `recipe`, `maxTokens 3000`, `temp 0.5`, system `IMPORT_ADAPT_SYSTEM + RECIPE_SYSTEM`.
- **Request**: `{ text?: string; sourceUrl?: string; sourcePlatform?: string; creatorName?: string; ingredients?: string[]; budgetPerServing?: number; equipment?: string[]; dietTags?: string[]; servings?: number }`. Missing `text` → `400`; `>10000` chars → `400`.
- **Response `200`**: `{ recipe: <recipe schema>, source: { sourceType:"tiktok"|"instagram"|"youtube"|"manual-user-link", sourceUrl?, creatorName?, dateAccessed, citationRequired:boolean, attributionText, transformedByAI:true, importedFromUserLink:boolean, structuredDataAvailable:false } }`.

### `POST /recipes/web-search` — discover real recipes online
- **Model/feature**: Responses API + `web_search` tool, task `webRecipe`, `maxTokens 2000`.
- **Request**: `{ ingredients?: string[]; cravings?: string; equipment?: string[]; dietTags?: string[]; budgetPerServing?: number; maxResults?: number }` (`maxResults` clamped 1–5).
- **Response `200`**:
```ts
{ candidates: Array<{
    name: string; summary: string; sourceUrl: string; sourceName: string;
    creatorName: string|null; estimatedTotalTimeMinutes: number|null; estimatedServings: number|null;
    detectedIngredients: string[];
    detectedEquipment: Array<"microwave"|"stovetop"|"oven"|"rice-cooker"|"air-fryer"|"no-kitchen">;
    dietTags: Array<"vegan"|"vegetarian"|"high-protein"|"gluten-free"|"dairy-free">;
    whyRecommended: string; imageUrl: string|null;
  }>; }
```

### `POST /pricing/estimate-ingredient` — AI grocery price estimate
- **Model/feature**: Responses API + `web_search`, task `pricing`, `maxTokens 1800`.
- **Request**: `{ ingredientName?: string; recipeQuantity?: number; recipeUnit?: string; location?: { city?, state?, zipCode?, label? }; preferBudgetStores?: boolean }`. Missing `ingredientName` → `400`.
- **Server post-processing**: if `recipeQuantity`+`recipeUnit` given, multiplies the matching `normalizedPrices.pricePer{Oz|Lb|Gram|Each|Tbsp|Tsp|Cup}` by quantity → `recipeAmountCost` (2-dp).
- **Response `200`**: `{ estimate: <pricing schema>, recipeAmountCost?: number }` where `estimate` is:
```ts
{
  ingredientName: string; canonicalIngredientName: string; locationLabel: string|null;
  typicalPackage: { packageSize: number; packageUnit: string; lowPrice: number; averagePrice: number; highPrice: number; };
  selectedBudgetEstimate: { packagePrice: number; packageSize: number; packageUnit: string; reasoning: string; };
  normalizedPrices: { pricePerOz: number|null; pricePerLb: number|null; pricePerGram: number|null; pricePerEach: number|null; pricePerTbsp: number|null; pricePerTsp: number|null; pricePerCup: number|null; };
  sources: Array<{ storeName: string; productName: string; brand: string|null; packagePrice: number; packageSize: number; packageUnit: string; sourceUrl: string|null; priceType: "local-store"|"online-store"|"regional-average"|"national-average"|"historical-average"|"ai-estimated"; sourceQuality: "direct-product"|"search-result"|"average-data"|"estimated"; confidence: "high"|"medium"|"low"; notes: string|null; }>;
  confidence: "high"|"medium"|"low"; explanation: string; warnings: string[];
}
```

### `POST /recipes/remix` — refine an existing recipe
- **Model**: Chat, task `recipe`, `maxTokens 3000`, `temp 0.5`.
- **Request**: `{ baseRecipe?: Record<string,unknown>; userRequest?: string; pantryIngredients?: string[]; budgetPerServing?: number; equipment?: string[]; dietTags?: string[]; preserveSourceAttribution?: boolean }`. Missing `baseRecipe` → `400`. (`baseRecipe` JSON is truncated to 6000 chars in the prompt.)
- **Response `200`**: `<full recipe schema>` (same as `/generate-recipe`).

---

## 8. localStorage / storage

**The Worker touches NO storage** — no `localStorage`, KV, R2, D1, or Durable Objects. It is fully stateless (proxy only). All persistence lives in the frontend (`srf:*` keys per root CLAUDE.md: `srf:pantry`, `srf:grocery`, `srf:saved`, `srf:custom-recipes`, `srf:location`). The future sync endpoints will be the first stateful additions here — they will need a Cloudflare storage binding (KV/D1/R2) added to `wrangler.toml` and the `Env` interface.

---

## 9. Browser/Next-only couplings

**The Worker code itself has none** — it runs on the Cloudflare V8 runtime (Web Fetch API standard), not Node or DOM. It uses only `Request`/`Response`/`fetch`/`URL`/`JSON`/regex — all available in RN. There is no `window`, `localStorage`, `FileReader`, `next/*`, or `'use client'` here.

**Couplings live on the CALLER side** (`src/lib/workerClient.ts`), which mobile replaces:
- `process.env.NEXT_PUBLIC_WORKER_URL` — Next build-time inline. **RN must use a different config source** (e.g. `app.config.ts` `extra`, `expo-constants`, or `process.env.EXPO_PUBLIC_WORKER_URL`). Do not rely on `NEXT_PUBLIC_*`.
- `fetch(\`${WORKER_URL}${path}\`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(...) })` — plain fetch, works in RN unchanged (RN has global `fetch`). No CORS concerns on native.
- **Image responses with `b64_json`** — on web this becomes a `data:` URL for `<img>`. In RN, a base64 data URI works in `<Image source={{uri:'data:image/png;base64,...'}}/>` but is memory-heavy; prefer the `url` branch (dall-e fallback) or render base64 to a cached file via `expo-file-system`. `next/image` is not used here; mobile uses RN `<Image>`/`expo-image`.

**Worker-side coupling that affects sync design**: CORS `Access-Control-Allow-Headers` only allows `Content-Type`. Mobile doesn't need CORS, but if web is to use new auth-protected sync routes, the header allowlist must grow.

---

## 10. RN port plan

**Moves into the shared package UNCHANGED (pure TS, no platform deps):**
- All request/response **TypeScript interfaces** in Sections 7 (recipe schema, options set, resolve/enrich/match results, pricing estimate, web-search candidate, import source) — these are the contract; share them so web + mobile decode identically.
- Endpoint path constants and the `ModelTask`/option-label string unions.
- Any pure coercion/validation of AI JSON (mirror what `workerClient.ts` does).

**Needs a thin platform adapter:**
- **HTTP client** (`postJson`): factor the base-URL + `fetch` POST helper into shared code, but inject the base URL via a platform config getter (web: `NEXT_PUBLIC_WORKER_URL`; RN: `EXPO_PUBLIC_WORKER_URL`/`expo-constants`). The fetch call body is otherwise identical.
- **Image result handling**: shared decoder returns `{ b64_json?, url? }`; a platform adapter turns it into a renderable source (web `<img src>`, RN `expo-image` URI or a file written by `expo-file-system`). Prefer `url` on mobile; treat `b64_json` as the slow path.
- **"AI offline" guard**: shared `isWorkerConfigured()` check; platform shows the friendly empty state (already a product requirement).

**Must be rebuilt / added natively (not in this file today):**
- **The Worker itself is reused as-is** by mobile — no native rebuild; iPhone calls the same deployed `waivy-api`. Nothing in the Worker needs RN porting.
- **NEW sync endpoints** (the actual mobile work): add `case "/sync/…"` handlers to the `switch`, add a Cloudflare storage binding (KV or D1) to `Env` + `wrangler.toml`, and—if user/device auth is introduced—extend `Access-Control-Allow-Headers` to include the auth header. Follow the existing handler pattern: read `origin`, parse JSON with the 400 guard, respond via `jsonResponse(body, status, env, origin)`.
- **Pantry/grocery/saved/custom persistence** currently lives only in browser `localStorage` (`srf:*`). For cross-device sync, mobile (and web) will POST those payloads to the new sync routes; the shapes to sync are `PantryItem[]`, grocery items, saved IDs, and `CustomRecipe[]` (defined in frontend `src/lib/*`, not in the Worker — pull those types into the shared package too).

---

## 11. Quick reference — endpoint × model × feature

| Method | Path | OpenAI feature | Prod model | maxTokens / temp |
|---|---|---|---|---|
| GET | `/health` | — | — | — |
| GET | `/diagnostics` | — | — | — |
| POST | `/ingredients/resolve` | Chat `json_object` | gpt-4o-mini | 1500 / 0.1 |
| POST | `/ingredients/enrich` | Chat `json_object` | gpt-4o-mini | 600 / 0.2 |
| POST | `/ingredients/match` | Chat `json_object` | gpt-4o-mini | 200 / 0.1 |
| POST | `/generate-recipe` | Chat `json_object` | gpt-4o-mini | 3000 / 0.6 |
| POST | `/generate-recipe-options` | Chat ×4 parallel | gpt-4o-mini | 1500 / 0.6 each |
| POST | `/generate-recipe-image` | Images | gpt-image-1 → dall-e-2 | size 1024², quality low |
| POST | `/recipes/import-url` | fetch + Chat | gpt-4o-mini | 3000 / 0.4–0.5 |
| POST | `/recipes/import-text` | Chat | gpt-4o-mini | 3000 / 0.5 |
| POST | `/recipes/web-search` | Responses + web_search | gpt-4o-mini | 2000 |
| POST | `/pricing/estimate-ingredient` | Responses + web_search | gpt-4o-mini | 1800 |
| POST | `/recipes/remix` | Chat | gpt-4o-mini | 3000 / 0.5 |
