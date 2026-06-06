"use client";

import { clsx } from "clsx";
import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";

type MacroTone = "protein" | "carbs" | "fat" | "fiber" | "water";

const TONE: Record<
  MacroTone,
  {
    eyebrow: string;
    barFrom: string;
    barTo: string;
    chip: string;
    text: string;
    bg: string;
  }
> = {
  protein: {
    eyebrow: "text-violet-700",
    barFrom: "from-violet-500",
    barTo: "to-violet-700",
    chip: "bg-violet-100 text-violet-800",
    text: "text-violet-900",
    bg: "from-violet-50/60 to-white border-violet-200/70",
  },
  carbs: {
    eyebrow: "text-sky-700",
    barFrom: "from-sky-500",
    barTo: "to-sky-700",
    chip: "bg-sky-100 text-sky-800",
    text: "text-sky-900",
    bg: "from-sky-50/60 to-white border-sky-200/70",
  },
  fat: {
    eyebrow: "text-amber-700",
    barFrom: "from-amber-400",
    barTo: "to-amber-600",
    chip: "bg-amber-100 text-amber-800",
    text: "text-amber-900",
    bg: "from-amber-50/60 to-white border-amber-200/70",
  },
  fiber: {
    eyebrow: "text-emerald-700",
    barFrom: "from-emerald-500",
    barTo: "to-emerald-700",
    chip: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-900",
    bg: "from-emerald-50/60 to-white border-emerald-200/70",
  },
  water: {
    eyebrow: "text-cyan-700",
    barFrom: "from-cyan-500",
    barTo: "to-cyan-700",
    chip: "bg-cyan-100 text-cyan-800",
    text: "text-cyan-900",
    bg: "from-cyan-50/60 to-white border-cyan-200/70",
  },
};

/**
 * One macro nutrient card. Big consumed number, animated progress bar,
 * remaining-or-over chip. Tone token picks the color set; the rest of
 * the card composes the Waivy gradient + ring + chip pattern.
 */
export function MacroCard({
  label,
  tone,
  consumed,
  target,
  unit = "g",
  icon,
}: {
  label: string;
  tone: MacroTone;
  consumed: number;
  target: number;
  unit?: string;
  icon?: ReactNode;
}) {
  const safeTarget = target > 0 ? target : 1;
  const pct = Math.min(100, Math.round((consumed / safeTarget) * 100));
  const over = consumed > safeTarget;
  const hitGoal = consumed >= safeTarget;
  const remaining = Math.max(0, safeTarget - consumed);
  const t = TONE[tone];

  return (
    <div
      className={clsx(
        "rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-all",
        t.bg,
        hitGoal && "ring-2 ring-inset",
        hitGoal && tone === "protein" && "ring-violet-300/70",
        hitGoal && tone === "carbs" && "ring-sky-300/70",
        hitGoal && tone === "fat" && "ring-amber-300/70",
        hitGoal && tone === "fiber" && "ring-emerald-300/70",
        hitGoal && tone === "water" && "ring-cyan-300/70",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={clsx(
            "inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
            t.eyebrow,
          )}
        >
          {icon}
          {label}
        </p>
        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            t.chip,
            hitGoal && "motion-safe:animate-[popIn_320ms_ease-out]",
          )}
        >
          {hitGoal && <CheckCircle2 size={11} aria-hidden />}
          {pct}%
        </span>
      </div>

      <p
        className={clsx(
          "mt-2 text-2xl font-bold tabular-nums leading-tight",
          t.text,
        )}
      >
        <AnimatedNumber value={Math.round(consumed)} duration={500} />{" "}
        <span className="text-sm font-normal text-stone-500">
          / {Math.round(safeTarget)} {unit}
        </span>
      </p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-inset ring-stone-200/60">
        <div
          className={clsx(
            "h-full rounded-full bg-gradient-to-r",
            t.barFrom,
            t.barTo,
            "motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out",
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
          role="progressbar"
          aria-valuenow={Math.round(consumed)}
          aria-valuemax={Math.round(safeTarget)}
          aria-label={`${Math.round(consumed)} of ${Math.round(safeTarget)} ${unit} ${label}`}
        />
      </div>

      <p className="mt-2 text-[11px] text-stone-600">
        {over ? (
          <>
            <span className={clsx("font-semibold", t.text)}>
              +{Math.round(consumed - safeTarget)} {unit}
            </span>{" "}
            over goal
          </>
        ) : hitGoal ? (
          <span
            className={clsx(
              "inline-flex items-center gap-1 font-semibold",
              t.text,
            )}
          >
            <CheckCircle2 size={12} aria-hidden />
            Goal hit
          </span>
        ) : (
          <>
            <span className="font-semibold text-stone-900">
              {Math.round(remaining)} {unit}
            </span>{" "}
            left
          </>
        )}
      </p>
    </div>
  );
}
