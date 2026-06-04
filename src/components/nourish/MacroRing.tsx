"use client";

import { clsx } from "clsx";

interface Props {
  /** 0–1 fill fraction. Values > 1 are capped at 1 for the ring. */
  fraction: number;
  /** Grams consumed. */
  consumed: number;
  /** Gram target. */
  target: number;
  label: string;
  colorClass: string;
  trackClass: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * SVG radial progress ring for a single macro.
 * Respects prefers-reduced-motion by omitting the stroke-dashoffset animation.
 */
export function MacroRing({
  fraction,
  consumed,
  target,
  label,
  colorClass,
  trackClass,
  size = 88,
  strokeWidth = 8,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const capped = Math.min(fraction, 1);
  const offset = circumference * (1 - capped);
  const cx = size / 2;
  const cy = size / 2;

  const overTarget = fraction > 1;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden
          className="-rotate-90"
        >
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            className={trackClass}
          />
          {/* Progress */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={clsx(colorClass, "motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out")}
          />
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold tabular-nums leading-none text-stone-900">
            {Math.round(consumed)}
          </span>
          <span className="text-[9px] text-stone-400">/ {target}g</span>
        </div>
      </div>
      <p className={clsx("text-xs font-semibold", overTarget ? "text-rose-500" : "text-stone-600")}>
        {label}
        {overTarget && " ↑"}
      </p>
    </div>
  );
}
