"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Minimal SVG progress ring. No chart library. Two strokes — a soft
 * track and a colored progress arc — with a label slot in the center.
 *
 * `value` is 0..1. Numbers outside that clamp safely.
 */
export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 10,
  trackColor = "#E8D8C4",
  color = "#2FBF71",
  className,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  color?: string;
  className?: string;
  children?: ReactNode;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * clamped;

  return (
    <div
      className={clsx("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}
