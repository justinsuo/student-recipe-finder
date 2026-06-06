"use client";

import { useCallback, type ReactNode } from "react";
import { clsx } from "clsx";
import { hapticLight } from "@/lib/haptics";

/**
 * Wraps any element with a satisfying press scale + optional haptic.
 * Use for tactile non-button surfaces — recipe cards, meal-section
 * cards, action tiles — that should feel like physical buttons even
 * though they're divs/anchors.
 *
 * Scale on press is intentional small (0.97) and motion-safe gated so
 * reduced-motion users don't feel a jolt.
 *
 * Variants:
 *   "default"   — scale only (subtle)
 *   "card"      — scale + ring on focus (for clickable cards)
 *   "subtle"    — minimal scale, used inside dense lists
 */
type Variant = "default" | "card" | "subtle";

const VARIANT_CLS: Record<Variant, string> = {
  default:
    "motion-safe:active:scale-[0.97] motion-safe:transition-transform motion-safe:duration-100",
  card:
    "motion-safe:active:scale-[0.98] motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
  subtle:
    "motion-safe:active:scale-[0.985] motion-safe:transition-transform motion-safe:duration-100",
};

export function Pressable({
  as: As = "div",
  variant = "default",
  haptic = true,
  className,
  onClick,
  children,
  ...rest
}: {
  as?: "div" | "button" | "a" | "span" | "li";
  variant?: Variant;
  haptic?: boolean;
  className?: string;
  onClick?: React.MouseEventHandler;
  children: ReactNode;
} & Omit<
  React.HTMLAttributes<HTMLElement>,
  "as" | "onClick" | "className" | "children"
>) {
  const handleClick = useCallback<React.MouseEventHandler>(
    (e) => {
      if (haptic) hapticLight();
      onClick?.(e);
    },
    [haptic, onClick],
  );

  return (
    <As
      onClick={handleClick}
      className={clsx(VARIANT_CLS[variant], className)}
      {...rest}
    >
      {children}
    </As>
  );
}
