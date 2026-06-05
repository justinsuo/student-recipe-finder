"use client";

import { useEffect, useState } from "react";
import { Timer, Play, Square, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  FASTING_PLANS,
  getActiveFast,
  getFastingLog,
  startFast,
  endFast,
  type ActiveFast,
  type FastEntry,
  type FastingPlan,
} from "@/lib/nourish/fasting";
import { newId } from "@/lib/nourish/storage";

function fmtDuration(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Intermittent-fasting tracker. Pick a window plan, start/end a fast, see
 * a progress ring, browse recent fasts. Optional — only renders something
 * useful when the user opts in by starting a fast.
 */
export function FastingTracker() {
  const toast = useToast();
  const [active, setActive] = useState<ActiveFast | null>(null);
  const [log, setLog] = useState<FastEntry[]>([]);
  const [now, setNow] = useState<number>(0);
  const [planId, setPlanId] = useState<string>("16-8");

  // Hydrate once
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(getActiveFast());
    setLog(getFastingLog());
    setNow(Date.now());
  }, []);

  // Tick every second only while a fast is active (and only motion-safe).
  useEffect(() => {
    if (!active) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const tickMs = reduce ? 30_000 : 1000;
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [active]);

  const plan: FastingPlan =
    FASTING_PLANS.find((p) => p.id === (active?.planId ?? planId)) ??
    FASTING_PLANS[2]; // default 16:8

  const elapsedMs = active ? Math.max(0, now - Date.parse(active.startedAt)) : 0;
  const targetMs = plan.fastingHours * 3_600_000;
  const pct = active ? Math.min(100, (elapsedMs / targetMs) * 100) : 0;
  const remainingMs = Math.max(0, targetMs - elapsedMs);

  // Ring geometry
  const R = 38;
  const C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;

  function handleStart() {
    const next = startFast(planId);
    setActive(next);
    setNow(Date.now());
    toast.info(`Fast started — ${plan.label} window. We'll track it from here.`);
  }

  function handleEnd() {
    const entry = endFast(Date.now(), newId);
    setActive(null);
    setLog(getFastingLog());
    if (entry) {
      const msg = `${entry.completed ? "Fast complete" : "Fast ended early"} — lasted ${fmtDuration(entry.durationMs)} of a ${plan.label} target.`;
      if (entry.completed) toast.reward(msg);
      else toast.info(msg);
    }
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2.5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm shadow-indigo-200">
          <Timer size={18} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-700">
            Fasting
          </p>
          <p className="text-sm font-semibold text-stone-900">
            {active ? "Active fast" : "Intermittent fasting"}
          </p>
        </div>
      </div>

      {active ? (
        <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative grid h-32 w-32 place-items-center">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full -rotate-90"
            >
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="rgb(229 229 226)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="url(#fastingGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${C - dash}`}
              />
              <defs>
                <linearGradient id="fastingGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgb(99 102 241)" />
                  <stop offset="100%" stopColor="rgb(16 185 129)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums text-stone-900">
                {fmtDuration(elapsedMs)}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                {Math.round(pct)}%
              </p>
            </div>
          </div>
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <p className="text-sm font-semibold text-stone-900">
              {plan.label} fast in progress
            </p>
            <p className="text-xs text-stone-600">
              {remainingMs > 0
                ? `${fmtDuration(remainingMs)} until ${plan.fastingHours}h target.`
                : "Goal hit — keep going or end the fast."}
            </p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Square size={14} />}
              onClick={handleEnd}
            >
              End fast
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {FASTING_PLANS.map((p) => {
              const a = p.id === planId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanId(p.id)}
                  aria-pressed={a}
                  className={
                    a
                      ? "rounded-full border border-indigo-600 bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 motion-safe:scale-[1.02]"
                      : "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-all hover:-translate-y-px hover:border-indigo-300 hover:bg-indigo-50"
                  }
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <Button leftIcon={<Play size={14} />} onClick={handleStart}>
            Start {plan.label} fast
          </Button>
          <p className="text-[11px] text-stone-500">
            Optional. Not medical advice — skip fasting if it doesn&apos;t suit you.
          </p>
        </div>
      )}

      {log.length > 0 && (
        <div className="mt-5 border-t border-stone-100 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Recent fasts
          </p>
          <ul className="mt-2 space-y-1.5">
            {log.slice(0, 5).map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2 text-xs"
              >
                <span className="flex items-center gap-2 text-stone-700">
                  {e.completed ? (
                    <Check size={12} className="text-emerald-600" />
                  ) : (
                    <Square size={10} className="text-stone-400" />
                  )}
                  {new Date(e.endedAt).toLocaleDateString()}
                </span>
                <span className="font-semibold tabular-nums text-stone-900">
                  {fmtDuration(e.durationMs)}{" "}
                  <span className="font-normal text-stone-500">
                    / {Math.round(e.targetMs / 3_600_000)}h
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
