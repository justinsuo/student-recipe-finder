"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Frosted "liquid glass" panel.
 *
 * Implementation is the well-known backdrop-filter + tonal tint +
 * inner-highlight stack. Renders a real backdrop blur where the browser
 * supports it; the `@supports not` fallback drops back to a soft
 * Pantry-Pop cream surface so text stays readable even on Firefox
 * release lines that don't expose backdrop-filter.
 *
 * Use sparingly per spec: floating action bars, AI Chef option selector,
 * the home hero CTA card. NOT for every recipe card.
 */
export function LiquidGlassPanel({
  children,
  className,
  tone = "cream",
  rounded = "2xl",
}: {
  children: ReactNode;
  className?: string;
  /** Color cast layered behind the blur. cream = Pantry Pop default. */
  tone?: "cream" | "basil" | "grape" | "carrot";
  rounded?: "xl" | "2xl" | "3xl" | "full";
}) {
  const TINT: Record<typeof tone, string> = {
    cream: "bg-white/55 supports-[not_(backdrop-filter:_blur(0px))]:bg-[#FFF8ED]",
    basil: "bg-[#E8FAF0]/65 supports-[not_(backdrop-filter:_blur(0px))]:bg-[#E8FAF0]",
    grape: "bg-[#EFE8FF]/65 supports-[not_(backdrop-filter:_blur(0px))]:bg-[#EFE8FF]",
    carrot: "bg-[#FFE8D6]/65 supports-[not_(backdrop-filter:_blur(0px))]:bg-[#FFE8D6]",
  };
  const RADIUS: Record<typeof rounded, string> = {
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  };
  return (
    <div
      className={clsx(
        "relative",
        RADIUS[rounded],
        TINT[tone],
        // Real frosted blur, gated by support so we don't burn GPU when
        // the browser will silently no-op it.
        "supports-[backdrop-filter:blur(0px)]:backdrop-blur-xl",
        // Hairline ring + inner highlight that fakes the "glass thickness"
        // look without a second wrapper.
        "border border-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_30px_-12px_rgba(36,26,18,0.18)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
