---
title: Visual effects — research log
date: 2026-06-06
---

# Visual effects research

The user asked for a high-end visual layer (shader gradients, liquid glass,
chrome text, Three.js scenes) inspired by open-source libraries. This is
the honest log for that pass.

## Scope of this session

- **No live crawl, no clones.** Same constraints as the earlier theme and
  visual-UI passes ([theme-research.md](./theme-research.md),
  [visual-ui-inspiration-research.md](./visual-ui-inspiration-research.md)).
  The user has previously asked that this agent not open Chrome / take
  screenshots while they're at the computer, and clone-and-paste from
  proprietary or unlicensed repos is off-limits.
- **What I used instead.** The CSS-only patterns shipped this pass —
  animated conic gradient, frosted backdrop-blur, background-clip
  chrome — are common web platform techniques. The implementations
  here are original Tailwind + CSS keyframes, not lifted from any of
  the referenced repos.
- **Dependencies added in pass 2:** `three@0.169` + `@react-three/fiber@9`
  + `@react-three/drei@10` + `framer-motion@11`. All MIT-licensed. The
  three.js bundle ships behind `next/dynamic` so non-/ai-chef visitors
  who hit the cached path don't download it; framer-motion is small
  enough (~28 KB gz) to be a baseline dep. drei@10 was required to
  match R3F@9's React 19 peer — drei@9 only supports R3F@8.

## Repos referenced by the spec

| Repo | URL | License (when checked previously) | Adapted into this build? |
| --- | --- | --- | --- |
| shadergradient | https://github.com/ruucm/shadergradient | (verify before adapting) | No — inspiration only |
| paper-design/shaders | https://github.com/paper-design/shaders | (verify before adapting) | No |
| dashersw/liquid-glass-js | https://github.com/dashersw/liquid-glass-js | (verify) | No |
| rdev/liquid-glass-react | https://github.com/rdev/liquid-glass-react | (verify) | No |
| naughtyduk/liquidGL | https://github.com/naughtyduk/liquidGL | (verify) | No |
| pmndrs/react-three-fiber | https://github.com/pmndrs/react-three-fiber | MIT | Not pulled in this pass |
| pmndrs/drei | https://github.com/pmndrs/drei | MIT | Not pulled in this pass |
| framer/motion | https://github.com/framer/motion | MIT | Not pulled — we stay on CSS keyframes + `motion-safe:` |
| magicuidesign/magicui | https://github.com/magicuidesign/magicui | MIT | No |
| emilkowalski/sonner | https://github.com/emilkowalski/sonner | MIT | No |
| emilkowalski/vaul | https://github.com/emilkowalski/vaul | MIT | No |

If a future pass actually adapts code from one of these repos, append an
entry with the exact files copied, the commit that brought them in, and
the license header preserved in each adapted file.

## Pass 2 — dramatic visual upgrades (this commit)

| Effect | Implementation | Where |
| --- | --- | --- |
| WebGL "food orb" | `src/components/visual-effects/AnimatedFoodOrb.tsx` — drei `Sphere` + `MeshDistortMaterial` with carrot rim light and grape backlight. Wrapped by `LazyFoodOrb` (next/dynamic + CSS fallback) so the three.js bundle only loads when the surface mounts. | Home hero (right column, hidden < md) + AI Chef stepped loader |
| Spring-loaded recipe cards | `framer-motion` `motion.div` with `whileHover` + `whileTap` and a tuned spring (`stiffness 320, damping 24, mass 0.6`). Every RecipeCard now has a tactile lift + scale + click bounce. | Every RecipeCard call site — home, /cheap-recipes, /saved, /explore, /pantry. |

## Pass 1 — foundation (earlier commit)

