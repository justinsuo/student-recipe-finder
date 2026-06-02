"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";

/**
 * Fades + slides children up the first time they cross into the viewport.
 * No animation library — uses IntersectionObserver + a Tailwind class swap.
 * Respects prefers-reduced-motion via the global `motion-reduce:` strategy:
 * when reduce is on, the initial state class is dropped so children render
 * in-place without transform.
 */
export function ScrollReveal({
  children,
  delay = 0,
  className,
  as: As = "div",
  /** When true, the element will re-animate every time it enters. Default once. */
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "ol" | "ul";
  once?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) {
            setShown(false);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [once]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <As
      ref={ref as never}
      style={shown ? { transitionDelay: `${delay}ms` } : undefined}
      className={clsx(
        "motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]",
        shown
          ? "opacity-100 motion-safe:translate-y-0"
          : "opacity-0 motion-safe:translate-y-4",
        className,
      )}
    >
      {children}
    </As>
  );
}
