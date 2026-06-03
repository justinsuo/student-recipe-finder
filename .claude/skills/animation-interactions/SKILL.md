---
name: animation-interactions
description: Add subtle, tasteful motion. Use to clarify state changes — never to decorate. Always respect prefers-reduced-motion.
when_to_use:
  - You added a new interactive component and want it to feel alive
  - A state change (filter toggle, save, generate) is hard to notice
  - You want to add a hover / press / enter animation
  - You are tempted to install Framer Motion — read this first
---

# Animation & Micro-interactions

Motion is a tool to clarify state changes. If a user can't tell what changed, motion fixes it. If they can already tell, motion is decoration — skip it.

## Hard rules

1. Every motion goes through `motion-safe:` Tailwind variant **or** is gated behind `(prefers-reduced-motion: no-preference)` in CSS. Reduce-motion users see no transforms.
2. Animations never block interaction. Max duration for UI feedback: 200ms. Max for ambient (image zoom on hover): 500ms.
3. Don't animate everything. If everything moves, nothing reads.
4. Don't install Framer Motion unless you've justified it in writing. Tailwind transitions cover 95% of needs.
5. No parallax. No scanlines. No "boot sequence". No cursor halos. This is a recipe app.

## Vocabulary already in the codebase

| Effect | How |
| --- | --- |
| Card hover lift | `motion-safe:hover:-translate-y-0.5 hover:shadow-md transition-all` |
| Card image zoom | `transition-transform duration-500 motion-safe:group-hover:scale-105` |
| Button press | `Button` primitive already handles this |
| Pill selected bounce | `SelectablePill` already handles this |
| Skeleton shimmer | `@keyframes shimmer` in `globals.css` + `motion-safe:animate-[shimmer_1.8s_infinite]` |
| Pill check fade-in | `@keyframes fadeIn` in `globals.css` |
| Toast slide-in | Owned by `ToastProvider` — don't fight it |

## Procedure

### Step 1 — Decide if motion is even needed

- State change visible without motion? Skip animation.
- New element appearing (toast, drawer, panel)? Yes, a slide/fade is helpful.
- Hover on an interactive element? A subtle lift or scale, ≤ 0.5 translation or ≤ 1.05 scale.

### Step 2 — Reach for a Tailwind transition first

For most cases:

```tsx
className="transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md"
```

For grouped image zoom on a card:

```tsx
<Link className="group …">
  <img className="transition-transform duration-500 motion-safe:group-hover:scale-105" />
</Link>
```

### Step 3 — Reach for a keyframe if needed

Add to `src/app/globals.css`:

```css
@keyframes my-effect {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Consume with `motion-safe:animate-[my-effect_200ms_ease-out]`.

### Step 4 — For staggered entrance (lists, grids)

Use Tailwind delay utilities on children:

```tsx
items.map((it, i) => (
  <div
    className="motion-safe:animate-[fadeIn_220ms_ease-out_both]"
    style={{ animationDelay: `${i * 40}ms` }}
  />
))
```

Cap stagger at ~250ms total so the last item doesn't feel slow.

### Step 5 — Reduce motion

Test in DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce". Confirm:

- No translation, no scale, no shimmer
- State still readable (colors, focus rings still apply)

## Animations to add (when appropriate)

- **Toast slide-in** — already implemented.
- **Filter drawer slide-from-bottom** on mobile — 220ms, ease-out. Use `motion-safe:animate-[slideUp_220ms]`.
- **AI Chef loading "thinking" dots** — 3 bouncing dots, motion-safe. Don't make them spin forever — replace with skeleton ASAP.
- **Recipe card image zoom on hover** — already in place via `group-hover:scale-105`.
- **Saved bookmark "pop"** — micro-scale on click (`active:scale-95`).

## Animations to NEVER add

- Page-scroll parallax
- Cursor-follow halo
- Background noise / grain
- "Boot sequence" / terminal typing
- Continuous infinite loops on visible UI (except shimmer during load)
- Layout-shifting animations that aren't `transform`/`opacity`

## Files to inspect

- `src/app/globals.css` (motion durations, easing, keyframes)
- `src/components/ui/SelectablePill.tsx`, `Toast.tsx`, `SkeletonRecipeCard.tsx`
- `tailwind.config` — there is none; Tailwind v4 reads tokens from CSS

## Quality checklist

- [ ] All motion is gated by `motion-safe:` or `prefers-reduced-motion: no-preference`
- [ ] No animation > 500ms on visible UI
- [ ] No layout-shifting animation (transforms only, no `width`/`height` transitions)
- [ ] Reduced-motion test passes (no transforms, no shimmer)
- [ ] Animation has a *reason* (clarify a state change, ack a click, signal arrival)
- [ ] No Framer Motion added without written justification

## Common mistakes

- Using `animate-spin` on a button while it's also pressable — accessibility footgun
- Animating `height: 0 → auto` — breaks layout; use `max-height` or grid rows
- Adding hover lift to non-interactive cards
- Forgetting `motion-safe:` and shipping shimmer to reduce-motion users
