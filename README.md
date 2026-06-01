# Student Recipe Finder

**Live site:** https://justinsuo.github.io/student-recipe-finder/

A polished Next.js + TypeScript + Tailwind web app that helps students find cheap, practical recipes. It started as a recipe database and is now a small AI cooking platform with 235+ seed recipes, an AI recipe generator, a manual recipe builder, AI image generation, AI ingredient understanding, and a regional pricing engine.

The frontend is a static export hosted on GitHub Pages. All AI calls go through a Cloudflare Worker that holds the OpenAI key.

---

## What's in it

### Core recipe browsing
- **235 seed recipes** with real food photos: 100 stovetop/oven classics + 60 air fryer + 60 microwave + 15 air-fryer-and-microwave combo. Every recipe has prep/cook time, equipment, diet tags, cheap-tips, substitutions, nutrition estimate.
- **Cheap Recipe Coach** (`/cheap-recipes`) — filter by budget per serving, equipment, diet, time bucket, cuisine, meal type. Sort by cheapest / fastest / highest-protein / best overall. Equipment-first quick filters: "I only have a microwave", "I have an air fryer", "No stovetop", "Under $2/serving". Recipe-name + ingredient search.
- **Pantry-to-Plate** (`/pantry`) — add ingredients, see what you can make now / need 1–2 items for / what one cheap purchase would unlock.
- **Grocery list** — auto-collected missing ingredients, grouped by category, totals respect your regional pricing.
- **Saved recipes** — tabbed (All / Database / AI Generated / Created by you).
- **Guided cooking mode** — one step at a time, large text, progress bar, automatic timer detection.

### Air fryer + microwave system
- `primaryCookingMethod`, `noStovetopRequired`, `crispinessLevel`, `microwaveTimeMinutes`, `airFryerTimeMinutes`, `airFryerTemperatureF` on every relevant recipe.
- Equipment badges on cards and detail pages (Air fryer / Microwave / No stove / Crispy / 5-min / Meal prep).
- Cooking method card on detail pages with method-specific tips (basket overcrowding, microwave-safe bowls, stir/check halfway, steam caution, etc.).

### AI Chef (`/ai-chef`)
- Two modes: "Generate from what I have" or "Make something creative".
- Inputs: ingredients, budget/serving, servings, equipment, diet, time, cravings, creativity slider.
- Generates an original recipe with cost breakdown, missing ingredients, substitutions, storage/reheating, nutrition, safety notes.
- Auto-generates a custom food photo (toggleable).
- Refinement buttons: Regenerate / Cheaper / Higher protein / Faster / Fewer missing ingredients.
- One-click "add missing items to grocery list".
- Saves to localStorage; persists across visits.

### Recipe Studio (`/recipe-studio`)
- Hub showing both AI-generated recipes and user-created ones.
- Manual recipe card builder (`/recipe-studio/new`) — dynamic ingredient and step rows, equipment chips, tags, notes, auto cost-per-serving math.
- Auto-generates an image on save (toggleable).

### AI Ingredient Intelligence
Fixes the common "multi-word ingredient" bug. If you say "apple cider vinegar" it stays one ingredient, not three.

- **Voice input** — phrase-level capture. The browser streams a transcript; we only call the AI when you hit Stop, so the model sees the whole phrase.
- **Smart paste** — paste a messy list ("apple cider vinegar, eggs, half a bag of frozen broccoli, laoganma chili crisp, old tortillas"); the AI groups them, classifies each, preserves notes like "old" or "half a bag".
- **Photo upload** — snap a fridge/pantry photo; the AI identifies what it sees and one-click-adds.
- **Custom ingredients** — anything not in the seed catalog becomes a saved custom ingredient with full metadata (category, role, storage, shelf life, aliases, diet/allergy tags) and shows in your pantry under "Custom / AI-recognized".

### Local pricing engine
We don't (and ethically can't) scrape Safeway / Trader Joe's / Target product prices. Instead:

