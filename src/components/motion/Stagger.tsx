"use client";

import { Children, isValidElement, cloneElement, type ReactNode } from "react";
import { clsx } from "clsx";

/**
 * Wraps a list and gives each direct child a staggered fadeUp animation on
 * mount via `motion-safe:animate-[fadeUp_…]` + inline `animationDelay`.
 * Pure CSS — no library, no JS scroll observer. Use for above-the-fold lists
 * (hero CTAs, hero collage tiles). For below-the-fold lists prefer
 * `<ScrollReveal>` on each item so they animate when they arrive.
 */
export function Stagger({
  children,
  startDelay = 80,
  step = 70,
  durationMs = 520,
  className,
  itemClassName,
}: {
  children: ReactNode;
  startDelay?: number;
  step?: number;
  durationMs?: number;
  className?: string;
  itemClassName?: string;
}) {
  const wrapped = Children.toArray(children).map((child, i) => {
    if (!isValidElement(child)) return child;
    const delay = startDelay + i * step;
    const child2 = child as React.ReactElement<{
      className?: string;
      style?: React.CSSProperties;
    }>;
    return cloneElement(child2, {
      className: clsx(
        child2.props.className,
        itemClassName,
        "motion-safe:opacity-0 motion-safe:animate-[fadeUp_var(--d)_var(--ease-out)_both]",
      ),
      style: {
        ...(child2.props.style || {}),
        ["--d" as string]: `${durationMs}ms`,
        animationDelay: `${delay}ms`,
      },
    });
  });
  return <div className={className}>{wrapped}</div>;
}
