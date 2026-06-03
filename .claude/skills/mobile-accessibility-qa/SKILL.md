---
name: mobile-accessibility-qa
description: Verify the app actually works on mobile, keyboards, and with screen readers. Use after any visible change, before commit.
when_to_use:
  - Final QA before commit
  - You changed the navbar, chatbot, or any sticky/floating element
  - You added a form, modal, or list
  - You added or changed an animation
  - The user reports "broken on mobile" or "can't tab to it"
---

# Mobile & Accessibility QA

The full per-route checklist is in [checklist.md](./checklist.md). This is the procedure.

## Procedure

### Step 1 — Responsive sweep

Open `npm run dev` and test at these widths:

- **360 px** — small phone (iPhone SE). Hardest case.
- **390 px** — modern iPhone.
- **768 px** — tablet portrait.
- **1024 px** — small laptop.
- **1280 px** — desktop nav appears.
- **1440 px** — full desktop.

At each width, verify the page-by-page checklist in [checklist.md](./checklist.md).

### Step 2 — Header

- Header doesn't wrap at any width.
- Brand is left, hamburger or pills are right.
- At ≥ `xl` (1280): 8 pills visible. Below `xl`: hamburger.
- Active link has `aria-current="page"` AND visible delta (dark pill background).
- Hamburger drawer opens, closes on backdrop click, closes on Escape, closes on route change.

### Step 3 — Bottom nav (if mounted)

- Hidden at `md+`.
- 5 items, evenly distributed.
- Labels match the top nav (Home, Cheap, Explore, **Grocery** — not "List", Saved).
- Doesn't cover the floating Pesto button (Pesto sits above bottom nav).

### Step 4 — Floating Pesto

- Bottom-right at all sizes.
- Hides while user focuses an input or textarea (so it doesn't cover the mobile keyboard).
- Re-appears on blur.
- 56×56 tap target.
- `aria-label` reads correctly ("Ask Pesto, the cooking assistant").
- Panel opens, closes via × or Escape, doesn't trap focus.

### Step 5 — Recipe cards

- Same height in a row (CSS-grid + `flex flex-col` + `mt-auto`).
- Image is `4:3`, no stretching.
- All badges in the same corner across cards.
- Bookmark button is reachable by keyboard (Tab → Enter to toggle).
- Hover lift only on `motion-safe`.
- At 360 px: 1-up grid; cards never overflow horizontally.

### Step 6 — Filters

- `<SelectablePill>` has `aria-pressed` (multi-select) or `role="radio" + aria-checked` (single).
- Tab order goes left-to-right, top-to-bottom.
- Selected state has a strong visual delta (bg + text + scale).
- An active filter chip bar (if implemented) surfaces what's active so users don't have to scroll back into the filter panel.

### Step 7 — Forms

- Every `<input>`, `<textarea>`, `<select>` has an associated `<label>` (visible or `aria-label`).
- Required fields are marked.
- Errors are announced (`aria-live="polite"` region or inline error text).
- Submit button shows disabled state when invalid.
- The submit button is reachable on mobile without covering it with the floating Pesto.

### Step 8 — Keyboard navigation

- Tab through every interactive element on each page. Order should match visual order.
- Focus ring is visible on every focusable element.
- No focus traps except inside modals (and modals release on close).
- Escape closes drawer, panel, modal.
- Enter / Space activates buttons.

### Step 9 — Screen reader smoke test

In Chrome / Safari, use VoiceOver (Cmd+F5 on Mac):

- Page H1 announced first.
- Section H2s announced as headings.
- Recipe cards announced as links with name + cost + time.
- Bookmark button announces state ("Save recipe" / "Remove from saved").
- Empty states announce title + description.

### Step 10 — Reduced motion

DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce".

- No card hover lift.
- No image zoom on hover.
- No skeleton shimmer.
- State still readable.

### Step 11 — Color contrast

Eyeball the WCAG check:

- Body text (`text-stone-600` on `bg-stone-50` / `bg-white`) → 4.5:1
- Emerald primary on white → check ≥ 4.5:1
- White on emerald-600 → check ≥ 4.5:1 (usually fine)
- Yellow/amber on white → can fail; use `amber-800` for text on `amber-100` bg

If unsure, use Chrome DevTools → Lighthouse → Accessibility audit.

### Step 12 — Tables on mobile

If you added a table:

- It scrolls horizontally within its container, not the whole page.
- First column is sticky so the user can keep context.
- Or it converts to stacked rows below `md`.

### Step 13 — Horizontal overflow

- DevTools → set viewport to 360 px.
- Scroll the page. There should be NO horizontal scrollbar.
- Common culprits: unconstrained images, `whitespace-nowrap` on long titles, `pl-…` on the body, `min-w-…` on cards.

## Files to inspect

- `src/components/layout/Navbar.tsx`, `BottomNav.tsx`, `Chatbot.tsx`
- `src/components/ui/SelectablePill.tsx`, `EmptyState.tsx`, `Toast.tsx`, `Button.tsx`
- `src/app/page.tsx` and every `src/app/*/page.tsx`
- [checklist.md](./checklist.md) — per-route manual QA list

## Quality checklist

See [checklist.md](./checklist.md). Tick it route by route. If a row fails, don't ship.

## Common mistakes

- Hamburger that doesn't close on route change → user clicks a link, drawer stays open
- Floating Pesto covering the primary CTA on `/grocery-list` checkout
- `whitespace-nowrap` on recipe card titles → horizontal overflow at 360 px
- Missing `aria-label` on the icon-only bookmark button
- Skeleton shimmer playing for reduce-motion users
- Toast announcing rewards but not announcing errors
- Tab order skipping the floating chat
