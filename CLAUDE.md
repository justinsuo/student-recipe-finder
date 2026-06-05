# Waivy — Project Brain

This file is the working memory for any coding agent (Claude Code, Cursor, etc.) operating in this repo. Read this **first**. The skills in `.claude/skills/` extend it.

> The `AGENTS.md` file in this repo is an alias of this document for tools that read `AGENTS.md`. Keep them in sync.

---

## 1. Product overview

Waivy (sometimes "Waivy AI") helps broke/busy students cook real food with what they already own. Three things make it different from a generic recipe site:

- **Pantry-first.** Recipes are scored against the user's actual pantry, equipment, and budget — not the other way around.
- **Real cost per serving.** Every recipe is priced from an ingredient catalog with regional cost-of-living multipliers and user overrides. No fake store prices.
- **AI Chef.** When nothing fits, AI Chef generates an original recipe from the pantry + constraints, with cost, macros, and a fallback image.

Tone: warm, food-friendly, encouraging. Not corporate. Not a hackathon demo. The user is tired, hungry, and on a $20 grocery budget — be respectful of their time.

## 2. Core user flows

| Flow | Path | Outcome |
| --- | --- | --- |
| "What can I cook right now?" | `/pantry` → recipe match | Recipes the pantry already satisfies, sorted by waste/cost. |
| "Surprise me with something cheap." | `/` → `/cheap-recipes` | Sorted by cost-per-serving with filters. |
| "Generate something custom." | `/ai-chef` (uses pantry) | 4 generated options → pick → full recipe. |
| "Add to grocery list." | recipe detail → ⇧ List | Missing ingredients with regional cost. |
| "Save for later." | bookmark icon on card | `/saved` (multi-tab). |
| "Build my own." | `/recipe-studio/new` | Custom recipe with image. |
| "Explore the world." | `/explore` | External APIs (Spoonacular / Edamam / TheMealDB) with fallback. |

The home page (`/`) is the funnel into all of these.

## 3. Tech stack

- **Next.js 16** (App Router) with `output: "export"` — fully static, no server.
- **React 19**, **TypeScript 5** strict.
- **Tailwind v4** (PostCSS plugin, CSS-first tokens in `globals.css` — no `tailwind.config.js`).
- **lucide-react** icons.
- **clsx** for class composition.
- **Cloudflare Worker** in `worker/` for AI proxying. Holds the OpenAI key. Frontend talks via `NEXT_PUBLIC_WORKER_URL`.
- **Anthropic Haiku** (`claude-haiku-4-5-20251001`) is called **directly from the browser** for fast on-device generation (vision, voice parse, AI Chef quick options, Pesto chatbot). Key: `NEXT_PUBLIC_ANTHROPIC_API_KEY`.
- **OpenNext Cloudflare** (`@opennextjs/cloudflare`) is wired for `preview`/`deploy`, but GitHub Pages static export is the primary deploy target.
- **No test framework configured.** Verification is `npm run lint`, `npm run build`, and manual QA per the `mobile-accessibility-qa` skill.

## 4. App route map

```
/                      Home — hero, feature cards, cheapest picks, AI Chef demo
/ai-chef               Generate 4 recipe options from pantry + constraints
/pantry                Add ingredients (text / paste / voice / photo), match recipes
/cheap-recipes         Master filter UI ranked by cost
/explore               External cuisine recipes (Spoonacular/Edamam/TheMealDB)
/grocery-list          Auto-collected missing items, grouped, with totals
/saved                 Bookmarks (tabs: All / Database / AI / Created)
/recipe-studio         Hub: AI-generated + user-created custom recipes
/recipe-studio/new     Manual recipe builder + AI image gen
/recipes/[id]          Static per-recipe detail (pricing, macros, guided cooking)
/recipes/custom        View a localStorage-backed custom recipe
/about                 Marketing / features overview
/not-found             404
```

## 5. Important directories

```
src/app/                   App Router pages
src/components/layout/     Navbar, BottomNav, Chatbot (Pesto)
src/components/ui/         Design-system primitives (see Section 7)
src/components/recipe/     RecipeCard, RecipeGrid, RecipeDetailClient, RecipeImage
src/components/pantry/     Pantry input variants (smart-add, photo, voice, chat)
src/components/ai/         AI Chef pantry selector + option bubbles
src/components/pricing/    Ingredient price row, location setup
src/components/search/     Smart search, zero-state, match highlight
src/lib/                   Domain logic — types, scoring, nutrition, AI, storage
src/lib/pricing/           pricingEngine, regions, aiPriceBook, overrides
src/lib/search/            recipeSearch, fuzzyMatch, normalization, recent
src/lib/adapters/          External API adapters (Spoonacular, Edamam, TheMealDB)
src/data/                  Seed recipes, ingredients, nutrition, images, presets
worker/                    Cloudflare Worker (Hono + OpenAI)
.claude/skills/            Project-specific agent skills (read these!)
```

