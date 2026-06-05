"use client";

import { clsx } from "clsx";
import { Flame } from "lucide-react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";

/**
 * Large calorie ring for the Nourish Today hero. SVG, gradient stroke,
 * animated fill. Below the ring: big consumed number, target, remaining.
 *
 * Color states are friendly: emerald under goal, amber near/over goal,
 * never red (no shame). Caller controls whether to show "remaining" or
 * "over" in the side stat.
 */
export function CalorieProgressRing({
  consumed,
  target,
  exerciseKcal = 0,
}: {
  consumed: number;
  target: number;
  /** Optional exercise calories — shown as a subtle outer arc. */
  exerciseKcal?: number;
}) {
  const safeTarget = target > 0 ? target : 1;
  const fraction = Math.min(consumed / safeTarget, 1.15);
  const over = consumed > safeTarget;
  const remaining = Math.max(0, safeTarget - consumed);

  const R = 78;
  const C = 2 * Math.PI * R;
  const dash = Math.min(fraction, 1) * C;
  const overDash = over ? Math.min((fraction - 1) / 0.15, 1) * C * 0.4 : 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative grid h-44 w-44 flex-none place-items-center sm:h-48 sm:w-48">
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 h-full w-full -rotate-90"
        >
          {/* Track */}
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="rgb(229 229 226)"
            strokeWidth="14"
          />
          {/* Consumed arc */}
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke={over ? "url(#calorieOver)" : "url(#calorieFill)"}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C - dash}`}
            className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-700 motion-safe:ease-out"
          />
          {/* Over arc (only if overshooting) */}
          {overDash > 0 && (
            <circle
              cx="100"
              cy="100"
              r={R - 18}
              fill="none"
              stroke="rgb(245 158 11)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${overDash} ${C - overDash}`}
              opacity="0.6"
            />
          )}
          <defs>
            <linearGradient id="calorieFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgb(16 185 129)" />
              <stop offset="100%" stopColor="rgb(5 150 105)" />
            </linearGradient>
            <linearGradient id="calorieOver" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgb(245 158 11)" />
              <stop offset="100%" stopColor="rgb(217 119 6)" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative text-center">
          <p
            className={clsx(
              "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
              over ? "text-amber-700" : "text-emerald-700",
            )}
          >
            <Flame size={10} /> Today
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums leading-none text-stone-900 sm:text-5xl">
            <AnimatedNumber value={Math.round(consumed)} duration={600} />
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
            of {Math.round(safeTarget).toLocaleString()} kcal
          </p>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 sm:max-w-xs sm:grid-cols-1 sm:gap-3">
        <div className="rounded-2xl bg-emerald-50/60 px-4 py-3 ring-1 ring-inset ring-emerald-100">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            {over ? "Over goal by" : "Remaining"}
          </p>
          <p
            className={clsx(
              "mt-0.5 text-2xl font-bold tabular-nums",
              over ? "text-amber-700" : "text-emerald-900",
            )}
          >
            <AnimatedNumber
              value={Math.round(over ? consumed - safeTarget : remaining)}
              duration={600}
              suffix=" kcal"
            />
          </p>
        </div>
        {exerciseKcal > 0 && (
          <div className="rounded-2xl bg-stone-50 px-4 py-3 ring-1 ring-inset ring-stone-200">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Exercise
            </p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-stone-900">
              <AnimatedNumber
                value={Math.round(exerciseKcal)}
                duration={600}
                suffix=" kcal"
              />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
