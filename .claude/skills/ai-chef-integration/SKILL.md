---
name: ai-chef-integration
description: How to keep AI Chef and other AI features reliable, secure, and gracefully degraded. Use when touching anything that calls Anthropic, OpenAI, or the Cloudflare Worker.
when_to_use:
  - You are adding or modifying an AI-backed feature
  - You are changing the worker, the prompt, or the response shape
  - You are deciding whether to call the browser-side Haiku helper or the worker
  - AI Chef is throwing errors and you don't know why
---

# AI Chef Integration

There are two AI surfaces in this app and they have different rules.

## The two surfaces

### 1. Browser-side Anthropic (Haiku)

- File: `src/lib/anthropic.ts`
- Model: `claude-haiku-4-5-20251001` (const `MODEL`)
- Key: `NEXT_PUBLIC_ANTHROPIC_API_KEY` (PUBLIC — shipped to the browser)
- Functions: `recognizeIngredientsFromImage`, `recognizeIngredientsFromText`, `generateRecipeQuick`, `generateRecipeQuickOptions`, `pantryChat`
- Used for: vision (fridge photos), voice transcript parsing, AI Chef "quick" mode, Pesto chatbot
- **Assume the key may be missing.** Static export → user might run the site locally without setting env vars. Always check and gracefully fall back.

### 2. Cloudflare Worker proxy (OpenAI)

- File: `src/lib/workerClient.ts` + `worker/src/index.ts`
- URL: `NEXT_PUBLIC_WORKER_URL` (PUBLIC — points at the worker; worker holds the OpenAI key)
- Endpoints (POST): `/ingredients/resolve`, `/ingredients/enrich`, `/ingredients/match`, `/generate-recipe`, `/generate-recipe-options`, `/generate-recipe-image`, `/recipes/import-url`, `/recipes/import-text`, `/recipes/web-search`, `/pricing/estimate-ingredient`, `/recipes/remix`
- Used for: heavier or sensitive calls (image gen, full recipe gen, ingredient enrichment, AI grocery pricing)
- **The frontend MUST NOT touch the OpenAI key directly.**

## Procedure

### Step 1 — Pick the right surface

| Task | Which |
| --- | --- |
| Vision / voice parsing of pantry input | Browser Anthropic |
| Quick "4 recipe options" for AI Chef | Browser Anthropic (parallel) |
| Pesto chatbot | Browser Anthropic |
| Full single recipe + image | Worker (OpenAI text + DALL-E) |
| Ingredient enrichment / matching | Worker |
| AI grocery price estimate | Worker |
| Recipe import from URL or text | Worker |
| Remix existing recipe | Worker |

### Step 2 — Handle missing config

Before any call, check:

```ts
import { hasAnthropicKey } from "@/lib/anthropic";
import { hasWorkerUrl } from "@/lib/workerClient";

if (!hasAnthropicKey()) {
  // show "AI Chef is offline. Set NEXT_PUBLIC_ANTHROPIC_API_KEY locally
  // or use the saved recipes / cheap recipes pages." — not a stack trace.
}
```

(If these helper functions don't exist yet, add them — there should be one source of truth for the "is AI available?" check.)

### Step 3 — Validate AI output

LLMs lie. Don't trust the JSON they return.

For Anthropic flows, see how `generateRecipeQuick` already coerces a `SlimHaikuRecipe` into a `GeneratedRecipe`. Pattern:

1. Ask for JSON with a strict schema in the system prompt.
2. Parse defensively (try/catch around `JSON.parse`).
3. Validate each required field exists; coerce types (`Number(x) || 0`, `String(x).trim()`).
4. Default-fill missing fields with sensible values.
5. Reject (and retry once) if the recipe is degenerate (no ingredients, no steps).

For worker flows, validate the same way client-side. The worker may pass through messy text.

### Step 4 — Pantry-aware generation

AI Chef must sync with the pantry. The `AIChefPantrySelector` already passes the selected pantry items as ingredients to the prompt. When you change the prompt or schema:

- Keep `pantry: string[]` (names, not IDs) as a first-class input
- The model should mark which generated ingredients the user already has → `userAlreadyHas: true` per ingredient
- The "missing items" panel reads `userAlreadyHas === false`
- Don't lose this signal — it's how the grocery list integration works

### Step 5 — Multiple recipe options

`generateRecipeQuickOptions` fires 4 Haiku calls in parallel for: best-match, cheapest, fastest, wildcard. Each option is a `GeneratedRecipeOption`. The UI shows them as bubbles; selecting one swaps in the full recipe.

When adding a new option archetype:

- Add it to the `OPTION_ARCHETYPES` array (or equivalent)
- Give it a distinct prompt suffix so the model knows the role
- Cap total options at 4 (UI affordance — don't add a 5th without redesigning)

### Step 6 — Images

- Image generation is via the worker (`/generate-recipe-image` → DALL-E by default).
- Always have a fallback. If the worker is missing or image gen fails, show `<RecipeImage>` (which already falls back to gradient + emoji).
- Cache: AI images live in `localStorage`, capped at 1.5 MB / image and 6 MB total. Don't blow this up.

### Step 7 — Loading state

- AI Chef quick generate: ~2-5s. Show a labeled loader (`<Loader2 />` + "Cooking up options…"), not a spinner-in-void.
- Don't auto-disable the entire form during generation — the user might want to cancel or tweak inputs.
- Provide a "Regenerate" button after results render so the user doesn't have to scroll up.

### Step 8 — Pricing + nutrition after generation

After a recipe is generated:

1. Run it through `pricingEngine.quoteRecipe` to override the model's price guess (the model often lies about cost).
2. Run it through `nutritionEngine.calculateRecipeMacros` to compute macros from real per-ingredient data.
3. Persist the *real* values onto the `CustomRecipe`, not the model's.

This is in `.claude/skills/pricing-nutrition/SKILL.md` — read that too.

### Step 9 — Error states

- Bad JSON from model → "Pesto burned the first batch — try again." with a Retry button. Log the raw error to console, NOT to the UI.
- Worker 5xx → "AI Chef is offline right now. Browse cheap recipes instead?" with a link to `/cheap-recipes`.
- Key missing → static "Set up AI Chef" placeholder pointing at `.env.local.example`.

## Files to inspect

- `src/lib/anthropic.ts`
- `src/lib/workerClient.ts`
- `worker/src/index.ts`
- `src/app/ai-chef/page.tsx`
- `src/components/ai/AIChefPantrySelector.tsx`, `GeneratedRecipeOptionBubbles.tsx`
- `src/lib/customRecipeTypes.ts`
- `src/lib/customRecipeStorage.ts`
- `src/lib/chatbot.ts`, `src/components/layout/Chatbot.tsx`

## Quality checklist

- [ ] No browser-side OpenAI calls
- [ ] Anthropic key absence shows a friendly state, not a crash
- [ ] AI JSON is parsed defensively and validated
- [ ] Generated recipe goes through `pricingEngine` + `nutritionEngine` before save
- [ ] Image generation has a fallback (gradient + emoji)
- [ ] Loading state is labeled, not silent
- [ ] Error state has plain English copy + recovery action
- [ ] Model IDs are not visible in the UI
- [ ] Worker URL absence shows "AI Chef is offline" not a CORS error

## Common mistakes

- Trusting `JSON.parse` on raw model output
- Letting model-claimed prices/macros reach the UI (always recompute)
- Showing a console error / stack trace in the UI
- Forgetting `userAlreadyHas` and breaking the grocery-list flow
- Storing raw base64 images without size capping (`localStorage` quota hit silently)
- Adding a new endpoint to the worker but forgetting to add it to `workerClient.ts`
