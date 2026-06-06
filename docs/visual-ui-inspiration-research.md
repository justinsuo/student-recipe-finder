---
title: Visual UI inspiration — research log
date: 2026-06-05
---

# Visual UI inspiration — research log

The user asked for a more app-like, less-presentation-document interface, with
GitHub-sourced inspiration documented. This is the honest log for that pass.

## Scope of this session

- **No live crawl.** This session did not open a browser, fetch GitHub
  pages, clone any of the listed repos, or read their source. The
  reasons are the same as the Pantry Pop research log
  ([theme-research.md](./theme-research.md)): the user prefers no
  Chrome / no screenshots while working, and proprietary food-tracker
  UIs would risk reproducing trade dress even at a "pattern" level.
- **What I used instead.** General pattern knowledge of consumer food /
  nutrition / fintech / dashboard UIs (bento grids, icon-led tiles,
  asymmetric hero cards, ring meters, sticky filter bars, bottom sheets).
  These are common UI vocabulary, not specific apps.
- **What I did NOT do.** I did not paste code from any third-party repo
  into this tree. The new primitives in `src/components/ui/` are
  original Tailwind + React 19, written specifically for this codebase
  and the Pantry Pop palette.

## Repos referenced by the spec

| Repo | URL | License | Adapted into this build? |
| --- | --- | --- | --- |
| shadcn/ui | https://github.com/shadcn-ui/ui | MIT | No — patterns only |
| Magic UI | https://github.com/magicuidesign/magicui | MIT | No |
| Radix UI Primitives | https://github.com/radix-ui/primitives | MIT | No |
| Framer Motion | https://github.com/framer/motion | MIT | No — we stay on CSS keyframes + `motion-safe:` |
| sonner | https://github.com/emilkowalski/sonner | MIT | No — internal Toast is original |
| vaul | https://github.com/emilkowalski/vaul | MIT | No |
| Recharts | https://github.com/recharts/recharts | MIT | Already a runtime dep for charts — used as a library, no source copied |
| DaisyUI | https://github.com/saadeghi/daisyui | MIT | No |
| HeroUI | https://github.com/heroui-inc/heroui | MIT | No |
| Untitled UI React | https://github.com/untitleduico/react | MIT | No |
| TailGrids | https://github.com/TailGrids/tailgrids | MIT (free tier) | No |
| Tremor | https://github.com/tremorlabs/tremor | Apache-2.0 | No |

If a future pass DOES adapt code from one of these, append an entry with
the exact files copied, the commit that brought them in, and the license
header preserved at the top of each adapted file.

## Patterns adapted (general UI vocabulary, no source copying)

| Pattern | Where it lands in Waivy this pass |
| --- | --- |
| Bento grid — asymmetric tile layout | `src/components/ui/BentoGrid.tsx`, used on the About page feature catalog |
| Icon-led action tile | `src/components/ui/IconTile.tsx`, used wherever a feature card was previously a "title + paragraph" |
| Compact stat dashboard | `src/components/ui/StatCard.tsx`, used to replace prose number callouts |
| Ring progress meter | `src/components/ui/ProgressRing.tsx` — minimal SVG, no library dep |
| Illustration-style empty state | `src/components/ui/VisualEmptyState.tsx`, used on Saved / Grocery / Pantry zero states |
| Horizontal snap carousel with scroll affordance | `src/components/ui/HorizontalCarousel.tsx` |

## What this pass intentionally did NOT do

- Did not rewrite every page. The Home page already has a strong
  bento-style ToolCard/StepCard layout with food imagery. Touching
  every surface in one commit produces shallow work everywhere.
- Did not add a second display font. Nunito stays as the only family —
  payload + layout shift discipline beats a third Google Font for
  hero copy that the user might not even keep.
- Did not add Framer Motion. The motion budget here (CSS keyframes,
  Tailwind `motion-safe:` variants, `Pressable`, `Stagger`,
  `ScrollReveal`) is already coherent. Pulling in a new dep just to
  rewrite a card hover is not worth the bundle.
- Did not redesign Recipe Studio, Cheap Recipes, Explore, or
  Recipe-detail this pass. Those are called out as a Phase B backlog.

## Deferred (Phase B)

- Cheap Recipes: convert top filter bar into a sticky `StickyActionBar`
  and the budget pill into a `ProgressRing`-style meter.
- Recipe Studio: replace the form-page layout with a creative-cockpit
  layout (live preview card + ingredient chips + step cards).
- Explore: cuisine carousel using `HorizontalCarousel` + colored region
  badges.
- Nourish: dashboard already has strong visual structure, but a
  `ProgressRing`-led calorie hero would push it further.
- Recipe-detail: move ingredient list to a chip strip + steps to
  `VisualStepper` cards.
