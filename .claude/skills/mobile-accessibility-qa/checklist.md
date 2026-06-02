# Mobile & A11y — per-route manual QA checklist

Tick line by line at 360px, 768px, 1280px. If a row fails, don't ship.

## Global (every route)

- [ ] No horizontal scrollbar at 360px
- [ ] Header doesn't wrap
- [ ] Hamburger appears below 1280px and disappears at 1280px+
- [ ] Hamburger drawer closes on backdrop click, Escape, and route change
- [ ] Active nav link has visible delta AND `aria-current="page"`
- [ ] Floating Pesto bottom-right, hides on input focus
- [ ] Every interactive element shows a focus ring on Tab
- [ ] Tab order matches visual order
- [ ] No raw model IDs / JSON / stack traces in the UI
- [ ] Reduced motion disables hover lifts and shimmer

## `/` (Home)

- [ ] Hero CTA buttons reachable by keyboard
- [ ] Cheapest picks grid: equal card heights
- [ ] Tool cards row: cards don't overlap or wrap awkwardly at 768px
- [ ] AI Chef demo card legible at 360px
- [ ] Final CTA section: tap targets ≥ 40×40

## `/ai-chef`

- [ ] Form fields each have a label
- [ ] Pantry selector chips are reachable by keyboard
- [ ] Generate button shows disabled state when no pantry / no input
- [ ] Loading state has labeled spinner ("Cooking up options…"), not a silent spinner
- [ ] Errors show plain English with a Retry, not "API Error 500"
- [ ] Option bubbles are tab-able; selected option has aria-pressed
- [ ] Generated recipe macros and cost are not `NaN`
- [ ] "Save to Recipe Studio" announces success via toast
- [ ] If `NEXT_PUBLIC_ANTHROPIC_API_KEY` is missing, page shows "AI Chef is offline" placeholder, not crash

## `/pantry`

- [ ] Adding an ingredient: chip pops in, focus stays in input
- [ ] Use-soon toggle is keyboard-reachable
- [ ] Voice input button has `aria-label`
- [ ] Photo input button has `aria-label`
- [ ] If AI is offline, fall back to text/paste input only — no errors

## `/cheap-recipes`

- [ ] Filter pills: `aria-pressed` set for multi-select
- [ ] Active filter chip bar shows which filters are on (if implemented)
- [ ] Recipe grid heights match
- [ ] "Load more" button (if present) keyboard-reachable
- [ ] Empty state shown when no recipes match — not a bare grid

## `/explore`

- [ ] If external API keys are missing, fallback recipes show with a banner
- [ ] No console errors when API fails (graceful fallback)
- [ ] Skeleton shows while loading
- [ ] Cuisine filter chips: same UX as Cheap Recipes filters

## `/grocery-list`

- [ ] List is scrollable on mobile; total stays visible at the bottom
- [ ] Checked-off items have a visible strike-through
- [ ] Clear list confirms before destroying data
- [ ] Cost totals don't show `NaN`

## `/saved`

- [ ] Tabs (All / Database / AI / Created) reachable by keyboard with arrow keys
- [ ] Empty state with helpful action ("Browse cheap recipes")

## `/recipe-studio`

- [ ] Hub lists AI + user-created with consistent card heights
- [ ] Delete button confirms before destroying

## `/recipe-studio/new`

- [ ] Form labels visible
- [ ] Dynamic ingredient rows: add/remove is keyboard-reachable
- [ ] Auto cost-per-serving updates as ingredients change
- [ ] Image generation toggle visible
- [ ] Save announces success via toast

## `/recipes/[id]`

- [ ] Hero image has alt text
- [ ] Ingredient table readable on mobile (stacks or scrolls cleanly)
- [ ] Price override (✎) reachable by keyboard
- [ ] "Cook now" mode: arrow-key navigation between steps
- [ ] Save / Add to grocery buttons announce success via toast

## `/about`

- [ ] Content readable; no walls of text without headings
- [ ] All inline links keyboard-reachable

## `/not-found`

- [ ] Back-to-home link present and keyboard-reachable
