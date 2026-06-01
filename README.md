# Student Recipe Finder

Eat well without overspending. A polished Next.js 16 + TypeScript + Tailwind web app that helps students find cheap, practical recipes based on:

1. **What they can afford** — set a budget per serving, your equipment, your diet.
2. **What they already have** — add pantry items and see what you can make right now (and what one cheap purchase would unlock next).

Includes an in-app AI assistant (**Pesto**) that answers questions about budget, pantry, dietary needs, and recipes — entirely in your browser, no API keys required.

---

## Features

- **Cheap Recipe Coach** — filter by budget per serving, servings, equipment (microwave/stovetop/oven/rice cooker/air fryer/dorm-only), diet (vegan/vegetarian/high-protein/gluten-free/dairy-free), time bucket, meal type, and cuisine.
- **Pantry-to-Plate** — searchable ingredient input, quick-add staples, expiration flagging, grouped recipe results (Can make now / Need 1–2 items / Best value / Use-soon).
- **Smart-buy recommendations** — see which cheap staple would unlock the most additional recipes.
- **Grocery list** — auto-collected missing ingredients, grouped by category, estimated total, checkable.
- **Saved recipes** — bookmark anything; persists in `localStorage`.
- **Recipe detail page** with cost breakdown, steps, cheap swaps, healthier tips, batch-prep tips, what-to-buy-next, and nutrition estimate.
- **Guided cooking mode** with one-step-at-a-time layout, large text, progress bar, and automatic timer detection from step text (e.g. "simmer 5 minutes" → 5 min timer).
- **AI chatbot (Pesto)** — recognizes intents like "what can I make with rice and eggs," "cheap high-protein dinner under $2," "vegan meal prep," and surfaces matching recipe cards inline.
- **Mobile-first**, sticky desktop navbar + mobile bottom nav, soft-rounded cards, warm neutral palette, accessible contrast.
- 20+ realistic student-friendly recipes, 50+ ingredients with per-unit cost estimates.

---

## Tech stack

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript 5
- Tailwind CSS v4
- lucide-react icons
- `localStorage` for pantry, grocery list, and saved recipes
- No backend, no API keys required

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available scripts

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # serve production build
npm run lint    # lint (ESLint flat config)
```

---

## Project structure

```
src/
  app/
    page.tsx                  # Home / landing
    cheap-recipes/page.tsx    # Cheap Recipe Coach
    pantry/page.tsx           # Pantry-to-Plate
    grocery-list/page.tsx     # Grocery list
    saved/page.tsx            # Saved recipes
    recipes/[id]/page.tsx     # Recipe detail + cooking mode
    about/page.tsx            # About / How it works
    not-found.tsx
    layout.tsx
    globals.css
  components/
    layout/
      Navbar.tsx              # Desktop sticky top nav
      BottomNav.tsx           # Mobile bottom nav
      Chatbot.tsx              # Floating AI chat (Pesto)
    recipe/
      RecipeCard.tsx
      RecipeGrid.tsx
      RecipeDetailClient.tsx  # Detail page + cooking mode
    ui/
      Badge.tsx
      Button.tsx
      Card.tsx
      EmptyState.tsx
  data/
    ingredients.ts            # 50+ ingredients with per-unit costs
    recipes.ts                # 20+ student-friendly recipes
  lib/
    types.ts                  # Strong TS types
    storage.ts                # localStorage helpers
    AppStore.tsx              # React Context for pantry / grocery / saved
    recipeScoring.ts          # Cost + pantry + ranking helpers
    chatbot.ts                # Local intent-detection chatbot engine
```

---

## How the recommendation engine works

All scoring is deterministic and local. Helpers in [`src/lib/recipeScoring.ts`](src/lib/recipeScoring.ts):

- `calculateRecipeCost(recipe)`
- `calculateCostPerServing(recipe)`
- `calculatePantryMatch(recipe, pantrySet)`
- `calculateMissingIngredients(recipe, pantrySet)`
- `calculateMissingCost(recipe, pantrySet)`
- `rankCheapRecipes(filters)`
- `rankPantryRecipes(pantryItems, filters)`
- `groupPantryResults(results, pantry)` → `{ canMakeNow, needFewItems, buyOneUnlock, useSoon }`
- `recommendSmartBuys(pantry)` — surfaces one cheap staple that would unlock the most additional recipes.

The chatbot ([`src/lib/chatbot.ts`](src/lib/chatbot.ts)) uses lightweight intent detection (budget, diet, equipment, ingredients, time, meal type) and routes through the same scoring helpers, so its suggestions are always consistent with what the rest of the app shows.

---

## Limitations & future improvements

- **Cost estimates are static** — they're rough US grocery averages, not store-specific or location-aware. A real version would integrate a price API or scrape local prices.
- **Chatbot is local rules-based**, not an LLM. It's reliable and works offline, but it doesn't generate new recipes. Plugging in the Anthropic SDK behind a `/api/chat` route would be a clean extension.
- **No backend** — pantry, grocery list, and saved recipes live in `localStorage`. Adding sync across devices would require auth + a database.
- **No real photos** — recipe cards use emoji + colored panels to stay copyright-clean and load fast. Swap in real images via `next/image` if desired.
- **20 recipes** in the seed — plenty for a working MVP, but a real app would want hundreds with nutrition data from a verified source.

---

## License

MIT
