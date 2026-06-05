---
name: design-system
description: The visual system for Waivy — color tokens, typography, spacing, radii, shadows, category colors, and the rules for keeping it consistent. Use when building or auditing any visual surface.
when_to_use:
  - You are about to introduce a new color or hover state
  - You can't decide which Tailwind class to use for a spacing or radius
  - You want to confirm a tone token for a recipe category
  - You are adding a component that should join the design system
---

# Design System

The full token table lives in [reference.md](./reference.md). This file is the *how to use it* guide.

## Where tokens live

- **Tailwind v4** reads tokens from `src/app/globals.css`. There is **no `tailwind.config.js`**.
- The `:root` block of `globals.css` defines the background / foreground vars.
- Standard Tailwind palette names (emerald, stone, amber, sky, violet, etc.) are the working palette — see the reference for which one maps to what.

## Color decisions

1. **Brand primary** — emerald-600. Used for: hero CTAs, active nav pill, "save" check, AI Chef accents.
2. **Neutral** — stone scale. Backgrounds (stone-50), text (stone-900 / stone-600), borders (stone-200).
3. **Category tones** — see the table in [reference.md](./reference.md). Use the same color across **every** surface where that category appears (badge, filter pill, card accent).
4. **Don't introduce a new accent without checking** the existing tones first. There are already 10.

## Category color rules (must match across the app)

| Category | Tailwind tone | Use for |
| --- | --- | --- |
| Microwave | `sky` (blue) | Microwave equipment badge, "microwave meals" callout |
| Air fryer | `orange` | Air fryer equipment badge, "air fryer meals" callout |
| Dorm-friendly | `emerald` (green) | "no kitchen" badge, dorm callouts |
| High protein | `violet` (purple) | Protein-forward tags, AI Chef "high protein" refinement |
| Vegetarian | `emerald` | Veg diet tag |
| Use-soon | `amber` | Pantry "use soon" flag, urgency badge |
| Budget / cheap | `yellow` / `amber` | Cost badges (lean amber on light), "cheap" filter |
| Spicy | `red` | Spice heat indicators |
| AI-generated | `violet` / `indigo` | AI Chef recipes, AI image badge |
| Saved | `rose` / `pink` | Bookmark icon active state |

If a recipe carries a tag that maps to one of these, use that color.

## Typography scale

| Use | Class |
| --- | --- |
| Hero | `text-4xl sm:text-5xl md:text-6xl font-bold` |
| Page H1 | `text-3xl sm:text-4xl font-bold` |
| Section H2 | `text-2xl font-semibold` |
| Card H3 | `text-base font-semibold` |
| Body | `text-sm text-stone-600` |
| Caption / eyebrow | `text-[10px] uppercase tracking-wide font-semibold text-stone-500` |

Cap to 2 weights per card.

## Spacing scale

Stick to Tailwind's 4px step. Default to these:

- Component gap (inside card row): `gap-2` (chips), `gap-3` (icon+text), `gap-4` (buttons)
- Card padding: `p-4` (recipe), `p-5/6` (panel), `p-6/8` (hero section)
- Section gap: `space-y-8` (dense), `space-y-12` (home)
- Grid gap: `gap-4`

## Border radii

| Use | Class |
| --- | --- |
| Pills, badges, buttons | `rounded-full` |
| Inputs | `rounded-xl` |
| Card | `rounded-2xl` |
| Hero / panel | `rounded-3xl` |

## Shadows

- Card resting: `shadow-sm`
- Card hover: `hover:shadow-md`
- Floating Pesto / toast: `shadow-lg` / `shadow-2xl`

## Breakpoints (Tailwind defaults — used in nav decisions)

- `sm` 640 — phone landscape, small tablets
- `md` 768 — tablets
- `lg` 1024 — small laptops
- `xl` 1280 — desktops; top nav collapses to hamburger below this

## Adding a new primitive

If you find yourself reaching for raw Tailwind 3+ times for the "same thing" (a price chip, a pantry pill, etc.), promote it to `src/components/ui/`. Convention:

- Default export = the component
- Variants via a `variant` prop, not separate components
- Tones via a `tone` prop tied to the category-color table above
- Forward `className` so callers can extend
- Use `clsx` for conditional classes

## Files to inspect

- `src/app/globals.css` — root tokens, keyframes
- `src/components/ui/Button.tsx`, `Badge.tsx`, `TagChip.tsx`, `SelectablePill.tsx`, `Card.tsx`
- `src/components/recipe/EquipmentBadge.tsx` — category-color usage on real data
- [reference.md](./reference.md) — full token table

## Quality checklist

- [ ] No new colors outside the documented tones
- [ ] Same category uses the same tone across badge / pill / card accent
- [ ] Typography sticks to the documented scale
- [ ] Radii follow the table (pill / xl / 2xl / 3xl)
- [ ] Hover state uses `shadow-md`, not a different color
- [ ] New repeated UI promoted to `src/components/ui/`
