"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Compact dashboard stat. Replaces prose number callouts ("we have
 * 235 recipes…") with a 3-line tile: icon, value, label. Pair with
 * `BentoGrid` for the catalog grid.
 */

type Tone = "basil" | "carrot" | "butter" | "grape" | "teal" | "sky" | "pink";

const TONE: Record<Tone, { surface: string; chip: string; value: string; label: string }> = {
  basil:  { surface: "border-[#B6E8CD] bg-[#F4FCF8]", chip: "bg-[#2FBF71] text-white", value: "text-[#0F5E33]", label: "text-[#16834A]" },
  carrot: { surface: "border-[#FFC79A] bg-[#FFF6EC]", chip: "bg-[#FF8A3D] text-white", value: "text-[#7C3309]", label: "text-[#9B3F0A]" },
  butter: { surface: "border-[#FFE08A] bg-[#FFFBEC]", chip: "bg-[#FFC93D] text-[#3A2A0F]", value: "text-[#5C3700]", label: "text-[#7A4A00]" },
  grape:  { surface: "border-[#CDBEFF] bg-[#F6F3FF]", chip: "bg-[#7C5CFF] text-white", value: "text-[#2A1B8A]", label: "text-[#3F2BB8]" },
  teal:   { surface: "border-[#A4ECD8] bg-[#EFFBF7]", chip: "bg-[#20C7A5] text-white", value: "text-[#08503D]", label: "text-[#0B6E55]" },
  sky:    { surface: "border-[#BAE6FD] bg-[#F0F8FF]", chip: "bg-[#3BA7FF] text-white", value: "text-[#0B4F7B]", label: "text-[#1F6FA8]" },
  pink:   { surface: "border-[#F9B6CD] bg-[#FFF1F5]", chip: "bg-[#FF6B9E] text-white", value: "text-[#73214A]", label: "text-[#A23163]" },
};

export function StatCard({
  icon,
  value,
  label,
  tone = "basil",
  className,
}: {
  /** Rendered icon (e.g. `<ChefHat size={16} />`). */
  icon: ReactNode;
  value: ReactNode;
  label: string;
  tone?: Tone;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <div
      className={clsx(
        "flex flex-col gap-2 rounded-2xl border p-4 shadow-sm",
        t.surface,
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "grid h-9 w-9 place-items-center rounded-xl",
          t.chip,
        )}
      >
        {icon}
      </span>
      <div className={clsx("text-2xl font-extrabold leading-none tracking-tight", t.value)}>
        {value}
      </div>
      <div className={clsx("text-[11px] font-semibold uppercase tracking-wide", t.label)}>
        {label}
      </div>
    </div>
  );
}
