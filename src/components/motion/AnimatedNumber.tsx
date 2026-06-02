"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts a number from 0 (or `from`) to `value` over `duration` ms when the
 * component first mounts. Uses requestAnimationFrame. Respects
 * prefers-reduced-motion by rendering the final value immediately.
 *
 * Note: we deliberately do NOT take a `format` callback — those can't be
 * serialized across the Server/Client Component boundary in Next 16. Use
 * `decimals` + `prefix` / `suffix` instead.
 */
export function AnimatedNumber({
  value,
  from = 0,
  duration = 900,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(from);
  const started = useRef(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (typeof window === "undefined") {
      setDisplay(value);
      return;
    }
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(from + (value - from) * ease(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, from, duration]);
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
