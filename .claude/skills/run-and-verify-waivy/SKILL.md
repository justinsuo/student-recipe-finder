---
name: run-and-verify-waivy
description: How to install, run, and verify Waivy locally. Use whenever you need to confirm a change actually works.
when_to_use:
  - You finished implementing a change and need to verify it
  - You can't tell if the app builds
  - You need to test AI Chef / pantry / pricing
  - You're preparing to commit
---

# Run & verify

The app is a Next.js 16 static export. The worker is a separate Cloudflare Worker.

## Install

```bash
cd /Users/justinsuo/student-recipe-finder   # local dir, kept as-is for now
npm install
```

If you want to develop the worker too:

```bash
cd worker && npm install
```

## Dev server

```bash
npm run dev
# http://localhost:3000
```

This runs Next dev (Turbopack) with hot reload.

## Lint

```bash
npm run lint
```

ESLint 9 with `--max-warnings 0`. Any warning fails CI in the future — fix them now.

## Typecheck

```bash
npx tsc --noEmit
```

TypeScript strict mode. This catches things ESLint won't.

## Build (production)

```bash
npm run build
```

Produces `out/` (static export). The build must succeed before commit.

## Worker preview (optional)

```bash
npm run preview          # opennextjs-cloudflare build && preview
```

Only needed if you're testing the Cloudflare deployment path or the OpenAI proxy.

## Tests

There is **no test runner configured** (no Jest, no Vitest, no Playwright). Don't pretend there is. Report "tests not configured" if asked.

If you add a test runner, document the command here.

## Audit scripts

Run these only if they exist:

```bash
npx tsx scripts/auditRecipePricing.ts
npx tsx scripts/auditRecipeNutrition.ts
```

These walk the seed `RECIPES` array and report any recipe whose cost-per-serving or macros look suspicious. They don't fail the build — they're advisory.

## Environment variables

See `.env.local.example`. Minimum to make the app feel alive locally:

```
# Direct browser-side Anthropic (vision, voice, AI Chef quick, Pesto)
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...

# Cloudflare Worker URL (full AI Chef, image gen, ingredient enrichment)
NEXT_PUBLIC_WORKER_URL=https://your-worker.workers.dev

# Optional external recipe APIs
NEXT_PUBLIC_SPOONACULAR_API_KEY=
NEXT_PUBLIC_EDAMAM_APP_ID=
NEXT_PUBLIC_EDAMAM_APP_KEY=
```

The app must still work with NONE of these set:

- `/`, `/pantry`, `/cheap-recipes`, `/grocery-list`, `/saved`, `/recipes/[id]` work fully (seed data only).
- `/ai-chef`, `/explore`, voice/photo pantry input degrade gracefully (show "AI Chef is offline" placeholder, paged static fallback recipes on Explore).

## Manual verification (do this before committing visible changes)

1. **Home (`/`)**
   - Hero renders, cheapest pick has a real image.
   - All 4 feature cards link and hover-lift.
   - Cheapest picks grid has equal heights.
   - Final CTA buttons keyboard-reachable.

2. **AI Chef (`/ai-chef`)**
   - With API key: pick 3 pantry items, hit Generate → 4 options arrive in ~2-5s.
   - Without API key: shows "AI Chef is offline" placeholder, no crash, no console errors.
   - Select an option → main recipe panel updates.
   - Save to studio → success toast, recipe in `/recipe-studio`.

3. **Pantry (`/pantry`)**
   - Add an ingredient by typing.
   - Toggle "use soon".
   - Verify pantry persists across reload (localStorage `srf:pantry`).

4. **Cheap recipes (`/cheap-recipes`)**
   - Toggle equipment filters.
   - Verify recipe count updates.
   - Empty filter combo → polished empty state, not bare grid.

5. **Grocery (`/grocery-list`)**
   - Add a recipe's missing items.
   - Check items off → strike-through.
   - Total cost updates and doesn't show `NaN`.

6. **Recipe detail (`/recipes/<some-id>`)**
   - Image hero loads (or fallback gradient).
   - Cost / time / macro badges render.
   - Save → bookmark check, recipe in `/saved`.

7. **Mobile sanity**
   - Resize to 360px width.
   - No horizontal overflow.
   - Header doesn't wrap.
   - Floating Pesto bottom-right.

8. **Reduced motion**
   - DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`.
   - Reload. No card hover lifts. No shimmer.

## Screenshots

If you have access to Playwright or another browser-automation tool, capture:

- `/` at desktop and 360px
- `/ai-chef` in loading state
- A recipe detail page
- A mobile drawer open

If you don't, just describe what you verified. Don't fabricate screenshots.

## What to report after verification

Always report:

- Lint: PASS / FAIL with count
- Build: PASS / FAIL
- Typecheck: PASS / FAIL
- Routes manually verified: list
- Routes verified in reduced-motion: list
- Mobile widths tested
- Anything you noticed that's broken (don't hide regressions)

## Common verification mistakes

- Saying "builds successfully" without running `npm run build`
- Skipping `npm run lint` and discovering warnings in CI
- Not testing without the API key (it must degrade gracefully)
- Forgetting to reload after enabling reduced motion
- Not testing 360px width