- **Regional cost-of-living multipliers** (14 US regions: SF Bay Area ×1.25, NYC ×1.22, Hawaii ×1.42, rural ×0.85, etc., national avg = 1.0).
- ZIP-prefix → region lookup, or pick a region from a dropdown.
- **Manual price overrides** — tap ✎ next to any ingredient on a recipe detail page, set your own per-unit cost, and it applies globally to every recipe that uses it. Reset with one click.
- Every displayed price carries metadata: base catalog price, multiplier applied, region label, and confidence. No fake store-specific prices are ever shown.
- All data stored only in your browser; ZIP is never sent anywhere.

---

## Architecture

```
┌─────────────────────────────────────┐         ┌───────────────────────────┐
│  GitHub Pages (static export)       │ HTTPS   │  Cloudflare Worker        │
│  https://justinsuo.github.io/       │ ──────► │  /ingredients/resolve     │
│       student-recipe-finder/        │  CORS   │  /ingredients/enrich      │
│                                     │ ◄────── │  /ingredients/match       │
│  - Next.js 16 App Router            │   JSON  │  /generate-recipe         │
│  - Tailwind v4                      │         │  /generate-recipe-image   │
│  - React 19                         │         │                           │
│  - Static export, no server         │         │  Holds OPENAI_API_KEY     │
└─────────────────────────────────────┘         └───────────────────────────┘
                                                            │
                                                            ▼
                                                   ┌─────────────────┐
                                                   │  OpenAI API     │
                                                   │  gpt-4o-mini    │
                                                   │  gpt-image-1    │
                                                   └─────────────────┘
```

- Frontend never sees the OpenAI key.
- pantry / saved / overrides / generated recipes / images persist in `localStorage` (images capped: 1.5 MB / image, 6 MB total, with oldest-first eviction).

---

## Repo layout

```
student-recipe-finder/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                       # Home
│  │  ├─ ai-chef/page.tsx               # AI recipe generator
│  │  ├─ recipe-studio/                 # AI/manual recipe hub + builder
│  │  ├─ recipes/[id]/page.tsx          # Seed recipe detail
│  │  ├─ recipes/custom/page.tsx        # Custom/AI recipe detail (?id=...)
│  │  ├─ cheap-recipes/page.tsx
│  │  ├─ pantry/page.tsx
│  │  ├─ grocery-list/page.tsx
│  │  ├─ saved/page.tsx
│  │  └─ about/page.tsx
│  ├─ components/
│  │  ├─ layout/                        # Navbar, BottomNav, Chatbot
│  │  ├─ pantry/                        # Voice/SmartAdd/PhotoUpload/AIChat
│  │  ├─ pricing/                       # LocationSetup + IngredientPriceRow
│  │  ├─ recipe/                        # RecipeCard, RecipeImage, EquipmentBadge, CookingMethodCard
│  │  └─ ui/                            # Badge, Button, Card, EmptyState
│  ├─ data/
│  │  ├─ ingredients.ts                 # 166 ingredients with base US prices
│  │  ├─ recipes.ts                     # 100 base recipes + merges air-fryer + microwave
│  │  ├─ airFryerRecipes.ts             # 60 air fryer recipes
│  │  ├─ microwaveRecipes.ts            # 60 microwave + 15 combo recipes
│  │  ├─ recipeImages.ts                # 235 photo mappings (Wikimedia + Unsplash)
│  │  └─ pantryPresets.ts               # 8 starter packs
│  └─ lib/
│     ├─ pricing/
│     │  ├─ locationTypes.ts
│     │  ├─ regions.ts                  # 14 US regions + ZIP-prefix lookup
│     │  ├─ locationStorage.ts          # localStorage for location + overrides
│     │  └─ pricingEngine.ts            # quoteIngredient + quoteRecipe
│     ├─ AppStore.tsx                   # React Context (pantry/grocery/saved)
│     ├─ workerClient.ts                # Typed client for the CF Worker
│     ├─ customIngredientStorage.ts     # AI-resolved + user-created ingredients
│     ├─ customRecipeStorage.ts         # Generated + user-created recipes + images
│     ├─ customRecipeTypes.ts
│     ├─ recipeScoring.ts               # rankCheapRecipes, rankPantryRecipes, smartBuys
│     ├─ equipmentFilters.ts            # is*Recipe + recipeFitsEquipment
│     └─ types.ts
└─ worker/
   ├─ src/index.ts                      # All 5 endpoints, CORS, OpenAI wrappers
   ├─ wrangler.toml
   └─ README.md                         # Deploy guide
```

