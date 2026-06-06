/**
 * Visual-effects performance helpers.
 *
 * Heavy effects (animated shaders, blur layers, future WebGL scenes)
 * should be gated by `shouldUseHeavyEffects()` so the runtime can opt
 * out under reduced-motion, low-power, or missing-WebGL conditions
 * without each consumer reinventing the same checks.
 */

export type EffectGateInput = {
  prefersReducedMotion?: boolean;
  isMobile?: boolean;
  webglSupported?: boolean;
  lowPowerMode?: boolean;
};

/**
 * Returns true only when the environment can comfortably render the
 * heavier visual layer. Each input is optional — pass what you can
 * derive cheaply at call time and let the rest fall back to "assumed
 * safe".
 *
 * Bias is conservative: missing inputs do NOT auto-disable. The hard
 * disables are reduced-motion and low-power.
 */
export function shouldUseHeavyEffects(input: EffectGateInput = {}): boolean {
  if (input.prefersReducedMotion) return false;
  if (input.lowPowerMode) return false;
  // Mobile alone is not a disable — the CSS effects we ship are GPU-
  // composited and stay cheap. Only flip off when a heavy effect
  // explicitly opts into the gate via `webglSupported`.
  if (input.webglSupported === false) return false;
  return true;
}

/**
 * SSR-safe reduced-motion detection. Returns false on the server so we
 * don't render different markup on first paint and trigger hydration
 * warnings — components that want to honor reduced-motion should pair
 * this with a post-mount effect.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Returns true when the browser exposes a usable WebGL context.
 * Memoized — a real context check costs ~1ms and would otherwise run
 * on every gate call.
 */
let cachedWebgl: boolean | null = null;
export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  if (cachedWebgl !== null) return cachedWebgl;
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    cachedWebgl = !!ctx;
  } catch {
    cachedWebgl = false;
  }
  return cachedWebgl;
}

/**
 * Quick mobile sniff. Used only as a hint — the CSS effects shipped
 * today don't change based on this; future Three.js scenes will.
 */
export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(max-width: 768px)").matches ?? false;
}
