# Design system — token reference

A compact table of every color, type size, radius, and shadow the app uses.

## Colors

### Brand / neutral

| Role | Token (Tailwind) | Hex (approx) |
| --- | --- | --- |
| Page background | `bg-stone-50` | `#fafaf7` (`--background` in `globals.css`) |
| Surface | `bg-white` | `#ffffff` |
| Subtle surface | `bg-stone-100` | `#f5f5f4` |
| Border | `border-stone-200` | `#e7e5e4` |
| Body text | `text-stone-600` | `#57534e` |
| Heading text | `text-stone-900` | `#1c1917` |
| Brand primary | `bg-emerald-600` | `#059669` |
| Brand primary hover | `bg-emerald-700` | `#047857` |
| Brand accent on light | `bg-emerald-50` / `text-emerald-700` | — |

### Category tones

Use these EXACTLY for the categories listed. Don't swap.

| Category | Background | Text | Border (if needed) |
| --- | --- | --- | --- |
| Microwave | `bg-sky-100` | `text-sky-800` | `border-sky-300` |
| Air fryer | `bg-orange-100` | `text-orange-800` | `border-orange-300` |
| Dorm-friendly / no-stove | `bg-emerald-100` | `text-emerald-800` | `border-emerald-300` |
| High protein | `bg-violet-100` | `text-violet-800` | `border-violet-300` |
| Vegetarian | `bg-emerald-100` | `text-emerald-800` | `border-emerald-300` |
| Vegan | `bg-emerald-100` | `text-emerald-800` | `border-emerald-300` |
| Gluten-free | `bg-amber-100` | `text-amber-800` | `border-amber-300` |
| Dairy-free | `bg-sky-100` | `text-sky-800` | `border-sky-300` |
| Use soon | `bg-amber-100` | `text-amber-800` | `border-amber-300` |
| Budget / cheap | `bg-yellow-100` | `text-yellow-900` | `border-yellow-300` |
| Spicy | `bg-red-100` | `text-red-800` | `border-red-300` |
| AI-generated | `bg-violet-100` / `bg-indigo-100` | `text-violet-700` / `text-indigo-700` | `border-violet-300` |
| Saved | `bg-rose-100` (or just `text-emerald-600` on bookmark) | `text-rose-700` | — |
| Cost ($) | `bg-green-100` | `text-emerald-800` | — |
| Time ⏱ | `bg-amber-100` | `text-amber-800` | — |

These map to the `tone` prop on `<Badge>`. Available `tone` values today: `default`, `amber`, `green`, `emerald`, `rose`, `orange`, `violet`, `sky`, `yellow`, `stone`, `red`. If you need `indigo`, add it as a new tone — don't inline-style.

## Typography scale

| Use | Class |
| --- | --- |
| Hero | `text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight` |
| Page H1 | `text-3xl sm:text-4xl font-bold` |
| Section H2 | `text-2xl font-semibold` |
| Sub-H2 (panel) | `text-xl font-semibold` |
| Card H3 | `text-base font-semibold` |
| Lead body | `text-base text-stone-700` |
| Body | `text-sm text-stone-600` |
| Small | `text-xs text-stone-600` |
| Eyebrow | `text-[10px] sm:text-[11px] uppercase tracking-wide font-semibold text-stone-500` |

Fonts: Geist (sans) + Geist Mono. Imported in `src/app/layout.tsx`.

## Spacing

Tailwind 4 px scale. Conventions:

- Inter-chip: `gap-2`
- Icon + text: `gap-2` (xs) or `gap-3` (sm/md)
- Button cluster: `gap-3` or `gap-4`
- Inside-card padding: `p-4`
- Inside-panel padding: `p-5` to `p-6`
- Hero block padding: `p-6` to `p-10`
- Section vertical rhythm: `space-y-8` (dense) to `space-y-16` (home)
- Page main padding: handled by `<main class="app-main mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">` in `layout.tsx`

## Radii

| Use | Class |
| --- | --- |
| Pill / badge / button | `rounded-full` |
| Input / small icon button | `rounded-xl` |
| Card | `rounded-2xl` |
| Hero / large panel | `rounded-3xl` |

## Shadows

| Use | Class |
| --- | --- |
| Card resting | `shadow-sm` |
| Card hover | `hover:shadow-md` |
| Floating button (Pesto) | `shadow-lg` |
| Modal / drawer | `shadow-2xl` |

## Breakpoints

| Name | Width | Used for |
| --- | --- | --- |
| `sm` | 640 | 2-col grids start |
| `md` | 768 | Hero side-by-side; bottom nav hides |
| `lg` | 1024 | 3-col grids start |
| `xl` | 1280 | Desktop top nav appears; hamburger hides |

## Motion (in `globals.css`)

| Keyframe | Use |
| --- | --- |
| `shimmer` | Skeleton sheen pass (1.8s linear infinite, motion-safe only) |
| `fadeIn` | Pill check fade-in + small element arrival |

If you add a keyframe, document it here.
