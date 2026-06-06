---
title: Pantry Pop — theme research log
date: 2026-06-05
---

# Pantry Pop research log

This document records the references consulted (or NOT consulted) while
designing the **Pantry Pop** visual theme. It exists so future contributors
know where ideas came from and which constraints applied.

## Honest disclosure: no live crawl this pass

The user's spec listed a long set of websites and GitHub repos to inspect.
This session **did not** open a headless browser or fetch any of them. Two
reasons:

1. **User preference.** The user has previously asked that this agent
   avoid activating Chrome / taking screenshots while they are using the
   computer (see `.claude/projects/-Users-justinsuo/memory/feedback_no_screenshots.md`).
2. **IP safety.** Several of the listed sites (Duolingo, MyFitnessPal,
   Lifesum, Lose It, Noom, Yuka, Samsung Food, Tasty, HelloFresh, Gousto,
   Factor75, Nutritionix) are proprietary. Fetching and adapting their
   exact pixels would risk reproducing trade dress even with paraphrasing.
   The user's own brief reinforces this: "Use them only to understand
   color, polish, hierarchy, and interaction patterns. Do not copy."

So the Pantry Pop palette and component shapes are built from:

- **General pattern knowledge** of consumer food + nutrition apps
  (warm cream backgrounds, basil-green CTAs, orange/yellow food accents,
  color-coded macros, rounded cards).
- **This codebase's existing primitives**: `ThreeDButton`, `Pressable`,
  `Stagger`, `ScrollReveal`, `AnimatedNumber`, `Badge`, `SelectablePill`,
  `EmptyState`, `Toast`. The 3D button technique (raised face + bottom
  border + active-translate) is a well-known CSS pattern; the
  implementation here is original Tailwind, not lifted.

No proprietary assets, marks, illustrations, sounds, copy, or layouts
were reproduced. No third-party code was adapted into the tree.

## Pattern sources used at the *concept* level

These are categories of UI convention — not specific apps — that informed
how Pantry Pop balances playfulness with trust:

| Pattern | What it gave Pantry Pop |
| --- | --- |
| Warm cream / oat backgrounds | Background cream `#FFF8ED`, soft card tint `#FFF1D9`, oat beige `#F6E7CF` — softer than the previous `#fafaf7` stone. |
| Basil-green primary CTAs | `#2FBF71` raised face with `#16834A` 3D shadow. Reads as edible, growing, calm. |
| Carrot / butter accent system | `#FF8A3D` (Nourish + warmth) and `#FFD166` (budget + cheap-recipes) tied to specific product surfaces, not used generically. |
| Color-coded macros | Calories=orange, Protein=violet, Carbs=blue, Fat=amber, Water=cyan. Standard nutrition-tracker convention so users don't need to relearn semantics. |
| 3D button affordance | Pressable face that translates down on tap. Conveys "this is the action" without relying on motion-heavy reveals. |
| Pill-shaped filter chips with strong selected state | Filled fill + check icon + `aria-pressed` — selection is obvious without depending only on color. |

## Repositories referenced

The spec listed several open-source repos as candidate sources. None were
cloned or adapted this pass. The 3D button, motion primitives, and toast
system in this repo are original implementations on Tailwind v4 + React 19.

If a future pass *does* adapt code from one of these, that pass MUST:

1. Confirm the repo carries a permissive license (MIT, Apache-2.0, BSD).
2. Preserve required license headers in the adapted file.
3. Add an entry to the table below with the URL, license, and what was
   adapted.

| Repo | URL | License (if known) | Adapted into this build? |
| --- | --- | --- | --- |
| shadcn/ui | https://github.com/shadcn-ui/ui | MIT | No — patterns only, no code copied |
| Radix UI Primitives | https://github.com/radix-ui/primitives | MIT | No |
| Tailwind CSS | https://github.com/tailwindlabs/tailwindcss | MIT | Already a runtime dep — used as a styling tool, not source-copied |
| Framer Motion | https://github.com/framer/motion | MIT | No — we use CSS keyframes + Tailwind motion-safe |
| sonner | https://github.com/emilkowalski/sonner | MIT | No — internal Toast is original |
| vaul | https://github.com/emilkowalski/vaul | MIT | No |
| Recharts | https://github.com/recharts/recharts | MIT | No |
| Tremor | https://github.com/tremorlabs/tremor | Apache-2.0 | No |
| Magic UI | https://github.com/magicuidesign/magicui | MIT | No |
| HeroUI | https://github.com/heroui-inc/heroui | MIT | No |

## Pantry Pop palette (canonical)

These are the exact values implemented in
[`src/lib/design/tokens.ts`](../src/lib/design/tokens.ts) and
[`src/app/globals.css`](../src/app/globals.css):

```
Background cream:    #FFF8ED
Surface white:       #FFFFFF
Soft card tint:      #FFF1D9
Oat beige:           #F6E7CF
Main text espresso:  #241A12
Muted text warm:     #6B5A4A
Border biscuit:      #E8D8C4

Primary basil green: #2FBF71
3D shadow deep basil:#16834A

Carrot orange:       #FF8A3D
Butter yellow:       #FFD166
Tomato red:          #EF4444
Grape violet:        #7C5CFF
Teal:                #20C7A5
Sky blue:            #3BA7FF
Pink:                #FF6B9E
```

## Category color mapping

Implemented in [`src/lib/categoryColors.ts`](../src/lib/categoryColors.ts):

| Category | Hex |
| --- | --- |
| AI Chef | `#7C5CFF` |
| Pantry | `#2FBF71` |
| Cheap / Budget | `#FFD166` |
| Nourish | `#FF8A3D` |
| Protein | `#8B5CF6` |
| Carbs | `#3BA7FF` |
| Fat | `#F59E0B` |
| Water | `#06B6D4` |
| Air fryer | `#FF8A3D` |
| Microwave | `#3BA7FF` |
| Use soon | `#F59E0B` |
| Spicy | `#EF4444` |
| Saved | `#FF6B9E` |
| Grocery | `#20C7A5` |
| Explore | `#6366F1` |
| Vegetarian | `#10B981` |
| Meal prep | `#14B8A6` |
| Dorm-friendly | `#22C55E` |

## What landed in this commit

- New token palette in `src/lib/design/tokens.ts` (PANTRY_POP + extended PALETTE).
- New `src/lib/categoryColors.ts` mapping category keys → hex + tailwind tone.
- `src/app/globals.css` updated: background cream, Pantry Pop CSS variables,
  refreshed dot-grid color.
- `Navbar` brand mark redesigned: rounded squircle tile with basil gradient,
  a small carrot-orange "AI" pip instead of the old sparkles patch.
- Home hero badge: pill restyled to use border-biscuit, basil text, and the
  pop sparkle in carrot orange.
- `Badge` gained `basil`, `carrot`, `butter`, `tomato`, `grape`, `teal`,
  `pink` tones mapped onto the new palette.

## Deferred (called out, not silently dropped)

- Per-page accent sweep on Cheap Recipes (yellow), Grocery (teal), Saved
  (pink), Explore (indigo), Recipe Studio (violet+orange).
- Adding `Baloo 2` as a secondary heading font (Nunito stays primary; the
  current single-font setup keeps payload + layout shift down).
- `ThreeDIconButton` and `ThreeDActionCard` primitives — these will get
  added when an actual surface needs them (premature primitives rot fast).
- Reward-toast art refresh.
- Page-level review of Nourish dashboard color audit.

Reasoning: the spec is large, and a coherent foundation shipping
across the whole app beats half-finished pages everywhere. Phase B
will deepen surface-by-surface.
