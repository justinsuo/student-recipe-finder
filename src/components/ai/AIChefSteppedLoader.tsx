"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { clsx } from "clsx";

/**
 * Staged "AI is thinking" panel. Shows what's happening so a 4-5s wait
 * feels purposeful, not silent. Pure presentational — the page owns the
 * actual loading state and just renders this when `loading === true`.
 *
 * Messages auto-advance on a timer. The active row glows; finished rows
 * collapse to a soft check.
 */
const DEFAULT_STAGES = [
  "Reading your pantry",
  "Picking flavor combinations",
  "Costing the ingredients",
  "Calculating macros",
  "Drafting cooking steps",
  "Wrapping it up",
];

export function AIChefSteppedLoader({
  label = "Cooking up your options",
  stages = DEFAULT_STAGES,
  intervalMs = 900,
}: {
  label?: string;
  stages?: string[];
  intervalMs?: number;
}) {
  const [step, setStep] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setStep(stages.length - 1);
      return;
    }
    const t = setInterval(() => {
      setStep((s) => (s < stages.length - 1 ? s + 1 : s));
    }, intervalMs);
    return () => clearInterval(t);
  }, [stages.length, intervalMs]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#CDBEFF]/80 bg-gradient-to-br from-[#EFE8FF] via-white to-[#E8FAF0]/60 p-5 shadow-sm sm:p-7">
      <div
        aria-hidden
        className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_70%_30%,black,transparent_60%)]"
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          {/* Static grape sparkle tile — replaces the earlier WebGL
              food orb, which read as an unrelated green blob over the
              recipe imagery. */}
          <div
            aria-hidden
            className="relative grid h-12 w-12 flex-none place-items-center rounded-2xl border-b-[3px] border-[#3F2BB8] bg-gradient-to-b from-[#A18FFF] to-[#7C5CFF] text-white shadow-sm shadow-[#7C5CFF]/30 sm:h-14 sm:w-14"
          >
            <Sparkles
              size={20}
              strokeWidth={2.4}
              className="motion-safe:animate-[brandBob_2.6s_ease-in-out_infinite]"
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-2xl motion-safe:animate-[pulseGlow_2.6s_ease-in-out_infinite]"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#241A12]">{label}</p>
            <p className="text-[11px] text-[#6B5A4A]" aria-live="polite">
              Step {Math.min(step + 1, stages.length)} of {stages.length}
            </p>
          </div>
        </div>

        <ul
          className="mt-5 space-y-1.5"
          aria-label="Generation progress"
          aria-live="polite"
        >
          {stages.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li
                key={s}
                className={clsx(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm transition-colors",
                  active &&
                    "bg-white/70 ring-1 ring-inset ring-violet-200 backdrop-blur",
                  done && "text-stone-500",
                  !active && !done && "text-stone-400",
                )}
              >
                <span
                  aria-hidden
                  className={clsx(
                    "grid h-5 w-5 flex-none place-items-center rounded-full transition-colors",
                    done && "bg-emerald-100 text-emerald-700",
                    active &&
                      "bg-gradient-to-br from-violet-500 to-violet-700 text-white motion-safe:animate-[popIn_300ms_ease-out]",
                    !active && !done && "bg-stone-100 text-stone-400",
                  )}
                >
                  {done ? <Check size={11} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                </span>
                <span
                  className={clsx(
                    "flex-1",
                    active && "font-semibold text-violet-900",
                  )}
                >
                  {s}
                  {active && "…"}
                </span>
                {active && (
                  <span className="flex items-end gap-0.5" aria-hidden>
                    <Dot delay="0ms" />
                    <Dot delay="120ms" />
                    <Dot delay="240ms" />
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-5">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500"
              style={{
                width: `${Math.round(((step + 1) / stages.length) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-violet-500 motion-safe:animate-[emojiFloat_900ms_ease-in-out_infinite]"
      style={{ animationDelay: delay }}
    />
  );
}
