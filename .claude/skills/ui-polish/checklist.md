# UI Polish — per-PR checklist

Run this before commit on any visible change. Tick line by line.

## Cards / grids

- [ ] All recipe cards use `<RecipeCard>` (not bespoke markup)
- [ ] Card image is `<RecipeImage variant="card">` (4:3)
- [ ] Card body is `flex flex-col` with `mt-auto` on the bottom CTA — heights match
- [ ] Grid is `gap-4 sm:grid-cols-2 lg:grid-cols-3` (3-up at lg)
- [ ] Cost / time badges sit in the same corner across all cards

## Buttons

- [ ] One primary button per surface (emerald solid pill)
- [ ] Use `<Button>` primitive — no ad-hoc `<button className="bg-emerald-600 ...">`
- [ ] Disabled state visible (`disabled:opacity-40`)
- [ ] Icon-only buttons have `aria-label`

## Chips / badges

- [ ] Equipment + category use `<Badge tone="…">` with the right tone (see `../design-system/reference.md`)
- [ ] Passive labels use `<TagChip>`
- [ ] Filter toggles use `<SelectablePill>`
- [ ] Active filter pill has strong visual delta (bg + text + scale), not just border

## Header / nav

- [ ] Header doesn't wrap at 360 / 768 / 1024 / 1279 / 1280 / 1440
- [ ] Hamburger appears below `xl` (1280px)
- [ ] Hamburger closes on backdrop click and Escape
- [ ] Active link has `aria-current="page"`
- [ ] BottomNav (if mounted) uses the same labels as the top nav — "Grocery" not "List"

## Typography

- [ ] ≤ 2 font weights per card
- [ ] Page title is one of `text-3xl` or `text-4xl` + `font-bold`
- [ ] Card titles are `text-base font-semibold`
- [ ] Stone-600 for body, stone-900 for headings

## Spacing

- [ ] Section gap `space-y-8` or `space-y-12`
- [ ] Card padding `p-4` (recipe) / `p-5` or `p-6` (panels)
- [ ] No double-padded children (panel `p-6` + child `p-6`)

## Interaction states

- [ ] Hover lift on cards (`motion-safe:hover:-translate-y-0.5`)
- [ ] Visible focus ring on every clickable
- [ ] Hover state changes more than just opacity

## States

- [ ] Loading uses `<SkeletonRecipeGrid>` or a labeled spinner, never blank
- [ ] Empty uses `<EmptyState>` with emoji + title + action
- [ ] Error uses `<EmptyState>` with a recovery action; no raw error text

## Mobile

- [ ] No horizontal overflow at 360px
- [ ] Tap targets ≥ 40×40
- [ ] Floating Pesto button doesn't cover the primary CTA on any route

## "Don't ship developer text"

- [ ] No `claude-haiku-…`, `gpt-…`, or other model IDs visible
- [ ] No JSON dumps, raw errors, or stack traces in the UI
- [ ] No TODO/FIXME copy on user surfaces
