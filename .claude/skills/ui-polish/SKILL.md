---
name: ui-polish
description: Tighten the visual layer so the app feels like a real product, not a hackathon demo. Use AFTER the layout decision is made, BEFORE shipping.
when_to_use:
  - You added or changed visible UI and want a final pass
  - The screen "looks fine but feels off"
  - Cards in a grid have unequal heights or jagged edges
  - You see ad-hoc Tailwind classes that should be a primitive
---

# UI Polish

The bar: every surface should look like it came from one designer, one day.

## When to use

- Final pass before commit on any visible change
- Spot-fix an inconsistent header, card row, or form
- Replace ad-hoc Tailwind with the design-system primitives

## Procedure

### Step 1 — Audit cards

In any grid (`/cheap-recipes`, `/saved`, home cheapest picks):

- All cards use `<RecipeCard>`. No bespoke recipe cards.
- All cards have the same image aspect (`4:3` via `<RecipeImage variant="card">`).
- The card sets `flex flex-col` and uses `mt-auto` on the bottom CTA so heights match.
- The grid is `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` (3-up at lg, not 4).

### Step 2 — Audit buttons

- One **primary** (`Button variant="primary"`) per surface — emerald solid pill.
- **Secondary** is white with stone border (`outline` variant).
- **Tertiary** is a text link (`text-emerald-700 hover:underline`).
- No raw `<button>` with ad-hoc Tailwind on visible surfaces. Use `<Button>`.

### Step 3 — Audit chips / badges

- Equipment + category → `<Badge tone="…">`. Tone tokens are listed in `../design-system/reference.md`.
- Passive labels → `<TagChip>`. It title-cases and de-kebabs automatically.
- Filter toggles → `<SelectablePill>`. Don't fork it.
- Cost/time on cards → `<Badge>` placed in the same corner across all cards (bottom-left of image).

### Step 4 — Audit header / nav

- Header is `sticky top-0 z-40` on a `bg-stone-50/90 backdrop-blur` strip.
- Desktop nav collapses at `xl` (1280px). Below that, hamburger.
- Nav labels: short (`Home`, `AI Chef`, `Studio`, `Pantry`, `Cheap`, `Explore`, `Grocery`, `Saved`).
- BottomNav (mobile, if mounted) uses the **same labels** — not "List" for "Grocery". See [checklist.md](./checklist.md).

### Step 5 — Audit typography

- Page title: `text-3xl font-bold` (sm: `text-4xl`).
- Section heading: `text-2xl font-semibold`.
- Card title: `text-base font-semibold`.
- Body: `text-sm text-stone-600`.
- Eyebrow / overline: `text-[10px]/[11px] uppercase tracking-wide text-stone-500`.
- Never mix more than 2 weights in one card.

### Step 6 — Audit spacing

- Section gap: `space-y-12` on home, `space-y-8` on dense pages.
- Card padding: `p-4` (card) or `p-5/6/8` (panel).
- Inside a row of inline elements: `gap-2` for chips, `gap-3` for icon+text, `gap-4` for distinct buttons.

### Step 7 — Audit interaction states

- Hover lift: `transition-all motion-safe:hover:-translate-y-0.5 hover:shadow-md` on cards.
- Active filter pill: solid emerald background + white text + scale bump (already in `SelectablePill`).
- Focus ring: `focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500` on every clickable.

### Step 8 — Loading + empty + error

- Loading: `<SkeletonRecipeGrid>` for recipe grids; labeled spinner for short async (≤ 1s).
- Empty: `<EmptyState>` with emoji, title, description, and an action button.
- Error: `<EmptyState>` with a 🤕 emoji, plain-English title, "Try again" action.

### Step 9 — Forms

- Inputs: `rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-400 focus:outline-none`.
- Labels above inputs, `text-xs font-semibold uppercase tracking-wide text-stone-500`.
- Disabled buttons: `disabled:opacity-40 disabled:cursor-not-allowed`.

## Files to inspect

- `src/components/ui/Button.tsx`, `Badge.tsx`, `TagChip.tsx`, `SelectablePill.tsx`, `Card.tsx`, `EmptyState.tsx`, `SkeletonRecipeCard.tsx`, `Toast.tsx`
- `src/components/recipe/RecipeCard.tsx`, `RecipeImage.tsx`, `EquipmentBadge.tsx`
- `src/components/layout/Navbar.tsx`, `BottomNav.tsx`
- `src/app/globals.css` (design tokens)
- [checklist.md](./checklist.md) — the per-PR polish list

## Quality checklist

See [checklist.md](./checklist.md). Run through it line by line before commit.

## Common mistakes — avoid these

- Random gradients on multiple surfaces ("everything is colorful" = nothing stands out)
- 4+ font sizes in one card
- Inconsistent card heights (forgot `flex flex-col` + `mt-auto`)
- Weak selected state (just a different border — make it bold)
- Wrapping nav labels at 1024-1279px
- Floating Pesto button covering filter controls
- Raw model IDs, JSON dumps, or "Error: 500" visible to users
- Mixing icon stroke weights from lucide and emoji