## 6. Design principles

1. **Warm, food-friendly, calm.** Cream background (`#fafaf7`), stone neutrals, emerald primary. Accent colors carry category meaning (see `.claude/skills/design-system/reference.md`).
2. **Cards have the same skeleton.** Image (4:3) → title + 2-line clamp → equipment badges → macros row → tags → optional callout → "Cook this →". Don't reinvent per page.
3. **One primary CTA per surface.** Emerald solid pill. Secondary is white-outline. Tertiary is text link.
4. **Empty states are not error states.** Use `<EmptyState>` with emoji + suggestion + action. Never a bare "No results".
5. **Mobile-first.** Test ≤ 360px width. Never let the header wrap. Avoid horizontal scroll.
6. **Don't ship developer text.** No raw model IDs, no JSON dumps, no "API error 500" — translate to plain English ("AI Chef is offline right now").

## 7. UI component rules

The design system lives in `src/components/ui/`:

- **`Button`** — variants `primary` | `secondary` | `ghost` | `outline` | `danger`; sizes `sm`/`md`/`lg`. Use these. Don't ad-hoc style `<button>` with raw Tailwind.
- **`Badge`** — small tone pill (calories/time/cost). Tones map 1:1 to category colors.
- **`TagChip`** — passive category label. Auto title-cases and de-kebabs.
- **`SelectablePill`** — multi/single-select toggles (filters, equipment). Has `ariaSemantics="pressed" | "checked"`. Default to `pressed` for multi-select toolbars.
- **`Card`** — neutral container. Use when wrapping form sections or info panels. Recipe-specific cards are `RecipeCard`.
- **`EmptyState`** — see above. Always provide a CTA.
- **`SkeletonRecipeGrid`** — match the real grid's column count.
- **`Toast`** — kinds: `success` | `reward` | `info` | `error`. Use `useToast()`.

When adding a new component, ask: does an existing primitive already cover this? If yes, extend it. Don't fork.

## 8. Animation rules

- All motion goes through `motion-safe:` Tailwind variants, so `prefers-reduced-motion` users see no transforms.
- Hover lift: `motion-safe:hover:-translate-y-0.5` (cards) or `hover:scale-105` (small icons).
- Selected-pill bounce: handled inside `SelectablePill`. Don't recreate.
- Image zoom on card hover: `group-hover:scale-105 transition-transform duration-300/500`.
- Never animate things that block interaction (modals appearing should be ≤ 200ms).
- Toast slide-in is owned by `ToastProvider`. Don't fight it.
- No parallax, no scanlines, no terminal/boot-up sequences. This is a recipe app.

See `.claude/skills/animation-interactions/SKILL.md`.

## 9. Accessibility rules

- Every interactive element has a visible focus ring (`focus-visible:ring-2 focus-visible:ring-emerald-500`).
- Icon-only buttons have `aria-label`.
- `aria-current="page"` on the active nav link.
- Filter pills set `aria-pressed` (multi) or `aria-checked` + `role="radio"` (single).
- Decorative images use `aria-hidden`. Recipe photos use the `alt` from `RECIPE_IMAGES`.
- Tap targets ≥ 40×40 px on mobile (the floating Pesto button is 56×56).
- All animations respect `prefers-reduced-motion`.

See `.claude/skills/mobile-accessibility-qa/SKILL.md`.

## 10. Data / model rules

- `Recipe` (in `src/lib/types.ts`) is the canonical shape for seed recipes. Don't break the field list — UI code reads `estimatedNutrition`, `equipment`, `dietTags`, `accentColor`, `emoji`, `totalTimeMinutes` directly.
- Custom + AI recipes use `CustomRecipe` (`src/lib/customRecipeTypes.ts`). They're a superset and stored in `localStorage` (`srf:custom-recipes`).
- Pantry items use `PantryItem` with `useSoon: boolean` — the recipe scorer prioritizes those.
- Recipe IDs are stable. Don't rename. Saved/grocery lists key off them.

## 11. AI API rules

