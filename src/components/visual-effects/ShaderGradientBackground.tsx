"use client";

import { clsx } from "clsx";

/**
 * Animated "shader" gradient hero background.
 *
 * Pure CSS — a conic gradient on the bottom layer + a radial gradient on
 * top, both slowly rotating / translating via Tailwind motion-safe
 * keyframes. No WebGL, no extra deps. Falls back automatically to a
 * static gradient under prefers-reduced-motion.
 *
 * Color stops use Pantry Pop palette so the effect reads like "warm
 * food energy", not "nightclub neon".
 */
export function ShaderGradientBackground({
  className,
  intensity = "soft",
}: {
  className?: string;
  /** "soft" → tinted, low opacity. "rich" → fuller saturation for AI Chef-style accents. */
  intensity?: "soft" | "rich";
}) {
  const opacity = intensity === "rich" ? "opacity-70" : "opacity-45";
  return (
    <div
      aria-hidden
      className={clsx(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {/* Bottom layer — conic gradient through every Pantry Pop accent.
          Slow rotation, motion-safe only. */}
      <div
        className={clsx(
          "absolute -inset-[20%] rounded-[40%] blur-3xl motion-safe:animate-[shaderSpin_24s_linear_infinite]",
          opacity,
        )}
        style={{
          background:
            "conic-gradient(from 90deg at 50% 50%, #2FBF71 0%, #20C7A5 18%, #3BA7FF 32%, #7C5CFF 48%, #FF6B9E 62%, #FF8A3D 78%, #FFD166 90%, #2FBF71 100%)",
        }}
      />
      {/* Top layer — a wide warm radial that drifts. Adds the "soft
          food glow" feel and breaks the geometric conic at the surface. */}
      <div
        className={clsx(
          "absolute -inset-[20%] rounded-[50%] blur-3xl motion-safe:animate-[shaderDrift_18s_ease-in-out_infinite_alternate]",
          intensity === "rich" ? "opacity-50" : "opacity-35",
        )}
        style={{
          background:
            "radial-gradient(closest-side at 40% 40%, #FFD166 0%, #FF8A3D 35%, transparent 75%)",
        }}
      />
    </div>
  );
}
