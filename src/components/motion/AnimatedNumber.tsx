"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Displays a number that animates when its value changes.
 * Initializes to `value` so pre-rendered HTML always shows the real number
 * (no "0" flash). The count-up animation only triggers on subsequent changes.
 *
 * Note: we deliberately do NOT take a `format` callback — those can't be
 * serialized across the Server/Client Component boundary in Next 16. Use
 * `decimals` + `prefix` / `suffix` instead.
 */
export function AnimatedNumber({
  value,
  duration = 900,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  /** @deprecated no longer used; the animation now transitions between successive values */
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  // Initialize to `value` so SSR/pre-render HTML shows the real number, not 0.
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);
  const rafRef = useRef(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const prev = prevValue.current;
    prevValue.current = value;
    // On initial mount prev === value, so skip animation (display is correct).
    if (prev === value) return;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setDisplay(value);
      return;
    }
    cancelAnimationFrame(rafRef.current);
    const startValue = prev;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(startValue + (value - startValue) * ease(t));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString();

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