- **OpenAI never touches the browser.** All OpenAI calls go through the Cloudflare Worker (`src/lib/workerClient.ts` → `worker/src/index.ts`).
- **Anthropic Haiku may run in the browser** for low-cost, low-latency tasks (vision, voice, quick recipe options, chat). Key is `NEXT_PUBLIC_*` — assume it can be missing.
- **Always handle missing keys.** If `NEXT_PUBLIC_ANTHROPIC_API_KEY` or `NEXT_PUBLIC_WORKER_URL` is empty, surface a friendly "AI Chef is offline" state — don't crash.
- **Validate AI output before rendering.** Don't trust the model to return well-shaped JSON. The helpers in `src/lib/anthropic.ts` and `src/lib/workerClient.ts` already coerce → keep coercing if you add fields.
- **Centralize model config in one place.** Anthropic models live in `src/lib/anthropic.ts` (`MODEL` const). Worker models live in the Worker's env vars (`RECIPE_MODEL`, `IMAGE_MODEL`, etc.).

See `.claude/skills/ai-chef-integration/SKILL.md`.

## 12. Pricing / nutrition rules

- **Never invent prices.** All ingredient prices come from `src/data/ingredients.ts` × regional multiplier (`src/lib/pricing/regions.ts`) × optional user override. AI-generated estimates are stored in `aiPriceBook` and labeled `source: "ai-estimate"` with confidence.
- **Prorate spice/sauce cost.** A tablespoon of soy sauce is not the cost of a whole bottle. The `pricingEngine.quoteIngredient` already does this — don't bypass it.
- **Cost-per-serving = total / servings.** Use `calculateCostPerServing(recipe)` from `recipeScoring`. Never inline the math.
- **Nutrition is per-ingredient × quantity** via `nutritionEngine.calculateRecipeMacros`. Use `bestEffortNutrition(recipe).estimate` for UI display so missing data falls back gracefully.

See `.claude/skills/pricing-nutrition/SKILL.md`.

## 13. Testing / build commands

```bash
npm install                # Install deps
npm run dev                # localhost:3000
npm run lint               # ESLint, max-warnings 0
npm run build              # Static export → out/
npx tsc --noEmit           # Typecheck (no test runner configured)
```

Worker (separate):
```bash
cd worker && npm install
cd worker && npx wrangler dev    # Local worker
```

Audit scripts (only the ones that exist):
```bash
npx tsx scripts/auditRecipePricing.ts    # Validates every recipe's cost-per-serving math
npx tsx scripts/auditRecipeNutrition.ts  # Validates macros coverage
```

If a script you expect doesn't exist, **don't fabricate output**. Report that it's missing.

## 14. Do not break

- Static export must keep working (`output: "export"` in `next.config.ts`).
- `RECIPES` array (`src/data/recipes.ts`) is the source of truth — don't delete or rename recipe IDs.
- `localStorage` keys: `srf:pantry`, `srf:grocery`, `srf:saved`, `srf:custom-recipes`, `srf:location`. The `srf:` prefix is legacy (from the pre-Waivy "Student Recipe Finder" name) — **do not rename it.** Renaming silently wipes every existing user's pantry / grocery / saved / custom recipes.
- Anthropic API key is `NEXT_PUBLIC_ANTHROPIC_API_KEY`. Don't rename it.
- Floating Pesto button hides while user is typing — don't remove that behavior; it overlaps the mobile keyboard otherwise.
- `RecipeCard` is used on the home page, `/cheap-recipes`, `/saved`, `/explore`, `/pantry` — any visual change ripples everywhere. Verify each.
- `AppStoreProvider` must wrap `ToastProvider` (it does in `layout.tsx`) — chat + toasts depend on store hydration order.

## 15. Final verification checklist

Before reporting work complete, run this:

- [ ] `npm run lint` passes with zero warnings.
- [ ] `npm run build` succeeds.
- [ ] No new console errors in `npm run dev` on `/`, `/ai-chef`, `/pantry`, `/cheap-recipes`, `/grocery-list`, `/saved`, `/recipe-studio`.
- [ ] Header doesn't wrap at 360px, 768px, 1024px, 1280px.
- [ ] Hamburger opens / closes / closes on backdrop + Escape.
- [ ] AI Chef gracefully shows "AI offline" if `NEXT_PUBLIC_ANTHROPIC_API_KEY` is empty.
- [ ] Floating Pesto button hides while focusing inputs and re-appears on blur.
- [ ] Recipe cards line up at equal heights in a row (no jagged grid).
- [ ] `prefers-reduced-motion: reduce` disables hover lifts and skeleton shimmer.
- [ ] No raw model IDs, JSON, or stack traces visible in user UI.
- [ ] `localStorage` keys unchanged.

If any item fails, the work is not done.