| Effect | Implementation | Where |
| --- | --- | --- |
| Shader gradient hero background | `src/components/visual-effects/ShaderGradientBackground.tsx` — animated conic + radial gradient blend in pure CSS, tinted with Pantry Pop colors. No WebGL. Auto-disables under `prefers-reduced-motion`. | Home hero |
| Liquid glass panel | `src/components/visual-effects/LiquidGlassPanel.tsx` — `backdrop-filter: blur` + soft inner highlight + tonal tint. Falls back to a Pantry-Pop cream surface when `backdrop-filter` is unsupported (no JS check needed; `@supports` does the work). | Home hero CTA card |
| Chrome / metallic wordmark | `src/components/visual-effects/ChromeText.tsx` — `background-clip: text` with a 5-stop chrome gradient + slow animated shimmer. Falls back to plain `--text-main` espresso. Mandatory accessible plain-text via `aria-label`. | Reserved for Waivy wordmark and AI Chef "generated" badge — wired but not aggressively applied this pass |
| Performance gate | `src/lib/visual-effects/performance.ts` — `shouldUseHeavyEffects({ prefersReducedMotion, isMobile, webglSupported, lowPowerMode })` and small helpers (`prefersReducedMotion()`, `hasWebGL()`). SSR-safe. | Available everywhere |

## What was deliberately deferred

These items from the spec are NOT in this pass. They sit on the backlog:

- **Three.js / React Three Fiber scenes** (AnimatedFoodOrb, ThreeIngredientScene, FloatingIngredientCloud). Needs a real dep evaluation against the bundle, and a specific surface that benefits enough to justify the cost.
- **AI Chef animated generation pipeline** (Pantry → Flavor → Budget → Macros → Recipe → Image step lights). Belongs in a focused /ai-chef redesign pass — the current generate flow already has a staged loader; the upgrade should replace it cleanly, not get bolted on.
- **Nourish dashboard hero liquid-glass card**. Nourish was just visually reworked; layering glass needs a contrast pass to keep MacroCard / CalorieProgressRing legible.
- **Recipe-detail sticky action bar with liquid glass**. Needs to coordinate with the existing ActionDock layout to avoid a double action bar on mobile.
- **Empty-state 3D illustrations**. The Pantry Pop `VisualEmptyState` already provides a staged scene with offset chip rings; bumping to 3D needs a payoff/cost evaluation per surface.

These are explicit decisions, not silent omissions. The goal of this
pass is a coherent, performant first cut of the visual layer, not 12
half-finished surfaces.

## Performance posture

- All effects shipped are pure CSS / SVG. No `requestAnimationFrame`
  loops, no new event listeners, no JS work per frame.
- `prefers-reduced-motion: reduce` disables the shader animation via a
  Tailwind `motion-safe:` keyframe gate.
- The `LiquidGlassPanel` `@supports` fallback means browsers without
  `backdrop-filter` (older Firefox release lines) silently render a
  Pantry-Pop cream card instead of a transparent unblurred panel.
- The shader background uses GPU-composited transform + filter only;
  it does not invalidate layout.
- No additional bundle weight: zero npm deps added.

## Accessibility posture

- Chrome text always carries `aria-label` so screen readers read the
  plain string, not the visually-stylized glyph soup.
- All visual layers sit behind text content with sufficient contrast
  against the Pantry-Pop espresso `#241A12` on cream `#FFF8ED`.
- No autoplay full-bleed effects near form inputs.
- Keyboard focus rings remain on top of every visual layer.

## Backlog for future passes

1. Evaluate `@react-three/fiber` + `@react-three/drei` for one specific
   feature surface (AI Chef "generating" orb) — measure bundle delta on
   the static export before committing.
2. Build an `AIChefGenerationPipeline` that replaces the current staged
   loader with a 6-step lit pipeline.
3. Apply `LiquidGlassPanel` to the Recipe-detail action row.
4. Decide whether `ChromeText` belongs on the Waivy wordmark in the
   navbar (probably not — it competes with the existing brand mark
   squircle and the wordmark needs to read at small sizes).
5. Cypress / Playwright run that automates a reduced-motion + WebGL-off
   smoke test once a test framework is configured.