---

## Getting started

### Run frontend only (no AI)

```bash
npm install
npm run dev
```

Open http://localhost:3000. All non-AI features (browsing, filtering, pantry, grocery, saved, pricing, manual recipe builder, voice transcript display) work without any backend.

### Enable AI features

Deploy the Cloudflare Worker once (~10 min). It holds the OpenAI key and proxies the AI calls:

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put OPENAI_API_KEY     # paste your OpenAI key when prompted
npx wrangler secret put ALLOWED_ORIGIN     # paste https://justinsuo.github.io
npm run deploy
```

Wrangler will print a URL like `https://student-recipe-finder-api.<your-cf-subdomain>.workers.dev`. Add that to your repo as a GitHub Actions secret:

```bash
gh secret set WORKER_URL --body "<that url>"
```

Then trigger a new build:

```bash
gh workflow run deploy.yml
```

For local dev:

```bash
echo 'NEXT_PUBLIC_WORKER_URL=http://localhost:8787' > .env.local
# In another terminal:
cd worker && npx wrangler dev
# Back in the repo root:
npm run dev
```

⚠️ Set a monthly spend cap on your OpenAI key in the OpenAI dashboard. `gpt-image-1` costs ~$0.04 per image; an unattended hot loop could rack up charges quickly.

---

## Scripts

```bash
npm run dev     # local dev
npm run build   # production static export to ./out
npm run start   # serve the build
npm run lint    # ESLint (flat config), --max-warnings 0
```

---

## Deployment

A push to `main` triggers `.github/workflows/deploy.yml` which:

1. `npm ci`
2. `npm run build` with `GH_PAGES=true`, injecting:
   - `NEXT_PUBLIC_ANTHROPIC_API_KEY` (used for the legacy Pesto pantry chat) — optional
   - `NEXT_PUBLIC_WORKER_URL` (Cloudflare Worker URL for all OpenAI features) — required for AI Chef, Recipe Studio, Ingredient Intelligence
3. Uploads `out/` and deploys to GitHub Pages.

The site is served from `https://justinsuo.github.io/student-recipe-finder/` and uses `basePath: "/student-recipe-finder"` at build time.

---

## Image sources

- 100 base recipes: Wikimedia Commons (CC BY / CC BY-SA / public domain) — attribution rendered on each detail page.
- 135 air fryer / microwave / combo recipes: Unsplash CDN (Unsplash License).
- AI-generated and user-created recipes: OpenAI `gpt-image-1` (saved as `data:` URLs in localStorage with quota management).

Recipes without a curated photo fall back to an emoji-on-gradient hero — defensive only; every shipped recipe ships with a photo.

---

## Known limitations

- **No live store prices.** Major US grocery chains (Safeway, Target, Trader Joe's, Walmart, Whole Foods) don't expose public product/price APIs and scraping their sites would violate ToS. The regional multiplier + manual-override approach is intentional. If you want true store-level pricing, integrate Spoonacular's paid API.
- **AI-generated recipes are estimates.** Nutrition and cost are approximations. Use cooking judgment for safety, especially with chicken/seafood.
- **localStorage caps.** Generated images are limited to 1.5 MB each and 6 MB total. The oldest gets evicted to make room. For a heavier setup, swap to IndexedDB.
- **Voice input** uses the browser SpeechRecognition API which is Chrome-leaning and may not work in Firefox without a flag.
- **Static export limitation.** Custom recipes use a query-param route (`/recipes/custom?id=...`) rather than a dynamic segment, because static export requires all dynamic params to be known at build time.
- **The previous Anthropic Haiku integration** is still wired for the floating Pesto pantry chat and the photo/voice upload uses the same backend. AI Chef + Recipe Studio + Ingredient Intelligence use the new OpenAI Worker.

---

## Tech stack

- Next.js 16 (App Router, Turbopack, static export)
- React 19
- TypeScript 5
- Tailwind CSS v4
- lucide-react icons
- Cloudflare Workers (worker/) for the OpenAI proxy
- OpenAI `gpt-4o-mini` (text) + `gpt-image-1` (images)
- No backend database — `localStorage` is the source of truth for user-generated content
